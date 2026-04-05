from datetime import datetime

from pydantic import BaseModel


class IngestPayload(BaseModel):
    topic: str
    client_id: str = ""
    timestamp: datetime
    value: str = ""
    qos: int = 0
    retain: bool = False
    numeric_fields: dict[str, float] = {}
