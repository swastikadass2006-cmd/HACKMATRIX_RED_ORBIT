from pathlib import Path
import joblib
import numpy as np
from app.schemas import TransactionRequest

MODEL_PATH = Path(__file__).resolve().parent / "artifacts" / "fraud_model.joblib"
_LOADED_BUNDLE = None

def _get_bundle():
    global _LOADED_BUNDLE
    if _LOADED_BUNDLE is None and MODEL_PATH.exists():
        _LOADED_BUNDLE = joblib.load(MODEL_PATH)
    return _LOADED_BUNDLE

def predict_fraud_probability(
    txn: TransactionRequest,
    features: dict,
    graph_flags: dict,
) -> float:
    """
    Returns continuous ML fraud probability in [0.0, 1.0].
    Uses underlying Cython tree predictors directly to avoid sklearn validation overhead (<0.1ms).
    """
    bundle = _get_bundle()
    if not bundle:
        return 0.0

    clf = bundle["model"]

    vec = np.array([[
        float(features.get("velocity_1m", 0)),
        float(features.get("velocity_10m", 0)),
        float(features.get("micro_split_count", 0)),
        float(features.get("amount_ratio", 1.0)),
        1.0 if features.get("is_new_payee") else 0.0,
        1.0 if features.get("is_new_device") else 0.0,
        1.0 if features.get("is_geo_mismatch") else 0.0,
        1.0 if txn.is_on_active_call else 0.0,
        1.0 if txn.screen_share_detected else 0.0,
        1.0 if txn.vpa_pasted_from_clipboard else 0.0,
        1.0 if graph_flags.get("is_fan_in") else 0.0,
        1.0 if graph_flags.get("is_hop_chain") else 0.0,
    ]], dtype=np.float32)

    prob_sum = 0.0
    for tree in clf.estimators_:
        leaf_probs = tree.tree_.value[tree.tree_.apply(vec)[0]][0]
        total = leaf_probs.sum()
        if total > 0:
            prob_sum += leaf_probs[1] / total

    return round(prob_sum / len(clf.estimators_), 4)
