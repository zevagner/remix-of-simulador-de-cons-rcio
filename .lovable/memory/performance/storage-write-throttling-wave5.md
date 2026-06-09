---
name: Storage Write Throttling (Wave 5)
description: Helper único useDebouncedLocalStorage/useDebouncedLocalStorageString em src/utils/storage/throttledWriter.ts (debounce 220ms + bailout por fingerprint + flush no unmount); aplicado em WealthAssumptionsContext (sliders/PercentInput) e ProposalPdfModule (textareas)
type: feature
---

**Wave 5 — Storage Write Throttling (V2.4 LOCKED, arquitetura intacta).**

**Hotspots tratados (auditoria):**

| Arquivo | Chave | Antes | Depois |
|---|---|---|---|
| `WealthAssumptionsContext` | `wealth:assumptions:v1` | 1 write/keystroke nos sliders | debounce 220ms + bailout |
| `WealthAssumptionsContext` | `wealth:assumptions:preset:v1` | 1 write por troca de preset | debounce 220ms + bailout |
| `ProposalPdfModule` | `proposalPdf:customOpening:{userId}` | 1 write/tecla (textarea 300 chars) | debounce 220ms + bailout |
| `ProposalPdfModule` | `proposalPdf:customClosing:{userId}` | 1 write/tecla | debounce 220ms + bailout |

**Hotspots já tratados em ondas anteriores (mantidos):**
- `SimulatorContext` `simulator-last-session`: debounce 500ms (pré-existente).
- `SimulatorContext` `strategy:sim-slice:v1`: debounce 160ms + envelope versionado (Wave 4).

**Não throttlados (baixa frequência — click/navegação/explicit save):**
- `ActiveStrategyContext`, `SelectedGroupContext`, `Sidebar collapsed`, `navState`, `moduleTabPersistence`, `usePdfProfile`, `ClientJourneyContext`, `StructuredOperationsModule`, `salesGoal`, `useTheme`, modais de onboarding, dismiss flags.

**Helper canônico:** `src/utils/storage/throttledWriter.ts`
- `safeWrite(key, serialized)` / `safeRemove(key)` — try/catch SSR-safe.
- `useDebouncedLocalStorage<T>(key, serialize?, delayMs=220)` — hook genérico com fingerprint bailout (`serialize(value) === lastSerialized` → skip) e flush síncrono no unmount.
- `useDebouncedLocalStorageString(key, delayMs=220)` — variante string|null (null → removeItem).

**Proibido:**
- `localStorage.setItem` direto dentro de effects ligados a sliders/keystroke sem passar pelo helper.
- Aumentar `delayMs` acima de 500ms (perda perceptível de persistência em refresh acidental).
- Reintroduzir writes síncronos sem bailout em providers Wealth/Proposta.

**Impacto runtime:**
- Sliders Wealth (Yield/CDI/Valorização): de ~30 writes/s → 1 write coalescido por 220ms estável.
- Textareas Proposta: idem.
- Sem regressão de UX: React state continua síncrono; só a serialização espera.
- Sem regressão matemática (calcContext deriva de `assumptions` em memória, não do storage).

**Compat PDF/offscreen:** `readWealthCalcContextFromStorage()` e `readSimSliceFromStorage()` continuam síncronos. Em caso de refresh durante digitação ativa, perde-se no máximo os últimos 220ms de input — comportamento já presente em SimulatorContext (500ms) e aceitável.

**Risco residual:** janela de 220ms entre última edição e persistência. Mitigado por flush no unmount (navegação para outro módulo persiste imediatamente).
