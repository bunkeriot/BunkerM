# Home Assistant Setup

BunkerM is available as a native Home Assistant add-on. Running as an add-on means BunkerM is managed by Home Assistant's supervisor - it starts and stops with Home Assistant, logs are accessible from the HA UI, and all data is stored in HA's persistent data directory.

---

## What the HA Add-On Does

The BunkerM Home Assistant add-on runs the complete BunkerM stack - Mosquitto broker, web management dashboard, and all backend services - as a native HA add-on. You get the same full-featured BunkerM experience you would from a Docker deployment, but integrated into your Home Assistant environment.

This is the recommended way to run BunkerM if you are already on Home Assistant OS or Home Assistant Supervised.

---

## Prerequisites

- **Home Assistant OS** or **Home Assistant Supervised** (Supervisor support required)
- Internet access from the HA host (to download the add-on)
- Access to the Home Assistant web interface

---

## Step 1: Add the BunkerM Add-On Repository

Home Assistant add-ons from third-party repositories need to be added manually:

1. In Home Assistant, go to **Settings > Add-ons**.
2. Click **Add-on Store** in the bottom-right corner.
3. Click the **three-dot menu** (top-right) and select **Repositories**.
4. In the "Manage add-on repositories" dialog, enter:
   ```
   https://github.com/bunkeriot/bunkerm-ha-addons
   ```
5. Click **Add** and then **Close**.

The BunkerM repository is now registered with your Home Assistant instance.

---

## Step 2: Install BunkerM

1. In the Add-on Store, scroll down or search for **BunkerM**.
2. Click on the BunkerM add-on card.
3. Click **Install** and wait for the download and installation to complete.

Installation may take a few minutes depending on your internet connection and hardware.

---

## Step 3: Configure the Add-On Options

Before starting the add-on, configure your credentials in the **Configuration** tab:

| Option | Default | Description |
|--------|---------|-------------|
| `mqtt_username` | `bunker` | Username for MQTT broker connections |
| `mqtt_password` | `bunker` | Password for MQTT broker connections |
| `admin_email` | `admin@bunker.local` | Login email for the BunkerM web UI |
| `admin_password` | `admin123` | Login password for the BunkerM web UI |

**Important:** Change the default credentials before connecting any devices. The defaults are public and should not be used in production.

After setting your options, click **Save**.

---

## Step 4: Start the Add-On

1. Go to the **Info** tab of the BunkerM add-on.
2. Click **Start**.
3. Wait for the add-on to initialize (typically 10-20 seconds).
4. Optionally enable **Start on boot** and **Watchdog** so the add-on automatically starts with Home Assistant and restarts if it crashes.

---

## Step 5: Open the BunkerM Web UI

Once the add-on is running, access the web interface at:

```
http://homeassistant.local:2000
```

Or substitute your Home Assistant's IP address:

```
http://192.168.1.x:2000
```

You can also click **Open Web UI** from the add-on info page in Home Assistant.

Log in with the `admin_email` and `admin_password` you configured in Step 3.

---

## Step 6: Connect Home Assistant's MQTT Integration to BunkerM

Now configure Home Assistant to use your BunkerM broker:

1. In Home Assistant, go to **Settings > Devices & Services**.
2. Click **Add Integration** and search for **MQTT**.
3. If you already have an MQTT integration configured, click on it and update the broker settings.
4. Enter the broker connection details:
   - **Broker:** `homeassistant.local` or your HA IP address
   - **Port:** `1883`
   - **Username:** the `mqtt_username` you set in the add-on options
   - **Password:** the `mqtt_password` you set in the add-on options
5. Click **Submit** and then **Finish**.

Home Assistant is now connected to your BunkerM MQTT broker.

---

## MQTT Port Note

In the Home Assistant add-on, BunkerM uses the standard MQTT port **1883** (not 1900 as in the standalone Docker deployment). This is because most Home Assistant integrations and devices expect the standard MQTT port. Configure all your MQTT devices to connect on port 1883 when using the HA add-on.

---

## Persistence

All BunkerM data is stored in Home Assistant's `/data` directory for the add-on. This means:

- MQTT clients, ACLs, roles, and groups persist across add-on restarts
- Web UI user accounts are preserved
- Broker configuration is maintained
- BunkerAI settings and agent data are stored persistently

Data is preserved when you restart or update the add-on. It is also included in Home Assistant backups if you use HA's snapshot/backup feature.

---

## Troubleshooting

**Add-on does not start:**
Check the add-on logs in the **Log** tab. Common issues include port conflicts if another service is already using port 2000 or 1883.

**Cannot access the web UI:**
Verify the add-on is running (green status indicator). Check that port 2000 is not blocked by your network or HA host firewall.

**HA MQTT integration cannot connect:**
Verify the username and password match what you set in the add-on options. Check the BunkerM ACL Clients page to confirm the broker user account exists and is enabled.

**Add-on crashes repeatedly:**
Check the Log tab for error messages. If the issue persists, try stopping the add-on, waiting 30 seconds, and starting it again.

For additional help, open an issue on the [BunkerM GitHub repository](https://github.com/bunkeriot/bunkerm).
