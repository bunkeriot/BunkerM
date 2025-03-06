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
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
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
    
    // Get users from localStorage
    const usersJson = localStorage.getItem('users');
    console.log('Users in localStorage:', usersJson);
    
    if (!usersJson) {
      console.error('No users found in localStorage');
      throw new Error('Invalid email or password');
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
      throw new Error('Invalid email or password');
    }
    
    const passwords = JSON.parse(passwordsJson);
    const storedHash = passwords[user.id];
    console.log('Found stored hash for user:', !!storedHash);
    
    if (!storedHash) {
      console.error('No password hash found for user:', user.id);
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