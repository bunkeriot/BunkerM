# AWS IoT Core Integration

BunkerM Pro offers seamless integration with AWS IoT Core, allowing you to bridge your local MQTT broker with AWS's cloud-based IoT services. This integration enables bidirectional communication between your local devices and AWS IoT applications.

![AWS IoT Core Integration](../assets/images/aws-integration.png)

!!! note "Pro Feature"
    AWS IoT Core integration is available in the Pro and Enterprise editions of BunkerM.

## Benefits of AWS IoT Core Integration

Connecting BunkerM to AWS IoT Core provides several advantages:

- **Edge-to-Cloud Connectivity**: Connect local devices to AWS cloud services
- **Data Processing**: Leverage AWS services for data analytics and storage
- **Serverless Applications**: Trigger AWS Lambda functions from MQTT messages
- **Device Shadows**: Use AWS IoT Device Shadows for offline device state management
- **Security**: Utilize AWS's robust security features alongside BunkerM's local security

## Configuration Overview

The AWS IoT Bridge configuration page allows you to set up and manage the connection between BunkerM and AWS IoT Core.

### Prerequisites

Before configuring the AWS IoT Bridge, you'll need:

1. An active AWS account
2. An AWS IoT Core endpoint
3. X.509 certificates for authentication:
   - Client certificate
   - Private key
   - Root CA certificate

### Setting Up AWS IoT Core

1. In the AWS Management Console, navigate to IoT Core
2. Create a new Thing or use an existing one
3. Create and download certificates
4. Create a policy that allows connecting, publishing, and subscribing
5. Attach the policy to your certificates

## Configuring the Bridge

To set up the AWS IoT Bridge in BunkerM:

1. Navigate to **Cloud Integration** > **AWS IoT Bridge** in the left sidebar
2. Enter the following information:
   - **AWS IoT Endpoint**: Your AWS IoT endpoint (e.g., `xxxxxxx-ats.iot.region.amazonaws.com`)
   - **Client ID**: A unique identifier for the bridge connection
   - **Topics**: The MQTT topics to bridge (one per line)

3. Upload the required certificate files:
   - **Certificate File (.pem)**: The client certificate from AWS
   - **Private Key File (.pem)**: The private key from AWS
   - **CA Certificate File (.pem)**: The root CA certificate

4. Click **Configure Bridge**

## Topic Mapping

The AWS IoT Bridge supports bidirectional topic mapping between your local MQTT broker and AWS IoT Core:

### Local to AWS Direction

Messages published to specified topics on your local broker will be forwarded to AWS IoT Core with the same topic name.

Example:
- Local topic: `sensors/temperature`
- AWS IoT Core receives: `sensors/temperature`

### AWS to Local Direction

Messages published to specified topics on AWS IoT Core will be forwarded to your local broker with the same topic name.

Example:
- AWS IoT Core topic: `actuators/switch`
- Local broker receives: `actuators/switch`

## Advanced Configuration

For more complex setups, you can configure advanced options:

### Topic Transformations

You can transform topic names during bridging:

- **Prefix Addition**: Add a prefix to topics when forwarding
- **Topic Remapping**: Change the topic structure completely

### QoS Settings

Configure the Quality of Service level for bridged messages:

- **QoS 0**: At most once delivery
- **QoS 1**: At least once delivery
- **QoS 2**: Exactly once delivery

### Connection Settings

Fine-tune the connection parameters:

- **Keep Alive Interval**: How often to send keep-alive messages
- **Reconnect Delay**: Time to wait before reconnecting after a failure
- **Connection Timeout**: How long to wait for a connection to establish

## Monitoring the Bridge

BunkerM provides tools to monitor the health and activity of your AWS IoT Bridge:

1. **Connection Status**: View the current connection state
2. **Message Statistics**: Track messages flowing in both directions
3. **Error Logs**: Identify and troubleshoot connection issues

## Security Considerations

When using the AWS IoT Bridge, keep these security best practices in mind:

- Store certificates securely
- Use specific topic filters rather than wildcards when possible
- Regularly rotate certificates according to your security policy
- Monitor bridge activity for unusual patterns

## Troubleshooting

If you encounter issues with the AWS IoT Bridge:

### Connection Problems

- Verify your AWS IoT endpoint is correct
- Check that your certificates are valid and properly formatted
- Ensure your AWS IoT policy allows the necessary actions

### Message Flow Issues

- Confirm that topics are correctly specified in the bridge configuration
- Check that local clients have permission to access bridged topics
- Verify that AWS IoT Core is receiving and processing messages

## Related Documentation

- [Azure IoT Hub](azure-iot-hub.md) - Similar integration with Microsoft's IoT platform
- [Broker Configuration](../mqtt/broker-configuration.md) - Configure your local broker settings
- [ACL Configuration](../mqtt/acl-configuration.md) - Set up access control for bridged topics 