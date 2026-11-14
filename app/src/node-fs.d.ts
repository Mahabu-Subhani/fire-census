// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// The two Node functions vite.config.ts uses, so the type check needs no @types/node.
declare module "node:fs" {
  export function readdirSync(path: string | URL): string[];
  export function statSync(path: string | URL): { size: number };
}
