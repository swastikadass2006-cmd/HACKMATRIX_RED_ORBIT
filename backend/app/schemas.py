from datetime import datetime
from typing import Literal, Optional

try:
    from pydantic import BaseModel
except ImportError:
    class BaseModel:
        def __init__(self, **kwargs):
            for cls in reversed(self.__class__.__mro__):
                for k, v in getattr(cls, "__dict__", {}).items():
                    if not k.startswith("_") and not callable(v):
                        setattr(self, k, v)
            for k, v in kwargs.items():
                setattr(self, k, v)
        def dict(self):
            return self.__dict__
        def model_dump(self):
            return self.__dict__

DecisionState = Literal[
    "APPROVED", "STEP_UP_PENDING", "GUARDIAN_PENDING", "COOLING_LOCK", "BLOCKED"
]

class TransactionRequest(BaseModel):
    txn_id: str
    idempotency_key: str
    sender_vpa: str
    receiver_vpa: str
    amount: float
    device_id: str
    geo_city: str
    timestamp: datetime
    is_on_active_call: bool = False
    screen_share_detected: bool = False
    vpa_pasted_from_clipboard: bool = False
    label_is_fraud: Optional[bool] = None

class ReasonItem(BaseModel):
    code: str
    weight: int
    label: str

class ScoreResult(BaseModel):
    score: int
    reasons: list[ReasonItem]
    decision: DecisionState
    latency_ms: float