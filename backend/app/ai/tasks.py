import asyncio

from .gemini_client import scam_warning

semaphore = asyncio.Semaphore(3)

cache = {}


async def generate_advice(txn_id, reasons, lang="en"):

    key = (tuple(sorted(reasons)), lang)

    if key in cache:
        return cache[key]

    async with semaphore:

        result = await scam_warning(reasons, lang)

    cache[key] = result

    return {
        "txn_id": txn_id,
        "advice": result
    }