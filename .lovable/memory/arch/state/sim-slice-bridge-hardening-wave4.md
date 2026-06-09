---
name: Sim-slice Bridge Hardening (Wave 4)
description: Bridge SimulatorContext→Wealth com envelope versionado (schemaVersion/timestamp/origin/payload), debounce 160ms só no write/dispatch, bailout por fingerprint, flush no unmount, reader back-compat com snapshots legados
type: feature
---

**Wave 4 — Sim-slice Bridge Hardening (V2.4 LOCKED, arquitetura intacta).**

Bridge canônica preservada:
```
SimulatorContext → localStorage(strategy:sim-slice:v1) + CustomEvent('wealth:sim-slice:changed')
  → WealthAssumptionsContext / readSimSliceFromStorage (PDF off-screen)
```

**Hardening (sem mudar protocolo):**

1. **Envelope versionado** (`src/utils/storage/simSliceBridge.ts`):
   ```ts
   { schemaVersion: 1, timestamp, origin: 'simulator', payload: SimSlice }
   ```
   Reader `readSimSlicePayload` aceita envelope OU formato legado (payload raw na raiz) → back-compat total com snapshots pré-Wave 4.

2. **Debounce 160ms** APENAS no write/dispatch (SimulatorContext effect).
   UI local do simulador, cálculos e PDF off-screen NÃO sofrem latência.
   Coalesce: timer cancela e reagenda a cada keystroke.

3. **Bailout por fingerprint** (`JSON.stringify(payload)`, sem timestamp):
   - write idêntico → skip total (sem LS write, sem dispatch).
   - clear redundante (já estava limpo) → skip.
   Reduz write storm de ~17 deps × N keystrokes para 1 write coalescido por snapshot estável.

4. **Flush síncrono no unmount** (`useEffect(() => () => flushBridge(), [])`):
   garante que o último snapshot estável seja persistido mesmo se o
   Provider desmontar antes do timer disparar.

5. **Assertions defensivas** em `assertValidSimSlice`:
   - `creditValue > 0`, `termMonths > 0`, `consortiumType: string`
   - Todos os campos numéricos críticos (costPlan, totalCost, fullInstallment, effectiveClientCost, etc.) `Number.isFinite`
   - Falha silenciosa → null. NUNCA lança (PDF off-screen tolerante).
   - `schemaVersion` desconhecido → null (forward-incompat seguro).

**Constantes canônicas** (única fonte):
- `STRATEGY_SIM_SLICE_STORAGE_KEY = 'strategy:sim-slice:v1'` (re-export do WealthAssumptionsContext)
- `SIM_SLICE_BRIDGE_EVENT = 'wealth:sim-slice:changed'`
- `SIM_SLICE_SCHEMA_VERSION = 1`

**Proibido:**
- Reintroduzir write síncrono no produtor sem debounce/bailout.
- Criar segunda chave de bridge ou segundo event name.
- Mover arquitetura para Zustand/eventbus/websocket (V2.4 LOCKED).
- Ler `strategy:sim-slice:v1` sem passar por `readSimSlicePayload`/`assertValidSimSlice`.

**Impacto runtime:**
- INP em digitação rápida no Simulador: write storm de N→1 (debounce 160ms).
- Bailout adicional quando deps mudam mas snapshot estrutural é igual (ex.: re-render por outra causa).
- Sem regressão matemática nem consultiva — apenas frequência de persistência muda.

Audit base: `.lovable/audit/wave4-forensic-architecture-audit.md`.
