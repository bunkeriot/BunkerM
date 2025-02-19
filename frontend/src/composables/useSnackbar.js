import { inject } from 'vue';

export function useSnackbar() {
  // Inject the showMessage function provided by the parent component
  const showMessage = inject('showMessage');

  // Handle the case where showMessage is not provided
  if (!showMessage) {
    console.warn('[useSnackbar] No showMessage function is provided via inject!');

    // Fallback behavior
    const fallback = (message, type) =>
      console.warn(`[useSnackbar] Fallback: (${type}) ${message}`);

    return {
      showSuccess: (message) => fallback(message, 'success'),
      showError: (message) => fallback(message, 'error'),
      showWarning: (message) => fallback(message, 'warning'),
      showInfo: (message) => fallback(message, 'info'),
    };
  }

  // Return the functions using the injected showMessage
  return {
    showSuccess: (message) => showMessage(message, 'success'),
    showError: (message) => showMessage(message, 'error'),
    showWarning: (message) => showMessage(message, 'warning'),
    showInfo: (message) => showMessage(message, 'info'),
  };
}
