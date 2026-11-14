import os
import asyncio
import logging
from typing import List, Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel

backend_dir = Path(__file__).resolve().parent.parent.parent
load_dotenv(backend_dir / ".env")
load_dotenv(backend_dir.parent / ".env")

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are ShieldPay & TrustLens AI Security Assistant, an elite FinTech cybersecurity and anti-fraud expert.
ShieldPay is a next-generation UPI payment security platform powered by TrustLens ML (XGBoost classifiers, SHAP interpretability, and real-time DOM/URL inspection).

Your mission:
1. Explain suspicious URLs, phishing indicators, brand spoofing/typosquatting, and payment coercion risks in plain, helpful language.
2. If given TrustLens ML context (Risk Score, XGBoost confidence, Brand Impersonation alerts, SHAP top features), reference those specific factors to explain WHY the target is dangerous or safe.
3. Guide users through ShieldPay security features: Remorse Cooling Locks, Guardian Mode co-sign, Step-Up biometric checks, and UPI Intent verification.
4. CRITICAL SAFETY GUARDRAILS:
   - NEVER ask for or store UPI PINs, CVV, OTPs, or passwords.
   - Emphasize that receiving money on UPI NEVER requires entering a PIN.
   - If a user pastes sensitive credentials, warn them immediately.
5. Format your responses with clean Markdown, concise bullet points, and actionable advice.
"""

SUGGESTED_PROMPTS = [
    "Why was this link flagged by TrustLens?",
    "How does the 20-second Cooling Lock protect me?",
    "What are common UPI payment scam signs?",
    "How does Guardian Mode protect elderly users?"
]

class ChatMessage(BaseModel):
    role: str  # "user" | "model" | "assistant"
    content: str

class ThreatContext(BaseModel):
    url: Optional[str] = None
    risk_score: Optional[float] = None
    verdict: Optional[str] = None
    confidence: Optional[float] = None
    is_impersonating: Optional[bool] = None
    target_brand: Optional[str] = None
    reasons: Optional[List[str]] = None
    top_shap_factors: Optional[List[Dict[str, Any]]] = None

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    context: Optional[ThreatContext] = None
    lang: Optional[str] = "en"

class ChatResponse(BaseModel):
    response: str
    model: str
    is_fallback: bool
    suggestions: List[str]

def _generate_heuristic_fallback(message: str, context: Optional[ThreatContext], lang: str) -> str:
    """Deterministic, domain-aware security response when Gemini API is unavailable or rate-limited."""
    msg = message.lower()
    
    if context and context.url:
        verdict = context.verdict or ("MALICIOUS" if (context.risk_score or 0) > 60 else "BENIGN")
        brand_note = f"⚠️ **Brand Impersonation Warning**: Spoofing {context.target_brand}.\n" if context.is_impersonating else ""
        
        reasons_list = ""
        if context.reasons:
            reasons_list = "\n".join([f"- {r}" for r in context.reasons[:4]])
        elif context.top_shap_factors:
            reasons_list = "\n".join([f"- {f.get('feature')}: weight {f.get('shap_value')}" for f in context.top_shap_factors[:3]])
        else:
            reasons_list = "- High entropy / suspicious structure detected by XGBoost model."

        return (
            f"### 🛡️ TrustLens AI Threat Analysis\n\n"
            f"**Target URL:** `{context.url}`\n"
            f"**Model Verdict:** `{verdict}` (Risk Score: **{context.risk_score or 0}/100**)\n\n"
            f"{brand_note}"
            f"**Identified Risk Indicators:**\n{reasons_list}\n\n"
            f"**ShieldPay Security Protocol:**\n"
            f"1. **Do not click or enter bank credentials**: Fake login forms attempt credential theft.\n"
            f"2. **Remember**: Receiving money on UPI NEVER requires entering a UPI PIN.\n"
            f"3. ShieldPay's proactive **Cooling Lock** and **Guardian Mode** prevent unverified transfers."
        )

    if any(k in msg for k in ["pin", "otp", "password", "cvv"]):
        return (
            "### 🔒 ShieldPay Security Notice: Never Share Your PIN\n\n"
            "- **Rule #1 of UPI**: A UPI PIN is ONLY entered to **deduct** money from your account, never to receive money.\n"
            "- Anyone claiming you must enter your PIN to accept a lottery, cashback, or refund is attempting fraud.\n"
            "- ShieldPay agents and automated security systems will NEVER ask for your 4 or 6 digit UPI PIN or OTP."
        )

    if any(k in msg for k in ["cooling", "remorse", "lock", "countdown", "cancel"]):
        return (
            "### ⏱️ ShieldPay 20-Second Cooling Lock\n\n"
            "When high-risk signals or coerced urgency are detected, ShieldPay engages a **20-second Cooling Remorse Window**:\n"
            "- **Atomic Escrow Hold**: The transaction is paused at the payment rail before final settlement.\n"
            "- **Remorse Cancellation**: You can cancel the transaction with a single tap to immediately recover funds.\n"
            "- **Scam Coach**: Live security coaching explains the detected risk factors in real time."
        )

    if any(k in msg for k in ["guardian", "inclusion", "elderly"]):
        return (
            "### 👥 Guardian Mode (Financial Inclusion)\n\n"
            "Guardian Mode protects vulnerable, first-time, or elderly digital payment users:\n"
            "- Transactions exceeding personalized baselines or showing pressure patterns require trusted co-sign approval.\n"
            "- Guardians receive instant notifications with transaction details and the TrustLens risk score.\n"
            "- Protects against remote-access app extortion and social engineering."
        )

    return (
        "### 🛡️ ShieldPay AI Security Sentinel\n\n"
        "I am monitoring your payment rails with TrustLens ML and ShieldPay 5-Tier risk defenses.\n\n"
        "- **URL Threat Scanner**: Paste any suspicious payment link or web page to run our 26-feature XGBoost & SHAP analysis.\n"
        "- **Transaction Defense**: Every transfer is checked for velocity spikes, geolocation anomalies, and brand spoofing.\n"
        "- **Safe Payments**: Never approve collect requests or enter UPI PINs for unknown callers.\n\n"
        "How can I assist you with threat analysis or payment safety today?"
    )

async def ask_security_assistant(req: ChatRequest) -> ChatResponse:
    """
    Communicates with Google GenAI SDK using gemini-3.5-flash-lite / gemini-3.5-flash
    with sub-2s responses and a deterministic fallback if the API fails or times out.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    configured_model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    # If legacy model configured in env, upgrade to supported fast model
    if configured_model in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]:
        configured_model = "gemini-3.5-flash-lite"

    if not api_key:
        fallback_text = _generate_heuristic_fallback(req.message, req.context, req.lang or "en")
        return ChatResponse(
            response=fallback_text,
            model="shieldpay-heuristic-sentinel",
            is_fallback=True,
            suggestions=SUGGESTED_PROMPTS
        )

    # Build context string
    context_str = ""
    if req.context and req.context.url:
        context_str = (
            f"\n[ACTIVE TRUSTLENS ML THREAT CONTEXT]\n"
            f"- Scanned URL: {req.context.url}\n"
            f"- Risk Score: {req.context.risk_score}/100\n"
            f"- ML Verdict: {req.context.verdict}\n"
            f"- XGBoost Confidence: {req.context.confidence}\n"
            f"- Brand Impersonation: {req.context.is_impersonating} (Target: {req.context.target_brand})\n"
        )
        if req.context.reasons:
            context_str += f"- Risk Reasons: {', '.join(req.context.reasons)}\n"
        if req.context.top_shap_factors:
            context_str += f"- Top SHAP Factors: {req.context.top_shap_factors}\n"

    # Assemble conversation contents for GenAI SDK
    system_instruction = SYSTEM_PROMPT + context_str

    # Candidate models in order of speed and stability
    models_to_try = [configured_model, "gemini-3.5-flash-lite", "gemini-3.5-flash"]
    # De-duplicate while preserving order
    seen = set()
    candidate_models = [m for m in models_to_try if not (m in seen or seen.add(m))]

    client = None
    try:
        client = genai.Client(api_key=api_key)
    except Exception as e:
        logger.warning(f"Failed to create GenAI client: {e}")
        fallback_text = _generate_heuristic_fallback(req.message, req.context, req.lang or "en")
        return ChatResponse(
            response=fallback_text,
            model="shieldpay-heuristic-sentinel",
            is_fallback=True,
            suggestions=SUGGESTED_PROMPTS
        )

    # Convert history into prompt contents
    contents_list = []
    for h in (req.history or []):
        role_label = "user" if h.role == "user" else "model"
        contents_list.append(types.Content(
            role=role_label,
            parts=[types.Part.from_text(text=h.content)]
        ))
    
    # Append latest user message
    contents_list.append(types.Content(
        role="user",
        parts=[types.Part.from_text(text=req.message)]
    ))

    for model_name in candidate_models:
        try:
            resp = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=model_name,
                    contents=contents_list,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.3,
                        max_output_tokens=600,
                    )
                ),
                timeout=4.5
            )
            if resp and resp.text:
                return ChatResponse(
                    response=resp.text.strip(),
                    model=model_name,
                    is_fallback=False,
                    suggestions=SUGGESTED_PROMPTS
                )
        except Exception as err:
            logger.warning(f"GenAI error on model {model_name}: {err}")
            continue

    # All API attempts timed out or failed -> execute graceful fallback
    fallback_text = _generate_heuristic_fallback(req.message, req.context, req.lang or "en")
    return ChatResponse(
        response=fallback_text,
        model="shieldpay-offline-sentinel",
        is_fallback=True,
        suggestions=SUGGESTED_PROMPTS
    )
