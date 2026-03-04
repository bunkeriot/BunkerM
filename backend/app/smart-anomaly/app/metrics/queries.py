import uuid
from datetime import datetime

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import MessageMetadata


async def compute_window_stats(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    entity_type: str,
    entity_id: str,
    since_dt: datetime,
) -> dict[str, tuple[float | None, float | None, int]]:
    """
    Returns {field_name: (mean, std, count)} for all numeric fields
    in message_metadata within [since_dt, now].
    Uses Python-side aggregation for SQLite compatibility.
    """
    stmt = select(MessageMetadata.numeric_fields).where(
        MessageMetadata.tenant_id == tenant_id,
        MessageMetadata.entity_type == entity_type,
        MessageMetadata.entity_id == entity_id,
        MessageMetadata.timestamp >= since_dt,
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    # Aggregate per field
    field_values: dict[str, list[float]] = {}
    for numeric_fields in rows:
        if not isinstance(numeric_fields, dict):
            continue
        for field, val in numeric_fields.items():
            try:
                field_values.setdefault(field, []).append(float(val))
            except (TypeError, ValueError):
                pass

    stats: dict[str, tuple[float | None, float | None, int]] = {}
    for field, values in field_values.items():
        n = len(values)
        if n == 0:
            stats[field] = (None, None, 0)
            continue
        mean = sum(values) / n
        variance = sum((v - mean) ** 2 for v in values) / n
        std = variance ** 0.5
        stats[field] = (mean, std, n)

    return stats


async def get_distinct_entities(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    entity_type: str,
    since_dt: datetime,
) -> list[str]:
    """Return distinct entity_ids of the given type seen since since_dt."""
    stmt = (
        select(MessageMetadata.entity_id)
        .where(
            MessageMetadata.tenant_id == tenant_id,
            MessageMetadata.entity_type == entity_type,
            MessageMetadata.timestamp >= since_dt,
        )
        .distinct()
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
