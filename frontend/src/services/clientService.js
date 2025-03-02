/* # Copyright (c) 2025 BunkerIoT
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
// services/clientService.js
import { api } from './api';
import { generateNonce } from '../utils/security';

// Helper function to get current timestamp in seconds
const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

export const clientService = {
  async getClients() {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();
    
    const response = await api.get(`/clients`, {
      params: {
        nonce,
        timestamp
      }
    });
    const clientsData = response.data.clients;
    return typeof clientsData === 'string' 
      ? clientsData.split('\n').filter(Boolean).map(username => ({ username }))
      : [];
  },

  async getClient(username) {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();
    
    const response = await api.get(`/clients/${username}`, {
      params: {
        nonce,
        timestamp
      }
    });
    return response.data;
  },

  async createClient({ username, password }) {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();
    
    const response = await api.post(`/clients`, 
      { username, password },
      { 
        params: {
          nonce,
          timestamp
        }
      }
    );
    return response.data;
  },

  async deleteClient(username) {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();
    
    const response = await api.delete(`/clients/${username}`, {
      params: {
        nonce,
        timestamp
      }
    });
    return response.data;
  },

  async addRoleToClient(username, roleName) {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();
    
    const response = await api.post(
      `/clients/${username}/roles`,
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

  async removeRoleFromClient(username, roleName) {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();
    
    const response = await api.delete(`/clients/${username}/roles/${roleName}`, {
      params: {
        nonce,
        timestamp
      }
    });
    return response.data;
  },

  async enableClient(username) {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();
    
    const response = await api.put(`/clients/${username}/enable`, null, {
      params: {
        nonce,
        timestamp
      }
    });
    return response.data;
  },

  async disableClient(username) {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();
    
    const response = await api.put(`/clients/${username}/disable`, null, {
      params: {
        nonce,
        timestamp
      }
    });
    return response.data;
  }
};