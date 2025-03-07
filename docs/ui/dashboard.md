# Dashboard

The BunkerM dashboard provides a comprehensive overview of your MQTT broker's performance, client connections, and message activity. This centralized view helps you monitor the health and activity of your MQTT environment at a glance.

![Dashboard Overview](../assets/images/dashboard.png)

## Dashboard Components

The dashboard is divided into several key sections, each providing specific insights into your MQTT broker's operation.

### Broker Statistics

The top section of the dashboard displays critical broker statistics:

- **Connected Clients**: The number of MQTT clients currently connected to the broker
- **Total Messages**: The cumulative count of messages processed by the broker
- **Subscriptions**: The total number of active topic subscriptions
- **Retained Messages**: The number of messages stored with the retained flag

These metrics provide a quick overview of your broker's current state and usage level.

### Message Traffic

The message traffic chart displays message throughput over time, helping you identify patterns and trends in your MQTT traffic:

- **Messages Received**: The number of messages received by the broker
- **Messages Sent**: The number of messages sent by the broker to clients
- **Time Period**: You can adjust the time period to view data for the last hour, day, week, or month

This visualization helps you understand usage patterns and plan for capacity needs.

### Byte Transfer Rates

The byte transfer chart shows the data volume flowing through your broker:

- **Bytes Received**: The volume of data received by the broker
- **Bytes Sent**: The volume of data sent by the broker to clients
- **Time Period**: Adjustable time periods for different analysis needs

This information is valuable for bandwidth planning and identifying potential bottlenecks.

### Recent MQTT Events

The recent events section provides a real-time log of MQTT activity:

- **Client Connections**: Shows when clients connect or disconnect
- **Message Activity**: Displays publish and subscribe events
- **Timestamp**: When each event occurred
- **Client ID**: The identifier of the client involved in the event
- **Event Type**: The type of event (connect, disconnect, publish, subscribe)
- **Topic**: For publish and subscribe events, shows the relevant topic

This live feed helps you monitor client behavior and troubleshoot issues in real-time.

## Dashboard Controls

The dashboard includes several controls to help you customize your view:

- **Refresh Button**: Manually refresh the dashboard data
- **Auto-Refresh Toggle**: Enable or disable automatic data refreshing
- **Time Period Selector**: Change the time period for the charts
- **Export Button**: Export dashboard data for reporting or analysis

## Using the Dashboard Effectively

### Monitoring Broker Health

The dashboard is your first stop for checking broker health:

1. Check the "Connected Clients" metric to ensure it aligns with your expectations
2. Monitor the message and byte transfer rates for unusual spikes or drops
3. Watch for unexpected client disconnections in the recent events log

### Capacity Planning

Use the historical data in the charts to plan for future capacity needs:

1. Identify peak usage times and patterns
2. Monitor growth trends in message volume and client connections
3. Use this information to determine when you might need to scale your infrastructure

### Troubleshooting

When issues arise, the dashboard can help identify the source:

1. Check for sudden changes in connection counts or message rates
2. Look for error events in the recent events log
3. Correlate client connection/disconnection events with reported issues

### Performance Optimization

Identify opportunities to optimize your MQTT implementation:

1. Look for clients that connect and disconnect frequently
2. Identify topics with unusually high message volumes
3. Monitor retained message count to ensure it doesn't grow uncontrollably

## Related Documentation

- [Broker Logs](../monitoring/broker-logs.md) - For more detailed logging information
- [Client Logs](../monitoring/client-logs.md) - For client-specific activity logs
- [Performance Metrics](../monitoring/performance-metrics.md) - For more detailed performance analysis 