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