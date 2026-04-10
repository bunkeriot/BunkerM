<p align="center">
  <img src="frontend/public/BunkerM_Logo.png" alt="BunkerM Logo" width="220" />
</p>

<h1 align="center">BunkerM - Mosquitto MQTT Management UI</h1>

<p align="center">
  The world's first all-in-one, self-hosted MQTT broker manager with built-in AI assistant, smart anomaly detection, and local automation agents.
</p>

<p align="center">
  <a href="https://bunkerai.dev/docs">
    <img src="https://img.shields.io/badge/Documentation-Available-green?style=for-the-badge&logo=read-the-docs" alt="Documentation" />
  </a>
</p>

<p align="center">
  <a href="https://hub.docker.com/r/bunkeriot/bunkerm">
    <img src="https://img.shields.io/docker/pulls/bunkeriot/bunkerm?logo=docker&logoColor=white&label=Docker%20Pulls&color=2496ED" alt="Docker Pulls" />
  </a>
  <a href="https://github.com/bunkeriot/BunkerM/stargazers">
    <img src="https://img.shields.io/github/stars/bunkeriot/BunkerM?style=flat&logo=github&label=Stars&color=yellow" alt="GitHub Stars" />
  </a>
  <a href="https://github.com/bunkeriot/BunkerM/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-Apache%202.0-blue?logo=apache&logoColor=white" alt="License" />
  </a>
  <a href="https://github.com/bunkeriot/BunkerM/releases">
    <img src="https://img.shields.io/github/v/release/bunkeriot/BunkerM?logo=github&label=Release&color=green" alt="Latest Release" />
  </a>
</p>

<p align="center">
  <a href="https://www.reddit.com/r/BunkerM/">
    <img src="https://img.shields.io/badge/Join%20our-Community-orange?logo=reddit&logoColor=white" alt="Reddit Community" />
  </a>
  <a href="https://www.linkedin.com/in/mehdi-idrissi/">
    <img src="https://img.shields.io/badge/Follow%20me-LinkedIn-blue?logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
  <a href="https://x.com/BunkerIoT">
    <img src="https://img.shields.io/badge/Follow%20me-X%20(Twitter)-black?logo=x&logoColor=white" alt="X (Twitter)" />
  </a>
</p>

<p align="center">
  <a href="https://www.paypal.com/donate/?hosted_button_id=ZFEJHMWKU2Q4Q">
    <img src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif" alt="Donate via PayPal" />
  </a>
</p>

---

## 📋 Table of Contents

- [What is BunkerM?](#-what-is-bunkerm)
- [Quick Start](#-quick-start)
- [Core Features](#-core-features)
  - [Broker Dashboard](#broker-dashboard)
  - [ACL & Client Management](#-acl--client-management)
  - [MQTT Explorer](#-mqtt-explorer)
  - [Message History & Replay](#-message-history--replay)
  - [Smart Anomaly Detection](#-smart-anomaly-detection)
  - [Agents — Schedulers & Watchers](#-agents--schedulers--watchers)
  - [Local LLM — Private AI via LM Studio](#️-local-llm--private-ai-via-lm-studio)
  - [BunkerAI — Cloud AI Assistant](#-bunkerai--cloud-ai-assistant)
  - [Cloud Bridge Integrations](#-cloud-bridge-integrations)
- [Feature Comparison](#-feature-comparison)
- [Community vs BunkerAI](#-bunkerm-community-vs-bunkerai)
- [Troubleshooting](#-troubleshooting)
- [Support the Project](#-support-the-project)
- [Contact & Links](#-contact--links)
- [License](#-license)

---

## 🔍 What is BunkerM?

**BunkerM** is a free, open-source, containerized MQTT management platform. It bundles **Eclipse Mosquitto** with a full-featured web dashboard, packaging everything into a single Docker container — one command to get a production-ready MQTT broker with a management UI.

On top of the core broker management, BunkerM includes a **local statistical engine** (smart anomaly detection), a **local automation engine** (schedulers and watchers), and a **local AI engine** (LM Studio integration) — all running entirely inside your container. **BunkerAI** is the optional cloud AI layer that adds a more powerful natural-language assistant reachable via Telegram, Slack, or the built-in web chat.

**What you get out of the box:**

- Pre-configured Eclipse Mosquitto broker (MQTT 3.1.1 + 5)
- Web-based ACL management — clients, roles, groups, topic permissions
- Real-time monitoring dashboard, connected clients, and event logs
- MQTT Explorer — live topic tree with publish-from-browser
- **Message History & Replay** — every MQTT message stored locally in SQLite, searchable and replayable
- Statistical anomaly detection (Z-score, EWMA, spike, silence detectors)
- Local automation agents — cron schedulers and condition-based watchers
- **Local LLM AI assistant** via [LM Studio](https://lmstudio.ai) — fully private, no cloud required
- AWS IoT Core and Azure IoT Hub bridge configuration
- Optional BunkerAI subscription — cloud AI assistant with Telegram, Slack, and unlimited interactions

---

## 🚀 Quick Start

### Prerequisites

- [Docker](https://www.docker.com/get-started) installed

### Minimal — one command

```bash
docker run -d -p 1900:1900 -p 2000:2000 bunkeriot/bunkerm:latest
```

Open **http://localhost:2000** and set up your first Admin account.

| Port | Service |
|------|---------|
| `1900` | MQTT broker |
| `2000` | Web UI |

**Default MQTT credentials:** username `bunker` / password `bunker`

---

### Persistent deployment (recommended)

```bash
docker run -d \
  -p 1900:1900 \
  -p 2000:2000 \
  -v mosquitto_data:/var/lib/mosquitto \
  -v mosquitto_conf:/etc/mosquitto \
  -v auth_data:/data \
  bunkeriot/bunkerm:latest
```

---

### Remote access

```bash
docker run -d \
  -p 1900:1900 \
  -p 2000:2000 \
  -e HOST_ADDRESS=<YOUR_IP_OR_DOMAIN> \
  bunkeriot/bunkerm:latest
```

---

### Docker Compose

```yaml
services:
  bunkerm:
    image: bunkeriot/bunkerm:latest
    ports:
      - "1900:1900"
      - "2000:2000"
    volumes:
      - mosquitto_data:/var/lib/mosquitto
      - mosquitto_conf:/etc/mosquitto
      - auth_data:/data
    environment:
      - HOST_ADDRESS=localhost          # change to your IP/domain for remote access
      # - BUNKERAI_API_KEY=bkai_...     # optional: connect to BunkerAI
    restart: unless-stopped

volumes:
  mosquitto_data:
  mosquitto_conf:
  auth_data:
```

---

### First steps after launch

1. Open **http://localhost:2000** and create your Admin account (first-time setup wizard)
2. Go to **ACL → Clients** and create an MQTT client with a username and password
3. Connect your MQTT device or client to `localhost:1900` using those credentials
4. Explore the **Dashboard** to see live broker stats

---

## ⭐ Core Features

### Broker Dashboard

Real-time overview of your broker health:

- Connected clients count and history
- Message publish/receive rates
- Byte throughput (in/out)
- Subscription and retained message counts
- Recent MQTT connection events (connect, disconnect, subscribe, publish)

---

### 🔒 ACL & Client Management

Full dynamic security management powered by Mosquitto's Dynamic Security plugin:

#### Client Management
- Create, update, and delete MQTT clients
- Set credentials (username + password hash)
- Enable / disable clients individually
- Assign clients to groups

#### Role Management
- Create roles with fine-grained topic ACL rules
- Define `allow` / `deny` permissions per topic
- Wildcard topic support (`#`, `+`)
- ACL types: `publishClientSend`, `subscribeLiteral`, and more

#### Group Management
- Create groups and assign roles to them
- Add / remove clients from groups
- Set role priorities within groups

#### ACL Import / Export
Back up and restore your complete security configuration in one click:
- **Export** — downloads a JSON snapshot of all clients (including password hashes), roles, and groups
- **Import** — upload a previously exported JSON to fully restore your configuration; the broker reloads automatically
- Available in **ACL → Clients** next to the Create Client button

---

### 🔭 MQTT Explorer

Inspect and interact with live broker traffic directly from the browser:

- **Live topic tree** — full hierarchy of all active topics, refreshed every 3 seconds
- **Per-topic metadata** — latest value, message count, QoS, retain flag, last-updated timestamp
- **Search & filter** — instantly narrow the tree by typing a topic path fragment
- **Publish panel** — send messages from the browser: pick a client, enter a topic, choose payload type (RAW / JSON / XML with built-in validation), set QoS and retain flag

---

### 📼 Message History & Replay

Every MQTT message published through your broker is automatically captured and stored in a local SQLite database — no configuration required. History starts accumulating from the moment BunkerM starts, and it keeps running silently in the background.

#### What gets stored

All messages published to the broker are captured, excluding internal `$SYS/` diagnostics. Each record stores:

| Field | Description |
|-------|-------------|
| Timestamp | Millisecond-precision UTC time of receipt |
| Topic | Full topic path |
| Payload | Message content (binary payloads stored as base64) |
| QoS | Quality of service level (0 / 1 / 2) |
| Retain flag | Whether the message was retained |
| Size | Payload size in bytes |

#### Querying history

Navigate to **Logs → Message History** in the sidebar to access:

- **Stats overview** — total stored messages, unique topic count, database size on disk, and retention window
- **Topic filter** — dropdown populated from all topics seen by the broker, with message counts
- **Free-text search** — matches against topic path or payload content
- **Paginated table** — 100 messages per page, newest-first, with full metadata

#### Replay

Every message row has a **Replay** button. Click it to open a dialog pre-filled with the original topic and payload. You can edit the payload, choose QoS and retain flag, then publish directly back to the broker — useful for retesting device logic or simulating conditions.

#### Retention limits

By default, BunkerM keeps up to **50,000 messages** and **7 days** of history. Older messages are pruned automatically. These limits are configurable via environment variables:

```bash
-e HISTORY_MAX_MESSAGES=50000   # max records in the database
-e HISTORY_MAX_AGE_DAYS=7       # max age of any stored message
```

#### Storage

History is stored in a SQLite file at `/var/lib/history/history.db` inside the container. To persist history across container restarts, mount a Docker volume:

```bash
docker run -d \
  -p 1900:1900 -p 2000:2000 \
  -v history_data:/var/lib/history \
  bunkeriot/bunkerm:latest
```

The Docker Compose file already includes this volume by default.

---

### 🤖 Smart Anomaly Detection

A fully local statistical engine that continuously monitors your MQTT traffic and raises alerts when behavior deviates from the baseline. No cloud dependency — everything runs inside the container.

#### How it works

The engine polls the broker every 10 seconds, builds statistical baselines over 1-hour and 24-hour sliding windows, and runs four independent detectors every 60 seconds:

| Detector | What it catches |
|----------|-----------------|
| **Z-score** | Values that deviate more than 3σ from the rolling mean |
| **EWMA** | Gradual drift via exponentially weighted moving average |
| **Spike** | Sudden burst in message rate (>3× the 30-minute baseline) |
| **Silence** | Topics that stop publishing for longer than 2× their normal interval |

Alerts are generated with severity levels: `low` / `medium` / `high` / `critical`.

#### Monitoring pages (Monitoring sidebar section)

| Page | Description |
|------|-------------|
| **Metrics** | Per-topic baselines — mean, std dev, message count for 1h and 24h windows |
| **Anomalies** | All detected anomalies with entity, type, severity, and raw detection context |
| **Alerts** | Actionable alert feed with severity badges and one-click Acknowledge |

---

### ⚙️ Agents — Schedulers & Watchers

A local automation engine built into every BunkerM instance. Agents run entirely on your infrastructure — no cloud connectivity required after creation.

#### Schedulers
Publish MQTT messages on a recurring cron schedule:
- Full cron expression support with built-in presets (every minute, hourly, daily, weekly, etc.)
- Live cron preview showing next 5 run times
- Tracks last fired time and total execution count
- Examples: "turn on pump every day at 06:00", "send heartbeat every 5 minutes"

#### Watchers
Monitor MQTT topics and trigger actions when conditions are met:
- Condition operators: `>` `<` `>=` `<=` `==` `!=` `contains` `starts_with` `any_change`
- JSON field extraction using dot-path notation (`sensors.temperature`)
- Response message templates with `{{value}}`, `{{topic}}`, `{{timestamp}}`
- Cooldown enforcement (minimum time between triggers)
- One-shot mode (auto-delete after first trigger)
- Real-time notification bell in the dashboard (Server-Sent Events, sub-2s delivery)

#### Limits

| | Community | BunkerAI Starter | BunkerAI Pro / Team |
|-|:---------:|:----------------:|:-------------------:|
| Agents (schedulers + watchers combined) | Up to 2 | Up to 2 | Unlimited |
| Local execution (no cloud required) | ✓ | ✓ | ✓ |
| Agents kept after downgrade / offline | ✓ | ✓ | ✓ |
| AI-created agents via natural language | ✗ | ✓ | ✓ |
| Telegram / Slack watcher notifications | ✗ | ✗ | ✓ |

**Activation:** A one-time free activation is required to unlock agent creation. BunkerM attempts this automatically on first start. For air-gapped deployments, create a free account at [bunkerai.dev](https://bunkerai.dev) and paste your Community key into the dashboard — no ongoing internet connection required after that.

---

### 🖥️ Local LLM — Private AI via LM Studio

BunkerM Community includes a built-in **Local LLM** integration. Connect any model running in [LM Studio](https://lmstudio.ai) to get a fully private, offline-capable AI assistant that understands your live broker state and can take actions on your behalf — no cloud account or subscription required.

#### How it works

On every chat message, BunkerM injects a live snapshot of your broker (connected clients, active topics with their latest payloads, broker stats, registered ACL clients) directly into the model's context. The model can then respond accurately to questions about your live MQTT environment and execute actions through BunkerM's internal APIs.

#### Capabilities

- **Plain-English device control** — say "turn off my room light" and the AI figures out the right topic and payload from your annotations and context, then publishes it
- **ACL management** — create, enable, disable, delete MQTT clients and batch-create multiple clients at once
- **Live topic queries** — "What is the current value of the door sensor?" returns the actual retained payload
- **Broker awareness** — ask about connected clients, message rates, subscriptions, and uptime

#### Setup

1. Install [LM Studio](https://lmstudio.ai) and load a model (Qwen2.5-7B-Instruct or Llama-3-Instruct recommended)
2. Start the LM Studio local server (default port: 1234)
3. In BunkerM go to **Settings → Integrations → Local LLM**, enter `http://host.docker.internal:1234`, fetch models, and save
4. Switch to **Local LLM** mode in **AI → Chat**

> Full guide: [bunkerai.dev/docs/local-llm](https://bunkerai.dev/docs/local-llm)

---

### 🧠 BunkerAI — Cloud AI Assistant

**BunkerAI** is the optional cloud AI layer for BunkerM. Subscribe at [bunkerai.dev](https://bunkerai.dev) to unlock a more powerful natural-language assistant with cross-channel memory, Telegram and Slack integrations, and higher interaction limits.

> BunkerM handles your local broker. BunkerAI handles the cloud intelligence.

#### Capabilities
- **READ** — query live broker stats, topic payloads, connected clients, anomaly alerts, and topic annotations
- **WRITE** — publish MQTT messages by describing the intent ("turn on light 1", "set thermostat to 22°C")
- **CREATE** — build schedulers and watchers through natural conversation ("alert me if temperature exceeds 80")
- **MANAGE** — full ACL management, broker configuration, and agent control through plain English

#### Channels

| Channel | Starter | Pro / Team |
|---------|:-------:|:----------:|
| **Web Chat** (built-in at AI → Chat) | ✓ | ✓ |
| **Telegram** (message your dedicated bot) | ✗ | ✓ |
| **Slack** (OAuth workspace connection) | ✗ | ✓ |

Configure connectors at **Settings → Cloud** in the dashboard.

#### Plans

| Plan | Monthly | Interactions / month | Channels | Agents |
|------|---------|----------------------|----------|--------|
| **Starter** | $5 | 100 | Web Chat only | Up to 2 |
| **Pro** | $15 | 500 | Web Chat + Telegram + Slack | Unlimited |
| **Team** | $49 | 2,000 | Web Chat + Telegram + Slack | Unlimited |
| **Business** | Custom | Custom | All channels | Unlimited |

> One interaction = one complete AI request/response cycle (may involve multiple internal tool calls).
> Manage your subscription and credit balance at **Settings → Credits** in the BunkerM dashboard.

---

### ☁️ Cloud Bridge Integrations

Forward MQTT traffic to major cloud providers:

#### AWS IoT Core Bridge
- Configure AWS IoT endpoint and region
- Upload device certificates directly from the UI
- Define topic mapping rules (local ↔ cloud)
- Secure TLS mutual authentication

#### Azure IoT Hub Bridge
- Configure IoT Hub connection string
- SAS token management and rotation
- Device-to-cloud and cloud-to-device topic routing

---

## 📊 Feature Comparison

### Infrastructure & Scaling
| Feature | Community | Pro | Enterprise |
|---------|:---------:|:---:|:----------:|
| Max MQTT Clients | Unlimited | Unlimited | Unlimited |
| High Availability & Clustering | ✗ | ✗ | ✓ |
| Cluster Management UI | ✗ | ✗ | ✓ |
| Load Balancer | ✗ | ✗ | ✓ |
| Enhanced HA Monitoring | ✗ | ✗ | ✓ |

### Security
| Feature | Community | Pro | Enterprise |
|---------|:---------:|:---:|:----------:|
| Client Authentication (Username + Password) | ✓ | ✓ | ✓ |
| Dynamic Security Plugin | ✓ | ✓ | ✓ |
| ACLs (Client, Role, Group levels) | ✓ | ✓ | ✓ |
| ACL Import / Export (JSON backup & restore) | ✓ | ✓ | ✓ |
| Self-Signed SSL | ✓ | ✓ | ✓ |
| OAuth 2.0 / JWT Authentication | ✓ | ✓ | ✓ |
| Offline Authentication | ✗ | ✓ | ✓ |
| Anonymous Client Access | ✗ | ✓ | ✓ |
| Client Certificate Authentication | ✗ | ✗ | ✓ |
| LDAP Authentication | ✗ | ✗ | ✓ |
| HTTPS/TLS Termination | ✗ | ✗ | ✓ |
| Audit Trail | ✗ | ✗ | On-demand |
| Custom CAs | ✗ | ✗ | On-demand |
| PSK Authentication | ✗ | ✗ | On-demand |

### Monitoring & AI
| Feature | Community | Pro | Enterprise |
|---------|:---------:|:---:|:----------:|
| Broker Dashboard & Stats | ✓ | ✓ | ✓ |
| Connected Clients Listing | ✓ | ✓ | ✓ |
| Real-time MQTT Event Logs | ✓ | ✓ | ✓ |
| Message History & Replay (50K messages, 7d) | ✓ | ✓ | ✓ |
| Statistical Anomaly Detection | ✓ | ✓ | ✓ |
| AI Metrics Engine (1h / 24h baselines) | ✓ | ✓ | ✓ |
| Smart Alert Feed with Severity Levels | ✓ | ✓ | ✓ |
| BunkerAI natural-language assistant | ✗ | BunkerAI plan | BunkerAI plan |
| Anomaly alert forwarding (Telegram / Slack) | ✗ | BunkerAI plan | BunkerAI plan |
| Behavioral Security Analysis | ✗ | ✗ | ✓ |
| AI-generated ACL Recommendations | ✗ | ✗ | ✓ |

### Agents & Automation
| Feature | Community / Starter | Pro / Team | Enterprise |
|---------|:-------------------:|:----------:|:----------:|
| MQTT Scheduler (cron-based publishes) | Up to 2 | Unlimited | Unlimited |
| MQTT Watcher (condition-based alerts) | Up to 2 | Unlimited | Unlimited |
| Local agent execution (no cloud required) | ✓ | ✓ | ✓ |
| Agents kept after downgrade / offline | ✓ | ✓ | ✓ |
| Real-time notification bell (SSE) | ✓ | ✓ | ✓ |
| AI-created agents via natural language | ✗ | ✓ | ✓ |
| Telegram / Slack watcher notifications | ✗ | ✓ | ✓ |



### Protocol Support
| Feature | Community | Pro | Enterprise |
|---------|:---------:|:---:|:----------:|
| MQTT 3.1.1 | ✓ | ✓ | ✓ |
| MQTT 5 | ✓ | ✓ | ✓ |
| MQTT over TLS (MQTTS) | ✓ | ✓ | ✓ |
| WebSockets (WS) | ✓ | ✓ | ✓ |
| WebSockets over TLS (WSS) | ✓ | ✓ | ✓ |
| QoS 0 / 1 / 2 | ✓ | ✓ | ✓ |
| Retained Messages | ✓ | ✓ | ✓ |
| Last Will Messages | ✓ | ✓ | ✓ |
| Persistent Sessions | ✓ | ✓ | ✓ |
| Sparkplug | ✗ | ✗ | ✓ |

### Platform Support
| Feature | Community | Pro | Enterprise |
|---------|:---------:|:---:|:----------:|
| Docker (Linux, Windows, macOS, Raspberry Pi) | ✓ | ✓ | ✓ |
| Kubernetes | ✓ | ✓ | ✓ |
| OpenShift | ✓ | ✓ | ✓ |
| ARM / RPi native | ✓ | ✓ | ✓ |
| White Labeling | ✗ | ✗ | ✓ |

---

## 💰 BunkerM Community vs BunkerAI

**BunkerM Community** is the free, self-hosted MQTT management platform. It is open-source and always will be.

**BunkerAI** is a separate, optional subscription service that adds AI intelligence to your BunkerM instance. You do not need BunkerAI to run BunkerM — it simply adds a natural-language assistant and cross-channel notifications on top.

### Pricing philosophy

**Pay for AI intelligence. Agents are yours to keep.**

- **Agents** (schedulers + watchers) are a local BunkerM feature. They run on your infrastructure regardless of any subscription status. Once created, agents keep executing even if you cancel BunkerAI or run out of interactions.
- **BunkerAI** is billed monthly by interaction quota. When your quota runs out, the AI assistant pauses — your broker, agents, and all local features continue unaffected.
- **Subscribing to Pro or Team** removes the 2-agent ceiling and unlocks Telegram/Slack channels in addition to the larger interaction quota.

This model is designed for self-hosted, industrial, and air-gapped environments where production automations **cannot be held hostage by a billing event**.

### Activation

BunkerM Community requires a **one-time free activation** to enforce the 2-agent limit:

1. BunkerM silently attempts auto-activation on first start.
2. For air-gapped deployments, create a free account at [bunkerai.dev](https://bunkerai.dev), copy your Community key, and paste it into the dashboard.
3. The license key is stored locally and verified offline using cryptographic signatures — BunkerAI does not need to be reachable again after activation.

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't reach the web UI | Check that port 2000 is not in use: `docker ps` and `lsof -i :2000` |
| MQTT clients can't connect | Verify port 1900 is mapped; check client credentials in ACL → Clients |
| Container won't start | Run `docker logs <container_id>` to inspect errors |
| Agents not firing | Confirm the container has internet access for one-time activation; check agent status in AI → Agents |
| BunkerAI not connecting | Verify `BUNKERAI_API_KEY` env var is set correctly; check Settings → Cloud status card |
| SSL/TLS errors | Ensure certificates are valid and paths are correctly mounted |

---

## ❤️ Support the Project

BunkerM is built and maintained by a solo developer. If it saves you time or powers your IoT projects, consider supporting its development:

[![PayPal](https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif)](https://www.paypal.com/donate/?hosted_button_id=ZFEJHMWKU2Q4Q)

Your support funds:
- New feature development
- Bug fixes and security patches
- Documentation and guides
- Community support

---

## 🔗 Contact & Links

| | |
|-|-|
| 🌐 Website | [bunkerai.dev](https://bunkerai.dev) |
| 📧 Support | [support@bunkerai.dev](mailto:support@bunkerai.dev) |
| 💼 LinkedIn | [mehdi-idrissi](https://www.linkedin.com/in/mehdi-idrissi/) |
| 🐙 GitHub | [bunkeriot/BunkerM](https://github.com/bunkeriot/BunkerM) |
| 💬 Discussions | [GitHub Discussions](https://github.com/bunkeriot/BunkerM/discussions) |
| 🐦 X / Twitter | [@BunkerIoT](https://x.com/BunkerIoT) |
| 🟠 Reddit | [r/BunkerM](https://www.reddit.com/r/BunkerM/) |

---

## 📜 License

This project is licensed under the **Apache License 2.0** — free to use, modify, and distribute, including for commercial purposes.

[Full license text →](LICENSE)

---

<p align="center">Made with ❤️ for the IoT community · <a href="https://bunkerai.dev">bunkerai.dev</a></p>
