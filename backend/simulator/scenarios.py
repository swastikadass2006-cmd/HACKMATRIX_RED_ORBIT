import random
import datetime
from typing import Dict, Any, List
from app.risk.engine import risk_engine, RiskDecision
from app.metrics.store import store, Transaction, Alert

SCENARIOS = {
    "normal_traffic": {
        "name": "Normal Traffic",
        "description": "Legitimate peer-to-peer and merchant payments with normal velocity",
        "expected_decision": "Approved"
    },
    "device_takeover": {
        "name": "Device Takeover",
        "description": "New hardware ID and sudden geo-velocity jump after SIM swap",
        "expected_decision": "Blocked"
    },
    "micro_split": {
        "name": "Micro-Split",
        "description": "Burst of small transfers to circumvent automated single-transaction limits",
        "expected_decision": "Step-up"
    },
    "fan_in_hop": {
        "name": "Fan-in / Hop",
        "description": "Multiple compromised payers routing funds into a single mule node",
        "expected_decision": "Blocked"
    },
    "coercion": {
        "name": "Coercion",
        "description": "Active phone call detected during non-habitual night transfer with PIN override",
        "expected_decision": "Blocked"
    }
}

def generate_simulated_event(scenario: str) -> Dict[str, Any]:
    now = datetime.datetime.now().strftime("%I:%M:%S %p")
    random_suffix = random.randint(73922, 99999)
    txn_id = f"txn_{random_suffix}"

    payers = ["kav***@oksbi", "arv***@okhdfc", "div***@okaxis", "man***@okicici", "sam***@paytm"]
    payees = ["store@ybl", "merchant@paytm", "fastmart@ibl", "bill@okaxis", "crypto_bridge@ybl"]

    payer = random.choice(payers)
    payee = random.choice(payees)

    if scenario == "normal_traffic":
        amount = round(random.uniform(150, 4200), 2)
        risk_score = random.randint(5, 28)
    elif scenario == "device_takeover":
        amount = round(random.uniform(18000, 75000), 2)
        risk_score = random.randint(86, 98)
        payee = "unknown_device@ybl"
    elif scenario == "micro_split":
        amount = round(random.uniform(420, 490), 2)
        risk_score = random.randint(58, 74)
        payee = "split_relay@ibl"
    elif scenario == "fan_in_hop":
        amount = round(random.uniform(9000, 48000), 2)
        risk_score = random.randint(82, 95)
        payee = "mule_hub@ybl"
    elif scenario == "coercion":
        amount = round(random.uniform(12000, 35000), 2)
        risk_score = random.randint(84, 96)
        payee = "unregistered_vpa@okhdfc"
    else:
        amount = round(random.uniform(500, 5000), 2)
        risk_score = random.randint(10, 50)

    decision_eval: RiskDecision = risk_engine.evaluate(
        amount=amount,
        payer=payer,
        payee=payee,
        risk_score=risk_score,
        scenario=scenario,
        metadata={
            "scenario": scenario,
            "ip": f"103.{random.randint(10, 99)}.{random.randint(10, 250)}.{random.randint(1, 254)}",
            "device_os": "Android 14" if scenario != "device_takeover" else "Emulated VM (ARM64)",
            "upi_provider": "Axis Bank",
            "latency_ms": random.randint(95, 145)
        }
    )

    txn = Transaction(
        id=txn_id,
        timestamp=now,
        payer=payer,
        payee=payee,
        amount=amount,
        risk_score=decision_eval.risk_score,
        decision=decision_eval.decision,
        classification=decision_eval.classification,
        reasons=decision_eval.reasons,
        metadata=decision_eval.metadata
    )

    store.add_transaction(txn)

    # If blocked or step-up, add an alert
    if decision_eval.decision in ["Blocked", "Step-up"]:
        alert_title = f"{SCENARIOS.get(scenario, {}).get('name', 'Attack')} Pattern Intercepted"
        store.add_alert(Alert(
            id=f"alt_{random_suffix}",
            severity="high" if decision_eval.decision == "Blocked" else "warning",
            title=alert_title,
            description=decision_eval.reasons[0] if decision_eval.reasons else "Suspicious transaction blocked",
            timestamp=datetime.datetime.now().strftime("%I:%M %p")
        ))

    return {
        "status": "success",
        "scenario": scenario,
        "scenario_name": SCENARIOS.get(scenario, {}).get("name", scenario),
        "transaction": txn.dict(),
        "summary": f"Simulated {SCENARIOS.get(scenario, {}).get('name', scenario)} resulting in {decision_eval.decision} (Risk Score: {decision_eval.risk_score})"
    }
