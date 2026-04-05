<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { clearAuthData } from '@/services/localAuth';
import type { User } from '@/stores/auth';
import { hashPassword } from '@/services/auth';

const authStore = useAuthStore();
const users = ref<User[]>([]);
const showConfirmDialog = ref(false);
const userToDelete = ref<User | null>(null);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');
const showCreateDialog = ref(false);

// New user form data
const newUser = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
});

// Form validation
const formErrors = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
});

// Load users from localStorage
onMounted(() => {
  loadUsers();
});

function loadUsers() {
  const usersJson = localStorage.getItem('users') || '[]';
  try {
    users.value = JSON.parse(usersJson);
  } catch (error) {
    console.error('Error parsing users from localStorage', error);
    users.value = [];
  }
}

const currentUser = computed(() => {
  return authStore.user;
});

function confirmDeleteUser(user: User) {
  userToDelete.value = user;
  showConfirmDialog.value = true;
}

function deleteUser() {
  if (!userToDelete.value) return;
  
  // Cannot delete current user
  if (currentUser.value?.id === userToDelete.value.id) {
    snackbarText.value = 'Cannot delete the currently logged in user';
    snackbarColor.value = 'error';
    snackbar.value = true;
    showConfirmDialog.value = false;
    return;
  }
  
  // Get users from localStorage
  const usersJson = localStorage.getItem('users') || '[]';
  let usersArray: User[] = [];
  
  try {
    usersArray = JSON.parse(usersJson);
    
    // Filter out the user to delete
    usersArray = usersArray.filter(u => u.id !== userToDelete.value?.id);
    
    // Save back to localStorage
    localStorage.setItem('users', JSON.stringify(usersArray));
    
    // Remove password
    const passwordsJson = localStorage.getItem('passwords') || '{}';
    const passwords = JSON.parse(passwordsJson);
    if (userToDelete.value?.id && passwords[userToDelete.value.id]) {
      delete passwords[userToDelete.value.id];
      localStorage.setItem('passwords', JSON.stringify(passwords));
    }
    
    // Update local users list
    users.value = usersArray;
    
    snackbarText.value = 'User deleted successfully';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (error) {
    console.error('Error deleting user', error);
    snackbarText.value = 'Error deleting user';
    snackbarColor.value = 'error';
    snackbar.value = true;
  }
  
  showConfirmDialog.value = false;
}

function resetAllData() {
  if (confirm('Are you sure you want to reset all authentication data? This will log you out.')) {
    clearAuthData();
    window.location.href = '/auth/login';
  }
}

// Validate form
function validateForm() {
  let isValid = true;
  formErrors.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  if (!newUser.value.firstName.trim()) {
    formErrors.value.firstName = 'First name is required';
    isValid = false;
  }

  if (!newUser.value.lastName.trim()) {
    formErrors.value.lastName = 'Last name is required';
    isValid = false;
  }

  if (!newUser.value.email.trim()) {
    formErrors.value.email = 'Email is required';
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.value.email)) {
    formErrors.value.email = 'Invalid email format';
    isValid = false;
  }

  if (!newUser.value.password) {
    formErrors.value.password = 'Password is required';
    isValid = false;
  } else if (newUser.value.password.length < 8) {
    formErrors.value.password = 'Password must be at least 8 characters';
    isValid = false;
  }

  if (newUser.value.password !== newUser.value.confirmPassword) {
    formErrors.value.confirmPassword = 'Passwords do not match';
    isValid = false;
  }

  return isValid;
}

// Create new user
async function createUser() {
  if (!validateForm()) return;

  try {
    // Get existing users
    const usersJson = localStorage.getItem('users') || '[]';
    const usersArray = JSON.parse(usersJson);

    // Check if email already exists
    if (usersArray.some((u: User) => u.email === newUser.value.email)) {
      formErrors.value.email = 'Email already exists';
      return;
    }

    // Create new user object
    const user = {
      id: crypto.randomUUID(),
      firstName: newUser.value.firstName.trim(),
      lastName: newUser.value.lastName.trim(),
      email: newUser.value.email.trim(),
      createdAt: new Date().toISOString()
    };

    // Hash password before storing
    const hashedPassword = await hashPassword(newUser.value.password);

    // Add user to array
    usersArray.push(user);
    localStorage.setItem('users', JSON.stringify(usersArray));

    // Store hashed password
    const passwordsJson = localStorage.getItem('passwords') || '{}';
    const passwords = JSON.parse(passwordsJson);
    passwords[user.id] = hashedPassword;
    localStorage.setItem('passwords', JSON.stringify(passwords));

    // Update local users list
    users.value = usersArray;

    // Reset form and close dialog
    newUser.value = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    showCreateDialog.value = false;

    snackbarText.value = 'User created successfully';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (error) {
    console.error('Error creating user', error);
    snackbarText.value = 'Error creating user';
    snackbarColor.value = 'error';
    snackbar.value = true;
  }
}
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h5">
            Local Account Manager
            <v-spacer></v-spacer>
            <v-btn color="primary" class="mr-2" @click="showCreateDialog = true">
              <PlusIcon stroke-width="1.5" size="22" />
              Add User
            </v-btn>
            <v-btn color="error" @click="resetAllData">Reset All Data</v-btn>
          </v-card-title>
          
          <v-card-subtitle>
            Manage your locally stored accounts.
          </v-card-subtitle>
          
          <v-card-text>
            <v-alert type="info" class="mb-4">
              <strong>Note:</strong> You are currently logged in as {{ currentUser?.firstName }} {{ currentUser?.lastName }} ({{ currentUser?.email }})
            </v-alert>
            
            <v-table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id" :class="{ 'bg-grey-lighten-4': user.id === currentUser?.id }">
                  <td>{{ user.firstName }} {{ user.lastName }}</td>
                  <td>{{ user.email }}</td>
                  <td>{{ new Date(user.createdAt).toLocaleString() }}</td>
                  <td>
                    <v-btn 
                      icon 
                      color="error" 
                      size="small" 
                      @click="confirmDeleteUser(user)"
                      :disabled="user.id === currentUser?.id"
                    >
                    <TrashIcon stroke-width="1.5" size="22" />
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Confirmation Dialog -->
    <v-dialog v-model="showConfirmDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete the user {{ userToDelete?.firstName }} {{ userToDelete?.lastName }} ({{ userToDelete?.email }})?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="showConfirmDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="deleteUser">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>

    <!-- Create User Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5">Create New User</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="createUser">
            <v-container>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="newUser.firstName"
                    label="First Name"
                    :error-messages="formErrors.firstName"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="newUser.lastName"
                    label="Last Name"
                    :error-messages="formErrors.lastName"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="newUser.email"
                    label="Email"
                    type="email"
                    :error-messages="formErrors.email"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="newUser.password"
                    label="Password"
                    type="password"
                    :error-messages="formErrors.password"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="newUser.confirmPassword"
                    label="Confirm Password"
                    type="password"
                    :error-messages="formErrors.confirmPassword"
                    required
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="showCreateDialog = false">Cancel</v-btn>
          <v-btn color="success" variant="flat" @click="createUser">Create User</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template> 