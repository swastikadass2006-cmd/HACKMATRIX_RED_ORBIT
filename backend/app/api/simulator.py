import asyncio
import random
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from simulator.scenarios import generate_simulated_event, SCENARIOS

router = APIRouter(prefix="/simulator", tags=["simulator"])

# Background traffic simulation state
_simulation_task: Optional[asyncio.Task] = None
_simulation_running: bool = False

class SimulationRequest(BaseModel):
    scenario: str

async def _simulation_loop(interval_seconds: float = 6.0):
    """
    Background simulation worker loop.
    Generates periodic normal transactions and occasional anomaly bursts.
    """
    global _simulation_running
    scenarios_pool = ["normal_traffic", "normal_traffic", "normal_traffic", "micro_split", "coercion"]

    while _simulation_running:
        try:
            chosen_scenario = random.choice(scenarios_pool)
            generate_simulated_event(chosen_scenario)
        except Exception as e:
            print(f"[ShieldPay Simulator] Simulation error: {e}")
        await asyncio.sleep(interval_seconds)

@router.get("/scenarios")
def get_available_scenarios():
    """Lists all configured simulation scenarios."""
    return {
        "scenarios": [
            {"id": k, **v} for k, v in SCENARIOS.items()
        ]
    }

@router.post("/simulate")
def run_simulation(req: SimulationRequest):
    """Executes a single ad-hoc simulation scenario."""
    if req.scenario not in SCENARIOS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scenario '{req.scenario}'. Choose from {list(SCENARIOS.keys())}"
        )
    return generate_simulated_event(req.scenario)

@router.post("/start")
async def start_simulator(interval: float = 6.0):
    """
    Starts the continuous background traffic simulator.
    Generates normal traffic and periodic fraud spikes streamed over SSE.
    """
    global _simulation_task, _simulation_running

    if _simulation_running:
        return {
            "status": "already_running",
            "message": "Traffic simulator is already actively running."
        }

    _simulation_running = True
    _simulation_task = asyncio.create_task(_simulation_loop(interval_seconds=interval))

    return {
        "status": "started",
        "message": "Continuous traffic simulator started.",
        "interval_seconds": interval
    }

@router.post("/stop")
async def stop_simulator():
    """
    Safely stops the continuous background traffic simulator.
    """
    global _simulation_task, _simulation_running

    if not _simulation_running:
        return {
            "status": "already_stopped",
            "message": "Simulator is not currently running."
        }

    _simulation_running = False
    if _simulation_task and not _simulation_task.done():
        _simulation_task.cancel()
        try:
            await _simulation_task
        except asyncio.CancelledError:
            pass

    _simulation_task = None

    return {
        "status": "stopped",
        "message": "Continuous traffic simulator stopped successfully."
    }

@router.post("/attack/{attack_type}")
async def trigger_attack(attack_type: str):
    """
    Triggers an instant simulated fraud attack scenario:
    - micro_split: Evades ₹5,000 threshold using burst of micro-transactions.
    - device_takeover: Unknown device ID and sudden geo-velocity jump.
    - fan_in: Multiple senders converging to a mule account node.
    - coercion: Active GSM call and clipboard paste coercion patterns.
    """
    attack_mapping = {
        "micro_split": "micro_split",
        "device_takeover": "device_takeover",
        "fan_in": "fan_in_hop",
        "coercion": "coercion"
    }

    if attack_type not in attack_mapping:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid attack type '{attack_type}'. Choose from: {list(attack_mapping.keys())}"
        )

    scenario_key = attack_mapping[attack_type]
    result = generate_simulated_event(scenario_key)

    return {
        "status": "success",
        "message": f"Fraud attack '{attack_type}' generated and dispatched to pipeline.",
        "attack_type": attack_type,
        "scenario": scenario_key,
        "transaction": result.get("transaction"),
        "summary": result.get("summary")
    }
