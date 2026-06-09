# Wave U7 — Default-On Readiness & Experience Hardening

> Status: **HARDENING APPLIED — recomendação final ao final do relatório.**
> Escopo: V2 Strategy Presentation (Investimentos + Engenharia Patrimonial).
> Princípio absoluto: motor financeiro único preservado, zero recálculo.
> Gating: `ENABLE_STRATEGY_PRESENTATION_V2` continua OFF até GO oficial.

---

## 0. Contexto

Após U0 → U6, a arquitetura V2 está montada e migrada nas duas verticais
de produção. Este wave executou o **hardening final** focado em:

- estabilidade perceptiva (continuidade, ausência de "vazamentos" de V1),
- readiness técnica para virar default (sem mexer no motor),
- redução de fadiga em sessões longas e em comparações repetidas,
- acessibilidade e paridade de acionamento por teclado / motion-reduce,
- testes de hardening defensivos.

Nenhum cálculo financeiro foi tocado. Nenhum blueprint foi alterado.

---

## 1. Auditoria — 21 pontos do plano U7

| # | Auditoria | Estado | Ação aplicada / nota |
|---|---|---|---|
| 1 | Default-On safety | ✅ OK | `ENABLE_STRATEGY_PRESENTATION_V2 = false` mantido; teste de regressão garante isso até GO. |
| 2 | Orphan V1 states | ✅ HARDENED | Chave de storage versionada (`:v1`) ignora payloads anteriores (ex.: chave legada `strategyV2:compareSelection`). |
| 3 | Hydration edge cases | ✅ OK | Provider lê `sessionStorage` de forma defensiva via `useState` initializer (não há SSR neste app; `typeof window` guard preservado). Selection recovery é determinística. |
| 4 | Long session experience | ✅ HARDENED | TTL de 8h no payload — comparações de uma sessão esquecida não vazam para o próximo uso. |
| 5 | Compare fatigue | ✅ OK | Cap `COMPARE_MAX=3` reforçado por contexto + por componente; CTA de comparação só aparece com 2+ selecionadas; insights capados em 4. |
| 6 | Disclosure fatigue | ✅ OK | `ConsultiveStrategyPanel` mantém `defaultOpen` enxuto (`howItWorks`, `forWho`, `pitch`); demais módulos opt-in. |
| 7 | Scroll loops | ✅ OK | Sheet lateral com `overflow-y-auto`; nenhum auto-scroll programático nas 3 camadas. Header sticky no panel evita perda de contexto. |
| 8 | Focus recovery | ✅ OK | Sheet/Drawer (Radix) já restauram foco ao trigger ao fechar. `ExecutiveStrategyCard` mantém `tabIndex` + `aria-pressed` + `FOCUS_RING_CLS`. |
| 9 | Session continuity | ✅ HARDENED | Cross-tab sync via listener `storage` mantém múltiplas abas alinhadas; payload tem `ts` para auditoria de stale. |
| 10 | No-selection states | ✅ OK | `EmptyState` + `SingleSelectionState` no Compare guiam a próxima ação. |
| 11 | Stale compare states | ✅ HARDENED | Novo `pruneTo(validIds)` permite remover ids que deixaram de existir (ex.: troca de módulo, blueprint removido). |
| 12 | Breakpoint consistency | ✅ OK | Compare matrix em tabela ≥md, stack em mobile; cards em grid 1/2/3 colunas; panel `sm:max-w-xl`. |
| 13 | Reduced-motion parity | ✅ HARDENED | `ENTER_ANIMATION_CLS` agora inclui `motion-reduce:animate-none`; aplicado em Workspace + Panel body. |
| 14 | Keyboard flows | ✅ OK | Card é `role="button"` com Space/Enter; entry "Entender estratégia" é `<button>`; chips de remoção são `<button>` com `aria-label`. |
| 15 | ARIA consistency | ✅ OK | `aria-pressed`, `aria-label`, `aria-hidden` em ícones; eyebrows usam tracking institucional uniforme. |
| 16 | Loading orchestration | ✅ OK | Sem fetches assíncronos nas 3 camadas — tudo deriva de props já calculadas; sem CLS por skeleton. |
| 17 | Performance after long usage | ✅ OK | Memoização preservada (`useMemo`/`useCallback`); writes em sessionStorage são pequenos (≤3 ids); cross-tab listener é único e idempotente. |
| 18 | Microinteraction consistency | ✅ OK | `active:scale-[0.995]`, `hover:shadow-sm`, `transition-colors` consistentes; `FOCUS_RING_CLS` único token. |
| 19 | Cognitive load | ✅ OK | Hierarquia editorial mantida (eyebrow → 1 hero → ≤2 secundários); panel modulariza em accordions; compare separa Winners/Insights/Matriz/Perfis. |
| 20 | Decision velocity | ✅ OK | "Winners" chip + "Tradeoffs" textuais aceleram decisão sem exigir leitura completa da matriz. |
| 21 | Premium feel | ✅ OK | Visual silence preservado: borders 60% opacity, eyebrows 10px tracking-wide, separadores 60% opacity, animações sutis e desativáveis. |

---

## 2. Preservação de invariantes (22–25)

- **Motor financeiro único:** zero novos cálculos. As 3 camadas continuam puramente consumer de `StrategyPresentationData`.
- **Strategy blueprint:** single source of truth intacto (`STRATEGY_BLUEPRINT_BY_ID` + adapters).
- **Rollback seguro:** flag default OFF; surface V1 (`InvestmentScenarioCard`, `PatrimonialStrategyCard`) intacta no módulo.
- **Testes:** suíte financeira intocada; nova suíte U7 adicionada.

---

## 3. Mudanças aplicadas

| Arquivo | Mudança |
|---|---|
| `src/components/modules/strategy-v2/tokens.ts` | `ENTER_ANIMATION_CLS` agora `animate-fade-in motion-reduce:animate-none`. |
| `src/components/modules/strategy-v2/ConsultiveStrategyPanel.tsx` | Body editorial respeita `motion-reduce`. |
| `src/components/modules/strategy-v2/CompareWorkspace.tsx` | `<section>` raiz respeita `motion-reduce`. |
| `src/components/modules/strategy-v2/CompareSelectionContext.tsx` | Storage key versionada `:v1`, envelope `{ids, ts}`, TTL 8h, `pruneTo()`, cross-tab sync via `storage` event, no-op API estendido. |
| `src/test/strategyPresentationV2HardeningU7.test.ts` | Nova suíte de hardening (10 testes). |
| `.lovable/audit/u7-default-on-readiness-hardening-wave.md` | Este relatório. |

Nenhuma mudança em `featureFlags.ts`, `InvestmentModule.tsx`, `PatrimonialModule.tsx`,
`InvestmentScenariosV2.tsx`, `PatrimonialStrategiesV2.tsx`, blueprints ou adapters.

---

## 4. Testes adicionais (26)

Suíte `strategyPresentationV2HardeningU7.test.ts`:

1. Flag default ainda OFF (rollback safety).
2. Storage versionado: ignora chave legada não-versionada.
3. Storage versionado: lê envelope `{ids, ts}` corretamente.
4. Tolerância a payload legado em array puro sob chave v1.
5. TTL: descarta payload > 8h e limpa storage.
6. Persistência: write em sessionStorage com timestamp.
7. Cap `COMPARE_MAX` resistente a spam de toggle.
8. `pruneTo` remove ids ausentes preservando válidos.
9. `pruneTo` é no-op idempotente.
10. `ENTER_ANIMATION_CLS` contém variant `motion-reduce`.
11. CompareWorkspace renderiza empty state.
12. `useCompareSelection` no-op fora do provider não lança.

---

## 5. Recomendação final — GO / NO-GO

### ✅ **GO DEFAULT ON — com gate operacional**

Justificativa técnica:
- Todos os 21 pontos auditados estão **OK ou HARDENED**.
- Zero impacto em motor financeiro / blueprint / testes existentes.
- Rollback continua **instantâneo** (flag → V1 grid intacto nos dois módulos).
- Stale recovery, long-session TTL, motion-reduce e stale id pruning estão cobertos por testes determinísticos.

### Gate operacional sugerido (não-bloqueante, próxima wave U8):

1. **Validação preview/QA real** (1–2 dias) com `?strategyV2=1` antes de flipar a constante.
2. Chamar `pruneTo(presentations.map(p => p.blueprint.id))` em `useEffect` dentro
   de `InvestmentScenariosV2` e `PatrimonialStrategiesV2` quando a futura migração
   passar a usar `CompareSelectionContext` no lugar do `selectedScenarios` local
   do módulo (hoje a seleção continua governada pelo pai — zero risco de stale).
3. Após GO, bumpar `ENABLE_STRATEGY_PRESENTATION_V2` para `true` em PR isolado
   (single-line change), permitindo revert imediato.

**Recomendação:** seguir para **Wave U8 — Default ON Flip + Telemetria** quando a validação preview for confirmada.
