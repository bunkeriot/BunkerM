# Logs - Client Logs

Client Logs record MQTT client connection and activity events in a structured, queryable format. Unlike Broker Logs which show raw Mosquitto output, Client Logs are captured by BunkerM's own logging service and presented in a clean table you can filter and search.

---

## What Client Logs Show

Client Logs capture key lifecycle events for every MQTT client that interacts with your broker:

- **CONNECT** - A client successfully connected to the broker
- **DISCONNECT** - A client disconnected (either cleanly or due to a timeout)
- **SUBSCRIBE** - A client subscribed to a topic or topic pattern
- **PUBLISH** - A client published a message (at higher verbosity settings)
- **AUTH_FAIL** - A client failed to authenticate (wrong credentials or disabled)

Each event is stored with structured metadata, making it easy to search and filter - much more convenient than grepping raw log text.

---

## How to Access Client Logs

1. Click **Logs** in the left sidebar.
2. Select **Client Logs**.

The Client Logs page shows a table of recent events sorted by timestamp, newest first.

---

## Information Shown Per Event

Each row in the Client Logs table contains:

| Field | Description |
|-------|-------------|
| **Timestamp** | Date and time the event occurred |
| **Event Type** | The type of event (CONNECT, DISCONNECT, SUBSCRIBE, AUTH_FAIL, etc.) |
| **Client ID** | The MQTT client identifier |
| **Username** | The username provided during authentication |
| **IP Address** | The remote IP address of the client |
| **Protocol** | MQTT protocol version (3.1, 3.1.1, or 5.0) |
| **Topic** | For SUBSCRIBE and PUBLISH events, the topic involved |
| **Details** | Additional context specific to the event type |

---

## Event Types in Detail

### CONNECT

Logged when a client successfully establishes an MQTT connection. This includes the client ID, username, IP address, protocol version, and keep-alive interval.

### DISCONNECT

Logged when a client ends its MQTT session. The details field indicates whether the disconnect was clean (initiated by the client) or unexpected (keep-alive timeout, network drop, or forceful disconnect from the broker).

### SUBSCRIBE

Logged when a client subscribes to a topic or wildcard pattern. The topic field shows the pattern the client subscribed to, along with the requested QoS level.

### AUTH_FAIL

Logged when a client fails to authenticate. Reasons include:
- Wrong password
- Unknown username
- Client account is disabled

`AUTH_FAIL` events are particularly valuable for security auditing - a pattern of failures from the same IP or with the same username may indicate a brute-force attempt or misconfigured device.

### PUBLISH (if enabled)

At higher verbosity settings, publish events can be logged showing the topic, payload size, QoS, and retain flag.

---

## Filtering Client Logs

Use the filter controls to find what you are looking for:

**Filter by client ID** - Enter a full or partial client ID to see only events from that client. Useful when investigating a specific device.

**Filter by event type** - Select one or more event types to display (e.g., show only AUTH_FAIL events).

**Filter by username** - Filter events by the MQTT username.

**Filter by IP address** - See all events from a specific IP address. Useful when a device has changed its client ID but kept the same IP.

**Filter by time range** - Set a start and end time to narrow the view to a specific period.

Multiple filters can be combined. All active filters are applied together (AND logic).

---

## Using Client Logs for Auditing

**Access audit** - Review which clients connected during a specific time window. Export the log for compliance records.

**Unauthorized access attempts** - Filter by `AUTH_FAIL` to see all failed authentication attempts. Cluster of failures from the same IP suggests a brute-force attempt or misconfigured device.

**Client behavior analysis** - Pick a specific client and review its full event history: when it connects, what it subscribes to, and when it disconnects. This helps identify abnormal patterns.

**IP address investigation** - Filter by IP to see all activity from a specific network address, regardless of which client IDs were used.

---

## Troubleshooting with Client Logs

**A device says it is connected but is not receiving messages**
- Filter by the client ID and look for CONNECT events. Check if there are also DISCONNECT events immediately following.
- Check for a rapid connect-disconnect pattern that might indicate a reconnect loop.

**A device cannot connect**
- Filter by the client ID and look for AUTH_FAIL events. This confirms whether the issue is authentication-related.
- If no events appear at all, the device may not be reaching the broker (network issue, wrong host/port).

**Messages are not being delivered**
- Filter by SUBSCRIBE events for the receiving client. Verify it is subscribing to the correct topic pattern.
- Check that the publishing client's PUBLISH events show the correct topic.

**Security audit for a specific time window**
- Set the time range filter and filter by AUTH_FAIL to see all authentication failures during that period.

---

## Difference from Broker Logs

| Client Logs | Broker Logs |
|-------------|-------------|
| Structured table with queryable fields | Raw text log output from Mosquitto |
| Easily filtered by client, event type, time | Filtered by text search or log level |
| Captured by BunkerM's logging service | Generated directly by Mosquitto |
| Focused on client events | Includes broker-internal events too |
| Better for auditing and client-specific investigation | Better for broker-level troubleshooting |

For most day-to-day monitoring and client troubleshooting, Client Logs are the easier tool. For deep broker-level investigation and error analysis, use Broker Logs.
