# Deploy na Vercel — Bot Tubarão

Este projeto roda no Lovable usando **Cloudflare Workers** como adapter (plugin `@lovable.dev/vite-tanstack-config`). Para publicar na Vercel você precisa fazer 4 ajustes simples **depois de exportar para o GitHub** (botão GitHub → Connect no topo do Lovable).

> ⚠️ Não faça esses ajustes dentro do Lovable — o preview vai parar de funcionar. Faça no seu fork/clone do GitHub.

## 1. Trocar o adapter de Cloudflare → Vercel

Edite `vite.config.ts`:

```ts
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
```

## 2. Remover arquivos específicos da Cloudflare

```bash
rm wrangler.jsonc
rm src/server.ts
bun remove @cloudflare/vite-plugin @lovable.dev/vite-tanstack-config
```

## 3. Variáveis de ambiente na Vercel

Em **Vercel → Project → Settings → Environment Variables** (Production + Preview):

| Nome | Valor |
|------|-------|
| `VITE_SUPABASE_URL` | URL do Lovable Cloud |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | publishable key |
| `VITE_SUPABASE_PROJECT_ID` | project id |
| `SUPABASE_URL` | mesma URL (server) |
| `SUPABASE_PUBLISHABLE_KEY` | mesma publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role (NÃO expor) |

Pegue os valores em **Lovable → Cloud → Backend → API**.

## 4. Deploy

```bash
npm i -g vercel
vercel link
vercel --prod
```

Ou conecte o repo no dashboard da Vercel — ela lê o `vercel.json` automaticamente.

---

### Alternativa mais rápida

Use **Publicar** aqui no Lovable (canto superior direito). Já está em `https://bot-tubarao.lovable.app` e suporta domínio próprio em *Project Settings → Domains*.
