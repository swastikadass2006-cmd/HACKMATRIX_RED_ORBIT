import os
import asyncio

from google import genai
from google.genai import types

from .models import ScamWarning
from .prompts import SYSTEM_PROMPT, build_user_prompt
from .fallback import template_warning

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")


async def scam_warning(reasons, lang="en"):

    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=MODEL,
                contents=build_user_prompt(reasons, lang),
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_schema=ScamWarning,
                    temperature=0.3,
                )
            ),
            timeout=3.0
        )

        if response.parsed is None:
            raise ValueError("Gemini returned no parsed warning")

        return response.parsed.model_dump()

    except Exception as error:
        print("Gemini fallback activated:", type(error).__name__)
        return template_warning(reasons, lang)