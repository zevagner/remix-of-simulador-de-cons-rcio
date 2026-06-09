---
name: Sales Script Contextual (perfil + estágio)
description: Edge sales-script + ContextualSalesScript em Abordagem e Proposta — combina primaryDriver (auto do diagnóstico, override) e saleStage (sugerido pelo status, override) com dados reais da simulação para gerar argumento WhatsApp aplicando retórica/timeline/emoção, sem promessas.
type: feature
---

**Engine:** `src/utils/salesScript/engine.ts`
- `deriveClientProfile(diagnostic)` → `primaryDriver` (economia | seguranca | rapidez | liquidez | status | patrimonio). Prioridade declarada > urgência > objetivoPrincipal > clientObjective legado.
- `suggestSaleStage({ status, daysSinceLastContact })` → `saleStage` (primeiro_contato | follow_up | sumido | fechamento). `fechado/perdido` → fechamento; sem contato ≥7d → sumido; `prospeccao` → primeiro_contato; `em_avaliacao/proposta_ajustada` → fechamento; resto → follow_up.
- `SalesScriptPayload` é o contrato canônico enviado ao edge.

**Edge:** `supabase/functions/sales-script/index.ts`
- Padrão global: `getRateLimitKey` (user_id JWT, fallback IP), `trackAICall`, `SYSTEM_PROMPT` com cláusula "nunca prometer garantia" e estrutura CSAA aplicada ao WhatsApp.
- Técnicas instruídas (escolher 1-2 por mensagem): pergunta retórica, linha do tempo curta, emoção leve, comparação com aluguel/financiamento.
- 6 linhas máx, 1 emoji máx, sem markdown, sem saudação genérica.
- DRIVER_GUIDE + STAGE_GUIDE injetados no userPrompt (não duplicar no system).
- Modelo: `google/gemini-3-flash-preview`. Rate limit 12/min.

**UI:** `src/components/modules/objections/ContextualSalesScript.tsx`
- Reutilizável; `variant: 'card' | 'inline'`. Exibido em **Abordagem (aba Abordagem, topo)** e **Proposta (entre dados do cliente e tabs)**.
- Seletores de driver e stage com hint "Auto: motivo" quando bate com a sugestão.
- Botões: Gerar / Regenerar / Copiar / Enviar no WhatsApp (`#25D366`).

**Why:** Centraliza persuasão contextual (perfil + estágio) que antes ficava espalhada entre StorytellingCard, TriggersTab e templates. Substitui "frases genéricas" por scripts ancorados nos números reais e no momento da venda.

**How to apply:** Para usar em outro módulo (ex: PostSale), passar `suggestedStage` derivado do status pós-venda e `clientNameOverride`. Não duplicar regras de promessa no client — confiar no SYSTEM_PROMPT do edge.

**Eventos:** `sales_script_generated`, `sales_script_copied`, `sales_script_whatsapp` em `analyticsTracker.ts`.
