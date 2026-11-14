from datetime import datetime, timezone

def create_attack(users, attack_type):

    sender = users[0]
    receiver = users[-1]

    txn = {
        "sender_vpa": sender["vpa"],
        "receiver_vpa": receiver["vpa"],
        "amount": 4900,
        "device_id": sender["known_devices"][0],
        "geo_city": "Kolkata",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "is_on_active_call": False,
        "screen_share_detected": False,
        "vpa_pasted_from_clipboard": False,
        "label_is_fraud": True
    }

    if attack_type == "micro_split":
        txn["amount"] = 4900

    elif attack_type == "device_takeover":
        txn["device_id"] = "unknown_device_999"
        txn["geo_city"] = "Mumbai"

    elif attack_type == "fan_in":
        txn["amount"] = 15000

    elif attack_type == "coercion":
        txn["is_on_active_call"] = True
        txn["vpa_pasted_from_clipboard"] = True

    else:
        raise ValueError("Unknown attack type")

    return txn