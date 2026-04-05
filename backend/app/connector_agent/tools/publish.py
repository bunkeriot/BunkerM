import httpx

MONITOR_URL = "http://127.0.0.1:1001"
TIMEOUT = 5.0


async def handle(params: dict, api_key: str) -> dict:
    """POST /api/v1/publish to monitor-api."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.post(
            f"{MONITOR_URL}/api/v1/publish",
            headers={"X-API-Key": api_key},
            json={
                "topic":   params["topic"],
                "payload": params["payload"],
                "qos":     params.get("qos", 0),
                "retain":  params.get("retain", False),
            },
        )
        resp.raise_for_status()
        return resp.json()
