# Settings - Annotations

Topic annotations let you attach human-readable labels and descriptions to your MQTT topics. They serve as a vocabulary guide that helps the BunkerAI assistant understand what your topics mean and what kind of data they carry.

---

## What Topic Annotations Are

An annotation is a piece of metadata you attach to a topic pattern. It contains:

- **Topic pattern** - the MQTT topic or wildcard pattern the annotation applies to
- **Label** - a short human-readable name (e.g., "Kitchen Temperature Sensor")
- **Description** - a longer explanation of what the topic does, what values it carries, and any relevant context

Annotations are stored in your BunkerM instance and are included in every AI request, giving BunkerAI context about your specific setup before you even ask a question.

---

## Why Annotations Matter

Without annotations, the BunkerAI assistant sees raw topic strings like `h/lr/t` or `dev/8f3a/st`. With annotations, it understands that `h/lr/t` is the living room temperature sensor reading in degrees Celsius, and `dev/8f3a/st` is the battery status of a specific device.

This context makes the AI significantly more useful:

- **More accurate responses** - the AI can answer questions about your broker in terms of what things actually are, not just their raw topic names.
- **Better natural-language control** - you can say "show me all temperature sensors" and the AI knows which topics to look at.
- **Smarter anomaly analysis** - the AI can describe anomalies in plain language ("the kitchen temperature sensor published an unusually high value") rather than raw topic notation.
- **Faster interactions** - you do not need to explain your topic structure every time you start a conversation.

---

## Creating an Annotation

1. Navigate to **Settings > Annotations**.
2. Click **Add Annotation**.
3. Enter the **Topic Pattern** - the topic or wildcard pattern this annotation applies to.
4. Enter a **Label** - a short, descriptive name for this topic.
5. Enter a **Description** - explain what this topic is, what values it carries, what units are used, and any other relevant context.
6. Click **Save**.

---

## Wildcard Support in Topic Patterns

Annotations support the same MQTT wildcards as ACL rules:

**`+` (single-level wildcard)**

```
sensor/+/temperature
```

Annotates all temperature topics one level under `sensor/`. A single annotation covers `sensor/kitchen/temperature`, `sensor/bedroom/temperature`, etc.

**`#` (multi-level wildcard)**

```
sensor/#
```

Annotates everything under the `sensor/` tree with a general description.

Use specific patterns for specific annotations and broader wildcards for general category descriptions. More specific patterns take priority in AI context.

---

## Example Annotations

Here are some examples to illustrate good annotations:

**Specific topic:**

| Field | Value |
|-------|-------|
| Topic Pattern | `home/living-room/temperature` |
| Label | `Living Room Temperature` |
| Description | `Temperature reading in degrees Celsius from the wall-mounted Zigbee sensor in the living room. Publishes every 5 minutes. Normal range: 18-24C.` |

**Wildcard - all floor sensors:**

| Field | Value |
|-------|-------|
| Topic Pattern | `sensor/floor+/+` |
| Label | `Floor Sensor Data` |
| Description | `Sensor readings from multi-floor building sensors. Second level is the floor number. Third level is the measurement type (temp, humidity, co2).` |

**Actuator topics:**

| Field | Value |
|-------|-------|
| Topic Pattern | `actuator/lights/+/command` |
| Label | `Light Control Command` |
| Description | `Command topic for smart light controllers. Payload is JSON with "state" (on/off) and optional "brightness" (0-100). Third level is the room name.` |

**Status topics:**

| Field | Value |
|-------|-------|
| Topic Pattern | `device/+/status` |
| Label | `Device Status` |
| Description | `Heartbeat/status topic for IoT devices. Payload: "online" or "offline". Published by the device on connect/disconnect using MQTT will messages.` |

---

## How Annotations Improve the BunkerAI Chat Experience

When you open the Web Chat or send a message via Slack or Telegram, BunkerAI automatically includes your annotations as context. This means:

- You can ask "what temperature is the kitchen?" and the AI knows which topic to query.
- You can say "create a watcher that alerts when any temperature sensor goes above 30" and the AI knows to look at `sensor/+/temperature` topics.
- You can ask "summarize today's sensor activity" and the AI uses your labels to give a readable summary instead of listing raw topic strings.

The more annotations you create, the more accurately the AI can serve as a natural-language interface to your broker.

---

## Managing Annotations

**Edit** - Click on any annotation to update the label, description, or topic pattern.

**Delete** - Remove an annotation you no longer need. This does not affect the underlying MQTT topics - it only removes the AI context hint.

Annotations are stored persistently with your BunkerM data. They are included in the export/import functionality if you need to transfer them to another instance.
