# app/monitor/main.py
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from paho.mqtt import client as mqtt_client
import threading
from typing import Dict, List, Optional
from collections import deque
import time
from datetime import datetime, timedelta
import json
import os
import jwt
import secrets
import logging
from logging.handlers import RotatingFileHandler
import ssl
from data_storage import HistoricalDataStorage
import socket

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
handler = RotatingFileHandler(
    'api_activity.log',
    maxBytes=10000000,  # 10MB
    backupCount=5
)
logger.addHandler(handler)

# MQTT Settings
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1900"))
MQTT_USERNAME = os.getenv("MQTT_USERNAME", "bunker")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "bunker")

# Define the topics we're interested in
MONITORED_TOPICS = {
    "$SYS/broker/messages/sent": "messages_sent",
    "$SYS/broker/subscriptions/count": "subscriptions",
    "$SYS/broker/retained messages/count": "retained_messages",
    "$SYS/broker/clients/connected": "connected_clients",
    "$SYS/broker/load/bytes/received/15min": "bytes_received_15min",
    "$SYS/broker/load/bytes/sent/15min": "bytes_sent_15min"
}

class MQTTStats:
    def __init__(self):
        self._lock = threading.Lock()
        # Direct values from $SYS topics
        self.messages_sent = 0
        self.subscriptions = 0
        self.retained_messages = 0
        self.connected_clients = 0
        self.bytes_received_15min = 0.0
        self.bytes_sent_15min = 0.0
        
        # Initialize message counter
        self.message_counter = MessageCounter()
        
        # Initialize data storage
        self.data_storage = HistoricalDataStorage()
        self.last_storage_update = datetime.now()
        
        # Message rate tracking
        self.messages_history = deque(maxlen=15)
        self.published_history = deque(maxlen=15)
        self.last_messages_sent = 0
        self.last_update = datetime.now()
        
        # Initialize history with zeros
        for _ in range(15):
            self.messages_history.append(0)
            self.published_history.append(0)

    def format_number(self, number: int) -> str:
        """Format large numbers with K/M suffix"""
        if number >= 1_000_000:
            return f"{number/1_000_000:.1f}M"
        elif number >= 1_000:
            return f"{number/1_000:.1f}K"
        return str(number)

    def increment_user_messages(self):
        """Increment the message counter for non-$SYS messages"""
        with self._lock:
            self.message_counter.increment_count()

    def update_storage(self):
        """Update storage every 30 minutes"""
        now = datetime.now()
        if (now - self.last_storage_update).total_seconds() >= 180:  # 3 minutes
            try:
                self.data_storage.add_hourly_data(
                    float(self.bytes_received_15min),
                    float(self.bytes_sent_15min)
                )
                self.last_storage_update = now
            except Exception as e:
                logger.error(f"Error updating storage: {e}")

    def update_message_rates(self):
        """Calculate message rates for the last minute"""
        now = datetime.now()
        if (now - self.last_update).total_seconds() >= 60:
            with self._lock:
                published_rate = max(0, self.messages_sent - self.last_messages_sent)
                self.published_history.append(published_rate)
                self.last_messages_sent = self.messages_sent
                self.last_update = now

    def get_stats(self) -> Dict:
        """Get current MQTT statistics"""
        self.update_message_rates()
        self.update_storage()
        
        with self._lock:
            actual_subscriptions = max(0, self.subscriptions - 2)
            actual_connected_clients = max(0, self.connected_clients - 1)
            
            # Get total messages from last 7 days
            total_messages = self.message_counter.get_total_count()
            
            # Get hourly data
            hourly_data = self.data_storage.get_hourly_data()
            daily_messages = self.data_storage.get_daily_messages()
            
            return {
                "total_connected_clients": actual_connected_clients,
                "total_messages_received": self.format_number(total_messages),
                "total_subscriptions": actual_subscriptions,
                "retained_messages": self.retained_messages,
                "messages_history": list(self.messages_history),
                "published_history": list(self.published_history),
                "bytes_stats": hourly_data,  # This contains timestamps, bytes_received, and bytes_sent
                "daily_message_stats": daily_messages  # This contains dates and counts
            }

def get_stats(self) -> Dict:
        """Get current MQTT statistics"""
        self.update_message_rates()
        self.update_storage()
        
        with self._lock:
            actual_subscriptions = max(0, self.subscriptions - 2)
            actual_connected_clients = max(0, self.connected_clients - 1)
            
            # Get historical data
            hourly_data = self.data_storage.get_hourly_data()
            
            return {
                "total_connected_clients": actual_connected_clients,
                "total_messages_received": self.format_number(self.messages_sent),
                "total_subscriptions": actual_subscriptions,
                "retained_messages": self.retained_messages,
                "messages_history": list(self.messages_history),
                "published_history": list(self.published_history),
                "bytes_stats": {
                    "timestamps": hourly_data['timestamps'],
                    "bytes_received": hourly_data['bytes_received'],
                    "bytes_sent": hourly_data['bytes_sent']
                },
                "daily_message_stats": self.data_storage.get_daily_messages()
            }
class MessageCounter:
    def __init__(self, file_path="message_counts.json"):
        self.file_path = file_path
        self.daily_counts = self._load_counts()

    def _load_counts(self) -> Dict[str, int]:
        """Load existing counts from JSON file"""
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, 'r') as f:
                    data = json.load(f)
                    # Convert to dict with date string keys
                    return {item['timestamp'].split()[0]: item['message_counter'] 
                           for item in data}
            except json.JSONDecodeError:
                return {}
        return {}

    def _save_counts(self):
        """Save counts to JSON file"""
        # Convert to list of dicts with timestamps
        data = [
            {
                "timestamp": f"{date} 00:00",
                "message_counter": count
            }
            for date, count in self.daily_counts.items()
        ]
        with open(self.file_path, 'w') as f:
            json.dump(data, f, indent=2)

    def increment_count(self):
        """Increment today's count and maintain 7-day window"""
        today = datetime.now().date().isoformat()
        
        # Increment or initialize today's count
        self.daily_counts[today] = self.daily_counts.get(today, 0) + 1

        # Remove counts older than 7 days
        cutoff_date = (datetime.now() - timedelta(days=7)).date().isoformat()
        self.daily_counts = {
            date: count 
            for date, count in self.daily_counts.items() 
            if date >= cutoff_date
        }

        # Save updated counts
        self._save_counts()

    def get_total_count(self) -> int:
        """Get sum of messages over last 7 days"""
        return sum(self.daily_counts.values())

# Initialize MQTT Stats
mqtt_stats = MQTTStats()

# Initialize FastAPI app with versioning
app = FastAPI(
    title="MQTT Monitor API",
    version="1.0.0",
    docs_url="/api/v1/docs",
    openapi_url="/api/v1/openapi.json"
)

# Security settings
JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_urlsafe(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION = 30  # minutes

# API Key settings
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)
API_KEY = os.getenv("API_KEY", "default_api_key_replace_in_production")
API_KEYS = {API_KEY}

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware with restricted origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "https://localhost:2000")],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["X-API-Key", "Content-Type"],
    expose_headers=["X-API-Key"]
)

# Update the Trusted Host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[os.getenv("ALLOWED_HOST", "localhost")]
)

async def get_api_key(api_key: str = Depends(api_key_header)):
    """Validate API key"""
    logger.info(f"Received API Key Header: {api_key}")
    
    if not api_key:
        logger.error("No API key provided")
        raise HTTPException(
            status_code=403,
            detail="No API key provided"
        )
    
    if api_key not in API_KEYS:
        logger.error(f"Invalid API key provided: {api_key}")
        raise HTTPException(
            status_code=403,
            detail="Invalid API key"
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
    """Add security headers to all responses"""
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

class NonceManager:
    def __init__(self):
        self.used_nonces = set()
        self._cleanup_thread = threading.Thread(target=self._cleanup_expired_nonces, daemon=True)
        self._cleanup_thread.start()

    def validate_nonce(self, nonce: str, timestamp: float) -> bool:
        """Validate nonce and timestamp"""
        if nonce in self.used_nonces:
            return False
        
        # Check if timestamp is within acceptable range (5 minutes)
        current_time = datetime.now().timestamp()
        if current_time - timestamp > 300:  # 5 minutes
            return False
            
        self.used_nonces.add(nonce)
        return True

    def _cleanup_expired_nonces(self):
        """Clean up expired nonces periodically"""
        while True:
            current_time = datetime.now().timestamp()
            self.used_nonces = {
                nonce for nonce in self.used_nonces
                if current_time - float(nonce.split(':')[0]) <= 300
            }
            time.sleep(300)  # Clean up every 5 minutes

nonce_manager = NonceManager()

def on_message(client, userdata, msg):
    """Handle messages from MQTT broker"""
    if msg.topic in MONITORED_TOPICS:
        try:
            # Handle byte rate topics differently (they return floats)
            if msg.topic in ["$SYS/broker/load/bytes/received/15min", "$SYS/broker/load/bytes/sent/15min"]:
                value = float(msg.payload.decode())
                attr_name = MONITORED_TOPICS[msg.topic]
                with mqtt_stats._lock:
                    setattr(mqtt_stats, attr_name, value)
            else:
                value = int(msg.payload.decode())
                attr_name = MONITORED_TOPICS[msg.topic]
                with mqtt_stats._lock:
                    setattr(mqtt_stats, attr_name, value)
        except ValueError as e:
            logger.error(f"Error processing message from {msg.topic}: {e}")
    # Count non-$SYS messages
    elif not msg.topic.startswith('$SYS/'):
        mqtt_stats.increment_user_messages()

def connect_mqtt():
    """Connect to MQTT broker"""
    try:
        def on_connect(client, userdata, flags, rc):
            if rc == 0:
                logger.info("Connected to MQTT Broker!")
                client.subscribe([
                    ("$SYS/broker/#", 0),
                    ("#", 0)
                ])
                logger.info("Subscribed to topics")
            else:
                logger.error(f"Failed to connect to MQTT broker, return code {rc}")
                error_codes = {
                    1: "Incorrect protocol version",
                    2: "Invalid client identifier",
                    3: "Server unavailable",
                    4: "Bad username or password",
                    5: "Not authorized"
                }
                logger.error(f"Error details: {error_codes.get(rc, 'Unknown error')}")

        client = mqtt_client.Client()
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        client.on_connect = on_connect
        client.on_message = on_message
        
        logger.info(f"Attempting to connect to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)  # Add timeout of 60 seconds
        return client
    
    except (ConnectionRefusedError, socket.error) as e:
        logger.error(f"Connection to MQTT broker failed: {e}")
        logger.error(f"Check if Mosquitto is running on {MQTT_BROKER}:{MQTT_PORT}")
        # Return a dummy client that won't crash your app
        dummy_client = mqtt_client.Client()
        # Override methods to do nothing
        dummy_client.loop_start = lambda: None
        return dummy_client
    except Exception as e:
        logger.error(f"Unexpected error connecting to MQTT broker: {e}")
        logger.exception(e)
        # Return a dummy client that won't crash your app
        dummy_client = mqtt_client.Client()
        # Override methods to do nothing
        dummy_client.loop_start = lambda: None
        return dummy_client

# API endpoints
@app.get("/api/v1/stats", dependencies=[Depends(get_api_key)])
async def get_stats(
    request: Request,
    nonce: str,
    timestamp: float
):
    """Get MQTT statistics"""
    await log_request(request)
    logger.info(f"Received request with nonce: {nonce}, timestamp: {timestamp}")
    
    try:
        if not nonce_manager.validate_nonce(nonce, timestamp):
            raise HTTPException(
                status_code=400,
                detail="Invalid nonce or timestamp"
            )
        
        # Add debug logging
        logger.info("Nonce validation passed")
        
        try:
            stats = mqtt_stats.get_stats()
            
            # Add MQTT connection status
            mqtt_connected = mqtt_stats.connected_clients > 0
            stats["mqtt_connected"] = mqtt_connected
            
            # If MQTT is not connected, add a message
            if not mqtt_connected:
                stats["connection_error"] = f"MQTT broker connection failed. Check if Mosquitto is running on {MQTT_BROKER}:{MQTT_PORT}"
                logger.warning(f"Serving stats with MQTT disconnected warning: {MQTT_BROKER}:{MQTT_PORT}")
            else:
                logger.info("Successfully retrieved stats with active MQTT connection")
        except Exception as stats_error:
            logger.error(f"Error in mqtt_stats.get_stats(): {str(stats_error)}")
            logger.exception(stats_error)  # This will log the full traceback
            
            # Return partial stats with error flag
            stats = {
                "mqtt_connected": False,
                "connection_error": f"Error getting MQTT stats: {str(stats_error)}",
                # Default values for essential fields
                "total_connected_clients": 0,
                "total_messages_received": "0",
                "total_subscriptions": 0,
                "retained_messages": 0,
                "messages_history": [0] * 15,
                "published_history": [0] * 15,
                "bytes_stats": {
                    "timestamps": [],
                    "bytes_received": [],
                    "bytes_sent": []
                },
                "daily_message_stats": {
                    "dates": [],
                    "counts": []
                }
            }
        
        response = JSONResponse(content=stats)
        response.headers["Access-Control-Allow-Origin"] = os.getenv("FRONTEND_URL", "https://localhost:2000")
        return response
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in get_stats endpoint: {str(e)}")
        logger.exception(e)  # This will log the full traceback
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
        
        
@app.get("/api/v1/test/mqtt-stats")
async def test_mqtt_stats():
    """Test endpoint to verify MQTT stats functionality"""
    try:
        if not mqtt_stats:
            return JSONResponse(
                status_code=500,
                content={"error": "MQTT stats not initialized"}
            )
            
        # Test basic functionality
        basic_info = {
            "messages_sent": mqtt_stats.messages_sent,
            "subscriptions": mqtt_stats.subscriptions,
            "connected_clients": mqtt_stats.connected_clients,
            "data_storage_initialized": hasattr(mqtt_stats, 'data_storage')
        }
        
        return JSONResponse(content=basic_info)
        
    except Exception as e:
        logger.error(f"Error in test endpoint: {str(e)}")
        logger.exception(e)
        return JSONResponse(
            status_code=500,
            content={"error": f"Test failed: {str(e)}"}
        )

@app.get("/api/v1/test/storage")
async def test_storage():
    """Test endpoint to verify storage functionality"""
    try:
        if not hasattr(mqtt_stats, 'data_storage'):
            return JSONResponse(
                status_code=500,
                content={"error": "Data storage not initialized"}
            )
            
        # Test storage functionality
        storage_info = {
            "file_exists": os.path.exists(mqtt_stats.data_storage.filename),
            "data": mqtt_stats.data_storage.load_data()
        }
        
        return JSONResponse(content=storage_info)
        
    except Exception as e:
        logger.error(f"Error in storage test endpoint: {str(e)}")
        logger.exception(e)
        return JSONResponse(
            status_code=500,
            content={"error": f"Storage test failed: {str(e)}"}
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.on_event("startup")
async def startup_event():
    """Start MQTT client on application startup"""
    client = connect_mqtt()
    client.loop_start()

if __name__ == "__main__":
    ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    ssl_context.minimum_version = ssl.TLSVersion.TLSv1_2
    ssl_context.set_ciphers('ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256')
    
    # Update logging level
    logging.basicConfig(level=logging.WARNING)  # Change from INFO to WARNING

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=1001,
        ssl=ssl_context,
        log_level="warning"  # Change from debug to warning
    )