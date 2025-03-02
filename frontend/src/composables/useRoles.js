/* # Copyright (c) 2025 BunkerIoT
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
// composables/useRoles.js
import { ref } from 'vue';
import { roleService } from '@/services/roleService';
import { useSnackbar } from '@/composables/useSnackbar';

export function useRoles() {
  const roles = ref([]);
  const loading = ref(false);
  const roleDetails = ref(null);
  const { showSuccess, showError } = useSnackbar();

  async function fetchRoles() {
    try {
      loading.value = true;
      const response = await roleService.getRoles();
      roles.value = response;
    } catch (error) {
      showError('Failed to fetch roles list. Please try again.');
      console.error('Error:', error);
    } finally {
      loading.value = false;
    }
  }

  async function createRole(name) {
    try {
      loading.value = true;
      await roleService.createRole(name);
      showSuccess(`Role "${name}" has been successfully created`);
      await fetchRoles();
      return true;
    } catch (error) {
      showError(`Failed to create role "${name}". Please try again.`);
      console.error('Error:', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteRole(name) {
    try {
      loading.value = true;
      await roleService.deleteRole(name);
      showSuccess(`Role "${name}" has been successfully deleted`);
      await fetchRoles();
      return true;
    } catch (error) {
      showError(`Failed to delete role "${name}". Please try again.`);
      console.error('Error:', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRoleDetails(name) {
    try {
      loading.value = true;
      const response = await roleService.getRole(name);
      roleDetails.value = response;
      return response;
    } catch (error) {
      showError(`Failed to fetch details for role "${name}". Please try again.`);
      console.error('Error:', error);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function addACL(roleName, aclData) {
    try {
      loading.value = true;
      await roleService.addRoleACL(roleName, aclData);
      const aclType = aclData.aclType === 'publishClientSend' ? 'publish' : 'subscribe';
      showSuccess(`New ${aclType} permission has been added for topic "${aclData.topic}"`);
      await fetchRoleDetails(roleName);
      return true;
    } catch (error) {
      showError('Failed to add ACL. Please try again.');
      console.error('Error:', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function removeACL(roleName, aclType, topic) {
    try {
      loading.value = true;
      await roleService.removeRoleACL(roleName, aclType, topic);
      showSuccess(`Permission for topic "${topic}" has been removed`);
      await fetchRoleDetails(roleName);
      return true;
    } catch (error) {
      showError('Failed to remove ACL. Please try again.');
      console.error('Error:', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    roles,
    roleDetails,
    loading,
    fetchRoles,
    createRole,
    deleteRole,
    fetchRoleDetails,
    addACL,
    removeACL
  };
}