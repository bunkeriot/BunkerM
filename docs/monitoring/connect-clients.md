# MQTT Clients Listing

This feature provides a comprehensive interface for monitoring and managing MQTT client connections in real-time. This feature allows administrators to track client connection events, view detailed information about connected clients, and manage client access.

## Overview

The Connect Clients interface displays a table of recent MQTT events, focusing on client connections and disconnections. Each entry in the table provides detailed information about the client and the event, allowing administrators to monitor client activity and troubleshoot connection issues.

![Connect Clients Interface](../assets/images/connected-clients.png)

## Features

### Real-time Event Monitoring

- **Automatic Updates**: The interface polls for new events every 5 seconds, ensuring you always have the most up-to-date information.
- **Event Filtering**: Easily filter out system clients (like 'bunker') to focus on user connections.
- **Search Functionality**: Quickly find specific clients or events using the search bar.

### Event Information

Each event in the table includes the following information:

- **Timestamp**: When the event occurred (displayed in your local time format).
- **Event Type**: The type of event (e.g., "Client Connection" or "Client Disconnection").
- **Username**: The username used for authentication.
- **Client ID**: A unique identifier for the client.
- **Protocol**: The MQTT protocol level used by the client.
- **Details**: Additional information about the event.
- **Status**: Visual indicator showing connection status (green check for connected, red stop for disconnected).

### Client Management

The interface provides direct actions for managing client access:

- **Disable Client**: For connected clients, you can immediately disable their access with a single click.
- **Enable Client**: For disabled clients, you can restore their access privileges.
- **Notification System**: Receive immediate feedback on actions with color-coded notifications.

## How to Use

### Monitoring Clients

1. Navigate to the Connect Clients page in the Monitoring section.
2. Review the table of recent events to see client connection activity.
3. Use the search bar to filter for specific clients, usernames, or event types.
4. Click on a client ID to view more detailed information about that client.

### Managing Client Access

1. To disable a client's access:
   - Locate the client in the table
   - Click the "Disable" button in the Actions column
   - A confirmation notification will appear when the action is complete

2. To enable a previously disabled client:
   - Find the disabled client in the table
   - Click the "Enable" button in the Actions column
   - A confirmation notification will appear when the action is complete

## Related Documentation

- [MQTT Broker Configuration](../mqtt/broker-configuration.md)
- [User Authentication](../advanced/authentication.md)
- [Broker Logs](./broker-logs.md) 