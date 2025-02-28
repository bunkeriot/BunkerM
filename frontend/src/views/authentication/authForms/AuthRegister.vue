<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons-vue';
import { useAuthStore } from '@/stores/auth';

const isGoogleLoading = ref(false);
const router = useRouter();
const authStore = useAuthStore();

const show1 = ref(false);
const password = ref('');
const email = ref('');
const firstname = ref('');
const lastname = ref('');

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
    await authStore.register(email.value, password.value, firstname.value, lastname.value);
    router.push('/dashboard'); // or wherever you want to redirect after registration
  } catch (error: any) {
    console.error(error);
    // error display in the UI
    alert(error.message);
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
    <h3 class="text-h3 text-center mb-0">Sign up</h3>
    <router-link to="/auth/login" class="text-primary text-decoration-none">Already have an account?</router-link>
  </div>
  <v-form @submit.prevent="validate" class="mt-7 loginForm">
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




<!--     <div class="d-sm-inline-flex align-center mt-2 mb-7 mb-sm-0 font-weight-bold">
      <h6 class="text-caption">
        By Signing up, you agree to our
        <router-link to="/auth/register" class="text-primary link-hover font-weight-medium">Terms of
          Service</router-link>
        and
        <router-link to="/auth/register" class="text-primary link-hover font-weight-medium">Privacy Policy</router-link>
      </h6>
    </div> -->
    <v-btn color="primary" block class="mt-4" variant="flat" size="large" type="submit">Create Account</v-btn>
  </v-form>
  <div class="my-4 text-center">
      <div class="text-subtitle-1 text-medium-emphasis">Or</div>
    </div>

    <v-btn block color="error" class="mb-3" variant="flat" size="large" @click="signInWithGoogle"
      :loading="isGoogleLoading">
      <v-icon start icon="mdi-google" class="mr-2"></v-icon>
      Sign up with Google
    </v-btn>
</template>