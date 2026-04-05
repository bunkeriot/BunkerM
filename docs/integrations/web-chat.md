# Web Chat

The Web Chat is a built-in AI chat interface embedded directly in the BunkerM dashboard. It connects you to BunkerAI so you can ask questions, give instructions, and control your broker using plain language - without leaving the web UI.

---

## What the Web Chat Is

The Web Chat provides a conversational interface to BunkerAI inside your browser. It is the most direct way to interact with the AI - no Slack workspace or Telegram setup required. The chat is always available in the BunkerM dashboard once you have a BunkerAI Cloud connection.

Unlike static dashboards that show you what is happening, the Web Chat lets you ask questions and take action in natural language. You can query state, make changes, and get explanations - all by typing.

---

## How to Access

There are two ways to open the Web Chat:

1. Click **Ask BunkerAI** in the left sidebar.
2. Navigate to **Tools > AI Chat** from the sidebar menu.

The chat opens in the main content area with a message input at the bottom and your conversation history above.

---

## Prerequisites

- **BunkerAI Cloud connected** is required for full AI capabilities. Connect in Settings > Integrations.
- On the Community plan, a starter credit allocation is provided to try Web Chat.
- Without BunkerAI Cloud, the Web Chat interface is not available.

---

## What You Can Ask

### Broker status and monitoring

```
What is my broker status right now?
How many messages per second is the broker processing?
Show me the broker statistics for today.
How many clients connected in the last hour?
```

### Client and connection history

```
List all currently connected clients.
When did sensor-kitchen-01 last connect?
Show me clients that have not connected in the last 7 days.
Which clients are connecting from unusual IP addresses?
```

### Topic analysis and anomaly summaries

```
What topics are most active right now?
Summarize anomalies from the past 24 hours.
Are there any active anomalies I should address?
What was happening on my broker yesterday afternoon?
```

### ACL management

```
Create a new client called gateway-01 with password mysecretpass.
Give client gateway-01 publish access to sensor/# and subscribe access to config/gateway-01.
Create a role called sensor-write that allows publishing to sensor/+/data.
Add client sensor-01 to the sensors group.
Disable client broken-device.
Show me all clients in the actuators group.
```

### Watcher and scheduler management

```
Create a watcher on sensor/temp/kitchen that alerts me when the value goes above 35.
Show me all active watchers.
Create a scheduled job that publishes online to system/heartbeat every minute.
Pause the midnight-light-off job.
```

### Help and explanations

```
What is the difference between QoS 0, 1, and 2?
Explain how MQTT wildcards work.
Why would a client get disconnected by the broker?
What does the # wildcard match?
```

---

## Conversation History

Your Web Chat history is preserved between sessions. When you come back to the Web Chat, you will see your previous messages and the AI's responses. You do not need to re-explain your setup every time.

Conversation history is also shared with your Slack and Telegram integrations. A conversation started in Slack can be continued in Web Chat, and vice versa. See [Shared AI Memory](shared-memory.md) for a full explanation.

---

## The AI Has Context of Your Broker

BunkerAI does not just answer general MQTT questions - it has direct access to your broker's state and can take actions on your behalf:

- It can see your current connected clients and their metadata
- It knows your ACL configuration (clients, roles, groups)
- It can read topic values via the broker
- It can access your anomaly history and current alerts
- It can create, update, and delete clients, roles, groups, and agents

When you say "create a client called sensor-01", it actually creates the client in Mosquitto's dynamic security. When you ask "what is the temperature in the kitchen?", it reads the actual retained value from your broker.

---

## Tips for Better Results

**Be specific about topics and clients.** Instead of "show me temperature", say "show me the current value of sensor/kitchen/temperature". The more specific you are, the more targeted the response.

**Use topic annotations.** If you annotate your topics in Settings > Annotations, the AI understands what they represent without you having to explain. "Show me all temperature sensors" works if your temperature topics are annotated.

**Confirm destructive actions.** When you ask the AI to delete or disable something, it will confirm with you before proceeding. Read the confirmation carefully.

**Ask for explanations.** The AI can explain what it is doing and why. If a response is not what you expected, ask "why did you do that?" or "explain what just changed".

**Use context from previous messages.** You do not need to repeat yourself. If you mentioned a client in a previous message, you can refer to it as "that client" in follow-up questions.

---

## Clearing Conversation History

To clear your chat history:

1. Open the Web Chat.
2. Click the **Clear History** or **New Conversation** button (typically in the chat header or settings area).
3. Confirm the clear.

After clearing, the AI starts fresh without memory of previous conversations. This is useful when switching to a different topic or troubleshooting session.
