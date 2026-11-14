use chrono::Utc;
use rusqlite::{params, OptionalExtension};
use uuid::Uuid;

use crate::core::db::Database;
use crate::core::schemas::TransactionResponse;

#[derive(Clone)]
pub struct IdempotencyManager {
    db: Database,
}

impl IdempotencyManager {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    /// Checks if a request with this idempotency_key has already been processed.
    /// If yes, returns the previously stored response directly, preventing duplicate processing or debit.
    pub fn get_response(&self, idempotency_key: Uuid) -> Result<Option<TransactionResponse>, String> {
        let conn = self.db.lock_conn();
        let key_str = idempotency_key.to_string();

        let json_opt: Option<String> = conn
            .query_row(
                "SELECT response_json FROM idempotency_store WHERE idempotency_key = ?1",
                params![key_str],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| format!("Database error in idempotency lookup: {}", e))?;

        if let Some(json_str) = json_opt {
            let resp: TransactionResponse = serde_json::from_str(&json_str)
                .map_err(|e| format!("Failed to deserialize stored response: {}", e))?;
            Ok(Some(resp))
        } else {
            Ok(None)
        }
    }

    /// Stores the completed response keyed by idempotency_key.
    pub fn record_response(
        &self,
        idempotency_key: Uuid,
        txn_id: Uuid,
        response: &TransactionResponse,
    ) -> Result<(), String> {
        let conn = self.db.lock_conn();
        let key_str = idempotency_key.to_string();
        let txn_str = txn_id.to_string();
        let json_str = serde_json::to_string(response)
            .map_err(|e| format!("Failed to serialize response: {}", e))?;
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO idempotency_store (idempotency_key, txn_id, response_json, created_at)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(idempotency_key) DO UPDATE SET response_json = excluded.response_json",
            params![key_str, txn_str, json_str, now],
        )
        .map_err(|e| format!("Failed to store idempotency record: {}", e))?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::schemas::TxnState;

    #[test]
    fn test_idempotency_storage_and_retrieval() {
        let db = Database::new_in_memory().unwrap();
        let manager = IdempotencyManager::new(db);

        let idem_key = Uuid::new_v4();
        let txn_id = Uuid::new_v4();

        // Initially absent
        assert!(manager.get_response(idem_key).unwrap().is_none());

        let now = Utc::now();
        let resp = TransactionResponse {
            txn_id,
            idempotency_key: idem_key,
            sender_vpa: "rah***@okaxis".to_string(),
            receiver_vpa: "sho***@ybl".to_string(),
            amount: 500.0,
            status: TxnState::Settled,
            risk_score: Some(0.05),
            risk_reasons: vec!["Low risk".to_string()],
            cooling_until: None,
            created_at: now,
            updated_at: now,
        };

        // Record
        manager.record_response(idem_key, txn_id, &resp).unwrap();

        // Retrieve
        let retrieved = manager.get_response(idem_key).unwrap().expect("should exist");
        assert_eq!(retrieved.txn_id, txn_id);
        assert_eq!(retrieved.status, TxnState::Settled);
        assert_eq!(retrieved.amount, 500.0);
    }
}
