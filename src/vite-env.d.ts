/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// For monaco-editor
declare module 'monaco-editor' {
  export = monaco;
}

// For navigator.deviceMemory
interface Navigator {
  deviceMemory?: number;
}