# Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
#
# backend/app/config/mosquitto_config.py
from logging.handlers import RotatingFileHandler
import logging
import os
import re
import shutil
import subprocess
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, Security, status
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel

# Router setup
router = APIRouter(tags=["mosquitto_config"])

# Configure logging
logger = logging.getLogger(__name__)

# Environment variables
API_KEY = os.getenv("API_KEY")
MOSQUITTO_CONF_PATH = os.getenv("MOSQUITTO_CONF_PATH", "/etc/mosquitto/mosquitto.conf")
BACKUP_DIR = os.getenv("MOSQUITTO_BACKUP_DIR", "/tmp/mosquitto_backups")

# Security
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)

# Create backup directory if it doesn't exist
os.makedirs(BACKUP_DIR, exist_ok=True)


async def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header != API_KEY:
        logger.warning(f"Invalid API key attempt")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API Key"
        )
    return api_key_header


# Models for request validation
class Listener(BaseModel):
    port: int
    bind_address: Optional[str] = None
    per_listener_settings: Optional[bool] = False
    max_connections: Optional[int] = -1


class MosquittoConfig(BaseModel):
    config: Dict[str, Any]
    listeners: List[Listener] = []


# Default configuration based on the provided mosquitto.conf
DEFAULT_CONFIG = """# MQTT listener on port 1900
listener 1900
per_listener_settings false
allow_anonymous false

# HTTP listener for Dynamic Security Plugin on port 8080
listener 8080
password_file /etc/mosquitto/mosquitto_passwd
# Dynamic Security Plugin configuration
plugin /usr/lib/mosquitto_dynamic_security.so
plugin_opt_config_file /var/lib/mosquitto/dynamic-security.json
log_dest file /var/log/mosquitto/mosquitto.log
log_type all
log_timestamp true
persistence true
persistence_location /var/lib/mosquitto/
persistence_file mosquitto.db
"""


def parse_mosquitto_conf() -> Dict[str, Any]:
    """
    Parse the mosquitto.conf file into a dictionary
    """
    config = {}
    listeners = []
    current_listener = None

    try:
        with open(MOSQUITTO_CONF_PATH, "r") as f:
            lines = f.readlines()

        for line in lines:
            line = line.strip()

            # Skip comments and empty lines
            if not line or line.startswith("#"):
                continue

            # Check if this is a listener line
            if line.startswith("listener "):
                parts = line.split()

                if current_listener:
                    listeners.append(current_listener)

                current_listener = {
                    "port": int(parts[1]),
                    "bind_address": parts[2] if len(parts) > 2 else "",
                    "per_listener_settings": False,
                    "max_connections": -1,
                }
            elif current_listener and line.startswith(
                ("per_listener_settings ", "max_connections ")
            ):
                key, value = line.split(" ", 1)
                if key == "per_listener_settings":
                    current_listener[key] = value.lower() == "true"
                elif key == "max_connections":
                    current_listener[key] = int(value)
            else:
                # Regular configuration line
                if " " in line:
                    key, value = line.split(" ", 1)
                    config[key] = value

        # Add the last listener if there is one
        if current_listener:
            listeners.append(current_listener)

        return {"config": config, "listeners": listeners}

    except Exception as e:
        logger.error(f"Error parsing mosquitto.conf: {str(e)}")
        return {"config": {}, "listeners": []}


def generate_mosquitto_conf(
    config_data: Dict[str, Any], listeners: List[Dict[str, Any]]
) -> str:
    """
    Generate mosquitto.conf content from configuration data
    """
    lines = []

    # Add a header
    lines.append("# Mosquitto Broker Configuration")
    lines.append("# Generated on " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    lines.append("")

    # Add main configuration
    for key, value in config_data.items():
        # Skip some keys that are handled separately
        if key in ["plugin", "plugin_opt_config_file"]:
            continue

        # Convert Python booleans to lowercase strings for mosquitto config
        if isinstance(value, bool):
            value = str(value).lower()

        lines.append(f"{key} {value}")

    # Add plugins configuration
    if "plugin" in config_data:
        lines.append("")
        lines.append("# Dynamic Security Plugin configuration")
        lines.append(f"plugin {config_data['plugin']}")

        if "plugin_opt_config_file" in config_data:
            lines.append(
                f"plugin_opt_config_file {config_data['plugin_opt_config_file']}"
            )

    # Add listeners
    for listener in listeners:
        lines.append("")
        lines.append(
            f"listener {listener['port']}{' ' + listener['bind_address'] if listener['bind_address'] else ''}"
        )

        if "per_listener_settings" in listener and listener["per_listener_settings"]:
            lines.append(f"per_listener_settings true")
        elif "per_listener_settings" in listener:
            lines.append(f"per_listener_settings false")

        if "max_connections" in listener and listener["max_connections"] != -1:
            lines.append(f"max_connections {listener['max_connections']}")

    return "\n".join(lines)


@router.get("/mosquitto-config")
async def get_mosquitto_config(api_key: str = Security(get_api_key)):
    """
    Get the current Mosquitto configuration
    """
    try:
        config_data = parse_mosquitto_conf()

        if not config_data["config"]:
            return {
                "success": False,
                "message": "Failed to parse Mosquitto configuration",
            }

        return {
            "success": True,
            "config": config_data["config"],
            "listeners": config_data["listeners"],
        }

    except Exception as e:
        logger.error(f"Error getting Mosquitto configuration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get Mosquitto configuration: {str(e)}",
        )


@router.post("/mosquitto-config")
async def save_mosquitto_config(
    config: MosquittoConfig, api_key: str = Security(get_api_key)
):

    try:
        # Convert listeners to the format expected by generate_mosquitto_conf
        listeners_list = []
        for listener in config.listeners:
            listeners_list.append(
                {
                    "port": listener.port,
                    "bind_address": listener.bind_address or "",
                    "per_listener_settings": listener.per_listener_settings,
                    "max_connections": listener.max_connections,
                }
            )

        # Validate listeners for duplicate ports
        current_config = parse_mosquitto_conf()
        is_valid, error_message = validate_listeners(current_config.get("listeners", []), listeners_list)
        
        if not is_valid:
            logger.error(f"Validation error: {error_message}")
            return {
                "success": False,
                "message": error_message
            }

        # Create backup of current configuration
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(BACKUP_DIR, f"mosquitto.conf.bak.{timestamp}")

        if os.path.exists(MOSQUITTO_CONF_PATH):
            shutil.copy2(MOSQUITTO_CONF_PATH, backup_path)
            logger.info(f"Created backup of Mosquitto configuration at {backup_path}")

        # Generate new configuration content
        new_config_content = generate_mosquitto_conf(config.config, listeners_list)

        # Write new configuration
        with open(MOSQUITTO_CONF_PATH, "w") as f:
            f.write(new_config_content)

        # Set proper permissions
        os.chmod(MOSQUITTO_CONF_PATH, 0o644)

        logger.info(f"Mosquitto configuration saved successfully")
        return {
            "success": True,
            "message": "Mosquitto configuration saved successfully",
            "need_restart": True,
        }

    except Exception as e:
        logger.error(f"Error saving Mosquitto configuration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save Mosquitto configuration: {str(e)}",
        )
        

@router.post("/reset-mosquitto-config")
async def reset_mosquitto_config(api_key: str = Security(get_api_key)):
    """
    Reset Mosquitto configuration to default
    """
    try:
        # Create backup of current configuration
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(BACKUP_DIR, f"mosquitto.conf.bak.{timestamp}")

        if os.path.exists(MOSQUITTO_CONF_PATH):
            shutil.copy2(MOSQUITTO_CONF_PATH, backup_path)
            logger.info(f"Created backup of Mosquitto configuration at {backup_path}")

        # Write default configuration
        with open(MOSQUITTO_CONF_PATH, "w") as f:
            f.write(DEFAULT_CONFIG)

        # Set proper permissions
        os.chmod(MOSQUITTO_CONF_PATH, 0o644)

        logger.info(f"Mosquitto configuration reset to default")
        return {
            "success": True,
            "message": "Mosquitto configuration reset to default",
            "need_restart": True,
        }

    except Exception as e:
        logger.error(f"Error resetting Mosquitto configuration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset Mosquitto configuration: {str(e)}",
        )
        
        
def validate_listeners(current_listeners: List[Dict[str, Any]], new_listeners: List[Dict[str, Any]]) -> tuple[bool, str]:
    """
    Validate that there are no duplicate listener ports
    Returns (is_valid, error_message)
    """
    # Get all port numbers from the new listeners
    port_counts = {}
    for listener in new_listeners:
        port = listener.get('port')
        if port in port_counts:
            port_counts[port] += 1
        else:
            port_counts[port] = 1
    
    # Check for duplicates within the new configuration
    for port, count in port_counts.items():
        if count > 1:
            return False, f"Duplicate listener port {port} found in configuration"
    
    # Also check for duplicate listener ports in the default configuration that aren't being updated
    default_ports = [1900, 8080]  # From the DEFAULT_CONFIG
    
    for port in port_counts:
        if port in default_ports and any(l.get('port') != port for l in new_listeners):
            return False, f"Port {port} is already used by Mosquitto's default configuration"
    
    return True, ""