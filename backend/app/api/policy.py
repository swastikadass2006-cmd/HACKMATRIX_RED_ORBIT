from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.risk.engine import risk_engine, PolicyConfig
from app.metrics.store import store, Alert
import datetime

router = APIRouter(prefix="/policy", tags=["policy"])

class PolicyUpdateRequest(BaseModel):
    block_threshold: int = Field(..., ge=0, le=100)
    step_up_threshold: int = Field(..., ge=0, le=100)

@router.get("", response_model=PolicyConfig)
def get_current_policy():
    return risk_engine.get_policy()

@router.post("", response_model=PolicyConfig)
def update_policy(payload: PolicyUpdateRequest):
    if payload.step_up_threshold > payload.block_threshold:
        raise HTTPException(
            status_code=400,
            detail="Step-up threshold cannot exceed block threshold"
        )
    updated = risk_engine.update_policy(
        block_threshold=payload.block_threshold,
        step_up_threshold=payload.step_up_threshold
    )
    store.add_alert(Alert(
        id=f"alt_policy_{int(datetime.datetime.now().timestamp())}",
        severity="info",
        title="Fraud Policy Thresholds Updated",
        description=f"Block threshold tuned to {payload.block_threshold}, Step-up threshold tuned to {payload.step_up_threshold}",
        timestamp=datetime.datetime.now().strftime("%I:%M %p")
    ))
    return updated
