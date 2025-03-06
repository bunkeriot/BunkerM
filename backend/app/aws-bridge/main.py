# Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
#
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Security, Request, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security.api_key import APIKeyHeader
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pydantic_settings import BaseSettings
from typing import List, Optional
import json
import os
import subprocess
import shutil
import logging
from logging.handlers import RotatingFileHandler
import ssl
import secrets
from pathlib import Path
from datetime import datetime
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
handler = RotatingFileHandler(
    'aws_bridge_api.log',
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
    aws_endpoint: str
    client_id: str
    topics: List[str]

# Initialize FastAPI with versioning
app = FastAPI(
    title="AWS Bridge API",
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
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS.split(","))

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

@app.middleware("https")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


def validate_certificate(content: bytes, filename: str) -> bool:
    """
    Validate the certificate content.
    Returns True if the certificate is valid, False otherwise.
    """
    try:
        # Basic validation - check if it's a PEM file
        content_str = content.decode('utf-8')
        
        # Check for common certificate markers
        is_cert = ("-----BEGIN CERTIFICATE-----" in content_str and 
                  "-----END CERTIFICATE-----" in content_str)
        is_key = ("-----BEGIN PRIVATE KEY-----" in content_str and 
                 "-----END PRIVATE KEY-----" in content_str)
        is_rsa_key = ("-----BEGIN RSA PRIVATE KEY-----" in content_str and 
                     "-----END RSA PRIVATE KEY-----" in content_str)
        
        return is_cert or is_key or is_rsa_key
    except Exception as e:
        logger.error(f"Certificate validation error: {str(e)}")
        return False

def save_certificate(content: bytes, filename: str) -> str:
    """
    Save the certificate content to the configured certificate path.
    Returns the full path to the saved certificate.
    """
    try:
        cert_dir = settings.MOSQUITTO_CERT_PATH
        os.makedirs(cert_dir, exist_ok=True)
        
        filepath = os.path.join(cert_dir, filename)
        with open(filepath, 'wb') as f:
            f.write(content)
        
        # Set appropriate permissions
        os.chmod(filepath, 0o600)
        
        return filepath
    except Exception as e:
        logger.error(f"Error saving certificate: {str(e)}")
        raise

def generate_bridge_config(
    bridge_name: str,
    aws_endpoint: str,
    client_id: str,
    topics: List[str],
    cert_paths: dict
) -> str:
    """
    Generate the Mosquitto bridge configuration content.
    """
    config_lines = [
        f"# AWS IoT Bridge Configuration for {bridge_name}",
        f"connection {bridge_name}",
        f"address {aws_endpoint}:8883",
        "",
        "# Bridge settings",
        f"clientid {client_id}",
        "cleansession true",
        "start_type automatic",
        "",
        "# Security configuration",
        f"bridge_cafile {cert_paths['ca']}",
        f"bridge_certfile {cert_paths['cert']}",
        f"bridge_keyfile {cert_paths['key']}",
        "",
        "# Topic configuration"
    ]
    
    # Add topic mappings
    for topic in topics:
        # Configure bidirectional topic mapping
        config_lines.extend([
            f"topic {topic} both 0",
        ])
    
    # Add try_private and notifications settings
    config_lines.extend([
        "",
        "# Additional settings",
        "try_private true",
        "notifications true"
    ])
    
    return "\n".join(config_lines)

def restart_mosquitto() -> bool:
    """
    Restart the Mosquitto broker service.
    Returns True if successful, False otherwise.
    """
    try:
        # Try systemctl first
        result = subprocess.run(
            ['rc-service', 'mosquitto', 'restart'],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            return True
            
        return result.returncode == 0
        
    except Exception as e:
        logger.error(f"Error restarting Mosquitto: {str(e)}")
        return False



@app.post("/api/v1/aws-bridge")
async def create_aws_bridge(
    request: Request,
    bridge_config: str = Form(...),  # Changed to receive string from form
    cert_file: UploadFile = File(...),
    key_file: UploadFile = File(...),
    ca_file: UploadFile = File(...),
    api_key: str = Security(get_api_key)
):
    """Create AWS IoT bridge configuration"""
    await log_request(request)
    
    try:
        # Parse the bridge_config JSON string into a dict
        try:
            config_data = json.loads(bridge_config)
            # Convert the dict to your BridgeConfig model
            bridge_config_obj = BridgeConfig(**config_data)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in bridge_config: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON in bridge_config"
            )
        except ValueError as e:
            logger.error(f"Invalid bridge configuration data: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid bridge configuration data: {str(e)}"
            )

        logger.info(f"Creating AWS bridge for client: {bridge_config_obj.client_id}")
        
        # Validate and save certificates
        cert_paths = {}
        for file_obj, file_type in [
            (cert_file, 'cert'),
            (key_file, 'key'),
            (ca_file, 'ca')
        ]:
            content = await file_obj.read()
            if not validate_certificate(content, file_obj.filename):
                logger.error(f"Invalid {file_type} certificate")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid {file_type} certificate"
                )
            
            filepath = save_certificate(
                content,
                f"{bridge_config_obj.client_id}_{file_type}.pem"
            )
            logger.info(f"Saved {file_type} certificate to {filepath}")
            cert_paths[file_type] = filepath

        # Generate bridge configuration
        bridge_name = f"aws_bridge_{bridge_config_obj.client_id}"
        config_content = generate_bridge_config(
            bridge_name,
            bridge_config_obj.aws_endpoint,
            bridge_config_obj.client_id,
            bridge_config_obj.topics,
            cert_paths
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

        logger.info(f"Successfully configured AWS bridge for {bridge_config_obj.client_id}")
        return {
            "status": "success",
            "message": "AWS IoT bridge configured successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating AWS bridge: {str(e)}")
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

    logger.info("Starting AWS Bridge API server...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=1003,
        ssl=ssl_context,
        log_level="info"
    )