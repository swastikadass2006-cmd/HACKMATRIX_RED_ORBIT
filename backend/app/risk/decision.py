from app.schemas import DecisionState

def resolve_decision(
    score: int,
    is_on_active_call: bool,
    screen_share_detected: bool,
    is_new_payee: bool,
    is_guardian_account: bool,
) -> DecisionState:
    if score > 75:
        return "BLOCKED"
    if (is_on_active_call or screen_share_detected) and is_new_payee:
        return "COOLING_LOCK"
    if is_guardian_account and (40 <= score <= 75) and is_new_payee:
        return "GUARDIAN_PENDING"
    if 40 <= score <= 75:
        return "STEP_UP_PENDING"
    return "APPROVED"