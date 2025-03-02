/* # Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */ 
// composables/useAwsBridge.js
import { ref } from 'vue';
import { generateNonce } from '@/utils/security';

export function useAwsBridge() {
  const loading = ref(false);
  const error = ref(null);

  const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

  const configureBridge = async (formData) => {
    try {
      loading.value = true;
      error.value = null;

      const timestamp = getCurrentTimestamp();
      const nonce = generateNonce();

      const response = await api.post('api/v1/aws-bridge', formData, {
        params: {
          nonce,
          timestamp
        },
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (err) {
      error.value = err.response?.data?.detail || err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    configureBridge
  };
}