interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WS_HOST?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
declare module "react-plotly.js" {
  import { ComponentType } from "react";
  const Plot: ComponentType<Record<string, unknown>>;
  export default Plot;
}
