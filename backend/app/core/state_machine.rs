use crate::core::schemas::{AuditEntry, TxnState};
use chrono::Utc;
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TransitionError {
    IllegalTransition { from: TxnState, to: TxnState },
}

impl std::fmt::Display for TransitionError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TransitionError::IllegalTransition { from, to } => {
                write!(f, "Illegal state transition from {} to {}", from, to)
            }
        }
    }
}

impl std::error::Error for TransitionError {}

/// Strict legal transition validator based on ShieldPay system contract:
/// - INITIATED -> SCORING
/// - SCORING -> APPROVED | STEP_UP_PENDING | GUARDIAN_PENDING | COOLING_LOCK | BLOCKED
/// - STEP_UP_PENDING -> APPROVED | REJECTED
/// - GUARDIAN_PENDING -> APPROVED | REJECTED
/// - COOLING_LOCK -> APPROVED | REJECTED
/// - APPROVED -> SETTLED
pub fn is_legal_transition(from: TxnState, to: TxnState) -> bool {
    matches!(
        (from, to),
        (TxnState::Initiated, TxnState::Scoring)
            | (TxnState::Scoring, TxnState::Approved)
            | (TxnState::Scoring, TxnState::StepUpPending)
            | (TxnState::Scoring, TxnState::GuardianPending)
            | (TxnState::Scoring, TxnState::CoolingLock)
            | (TxnState::Scoring, TxnState::Blocked)
            | (TxnState::StepUpPending, TxnState::Approved)
            | (TxnState::StepUpPending, TxnState::Rejected)
            | (TxnState::GuardianPending, TxnState::Approved)
            | (TxnState::GuardianPending, TxnState::Rejected)
            | (TxnState::CoolingLock, TxnState::Approved)
            | (TxnState::CoolingLock, TxnState::Rejected)
            | (TxnState::Approved, TxnState::Settled)
    )
}

/// Attempts to execute a state transition.
/// Returns Ok((new_state, AuditEntry)) if legal.
/// Returns Err(TransitionError::IllegalTransition) if illegal, guaranteeing state remains unchanged.
pub fn transition(
    txn_id: Uuid,
    from: TxnState,
    to: TxnState,
    actor: &str,
    note: &str,
) -> Result<(TxnState, AuditEntry), TransitionError> {
    if !is_legal_transition(from, to) {
        return Err(TransitionError::IllegalTransition { from, to });
    }

    let audit = AuditEntry {
        id: None,
        txn_id,
        from_state: Some(from),
        to_state: to,
        actor: actor.to_string(),
        note: note.to_string(),
        timestamp: Utc::now(),
    };

    Ok((to, audit))
}
