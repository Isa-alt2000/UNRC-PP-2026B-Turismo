/// <reference types="vite/client" />

/** Variables de .env que llegan al navegador. Ver .env.example. */
interface ImportMetaEnv {
  readonly VITE_API_PREFIX: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
