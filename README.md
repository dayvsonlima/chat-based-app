# Selene

Base para aplicacoes de chat com IA que inclui autenticacao, sistema de planos (gratuito, creditos pre-pagos e ilimitado), pagamentos via Stripe e rate limiting.

## Stack

- **Framework:** Next.js 16 (App Router, TypeScript, Tailwind CSS)
- **Banco de dados:** PostgreSQL via Neon (serverless)
- **ORM:** Drizzle ORM
- **Autenticacao:** Auth.js v5 (GitHub, Google)
- **Pagamentos:** Stripe (cartao, PIX, boleto)
- **Rate limiting:** Upstash Redis
- **IA:** Vercel AI SDK v6 (OpenAI, Anthropic)
- **Deploy:** Vercel

## Setup

### 1. Clonar e instalar

```bash
git clone git@github.com:dayvsonlima/chat-based-app.git
cd chat-based-app
npm install
```

### 2. Configurar variaveis de ambiente

```bash
cp .env.example .env
```

Preencha cada variavel no `.env`:

| Variavel | Onde obter |
|---|---|
| `DATABASE_URL` | [neon.tech](https://neon.tech) — crie um projeto e copie a connection string |
| `AUTH_SECRET` | Gere com `openssl rand -base64 32` |
| `AUTH_GITHUB_ID/SECRET` | [github.com/settings/developers](https://github.com/settings/developers) — callback: `http://localhost:3000/api/auth/callback/github` |
| `AUTH_GOOGLE_ID/SECRET` | [console.cloud.google.com](https://console.cloud.google.com) — callback: `http://localhost:3000/api/auth/callback/google` |
| `UPSTASH_REDIS_REST_URL/TOKEN` | [console.upstash.com](https://console.upstash.com) — crie um database Redis |
| `STRIPE_SECRET_KEY` | [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Mesma pagina acima |
| `STRIPE_PRICE_*` | Crie produtos/precos no Stripe (veja abaixo) |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) (opcional) |

### 3. Criar tabelas no banco

```bash
npm run db:push
```

### 4. Criar produtos no Stripe

Crie no [Stripe Dashboard](https://dashboard.stripe.com/products) ou via API:

- **Produto "Creditos"** com 3 precos one-time em BRL (ex: R$9,90 / R$39,90 / R$99,90)
- **Produto "Ilimitado"** com 1 preco recorrente mensal em BRL (ex: R$49,90/mes)

Copie os Price IDs para o `.env`.

### 5. Rodar

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Customizacao

### Planos e precos

Edite `src/lib/billing/plans.ts`:

```ts
export const PLANS = {
  free: {
    name: "Gratuito",
    description: "20 mensagens por dia",
    dailyLimit: 20,
  },
  credits: {
    packages: [
      { id: "small", credits: 100, price: 990, label: "100 creditos", priceLabel: "R$ 9,90" },
      // adicione ou remova pacotes
    ],
  },
  unlimited: {
    price: 4990,
    priceLabel: "R$ 49,90/mes",
  },
};
```

O limite diario do plano gratuito e configurado em `src/lib/rate-limit/index.ts`:

```ts
limiter: Ratelimit.fixedWindow(20, "1d"),  // mude 20 para o limite desejado
```

### Provider de IA

Edite `src/lib/ai/provider.ts` para trocar modelo ou provider:

```ts
// OpenAI
export function getModel() {
  return openai("gpt-4o-mini");    // troque por "gpt-4o", "gpt-4-turbo", etc.
}

// Anthropic
export function getModel() {
  return anthropic("claude-sonnet-4-5-20250929");
}
```

O system prompt tambem esta nesse arquivo:

```ts
export const SYSTEM_PROMPT = `Seu prompt personalizado aqui.`;
```

### Custo por mensagem (creditos)

Em `src/lib/billing/plans.ts`:

```ts
export const CREDIT_COST_PER_MESSAGE = 1;  // quantos creditos por mensagem
```

Para cobrar por token em vez de por mensagem, edite `src/lib/billing/usage.ts` e `src/app/api/chat/route.ts`.

### Metodos de pagamento

Em `src/lib/billing/stripe.ts`, na funcao `createCheckoutSession`:

```ts
payment_method_types: ["card"],                  // so cartao
payment_method_types: ["card", "pix"],           // cartao + PIX
payment_method_types: ["card", "boleto", "pix"], // todos (ative no Stripe Dashboard primeiro)
```

### Tema e branding

- **Cores:** `src/app/globals.css` — edite as variaveis em `@theme`
- **Nome do app:** busque por "Selene" nos arquivos e substitua
- **Landing page:** `src/app/page.tsx`
- **Pagina de precos:** `src/app/(billing)/pricing/page.tsx`

### Autenticacao

Para adicionar ou remover providers, edite `src/lib/auth.ts`:

```ts
providers: [GitHub, Google],  // adicione Discord, Twitter, etc.
```

E atualize a pagina de login em `src/app/(auth)/login/page.tsx`.

## Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/login/          # Pagina de login
│   ├── (billing)/pricing/     # Pagina de planos
│   ├── (chat)/chat/           # Interface do chat
│   │   ├── page.tsx           # Nova conversa
│   │   └── [id]/page.tsx      # Conversa existente
│   ├── api/
│   │   ├── auth/              # Auth.js routes
│   │   ├── chat/              # Streaming de IA
│   │   ├── conversations/     # CRUD de conversas
│   │   ├── credits/purchase/  # Checkout Stripe
│   │   ├── user/plan/         # Info do plano do usuario
│   │   └── webhooks/stripe/   # Webhooks Stripe
│   ├── globals.css            # Tema (cores)
│   ├── layout.tsx             # Layout raiz
│   └── page.tsx               # Landing page
├── components/chat/           # Componentes do chat
├── lib/
│   ├── ai/provider.ts         # Configuracao do modelo de IA
│   ├── auth.ts                # Configuracao Auth.js
│   ├── billing/               # Planos, creditos, Stripe, uso
│   ├── db/                    # Schema e conexao Drizzle
│   └── rate-limit/            # Rate limiting Upstash
└── middleware.ts               # Protecao de rotas
```

## Scripts

| Comando | Descricao |
|---|---|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build de producao |
| `npm run db:push` | Sincroniza schema com o banco |
| `npm run db:generate` | Gera migration SQL |
| `npm run db:studio` | Abre Drizzle Studio (visual do banco) |

## Deploy na Vercel

1. Importe o repositorio no [vercel.com/new](https://vercel.com/new)
2. Adicione todas as variaveis de ambiente (mesmas do `.env`)
3. Atualize `NEXT_PUBLIC_APP_URL` para o dominio da Vercel
4. Atualize os callback URLs dos OAuth providers para o dominio de producao

## Webhooks Stripe (producao)

Para receber eventos de pagamento em producao:

1. No [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks), crie um endpoint apontando para `https://seu-dominio.vercel.app/api/webhooks/stripe`
2. Selecione os eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Copie o signing secret para `STRIPE_WEBHOOK_SECRET` no Vercel

## Licenca

MIT
