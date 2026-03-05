import logging

import httpx

from connector_agent.tools import topic_tree, metrics, anomalies, messages, publish, acl

logger = logging.getLogger(__name__)

DYNSEC_URL = "http://127.0.0.1:1000"
AI_CLIENT_ID = "BunkerAI"

HANDLERS = {
    # Read tools
    "get_topic_tree":             topic_tree.handle,
    "query_metrics":              metrics.handle,
    "get_anomalies":              anomalies.handle,
    "get_recent_messages":        messages.handle,
    # Write tools
    "publish_message":            publish.handle,
    # ACL management tools
    "list_clients":               acl.handle_list_clients,
    "disable_client":             acl.handle_disable_client,
    "enable_client":              acl.handle_enable_client,
    "list_roles":                 acl.handle_list_roles,
    "list_groups":                acl.handle_list_groups,
    "add_client_role":            acl.handle_add_client_role,
    "remove_client_role":         acl.handle_remove_client_role,
    "add_client_to_group":        acl.handle_add_client_to_group,
    "remove_client_from_group":   acl.handle_remove_client_from_group,
}


async def _is_client_disabled(api_key: str) -> bool:
    """Return True if the BunkerAI MQTT client is disabled in dynsec."""
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

    if await _is_client_disabled(api_key):
        return {"success": False, "error": "BunkerAI client is disabled. Enable it in ACL → Clients to allow tool execution."}

    try:
        data = await handler(params, api_key)
        return {"success": True, "data": data}
    except Exception as e:
        logger.exception(f"Tool '{tool_name}' raised an exception")
        return {"success": False, "error": str(e)}
