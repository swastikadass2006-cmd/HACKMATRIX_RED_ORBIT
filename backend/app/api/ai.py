
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any

from app.metrics.store import store
from app.ai.tasks import generate_advice
from app.ai.chat import ask_security_assistant, ChatRequest, ChatResponse

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/chat", response_model=ChatResponse)
async def chat_with_security_assistant(req: ChatRequest) -> ChatResponse:
    """
    Real-time interactive AI chatbot powered by Gemini and ShieldPay ThreatLens intelligence.
    Provides conversational fraud guidance, ML threat context explanation, and safety recommendations.
    """
    return await ask_security_assistant(req)


@router.get("/advice/{txn_id}")
async def get_transaction_advice(
    txn_id: str,
    lang: str = Query(
        "en",
        pattern="^(en|hi|bn)$",
        description="Language: en, hi, or bn"
    )
) -> Dict[str, Any]:

    # Fetch transaction details
    txn = store.get_transaction(txn_id)

    if not txn:
        raise HTTPException(
            status_code=404,
            detail=f"Transaction '{txn_id}' not found"
        )

    risk_score = txn.get("risk_score", 0)
    decision = txn.get("decision", "Approved")

    # Low-risk transactions do not require AI advice unless in Cooling Lock, Step-up, Guardian, or Blocked
    is_threat_state = decision.lower() in [
        "cooling lock", "cooling_lock", "step-up", "step_up", 
        "step_up_pending", "guardian", "guardian_pending", "blocked", "flagged"
    ]

    if risk_score < 40 and not is_threat_state:
        return {
            "txn_id": txn_id,
            "risk_score": risk_score,
            "decision": decision,
            "advice_required": False,
            "message": "Transaction is low risk. No safety warning needed.",
            "advice": None
        }

    # Extract risk reasons
    reasons = txn.get("reasons", txn.get("reason_codes", []))

    if not reasons:
        reasons = [
            f"Flagged by ShieldPay policy engine (Decision: {decision}, Risk Score: {risk_score})"
        ]

    # Generate AI advice using the existing Gemini task
    advice_payload = await generate_advice(txn_id, reasons, lang)

    return {
        "txn_id": txn_id,
        "risk_score": risk_score,
        "decision": txn.get("decision", "Flagged"),
        "advice_required": True,
        "advice": advice_payload["advice"]
    }
