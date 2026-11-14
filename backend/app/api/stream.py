import asyncio
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.metrics.store import store

router = APIRouter(tags=["stream"])

async def sse_event_generator():
    queue = store.subscribe()
    try:
        # Initial connect event
        yield f"event: connected\ndata: {json.dumps({'message': 'ShieldPay SSE live feed active'})}\n\n"
        while True:
            try:
                # Wait up to 15 seconds for a new event or send keep-alive
                data = await asyncio.wait_for(queue.get(), timeout=15.0)
                yield f"event: transaction\ndata: {json.dumps(data)}\n\n"
            except asyncio.TimeoutError:
                # Heartbeat to keep connection alive
                yield f": heartbeat\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        store.unsubscribe(queue)

@router.get("/stream")
async def sse_stream():
    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*"
        }
    )
