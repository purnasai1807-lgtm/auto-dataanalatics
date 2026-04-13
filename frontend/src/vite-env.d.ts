interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WS_HOST?: string;
  readonly VITE_SHOW_DEMO_HINTS?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
