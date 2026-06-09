# Unified Patrimonial Experience Wave

**Status:** entregue
**Princípio absoluto:** o usuário abre a tela e sente **“plataforma patrimonial única”**, não “Investimentos + Patrimonial costurados”.
**Escopo:** apenas **Visual Product Integration**. Zero novo motor, zero novo contract, zero refactor de context.

---

## 1. Diagnóstico

Mesmo após U0–U8, a sidebar ainda mostrava **dois itens irmãos**:
`Análise → Investimentos` e `Análise → Patrimonial`. Cada um abria um shell
próprio (`InvestmentModule` / `PatrimonialModule`) com seu próprio header,
seu próprio “bridge”, sua própria seção de cards. A camada V2 estava
funcional por baixo — mas a integração era **invisível** ao usuário final.

> *“Se o usuário não vê a integração, ela não existe.”*

---

## 2. Decisão arquitetural

1. **Eliminar a divisão visual dos módulos** sem fundir engines.
2. Introduzir uma **surface única** — `WealthPlatformModule` — sob o ID
   canônico `wealth` (`ANALYSIS_TABS.WEALTH`).
3. **Agrupar por intenção patrimonial** (não por origem do módulo):
   Crescimento · Liquidez & Fluxo · Aceleração · Estruturação ·
   Proteção & Sucessão.
4. **Misturar** estratégias dos 2 catálogos no mesmo grid editorial.
5. **Manter rotas legadas vivas** (`investment`, `patrimonial`) como
   *headless allowlist* — deep-links e CTAs antigos continuam funcionando,
   mas **somem da sidebar**.

---

## 3. Implementação

### 3.1 Curadoria editorial (novo)
**`src/components/modules/wealth/intents.ts`**
- 5 intentos curados (`WEALTH_INTENTS`) com `eyebrow`, `title`, `narrative`,
  `icon`, `accent` semântico (primary/success/warning/muted), `strategyIds`.
- `INTENT_BY_STRATEGY_ID` (lookup reverso) + `INTENT_ACCENT_CLS` (tints
  HSL via semantic tokens) + `INTENT_ANCHOR` (scroll anchors).
- Cada strategyId aparece em **um único** intento — sem ruído editorial.

### 3.2 Surface única (novo)
**`src/components/modules/wealth/WealthPlatformModule.tsx`**

Anatomia (macro hierarchy):
- **Hero editorial** — selo “Plataforma Patrimonial”, título grande,
  micro-narrativa, chips de navegação rápida por capítulo (mobile-first).
- **B. Estratégia recomendada** — destaque do `recommendedId` vindo do motor.
- **C. Exploração patrimonial** — sequência de `IntentSection`:
  hero do capítulo (`bg` + `border` no tom do intento + ícone) seguido do
  mesmo grid V2 de `ExecutiveStrategyCard`.
- **D. Sticky compare CTA** — aparece quando `selectedData ≥ 2`,
  cross-intent, máx 3 (`COMPARE_MAX`).
- Reutiliza **inalterados** `ConsultiveStrategyPanel` (Layer 2) e
  `CompareWorkspace` (Layer 3) em `Sheet` lateral.

Consumer-only:
- Estratégias de Investimentos → lidas de
  `InvestmentResultsContext.presentations`.
- Estratégias Patrimoniais → adaptadas em runtime via
  `adaptPatrimonialArchetype(...)` a partir de `usePatrimonialKpis()`.
- **Zero `Math.pow`, zero schedule, zero IA.**

Telemetria: reusa `useStrategyV2Telemetry({ source: 'patrimonial' })` —
nenhum novo evento criado.

### 3.3 Publicação de presentations no contexto
**`src/contexts/InvestmentResultsContext.tsx`**
- Adicionados `presentations: StrategyPresentationData[]` + `recommendedId`.

**`src/components/modules/InvestmentModule.tsx`**
- Novo `useMemo` constrói `presentations` reutilizando
  `deriveScenarioExecutiveKpis` + `adaptInvestmentScenario` (mesma
  mecânica já validada em `InvestmentScenariosV2`).
- Publicado no mesmo `useEffect` que já publicava `bestStrategy`.
- `InvestmentModule` permanece sempre montado (estratégia `hidden`)
  dentro de `AnalysisModule`, então as presentations existem **mesmo
  quando o usuário nunca abre a aba Investimentos**.

### 3.4 Reorganização de navegação
**`src/config/modules.ts`**
- `ANALYSIS_TABS.WEALTH = 'wealth'`.
- `ANALYSIS_SUBITEMS` agora expõe **um** item — “Estratégias
  Patrimoniais” — no lugar de “Investimentos” + “Patrimonial”.
- `ANALYSIS_HEADLESS_ALLOWLIST` recebe `INVESTMENT` e `PATRIMONIAL`
  (rotas vivas para CTAs e deep-links, invisíveis no menu).
- Hint da nova entrada: *“Curadoria editorial — crescimento, liquidez,
  proteção e sucessão.”*

**`src/components/modules/AnalysisModule.tsx`**
- Renderiza `WealthPlatformModule` na nova aba `WEALTH`.
- Mantém divs `hidden` de `INVESTMENT` e `PATRIMONIAL` (rota legada
  + publicação de contexto).
- Adicionado ao `schedulePreload` para idle prefetch.

---

## 4. Macro hierarquia entregue

| Bloco | Função | Componente |
|---|---|---|
| A. Visão executiva | Hero editorial + chips de capítulos | `<header>` interno |
| B. Estratégia recomendada | Destaque do best-pick | `ExecutiveStrategyCard` |
| C. Exploração patrimonial | 5 capítulos editoriais (intents) | `IntentSection` |
| D. Comparação | Sticky CTA + Sheet com `CompareWorkspace` | reuso V2 |

---

## 5. O que NÃO foi tocado

- Motor financeiro (`@/core/finance`, `useInvestmentCalculations`, paths 1–6).
- Contratos V2 (`contracts.ts`, `blueprint.ts`, `adapters.ts`, `tokens.ts`).
- `CompareSelectionContext` (U7 hardening preservado).
- Telemetria (U8 preservada — apenas reuso).
- `InvestmentModule` interno (mantém aba V1+V2, PDF, AI storytelling).
- `PatrimonialModule` interno (mantém DecisionDesk + JourneyStepper para
  acesso via deep-link).

---

## 6. Validações perceptivas

| # | Critério | Resultado |
|---|---|---|
| 1 | Sidebar não mostra mais dois irmãos | ✅ entrada única “Estratégias Patrimoniais” |
| 2 | Hero editorial imediatamente diferente | ✅ gradient + selo + chips de capítulos |
| 3 | Estratégias misturadas por intenção | ✅ 5 intentos, sem rótulo de origem |
| 4 | Compare cross-strategy unificado | ✅ máx 3, sticky CTA, `CompareWorkspace` único |
| 5 | Consultive flow unificado | ✅ `ConsultiveStrategyPanel` único |
| 6 | Mobile-first | ✅ chips horizontais com scroll-x, grids colapsam para 1 col |
| 7 | Zero recálculo | ✅ presentations consumidas do contexto + adapter patrimonial |
| 8 | Performance | ✅ lazy + preload idle, sem nova lib, sem chart pesado |
| 9 | Rollback | ✅ rotas legadas vivas — basta reordenar `ANALYSIS_SUBITEMS` |

---

## 7. Arquivos

**Criado**
- `src/components/modules/wealth/intents.ts`
- `src/components/modules/wealth/WealthPlatformModule.tsx`
- `.lovable/audit/unified-patrimonial-experience-wave.md`

**Editado**
- `src/contexts/InvestmentResultsContext.tsx` (+`presentations`, +`recommendedId`)
- `src/components/modules/InvestmentModule.tsx` (publica presentations)
- `src/config/modules.ts` (WEALTH tab, sidebar, headless allowlist)
- `src/components/modules/AnalysisModule.tsx` (render WEALTH, preload)

---

## 8. Próximas ondas naturais (não executadas)

- Absorver `PatrimonialDecisionDesk` + `PatrimonialJourneyStepper` na surface
  unificada como sub-blocos editoriais opcionais.
- Mover storytelling IA (`InvestmentStorytelling`) para dentro do
  `ConsultiveStrategyPanel` quando aberto a partir do WealthPlatform.
- Apagar `ConsultiveBridge` (já redundante na nova surface).
