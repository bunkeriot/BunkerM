/* # Copyright (c) 2025 BunkerIoT
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
// services/azureBridgeService.js
import { api } from './api';
import { generateNonce } from '../utils/security';

const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

export const azureBridgeService = {
  async configureBridge(formData) {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();

    try {
      console.log('Configuring Azure IoT Hub Bridge with params:', { timestamp, nonce });
      const response = await api.post('/azure-bridge', formData, {
        params: {
          nonce,
          timestamp
        },
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-API-Key': import.meta.env.VITE_API_KEY
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error configuring Azure IoT Hub Bridge:', error.response?.data || error.message);
      throw error;
    }
  }
};