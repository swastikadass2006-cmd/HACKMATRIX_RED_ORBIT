from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.metrics.store import store

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.get("")
def list_transactions(
    search: Optional[str] = Query(None, description="Search by Transaction ID or UPI"),
    status: Optional[str] = Query("all", description="Filter by decision status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    return store.get_transactions(search=search, status=status, page=page, limit=limit)

@router.get("/{txn_id}")
def get_transaction_details(txn_id: str):
    txn = store.get_transaction(txn_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn
