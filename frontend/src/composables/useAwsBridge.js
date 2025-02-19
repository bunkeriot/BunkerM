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