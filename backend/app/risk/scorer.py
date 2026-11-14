import time
from app.schemas import TransactionRequest, ScoreResult
from app.risk.features import extract_and_record_features, USER_PROFILES
from app.risk.graph import analyze_and_record_edge
from app.risk.rules import evaluate_rules
from app.risk.decision import resolve_decision

def score(txn: TransactionRequest, is_guardian_user: bool | None = None) -> ScoreResult:
    t0 = time.perf_counter()

    features = extract_and_record_features(txn)
    graph_flags = analyze_and_record_edge(txn)
    total_score, reasons = evaluate_rules(txn, features, graph_flags)

    guardian_flag = (
        is_guardian_user
        if is_guardian_user is not None
        else features["is_guardian_enabled"]
    )

    decision = resolve_decision(
        score=total_score,
        is_on_active_call=txn.is_on_active_call,
        screen_share_detected=txn.screen_share_detected,
        is_new_payee=features["is_new_payee"],
        is_guardian_account=guardian_flag,
    )

    # If approved, add payee to known payees so repeat payments aren't flagged as new
    if decision == "APPROVED":
        USER_PROFILES[txn.sender_vpa].known_payees.add(txn.receiver_vpa)

    latency_ms = round((time.perf_counter() - t0) * 1000, 3)

    return ScoreResult(
        score=total_score,
        reasons=reasons,
        decision=decision,
        latency_ms=latency_ms,
    )