# Selene - AI Chat SaaS

## O que e este projeto

Base para aplicacoes de chat com IA. Inclui autenticacao, planos de uso (gratuito com limite diario, creditos pre-pagos, ilimitado mensal), pagamentos via Stripe e streaming de respostas.

## Stack e versoes importantes

- **Next.js 16** com App Router (nao Pages Router)
- **AI SDK v6** (`ai` package) — usa `UIMessage` com `parts` (nao `Message` com `content`), `useChat` vem de `@ai-sdk/react`, `sendMessage()` em vez de `handleSubmit()`, `status` em vez de `isLoading`
- **Drizzle ORM** com Neon PostgreSQL (driver `@neondatabase/serverless`)
- **Auth.js v5** (next-auth@beta) com JWT strategy
- **Stripe SDK v20** — API version `2026-01-28.clover`, `current_period_start/end` estao em `subscription.items.data[0]` (nao no subscription raiz)
- **Upstash Redis** para rate limiting com `@upstash/ratelimit`

## Arquitetura

### Rotas e grupos

- `(auth)` — paginas publicas de autenticacao
- `(chat)` — paginas protegidas do chat (layout com sidebar)
- `(billing)` — paginas de pricing (com SessionProvider)
- `api/` — API routes serverless

### Fluxo de uma mensagem

1. Usuario envia texto → `ChatInput` chama `sendMessage({ text })`
2. `DefaultChatTransport` faz POST para `/api/chat`
3. API route verifica auth, checa uso (`checkUsage`), salva mensagem no banco
4. `streamText` chama o provider de IA com streaming
5. `onFinish` salva resposta do assistant e debita creditos
6. Response via `toUIMessageStreamResponse()`

### Fluxo de pagamento

1. Usuario clica em pacote na `/pricing`
2. POST para `/api/credits/purchase` com `packageId`
3. API cria Stripe Checkout Session (payment ou subscription)
4. Redirect para Stripe
5. Apos pagamento, Stripe envia webhook para `/api/webhooks/stripe`
6. Webhook credita saldo ou ativa plano unlimited

### Controle de uso por plano

- **free**: `Ratelimit.fixedWindow` do Upstash (limite por dia)
- **credits**: verifica `creditBalance` do usuario no banco, debita apos resposta
- **unlimited**: passa direto

## Convencoes de codigo

- TypeScript strict mode
- Imports com alias `@/*` apontando para `src/*`
- Componentes client-side marcados com `"use client"`
- Server components sao o default (sem diretiva)
- CSS com Tailwind, cores customizadas definidas em `globals.css` no `@theme`
- Utilitario `cn()` (clsx + tailwind-merge) para classes condicionais

## Arquivos-chave para customizacao

| Arquivo | O que configurar |
|---|---|
| `src/lib/billing/plans.ts` | Nomes dos planos, pacotes de creditos, precos, custo por mensagem |
| `src/lib/rate-limit/index.ts` | Limite diario do plano gratuito |
| `src/lib/ai/provider.ts` | Modelo de IA, system prompt |
| `src/lib/billing/stripe.ts` | Metodos de pagamento, URLs de redirect |
| `src/lib/auth.ts` | Providers de autenticacao |
| `src/app/globals.css` | Cores do tema |
| `src/lib/db/schema.ts` | Schema do banco de dados |

## Banco de dados

Schema em `src/lib/db/schema.ts`. Tabelas:

- `users` — plano, saldo de creditos, uso diario
- `accounts` / `sessions` / `verification_tokens` — Auth.js
- `conversations` — conversas do chat
- `messages` — mensagens (role: user/assistant/system, content, tokens_used)
- `transactions` — compras e uso de creditos
- `subscriptions` — assinaturas Stripe ativas

Para alterar o schema: edite `schema.ts` e rode `npm run db:push`.

## Comandos uteis

```bash
npm run dev              # dev server
npm run build            # build producao
npm run db:push          # sincronizar schema
npm run db:studio        # visualizar banco
npx tsc --noEmit         # type check
```

## Cuidados

- Variaveis com `NEXT_PUBLIC_` sao expostas no client — nunca colocar secrets nelas
- O webhook do Stripe (`/api/webhooks/stripe`) precisa receber o body raw (nao JSON parsed) para validar a assinatura
- Rate limiting do plano free e por user ID no Redis, reseta automaticamente a cada 24h
- O `STRIPE_WEBHOOK_SECRET` esta vazio em dev — configure para producao
- PIX e boleto precisam ser ativados no Stripe Dashboard antes de usar
