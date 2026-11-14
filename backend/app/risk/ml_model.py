import math
from pathlib import Path
import joblib
from app.schemas import TransactionRequest

MODEL_PATH = Path(__file__).resolve().parent / "artifacts" / "fraud_model.joblib"
_COMPILED_XGB_TREES = None


def _get_compiled_trees():
    global _COMPILED_XGB_TREES
    if _COMPILED_XGB_TREES is None and MODEL_PATH.exists():
        bundle = joblib.load(MODEL_PATH)
        _COMPILED_XGB_TREES = bundle.get("compiled_xgb_trees")
    return _COMPILED_XGB_TREES


def predict_fraud_probability(
    txn: TransactionRequest,
    features: dict,
    graph_flags: dict,
) -> float:
    """
    Evaluates the compiled TrustLens XGBoost gradient boosted trees in pure Python (<0.03ms).
    """
    trees = _get_compiled_trees()
    if not trees:
        return 0.0

    vec = (
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
    )

    margin = 0.0
    for tree in trees:
        node_idx = 0
        while True:
            yes_id, no_id, feat_idx, thresh, leaf_val = tree[node_idx]
            if feat_idx == -1:
                margin += leaf_val
                break
            node_idx = yes_id if vec[feat_idx] < thresh else no_id

    prob = 1.0 / (1.0 + math.exp(-margin))
    return round(prob, 4)
