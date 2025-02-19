# services/mosquitto_service.py
import subprocess
import logging
from typing import Optional, Tuple, Any, List
import json
from models import ACLAccess  # Add this import

logger = logging.getLogger(__name__)

def format_acl_command(acl: ACLAccess) -> str:
    """Format an ACL object into a command string"""
    parts = [f"topic {acl.topic}"]
    
    if acl.allow:
        parts.append("allow")
    else:
        parts.append("deny")
        
    if acl.access == "readwrite":
        parts.append("readwrite")
    elif acl.access == "read":
        parts.append("read")
    elif acl.access == "write":
        parts.append("write")
        
    if acl.priority is not None:
        parts.append(f"priority {acl.priority}")
        
    return " ".join(parts)

class MosquittoService:
    def __init__(self, admin_username: str, admin_password: str):
        self.admin_username = admin_username
        self.admin_password = admin_password

    def execute_command(self, command: list, input_data: Optional[str] = None) -> Tuple[bool, Any]:
        try:
            full_command = [
                "mosquitto_ctrl",
                "-u", self.admin_username,
                "-P", self.admin_password,
                "dynsec"
            ] + command

            logger.debug(f"Executing command: {' '.join(full_command)}")
            
            process = subprocess.Popen(
                full_command,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            stdout, stderr = process.communicate(input=input_data)
            
            if process.returncode == 0:
                try:
                    return True, json.loads(stdout)
                except json.JSONDecodeError:
                    return True, {"message": stdout.strip()}
            else:
                return False, stderr.strip()
                
        except Exception as e:
            logger.error(f"Command execution error: {str(e)}", exc_info=True)
            return False, str(e)

    # Client Management
    def create_client(self, username: str, password: str, textname: Optional[str] = None) -> Tuple[bool, Any]:
        command = ["createClient", username]
        if textname:
            command.extend(["--textname", textname])
        return self.execute_command(command, input_data=f"{password}\n")

    def delete_client(self, username: str) -> Tuple[bool, Any]:
        return self.execute_command(["deleteClient", username])

    def get_client(self, username: str) -> Tuple[bool, Any]:
        return self.execute_command(["getClient", username])

    def list_clients(self) -> Tuple[bool, Any]:
        return self.execute_command(["listClients"])

    def set_client(self, username: str, password: Optional[str] = None, 
                   textname: Optional[str] = None) -> Tuple[bool, Any]:
        command = ["setClient", username]
        if textname:
            command.extend(["--textname", textname])
        return self.execute_command(command, input_data=f"{password}\n" if password else None)

    # Role Management
    def create_role(self, name: str, textname: Optional[str] = None, 
                   acls: Optional[List[ACLAccess]] = None) -> Tuple[bool, Any]:
        command = ["createRole", name]
        if textname:
            command.extend(["--textname", textname])
        if acls:
            for acl in acls:
                command.extend(["--acl", format_acl_command(acl)])
        return self.execute_command(command)

    def delete_role(self, name: str) -> Tuple[bool, Any]:
        return self.execute_command(["deleteRole", name])

    def get_role(self, name: str) -> Tuple[bool, Any]:
        return self.execute_command(["getRole", name])

    def list_roles(self) -> Tuple[bool, Any]:
        return self.execute_command(["listRoles"])

    def set_role(self, name: str, textname: Optional[str] = None,
                 acls: Optional[List[ACLAccess]] = None) -> Tuple[bool, Any]:
        command = ["setRole", name]
        if textname:
            command.extend(["--textname", textname])
        if acls:
            for acl in acls:
                command.extend(["--acl", format_acl_command(acl)])
        return self.execute_command(command)

    # Group Management
    def create_group(self, name: str, textname: Optional[str] = None,
                    roles: Optional[List[str]] = None) -> Tuple[bool, Any]:
        command = ["createGroup", name]
        if textname:
            command.extend(["--textname", textname])
        if roles:
            for role in roles:
                command.extend(["--role", role])
        return self.execute_command(command)

    def delete_group(self, name: str) -> Tuple[bool, Any]:
        return self.execute_command(["deleteGroup", name])

    def get_group(self, name: str) -> Tuple[bool, Any]:
        return self.execute_command(["getGroup", name])

    def list_groups(self) -> Tuple[bool, Any]:
        return self.execute_command(["listGroups"])

    def set_group(self, name: str, textname: Optional[str] = None,
                  roles: Optional[List[str]] = None) -> Tuple[bool, Any]:
        command = ["setGroup", name]
        if textname:
            command.extend(["--textname", textname])
        if roles:
            for role in roles:
                command.extend(["--role", role])
        return self.execute_command(command)

    # Role Assignments
    def add_group_role(self, group_name: str, role_name: str,
                      priority: Optional[int] = None) -> Tuple[bool, Any]:
        command = ["addGroupRole", group_name, role_name]
        if priority:
            command.extend(["--priority", str(priority)])
        return self.execute_command(command)

    def remove_group_role(self, group_name: str, role_name: str) -> Tuple[bool, Any]:
        return self.execute_command(["removeGroupRole", group_name, role_name])

    def add_client_role(self, username: str, role_name: str,
                       priority: Optional[int] = None) -> Tuple[bool, Any]:
        command = ["addClientRole", username, role_name]
        if priority:
            command.extend(["--priority", str(priority)])
        return self.execute_command(command)

    def remove_client_role(self, username: str, role_name: str) -> Tuple[bool, Any]:
        return self.execute_command(["removeClientRole", username, role_name])

    # Miscellaneous
    def set_anonymous_group(self, group_name: str) -> Tuple[bool, Any]:
        return self.execute_command(["setAnonymousGroup", group_name])

    def get_anonymous_group(self) -> Tuple[bool, Any]:
        return self.execute_command(["getAnonymousGroup"])

    def set_default_acl_access(self, allow: bool) -> Tuple[bool, Any]:
        return self.execute_command(["setDefaultACLAccess", "allow" if allow else "deny"])
