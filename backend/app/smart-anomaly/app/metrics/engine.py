import asyncio
import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import AsyncSessionLocal
from app.database.models import DEFAULT_TENANT_ID, MetricsAggregate
from app.metrics.queries import compute_window_stats, get_distinct_entities

logger = logging.getLogger(__name__)

WINDOWS = {
    "1h": timedelta(hours=1),
    "24h": timedelta(hours=24),
}


async def _upsert_metric(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    entity_type: str,
    entity_id: str,
    window: str,
    field_name: str,
    mean: float | None,
    std: float | None,
    count: int,
) -> None:
    """Upsert a MetricsAggregate row (PostgreSQL ON CONFLICT; fallback for SQLite)."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    existing = await db.execute(
        select(MetricsAggregate).where(
            MetricsAggregate.tenant_id == tenant_id,
            MetricsAggregate.entity_id == entity_id,
            MetricsAggregate.window == window,
            MetricsAggregate.field_name == field_name,
        )
    )
    row = existing.scalars().first()
    if row:
        row.mean = mean
        row.std = std
        row.count = count
        row.computed_at = now
    else:
        row = MetricsAggregate(
            tenant_id=tenant_id,
            entity_type=entity_type,
            entity_id=entity_id,
            window=window,
            field_name=field_name,
            mean=mean,
            std=std,
            count=count,
            computed_at=now,
        )
        db.add(row)
    await db.commit()


async def compute_metrics(tenant_id: uuid.UUID = DEFAULT_TENANT_ID) -> None:
    """Compute metrics for all active topics across all windows."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    async with AsyncSessionLocal() as db:
        entity_ids = await get_distinct_entities(db, tenant_id, "topic", now - timedelta(hours=24))
        for entity_id in entity_ids:
            for window_label, delta in WINDOWS.items():
                since = now - delta
                stats = await compute_window_stats(db, tenant_id, "topic", entity_id, since)
                for field_name, (mean, std, count) in stats.items():
                    try:
                        await _upsert_metric(
                            db, tenant_id, "topic", entity_id, window_label, field_name, mean, std, count
                        )
                    except Exception as exc:
                        logger.warning("upsert_metric failed %s/%s/%s: %s", entity_id, window_label, field_name, exc)
                        await db.rollback()


async def run_metrics_loop() -> None:
    while True:
        try:
            await compute_metrics()
        except Exception as exc:
            logger.error("metrics loop error: %s", exc)
        await asyncio.sleep(60)
