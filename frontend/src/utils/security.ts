/**
 * Generates a unique nonce for API requests
 * Format: timestamp:random
 */
export const generateNonce = (): string => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}:${random}`;
  };
  
  /**
   * Validates that the API response came from a secure connection
   */
  export const validateSecureResponse = (response: Response): boolean => {
    return response.headers.get('Strict-Transport-Security') !== null;
  };
  
  /**
   * Checks if the current connection is secure
   */
  export const isSecureConnection = (): boolean => {
    return window.location.protocol === 'https:';
  };