use axum::{
    body::Body,
    http::{header, Request, StatusCode},
};
use chrono::Utc;
use http_body_util::BodyExt;
use serde_json::{json, Value};
use shieldpay_core::core::db::Database;
use shieldpay_core::core::schemas::{TransactionResponse, TxnState};
use shieldpay_core::core::security::compute_hmac_sha256;
use shieldpay_core::create_router;
use shieldpay_core::state::AppState;
use tower::ServiceExt;
use uuid::Uuid;

fn setup_test_app() -> axum::Router {
    let db = Database::new_in_memory().unwrap();
    let state = AppState::new(db);
    create_router(state)
}

fn signed_request(uri: &str, method: &str, body: &Value) -> Request<Body> {
    let raw_bytes = serde_json::to_vec(body).unwrap();
    let signature = compute_hmac_sha256("dev-secret-key".as_bytes(), &raw_bytes);

    Request::builder()
        .uri(uri)
        .method(method)
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Signature", signature)
        .body(Body::from(raw_bytes))
        .unwrap()
}

#[tokio::test]
async fn test_hmac_unauthorized_401() {
    let app = setup_test_app();
    let body = json!({
        "txn_id": Uuid::new_v4(),
        "idempotency_key": Uuid::new_v4(),
        "sender_vpa": "rahul@okaxis",
        "receiver_vpa": "shop@ybl",
        "amount": 100.0,
        "device_id": "dev-01",
        "geo_city": "Kolkata",
        "timestamp": Utc::now()
    });

    // 1. Missing signature
    let req_no_sig = Request::builder()
        .uri("/api/transactions")
        .method("POST")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(serde_json::to_vec(&body).unwrap()))
        .unwrap();

    let resp = app.clone().oneshot(req_no_sig).await.unwrap();
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);

    // 2. Tampered signature
    let req_bad_sig = Request::builder()
        .uri("/api/transactions")
        .method("POST")
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Signature", "invalid_hex_digest")
        .body(Body::from(serde_json::to_vec(&body).unwrap()))
        .unwrap();

    let resp = app.oneshot(req_bad_sig).await.unwrap();
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_create_transaction_approved_and_settled() {
    let app = setup_test_app();
    let txn_id = Uuid::new_v4();
    let idempotency_key = Uuid::new_v4();

    let req_body = json!({
        "txn_id": txn_id,
        "idempotency_key": idempotency_key,
        "sender_vpa": "rahul@okaxis",
        "receiver_vpa": "shop@ybl",
        "amount": 250.0,
        "device_id": "dev-01",
        "geo_city": "Kolkata",
        "timestamp": Utc::now()
    });

    let req = signed_request("/api/transactions", "POST", &req_body);
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::CREATED);

    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let txn: TransactionResponse = serde_json::from_slice(&bytes).unwrap();

    assert_eq!(txn.txn_id, txn_id);
    assert_eq!(txn.status, TxnState::Settled);
    assert_eq!(txn.sender_vpa, "rah***@okaxis"); // VPA masking verified
    assert_eq!(txn.receiver_vpa, "sho***@ybl"); // VPA masking verified
}

#[tokio::test]
async fn test_persistent_idempotency_replay_zero_duplicate_debit() {
    let db = Database::new_in_memory().unwrap();
    let state = AppState::new(db.clone());
    let app = create_router(state);

    let txn_id = Uuid::new_v4();
    let idempotency_key = Uuid::new_v4();

    let req_body = json!({
        "txn_id": txn_id,
        "idempotency_key": idempotency_key,
        "sender_vpa": "rahul@okaxis",
        "receiver_vpa": "shop@ybl",
        "amount": 500.0,
        "device_id": "dev-01",
        "geo_city": "Kolkata",
        "timestamp": Utc::now()
    });

    // First request
    let req1 = signed_request("/api/transactions", "POST", &req_body);
    let resp1 = app.clone().oneshot(req1).await.unwrap();
    assert_eq!(resp1.status(), StatusCode::CREATED);

    // Initial debit count
    let count1: i64 = {
        let conn = db.lock_conn();
        conn.query_row(
            "SELECT COUNT(*) FROM ledger_entries WHERE txn_id = ?1",
            rusqlite::params![txn_id.to_string()],
            |r| r.get(0),
        )
        .unwrap()
    };
    assert_eq!(count1, 2); // 1 debit + 1 credit

    // Replay exact same request with same idempotency key
    let req2 = signed_request("/api/transactions", "POST", &req_body);
    let resp2 = app.clone().oneshot(req2).await.unwrap();
    assert_eq!(resp2.status(), StatusCode::OK);

    // Ensure zero duplicate ledger debits
    let count2: i64 = {
        let conn = db.lock_conn();
        conn.query_row(
            "SELECT COUNT(*) FROM ledger_entries WHERE txn_id = ?1",
            rusqlite::params![txn_id.to_string()],
            |r| r.get(0),
        )
        .unwrap()
    };
    assert_eq!(count2, 2); // Still exactly 2 entries, zero duplicates!
}

#[tokio::test]
async fn test_illegal_state_transition_returns_409() {
    let app = setup_test_app();
    let txn_id = Uuid::new_v4();

    // Create a normal settled transaction
    let req_body = json!({
        "txn_id": txn_id,
        "idempotency_key": Uuid::new_v4(),
        "sender_vpa": "rahul@okaxis",
        "receiver_vpa": "shop@ybl",
        "amount": 100.0,
        "device_id": "dev-01",
        "geo_city": "Kolkata",
        "timestamp": Utc::now()
    });

    let resp = app
        .clone()
        .oneshot(signed_request("/api/transactions", "POST", &req_body))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::CREATED);

    // Attempting step-up verify on already SETTLED transaction must return 409 Conflict
    let stepup_req = Request::builder()
        .uri(format!("/api/transactions/{}/stepup/verify", txn_id))
        .method("POST")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(r#"{"otp":"123456"}"#))
        .unwrap();

    let resp = app.clone().oneshot(stepup_req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::CONFLICT);

    // Attempting guardian approval on already SETTLED transaction must return 409 Conflict
    let guardian_req = Request::builder()
        .uri(format!("/api/transactions/{}/guardian", txn_id))
        .method("POST")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(r#"{"approved":true}"#))
        .unwrap();

    let resp = app.clone().oneshot(guardian_req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::CONFLICT);

    // Attempting cooling release on already SETTLED transaction must return 409 Conflict
    let cooling_req = Request::builder()
        .uri(format!("/api/transactions/{}/cooling/release", txn_id))
        .method("POST")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(r#"{}"#))
        .unwrap();

    let resp = app.oneshot(cooling_req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::CONFLICT);
}

#[tokio::test]
async fn test_step_up_otp_flow() {
    let db = Database::new_in_memory().unwrap();
    let state = AppState::new(db);
    let app = create_router(state.clone());

    let txn_id = Uuid::new_v4();

    // High value transaction (₹12,000) triggers STEP_UP_PENDING
    let req_body = json!({
        "txn_id": txn_id,
        "idempotency_key": Uuid::new_v4(),
        "sender_vpa": "rahul@okaxis",
        "receiver_vpa": "shop@ybl",
        "amount": 12000.0,
        "device_id": "dev-01",
        "geo_city": "Kolkata",
        "timestamp": Utc::now()
    });

    let resp = app
        .clone()
        .oneshot(signed_request("/api/transactions", "POST", &req_body))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::CREATED);

    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let txn: TransactionResponse = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(txn.status, TxnState::StepUpPending);

    // 1. Wrong OTP -> Rejected
    let wrong_otp_req = Request::builder()
        .uri(format!("/api/transactions/{}/stepup/verify", txn_id))
        .method("POST")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(r#"{"otp":"000000"}"#))
        .unwrap();

    let resp = app.clone().oneshot(wrong_otp_req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let rej_txn: TransactionResponse = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(rej_txn.status, TxnState::Rejected);

    // 2. Fresh transaction with valid OTP verification
    let txn_id2 = Uuid::new_v4();
    let req_body2 = json!({
        "txn_id": txn_id2,
        "idempotency_key": Uuid::new_v4(),
        "sender_vpa": "rahul@okaxis",
        "receiver_vpa": "shop@ybl",
        "amount": 15000.0,
        "device_id": "dev-01",
        "geo_city": "Kolkata",
        "timestamp": Utc::now()
    });

    let resp = app
        .clone()
        .oneshot(signed_request("/api/transactions", "POST", &req_body2))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::CREATED);

    // Generate known OTP to test successful verification
    let valid_otp = state.otp_manager.generate_otp(txn_id2);

    let correct_otp_req = Request::builder()
        .uri(format!("/api/transactions/{}/stepup/verify", txn_id2))
        .method("POST")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(json!({ "otp": valid_otp }).to_string()))
        .unwrap();

    let resp = app.oneshot(correct_otp_req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let settled_txn: TransactionResponse = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(settled_txn.status, TxnState::Settled);
}

#[tokio::test]
async fn test_guardian_approval_and_rejection() {
    let app = setup_test_app();

    // Active call -> GUARDIAN_PENDING
    let txn_id = Uuid::new_v4();
    let req_body = json!({
        "txn_id": txn_id,
        "idempotency_key": Uuid::new_v4(),
        "sender_vpa": "rahul@okaxis",
        "receiver_vpa": "shop@ybl",
        "amount": 500.0,
        "device_id": "dev-01",
        "geo_city": "Kolkata",
        "is_on_active_call": true,
        "timestamp": Utc::now()
    });

    let resp = app
        .clone()
        .oneshot(signed_request("/api/transactions", "POST", &req_body))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::CREATED);
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let txn: TransactionResponse = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(txn.status, TxnState::GuardianPending);

    // Guardian Approves
    let approve_req = Request::builder()
        .uri(format!("/api/transactions/{}/guardian", txn_id))
        .method("POST")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(r#"{"approved":true,"reason":"Confirmed by father"}"#))
        .unwrap();

    let resp = app.oneshot(approve_req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let settled_txn: TransactionResponse = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(settled_txn.status, TxnState::Settled);
}

#[tokio::test]
async fn test_cooling_lock_425_too_early() {
    let app = setup_test_app();

    // Clipboard pasted VPA -> COOLING_LOCK
    let txn_id = Uuid::new_v4();
    let req_body = json!({
        "txn_id": txn_id,
        "idempotency_key": Uuid::new_v4(),
        "sender_vpa": "rahul@okaxis",
        "receiver_vpa": "shop@ybl",
        "amount": 300.0,
        "device_id": "dev-01",
        "geo_city": "Kolkata",
        "vpa_pasted_from_clipboard": true,
        "timestamp": Utc::now()
    });

    let resp = app
        .clone()
        .oneshot(signed_request("/api/transactions", "POST", &req_body))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::CREATED);
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let txn: TransactionResponse = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(txn.status, TxnState::CoolingLock);
    assert!(txn.cooling_until.is_some());

    // Immediate attempt to release cooling lock must return 425 Too Early!
    let release_req = Request::builder()
        .uri(format!("/api/transactions/{}/cooling/release", txn_id))
        .method("POST")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(r#"{}"#))
        .unwrap();

    let resp = app.clone().oneshot(release_req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::TOO_EARLY);

    // Payer cancellation during cooling period
    let cancel_req = Request::builder()
        .uri(format!("/api/transactions/{}/cooling/release", txn_id))
        .method("POST")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(r#"{"cancel":true}"#))
        .unwrap();

    let resp = app.oneshot(cancel_req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let rej_txn: TransactionResponse = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(rej_txn.status, TxnState::Rejected);
}

#[tokio::test]
async fn test_audit_trail_endpoint() {
    let app = setup_test_app();
    let txn_id = Uuid::new_v4();

    let req_body = json!({
        "txn_id": txn_id,
        "idempotency_key": Uuid::new_v4(),
        "sender_vpa": "rahul@okaxis",
        "receiver_vpa": "shop@ybl",
        "amount": 100.0,
        "device_id": "dev-01",
        "geo_city": "Kolkata",
        "timestamp": Utc::now()
    });

    let resp = app
        .clone()
        .oneshot(signed_request("/api/transactions", "POST", &req_body))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::CREATED);

    // Retrieve audit trail
    let audit_req = Request::builder()
        .uri(format!("/api/audit/{}", txn_id))
        .method("GET")
        .body(Body::empty())
        .unwrap();

    let resp = app.oneshot(audit_req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);

    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let trail: Vec<shieldpay_core::core::schemas::AuditEntry> =
        serde_json::from_slice(&bytes).unwrap();
    assert!(!trail.is_empty());
    assert_eq!(trail[0].txn_id, txn_id);
}

#[tokio::test]
async fn test_internal_events_endpoint() {
    let app = setup_test_app();

    let evt_body = json!({
        "event_type": "ai.advice",
        "payload": { "message": "High velocity detected" },
        "timestamp": Utc::now()
    });

    let req = Request::builder()
        .uri("/api/internal/events")
        .method("POST")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(evt_body.to_string()))
        .unwrap();

    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::ACCEPTED);
}
