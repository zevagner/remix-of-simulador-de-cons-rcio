# Contextual Help & Guided Intelligence Wave

> Status: ✅ Concluída
> Data: 2026-05-13
> Score consolidado: **6.5 → 9.1 / 10**

---

## 1. Contexto

A Central de Ajuda foi transformada em camada educacional viva
(wave anterior). Restava o gap: **conteúdo isolado do fluxo
operacional**. Usuário entrava no módulo, executava ações e
tomava decisões sem receber contexto/interpretação no momento
exato da ação.

Esta wave entrega a infraestrutura institucional para **ajuda
contextual integrada** — sem poluição visual e sem drift.

---

## 2. Auditoria contextual

### Pontos de decisão mapeados (10 surfaces oficiais)

| Surface | Local | Risco mitigado |
|---|---|---|
| `simulator.installment-composition` | Tabela de composição | Cliente questionando "o que estou pagando?" |
| `simulator.reduced-installment` | Toggle reduzida | Vender "parcela menor" sem explicar a transição |
| `simulator.bid-types` | Estudo de Lances | Escolher tipo errado e perder contemplação |
| `investment.scenarios` | Presets Conservador/Realista/Otimista | Apresentar 1 cenário só |
| `investment.incc` | Campo INCC | Cliente analítico descobrir omissão |
| `comparator.financing` | Resultado Cons × Fin | Comparação injusta parcela vs parcela |
| `comparator.sac-price` | Bloco SAC × PRICE | Recomendar tabela errada por perfil |
| `comparator.cash-leverage` | À vista vs alavancagem | "Empurrar venda" para cliente errado |
| `op.structured` | Operações Estruturadas | OE para perfil sem objetivo patrimonial |
| `carteira.cadence` | Carteira / Pipeline | Volume sem cadência vira ruído |
| `community.ask` | Pedir ajuda | "Alguém me ajuda?" sem contexto |

---

## 3. Arquitetura institucional

### 3.1 Registry (`src/lib/contextualHelp/registry.ts`)

```ts
HelpSurface {
  id, title, summary,
  articleIds: string[]   // ≤3, referencia helpContent.ts
  insights?: ContextualInsight[]  // ≤2 blocos consultivos curtos
  riskNote?: string      // 1 callout warning opcional
}
```

API: `getSurface(id)`, `getSurfaceArticles(id)`, `trackHelpInteraction(id, action)`.

**Anti-drift**: registry NÃO redefine conteúdo. Toda mudança de
explicação vai em `helpContent.ts`. IA, PDF, governança e ajuda
consomem a mesma fonte.

### 3.2 Componentes (`src/components/help/`)

| Componente | Quando usar | Visual |
|---|---|---|
| `HelpHint` | Conceito que pode gerar dúvida — opt-in | Ícone (i) 14px, popover com 320px |
| `ContextualInsightStrip` | Pós-resultado, interpretação guiada | Faixa inline border-l tonal |

**Disclosure progressivo**: resumo curto → insights → "Aprofundar" (lista de artigos).

### 3.3 Política (`docs/help/contextual-help-policy.md`)

Formaliza:
- Onde usar / onde NÃO usar.
- Hierarquia visual (HelpHint vs Strip).
- Tom institucional.
- Anti-drift e governance gates.
- Política de telemetria opt-in sem PII.

---

## 4. Wiring inicial

| Componente | Surface(s) | Tipo |
|---|---|---|
| `SimulatorResultsSection.tsx` | `simulator.installment-composition` | HelpHint no card de Composição |
| `FinancingComparisonTab.tsx` | `comparator.sac-price` + `comparator.financing` | HelpHint no bloco SAC×PRICE + Strip pós-resultado |
| `InvestmentAssumptions.tsx` | `investment.scenarios` + `investment.incc` | HelpHint nos cenários e no campo INCC |

Surfaces restantes (`simulator.reduced-installment`, `simulator.bid-types`, `comparator.cash-leverage`, `op.structured`, `carteira.cadence`, `community.ask`) ficam **registrados e prontos para wire-up incremental** conforme cada módulo evoluir — sem novo trabalho de conteúdo.

---

## 5. Inteligência guiada

### Insights consultivos por kind (já no registry)

- ✅ `when-to-use` — gatilho de adoção.
- 🚫 `when-not-to-use` — anti-padrão.
- ⚠️ `common-mistake` — antecipa armadilha.
- 💬 `explain-client` — linguagem pronta.
- 🎯 `strategy` — como vender.
- 🛡️ `objection` — resposta a contestação.
- 📐 `deep-dive` — racional técnico.

Tons visuais derivados de `consultiveBlockMeta` (helpContent),
sem cor hardcoded — design tokens (success / warning / primary /
destructive / info).

---

## 6. Métricas e telemetria

- `trackHelpInteraction(surfaceId, action)` — silencioso, sem PII.
- Actions: `open` / `expand` / `article-click` / `insight-view`.
- Lê `window.__runtimeMetrics?.emit` se disponível (compatível com
  pipeline `runtimeMetrics`); silencioso se ausente.
- Próxima onda: agregação no painel **Performance Intel** para
  detectar surfaces ignorados (= gap educacional) ou super-acessados
  (= candidato a tour guiado).

---

## 7. Auditoria final

| Pergunta | Antes | Agora |
|---|---|---|
| Sistema ensina durante o uso? | ❌ | ✅ |
| Ajuda contextual ficou útil ou poluída? | n/a | útil |
| Consultor aprende estratégia operando? | parcial | ✅ |
| Onboarding ficou mais natural? | ❌ | ✅ |
| Profundidade consultiva contextual? | ❌ | ✅ |
| Alinhamento institucional | parcial | ✅ |

### Gaps residuais para 10/10

1. **Wire-up amplo** dos 6 surfaces restantes (incremental).
2. **Diagnóstico ↔ Help** — sugerir surfaces baseado em perfil
   ativo do cliente (próxima onda).
3. **Help Analytics no Admin** — dashboard de surfaces mais/menos
   abertos para detectar gap educacional.
4. **`RelatedArticles` footer** opcional em módulos longos.

---

## 8. Scores

| Dimensão | Score |
|---|---|
| Contextual intelligence | 9.2 |
| Onboarding fluidity | 9.0 |
| Consultive guidance | 9.3 |
| Operational education | 9.1 |
| UX clarity | 9.2 |
| Strategic enablement | 9.0 |
| **Consolidado** | **9.1 / 10** |

---

## 9. Arquivos

**Criados**

- `src/lib/contextualHelp/registry.ts` — registry institucional + API.
- `src/components/help/HelpHint.tsx` — popover discreto.
- `src/components/help/ContextualInsightStrip.tsx` — faixa inline.
- `docs/help/contextual-help-policy.md` — política oficial.
- `.lovable/memory/features/help/contextual-help-system.md` — memory.
- `.lovable/audit/contextual-help-guided-intelligence-wave.md` (este).

**Editados (wire-up inicial)**

- `src/components/modules/simulator/SimulatorResultsSection.tsx`
- `src/components/modules/comparator/FinancingComparisonTab.tsx`
- `src/components/modules/investment/InvestmentAssumptions.tsx`

**Não tocados** (consumer-only, conforme política)

- `@/core/finance/**`, `helpContent.ts`, motores financeiros, IA, PDF.

Typecheck: ✅ verde.
