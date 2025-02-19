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
    openssl-dev \
    ca-certificates \
    nodejs \
    npm\
    nginx\
    openrc

# Set up Python virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python packages
RUN pip install --no-cache-dir \
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
    python-jose[cryptography] \
    passlib[bcrypt] \
    python-jwt \
    PyJWT \
    cryptography \
    slowapi \
    secure \
    fastapi-jwt-auth \
    python-decouple \
    starlette-context \
    structlog \
    python-json-logger \
    pyOpenSSL \
    fastapi-limiter \
    redis \
    aiofiles \
    types-aiofiles \
    typing-extensions



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
    mkdir -p /etc/mosquitto/certs && \
    mkdir -p /etc/mosquitto/conf.d && \
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
COPY backend/app /app
RUN touch /app/monitor/__init__.py
COPY ssl_certificates/ /app/certs
COPY backend/mosquitto/dynsec/dynamic-security.json /var/lib/mosquitto/dynamic-security.json
COPY backend/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy the built frontend from the build stage
COPY --from=frontend-build /frontend/dist /frontend

# Set permissions

RUN chown -R mosquitto:mosquitto /var/lib/mosquitto && \
    chmod -R 775 /var/lib/mosquitto && \
    chown -R root:root /app && \
    chmod -R 755 /app && \
    chmod -R 755 /usr/share/nginx/html
    
# Create environment file with secure defaults
RUN echo "JWT_SECRET=$(openssl rand -hex 32)" > /app/.env && \
    echo "API_KEY=$(openssl rand -hex 32)" >> /app/.env && \
    chmod 600 /app/.env


# Set Python path
ENV PYTHONPATH=/app/monitor:$PYTHONPATH

# Expose ports (including frontend port)
EXPOSE 1883 8080 1000 1001 1002 1003 2000

# Use the startup script
CMD ["/start.sh"]