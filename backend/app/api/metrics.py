from fastapi import APIRouter, Query
from app.metrics.store import store

router = APIRouter(tags=["metrics"])

@router.get("/metrics")
def get_kpi_metrics():
    return store.get_metrics()

@router.get("/analytics")
def get_analytics(timeframe: str = Query("24h", pattern="^(24h|7d|30d)$")):
    return store.get_analytics(timeframe=timeframe)

@router.get("/risk/distribution")
def get_risk_distribution():
    return store.get_risk_distribution()
