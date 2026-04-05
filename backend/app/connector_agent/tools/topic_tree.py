import httpx

MONITOR_URL = "http://127.0.0.1:1001"
TIMEOUT = 5.0


async def handle(params: dict, api_key: str) -> dict:
    """GET /topics from monitor-api and return topic tree."""
    filter_prefix: str | None = params.get("filter")

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.get(
            f"{MONITOR_URL}/api/v1/topics",
            headers={"X-API-Key": api_key},
        )
        resp.raise_for_status()
        data = resp.json()

    topics = data.get("topics", [])

    if filter_prefix:
        topics = [t for t in topics if t.get("topic", "").startswith(filter_prefix)]

    return {"topics": topics, "count": len(topics)}
