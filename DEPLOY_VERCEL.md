# Deploy na Vercel — Bot Tubarão

Tudo já está preparado. Siga os passos abaixo **depois de exportar para o GitHub**
(botão GitHub → Connect no canto superior do Lovable).

> ⚠️ **Não execute esses passos dentro do Lovable** — o preview vai parar de
> funcionar porque o ambiente Lovable depende do adapter Cloudflare.

---

## 1) Trocar o `vite.config.ts`

No seu repositório clonado, execute:

```bash
mv vite.config.ts vite.config.lovable.ts.bak
mv vite.config.vercel.ts vite.config.ts
```

## 2) Remover arquivos/pacotes específicos da Cloudflare

```bash
rm wrangler.jsonc
rm src/server.ts
npm uninstall @cloudflare/vite-plugin @lovable.dev/vite-tanstack-config
# ou: bun remove @cloudflare/vite-plugin @lovable.dev/vite-tanstack-config
```

(Opcional) ajuste `src/start.ts` para não importar nada de `src/server.ts`.
Se já não importa, nada a fazer.

## 3) Variáveis de ambiente na Vercel

Em **Vercel → Project → Settings → Environment Variables**
(Production + Preview + Development):

### Client-side (prefixo `VITE_`)
| Nome | Valor |
|------|-------|
| `VITE_SUPABASE_URL` | `https://cclcdiqwmqsjoqtabgmb.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbGNkaXF3bXFzam9xdGFiZ21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNzU4NzEsImV4cCI6MjA5Mzk1MTg3MX0.5WgqQcA1G-LW4yTJ1SYN0EjrG7PR3BESvn81r23zlrk` |
| `VITE_SUPABASE_PROJECT_ID` | `cclcdiqwmqsjoqtabgmb` |

### Server-side
| Nome | Valor |
|------|-------|
| `SUPABASE_URL` | `https://cclcdiqwmqsjoqtabgmb.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | (mesma anon key acima) |
| `SUPABASE_SERVICE_ROLE_KEY` | **pegue em Lovable → Cloud → Backend → API → service_role** (NUNCA exponha publicamente) |

## 4) Deploy

```bash
npm i -g vercel
vercel link
vercel --prod
```

Ou conecte o repo no dashboard da Vercel — ela lê o `vercel.json` automaticamente.

---

## Alternativa mais rápida

Publicar pelo Lovable (botão **Publicar** no canto superior direito).
Já está em: <https://bot-tubarao.lovable.app>
Suporta domínio próprio em *Project Settings → Domains*.