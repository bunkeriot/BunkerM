# Shared AI Memory

BunkerAI maintains a unified conversation context across all connected channels. Whether you chat in the Web UI, send a message on Slack, or use the Telegram bot, the AI remembers your previous exchanges and your broker's context.

---

## What Shared AI Memory Is

When you interact with BunkerAI through any channel, the conversation is stored and associated with your BunkerM instance. This context is available to BunkerAI regardless of which channel the next message comes through.

Shared memory means:

- A conversation you start in Slack can be continued in Web Chat without repeating yourself
- Anomaly context you discussed via Telegram is remembered when you open Web Chat
- Settings and broker topology you have explained in one session carry forward to future sessions
- The AI does not need to relearn your setup every time you open a new channel

---

## How It Works

All three channels - Web Chat, Slack, and Telegram - connect to the same BunkerAI backend for your BunkerM instance. When you send a message, BunkerAI:

1. Retrieves your conversation history from the shared store
2. Includes that history as context in the AI request
3. Generates a response that is aware of everything previously discussed
4. Stores the new exchange back in the shared conversation store

The conversation store is per-tenant (per BunkerM instance), not per-channel. There is no separate "Slack history" and "Web Chat history" - there is one unified history for your instance that all channels read from and write to.

---

## What Is Remembered

**Previous questions and answers** - The full text of your previous exchanges is retained and used as context. If you asked "how many clients are in the sensors group?" two days ago, the AI remembers the answer and can refer back to it.

**Broker topology you have discussed** - When you have explained aspects of your setup (which clients are sensors, which groups exist, what your topic structure means), the AI carries that understanding forward.

**Client and topic annotations** - Annotations you create in Settings > Annotations are always included in AI context, independently of conversation history. They serve as a persistent knowledge base about your topics.

**Actions the AI has taken** - If the AI created a client, added a role, or set up a watcher on your behalf in a previous session, it remembers having done that.

---

## Benefits

**No repetition** - You explain your setup once. Whether you return to the Web Chat the next day or message the bot on Telegram a week later, the AI still has context of what you discussed.

**Consistent behavior across channels** - Switching channels does not change the AI's understanding of your broker. The same knowledge and conversation history is used everywhere.

**Faster, more accurate responses** - As the AI accumulates context about your specific setup, it can answer questions more precisely. It knows the difference between `sensor/kitchen/temperature` and `sensor/bathroom/temperature` because you have discussed them before.

**Cross-channel workflows** - You might get an anomaly alert on Telegram, investigate via Web Chat, and resolve the issue via Slack - all as part of one continuous conversation.

---

## Privacy and Scoping

Conversation memory is strictly scoped to your BunkerAI tenant. Your conversations are not visible to other BunkerM users or BunkerAI instances. Each BunkerM installation connected to BunkerAI has its own isolated conversation store.

BunkerAI Cloud processes your messages using an AI model to generate responses. The conversation history and broker context are stored on BunkerAI Cloud infrastructure. Review the BunkerAI privacy policy at [bunkeriot.com](https://www.bunkeriot.com) for details on data retention and handling.

---

## Managing Memory

### Clearing conversation history

To start fresh with a clean conversation history:

1. Open the Web Chat in the BunkerM dashboard.
2. Click **Clear History** or **New Conversation**.
3. Confirm the action.

This clears the shared conversation history for your instance. The next interaction on any channel (Web Chat, Slack, Telegram) starts without previous context.

Note that clearing conversation history does not remove your topic annotations. Annotations are persistent metadata separate from conversation history.

### Implicit memory updates

You do not need to explicitly "save" anything for the AI to remember it. Every exchange is automatically stored. Simply having a conversation is enough to build up the AI's context over time.

---

## Requirements

Shared AI memory requires:

- BunkerAI Cloud connected (Settings > Integrations)
- At least one active channel (Web Chat, Slack, or Telegram)

Without a BunkerAI Cloud connection, no AI memory is stored or used.
