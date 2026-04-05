# Frequently Asked Questions

## General Questions

### What is BunkerM?

BunkerM is an all-in-one Mosquitto MQTT broker with a comprehensive web UI for easy management. It combines a pre-configured Mosquitto broker with a powerful management interface, dynamic security controls, monitoring capabilities, and cloud integration features.

### Is BunkerM open source?

Yes, BunkerM Community Edition is open source and freely available. There are also Pro and Enterprise editions with additional features for commercial use.

### What platforms does BunkerM support?

BunkerM runs on any platform that supports Docker, including:
- Linux (all major distributions)
- Windows
- macOS
- Raspberry Pi and other ARM-based devices

### What MQTT versions does BunkerM support?

BunkerM supports:
- MQTT 3.1
- MQTT 3.1.1
- MQTT 5.0

## Installation and Setup

### What are the system requirements for BunkerM?

Minimum requirements:
- Docker 19.03 or higher
- 1+ CPU cores
- 512MB RAM (1GB+ recommended)
- 1GB free disk space
- Ports 1900 and 2000 available

### How do I install BunkerM?

The simplest way is using Docker:

```bash
docker run -d -p 1900:1900 -p 2000:2000 bunkeriot/bunkerm
```

For persistent data:

```bash
docker run -d -p 1900:1900 -p 2000:2000 \
  -v mosquitto_data:/var/lib/mosquitto \
  -v mosquitto_conf:/etc/mosquitto \
  -v auth_data:/data \
  bunkeriot/bunkerm
```

### What ports does BunkerM use?

By default, BunkerM uses:
- Port 1900 for MQTT communication
- Port 2000 for the web interface

These can be mapped to different ports if needed.

### How do I access the web interface?

Open your web browser and navigate to `http://localhost:2000` (or the appropriate address if installed on a remote server).

### What are the default login credentials?

The default credentials are:
- Username: admin@example.com
- Password: password123

You should change these immediately after your first login.

## MQTT Features

### How many clients can connect to BunkerM?

BunkerM can handle thousands of concurrent client connections, limited only by your system resources. The default configuration allows unlimited connections, but you can set a limit in the broker configuration.

### Does BunkerM support WebSockets?

Yes, BunkerM supports MQTT over WebSockets, allowing web applications to connect directly to the broker.

### Does BunkerM support TLS/SSL?

Yes, BunkerM can be configured to use TLS/SSL for secure communications. The default configuration uses HTTP for simplicity, but you can configure it to use your own certificates for HTTPS.

### Can I use BunkerM with existing MQTT clients?

Yes, BunkerM is compatible with any standard MQTT client, including:
- Mosquitto clients
- MQTT.js
- Paho
- HiveMQ clients
- And many others

## Security

### How does BunkerM handle authentication?

BunkerM uses username and password authentication for MQTT clients. You can create and manage client credentials through the web interface.

### How does access control work in BunkerM?

BunkerM uses a role-based access control system:
1. Create roles with specific topic permissions
2. Assign roles to clients directly or via groups
3. Clients can only access topics according to their roles' permissions

### Is communication between clients and the broker encrypted?

Yes, BunkerM supports TLS/SSL encryption for secure communication between clients and the broker.

### Can I integrate BunkerM with external authentication systems?

The Enterprise Edition supports integration with LDAP and OAuth 2.0/JWT authentication systems.

## Management and Monitoring

### How can I monitor broker performance?

BunkerM provides a comprehensive dashboard showing:
- Connected clients
- Message throughput
- Subscription counts
- Retained message counts
- Real-time activity logs

### Can I export logs and metrics?

Yes, you can export broker logs and performance metrics for external analysis or record-keeping.

### How do I back up my BunkerM configuration?

To back up your configuration and data:

```bash
docker run --rm -v mosquitto_data:/data -v $(pwd)/backup:/backup \
  alpine sh -c "cd /data && tar czf /backup/mosquitto_data.tar.gz ."
```

### Can I manage multiple brokers from one interface?

The Enterprise Edition supports managing multiple brokers from a single interface.

## Cloud Integration

### What cloud platforms does BunkerM integrate with?

The Pro and Enterprise editions support integration with:
- AWS IoT Core
- Azure IoT Hub

### How does the cloud integration work?

BunkerM creates a bridge between your local MQTT broker and the cloud platform, allowing bidirectional message flow between local devices and cloud services.

### Do I need cloud integration to use BunkerM?

No, cloud integration is an optional feature. BunkerM functions perfectly as a standalone MQTT broker without any cloud connectivity.

## Troubleshooting

### Why can't my clients connect to the broker?

Common reasons include:
- Incorrect client credentials
- Firewall blocking port 1900
- Broker not running
- Reaching maximum connection limit

Check the [Troubleshooting Guide](troubleshooting.md) for detailed solutions.

### How do I reset the admin password if I forget it?

If you've forgotten the admin password, you can reset it by:

```bash
docker exec -it <container_id> /bin/bash
cd /app
node reset-admin-password.js
```

This will reset the password to the default "admin".

## Agents (Schedulers & Watchers)

### What are Agents?

Agents are local automations that run directly on your BunkerM instance — no cloud connection required to execute them:

- **Schedulers** publish an MQTT message on a cron schedule (e.g. "turn on pump every day at 6am").
- **Watchers** monitor an MQTT topic and fire a notification when a condition is met (e.g. "alert me when temperature exceeds 30°C").

### How many agents can I create on the Community edition?

Up to **2 agents** combined (schedulers + watchers). This is enforced both in the UI and server-side.

### Do agents require BunkerAI Cloud to run?

No. Agents execute entirely on your local infrastructure. The MQTT broker, watcher engine, and scheduler all run inside the BunkerM Docker container. BunkerAI Cloud is not involved in agent execution.

### What happens if I run out of credits while having agents running?

Nothing happens to your agents. Credits fund AI features (chat assistant, Telegram/Slack notifications, anomaly alerts). When credits are exhausted, AI features pause. Local agents — schedulers and watchers — keep running indefinitely.

### What happens to my agents if I go offline or cancel my Premium subscription?

Agents you have already created continue running on your local infrastructure. The 2-agent limit for Community applies at **creation time**, not at execution time. Agents are yours to keep permanently.

### Do I need internet to use agents?

Only for the **initial one-time activation** (free). After that, agents work completely offline. For air-gapped deployments, see the activation question below.

## Activation

### Why does BunkerM require activation?

A one-time free activation lets us enforce the 2-agent Community limit server-side (in addition to the frontend), which prevents the limit from being bypassed by calling the API directly. The activation is cryptographically signed and verified locally — no ongoing cloud dependency after the first activation.

### How does activation work?

1. On first start, BunkerM silently attempts auto-activation by contacting BunkerAI Cloud.
2. If successful, a signed license key is stored locally. Done — you never need to think about it again.
3. If BunkerAI Cloud is unreachable (air-gapped network), a banner appears in the dashboard with your **Instance ID**.

### How do I activate BunkerM in an air-gapped environment?

1. Note your **Instance ID** shown in the activation banner (e.g. `BKMR-A1B2C3D4`).
2. From any internet-connected device, visit [bunkerai.dev](https://bunkerai.dev) and create a free account.
3. Enter your Instance ID to generate your Community key.
4. Copy the key and paste it into the activation field in the BunkerM dashboard.
5. Click **Apply**. BunkerM stores the key locally — no internet needed after this point.

### Does the activation key expire?

No. Community license keys do not expire. Once activated, your instance remains activated permanently, even without any internet connection.

### Does my activation key work on multiple BunkerM instances?

No. Each key is cryptographically bound to the Instance ID it was generated for. A separate (free) activation is required for each deployment. This prevents key sharing while keeping the process free.

### What is the Instance ID?

A unique identifier generated on BunkerM's first start, stored in the persistent data volume. It survives container rebuilds on the same host (`docker compose down/up`). A fresh volume on a new host generates a new Instance ID requiring a new (free) activation.

## Licensing and Support

### What's the difference between Community and Premium?

| | Community | Premium |
|---|---|---|
| Price | Free forever | Credits-based |
| Agents | Up to 2 | Unlimited |
| Agent execution | Local, no cloud | Local, no cloud |
| AI chat assistant | ✗ | ✓ (credits) |
| Telegram / Slack alerts | ✗ | ✓ (credits) |
| Activation | One-time, free | One-time |

**Key principle:** Agents are yours to keep once created — on any tier. Credits fund ongoing AI features, not agent execution.

### How does the credit system work?

Credits are consumed by AI-powered features: natural language chat, anomaly alert forwarding to Telegram/Slack, and AI-generated watchers/schedulers. Local agent execution (the schedulers and watchers firing on your broker) consumes zero credits.

When your credit balance reaches zero, AI features pause until you top up. Your agents, ACL configuration, and monitoring continue working normally.

### How do I get support for BunkerM?

- **Community Edition**: GitHub issues and community forums
- **Premium**: Email support at support@bunkerai.dev, priority issue resolution

### How can I contribute to BunkerM?

You can contribute to BunkerM by:
- Submitting pull requests on GitHub
- Reporting bugs and suggesting features
- Improving documentation
- Sharing your experience with the community

### How do I upgrade from Community to Premium?

Visit [bunkerai.dev](https://bunkerai.dev) to create an account and purchase a credit bundle. Premium unlocks unlimited agents and AI features.