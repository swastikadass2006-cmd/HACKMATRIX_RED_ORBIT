use axum::{
    extract::Json,
    http::StatusCode,
    response::IntoResponse,
};
use chrono::Utc;

use crate::core::masking::mask_vpa;
use crate::core::schemas::{TransactionRequest, TransactionResponse, TxnState};

pub async fn create_transaction(
    Json(payload): Json<TransactionRequest>,
) -> Result<impl IntoResponse, (StatusCode, &'static str)> {
    let now = Utc::now();
    let response = TransactionResponse {
        txn_id: payload.txn_id,
        idempotency_key: payload.idempotency_key,
        sender_vpa: mask_vpa(&payload.sender_vpa),
        receiver_vpa: mask_vpa(&payload.receiver_vpa),
        amount: payload.amount,
        status: TxnState::Initiated,
        risk_score: None,
        risk_reasons: vec![],
        cooling_until: None,
        created_at: now,
        updated_at: now,
    };

    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn list_transactions() -> impl IntoResponse {
    let empty: Vec<TransactionResponse> = vec![];
    Json(empty)
}
