# MQTT Browser

The MQTT Browser is a built-in tool in the BunkerM dashboard that lets you explore your broker's topic tree and message payloads in real time - directly from your browser, without needing any external MQTT client like MQTT Explorer or mosquitto_sub.

---

## What the MQTT Browser Is

The MQTT Browser connects to your BunkerM broker using your BunkerM credentials and provides a graphical interface for:

- Browsing all topics that have retained messages
- Viewing the current payload of any retained topic
- Subscribing to topics to see live message updates
- Publishing messages to any topic
- Exploring the topic hierarchy visually

It is especially useful during development, debugging, and when you want a quick look at what your devices are publishing without leaving the BunkerM dashboard.

---

## Connection Note

The MQTT Browser uses your BunkerM session credentials to connect to the broker. It connects as a special internal client with the permissions needed to read topics. You do not need to configure a separate MQTT client or enter credentials manually.

---

## Navigating the Topic Tree

The left panel shows a hierarchical tree of all topics that have retained messages on the broker. Topics are organized by their path segments:

```
home/
  living-room/
    temperature
    humidity
    light-level
  kitchen/
    temperature
    motion
sensor/
  floor1/
    temp
    humidity
```

Click any parent node to expand or collapse that branch of the tree. Topics with retained messages show their most recent payload. Topics with recent activity may show a live update indicator.

---

## Viewing a Topic's Payload

Click on any topic name in the tree to view its current retained payload in the detail panel on the right. You will see:

- **Payload** - the raw message content, displayed as text or formatted JSON if applicable
- **QoS level** - Quality of Service level for the retained message (0, 1, or 2)
- **Retain flag** - always true for topics shown in the tree (only retained messages appear in the tree)
- **Timestamp** - when the last message was received
- **Size** - payload size in bytes

---

## Subscribing to Topics for Live Updates

The topic tree shows retained messages, but many topics carry live messages without the retain flag. To watch a topic in real time:

1. Click on a topic in the tree (or type a topic pattern in the subscribe box).
2. Click **Subscribe**.
3. New messages on that topic appear in the message panel as they arrive, with timestamps and payloads.

You can subscribe to wildcard patterns to watch multiple topics at once:

- `sensor/#` - all topics under sensor/
- `home/+/temperature` - temperature topics one level deep under home/

To stop watching a topic, click **Unsubscribe** next to the subscription entry.

---

## Publishing a Message

You can publish a message to any topic directly from the MQTT Browser:

1. Click **Publish** or find the publish panel.
2. Enter the **Topic** - the full topic path to publish to.
3. Enter the **Payload** - the message content (text, JSON, or any string value).
4. Select the **QoS level** (0, 1, or 2).
5. Check **Retain** if you want the broker to retain this message for future subscribers.
6. Click **Publish**.

The message is published immediately. If you are subscribed to that topic, you will see it appear in the live message feed.

---

## Filtering and Searching Topics

When you have many topics, use the search or filter field at the top of the topic tree to narrow down what you see:

- Type a partial topic path to filter the tree to matching topics only.
- Use MQTT wildcard patterns (`sensor/#`, `home/+/temp`) to show a subset of topics.
- Clear the filter to return to the full topic tree.

---

## Understanding Topic Hierarchy

MQTT topics use `/` as a path separator, similar to a file system. The MQTT Browser displays this as a tree:

- **Parent topics** are shown as expandable nodes.
- **Leaf topics** are the endpoints that carry actual messages.
- A topic like `home/living-room/temperature` has three levels: `home`, `living-room`, `temperature`.

You can publish to any level of the hierarchy. Parent levels (`home/`, `home/living-room/`) can also carry their own messages independently of their children.

---

## Viewing Message Metadata

For each message displayed in the MQTT Browser, you can see:

| Field | Description |
|-------|-------------|
| **Topic** | Full topic path |
| **Payload** | Message content |
| **QoS** | Quality of Service level (0 = at most once, 1 = at least once, 2 = exactly once) |
| **Retain** | Whether the message is retained on the broker |
| **Timestamp** | Date and time the message was received by the broker |
| **Size** | Payload size in bytes |

---

## Use Cases

**Debugging a device** - Your sensor is not behaving as expected. Open the MQTT Browser, find its topic, and check what payload it is actually publishing. Compare against what you expect.

**Verifying payloads** - After deploying a new firmware version, confirm that the payload format matches what your subscribers expect.

**Exploring an existing setup** - Taking over an existing MQTT deployment and want to understand what topics are in use? Browse the retained topic tree to get a full picture.

**Manual testing** - Publish a test command to an actuator topic to verify that the device responds correctly, without needing a separate MQTT client.

**Live monitoring** - Subscribe to `#` to watch all traffic in real time during a test or debugging session.

**Checking retained state** - Quickly check the current known state of all your devices by browsing the retained topic tree.
