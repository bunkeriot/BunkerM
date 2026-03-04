from datetime import datetime, timedelta, timezone

import pytest

from app.database.models import (
    DEFAULT_TENANT_ID,
    Anomaly,
    MessageMetadata,
    MetricsAggregate,
)
from app.anomaly.detector import detect_zscore, detect_silence, detect_ewma, detect_spike


async def _seed_messages(db, entity_id: str, values: list[float], now: datetime):
    for i, v in enumerate(values):
        record = MessageMetadata(
            tenant_id=DEFAULT_TENANT_ID,
            entity_type="topic",
            entity_id=entity_id,
            topic=entity_id,
            client_id="",
            timestamp=now - timedelta(minutes=len(values) - i),
            raw_value=str(v),
            numeric_fields={"value": v},
            metadata_={},
        )
        db.add(record)
    await db.commit()


async def _seed_metric(db, entity_id: str, mean: float, std: float, count: int):
    record = MetricsAggregate(
        tenant_id=DEFAULT_TENANT_ID,
        entity_type="topic",
        entity_id=entity_id,
        window="1h",
        field_name="value",
        mean=mean,
        std=std,
        count=count,
        computed_at=datetime.now(timezone.utc).replace(tzinfo=None),
    )
    db.add(record)
    await db.commit()


@pytest.mark.asyncio
async def test_zscore_detects_outlier(db):
    """Baseline mean=20, std=1; inject outlier=999 → z-score anomaly."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    entity_id = "anomaly/zscore_test"

    # Baseline messages
    await _seed_messages(db, entity_id, [20.0] * 10 + [999.0], now)
    # Seed metrics (mean=20, std=1)
    await _seed_metric(db, entity_id, mean=20.0, std=1.0, count=10)

    anomalies = await detect_zscore(db, DEFAULT_TENANT_ID, "topic", entity_id)
    assert len(anomalies) >= 1
    assert any(a.anomaly_type == "z_score" for a in anomalies)
    assert any(a.score > 3.0 for a in anomalies)


@pytest.mark.asyncio
async def test_zscore_no_anomaly_normal_value(db):
    """Value within 3σ should not trigger z-score."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    entity_id = "anomaly/zscore_normal"

    await _seed_messages(db, entity_id, [20.0] * 10 + [21.5], now)
    await _seed_metric(db, entity_id, mean=20.0, std=1.0, count=10)

    anomalies = await detect_zscore(db, DEFAULT_TENANT_ID, "topic", entity_id)
    assert len(anomalies) == 0


@pytest.mark.asyncio
async def test_silence_detection(db):
    """If last message > 2× median interval ago, silence should be detected."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    entity_id = "anomaly/silence_test"

    # Seed messages 1 minute apart, last one 60 minutes ago
    timestamps = [now - timedelta(minutes=60 + i) for i in range(10, 0, -1)]
    for ts in timestamps:
        record = MessageMetadata(
            tenant_id=DEFAULT_TENANT_ID,
            entity_type="topic",
            entity_id=entity_id,
            topic=entity_id,
            client_id="",
            timestamp=ts,
            raw_value="1.0",
            numeric_fields={"value": 1.0},
            metadata_={},
        )
        db.add(record)
    await db.commit()

    anomalies = await detect_silence(db, DEFAULT_TENANT_ID, "topic", entity_id)
    assert len(anomalies) >= 1
    assert anomalies[0].anomaly_type == "silence"


@pytest.mark.asyncio
async def test_silence_no_anomaly_recent(db):
    """Recent messages should not trigger silence."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    entity_id = "anomaly/silence_recent"

    for i in range(10):
        record = MessageMetadata(
            tenant_id=DEFAULT_TENANT_ID,
            entity_type="topic",
            entity_id=entity_id,
            topic=entity_id,
            client_id="",
            timestamp=now - timedelta(seconds=i * 60),
            raw_value="1.0",
            numeric_fields={"value": 1.0},
            metadata_={},
        )
        db.add(record)
    await db.commit()

    anomalies = await detect_silence(db, DEFAULT_TENANT_ID, "topic", entity_id)
    assert len(anomalies) == 0


@pytest.mark.asyncio
async def test_ewma_normal_values_no_anomaly(db):
    """Smooth values should not trigger EWMA anomaly."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    entity_id = "anomaly/ewma_normal"

    await _seed_messages(db, entity_id, [20.0, 20.1, 19.9, 20.2, 20.0, 19.8, 20.1], now)
    anomalies = await detect_ewma(db, DEFAULT_TENANT_ID, "topic", entity_id)
    assert len(anomalies) == 0


@pytest.mark.asyncio
async def test_anomaly_list_endpoint(client, db):
    """GET /anomalies returns list."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    anomaly = Anomaly(
        tenant_id=DEFAULT_TENANT_ID,
        entity_type="topic",
        entity_id="list/test",
        anomaly_type="z_score",
        score=5.0,
        details={"test": True},
        detected_at=now,
    )
    db.add(anomaly)
    await db.commit()

    resp = await client.get("/anomalies?entity_id=list/test")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["anomalies"]) >= 1
    assert data["anomalies"][0]["anomaly_type"] == "z_score"
