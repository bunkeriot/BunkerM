# Tools - Anomalies

BunkerM includes a smart anomaly detection system that continuously analyzes your MQTT traffic patterns and flags unusual behavior. Instead of combing through raw logs, you get a curated list of meaningful anomalies with context about what was detected and when.

---

## What Smart Anomaly Detection Is

Smart anomaly detection observes your broker's normal traffic patterns over time and identifies deviations that may indicate a problem. It learns what "normal" looks like for your specific setup - your typical connection counts, message rates, topic activity patterns, and client behavior - and raises alerts when something does not fit.

This is different from simple threshold alerts. The system looks at patterns in context, not just individual readings. A sudden spike in messages from a single client is only flagged as unusual if it deviates significantly from that client's own historical pattern.

---

## What Anomalies Are Detected

The anomaly detector monitors several dimensions of your broker's activity:

**Connection anomalies**
- Unusual number of simultaneous connections
- Rapid connect-disconnect cycles from a single client (potential reconnect loop)
- Connections from new or unrecognized IP addresses
- Authentication failures above the normal baseline

**Message rate anomalies**
- Sudden spikes in publish rate from a client or topic
- Unusual drops in message rate from clients that normally publish regularly
- Topics receiving messages far outside their normal frequency

**Topic activity anomalies**
- Messages on topics that have been inactive for a long time
- New topics appearing that have not been seen before
- Unusually large payloads on topics that normally carry small messages

**Broker health anomalies**
- Subscription count changes that do not match expected patterns
- Retained message accumulation beyond normal levels

---

## Viewing Detected Anomalies

Navigate to **Tools > Anomalies** in the sidebar to see the anomalies list.

Each entry in the list shows:

| Field | Description |
|-------|-------------|
| **Severity** | How significant the anomaly is (Critical, High, Medium, Low) |
| **Type** | The category of anomaly detected |
| **Description** | A plain-language explanation of what was detected |
| **Client / Topic** | The specific client or topic involved, if applicable |
| **Detected At** | Timestamp when the anomaly was identified |
| **Status** | Whether the anomaly is active, acknowledged, or dismissed |

The list is sorted by severity and recency by default. You can filter by severity, type, or status.

---

## Anomaly Severity Levels

| Severity | Meaning |
|----------|---------|
| **Critical** | Requires immediate attention. Indicates something that could be a security incident or a serious system failure. |
| **High** | Significant deviation from normal behavior. Should be investigated soon. |
| **Medium** | Noticeable but potentially benign. Worth reviewing when convenient. |
| **Low** | Minor deviation. Informational. May be expected given recent changes to your setup. |

---

## Acknowledging and Dismissing Anomalies

**Acknowledge** - Mark an anomaly as seen and under review. The anomaly stays in the list but is marked as acknowledged. Use this when you have seen the alert and are investigating.

**Dismiss** - Remove an anomaly from the active list. Use this when you have investigated and determined the anomaly is a false positive or an expected change in your environment.

Both actions are available from the anomaly detail view or via the action buttons in the list.

Dismissed anomalies are not deleted - they are archived and can be reviewed from the history view if needed.

---

## How Detection Works

The system collects broker metrics and client activity data continuously. It builds a baseline model of your environment's normal behavior over time. When new observations fall significantly outside the established patterns, an anomaly is raised.

The detection system becomes more accurate as it collects more data about your specific setup. In the first days of operation, you may see some anomalies that turn out to be false positives as the baseline is still being established. Dismissing these helps the system learn what is actually normal for your environment.

No data leaves your BunkerM container. All analysis runs locally inside the container.

---

## Use Cases

**Detecting a compromised device** - A sensor that normally publishes once a minute starts publishing thousands of times per second. The anomaly system flags the message rate spike, letting you identify and disable the client before it causes further issues.

**Traffic spike investigation** - Your broker's message rate suddenly doubles. Without anomaly detection, you might not notice until clients start experiencing delivery delays. The anomaly alert helps you catch it early.

**Unexpected topic activity** - A topic that has been silent for six months suddenly receives messages. This could be a device coming back online, a misconfiguration, or unauthorized access. Anomaly detection surfaces it for review.

**Auth failure monitoring** - Multiple failed authentication attempts from an IP address you do not recognize. The anomaly system flags the pattern before it becomes a brute-force concern.

**Broker health issues** - Subscription counts drop sharply, which could indicate clients are losing connections en masse. The anomaly helps you correlate the observation with other events in the logs.

---

## Difference from Broker Logs

**Broker logs** are raw events from Mosquitto - every connection, disconnection, subscription, and error as they happen. They are comprehensive but require you to know what you are looking for.

**Anomalies** are intelligent alerts that tell you when something is worth your attention. They are generated by analyzing patterns across many log events, not from individual entries. You do not need to know what to look for - the system identifies deviations on your behalf.

Use broker logs for detailed forensic investigation. Use anomalies for proactive monitoring and early warning.
