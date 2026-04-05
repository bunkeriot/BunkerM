# Settings - Subscription

The Subscription page shows your current BunkerAI Cloud plan, credit balance, and usage history. From here you can top up your credits and review how they are being used.

---

## What the Subscription Page Shows

Navigate to **Settings > Subscription** to see:

- Your current **plan tier** (Community, or your paid plan name)
- Your **current credit balance**
- **Credit usage history** with details on each interaction
- Available **credit bundles** for top-up purchases

---

## Credit System

BunkerAI uses a credit-based model to track AI interactions. Credits are consumed when you:

- Send a message via Web Chat
- Send a message via the Slack bot
- Send a message via the Telegram bot
- Run an automated Watcher that triggers an AI action
- Execute any AI-powered broker operation

The number of credits consumed per interaction depends on the complexity of the request and the length of the response.

**Credits are not consumed by:**
- Browsing the BunkerM dashboard
- Managing clients, roles, and groups
- Viewing logs and anomalies
- Monitoring broker statistics
- Using the MQTT Browser

Credits only apply to interactions that involve the BunkerAI language model.

---

## Available Plans

### Community (Free)

The Community plan gives you access to BunkerM core features without any subscription. If you connect BunkerAI Cloud on the Community plan, you get a starter credit allocation to try AI features.

Community plan limitations:
- Limited credits per month
- Maximum of 2 agents (Watchers and Scheduled Jobs combined)
- Standard rate limits on AI interactions

### Paid Plans

Paid plans unlock higher credit allowances, more agents, and higher rate limits. Specific plan details and pricing are available at [bunkeriot.com](https://www.bunkeriot.com). Plan benefits are reflected immediately in your BunkerM dashboard after subscribing.

---

## Topping Up Credits

If your credit balance runs low, you can purchase a credit bundle:

1. Navigate to **Settings > Subscription**.
2. Click **Buy Credits** or **Top Up**.
3. Select a credit bundle from the available options.
4. Complete the checkout process via Stripe.

After a successful purchase, your credit balance is updated immediately and you can continue using BunkerAI features without interruption.

Credit bundles are a one-time purchase - they do not expire and are consumed as you use AI features.

---

## Viewing Usage History

The usage history table shows recent credit consumption events:

| Field | Description |
|-------|-------------|
| **Date** | When the interaction occurred |
| **Channel** | Web Chat, Slack, Telegram, or Automated |
| **Credits Used** | Number of credits consumed |
| **Type** | What kind of interaction it was |

Use the usage history to understand which channels and features are consuming the most credits, and to verify that your usage aligns with your expectations.

---

## Community Plan Limitations

On the Community plan without BunkerAI Cloud connected:

- All core BunkerM features are available with no restrictions
- No AI features are available
- No Agents, Web Chat, Slack, or Telegram integrations

On the Community plan with BunkerAI Cloud connected:

- AI features are available within the free credit allocation
- Maximum 2 agents (Watchers + Scheduled Jobs combined)
- Standard rate limits apply

When your credit balance reaches zero, AI interactions are paused until you top up. The broker, ACL management, monitoring, and all non-AI features continue working normally regardless of credit balance.
