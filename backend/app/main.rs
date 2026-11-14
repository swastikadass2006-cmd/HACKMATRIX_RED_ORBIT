use shieldpay_core::core::db::Database;
use shieldpay_core::create_router;
use shieldpay_core::state::AppState;
use std::env;
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    let db_path = env::var("DATABASE_URL").unwrap_or_else(|_| "shieldpay.db".to_string());
    let db = Database::new(&db_path).expect("Failed to initialize SQLite database");
    let state = AppState::new(db);
    let app = create_router(state);

    let port: u16 = env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("🛡️  ShieldPay Payments Core running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("Failed to bind TCP listener");

    axum::serve(listener, app)
        .await
        .expect("Server error encountered");
}
