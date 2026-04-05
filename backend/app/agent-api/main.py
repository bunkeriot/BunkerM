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
import time
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
_PUBLIC_KEY_B64 = "MhTngcCraCJ/Rqre27bKKf3Fdbov+gEE4vDFxZpZlwc="

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
        # Enforce key expiry (365 days)
        iat = payload.get("iat", 0)
        if time.time() - iat > 365 * 86400:
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


# ─── Local LLM (LM Studio) ────────────────────────────────────────────────────

LOCAL_LLM_CONFIG_FILE = DATA_DIR / "local_llm_config.json"
_DEFAULT_LLM_URL = "http://host.docker.internal:1234"

# Internal service URLs (same container)
_MONITOR_URL    = "http://127.0.0.1:1001/api/v1"
_CLIENTLOGS_URL = "http://127.0.0.1:1002/api/v1"
_DYNSEC_URL     = "http://127.0.0.1:1000/api/v1"


def _load_local_llm_config() -> dict:
    try:
        if LOCAL_LLM_CONFIG_FILE.exists():
            return json.loads(LOCAL_LLM_CONFIG_FILE.read_text())
    except Exception:
        pass
    return {"enabled": False, "url": _DEFAULT_LLM_URL, "model": ""}


def _save_local_llm_config(cfg: dict):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    LOCAL_LLM_CONFIG_FILE.write_text(json.dumps(cfg, indent=2))


async def _fetch_broker_context() -> str:
    """Fetch live broker data and return a formatted context string for the system prompt."""
    lines: list[str] = []
    api_key = API_KEY
    nonce = secrets.token_hex(16)
    ts = time.time()

    async with httpx.AsyncClient(timeout=3.0) as client:
        # ── Broker stats ──────────────────────────────────────────────────────
        try:
            r = await client.get(
                f"{_MONITOR_URL}/stats",
                params={"nonce": nonce, "timestamp": ts},
                headers={"x-api-key": api_key},
            )
            if r.status_code == 200:
                s = r.json()
                lines.append("## Live Broker Stats")
                lines.append(f"- Connected clients: {s.get('connected_clients', 'N/A')}")
                lines.append(f"- Total subscriptions: {s.get('subscriptions', 'N/A')}")
                lines.append(f"- Messages received (total): {s.get('messages_received', 'N/A')}")
                lines.append(f"- Messages sent (total): {s.get('messages_sent', 'N/A')}")
                lines.append(f"- Bytes received: {s.get('bytes_received', 'N/A')}")
                lines.append(f"- Bytes sent: {s.get('bytes_sent', 'N/A')}")
                uptime = s.get("uptime") or s.get("broker_uptime")
                if uptime:
                    lines.append(f"- Broker uptime: {uptime}")
        except Exception:
            lines.append("## Live Broker Stats\n- (unavailable)")

        # ── Active topics ─────────────────────────────────────────────────────
        try:
            r = await client.get(f"{_MONITOR_URL}/topics", headers={"x-api-key": api_key})
            if r.status_code == 200:
                topics = r.json().get("topics", [])
                lines.append("\n## Active MQTT Topics (with latest payloads)")
                if topics:
                    for t in topics[:30]:
                        # Monitor API returns `value` as the last payload field
                        payload = t.get("value") or t.get("last_payload") or t.get("payload") or ""
                        count = t.get("count", "")
                        count_str = f" ({count} msgs)" if count else ""
                        payload_str = f' — last value: "{payload}"' if payload else ""
                        lines.append(f'- `{t.get("topic", t)}`{count_str}{payload_str}')
                else:
                    lines.append("- No active topics observed yet (no messages published since broker started).")
        except Exception:
            lines.append("\n## Active MQTT Topics\n- (unavailable)")

        # ── Connected clients ─────────────────────────────────────────────────
        try:
            r = await client.get(f"{_CLIENTLOGS_URL}/connected-clients",
                                 headers={"x-api-key": api_key})
            if r.status_code == 200:
                clients = r.json().get("clients", [])
                lines.append("\n## Currently Connected MQTT Clients")
                if clients:
                    seen: set[str] = set()
                    for c in clients[:20]:
                        username = c.get("username") or c.get("client_id") or str(c)
                        if username in seen:
                            continue
                        seen.add(username)
                        ip = c.get("ip_address", "")
                        ip_str = f" from {ip}" if ip else ""
                        lines.append(f"- {username}{ip_str}")
                else:
                    lines.append("- No external clients currently connected.")
        except Exception:
            lines.append("\n## Currently Connected MQTT Clients\n- (unavailable)")

        # ── Registered DynSec clients ─────────────────────────────────────────
        try:
            r = await client.get(f"{_DYNSEC_URL}/clients", headers={"x-api-key": api_key})
            if r.status_code == 200:
                raw = r.json().get("clients", "")
                if isinstance(raw, str):
                    # comma or newline separated
                    names = [
                        n.strip() for n in raw.replace(",", "\n").split("\n")
                        if n.strip() and ":" not in n
                    ]
                elif isinstance(raw, list):
                    names = [c.get("username", str(c)) for c in raw]
                else:
                    names = []
                lines.append("\n## Registered MQTT Clients (Dynamic Security)")
                if names:
                    lines.append(", ".join(names[:50]))
                else:
                    lines.append("- None registered yet.")
        except Exception:
            pass

    return "\n".join(lines)


def _build_system_prompt(broker_context: str) -> str:
    return f"""You are BunkerAI, the intelligent AI assistant embedded in BunkerM — an open-source, self-hosted MQTT broker management platform running locally via LM Studio.

## Your Role
You have real-time access to the user's Mosquitto MQTT broker (port 1900). Use the live broker data provided below to answer every question accurately. You are NOT a general-purpose assistant — you are specifically the BunkerM broker assistant.

## Actions You Can Execute
You can directly execute the following BunkerM operations on behalf of the user. When asked to perform one, respond with a natural language explanation followed by a JSON action block using EXACTLY this format on its own line:

```json
BUNKER_ACTION: {{"type":"<action_type>", ...fields}}
```

Supported actions:
- Create one MQTT client:
  `BUNKER_ACTION: {{"type":"create_client","username":"<name>","password":"<pass>"}}`
- Create multiple MQTT clients at once:
  `BUNKER_ACTION: {{"type":"create_clients","clients":[{{"username":"<n>","password":"<p>"}}, ...]}}`
- Publish a message to a topic:
  `BUNKER_ACTION: {{"type":"publish","topic":"<topic>","payload":"<payload>","qos":0,"retain":false}}`
- Delete an MQTT client:
  `BUNKER_ACTION: {{"type":"delete_client","username":"<name>"}}`

Rules for actions:
- ONLY include a BUNKER_ACTION block when the user EXPLICITLY asks you to create/delete a client or publish a message. NEVER include it for read/query/status requests.
- Always generate strong random passwords using only letters (a-z, A-Z) and digits (0-9), 12–16 chars. Do NOT use special characters or bcrypt/hashed formats — plain text only.
- Include a brief human-readable summary BEFORE the action block.
- Only output ONE action block per response.
- Do NOT ask the user to go to the UI for tasks you can execute directly.

## What BunkerM Provides (UI features)
- MQTT client/role/group/ACL management (Dynamic Security)
- Real-time topic and payload monitoring
- Connection logs
- Mosquitto config editor
- AWS IoT Core and Azure IoT Hub bridges
- Automated watchers and scheduled publishes

## How to Help
- Answer questions about topics, payloads, stats, and clients using the live data below.
- For tasks in your actions list — execute them directly. Do NOT redirect to the UI.
- For tasks outside your actions list — guide the user to the correct BunkerM UI page.
- Never suggest external tools (MQTT Explorer app, mosquitto CLI, etc.) — BunkerM handles everything.
- Keep responses concise and actionable.

{broker_context}

## Critical Rules
- The live data above is from RIGHT NOW. Trust it completely.
- If topics exist in the data, report them accurately with their last payload.
- If a topic shows "no active topics", say so clearly — don't invent topics.
- Registered clients are listed above — use that list when answering "who can connect".
"""


class LocalLlmConfig(BaseModel):
    enabled: bool = False
    url: str = _DEFAULT_LLM_URL
    model: str = ""


class LocalLlmChatRequest(BaseModel):
    messages: list[dict]
    model: str = ""
    temperature: float = 0.7
    max_tokens: int = 1024


@app.get("/local-llm/config")
async def get_local_llm_config(x_api_key: str = Header(...)):
    _auth(x_api_key)
    return _load_local_llm_config()


@app.post("/local-llm/config")
async def save_local_llm_config(body: LocalLlmConfig, x_api_key: str = Header(...)):
    _auth(x_api_key)
    cfg = {"enabled": body.enabled, "url": body.url.rstrip("/"), "model": body.model}
    _save_local_llm_config(cfg)
    return cfg


@app.get("/local-llm/models")
async def list_local_llm_models(x_api_key: str = Header(...)):
    _auth(x_api_key)
    cfg = _load_local_llm_config()
    base_url = cfg.get("url", _DEFAULT_LLM_URL).rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{base_url}/v1/models")
            if resp.status_code != 200:
                return {"models": [], "error": f"LM Studio returned {resp.status_code}"}
            data = resp.json()
            models = [m["id"] for m in data.get("data", [])]
            return {"models": models}
    except Exception as e:
        return {"models": [], "error": f"Cannot reach LM Studio at {base_url}: {e}"}


import re as _re


def _extract_action_json(text: str) -> dict | None:
    """Extract and parse the BUNKER_ACTION JSON from the LLM reply."""
    # Find the marker
    marker = "BUNKER_ACTION:"
    idx = text.find(marker)
    if idx == -1:
        return None
    rest = text[idx + len(marker):].lstrip()
    # Walk brace-balanced to extract the full JSON object
    if not rest.startswith("{"):
        return None
    depth = 0
    end = -1
    in_str = False
    escape = False
    for i, ch in enumerate(rest):
        if escape:
            escape = False
            continue
        if ch == "\\" and in_str:
            escape = True
            continue
        if ch == '"':
            in_str = not in_str
            continue
        if in_str:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i
                break
    if end == -1:
        return None
    try:
        return json.loads(rest[:end + 1])
    except Exception:
        return None


async def _execute_action(action: dict) -> str:
    """Execute a BunkerM action and return a result summary string."""
    atype = action.get("type", "")
    api_key = API_KEY

    async with httpx.AsyncClient(timeout=15.0) as client:

        if atype == "create_client":
            username = action.get("username", "")
            password = action.get("password", "")
            if not username or not password:
                return "❌ Action failed: username and password are required."
            r = await client.post(
                f"{_DYNSEC_URL}/clients",
                json={"username": username, "password": password},
                headers={"x-api-key": api_key, "Content-Type": "application/json"},
            )
            if r.status_code in (200, 201):
                return f"✅ Client **{username}** created successfully."
            return f"❌ Failed to create client {username}: {r.text[:200]}"

        if atype == "create_clients":
            clients = action.get("clients", [])
            if not clients:
                return "❌ Action failed: no clients provided."
            results: list[str] = []
            for c in clients:
                username = c.get("username", "")
                password = c.get("password", "")
                if not username or not password:
                    results.append(f"⚠️ Skipped (missing username/password): {c}")
                    continue
                r = await client.post(
                    f"{_DYNSEC_URL}/clients",
                    json={"username": username, "password": password},
                    headers={"x-api-key": api_key, "Content-Type": "application/json"},
                )
                if r.status_code in (200, 201):
                    results.append(f"✅ `{username}` / `{password}`")
                else:
                    results.append(f"❌ `{username}` — {r.text[:100]}")
            return "**Client creation results:**\n" + "\n".join(results)

        if atype == "publish":
            topic   = action.get("topic", "")
            payload = action.get("payload", "")
            qos     = action.get("qos", 0)
            retain  = action.get("retain", False)
            if not topic:
                return "❌ Action failed: topic is required."
            r = await client.post(
                f"{_MONITOR_URL}/publish",
                json={"topic": topic, "payload": payload, "qos": qos, "retain": retain},
                headers={"x-api-key": api_key, "Content-Type": "application/json"},
            )
            if r.status_code in (200, 201):
                return f"✅ Published `{payload}` to topic `{topic}`."
            return f"❌ Publish failed: {r.text[:200]}"

        if atype == "delete_client":
            username = action.get("username", "")
            if not username:
                return "❌ Action failed: username is required."
            r = await client.delete(
                f"{_DYNSEC_URL}/clients/{username}",
                headers={"x-api-key": api_key},
            )
            if r.status_code in (200, 204):
                return f"✅ Client **{username}** deleted."
            return f"❌ Failed to delete {username}: {r.text[:200]}"

    return f"❌ Unknown action type: {atype}"


@app.post("/local-llm/chat")
async def local_llm_chat(body: LocalLlmChatRequest, x_api_key: str = Header(...)):
    _auth(x_api_key)
    cfg = _load_local_llm_config()
    base_url = cfg.get("url", _DEFAULT_LLM_URL).rstrip("/")
    model = body.model or cfg.get("model", "")
    if not model:
        raise HTTPException(status_code=400, detail="No model selected")

    # Fetch live broker context and build system prompt
    broker_context = await _fetch_broker_context()
    system_prompt = _build_system_prompt(broker_context)

    user_messages = [m for m in body.messages if m.get("role") != "system"]
    messages_with_context = [{"role": "system", "content": system_prompt}] + user_messages

    lm_payload = {
        "model": model,
        "messages": messages_with_context,
        "temperature": body.temperature,
        "max_tokens": body.max_tokens,
        "stream": False,
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(f"{base_url}/v1/chat/completions", json=lm_payload)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=resp.text)
            reply: str = resp.json()["choices"][0]["message"]["content"]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LM Studio unreachable: {e}")

    # ── Parse and execute any embedded action ─────────────────────────────────
    action = _extract_action_json(reply)
    if action:
        try:
            action_result = await _execute_action(action)
            # Keep the prose before the action block; replace block with result
            marker_idx = reply.find("BUNKER_ACTION:")
            # Also strip any ``` fence that precedes the marker
            clean_end = marker_idx
            while clean_end > 0 and reply[clean_end - 1] in " \n`":
                clean_end -= 1
            clean_reply = reply[:clean_end].rstrip() + "\n\n" + action_result
            return {"reply": clean_reply.strip()}
        except Exception as ex:
            logger.warning(f"Action execute error: {ex}")
            return {"reply": reply + f"\n\n⚠️ Action execution failed: {ex}"}

    return {"reply": reply}


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
