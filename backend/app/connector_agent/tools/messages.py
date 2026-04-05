import httpx

CLIENTLOGS_URL = "http://127.0.0.1:1002"
TIMEOUT = 5.0


async def handle(params: dict, api_key: str) -> dict:
    """Get recent MQTT events from clientlogs service."""
    topic = params["topic"]
    limit = params.get("limit", 20)

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.get(
            f"{CLIENTLOGS_URL}/api/v1/events",
            params={"topic": topic, "limit": limit},
            headers={"X-API-Key": api_key},
        )
        resp.raise_for_status()
        return resp.json()
