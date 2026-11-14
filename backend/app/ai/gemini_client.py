import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from backend/.env or root .env
backend_dir = Path(__file__).resolve().parent.parent.parent
load_dotenv(backend_dir / ".env")
load_dotenv(backend_dir.parent / ".env")

from google import genai
from google.genai import types

from .models import ScamWarning
from .prompts import SYSTEM_PROMPT, build_user_prompt
from .fallback import template_warning

# Supported models: gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

def get_genai_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"[ShieldPay AI] Failed to initialize Gemini client: {e}")
        return None

async def scam_warning(reasons: list[str], lang: str = "en") -> dict:
    """
    Generates structured AI scam warning and practical safety advice.
    Safely falls back to pre-defined deterministic templates if the Gemini API key
    is missing, times out (>3s), or encounters any network/quota errors.
    """
    # Normalize language: English ('en'), Hindi ('hi'), Bengali ('bn')
    lang = lang.lower() if lang else "en"
    if lang not in ["en", "hi", "bn"]:
        lang = "en"

    # Sanitize reasons list
    safe_reasons = [str(r).strip() for r in reasons if r]
    if not safe_reasons:
        safe_reasons = ["Unusual transaction activity detected"]

    client = get_genai_client()
    if client is None:
        # Graceful fallback when API key is not configured
        return template_warning(safe_reasons, lang)

    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=MODEL,
                contents=build_user_prompt(safe_reasons, lang),
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_schema=ScamWarning,
                    temperature=0.2,
                )
            ),
            timeout=3.0
        )

        if response.parsed is None:
            raise ValueError("Gemini returned null parsed response")

        return response.parsed.model_dump()

    except Exception as error:
        print(f"[ShieldPay AI] Gemini fallback activated ({type(error).__name__}): {error}")
        return template_warning(safe_reasons, lang)
