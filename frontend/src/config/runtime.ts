declare global {
  interface Window {
    __runtime_config__: {
      API_URL: string;
      DYNSEC_API_URL: string;
      AWS_BRIDGE_API_URL: string;
      MONITOR_API_URL: string;
      host: string;
    };
  }
}

export const getRuntimeConfig = () => {
  return window.__runtime_config__ || {
    API_URL: import.meta.env.VITE_API_URL,
    DYNSEC_API_URL: import.meta.env.VITE_DYNSEC_API_URL,
    AWS_BRIDGE_API_URL: import.meta.env.VITE_AWS_BRIDGE_API_URL,
    MONITOR_API_URL: import.meta.env.VITE_MONITOR_API_URL,
    host: 'localhost'
  };
}; 