use crate::core::audit::AuditStore;
use crate::core::db::Database;
use crate::core::events::EventHub;
use crate::core::idempotency::IdempotencyManager;
use crate::core::ledger::LedgerManager;
use crate::core::risk_bridge::RiskBridge;
use crate::core::security::OtpManager;

#[derive(Clone)]
pub struct AppState {
    pub db: Database,
    pub audit_store: AuditStore,
    pub otp_manager: OtpManager,
    pub idempotency_manager: IdempotencyManager,
    pub ledger_manager: LedgerManager,
    pub event_hub: EventHub,
    pub risk_bridge: RiskBridge,
}

impl AppState {
    pub fn new(db: Database) -> Self {
        Self {
            audit_store: AuditStore::new(),
            otp_manager: OtpManager::new(),
            idempotency_manager: IdempotencyManager::new(db.clone()),
            ledger_manager: LedgerManager::new(db.clone()),
            event_hub: EventHub::new(512),
            risk_bridge: RiskBridge::new(),
            db,
        }
    }
}
