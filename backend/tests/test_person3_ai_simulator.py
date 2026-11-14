import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.ai.fallback import template_warning
from app.metrics.store import store

client = TestClient(app)

def test_fallback_templates_multilingual():
    reasons = ["Device takeover indicator", "Active call detected"]

    for lang in ["en", "hi", "bn"]:
        res = template_warning(reasons, lang)
        assert res["language"] == lang
        assert isinstance(res["headline"], str) and len(res["headline"]) > 0
        assert isinstance(res["message"], str) and len(res["message"]) > 0
        assert isinstance(res["do_this_now"], list) and len(res["do_this_now"]) >= 3

def test_ai_advice_endpoint_high_risk():
    # txn_73920 is seeded with risk_score = 92
    response = client.get("/api/ai/advice/txn_73920?lang=en")
    assert response.status_code == 200
    data = response.json()
    assert data["txn_id"] == "txn_73920"
    assert data["risk_score"] == 92
    assert data["advice_required"] is True
    assert "headline" in data["advice"]
    assert "do_this_now" in data["advice"]

def test_ai_advice_endpoint_low_risk_skip():
    # txn_73921 is seeded with risk_score = 12 (< 40)
    response = client.get("/api/ai/advice/txn_73921?lang=en")
    assert response.status_code == 200
    data = response.json()
    assert data["txn_id"] == "txn_73921"
    assert data["risk_score"] == 12
    assert data["advice_required"] is False
    assert data["advice"] is None

def test_ai_advice_endpoint_404():
    response = client.get("/api/ai/advice/txn_unknown_99999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_simulator_scenarios_list():
    response = client.get("/api/simulator/scenarios")
    assert response.status_code == 200
    scenarios = response.json()["scenarios"]
    assert len(scenarios) >= 4

def test_simulator_all_four_attacks():
    attacks = ["micro_split", "device_takeover", "fan_in", "coercion"]
    for atype in attacks:
        response = client.post(f"/api/simulator/attack/{atype}")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["attack_type"] == atype
        assert data["transaction"]["id"] is not None

def test_simulator_invalid_attack_400():
    response = client.post("/api/simulator/attack/nonexistent_attack")
    assert response.status_code == 400
    assert "invalid attack type" in response.json()["detail"].lower()

def test_simulator_start_and_stop():
    res_start = client.post("/api/simulator/start?interval=15.0")
    assert res_start.status_code == 200
    assert res_start.json()["status"] == "started"

    res_stop = client.post("/api/simulator/stop")
    assert res_stop.status_code == 200
    assert res_stop.json()["status"] == "stopped"
