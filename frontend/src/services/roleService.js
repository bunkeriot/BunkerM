// services/roleService.js
import { api } from './api';
import { generateNonce } from '../utils/security';

// Helper function to get current timestamp in seconds
const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

export const roleService = {
  async getRoles() {
    const response = await api.get('/roles');
    return response.data.roles.split('\n').filter(Boolean).map(name => ({ name }));
  },

  async getRole(name) {
    const response = await api.get(`/roles/${name}`);
    return response.data;
  },

  async createRole(name) {
    const response = await api.post('/roles', { name });
    return response.data;
  },

  async deleteRole(name) {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();
    
    const response = await api.delete(`/roles/${name}`, {
      params: { nonce, timestamp }
    });
    return response.data;
  },

  async addRoleACL(roleName, aclData) {
    const response = await api.post(`/roles/${roleName}/acls`, {
      topic: aclData.topic,
      aclType: aclData.aclType,
      permission: aclData.permission
    });
    return response.data;
  },

  async removeRoleACL(roleName, aclType, topic) {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();
    const response = await api.delete(`/roles/${roleName}/acls`, {
      params: { acl_type: aclType, topic, nonce, timestamp}
    });
    return response.data;
  }
};

