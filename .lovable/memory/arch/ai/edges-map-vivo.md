---
name: AI Edges Map (documentação viva)
description: Tabela de responsabilidades, overlaps, modelos, caches e rate limits de todas as edges IA. Atualizar ao adicionar/remover edge.
type: reference
---

Documento principal: `.lovable/audit/ai-edges-map.md`

Resumo:
- Fonte da verdade compartilhada: `scripts/_shared-edges/` (cors, rateLimit, aiCall, validators, logging, promptFragments).
- Sync para `_lib/`: `bash scripts/sync-shared-edges.sh` após editar `_shared/`.
- Espelho client-side dos validators: `src/utils/aiValidators.ts` (testes em `src/test/aiInvariants.test.ts`).
- Painel: Admin → Performance IA (TTFT/abandono/cache hit/bid híbrido).

Overlaps mapeados:
- sales-script (abordagem) × phase-action (fase do funil) × trigger-script (gatilho isolado) — escopos distintos, nunca combinar.
- sales-copilot (vendas) × module-copilot (dica genérica do header) — escopos distintos.
- investment-storytelling × niche-storytelling — nunca chamar ambos no mesmo momento.

Procedimento nova edge IA:
1. Criar `_lib/` importando de `_shared/`.
2. SYSTEM_PROMPT = `GLOBAL_AI_RULES` + fragmentos de `promptFragments.ts`.
3. Telemetria obrigatória: `ai_ttft`, `ai_total_time`, `ai_abandon` (cliente) + `ai_call` (servidor).
4. Atualizar tabela em `.lovable/audit/ai-edges-map.md`.
5. Cobrir invariantes em `src/test/aiInvariants.test.ts` se for narrativa de venda.
