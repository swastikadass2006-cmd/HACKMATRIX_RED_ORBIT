use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fmt;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TxnState {
    Initiated,
    Scoring,
    Approved,
    StepUpPending,
    GuardianPending,
    CoolingLock,
    Blocked,
    Rejected,
    Settled,
}

impl fmt::Display for TxnState {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TxnState::Initiated => write!(f, "INITIATED"),
            TxnState::Scoring => write!(f, "SCORING"),
            TxnState::Approved => write!(f, "APPROVED"),
            TxnState::StepUpPending => write!(f, "STEP_UP_PENDING"),
            TxnState::GuardianPending => write!(f, "GUARDIAN_PENDING"),
            TxnState::CoolingLock => write!(f, "COOLING_LOCK"),
            TxnState::Blocked => write!(f, "BLOCKED"),
            TxnState::Rejected => write!(f, "REJECTED"),
            TxnState::Settled => write!(f, "SETTLED"),
        }
    }
}

impl std::str::FromStr for TxnState {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "INITIATED" => Ok(TxnState::Initiated),
            "SCORING" => Ok(TxnState::Scoring),
            "APPROVED" => Ok(TxnState::Approved),
            "STEP_UP_PENDING" => Ok(TxnState::StepUpPending),
            "GUARDIAN_PENDING" => Ok(TxnState::GuardianPending),
            "COOLING_LOCK" => Ok(TxnState::CoolingLock),
            "BLOCKED" => Ok(TxnState::Blocked),
            "REJECTED" => Ok(TxnState::Rejected),
            "SETTLED" => Ok(TxnState::Settled),
            _ => Err(format!("Unknown TxnState: {}", s)),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionRequest {
    pub txn_id: Uuid,
    pub idempotency_key: Uuid,
    pub sender_vpa: String,
    pub receiver_vpa: String,
    pub amount: f64,
    pub device_id: String,
    pub geo_city: String,
    pub timestamp: DateTime<Utc>,
    #[serde(default)]
    pub is_on_active_call: bool,
    #[serde(default)]
    pub screen_share_detected: bool,
    #[serde(default)]
    pub vpa_pasted_from_clipboard: bool,
    #[serde(default)]
    pub label_is_fraud: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionResponse {
    pub txn_id: Uuid,
    pub idempotency_key: Uuid,
    pub sender_vpa: String,
    pub receiver_vpa: String,
    pub amount: f64,
    pub status: TxnState,
    pub risk_score: Option<f64>,
    pub risk_reasons: Vec<String>,
    pub cooling_until: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEntry {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<i64>,
    pub txn_id: Uuid,
    pub from_state: Option<TxnState>,
    pub to_state: TxnState,
    pub actor: String,
    pub note: String,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepUpVerifyRequest {
    pub otp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GuardianApprovalRequest {
    pub approved: bool,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoolingReleaseRequest {
    #[serde(default)]
    pub cancel: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InternalEvent {
    pub event_type: String,
    pub payload: serde_json::Value,
    #[serde(default = "Utc::now")]
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskScoreRequest {
    pub txn_id: Uuid,
    pub sender_vpa: String,
    pub receiver_vpa: String,
    pub amount: f64,
    pub device_id: String,
    pub geo_city: String,
    pub is_on_active_call: bool,
    pub screen_share_detected: bool,
    pub vpa_pasted_from_clipboard: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RiskDecision {
    Approve,
    StepUp,
    Guardian,
    CoolingLock,
    Block,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskScoreResponse {
    pub score: f64,
    pub decision: RiskDecision,
    pub reasons: Vec<String>,
}
