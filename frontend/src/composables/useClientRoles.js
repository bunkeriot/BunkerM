/* # Copyright (c) 2025 BunkerIoT
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
// composables/useClientRoles.js
import { ref } from 'vue';
import { roleService } from '@/services/roleService';
import { clientService } from '@/services/clientService';
import { useSnackbar } from '@/composables/useSnackbar';

export function useClientRoles() {
  const availableRoles = ref([]);
  const loading = ref(false);
  const { showSuccess, showError } = useSnackbar();

  async function fetchAvailableRoles() {
    try {
      loading.value = true;
      availableRoles.value = await roleService.getRoles();
    } catch (error) {
      showError('Failed to fetch available roles. Please try again.');
      console.error('Error:', error);
    } finally {
      loading.value = false;
    }
  }


  async function addRoleToClient(username, roleName) {
    try {
      loading.value = true;
      await clientService.addRoleToClient(username, roleName);
      showSuccess(`Role "${roleName}" has been successfully assigned to client "${username}"`);
      return true;
    } catch (error) {
      showError(`Failed to assign role "${roleName}" to client "${username}". Please try again.`);
      console.error('Error:', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function removeRoleFromClient(username, roleName) {
    try {
      loading.value = true;
      await clientService.removeRoleFromClient(username, roleName);
      showSuccess(`Role "${roleName}" has been successfully removed from client "${username}"`);
      return true;
    } catch (error) {
      showError(`Failed to remove role "${roleName}" from client "${username}". Please try again.`);
      console.error('Error:', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    availableRoles,
    loading,
    fetchAvailableRoles,
    addRoleToClient,
    removeRoleFromClient
  };
}