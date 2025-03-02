/* # Copyright (c) 2025 BunkerIoT
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
// composables/useAzureBridge.js
import { ref } from 'vue';
import { generateNonce } from '@/utils/security';
import { azureBridgeService } from '@/services/azureBridgeService';

export function useAzureBridge() {
  const loading = ref(false);
  const error = ref(null);

  const configureBridge = async (formData) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await azureBridgeService.configureBridge(formData);
      return response;

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