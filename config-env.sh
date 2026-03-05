#!/bin/sh
# Runtime host configuration
HOST_ADDRESS=${HOST_ADDRESS:-localhost}
HOST_ADDRESS=$(echo "$HOST_ADDRESS" | sed -E 's#^(https?://)?([^:/]+).*#\2#')
echo "Runtime configuration set to use host: $HOST_ADDRESS"
