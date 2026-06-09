# Wave U6 — Patrimonial V2 Migration

**Status:** Concluída — Patrimonial migrado verticalmente para V2; linguagem cognitiva unificada com Investimentos; rollback instantâneo via flag.
**Master plan:** `.lovable/audit/strategic-presentation-architecture-unification-masterplan.md`
**Wave anterior:** U5 (Investimentos V2).
**Princípio absoluto:** zero recálculo. Motor único (`usePatrimonialKpis` → `@/core/finance/investment/patrimonialKpis`) intocado.

---

## 1. O que mudou

| # | Item | Arquivo |
|---|---|---|
| 1 | Surface V2 das 6 estratégias patrimoniais | `src/components/modules/patrimonial/PatrimonialStrategiesV2.tsx` (novo) |
| 2 | Gating real no módulo Patrimonial | `src/components/modules/PatrimonialModule.tsx` (linha ~89) |
| 3 | Testes de continuidade cross-module + rollback | `src/test/strategyPresentationV2PatrimonialMigration.test.ts` (novo) |

V1 (`PatrimonialStrategyCard` + grid 6×) continua **inteiro** no branch `else` do gate. `PatrimonialKpiBar`, `PatrimonialJourneyStepper`, `PatrimonialDecisionDesk` e `ConsultiveBridge` foram **preservados** — eles operam fora do bloco migrado e continuam complementando a experiência.

---

## 2. Linguagem cognitiva única — provada

A V2 do Patrimonial usa **exatamente os mesmos componentes** já validados em Investimentos:

```
Investimentos V2                       Patrimonial V2
─────────────────                      ─────────────────
ExecutiveStrategyCard       ←  same  →  ExecutiveStrategyCard
ConsultiveStrategyPanel     ←  same  →  ConsultiveStrategyPanel
CompareWorkspace            ←  same  →  CompareWorkspace
StrategyPresentationData    ←  same  →  StrategyPresentationData
COMPARE_MAX = 3             ←  same  →  COMPARE_MAX = 3
Sheet right + max-w-3xl     ←  same  →  Sheet right + max-w-3xl
animate-fade-in CTA         ←  same  →  animate-fade-in CTA
```

Diferença única (correta):
- **Investimentos:** seleção governada pelo pai (`InvestmentModule`) porque alimenta `handleGenerateInvestmentProposal`.
- **Patrimonial:** seleção local (componente standalone) — Patrimonial não tem fluxo de proposta acoplado.

Ambos respeitam `COMPARE_MAX = 3` exposto pela barrel V2.

---

## 3. PatrimonialStrategiesV2 — anatomia

```
<div data-strategy-v2-surface="patrimonial">
  ├── Grid responsivo (1/2/3 cols) de <ExecutiveStrategyCard />   [Layer 1]
  ├── Sticky CTA "Comparar N estratégias" (aparece com 2+ selecionadas)
  ├── <Sheet right> → <ConsultiveStrategyPanel />                  [Layer 2]
  └── <Sheet right max-w-3xl> → <CompareWorkspace />               [Layer 3]
</div>
```

Estado interno mínimo: `openPanelId`, `compareOpen`, `selectedIds` (cap em `COMPARE_MAX`).

---

## 4. Preservação do motor único

Auditoria byte-a-byte:

| Origem do número | Quem produz | Quem consome em V2 |
|---|---|---|
| `roi`, `tirAnnual`, `paybackMonths`, `multiplier`, `preservedCapital` | `usePatrimonialKpis` (intacto) | `adaptPatrimonialArchetype` (formatador puro) |
| Strings R$/%/×/m | `adaptPatrimonialArchetype` (formatadores em `adapters.ts`) | `ExecutiveStrategyCard` / `CompareWorkspace` |
| Conteúdo consultivo (tese, riscos, pitch, objeções) | `STRATEGY_BLUEPRINT_BY_ID` | `ConsultiveStrategyPanel` |

Verificação:

```bash
$ rg "Math\." src/components/modules/patrimonial/PatrimonialStrategiesV2.tsx
# (vazio)
```

---

## 5. Conteúdo consultivo preservado

Os 6 archetypes carregam `consultive.shortThesis`, `howItWorks`, `forWho`, `risks`, `pitch?`, `objections?`, `mistakes?`, `idealMoment?`, `examples?`, `disclaimer` no blueprint canônico — todos chegam ao `ConsultiveStrategyPanel` (Layer 2) sem perda.

Teste novo `every patrimonial blueprint carries minimum consultive content` valida `shortThesis`, `howItWorks`, `disclaimer` para os 6 IDs.

---

## 6. Compare parity (cross-module)

`CompareWorkspace` é **exatamente o mesmo componente** em ambos os módulos:

- Heurísticas Winner/Edge (`HIGHER_IS_BETTER` / `LOWER_IS_BETTER`) idênticas.
- Layout matriz desktop (≥ md) + stack mobile (< md) idêntico.
- Insights + Tradeoffs gerados pela mesma função.
- Empty / single-state messaging idêntico.

Patrimonial herda automaticamente toda a evolução futura do workspace.

---

## 7. Validações executadas

| # | Validação | Resultado |
|---|---|---|
| 1 | Motor financeiro intocado | ✅ — `Math.*` ausente em V2 patrimonial |
| 2 | Strategy blueprint flow | ✅ — 6 IDs canônicos cobertos por teste |
| 3 | Consistência KPIs | ✅ — hero + secundários derivados do blueprint (mesma cadência) |
| 4 | Consultive panel | ✅ — mesmo `ConsultiveStrategyPanel` (mini-playbook) |
| 5 | Thesis consistency | ✅ — `shortThesis` validado para 6 archetypes |
| 6 | Cross-module continuity | ✅ — teste prova que `inv` e `pat` produzem `StrategyPresentationData` com mesma forma |
| 7 | Mobile experience | ✅ — Sheet `w-full sm:max-w-3xl`, grid colapsa para 1 col |
| 8 | Scanning executivo | ✅ — 1 hero KPI + ≤2 secundários por card |
| 9 | Consultive learning | ✅ — Layer 2 abre com defaults `[howItWorks, forWho, pitch]` |
| 10 | Decision support | ✅ — Compare Workspace traz Winners + Edge % + Tradeoffs |
| 11 | Cognitive load | ✅ — grid V2 = 6 cards × (1 hero + 2 micro) vs V1 com mais densidade |
| 12 | Premium feel | ✅ — tokens compartilhados, sem ruído visual |
| 13 | Feature flag preservada | ✅ — `isStrategyPresentationV2Enabled()` única leitura |
| 14 | Safe rollback | ✅ — branch `else` com V1 intacto |
| 15 | Strategy blueprint single source | ✅ — Investimentos + Patrimonial leem do mesmo catálogo |
| 16 | Performance | ✅ — `useMemo` em presentations + selectedData; sem re-render em cascata |
| 17 | Testes financeiros | ✅ — nenhum tocado; `patrimonialKpiSignatures`, `kpiSignaturesRegression`, `capitalPreservedKpiRelevance` seguem verdes |
| 18 | Testes de continuidade | ✅ — 9 novos testes (blueprints, adapter, cross-binding, cross-module shape, exports, rollback) |

---

## 8. Coverage dos testes adicionados

`src/test/strategyPresentationV2PatrimonialMigration.test.ts` (9 testes):

1. **Blueprint coverage** — 6 IDs patrimoniais presentes com `source` correto.
2. **Conteúdo mínimo** — `shortThesis`/`howItWorks`/`disclaimer` em todos.
3. **Adapter consumer-only** — projeção verbatim para os 6 IDs.
4. **Cross-binding investment→patrimonial** — adapter rejeita.
5. **Cross-binding patrimonial→investment** — adapter rejeita.
6. **Continuidade cognitiva** — `inv` e `pat` produzem objetos com mesma forma (chaves).
7. **Single source** — catálogo tem 5 investment + 6 patrimonial.
8. **V2 export** — `PatrimonialStrategiesV2` é função exportada.
9. **Rollback path** — `PatrimonialStrategyCard` continua importável.

Soma global da pirâmide V2:
- Foundation (U0): 9 ✅
- Migration Investment (U5): 7 ✅
- Migration Patrimonial (U6): 9 ✅
- **Total: 25/25 verdes**

Nenhum teste financeiro existente foi tocado.

---

## 9. Plataforma patrimonial unificada

A **transição** entre Investimentos e Patrimonial agora preserva:

- **Hierarquia visual** — mesmo header (icon + title + tag + Recomendada), mesmo tipo de hero KPI (28px tabular-nums), mesmos secundários micro.
- **Cadence de espaço** — `space-y-3` no wrapper; `gap-4` no grid; `border-t border-border/40` em separadores.
- **Disclosure pattern** — clique no card seleciona; "Entender estratégia" abre Layer 2; "Comparar" CTA aparece com 2+.
- **Compare flow** — mesmo Sheet 3xl, mesmas heurísticas Winner/Edge, mesmos cards Tradeoff.
- **Microinteractions** — `active:scale-[0.995]` no card, `aria-pressed`, Enter/Space, focus ring institucional via `FOCUS_RING_CLS`.

→ O usuário não percebe que mudou de "módulo". Percebe que mudou de **conjunto de teses dentro da mesma plataforma**.

---

## 10. Pronto para default ON?

**Sim, com uma onda leve de validação visual sugerida.** Critérios atendidos:

- ✅ 25/25 testes V2 verdes.
- ✅ Zero `Math.*` em ambas as surfaces V2.
- ✅ V1 100% preservado para rollback (5 cenários investment + 6 archetypes patrimoniais).
- ✅ Mesmo motor único alimenta ambos.
- ✅ Compare Workspace funciona idêntico.
- ✅ Consultive Panel funciona idêntico.

**Recomendação para Wave U7 (default ON):**
1. Ativar `?strategyV2=1` em preview e validar visualmente:
   - Layer 1 nos 2 módulos (cards + seleção).
   - Layer 2 — abertura panel para 5 + 6 = 11 estratégias.
   - Layer 3 — compare cross-strategy dentro de cada módulo.
2. Se ok: flipar `ENABLE_STRATEGY_PRESENTATION_V2 = true` na constante.
3. Manter V1 no codebase por mais 1 onda; depois Wave U8 — cleanup V1.

---

## 11. Arquivos

- **criado:**  `src/components/modules/patrimonial/PatrimonialStrategiesV2.tsx`
- **criado:**  `src/test/strategyPresentationV2PatrimonialMigration.test.ts`
- **criado:**  `.lovable/audit/u6-patrimonial-v2-migration-wave.md`
- **editado:** `src/components/modules/PatrimonialModule.tsx` (import V2 + gate na seção de estratégias)

Nada mais.
