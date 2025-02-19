# app/azure-bridge/main.py
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Security, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security.api_key import APIKeyHeader
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pydantic_settings import BaseSettings
from typing import List, Optional
import os
import subprocess
import shutil
import logging
from logging.handlers import RotatingFileHandler
import ssl
import secrets
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
handler = RotatingFileHandler(
    'azure_bridge_api.log',
    maxBytes=10000000,  # 10MB
    backupCount=5
)
logger.addHandler(handler)

class Settings(BaseSettings):
    MQTT_BROKER: str
    MQTT_PORT: int
    MQTT_USERNAME: str
    MQTT_PASSWORD: str
    MOSQUITTO_CERT_PATH: str = "/etc/mosquitto/certs"
    MOSQUITTO_CONF_PATH: str = "/etc/mosquitto/conf.d"
    FRONTEND_URL: str = "https://localhost:2000"
    ALLOWED_HOSTS: str = "localhost"
    API_KEY: str = None
    
    class Config:
        env_file = ".env"

class BridgeConfig(BaseModel):
    hub_name: str
    device_id: str
    sas_token: str
    topics: List[str]
    api_version: str = "2019-03-31"

app = FastAPI(
    title="Azure IoT Hub Bridge API",
    version="1.0.0",
    docs_url="/api/v1/docs",
    openapi_url="/api/v1/openapi.json"
)

# Load settings
settings = Settings()

# Security settings
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)
API_KEYS = {settings.API_KEY} if settings.API_KEY else {secrets.token_urlsafe(32)}

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS.split(",")
)

async def get_api_key(api_key: str = Security(api_key_header)):
    if api_key not in API_KEYS:
        logger.warning(f"Invalid API key attempt")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key"
        )
    return api_key

async def log_request(request: Request):
    """Log API request details"""
    logger.info(
        f"Request: {request.method} {request.url} "
        f"Client: {request.client.host} "
        f"User-Agent: {request.headers.get('user-agent')} "
        f"Time: {datetime.now().isoformat()}"
    )

def validate_certificate(cert_content: bytes, filename: str) -> bool:
    """Validate certificate file content"""
    try:
        # Basic validation - check if it's a valid PEM file
        cert_str = cert_content.decode('utf-8')
        if '-----BEGIN CERTIFICATE-----' in cert_str and '-----END CERTIFICATE-----' in cert_str:
            return True
        return False
    except Exception as e:
        logger.error(f"Certificate validation failed: {str(e)}")
        return False

def save_certificate(cert_content: bytes, filename: str) -> str:
    """Save certificate file to the Mosquitto certs directory"""
    try:
        os.makedirs(settings.MOSQUITTO_CERT_PATH, exist_ok=True)
        filepath = os.path.join(settings.MOSQUITTO_CERT_PATH, filename)
        
        with open(filepath, "wb") as cert_file:
            cert_file.write(cert_content)
        
        # Set appropriate permissions
        os.chmod(filepath, 0o644)
        return filepath
    except Exception as e:
        logger.error(f"Error saving certificate: {str(e)}")
        raise

def generate_bridge_config(
    bridge_name: str,
    hub_name: str,
    device_id: str,
    sas_token: str,
    topics: List[str],
    api_version: str,
    ca_path: str
) -> str:
    """Generate Mosquitto bridge configuration for Azure IoT Hub"""
    config = f"""connection {bridge_name}
address {hub_name}.azure-devices.net:8883
remote_username {hub_name}.azure-devices.net/{device_id}/?api-version={api_version}
remote_password {sas_token}
remote_clientid {device_id}
bridge_cafile {ca_path}

# Enable clean session
cleansession true

# Keep alive interval
keepalive_interval 60

# Start type
start_type automatic

# Retry interval
retry_interval 10

# Bridge attempt unsubscribe
bridge_attempt_unsubscribe true

"""
    # Add topic configurations
    for topic in topics:
        if topic.endswith('/#'):
            base_topic = topic[:-2]
            config += f"topic {base_topic}/# out 1\n"
        else:
            config += f"topic {topic} out 1\n"

    return config

def restart_mosquitto() -> bool:
    """Restart Mosquitto broker"""
    try:
        subprocess.run(["supervisorctl", "restart", "mosquitto"], check=True)
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to restart Mosquitto: {str(e)}")
        return False

@app.post("/api/v1/azure-bridge")
async def create_azure_bridge(
    request: Request,
    bridge_config: BridgeConfig,
    ca_file: UploadFile = File(...),
    api_key: str = Security(get_api_key)
):
    """Create Azure IoT Hub bridge configuration"""
    await log_request(request)
    logger.info(f"Creating Azure IoT Hub bridge for device: {bridge_config.device_id}")
    
    try:
        # Validate and save CA certificate
        content = await ca_file.read()
        if not validate_certificate(content, ca_file.filename):
            logger.error("Invalid CA certificate")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid CA certificate"
            )
        
        ca_path = save_certificate(
            content,
            f"azure_{bridge_config.device_id}_ca.pem"
        )
        logger.info(f"Saved CA certificate to {ca_path}")

        # Generate bridge configuration
        bridge_name = f"azure_bridge_{bridge_config.device_id}"
        config_content = generate_bridge_config(
            bridge_name,
            bridge_config.hub_name,
            bridge_config.device_id,
            bridge_config.sas_token,
            bridge_config.topics,
            bridge_config.api_version,
            ca_path
        )

        # Save bridge configuration
        config_path = os.path.join(settings.MOSQUITTO_CONF_PATH, f"{bridge_name}.conf")
        os.makedirs(settings.MOSQUITTO_CONF_PATH, exist_ok=True)
        with open(config_path, "w") as config_file:
            config_file.write(config_content)
        logger.info(f"Saved bridge configuration to {config_path}")

        # Restart Mosquitto
        if not restart_mosquitto():
            logger.error("Failed to restart Mosquitto broker")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to restart Mosquitto broker"
            )

        logger.info(f"Successfully configured Azure IoT Hub bridge for {bridge_config.device_id}")
        return {
            "status": "success",
            "message": "Azure IoT Hub bridge configured successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating Azure bridge: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    
    # SSL context for HTTPS
    ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    cert_path = os.getenv("SSL_CERT_PATH", "/app/certs/cert.pem")
    key_path = os.getenv("SSL_KEY_PATH", "/app/certs/key.pem")
    
    try:
        ssl_context.load_cert_chain(
            certfile=cert_path,
            keyfile=key_path
        )
        logger.info("Successfully loaded SSL certificates")
    except Exception as e:
        logger.error(f"Failed to load SSL certificates: {str(e)}")
        raise

    logger.info("Starting Azure IoT Hub Bridge API server...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=1004,  # Different port than AWS bridge
        ssl=ssl_context,
        log_level="info"
    )