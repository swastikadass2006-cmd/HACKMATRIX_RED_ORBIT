# ShieldPay API Contract Specification

**Service:** Payments Core & Reliability Engine (`shieldpay-core`)  
**Base URL:** `http://localhost:8080`  
**Authentication:** HMAC-SHA256 signature in `X-Signature` header over raw body bytes (Secret: `HMAC_SECRET`, default `"dev-secret-key"`).

---

## 1. System Endpoints

### 1.1 Health Check
* **Endpoint:** `GET /health`
* **Response:** `200 OK`
```json
{
  "status": "ok",
  "service": "shieldpay-core"
}
```

---

### 1.2 Initiate & Process Transaction
* **Endpoint:** `POST /api/transactions`
* **Headers:**
  * `Content-Type: application/json`
  * `X-Signature: <hmac-sha256-hex-digest>`
* **Request Body:**
```json
{
  "txn_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "idempotency_key": "7b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7e",
  "sender_vpa": "rahul@okaxis",
  "receiver_vpa": "shop@ybl",
  "amount": 4900.0,
  "device_id": "dev-91ac",
  "geo_city": "Kolkata",
  "timestamp": "2026-11-14T10:32:05Z",
  "is_on_active_call": false,
  "screen_share_detected": false,
  "vpa_pasted_from_clipboard": false,
  "label_is_fraud": null
}
```
* **Success Response (Settled):** `201 Created` (or `200 OK` on idempotency replay)
```json
{
  "txn_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "idempotency_key": "7b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7e",
  "sender_vpa": "rah***@okaxis",
  "receiver_vpa": "sho***@ybl",
  "amount": 4900.0,
  "status": "SETTLED",
  "risk_score": 0.05,
  "risk_reasons": ["Transaction within baseline behavioral parameters"],
  "cooling_until": null,
  "created_at": "2026-11-14T10:32:05Z",
  "updated_at": "2026-11-14T10:32:05.120Z"
}
```
* **Security & Error Codes:**
  * `401 Unauthorized`: Missing or invalid `X-Signature` header.
  * `409 Conflict`: Illegal state transition attempted.
  * `500 Internal Server Error`: Ledger settlement failure.

---

### 1.3 List Recent Transactions
* **Endpoint:** `GET /api/transactions`
* **Response:** `200 OK`
* All VPAs returned with privacy masking (`rah***@okaxis`).

---

### 1.4 Chronological Audit Trail
* **Endpoint:** `GET /api/audit/{txn_id}`
* **Response:** `200 OK`
```json
[
  {
    "id": 1,
    "txn_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "from_state": "INITIATED",
    "to_state": "SCORING",
    "actor": "api_gateway",
    "note": "Transaction initiated, moving to scoring",
    "timestamp": "2026-11-14T10:32:05.010Z"
  },
  {
    "id": 2,
    "txn_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "from_state": "SCORING",
    "to_state": "APPROVED",
    "actor": "risk_engine",
    "note": "Baseline low risk approval",
    "timestamp": "2026-11-14T10:32:05.080Z"
  },
  {
    "id": 3,
    "txn_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "from_state": "APPROVED",
    "to_state": "SETTLED",
    "actor": "ledger_engine",
    "note": "Atomic double-entry ledger settlement confirmed",
    "timestamp": "2026-11-14T10:32:05.105Z"
  }
]
```

---

### 1.5 Step-Up OTP Verification
* **Endpoint:** `POST /api/transactions/{txn_id}/stepup/verify`
* **Request Body:**
```json
{
  "otp": "482910"
}
```
* **Response:** `200 OK`
  * If valid: returns `status: "SETTLED"` after atomic ledger settlement.
  * If invalid/expired: returns `status: "REJECTED"`.
* **Errors:**
  * `404 Not Found`: Unknown transaction ID.
  * `409 Conflict`: Transaction not currently in `STEP_UP_PENDING` state.

---

### 1.6 Guardian Approval
* **Endpoint:** `POST /api/transactions/{txn_id}/guardian`
* **Request Body:**
```json
{
  "approved": true,
  "reason": "Authorized by secondary family guardian"
}
```
* **Response:** `200 OK` (`status: "SETTLED"` or `"REJECTED"`).
* **Errors:**
  * `409 Conflict`: Transaction not in `GUARDIAN_PENDING` state.

---

### 1.7 Cooling Lock Release
* **Endpoint:** `POST /api/transactions/{txn_id}/cooling/release`
* **Request Body:**
```json
{
  "cancel": false
}
```
* **Responses:**
  * `425 Too Early`: Timer has not expired.
  ```json
  {
    "error": "Cooling timer has not expired yet",
    "cooling_until": "2026-11-14T10:32:25Z",
    "remaining_milliseconds": 14200
  }
  ```
  * `200 OK`: Timer has expired -> transitions to `SETTLED`. Or if `cancel: true` -> `REJECTED`.

---

### 1.8 Server-Sent Events (SSE) Stream
* **Endpoint:** `GET /api/stream`
* **Header:** `Accept: text/event-stream`
* **Events Emitted:**
  * `event: txn.updated` -> Data: JSON serialized `TransactionResponse`
  * `event: ai.advice` -> Data: JSON advisory from AI agent
  * `event: metrics.tick` -> Data: JSON real-time telemetry metrics
  * `event: graph.update` -> Data: JSON fraud cluster graph updates

---

### 1.9 Internal Event Webhook
* **Endpoint:** `POST /api/internal/events`
* **Request Body:**
```json
{
  "event_type": "ai.advice",
  "payload": {
    "risk_level": "CRITICAL",
    "advisory": "Caller urgency pattern matches known scam archetype"
  }
}
```
* **Response:** `202 Accepted`
