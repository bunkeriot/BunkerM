# Troubleshooting

This guide provides solutions for common issues you might encounter when using BunkerM. If you're experiencing problems, follow the relevant troubleshooting steps below.

## Connection Issues

### Can't Access the Web UI

If you can't access the BunkerM web interface:

1. **Verify the container is running**:
   ```bash
   docker ps | grep bunkerm
   ```
   If the container isn't listed, restart it:
   ```bash
   docker run -d -p 1900:1900 -p 2000:2000 bunkeriot/bunkerm
   ```

2. **Check port availability**:
   Ensure port 2000 isn't being used by another application:
   ```bash
   netstat -tuln | grep 2000
   ```

3. **Verify network connectivity**:
   If accessing from another machine, ensure there are no firewall rules blocking port 2000.

4. **Check browser compatibility**:
   - Make sure you're using a modern, up-to-date browser
   - Clear your browser cache if you're experiencing UI issues

### MQTT Clients Can't Connect

If MQTT clients can't connect to the broker:

1. **Verify the broker is running**:
   Check the broker status in the dashboard.

2. **Check client credentials**:
   - Ensure the client username and password are correct
   - Verify the client exists in the Client Management page

3. **Check port availability**:
   Ensure port 1900 isn't being used by another application:
   ```bash
   netstat -tuln | grep 1900
   ```

4. **Test with a simple client**:
   ```bash
   mosquitto_pub -h localhost -p 1900 -u your_client -P your_password -t test -m "test"
   ```

5. **Check broker logs**:
   Review the [Broker Logs](monitoring/broker-logs.md) for authentication failures or other errors.

## Performance Issues

### Slow Web UI

If the web interface is responding slowly:

1. **Check system resources**:
   Verify your host has sufficient CPU and memory available.

2. **Reduce log verbosity**:
   Lower the logging level in the broker configuration.

3. **Clear browser cache**:
   Clear your browser's cache and cookies.

4. **Check network latency**:
   If accessing remotely, network latency might be affecting performance.

### Broker Performance Problems

If the MQTT broker is experiencing performance issues:

1. **Check system resources**:
   Monitor CPU, memory, and disk usage on the host system.

2. **Review connection count**:
   Check how many clients are connected and whether you're approaching limits.

3. **Examine message rates**:
   Look for unusually high message rates that might be overloading the broker.

4. **Check retained messages**:
   Too many retained messages can impact performance.

5. **Review QoS settings**:
   Higher QoS levels require more resources.

## Security Issues

### Authentication Failures

If clients are failing to authenticate:

1. **Verify client credentials**:
   Double-check the username and password in the Client Management page.

2. **Check for special characters**:
   Ensure passwords don't contain special characters that might need escaping.

3. **Review broker logs**:
   Check the logs for specific authentication error messages.

### Permission Denied Errors

If clients can connect but can't publish or subscribe:

1. **Check ACL rules**:
   Review the role permissions assigned to the client.

2. **Verify topic syntax**:
   Ensure the topic matches the pattern specified in the ACL rules.

3. **Check group assignments**:
   Verify the client is in the correct groups with the necessary roles.

4. **Test with a simpler topic**:
   Try publishing to a simple topic to isolate the issue.

## Data Persistence Issues

### Lost Configuration After Restart

If your configuration changes don't persist after container restart:

1. **Use volume mounts**:
   Ensure you're using volume mounts for persistent data:
   ```bash
   docker run -d -p 1900:1900 -p 2000:2000 \
     -v mosquitto_data:/var/lib/mosquitto \
     -v auth_data:/data \
     bunkeriot/bunkerm
   ```

2. **Check volume permissions**:
   Ensure the container has write permissions to the mounted volumes.

3. **Verify changes were saved**:
   Some changes require explicit saving through the UI.

### Lost Messages

If retained messages are being lost:

1. **Check persistence settings**:
   Verify that persistence is enabled in the broker configuration.

2. **Check storage location**:
   Ensure the persistence directory is on a mounted volume.

3. **Verify disk space**:
   Check that there's sufficient disk space available.

## Update and Upgrade Issues

### Failed Updates

If you encounter issues when updating BunkerM:

1. **Check compatibility**:
   Verify that the new version is compatible with your setup.

2. **Backup before updating**:
   Always backup your data before updating:
   ```bash
   docker run --rm -v mosquitto_data:/data -v $(pwd)/backup:/backup \
     alpine sh -c "cd /data && tar czf /backup/mosquitto_data.tar.gz ."
   ```

3. **Check logs after update**:
   Review the logs for any errors after updating.

### Migration Problems

If you're having trouble migrating from one version to another:

1. **Follow the migration guide**:
   Check the release notes for specific migration instructions.

2. **Perform a clean install if necessary**:
   Sometimes a clean install with data import is easier than migration.

## Docker-Specific Issues

### Container Won't Start

If the Docker container won't start:

1. **Check Docker logs**:
   ```bash
   docker logs <container_id>
   ```

2. **Verify Docker version**:
   Ensure you're running a supported Docker version.

3. **Check resource constraints**:
   Verify that Docker has sufficient resources allocated.

4. **Try with a clean container**:
   Remove the container and create a new one:
   ```bash
   docker rm <container_id>
   docker run -d -p 1900:1900 -p 2000:2000 bunkeriot/bunkerm
   ```

### Volume Mount Issues

If you're having problems with volume mounts:

1. **Check volume existence**:
   ```bash
   docker volume ls | grep mosquitto
   ```

2. **Inspect volume details**:
   ```bash
   docker volume inspect mosquitto_data
   ```

3. **Check permissions**:
   Ensure the Docker user has permissions to access the volume locations.

## Getting Additional Help

If you're still experiencing issues after trying these troubleshooting steps:

1. **Check the documentation**:
   Review the relevant sections of this documentation for more detailed guidance.

2. **Search for similar issues**:
   Check if others have reported similar problems in the GitHub repository.

3. **Contact support**:
   Reach out to the BunkerM team at [m.idrissi@bunkeriot.com](mailto:m.idrissi@bunkeriot.com).

4. **Community forums**:
   Post your question on community forums or discussion groups.

- Verify that port 2000 is available and not blocked by a firewall
- Ensure Docker is running properly
- Check that the container is running with `docker ps` 