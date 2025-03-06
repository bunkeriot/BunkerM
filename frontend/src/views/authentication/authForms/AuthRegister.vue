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

const router = useRouter();
const authStore = useAuthStore();

const show1 = ref(false);
const password = ref('');
const email = ref('');
const firstname = ref('');
const lastname = ref('');
const registrationSuccess = ref(false);
const registrationError = ref('');

// Initialize auth store
onMounted(async () => {
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

const firstRules = ref([(v: string) => !!v || 'First Name is required']);
const lastRules = ref([(v: string) => !!v || 'Last Name is required']);
const emailRules = ref([
  (v: string) => !!v || 'E-mail is required',
  (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid'
]);

async function validate() {
  try {
    registrationError.value = '';
    await authStore.register(email.value, password.value, firstname.value, lastname.value);
    registrationSuccess.value = true;
    
    // Redirect after a short delay to show success message
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  } catch (error: any) {
    console.error(error);
    registrationError.value = error.message;
  }
}
</script>

<template>
  <div class="d-flex justify-space-between align-center">
    <h3 class="text-h3 text-center mb-0">Sign up</h3>
    <router-link to="/auth/login" class="text-primary text-decoration-none">Already have an account?</router-link>
  </div>
  
  <div class="mt-2 mb-4 pa-2 bg-grey-lighten-4 rounded">
    <div class="text-body-2">
      <strong>Note:</strong> All accounts are stored locally in your browser's localStorage. 
      Your credentials will persist between sessions on this device.
    </div>
  </div>
  
  <v-alert v-if="registrationSuccess" type="success" class="mb-4">
    Registration successful! Redirecting to dashboard...
  </v-alert>
  
  <v-alert v-if="registrationError" type="error" class="mb-4">
    {{ registrationError }}
  </v-alert>
  
  <v-form @submit.prevent="validate" class="mt-4 loginForm">
    <v-row class="my-0">
      <v-col cols="12" sm="6" class="py-0">
        <div class="mb-6">
          <v-label>First Name*</v-label>
          <v-text-field v-model="firstname" :rules="firstRules" hide-details="auto" required variant="outlined"
            class="mt-2" color="primary" placeholder="John"></v-text-field>
        </div>
      </v-col>
      <v-col cols="12" sm="6" class="py-0">
        <div class="mb-6">
          <v-label>Last Name*</v-label>
          <v-text-field v-model="lastname" :rules="lastRules" hide-details="auto" required variant="outlined"
            class="mt-2" color="primary" placeholder="Doe"></v-text-field>
        </div>
      </v-col>
    </v-row>
    <div class="mb-6">
      <v-label>Email Address*</v-label>
      <v-text-field v-model="email" :rules="emailRules" placeholder="demo@company.com" class="mt-2" required
        hide-details="auto" variant="outlined" color="primary"></v-text-field>
    </div>
    <div class="mb-6">
      <v-label>Password</v-label>
      <v-text-field v-model="password" :rules="passwordRules" placeholder="*****" required variant="outlined"
        color="primary" hide-details="auto" :type="show1 ? 'text' : 'password'" class="mt-2">
        <template v-slot:append-inner>
          <v-btn color="secondary" icon rounded variant="text">
            <EyeInvisibleOutlined :style="{ color: 'rgb(var(--v-theme-secondary))' }" v-if="show1 == false"
              @click="show1 = !show1" />
            <EyeOutlined :style="{ color: 'rgb(var(--v-theme-secondary))' }" v-if="show1 == true"
              @click="show1 = !show1" />
          </v-btn>
        </template>
      </v-text-field>
    </div>

    <v-btn color="primary" block class="mt-4" variant="flat" size="large" type="submit">Create Account</v-btn>
  </v-form>
</template>