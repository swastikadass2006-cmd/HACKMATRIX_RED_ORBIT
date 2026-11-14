from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any

from app.metrics.store import store
from app.ai.tasks import generate_advice

router = APIRouter(prefix="/ai", tags=["ai"])

@router.get("/advice/{txn_id}")
async def get_transaction_advice(
    txn_id: str,
    lang: str = Query("en", description="Language code: 'en' (English), 'hi' (Hindi), or 'bn' (Bengali)")
) -> Dict[str, Any]:
    """
    Returns AI-generated scam warnings and consumer safety advice for a transaction.
    - Low-risk transactions (<40 risk score) bypass AI advice generation to conserve resources.
    - High-risk transactions (>40) receive structured safety instructions in English, Hindi, or Bengali.
    - Automatically falls back to localized templates if Gemini is unreachable.
    """
    txn = store.get_transaction(txn_id)
    if not txn:
        raise HTTPException(
            status_code=404,
            detail=f"Transaction '{txn_id}' not found"
        )

    risk_score = txn.get("risk_score", 0)

    # Rule: Avoid generating unnecessary AI advice for transactions with risk scores below 40
    if risk_score < 40:
        return {
            "txn_id": txn_id,
            "risk_score": risk_score,
            "decision": txn.get("decision", "Approved"),
            "advice_required": False,
            "message": "Transaction is low risk. No safety warning needed.",
            "advice": None
        }

    # Extract risk reasons or provide a default reason code
    reasons = txn.get("reasons", [])
    if not reasons:
        reasons = [f"Flagged by ShieldPay policy engine (Risk Score: {risk_score})"]

    # Generate or fetch cached advice
    advice_payload = await generate_advice(txn_id, reasons, lang)

    return {
        "txn_id": txn_id,
        "risk_score": risk_score,
        "decision": txn.get("decision", "Flagged"),
        "advice_required": True,
        "advice": advice_payload["advice"]
    }
