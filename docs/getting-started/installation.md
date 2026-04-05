# Installation Guide

This guide covers the different ways to install and deploy BunkerM, the all-in-one Mosquitto MQTT broker with web UI.

## System Requirements

Before deploying BunkerM, ensure your system meets the following requirements:

- **Docker**: Version 19.03 or higher
- **CPU**: 1+ cores
- **RAM**: 512MB minimum (1GB+ recommended)
- **Storage**: 1GB minimum free space
- **Ports**: 1900 (MQTT) and 2000 (Web UI) must be available

## Docker Installation

The recommended way to install BunkerM is using Docker. This method provides the simplest setup experience and works across all major platforms.

### Basic Deployment

```bash
docker run -d -p 1900:1900 -p 2000:2000 bunkeriot/bunkerm
```

This command:
- Runs BunkerM in detached mode (`-d`)
- Maps the MQTT broker port to 1900 (`-p 1900:1900`)
- Maps the Web UI port to 2000 (`-p 2000:2000`)
- Uses the official BunkerM image (`bunkeriot/bunkerm`)

### Persistent Data Deployment

For production environments, you'll want to persist your data across container restarts:

```bash
docker run -d -p 1900:1900 -p 2000:2000 \
  -v mosquitto_data:/var/lib/mosquitto \
  -v mosquitto_conf:/etc/mosquitto \
  -v auth_data:/data \
  bunkeriot/bunkerm
```

This command adds:
- A volume for Mosquitto data (`-v mosquitto_data:/var/lib/mosquitto`)
- A volume for authentication data (`-v auth_data:/data`)

### Remote Access Installation

If you need to access BunkerM from outside the host machine:

```bash
docker run -d -p 1900:1900 -p 2000:2000 \
  -e HOST_ADDRESS=<HOST_IP> \
  bunkeriot/bunkerm
```

Replace `<HOST_IP>` with your host machine's IP address or domain name.

## Docker Compose Installation

For more complex setups, you can use Docker Compose:

1. Create a file named `docker-compose.yml` with the following content:

```yaml
version: '3'
services:
  bunkerm:
    image: bunkeriot/bunkerm
    ports:
      - "1900:1900"
      - "2000:2000"
    volumes:
      - mosquitto_data:/var/lib/mosquitto
      - auth_data:/data
    environment:
      - HOST_ADDRESS=localhost  # Change this for remote access
    restart: unless-stopped

volumes:
  mosquitto_data:
  auth_data:
```

2. Run the following command in the same directory:

```bash
docker-compose up -d
```

## Kubernetes Installation

For Kubernetes deployments:

1. Create a file named `bunkerm-deployment.yaml` with the following content:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bunkerm
spec:
  replicas: 1
  selector:
    matchLabels:
      app: bunkerm
  template:
    metadata:
      labels:
        app: bunkerm
    spec:
      containers:
      - name: bunkerm
        image: bunkeriot/bunkerm
        ports:
        - containerPort: 1900
          name: mqtt
        - containerPort: 2000
          name: webui
        volumeMounts:
        - name: mosquitto-data
          mountPath: /var/lib/mosquitto
        - name: auth-data
          mountPath: /data
      volumes:
      - name: mosquitto-data
        persistentVolumeClaim:
          claimName: mosquitto-data-pvc
      - name: auth-data
        persistentVolumeClaim:
          claimName: auth-data-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: bunkerm
spec:
  selector:
    app: bunkerm
  ports:
  - name: mqtt
    port: 1900
    targetPort: 1900
  - name: webui
    port: 2000
    targetPort: 2000
  type: LoadBalancer
```

2. Apply the configuration:

```bash
kubectl apply -f bunkerm-deployment.yaml
```

## Verifying the Installation

After installation, verify that BunkerM is running correctly:

1. Open your web browser and navigate to `http://localhost:2000`
2. You should see the BunkerM login page

## Troubleshooting

If you encounter issues during installation:

- **Web UI not accessible**: Verify that port 2000 is not being used by another application
- **MQTT broker not accessible**: Verify that port 1900 is not being used by another application
- **Container fails to start**: Check Docker logs with `docker logs <container_id>`

## Next Steps

Now that you have BunkerM installed, proceed to the [Quick Start Guide](quick-start.md) to learn how to configure and use your MQTT broker. 