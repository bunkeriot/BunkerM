# Slack Integration

The Slack integration lets you chat with your MQTT broker and BunkerAI assistant directly from any Slack channel or DM. Ask questions about your broker, query topic values, manage clients, and receive anomaly alerts - all without leaving Slack.

---

## What the Slack Integration Enables

Once connected, a BunkerAI bot appears in your Slack workspace. You can:

- Ask the bot questions about your broker's current state
- View connected clients and connection history
- Query the current value of any MQTT topic
- Receive anomaly alerts forwarded to a Slack channel
- Manage ACLs and clients with natural-language commands
- Create and manage Watchers and Scheduled Jobs

---

## Prerequisites

- A BunkerAI Cloud account with an active plan and available credits
- BunkerM instance with BunkerAI Cloud connected
- A Slack workspace where you have permission to add apps

---

## Step 1: Connect BunkerAI Cloud

Before setting up Slack, make sure BunkerAI Cloud is connected to your BunkerM instance:

1. Go to **Settings > Integrations** in the BunkerM dashboard.
2. Find the **BunkerAI Cloud** section.
3. Enter your API key and click **Connect**.

If BunkerAI Cloud is already connected, skip to Step 2.

---

## Step 2: Open the Slack Section

1. Navigate to **Settings > Integrations**.
2. Scroll to the **Slack** section.

---

## Step 3: Authorize BunkerAI in Slack

1. Click **Authorize BunkerAI in Slack**.
2. You are redirected to Slack's OAuth authorization page.
3. Review the permissions the BunkerAI app is requesting.
4. Select the Slack workspace you want to connect from the dropdown.
5. Click **Allow**.

You are redirected back to the BunkerM dashboard. The Slack section now shows a connected status with your workspace name.

---

## Step 4: Verify the Bot in Slack

1. Open your Slack workspace.
2. Look for the **BunkerAI** app in the Apps section of the sidebar.
3. Send a message to the bot: `Hello` or `What is my broker status?`

The bot should respond within a few seconds.

---

## Step 5: Start Using BunkerAI in Slack

**Direct Message:** Find BunkerAI in your Apps list and send it a DM. This is the most private way to interact.

**Channel mention:** In any channel, type `@BunkerAI` followed by your question. BunkerAI will respond in the channel thread.

---

## What You Can Do via Slack

### Broker status and statistics

```
What is my broker status?
How many clients are connected right now?
Show me the broker message rate for the last hour.
```

### Client management

```
List all connected clients.
Show me all clients that connected today.
Is client sensor-kitchen-01 currently online?
Disable client sensor-bad-01.
```

### Topic queries

```
What is the current value of sensor/kitchen/temperature?
Show me all topics under home/living-room/.
Which topics have received messages in the last 10 minutes?
```

### ACL management

```
Create a new client called gateway-01 with password secure123.
Give client gateway-01 publish access to sensor/#.
Create a role called read-only that can subscribe to #.
```

### Agents

```
Create a watcher on sensor/temp/kitchen that alerts when value > 35.
Show me all active watchers.
List my scheduled jobs.
```

### Anomaly queries

```
Are there any active anomalies?
Summarize anomalies from the past 24 hours.
What happened with client sensor-01 yesterday?
```

---

## Receiving Anomaly Alerts

To receive BunkerAI anomaly alerts in Slack:

1. Go to **Settings > Integrations** in BunkerM.
2. Enable **Alert Forwarding**.
3. Alerts are sent to the DM conversation with BunkerAI, or you can configure a specific channel from the BunkerAI settings.

---

## Shared Memory Across Channels

Your conversation history is shared between Slack, Telegram, and Web Chat. You can start a conversation on Slack and continue it in the Web Chat without losing context. The AI remembers your previous exchanges and your broker's state. See [Shared AI Memory](shared-memory.md) for details.

---

## Disconnecting Slack

To remove the Slack integration:

1. Go to **Settings > Integrations**.
2. Find the Slack section.
3. Click **Disconnect**.

This removes the BunkerAI bot's access to your Slack workspace. Your BunkerM broker and AI features continue to work normally - only the Slack channel is removed.

You can also remove the app directly from your Slack workspace settings under Manage Apps.
