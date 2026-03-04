from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.database.models import DEFAULT_TENANT_ID, Anomaly
from app.license.feature_gate import require_feature

router = APIRouter(prefix="/anomalies", tags=["anomalies"])


@router.get("")
async def list_anomalies(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[str] = Query(None),
    since: Optional[datetime] = Query(None),
    anomaly_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _: None = require_feature("anomalies"),
):
    stmt = select(Anomaly).where(Anomaly.tenant_id == DEFAULT_TENANT_ID)

    if entity_type:
        stmt = stmt.where(Anomaly.entity_type == entity_type)
    if entity_id:
        stmt = stmt.where(Anomaly.entity_id == entity_id)
    if since:
        stmt = stmt.where(Anomaly.detected_at >= since)
    if anomaly_type:
        stmt = stmt.where(Anomaly.anomaly_type == anomaly_type)

    stmt = stmt.order_by(Anomaly.detected_at.desc()).limit(limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    return {
        "anomalies": [
            {
                "id": str(r.id),
                "entity_type": r.entity_type,
                "entity_id": r.entity_id,
                "anomaly_type": r.anomaly_type,
                "score": r.score,
                "details": r.details,
                "detected_at": r.detected_at.isoformat() if r.detected_at else None,
            }
            for r in rows
        ]
    }
