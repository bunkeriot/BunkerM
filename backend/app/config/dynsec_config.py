# Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
#
# backend/app/config/dynsec_config.py
import json
import logging
import os
import shutil
from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, Security, UploadFile, File, status, Response
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel

# Router setup
router = APIRouter(tags=["dynsec_config"])

# Configure logging
logger = logging.getLogger(__name__)

# Environment variables
API_KEY = os.getenv("API_KEY")
DYNSEC_JSON_PATH = os.getenv("DYNSEC_JSON_PATH", "/var/lib/mosquitto/dynamic-security.json")
BACKUP_DIR = os.getenv("DYNSEC_BACKUP_DIR", "/tmp/dynsec_backups")

# Security
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)

# Create backup directory if it doesn't exist
os.makedirs(BACKUP_DIR, exist_ok=True)

# Default configuration that must be preserved
DEFAULT_CONFIG = {
    "defaultACLAccess": {
        "publishClientSend": True,
        "publishClientReceive": True,
        "subscribe": True,
        "unsubscribe": True
    },
    "clients": [{
        "username": "bunker",
        "textname": "Dynsec admin user",
        "roles": [{
            "rolename": "admin"
        }],
        "password": "bZDAuypZzNug9z7yoB3vmEwGIx1COCRaN8m16bEbnAoVJxBYxz1x9fMR7cB7ToC2Kj+txYEq2bWrl1H3GtnRlg==",
        "salt": "MfMHo5wStiQVCpnt",
        "iterations": 101
    }],
    "groups": [],
    "roles": [{
        "rolename": "admin",
        "acls": [{
            "acltype": "publishClientSend",
            "topic": "$CONTROL/dynamic-security/#",
            "priority": 0,
            "allow": True
        }, {
            "acltype": "publishClientReceive",
            "topic": "$CONTROL/dynamic-security/#",
            "priority": 0,
            "allow": True
        }, {
            "acltype": "publishClientReceive",
            "topic": "$SYS/#",
            "priority": 0,
            "allow": True
        }, {
            "acltype": "publishClientReceive",
            "topic": "#",
            "priority": 0,
            "allow": True
        }, {
            "acltype": "subscribePattern",
            "topic": "#",
            "priority": 0,
            "allow": True
        }, {
            "acltype": "subscribePattern",
            "topic": "$CONTROL/dynamic-security/#",
            "priority": 0,
            "allow": True
        }, {
            "acltype": "subscribePattern",
            "topic": "$SYS/#",
            "priority": 0,
            "allow": True
        }, {
            "acltype": "unsubscribePattern",
            "topic": "#",
            "priority": 0,
            "allow": True
        }]
    }]
}


async def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header != API_KEY:
        logger.warning(f"Invalid API key attempt")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API Key"
        )
    return api_key_header


def read_dynsec_json() -> Dict[str, Any]:
    """
    Read the dynamic security JSON file
    """
    try:
        with open(DYNSEC_JSON_PATH, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading dynamic security JSON: {str(e)}")
        return {}


def write_dynsec_json(data: Dict[str, Any]) -> bool:
    """
    Write to the dynamic security JSON file
    """
    try:
        with open(DYNSEC_JSON_PATH, "w") as f:
            json.dump(data, f, indent=4)
        return True
    except Exception as e:
        logger.error(f"Error writing dynamic security JSON: {str(e)}")
        return False


def validate_dynsec_json(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate the dynamic security JSON structure
    """
    required_keys = ["defaultACLAccess", "clients", "groups", "roles"]
    
    # Check if all required keys exist
    for key in required_keys:
        if key not in data:
            raise ValueError(f"Missing required key: {key}")
    
    # Ensure "defaultACLAccess" has required fields
    required_acl_fields = ["publishClientSend", "publishClientReceive", "subscribe", "unsubscribe"]
    for field in required_acl_fields:
        if field not in data["defaultACLAccess"]:
            raise ValueError(f"Missing required field in defaultACLAccess: {field}")
    
    # Validate that "clients", "groups", and "roles" are lists
    if not isinstance(data["clients"], list):
        raise ValueError("'clients' must be a list")
    if not isinstance(data["groups"], list):
        raise ValueError("'groups' must be a list")
    if not isinstance(data["roles"], list):
        raise ValueError("'roles' must be a list")
    
    # Check if admin user and role exist
    admin_user_exists = False
    admin_role_exists = False
    
    for client in data["clients"]:
        if "username" in client and client["username"] == "bunker":
            admin_user_exists = True
            break
    
    for role in data["roles"]:
        if "rolename" in role and role["rolename"] == "admin":
            admin_role_exists = True
            break
    
    if not admin_user_exists or not admin_role_exists:
        raise ValueError("Admin user or admin role is missing")
    
    return data


def merge_dynsec_configs(imported_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Merge imported config with default config to preserve critical components
    """
    # Start with a deep copy of the default config
    merged_config = DEFAULT_CONFIG.copy()
    
    # Copy defaultACLAccess from default config (must be preserved)
    # merged_config["defaultACLAccess"] = DEFAULT_CONFIG["defaultACLAccess"]
    
    # Keep admin user and add other users from imported config
    admin_user = DEFAULT_CONFIG["clients"][0]
    
    # Get all non-admin users from imported config
    non_admin_users = [user for user in imported_config.get("clients", []) 
                       if "username" in user and user["username"] != "bunker"]
    
    # Combine admin user with non-admin users
    merged_config["clients"] = [admin_user] + non_admin_users
    
    # Keep admin role and add other roles from imported config
    admin_role = DEFAULT_CONFIG["roles"][0]
    
    # Get all non-admin roles from imported config
    non_admin_roles = [role for role in imported_config.get("roles", []) 
                       if "rolename" in role and role["rolename"] != "admin"]
    
    # Combine admin role with non-admin roles
    merged_config["roles"] = [admin_role] + non_admin_roles
    
    # Import groups from imported config
    merged_config["groups"] = imported_config.get("groups", [])
    
    return merged_config


def create_backup() -> str:
    """
    Create a backup of the current dynamic security JSON file
    """
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(BACKUP_DIR, f"dynamic-security.json.bak.{timestamp}")
        
        if os.path.exists(DYNSEC_JSON_PATH):
            shutil.copy2(DYNSEC_JSON_PATH, backup_path)
            logger.info(f"Created backup of dynamic security JSON at {backup_path}")
            return backup_path
        else:
            logger.warning(f"Dynamic security JSON file not found at {DYNSEC_JSON_PATH}")
            return ""
    except Exception as e:
        logger.error(f"Error creating backup: {str(e)}")
        return ""


@router.get("/dynsec-json")
async def get_dynsec_json(api_key: str = Security(get_api_key)):
    """
    Get the current dynamic security JSON configuration
    """
    try:
        data = read_dynsec_json()
        
        if not data:
            return {
                "success": False,
                "message": "Failed to read dynamic security JSON"
            }
        
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        logger.error(f"Error getting dynamic security JSON: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dynamic security JSON: {str(e)}"
        )


@router.get("/export-dynsec-json")
async def export_dynsec_json(api_key: str = Security(get_api_key)):
    """
    Export the dynamic security JSON file for download, excluding default admin user and role
    """
    try:
        data = read_dynsec_json()
        
        if not data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to read dynamic security JSON"
            )
        
        # Create a copy of the data for modification
        export_data = data.copy()
        
        # Remove the default "bunker" admin user from the exported data
        if "clients" in export_data:
            export_data["clients"] = [
                client for client in export_data["clients"] 
                if "username" not in client or client["username"] != "bunker"
            ]
        
        # Remove the default "admin" role from the exported data
        if "roles" in export_data:
            export_data["roles"] = [
                role for role in export_data["roles"] 
                if "rolename" not in role or role["rolename"] != "admin"
            ]
        
        # Create a JSON response with a filename for download
        content = json.dumps(export_data, indent=4)
        filename = f"dynamic-security-export-{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
        
        response = Response(content=content)
        response.headers["Content-Disposition"] = f"attachment; filename={filename}"
        response.headers["Content-Type"] = "application/json"
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting dynamic security JSON: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export dynamic security JSON: {str(e)}"
        )

@router.post("/import-dynsec-json")
async def import_dynsec_json(
    file: UploadFile = File(...),
    api_key: str = Security(get_api_key)
):
    """
    Import a dynamic security JSON file
    """
    try:
        # Read the uploaded file
        content = await file.read()
        
        try:
            # Parse the JSON content
            imported_data = json.loads(content)
        except json.JSONDecodeError:
            return {
                "success": False,
                "message": "The uploaded file is not valid JSON"
            }
        
        # Validate the imported JSON structure
        try:
            validate_dynsec_json(imported_data)
        except ValueError as e:
            return {
                "success": False,
                "message": f"Invalid dynamic security JSON format: {str(e)}"
            }
        
        # Create a backup of the current configuration
        backup_path = create_backup()
        
        # Merge imported config with default config to preserve critical components
        merged_config = merge_dynsec_configs(imported_data)
        
        # Write the merged configuration
        if write_dynsec_json(merged_config):
            user_count = len(merged_config["clients"]) - 1  # Subtract admin user
            group_count = len(merged_config["groups"])
            role_count = len(merged_config["roles"]) - 1    # Subtract admin role
            
            return {
                "success": True,
                "message": f"Successfully imported dynamic security configuration",
                "backup_path": backup_path,
                "stats": {
                    "users": user_count,
                    "groups": group_count,
                    "roles": role_count
                },
                "need_restart": True
            }
        else:
            return {
                "success": False,
                "message": "Failed to write dynamic security configuration"
            }
            
    except Exception as e:
        logger.error(f"Error importing dynamic security JSON: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import dynamic security JSON: {str(e)}"
        )


@router.post("/reset-dynsec-json")
async def reset_dynsec_json(api_key: str = Security(get_api_key)):
    """
    Reset dynamic security JSON to default configuration
    """
    try:
        # Create a backup of the current configuration
        backup_path = create_backup()
        
        # Write the default configuration
        if write_dynsec_json(DEFAULT_CONFIG):
            return {
                "success": True,
                "message": "Successfully reset dynamic security configuration to default",
                "backup_path": backup_path,
                "need_restart": True
            }
        else:
            return {
                "success": False,
                "message": "Failed to write default dynamic security configuration"
            }
            
    except Exception as e:
        logger.error(f"Error resetting dynamic security JSON: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset dynamic security JSON: {str(e)}"
        )