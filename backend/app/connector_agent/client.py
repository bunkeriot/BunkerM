"""
WebSocket client for BunkerM Cloud.

Handles:
- Auth handshake
- Heartbeat (ping every 30s)
- Tool call dispatch
- Watcher sync / add / remove
- Exponential backoff reconnect
- Status file for frontend
"""
import asyncio
import json
import logging
import secrets
from datetime import datetime, timezone
from pathlib import Path

import httpx
import websockets

from connector_agent.tools import dispatcher
from connector_agent.watcher.engine import WatcherEngine
from connector_agent.alert_forwarder import AlertForwarder

DYNSEC_URL = "http://127.0.0.1:1000"
AI_CLIENT_ID = "BunkerAI"

logger = logging.getLogger(__name__)

STATUS_FILE = Path("/nextjs/data/.bunkerai_status.json")


class ConnectorClient:
    MAX_BACKOFF = 60  # seconds

    def __init__(self, api_key: str, ws_url: str, internal_api_key: str):
        self.api_key = api_key
        self.ws_url = ws_url
        self.internal_api_key = internal_api_key
        self._ws_ref = None  # live WebSocket for watcher callbacks

        async def _watcher_fire(watcher_id: str, rendered_message: str, created_by: str):
            if self._ws_ref:
                await self._ws_ref.send(json.dumps({
                    "type": "watcher_fired",
                    "watcher_id": watcher_id,
                    "message": rendered_message,
                    "created_by": created_by,
                }))

        self._watcher_engine = WatcherEngine(on_fire=_watcher_fire)

        async def _alert_send(payload: dict):
            if self._ws_ref:
                await self._ws_ref.send(json.dumps(payload))

        self._alert_forwarder = AlertForwarder(send_fn=_alert_send)

    async def run_forever(self):
        backoff = 2
        while True:
            try:
                await self._connect_and_serve()
                backoff = 2  # reset on clean disconnect
            except ValueError as e:
                # Auth failure — don't retry
                logger.error(str(e))
                self._write_status(connected=False)
                return
            except Exception as e:
                logger.warning(f"Disconnected: {e}. Reconnecting in {backoff}s")
                self._write_status(connected=False)
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, self.MAX_BACKOFF)

    async def _ensure_ai_mqtt_client(self):
        """Create the BunkerAI MQTT client with admin role if it doesn't already exist.
        Retries up to 5 times with a 3-second delay to handle dynsec-api startup race."""
        headers = {"X-API-Key": self.internal_api_key}
        for attempt in range(1, 6):
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    # Check existence
                    r = await client.get(f"{DYNSEC_URL}/api/v1/clients/{AI_CLIENT_ID}", headers=headers)
                    if r.status_code == 200 and r.json().get("client", {}).get("username") == AI_CLIENT_ID:
                        return  # already exists

                    # Create with a random password
                    password = secrets.token_urlsafe(32)
                    await client.post(
                        f"{DYNSEC_URL}/api/v1/clients",
                        headers=headers,
                        json={"username": AI_CLIENT_ID, "password": password},
                    )

                    # Assign admin role (user can narrow this later in the dashboard)
                    await client.post(
                        f"{DYNSEC_URL}/api/v1/clients/{AI_CLIENT_ID}/roles",
                        headers=headers,
                        json={"role_name": "admin"},
                    )
                    logger.info(
                        f"Created MQTT client '{AI_CLIENT_ID}' with admin role. "
                        "You can restrict its permissions in the BunkerM dashboard."
                    )
                    return
            except Exception as e:
                if attempt < 5:
                    logger.warning(f"Could not ensure AI MQTT client (attempt {attempt}/5): {e}. Retrying in 3s…")
                    await asyncio.sleep(3)
                else:
                    logger.warning(f"Could not ensure AI MQTT client after 5 attempts: {e}")

    async def _connect_and_serve(self):
        async with websockets.connect(self.ws_url) as ws:
            self._ws_ref = ws

            # 1. Auth handshake
            await ws.send(json.dumps({
                "type": "auth",
                "api_key": self.api_key,
                "version": "1.0",
            }))

            resp = json.loads(await asyncio.wait_for(ws.recv(), timeout=10))
            if resp["type"] == "auth_error":
                raise ValueError(f"Auth failed: {resp.get('reason')} — check BUNKERAI_API_KEY")

            tenant_id = resp["tenant_id"]
            tier = resp.get("plan") or resp.get("tier", "unknown")
            logger.info(f"Connected to BunkerM Cloud. Tenant: {tenant_id} Plan: {tier}")
            self._write_status(connected=True, tenant_id=tenant_id, tier=tier)

            # 2. Ensure AI MQTT client exists (fire-and-forget, non-blocking)
            asyncio.create_task(self._ensure_ai_mqtt_client())

            # 3. Start watcher engine (connects to local MQTT broker)
            self._watcher_engine.start(asyncio.get_event_loop())

            # 4. Start alert forwarder (polls smart-anomaly every 30s)
            self._alert_forwarder.start()

            # 5. Run heartbeat + message dispatch concurrently
            try:
                await asyncio.gather(
                    self._heartbeat(ws),
                    self._listen(ws),
                )
            finally:
                self._ws_ref = None
                self._watcher_engine.stop()
                self._alert_forwarder.stop()

    async def _listen(self, ws):
        async for raw in ws:
            msg = json.loads(raw)
            msg_type = msg.get("type")
            if msg_type == "tool_call":
                asyncio.create_task(self._handle_tool_call(ws, msg))
            elif msg_type == "pong":
                pass
            elif msg_type == "watcher_sync":
                self._watcher_engine.sync(msg.get("watchers", []))
            elif msg_type == "watcher_add":
                watcher = msg.get("watcher")
                if watcher:
                    self._watcher_engine.add(watcher)
            elif msg_type == "watcher_remove":
                watcher_id = msg.get("watcher_id")
                if watcher_id:
                    self._watcher_engine.remove(watcher_id)

    async def _handle_tool_call(self, ws, msg: dict):
        result = await dispatcher.dispatch(
            tool_name=msg["tool"],
            params=msg.get("params", {}),
            api_key=self.internal_api_key,
        )
        await ws.send(json.dumps({
            "type": "tool_result",
            "call_id": msg["call_id"],
            "success": result["success"],
            "data": result.get("data"),
            "error": result.get("error"),
        }))

    async def _heartbeat(self, ws):
        while True:
            await asyncio.sleep(30)
            await ws.send(json.dumps({"type": "ping"}))

    def _write_status(self, connected: bool, tenant_id: str | None = None, tier: str | None = None):
        try:
            STATUS_FILE.parent.mkdir(parents=True, exist_ok=True)
            status = {
                "connected": connected,
                "tenant_id": tenant_id,
                "tier": tier,
                "connected_at": datetime.now(timezone.utc).isoformat() if connected else None,
            }
            STATUS_FILE.write_text(json.dumps(status))
        except Exception as e:
            logger.warning(f"Could not write status file: {e}")
