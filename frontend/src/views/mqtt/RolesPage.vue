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
        Role Management
        <v-spacer></v-spacer>
        <v-btn color="info" @click="openAddRoleDialog">
          <PlusIcon stroke-width="1.5" size="22" /> Add role
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
        <v-data-table :headers="headers" :items="filteredRoles" :loading="loading" :search="search" class="elevation-1">
          <template v-slot:item.actions="{ item }">
            <div class="d-flex align-center justify-center">
              <v-btn color="info" class="ml-2" @click="viewRoleDetails(item)">
                <EyeIcon stroke-width="1.5" size="22" /> View permissions
              </v-btn>

              <v-btn color="primary" class="ml-2" @click="openACLManagement(item)">
                <CogIcon stroke-width="1.5" size="22" /> Manage role
              </v-btn>

              <v-btn color="error" class="ml-2" @click="confirmDeleteRole(item)">
                <TrashIcon stroke-width="1.5" size="22" /> Remove role
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Confirm Delete Dialog -->
    <v-dialog v-model="confirmDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this role?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="confirmDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="handleDeleteRole" :loading="loading">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Role Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5">
          ACLs for {{ selectedRole?.name }}
        </v-card-title>
        <v-card-text>
          <v-list v-if="roleDetails?.acls?.length" class="bg-grey-lighten-4">
            <v-list-item v-for="(acl, index) in roleDetails.acls" :key="index"
              :class="index !== roleDetails.acls.length - 1 ? 'mb-2' : ''">
              <template v-slot:prepend>
                <v-icon :color="acl.permission === 'allow' ? 'success' : 'error'">
                  {{ acl.aclType === 'publishClientSend' ? 'mdi-send' : 'mdi-swap-horizontal' }}
                </v-icon>
              </template>

              <v-list-item-title class="font-weight-medium">
                Topic: {{ acl.topic }}
              </v-list-item-title>

              <v-list-item-subtitle>
                {{ acl.aclType === 'publishClientSend' ? 'Publish' : 'Subscribe' }} -
                <v-chip :color="acl.permission === 'allow' ? 'success' : 'error'" size="small" label>
                  {{ acl.permission }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-alert v-else type="info" variant="tonal" class="mt-4">
            No ACLs configured for this role
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="detailsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Role Dialog -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>Add New Role</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleCreateRole" ref="form">
            <v-text-field v-model="newRole.name" label="Role Name" :rules="[v => !!v || 'Role name is required']"
              required></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" @click="handleCreateRole" :loading="loading">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ACL Management Dialog -->
    <v-dialog v-model="aclDialog" max-width="600px">
      <v-card>
        <v-card-title>
          Manage ACLs for {{ selectedRole?.name }}
        </v-card-title>

        <v-card-text>
          <!-- Add ACL Form -->
          <v-form @submit.prevent="addACL">
            <v-text-field v-model="newACL.topic" label="MQTT Topic" required :disabled="loading"></v-text-field>

            <v-select v-model="newACL.aclType" :items="aclTypes" item-title="text" item-value="value"
              label="Access Type" required :disabled="loading"></v-select>

            <v-select v-model="newACL.permission" :items="permissions" item-title="text" item-value="value"
              label="Permission" required :disabled="loading"></v-select>
          </v-form>

          <!-- Current ACLs section -->
          <v-divider class="my-4"></v-divider>
          <div class="d-flex align-center mb-2">
            <h3 class="text-h6">Current ACLs</h3>
            <v-progress-circular v-if="loading" indeterminate size="20" width="2" color="primary"
              class="ml-2"></v-progress-circular>
          </div>

          <v-list v-if="roleDetails?.acls?.length" class="bg-grey-lighten-4">
            <v-list-item v-for="(acl, index) in roleDetails.acls" :key="index" class="mb-2">
              <template v-slot:prepend>
                <v-icon :color="acl.permission === 'allow' ? 'success' : 'error'">
                  {{ acl.aclType === 'publishClientSend' ? 'mdi-send' : 'mdi-swap-horizontal' }}
                </v-icon>
              </template>

              <v-list-item-title class="font-weight-medium">
                Topic: {{ acl.topic }}
              </v-list-item-title>

              <v-list-item-subtitle>
                {{ acl.aclType === 'publishClientSend' ? 'Publish' : 'Subscribe' }} -
                <v-chip :color="acl.permission === 'allow' ? 'success' : 'error'" size="small" label>
                  {{ acl.permission }}
                </v-chip>
              </v-list-item-subtitle>

              <template v-slot:append>
                <v-btn icon color="error" variant="plain" :disabled="loading" @click="removeACL(acl)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>

          <v-alert v-else type="info" variant="tonal" class="mt-2">
            No ACLs configured for this role
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="aclDialog = false" :disabled="loading">
            Close
          </v-btn>
          <v-btn color="primary" @click="addACL" :loading="loading" :disabled="!isValidACL || loading">
            Add ACL
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { mqttService } from '@/services/mqtt.service';
import { useSnackbar } from '@/composables/useSnackbar';
import { useRoles } from '@/composables/useRoles';


// Initialize the useRoles composable
const { 
  roles,
  roleDetails, 
  loading, 
  fetchRoles, 
  createRole, 
  deleteRole, 
  getRole, 
  addRoleACL, 
  removeRoleACL 
} = useRoles();

const { showSuccess, showError } = useSnackbar();

const search = ref('');
const aclDialog = ref(false);
const dialog = ref(false);
const detailsDialog = ref(false);
const confirmDialog = ref(false);
const selectedRole = ref(null);
const form = ref(null);

const newACL = ref({
  topic: '',
  aclType: '',
  permission: ''
});

const newRole = ref({
  name: ''
});

const aclTypes = [
  { text: 'Publish', value: 'publishClientSend' },
  { text: 'Subscribe', value: 'subscribeLiteral' }
];

const permissions = [
  { text: 'Allow', value: 'allow' },
  { text: 'Deny', value: 'deny' }
];

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: '', key: 'actions', sortable: false }
];

const isValidACL = computed(() => {
  return newACL.value.topic &&
    newACL.value.aclType &&
    newACL.value.permission;
});

const filteredRoles = computed(() => {
  return roles.value.filter(role => role.name !== 'admin');
});

// Fetch roles on component mount
onMounted(async () => {
  await fetchRoles();
});

function openAddRoleDialog() {
  newRole.value = { name: '' };
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
  confirmDialog.value = false;
  detailsDialog.value = false;
  aclDialog.value = false;
  
  // Reset forms
  newRole.value = { name: '' };
  newACL.value = {
    topic: '',
    aclType: '',
    permission: ''
  };
}

async function handleCreateRole() {
  if (!newRole.value.name) return;

  const success = await createRole(newRole.value.name);
  if (success) {
    closeDialog();
  }
}

function confirmDeleteRole(role) {
  selectedRole.value = role;
  confirmDialog.value = true;
}

async function handleDeleteRole() {
  if (!selectedRole.value) return;

  const success = await deleteRole(selectedRole.value.name);
  if (success) {
    confirmDialog.value = false;
  }
}

async function viewRoleDetails(role) {
  selectedRole.value = role;
  const response = await getRole(role.name);
  if (response) {
    detailsDialog.value = true;
  }
}

async function openACLManagement(role) {
  selectedRole.value = role;
  const response = await getRole(role.name);
  if (response) {
    aclDialog.value = true;
  }
}

async function addACL() {
  if (!isValidACL.value) return;

  const success = await addRoleACL(selectedRole.value.name, newACL.value);
  if (success) {
    await getRole(selectedRole.value.name);
    newACL.value = {
      topic: '',
      aclType: '',
      permission: ''
    };
  }
}

async function removeACL(acl) {
  const success = await removeRoleACL(
    selectedRole.value.name,
    acl.aclType,
    acl.topic
  );
  
  if (success) {
    await getRole(selectedRole.value.name);
  }
}
</script>

<style scoped>
.v-list-item {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  margin-bottom: 8px;
}
</style>