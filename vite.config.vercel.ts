// ============================================================================
// CONFIG PARA VERCEL — renomeie para vite.config.ts ao fazer deploy na Vercel
// (substitui o vite.config.ts atual que usa o adapter Cloudflare do Lovable)
// ============================================================================
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({ target: "vercel", customViteReactPlugin: true }),
    viteReact(),
  ],
});