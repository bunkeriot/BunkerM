# Local LLM Integration (LM Studio)

BunkerM can connect to a locally running large language model via [LM Studio](https://lmstudio.ai), giving you a fully private, offline-capable AI assistant that has live awareness of your broker's state and can take actions on your behalf — no BunkerAI Cloud subscription required.

---

## Overview

Local LLM mode is available on **all plans, including Community**. It uses LM Studio's OpenAI-compatible local server API (`http://host.docker.internal:1234/v1` from inside the Docker container) and injects a live broker context snapshot into every chat request as a system prompt.

The feature is functionally equivalent to Cloud AI for the web chat interface. Key differences:

| | Local LLM | Cloud AI (BunkerAI) |
|---|---|---|
| Cost | Free | Paid subscription |
| Privacy | 100% local — nothing leaves your network | Data sent to BunkerAI Cloud |
| Model | Your choice (any LM Studio model) | Managed by BunkerAI |
| Telegram / Slack | Not supported | Supported (Pro+) |
| Internet required | No | Yes |

---

## Architecture

### Backend (`backend/app/agent-api/main.py`)

The `agent-api` service (port 1006) handles all local LLM logic:

- **`GET /local-llm/config`** — Returns current LM Studio URL, selected model, and enabled flag.
- **`POST /local-llm/config`** — Saves configuration to disk (`/app/local_llm_config.json`).
- **`GET /local-llm/models`** — Proxies `GET /v1/models` to LM Studio and returns the model list.
- **`POST /local-llm/chat`** — Main chat endpoint. Accepts `{messages, model}`. Fetches live broker context, builds system prompt, calls LM Studio, parses any `BUNKER_ACTION` block, executes it, returns the cleaned reply.

### Frontend

Three Next.js API routes proxy to the backend with API key injection:

- `app/api/ai/local-llm/config/route.ts` — GET/POST config
- `app/api/ai/local-llm/models/route.ts` — GET models
- `app/api/ai/local-llm/chat/route.ts` — POST chat

Client-side calls are in `lib/api.ts` under `localLlmApi`.

### Broker Context Injection (`_fetch_broker_context`)

On every chat request, the backend fetches:

1. **Monitor stats** (`GET :1001/api/v1/stats?nonce=...&timestamp=...`) — broker uptime, connected clients, messages/sec, subscriptions.
2. **Active topics** (`GET :1001/api/v1/topics`) — all topics with their latest `value`.
3. **Connected clients** (`GET :1002/api/v1/connected-clients`) — currently active client IDs.
4. **Registered clients** (`GET :1000/api/v1/clients`) — all DynSec clients.

This context is assembled as a markdown string and injected as the first `system` message, replacing any previous system message in the history.

### Action Execution (`BUNKER_ACTION` protocol)

When the LLM wants to execute an action, it outputs a JSON block in its reply:

```
BUNKER_ACTION: {"action": "create_client", "username": "sensor-01", "password": "abc123XYZ"}
```

The backend uses `_extract_action_json()` (brace-depth character walk, handles nested JSON and code fences) to parse this block, then `_execute_action()` dispatches:

| Action | API call |
|---|---|
| `create_client` | `POST :1000/api/v1/clients` |
| `create_clients` | Loop of `POST :1000/api/v1/clients` |
| `publish` | `POST :1001/api/v1/publish` |
| `delete_client` | `DELETE :1000/api/v1/clients/{username}` |

The raw `BUNKER_ACTION:` block is stripped from the reply before returning it to the user.

---

## Configuration

### Step 1 — Start LM Studio Local Server

1. Open LM Studio and go to the **Local Server** tab.
2. Load a model (Qwen2.5-Instruct-7B or Llama-3-Instruct recommended).
3. Click **Start Server** (default port: 1234).

### Step 2 — Configure BunkerM

1. In BunkerM, go to **Settings → Integrations**.
2. Find the **Local LLM** card.
3. Set the URL:
   - Docker deployment: `http://host.docker.internal:1234`
   - Host deployment: `http://localhost:1234`
4. Click **Fetch Models** or toggle Enable (auto-fetches models).
5. Select your loaded model from the dropdown.
6. Toggle Enable ON and click **Save**.

### Step 3 — Use in Chat

1. Go to **AI → Chat**.
2. Click **Local LLM** in the mode toggle (header).
3. The selection persists across navigation (stored in `localStorage`).

---

## Chat History & Reset

- Cloud AI and Local LLM histories are stored separately in `localStorage`:
  - Cloud: `bunkerm_chat_{userId}`
  - Local LLM: `bunkerm_local_llm_chat_{userId}`
- Type `/reset` in the chat input to clear the current mode's history.
- Click the trash icon (🗑) in the chat header to clear history.

---

## System Prompt

The system prompt (defined in `_build_system_prompt()`) tells the model:

- It is **BunkerAI**, an AI assistant for BunkerM MQTT management.
- The current broker state (injected live context).
- The `BUNKER_ACTION` JSON format and supported actions.
- Password rules: plain alphanumeric only (a-z, A-Z, 0-9), 12–16 chars — never bcrypt or hashed.
- **Only output a `BUNKER_ACTION` block when the user explicitly asks to create/delete/publish.** Never for read/query/status requests.

---

## Supported Models

Any model loaded in LM Studio works. For best results:

- **Qwen2.5-7B-Instruct** — strong instruction following, good action execution
- **Llama-3.2-3B-Instruct** — fast on CPU, lower RAM
- **Mistral-7B-Instruct-v0.3** — reliable general purpose

Avoid base (non-instruct) models — they do not follow system prompt instructions reliably.

---

## Limitations

- Telegram and Slack connectors route through BunkerAI Cloud WebSocket and cannot use a local model.
- Very small models (1–2B) may occasionally generate `BUNKER_ACTION` blocks for read-only queries despite the system prompt instruction.
- Local LLM does not have cross-session memory (no shared memory feature like Cloud AI).
