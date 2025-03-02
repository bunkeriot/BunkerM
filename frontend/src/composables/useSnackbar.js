/* # Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
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
