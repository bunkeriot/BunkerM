/* # Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
// services/groupService.js
import { api } from './api';
import { generateNonce } from '../utils/security';

// Helper function to get current timestamp in seconds
const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

export const groupService = {
  async getGroups() {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();
    
    const response = await api.get('/groups', {
      params: {
        nonce,
        timestamp
      }
    });
    return response.data.groups.split('\n').filter(Boolean).map(name => ({ name }));
  },

  async getGroup(name) {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();
    
    const response = await api.get(`/groups/${name}`, {
      params: {
        nonce,
        timestamp
      }
    });
    return response.data;
  },

  async createGroup(name) {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();
    
    const response = await api.post('/groups', 
      { name },
      {
        params: {
          nonce,
          timestamp
        }
      }
    );
    return response.data;
  },

  async deleteGroup(name) {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();
    
    const response = await api.delete(`/groups/${name}`, {
      params: {
        nonce,
        timestamp
      }
    });
    return response.data;
  },

  async addRoleToGroup(groupName, roleName) {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();
    
    const response = await api.post(
      `/groups/${groupName}/roles`,
      { role_name: roleName },
      {
        params: {
          nonce,
          timestamp
        }
      }
    );
    return response.data;
  },

  async addClientToGroup(groupName, username, priority = null) {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();
    
    // Validate inputs
    if (!groupName || !username) {
      throw new Error('Group name and username are required');
    }
  
    const data = { username };
    if (priority !== null && !isNaN(priority)) {
      data.priority = priority;
    }
  
    // Debug log
    console.log('Adding client to group:', {
      endpoint: `/groups/${groupName}/clients`,
      data,
      params: { nonce, timestamp }
    });
  
    const response = await api.post(
      `/groups/${groupName}/clients`,
      data,
      {
        params: {
          nonce,
          timestamp
        }
      }
    );
  
    return response.data;
  },
  
  async removeClientFromGroup(groupName, username) {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();
    
    const response = await api.delete(
      `/groups/${groupName}/clients/${username}`,
      {
        params: {
          nonce,
          timestamp
        }
      }
    );
    return response.data;
  },

  async removeRoleFromGroup(groupName, roleName) {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();
    
    const response = await api.delete(
      `/groups/${groupName}/roles/${roleName}`,
      {
        params: {
          nonce,
          timestamp
        }
      }
    );
    return response.data;
  }
};