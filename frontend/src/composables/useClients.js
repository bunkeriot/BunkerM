/* # Copyright (c) 2025 BunkerIoT
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
// composables/useClients.js
import { ref } from 'vue';
import { clientService } from '@/services/clientService';
import { useSnackbar } from '@/composables/useSnackbar';

export function useClients() {
  const clients = ref([]);
  const loading = ref(false);
  const { showSuccess, showError } = useSnackbar();

  const checkClientStatus = (clientDetails) => {
    // Handle different possible response formats
    if (typeof clientDetails.client === 'string') {
      return !clientDetails.client.includes('disabled');
    }
    if (clientDetails.client && typeof clientDetails.client.disabled === 'boolean') {
      return !clientDetails.client.disabled;
    }
    // Default to enabled if status can't be determined
    return true;
  };

  async function fetchClients() {
    try {
      loading.value = true;
      const response = await clientService.getClients();
      const clientsWithStatus = await Promise.all(
        response.map(async (client) => {
          try {
            const clientDetails = await clientService.getClient(client.username);
            return {
              username: client.username,
              enabled: checkClientStatus(clientDetails),
              loading: false
            };
          } catch (error) {
            console.error(`Error fetching status for client ${client.username}:`, error);
            return {
              username: client.username,
              enabled: false,
              loading: false
            };
          }
        })
      );
      clients.value = clientsWithStatus;
    } catch (error) {
      showError('Failed to fetch clients list. Please try again.');
      console.error('Error fetching clients:', error);
    } finally {
      loading.value = false;
    }
  }


  async function getClientDetails(username) {
    try {
      loading.value = true;
      const clientDetails = await clientService.getClient(username);
      return clientDetails;
    } catch (error) {
      showSnackbar({
        text: 'Failed to fetch client details: ' + (error.message || 'Unknown error'),
        color: 'error'
      });
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createClient({ username, password }) {
    try {
      loading.value = true;
      await clientService.createClient({ username, password });
      showSuccess(`Client "${username}" has been successfully created`);
      await fetchClients();
      return true;
    } catch (error) {
      showError(`Failed to create client "${username}". Please try again.`);
      console.error('Error creating client:', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteClient(username) {
    try {
      loading.value = true;
      await clientService.deleteClient(username);
      showSuccess(`Client "${username}" has been successfully deleted`);
      await fetchClients();
      return true;
    } catch (error) {
      showError(`Failed to delete client "${username}". Please try again.`);
      console.error('Error deleting client:', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  const resetClientsForm = () => {
    editedItem.value = {
      username: '',
      password: ''
    };
    editedIndex.value = -1;
    dialog.value = false;
  };

  return {
    clients,
    loading,
    fetchClients,
    getClientDetails,
    createClient,
    deleteClient,
    resetClientsForm
  };
}