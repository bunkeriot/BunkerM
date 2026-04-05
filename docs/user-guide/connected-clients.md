# Connected Clients

The Connected Clients page gives you a real-time view of every MQTT client currently connected to your broker. Use it to monitor active sessions, identify unexpected connections, and take immediate action by enabling or disabling clients on the fly.

---

## What It Shows

The Connected Clients page displays a live list of all MQTT sessions currently open on the broker. Each row in the table represents one active client connection with the following information:

| Field | Description |
|-------|-------------|
| **Client ID** | The MQTT client identifier provided during connection |
| **Username** | The username used to authenticate (if applicable) |
| **IP Address** | The remote IP address of the connected device |
| **Protocol Version** | MQTT protocol version in use (3.1, 3.1.1, or 5.0) |
| **Connected Since** | Timestamp showing when the connection was established |
| **Keep Alive** | The keep-alive interval negotiated with the client (in seconds) |
| **Clean Session** | Whether the client connected with a clean session flag |

The table refreshes automatically to reflect newly connected and disconnected clients.

---

## Auto-Refresh Behavior

The page polls the broker at regular intervals to keep the client list current. There is no manual refresh needed. New connections appear within a few seconds of the client connecting. Clients that disconnect are removed from the list on the next refresh cycle.

---

## Enabling a Client

If a client has been previously disabled, it will appear in the list but will be blocked from sending or receiving messages. To re-enable it:

1. Locate the client in the Connected Clients table.
2. Click the toggle or enable button next to the client.
3. The client's status changes to enabled immediately. It can now connect and exchange messages normally.

---

## Disabling a Client

Disabling a client takes effect immediately and performs two actions:

1. The client is **kicked from the broker** - its current connection is terminated.
2. The client is **blocked from reconnecting** until you re-enable it. Any reconnection attempts will be rejected by the broker.

To disable a client:

1. Locate the client in the Connected Clients table.
2. Click the toggle or disable button next to the client.
3. The broker immediately closes that client's connection.

This is useful when you need to quickly cut off a specific device without modifying its credentials or deleting its account.

---

## What Happens When a Client Is Disabled

When you disable a client from the Connected Clients page:

- The broker terminates the TCP/MQTT connection immediately.
- If the client has `clean_session=false`, its queued messages are held but not delivered while disabled.
- If the client attempts to reconnect, the broker rejects the connection with an authorization error.
- The client remains in your ACL client list but is flagged as disabled.
- Re-enabling the client allows it to reconnect normally.

---

## Connected Clients vs ACL Clients

These are two different views serving different purposes:

| Connected Clients | ACL Clients |
|-------------------|-------------|
| Shows only clients **currently connected** | Shows **all configured** MQTT client accounts |
| Real-time session data (IP, protocol, uptime) | Account management (credentials, roles, groups) |
| Changes take effect on live connections | Changes affect authentication and authorization |
| A client disappears when it disconnects | Clients persist even when offline |

Think of ACL Clients as your user account database, and Connected Clients as the live session monitor.

---

## Use Cases for Disabling Clients

**Security incident** - A device has been compromised or is sending unexpected traffic. Disable it immediately to cut it off from the broker without needing to change passwords or delete the account.

**Maintenance** - A device needs to go offline for firmware update or physical maintenance. Disable it in BunkerM so queued messages do not pile up and other clients are not affected.

**Testing** - You want to test how your system behaves when a specific client goes offline without physically disconnecting the device.

**Suspicious activity** - You notice a client connecting from an unexpected IP address or at unusual hours. Disable it while you investigate.

---

## Notes

- Disabling a client from the Connected Clients page is equivalent to disabling it from the ACL Clients page. Both update the same underlying state in Mosquitto's dynamic security.
- If a client has multiple simultaneous connections (allowed in some MQTT configurations), disabling it closes all of them.
- The Connected Clients page requires the broker to have dynamic security enabled. BunkerM enables this by default.
