# Bot Tubarão V3

Assistente de análise técnica em tempo real com IA para trading.

## Tech Stack

- TanStack Start v1
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase
- TanStack Query
- TanStack Router
- shadcn/ui

## Deploy na Vercel

### Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Conta na [Supabase](https://supabase.com)
3. Node.js 18+

### Configuração

1. **Clone o repositório**
   ```bash
   git clone <seu-repositorio>
   cd bot-tubarao-v3
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   Crie um arquivo `.env.local` na raiz do projeto:
   ```env
   SUPABASE_URL=seu_supabase_url
   SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
   ```

4. **Deploy na Vercel**
   ```bash
   vercel
   ```

### Configuração do Supabase

1. Crie um novo projeto no Supabase
2. Execute as migrações em `supabase/migrations/`
3. Configure as variáveis de ambiente no dashboard da Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Scripts

- `npm run dev` - Iniciar desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Visualizar build

## Estrutura do Projeto

```
src/
├── components/          # Componentes UI
├── hooks/              # Custom hooks
├── integrations/       # Integrações (Supabase)
├── lib/               # Utilitários e funções
├── routes/            # Rotas do TanStack Router
└── styles.css         # Estilos globais
```

## Licença

MIT