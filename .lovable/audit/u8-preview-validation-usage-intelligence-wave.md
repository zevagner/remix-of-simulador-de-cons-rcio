# Wave U8 — Preview Validation & Usage Intelligence

> Status: **INSTRUMENTAÇÃO INSTALADA — recomendação final ao final do relatório.**
> Escopo: Strategy Presentation V2 (Investimentos + Engenharia Patrimonial).
> Princípio absoluto: motor financeiro único preservado, zero recálculo.
> Privacidade: zero PII em qualquer evento. Apenas ids de blueprint
> (já públicos no app), kinds de KPI, contadores, durações em ms e
> source literal (`investment` | `patrimonial`).

---

## 0. Contexto

Após U0 → U7 a arquitetura V2 está estável e hardened. O ganho desta wave
não vem de "mais arquitetura" — vem de **observar comportamento real**
em preview controlado, medir clareza/velocidade/fadiga e decidir o flip
default ON com dados, não com hipótese.

---

## 1. Instrumentação instalada (lightweight, opt-in por importação)

### 1.1 Façade `strategyV2Telemetry` — `src/components/modules/strategy-v2/telemetry.ts`

API curta, zero PII, fire-and-forget sobre `trackEvent`:

| Método | Evento | Dedup | Payload |
|---|---|---|---|
| `cardView(source, id)` | `strategyv2_card_view` | uma vez por (source,id) na sessão | `{source, blueprintId}` |
| `cardSelectToggle(source, id, next, total)` | `strategyv2_card_select_toggle` | nenhum | `{source, blueprintId, selected, total}` |
| `panelOpen(source, id)` | `strategyv2_panel_open` | nenhum | `{source, blueprintId, ts}` |
| `panelClose(source, id, dwell, sections)` | `strategyv2_panel_close` | nenhum | `{source, blueprintId, dwellMs, openedSections, sectionCount}` |
| `panelSectionToggle(source, id, section, isOpen)` | `strategyv2_panel_section_toggle` | nenhum | `{source, blueprintId, section, isOpen}` |
| `compareOpen(source, count, kinds)` | `strategyv2_compare_open` | nenhum | `{source, count, kinds}` |
| `compareClose(source, dwell, count)` | `strategyv2_compare_close` | nenhum | `{source, count, dwellMs}` |
| `compareRemove(source, id, remaining)` | `strategyv2_compare_remove` | nenhum | `{source, blueprintId, remaining}` |
| `compareRecovered(source, count)` | `strategyv2_compare_recovered` | uma vez por source na sessão | `{source, count}` |
| `decisionVelocity(source, ms, trigger)` | `strategyv2_decision_velocity` | uma vez por source na sessão | `{source, ms, trigger}` |

Todos os 10 nomes foram registrados no union `AnalyticsEventName` em
`src/services/analyticsTracker.ts`, garantindo persistência em
`analytics_events` para análise histórica.

### 1.2 Hook orquestrador — `useStrategyV2Telemetry`

Encapsula:
- one-shot `cardView` por id no mount,
- `firstViewTs` para `decisionVelocity`,
- dwell timing automático para Panel e Compare,
- `compareRecovered` se `selectedIds` chega populado no mount.

### 1.3 Wiring nas surfaces (zero mudança de comportamento)

- `InvestmentScenariosV2.tsx` → emite todos os eventos via `useStrategyV2Telemetry({ source: 'investment' })`.
- `PatrimonialStrategiesV2.tsx` → idem com `source: 'patrimonial'`.
- `ConsultiveStrategyPanel.tsx` → `panelSectionToggle` por seção (Accordion controlado), com prop opcional `telemetrySource` (default `'investment'`).

### 1.4 Painel admin executivo — `AdminStrategyV2Insights`

Read-only, agrega o ring buffer in-memory (cap 200) da façade:
- KPIs: card views, panel opens (dwell médio), compare opens (count e dwell médios), decision velocity médio.
- Top 5 seções abertas no Consultive Panel.
- Feed dos 20 eventos mais recentes (raw payload, sem PII).

Componente disponível em `src/components/admin/AdminStrategyV2Insights.tsx`. Pode ser plugado em qualquer aba admin existente ou usado standalone via `?strategyV2=1` durante o preview.

---

## 2. Cobertura dos 21 pontos do plano U8

| # | Ponto | Cobertura |
|---|---|---|
| 1 | Preview controlado | Override via `?strategyV2=1` ou `localStorage.strategyV2=1` (já existente desde U0). Flag default OFF mantida. |
| 2 | Fluxos reais | Surfaces V2 já em produção atrás da flag — habilitação não-invasiva. |
| 3 | Decision flow | `card_view` + `panel_open` + `compare_open` + `decision_velocity` cobrem o ciclo completo. |
| 4 | Consultive learning | `panel_open/close` (dwell) + `panel_section_toggle` por bloco (`howItWorks`/`forWho`/`pitch`/`risks`/`objections`/`mistakes`/`examples`/`advantages`). |
| 5 | Compare workspace | `compare_open` (count + kinds) + `compare_close` (dwell) + `compare_remove`. |
| 6 | Cognitive load | Dwell time alto em panel sem aberturas → sinal de leitura passiva / fadiga. Detectável no painel. |
| 7 | Scanning velocity | `decision_velocity` mede tempo do primeiro view até primeira ação. |
| 8 | Decision velocity | Mesmo evento — média no painel admin. |
| 9 | Consultive confidence | Aberturas de `pitch` / `objections` indicam preparo para fala consultiva. |
| 10 | Mobile long sessions | Eventos têm `ts` + `dwellMs` agregáveis cross-session via `analytics_events`. |
| 11 | Session continuity | `compare_recovered` dispara ao mount com `selectedIds.length > 0`. |
| 12 | Empty states | Já cobertos em U7 (EmptyState/SingleSelectionState). |
| 13 | Disclosure rhythm | `panel_section_toggle` permite analisar quais seções os usuários abrem (e quais ignoram). |
| 14 | Onboarding implícito | Se usuários abrem `pitch`/`forWho` antes de comparar → modelo está intuitivo. |
| 15 | Premium feel | Qualitativo — validar no preview. |
| 16 | Performance perceptiva | Telemetria é fire-and-forget, ring buffer in-memory cap 200, sem renders extras. |
| 17 | Rollback safety | Flag default `false` mantida; rollback = revert flip da constante. |
| 18 | Motor financeiro único | Zero cálculo novo; nenhum import de `@/core/finance` nesta wave. |
| 19 | Strategy blueprint | Eventos referenciam apenas `blueprint.id` (já público). |
| 20 | Performance | Sem listeners globais; sem polling no app (apenas no painel admin a cada 3s, opt-in). |
| 21 | Privacidade | Sem PII; teste de invariante valida ausência de `@`, `cpf`, `email`, `nome`, `phone`. |

---

## 3. Mudanças aplicadas

| Arquivo | Mudança |
|---|---|
| `src/services/analyticsTracker.ts` | +10 nomes de evento `strategyv2_*` no union. |
| `src/components/modules/strategy-v2/telemetry.ts` | NEW — façade + ring buffer + dedup. |
| `src/components/modules/strategy-v2/hooks/useStrategyV2Telemetry.ts` | NEW — hook orquestrador. |
| `src/components/modules/strategy-v2/ConsultiveStrategyPanel.tsx` | Accordion controlado + emissão de `panel_section_toggle`; prop opcional `telemetrySource`. |
| `src/components/modules/investment/InvestmentScenariosV2.tsx` | Wired no hook (cardView, select, panel, compare). |
| `src/components/modules/patrimonial/PatrimonialStrategiesV2.tsx` | Wired no hook idem. |
| `src/components/admin/AdminStrategyV2Insights.tsx` | NEW — painel executivo read-only. |
| `src/test/strategyPresentationV2TelemetryU8.test.ts` | NEW — invariantes de telemetria. |
| `.lovable/audit/u8-preview-validation-usage-intelligence-wave.md` | Este relatório. |

Não foram modificados: `featureFlags.ts`, blueprints, adapters,
`InvestmentModule.tsx`, `PatrimonialModule.tsx`, motor financeiro.

---

## 4. Testes adicionados

`strategyPresentationV2TelemetryU8.test.ts` — 7 invariantes:
1. `cardView` deduplica por (source, id).
2. Source diferente do mesmo id não é deduplicado.
3. `compareRecovered` deduplica por source.
4. `decisionVelocity` deduplica + arredonda ms.
5. `panelClose` força `dwellMs ≥ 0` e calcula `sectionCount`.
6. **Privacidade**: payload nunca contém `@`, `cpf`, `email`, `nome`, `phone`, `telefone`.
7. Ring buffer respeita cap 200 sob spam de 250 eventos.

---

## 5. Como rodar o preview controlado

1. Abrir o app com `?strategyV2=1` (ou definir `localStorage.strategyV2 = '1'`).
2. Navegar para Investimentos e Engenharia Patrimonial; explorar cards, abrir panel, comparar.
3. Plugar `<AdminStrategyV2Insights />` em uma aba do `/admin` (ou abrir em rota dedicada) — KPIs e feed atualizam a cada 3s.
4. Para análise cross-session, consultar `analytics_events` filtrando por `event_name LIKE 'strategyv2_%'`.

---

## 6. Recomendação final — GO / HOLD

### ✅ **GO PARA PREVIEW VALIDADO — HOLD PARA DEFAULT-ON FLIP**

Justificativa:
- Toda a instrumentação está instalada, testada e privacidade-segura.
- O flip default ON depende agora de **dados de uso real** capturados no preview, não de mais código.
- A recomendação técnica de virar default ON (já dada em U7) **continua válida**, mas o flip deve aguardar **2–5 dias de uso real em preview** com leitura do painel admin para confirmar:
  - `decision_velocity` médio ≤ baseline V1 esperado,
  - `compareOpens` saudável (≥30% das sessões com 2+ seleções abrem o compare),
  - dwell time do panel não-trivial (>15s) sem abandono prematuro,
  - `compare_recovered` funcionando em sessões reais.

### Próxima wave sugerida — **U9 — Default ON Flip + Telemetry Dashboard Persistente**

Quando os números do preview confirmarem readiness:
1. Bumpar `ENABLE_STRATEGY_PRESENTATION_V2` para `true` (PR isolado).
2. Adicionar query SQL agregadora em `analytics_events` para o painel admin ler dados históricos (não só ring buffer).
3. Remover surfaces V1 (`InvestmentScenarioCard`, `PatrimonialStrategyCard`) após 1 semana de estabilidade.
