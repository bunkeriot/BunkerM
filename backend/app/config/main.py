# Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
#
# backend/app/config/main.py
import logging
import os
import ssl
from fastapi import FastAPI, HTTPException, Security, Depends, Request, status
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from dotenv import load_dotenv
from datetime import datetime
import uvicorn

# Import the mosquitto_config router
from mosquitto_config import router as mosquitto_config_router
from dynsec_config import router as dynsec_config_router

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
handler = logging.handlers.RotatingFileHandler(
    "config_api_activity.log", maxBytes=10000000, backupCount=5  # 10MB
)
logger.addHandler(handler)

# Environment variables
API_KEY = os.getenv("API_KEY")
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost").split(",")

# Initialize FastAPI app with versioning
app = FastAPI(
    title="Mosquitto Management API",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_HOSTS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)


# API Key security
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)

# Include the mosquitto_config router
app.include_router(mosquitto_config_router, prefix="/api/v1")
app.include_router(dynsec_config_router, prefix="/api/v1")

async def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header != API_KEY:
        logger.warning(f"Invalid API key attempt")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API Key"
        )
    return api_key_header

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
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# Add a health check endpoint
@app.get("/api/v1/health")
async def health_check(request: Request):
    """Health check endpoint"""
    await log_request(request)
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "service": "mosquitto-config-api"
    }

if __name__ == "__main__":
    # Use port 1005 since 1000-1004 are already in use
    PORT = int(os.getenv("CONFIG_API_PORT", "1005"))
    
    # Set up SSL context
    ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    cert_path = os.getenv("SSL_CERT_PATH", "/app/certs/cert.pem")
    key_path = os.getenv("SSL_KEY_PATH", "/app/certs/key.pem")

    try:
        ssl_context.load_cert_chain(certfile=cert_path, keyfile=key_path)
        logger.info(f"Successfully loaded SSL certificates")
    except Exception as e:
        logger.error(f"Failed to load SSL certificates: {str(e)}")
        raise

    logger.info(f"Starting Config API server on port {PORT}...")
    uvicorn.run(
        app,
        host="0.0.0.0",  # Bind to all interfaces
        port=PORT,
        log_level="info",
        ssl_certfile=cert_path,
        ssl_keyfile=key_path
    )