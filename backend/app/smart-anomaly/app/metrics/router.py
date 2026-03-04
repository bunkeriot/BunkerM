from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.database.models import DEFAULT_TENANT_ID, MetricsAggregate
from app.license.feature_gate import require_feature

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("")
async def get_metrics(
    entity_type: str = Query("topic"),
    entity_id: str = Query(...),
    window: str = Query("1h"),
    db: AsyncSession = Depends(get_db),
    _: None = require_feature("metrics"),
):
    stmt = select(MetricsAggregate).where(
        MetricsAggregate.tenant_id == DEFAULT_TENANT_ID,
        MetricsAggregate.entity_type == entity_type,
        MetricsAggregate.entity_id == entity_id,
        MetricsAggregate.window == window,
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "window": window,
        "fields": {
            r.field_name: {
                "mean": r.mean,
                "std": r.std,
                "count": r.count,
                "computed_at": r.computed_at.isoformat() if r.computed_at else None,
            }
            for r in rows
        },
    }


@router.get("/entities")
async def list_entities(
    entity_type: str = Query("topic"),
    db: AsyncSession = Depends(get_db),
    _: None = require_feature("metrics"),
):
    stmt = (
        select(MetricsAggregate.entity_id)
        .where(
            MetricsAggregate.tenant_id == DEFAULT_TENANT_ID,
            MetricsAggregate.entity_type == entity_type,
        )
        .distinct()
    )
    result = await db.execute(stmt)
    entity_ids = result.scalars().all()
    return {"entity_type": entity_type, "entities": list(entity_ids)}
