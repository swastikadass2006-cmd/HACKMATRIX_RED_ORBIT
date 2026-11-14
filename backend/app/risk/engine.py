from typing import Dict, Any, List
from pydantic import BaseModel, Field

class PolicyConfig(BaseModel):
    block_threshold: int = Field(default=75, ge=0, le=100)
    step_up_threshold: int = Field(default=40, ge=0, le=100)

class RiskDecision(BaseModel):
    risk_score: int
    decision: str  # "Approved" | "Blocked" | "Step-up"
    classification: str # "Low Risk" | "Medium Risk" | "High Risk"
    reasons: List[str]
    metadata: Dict[str, Any]

class RiskEngine:
    def __init__(self, block_threshold: int = 75, step_up_threshold: int = 40):
        self.block_threshold = block_threshold
        self.step_up_threshold = step_up_threshold

    def get_policy(self) -> PolicyConfig:
        return PolicyConfig(
            block_threshold=self.block_threshold,
            step_up_threshold=self.step_up_threshold
        )

    def update_policy(self, block_threshold: int, step_up_threshold: int) -> PolicyConfig:
        if step_up_threshold > block_threshold:
            raise ValueError("Step-up threshold cannot exceed block threshold")
        self.block_threshold = block_threshold
        self.step_up_threshold = step_up_threshold
        return self.get_policy()

    def evaluate(
        self,
        amount: float,
        payer: str,
        payee: str,
        risk_score: int,
        scenario: str = "normal",
        metadata: Dict[str, Any] = None
    ) -> RiskDecision:
        if metadata is None:
            metadata = {}

        reasons = []
        if risk_score >= self.block_threshold:
            decision = "Blocked"
            classification = "High Risk"
        elif risk_score >= self.step_up_threshold:
            decision = "Step-up"
            classification = "Medium Risk"
        else:
            decision = "Approved"
            classification = "Low Risk"

        if scenario == "device_takeover":
            reasons.append("New hardware fingerprint detected alongside geo-velocity anomaly (>800km/h)")
            reasons.append("SIM change registered within preceding 2 hours")
        elif scenario == "micro_split":
            reasons.append("Rapid transaction bursts below ₹500 standard velocity guardrail")
            reasons.append("High-frequency automated pattern detected to evade single-cap alerts")
        elif scenario == "fan_in_hop":
            reasons.append("Multi-source aggregation into intermediary node with immediate outbound relay")
            reasons.append("Graph topology matches known digital mule cluster")
        elif scenario == "coercion":
            reasons.append("Active voice call concurrent with unexpected late-hour transfer")
            reasons.append("First-time recipient with biometric retry failure before PIN override")
        elif risk_score > 50:
            reasons.append("Unusual payee domain mismatch and non-standard transaction volume")
        else:
            reasons.append("Transaction characteristics match established payer behavior baseline")

        metadata.setdefault("network_latency_ms", 112)
        metadata.setdefault("device_os", "Android 14 (SELinux Enforcing)")
        metadata.setdefault("channel", "UPI 2.0 / IMPS Rail")

        return RiskDecision(
            risk_score=risk_score,
            decision=decision,
            classification=classification,
            reasons=reasons,
            metadata=metadata
        )

# Global engine instance
risk_engine = RiskEngine()
