# Frequently Asked Questions

## General Questions

### What is BunkerM?

BunkerM is an all-in-one Mosquitto MQTT broker with a comprehensive web UI for easy management. It combines a pre-configured Mosquitto broker with a powerful management interface, dynamic security controls, monitoring capabilities, and cloud integration features.

### Is BunkerM open source?

Yes, BunkerM Community Edition is open source and freely available. There are also Pro and Enterprise editions with additional features for commercial use.

### What platforms does BunkerM support?

BunkerM runs on any platform that supports Docker, including:
- Linux (all major distributions)
- Windows
- macOS
- Raspberry Pi and other ARM-based devices

### What MQTT versions does BunkerM support?

BunkerM supports:
- MQTT 3.1
- MQTT 3.1.1
- MQTT 5.0

## Installation and Setup

### What are the system requirements for BunkerM?

Minimum requirements:
- Docker 19.03 or higher
- 1+ CPU cores
- 512MB RAM (1GB+ recommended)
- 1GB free disk space
- Ports 1900 and 2000 available

### How do I install BunkerM?

The simplest way is using Docker:

```bash
docker run -d -p 1900:1900 -p 2000:2000 bunkeriot/bunkerm
```

For persistent data:

```bash
docker run -d -p 1900:1900 -p 2000:2000 \
  -v mosquitto_data:/var/lib/mosquitto \
  -v mosquitto_conf:/etc/mosquitto \
  -v auth_data:/data \
  bunkeriot/bunkerm
```

### What ports does BunkerM use?

By default, BunkerM uses:
- Port 1900 for MQTT communication
- Port 2000 for the web interface

These can be mapped to different ports if needed.

### How do I access the web interface?

Open your web browser and navigate to `http://localhost:2000` (or the appropriate address if installed on a remote server).

### What are the default login credentials?

The default credentials are:
- Username: admin@example.com
- Password: password123

You should change these immediately after your first login.

## MQTT Features

### How many clients can connect to BunkerM?

BunkerM can handle thousands of concurrent client connections, limited only by your system resources. The default configuration allows unlimited connections, but you can set a limit in the broker configuration.

### Does BunkerM support WebSockets?

Yes, BunkerM supports MQTT over WebSockets, allowing web applications to connect directly to the broker.

### Does BunkerM support TLS/SSL?

Yes, BunkerM can be configured to use TLS/SSL for secure communications. The default configuration uses HTTP for simplicity, but you can configure it to use your own certificates for HTTPS.

### Can I use BunkerM with existing MQTT clients?

Yes, BunkerM is compatible with any standard MQTT client, including:
- Mosquitto clients
- MQTT.js
- Paho
- HiveMQ clients
- And many others

## Security

### How does BunkerM handle authentication?

BunkerM uses username and password authentication for MQTT clients. You can create and manage client credentials through the web interface.

### How does access control work in BunkerM?

BunkerM uses a role-based access control system:
1. Create roles with specific topic permissions
2. Assign roles to clients directly or via groups
3. Clients can only access topics according to their roles' permissions

### Is communication between clients and the broker encrypted?

Yes, BunkerM supports TLS/SSL encryption for secure communication between clients and the broker.

### Can I integrate BunkerM with external authentication systems?

The Enterprise Edition supports integration with LDAP and OAuth 2.0/JWT authentication systems.

## Management and Monitoring

### How can I monitor broker performance?

BunkerM provides a comprehensive dashboard showing:
- Connected clients
- Message throughput
- Subscription counts
- Retained message counts
- Real-time activity logs

### Can I export logs and metrics?

Yes, you can export broker logs and performance metrics for external analysis or record-keeping.

### How do I back up my BunkerM configuration?

To back up your configuration and data:

```bash
docker run --rm -v mosquitto_data:/data -v $(pwd)/backup:/backup \
  alpine sh -c "cd /data && tar czf /backup/mosquitto_data.tar.gz ."
```

### Can I manage multiple brokers from one interface?

The Enterprise Edition supports managing multiple brokers from a single interface.

## Cloud Integration

### What cloud platforms does BunkerM integrate with?

The Pro and Enterprise editions support integration with:
- AWS IoT Core
- Azure IoT Hub

### How does the cloud integration work?

BunkerM creates a bridge between your local MQTT broker and the cloud platform, allowing bidirectional message flow between local devices and cloud services.

### Do I need cloud integration to use BunkerM?

No, cloud integration is an optional feature. BunkerM functions perfectly as a standalone MQTT broker without any cloud connectivity.

## Troubleshooting

### Why can't my clients connect to the broker?

Common reasons include:
- Incorrect client credentials
- Firewall blocking port 1900
- Broker not running
- Reaching maximum connection limit

Check the [Troubleshooting Guide](troubleshooting.md) for detailed solutions.

### How do I reset the admin password if I forget it?

If you've forgotten the admin password, you can reset it by:

```bash
docker exec -it <container_id> /bin/bash
cd /app
node reset-admin-password.js
```

This will reset the password to the default "admin".

## Licensing and Support

### What's the difference between Community, Pro, and Enterprise editions?

- **Community**: Free, open-source edition with core features
- **Pro**: Adds cloud integration, enhanced monitoring, and commercial support
- **Enterprise**: Adds clustering, high availability, LDAP integration, and more

### How do I get support for BunkerM?

- **Community Edition**: GitHub issues and community forums
- **Pro/Enterprise**: Email support, priority issue resolution, and optional SLA

### How can I contribute to BunkerM?

You can contribute to BunkerM by:
- Submitting pull requests on GitHub
- Reporting bugs and suggesting features
- Improving documentation
- Sharing your experience with the community

### How do I upgrade from Community to Pro or Enterprise?

Contact the BunkerM team at [m.idrissi@bunkeriot.com](mailto:m.idrissi@bunkeriot.com) for information about upgrading to Pro or Enterprise editions.