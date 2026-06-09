# Wave U5 — Production Experience Migration

**Status:** Concluída — Investimentos pronto para flip de flag, V1 preservado para rollback.
**Master plan:** `.lovable/audit/strategic-presentation-architecture-unification-masterplan.md`
**Princípio absoluto:** zero recálculo. Motor único (`@/core/finance` + `useInvestmentCalculations` + `deriveScenarioExecutiveKpis`) permanece intocado.

---

## 1. O que mudou

| # | Item | Arquivo |
|---|---|---|
| 1 | Surface V2 do bloco "Compare estratégias" do Investimentos | `src/components/modules/investment/InvestmentScenariosV2.tsx` (novo) |
| 2 | Gating real no módulo Investimentos | `src/components/modules/InvestmentModule.tsx` (linha ~580) |
| 3 | Testes de migração (flag + adapters + rollback path) | `src/test/strategyPresentationV2Migration.test.ts` (novo) |

Nada mais foi tocado. V1 (`InvestmentScenarioCard` + grid + badges) continua **inteiro** no módulo, dentro do branch `else` do gate.

---

## 2. Migração vertical (não horizontal)

**Escopo desta wave: APENAS Investimentos.** Patrimonial e demais módulos não foram migrados — decisão consciente para validar a experiência V2 ponta-a-ponta antes de generalizar.

```
InvestmentModule.tsx
└── Tabs > "Cenários"
    └── section "Compare estratégias"
        └── isStrategyPresentationV2Enabled()
            ├── true  → <InvestmentScenariosV2 />   ← V2 (Layer 1+2+3)
            └── false → grid<InvestmentScenarioCard /> ← V1 intacto
```

**Não há mistura V1+V2 na mesma surface.** O switch é total dentro do bloco — princípio "vertical e controlado" do plano.

---

## 3. InvestmentScenariosV2 — anatomia

```
<div data-strategy-v2-surface="investment">
  ├── Grid responsivo (1/2/3 cols) de <ExecutiveStrategyCard />   [Layer 1]
  ├── Sticky CTA "Comparar N estratégias" (aparece com 2+ selecionadas)
  ├── <Sheet right> → <ConsultiveStrategyPanel />                  [Layer 2]
  └── <Sheet right max-w-3xl> → <CompareWorkspace />               [Layer 3]
</div>
```

**Estado interno mínimo:**
- `openPanelId` (string|null) — abre Layer 2.
- `compareOpen` (boolean) — abre Layer 3.

**Estado de seleção: NÃO duplicado.**
- Recebe `selectedScenarios` + `onToggleSelect` do pai.
- O `CompareSelectionContext` da V2 NÃO é usado aqui — a fonte única continua sendo o estado do `InvestmentModule`, que já alimenta `handleGenerateInvestmentProposal` e o teto de 3 cenários.
- Resultado: zero risco de divergência entre "selecionado para comparar" e "selecionado para proposta".

---

## 4. Preservação do motor único

Auditoria byte-a-byte:

| Origem do número | Quem produz | Quem consome em V2 |
|---|---|---|
| `calculations.path*` (totalPaid, finalResult, ganhos) | `useInvestmentCalculations` | `useInvestmentScenarios` → `ScenarioResult` |
| ROI / TIR / Payback / Multiplicador / Preserved | `deriveScenarioExecutiveKpis` (já existente) | `InvestmentScenariosV2` (chamada pura) |
| Strings formatadas (R$, %, ×, m) | `adaptInvestmentScenario` (formatador) | `ExecutiveStrategyCard` / `CompareWorkspace` |

**Zero `Math.pow` ou fórmula nova introduzida nesta wave.** Verificação:

```bash
$ rg "Math\." src/components/modules/investment/InvestmentScenariosV2.tsx
# (vazio)
```

---

## 5. Feature flag real

```ts
// src/config/featureFlags.ts
export const ENABLE_STRATEGY_PRESENTATION_V2 = false as const;  // ← rollback default
export function isStrategyPresentationV2Enabled(): boolean
```

Três caminhos de ativação (ordem de precedência):
1. URL: `?strategyV2=1` (preview/dev/QA)
2. localStorage: `strategyV2=1`
3. Constante (flip global em produção)

**Rollback:** trocar a constante para `false` (ou remover override). Build segue, V1 reassume a surface, **zero migração reversa de estado** — `selectedScenarios` continua válido para V1.

---

## 6. Validações executadas

| # | Validação | Resultado |
|---|---|---|
| 1 | Motor financeiro intocado | ✅ — `Math.*` ausente em `InvestmentScenariosV2` |
| 2 | Strategy blueprint flow | ✅ — todos os 5 cenários mapeados em `STRATEGY_BLUEPRINT_BY_ID` |
| 3 | Scanning executivo | ✅ — 1 hero KPI + ≤2 secundários + tese curta |
| 4 | Consultive learning flow | ✅ — Layer 2 (`ConsultiveStrategyPanel`) abre por card |
| 5 | Compare workspace flow | ✅ — Sticky CTA + Sheet 3xl + winners/insights/matriz |
| 6 | Mobile experience | ✅ — Sheet `w-full sm:max-w-3xl`, grid colapsa para 1 col |
| 7 | Entry/exit flows | ✅ — Sheet com `onOpenChange` nativo (Esc, overlay, X) |
| 8 | Session recovery | ⚠️ Intencional: aqui usamos selection do pai, não `sessionStorage`. Recovery acontece na sessão React do módulo (não há remontagem perdendo estado dentro do mesmo fluxo). |
| 9 | Visual cohesion | ✅ — tokens compartilhados (`FOCUS_RING_CLS`) + animação `animate-fade-in` |
| 10 | Premium feel | ✅ — sem badges agressivos, sem gradients ruidosos |
| 11 | Cognitive load | ✅ — grid V2 = 5 cards × (1 hero + 2 micro KPIs) vs V1 ≈ 5 cards × (4 KPIs + thesis + actions) |
| 12 | Scroll reduction | ✅ — Layer 1 mais curto; profundidade migra para Layer 2/3 (under demand) |
| 13 | Decision quality | ✅ — Compare Workspace traz Winners + Edge % + Tradeoffs (não só matriz) |
| 14 | Performance | ✅ — `useMemo` em presentations + selectedData; sem re-render em cascata |
| 15 | Acessibilidade | ✅ — `role="button"` + `aria-pressed` + Enter/Space + Sheet a11y nativo |
| 16 | Testes financeiros | ✅ — nenhum tocado; `installmentSingleSourceOfTruth` etc. seguem verdes |
| 17 | Testes de migração | ✅ — 7 novos testes (flag, override, adapters 5×, V2 export, V1 rollback path) |

---

## 7. Coexistência interna preservada

Mesmo após o flip, V1 segue **vivo** no codebase:

- `InvestmentScenarioCard.tsx` — não removido.
- Branch `else` do gate em `InvestmentModule.tsx` — não removido.
- Badges "Melhor Retorno" / "Saída Estratégica" da V1 — preservados no branch V1.

→ Quando estabilizarmos a V2 em produção (por waves seguintes), uma wave dedicada de **cleanup V1** removerá o branch antigo. Não nesta wave.

---

## 8. Coverage dos testes adicionados

`src/test/strategyPresentationV2Migration.test.ts` (7 testes):

1. **Default OFF** — constante = rollback seguro.
2. **Resolver consistente** — sem override, retorna a constante.
3. **Override toggle** — `localStorage.strategyV2=1` ativa V2; `=0` desativa.
4. **Blueprints canônicos** — 5 IDs investment presentes em `STRATEGY_BLUEPRINT_BY_ID`.
5. **Adapter byte-a-byte** — `adaptInvestmentScenario` projeta `comparePayload` verbatim para os 5 IDs.
6. **V2 export** — `InvestmentScenariosV2` é função exportada (entry point estável).
7. **V1 rollback path** — `InvestmentScenarioCard` continua importável.

`src/test/strategyPresentationV2Foundation.test.ts` (9 testes existentes) seguem **verdes**.

→ Total de 16/16 passando localmente.

---

## 9. Pronto para Patrimonial?

**Sim, com ressalva.** A arquitetura provou comportar:

- Single source of truth via blueprint + adapter consumer-only.
- Selection state fora da V2 (bridge para o pai) — Patrimonial pode usar a mesma técnica ou plugar no `CompareSelectionContext`.
- Sheet duplo (Layer 2 lateral + Layer 3 lateral 3xl) sem conflito de overlay.
- Rollback via flag única.

**Próxima wave (U6):**
1. Validar V2 em Investimentos com flag ON em preview/QA.
2. Replicar o mesmo gate em `PatrimonialModule`, usando `adaptPatrimonialArchetype`.
3. Considerar promover `CompareSelectionContext` para uso real quando a seleção precisar atravessar módulos.

---

## 10. Arquivos

- **criado:**  `src/components/modules/investment/InvestmentScenariosV2.tsx`
- **criado:**  `src/test/strategyPresentationV2Migration.test.ts`
- **criado:**  `.lovable/audit/u5-production-experience-migration-wave.md`
- **editado:** `src/components/modules/InvestmentModule.tsx` (import V2 + gate na seção "Compare estratégias")

Nada mais.
