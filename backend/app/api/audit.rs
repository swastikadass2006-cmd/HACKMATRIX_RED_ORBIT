use axum::{
    extract::{Path, State},
    response::IntoResponse,
    Json,
};
use uuid::Uuid;

use crate::state::AppState;

pub async fn get_audit_trail(
    Path(txn_id): Path<Uuid>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    let entries = state.audit_store.get_by_txn_id(txn_id);
    Json(entries)
}
