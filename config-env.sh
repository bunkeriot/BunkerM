#!/bin/sh

# First try to get the host's address from environment variable
HOST_ADDRESS=${HOST_ADDRESS:-localhost}

# Strip any protocol and port from HOST_ADDRESS if present
HOST_ADDRESS=$(echo "$HOST_ADDRESS" | sed -E 's#^(https?://)?([^:/]+).*#\2#')

# Function to create config with appropriate settings
create_config() {
    local host=$1
    echo "window.__runtime_config__ = {
        \"API_URL\": \"https://${host}:2000/api\",
        \"DYNSEC_API_URL\": \"https://${host}:2000/api/dynsec\",
        \"AWS_BRIDGE_API_URL\": \"https://${host}:2000/api/aws-bridge\",
        \"MONITOR_API_URL\": \"https://${host}:2000/api/monitor\",
        \"host\": \"${host}\",
        \"debug\": true,
        \"timeout\": 10000,
        \"retryAttempts\": 3,
        \"retryDelay\": 1000,
        \"headers\": {
            \"X-API-Key\": \"\${process.env.VITE_API_KEY}\",
            \"Content-Type\": \"application/json\"
        }
    };" > /usr/share/nginx/html/config.js
}

# Create the config with the specified host
create_config "$HOST_ADDRESS"

echo "Runtime configuration set to use host: $HOST_ADDRESS"
echo "Firebase Auth will use proxy at https://$HOST_ADDRESS:2000/auth/"

