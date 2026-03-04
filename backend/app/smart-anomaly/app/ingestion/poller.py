import asyncio
import logging
from datetime import datetime, timezone

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database.connection import AsyncSessionLocal
from app.database.models import DEFAULT_TENANT_ID, MessageMetadata
from app.ingestion.processor import _to_naive_utc, process_message
from app.ingestion.schema import IngestPayload

logger = logging.getLogger(__name__)

# Track seen event IDs to dedup
_seen_event_ids: set[str] = set()


async def poll_topics() -> None:
    """Poll monitor-api for topic stats and ingest each topic."""
    url = f"{settings.BUNKERM_MONITOR_URL}/api/v1/topics"
    headers = {"X-API-Key": settings.BUNKERM_API_KEY}

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
        except Exception as exc:
            logger.warning("poll_topics failed: %s", exc)
            return

    topics = data if isinstance(data, list) else data.get("topics", [])

    async with AsyncSessionLocal() as db:
        for entry in topics:
            topic = entry.get("topic") or entry.get("name", "")
            if not topic:
                continue
            value = str(entry.get("value", entry.get("last_value", "")))
            ts_raw = entry.get("timestamp") or entry.get("last_seen")
            try:
                ts = _to_naive_utc(datetime.fromisoformat(ts_raw) if ts_raw else datetime.now(timezone.utc))
            except (ValueError, TypeError):
                ts = datetime.utcnow()

            payload = IngestPayload(
                topic=topic,
                timestamp=ts,
                value=value,
                qos=int(entry.get("qos", 0)),
                retain=bool(entry.get("retain", False)),
            )
            try:
                await process_message(payload, db)
            except Exception as exc:
                logger.warning("process_message failed for topic %s: %s", topic, exc)
                await db.rollback()


async def poll_events() -> None:
    """Poll clientlogs-api for connection events and ingest them."""
    global _seen_event_ids
    url = f"{settings.BUNKERM_CLIENTLOGS_URL}/api/v1/events"

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
        except Exception as exc:
            logger.warning("poll_events failed: %s", exc)
            return

    events = data if isinstance(data, list) else data.get("events", [])

    async with AsyncSessionLocal() as db:
        for event in events:
            event_id = str(event.get("id", ""))
            if event_id and event_id in _seen_event_ids:
                continue
            if event_id:
                _seen_event_ids.add(event_id)

            client_id = event.get("client_id", "")
            ts_raw = event.get("timestamp") or event.get("time")
            try:
                ts = _to_naive_utc(datetime.fromisoformat(ts_raw) if ts_raw else datetime.now(timezone.utc))
            except (ValueError, TypeError):
                ts = datetime.utcnow()

            payload = IngestPayload(
                topic=f"$events/client/{client_id}" if client_id else "$events/client",
                client_id=client_id,
                timestamp=ts,
                value=event.get("event_type", ""),
            )
            try:
                record = MessageMetadata(
                    tenant_id=DEFAULT_TENANT_ID,
                    entity_type="client",
                    entity_id=client_id or "unknown",
                    topic=payload.topic,
                    client_id=client_id,
                    timestamp=ts,
                    raw_value=payload.value,
                    numeric_fields={},
                    metadata_={"event_id": event_id, "event_type": event.get("event_type", "")},
                )
                db.add(record)
                await db.commit()
            except Exception as exc:
                logger.warning("event ingest failed for client %s: %s", client_id, exc)
                await db.rollback()


async def run_topics_poller() -> None:
    while True:
        await poll_topics()
        await asyncio.sleep(settings.POLL_INTERVAL_TOPICS)


async def run_events_poller() -> None:
    while True:
        await poll_events()
        await asyncio.sleep(settings.POLL_INTERVAL_EVENTS)
