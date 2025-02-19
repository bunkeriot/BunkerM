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