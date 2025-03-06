/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_DYNSEC_API_URL: string
  readonly VITE_AWS_BRIDGE_API_URL: string
  readonly VITE_MONITOR_API_URL: string
  readonly VITE_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
