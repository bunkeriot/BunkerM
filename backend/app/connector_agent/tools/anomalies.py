import httpx

AI_URL = "http://127.0.0.1:8100"
TIMEOUT = 5.0


async def handle(params: dict, api_key: str) -> dict:
    """Get anomalies from smart-anomaly service."""
    limit = params.get("limit", 10)
    entity_id = params.get("entity_id")

    query_params = {"limit": limit}
    if entity_id:
        query_params["entity_id"] = entity_id

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.get(
            f"{AI_URL}/api/v1/anomalies",
            params=query_params,
            headers={"X-API-Key": api_key},
        )
        resp.raise_for_status()
        return resp.json()
