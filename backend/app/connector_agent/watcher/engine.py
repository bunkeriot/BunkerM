"""
MQTT Watcher Engine — runs on the BunkerM side.

Subscribes to topics registered as watchers, evaluates conditions locally,
and fires a callback when a condition is met. Raw payloads never leave the
premises — only the rendered notification message is sent to the cloud.
"""
import asyncio
import json
import logging
import os
from datetime import datetime, timezone
from typing import Callable, Awaitable

import paho.mqtt.client as mqtt

logger = logging.getLogger(__name__)

MQTT_HOST = os.environ.get("MQTT_HOST", "127.0.0.1")
MQTT_PORT = int(os.environ.get("MQTT_PORT", "1900"))
MQTT_USERNAME = os.environ.get("MQTT_USERNAME", "bunker")
MQTT_PASSWORD = os.environ.get("MQTT_PASSWORD", "bunker")


FireCallback = Callable[[str, str, str], Awaitable[None]]
# signature: (watcher_id, rendered_message, created_by)


class WatcherEngine:
    def __init__(self, on_fire: FireCallback, client_id: str = "bunkerm-ai-watcher"):
        self._watchers: dict[str, dict] = {}  # watcher_id -> config dict
        self._cooldowns: dict[str, datetime] = {}  # watcher_id -> last_fired_at
        self._loop: asyncio.AbstractEventLoop | None = None
        self._on_fire = on_fire
        self._subscribed_topics: set[str] = set()

        self._client = mqtt.Client(
            client_id=client_id,
            clean_session=True,
            protocol=mqtt.MQTTv311,
        )
        self._client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        self._client.on_connect = self._on_connect
        self._client.on_disconnect = self._on_disconnect
        self._client.on_message = self._on_message

    def start(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop
        try:
            self._client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
            self._client.loop_start()
            logger.info(f"Watcher engine connected to MQTT broker at {MQTT_HOST}:{MQTT_PORT}")
        except Exception as e:
            logger.warning(f"Watcher engine could not connect to MQTT broker: {e}")

    def stop(self):
        try:
            self._client.loop_stop()
            self._client.disconnect()
        except Exception:
            pass

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            logger.info("Watcher engine MQTT connected")
            # Re-subscribe to all tracked topics on reconnect
            for topic in self._subscribed_topics:
                client.subscribe(topic)
        else:
            logger.warning(f"Watcher engine MQTT connect failed rc={rc}")

    def _on_disconnect(self, client, userdata, rc, properties=None):
        logger.warning(f"Watcher engine MQTT disconnected rc={rc}")

    def _on_message(self, client, userdata, msg):
        if self._loop is None:
            return
        topic = msg.topic
        try:
            payload = msg.payload.decode("utf-8", errors="replace")
        except Exception:
            return
        asyncio.run_coroutine_threadsafe(self._process(topic, payload), self._loop)

    async def _process(self, topic: str, payload: str):
        for watcher_id, w in list(self._watchers.items()):
            if not w.get("active", True):
                continue
            if w["topic"] != topic:
                continue

            # Cooldown check
            last_fired = self._cooldowns.get(watcher_id)
            if last_fired:
                elapsed = (datetime.now(timezone.utc) - last_fired).total_seconds()
                if elapsed < w.get("cooldown_seconds", 10):
                    continue

            # Extract value from payload
            try:
                value = _extract_value(payload, w.get("condition_field"))
            except Exception:
                continue

            # Evaluate condition
            try:
                if not _evaluate(value, w["condition_operator"], w["condition_value"]):
                    continue
            except Exception:
                continue

            # Render notification template
            now_iso = datetime.now(timezone.utc).isoformat()
            rendered = (
                w.get("response_template", "Watcher fired on {{topic}}: {{value}}")
                .replace("{{value}}", str(value))
                .replace("{{topic}}", topic)
                .replace("{{timestamp}}", now_iso)
            )

            # Update cooldown
            self._cooldowns[watcher_id] = datetime.now(timezone.utc)

            # Remove if one-shot
            if w.get("one_shot", False):
                self._watchers.pop(watcher_id, None)
                self._maybe_unsubscribe(topic)

            logger.info(f"Watcher {watcher_id} fired: {rendered[:80]}")
            await self._on_fire(watcher_id, rendered, w.get("created_by", "webchat:web"))

    def sync(self, watchers: list[dict]):
        """Replace entire watcher list (called on WS connect)."""
        old_topics = set(w["topic"] for w in self._watchers.values())
        self._watchers = {w["id"]: w for w in watchers if w.get("active", True)}
        self._cooldowns = {}
        new_topics = set(w["topic"] for w in self._watchers.values())

        # Unsubscribe from topics no longer needed
        for topic in old_topics - new_topics:
            self._client.unsubscribe(topic)
            self._subscribed_topics.discard(topic)

        # Subscribe to new topics
        for topic in new_topics - old_topics:
            self._client.subscribe(topic)
            self._subscribed_topics.add(topic)

        logger.info(f"Watcher sync: {len(self._watchers)} active watchers")

    def add(self, watcher: dict):
        watcher_id = watcher["id"]
        self._watchers[watcher_id] = watcher
        topic = watcher["topic"]
        if topic not in self._subscribed_topics:
            self._client.subscribe(topic)
            self._subscribed_topics.add(topic)
        logger.info(f"Watcher added: {watcher_id} → {topic}")

    def remove(self, watcher_id: str):
        watcher = self._watchers.pop(watcher_id, None)
        self._cooldowns.pop(watcher_id, None)
        if watcher:
            self._maybe_unsubscribe(watcher["topic"])
        logger.info(f"Watcher removed: {watcher_id}")

    def _maybe_unsubscribe(self, topic: str):
        still_needed = any(w["topic"] == topic for w in self._watchers.values())
        if not still_needed:
            self._client.unsubscribe(topic)
            self._subscribed_topics.discard(topic)


# ─── Condition helpers ────────────────────────────────────────────────────────

def _extract_value(payload: str, field: str | None):
    if field is None:
        try:
            return float(payload.strip())
        except ValueError:
            return payload.strip()
    data = json.loads(payload)
    for key in field.split("."):
        data = data[key]
    return data


def _evaluate(value, operator: str, condition_value: str) -> bool:
    if operator == "any_change":
        return True
    try:
        nv = float(value)
        nc = float(condition_value)
        if operator == ">":  return nv > nc
        if operator == "<":  return nv < nc
        if operator == ">=": return nv >= nc
        if operator == "<=": return nv <= nc
        if operator == "==": return nv == nc
        if operator == "!=": return nv != nc
    except (ValueError, TypeError):
        sv = str(value)
        if operator == "==":          return sv == condition_value
        if operator == "!=":          return sv != condition_value
        if operator == "contains":    return condition_value in sv
        if operator == "starts_with": return sv.startswith(condition_value)
    return False
