import logging
import os
import time
from pathlib import Path

import httpx

from connector_agent.tools import topic_tree, metrics, anomalies, messages, publish, acl

logger = logging.getLogger(__name__)

DYNSEC_URL = "http://127.0.0.1:1000"
AI_CLIENT_ID = "BunkerAI"
_KEY_FILE = Path("/nextjs/data/.api_key")
_DEFAULT_KEY = "default_api_key_replace_in_production"
_key_cache: dict = {"key": "", "ts": 0.0}


def _get_current_api_key() -> str:
    """Resolve the dynsec API key using the same logic as the dynsec service itself:
    env var first, then /nextjs/data/.api_key, then the default placeholder.
    Result is cached for 5 seconds to match dynsec's refresh interval."""
    now = time.monotonic()
    if _key_cache["key"] and now - _key_cache["ts"] < 5.0:
        return _key_cache["key"]
    key = os.environ.get("API_KEY", "")
    if not key or key == _DEFAULT_KEY:
        try:
            file_key = _KEY_FILE.read_text().strip()
            if file_key:
                key = file_key
        except Exception:
            pass
    if not key:
        key = _DEFAULT_KEY
    _key_cache["key"] = key
    _key_cache["ts"] = now
    return key

HANDLERS = {
    # Read tools
    "get_topic_tree":             topic_tree.handle,
    "query_metrics":              metrics.handle,
    "get_anomalies":              anomalies.handle,
    "get_recent_messages":        messages.handle,
    # Write tools
    "publish_message":            publish.handle,
    # Client CRUD
    "list_clients":               acl.handle_list_clients,
    "get_client":                 acl.handle_get_client,
    "create_client":              acl.handle_create_client,
    "delete_client":              acl.handle_delete_client,
    "disable_client":             acl.handle_disable_client,
    "enable_client":              acl.handle_enable_client,
    # Role CRUD
    "list_roles":                 acl.handle_list_roles,
    "get_role":                   acl.handle_get_role,
    "create_role":                acl.handle_create_role,
    "delete_role":                acl.handle_delete_role,
    # Group CRUD
    "list_groups":                acl.handle_list_groups,
    "get_group":                  acl.handle_get_group,
    "create_group":               acl.handle_create_group,
    "delete_group":               acl.handle_delete_group,
    # Assignments
    "add_client_role":            acl.handle_add_client_role,
    "remove_client_role":         acl.handle_remove_client_role,
    "add_client_to_group":        acl.handle_add_client_to_group,
    "remove_client_from_group":   acl.handle_remove_client_from_group,
    "add_group_role":             acl.handle_add_group_role,
    "remove_group_role":          acl.handle_remove_group_role,
    # Role ACL rules
    "add_role_acl":               acl.handle_add_role_acl,
    "remove_role_acl":            acl.handle_remove_role_acl,
}


async def _is_client_disabled() -> bool:
    """Return True if the BunkerAI MQTT client is disabled in dynsec."""
    api_key = _get_current_api_key()
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(
                f"{DYNSEC_URL}/api/v1/clients/{AI_CLIENT_ID}",
                headers={"X-API-Key": api_key},
            )
            if r.status_code == 200:
                return r.json().get("client", {}).get("disabled", False)
    except Exception as e:
        logger.warning(f"Could not check BunkerAI client status: {e}")
    return False


async def dispatch(tool_name: str, params: dict, api_key: str) -> dict:
    handler = HANDLERS.get(tool_name)
    if not handler:
        return {"success": False, "error": f"Unknown tool: {tool_name}"}

    # Always resolve API key fresh from env/file — same logic as the dynsec service.
    # This ensures we never get stuck with a stale key from container startup.
    resolved_key = _get_current_api_key()

    if await _is_client_disabled():
        return {"success": False, "error": "BunkerAI client is disabled. Enable it in ACL → Clients to allow tool execution."}

    try:
        data = await handler(params, resolved_key)
        return {"success": True, "data": data}
    except Exception as e:
        logger.exception(f"Tool '{tool_name}' raised an exception")
        return {"success": False, "error": str(e)}
