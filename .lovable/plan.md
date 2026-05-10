# Plano — Bot Tubarão V3 (Reconstrução)

Vamos reconstruir o projeto em React (TanStack Start) com backend real (Lovable Cloud), mantendo a identidade visual "tubarão / cyber" mas com qualidade de produção. Como o escopo é grande, divido em **4 entregas**. Cada uma é testável sozinha.

---

## Entrega 1 — Fundação + Visual + Landing/Login

- Ativar **Lovable Cloud** (banco, auth, storage).
- Design system completo em `src/styles.css`: paleta dark "deep ocean" com acentos neon ciano/laranja, fontes Orbitron + Rajdhani + JetBrains Mono, gradientes, sombras e animações reutilizáveis (splash, glow, pulse, scanline).
- Splash screen + **landing/login** real:
  - Tabs Entrar / Criar conta com `supabase.auth` (email + senha).
  - Cadastro exige **código de ativação** válido (validado no servidor contra a tabela `activation_codes`).
  - Mensagens de erro claras, loading states, validação Zod.
- Tabela `profiles` com trigger de criação automática + RLS.

## Entrega 2 — Planos & Pagamento USDT manual

- Página `/planos` com os 3 cards (Básico / Pro / Elite) já existentes.
- Fluxo USDT manual:
  1. Usuário escolhe plano → recebe endereço da carteira USDT (TRC20) + valor + QR Code.
  2. Faz upload do **comprovante (hash da transação + screenshot)** via Storage.
  3. Cria registro em `payment_requests` (status `pending`).
- Painel admin `/admin` (rota protegida via tabela `user_roles` + função `has_role`) para aprovar/rejeitar pagamentos. Aprovar ativa o plano em `subscriptions` com data de validade.
- Acesso ao dashboard do bot exige assinatura ativa (verificada no server).

## Entrega 3 — Dashboard do Bot + Sinais Realistas

- Layout do dashboard: header com saldo do plano (dias restantes), seletor de ativo, painel de sinais ao vivo, histórico, configurações.
- **Sinais realistas** (não fake): server function busca candles reais de **Binance Spot API** (endpoint público `klines`, sem chave) para os ativos suportados, calcula indicadores técnicos clássicos no servidor — **EMA(9/21)**, **RSI(14)**, **MACD**, **Bollinger Bands**, **ATR** — e gera sinal `BUY/SELL/WAIT` com:
  - Score de confiança ponderado (0–100%) baseado em confluência dos indicadores.
  - Stop loss / take profit calculados a partir do ATR.
  - Timeframe selecionável (1m, 5m, 15m).
- Frontend faz polling a cada 15s via `useQuery`. Histórico de sinais persistido em `signals` (1 linha por geração, com resultado posterior preenchido por job — opcional na entrega 4).
- Sem promessas irreais: textos do app deixam claro que é assistente analítico, não garantia de lucro.

## Entrega 4 — Refinamentos

- Tracking de performance: marca cada sinal como `WIN/LOSS` baseado em movimento posterior; mostra winrate real do histórico.
- Notificações in-app (toast) quando sinal de alta confiança aparece.
- Página de perfil com troca de senha, histórico de pagamentos, status do plano.
- Polish: skeletons, empty states, mobile responsivo, SEO por rota.

---

## Detalhes técnicos

**Stack:** TanStack Start v1 + React 19 + Tailwind v4 + Lovable Cloud (Supabase under the hood). Sinais via `createServerFn` chamando Binance REST pública (sem secret).

**Tabelas (Entrega 1–2):**
```text
profiles            (id, name, email, created_at)
user_roles          (user_id, role)            -- enum: admin, user
activation_codes    (code, plan, used_by, used_at)
payment_requests    (id, user_id, plan, amount_usdt, tx_hash,
                     proof_url, status, reviewed_by, created_at)
subscriptions       (id, user_id, plan, started_at, expires_at, active)
signals             (id, user_id, asset, timeframe, action,
                     confidence, entry, sl, tp, indicators_json,
                     created_at, outcome)
```

**Segurança:** RLS em todas as tabelas; roles em tabela separada com `has_role()` SECURITY DEFINER (evita escalação). Service role apenas em server functions admin. Validação Zod em todo input.

**O que NÃO vamos fazer:** prometer ganhos, simular WhatsApp/Telegram do "suporte", colocar números de winrate fictícios na UI. Toda métrica vem de dados reais.

---

Posso começar pela **Entrega 1** assim que você aprovar. Quer ajustar algo (ex: trocar Binance por outra fonte, mudar moeda do pagamento, focar em outro ativo)?