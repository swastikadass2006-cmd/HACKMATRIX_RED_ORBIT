from fastapi import APIRouter
from app.metrics.store import store

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("")
def get_alerts():
    return store.get_alerts()
