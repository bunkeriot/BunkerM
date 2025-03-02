/* # Copyright (c) 2025 BunkerIoT
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
// services/awsBridgeService.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_AWS_BRIDGE_API_URL,
  headers: {
    'X-API-Key': import.meta.env.VITE_API_KEY
  }
});

export const awsBridgeService = {
  async configureBridge(formData) {
    try {
      // Log the FormData contents for debugging
      console.log('Sending FormData entries:');
      for (let pair of formData.entries()) {
        if (pair[0] === 'bridge_config') {
          console.log('bridge_config:', JSON.parse(pair[1]));
        } else {
          console.log(`${pair[0]}: ${pair[1] instanceof File ? pair[1].name : pair[1]}`);
        }
      }
      
      const response = await api.post('/aws-bridge', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });

      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error;
    }
  }
};