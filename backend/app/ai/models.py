from pydantic import BaseModel

class ScamWarning(BaseModel):
    headline: str
    message: str
    do_this_now: list[str]
    language: str