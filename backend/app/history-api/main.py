"""
Message History & Replay API — port 1007
Subscribes to all MQTT topics (except $SYS/), stores messages in SQLite,
and provides query + replay endpoints.
"""

import asyncio
import base64
import json
import logging
import os
import sqlite3
import threading
import time
from contextlib import asynccontextmanager
from typing import Optional

import paho.mqtt.client as mqtt
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Configuration ────────────────────────────────────────────────────────────

DB_PATH        = os.getenv("HISTORY_DB_PATH", "/var/lib/history/history.db")
MAX_MESSAGES   = int(os.getenv("HISTORY_MAX_MESSAGES", "50000"))
MAX_AGE_DAYS   = int(os.getenv("HISTORY_MAX_AGE_DAYS",  "7"))
API_KEY        = os.getenv("API_KEY", "default_api_key_replace_in_production")

MQTT_HOST      = os.getenv("MQTT_BROKER",   "localhost")
MQTT_PORT      = int(os.getenv("MQTT_PORT", "1900"))
MQTT_USER      = os.getenv("MQTT_USERNAME", "bunker")
MQTT_PASS      = os.getenv("MQTT_PASSWORD", "bunker")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("history-api")

# ── Database ─────────────────────────────────────────────────────────────────

def get_db() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            ts      INTEGER NOT NULL,
            topic   TEXT    NOT NULL,
            payload TEXT,
            enc     TEXT    NOT NULL DEFAULT 'utf8',
            qos     INTEGER NOT NULL DEFAULT 0,
            retain  INTEGER NOT NULL DEFAULT 0,
            size    INTEGER NOT NULL DEFAULT 0
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_ts    ON messages (ts)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_topic ON messages (topic)")
    conn.commit()
    conn.close()
    log.info("Database initialised at %s", DB_PATH)


def prune_db() -> None:
    """Remove oldest rows when the table exceeds MAX_MESSAGES or MAX_AGE_DAYS."""
    cutoff_ts = int(time.time() * 1000) - MAX_AGE_DAYS * 86400 * 1000
    conn = get_db()
    conn.execute("DELETE FROM messages WHERE ts < ?", (cutoff_ts,))
    count = conn.execute("SELECT COUNT(*) FROM messages").fetchone()[0]
    if count > MAX_MESSAGES:
        excess = count - MAX_MESSAGES
        conn.execute(
            "DELETE FROM messages WHERE id IN (SELECT id FROM messages ORDER BY ts ASC LIMIT ?)",
            (excess,),
        )
    conn.commit()
    conn.close()

# ── MQTT subscriber ───────────────────────────────────────────────────────────

_mqtt_client: Optional[mqtt.Client] = None


def _on_connect(client, userdata, flags, rc):
    if rc == 0:
        client.subscribe("#", qos=0)
        log.info("MQTT connected and subscribed to #")
    else:
        log.warning("MQTT connect failed rc=%d", rc)


def _on_message(client, userdata, msg):
    if msg.topic.startswith("$SYS/"):
        return

    ts = int(time.time() * 1000)  # milliseconds
    raw = msg.payload

    try:
        payload_str = raw.decode("utf-8")
        enc = "utf8"
    except UnicodeDecodeError:
        payload_str = base64.b64encode(raw).decode("ascii")
        enc = "base64"

    try:
        conn = get_db()
        conn.execute(
            "INSERT INTO messages (ts, topic, payload, enc, qos, retain, size) VALUES (?,?,?,?,?,?,?)",
            (ts, msg.topic, payload_str, enc, msg.qos, int(msg.retain), len(raw)),
        )
        conn.commit()
        conn.close()
    except Exception as exc:
        log.error("DB insert error: %s", exc)

    # Prune every 1 000 inserts (approximate, cheap check)
    if ts % 1000 < 5:
        threading.Thread(target=prune_db, daemon=True).start()


def start_mqtt() -> None:
    global _mqtt_client
    client = mqtt.Client(client_id="bunkerm-history-api", clean_session=True)
    client.username_pw_set(MQTT_USER, MQTT_PASS)
    client.on_connect = _on_connect
    client.on_message = _on_message

    def _loop():
        while True:
            try:
                client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
                client.loop_forever()
            except Exception as exc:
                log.warning("MQTT error: %s — retrying in 5 s", exc)
                time.sleep(5)

    _mqtt_client = client
    t = threading.Thread(target=_loop, daemon=True)
    t.start()
    log.info("MQTT subscriber thread started")

# ── FastAPI app ───────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    start_mqtt()
    yield


app = FastAPI(title="History API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_api_key(x_api_key: str = Query(None, alias="x-api-key")):
    """Accept key from header (injected by Nginx/proxy) or query param."""
    return True  # Auth handled by the proxy layer


# ── Models ────────────────────────────────────────────────────────────────────

class ReplayRequest(BaseModel):
    topic: str
    payload: Optional[str] = ""
    qos: int = 0
    retain: bool = False


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/v1/stats")
def get_stats():
    conn = get_db()
    row = conn.execute(
        "SELECT COUNT(*) as total, MIN(ts) as oldest_ts, MAX(ts) as newest_ts FROM messages"
    ).fetchone()
    db_size = os.path.getsize(DB_PATH) if os.path.exists(DB_PATH) else 0
    conn.close()
    return {
        "total":        row["total"],
        "oldest_ts":    row["oldest_ts"],
        "newest_ts":    row["newest_ts"],
        "db_size_bytes": db_size,
        "max_messages": MAX_MESSAGES,
        "max_age_days": MAX_AGE_DAYS,
    }


@app.get("/api/v1/topics")
def get_topics():
    conn = get_db()
    rows = conn.execute(
        "SELECT topic, COUNT(*) as count, MAX(ts) as last_seen FROM messages GROUP BY topic ORDER BY count DESC"
    ).fetchall()
    conn.close()
    return {"topics": [dict(r) for r in rows]}


@app.get("/api/v1/messages")
def get_messages(
    topic:   Optional[str] = Query(None),
    search:  Optional[str] = Query(None),
    from_ts: Optional[int] = Query(None),
    to_ts:   Optional[int] = Query(None),
    limit:   int           = Query(100, ge=1, le=1000),
    offset:  int           = Query(0,   ge=0),
):
    clauses = []
    params: list = []

    if topic:
        clauses.append("topic = ?")
        params.append(topic)
    if search:
        clauses.append("(topic LIKE ? OR payload LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%"])
    if from_ts is not None:
        clauses.append("ts >= ?")
        params.append(from_ts)
    if to_ts is not None:
        clauses.append("ts <= ?")
        params.append(to_ts)

    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    conn = get_db()
    total = conn.execute(f"SELECT COUNT(*) FROM messages {where}", params).fetchone()[0]
    rows  = conn.execute(
        f"SELECT * FROM messages {where} ORDER BY ts DESC LIMIT ? OFFSET ?",
        params + [limit, offset],
    ).fetchall()
    conn.close()
    return {
        "total":    total,
        "messages": [dict(r) for r in rows],
    }


@app.post("/api/v1/replay")
def replay_message(body: ReplayRequest):
    if _mqtt_client is None:
        raise HTTPException(status_code=503, detail="MQTT client not ready")
    payload_bytes = (body.payload or "").encode("utf-8")
    info = _mqtt_client.publish(body.topic, payload_bytes, qos=body.qos, retain=body.retain)
    if info.rc != mqtt.MQTT_ERR_SUCCESS:
        raise HTTPException(status_code=500, detail=f"Publish failed rc={info.rc}")
    return {"status": "published", "topic": body.topic}


@app.delete("/api/v1/messages")
def clear_history():
    conn = get_db()
    conn.execute("DELETE FROM messages")
    conn.commit()
    conn.close()
    return {"status": "cleared"}


@app.get("/health")
def health():
    return {"status": "ok"}
