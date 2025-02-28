// api.js
import axios from 'axios';

// Remove any trailing slashes from the base URL
const baseURL = import.meta.env.VITE_DYNSEC_API_URL?.replace(/\/+$/, '');

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': import.meta.env.VITE_API_KEY
  },
  // timeout
 // timeout: 10000,
  // validation for status
  validateStatus: status => status >= 200 && status < 500
});