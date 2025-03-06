// src/stores/auth.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { initLocalAuth, getCurrentUser, addDemoUser } from '@/services/localAuth';
import { hashPassword } from '@/services/auth';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(true);

  // Initialize the auth store
  async function init() {
    try {
      console.log('Initializing auth store...');
      // Initialize local auth if needed
      await initLocalAuth();
      
      // Retrieve stored user and token
      const storedUser = getCurrentUser();
      const storedToken = localStorage.getItem('auth_token');
      
      if (storedUser && storedToken) {
        console.log('Found existing authenticated session for:', storedUser.email);
        user.value = storedUser;
        token.value = storedToken;
      } else {
        console.log('No authenticated session found');
        user.value = null;
        token.value = null;
      }
    } catch (error) {
      console.error('Error initializing auth store:', error);
      user.value = null;
      token.value = null;
    } finally {
      loading.value = false;
    }
  }

  // Set user and token
  function setUser(userData: User, authToken: string) {
    user.value = userData;
    token.value = authToken;
    
    // Store in localStorage for persistence
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('auth_token', authToken);
    
    console.log('User authenticated and stored:', userData.email);
  }

  // Register a new user
  async function register(email: string, password: string, firstName: string, lastName: string) {
    try {
      // Create the user
      const newUser = await addDemoUser(email, password, firstName, lastName);
      
      // Generate a token
      const newToken = await hashPassword(newUser.id + Date.now().toString());
      
      // Set as current user
      setUser(newUser, newToken);
      
      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Logout the current user
  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    console.log('User logged out, auth data cleared');
  }

  // Check if user is authenticated
  function isAuthenticated() {
    return !!user.value && !!token.value;
  }

  // Call init immediately when the store is created
  init();

  return {
    user,
    token,
    loading,
    init,
    setUser,
    register,
    logout,
    isAuthenticated
  };
});