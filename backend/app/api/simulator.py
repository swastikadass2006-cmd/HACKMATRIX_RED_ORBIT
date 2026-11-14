from fastapi import APIRouter, HTTPException
<<<<<<< HEAD
from pydantic import BaseModel
from simulator.scenarios import generate_simulated_event, SCENARIOS

router = APIRouter(prefix="/simulator", tags=["simulator"])

class SimulationRequest(BaseModel):
    scenario: str

@router.get("/scenarios")
def get_available_scenarios():
    return {
        "scenarios": [
            {"id": k, **v} for k, v in SCENARIOS.items()
        ]
    }

@router.post("/simulate")
def run_simulation(req: SimulationRequest):
    if req.scenario not in SCENARIOS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scenario '{req.scenario}'. Choose from {list(SCENARIOS.keys())}"
        )
    return generate_simulated_event(req.scenario)
=======

router = APIRouter()

@router.post("/attack/{attack_type}")
async def trigger_attack(attack_type: str):

    valid_attacks = [
        "micro_split",
        "device_takeover",
        "fan_in",
        "coercion"
    ]

    if attack_type not in valid_attacks:
        raise HTTPException(
            status_code=400,
            detail="Invalid attack type"
        )

    # Generate transaction here
    # Pass it to Person 1's payment processing function

    return {
        "message": "Attack simulation triggered",
        "attack_type": attack_type
    }
>>>>>>> f10725b (Add fraud simulator API)
