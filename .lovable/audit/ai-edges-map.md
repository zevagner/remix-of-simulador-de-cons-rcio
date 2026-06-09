# Mapa de Edges IA — Responsabilidades, Consumers, Overlaps

Documento vivo. Atualize ao adicionar/remover edge ou alterar consumer.
Última revisão: 2026-05-07 (Onda Consolidação IA).

## Convenções

- **Tipo:** `narrativa` (texto pro cliente) | `decisão` (sugestão estruturada) | `híbrida` (determinístico + IA) | `infra` (sem IA).
- **Modelo padrão:** indicado em `index.ts`. Mudança = ADR.
- **Cache:** `aiResponseCache` (sessão, 15min) e/ou `storytellingCache` (persistente, 7d).

## Tabela de Responsabilidades

| Edge | Tipo | Modelo | Consumers | Faz | NÃO faz |
|---|---|---|---|---|---|
| **bid-recommendation** | híbrida | gemini-2.5-flash | `BidAIRecommendation` | Lógica determinística (compara avg, classifica zona) + IA traduz em narrativa 3-4 linhas | Não recalcula taxas. Não compara grupos. |
| **sales-copilot** | narrativa (stream) | gpt-5.2 | `AnalysisCopilot`, `useModuleCopilot` | Argumento de venda contextual com base na simulação do usuário | Não responde objeção do cliente final (use `sales-response`). Não classifica fase de funil. |
| **sales-response** | decisão+narrativa | gpt-5-mini | Pós-proposta (resposta do cliente) | Classifica resposta (dúvida/objeção/interesse/indecisão) + 3 sugestões de réplica | Não inicia abordagem. Não gera proposta. |
| **sales-script** | narrativa | gemini-2.5-flash | `ContextualSalesScript` (Abordagem/Proposta) | Script consultivo por `primaryDriver × saleStage × dados` | Não calcula nada. Não substitui copilot. |
| **phase-action** | decisão+narrativa (tool call) | gemini-2.5-flash | `FunnelTab` | Mensagem/pergunta/próximo passo POR FASE do funil (prospect, agard, aval...) | Não argumenta venda em geral (use sales-script). |
| **trigger-script** | narrativa | gemini-2.5-flash | Lib de gatilhos mentais | Texto de gatilho aplicado ao contexto do cliente | Não classifica gatilho. Lista vem de `objectionsLibrary`. |
| **module-copilot** | narrativa (stream) | gemini-2.5-flash | `useModuleCopilot` (genérico por módulo) | Dica curta contextual no header do módulo | Não substitui sales-copilot (vendas) nem analyses pesadas. |
| **investment-storytelling** | narrativa | gemini-2.5-flash | `InvestmentStorytelling` (cenários) | Narrativa de cenário de investimento (até 3 cenários comparados) | Não recalcula. Não recomenda compra. |
| **niche-storytelling** | narrativa | gemini-2.5-flash | Nichos consultivos (reforma etc.) | Narrativa específica do nicho | Não substitui storytelling de cenário. |
| **strategy-storytelling** | narrativa | gemini-3-flash-preview | `StrategyStorytellingPanel` (Wealth · biblioteca de estratégias) | Narrativa híbrida (3ª/1ª pessoa) por estratégia × cliente × simulação | Não recalcula. Não substitui investment-storytelling (cenário) nem niche-storytelling. |
| **generate-proposal** | narrativa | gemini-2.5-flash | `proposalGenerator` | Texto comercial da proposta (WhatsApp/PDF) | Não calcula. Não envia. |
| **share-proposal** | infra | — | `ProposalCard` | Token + edge function de compartilhamento | Sem IA. |
| **generate-pdf** | infra | — | `useGenerateProposalPdf` | Browserless render | Sem IA. |
| **create-user / delete-user / update-user-email** | infra | — | Admin | CRUD admin | Sem IA. |

## Overlaps Identificados (Risco de Drift)

1. **sales-script ↔ phase-action ↔ trigger-script** — três edges geram texto consultivo para vendas.
   - **Solução de governança:** `sales-script` = abordagem inicial; `phase-action` = ação POR FASE do funil; `trigger-script` = gatilho psicológico isolado. Nunca combinar dois numa mesma view.
   - **Sintoma se quebrar:** mesma frase aparece em 2 lugares diferentes da UI.
2. **sales-copilot ↔ module-copilot** — ambos são copilotos.
   - **Solução:** `sales-copilot` é exclusivo do fluxo de venda (Análise/Abordagem/Proposta). `module-copilot` é genérico (header de qualquer módulo, dicas curtas).
3. **investment-storytelling ↔ niche-storytelling** — ambos contam história.
   - **Solução:** scenarioId vs nicheId — nunca chamar os dois para o mesmo cliente no mesmo momento.

## Modelo padrão por tipo de edge

- **Stream / argumentação rica:** `gpt-5.2` (sales-copilot — protegido como vaca sagrada).
- **Classificação + 3 sugestões:** `gpt-5-mini` (sales-response).
- **Narrativa curta determinística:** `gemini-2.5-flash` (default para o resto).
- **Trocar modelo de qualquer edge requer benchmark documentado em `/mnt/documents/`.**

## Caches em uso

| Cache | Onde | TTL | Chave | Invalidação |
|---|---|---|---|---|
| `aiResponseCache` | `BidAIRecommendation`, `ContextualSalesScript`, `FunnelTab`, `InvestmentStorytelling` | 15 min sessão | hash(payload) | manual / refresh |
| `storytellingCache` | `InvestmentStorytelling` | 7 dias localStorage | scenarioId | refresh ({force:true}) |
| `proposal_pdf_cache` (DB) | `generate-pdf` | até proposal change | proposal_id | trigger SQL |

## Rate Limits

| Edge | Janela | Máx | Chave |
|---|---|---|---|
| bid-recommendation | 60s | 20 | user_id |
| generate-proposal | 60s | 10 | user_id |
| sales-copilot | 60s | 10 | user_id |
| sales-response | 60s | 15 | user_id |
| outros (default) | 60s | 20 | user_id |

## Telemetria mínima por edge

Toda edge IA deve disparar via cliente:
- `ai_ttft` (primeiro byte)
- `ai_total_time` (fim)
- `ai_abandon` (cancelamento/navigate)

E via servidor (`trackAICall`): evento `ai_call` em `analytics_events` com `module = <edge-name>`.

Painel: `Admin → Performance IA` (p50/p95, abandono, % lentos, tendência 7d).

## Como adicionar uma nova edge IA

1. Criar `supabase/functions/<nome>/index.ts` + pasta `_lib/`.
2. Importar **somente** de `./_lib/` (que vem de `_shared/`).
3. SYSTEM_PROMPT obrigatoriamente concatena `GLOBAL_AI_RULES` + fragmentos de `promptFragments.ts` aplicáveis.
4. Adicionar à tabela acima.
5. Cobrir com teste de invariante em `src/test/aiInvariants.test.ts` se for narrativa de venda.
6. Rodar `bash scripts/sync-shared-edges.sh`.
