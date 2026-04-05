/**
 * Local Authentication Service
 * 
 * This service provides methods for working with the local authentication system.
 * It uses localStorage to persist user data between sessions.
 */

import type { User } from '@/stores/auth';
import { hashPassword } from './auth';

// Default user for testing
const DEFAULT_USER: User = {
  id: '1',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  createdAt: new Date().toISOString()
};

// Default password for the default user
const DEFAULT_PASSWORD = 'password123';

/**
 * Initialize the local authentication system
 * This ensures the required localStorage items exist and adds a default user if none exists
 */
export async function initLocalAuth() {
  console.log('Starting initLocalAuth...');
  
  // Initialize users array if it doesn't exist
  let users: User[] = [];
  const usersJson = localStorage.getItem('users');
  
  if (usersJson) {
    try {
      users = JSON.parse(usersJson);
      console.log('Existing users found:', users.length);
    } catch (error) {
      console.error('Error parsing users from localStorage', error);
      users = [];
    }
  }
  
  // Add default user if no users exist
  if (users.length === 0) {
    console.log('No users found, creating default user...');
    users.push(DEFAULT_USER);
    localStorage.setItem('users', JSON.stringify(users));
    console.log('Default user stored:', DEFAULT_USER);
  }
    
  // Check if passwords exist, create if not
  let passwords = {};
  const passwordsJson = localStorage.getItem('passwords');
  
  if (passwordsJson) {
    try {
      passwords = JSON.parse(passwordsJson);
      console.log('Existing passwords found');
    } catch (error) {
      console.error('Error parsing passwords from localStorage', error);
      passwords = {};
    }
  }
  
  // Ensure default user has a password
  if (!passwords[DEFAULT_USER.id]) {
    try {
      console.log('Creating password for default user...');
      const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
      console.log('Default password hashed successfully');
      
      passwords[DEFAULT_USER.id] = hashedPassword;
      localStorage.setItem('passwords', JSON.stringify(passwords));
      console.log('Default password stored successfully');
    } catch (error) {
      console.error('Error creating default user password:', error);
    }
  }
  
  console.log('Local auth initialization complete');
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem('user');
  if (!userJson) {
    console.log('No user found in localStorage');
    return null;
  }
  
  try {
    const user = JSON.parse(userJson);
    console.log('Current user from localStorage:', user.email);
    return user;
  } catch (error) {
    console.error('Error parsing user from localStorage', error);
    return null;
  }
}

/**
 * Check if a user is authenticated
 */
export function isAuthenticated(): boolean {
  const user = getCurrentUser();
  const token = localStorage.getItem('auth_token');
  return !!user && !!token;
}

/**
 * Clear all authentication data and reinitialize with default user
 * This is useful for testing or resetting the application
 */
export async function clearAuthData() {
  console.log('Clearing all authentication data...');
  localStorage.removeItem('user');
  localStorage.removeItem('users');
  localStorage.removeItem('passwords');
  localStorage.removeItem('auth_token');
  
  // Reinitialize with default user
  await initLocalAuth();
  console.log('Authentication data reset completed');
}

/**
 * Add a demo user account
 * This is useful for testing
 */
export async function addDemoUser(email: string, password: string, firstName: string, lastName: string): Promise<User> {
  // Get existing users
  const usersJson = localStorage.getItem('users') || '[]';
  const users = JSON.parse(usersJson);
  
  // Check if user already exists
  const existingUser = users.find((u: User) => u.email === email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  // Create new user
  const newUser: User = {
    id: Date.now().toString(),
    email,
    firstName,
    lastName,
    createdAt: new Date().toISOString()
  };
  
  // Add user to users array
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  
  // Hash and store password
  const hashedPassword = await hashPassword(password);
  const passwordsJson = localStorage.getItem('passwords') || '{}';
  const passwords = JSON.parse(passwordsJson);
  passwords[newUser.id] = hashedPassword;
  localStorage.setItem('passwords', JSON.stringify(passwords));
  
  return newUser;
}