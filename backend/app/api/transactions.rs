use axum::{
    body::Bytes,
    extract::State,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use chrono::{Duration, Utc};
use rusqlite::params;
use serde_json::json;
use std::env;
use std::str::FromStr;
use uuid::Uuid;

use crate::core::masking::mask_vpa;
use crate::core::risk_bridge::map_decision_to_state;
use crate::core::schemas::{TransactionRequest, TransactionResponse, TxnState};
use crate::core::security::verify_signature;
use crate::core::state_machine::transition;
use crate::state::AppState;

pub fn get_cooling_seconds() -> i64 {
    env::var("COOLING_SECONDS")
        .ok()
        .and_then(|v| v.parse::<i64>().ok())
        .unwrap_or(20)
}

pub async fn create_transaction(
    State(state): State<AppState>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    // 1. HMAC raw-body signature verification
    let sig_opt = headers.get("X-Signature").and_then(|v| v.to_str().ok());
    if let Err(e) = verify_signature(sig_opt, &body) {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": e.to_string() })),
        ));
    }

    // 2. Deserialize request
    let req: TransactionRequest = match serde_json::from_slice(&body) {
        Ok(r) => r,
        Err(e) => {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(json!({ "error": format!("Invalid JSON: {}", e) })),
            ));
        }
    };

    // 3. Persistent SQLite Idempotency check
    if let Ok(Some(cached_response)) = state.idempotency_manager.get_response(req.idempotency_key) {
        return Ok((StatusCode::OK, Json(cached_response)));
    }

    let now = Utc::now();

    // 4. State: INITIATED -> SCORING
    let (s_scoring, audit_scoring) = transition(
        req.txn_id,
        TxnState::Initiated,
        TxnState::Scoring,
        "api_gateway",
        "Transaction initiated, moving to scoring",
    )
    .map_err(|e| (StatusCode::CONFLICT, Json(json!({ "error": e.to_string() }))))?;

    state.audit_store.append(audit_scoring);

    // 5. Risk Assessment (HTTP call with 150ms timeout + local fallback rules)
    let assessment = state.risk_bridge.assess_risk(&req).await;
    let target_state = map_decision_to_state(assessment.decision);

    // 6. Transition SCORING -> target_state
    let note = assessment.reasons.join("; ");
    let (s_decided, audit_decided) = transition(
        req.txn_id,
        s_scoring,
        target_state,
        "risk_engine",
        &note,
    )
    .map_err(|e| (StatusCode::CONFLICT, Json(json!({ "error": e.to_string() }))))?;

    state.audit_store.append(audit_decided);

    // 7. Handle special states:
    // - STEP_UP_PENDING: generate salted OTP
    // - COOLING_LOCK: calculate cooling_until
    // - APPROVED: transition to SETTLED and execute atomic double-entry ledger debit/credit
    let mut final_state = s_decided;
    let mut cooling_until_dt = None;

    if s_decided == TxnState::StepUpPending {
        let _otp = state.otp_manager.generate_otp(req.txn_id);
    } else if s_decided == TxnState::CoolingLock {
        let cool_secs = get_cooling_seconds();
        cooling_until_dt = Some(now + Duration::seconds(cool_secs));
    } else if s_decided == TxnState::Approved {
        // APPROVED -> SETTLED
        let (s_settled, audit_settled) = transition(
            req.txn_id,
            TxnState::Approved,
            TxnState::Settled,
            "ledger_engine",
            "Atomic double-entry ledger settlement confirmed",
        )
        .map_err(|e| (StatusCode::CONFLICT, Json(json!({ "error": e.to_string() }))))?;

        state.audit_store.append(audit_settled);

        // Atomic SQLite settlement
        if let Err(e) = state.ledger_manager.settle(
            req.txn_id,
            &req.sender_vpa,
            &req.receiver_vpa,
            req.amount,
        ) {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": format!("Ledger failure: {}", e) })),
            ));
        }

        final_state = s_settled;
    }

    // 8. Persist to SQLite transactions table
    let reasons_json = serde_json::to_string(&assessment.reasons).unwrap_or_default();
    let cooling_str = cooling_until_dt.map(|dt| dt.to_rfc3339());
    let now_str = now.to_rfc3339();

    {
        let conn = state.db.lock_conn();
        let _ = conn.execute(
            "INSERT INTO transactions (
                txn_id, idempotency_key, sender_vpa, receiver_vpa, amount,
                device_id, geo_city, status, risk_score, risk_reasons,
                cooling_until, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                req.txn_id.to_string(),
                req.idempotency_key.to_string(),
                req.sender_vpa,
                req.receiver_vpa,
                req.amount,
                req.device_id,
                req.geo_city,
                final_state.to_string(),
                assessment.score,
                reasons_json,
                cooling_str,
                now_str,
                now_str
            ],
        );
    }

    // 9. Build response with MASKED VPAs
    let response = TransactionResponse {
        txn_id: req.txn_id,
        idempotency_key: req.idempotency_key,
        sender_vpa: mask_vpa(&req.sender_vpa),
        receiver_vpa: mask_vpa(&req.receiver_vpa),
        amount: req.amount,
        status: final_state,
        risk_score: Some(assessment.score),
        risk_reasons: assessment.reasons,
        cooling_until: cooling_until_dt,
        created_at: now,
        updated_at: now,
    };

    // 10. Record in idempotency store
    let _ = state.idempotency_manager.record_response(
        req.idempotency_key,
        req.txn_id,
        &response,
    );

    // 11. Broadcast SSE event
    state.event_hub.broadcast_txn_update(&response);

    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn list_transactions(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let conn = state.db.lock_conn();
    let mut stmt = match conn.prepare(
        "SELECT txn_id, idempotency_key, sender_vpa, receiver_vpa, amount,
                status, risk_score, risk_reasons, cooling_until, created_at, updated_at
         FROM transactions ORDER BY created_at DESC LIMIT 50",
    ) {
        Ok(s) => s,
        Err(_) => return Json(vec![]),
    };

    let rows = stmt.query_map([], |row| {
        let txn_id_str: String = row.get(0)?;
        let idem_str: String = row.get(1)?;
        let sender: String = row.get(2)?;
        let receiver: String = row.get(3)?;
        let amount: f64 = row.get(4)?;
        let status_str: String = row.get(5)?;
        let risk_score: Option<f64> = row.get(6)?;
        let reasons_raw: Option<String> = row.get(7)?;
        let cooling_raw: Option<String> = row.get(8)?;
        let created_raw: String = row.get(9)?;
        let updated_raw: String = row.get(10)?;

        let reasons: Vec<String> = reasons_raw
            .and_then(|r| serde_json::from_str(&r).ok())
            .unwrap_or_default();

        let cooling_until = cooling_raw
            .and_then(|c| chrono::DateTime::parse_from_rfc3339(&c).ok())
            .map(|dt| dt.with_timezone(&Utc));

        let created_at = chrono::DateTime::parse_from_rfc3339(&created_raw)
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or_else(|_| Utc::now());

        let updated_at = chrono::DateTime::parse_from_rfc3339(&updated_raw)
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or_else(|_| Utc::now());

        let status = TxnState::from_str(&status_str).unwrap_or(TxnState::Initiated);

        Ok(TransactionResponse {
            txn_id: Uuid::parse_str(&txn_id_str).unwrap_or_default(),
            idempotency_key: Uuid::parse_str(&idem_str).unwrap_or_default(),
            sender_vpa: mask_vpa(&sender),
            receiver_vpa: mask_vpa(&receiver),
            amount,
            status,
            risk_score,
            risk_reasons: reasons,
            cooling_until,
            created_at,
            updated_at,
        })
    });

    let list: Vec<TransactionResponse> = match rows {
        Ok(iter) => iter.filter_map(|r| r.ok()).collect(),
        Err(_) => vec![],
    };

    Json(list)
}
