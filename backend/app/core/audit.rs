use crate::core::schemas::AuditEntry;
use std::sync::{Arc, RwLock};
use uuid::Uuid;

#[derive(Clone, Default)]
pub struct AuditStore {
    entries: Arc<RwLock<Vec<AuditEntry>>>,
}

impl AuditStore {
    pub fn new() -> Self {
        Self {
            entries: Arc::new(RwLock::new(Vec::new())),
        }
    }

    pub fn append(&self, entry: AuditEntry) {
        if let Ok(mut lock) = self.entries.write() {
            lock.push(entry);
        }
    }

    pub fn get_by_txn_id(&self, txn_id: Uuid) -> Vec<AuditEntry> {
        if let Ok(lock) = self.entries.read() {
            lock.iter()
                .filter(|e| e.txn_id == txn_id)
                .cloned()
                .collect()
        } else {
            Vec::new()
        }
    }
}
