use shieldpay_core::core::audit::AuditStore;
use shieldpay_core::core::schemas::TxnState;
use shieldpay_core::core::state_machine::{is_legal_transition, transition, TransitionError};
use uuid::Uuid;

#[test]
fn test_all_legal_transitions() {
    let legal_pairs = vec![
        (TxnState::Initiated, TxnState::Scoring),
        (TxnState::Scoring, TxnState::Approved),
        (TxnState::Scoring, TxnState::StepUpPending),
        (TxnState::Scoring, TxnState::GuardianPending),
        (TxnState::Scoring, TxnState::CoolingLock),
        (TxnState::Scoring, TxnState::Blocked),
        (TxnState::StepUpPending, TxnState::Approved),
        (TxnState::StepUpPending, TxnState::Rejected),
        (TxnState::GuardianPending, TxnState::Approved),
        (TxnState::GuardianPending, TxnState::Rejected),
        (TxnState::CoolingLock, TxnState::Approved),
        (TxnState::CoolingLock, TxnState::Rejected),
        (TxnState::Approved, TxnState::Settled),
    ];

    for (from, to) in legal_pairs {
        assert!(
            is_legal_transition(from, to),
            "Expected {:?} -> {:?} to be legal",
            from,
            to
        );

        let txn_id = Uuid::new_v4();
        let result = transition(txn_id, from, to, "test_runner", "legal test");
        assert!(result.is_ok());
        let (new_state, audit) = result.unwrap();
        assert_eq!(new_state, to);
        assert_eq!(audit.txn_id, txn_id);
        assert_eq!(audit.from_state, Some(from));
        assert_eq!(audit.to_state, to);
        assert_eq!(audit.actor, "test_runner");
    }
}

#[test]
fn test_illegal_transitions_matrix() {
    let illegal_pairs = vec![
        (TxnState::Initiated, TxnState::Approved),
        (TxnState::Initiated, TxnState::Settled),
        (TxnState::Initiated, TxnState::Blocked),
        (TxnState::Scoring, TxnState::Settled),
        (TxnState::StepUpPending, TxnState::Settled),
        (TxnState::StepUpPending, TxnState::Scoring),
        (TxnState::GuardianPending, TxnState::Settled),
        (TxnState::CoolingLock, TxnState::Settled),
        (TxnState::Blocked, TxnState::Approved),
        (TxnState::Blocked, TxnState::Settled),
        (TxnState::Rejected, TxnState::Approved),
        (TxnState::Rejected, TxnState::Settled),
        (TxnState::Settled, TxnState::Approved),
        (TxnState::Settled, TxnState::Initiated),
    ];

    for (from, to) in illegal_pairs {
        assert!(
            !is_legal_transition(from, to),
            "Expected {:?} -> {:?} to be illegal",
            from,
            to
        );

        let txn_id = Uuid::new_v4();
        let result = transition(txn_id, from, to, "attacker", "illegal test");
        assert_eq!(
            result,
            Err(TransitionError::IllegalTransition { from, to })
        );
    }
}

#[test]
fn test_audit_store_integration() {
    let audit_store = AuditStore::new();
    let txn_id = Uuid::new_v4();

    // 1. INITIATED -> SCORING
    let (s1, a1) = transition(txn_id, TxnState::Initiated, TxnState::Scoring, "system", "started").unwrap();
    audit_store.append(a1);
    assert_eq!(s1, TxnState::Scoring);

    // 2. SCORING -> APPROVED
    let (s2, a2) = transition(txn_id, s1, TxnState::Approved, "risk_engine", "low risk").unwrap();
    audit_store.append(a2);
    assert_eq!(s2, TxnState::Approved);

    // 3. APPROVED -> SETTLED
    let (s3, a3) = transition(txn_id, s2, TxnState::Settled, "ledger", "settled").unwrap();
    audit_store.append(a3);
    assert_eq!(s3, TxnState::Settled);

    let trail = audit_store.get_by_txn_id(txn_id);
    assert_eq!(trail.len(), 3);
    assert_eq!(trail[0].from_state, Some(TxnState::Initiated));
    assert_eq!(trail[0].to_state, TxnState::Scoring);
    assert_eq!(trail[1].from_state, Some(TxnState::Scoring));
    assert_eq!(trail[1].to_state, TxnState::Approved);
    assert_eq!(trail[2].from_state, Some(TxnState::Approved));
    assert_eq!(trail[2].to_state, TxnState::Settled);
}
