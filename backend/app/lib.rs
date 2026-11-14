use axum::{
    routing::{get, post},
    Router,
};
use tower_http::cors::{Any, CorsLayer};

pub mod api;
pub mod core;
pub mod state;

use state::AppState;

pub fn create_router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/health", get(health_handler))
        .route(
            "/api/transactions",
            post(api::transactions::create_transaction).get(api::transactions::list_transactions),
        )
        .route("/api/audit/:txn_id", get(api::audit::get_audit_trail))
        .route(
            "/api/transactions/:txn_id/stepup/verify",
            post(api::stepup::verify_stepup),
        )
        .route("/api/stream", get(api::stream::sse_handler))
        .route(
            "/api/internal/events",
            post(api::internal_events::post_internal_event),
        )
        .layer(cors)
        .with_state(state)
}

pub async fn health_handler() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({
        "status": "ok",
        "service": "shieldpay-core"
    }))
}

pub fn health_status() -> &'static str {
    "ok"
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_health_status() {
        assert_eq!(health_status(), "ok");
    }
}
