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