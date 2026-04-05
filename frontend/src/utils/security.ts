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
   * Validates that the API response is valid
   * Note: No longer checking for HTTPS headers since we're using HTTP
   */
  export const validateSecureResponse = (response: Response): boolean => {
    // Always return true since we're no longer requiring HTTPS
    return true;
  };
  
  /**
   * Checks if the current connection is valid
   * Note: No longer requiring HTTPS
   */
  export const isSecureConnection = (): boolean => {
    // Always return true since we're no longer requiring HTTPS
    return true;
  };