use chrono::Utc;
use rusqlite::{params, OptionalExtension};
use uuid::Uuid;

use crate::core::db::Database;

#[derive(Debug, PartialEq)]
pub enum LedgerError {
    AlreadySettled(Uuid),
    InsufficientBalance { available: f64, required: f64 },
    DatabaseError(String),
}

impl std::fmt::Display for LedgerError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LedgerError::AlreadySettled(id) => write!(f, "Transaction {} already settled", id),
            LedgerError::InsufficientBalance { available, required } => {
                write!(f, "Insufficient balance: available {}, required {}", available, required)
            }
            LedgerError::DatabaseError(msg) => write!(f, "Ledger database error: {}", msg),
        }
    }
}

impl std::error::Error for LedgerError {}

#[derive(Debug, Clone, PartialEq)]
pub struct LedgerSettlement {
    pub txn_id: Uuid,
    pub sender_vpa: String,
    pub receiver_vpa: String,
    pub amount: f64,
    pub sender_balance_after: f64,
    pub receiver_balance_after: f64,
}

#[derive(Clone)]
pub struct LedgerManager {
    db: Database,
}

impl LedgerManager {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    /// Performs atomic double-entry debit and credit settlement in a single SQLite ACID transaction.
    /// If sender has insufficient funds or if already settled, transaction rolls back cleanly.
    pub fn settle(
        &self,
        txn_id: Uuid,
        sender_vpa: &str,
        receiver_vpa: &str,
        amount: f64,
    ) -> Result<LedgerSettlement, LedgerError> {
        let mut conn = self.db.lock_conn();
        let tx = conn
            .transaction()
            .map_err(|e| LedgerError::DatabaseError(e.to_string()))?;

        let txn_str = txn_id.to_string();

        // 1. Guard against duplicate settlement
        let existing_count: i64 = tx
            .query_row(
                "SELECT COUNT(*) FROM ledger_entries WHERE txn_id = ?1",
                params![txn_str],
                |row| row.get(0),
            )
            .map_err(|e| LedgerError::DatabaseError(e.to_string()))?;

        if existing_count > 0 {
            return Err(LedgerError::AlreadySettled(txn_id));
        }

        let now = Utc::now().to_rfc3339();

        // 2. Fetch or initialize sender balance (demo default: 50,000.0 if not present)
        let sender_balance: f64 = match tx
            .query_row(
                "SELECT balance FROM accounts WHERE vpa = ?1",
                params![sender_vpa],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| LedgerError::DatabaseError(e.to_string()))?
        {
            Some(b) => b,
            None => {
                let initial = 50000.0;
                tx.execute(
                    "INSERT INTO accounts (vpa, balance, updated_at) VALUES (?1, ?2, ?3)",
                    params![sender_vpa, initial, &now],
                )
                .map_err(|e| LedgerError::DatabaseError(e.to_string()))?;
                initial
            }
        };

        if sender_balance < amount {
            return Err(LedgerError::InsufficientBalance {
                available: sender_balance,
                required: amount,
            });
        }

        // 3. Fetch or initialize receiver balance (demo default: 10,000.0 if not present)
        let receiver_balance: f64 = match tx
            .query_row(
                "SELECT balance FROM accounts WHERE vpa = ?1",
                params![receiver_vpa],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| LedgerError::DatabaseError(e.to_string()))?
        {
            Some(b) => b,
            None => {
                let initial = 10000.0;
                tx.execute(
                    "INSERT INTO accounts (vpa, balance, updated_at) VALUES (?1, ?2, ?3)",
                    params![receiver_vpa, initial, &now],
                )
                .map_err(|e| LedgerError::DatabaseError(e.to_string()))?;
                initial
            }
        };

        let sender_after = sender_balance - amount;
        let receiver_after = receiver_balance + amount;

        // 4. Update sender balance
        tx.execute(
            "UPDATE accounts SET balance = ?1, updated_at = ?2 WHERE vpa = ?3",
            params![sender_after, &now, sender_vpa],
        )
        .map_err(|e| LedgerError::DatabaseError(e.to_string()))?;

        // 5. Update receiver balance
        tx.execute(
            "UPDATE accounts SET balance = ?1, updated_at = ?2 WHERE vpa = ?3",
            params![receiver_after, &now, receiver_vpa],
        )
        .map_err(|e| LedgerError::DatabaseError(e.to_string()))?;

        // 6. Record DEBIT ledger entry
        tx.execute(
            "INSERT INTO ledger_entries (txn_id, sender_vpa, receiver_vpa, amount, entry_type, balance_after, timestamp)
             VALUES (?1, ?2, ?3, ?4, 'DEBIT', ?5, ?6)",
            params![txn_str, sender_vpa, receiver_vpa, amount, sender_after, &now],
        )
        .map_err(|e| LedgerError::DatabaseError(e.to_string()))?;

        // 7. Record CREDIT ledger entry
        tx.execute(
            "INSERT INTO ledger_entries (txn_id, sender_vpa, receiver_vpa, amount, entry_type, balance_after, timestamp)
             VALUES (?1, ?2, ?3, ?4, 'CREDIT', ?5, ?6)",
            params![txn_str, sender_vpa, receiver_vpa, amount, receiver_after, &now],
        )
        .map_err(|e| LedgerError::DatabaseError(e.to_string()))?;

        tx.commit()
            .map_err(|e| LedgerError::DatabaseError(e.to_string()))?;

        Ok(LedgerSettlement {
            txn_id,
            sender_vpa: sender_vpa.to_string(),
            receiver_vpa: receiver_vpa.to_string(),
            amount,
            sender_balance_after: sender_after,
            receiver_balance_after: receiver_after,
        })
    }

    /// Retrieve account balance for a VPA
    pub fn get_balance(&self, vpa: &str) -> Result<Option<f64>, String> {
        let conn = self.db.lock_conn();
        conn.query_row(
            "SELECT balance FROM accounts WHERE vpa = ?1",
            params![vpa],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_atomic_double_entry_settlement() {
        let db = Database::new_in_memory().unwrap();
        let ledger = LedgerManager::new(db);
        let txn_id = Uuid::new_v4();

        let initial_sender = ledger.get_balance("rahul@okaxis").unwrap().unwrap();
        let initial_receiver = ledger.get_balance("shop@ybl").unwrap().unwrap();

        let settlement = ledger
            .settle(txn_id, "rahul@okaxis", "shop@ybl", 500.0)
            .expect("settlement should succeed");

        assert_eq!(settlement.sender_balance_after, initial_sender - 500.0);
        assert_eq!(settlement.receiver_balance_after, initial_receiver + 500.0);

        // Verify duplicate settlement returns error
        let duplicate = ledger.settle(txn_id, "rahul@okaxis", "shop@ybl", 500.0);
        assert_eq!(duplicate, Err(LedgerError::AlreadySettled(txn_id)));

        // Balances must remain unchanged after attempted duplicate
        assert_eq!(ledger.get_balance("rahul@okaxis").unwrap().unwrap(), initial_sender - 500.0);
        assert_eq!(ledger.get_balance("shop@ybl").unwrap().unwrap(), initial_receiver + 500.0);
    }

    #[test]
    fn test_insufficient_balance() {
        let db = Database::new_in_memory().unwrap();
        let ledger = LedgerManager::new(db);
        let txn_id = Uuid::new_v4();

        let err = ledger.settle(txn_id, "rahul@okaxis", "shop@ybl", 999999.0);
        assert!(matches!(err, Err(LedgerError::InsufficientBalance { .. })));
    }
}
