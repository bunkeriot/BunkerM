# Use Node.js with Alpine as base
FROM node:18-alpine as frontend-build

ENV NODE_OPTIONS="--max-old-space-size=4096"

# Set working directory for frontend
WORKDIR /frontend

# Copy frontend files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source
COPY frontend .

# Build frontend
RUN npm run build

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
    openssl \
    ca-certificates \
    nodejs \
    npm\
    nginx\
    openrc\
    libressl-dev\
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
    echo '    listen 2000 ssl;' >> /etc/nginx/http.d/default.conf && \
    echo '    ssl_certificate /app/certs/cert.pem;' >> /etc/nginx/http.d/default.conf && \
    echo '    ssl_certificate_key /app/certs/key.pem;' >> /etc/nginx/http.d/default.conf && \
    echo '    location / {' >> /etc/nginx/http.d/default.conf && \
    echo '        root /usr/share/nginx/html;' >> /etc/nginx/http.d/default.conf && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/http.d/default.conf && \
    echo '    }' >> /etc/nginx/http.d/default.conf && \
    echo '}' >> /etc/nginx/http.d/default.conf

# Create necessary directories
RUN mkdir -p /app/certs && \
    mkdir -p /var/log/api && \
    chmod 755 /etc/mosquitto &&\
    mkdir -p /etc/mosquitto/certs && \
    mkdir -p /etc/mosquitto/conf.d && \
    touch /etc/mosquitto/mosquitto_passwd && \
    chmod 644 /etc/mosquitto/mosquitto_passwd && \
    mkdir -p /app/jwt && \
    mkdir -p /usr/share/nginx/html && \
    mkdir -p /var/log/supervisor && \
    mkdir -p /run/nginx

# Copy the built frontend from the build stage to nginx html directory
COPY --from=frontend-build /frontend/dist /usr/share/nginx/html


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
    # Ensure mosquitto_passwd file exists and has right permissions
    echo 'touch /etc/mosquitto/mosquitto_passwd' >> /start.sh && \
    echo 'chown mosquitto:mosquitto /etc/mosquitto/mosquitto_passwd' >> /start.sh && \
    echo 'chmod 664 /etc/mosquitto/mosquitto_passwd' >> /start.sh && \
    echo 'chown -R mosquitto:mosquitto /var/log/mosquitto' >> /start.sh && \
    echo 'chmod -R 755 /var/log/supervisor' >> /start.sh && \
    echo 'chmod -R 755 /var/log/api' >> /start.sh && \
    echo 'chmod -R 755 /var/log/nginx' >> /start.sh && \
    echo '# Kill any existing nginx process' >> /start.sh && \
    echo 'pkill nginx || true' >> /start.sh && \
    echo '# Start supervisor which will manage all services' >> /start.sh && \
    echo 'exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf' >> /start.sh && \
    chmod +x /start.sh

# Copy configurations and applications
COPY backend/mosquitto/config/mosquitto.conf /etc/mosquitto/mosquitto.conf
COPY backend/etc/mosquitto/certs/ /etc/mosquitto/certs/
COPY backend/etc/mosquitto/conf.d/ /etc/mosquitto/conf.d/
COPY ssl_certificates/ /app/certs/
COPY nginx.conf /etc/nginx/nginx.conf
COPY backend/app /app
RUN touch /app/monitor/__init__.py
COPY ssl_certificates/ /app/certs
COPY backend/mosquitto/dynsec/dynamic-security.json /var/lib/mosquitto/dynamic-security.json
COPY backend/supervisord.conf /etc/supervisor/conf.d/supervisord.conf



#COPY .env /app/.env


# Copy the built frontend from the build stage
COPY --from=frontend-build /frontend/dist /frontend

# Set permissions

RUN chown -R mosquitto:mosquitto /var/lib/mosquitto && \
    chmod -R 775 /var/lib/mosquitto && \
    chown -R root:root /app && \
    chmod -R 755 /app && \
    chmod -R 755 /usr/share/nginx/html && \
    chown mosquitto:mosquitto /etc/mosquitto/mosquitto_passwd && \
    chmod 664 /etc/mosquitto/mosquitto_passwd
    
# Create environment file with secure defaults
#RUN echo "JWT_SECRET=$(openssl rand -hex 32)" > /app/.env && \
#    echo "API_KEY=$(openssl rand -hex 32)" >> /app/.env && \
#    chmod 600 /app/.env

ENV MQTT_BROKER=localhost \
    MQTT_PORT=1900 \
    MQTT_USERNAME=bunker \
    MQTT_PASSWORD=bunker \
    JWT_SECRET=REDACTED_JWT_SECRET \
    API_KEY=REDACTED_API_KEY \
    VITE_API_KEY=REDACTED_API_KEY \
    FRONTEND_URL=https://localhost:2000 \
    ALLOWED_ORIGINS=https://localhost:2000 \
    ALLOWED_HOSTS=localhost,127.0.0.1 \
    RATE_LIMIT_PER_MINUTE=100 \
    SSL_CERT_PATH=/app/certs/cert.pem \
    SSL_KEY_PATH=/app/certs/key.pem \
    LOG_LEVEL=INFO \
    API_LOG_FILE=/var/log/api/api_activity.log \
    VITE_AWS_BRIDGE_API_URL=https://localhost:2000/api/aws-bridge \
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

# Add the new supervisor configuration
#COPY backend/supervisord/config-api.conf /etc/supervisor/conf.d/



# Set Python path
ENV PYTHONPATH=/app/monitor:$PYTHONPATH \
    DYNSEC_PATH=/var/lib/mosquitto/dynamic-security.json \
    MAX_UPLOAD_SIZE=10485760

EXPOSE  2000 1900

# Use the startup script
CMD ["/start.sh"]