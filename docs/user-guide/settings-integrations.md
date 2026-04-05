# Settings - Integrations

The Integrations page is where you connect BunkerM to external services and cloud platforms. From here you can activate BunkerAI Cloud, set up Telegram and Slack bots, and control alert forwarding to messaging channels.

---

## Overview

Navigate to **Settings > Integrations** to access all integration options. The page is divided into sections, one for each supported integration.

---

## BunkerAI Cloud

BunkerAI Cloud is the optional AI-powered layer that extends BunkerM with a conversational assistant, automated agents, anomaly detection, and multi-channel messaging.

**What becomes available after connecting:**

- AI chat assistant accessible from the Web Chat interface
- Natural-language broker control ("show me all clients", "create a role that allows publishing to sensor/#")
- Agents: Watchers and Scheduled Jobs
- Slack integration
- Telegram bot integration
- Topic annotations for AI context
- Credits-based usage system with subscription management

**How to connect:**

1. Sign up for a BunkerAI account at [bunkeriot.com](https://www.bunkeriot.com).
2. In Settings > Integrations, find the **BunkerAI Cloud** section.
3. Enter your **BunkerAI API Key** from your account portal.
4. Click **Connect**.

BunkerM establishes a connection to the BunkerAI Cloud service. Once connected, the AI features appear in the sidebar and are ready to use.

**Disconnecting:**

Click **Disconnect** in the BunkerAI Cloud section. This removes the connection and hides AI features from the UI. Your BunkerM MQTT broker continues to operate normally - only the AI layer is removed.

---

## Telegram Bot

Connect a Telegram bot to your BunkerM instance so you can interact with your broker and BunkerAI via Telegram messages.

!!! info "BunkerAI Cloud required"
    You must have BunkerAI Cloud connected before setting up Telegram.

**Setup:**

1. Create a Telegram bot via @BotFather and obtain the bot token. See the [Telegram Integration guide](../integrations/telegram.md) for step-by-step instructions.
2. In Settings > Integrations, find the **Telegram Bot** section.
3. Paste your bot token into the field.
4. Click **Connect**.

Once connected, open your Telegram bot and start messaging. You can ask it about broker status, query topics, manage clients, and receive anomaly alerts.

For detailed setup instructions, see the [Telegram Integration guide](../integrations/telegram.md).

---

## Slack

Connect BunkerAI to your Slack workspace so you can chat with your broker from any Slack channel.

!!! info "BunkerAI Cloud required"
    You must have BunkerAI Cloud connected before setting up Slack.

**Setup:**

1. In Settings > Integrations, find the **Slack** section.
2. Click **Authorize BunkerAI in Slack**.
3. You are redirected to Slack's OAuth page. Select your workspace and authorize the BunkerAI app.
4. After authorization, you are returned to the BunkerM dashboard with Slack connected.

The BunkerAI bot appears in your Slack workspace. You can DM it or mention it in channels.

For detailed instructions and usage examples, see the [Slack Integration guide](../integrations/slack.md).

---

## Alert Forwarding

The Alert Forwarding toggle controls whether BunkerAI anomaly alerts are sent to your connected messaging platforms (Slack and/or Telegram).

**When enabled:** New anomalies detected by the smart anomaly detection system are automatically pushed as messages to your connected Slack workspace or Telegram bot. You do not need to check the BunkerM dashboard to know when something unusual happens.

**When disabled:** Anomaly alerts are still shown in the Anomalies page inside BunkerM, but they are not forwarded to Slack or Telegram.

**To enable:**
1. Make sure at least one messaging platform (Slack or Telegram) is connected.
2. Toggle **Alert Forwarding** to enabled.

Alerts from Watchers (Agents) are delivered separately via the Watcher events system and are always sent if a messaging channel is configured.

---

## Notes

- Telegram and Slack both require BunkerAI Cloud to be connected first. The setup options for these integrations are grayed out if BunkerAI Cloud is not connected.
- You can connect Slack and Telegram independently - you do not need both.
- All three messaging channels (Web Chat, Slack, Telegram) share the same AI conversation memory. See [Shared AI Memory](../integrations/shared-memory.md) for details.
