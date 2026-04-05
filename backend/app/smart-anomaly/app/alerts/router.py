import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.database.models import DEFAULT_TENANT_ID, Alert
from app.license.feature_gate import require_feature

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("")
async def list_alerts(
    severity: Optional[str] = Query(None),
    acknowledged: Optional[bool] = Query(None),
    since: Optional[datetime] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _: None = require_feature("alerts"),
):
    stmt = select(Alert).where(Alert.tenant_id == DEFAULT_TENANT_ID)

    if severity:
        stmt = stmt.where(Alert.severity == severity)
    if acknowledged is not None:
        stmt = stmt.where(Alert.acknowledged == acknowledged)
    if since:
        stmt = stmt.where(Alert.created_at >= since)

    stmt = stmt.order_by(Alert.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    return {
        "alerts": [
            {
                "id": str(r.id),
                "entity_type": r.entity_type,
                "entity_id": r.entity_id,
                "anomaly_type": r.anomaly_type,
                "severity": r.severity,
                "description": r.description,
                "acknowledged": r.acknowledged,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
    }


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: None = require_feature("alerts"),
):
    stmt = select(Alert).where(
        Alert.id == alert_id,
        Alert.tenant_id == DEFAULT_TENANT_ID,
    )
    result = await db.execute(stmt)
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.acknowledged = True
    await db.commit()
    return {"id": str(alert.id), "acknowledged": True}
