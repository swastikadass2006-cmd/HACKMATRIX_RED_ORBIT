use axum::{
    extract::{Json, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde_json::json;

use crate::core::schemas::InternalEvent;
use crate::state::AppState;

pub async fn post_internal_event(
    State(state): State<AppState>,
    Json(event): Json<InternalEvent>,
) -> impl IntoResponse {
    state.event_hub.broadcast(event);
    (StatusCode::ACCEPTED, Json(json!({ "status": "broadcasted" })))
}
