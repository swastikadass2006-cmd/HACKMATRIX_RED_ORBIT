import asyncio
import datetime
import random
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.risk.engine import risk_engine, RiskDecision

class Transaction(BaseModel):
    id: str
    timestamp: str
    payer: str
    payee: str
    amount: float
    risk_score: int
    decision: str
    classification: str
    reasons: List[str] = []
    metadata: Dict[str, Any] = {}

class Alert(BaseModel):
    id: str
    severity: str  # "high" | "warning" | "info"
    title: str
    description: str
    timestamp: str

class Store:
    def __init__(self):
        self._subscribers: List[asyncio.Queue] = []
        self._transactions: List[Transaction] = []
        self._alerts: List[Alert] = []
        self._seed_data()

    def _seed_data(self):
        # Image 2 reference transactions exactly as shown
        seed_txns = [
            {
                "id": "txn_73921",
                "timestamp": "10:42:17 AM",
                "payer": "rah***@okaxis",
                "payee": "shop@ybl",
                "amount": 4900.0,
                "risk_score": 12,
                "decision": "Approved",
                "classification": "Low Risk",
                "reasons": ["Standard merchant payment within regular operating hours", "Valid UPI biometric confirmation"],
                "metadata": {"ip": "103.21.244.18", "device_os": "Android 14", "latency_ms": 118, "upi_provider": "Axis Bank"}
            },
            {
                "id": "txn_73920",
                "timestamp": "10:41:53 AM",
                "payer": "sne***@okaxis",
                "payee": "food@ybl",
                "amount": 2300.0,
                "risk_score": 92,
                "decision": "Blocked",
                "classification": "High Risk",
                "reasons": ["Device takeover indicator: device change within 2 hours", "Concurrent active GSM voice call detected"],
                "metadata": {"ip": "45.112.89.12", "device_os": "Android 12", "latency_ms": 142, "upi_provider": "Yes Bank"}
            },
            {
                "id": "txn_73919",
                "timestamp": "10:41:20 AM",
                "payer": "arj***@okaxis",
                "payee": "mart@ybl",
                "amount": 8500.0,
                "risk_score": 67,
                "decision": "Step-up",
                "classification": "Medium Risk",
                "reasons": ["Payee account created < 24h ago", "Transaction velocity 3x standard baseline"],
                "metadata": {"ip": "157.34.19.45", "device_os": "iOS 17.5", "latency_ms": 129, "upi_provider": "ICICI Bank"}
            },
            {
                "id": "txn_73918",
                "timestamp": "10:40:47 AM",
                "payer": "dee***@okaxis",
                "payee": "bill@ybl",
                "amount": 1250.0,
                "risk_score": 18,
                "decision": "Approved",
                "classification": "Low Risk",
                "reasons": ["Utility bill settlement matches recurring profile", "Standard geo-location fingerprint"],
                "metadata": {"ip": "103.45.12.80", "device_os": "iOS 18.0", "latency_ms": 105, "upi_provider": "HDFC Bank"}
            },
            {
                "id": "txn_73917",
                "timestamp": "10:40:12 AM",
                "payer": "ami***@okaxis",
                "payee": "store@ybl",
                "amount": 3700.0,
                "risk_score": 20,
                "decision": "Approved",
                "classification": "Low Risk",
                "reasons": ["Established local merchant payment", "Clean security reputation token"],
                "metadata": {"ip": "49.36.128.91", "device_os": "Android 14", "latency_ms": 115, "upi_provider": "SBI UPI"}
            },
            {
                "id": "txn_73916",
                "timestamp": "10:39:44 AM",
                "payer": "vik***@okhdfc",
                "payee": "pay@paytm",
                "amount": 15400.0,
                "risk_score": 88,
                "decision": "Blocked",
                "classification": "High Risk",
                "reasons": ["High-value transfer to unverified VPA address", "SIM swapping detected within 24hr window"],
                "metadata": {"ip": "115.111.45.20", "device_os": "Android 13", "latency_ms": 136, "upi_provider": "HDFC Bank"}
            },
            {
                "id": "txn_73915",
                "timestamp": "10:38:59 AM",
                "payer": "pri***@okicici",
                "payee": "quickbuy@ibl",
                "amount": 450.0,
                "risk_score": 62,
                "decision": "Step-up",
                "classification": "Medium Risk",
                "reasons": ["Rapid micro-split velocity sequence #4", "Unusual recipient handle domain"],
                "metadata": {"ip": "182.73.19.11", "device_os": "Android 14", "latency_ms": 124, "upi_provider": "ICICI Bank"}
            },
            {
                "id": "txn_73914",
                "timestamp": "10:37:30 AM",
                "payer": "kav***@oksbi",
                "payee": "rent@okaxis",
                "amount": 22000.0,
                "risk_score": 15,
                "decision": "Approved",
                "classification": "Low Risk",
                "reasons": ["Monthly scheduled house rent transfer", "Recipient in approved contact list > 6 months"],
                "metadata": {"ip": "122.161.45.9", "device_os": "iOS 17.4", "latency_ms": 109, "upi_provider": "SBI"}
            },
            {
                "id": "txn_73913",
                "timestamp": "10:36:12 AM",
                "payer": "tan***@okhdfc",
                "payee": "crypto_desk@ybl",
                "amount": 49999.0,
                "risk_score": 96,
                "decision": "Blocked",
                "classification": "High Risk",
                "reasons": ["Known mule account destination flagged by NPCI", "Device root jailbreak detected"],
                "metadata": {"ip": "103.22.11.89", "device_os": "Rooted Android 11", "latency_ms": 150, "upi_provider": "HDFC Bank"}
            },
            {
                "id": "txn_73912",
                "timestamp": "10:35:01 AM",
                "payer": "roh***@okaxis",
                "payee": "cafe@icici",
                "amount": 320.0,
                "risk_score": 8,
                "decision": "Approved",
                "classification": "Low Risk",
                "reasons": ["Frequent QR scan merchant location", "Normal behavioural biometrics"],
                "metadata": {"ip": "157.48.22.10", "device_os": "Android 14", "latency_ms": 102, "upi_provider": "Axis Bank"}
            }
        ]

        for item in seed_txns:
            self._transactions.append(Transaction(**item))

        self._alerts = [
            Alert(
                id="alt_1",
                severity="high",
                title="First-time payee detected with active call",
                description="Coercion indicator: Active GSM audio stream during ₹2,300 transfer to food@ybl",
                timestamp="10:41 AM"
            ),
            Alert(
                id="alt_2",
                severity="warning",
                title="Micro-split burst pattern detected",
                description="4 transactions < ₹500 within 45 seconds from single device fingerprint",
                timestamp="10:38 AM"
            ),
            Alert(
                id="alt_3",
                severity="high",
                title="Blacklisted digital mule destination",
                description="NPCI high-risk account hit for txn_73913 (₹49,999.00)",
                timestamp="10:36 AM"
            ),
            Alert(
                id="alt_4",
                severity="info",
                title="Dynamic threshold policy synchronized",
                description="Block threshold set to 75, Step-up threshold set to 40",
                timestamp="10:15 AM"
            )
        ]

    def get_transactions(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict[str, Any]:
        filtered = self._transactions
        if search:
            q = search.lower()
            filtered = [
                t for t in filtered
                if q in t.id.lower() or q in t.payer.lower() or q in t.payee.lower()
            ]
        if status and status.lower() != "all":
            filtered = [
                t for t in filtered
                if t.decision.lower() == status.lower()
            ]

        total = len(filtered)
        start = (page - 1) * limit
        end = start + limit
        paginated = filtered[start:end]

        return {
            "transactions": [t.dict() for t in paginated],
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": max(1, (total + limit - 1) // limit)
        }

    def get_transaction(self, txn_id: str) -> Optional[Dict[str, Any]]:
        for t in self._transactions:
            if t.id == txn_id:
                return t.dict()
        return None

    def add_transaction(self, txn: Transaction):
        self._transactions.insert(0, txn)
        # Broadcast to SSE queues
        for queue in list(self._subscribers):
            try:
                queue.put_nowait(txn.dict())
            except Exception:
                pass

    def add_alert(self, alert: Alert):
        self._alerts.insert(0, alert)

    def get_alerts(self, limit: int = 5) -> List[Dict[str, Any]]:
        return [a.dict() for a in self._alerts[:limit]]

    def get_metrics(self) -> Dict[str, Any]:
        total_count = len(self._transactions)
        flagged_count = sum(1 for t in self._transactions if t.decision in ["Blocked", "Step-up"])
        blocked_amount = sum(t.amount for t in self._transactions if t.decision == "Blocked")
        blocked_in_lakhs = round(blocked_amount / 100000.0 + 4.82, 2)

        return {
            "transactions_today": {
                "value": 24780 + total_count - 10,
                "change_percent": 12.5,
                "trend": "up",
                "sparkline": [22100, 22800, 23400, 23900, 24200, 24500, 24780]
            },
            "flagged_for_review": {
                "value": 126 + (flagged_count - 4),
                "change_percent": 8.2,
                "trend": "up",
                "sparkline": [110, 114, 118, 122, 119, 123, 126]
            },
            "fraud_blocked": {
                "value_formatted": f"₹{blocked_in_lakhs:.2f}L",
                "value_inr": blocked_in_lakhs * 100000,
                "change_percent": 18.7,
                "trend": "up",
                "sparkline": [3.9, 4.1, 4.25, 4.4, 4.6, 4.75, blocked_in_lakhs]
            },
            "avg_scoring_latency": {
                "value_ms": 128,
                "value_formatted": "128 ms",
                "change_percent": -21.3,
                "trend": "down",
                "sparkline": [165, 154, 148, 138, 132, 130, 128]
            }
        }

    def get_analytics(self, timeframe: str = "24h") -> Dict[str, Any]:
        if timeframe == "7d":
            labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            successful = [18400, 21200, 22600, 24100, 25800, 23200, 24780]
            flagged = [950, 1100, 1050, 1200, 1350, 1150, 1260]
        elif timeframe == "30d":
            labels = ["Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30"]
            successful = [19200, 20800, 22100, 23500, 24100, 24780]
            flagged = [1020, 1180, 1140, 1280, 1210, 1260]
        else: # 24h
            labels = ["12AM", "4AM", "8AM", "12PM", "4PM", "8PM", "12AM"]
            successful = [4800, 3900, 8900, 6800, 8200, 12600, 7800]
            flagged = [620, 580, 710, 840, 920, 1150, 780]

        return {
            "timeframe": timeframe,
            "labels": labels,
            "series": [
                {
                    "name": "Successful",
                    "color": "#5541E8",
                    "data": successful
                },
                {
                    "name": "Flagged",
                    "color": "#E84658",
                    "data": flagged
                }
            ],
            "peak_transactions": max(successful),
            "total_evaluated": sum(successful) + sum(flagged)
        }

    def get_risk_distribution(self) -> Dict[str, Any]:
        total = len(self._transactions)
        if total == 0:
            return {
                "low_risk": {"count": 72, "percentage": 72.0},
                "medium_risk": {"count": 19, "percentage": 19.0},
                "high_risk": {"count": 9, "percentage": 9.0},
                "total": 100
            }

        low = sum(1 for t in self._transactions if t.classification == "Low Risk")
        med = sum(1 for t in self._transactions if t.classification == "Medium Risk")
        high = sum(1 for t in self._transactions if t.classification == "High Risk")

        # Blend with reference base weights for smooth display
        low_pct = round((low / total) * 100, 1)
        med_pct = round((med / total) * 100, 1)
        high_pct = round(100.0 - low_pct - med_pct, 1)

        return {
            "low_risk": {"count": low, "percentage": low_pct if low_pct > 0 else 72.0},
            "medium_risk": {"count": med, "percentage": med_pct if med_pct > 0 else 19.0},
            "high_risk": {"count": high, "percentage": high_pct if high_pct > 0 else 9.0},
            "total_evaluated": total + 24680
        }

    def subscribe(self) -> asyncio.Queue:
        q = asyncio.Queue()
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        if q in self._subscribers:
            self._subscribers.remove(q)

store = Store()
