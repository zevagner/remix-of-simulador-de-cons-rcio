# Wave U1 — Executive Strategy Card Reconstruction

**Status:** ✅ Concluída
**Escopo:** Layer 1 (Executive Card) da nova arquitetura V2
**Flag:** `ENABLE_STRATEGY_PRESENTATION_V2` (default OFF — coexistência preservada)

---

## 1. Princípio absoluto

O card deixou de ser um **mini dashboard** e passou a ser uma **superfície de scanning executivo**. O usuário precisa entender tese, diferencial e valor da estratégia em segundos — sem competição visual.

---

## 2. Reconstrução

### 2.1 Antes (shell U0)
- Múltiplos containers (Card + CardContent + 2 caixas KPI + grid 2-col secundários).
- 2 botões competindo por atenção (Comparar + Ver detalhes).
- Hero KPI com fundo `bg-muted/40` competindo com secundários com `border`.
- Sem entrada clara para Layer 2.

### 2.2 Depois (U1 definitivo)
Hierarquia brutal em 4 zonas:

| Zona | Conteúdo | Peso visual |
|------|----------|-------------|
| **A. Metadata** | Ícone 36px + título + tag + chip "Recomendada" + checkbox | Silencioso |
| **B. Dominant Insight** | Tese curta (2 linhas máx) + Hero KPI 28px tabular | DOMINANTE |
| **C. Supporting Signals** | Até 2 KPIs secundários, sem bordas internas | Sussurro |
| **D. Progressive Entry** | Footer "Entender estratégia →" | Convite calmo |

---

## 3. Implementação dos 20 requisitos

| # | Requisito | Implementação |
|---|-----------|---------------|
| 1 | Reconstruir card | Reescrita completa em `ExecutiveStrategyCard.tsx` |
| 2 | Eliminar mini-dashboard | 1 container `<article>` único; sem Card/CardContent aninhados |
| 3 | Hierarquia brutal | Hero 28px vs secundários 14px vs metadata 11px |
| 3A | Dominant insight | Hero KPI + tese curta no topo |
| 3B | Supporting signals | `dl` flat com 2 KPIs, sem grid denso |
| 3C | Metadata | Tag + ícone + chip "Recomendada" silenciosos |
| 4 | Reduzir ruído | Removidos: grid 2-col, bordas internas, caixa muted no hero, 2º botão CTA |
| 5 | Visual silence | 1 borda externa + 2 dividers `border/40`; padding generoso |
| 6 | Thesis-first | `shortThesis` antes do KPI, com `line-clamp-2` |
| 7 | Progressive disclosure entry | Footer dedicado "Entender estratégia →" abre Layer 2 |
| 8 | Sem explicação longa | Tese ≤ 2 linhas; profundidade fica no Consultive Panel |
| 9 | Selectable silencioso | Checkbox 20px no canto + ring `primary/25` quando selecionado; clique no card alterna |
| 10 | Consistência total | Mesma estrutura para investment + patrimonial (via `StrategyPresentationData`) |
| 11 | Density ceiling | `maxSecondary = 2` enforced via prop; hero único |
| 12 | Executive rhythm | Spacing escalonado (pt-5 / mt-4 / mt-5 / py-3) — cadence calma |
| 13 | Mobile-first | Sem grid; flex-1 nos signals; tap target = card inteiro |
| 14 | Single source of truth | 100% lido de `blueprint` + `heroKpi` + `secondaryKpis` |
| 15 | Motor financeiro único | Zero cálculos no componente — apenas leitura |
| 16 | Conteúdo consultivo preservado | Apenas `shortThesis` exposto; resto fica para Layer 2 |
| 17 | Performance | Componente puro sem state interno; sem re-render desnecessário |
| 18 | Coexistência | `InvestmentScenarioCard` / `PatrimonialStrategyCard` intactos; flag OFF |
| 19 | Scanning executivo | Hero 28px tabular + tese ≤ 2 linhas = leitura em <3s |
| 20 | Premium feel | Tipografia tracking ajustada, hover sutil, ring institucional |

---

## 4. Garantias arquiteturais

- **Motor financeiro:** intocado. Card é consumer-only de `StrategyPresentationData`.
- **Adapters:** sem mudança — `adaptInvestmentScenario` / `adaptPatrimonialArchetype` continuam fonte única de KPIs.
- **Blueprint:** sem mudança — única fonte editorial.
- **Coexistência:** Cards legados continuam ativos; V2 só monta com flag ON.
- **Anti-XSS:** apenas texto plano; sem `dangerouslySetInnerHTML`.

---

## 5. Próximos passos

- **Wave U2:** Consultive Strategy Panel (Layer 2) — drawer com 12 blocos pedagógicos do blueprint.
- **Wave U3:** Compare Workspace (Layer 3) — matriz KPI + timeline overlay.
- **Wave U4:** Refinamento visual final + tokens motion.
- **Wave U5:** Migração de páginas reais (Investment + Patrimonial) atrás da flag.
- **Wave U6:** Cleanup dos componentes legados.

---

## 6. Arquivos alterados

- ✏️ `src/components/modules/strategy-v2/ExecutiveStrategyCard.tsx` (reescrita completa)
- 📄 `.lovable/audit/u1-executive-strategy-card-reconstruction-wave.md` (este relatório)
