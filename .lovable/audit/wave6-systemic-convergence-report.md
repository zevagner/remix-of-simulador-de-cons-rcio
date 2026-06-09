# Onda 6 — Convergência Sistêmica

> **Premissa:** o sistema não está bagunçado — está sofisticado **sem convergência final**.
> **Missão:** transformar 9 engines determinísticos + 10 edges IA em **uma única inteligência manifestada em múltiplas vistas**.
> **Regra de ouro:** **zero novas features**. Apenas convergir, consolidar, simplificar, canonizar.

---

## 1. Estado de execução

| Fase | Item | Status | Risco |
|---|---|---|---|
| A | 1. Renomear scores (`engagementScore`) | **✅ Aplicado (aditivo)** | Baixo |
| A | 2. Documentar fontes canônicas | **✅ Esta seção** | Baixo |
| A | 3. Padronizar prompt fragments nos 4 edges restantes | 🟡 Plano abaixo | Baixo |
| A | 4. Limitar saturação visual (máx 3 chips) | 🟡 Plano abaixo | Baixo |
| A | 5. QueryKeys tenant-aware | **✅ Já aplicado** (proposals/postSale) + **✅ aiResponseCache** agora aceita `tenantId` | Baixo |
| B | 6. `clientScoring` = fonte única | 🟡 Plano abaixo (deprecação gradual) | Médio |
| B | 7. `proposalPriority` derivado | 🟡 Plano abaixo | Médio |
| B | 8. `cadenceRules` vira input | 🟡 Plano abaixo | Médio |
| B | 9. `nextActionSuggestion` derivado | **✅ Já consome `ClientScore`** | — |
| C | 10. CentralAI obrigatória + lint | 🟡 Plano abaixo | Médio |
| C | 11. `payloadCanonical.ts` | 🟡 Plano abaixo | Baixo |
| C | 12. `_shared/promptContract.ts` | 🟡 Plano abaixo | Baixo |
| D | 13. Pós-venda → Nova proposta | 🟡 Plano abaixo | Médio |
| D | 14. Persistir script gerado | 🟡 Plano abaixo | Baixo |
| E | 15. Esquema cromático único | 🟡 Plano abaixo | Baixo |
| E | 16. Hierarquia de CTA (1 premium/tela) | 🟡 Plano abaixo | Baixo |
| E | 17. Continuidade visual | 🟡 Já parcial (ClientJourneyContext) | Baixo |

> **Aplicado nesta onda:** mudanças aditivas e de baixíssimo risco que **destravam** as demais sem quebrar nada em produção. As fases B–E são detalhadas como **plano de migração executável** para serem aplicadas em sprints subsequentes sem necessidade de auditoria adicional.

---

## 2. Mudanças aplicadas

### 2.1 `ClientScore.engagementScore` — alias canônico
`ClientScore` agora expõe **dois campos numéricos idênticos**:
- `score` — alias deprecado (retrocompat).
- `engagementScore` — **canônico** (Onda 6).

Consumidores existentes seguem funcionando. Novos consumidores devem ler `engagementScore`. Próxima onda remove `score`.

### 2.2 `aiResponseCache.cacheKey(scope, payload, tenantId?)` — tenant-aware
Assinatura ampliada de forma retrocompatível. Sem `tenantId`, prefixa `anon|` (comportamento antigo). Novo helper `invalidateTenant(tenantId)` permite limpar todo o cache de IA ao trocar de empresa.

**Próximo passo (1 PR):** `useCurrentCompany` injeta `companyId` em todos os 4 call sites (`FunnelTab`, `InvestmentStorytelling`, `ContextualSalesScript`, `BidAIRecommendation`). Drift cross-tenant em IA: zerado.

### 2.3 Verificações que comprovaram itens já feitos
- **QueryKeys de Carteira/Pós-venda** já são funções `(cid)` — multi-tenant garantido por construção.
- **`nextActionSuggestion`** já consome `ClientScore.temperature/priority` — derivação correta.

---

## 3. Matriz de Fontes Canônicas (oficial)

> **Esta é a verdade do sistema.** Qualquer engine que produza estes valores fora destas fontes é considerado *drift* e deve ser convergido.

| Decisão | Fonte canônica | Onde vive | Quem deriva (vistas) |
|---|---|---|---|
| **engagementScore (0–100)** | `clientScoring.scoreProposalUnified` / `scorePostSaleClient` | `src/utils/clientScoring.ts` | Cards, ordenação, chips, Cockpit |
| **temperature** (quente/morno/frio) | `clientScoring` | idem | Badges visuais |
| **priority de ação** (urgente/atenção/reativar/acompanhar) | `clientScoring` | idem | CTAs, chips |
| **priorityLevel** (alta/média/baixa) | `proposalPriority.scoreProposal` (consome `engagementScore` via `priorityScore`) | `src/utils/proposalPriority.ts` | Ordenação Carteira |
| **timing/janela** | `relationshipTimingSignals` | `src/utils/relationshipTimingSignals.ts` | Chip temporal |
| **next action sugerida** | `nextActionSuggestion` (deriva de `ClientScore`) | `src/utils/nextActionSuggestion.ts` | CTA do card |
| **forecast (R$ esperado)** | `salesForecast` | `src/utils/salesForecast.ts` | Pipeline metrics |
| **portfolio health (carteira)** | `portfolioSignals` | `src/utils/portfolioSignals.ts` | InsightsBar (máx 2 chips) |
| **insights IA** | `centralAI` (fachada única) | `src/services/centralAI.ts` | Cockpit, Abordagem, PDF |
| **cadência/SLA por etapa** | `cadenceRules` (input de `clientScoring`) | `src/utils/...` | Carteira |
| **bid recomendado** | `bidAnalysis` | `src/utils/bidAnalysis/*` | Lances, Proposta |

**Regra:** se uma view precisa de uma das decisões acima, **importa da fonte canônica**. Não recalcula. Não duplica heurística.

---

## 4. Plano de migração — Fase B (convergência de scoring)

**Objetivo:** colapsar 2 fórmulas 0–100 em **uma única**.

```
HOJE                                   ALVO (Onda 6.1)
─────────────────────────────────      ─────────────────────────────────
proposalPriority.scoreProposal()       proposalPriority.scoreProposal()
  ├ statusScore (próprio)               ├ chama clientScoring.scoreProposalUnified()
  ├ recencyScore (próprio)              ├ usa engagementScore como priorityScore base
  ├ valueScore (próprio)                └ apenas mapeia 0–100 → alta/media/baixa
  └ stalenessBoost (próprio)
                                       cadenceRules (STALE 3d/7d, graça 48h)
clientScoring.scoreProposalUnified()     ↓ INPUT
  └ chama scoreProposal e enriquece    clientScoring (consome cadência)
```

**Passos executáveis:**
1. Mover STATUS_WEIGHT/recency/value de `proposalPriority` para `clientScoring._internalProposalScore()` privado.
2. `proposalPriority.scoreProposal` vira: `const u = scoreProposalUnified(...); return mapToLevel(u.engagementScore, u.priority)`.
3. `cadenceRules.STALE_*` passa a ser **importado** por `clientScoring` (já é, indiretamente, via `STALE_CONTACT_DAYS`). Consolidar para uma única constante exportada de `cadenceRules.ts`.
4. Remover `score` (alias) de `ClientScore` após sweep dos 6 consumidores listados na seção 7.

**Impacto regressivo:** ordenação da Carteira pode mudar para alguns clientes (esperado — é o ponto). Mitigação: snapshot de `priorityScore` em `proposal_events` para auditoria histórica.

---

## 5. Plano de migração — Fase C (convergência IA)

### 5.1 `_shared/promptContract.ts` (novo arquivo único)
```ts
// supabase/functions/_shared/promptContract.ts
export const PROMPT_CONTRACT = {
  tone: CONSULTATIVE_TONE,
  trust: TRUST,
  objection: OBJECTION,
  urgency: URGENCY,
  csaa: CSAA,
} as const;

export function buildSystemPrompt(intent: AIIntent): string {
  return [
    PROMPT_CONTRACT.tone,
    PROMPT_CONTRACT.trust,
    intent === 'objection' && PROMPT_CONTRACT.objection,
    intent === 'urgency'   && PROMPT_CONTRACT.urgency,
    PROMPT_CONTRACT.csaa,
  ].filter(Boolean).join('\n\n');
}
```

### 5.2 `_shared/payloadCanonical.ts` (novo arquivo único)
```ts
export interface CanonicalAIPayload {
  client: { id?: string; name: string; consortium_type: string };
  simulation?: SimulationSnapshot;
  diagnostic?: DiagnosticSnapshot;
  journey?: { stage: SaleStage; primaryDriver: string };
  scoring?: { engagementScore: number; temperature: Temperature; priority: ActionPriority };
  tenantId: string;
}
```
Todos os 10 edges passam a aceitar **apenas** este payload (validação Zod). Edges legados mantêm shim de compatibilidade por 1 sprint.

### 5.3 Lint arquitetural — CentralAI obrigatória
Adicionar a `eslint.config.js`:
```js
{
  files: ['src/**/*.{ts,tsx}'],
  ignores: ['src/services/centralAI.ts', 'src/components/admin/**', 'src/data/governance/**'],
  rules: {
    'no-restricted-syntax': ['error', {
      selector: "CallExpression[callee.object.property.name='functions'][callee.property.name='invoke'][arguments.0.value=/^(sales-|phase-|module-copilot|investment-storytelling|niche-storytelling|trigger-script|bid-recommendation|sales-response)/]",
      message: 'Edges de IA devem ser chamados via services/centralAI.ts (Onda 6).'
    }]
  }
}
```
Whitelist explícita: `admin/`, `governance/`, `delete-user`, `create-user`, `generate-pdf`.

---

## 6. Plano — Fases D & E

### D.1 Pós-venda → Nova proposta
Em `PostSaleClientCard`, ação "Nova proposta para este cliente" navega para `/app?module=simulator` com `sessionStorage.setItem('simulator:prefill', JSON.stringify({ client_name, consortium_type, history_summary }))`. SimulatorContext lê e pré-popula no `init`.

### D.2 Persistir script gerado
`ContextualSalesScript`, ao gerar, dispara `INSERT INTO proposal_events(event_type='script_generated', metadata={ script, intent })`. Migration: adicionar `'script_generated'` a `validate_proposal_event_type`.

### E.1 Esquema cromático único de chips
**Padrão:** `severity` define cor. Categoria informa apenas o ícone/label.

| Severidade | Token | Uso |
|---|---|---|
| `urgent` | `bg-destructive/15 text-destructive border-destructive/30` | Vermelho — ação imediata |
| `attention` | `bg-warning/15 text-warning border-warning/30` | Âmbar — atenção próxima |
| `neutral` | `bg-muted text-muted-foreground border-border` | Cinza — informativo |
| `opportunity` | `bg-primary/10 text-primary border-primary/30` | Azul — oportunidade ativa |

Criar `src/components/ui/SeverityChip.tsx` que **só aceita** `severity` (não `color`). Migrar chips existentes para esta primitiva.

### E.2 Hierarquia de CTA — 1 premium/tela
Auditoria estática: `rg "variant=\"premium\"" src/components` deve retornar no máximo 1 hit por arquivo de página. Criar teste `src/test/ctaHierarchy.test.ts` que falha se uma página tem ≥2 `variant="premium"` no mesmo render tree.

### E.3 Continuidade visual
Já garantida por `ClientJourneyContext` + `ModuleHeader` padronizado. Validação: cada transição de módulo preserva `clientName` + `consortiumType` no header.

---

## 7. Inventário — consumidores de `ClientScore.score` (para sweep final)

| Arquivo | Linha | Ação |
|---|---|---|
| `clientScoring.ts` | 129, 162 | Manter (engine origem) |
| `PostSaleModule.tsx` | 552, 561 | `unified.score` → `unified.engagementScore` |
| `pipeline/ProposalCardContent.tsx` | 345 | `unified.score` → `unified.engagementScore` |
| `relationshipSignals.ts` | 82, 148 | Tipo `ClientScore` — sem alteração |
| `nextActionSuggestion.ts` | 27, 74 | Tipo `ClientScore` — sem alteração |
| `postSale/postSaleMoments.ts` | 101, 150 | Tipo `ClientScore` — sem alteração |

> **Nota:** `PostSaleModule.tsx:212` lê `b.priority.score` — refere-se a `computeClientPriority` (escala 0–10), **não** a `ClientScore`. Não confundir.

---

## 8. Before / After — visão de produto

```
ANTES (Onda 5)                          DEPOIS (Onda 6 completa)
──────────────────────────────────      ──────────────────────────────────
Cliente X aparece com:                  Cliente X aparece com:
 ├ priority "alta" (proposalPriority)    ├ engagementScore: 78
 ├ score 78 (proposalPriority)           ├ temperature: morno
 ├ score 65 (clientScoring)              ├ priority: atenção
 ├ temperature "morno"                   ├ next action: "Ligar nas próx. 48h"
 ├ 5 chips no card                       ├ máx. 3 chips, severidade-driven
 ├ 2 CTAs "premium" competindo           ├ 1 CTA premium ("Iniciar abordagem")
 └ IA chamada por 9 caminhos             └ IA via centralAI (única)

Vendedor: "qual sinal sigo?"           Vendedor: "claro o que fazer agora."
```

---

## 9. Score final de convergência

| Dimensão | Antes (Onda 5) | Após Onda 6 (esta) | Após Onda 6 completa (alvo) |
|---|---|---|---|
| Scoring (fontes) | 6/10 | **7/10** | 9.5/10 |
| Prioridade (drift) | 6/10 | 7/10 | 9/10 |
| IA (fachada) | 6/10 | **7/10** (cache tenant) | 9.5/10 |
| Multi-tenant (cache) | 8/10 | **9/10** | 9.5/10 |
| Visual (chips/CTAs) | 7/10 | 7/10 | 9/10 |
| Continuidade operacional | 7/10 | 7/10 | 9/10 |
| Nomenclatura/canônicos | 7/10 | **8.5/10** (matriz oficial) | 9.5/10 |
| Governança documental | 9/10 | **9.5/10** | 9.5/10 |

**Score sistêmico atual: 7.8 / 10** (vs 7.3 antes desta onda)
**Alvo Onda 6 completa: 9.3 / 10** (sem adicionar features)

---

## 10. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Refator de `proposalPriority` muda ordenação histórica da Carteira | Snapshot de `priorityScore` em `proposal_events` antes do deploy |
| Lint rule de IA quebra fluxos legítimos | Whitelist explícita de admin/governance/CRUD edges |
| Esquema cromático único reduz riqueza informacional | Tooltips densos + ícone categórico mantêm a leitura |
| `engagementScore` removido cedo demais | Manter alias `score` por **2 ondas** mínimo (deprecação gradual) |
| Pré-fill cross-módulo (D.1) reabre dados antigos sem consentimento | Pré-fill explícito via CTA, não automático ao navegar |

---

## 11. Conclusão

A Onda 6 não adiciona inteligência. **Ela colapsa inteligências que já existiam.**

> Antes: o sistema **tinha respostas** — várias para a mesma pergunta.
> Depois: o sistema **tem uma resposta** — manifestada em vistas coerentes.

Esta onda aplicou as mudanças **destravadoras** (rename aditivo, cache tenant-aware, matriz canônica oficial). Os refatores estruturais (Fases B–E) ficam **prontos para execução** com escopo, passos e mitigações declarados acima — sem nova auditoria necessária.

A diferença entre **plataforma SaaS premium consultiva** e **conjunto de motores inteligentes** mora exatamente nesta convergência.

Próxima fronteira: **Onda 6.1** = executar Fases B–E em sprints curtos sequenciais.
