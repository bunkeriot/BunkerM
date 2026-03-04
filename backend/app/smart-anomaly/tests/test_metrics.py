from datetime import datetime, timedelta, timezone

import pytest

from app.database.models import DEFAULT_TENANT_ID, MessageMetadata, MetricsAggregate
from app.ingestion.processor import process_message
from app.ingestion.schema import IngestPayload
from app.metrics.engine import _upsert_metric, compute_metrics
from app.metrics.queries import compute_window_stats, get_distinct_entities


@pytest.mark.asyncio
async def test_compute_window_stats_mean_std(db):
    """Inject 20 messages with values 1..20, verify mean and std."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    topic = "metrics/test_stats"

    for i in range(1, 21):
        record = MessageMetadata(
            tenant_id=DEFAULT_TENANT_ID,
            entity_type="topic",
            entity_id=topic,
            topic=topic,
            client_id="",
            timestamp=now - timedelta(minutes=i),
            raw_value=str(float(i)),
            numeric_fields={"value": float(i)},
            metadata_={},
        )
        db.add(record)
    await db.commit()

    since = now - timedelta(hours=1)
    stats = await compute_window_stats(db, DEFAULT_TENANT_ID, "topic", topic, since)

    assert "value" in stats
    mean, std, count = stats["value"]
    assert count == 20
    assert abs(mean - 10.5) < 0.01
    # Population std of 1..20 = sqrt(33.25) ≈ 5.766
    assert abs(std - 5.766) < 0.05


@pytest.mark.asyncio
async def test_window_excludes_old_messages(db):
    """Messages older than the window should not be included."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    topic = "metrics/test_window"

    # Recent message
    record_recent = MessageMetadata(
        tenant_id=DEFAULT_TENANT_ID,
        entity_type="topic",
        entity_id=topic,
        topic=topic,
        client_id="",
        timestamp=now - timedelta(minutes=30),
        raw_value="100.0",
        numeric_fields={"value": 100.0},
        metadata_={},
    )
    # Old message (outside 1h window)
    record_old = MessageMetadata(
        tenant_id=DEFAULT_TENANT_ID,
        entity_type="topic",
        entity_id=topic,
        topic=topic,
        client_id="",
        timestamp=now - timedelta(hours=2),
        raw_value="1.0",
        numeric_fields={"value": 1.0},
        metadata_={},
    )
    db.add(record_recent)
    db.add(record_old)
    await db.commit()

    since_1h = now - timedelta(hours=1)
    stats = await compute_window_stats(db, DEFAULT_TENANT_ID, "topic", topic, since_1h)
    assert stats["value"][2] == 1  # Only 1 record in the 1h window


@pytest.mark.asyncio
async def test_get_distinct_entities(db):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    for i in range(3):
        record = MessageMetadata(
            tenant_id=DEFAULT_TENANT_ID,
            entity_type="topic",
            entity_id=f"distinct/topic{i}",
            topic=f"distinct/topic{i}",
            client_id="",
            timestamp=now - timedelta(minutes=5),
            raw_value="1.0",
            numeric_fields={"value": 1.0},
            metadata_={},
        )
        db.add(record)
    await db.commit()

    since = now - timedelta(hours=1)
    entities = await get_distinct_entities(db, DEFAULT_TENANT_ID, "topic", since)
    for i in range(3):
        assert f"distinct/topic{i}" in entities


@pytest.mark.asyncio
async def test_upsert_metric_creates_and_updates(db):
    topic = "metrics/upsert_test"
    await _upsert_metric(db, DEFAULT_TENANT_ID, "topic", topic, "1h", "value", 10.0, 2.0, 5)

    from sqlalchemy import select
    result = await db.execute(
        select(MetricsAggregate).where(
            MetricsAggregate.entity_id == topic,
            MetricsAggregate.window == "1h",
        )
    )
    row = result.scalars().first()
    assert row is not None
    assert row.mean == 10.0
    assert row.count == 5

    # Update
    await _upsert_metric(db, DEFAULT_TENANT_ID, "topic", topic, "1h", "value", 20.0, 3.0, 10)
    await db.refresh(row)
    assert row.mean == 20.0
    assert row.count == 10


@pytest.mark.asyncio
async def test_metrics_entities_endpoint(client, db):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    record = MetricsAggregate(
        tenant_id=DEFAULT_TENANT_ID,
        entity_type="topic",
        entity_id="endpoint/test_entity",
        window="1h",
        field_name="value",
        mean=5.0,
        std=1.0,
        count=10,
        computed_at=now,
    )
    db.add(record)
    await db.commit()

    resp = await client.get("/metrics/entities?entity_type=topic")
    assert resp.status_code == 200
    data = resp.json()
    assert "endpoint/test_entity" in data["entities"]


@pytest.mark.asyncio
async def test_metrics_endpoint(client, db):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    record = MetricsAggregate(
        tenant_id=DEFAULT_TENANT_ID,
        entity_type="topic",
        entity_id="endpoint/sensor_metrics",
        window="1h",
        field_name="temp",
        mean=22.0,
        std=1.5,
        count=30,
        computed_at=now,
    )
    db.add(record)
    await db.commit()

    resp = await client.get(
        "/metrics?entity_type=topic&entity_id=endpoint/sensor_metrics&window=1h"
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "temp" in data["fields"]
    assert data["fields"]["temp"]["mean"] == 22.0
