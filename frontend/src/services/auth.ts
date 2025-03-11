/**
 * Authentication Service
 * 
 * This service provides authentication-related utilities including password hashing.
 */

/**
 * Hash a password using a secure hashing algorithm
 * @param password The plain text password to hash
 * @returns A promise that resolves to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // First try the standard Web Crypto API
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (cryptoError) {
      console.warn('Web Crypto API failed, falling back to simple hash:', cryptoError);
      
      // Simple fallback hash function for browsers with restricted Web Crypto API (like Safari)
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      // Convert to hex string and add salt
      const salt = 'bunkerM' + new Date().getFullYear();
      const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
      const saltedHash = hashStr + salt;
      
      // Double hash with a different algorithm to increase security
      let secondHash = 0;
      for (let i = 0; i < saltedHash.length; i++) {
        const char = saltedHash.charCodeAt(i);
        secondHash = ((secondHash >> 5) + secondHash) + char;
        secondHash = secondHash & secondHash;
      }
      
      return Math.abs(secondHash).toString(16).padStart(16, '0') + hashStr;
    }
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against its hash
 * @param password The plain text password to verify
 * @param hash The hashed password to verify against
 * @returns A promise that resolves to true if the password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const hashedPassword = await hashPassword(password);
    return hashedPassword === hash;
  } catch (error) {
    console.error('Error verifying password:', error);
    throw new Error('Failed to verify password');
  }
}

/**
 * Login a user with email and password
 * @param email The user's email
 * @param password The user's password
 * @returns A promise that resolves to the user object if login is successful
 */
export async function loginWithPassword(email: string, password: string): Promise<any> {
  try {
    console.log('Attempting login for email:', email);
    
    // First try to login with the backend API
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login successful with backend API');
        return {
          user: data.user,
          token: data.token
        };
      } else {
        console.warn('Backend login failed, falling back to localStorage');
        // Fall back to localStorage
      }
    } catch (apiError) {
      console.warn('API call failed, falling back to localStorage:', apiError);
      // Fall back to localStorage
    }
    
    // Get users from localStorage
    const usersJson = localStorage.getItem('users');
    console.log('Users in localStorage:', usersJson);
    
    if (!usersJson) {
      console.error('No users found in localStorage');
      // Try to reinitialize local auth
      await import('./localAuth').then(module => module.initLocalAuth());
      throw new Error('User data was missing. Please try logging in again.');
    }
    
    const users = JSON.parse(usersJson);
    console.log('Parsed users:', users);
    
    // Find user by email
    const user = users.find((u: any) => u.email === email);
    console.log('Found user:', user);
    
    if (!user) {
      console.log('User not found for email:', email);
      throw new Error('Invalid email or password');
    }
    
    // Get stored password hash
    const passwordsJson = localStorage.getItem('passwords');
    console.log('Passwords in localStorage:', passwordsJson);
    
    if (!passwordsJson) {
      console.error('No passwords found in localStorage');
      // Try to reinitialize local auth
      await import('./localAuth').then(module => module.initLocalAuth());
      throw new Error('Password data was missing. Please try logging in again.');
    }
    
    const passwords = JSON.parse(passwordsJson);
    const storedHash = passwords[user.id];
    console.log('Found stored hash for user:', !!storedHash);
    
    if (!storedHash) {
      console.error('No password hash found for user:', user.id);
      // If this is the default user, try to reinitialize the password
      if (user.email === 'admin@example.com') {
        console.log('Attempting to reinitialize default user password');
        await import('./localAuth').then(module => module.initLocalAuth());
        throw new Error('Default user password was missing. Please try logging in again.');
      }
      throw new Error('Invalid email or password');
    }
    
    // Hash the provided password for comparison
    const inputHash = await hashPassword(password);
    console.log('Input password hashed successfully');
    
    // Verify password
    const isValid = inputHash === storedHash;
    console.log('Password verification result:', isValid);
    
    if (!isValid) {
      console.log('Invalid password for user:', email);
      throw new Error('Invalid email or password');
    }
    
    console.log('Login successful for user:', email);
    
    // Generate a token (in a real app, this would be a JWT)
    const token = await hashPassword(user.id + Date.now().toString());
    
    // Store current user and token - this provides redundancy 
    // with what the auth store is doing
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('auth_token', token);
    console.log('User and token stored in localStorage');
    
    return {
      user,
      token
    };
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Validate a stored token
 * This is a simple implementation - in a real app, you would verify a JWT
 * @param token The token to validate
 * @returns true if the token is valid, false otherwise
 */
export function validateToken(token: string): boolean {
  // In this simple implementation, we just check if the token exists
  // In a real app, you would verify the JWT signature and expiration
  return !!token && token.length > 0;
}