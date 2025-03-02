/* # Copyright (c) 2025 BunkerIoT
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
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