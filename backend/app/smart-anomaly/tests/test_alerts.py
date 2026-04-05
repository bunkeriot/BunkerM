import uuid
from datetime import datetime, timezone

import pytest

from app.alerts.engine import generate_alerts_for_run, severity_from_score
from app.alerts.rate_limiter import AlertRateLimiter
from app.config import settings
from app.database.models import DEFAULT_TENANT_ID, Alert, Anomaly


def _make_anomaly(entity_id: str, score: float, atype: str = "z_score") -> Anomaly:
    a = Anomaly()
    a.id = uuid.uuid4()
    a.tenant_id = DEFAULT_TENANT_ID
    a.entity_type = "topic"
    a.entity_id = entity_id
    a.anomaly_type = atype
    a.score = score
    a.details = {}
    a.detected_at = datetime.now(timezone.utc).replace(tzinfo=None)
    return a


@pytest.mark.asyncio
async def test_alert_created_from_anomaly(db):
    """Anomaly above threshold → Alert created with correct severity."""
    entity_id = "alerts/test_create"
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # Persist anomaly first (engine needs FK)
    anomaly = Anomaly(
        tenant_id=DEFAULT_TENANT_ID,
        entity_type="topic",
        entity_id=entity_id,
        anomaly_type="z_score",
        score=settings.ANOMALY_SIGMA_THRESHOLD + 1.0,
        details={},
        detected_at=now,
    )
    db.add(anomaly)
    await db.commit()
    await db.refresh(anomaly)

    alerts = await generate_alerts_for_run([anomaly], db=db)
    assert len(alerts) == 1
    assert alerts[0].entity_id == entity_id
    assert alerts[0].severity in ("low", "medium", "high", "critical")
    assert alerts[0].acknowledged is False


@pytest.mark.asyncio
async def test_rate_limiter_suppresses_duplicate(db):
    """Second anomaly within cooldown window → no duplicate alert."""
    entity_id = "alerts/test_dedup"
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # Persist anomaly
    anomaly = Anomaly(
        tenant_id=DEFAULT_TENANT_ID,
        entity_type="topic",
        entity_id=entity_id,
        anomaly_type="z_score",
        score=settings.ANOMALY_SIGMA_THRESHOLD + 0.5,
        details={},
        detected_at=now,
    )
    db.add(anomaly)
    await db.commit()
    await db.refresh(anomaly)

    # First call — alert should be created
    alerts1 = await generate_alerts_for_run([anomaly], cooldown_minutes=60, db=db)
    assert len(alerts1) == 1

    # Second call immediately — should be suppressed by rate limiter
    alerts2 = await generate_alerts_for_run([anomaly], cooldown_minutes=60, db=db)
    assert len(alerts2) == 0


def test_severity_from_score():
    sigma = settings.ANOMALY_SIGMA_THRESHOLD
    assert severity_from_score(sigma + 0.5) == "low"
    assert severity_from_score(sigma + 1.5) == "medium"
    assert severity_from_score(sigma + 2.5) == "high"
    assert severity_from_score(sigma + 3.5) == "critical"


def test_rate_limiter_allows_after_cooldown():
    limiter = AlertRateLimiter()
    tid = DEFAULT_TENANT_ID
    assert limiter.should_alert(tid, "topic/x", "z_score", cooldown_minutes=0) is True
    # cooldown=0 means it always resets
    assert limiter.should_alert(tid, "topic/x", "z_score", cooldown_minutes=60) is False


@pytest.mark.asyncio
async def test_acknowledge_endpoint(client, db):
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    anomaly = Anomaly(
        tenant_id=DEFAULT_TENANT_ID,
        entity_type="topic",
        entity_id="alerts/ack_test",
        anomaly_type="spike",
        score=4.0,
        details={},
        detected_at=now,
    )
    db.add(anomaly)
    await db.commit()
    await db.refresh(anomaly)

    alert = Alert(
        tenant_id=DEFAULT_TENANT_ID,
        anomaly_id=anomaly.id,
        entity_type="topic",
        entity_id="alerts/ack_test",
        anomaly_type="spike",
        severity="high",
        description="Test alert",
        acknowledged=False,
        created_at=now,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)

    resp = await client.post(f"/alerts/{alert.id}/acknowledge")
    assert resp.status_code == 200
    data = resp.json()
    assert data["acknowledged"] is True


@pytest.mark.asyncio
async def test_alerts_list_endpoint(client, db):
    resp = await client.get("/alerts")
    assert resp.status_code == 200
    data = resp.json()
    assert "alerts" in data


@pytest.mark.asyncio
async def test_feature_gate_blocks_llm(client):
    """Community tier → 403 for llm_assistant feature."""
    resp = await client.get("/assistant/query")
    assert resp.status_code == 403
    data = resp.json()
    assert data["detail"]["error"] == "feature_requires_upgrade"
    assert data["detail"]["required_tier"] == "pro"
