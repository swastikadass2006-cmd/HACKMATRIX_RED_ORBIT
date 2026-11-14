use axum::{
    extract::{Json, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde_json::json;

use crate::core::events::EventHub;
use crate::core::schemas::InternalEvent;

pub async fn post_internal_event(
    State(hub): State<EventHub>,
    Json(event): Json<InternalEvent>,
) -> impl IntoResponse {
    hub.broadcast(event);
    (StatusCode::ACCEPTED, Json(json!({ "status": "broadcasted" })))
}
