import os
from pydantic import BaseModel

class Settings(BaseModel):
    app_name: str = "ShieldPay Fraud & Risk Operations Engine"
    version: str = "1.0.0"
    api_prefix: str = "/api"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    # Default thresholds from specification
    default_block_threshold: int = 75
    default_step_up_threshold: int = 40

settings = Settings()
