import logging
import time
from app.schemas import TransactionRequest, ScoreResult, ReasonItem
from app.risk.features import extract_and_record_features, USER_PROFILES
from app.risk.graph import analyze_and_record_edge
from app.risk.rules import evaluate_rules
from app.risk.decision import resolve_decision
from app.risk.trustlens_inference import predict_transaction

logger = logging.getLogger(__name__)

# Weight for the secondary TrustLens ML Anomaly signal
TRUSTLENS_ML_WEIGHT = 20


def score(txn: TransactionRequest, is_guardian_user: bool | None = None) -> ScoreResult:
    """
    Evaluates transaction risk using deterministic rules, sliding windows, and
    an additive secondary TrustLens ML inference signal with a strict 20ms guardrail.
    """
    t0 = time.perf_counter()

    # 1. Existing deterministic sliding windows & feature extraction (UNCHANGED)
    features = extract_and_record_features(txn)
    graph_flags = analyze_and_record_edge(txn)
    total_score, reasons = evaluate_rules(txn, features, graph_flags)

    # 2. STRICT GUARDRAIL: TrustLens ML Model as secondary additive signal.
    # Must ONLY be additive. Never replaces deterministic sliding windows or rules.
    # Wrapped in a strict try/except block with 20ms timeout.
    # Gracefully falls back to rule-based score without crashing on failure/lag.
    try:
        ml_result = predict_transaction(txn.receiver_vpa, timeout_ms=20.0)
        if ml_result and ml_result.get("flagged"):
            prob = ml_result.get("probability", 0.0)
            conf_suffix = f" ({int(prob * 100)}% conf)" if prob > 0 else ""
            reasons.append(
                ReasonItem(
                    code="TRUSTLENS_ML_ANOMALY",
                    weight=TRUSTLENS_ML_WEIGHT,
                    label=f"+{TRUSTLENS_ML_WEIGHT} TrustLens ML Anomaly{conf_suffix}",
                )
            )
            total_score = min(100, total_score + TRUSTLENS_ML_WEIGHT)
            reasons.sort(key=lambda r: r.weight, reverse=True)
    except Exception as exc:
        logger.warning(
            "TrustLens ML inference failed or timed out: %s. Falling back to rule-based score.",
            exc,
        )

    # 3. Decision resolution
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
