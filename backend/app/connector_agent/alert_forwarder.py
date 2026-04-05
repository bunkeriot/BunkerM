"""
Alert Forwarder — polls smart-anomaly for new high/critical alerts and sends
them to the cloud via WebSocket as `anomaly_alert` messages.
"""
import asyncio
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)

SMART_ANOMALY_URL = "http://127.0.0.1:8100"
CONFIG_FILE = Path("/nextjs/data/bunkerai_config.json")
POLL_INTERVAL = 30  # seconds
FORWARD_SEVERITIES = {"high", "critical"}


def _read_forward_enabled() -> bool:
    try:
        cfg = json.loads(CONFIG_FILE.read_text())
        return bool(cfg.get("forward_alerts", False))
    except Exception:
        return False


class AlertForwarder:
    """Polls smart-anomaly and forwards new high/critical alerts via WebSocket."""

    def __init__(self, send_fn):
        """
        send_fn: async callable(dict) — sends a WS message dict to the cloud.
        """
        self._send = send_fn
        self._last_seen_at: datetime | None = None
        self._task: asyncio.Task | None = None

    def start(self):
        self._task = asyncio.create_task(self._run())

    def stop(self):
        if self._task:
            self._task.cancel()
            self._task = None

    async def _run(self):
        while True:
            try:
                if _read_forward_enabled():
                    await self._poll()
            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.debug(f"AlertForwarder poll error: {e}")
            await asyncio.sleep(POLL_INTERVAL)

    async def _poll(self):
        params: dict = {"acknowledged": "false", "limit": "50"}
        if self._last_seen_at:
            params["since"] = self._last_seen_at.isoformat()

        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{SMART_ANOMALY_URL}/alerts", params=params)
            if not resp.ok:
                return
            data = resp.json()

        alerts = data.get("alerts", [])
        if not alerts:
            return

        new_max: datetime | None = None
        forwarded = 0

        for alert in reversed(alerts):  # oldest first
            sev = (alert.get("severity") or "").lower()
            if sev not in FORWARD_SEVERITIES:
                continue

            created_str = alert.get("created_at") or alert.get("fired_at", "")
            try:
                created = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
                if created.tzinfo is None:
                    created = created.replace(tzinfo=timezone.utc)
            except Exception:
                created = datetime.now(timezone.utc)

            if self._last_seen_at and created <= self._last_seen_at:
                continue

            await self._send({
                "type": "anomaly_alert",
                "alert": alert,
            })
            forwarded += 1

            if new_max is None or created > new_max:
                new_max = created

        if new_max:
            self._last_seen_at = new_max

        if forwarded:
            logger.info(f"Forwarded {forwarded} anomaly alert(s) to cloud")
