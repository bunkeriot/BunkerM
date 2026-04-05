# Settings - Broker

The Broker Settings page lets you configure Mosquitto directly from the BunkerM web UI. Changes made here update the broker's configuration and, where required, trigger a broker restart.

---

## What Broker Settings Control

Broker settings correspond to Mosquitto configuration directives. You can adjust:

- Network listening ports
- Connection and session limits
- Message delivery parameters
- Persistence settings
- Log verbosity

You do not need to edit `mosquitto.conf` manually. All essential settings are exposed through this page.

---

## Key Settings

### MQTT Port

The TCP port Mosquitto listens on for standard MQTT connections.

- **Default:** `1900` (BunkerM's default; standard MQTT is `1883`)
- **Note:** Changing this port requires updating all connected devices. They will fail to connect until reconfigured with the new port. Make sure you have a plan for updating all clients before changing this value in a production environment.

### WebSocket Port

The port for MQTT-over-WebSocket connections. Useful for browser-based MQTT clients.

- **Default:** Disabled (no WebSocket listener by default)
- Enable and set a port to allow WebSocket-based MQTT clients to connect.

### Max Connections

The maximum number of simultaneous MQTT client connections the broker will accept.

- **Default:** `-1` (unlimited)
- Set a positive integer to cap connections. New connection attempts beyond this limit will be rejected.

### Max Inflight Messages

The maximum number of QoS 1 and QoS 2 messages that can be in transit (unacknowledged) for a single client at any time.

- **Default:** `20`
- Lower this value if you want to reduce memory usage. Raise it for high-throughput clients.

### Max Queued Messages

The maximum number of messages held in the queue for a persistent client (clean session = false) that is currently offline.

- **Default:** `100`
- Messages beyond this limit are dropped when the queue is full.

### Persistence

Controls whether Mosquitto saves state to disk so it survives restarts.

- **Enabled:** Retained messages, persistent subscriptions, and QoS 1/2 queued messages are saved to disk. State is restored when the broker restarts.
- **Disabled:** All state is held in memory and lost on restart.

With BunkerM's persistent volume setup (`mosquitto_data:/var/lib/mosquitto`), persistence data is preserved across container restarts.

### Log Level

Controls how verbose the broker's log output is.

| Level | What is logged |
|-------|----------------|
| `error` | Errors only |
| `warning` | Errors and warnings |
| `notice` | Connections, disconnections, significant events |
| `information` | General operational information |
| `debug` | Detailed diagnostic output (very verbose) |

For production environments, `notice` or `warning` is recommended. Use `debug` only when actively troubleshooting a specific issue - it generates a very large volume of log output.

---

## Applying Changes

After modifying any settings:

1. Review your changes.
2. Click **Save** or **Apply**.
3. If the setting requires a broker restart (such as port changes), BunkerM will prompt you to confirm the restart.

A broker restart will briefly disconnect all currently connected clients. They will attempt to reconnect according to their own reconnection logic.

Settings that do not require a restart (such as log level) take effect immediately without disconnecting clients.

---

## Warning About Changing the MQTT Port

The MQTT port change is the most disruptive change you can make. Before changing it:

1. Note the new port you intend to use.
2. Update all your MQTT clients (devices, apps, scripts) to use the new port.
3. Make sure any firewall rules are updated to allow connections on the new port.
4. Apply the change in BunkerM and confirm the broker restart.
5. Verify clients are reconnecting on the new port.

If you change the port without updating clients, they will disconnect and fail to reconnect until you update their configuration. In a production environment, coordinate this change as a planned maintenance event.

---

## API Key

The API Key section shows the BunkerM internal API key. This key is used by the frontend to authenticate requests to the backend API services inside the container.

**What it is:** A shared secret that secures communication between the Next.js frontend and the FastAPI backend services. It is set at container startup and can be regenerated if needed.

**When to regenerate:** If you suspect the key has been exposed. Note that regenerating the key will not affect MQTT client connections - it only affects the web dashboard's API communication.

**How to view:** Click **Show** next to the API Key field.

**How to regenerate:** Click **Regenerate Key**. The new key is applied immediately. You do not need to restart the container or reconnect MQTT clients.

!!! note
    The API key is different from MQTT client credentials. It is an internal security mechanism for the BunkerM web application and does not affect how MQTT devices authenticate with the broker.
