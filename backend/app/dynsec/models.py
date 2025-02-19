# models.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class ClientCreate(BaseModel):
    username: str
    password: str
    textname: Optional[str] = None

class ClientUpdate(BaseModel):
    password: Optional[str] = None
    textname: Optional[str] = None
    roles: Optional[List[str]] = None

class ACLAccess(BaseModel):
    topic: str
    allow: bool
    access: str  # "read", "write", or "readwrite"
    priority: Optional[int] = None

class RoleCreate(BaseModel):
    name: str
    textname: Optional[str] = None
    acls: Optional[List[ACLAccess]] = Field(default_factory=list)
    priorities: Optional[Dict[str, int]] = Field(default_factory=dict)

class RoleUpdate(BaseModel):
    textname: Optional[str] = None
    acls: Optional[List[ACLAccess]] = None

class GroupCreate(BaseModel):
    name: str
    textname: Optional[str] = None
    roles: Optional[List[str]] = Field(default_factory=list)

class GroupUpdate(BaseModel):
    textname: Optional[str] = None
    roles: Optional[List[str]] = None

class RoleAssignment(BaseModel):
    role_name: str
    priority: Optional[int] = 1

class DefaultAccess(BaseModel):
    allow: bool

class MessageResponse(BaseModel):
    message: str
    success: bool

class ClientResponse(BaseModel):
    username: str
    message: str
    success: bool

class RoleResponse(BaseModel):
    name: str
    message: str
    success: bool

class GroupResponse(BaseModel):
    name: str
    message: str
    success: bool
