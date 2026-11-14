use chrono::Utc;
use rusqlite::{params, Connection, Result};
use std::sync::{Arc, Mutex};

#[derive(Clone)]
pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn new(path: &str) -> Result<Self> {
        let conn = if path == ":memory:" {
            Connection::open_in_memory()?
        } else {
            Connection::open(path)?
        };

        let db = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        db.init_migrations()?;
        Ok(db)
    }

    pub fn new_in_memory() -> Result<Self> {
        Self::new(":memory:")
    }

    pub fn init_migrations(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        // 1. Transactions table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS transactions (
                txn_id TEXT PRIMARY KEY,
                idempotency_key TEXT UNIQUE NOT NULL,
                sender_vpa TEXT NOT NULL,
                receiver_vpa TEXT NOT NULL,
                amount REAL NOT NULL,
                device_id TEXT NOT NULL,
                geo_city TEXT NOT NULL,
                status TEXT NOT NULL,
                risk_score REAL,
                risk_reasons TEXT,
                cooling_until TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;

        // 2. Audit trail table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS audit_trail (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                txn_id TEXT NOT NULL,
                from_state TEXT,
                to_state TEXT NOT NULL,
                actor TEXT NOT NULL,
                note TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )",
            [],
        )?;

        // 3. Accounts table (for double-entry balance tracking)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS accounts (
                vpa TEXT PRIMARY KEY,
                balance REAL NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;

        // 4. Ledger entries table (double-entry debit/credit journal)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS ledger_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                txn_id TEXT NOT NULL,
                sender_vpa TEXT NOT NULL,
                receiver_vpa TEXT NOT NULL,
                amount REAL NOT NULL,
                entry_type TEXT NOT NULL,
                balance_after REAL NOT NULL,
                timestamp TEXT NOT NULL
            )",
            [],
        )?;

        // 5. Idempotency store (persisted responses for zero duplicate debit replay)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS idempotency_store (
                idempotency_key TEXT PRIMARY KEY,
                txn_id TEXT NOT NULL,
                response_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            )",
            [],
        )?;

        // Seed demo accounts if not already present
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "INSERT OR IGNORE INTO accounts (vpa, balance, updated_at) VALUES (?1, ?2, ?3)",
            params!["rahul@okaxis", 50000.0, &now],
        )?;
        conn.execute(
            "INSERT OR IGNORE INTO accounts (vpa, balance, updated_at) VALUES (?1, ?2, ?3)",
            params!["shop@ybl", 10000.0, &now],
        )?;

        Ok(())
    }

    pub fn lock_conn(&self) -> std::sync::MutexGuard<'_, Connection> {
        self.conn.lock().unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_db_migrations() {
        let db = Database::new_in_memory().expect("failed to init db");
        let conn = db.lock_conn();

        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('transactions', 'audit_trail', 'accounts', 'ledger_entries', 'idempotency_store')",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(count, 5);
    }
}
