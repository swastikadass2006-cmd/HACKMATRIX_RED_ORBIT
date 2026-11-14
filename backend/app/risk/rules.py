from app.schemas import TransactionRequest, ReasonItem

RULE_WEIGHTS: dict[str, int] = {
    "SCREEN_SHARE": 50,
    "ACTIVE_CALL_NEW_PAYEE": 45,
    "MULE_FAN_IN_RECEIVER": 45,
    "MICRO_SPLIT": 40,
    "MULE_HOP_RECEIVER": 40,
    "VELOCITY_1M": 35,
    "AMOUNT_SPIKE_5X": 30,
    "NEW_DEVICE": 25,
    "GEO_MISMATCH": 20,
    "CLIPBOARD_PASTE_NEW_PAYEE": 15,
    "NEW_PAYEE": 10,
}

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

    if features["velocity_1m"] >= 2:
        add("VELOCITY_1M", f"Velocity spike ({features['velocity_1m'] + 1} txns in 60s)")

    if features["micro_split_count"] >= 1 and 4500.0 <= txn.amount < 5000.0:
        add("MICRO_SPLIT", "Structuring / micro-split under ₹5,000")

    if features["amount_ratio"] >= 5.0:
        add("AMOUNT_SPIKE_5X", f"Amount {features['amount_ratio']:.1f}x above user average")

    if features["is_new_device"]:
        add("NEW_DEVICE", f"Unseen device ({txn.device_id})")

    if features["is_geo_mismatch"]:
        add("GEO_MISMATCH", f"Geo mismatch ({txn.geo_city})")

    if txn.vpa_pasted_from_clipboard and features["is_new_payee"]:
        add("CLIPBOARD_PASTE_NEW_PAYEE", "New payee VPA pasted from clipboard")
    elif features["is_new_payee"]:
        add("NEW_PAYEE", "First-time transfer to payee")

    if graph_flags.get("is_fan_in"):
        add("MULE_FAN_IN_RECEIVER", f"Receiver fan-in ({graph_flags['fan_in_count']} senders in 5m)")

    if graph_flags.get("is_hop_chain"):
        add("MULE_HOP_RECEIVER", f"Rapid pass-through hop (<60s from {graph_flags['hop_origin']})")

    total_score = min(100, sum(r.weight for r in reasons))
    reasons.sort(key=lambda r: r.weight, reverse=True)
    return total_score, reasons