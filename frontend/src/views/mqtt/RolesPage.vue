// RolesPage.vue
<template>
  <v-container>
    <v-card>
      <v-card-title class="d-flex align-center">
        Role Management
        <v-spacer></v-spacer>
        <v-btn color="info" @click="dialog = true">
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
                <SettingsBoltIcon stroke-width="1.5" size="22" />Manage role
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
                  <template v-slot:default>
                    <template v-if="acl.aclType === 'publishClientSend'">
                      <SendIcon stroke-width="1.5" size="22" />
                    </template>
                    <template v-else>
                      <ArrowsExchangeIcon stroke-width="1.5" size="22" />
                    </template>
                  </template>
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
          <v-form @submit.prevent="addACL" ref="form">
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

          <div class="px-4 py-3">
            <v-text-field v-model="search" label="Search" single-line hide-details>
              <template v-slot:prepend-inner>
                <SearchIcon stroke-width="1.5" size="22" />
              </template>
            </v-text-field>
          </div>

          <v-data-table v-if="roleDetails?.acls?.length" :items="roleDetails.acls" :loading="loading" :search="search"
            :items-per-page="itemsPerPage" :page.sync="currentPage" item-value="topic" hide-default-header
            class="elevation-1 bg-grey-lighten-5">
            <!-- Optional: Define the structure without headers -->
            <template v-slot:head>
              <!-- Empty to hide the headers -->
            </template>
            <template v-slot:item="{ item }">
              <tr>
                <td>
                  <v-icon :color="item.permission === 'allow' ? 'success' : 'error'">
                    <template v-slot:default>
                      <template v-if="item.aclType === 'publishClientSend'">
                        <SendIcon stroke-width="1.5" size="22" />
                      </template>
                      <template v-else>
                        <ArrowsExchangeIcon stroke-width="1.5" size="22" />
                      </template>
                    </template>
                  </v-icon>
                </td>
                <td class="font-weight-medium">{{ item.topic }}</td>
                <td>
                  {{ item.aclType === 'publishClientSend' ? 'Publish' : 'Subscribe' }} -
                  <v-chip :color="item.permission === 'allow' ? 'success' : 'error'" size="small" label>
                    {{ item.permission }}
                  </v-chip>
                </td>
                <td>
                  <v-btn size="small" color="error" variant="plain" :disabled="loading" @click="removeACL(item)">
                    <TrashIcon stroke-width="1.5" size="22" />
                  </v-btn>
                </td>
              </tr>
            </template>
          </v-data-table>

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

    <!-- Keep other dialog components the same -->
    <!-- Your existing dialogs for delete confirmation and details -->
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { mqttService } from '@/services/mqtt.service';
import { useSnackbar } from '@/composables/useSnackbar';
import { inject } from 'vue'

const search = ref('');
const aclDialog = ref(false);
const roleDetails = ref(null);
const newACL = ref({
  topic: '',
  aclType: '',
  permission: ''
});

const aclTypes = [
  { text: 'Publish', value: 'publishClientSend' },
  { text: 'Subscribe', value: 'subscribeLiteral' }
];

const permissions = [
  { text: 'Allow', value: 'allow' },
  { text: 'Deny', value: 'deny' }
];

const isValidACL = computed(() => {
  return newACL.value.topic &&
    newACL.value.aclType &&
    newACL.value.permission;
});

const filteredRoles = computed(() => {
  return roles.value.filter(role => role.name !== 'admin');
});

const showNotification = inject('showNotification')

const { showSuccess, showError } = useSnackbar();

const dialog = ref(false);
const detailsDialog = ref(false);
const confirmDialog = ref(false);
const loading = ref(false);
const roles = ref([]);
const selectedRole = ref(null);
const form = ref(null);

const headers = [
  { title: 'Name', key: 'name', class: 'white--text' },
  { title: '', key: 'actions', sortable: false, class: 'white--text' }
];

const newRole = ref({
  name: ''
});

// Fetch roles on component mount
onMounted(async () => {
  await fetchRoles();
});


function closeDialog() {
  dialog.value = false;
  confirmDialog.value=false;
  fetchRoles();
}

async function fetchRoles() {
  try {
    loading.value = true;
    const response = await mqttService.getRoles();
    roles.value = response;
  } catch (error) {
    showError('Failed to fetch roles');
    console.error('Error fetching roles:', error);
  } finally {
    loading.value = false;
  }
}

async function handleCreateRole() {
  if (!newRole.value.name) {
    showNotification('Role name is required', 'error');
    return;
  }

  try {
    loading.value = true;
    await mqttService.createRole(newRole.value.name);
    await fetchRoles();
    showNotification(`Role '${newRole.value.name}' created successfully`, 'success');
    
  } catch (error) {
    showNotification('Failed to create role', 'error');
    console.error('Error creating role:', error);
  } finally {
    loading.value = false;
    closeDialog();
  }
}




function confirmDeleteRole(role) {
  selectedRole.value = role;
  confirmDialog.value = true;
}

async function handleDeleteRole() {
  if (!selectedRole.value) return;

  try {
    loading.value = true;
    await mqttService.deleteRole(selectedRole.value.name);
    await fetchRoles();
    showNotification(`Role '${selectedRole.value.name}' deleted successfully`, 'success');
    confirmDialog.value = false;
  } catch (error) {
    showNotification('Failed to delete role', 'error');
    console.error('Error deleting role:', error);
  } finally {
    loading.value = false;
    closeDialog();
  }
}

async function viewRoleDetails(role) {
  try {
    loading.value = true;
    const response = await mqttService.getRole(role.name);
    roleDetails.value = response;
    selectedRole.value = role;
    detailsDialog.value = true;
  } catch (error) {
    showNotification('Failed to fetch role details', 'error');
    console.error('Error fetching role details:', error);
  } finally {
    loading.value = false;
  }
}




async function fetchRoleDetails(roleName) {
  try {
    loading.value = true;
    const response = await mqttService.getRole(roleName);
    roleDetails.value = response;
  } catch (error) {
    showError('Failed to fetch role details');
    console.error('Error:', error);
  } finally {
    loading.value = false;
  }
}
/* async function addACL() {
  if (!isValidACL.value) return;
  const success = await mqttService.addRoleACL(selectedRole.value.name, newACL.value);
  if (success) {
    fetchRoleDetails(selectedRole.value.name);
    //closeDialog();    
  }

} */


async function addACL() {
  if (!isValidACL.value) return;

  try {
    loading.value = true;
    await mqttService.addRoleACL(selectedRole.value.name, newACL.value);
    await fetchRoleDetails(selectedRole.value.name);
    newACL.value = {
      topic: '',
      aclType: '',
      permission: ''
    };
  } catch (error) {
    showNotification('Failed to add ACL', 'error');
    console.error('Error:', error);
  } finally {
    loading.value = false;
  }
}



async function removeACL(acl) {
  try {
    loading.value = true;
    await mqttService.removeRoleACL(
      selectedRole.value.name,
      acl.aclType,
      acl.topic
    );
    showNotification(`ACL for topic '${acl.topic}' removed successfully`, 'success');
    await fetchRoleDetails(selectedRole.value.name);
  } catch (error) {
    showNotification('Failed to remove ACL', 'error');
    console.error('Error:', error);
  } finally {
    loading.value = false;
  }
}

async function openACLManagement(role) {
  selectedRole.value = role;
  try {
    const success = await mqttService.getRole(role.name);
    roleDetails.value = success;
    aclDialog.value = true;
  } catch (error) {
    showError('Failed to fetch role details');
    console.error('Error:', error);
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