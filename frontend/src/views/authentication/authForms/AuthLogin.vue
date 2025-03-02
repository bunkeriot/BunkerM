/* # Copyright (c) 2025 BunkerIoT
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { Form } from 'vee-validate';

const isGoogleLoading = ref(false);

const router = useRouter();
const authStore = useAuthStore();

const checkbox = ref(false);
const show1 = ref(false);
const password = ref('');
const email = ref('');

const passwordRules = ref([
  (v: string) => !!v || 'Password is required',
  (v: string) => (v && v.length >= 6) || 'Password must be at least 6 characters'
]);

const emailRules = ref([
  (v: string) => !!v || 'E-mail is required',
  (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid'
]);

async function validate(values: any, { setErrors }: any) {
  try {
    await authStore.login(email.value, password.value);
    router.push('/dashboard'); // or wherever you want to redirect after login
  } catch (error: any) {
    setErrors({ apiError: error.message });
  }
}

async function signInWithGoogle() {
  try {
    isGoogleLoading.value = true;
    await authStore.loginWithGoogle();
    router.push('/dashboard');
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    // Handle error (show alert or message)
  } finally {
    isGoogleLoading.value = false;
  }
}
</script>

<template>
  <div class="d-flex justify-space-between align-center">
    <h3 class="text-h3 text-center mb-0">Login</h3>
    <router-link to="/auth/register" class="text-primary text-decoration-none">Don't Have an account?</router-link>
  </div>
  <Form @submit="validate" class="mt-7 loginForm" v-slot="{ errors, isSubmitting }">
    <div class="mb-6">
      <v-label>Email Address</v-label>
      <v-text-field
        aria-label="email address"
        v-model="email"
        :rules="emailRules"
        class="mt-2"
        required
        hide-details="auto"
        variant="outlined"
        color="primary"
      ></v-text-field>
    </div>
    <div>
      <v-label>Password</v-label>
      <v-text-field
        aria-label="password"
        v-model="password"
        :rules="passwordRules"
        required
        variant="outlined"
        color="primary"
        hide-details="auto"
        :type="show1 ? 'text' : 'password'"
        class="mt-2"
      >
        <template v-slot:append-inner>
          <v-btn color="secondary" icon rounded variant="text">
            <EyeInvisibleOutlined :style="{ color: 'rgb(var(--v-theme-secondary))' }" v-if="show1 == false" @click="show1 = !show1" />
            <EyeOutlined :style="{ color: 'rgb(var(--v-theme-secondary))' }" v-if="show1 == true" @click="show1 = !show1" />
          </v-btn>
        </template>
      </v-text-field>
    </div>

    <div class="d-flex align-center mt-4 mb-7 mb-sm-0">
      <v-checkbox
        v-model="checkbox"
        :rules="[(v: any) => !!v || 'You must agree to continue!']"
        label="Keep me sign in"
        required
        color="primary"
        class="ms-n2"
        hide-details
      ></v-checkbox>
      <div class="ml-auto">
        <router-link to="/auth/login" class="text-darkText link-hover">Forgot Password?</router-link>
      </div>
    </div>
    <v-btn color="primary" :loading="isSubmitting" block class="mt-5" variant="flat" size="large" type="submit">
      Login
    </v-btn>
    <div v-if="errors.apiError" class="mt-2">
      <v-alert color="error">{{ errors.apiError }}</v-alert>
    </div>
  </Form>

  <div class="my-4 text-center">
    <div class="text-subtitle-1 text-medium-emphasis">Or</div>
  </div>
  
  <v-btn
    block
    color="error"
    class="mb-3"
    variant="flat"
    size="large"
    @click="signInWithGoogle"
    :loading="isGoogleLoading"
  >
    <v-icon start icon="mdi-google" class="mr-2"></v-icon>
    Continue with Google
  </v-btn>
  
</template>

<style lang="scss">
.loginForm {
  .v-text-field .v-field--active input {
    font-weight: 500;
  }
}
</style>