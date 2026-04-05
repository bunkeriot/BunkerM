import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.AUTH_API_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Enhanced logging
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Error handling middleware
app.use((err, req, res, next) => {
  log(`Error: ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(bodyParser.json());

// Path to the users database file
const DB_DIR = process.env.DB_PATH || '/data';
const USERS_FILE = path.join(DB_DIR, 'users.json');
const PASSWORDS_FILE = path.join(DB_DIR, 'passwords.json');

// Ensure the data directory exists
if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
    log(`Created data directory at ${DB_DIR}`);
  } catch (error) {
    log(`Error creating data directory: ${error.message}`);
    console.error(error);
  }
}

// Initialize database files if they don't exist
function initializeDatabase() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      // Create default admin user
      const defaultUser = {
        id: '1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        createdAt: new Date().toISOString()
      };
      
      fs.writeFileSync(USERS_FILE, JSON.stringify([defaultUser], null, 2));
      log('Created users database with default admin user');
    }
    
    if (!fs.existsSync(PASSWORDS_FILE)) {
      // Create default admin password (password123) - hashed with bcrypt
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync('password123', salt);
      
      const passwords = {
        '1': hashedPassword
      };
      
      fs.writeFileSync(PASSWORDS_FILE, JSON.stringify(passwords, null, 2));
      log('Created passwords database with default admin password');
    }
  } catch (error) {
    log(`Error initializing database: ${error.message}`);
    console.error(error);
  }
}

// Initialize the database
initializeDatabase();

// Helper functions to read/write database
function getUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    log(`Error reading users file: ${error.message}`);
    console.error(error);
    return [];
  }
}

function getPasswords() {
  try {
    const data = fs.readFileSync(PASSWORDS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    log(`Error reading passwords file: ${error.message}`);
    console.error(error);
    return {};
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    log('Users saved successfully');
  } catch (error) {
    log(`Error saving users: ${error.message}`);
    console.error(error);
  }
}

function savePasswords(passwords) {
  try {
    fs.writeFileSync(PASSWORDS_FILE, JSON.stringify(passwords, null, 2));
    log('Passwords saved successfully');
  } catch (error) {
    log(`Error saving passwords: ${error.message}`);
    console.error(error);
  }
}

// Health check endpoint
app.get('/api/auth/health', (req, res) => {
  log('Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.post('/api/auth/login', (req, res) => {
  try {
    log(`Login attempt for email: ${req.body.email}`);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      log('Login failed: Email and password are required');
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const users = getUsers();
    const passwords = getPasswords();
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      log(`Login failed: User not found for email: ${email}`);
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Use bcrypt to compare passwords
    if (!bcrypt.compareSync(password, passwords[user.id])) {
      log(`Login failed: Invalid password for email: ${email}`);
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    
    log(`Login successful for email: ${email}`);
    res.json({
      user,
      token
    });
  } catch (error) {
    log(`Error in login: ${error.message}`);
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    log(`Register attempt for email: ${req.body.email}`);
    
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      log('Registration failed: All fields are required');
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const users = getUsers();
    
    // Check if user already exists
    if (users.some(u => u.email === email)) {
      log(`Registration failed: User with email ${email} already exists`);
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Create new user with UUID
    const newUser = {
      id: uuidv4(),
      email,
      firstName,
      lastName,
      createdAt: new Date().toISOString()
    };
    
    // Add user to database
    users.push(newUser);
    saveUsers(users);
    
    // Hash password with bcrypt and save
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    
    const passwords = getPasswords();
    passwords[newUser.id] = hashedPassword;
    savePasswords(passwords);
    
    // Generate JWT token
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '24h' });
    
    log(`Registration successful for email: ${email}`);
    res.status(201).json({
      user: newUser,
      token
    });
  } catch (error) {
    log(`Error in register: ${error.message}`);
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/users', (req, res) => {
  try {
    log('Getting all users');
    const users = getUsers();
    res.json(users);
  } catch (error) {
    log(`Error getting users: ${error.message}`);
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/auth/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    log(`Deleting user with ID: ${id}`);
    
    const users = getUsers();
    const passwords = getPasswords();
    
    // Filter out the user to delete
    const updatedUsers = users.filter(user => user.id !== id);
    
    // Remove password
    if (passwords[id]) {
      delete passwords[id];
    }
    
    saveUsers(updatedUsers);
    savePasswords(passwords);
    
    log(`User with ID ${id} deleted successfully`);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    log(`Error deleting user: ${error.message}`);
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/reset', (req, res) => {
  try {
    log('Resetting authentication data');
    // Reset the database to initial state
    initializeDatabase();
    res.json({ message: 'Authentication data reset successfully' });
  } catch (error) {
    log(`Error resetting auth data: ${error.message}`);
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Broker logs endpoint
app.get('/api/logs/broker', (req, res) => {
  try {
    log('Getting broker logs');
    const logPath = '/var/log/mosquitto/mosquitto.log';

    if (!fs.existsSync(logPath)) {
      log(`Broker log file not found at ${logPath}`);
      return res.status(404).json({ error: 'Broker log file not found', logs: [] });
    }

    try {
      // Read the last 1000 lines of the log file
      const fileContent = fs.readFileSync(logPath, 'utf8');
      const lines = fileContent.toString().split('\n');
      const lastLines = lines.slice(-1000).filter(line => line.trim() !== '');

      // Parse each line to extract timestamp and message
      const logs = lastLines.map(line => {
        const logLine = line.toString().trim();
        if (!logLine) {
          return null;
        }

        // Try to extract timestamp from the Mosquitto log format
        // Example: 1709669577: New connection from 127.0.0.1:49816
        const parts = logLine.split(': ', 2);
        let timestamp = new Date().toISOString();
        let message = logLine;

        if (parts.length === 2) {
          try {
            // Convert Unix timestamp to ISO string if it's a number
            const unixTimestamp = parseInt(parts[0], 10);
            if (!isNaN(unixTimestamp)) {
              timestamp = new Date(unixTimestamp * 1000).toISOString();
              message = parts[1];
            }
          } catch (e) {
            // If parsing fails, keep the defaults
            log(`Error parsing timestamp: ${e.message}`);
          }
        }

        return {
          timestamp,
          message
        };
      }).filter(entry => entry !== null);

      res.json({ logs });
    } catch (readError) {
      log(`Error reading log file: ${readError.message}`);
      console.error(readError);
      res.status(500).json({ error: 'Error reading log file', logs: [] });
    }
  } catch (error) {
    log(`Error in broker logs endpoint: ${error.message}`);
    console.error(error);
    res.status(500).json({ error: 'Internal server error', logs: [] });
  }
});

// Start the server
app.listen(PORT, () => {
  log(`Auth API server running on port ${PORT}`);
});

export default app; 