// Vite replaces these at build time in the Worker environment too.
interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
/** Changes on every build; appended to entry script and stylesheet URLs as a cache key. */
declare const __BUILD_ID__: string;
