// composables/useGroups.js
import { ref } from 'vue';
import { groupService } from '@/services/groupService';
import { useSnackbar } from '@/composables/useSnackbar';

export function useGroups() {
  const groups = ref([]);
  const loading = ref(false);
  const groupDetails = ref(null);
  const { showSuccess, showError } = useSnackbar();

  async function fetchGroups() {
    try {
      loading.value = true;
      const response = await groupService.getGroups();
      groups.value = response;
    } catch (error) {
      showError('Failed to fetch groups list. Please try again.');
      console.error('Error fetching groups:', error);
    } finally {
      loading.value = false;
    }
  }

  async function createGroup(name) {
    try {
      loading.value = true;
      await groupService.createGroup(name);
      showSuccess(`Group "${name}" has been successfully created`);
      await fetchGroups();
      return true;
    } catch (error) {
      showError(`Failed to create group "${name}". Please try again.`);
      console.error('Error:', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteGroup(name) {
    try {
      loading.value = true;
      await groupService.deleteGroup(name);
      showSuccess(`Group "${name}" has been successfully deleted`);
      await fetchGroups();
      return true;
    } catch (error) {
      showError(`Failed to delete group "${name}". Please try again.`);
      console.error('Error:', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function fetchGroupDetails(name) {
    try {
      loading.value = true;
      const response = await groupService.getGroup(name);
      groupDetails.value = response.group;
      return response.group;
    } catch (error) {
      showError(`Failed to fetch details for group "${name}". Please try again.`);
      console.error('Error:', error);
      return null;
    } finally {
      loading.value = false;
    }
  }

  return {
    groups,
    groupDetails,
    loading,
    fetchGroups,
    createGroup,
    deleteGroup,
    fetchGroupDetails
  };
}