import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.alerts.rate_limiter import rate_limiter
from app.database.models import DEFAULT_TENANT_ID, Alert, Anomaly

logger = logging.getLogger(__name__)


def _get_sigma() -> float:
    from app.config import settings
    return settings.ANOMALY_SIGMA_THRESHOLD


def severity_from_score(score: float) -> str:
    sigma = _get_sigma()
    if score >= sigma + 3:
        return "critical"
    if score >= sigma + 2:
        return "high"
    if score >= sigma + 1:
        return "medium"
    return "low"


def description_from_anomaly(anomaly: Anomaly) -> str:
    details = anomaly.details or {}
    window = details.get("window", "1h")
    return (
        f"Topic '{anomaly.entity_id}' value deviated {anomaly.score:.1f}σ "
        f"from {window} baseline (detected: {anomaly.anomaly_type})"
    )


@asynccontextmanager
async def _get_session(db: AsyncSession | None) -> AsyncGenerator[AsyncSession, None]:
    """Use provided session or create a new one."""
    if db is not None:
        yield db
    else:
        from app.database.connection import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            yield session


async def generate_alerts_for_run(
    new_anomalies: list[Anomaly],
    tenant_id: uuid.UUID = DEFAULT_TENANT_ID,
    cooldown_minutes: int = 5,
    db: AsyncSession | None = None,
) -> list[Alert]:
    created: list[Alert] = []
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    async with _get_session(db) as session:
        for anomaly in new_anomalies:
            if not rate_limiter.should_alert(
                tenant_id, anomaly.entity_id, anomaly.anomaly_type, cooldown_minutes
            ):
                continue

            severity = severity_from_score(anomaly.score)
            description = description_from_anomaly(anomaly)

            alert = Alert(
                tenant_id=tenant_id,
                anomaly_id=anomaly.id,
                entity_type=anomaly.entity_type,
                entity_id=anomaly.entity_id,
                anomaly_type=anomaly.anomaly_type,
                severity=severity,
                description=description,
                acknowledged=False,
                created_at=now,
            )
            session.add(alert)
            try:
                await session.commit()
                await session.refresh(alert)
                created.append(alert)
                logger.info(
                    "Alert created: %s [%s] for %s", alert.anomaly_type, alert.severity, alert.entity_id
                )
            except Exception as exc:
                logger.warning("Failed to create alert: %s", exc)
                await session.rollback()

    return created
