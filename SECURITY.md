# Security Policy

## Supported Versions

The following versions of BunkerM are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

I take the security of BunkerM seriously. If you believe you've found a security vulnerability, please follow these steps:

1. **Do not disclose the vulnerability publicly** until it has been addressed.
2. **Submit your findings** via email to [m.idrissi@bunkeriot.com](mailto:m.idrissi@bunkeriot.com) with the subject line "BunkerM Security Vulnerability".
3. **Include detailed information** about the vulnerability:
   - Description of the issue
   - Steps to reproduce
   - Potential impact
   - Version of BunkerM where you discovered the issue
   - Any relevant screenshots or logs

### What to Expect

- **Initial Response**: I aim to acknowledge receipt of your vulnerability report within 48 hours.
- **Status Updates**: You will receive updates as I work on addressing the vulnerability.
- **Resolution Timeframe**: My goal is to resolve critical vulnerabilities within 14 days of verification.
- **Credit**: With your permission, I will credit you for the discovery in the release notes.

### Security Features

BunkerM includes several security features to protect your MQTT broker:

- API Key authentication for all management endpoints
- HTTPS/TLS encryption for the web interface
- Integration with Mosquitto's Dynamic Security for access control
- Configuration options to disable anonymous access

