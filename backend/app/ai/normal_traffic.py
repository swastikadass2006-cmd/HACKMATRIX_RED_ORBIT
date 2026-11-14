import random
from datetime import datetime, timezone

def generate_normal_transaction(users):

    sender = random.choice(users)

    receiver = random.choice(users)

    while receiver["user_id"] == sender["user_id"]:
        receiver = random.choice(users)

    return {
        "sender_vpa": sender["vpa"],
        "receiver_vpa": receiver["vpa"],
        "amount": random.randint(100, 2000),
        "device_id": sender["known_devices"][0],
        "geo_city": "Kolkata",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "is_on_active_call": False,
        "screen_share_detected": False,
        "vpa_pasted_from_clipboard": False,
        "label_is_fraud": False
    }