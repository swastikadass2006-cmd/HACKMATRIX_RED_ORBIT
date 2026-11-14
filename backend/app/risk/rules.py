import re
from app.schemas import TransactionRequest, ReasonItem
from app.risk.ml_model import predict_fraud_probability

RULE_WEIGHTS: dict[str, int] = {
    "SCREEN_SHARE": 50,
    "ACTIVE_CALL_NEW_PAYEE": 45,
    "MULE_FAN_IN_RECEIVER": 45,
    "SPOOFED_PHISHING_VPA": 45,
    "MICRO_SPLIT": 40,
    "MULE_HOP_RECEIVER": 40,
    "IMPOSSIBLE_TRAVEL": 40,
    "TRUSTLENS_TYPOSQUAT_VPA": 45,
    "TRUSTLENS_HIGH_ENTROPY_VPA": 25,
    "VELOCITY_1M": 35,
    "AMOUNT_SPIKE_5X": 30,
    "NEW_DEVICE": 25,
    "ML_ANOMALY_HIGH": 20,
    "GEO_MISMATCH": 20,
    "CLIPBOARD_PASTE_NEW_PAYEE": 15,
    "NEW_PAYEE": 10,
}

_SAFE_TOKEN_RE = re.compile(r"[^a-zA-Z0-9_@.\-]")

def _sanitize(val: str, max_len: int = 24) -> str:
    cleaned = _SAFE_TOKEN_RE.sub("", str(val or ""))
    return cleaned[:max_len]

def get_rule_weights() -> dict[str, int]:
    return dict(RULE_WEIGHTS)

def evaluate_rules(
    txn: TransactionRequest,
    features: dict,
    graph_flags: dict,
) -> tuple[int, list[ReasonItem]]:
    reasons: list[ReasonItem] = []

    def add(code: str, desc: str) -> None:
        w = RULE_WEIGHTS[code]
        reasons.append(ReasonItem(code=code, weight=w, label=f"+{w} {desc}"))

    if txn.screen_share_detected:
        add("SCREEN_SHARE", "Screen sharing active during payment")

    if txn.is_on_active_call and features["is_new_payee"]:
        add("ACTIVE_CALL_NEW_PAYEE", "Active phone call + first-time payee")

    if features.get("is_spoofed_vpa"):
        add("SPOOFED_PHISHING_VPA", "Deceptive/impersonation keywords in receiver VPA")

    if features.get("is_impossible_travel"):
        safe_city = _sanitize(txn.geo_city)
        add("IMPOSSIBLE_TRAVEL", f"Impossible geo-velocity jump to {safe_city} (<30m)")
    elif features["is_geo_mismatch"]:
        safe_city = _sanitize(txn.geo_city)
        add("GEO_MISMATCH", f"Geo mismatch ({safe_city})")

    if features.get("is_typosquat"):
        brand = _sanitize(features.get("target_brand") or "brand")
        add("TRUSTLENS_TYPOSQUAT_VPA", f"TrustLens homograph/typosquat spoofing ({brand})")

    if features.get("is_high_entropy_burner"):
        ent = features.get("shannon_entropy", 0.0)
        add("TRUSTLENS_HIGH_ENTROPY_VPA", f"TrustLens high-entropy burner VPA ({ent:.2f} bits)")

    if features["velocity_1m"] >= 2:
        add("VELOCITY_1M", f"Velocity spike ({features['velocity_1m'] + 1} txns in 60s)")

    if features["micro_split_count"] >= 1 and 4500.0 <= txn.amount < 5000.0:
        add("MICRO_SPLIT", "Structuring / micro-split under ₹5,000")

    if features["amount_ratio"] >= 5.0:
        add("AMOUNT_SPIKE_5X", f"Amount {features['amount_ratio']:.1f}x above user average")

    if features["is_new_device"]:
        safe_dev = _sanitize(txn.device_id)
        add("NEW_DEVICE", f"Unseen device ({safe_dev})")

    if txn.vpa_pasted_from_clipboard and features["is_new_payee"]:
        add("CLIPBOARD_PASTE_NEW_PAYEE", "New payee VPA pasted from clipboard")
    elif features["is_new_payee"]:
        add("NEW_PAYEE", "First-time transfer to payee")

    if graph_flags.get("is_fan_in"):
        add("MULE_FAN_IN_RECEIVER", f"Receiver fan-in ({graph_flags['fan_in_count']} senders in 5m)")

    if graph_flags.get("is_hop_chain"):
        safe_origin = _sanitize(graph_flags.get("hop_origin", ""))
        add("MULE_HOP_RECEIVER", f"Rapid pass-through hop (<60s from {safe_origin})")

    # Hybrid ML Score Boost
    ml_prob = predict_fraud_probability(txn, features, graph_flags)
    has_hard_anomaly = (
        features["is_new_device"]
        or txn.vpa_pasted_from_clipboard
        or txn.is_on_active_call
        or features["velocity_1m"] >= 1
        or graph_flags.get("is_hop_chain")
    )
    if ml_prob >= 0.65 and has_hard_anomaly:
<<<<<<< HEAD
        add("ML_ANOMALY_HIGH", f"RandomForest anomaly confidence {int(ml_prob * 100)}%")
=======
        add("ML_ANOMALY_HIGH", f"TrustLens XGBoost anomaly confidence {int(ml_prob * 100)}%")
>>>>>>> p2-risk

    total_score = min(100, sum(r.weight for r in reasons))
    reasons.sort(key=lambda r: r.weight, reverse=True)
    return total_score, reasons