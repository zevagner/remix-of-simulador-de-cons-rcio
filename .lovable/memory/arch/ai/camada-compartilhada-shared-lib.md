---
name: AI Shared Layer
description: Camada compartilhada _shared/ + _lib/ por edge para CORS, rate limit, callAI com retry, validators (promessa/gancho), logging
type: feature
---
# Camada compartilhada de IA (Onda 6)

## Estrutura

- `scripts/_shared-edges/` — fonte de verdade: `cors.ts`, `rateLimit.ts`, `aiCall.ts`, `validators.ts`, `logging.ts`, `index.ts`.
- `supabase/functions/<edge>/_lib/` — cópia sincronizada (deployer Lovable não suporta `_shared/` cross-function).
- `scripts/sync-shared-edges.sh` — sincroniza `_shared/` → todos `_lib/` que já existem. Rodar manualmente após editar `_shared/`.

## API

```ts
import { getCorsHeaders, jsonResponse, isOriginAllowed } from "./_lib/cors.ts";
import { checkRateLimit, getRateLimitKey } from "./_lib/rateLimit.ts";
import { callAI, callAIWithRetry, AIError } from "./_lib/aiCall.ts";
import { GLOBAL_AI_RULES, isPromiseSafe, hasReplyHook, sanitizeText } from "./_lib/validators.ts";
import { logEdgeError } from "./_lib/logging.ts";
```

- `callAI({model, messages, tools?, tool_choice?, response_format?})` → `{ text, toolCall, raw }` ou lança `AIError` (codes: rate_limit/no_credits/config/gateway/empty).
- `callAIWithRetry({...callAI, validate, maxRetries})` — retry com feedback ao modelo se `validate()` retornar string.
- `GLOBAL_AI_RULES` — cláusula obrigatória anexada ao SYSTEM_PROMPT (proíbe promessa de contemplação/garantia).
- `isPromiseSafe(text)` — guardrail final no output (substitui por mensagem neutra se falhar).

## Status migração (Onda 6)

Migradas: bid-recommendation, sales-script, sales-copilot (streaming, sem callAI), sales-response (tool call), niche-storytelling, investment-storytelling.
Pendentes: phase-action (já tem CSAA próprio), generate-proposal, trigger-script, create-user, delete-user, update-user-email, share-proposal.

## Não fazer

- Não editar `_lib/*.ts` direto — edite em `_shared/` e rode `bash scripts/sync-shared-edges.sh`.
- Não recriar lógica de CORS/rate-limit/promessa em novas edges.
