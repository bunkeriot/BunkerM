import { ref } from 'vue';
import { mqttService } from '@/services/mqtt.service';
import { useSnackbar } from '@/composables/useSnackbar';

export function useRoles() {
  const roles = ref([]);
  const roleDetails = ref(null);
  const loading = ref(false);
  const { showSuccess, showError } = useSnackbar();

  async function fetchRoles() {
    try {
      loading.value = true;
      const response = await mqttService.getRoles();
      roles.value = response;
      return response;
    } catch (error) {
      showError('Failed to fetch roles');
      console.error('Error fetching roles:', error);
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function createRole(name) {
    if (!name) {
      showError('Role name is required');
      return false;
    }

    try {
      loading.value = true;
      await mqttService.createRole(name);
      showSuccess('Role created successfully');
      await fetchRoles();
      return true;
    } catch (error) {
      showError('Failed to create role');
      console.error('Error creating role:', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteRole(name) {
    try {
      loading.value = true;
      await mqttService.deleteRole(name);
      showSuccess('Role deleted successfully');
      await fetchRoles();
      return true;
    } catch (error) {
      showError('Failed to delete role');
      console.error('Error deleting role:', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function getRole(name) {
    try {
      loading.value = true;
      const response = await mqttService.getRole(name);
      roleDetails.value = response;
      return response;
    } catch (error) {
      showError('Failed to fetch role details');
      console.error('Error fetching role details:', error);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function addRoleACL(roleName, acl) {
    try {
      loading.value = true;
      await mqttService.addRoleACL(roleName, acl);
      showSuccess('ACL added successfully');
      return true;
    } catch (error) {
      showError('Failed to add ACL');
      console.error('Error:', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function removeRoleACL(roleName, aclType, topic) {
    try {
      loading.value = true;
      await mqttService.removeRoleACL(roleName, aclType, topic);
      showSuccess('ACL removed successfully');
      return true;
    } catch (error) {
      showError('Failed to remove ACL');
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
    getRole,
    addRoleACL,
    removeRoleACL
  };
}