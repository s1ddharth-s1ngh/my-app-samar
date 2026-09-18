/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  /** The Postgres schema Ciclo lives in. Defaults to `samar` when unset. */
  readonly VITE_SUPABASE_SCHEMA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
