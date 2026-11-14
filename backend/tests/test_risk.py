from datetime import datetime, timedelta
from app.schemas import TransactionRequest
from app.risk.scorer import score
from app.risk.features import reset_risk_state, seed_user_profile
from app.risk.graph import reset_graph_state, get_graph_snapshot

def setup_function():
    reset_risk_state()
    reset_graph_state()

def _make_txn(**overrides) -> TransactionRequest:
    base = {
        "txn_id": "tx-1",
        "idempotency_key": "idem-1",
        "sender_vpa": "rahul@okaxis",
        "receiver_vpa": "shop@ybl",
        "amount": 500.0,
        "device_id": "dev-1",
        "geo_city": "Kolkata",
        "timestamp": datetime(2026, 11, 14, 10, 0, 0),
        "is_on_active_call": False,
        "screen_share_detected": False,
        "vpa_pasted_from_clipboard": False,
    }
    base.update(overrides)
    return TransactionRequest(**base)

def test_normal_transaction_approved():
    seed_user_profile("rahul@okaxis", avg_amount=600.0, known_payees=["shop@ybl"], known_devices=["dev-1"])
    res = score(_make_txn())
    assert res.decision == "APPROVED"
    assert res.score < 40

def test_coercion_triggers_cooling_lock():
    res = score(_make_txn(is_on_active_call=True, receiver_vpa="scammer@ybl"))
    assert res.decision == "COOLING_LOCK"
    assert any(r.code == "ACTIVE_CALL_NEW_PAYEE" for r in res.reasons)

def test_guardian_account_triggers_guardian_pending():
    seed_user_profile("senior@okaxis", avg_amount=500.0, known_devices=["dev-1"], is_guardian_enabled=True)
    res = score(_make_txn(sender_vpa="senior@okaxis", receiver_vpa="stranger@ybl", amount=3000.0, geo_city="Mumbai"))
    assert 40 <= res.score <= 75
    assert res.decision == "GUARDIAN_PENDING"

def test_micro_split_and_velocity_blocked():
    t0 = datetime(2026, 11, 14, 10, 0, 0)
    score(_make_txn(txn_id="1", amount=4900.0, timestamp=t0))
    score(_make_txn(txn_id="2", amount=4900.0, timestamp=t0 + timedelta(seconds=10)))
    res3 = score(_make_txn(txn_id="3", amount=4900.0, timestamp=t0 + timedelta(seconds=20)))
    assert res3.score > 75
    assert res3.decision == "BLOCKED"
    codes = {r.code for r in res3.reasons}
    assert "MICRO_SPLIT" in codes
    assert "VELOCITY_1M" in codes

def test_mule_hop_and_fan_in_detection():
    t0 = datetime(2026, 11, 14, 10, 0, 0)
    # A -> B, then B -> C within 15 seconds (Hop Chain)
    score(_make_txn(txn_id="h1", sender_vpa="victim@ok", receiver_vpa="muleB@ok", timestamp=t0))
    hop_res = score(_make_txn(txn_id="h2", sender_vpa="muleB@ok", receiver_vpa="bossC@ok", timestamp=t0 + timedelta(seconds=15)))
    assert any(r.code == "MULE_HOP_RECEIVER" for r in hop_res.reasons)

    # 4 distinct senders -> muleX within 5 minutes (Fan-In)
    for i in range(4):
        res = score(_make_txn(txn_id=f"f{i}", sender_vpa=f"u{i}@ok", receiver_vpa="muleX@ok", timestamp=t0 + timedelta(seconds=i*10)))
    assert any(r.code == "MULE_FAN_IN_RECEIVER" for r in res.reasons)
    assert len(get_graph_snapshot()["edges"]) >= 6

def test_p99_latency_under_2ms():
    t0 = datetime(2026, 11, 14, 10, 0, 0)
    latencies = []
    for i in range(500):
        res = score(_make_txn(txn_id=f"p{i}", timestamp=t0 + timedelta(seconds=i)))
        latencies.append(res.latency_ms)
    latencies.sort()
    p99 = latencies[int(0.99 * len(latencies))]
    assert p99 < 2.0

def test_hybrid_ml_anomaly_reason_triggered():
    reset_risk_state()
    reset_graph_state()
    seed_user_profile("mluser@okaxis", avg_amount=500.0, known_devices=["dev-1"], home_city="Kolkata")
    res = score(_make_txn(
        sender_vpa="mluser@okaxis",
        receiver_vpa="attacker@ybl",
        amount=6000.0,
        device_id="dev-unknown",
        geo_city="Mumbai",
        vpa_pasted_from_clipboard=True,
    ))
    assert any(r.code == "ML_ANOMALY_HIGH" for r in res.reasons)


def test_trustlens_typosquat_entropy_and_web3_hash():
    from app.risk.trustlens import generate_web3_threat_hash
    reset_risk_state()
    reset_graph_state()
    seed_user_profile("rahul@okaxis", avg_amount=800.0, known_devices=["dev-1"], home_city="Kolkata")

    res_typo = score(_make_txn(receiver_vpa="paytrn@ybl", amount=900.0))
    codes_typo = {r.code for r in res_typo.reasons}
    assert "TRUSTLENS_TYPOSQUAT_VPA" in codes_typo

    res_ent = score(_make_txn(receiver_vpa="x9k2m7q4p1z8@ybl", amount=900.0))
    codes_ent = {r.code for r in res_ent.reasons}
    assert "TRUSTLENS_HIGH_ENTROPY_VPA" in codes_ent

    h1 = generate_web3_threat_hash("tx-1", "rahul@okaxis", "paytrn@ybl", res_typo.score, res_typo.decision, list(codes_typo))
    h2 = generate_web3_threat_hash("tx-1", "rahul@okaxis", "paytrn@ybl", res_typo.score, res_typo.decision, list(codes_typo))
    assert h1 == h2 and h1.startswith("0x") and len(h1) == 18
