"""
BunkerM Local Agent API — Community edition.

Stores watchers and scheduled jobs locally. No ongoing cloud connection required.
Activation is a one-time operation: either auto (internet) or manual key paste.

Port: 1006
"""
import asyncio
import base64
import json
import logging
import os
import secrets
import uuid
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock

import httpx
import paho.mqtt.publish as mqtt_publish
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel

from connector_agent.watcher.engine import WatcherEngine

# ─── Config ───────────────────────────────────────────────────────────────────

DATA_DIR          = Path(os.environ.get("DATA_DIR", "/nextjs/data"))
AGENTS_FILE       = DATA_DIR / "agents.json"
EVENTS_FILE       = DATA_DIR / "watcher-events.json"
INSTANCE_FILE     = DATA_DIR / "instance_id"
ACTIVATION_FILE   = DATA_DIR / "activation.json"

API_KEY      = os.environ.get("API_KEY", "default_api_key_replace_in_production")
MQTT_HOST    = os.environ.get("MQTT_HOST", "127.0.0.1")
MQTT_PORT    = int(os.environ.get("MQTT_PORT", "1900"))
MQTT_USER    = os.environ.get("MQTT_USERNAME", "bunker")
MQTT_PASS    = os.environ.get("MQTT_PASSWORD", "bunker")
CLOUD_URL    = os.environ.get("BUNKERAI_ACTIVATION_URL", "https://api.bunkerai.dev")

# Ed25519 public key — verifies signatures from BunkerAI Cloud (private key never in repo)
_PUBLIC_KEY_B64 = "+OTzThTTSaNsEbqn8+KtgK/EMNJb7QBuM0Dxfr4R4Yo="

COMMUNITY_MAX_AGENTS = 2
MAX_EVENTS = 200

logging.basicConfig(level=logging.INFO, format="%(levelname)s [agent-api] %(message)s")
logger = logging.getLogger(__name__)

_lock = Lock()

# ─── Activation helpers ───────────────────────────────────────────────────────

def _b64url_decode(s: str) -> bytes:
    pad = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + ("=" * (pad % 4)))


def _get_or_create_instance_id() -> str:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if INSTANCE_FILE.exists():
        return INSTANCE_FILE.read_text().strip()
    # Generate: BKMR- + 8 hex chars (readable for copy-paste)
    instance_id = "BKMR-" + secrets.token_hex(4).upper()
    INSTANCE_FILE.write_text(instance_id)
    logger.info(f"Generated instance ID: {instance_id}")
    return instance_id


def _verify_key(key: str, instance_id: str) -> dict | None:
    """Verify a BKMR- prefixed license key. Returns payload dict or None."""
    if not key.startswith("BKMR-"):
        return None
    parts = key[5:].split(".")
    if len(parts) != 2:
        return None
    try:
        payload_bytes = _b64url_decode(parts[0])
        sig_bytes     = _b64url_decode(parts[1])
        pub = Ed25519PublicKey.from_public_bytes(base64.b64decode(_PUBLIC_KEY_B64))
        pub.verify(sig_bytes, payload_bytes)           # raises on bad sig
        payload = json.loads(payload_bytes)
        if payload.get("instance_id") != instance_id:
            return None
        return payload
    except Exception:
        return None


def _load_activation(instance_id: str) -> dict | None:
    """Load and verify stored activation. Returns payload or None."""
    try:
        if ACTIVATION_FILE.exists():
            data = json.loads(ACTIVATION_FILE.read_text())
            return _verify_key(data.get("key", ""), instance_id)
    except Exception:
        pass
    return None


def _store_activation(key: str):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    ACTIVATION_FILE.write_text(json.dumps({"key": key}))


async def _try_auto_activate(instance_id: str) -> bool:
    """Call BunkerAI Cloud to get a license key. Returns True on success."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                f"{CLOUD_URL}/activate",
                json={"instance_id": instance_id},
            )
            if resp.status_code == 200:
                key = resp.json().get("key", "")
                if _verify_key(key, instance_id):
                    _store_activation(key)
                    logger.info(f"Auto-activation successful for {instance_id}")
                    return True
    except Exception as e:
        logger.info(f"Auto-activation unavailable: {e}")
    return False


# ─── Storage helpers ──────────────────────────────────────────────────────────

def _load_agents() -> dict:
    try:
        if AGENTS_FILE.exists():
            return json.loads(AGENTS_FILE.read_text())
    except Exception as e:
        logger.warning(f"Could not load agents: {e}")
    return {"watchers": [], "jobs": []}


def _save_agents(data: dict):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    AGENTS_FILE.write_text(json.dumps(data, indent=2))


def _load_events() -> list:
    try:
        if EVENTS_FILE.exists():
            return json.loads(EVENTS_FILE.read_text())
    except Exception as e:
        logger.warning(f"Could not load events: {e}")
    return []


def _save_events(events: list):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    EVENTS_FILE.write_text(json.dumps(events, indent=2))


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ─── App & shared state ───────────────────────────────────────────────────────

app = FastAPI(title="BunkerM Agent API")
scheduler = BackgroundScheduler()

_instance_id: str = ""
_activated: bool = False
_lock = Lock()


def _auth(x_api_key: str):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


def _require_activation():
    if not _activated:
        raise HTTPException(
            status_code=403,
            detail="App not activated. Visit bunkerai.dev to get your free Community key.",
        )


# ─── Activation endpoints ─────────────────────────────────────────────────────

@app.get("/activation-status")
async def activation_status(x_api_key: str = Header(...)):
    _auth(x_api_key)
    return {"activated": _activated, "instance_id": _instance_id}


class ActivateRequest(BaseModel):
    key: str


@app.post("/activate")
async def activate(body: ActivateRequest, x_api_key: str = Header(...)):
    global _activated
    _auth(x_api_key)
    payload = _verify_key(body.key.strip(), _instance_id)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or mismatched license key.")
    _store_activation(body.key.strip())
    _activated = True
    logger.info(f"Instance {_instance_id} manually activated.")
    return {"activated": True, "tier": payload.get("tier"), "max_agents": payload.get("max_agents")}


# ─── Watcher fire callback ────────────────────────────────────────────────────

async def _on_watcher_fire(watcher_id: str, rendered_message: str, _created_by: str):
    with _lock:
        data = _load_agents()
        watcher_desc = ""
        for w in data["watchers"]:
            if w["id"] == watcher_id:
                w["fire_count"] = w.get("fire_count", 0) + 1
                w["last_fired_at"] = _now()
                watcher_desc = w.get("description", "")
                break
        _save_agents(data)

        event = {
            "id": str(uuid.uuid4()),
            "watcher_id": watcher_id,
            "watcher_description": watcher_desc,
            "message": rendered_message,
            "fired_at": _now(),
        }
        events = _load_events()
        events.insert(0, event)
        if len(events) > MAX_EVENTS:
            events = events[:MAX_EVENTS]
        _save_events(events)


# ─── Watcher events ───────────────────────────────────────────────────────────

@app.get("/watcher-events")
async def list_events(
    since: str | None = None,
    limit: int = 50,
    x_api_key: str = Header(...),
):
    _auth(x_api_key)
    with _lock:
        events = _load_events()
    if since:
        events = [e for e in events if e["fired_at"] > since]
    return {"events": events[:limit]}


# ─── Watchers CRUD ────────────────────────────────────────────────────────────

class WatcherCreate(BaseModel):
    description: str
    topic: str
    condition_operator: str
    condition_value: str
    response_template: str
    condition_field: str | None = None
    one_shot: bool = False
    cooldown_seconds: int = 10


@app.get("/watchers")
async def list_watchers(x_api_key: str = Header(...)):
    _auth(x_api_key)
    with _lock:
        data = _load_agents()
    return {"watchers": data["watchers"]}


@app.post("/watchers", status_code=201)
async def create_watcher(body: WatcherCreate, x_api_key: str = Header(...)):
    _auth(x_api_key)
    _require_activation()
    with _lock:
        data = _load_agents()
        total = len(data["watchers"]) + len(data["jobs"])
        if total >= COMMUNITY_MAX_AGENTS:
            raise HTTPException(
                status_code=403,
                detail=f"Community limit: max {COMMUNITY_MAX_AGENTS} agents. Upgrade at bunkerai.dev",
            )
        watcher = {
            "id": str(uuid.uuid4()),
            "description": body.description,
            "topic": body.topic,
            "condition_operator": body.condition_operator,
            "condition_value": body.condition_value,
            "response_template": body.response_template,
            "condition_field": body.condition_field,
            "one_shot": body.one_shot,
            "cooldown_seconds": body.cooldown_seconds,
            "active": True,
            "fire_count": 0,
            "last_fired_at": None,
            "created_at": _now(),
        }
        data["watchers"].append(watcher)
        _save_agents(data)
    _watcher_engine.add(watcher)
    return {"watcher": watcher}


@app.delete("/watchers/{watcher_id}")
async def delete_watcher(watcher_id: str, x_api_key: str = Header(...)):
    _auth(x_api_key)
    with _lock:
        data = _load_agents()
        data["watchers"] = [w for w in data["watchers"] if w["id"] != watcher_id]
        _save_agents(data)
    _watcher_engine.remove(watcher_id)
    return {"ok": True}


# ─── Schedules CRUD ───────────────────────────────────────────────────────────

class JobCreate(BaseModel):
    description: str
    cron: str
    topic: str
    payload: str
    qos: int = 0
    retain: bool = False


def _publish_and_record(topic: str, payload: str, qos: int, retain: bool, job_id: str):
    try:
        mqtt_publish.single(
            topic=topic, payload=payload, qos=qos, retain=retain,
            hostname=MQTT_HOST, port=MQTT_PORT,
            auth={"username": MQTT_USER, "password": MQTT_PASS},
        )
        logger.info(f"Scheduler job {job_id} fired: {topic} = {payload[:60]}")
        with _lock:
            data = _load_agents()
            for j in data["jobs"]:
                if j["id"] == job_id:
                    j["fire_count"] = j.get("fire_count", 0) + 1
                    j["last_fired_at"] = _now()
            _save_agents(data)
    except Exception as e:
        logger.warning(f"Scheduler job {job_id} publish failed: {e}")


def _add_to_scheduler(job: dict):
    try:
        trigger = CronTrigger.from_crontab(job["cron"])
        scheduler.add_job(
            _publish_and_record, trigger=trigger, id=job["id"],
            args=[job["topic"], job["payload"], job.get("qos", 0), job.get("retain", False), job["id"]],
            replace_existing=True,
        )
    except Exception as e:
        logger.warning(f"Could not schedule job {job['id']}: {e}")


@app.get("/schedules")
async def list_schedules(x_api_key: str = Header(...)):
    _auth(x_api_key)
    with _lock:
        data = _load_agents()
    return {"jobs": data["jobs"]}


@app.post("/schedules", status_code=201)
async def create_schedule(body: JobCreate, x_api_key: str = Header(...)):
    _auth(x_api_key)
    _require_activation()
    try:
        CronTrigger.from_crontab(body.cron)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid cron expression")
    with _lock:
        data = _load_agents()
        total = len(data["watchers"]) + len(data["jobs"])
        if total >= COMMUNITY_MAX_AGENTS:
            raise HTTPException(
                status_code=403,
                detail=f"Community limit: max {COMMUNITY_MAX_AGENTS} agents. Upgrade at bunkerai.dev",
            )
        job = {
            "id": str(uuid.uuid4()),
            "description": body.description,
            "cron": body.cron,
            "topic": body.topic,
            "payload": body.payload,
            "qos": body.qos,
            "retain": body.retain,
            "active": True,
            "fire_count": 0,
            "last_fired_at": None,
            "created_at": _now(),
        }
        data["jobs"].append(job)
        _save_agents(data)
    _add_to_scheduler(job)
    return {"job": job}


@app.delete("/schedules/{job_id}")
async def delete_schedule(job_id: str, x_api_key: str = Header(...)):
    _auth(x_api_key)
    with _lock:
        data = _load_agents()
        data["jobs"] = [j for j in data["jobs"] if j["id"] != job_id]
        _save_agents(data)
    try:
        scheduler.remove_job(job_id)
    except Exception:
        pass
    return {"ok": True}


# ─── Watcher engine ───────────────────────────────────────────────────────────

_watcher_engine = WatcherEngine(on_fire=_on_watcher_fire)


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    global _instance_id, _activated

    _instance_id = _get_or_create_instance_id()

    # Check stored activation
    payload = _load_activation(_instance_id)
    if payload:
        _activated = True
        logger.info(f"Instance {_instance_id} is activated (community, max_agents={payload.get('max_agents')})")
    else:
        # Try auto-activation silently
        _activated = await _try_auto_activate(_instance_id)
        if not _activated:
            logger.info(f"Instance {_instance_id} not yet activated — banner will be shown")

    # Start scheduler
    scheduler.start()

    # Load persisted data
    with _lock:
        data = _load_agents()

    for job in data.get("jobs", []):
        if job.get("active", True):
            _add_to_scheduler(job)

    _watcher_engine.start(asyncio.get_event_loop())
    _watcher_engine.sync(data.get("watchers", []))

    logger.info(
        f"Agent API ready — activated={_activated}, "
        f"{len(data.get('jobs', []))} jobs, {len(data.get('watchers', []))} watchers"
    )


@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown(wait=False)
    _watcher_engine.stop()
