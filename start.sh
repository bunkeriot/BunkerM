#!/bin/sh

# Create required directories and files
mkdir -p /var/log/mosquitto /var/log/supervisor /var/log/nginx /var/log/api /nextjs/data
touch /var/log/mosquitto/mosquitto.log
touch /var/log/mosquitto/mosquitto.err.log
touch /var/log/api/api_activity.log
touch /etc/mosquitto/mosquitto_passwd
chown mosquitto:mosquitto /etc/mosquitto/mosquitto_passwd
chmod 664 /etc/mosquitto/mosquitto_passwd
chown -R mosquitto:root /var/log/mosquitto
chmod -R 644 /var/log/mosquitto
chmod 755 /var/log/mosquitto
chmod -R 755 /var/log/supervisor
chmod -R 755 /var/log/api
mkdir -p /nextjs/data && chmod 755 /nextjs/data

# ── API key bootstrap ──────────────────────────────────────────────────────────
# Priority:
#   1. API_KEY env var set by the user at runtime (docker run -e API_KEY=...)
#   2. Persisted key file from a previous run  (volume-mounted /nextjs/data/)
#   3. Generate a fresh cryptographically-random key (first-ever startup)
KEY_FILE="/nextjs/data/.api_key"
DEFAULT_KEY="default_api_key_replace_in_production"

if [ -n "$API_KEY" ] && [ "$API_KEY" != "$DEFAULT_KEY" ]; then
    # Explicit env var supplied — persist it so the UI and Python file-readers agree
    echo "$API_KEY" > "$KEY_FILE"
    chmod 600 "$KEY_FILE"
    echo "[BunkerM] Using API key from environment variable."
elif [ -f "$KEY_FILE" ] && [ -s "$KEY_FILE" ]; then
    export API_KEY=$(cat "$KEY_FILE")
    echo "[BunkerM] Loaded existing API key from persistent storage."
else
    export API_KEY=$(openssl rand -hex 32)
    echo "$API_KEY" > "$KEY_FILE"
    chmod 600 "$KEY_FILE"
    echo "[BunkerM] Generated new API key and saved to persistent storage."
fi
# ──────────────────────────────────────────────────────────────────────────────

pkill nginx 2>/dev/null || true
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
