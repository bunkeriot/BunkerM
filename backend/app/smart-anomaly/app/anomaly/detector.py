import asyncio
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database.connection import AsyncSessionLocal
from app.database.models import (
    DEFAULT_TENANT_ID,
    Anomaly,
    MessageMetadata,
    MetricsAggregate,
)

logger = logging.getLogger(__name__)


async def detect_zscore(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    entity_type: str,
    entity_id: str,
) -> list[Anomaly]:
    """Z-score anomaly: flag if |value - mean| / std > sigma_threshold."""
    sigma = settings.ANOMALY_SIGMA_THRESHOLD
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # Get latest message
    stmt = (
        select(MessageMetadata)
        .where(
            MessageMetadata.tenant_id == tenant_id,
            MessageMetadata.entity_type == entity_type,
            MessageMetadata.entity_id == entity_id,
        )
        .order_by(MessageMetadata.timestamp.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    latest = result.scalars().first()
    if not latest or not latest.numeric_fields:
        return []

    # Get 1h metrics for each field
    metrics_stmt = select(MetricsAggregate).where(
        MetricsAggregate.tenant_id == tenant_id,
        MetricsAggregate.entity_id == entity_id,
        MetricsAggregate.window == "1h",
    )
    metrics_result = await db.execute(metrics_stmt)
    metrics = {r.field_name: r for r in metrics_result.scalars().all()}

    anomalies = []
    for field, val in latest.numeric_fields.items():
        metric = metrics.get(field)
        if not metric or metric.mean is None or metric.std is None or metric.std == 0:
            continue
        try:
            z = abs(float(val) - metric.mean) / metric.std
        except (TypeError, ZeroDivisionError):
            continue
        if z > sigma:
            anomaly = Anomaly(
                tenant_id=tenant_id,
                entity_type=entity_type,
                entity_id=entity_id,
                anomaly_type="z_score",
                score=z,
                details={
                    "method": "z_score",
                    "field": field,
                    "z": z,
                    "value": float(val),
                    "mean": metric.mean,
                    "std": metric.std,
                },
                detected_at=now,
            )
            db.add(anomaly)
            anomalies.append(anomaly)

    if anomalies:
        await db.commit()
        for a in anomalies:
            await db.refresh(a)
    return anomalies


async def detect_ewma(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    entity_type: str,
    entity_id: str,
    alpha: float = 0.3,
) -> list[Anomaly]:
    """EWMA anomaly: flag if latest residual > 2 × EWMA std."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    since = now - timedelta(hours=1)

    stmt = (
        select(MessageMetadata)
        .where(
            MessageMetadata.tenant_id == tenant_id,
            MessageMetadata.entity_type == entity_type,
            MessageMetadata.entity_id == entity_id,
            MessageMetadata.timestamp >= since,
        )
        .order_by(MessageMetadata.timestamp.asc())
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    if len(rows) < 5:
        return []

    # Collect per-field time series
    field_series: dict[str, list[float]] = {}
    for row in rows:
        for field, val in (row.numeric_fields or {}).items():
            try:
                field_series.setdefault(field, []).append(float(val))
            except (TypeError, ValueError):
                pass

    anomalies = []
    for field, values in field_series.items():
        if len(values) < 5:
            continue

        # Compute EWMA
        ewma = values[0]
        residuals = []
        for v in values[1:]:
            ewma = alpha * v + (1 - alpha) * ewma
            residuals.append(abs(v - ewma))

        if not residuals:
            continue
        ewma_std = (sum(r ** 2 for r in residuals) / len(residuals)) ** 0.5
        latest_residual = residuals[-1]

        if ewma_std > 0 and latest_residual > 2 * ewma_std:
            score = latest_residual / ewma_std
            anomaly = Anomaly(
                tenant_id=tenant_id,
                entity_type=entity_type,
                entity_id=entity_id,
                anomaly_type="ewma",
                score=score,
                details={
                    "method": "ewma",
                    "field": field,
                    "latest_residual": latest_residual,
                    "ewma_std": ewma_std,
                    "alpha": alpha,
                },
                detected_at=now,
            )
            db.add(anomaly)
            anomalies.append(anomaly)

    if anomalies:
        await db.commit()
        for a in anomalies:
            await db.refresh(a)
    return anomalies


async def detect_spike(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    entity_type: str,
    entity_id: str,
) -> list[Anomaly]:
    """Spike detection: flag if message rate in last 5min > 3× rate in last 30min."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    five_min_ago = now - timedelta(minutes=5)
    thirty_min_ago = now - timedelta(minutes=30)

    async def count_since(since: datetime) -> int:
        stmt = select(func.count()).where(
            MessageMetadata.tenant_id == tenant_id,
            MessageMetadata.entity_type == entity_type,
            MessageMetadata.entity_id == entity_id,
            MessageMetadata.timestamp >= since,
        )
        result = await db.execute(stmt)
        return result.scalar() or 0

    count_5 = await count_since(five_min_ago)
    count_30 = await count_since(thirty_min_ago)

    rate_5 = count_5 / 5
    rate_30 = count_30 / 30 if count_30 > 0 else 0

    if rate_30 == 0 or rate_5 <= 3 * rate_30:
        return []

    score = rate_5 / rate_30 if rate_30 > 0 else rate_5
    anomaly = Anomaly(
        tenant_id=tenant_id,
        entity_type=entity_type,
        entity_id=entity_id,
        anomaly_type="spike",
        score=score,
        details={
            "method": "spike",
            "count_last_5min": count_5,
            "count_last_30min": count_30,
            "rate_5min_per_min": rate_5,
            "rate_30min_per_min": rate_30,
        },
        detected_at=now,
    )
    db.add(anomaly)
    await db.commit()
    await db.refresh(anomaly)
    return [anomaly]


async def detect_silence(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    entity_type: str,
    entity_id: str,
) -> list[Anomaly]:
    """Silence detection: flag if now - last_ts > 2 × median_interval."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    since = now - timedelta(hours=24)

    stmt = (
        select(MessageMetadata.timestamp)
        .where(
            MessageMetadata.tenant_id == tenant_id,
            MessageMetadata.entity_type == entity_type,
            MessageMetadata.entity_id == entity_id,
            MessageMetadata.timestamp >= since,
        )
        .order_by(MessageMetadata.timestamp.asc())
    )
    result = await db.execute(stmt)
    timestamps = [r for r in result.scalars().all()]

    if len(timestamps) < 2:
        return []

    intervals = [(timestamps[i + 1] - timestamps[i]).total_seconds() for i in range(len(timestamps) - 1)]
    sorted_intervals = sorted(intervals)
    mid = len(sorted_intervals) // 2
    median_interval = (
        sorted_intervals[mid]
        if len(sorted_intervals) % 2 == 1
        else (sorted_intervals[mid - 1] + sorted_intervals[mid]) / 2
    )

    if median_interval <= 0:
        return []

    last_ts = timestamps[-1]
    silence_duration = (now - last_ts).total_seconds()

    if silence_duration <= 2 * median_interval:
        return []

    score = silence_duration / median_interval
    anomaly = Anomaly(
        tenant_id=tenant_id,
        entity_type=entity_type,
        entity_id=entity_id,
        anomaly_type="silence",
        score=score,
        details={
            "method": "silence",
            "last_message_ts": last_ts.isoformat(),
            "silence_seconds": silence_duration,
            "median_interval_seconds": median_interval,
        },
        detected_at=now,
    )
    db.add(anomaly)
    await db.commit()
    await db.refresh(anomaly)
    return [anomaly]


async def run_anomaly_detection(
    tenant_id: uuid.UUID = DEFAULT_TENANT_ID,
) -> list[Anomaly]:
    """Run all detectors for all tracked entities. Returns newly created anomalies."""
    from app.database.models import MetricsAggregate

    all_anomalies: list[Anomaly] = []

    async with AsyncSessionLocal() as db:
        # Get distinct entities from metrics_aggregates
        stmt = (
            select(MetricsAggregate.entity_type, MetricsAggregate.entity_id)
            .where(MetricsAggregate.tenant_id == tenant_id)
            .distinct()
        )
        result = await db.execute(stmt)
        entities = result.all()

        for entity_type, entity_id in entities:
            for detector in [detect_zscore, detect_ewma, detect_spike, detect_silence]:
                try:
                    found = await detector(db, tenant_id, entity_type, entity_id)
                    all_anomalies.extend(found)
                except Exception as exc:
                    logger.warning(
                        "detector %s failed for %s/%s: %s",
                        detector.__name__,
                        entity_type,
                        entity_id,
                        exc,
                    )
                    await db.rollback()

    return all_anomalies


async def run_anomaly_loop() -> None:
    from app.alerts.engine import generate_alerts_for_run

    while True:
        try:
            new_anomalies = await run_anomaly_detection()
            if new_anomalies:
                await generate_alerts_for_run(new_anomalies)
        except Exception as exc:
            logger.error("anomaly loop error: %s", exc)
        await asyncio.sleep(60)
