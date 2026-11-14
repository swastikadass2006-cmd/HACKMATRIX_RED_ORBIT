from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime
from app.schemas import TransactionRequest

@dataclass
class UserProfile:
    avg_amount: float = 800.0
    txn_count: int = 5
    known_payees: set[str] = field(default_factory=set)
    known_devices: set[str] = field(default_factory=set)
    home_city: str = "Kolkata"
    is_guardian_enabled: bool = False

# In-memory feature store keyed by sender_vpa
USER_PROFILES: dict[str, UserProfile] = defaultdict(UserProfile)
TXN_TIMESTAMPS: dict[str, deque[datetime]] = defaultdict(deque)
RECENT_AMOUNTS: dict[str, deque[tuple[datetime, float]]] = defaultdict(deque)

def reset_risk_state() -> None:
    """Clears in-memory state (used by unit tests and simulator reset)."""
    USER_PROFILES.clear()
    TXN_TIMESTAMPS.clear()
    RECENT_AMOUNTS.clear()

def seed_user_profile(
    sender_vpa: str,
    avg_amount: float = 800.0,
    known_payees: list[str] | None = None,
    known_devices: list[str] | None = None,
    home_city: str = "Kolkata",
    is_guardian_enabled: bool = False,
) -> None:
    """Helper for P3's simulator to register baseline user profiles."""
    USER_PROFILES[sender_vpa] = UserProfile(
        avg_amount=avg_amount,
        txn_count=10,
        known_payees=set(known_payees or []),
        known_devices=set(known_devices or []),
        home_city=home_city,
        is_guardian_enabled=is_guardian_enabled,
    )

def extract_and_record_features(txn: TransactionRequest) -> dict:
    now = txn.timestamp
    sender = txn.sender_vpa
    profile = USER_PROFILES[sender]

    ts_q = TXN_TIMESTAMPS[sender]
    amt_q = RECENT_AMOUNTS[sender]

    # Evict entries older than 10 minutes (600 seconds)
    while ts_q and (now - ts_q[0]).total_seconds() > 600:
        ts_q.popleft()
    while amt_q and (now - amt_q[0][0]).total_seconds() > 600:
        amt_q.popleft()

    # Compute sliding window features BEFORE appending current txn
    velocity_1m = sum(1 for t in ts_q if (now - t).total_seconds() <= 60)
    velocity_10m = len(ts_q)
    micro_split_count = sum(
        1 for t, a in amt_q
        if (now - t).total_seconds() <= 300 and 4500.0 <= a < 5000.0
    )

    amount_ratio = txn.amount / max(profile.avg_amount, 100.0)
    is_new_payee = txn.receiver_vpa not in profile.known_payees
    is_new_device = (len(profile.known_devices) > 0) and (txn.device_id not in profile.known_devices)
    is_geo_mismatch = bool(profile.home_city) and (txn.geo_city != profile.home_city)

    # Record current transaction in sliding windows
    ts_q.append(now)
    amt_q.append((now, txn.amount))

    # First-seen device becomes baseline if profile had no devices yet
    if len(profile.known_devices) == 0:
        profile.known_devices.add(txn.device_id)

    return {
        "velocity_1m": velocity_1m,
        "velocity_10m": velocity_10m,
        "micro_split_count": micro_split_count,
        "amount_ratio": amount_ratio,
        "is_new_payee": is_new_payee,
        "is_new_device": is_new_device,
        "is_geo_mismatch": is_geo_mismatch,
        "is_guardian_enabled": profile.is_guardian_enabled,
    }