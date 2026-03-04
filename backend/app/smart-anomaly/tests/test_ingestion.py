import uuid
from datetime import datetime, timezone

import pytest
from sqlalchemy import select

from app.database.models import DEFAULT_TENANT_ID, MessageMetadata
from app.ingestion.processor import _extract_numeric, process_message
from app.ingestion.schema import IngestPayload


@pytest.mark.asyncio
async def test_valid_payload_stored(db):
    payload = IngestPayload(
        topic="factory/sensor1",
        timestamp=datetime.now(timezone.utc),
        value='{"temp": 22.5}',
    )
    record = await process_message(payload, db)
    assert record.id is not None
    assert record.entity_id == "factory/sensor1"
    assert record.numeric_fields == {"temp": 22.5}


@pytest.mark.asyncio
async def test_numeric_extraction_json(db):
    payload = IngestPayload(
        topic="test/topic",
        timestamp=datetime.now(timezone.utc),
        value='{"a": 1, "b": 2.5, "c": "not_a_number"}',
    )
    record = await process_message(payload, db)
    assert record.numeric_fields == {"a": 1.0, "b": 2.5}


@pytest.mark.asyncio
async def test_numeric_extraction_scalar(db):
    payload = IngestPayload(
        topic="test/scalar",
        timestamp=datetime.now(timezone.utc),
        value="42.0",
    )
    record = await process_message(payload, db)
    assert record.numeric_fields == {"value": 42.0}


@pytest.mark.asyncio
async def test_non_numeric_value_stored_empty(db):
    payload = IngestPayload(
        topic="test/text",
        timestamp=datetime.now(timezone.utc),
        value="hello world",
    )
    record = await process_message(payload, db)
    assert record.numeric_fields == {}
    assert record.raw_value == "hello world"


@pytest.mark.asyncio
async def test_explicit_numeric_fields_override(db):
    """Explicit numeric_fields take precedence over value parsing."""
    payload = IngestPayload(
        topic="test/override",
        timestamp=datetime.now(timezone.utc),
        value='{"temp": 99}',
        numeric_fields={"custom": 1.0},
    )
    record = await process_message(payload, db)
    assert record.numeric_fields == {"custom": 1.0}


def test_extract_numeric_pure_json():
    assert _extract_numeric('{"x": 1, "y": 2}') == {"x": 1.0, "y": 2.0}


def test_extract_numeric_scalar_float():
    assert _extract_numeric("3.14") == {"value": 3.14}


def test_extract_numeric_empty():
    assert _extract_numeric("") == {}


def test_extract_numeric_non_numeric_string():
    assert _extract_numeric("some text") == {}


@pytest.mark.asyncio
async def test_ingest_endpoint_valid(client):
    payload = {
        "topic": "api/test",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "value": '{"reading": 5.0}',
    }
    resp = await client.post("/ingest", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "id" in data


@pytest.mark.asyncio
async def test_ingest_endpoint_missing_topic(client):
    resp = await client.post("/ingest", json={"timestamp": datetime.now(timezone.utc).isoformat()})
    assert resp.status_code == 422
