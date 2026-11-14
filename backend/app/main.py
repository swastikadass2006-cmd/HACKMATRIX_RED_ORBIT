import asyncio
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.transactions import router as transactions_router
from app.api.metrics import router as metrics_router
from app.api.policy import router as policy_router
from app.api.simulator import router as simulator_router
from app.api.stream import router as stream_router
from app.api.alerts import router as alerts_router
from app.api.ai import router as ai_router
from app.api.threat import router as threat_router
from app.risk.scorer import score as evaluate_transaction_risk
from app.risk.trustlens_inference import load_trustlens_model
from app.schemas import TransactionRequest
from simulator.scenarios import generate_simulated_event

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="ShieldPay Financial Risk & Payment Operations API"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api
app.include_router(transactions_router, prefix=settings.api_prefix)
app.include_router(metrics_router, prefix=settings.api_prefix)
app.include_router(policy_router, prefix=settings.api_prefix)
app.include_router(simulator_router, prefix=settings.api_prefix)
app.include_router(alerts_router, prefix=settings.api_prefix)
app.include_router(ai_router, prefix=settings.api_prefix)
app.include_router(threat_router, prefix=settings.api_prefix)

# Stream router available at both /api/stream and /stream for convenience
app.include_router(stream_router, prefix=settings.api_prefix)
app.include_router(stream_router)

@app.get("/")
@app.head("/")
@app.get("/api/health")
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "shieldpay-backend",
        "version": settings.version,
        "docs_url": "/docs"
    }

@app.post("/score")
@app.post("/api/score")
def score_transaction(payload: dict):
    """
    Risk scoring endpoint called by the Rust backend's RiskBridge.
    Evaluates rule engine + additive TrustLens ML secondary signal.
    """
    from datetime import datetime, timezone
    data = dict(payload)
    if "idempotency_key" not in data:
        data["idempotency_key"] = data.get("txn_id", "00000000-0000-0000-0000-000000000000")
    if "timestamp" not in data:
        data["timestamp"] = datetime.now(timezone.utc).isoformat()

    txn = TransactionRequest(**data)
    res = evaluate_transaction_risk(txn)

    # Decision mapping matching Rust core::schemas::RiskDecision SCREAMING_SNAKE_CASE
    decision_map = {
        "APPROVED": "APPROVE",
        "STEP_UP_PENDING": "STEP_UP",
        "GUARDIAN_PENDING": "GUARDIAN",
        "COOLING_LOCK": "COOLING_LOCK",
        "BLOCKED": "BLOCK",
    }

    # Record into metrics store so live feed and Gemini advice endpoint have transaction context
    try:
        from app.metrics.store import store, Transaction
        decision_label = {
            "APPROVED": "Approved",
            "STEP_UP_PENDING": "Step-up",
            "GUARDIAN_PENDING": "Guardian",
            "COOLING_LOCK": "Cooling Lock",
            "BLOCKED": "Blocked",
        }.get(res.decision, "Approved")

        store.add_transaction(Transaction(
            id=str(txn.txn_id),
            timestamp=datetime.now(timezone.utc).strftime("%I:%M:%S %p"),
            payer=txn.sender_vpa,
            payee=txn.receiver_vpa,
            amount=txn.amount,
            risk_score=int(res.score),
            decision=decision_label,
            classification="High Risk" if res.score > 75 else "Medium Risk" if res.score >= 40 else "Low Risk",
            reasons=[r.label for r in res.reasons],
            metadata={
                "device_id": txn.device_id,
                "geo_city": txn.geo_city,
                "latency_ms": res.latency_ms,
                "upi_provider": "UPI 2.0 Rails",
                "is_on_active_call": txn.is_on_active_call,
                "screen_share_detected": txn.screen_share_detected,
                "vpa_pasted_from_clipboard": txn.vpa_pasted_from_clipboard,
            }
        ))
    except Exception as store_err:
        pass

    return {
        "score": round(res.score / 100.0, 4),
        "raw_score": res.score,
        "decision": decision_map.get(res.decision, "APPROVE"),
        "reasons": [r.label for r in res.reasons],
        "latency_ms": res.latency_ms,
    }

# Background task for gentle periodic live simulation
async def periodic_traffic():
    await asyncio.sleep(10)
    while True:
        try:
            # Generate occasional background normal traffic
            generate_simulated_event("normal_traffic")
        except Exception:
            pass
        await asyncio.sleep(40)

@app.on_event("startup")
async def on_startup():
    # Load TrustLens XGBoost model efficiently at startup (do NOT load per-request)
    load_trustlens_model()
    asyncio.create_task(periodic_traffic())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
