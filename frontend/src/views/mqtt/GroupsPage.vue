<template>
  <v-container>
    <v-card>
      <v-card-title class="d-flex align-center">
        Group Management
        <v-spacer></v-spacer>
        <v-btn color="info" @click="dialog = true">
          <PlusIcon stroke-width="1.5" size="22" /> Add group
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
        <v-data-table :headers="headers" :items="groups" :loading="loading" :search="search" class="elevation-1">
          <template v-slot:item.actions="{ item }">
            <div class="d-flex align-center justify-center">
              <v-btn color="info" class="ml-2" @click="viewGroupDetails(item)">
                <EyeIcon stroke-width="1.5" size="22" /> View assignments
              </v-btn>

              <v-btn color="primary" class="ml-2" @click="openRoleManagement(item)">
                <ShieldCheckFilledIcon stroke-width="1.5" size="22" /> Assign Role to Group
              </v-btn>
              <v-btn color="error" class="ml-2" @click="confirmDeleteGroup(item)">
                <TrashIcon stroke-width="1.5" size="22" /> Remove group
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Add Group Dialog -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>Add New Group</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleCreateGroup" ref="form">
            <v-text-field v-model="newGroup.name" label="Group Name" :rules="[v => !!v || 'Group name is required']"
              required></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" @click="handleCreateGroup" :loading="loading">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm Delete Dialog -->
    <v-dialog v-model="confirmDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this group?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="confirmDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="handleDeleteGroup" :loading="loading">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Group Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5">
          Group Details: {{ selectedGroup?.name }}
        </v-card-title>
        <v-card-text>
          <!-- Roles Section -->
          <div class="mb-4">
            <h3 class="text-h6 mb-2">Assigned Roles</h3>
            <v-list v-if="groupDetails?.roles?.length" class="bg-grey-lighten-4">
              <v-list-item v-for="role in groupDetails.roles" :key="role.name" :subtitle="`Priority: ${role.priority}`">
                <template v-slot:prepend>
                  <ShieldCheckFilledIcon stroke-width="1.5" size="22" />
                </template>

                <v-list-item-title>{{ role.name }}</v-list-item-title>
              </v-list-item>
            </v-list>
            <v-alert v-else type="info" variant="tonal">
              No roles assigned to this group
            </v-alert>
          </div>

          <!-- Clients Section -->
          <div class="mt-4">
            <h3 class="text-h6 mb-2">Group Members</h3>
            <v-list v-if="groupDetails?.clients?.length" class="bg-grey-lighten-4">
              <v-list-item v-for="client in groupDetails.clients" :key="client">
                <template v-slot:prepend>
                  <AssemblyIcon stroke-width="1.5" size="22" />
                </template>

                <v-list-item-title>{{ client }}</v-list-item-title>
              </v-list-item>
            </v-list>
            <v-alert v-else type="info" variant="tonal">
              No clients in this group
            </v-alert>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="detailsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="roleDialog" max-width="500px">
      <v-card>
        <v-card-title>Manage Roles for {{ selectedGroup?.name }}</v-card-title>
        <v-card-text>
          <v-select v-model="selectedRole" :items="availableRoles" item-title="name" item-value="name"
            label="Select Role"></v-select>
          <v-list v-if="selectedGroup?.roles?.length">
            <v-list-subheader>Current Roles</v-list-subheader>
            <v-list-item v-for="role in selectedGroup.roles" :key="role">
              <v-list-item-title>{{ role }}</v-list-item-title>
              <template v-slot:append>
                <v-btn icon small color="error" @click="removeRoleFromGroup(selectedGroup.name, role)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="roleDialog = false">Close</v-btn>
          <v-btn color="primary" @click="addRoleToGroup" :disabled="!selectedRole" :loading="loading">
            Add Role
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>


<script setup>
import { ref, onMounted, computed } from 'vue';
import { mqttService } from '@/services/mqtt.service';
import { useGroups } from '@/composables/useGroups';
import { useRoles } from '@/composables/useRoles';
import { useSnackbar } from '@/composables/useSnackbar';
import { EyeIcon, PlusIcon, TrashIcon } from 'vue-tabler-icons';
const { showSuccess, showError } = useSnackbar();

const search = ref('');
const selectedRole = ref(null);
const roleDialog = ref(false);
const loading = ref(false);
// Initialize composables
const {
  groups,
  groupDetails,
  fetchGroups,
  createGroup,
  deleteGroup,
} = useGroups();

const {
  roles: availableRoles,
  fetchRoles
} = useRoles();

// UI state
const dialog = ref(false);
const detailsDialog = ref(false);
const confirmDialog = ref(false);
const selectedGroup = ref(null);
const form = ref(null);

const newGroup = ref({
  name: ''
});

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: '', key: 'actions', sortable: false }
];

// Lifecycle
onMounted(async () => {
  await fetchGroups();
});

// Methods
function closeDialog() {
  dialog.value = false;
  roleDialog.value = false;
  newGroup.value = { name: '' };
}

async function handleCreateGroup() {
  if (!newGroup.value.name) return;

  const success = await createGroup(newGroup.value.name);
  if (success) {
    closeDialog();
  }
}

function confirmDeleteGroup(group) {
  selectedGroup.value = group;
  confirmDialog.value = true;
}

async function handleDeleteGroup() {
  if (!selectedGroup.value) return;

  const success = await deleteGroup(selectedGroup.value.name);
  if (success) {
    confirmDialog.value = false;
  }
}

async function viewGroupDetails(group) {
  try {
    loading.value = true;
    const response = await mqttService.getGroup(group.name);
    groupDetails.value = response.group;
    selectedGroup.value = group;
    detailsDialog.value = true;
  } catch (error) {
    showError('Failed to fetch group details', 'error');
    console.error('Error fetching group details:', error);
  } finally {
    loading.value = false;
  }
}

async function openRoleManagement(group) {
  selectedGroup.value = group;
  await fetchRoles();
  roleDialog.value = true;
}

async function addRoleToGroup() {
  if (!selectedGroup.value || !selectedRole.value) return;

  try {
    loading.value = true;
    await mqttService.addRoleToGroup(selectedGroup.value.name, selectedRole.value);
    showSuccess('Role added successfully');
    selectedRole.value = null;
    // Refresh group details
    const details = await mqttService.getGroup(selectedGroup.value.name);
    selectedGroup.value = details;
  } catch (error) {
    showError('Failed to add role');
    console.error('Error:', error);
  } finally {
    loading.value = false;
    closeDialog();
  }

}
</script>