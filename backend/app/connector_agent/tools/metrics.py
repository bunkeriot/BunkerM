import httpx

AI_URL = "http://127.0.0.1:8100"
TIMEOUT = 5.0


async def handle(params: dict, api_key: str) -> dict:
    """Query metrics from smart-anomaly service."""
    topic = params["topic"]
    window = params.get("window", "1h")

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        # First get entity list to validate topic exists
        resp = await client.get(
            f"{AI_URL}/api/v1/metrics",
            params={
                "entity_type": "topic",
                "entity_id": topic,
                "window": window,
            },
            headers={"X-API-Key": api_key},
        )
        resp.raise_for_status()
        return resp.json()
