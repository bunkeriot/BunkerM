# Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
#
import re
import json
from datetime import datetime
from typing import Dict, List
import subprocess
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn
from pydantic import BaseModel
import uuid
import os

class MQTTEvent(BaseModel):
    id: str
    timestamp: str
    event_type: str
    client_id: str
    details: str
    status: str
    protocol_level: str
    clean_session: bool
    keep_alive: int
    username: str
    ip_address: str
    port: int

class MQTTMonitor:
    def __init__(self):
        self.connected_clients: Dict[str, MQTTEvent] = {}
        self.events: List[MQTTEvent] = []

    def parse_connection_log(self, log_line: str) -> MQTTEvent:
        print(f"Processing log line: {log_line}")

        # Regular expression to match connection log entries with timestamp
        pattern = r"(\d+): New client connected from (\d+\.\d+\.\d+\.\d+):(\d+) as (\S+) \(p(\d+), c(\d+), k(\d+), u'([^']+)'\)"
        match = re.match(pattern, log_line)

        if match:
            print(f"Found connection match: {match.groups()}")
            timestamp, ip, port, client_id, protocol, clean, keep_alive, username = (
                match.groups()
            )

            # Convert Unix timestamp to ISO format
            iso_timestamp = datetime.fromtimestamp(int(timestamp)).isoformat()

            protocol_versions = {"3": "3.1", "4": "3.1.1", "5": "5.0"}

            event = MQTTEvent(
                id=str(uuid.uuid4()),
                timestamp=iso_timestamp,
                event_type="Client Connection",
                client_id=client_id,
                details=f"Connected from {ip}:{port}",
                status="success",
                protocol_level=f"MQTT v{protocol_versions.get(protocol, 'unknown')}",
                clean_session=clean == "1",
                keep_alive=int(keep_alive),
                username=username,
                ip_address=ip,
                port=int(port),
            )

            print(f"Created event: {event.dict()}")
            self.connected_clients[client_id] = event
            self.events.append(event)
            return event
        else:
            print("No connection match found")
            return None

    def parse_disconnection_log(self, log_line: str) -> MQTTEvent:
        print(f"Processing disconnection line: {log_line}")

        # Regular expression to match disconnection log entries with timestamp
        pattern = r"(\d+): Client (\S+) disconnected"
        match = re.match(pattern, log_line)

        if match:
            print(f"Found disconnection match: {match.groups()}")
            timestamp, client_id = match.groups()

            if client_id in self.connected_clients:
                connected_event = self.connected_clients[client_id]
                iso_timestamp = datetime.fromtimestamp(int(timestamp)).isoformat()

                event = MQTTEvent(
                    id=str(uuid.uuid4()),
                    timestamp=iso_timestamp,
                    event_type="Client Disconnection",
                    client_id=client_id,
                    details=f"Disconnected from {connected_event.ip_address}:{connected_event.port}",
                    status="warning",
                    protocol_level=connected_event.protocol_level,
                    clean_session=connected_event.clean_session,
                    keep_alive=connected_event.keep_alive,
                    username=connected_event.username,
                    ip_address=connected_event.ip_address,
                    port=connected_event.port,
                )

                print(f"Created disconnection event: {event.dict()}")
                del self.connected_clients[client_id]
                self.events.append(event)
                return event
            else:
                print(f"No connection record found for client {client_id}")
        else:
            print("No disconnection match found")
            return None


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

# Initialize MQTT monitor
mqtt_monitor = MQTTMonitor()

# Updated endpoint paths to match the frontend expectations
@app.post("/api/v1/enable/{username}")
async def enable_client(username: str):
    try:
        subprocess.run([
            "mosquitto_ctrl", 
            "-u", "bunker",
            "-P", "bunker",
            "dynsec",
            "enableClient", 
            username
        ], check=True)
        return {"status": "success", "message": f"Client {username} Enabled"}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Failed to enable client: {str(e)}")

@app.post("/api/v1/disable/{username}")
async def disable_client(username: str):
    try:
        subprocess.run([
            "mosquitto_ctrl", 
            "-u", "bunker",
            "-P", "bunker",
            "dynsec",
            "disableClient", 
            username
        ], check=True)
        return {"status": "success", "message": f"Client {username} Disabled"}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Failed to disable client: {str(e)}")

@app.get("/api/v1/events")  # Changed to match frontend expectation
async def get_mqtt_events():
    print(f"Current events in memory: {len(mqtt_monitor.events)}")
    sorted_events = sorted(mqtt_monitor.events, key=lambda x: x.timestamp, reverse=True)[:100]
    return {"events": [event.dict() for event in sorted_events]}

@app.get("/api/v1/connected-clients")
async def get_connected_clients():
    print(f"Current connected clients: {len(mqtt_monitor.connected_clients)}")
    return {"clients": [client.dict() for client in mqtt_monitor.connected_clients.values()]}

def monitor_mosquitto_logs():
    print("Starting mosquitto log monitoring...")
    process = subprocess.Popen(
        ["tail", "-f", "/var/log/mosquitto/mosquitto.log"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True
    )
    print("Mosquitto log monitoring process started")
    
    while True:
        line = process.stdout.readline()
        if line:
            line = line.strip()
            event = mqtt_monitor.parse_connection_log(line)
            if not event:
                event = mqtt_monitor.parse_disconnection_log(line)

if __name__ == "__main__":
    # Start log monitoring in a separate thread
    import threading
    log_thread = threading.Thread(target=monitor_mosquitto_logs, daemon=True)
    log_thread.start()
    
    # Start the FastAPI server with SSL
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=1002,
        ssl_keyfile="/app/certs/key.pem",
        ssl_certfile="/app/certs/cert.pem"
    )