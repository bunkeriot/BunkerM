# Use Node.js with Alpine as base
FROM node:18-alpine as frontend-build

ENV NODE_OPTIONS="--max-old-space-size=4096"

# Set working directory for frontend
WORKDIR /frontend

# Copy frontend files
COPY frontend/package*.json ./

# Install dependencies and TypeScript configurations
RUN npm install && \
    npm install -D @vue/tsconfig @tsconfig/node20 @types/node typescript

# Copy frontend source
COPY frontend .

# Build frontend
RUN npm run build

# Create runtime config template
RUN echo 'window.__runtime_config__ = { \
  "API_URL": "RUNTIME_API_URL", \
  "DYNSEC_API_URL": "RUNTIME_DYNSEC_API_URL", \
  "AWS_BRIDGE_API_URL": "RUNTIME_AWS_BRIDGE_API_URL", \
  "MONITOR_API_URL": "RUNTIME_MONITOR_API_URL", \
  "host": "RUNTIME_HOST", \
  "debug": true, \
  "timeout": 10000, \
  "retryAttempts": 3, \
  "retryDelay": 1000, \
  "headers": { \
    "X-API-Key": "${process.env.VITE_API_KEY}", \
    "Content-Type": "application/json" \
  } \
};' > /frontend/dist/config.js

# Use Eclipse Temurin as final base
FROM eclipse-temurin:17-jdk-alpine


# Install system packages including Python dev headers, SSL dependencies, and Node.js
RUN apk update && apk add --no-cache \
    python3 \
    python3-dev \
    musl-dev \
    linux-headers \
    py3-pip \
    mosquitto \
    mosquitto-clients \
    mosquitto-dev \
    libffi-dev \
    build-base \
    bash \
    curl \
    unzip \
    supervisor \
    ca-certificates \
    nodejs \
    npm\
    nginx\
    openrc\
    gcc\
    py3-cryptography

# Set up Python virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python packages
RUN pip install --upgrade pip && \
    pip install --no-cache-dir \
    psutil \
    paho-mqtt \
    fastapi \
    python-dotenv \
    pydantic \
    pydantic-settings \
    uvicorn[standard] \
    flask \
    flask-cors \
    pytz \
    statistics \
    python-multipart \
    passlib[bcrypt] \
    python-jwt \
    PyJWT \
    slowapi \
    secure \
    python-decouple \
    starlette-context \
    structlog \
    python-json-logger \
    aiofiles \
    types-aiofiles \
    typing-extensions 



# Install cryptography packages separately to handle dependencies better
RUN pip install --no-cache-dir \
    cryptography \
    pyOpenSSL \
    python-jose[cryptography]


# Install FastAPI packages that depend on cryptography
RUN pip install --no-cache-dir \
fastapi-jwt-auth \
fastapi-limiter

# Configure nginx
RUN mkdir -p /run/nginx
COPY default.conf /etc/nginx/conf.d/default.conf
COPY default.conf /etc/nginx/conf.d/default.conf

RUN echo 'server {' > /etc/nginx/http.d/default.conf && \
    echo '    listen 2000 default_server;' >> /etc/nginx/http.d/default.conf && \
    echo '    server_name _; # Accept any server name' >> /etc/nginx/http.d/default.conf && \
    echo '    # Global CORS settings' >> /etc/nginx/http.d/default.conf && \
    echo '    add_header Access-Control-Allow-Origin $http_origin always;' >> /etc/nginx/http.d/default.conf && \
    echo '    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;' >> /etc/nginx/http.d/default.conf && \
    echo '    add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-API-Key" always;' >> /etc/nginx/http.d/default.conf && \
    echo '    add_header Access-Control-Allow-Credentials true always;' >> /etc/nginx/http.d/default.conf && \
    echo '    add_header Access-Control-Max-Age 3600 always;' >> /etc/nginx/http.d/default.conf && \
    echo '    # Handle preflight requests' >> /etc/nginx/http.d/default.conf && \
    echo '    if ($request_method = "OPTIONS") {' >> /etc/nginx/http.d/default.conf && \
    echo '        return 204;' >> /etc/nginx/http.d/default.conf && \
    echo '    }' >> /etc/nginx/http.d/default.conf && \
    echo '    # Handle CORS for all locations' >> /etc/nginx/http.d/default.conf && \
    echo '    set $cors_origin $http_origin;' >> /etc/nginx/http.d/default.conf && \
    echo '    if ($cors_origin = "") {' >> /etc/nginx/http.d/default.conf && \
    echo '        set $cors_origin "*";' >> /etc/nginx/http.d/default.conf && \
    echo '    }' >> /etc/nginx/http.d/default.conf && \
    echo '    location / {' >> /etc/nginx/http.d/default.conf && \
    echo '        root /usr/share/nginx/html;' >> /etc/nginx/http.d/default.conf && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/http.d/default.conf && \
    echo '        add_header Cache-Control "no-store, no-cache, must-revalidate";' >> /etc/nginx/http.d/default.conf && \
    echo '    }' >> /etc/nginx/http.d/default.conf && \
    echo '    location /api/ {' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_pass http://127.0.0.1:8000/;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_http_version 1.1;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header Upgrade $http_upgrade;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header Connection "upgrade";' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header Host $host;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header X-Real-IP $remote_addr;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header X-Forwarded-Proto $scheme;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header Origin $http_origin;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_cache_bypass $http_upgrade;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_buffering off;' >> /etc/nginx/http.d/default.conf && \
    echo '    }' >> /etc/nginx/http.d/default.conf && \
    echo '}' >> /etc/nginx/http.d/default.conf

# Create necessary directories
RUN mkdir -p /app && \
    mkdir -p /var/log/api && \
    chmod 755 /etc/mosquitto &&\
    mkdir -p /etc/mosquitto/conf.d && \
    touch /etc/mosquitto/mosquitto_passwd && \
    chmod 644 /etc/mosquitto/mosquitto_passwd && \
    mkdir -p /app/jwt && \
    mkdir -p /usr/share/nginx/html && \
    mkdir -p /var/log/supervisor && \
    mkdir -p /run/nginx

# Copy the config-env.sh script
COPY config-env.sh /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/config-env.sh

# Copy the built frontend and config.js
COPY --from=frontend-build /frontend/dist /usr/share/nginx/html/
COPY --from=frontend-build /frontend/dist/config.js /usr/share/nginx/html/

# Copy frontend source for auth-api
COPY frontend /frontend

# Install Node.js dependencies for auth-api
RUN cd /frontend/src/auth && \
    npm init -y && \
    npm install express cors body-parser bcryptjs jsonwebtoken uuid

# Create startup script with proper order and error handling
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'mkdir -p /var/log/mosquitto' >> /start.sh && \
    echo 'mkdir -p /var/log/supervisor' >> /start.sh && \
    echo 'mkdir -p /var/log/nginx' >> /start.sh && \
    echo 'mkdir -p /var/log/api' >> /start.sh && \
    echo 'touch /var/log/mosquitto/mosquitto.log' >> /start.sh && \
    echo 'touch /var/log/mosquitto/mosquitto.err.log' >> /start.sh && \
    echo 'touch /var/log/api/api_activity.log' >> /start.sh && \
    echo 'touch /var/log/supervisor/nginx.out.log' >> /start.sh && \
    echo 'touch /var/log/supervisor/nginx.err.log' >> /start.sh && \
    echo 'touch /var/log/supervisor/auth-api.out.log' >> /start.sh && \
    echo 'touch /var/log/supervisor/auth-api.err.log' >> /start.sh && \
    # Ensure mosquitto_passwd file exists and has right permissions
    echo 'touch /etc/mosquitto/mosquitto_passwd' >> /start.sh && \
    echo 'chown mosquitto:mosquitto /etc/mosquitto/mosquitto_passwd' >> /start.sh && \
    echo 'chmod 664 /etc/mosquitto/mosquitto_passwd' >> /start.sh && \
    echo 'chown -R mosquitto:root /var/log/mosquitto' >> /start.sh && \
    echo 'chmod -R 644 /var/log/mosquitto' >> /start.sh && \
    echo 'chmod 755 /var/log/mosquitto' >> /start.sh && \
    echo 'chmod -R 755 /var/log/supervisor' >> /start.sh && \
    echo 'chmod -R 755 /var/log/api' >> /start.sh && \
    echo 'chmod -R 755 /var/log/nginx' >> /start.sh && \
    # Create data directory for auth-api
    echo 'mkdir -p /data' >> /start.sh && \
    echo 'chmod 755 /data' >> /start.sh && \
    echo '# Kill any existing nginx process' >> /start.sh && \
    echo 'pkill nginx || true' >> /start.sh && \
    echo '# Start supervisor which will manage all services' >> /start.sh && \
    echo 'exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf' >> /start.sh && \
    chmod +x /start.sh

# Copy configurations and applications
COPY backend/mosquitto/config/mosquitto.conf /etc/mosquitto/mosquitto.conf
COPY backend/etc/mosquitto/conf.d/ /etc/mosquitto/conf.d/
COPY nginx.conf /etc/nginx/nginx.conf
COPY backend/app /app
RUN touch /app/monitor/__init__.py
COPY backend/mosquitto/dynsec/dynamic-security.json /var/lib/mosquitto/dynamic-security.json
COPY backend/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Set permissions
RUN chown -R mosquitto:mosquitto /var/lib/mosquitto && \
    chmod -R 775 /var/lib/mosquitto && \
    chown -R root:root /app && \
    chmod -R 755 /app && \
    chmod -R 755 /usr/share/nginx/html && \
    chown mosquitto:mosquitto /etc/mosquitto/mosquitto_passwd && \
    chmod 664 /etc/mosquitto/mosquitto_passwd && \
    # Ensure Mosquitto logs are readable
    mkdir -p /var/log/mosquitto && \
    chown -R mosquitto:root /var/log/mosquitto && \
    chmod -R 644 /var/log/mosquitto && \
    chmod 755 /var/log/mosquitto

ENV MQTT_BROKER=localhost \
    MQTT_PORT=1900 \
    MQTT_USERNAME=bunker \
    MQTT_PASSWORD=bunker \
    JWT_SECRET=REDACTED_JWT_SECRET \
    API_KEY=REDACTED_API_KEY \
    VITE_API_KEY=REDACTED_API_KEY \
    HOST_ADDRESS=localhost \
    FRONTEND_URL=http://localhost:2000 \
    ALLOWED_ORIGINS=* \
    ALLOWED_HOSTS=* \
    RATE_LIMIT_PER_MINUTE=100 \
    LOG_LEVEL=INFO \
    API_LOG_FILE=/var/log/api/api_activity.log \
    VITE_AWS_BRIDGE_API_URL=http://localhost:2000/api/aws-bridge \
    MOSQUITTO_PASSWD_PATH=/etc/mosquitto/mosquitto_passwd    

RUN mkdir -p /var/lib/mosquitto/db && \
    mkdir -p /var/log/mosquitto && \
    mkdir -p /var/log/api && \
    chown -R mosquitto:mosquitto /var/lib/mosquitto && \
    chown -R mosquitto:mosquitto /var/log/mosquitto && \
    chmod -R 755 /var/log/api

    # Add environment variables for Mosquitto configuration
ENV MOSQUITTO_CONF_PATH=/etc/mosquitto/mosquitto.conf \
MOSQUITTO_BACKUP_DIR=/tmp/mosquitto_backups \
CONFIG_API_PORT=1005

# Create backup directory for Mosquitto configurations
RUN mkdir -p /tmp/mosquitto_backups && \
chmod 755 /tmp/mosquitto_backups

# Make sure permissions are set correctly for the Mosquitto configuration
RUN chown -R mosquitto:mosquitto /etc/mosquitto && \
chmod -R 755 /etc/mosquitto && \
chmod 644 /etc/mosquitto/mosquitto.conf

# Create directory for the config API
RUN mkdir -p /app/config && \
chmod 755 /app/config

# Copy config API files
COPY backend/app/config/mosquitto_config.py /app/config/
COPY backend/app/config/main.py /app/config/
COPY backend/app/config/.env /app/config/

# Set Python path
ENV PYTHONPATH=/app/monitor:$PYTHONPATH \
    DYNSEC_PATH=/var/lib/mosquitto/dynamic-security.json \
    MAX_UPLOAD_SIZE=10485760

EXPOSE 2000 1900

# Use the startup script
CMD ["/bin/sh", "-c", "/docker-entrypoint.d/config-env.sh && /start.sh"]

# Configure Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Create necessary directories
RUN mkdir -p /run/nginx && \
    mkdir -p /etc/nginx/conf.d && \
    mkdir -p /var/log/nginx