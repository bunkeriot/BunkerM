/* # Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { Form } from 'vee-validate';
import { loginWithPassword } from '@/services/auth';

const router = useRouter();
const authStore = useAuthStore();

const checkbox = ref(false);
const show1 = ref(false);
const password = ref('');
const email = ref('');
const showDefaultCredentials = ref(true);
const loading = ref(false);
const error = ref('');

// Set default credentials for demo purposes and initialize auth store
onMounted(async () => {
  email.value = 'admin@example.com';
  password.value = 'password123';
  
  // Initialize the auth store to check for existing sessions
  await authStore.initialize();
  
  // If already authenticated, redirect to dashboard
  if (authStore.isAuthenticated()) {
    console.log('User already authenticated, redirecting to dashboard');
    router.push('/dashboard');
  }
});

const passwordRules = ref([
  (v: string) => !!v || 'Password is required',
  (v: string) => (v && v.length >= 6) || 'Password must be at least 6 characters'
]);

const emailRules = ref([
  (v: string) => !!v || 'E-mail is required',
  (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid'
]);

async function handleLogin() {
  try {
    loading.value = true;
    error.value = '';
    console.log('Attempting login with:', email.value);
    
    const response = await loginWithPassword(email.value, password.value);
    console.log('Login successful, response:', response);
    
    // Store both user and token in the auth store
    await authStore.setUser(response.user, response.token);
    console.log('User and token set in store, redirecting...');
    
    router.push('/dashboard');
  } catch (err: any) {
    console.error('Login error:', err);
    error.value = err.message || 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="d-flex justify-space-between align-center">
    <h3 class="text-h3 text-center mb-0">Login</h3>
    <router-link to="/auth/register" class="text-primary text-decoration-none">Don't Have an account?</router-link>
  </div>
  
  <form @submit.prevent="handleLogin" class="mt-7 loginForm">
    <div class="mb-6">
      <v-label>Email Address</v-label>
      <v-text-field
        v-model="email"
        :rules="emailRules"
        class="mt-2"
        required
        hide-details="auto"
        variant="outlined"
        color="primary"
        :disabled="loading"
      ></v-text-field>
    </div>
    
    <div>
      <v-label>Password</v-label>
      <v-text-field
        v-model="password"
        :rules="passwordRules"
        required
        variant="outlined"
        color="primary"
        hide-details="auto"
        :type="show1 ? 'text' : 'password'"
        class="mt-2"
        :disabled="loading"
      >
        <template v-slot:append-inner>
          <v-btn color="secondary" icon rounded variant="text" @click="show1 = !show1">
            <EyeInvisibleOutlined :style="{ color: 'rgb(var(--v-theme-secondary))' }" v-if="!show1" />
            <EyeOutlined :style="{ color: 'rgb(var(--v-theme-secondary))' }" v-if="show1" />
          </v-btn>
        </template>
      </v-text-field>
    </div>

    <div class="d-flex align-center mt-4 mb-7 mb-sm-0">
      <v-checkbox
        v-model="checkbox"
        label="Keep me sign in"
        color="primary"
        class="ms-n2"
        hide-details
        :disabled="loading"
      ></v-checkbox>
      <div class="ml-auto">
        <router-link to="/auth/login" class="text-darkText link-hover">Forgot Password?</router-link>
      </div>
    </div>

    <v-btn 
      color="primary" 
      :loading="loading" 
      block 
      class="mt-5" 
      variant="flat" 
      size="large" 
      type="submit"
      :disabled="loading"
    >
      {{ loading ? 'Logging in...' : 'Login' }}
    </v-btn>

    <v-alert
      v-if="error"
      type="error"
      class="mt-4"
      closable
      @click:close="error = ''"
    >
      {{ error }}
    </v-alert>
    
    <div v-if="showDefaultCredentials" class="mt-4 pa-3 bg-grey-lighten-4 rounded">
      <div class="text-subtitle-2 font-weight-bold mb-1">Default Credentials</div>
      <div class="text-body-2">Email: admin@example.com</div>
      <div class="text-body-2">Password: password123</div>
      <v-btn size="small" variant="text" color="primary" class="mt-2" @click="showDefaultCredentials = false">
        Hide
      </v-btn>
    </div>
  </form>
</template>

<style lang="scss">
.loginForm {
  .v-text-field .v-field--active input {
    font-weight: 500;
  }
}
</style>