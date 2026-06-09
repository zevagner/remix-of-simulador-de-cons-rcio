---
name: Prestamista Operational Tables V1
description: Onda OP-V1 — fator operacional por (modalidade, prazo) via tabela institucional PRESTAMISTA_OPERATIONAL_TABLE_V1. Engine única calculateOperationalPrestamista(ForType) em src/core/finance/prestamista; lookup exato + fallback factor=1.0 com warning. Cenários confirmados: vehicle_light/80m=1.0, vehicle_heavy/100m=0.9, real_estate/173m=0.566.
type: feature
---

**Fórmula oficial CAIXA (V1):**
- `premium_mensal = (Crédito + TA + FR) × FatorOperacional × 0,000765` (cota nova)
- `FatorOperacional` = `getPrestamistaOperationalFactor(modality, termMonths)` em `src/core/finance/insurance/prestamistaOperationalTables.ts`
- Fora da tabela → `factor=1.0`, `source='fallback'`, warning único via `logger.warn`
- Sem interpolação nesta V1

**Engine única:** `calculateOperationalPrestamistaForType({ creditValue, adminFeeTotal, reserveFundTotal, termMonths, consortiumType, ... })`. Mapeia `imobiliario→real_estate`, `auto→vehicle_light`, `pesados→vehicle_heavy` via `modalityFromConsortiumType`. Consumida por `monthlySchedule.ts`, `calculations.ts`, `structuredOpsConstants.ts`. Proibido recriar lookup ou recompor seguro fora da fachada.

**Cenários confirmados (PDFs oficiais):**
- vehicle_light 80m / 100k / 18% / 3,5% → seguro 92,95
- vehicle_heavy 100m / 200k / 15% / 3,5% → seguro 163,20
- real_estate 173m / 325.969,42 / 21% / 2,5% → seguro 174,32

**Adicionar novo cenário:** incluir linha em `PRESTAMISTA_OPERATIONAL_TABLE_V1` com `reference` ao PDF de origem; sem PDF, não inserir.
