use axum::{
    extract::{Path, State},
    response::IntoResponse,
    Json,
};
use uuid::Uuid;

use crate::core::audit::AuditStore;

pub async fn get_audit_trail(
    Path(txn_id): Path<Uuid>,
    State(audit_store): State<AuditStore>,
) -> impl IntoResponse {
    let entries = audit_store.get_by_txn_id(txn_id);
    Json(entries)
}
