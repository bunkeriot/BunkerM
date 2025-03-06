#!/bin/bash

# Create necessary directories
mkdir -p /var/log/supervisor
mkdir -p /var/log/nginx
mkdir -p /var/log/mosquitto
mkdir -p /data

# Create log files if they don't exist
touch /var/log/supervisor/auth-api.err.log
touch /var/log/supervisor/auth-api.out.log
touch /var/log/nginx/access.log
touch /var/log/nginx/error.log
touch /var/log/mosquitto/mosquitto.log

# Set permissions
chown -R root:root /var/log/supervisor
chown -R nginx:nginx /var/log/nginx
chown -R mosquitto:mosquitto /var/log/mosquitto
chmod -R 755 /var/log/supervisor
chmod -R 755 /var/log/nginx
chmod -R 755 /var/log/mosquitto

# Ensure mosquitto_passwd file exists and has correct permissions
touch /etc/mosquitto/mosquitto_passwd
chown mosquitto:mosquitto /etc/mosquitto/mosquitto_passwd
chmod 600 /etc/mosquitto/mosquitto_passwd

# Start supervisor to manage services
exec /usr/bin/supervisord -n -c /etc/supervisord.conf 