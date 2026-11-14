use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::Utc;
use rusqlite::params;
use serde_json::json;
use std::str::FromStr;
use uuid::Uuid;

use crate::core::masking::mask_vpa;
use crate::core::schemas::{GuardianApprovalRequest, TransactionResponse, TxnState};
use crate::core::state_machine::transition;
use crate::state::AppState;

pub async fn handle_guardian_approval(
    Path(txn_id): Path<Uuid>,
    State(state): State<AppState>,
    Json(payload): Json<GuardianApprovalRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let conn = state.db.lock_conn();

    let record: Option<(String, String, String, f64, String, Option<f64>, Option<String>, String)> = conn
        .query_row(
            "SELECT idempotency_key, sender_vpa, receiver_vpa, amount, status, risk_score, risk_reasons, created_at
             FROM transactions WHERE txn_id = ?1",
            params![txn_id.to_string()],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                    row.get(5)?,
                    row.get(6)?,
                    row.get(7)?,
                ))
            },
        )
        .ok();

    drop(conn);

    let (idem_str, sender_vpa, receiver_vpa, amount, status_str, risk_score, reasons_raw, created_raw) = match record {
        Some(r) => r,
        None => {
            return Err((
                StatusCode::NOT_FOUND,
                Json(json!({ "error": "Transaction not found" })),
            ));
        }
    };

    let current_state = TxnState::from_str(&status_str).unwrap_or(TxnState::Initiated);
    if current_state != TxnState::GuardianPending {
        return Err((
            StatusCode::CONFLICT,
            Json(json!({
                "error": format!("Cannot handle guardian approval: transaction in state {}", current_state)
            })),
        ));
    }

    let reasons: Vec<String> = reasons_raw
        .and_then(|r| serde_json::from_str(&r).ok())
        .unwrap_or_default();

    let created_at = chrono::DateTime::parse_from_rfc3339(&created_raw)
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(|_| Utc::now());

    let now = Utc::now();

    if payload.approved {
        // GUARDIAN_PENDING -> APPROVED
        let (s_app, a_app) = transition(
            txn_id,
            TxnState::GuardianPending,
            TxnState::Approved,
            "guardian",
            payload.reason.as_deref().unwrap_or("Guardian approved transaction"),
        )
        .map_err(|e| (StatusCode::CONFLICT, Json(json!({ "error": e.to_string() }))))?;
        state.audit_store.append(a_app);

        // APPROVED -> SETTLED
        let (s_set, a_set) = transition(
            txn_id,
            s_app,
            TxnState::Settled,
            "ledger_engine",
            "Settled upon guardian confirmation",
        )
        .map_err(|e| (StatusCode::CONFLICT, Json(json!({ "error": e.to_string() }))))?;
        state.audit_store.append(a_set);

        // Atomic double-entry ledger debit & credit
        if let Err(e) = state.ledger_manager.settle(
            txn_id,
            &sender_vpa,
            &receiver_vpa,
            amount,
        ) {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": format!("Ledger failure: {}", e) })),
            ));
        }

        {
            let conn = state.db.lock_conn();
            let _ = conn.execute(
                "UPDATE transactions SET status = ?1, updated_at = ?2 WHERE txn_id = ?3",
                params![s_set.to_string(), now.to_rfc3339(), txn_id.to_string()],
            );
        }

        let resp = TransactionResponse {
            txn_id,
            idempotency_key: Uuid::parse_str(&idem_str).unwrap_or_default(),
            sender_vpa: mask_vpa(&sender_vpa),
            receiver_vpa: mask_vpa(&receiver_vpa),
            amount,
            status: s_set,
            risk_score,
            risk_reasons: reasons,
            cooling_until: None,
            created_at,
            updated_at: now,
        };

        state.event_hub.broadcast_txn_update(&resp);
        Ok((StatusCode::OK, Json(resp)))
    } else {
        // GUARDIAN_PENDING -> REJECTED
        let note = payload.reason.unwrap_or_else(|| "Guardian rejected transaction".to_string());
        let (s_rej, a_rej) = transition(
            txn_id,
            TxnState::GuardianPending,
            TxnState::Rejected,
            "guardian",
            &note,
        )
        .map_err(|e| (StatusCode::CONFLICT, Json(json!({ "error": e.to_string() }))))?;
        state.audit_store.append(a_rej);

        {
            let conn = state.db.lock_conn();
            let _ = conn.execute(
                "UPDATE transactions SET status = ?1, updated_at = ?2 WHERE txn_id = ?3",
                params![s_rej.to_string(), now.to_rfc3339(), txn_id.to_string()],
            );
        }

        let resp = TransactionResponse {
            txn_id,
            idempotency_key: Uuid::parse_str(&idem_str).unwrap_or_default(),
            sender_vpa: mask_vpa(&sender_vpa),
            receiver_vpa: mask_vpa(&receiver_vpa),
            amount,
            status: s_rej,
            risk_score,
            risk_reasons: reasons,
            cooling_until: None,
            created_at,
            updated_at: now,
        };

        state.event_hub.broadcast_txn_update(&resp);
        Ok((StatusCode::OK, Json(resp)))
    }
}
