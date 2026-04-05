# BunkerM Documentation

Get up and running fast

Everything you need to deploy, configure, and extend BunkerM. One container, one command.

**QUICK START**

```bash
docker run -d -p 1900:1900 -p 2000:2000 bunkeriot/bunkerm:latest
```

Then open `http://localhost:2000` in your browser and set up your first Admin account.

---

<div class="grid cards" markdown>

- :material-home-assistant: **Home Assistant**

    Run BunkerM as a native Home Assistant add-on.

    [:octicons-arrow-right-24: Setup guide](integrations/home-assistant.md)

- :fontawesome-brands-slack: **Slack**

    Chat with your broker from any Slack channel.

    [:octicons-arrow-right-24: Setup guide](integrations/slack.md)

- :fontawesome-brands-telegram: **Telegram**

    Control your broker via Telegram bot.

    [:octicons-arrow-right-24: Setup guide](integrations/telegram.md)

- :material-chat: **Web Chat**

    Use the built-in AI chat directly in the dashboard.

    [:octicons-arrow-right-24: Open Web Chat](integrations/web-chat.md)

</div>

---

## What is BunkerM?

BunkerM is an open-source, containerized MQTT management platform. It bundles Eclipse Mosquitto with a full web dashboard in a single Docker container. No manual broker setup, no juggling separate tools.

With BunkerM you get:

- A production-ready Mosquitto MQTT broker
- A web UI for managing clients, roles, groups, and ACLs
- Real-time monitoring and connection logs
- A built-in MQTT Browser to explore topics and payloads
- AI-powered assistance through BunkerAI (optional cloud feature)

---

## BunkerM vs BunkerAI

**BunkerM** is the open-source core. It gives you a fully functional Mosquitto MQTT broker with a web management interface. You can create clients, define ACL rules, monitor connections, browse topics, and configure the broker - all from a browser. BunkerM works completely standalone without any cloud dependency or account required.

**BunkerAI** is an optional cloud-connected layer that adds AI capabilities on top of BunkerM. When you connect your BunkerM instance to BunkerAI Cloud from Settings > Integrations, you unlock:

- A conversational AI assistant that lets you control your broker in plain language
- Automated watchers that monitor topics and trigger actions when conditions are met
- Scheduled jobs that publish messages on a cron schedule
- Smart anomaly detection and intelligent alerts
- Multi-channel access via Web Chat, Slack, and Telegram
- Natural-language ACL management ("create a client called sensor1 with read access to sensor/#")

BunkerAI uses AI to give you full natural-language control over your Mosquitto broker, including ACL management. All BunkerAI features are surfaced in the BunkerM dashboard once you connect. BunkerM remains fully functional without BunkerAI - the AI layer is additive, not required.

---

## Running BunkerM with Persistent Data

### Basic (data lost on restart)

```bash
docker run -d -p 1900:1900 -p 2000:2000 bunkeriot/bunkerm:latest
```

This is fine for evaluation but your MQTT clients, ACL rules, and web UI accounts will be lost when the container stops.

### With persistent volumes (recommended for production)

```bash
docker run -d \
  -p 1900:1900 \
  -p 2000:2000 \
  -v bunkerm_data:/nextjs/data \
  -v mosquitto_data:/var/lib/mosquitto \
  -v mosquitto_conf:/etc/mosquitto \
  --name bunkerm \
  bunkeriot/bunkerm:latest
```

What each volume stores:

| Volume | Contents |
|--------|----------|
| `bunkerm_data` | Web UI user accounts, BunkerAI settings, agent data, anomaly history, API keys |
| `mosquitto_data` | MQTT persistence files, dynamic security (clients, ACLs, roles, groups) |
| `mosquitto_conf` | Mosquitto broker configuration files |

### With Docker Compose (recommended)

```yaml
version: "3.8"
services:
  bunkerm:
    image: bunkeriot/bunkerm:latest
    ports:
      - "1900:1900"
      - "2000:2000"
    volumes:
      - bunkerm_data:/nextjs/data
      - mosquitto_data:/var/lib/mosquitto
      - mosquitto_conf:/etc/mosquitto
    restart: unless-stopped

volumes:
  bunkerm_data:
  mosquitto_data:
  mosquitto_conf:
```

Save this as `docker-compose.yml` and run:

```bash
docker compose up -d
```

See [Running BunkerM with Persistent Storage](getting-started/persistent-storage.md) for full details including backup strategies and upgrade procedures.

---

## Documentation Sections

### Getting Started
- [Quick Start](getting-started/quick-start.md) - Get BunkerM running in minutes
- [Installation](getting-started/installation.md) - Full installation options
- [Persistent Storage](getting-started/persistent-storage.md) - Keep your data across restarts
- [First Login](getting-started/first-login.md) - Initial setup and admin account

### User Guide
- [Connected Clients](user-guide/connected-clients.md) - View and manage live connections
- [ACL Clients](user-guide/acl-clients.md) - Manage MQTT client accounts and credentials
- [ACL Roles](user-guide/acl-roles.md) - Define topic access rules
- [ACL Groups](user-guide/acl-groups.md) - Organize clients into groups
- [MQTT Browser](user-guide/mqtt-browser.md) - Explore topics and payloads in real time
- [Agents](user-guide/agents.md) - Watchers and scheduled jobs powered by BunkerAI
- [Anomalies](user-guide/anomalies.md) - Smart anomaly detection
- [Broker Logs](user-guide/broker-logs.md) - Mosquitto broker event logs
- [Client Logs](user-guide/client-logs.md) - MQTT client connection events
- [Settings - Broker](user-guide/settings-broker.md) - Configure Mosquitto from the UI
- [Settings - Integrations](user-guide/settings-integrations.md) - Connect BunkerAI, Slack, Telegram
- [Settings - Annotations](user-guide/settings-annotations.md) - Label your topics for AI
- [Settings - Subscription](user-guide/settings-subscription.md) - BunkerAI plans and credits
- [Admin - Users](user-guide/admin-users.md) - Manage BunkerM web UI accounts

### Integrations
- [Home Assistant](integrations/home-assistant.md) - Native HA add-on setup
- [Slack](integrations/slack.md) - Chat with your broker from Slack
- [Telegram](integrations/telegram.md) - Control your broker via Telegram
- [Web Chat](integrations/web-chat.md) - Built-in AI chat in the dashboard
- [Shared AI Memory](integrations/shared-memory.md) - How AI memory works across channels
