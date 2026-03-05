import httpx

DYNSEC_URL = "http://127.0.0.1:1000"
TIMEOUT = 5.0


async def _get(path: str, api_key: str):
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.get(f"{DYNSEC_URL}{path}", headers={"X-API-Key": api_key})
        r.raise_for_status()
        return r.json()


async def _post(path: str, api_key: str, body: dict | None = None):
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.post(f"{DYNSEC_URL}{path}", headers={"X-API-Key": api_key}, json=body or {})
        r.raise_for_status()
        return r.json()


async def _put(path: str, api_key: str):
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.put(f"{DYNSEC_URL}{path}", headers={"X-API-Key": api_key})
        r.raise_for_status()
        return r.json()


async def _delete(path: str, api_key: str):
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.delete(f"{DYNSEC_URL}{path}", headers={"X-API-Key": api_key})
        r.raise_for_status()
        return r.json()


async def _client_exists(username: str, api_key: str) -> bool:
    """Return True if the client username appears in the broker's client list."""
    data = await _get("/api/v1/clients", api_key)
    raw = data.get("clients", "")
    names = [n.strip() for n in raw.split("\n") if n.strip()] if isinstance(raw, str) else []
    return username in names


async def handle_disable_client(params: dict, api_key: str) -> dict:
    username = params["username"]
    if not await _client_exists(username, api_key):
        raise ValueError(f"Client '{username}' does not exist on the broker.")
    return await _put(f"/api/v1/clients/{username}/disable", api_key)


async def handle_enable_client(params: dict, api_key: str) -> dict:
    username = params["username"]
    if not await _client_exists(username, api_key):
        raise ValueError(f"Client '{username}' does not exist on the broker.")
    return await _put(f"/api/v1/clients/{username}/enable", api_key)


async def handle_list_clients(params: dict, api_key: str) -> dict:
    return await _get("/api/v1/clients", api_key)


async def handle_get_client(params: dict, api_key: str) -> dict:
    username = params["username"]
    return await _get(f"/api/v1/clients/{username}", api_key)


async def handle_list_roles(params: dict, api_key: str) -> dict:
    return await _get("/api/v1/roles", api_key)


async def handle_list_groups(params: dict, api_key: str) -> dict:
    return await _get("/api/v1/groups", api_key)


async def handle_add_client_role(params: dict, api_key: str) -> dict:
    username = params["username"]
    role_name = params["role_name"]
    return await _post(f"/api/v1/clients/{username}/roles", api_key, {"role_name": role_name})


async def handle_remove_client_role(params: dict, api_key: str) -> dict:
    username = params["username"]
    role_name = params["role_name"]
    return await _delete(f"/api/v1/clients/{username}/roles/{role_name}", api_key)


async def handle_add_client_to_group(params: dict, api_key: str) -> dict:
    group_name = params["group_name"]
    username = params["username"]
    return await _post(f"/api/v1/groups/{group_name}/clients", api_key, {"username": username})


async def handle_remove_client_from_group(params: dict, api_key: str) -> dict:
    group_name = params["group_name"]
    username = params["username"]
    return await _delete(f"/api/v1/groups/{group_name}/clients/{username}", api_key)
