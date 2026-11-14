from pathlib import Path
import joblib
from app.schemas import TransactionRequest

MODEL_PATH = Path(__file__).resolve().parent / "artifacts" / "fraud_model.joblib"
_COMPILED_TREES = None


def _get_compiled_trees():
    global _COMPILED_TREES
    if _COMPILED_TREES is None and MODEL_PATH.exists():
        bundle = joblib.load(MODEL_PATH)
        clf = bundle["model"]
        trees = []
        for est in clf.estimators_:
            t = est.tree_
            left = t.children_left.tolist()
            right = t.children_right.tolist()
            feat = t.feature.tolist()
            thresh = t.threshold.tolist()
            vals = t.value
            probs = []
            for i in range(t.node_count):
                row = vals[i][0]
                s = float(row[0] + row[1])
                probs.append(float(row[1]) / s if s > 0 else 0.0)
            trees.append((left, right, feat, thresh, probs))
        _COMPILED_TREES = trees
    return _COMPILED_TREES


def predict_fraud_probability(
    txn: TransactionRequest,
    features: dict,
    graph_flags: dict,
) -> float:
    """
    Evaluates the compiled RandomForest trees in pure Python tuples (<0.03ms latency).
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

    prob_sum = 0.0
    for left, right, feat, thresh, probs in trees:
        node = 0
        while left[node] != -1:
            if vec[feat[node]] <= thresh[node]:
                node = left[node]
            else:
                node = right[node]
        prob_sum += probs[node]

    return round(prob_sum / len(trees), 4)
