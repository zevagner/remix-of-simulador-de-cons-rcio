---
name: Padronização global de IAs
description: Regras unificadas aplicadas a todas as edges de IA (bid-recommendation, generate-proposal, sales-copilot, sales-response)
type: preference
---

Todas as edges de IA do sistema seguem o mesmo padrão:

**Rate limit por user_id (fallback IP)** — `getRateLimitKey(req)` extrai `sub` do JWT; se ausente, usa `x-forwarded-for`. Resolve compartilhamento de IP em rede CAIXA. Limites: bid-recommendation 20/min, generate-proposal 10/min, sales-copilot 10/min, sales-response 15/min.

**Regras globais no SYSTEM_PROMPT** (todas as 4 edges):
- NUNCA prometer contemplação, retorno ou resultado garantido. Usar "tende a", "histórico mostra", "aumenta a chance".
- NUNCA inventar números — apenas dados do payload.
- Estrutura CSAA: Classificar situação → Contexto → Recomendar ação → Ajuste numérico (quando aplicável).

**Telemetria**: `trackAICall(req)` fire-and-forget grava `analytics_events { event_name: 'ai_call', module }` para auditoria de uso.

**Why:** Evita risco regulatório (promessa de contemplação), garante coerência entre IAs e elimina rate-limit falso-positivo em rede corporativa.

**How to apply:** Ao adicionar nova edge function de IA, copiar o bloco `getRateLimitKey` + cláusula "REGRAS GLOBAIS DE IA" no system prompt + `trackAICall` no início do handler.
