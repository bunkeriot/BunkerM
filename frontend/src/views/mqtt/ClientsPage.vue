<!-- Copyright (c) 2025 BunkerM

Licensed under the Apache License, Version 2.0 (the "License");  
you may not use this file except in compliance with the License.  
You may obtain a copy of the License at:

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software  
distributed under the License is distributed on an "AS IS" BASIS,  
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  
See the License for the specific language governing permissions and  
limitations under the License. -->

<template>
  <v-container>
    <v-card>
      <v-card-title class="d-flex align-center">
        Client Management
        <v-spacer></v-spacer>
        <v-btn color="info" dark @click="dialog = true">
          <PlusIcon stroke-width="1.5" size="22" /> Add client
        </v-btn>
      </v-card-title>

      <v-card-text>
        <div class="px-4 py-3">
          <v-text-field v-model="search" label="Search" single-line hide-details>
            <template v-slot:prepend-inner>
              <SearchIcon stroke-width="1.5" size="22" />
            </template>
          </v-text-field>
        </div>
        <v-data-table :headers="headers" :items="filteredClients" :loading="loading" :search="search"
          class="elevation-1">
          <template v-slot:item.actions="{ item }">
            <div class="d-flex align-center justify-center">
              <v-btn color="info" class="ml-2" @click="openRoleManagement(item)">
                <ShieldCheckFilledIcon stroke-width="1.5" size="22" /> Assign role
              </v-btn>

              <v-btn color="primary" class="ml-2" @click="openGroupAssignment(item)">
                <Stack3Icon stroke-width="1.5" size="22" />Assign group
              </v-btn>

              <v-btn color="error" class="ml-2" @click="confirmDelete(item)">
                <TrashIcon stroke-width="1.5" size="22" /> Remove client
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Add Client Dialog -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-form @submit.prevent="save">
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field v-model="editedItem.username" label="Username" required
                    :rules="[rules.required]" :error-messages="usernameError"
                    @input="clearUsernameError" />
                </v-col>
                <v-col cols="12">
                  <v-text-field v-model="editedItem.password" label="Password" type="password" required
                    :rules="[rules.required]" :error-messages="passwordError" @input="clearPasswordError" />
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn color="blue-darken-1" variant="text" @click="closeDialog">
              Cancel
            </v-btn>
            <v-btn color="blue-darken-1" variant="text" type="submit">
              Save
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- Confirm Delete Dialog -->
    <v-dialog v-model="confirmDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete client "{{ selectedClient?.username }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="confirmDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="handleDeleteClient" :loading="loading">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Role Management Dialog -->
    <v-dialog v-model="roleDialog" max-width="500px">
      <v-card>
        <v-card-title>Manage Roles for {{ selectedClient?.username }}</v-card-title>
        <v-card-text>
          <v-select v-model="selectedRole" :items="availableRoles" item-title="name" item-value="name"
            label="Select Role"></v-select>

          <!-- Current Roles List -->
          <v-list v-if="selectedClient?.roles?.length" class="mt-4 bg-grey-lighten-4">
            <v-list-subheader>Current Roles</v-list-subheader>
            <v-list-item v-for="role in selectedClient.roles" :key="role.name" :subtitle="`Priority: ${role.priority}`">
              <template v-slot:prepend>
                <SafetyCertificateOutlined stroke-width="1.5" size="22" />
              </template>

              <v-list-item-title>{{ role.name }}</v-list-item-title>

              <template v-slot:append>
                <v-btn icon small color="error" variant="text"
                  @click="removeRoleFromClient(selectedClient.username, role.name)">
                  <TrashIcon stroke-width="1.5" size="22" />
                </v-btn>
              </template>
            </v-list-item>
          </v-list>

          <v-alert v-else type="info" variant="tonal" class="mt-4">
            No roles assigned to this client
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="closeDialog">Close</v-btn>
          <v-btn color="primary" @click="addRoleToClient" :disabled="!selectedRole" :loading="loading">
            Add Role
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Group Assignment Dialog -->
    <!-- Group Assignment Dialog -->
    <v-dialog v-model="groupDialog" max-width="500px">
      <v-card>
        <v-card-title>Assign {{ selectedClient?.username }} to Groups</v-card-title>
        <v-card-text>
          <v-select v-model="selectedGroup" :items="availableGroups" item-title="name" item-value="name"
            label="Select Group"></v-select>

          <v-text-field v-model="groupPriority" label="Priority (Optional)" type="number" min="1"></v-text-field>

          <!-- Current Groups List -->
          <v-list v-if="selectedClient?.groups?.length" class="mt-4 bg-grey-lighten-4">
            <v-list-subheader>Current Groups</v-list-subheader>
            <v-list-item v-for="group in selectedClient.groups" :key="group.name"
              :subtitle="`Priority: ${group.priority}`">
              <template v-slot:prepend>
                <GroupOutlined stroke-width="1.5" size="22" />
              </template>

              <v-list-item-title>{{ group.name }}</v-list-item-title>

              <template v-slot:append>
                <v-btn icon small color="error" variant="text"
                  @click="removeClientFromGroup(group.name, selectedClient.username)">
                  <TrashIcon stroke-width="1.5" size="22" />
                </v-btn>
              </template>
            </v-list-item>
          </v-list>

          <v-alert v-else type="info" variant="tonal" class="mt-4">
            No groups assigned to this client
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="closeDialog">Close</v-btn>
          <v-btn color="primary" @click="assignClientToGroup" :disabled="!selectedGroup" :loading="loading">
            Assign
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
//ClientsPage.vue script section
import { ref, computed, onMounted, inject } from 'vue';
import { mqttService } from '@/services/mqtt.service';
import { useSnackbar } from '@/composables/useSnackbar';
import axios from 'axios';

const search = ref('');
const roleDialog = ref(false);
const selectedClient = ref(null);
const selectedRole = ref(null);
const availableRoles = ref([]);

const groupDialog = ref(false);
const selectedGroup = ref(null);
const groupPriority = ref(null);
const availableGroups = ref([]);

const confirmDialog = ref(false);
const showNotification = inject('showNotification');
const { showSuccess, showError } = useSnackbar();

const dialog = ref(false);
const loading = ref(false);
const clients = ref([]);
const editedIndex = ref(-1);
const editedItem = ref({
  username: '',
  password: '',
});

// Refs for error handling
const usernameError = ref('');
const passwordError = ref('');

// Validation rules
const rules = {
  required: value => !!value || 'This field is required'
  //alphanumeric: value => /^[a-zA-Z0-9]+$/.test(value) || 'Only letters and numbers are allowed'
};

// Clear error functions
const clearUsernameError = () => {
  usernameError.value = '';
};

const clearPasswordError = () => {
  passwordError.value = '';
};

const headers = [
  { title: 'Username', key: 'username', sortable: true },
  { title: '', key: 'actions', sortable: false },
];

// Computed
const formTitle = computed(() => editedIndex.value === -1 ? 'New Client' : 'Edit Client');

const filteredClients = computed(() => {
  return clients.value.filter(client => client.username !== 'bunker');
});

onMounted(async () => {
  await fetchClients();
});

// Client Management
async function fetchClients() {
  try {
    loading.value = true;
    const response = await mqttService.getClients();
    clients.value = response;
  } catch (error) {
    /* console.error('Error fetching clients:', error); */
    showNotification('Failed to fetch clients', 'error');
  } finally {
    loading.value = false;
  }
}

function closeDialog() {
  dialog.value = false;
  groupDialog.value = false;
  roleDialog.value = false;
  confirmDialog.value = false;
  // Clear form errors when closing
  usernameError.value = '';
  passwordError.value = '';
  // Reset form
  editedItem.value = {
    username: '',
    password: ''
  };
  fetchClients();
}

async function save() {
  // Reset error messages
  usernameError.value = '';
  passwordError.value = '';
  
  // Validate username and password
  if (!editedItem.value.username) {
    usernameError.value = 'Please enter a username';
    return;
  }
  
  if (!editedItem.value.password) {
    passwordError.value = 'Please enter a password';
    return;
  }
  
  // Validate username format
/*   if (!rules.alphanumeric(editedItem.value.username)) {
    usernameError.value = 'Username can only contain letters and numbers';
    return;
  } */
  
  try {
    loading.value = true;
    await mqttService.createClient({
      username: editedItem.value.username,
      password: editedItem.value.password
    });
    showSuccess('Client created successfully');
  } catch (error) {
    showError('Failed to Add New Client');
   /*  console.error('Error:', error); */
  } finally {
    loading.value = false;
    closeDialog();
  }
}

function confirmDelete(client) {
  selectedClient.value = client;
  confirmDialog.value = true;
}

async function handleDeleteClient() {
  if (!selectedClient.value) return;
  try {
    loading.value = true;
    await mqttService.deleteClient(selectedClient.value.username);
  } catch (error) {
    showError('Failed to Delete Client');
    /* console.error('Error:', error); */
  } finally {
    loading.value = false;
    closeDialog();
  }
}

//role management
async function fetchRoles() {
  try {
    const roles = await mqttService.getRoles();
    availableRoles.value = roles;
  } catch (error) {
    showError('Failed to fetch roles');
   /*  console.error('Error:', error); */
  }
}

async function openRoleManagement(client) {
  try {
    loading.value = true;
    const response = await mqttService.getClient(client.username);
    if (response) {
      selectedClient.value = response.client;
      await fetchRoles();
      roleDialog.value = true;
    }
  } catch (error) {
    showNotification('Failed to fetch client details', 'error');
    /* console.error('Error:', error); */
  } finally {
    loading.value = false;
  }
}

async function addRoleToClient() {
  if (!selectedClient.value || !selectedRole.value) return;
  try {
    loading.value = true;
    await mqttService.addRoleToClient(selectedClient.value.username, selectedRole.value);
  } catch (error) {
    /* console.error('Error fetching clients:', error); */
    showNotification('Failed to Assign Role to Client', 'error');
  } finally {
    loading.value = false;
    closeDialog();
  }
}

async function removeRoleFromClient(username, roleName) {
  try {
    loading.value = true;
    await mqttService.removeRoleFromClient(username, roleName);
  } catch (error) {
    /* console.error('Error fetching clients:', error); */
    showNotification('Failed to Remove Role from Client', 'error');
  } finally {
    loading.value = false;
    closeDialog();
  }
}

// group management
async function fetchGroups() {
  try {
    loading.value = true;
    const groups = await mqttService.getGroups();
    availableGroups.value = groups;
  } catch (error) {
    showError('Failed to fetch groups');
    /* console.error('Error:', error); */
  } finally {
    loading.value = false;
  }
}

async function openGroupAssignment(client) {
  const success = await mqttService.getClient(client.username);
  if (success) {
    selectedClient.value = success.client;
    await fetchGroups();
    groupDialog.value = true;
  }
}

async function assignClientToGroup() {
  if (!selectedClient.value || !selectedGroup.value) return;
  try {
    loading.value = true;
    await mqttService.addClientToGroup(
      selectedGroup.value,
      selectedClient.value.username,
      groupPriority.value ? parseInt(groupPriority.value) : null
    );
  } catch (error) {
    showError('Failed to Assign Client to Group');
    /* console.error('Error:', error); */
  } finally {
    loading.value = false;
    closeDialog();
  }
}

async function removeClientFromGroup(groupName, username) {
  try {
    loading.value = true;
    await mqttService.removeClientFromGroup(groupName, username);
  } catch (error) {
    showError('Failed to Remove Client from Group');
    /* console.error('Error:', error); */
  } finally {
    loading.value = false;
    closeDialog();
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_EVENT_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': import.meta.env.VITE_API_KEY
  }
});

const enableClient = async (username) => {
  try {
    const encodedUsername = encodeURIComponent(username);
    await api.post(`/enable/${encodedUsername}`);
    await fetchEvents();
    showNotification(`Client "${username}" has been successfully enabled`);
  } catch (error) {
    console.error('Error enabling client:', error);
    showNotification('Failed to enable client. Please try again.', 'error');
  }
};

const fetchEvents = async () => {
  loading.value = true;
  try {
    const response = await api.get('/events');
    events.value = response.data.events;
  } catch (error) {
    console.error('Error fetching MQTT events:', error);
    showNotification('Failed to fetch events. Please try again.', 'error');
  } finally {
    loading.value = false;
  }
};

</script>