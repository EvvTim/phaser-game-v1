/**
 * True only under the dev server (`bun run dev`). Vite replaces
 * `import.meta.env.DEV` with a literal at build time, so dev-only code
 * guarded by this is dropped from the production bundle.
 */
export const IS_DEV: boolean = import.meta.env.DEV;
