import { ref } from 'vue';
import { groupService } from '@/services/groupService';
import { useSnackbar } from '@/composables/useSnackbar';

export function useClientGroups() {
  const availableGroups = ref([]);
  const loading = ref(false);
  const { showSnackbar } = useSnackbar();

  async function fetchAvailableGroups() {
    try {
      loading.value = true;
      availableGroups.value = await groupService.getGroups();
    } catch (error) {
      showSnackbar({
        text: 'Failed to fetch available groups. Please try again.',
        color: 'error'
      });
      console.error('Error:', error);
    } finally {
      loading.value = false;
    }
  }

  async function assignClientToGroup(groupName, username, priority = null) {
    console.log('assignClientToGroup called with:', { groupName, username, priority });
    
    try {
      loading.value = true;
      
      if (!groupName || !username) {
        throw new Error('Group name and username are required');
      }

      const result = await groupService.addClientToGroup(groupName, username, priority);
      console.log('Group assignment result:', result);
      
      snackbar.showSuccess(`Client "${username}" has been successfully assigned to group "${groupName}"`);
      return true;
    } catch (error) {
      console.error('Error in assignClientToGroup:', error);
      snackbar.showError(`Failed to assign client "${username}" to group "${groupName}": ${error.response?.data?.detail || error.message}`);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function removeClientFromGroup(groupName, username) {
    try {
      loading.value = true;
      await groupService.removeClientFromGroup(groupName, username);
      showSnackbar({
        text: `Client "${username}" has been successfully removed from group "${groupName}"`,
        color: 'success'
      });
      return true;
    } catch (error) {
      showSnackbar({
        text: `Failed to remove client "${username}" from group "${groupName}": ${error.message}`,
        color: 'error'
      });
      console.error('Error:', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    availableGroups,
    loading,
    fetchAvailableGroups,
    assignClientToGroup,
    removeClientFromGroup
  };
}