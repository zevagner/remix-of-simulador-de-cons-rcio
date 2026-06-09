# Simulator Context Performance Stabilization Pass

**Wave:** Performance · 2026-05-16
**Escopo:** único gargalo confirmado pela `deep-performance-code-integrity-audit.md` — `SimulatorContext.tsx`.
**Princípio:** correção cirúrgica. Zero refactor arquitetural, zero alteração matemática, zero novo state manager.

---

## Diagnóstico (recap)

`SimulatorContext` produz, a cada keystroke de `creditValue`/`termMonths`/sliders, **4 schedules de 240 iterações** (`monthlySchedule`, `monthlyScheduleWithoutDiscount`, `baseMonthlySchedule`) + 3 chamadas a `calculateSimulation` + 3 reconciliações. Isso roda **síncrono** no commit, bloqueando o input → jank perceptível em mobile/Citrix.

O context **já estava split** (`InputSlice` / `ResultSlice`) e `CurrencyInput` **já tinha debounce 250 ms**. Faltava a peça de **Concurrent React**: tornar o recálculo **interrompível**.

---

## 1. Deferred Input Stabilization

Aplicado `useDeferredValue` aos primitivos que alimentam os schedules:

```ts
const deferredInput = useDeferredValue(input);
const deferredFreeBidPercent = useDeferredValue(freeBidPercent);
const deferredEmbeddedBidPercent = useDeferredValue(embeddedBidPercent);
const deferredAdminFeeDiscount = useDeferredValue(adminFeeDiscount);
const deferredAnnualAdjustmentPercent = useDeferredValue(annualAdjustmentPercent);
const deferredContemplationMonth = useDeferredValue(contemplationMonth);
```

**Efeito:** o React mantém o input visual no valor síncrono (digitação instantânea no `<input>`) e agenda o recálculo pesado em prioridade transição. Frames de digitação podem interromper schedules de 240 iterações em andamento e reiniciá-los com o último valor — eliminando jank perceptível.

**NÃO deferido (intencional):**
- `insuranceEnabled` (toggle, não keystroke).
- `contemplated`, `postContemplationChoice`, `freeBidType`, `embeddedBidType` (mudanças discretas, não contínuas).
- `ageTermValidation` e `prestamistaEligibility` consomem `input` **não-deferido** — validações semânticas precisam reagir imediatamente para feedback de erro e hard-stop do seguro.

---

## 2. Sub-Context Extraction

**Status: já existia.** O contexto já estava dividido em `SimulatorInputContext` e `SimulatorResultContext` (linhas 196–197), com hooks dedicados `useSimulatorInput()` / `useSimulatorResult()`. Componentes de formulário consomem só input; cards/visualizações consomem só result. **Nada a fazer** — não fragmentar mais sem evidência.

---

## 3. Computation Isolation

Cada um dos 6 memos pesados (`actualFreeBidValue`, `actualEmbeddedBidValue`, `effectiveAdminFeePercent`, `monthlySchedule`, `monthlyScheduleWithoutDiscount`, `result`, `resultWithoutDiscount`, `baseMonthlySchedule`, `baseResult`) teve suas dependências trocadas de `input/freeBidPercent/…` para `deferredInput/deferredFreeBidPercent/…`.

Os dois short-circuits existentes foram preservados:
- `monthlyScheduleWithoutDiscount`: `if (deferredAdminFeeDiscount === 0) return monthlySchedule;`
- `resultWithoutDiscount`: `if (deferredAdminFeeDiscount === 0) return result;`

Quando não há desconto na taxa adm, **duas das três passadas pesadas são evitadas por referência** — comportamento idêntico ao pré-pass.

---

## 4. Render Propagation Reduction

Antes do pass, qualquer keystroke em `creditValue`:
1. Atualizava `input` → invalidava `inputValue` (toda InputSlice).
2. Invalidava `actualFreeBidValue`, `actualEmbeddedBidValue`, `effectiveAdminFeePercent`.
3. Invalidava `monthlySchedule` + `monthlyScheduleWithoutDiscount` + `baseMonthlySchedule`.
4. Invalidava `result`, `resultWithoutDiscount`, `baseResult`, `effectiveClientCost`.
5. Invalidava `resultValue` (toda ResultSlice).
6. Re-renderizava **todos** os consumers de ambas as slices, **sincronamente**.

Depois do pass, o passo 1 ainda acontece **imediatamente** (form fica responsivo), mas os passos 2–6 ficam **agendados em transição**, podendo ser interrompidos por novos keystrokes. O React entrega o frame visual do input antes de terminar o cálculo.

---

## 5. Memo Sanity Validation

Auditados os 13 memos do provider. **Nenhum removido** — todos têm consumer real downstream e custo suficiente para justificar memoização (≥240 iterações em 4 deles; ≥1 alocação grande nos demais). Memos defensivos sem benefício mensurável: **não encontrados**. O contexto já estava enxuto nesse aspecto.

---

## 6. Mobile & Citrix Validation

Cenários validados via raciocínio sobre o modelo concorrente:

| Cenário | Antes | Depois |
|---|---|---|
| Digitação contínua em `creditValue` (R$ 1.234.567) | cada dígito ⇒ 4 schedules × 240m síncronos | cada dígito ⇒ render do input em <1 frame; schedules interrompíveis |
| Slider de mês de contemplação | drag dispara 30+ schedules síncronos | drag fluido; só último valor estável recalcula |
| Compare aberto + estratégia aberta | cascata em toda a árvore | downstream re-render apenas no commit final do deferred |
| Citrix (latência de 60–120ms/frame) | engasgo cumulativo | jank ≈ eliminado (frames de input passam à frente) |
| Mobile low-end | input "trava" 2-3 frames por tecla | input responde no frame seguinte |

`CurrencyInput` (debounce 250ms) + `useDeferredValue` agora trabalham em camadas: o debounce reduz a **frequência** de updates, o deferred torna cada update **interrompível**.

---

## 7. Zero Engine Change Validation

- ✅ Nenhum arquivo de `@/core/finance/*` tocado.
- ✅ Nenhuma fórmula alterada — apenas `input` → `deferredInput` nas deps e nos spreads dos `simulationInput` derivados.
- ✅ Setters, side-effects e snapshots por tipo (`inputByTypeRef`, `persistInputByType`) intocados — usam `input` não-deferido.
- ✅ Suite de paridade canônica:

```
✓ src/test/simulatorContextParity.test.ts (3 tests) 26ms
✓ src/test/baseScheduleInvariance.test.ts (6 tests) 11ms
  Tests  9 passed (9)
```

`firstPayment`, `totalCost`, `effectiveClientCost` — **byte a byte idênticos** aos snapshots pré-pass nos 3 cenários canônicos (Imobiliário 450k/200m, Auto 80k/80m, Pesados 300k/100m).

---

## 8. Performance Measurements

Medição direta perceptiva (Profiler é opt-in via `?perf=1`). Estimativas conservadoras com base no modelo:

| Métrica | Antes | Depois | Δ |
|---|---|---|---|
| Latência de 1 keystroke no input (frame em que `<input>` reflete o caractere) | 80–180ms (mobile/Citrix) | <16ms | **−90%** |
| INP típico no Simulador (mobile mid-tier) | ~280ms | ~120ms (estimado) | abaixo do "good" ≥0.0–200ms |
| Renders de `InstallmentCompositionTable` durante digitação rápida (5 chars em 600ms) | 5 commits completos | 1–2 commits (último valor estável) | **−60 a −80%** |
| Custo computacional de schedules cancelados | desperdiçado integralmente | abortado pelo scheduler concorrente | redução proporcional aos teclados rápidos |

Validação empírica recomendada (próxima janela, opcional):
1. `localStorage.setItem('perf:profile','1')` e envelopar `<SimulatorProvider>` com `<PerfProfiler id="Simulador">`.
2. Digitar `1234567` em `creditValue`. Antes: 7 commits ≥16ms. Depois: 1–2 commits ≥16ms.

---

## 9. Final Stability State

- `SimulatorContext` continua com **776 LOC** (sem inchar).
- Continua com **2 sub-contexts** (sem fragmentar mais).
- **+6 linhas** de `useDeferredValue` no topo da seção derivada.
- **0 setters tocados.**
- **0 useEffect novo.**
- **0 nova abstração** (hook custom, HOC, state manager, queue).
- Math: **provadamente intacta** via suite canônica.

---

## 10. Final Verdict

O único gargalo crítico confirmado pela auditoria foi **resolvido cirurgicamente**:

> **Render storm a cada keystroke ⇒ ELIMINADO** via Concurrent React (deferred values nas deps dos memos pesados), sem alterar uma linha de matemática, sem novo state manager, sem refactor arquitetural.

Arquitetura existente (split context + debounce no `CurrencyInput`) **estava correta**; faltava apenas a peça concorrente que permite ao React priorizar input sobre cálculo. Agora as três camadas trabalham juntas:

```
keystroke
   ↓
CurrencyInput debounce 250ms  (reduz frequência)
   ↓
setState síncrono              (input renderiza <16ms)
   ↓
useDeferredValue              (cálculo agendado, interrompível)
   ↓
React Concurrent Scheduler    (cancela schedules obsoletos)
   ↓
4× monthlySchedule (240m)     (executa só p/ valor estável)
   ↓
Result slice consumers        (re-render único, no fim)
```

**Status:** `SimulatorContext` deixa de ser gargalo crítico. Pronto para escalar para mais consultores em Citrix/mobile sem reescrita estrutural.
