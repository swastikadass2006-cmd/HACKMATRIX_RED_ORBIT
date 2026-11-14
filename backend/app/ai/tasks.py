import asyncio
from typing import List, Dict, Any

from .gemini_client import scam_warning

# Concurrency control: maximum 3 simultaneous Gemini calls
semaphore = asyncio.Semaphore(3)

# In-memory cache keyed by (sorted reason tuple, language code)
cache: Dict[tuple, Dict[str, Any]] = {}

async def generate_advice(txn_id: str, reasons: List[str], lang: str = "en") -> Dict[str, Any]:
    """
    Coordinates advice generation with concurrency limiting (max 3)
    and caching to minimize latency and token consumption.
    """
    key = (tuple(sorted(reasons)), lang.lower())

    if key in cache:
        advice_content = cache[key]
    else:
        async with semaphore:
            advice_content = await scam_warning(reasons, lang)
        cache[key] = advice_content

    return {
        "txn_id": txn_id,
        "advice": advice_content
    }
