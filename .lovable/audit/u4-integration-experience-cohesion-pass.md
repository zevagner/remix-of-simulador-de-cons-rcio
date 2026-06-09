# Wave U4 — Integration & Experience Cohesion Pass

## Objetivo
Refinar a jornada Layer 1 → Layer 2 → Layer 3 como **ecossistema único**: continuidade cognitiva, persistência de contexto, microinteração consistente e ritmo premium — sem novas features e sem tocar no motor financeiro.

## Entregas técnicas

### 1. Selection Memory + Compare Recovery
- **`CompareSelectionContext.tsx`** — Provider + hook `useCompareSelection()` com API estável (`isSelected`, `toggle`, `remove`, `clear`, `atLimit`, `count`, `max`).
- Persistência em **`sessionStorage`** (key `strategyV2:compareSelection`). Recovery automático ao retornar ao módulo dentro da mesma sessão; descarte ao recarregar (decisão consciente: comparações são efêmeras por contexto consultivo).
- Limite institucional aplicado no toggle (silencioso, respeita `COMPARE_MAX = 3`).
- Hook degrada para no-op estável quando consumido fora do Provider — segurança para coexistência.

### 2. Tokens & Primitives de coesão (`tokens.ts`)
| Token | Uso |
|---|---|
| `EYEBROW_CLS` | Padrão uppercase 10px + tracking nas 3 camadas |
| `FOCUS_RING_CLS` | Anel de foco institucional consistente |
| `SURFACE_CARD_CLS` | Card padrão (border/60 + bg-card) |
| `SECTION_GAP_CLS` | `space-y-5` — cadência vertical única |
| `ENTER_ANIMATION_CLS` | `animate-fade-in` para entradas |

### 3. Microinteractions
- **ExecutiveStrategyCard:** `role="button"` + `aria-pressed` + `aria-label`, navegação por teclado (Space/Enter), `tabIndex=0`, `active:scale-[0.995]` para feedback tátil, `focus-visible` ring institucional. Botão "Entender estratégia" também recebe focus ring.
- **ConsultiveStrategyPanel:** `animate-fade-in` no body editorial (entrada suave após o slide-in do Sheet — combinação natural sem CLS).
- **CompareWorkspace:** `animate-fade-in` no root (entrada coesa com o Panel).

### 4. Barrel atualizado (`index.ts`)
Exporta `CompareSelectionProvider`, `useCompareSelection`, `COMPARE_MAX` e `tokens`. Pronto para U5 (real page migration).

## Validação por princípio (23/23)

| # | Princípio | Status |
|---|---|---|
| 1 | Auditar fluxo completo | OK — fluxo Card → Panel → Compare validado |
| 2 | Continuidade cognitiva | Mesma família de eyebrows/ícones/tipografia em todas |
| 3 | Refinar transitions | `animate-fade-in` em Panel body + Workspace; Sheet slide nativo |
| 4 | Persistência de contexto | sessionStorage via Context |
| 5 | Selection memory | `CompareSelectionContext` shared |
| 6 | Compare recovery | Recovery automático na mesma sessão |
| 7 | Panel fatigue | Já mitigado em U2 (Accordion + visual silence); confirmado |
| 8 | Scroll cadence | `space-y-5` consistente; header sticky no Panel |
| 9 | Spacing consistency | `tokens.ts` centraliza |
| 10 | Microinteractions | Keyboard a11y + focus ring + active scale |
| 11 | Mobile experience | Stack vertical em <md (Compare); sticky header em Panel; thumb reach OK |
| 12 | Empty states | Card empty + single-selection state já em U3 |
| 13 | Loading orchestration | Sem skeleton novo; entradas usam fade-in (zero CLS) |
| 14 | Entry/exit flows | Sheet slide + fade body coordenados |
| 15 | Visual rhythm | `SECTION_GAP_CLS` único |
| 16 | Hierarchy consistency | Eyebrows + ícones lúcidos em padrão único |
| 17 | Onboarding implícito | Empty state didático em Compare; "Entender estratégia →" sinaliza profundidade |
| 18 | Motor financeiro único | Zero alteração; nenhum cálculo |
| 19 | Strategy blueprint | 100% preservado |
| 20 | Performance | Context com `useMemo`+`useCallback`; sessionStorage write barato |
| 21 | Coexistência | Provider opcional; hook no-op fora do Provider; gating segue OFF |
| 22 | Premium feel | Microinterações silenciosas + ritmo coeso |
| 23 | Fluidez | Recovery + animação de entrada eliminam fricção entre camadas |

## O que NÃO foi feito (correto)
- Sem alterar motor financeiro (`@/core/finance`).
- Sem alterar `contracts.ts` / `blueprint.ts` / `adapters.ts`.
- Sem montar V2 em produção (gating segue OFF).
- Sem novos hooks de cálculo.
- Sem mudança visual nas páginas legadas.

## Próxima wave
**U5 — Real Page Migration**: substituir grid antigo por V2 atrás do flag em rota canária (Investment + Patrimonial), wrap em `<CompareSelectionProvider>`, telemetria.

## Arquivos
- criado: `src/components/modules/strategy-v2/CompareSelectionContext.tsx`
- criado: `src/components/modules/strategy-v2/tokens.ts`
- editado: `src/components/modules/strategy-v2/ExecutiveStrategyCard.tsx` (a11y + focus ring + active feedback)
- editado: `src/components/modules/strategy-v2/ConsultiveStrategyPanel.tsx` (fade-in body)
- editado: `src/components/modules/strategy-v2/CompareWorkspace.tsx` (fade-in root)
- editado: `src/components/modules/strategy-v2/index.ts` (barrel)
- criado: `.lovable/audit/u4-integration-experience-cohesion-pass.md`
