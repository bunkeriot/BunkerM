"""
BunkerM Cloud connector agent.

Priority for API key / WS URL:
  1. Environment variables (BUNKERAI_API_KEY, BUNKERAI_WS_URL)
  2. Persistent config file written by the Settings UI
     (/nextjs/data/bunkerai_config.json)

If neither is set, exits cleanly (supervisor won't restart — exitcodes=0).
The ConnectorClient's internal loop handles reconnection on network drops.
"""
import asyncio
import json
import logging
import os
import sys
from pathlib import Path

from connector_agent.client import ConnectorClient, STATUS_FILE

logging.basicConfig(level=logging.INFO, format="%(levelname)s [connector-agent] %(message)s")
logger = logging.getLogger(__name__)

CONFIG_FILE = Path("/nextjs/data/bunkerai_config.json")


def _load_config() -> tuple[str, str]:
    """Return (api_key, ws_url) from env or config file."""
    api_key = os.environ.get("BUNKERAI_API_KEY", "").strip()
    ws_url = os.environ.get("BUNKERAI_WS_URL", "wss://api.bunkerai.dev/connect")

    if not api_key and CONFIG_FILE.exists():
        try:
            config = json.loads(CONFIG_FILE.read_text())
            api_key = config.get("api_key", "").strip()
            if config.get("ws_url"):
                ws_url = config["ws_url"]
            logger.info("Loaded API key from config file.")
        except Exception as e:
            logger.warning(f"Could not read config file: {e}")

    return api_key, ws_url


def main():
    api_key, ws_url = _load_config()

    if not api_key:
        logger.info("BUNKERAI_API_KEY not set — BunkerM Cloud agent inactive.")
        try:
            STATUS_FILE.parent.mkdir(parents=True, exist_ok=True)
            STATUS_FILE.write_text(json.dumps({"connected": False, "tenant_id": None, "tier": None, "connected_at": None}))
        except Exception:
            pass
        sys.exit(0)  # clean exit; supervisor won't restart (exitcodes=0)

    internal_api_key = os.environ.get("API_KEY", "default_api_key_replace_in_production")
    client = ConnectorClient(
        api_key=api_key,
        ws_url=ws_url,
        internal_api_key=internal_api_key,
    )
    asyncio.run(client.run_forever())


if __name__ == "__main__":
    main()
