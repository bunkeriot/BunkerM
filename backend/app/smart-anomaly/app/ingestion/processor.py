import json
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import DEFAULT_TENANT_ID, MessageMetadata
from app.ingestion.schema import IngestPayload


def _to_naive_utc(dt) -> "datetime":
    """Strip tzinfo from a datetime, converting to UTC first if needed."""
    from datetime import datetime, timezone
    if dt is None:
        return datetime.now(timezone.utc).replace(tzinfo=None)
    if hasattr(dt, 'tzinfo') and dt.tzinfo is not None:
        # Convert to UTC then strip tzinfo
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def _extract_numeric(value: str) -> dict[str, float]:
    """Try JSON parse then scalar float parse."""
    if not value:
        return {}
    try:
        parsed = json.loads(value)
        if isinstance(parsed, dict):
            return {k: float(v) for k, v in parsed.items() if isinstance(v, (int, float))}
        if isinstance(parsed, (int, float)):
            return {"value": float(parsed)}
    except (json.JSONDecodeError, ValueError):
        pass
    try:
        return {"value": float(value)}
    except (ValueError, TypeError):
        pass
    return {}


async def process_message(
    payload: IngestPayload,
    db: AsyncSession,
    tenant_id: uuid.UUID = DEFAULT_TENANT_ID,
    extra_metadata: dict | None = None,
) -> MessageMetadata:
    numeric = payload.numeric_fields if payload.numeric_fields else _extract_numeric(payload.value)

    record = MessageMetadata(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        entity_type="topic",
        entity_id=payload.topic,
        topic=payload.topic,
        client_id=payload.client_id,
        timestamp=_to_naive_utc(payload.timestamp),
        qos=payload.qos,
        retain=payload.retain,
        raw_value=payload.value,
        numeric_fields=numeric,
        metadata_=extra_metadata or {},
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record
