# Telegram Integration

The Telegram integration lets you control your MQTT broker and interact with BunkerAI through a Telegram bot. Chat with the bot to check broker status, query topics, manage clients, and receive anomaly alerts as Telegram messages.

---

## What the Telegram Integration Enables

Once connected, you can message your BunkerAI Telegram bot to:

- Ask questions about your broker and connected clients
- Query the current payload of any MQTT topic
- Receive anomaly alerts as Telegram messages
- Manage clients, roles, and ACLs with natural-language commands
- Monitor your broker from your phone, anywhere

---

## Prerequisites

- A BunkerAI Cloud account with an active plan and available credits
- BunkerM instance with BunkerAI Cloud connected
- A Telegram account

---

## Step 1: Create a Telegram Bot via BotFather

You need to create your own Telegram bot to connect to BunkerAI. This takes about 2 minutes:

1. Open Telegram and search for **@BotFather** (the official Telegram bot management service).
2. Start a conversation and send the command `/newbot`.
3. BotFather will ask for a **name** for your bot - this is the display name users see (e.g., "My BunkerM Bot").
4. BotFather will then ask for a **username** for your bot - this must end in `bot` (e.g., `mybunkerm_bot`). The username must be unique across all of Telegram.
5. BotFather will respond with your bot token. It looks like:
   ```
   1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ
   ```
6. Copy this token. You will need it in the next step.

**Keep your bot token secret.** Anyone with this token can control your bot.

---

## Step 2: Connect BunkerAI Cloud

Make sure BunkerAI Cloud is connected to your BunkerM instance:

1. Go to **Settings > Integrations** in the BunkerM dashboard.
2. Find the **BunkerAI Cloud** section.
3. Enter your API key and click **Connect**.

If already connected, skip to Step 3.

---

## Step 3: Open the Telegram Section

1. Navigate to **Settings > Integrations**.
2. Scroll to the **Telegram Bot** section.

---

## Step 4: Connect Your Bot Token

1. Paste your bot token into the **Bot Token** field.
2. Click **Connect**.

BunkerM verifies the token with Telegram and links the bot to your BunkerAI instance. The Telegram section will show a connected status with your bot's username.

---

## Step 5: Start Chatting

1. Open Telegram and search for your bot by its username.
2. Click **Start** or send `/start`.
3. Try sending a message: `What is my broker status?` or `Hello`.

The bot will respond using BunkerAI.

---

## What You Can Do via Telegram

### Broker status and statistics

```
Show me the broker status.
How many clients are connected?
What is the current message rate?
```

### Client queries

```
List all online clients.
When did sensor-kitchen-01 last connect?
Show me all clients that connected in the last hour.
```

### Topic queries

```
What is the latest value on sensor/kitchen/temperature?
Show me all active topics under home/.
Which topics are receiving messages right now?
```

### Broker and ACL management

```
Create a client called new-device with password pass123.
Disable client compromised-device.
Add client sensor-01 to the sensors group.
```

### Anomaly queries

```
Are there any anomalies I should know about?
Show me critical anomalies from today.
Summarize the last 24 hours.
```

### Agents

```
Create a watcher on home/alarm that fires when value = "triggered".
List my scheduled jobs.
```

---

## Receiving Anomaly Alerts

To get anomaly alerts forwarded to Telegram:

1. Go to **Settings > Integrations** in BunkerM.
2. Make sure the Telegram bot is connected.
3. Enable **Alert Forwarding**.

When BunkerAI detects an anomaly, it sends a message directly to your Telegram conversation with the bot.

---

## Shared Memory Across Channels

Your conversation history is shared across Slack, Telegram, and Web Chat. You can start a conversation in Telegram and continue it in the Web Chat or Slack without losing context. See [Shared AI Memory](shared-memory.md) for more information.

---

## Revoking the Telegram Integration

To disconnect your Telegram bot from BunkerAI:

1. Go to **Settings > Integrations**.
2. Find the Telegram Bot section.
3. Click **Revoke** or **Disconnect**.

Your BunkerM broker and AI features continue to work normally. Only the Telegram channel is removed.

If you also want to delete the bot entirely, send `/deletebot` to @BotFather in Telegram. Note that deleting the bot also removes it for anyone else who may have been chatting with it.
