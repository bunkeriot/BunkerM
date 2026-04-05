# Running BunkerM with Persistent Storage

By default, if you run BunkerM without any volumes, all data is stored inside the container's writable layer. When you stop and remove the container, everything is lost - your MQTT clients, ACL rules, broker configuration, web UI accounts, and agent data all disappear.

Persistent storage keeps your data intact across container restarts, upgrades, and recreation.

---

## Why Persistence Matters

BunkerM stores several categories of data that you almost always want to keep:

- **MQTT clients and ACLs** - every client account, role, and group you have created
- **Broker configuration** - your Mosquitto settings, port configuration, and options
- **Dynamic security** - the full Mosquitto dynamic security JSON file
- **Web UI users** - BunkerM admin and user accounts
- **BunkerAI settings** - API keys, integration tokens, and configuration
- **Agents** - Watchers and Scheduled Jobs you have defined
- **Anomaly history** - detected anomalies and their status
- **Topic annotations** - AI context hints for your topics
- **Client logs** - connection event history

Without volumes, all of this is recreated from scratch every time the container starts.

---

## What Data BunkerM Stores and Where

| Data | Location inside container | Volume to use |
|------|--------------------------|---------------|
| Web UI users, BunkerAI settings, agents, anomaly data, annotations, client logs | `/nextjs/data` | `bunkerm_data` |
| MQTT persistence (retained messages, QoS queues), dynamic security (clients/ACLs) | `/var/lib/mosquitto` | `mosquitto_data` |
| Mosquitto configuration files | `/etc/mosquitto` | `mosquitto_conf` |

---

## Volume Setup with `docker run`

Full command with all three persistent volumes:

```bash
docker run -d \
  -p 1900:1900 \
  -p 2000:2000 \
  -v bunkerm_data:/nextjs/data \
  -v mosquitto_data:/var/lib/mosquitto \
  -v mosquitto_conf:/etc/mosquitto \
  --name bunkerm \
  --restart unless-stopped \
  bunkeriot/bunkerm:latest
```

Docker creates the named volumes automatically on first run. On subsequent starts, the same data is mounted back into the container.

---

## Volume Setup with Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: "3.8"
services:
  bunkerm:
    image: bunkeriot/bunkerm:latest
    ports:
      - "1900:1900"
      - "2000:2000"
    volumes:
      - bunkerm_data:/nextjs/data
      - mosquitto_data:/var/lib/mosquitto
      - mosquitto_conf:/etc/mosquitto
    restart: unless-stopped

volumes:
  bunkerm_data:
  mosquitto_data:
  mosquitto_conf:
```

Start:

```bash
docker compose up -d
```

Stop (data is preserved):

```bash
docker compose down
```

Stop and remove containers AND volumes (data is deleted):

```bash
docker compose down -v
```

Only use `-v` if you intentionally want to wipe all data and start fresh.

---

## Named Volumes vs Bind Mounts

You can use either named volumes (as shown above) or bind mounts (host directory paths).

### Named volumes (recommended)

```bash
-v bunkerm_data:/nextjs/data
```

Docker manages the volume storage location. Data lives at `/var/lib/docker/volumes/bunkerm_data/` on the host. Named volumes are portable, easy to back up, and work the same way on any Docker host.

### Bind mounts

```bash
-v /home/user/bunkerm/data:/nextjs/data
```

The container writes directly to a directory on your host filesystem. Useful if you want easy direct access to the files, or if you are integrating with other tools that read from specific paths.

Full docker run example with bind mounts:

```bash
mkdir -p /opt/bunkerm/data /opt/bunkerm/mosquitto/data /opt/bunkerm/mosquitto/conf

docker run -d \
  -p 1900:1900 \
  -p 2000:2000 \
  -v /opt/bunkerm/data:/nextjs/data \
  -v /opt/bunkerm/mosquitto/data:/var/lib/mosquitto \
  -v /opt/bunkerm/mosquitto/conf:/etc/mosquitto \
  --name bunkerm \
  --restart unless-stopped \
  bunkeriot/bunkerm:latest
```

---

## Backup Strategy

### Backing up named volumes

Use `docker run` with a temporary container to archive a volume's contents:

```bash
# Back up bunkerm_data
docker run --rm \
  -v bunkerm_data:/source:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/bunkerm_data_$(date +%Y%m%d).tar.gz -C /source .

# Back up mosquitto_data
docker run --rm \
  -v mosquitto_data:/source:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/mosquitto_data_$(date +%Y%m%d).tar.gz -C /source .

# Back up mosquitto_conf
docker run --rm \
  -v mosquitto_conf:/source:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/mosquitto_conf_$(date +%Y%m%d).tar.gz -C /source .
```

### Backing up bind mounts

Simply copy the directories:

```bash
cp -r /opt/bunkerm/data /opt/bunkerm/data.backup.$(date +%Y%m%d)
cp -r /opt/bunkerm/mosquitto /opt/bunkerm/mosquitto.backup.$(date +%Y%m%d)
```

### Automated daily backup

Add a cron job to run backups automatically:

```cron
0 2 * * * docker run --rm -v bunkerm_data:/source:ro -v /backups:/backup alpine tar czf /backup/bunkerm_$(date +\%Y\%m\%d).tar.gz -C /source . 2>/dev/null
```

---

## Upgrading BunkerM While Preserving Data

Because your data lives in volumes outside the container, upgrading is safe and straightforward:

1. **Pull the new image:**
   ```bash
   docker pull bunkeriot/bunkerm:latest
   ```

2. **Stop and remove the current container** (data stays in volumes):
   ```bash
   docker compose down
   # or
   docker stop bunkerm && docker rm bunkerm
   ```

3. **Start a new container** with the same volumes (Docker Compose does this automatically):
   ```bash
   docker compose up -d
   # or
   docker run -d ... (same command with same volume flags)
   ```

4. **Verify** the new container started and your data is intact:
   ```bash
   docker logs bunkerm
   # Open http://localhost:2000 and confirm your clients and settings are present
   ```

The new container reads from the same volumes and picks up right where the old one left off. Your MQTT clients, ACL rules, web UI accounts, and all other data are preserved.

---

## Data Directory Overview

Inside the container, here is what lives where:

### `/nextjs/data`
```
/nextjs/data/
  users.json                 - Web UI user accounts
  smart-anomaly.db           - Anomaly detection SQLite database (agents, anomalies, metrics)
  .bunkerai_status.json      - BunkerAI connection status
```

### `/var/lib/mosquitto`
```
/var/lib/mosquitto/
  dynamic-security.json      - All MQTT clients, roles, groups, and ACL rules
  mosquitto.db               - MQTT persistence (retained messages, QoS 1/2 queues)
```

### `/etc/mosquitto`
```
/etc/mosquitto/
  mosquitto.conf             - Main Mosquitto configuration
  conf.d/                    - Additional configuration snippets
```
