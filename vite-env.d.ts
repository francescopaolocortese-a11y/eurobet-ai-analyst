/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string
  readonly VITE_SPORTMONKS_API_TOKEN: string
  readonly VITE_FOOTBALL_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
