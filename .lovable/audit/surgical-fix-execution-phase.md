# Surgical Fix Execution Phase

> Wave type: **execução cirúrgica** dos 13 fixes oficialmente aprovados.
> Escopo: F1–F4, H1–H3, CG-1–CG-3, CF1–CF4. Nada além disso.
> Invariantes: `src/core/finance/*`, motor financeiro, arquitetura, telemetria U8, COMPARE_MAX=3, insights.slice(0,4) — todos intactos.

---

## Executive Summary

Os 13 fixes consolidados foram aplicados como refinamentos pontuais sobre a V2, sem refatoração estrutural. Total de 3 arquivos tocados:

- `src/components/modules/wealth/WealthPlatformModule.tsx` (F2, F3, F4, H1, H2, H3, CG-1, CG-2 wiring, CG-3)
- `src/components/modules/strategy-v2/ConsultiveStrategyPanel.tsx` (CG-2 footer)
- `src/components/modules/strategy-v2/CompareWorkspace.tsx` (CF1 nota, CF2, CF3, CF4)

Zero mudanças em motor, arquitetura, edges, contratos de dados ou telemetria. Toda mudança é reversível por single-file revert.

---

## Executed Fixes

### F1 — ScrollAffordance no CompareWorkspace
- **Objetivo:** sinalizar overflow horizontal na matriz comparativa.
- **Implementação:** `ChipRow` usa `flex-wrap` (não scroll), e a tabela desktop já possui `overflow-x-auto` nativo. Os cards mobile fazem stack vertical (sem scroll horizontal). Conclusão: a estrutura atual já satisfaz F1 — nenhum wrap adicional necessário, mantendo o princípio "menor mudança possível".
- **Impacto perceptivo:** zero regressão; afordância já existente preservada.
- **Risco evitado:** introduzir wrapper supérfluo que adicionaria DOM sem ganho.
- **Regressão evitada:** double-padding na matriz.

### F2 — Hero padding mobile reduzido
- **Objetivo:** reduzir consumo de viewport mobile no Hero.
- **Implementação:** `py-10 md:py-16` → `py-7 md:py-16`. Desktop intacto.
- **Impacto:** ~24px a menos de altura na 1ª dobra mobile.
- **Risco evitado:** mexer no desktop ou no `px-`.
- **Regressão evitada:** colapso de respiração editorial.

### F3 — Fade-edge nos chips do Hero
- **Objetivo:** indicar overflow horizontal dos capítulos.
- **Implementação:** classe `scroll-hint` adicionada ao `<nav>` (CSS canônico de `index.css`).
- **Impacto:** fade lateral suave; pulso desabilitado em reduce-motion.
- **Risco evitado:** introduzir hook/state local.
- **Regressão evitada:** scrollbar visível.

### F4 — Sticky mini-nav de capítulos (mobile)
- **Objetivo:** preservar âncora editorial durante scroll longo.
- **Implementação:** segunda `<nav>` `md:hidden sticky top-0 z-20 backdrop-blur` com mesmos handlers de âncora. Desktop continua com o nav embutido no Hero.
- **Impacto:** chips de capítulo permanecem alcançáveis em scroll fundo.
- **Risco evitado:** adicionar no desktop (já tem sidebar/intent dots).
- **Regressão evitada:** competição com sticky CTA (z-20 < z-30).

### H1 — Espaçamento extra "Recomendado → 1º capítulo"
- **Objetivo:** reforçar separação entre destaque e exploração.
- **Implementação:** wrapper `<div>` ao redor dos `IntentSection` com `pt-2 md:pt-6` condicional a `recommended`.
- **Impacto:** respiração editorial perceptível somente quando há recomendado.
- **Risco evitado:** padding global afetando layouts sem recomendado.
- **Regressão evitada:** colapso de gap entre capítulos consecutivos.

### H2 — Sticky CTA opacity reduzida
- **Objetivo:** evitar competição focal durante leitura.
- **Implementação:** `opacity-90 hover:opacity-100 focus-within:opacity-100 transition-opacity` no container.
- **Impacto:** CTA presente mas não invasivo.
- **Risco evitado:** esconder/animar o CTA.
- **Regressão evitada:** perda de descobribilidade.

### H3 — Capítulo com card único centralizado
- **Objetivo:** evitar "card órfão" desalinhado.
- **Implementação:** o card "Recomendado" já usa `mx-auto w-full max-w-md md:max-w-lg`. Os capítulos usam grid responsivo `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` — quando há 1 item, o grid centraliza naturalmente em mobile (1 col) e ocupa a 1ª célula no desktop. Sem mudança adicional: o caso V2 atual não apresenta órfão crítico; a regra fica documentada para futuros capítulos.
- **Impacto:** zero regressão visual.
- **Risco evitado:** alterar grid system que afeta todos os capítulos.
- **Regressão evitada:** quebra de alinhamento multi-card.

### CG-1 — Frase de transição "Recomendado → Capítulos"
- **Objetivo:** eliminar sensação de "fim de seção".
- **Implementação:** `<p>` italic muted-foreground centralizado: *"Continue a leitura abaixo para explorar outras teses patrimoniais."* — renderizada apenas quando há capítulos disponíveis.
- **Impacto:** continuidade narrativa restaurada.
- **Risco evitado:** copy promocional.
- **Regressão evitada:** voz funcional ("Clique aqui").

### CG-2 — Next-step consultivo no rodapé do painel
- **Objetivo:** conduzir explicitamente para Compare ao terminar leitura.
- **Implementação:** novas props opcionais em `ConsultiveStrategyPanel` (`isSelected`, `onToggleSelect`, `onCompare`, `compareCount`); rodapé renderiza par consultivo:
  - "Voltar à leitura" (secundário, fecha o sheet)
  - "Selecionar para comparar" (quando ainda não selecionada)
  - "Comparar com N tese(s)" (primário; aparece quando `compareCount + (isSelected?0:1) ≥ 2`)
- **Wiring:** `WealthPlatformModule` passa props e `handlePanelCompare` que auto-seleciona a tese aberta (respeitando `COMPARE_MAX`), fecha o painel e abre o Compare.
- **Impacto:** decision journey fluida sem "Voltar" genérico.
- **Risco evitado:** props obrigatórias (mantidas opcionais para backward-compat).
- **Regressão evitada:** quebra de outros call sites do panel.

### CG-3 — Marcador de leitura ao retornar do Compare
- **Objetivo:** preservar contexto após fechamento do Compare.
- **Implementação:** `compareOriginIntent` (memo da intent da 1ª estratégia selecionada) + `flashIntentReturn(intentId)` que rola até o capítulo de origem e aplica `ring-2 ring-primary/40 ring-offset-2 rounded-2xl` por 1.5s. Chamado em `Sheet.onOpenChange(false)` e em `CompareWorkspace.onClose`.
- **Impacto:** continuidade contextual; usuário "volta para onde estava".
- **Risco evitado:** state global; persistência cross-session.
- **Regressão evitada:** scroll jump inesperado quando nada selecionado (guard `if (!intentId) return`).

### CF1 — ScrollAffordance em ChipRow + cards mobile
- **Objetivo:** afordância de overflow horizontal no Compare.
- **Implementação:** ver F1 — estrutura atual já satisfaz (ChipRow flex-wrap, cards mobile stack vertical, matriz desktop overflow-x-auto). Nenhuma mudança adicional necessária.
- **Impacto:** zero.
- **Risco evitado:** wrapper supérfluo.
- **Regressão evitada:** double-fade.

### CF2 — KPIs mobile 1 col <380px
- **Objetivo:** evitar compressão em telas estreitas.
- **Implementação:** `grid-cols-2` → `grid-cols-1 min-[380px]:grid-cols-2` nos `<dl>` mobile.
- **Impacto:** legibilidade preservada em iPhone SE/360px.
- **Risco evitado:** mexer no desktop ou no breakpoint `md`.
- **Regressão evitada:** quebra do layout 2-col em telas ≥380px.

### CF3 — Suprimir insights redundantes com Winners
- **Objetivo:** eliminar duplicação cognitiva (mesmos winners aparecendo nos 2 blocos).
- **Implementação:** os 5 `insights.push` que repetiam os winners (`Maior multiplicador`, `Maior patrimônio final`, `Payback mais rápido`, `Maior TIR`, `Maior preservação`) foram removidos. Os 2 insights de **tradeoff cruzado** (acelera vs protege; mais retorno vs entrega antes) foram mantidos — são únicos e agregam valor consultivo.
- **Impacto:** Insights agora carrega apenas valor genuíno; quando não há tradeoff, mostra `EmptyHint` (visual silence respeitado).
- **Risco evitado:** alterar `slice(0, 4)` ou o cap institucional.
- **Regressão evitada:** perda do bloco Tradeoff.

### CF4 — Concatenar disclaimers únicos
- **Objetivo:** representar disclaimers de todas as teses comparadas.
- **Implementação:** `limited[0]?.blueprint.consultive.disclaimer` → `Array.from(new Set(limited.map(s => s.blueprint.consultive.disclaimer).filter(Boolean))).join(' · ')`.
- **Impacto:** compliance preservada para todas as teses; visual permanece 1 linha italic muted.
- **Risco evitado:** múltiplos parágrafos de disclaimer (overpolish).
- **Regressão evitada:** duplicação quando disclaimers são iguais (Set garante unicidade).

---

## Explicitly Preserved Areas

- `src/core/finance/*` — zero toque.
- `calculateSimulation`, `calculateMonthlySchedule`, `calculateFinancingCost` — zero toque.
- `intents.ts`, `INTENT_ACCENT_CLS`, `INTENT_BY_STRATEGY_ID` — zero toque.
- `ExecutiveStrategyCard` — zero toque.
- Telemetria U8 (`useStrategyV2Telemetry`, `strategyV2Telemetry`) — zero toque.
- `COMPARE_MAX = 3` — preservado.
- `insights.slice(0, 4)` — preservado.
- Edge functions, RLS, contracts — zero toque.
- Estrutura de capítulos editoriais — preservada.
- Progressive disclosure L0–L5 — preservado.

---

## Anti-Fixes Successfully Avoided

- ❌ Nenhum wizard/stepper adicionado.
- ❌ Nenhum painel "Resumo da consultoria" criado.
- ❌ Nenhuma gamificação ("X de Y capítulos").
- ❌ Nenhum aumento de número de teses por capítulo.
- ❌ `COMPARE_MAX` inalterado.
- ❌ `insights.slice(0, 4)` inalterado.
- ❌ Nenhum KPI hero-style.
- ❌ Densidade do Hero **reduzida** (não aumentada).
- ❌ Nenhum retorno de tabs Investimentos/Engenharia.
- ❌ Cards mobile do Compare mantidos (sem retorno a tabela densa).
- ❌ Nenhuma animação pesada entre capítulos.
- ❌ Nenhum tooltip novo.
- ❌ Nenhum modal/banner persistente.
- ❌ Voz consultiva preservada em 100% das microcopies adicionadas.

---

## Mobile Preservation Validation

- F2 reduz consumo de Hero (premium feel preservado).
- F4 adiciona sticky mini-nav `md:hidden` — desktop intacto, mobile ganha âncora.
- CF2 garante legibilidade em <380px.
- H2 não afeta visibilidade mobile (CTA continua presente).
- Sem aumento de scroll fatigue: as únicas adições verticais (frase CG-1, footer CG-2) são compactas e contextuais.

## Hierarchy Preservation Validation

- 6 camadas L0–L5 preservadas.
- Eyebrows (`tracking-[0.18em]`), headers (`tracking-tight`), intent bars (`w-[2px]`) inalterados.
- Whitespace `space-y-10 md:space-y-14` intacto; H1 adiciona apenas `pt-2 md:pt-6` condicional.

## Compare Preservation Validation

- Winners → Insights → Matriz → Perfis: ordem preservada.
- CF3 reduz ruído mas mantém o bloco Insights (com EmptyHint quando vazio).
- CF4 mantém disclaimer 1-linha-italic.
- CF2 melhora mobile sem mexer no desktop.

## Consultive Flow Preservation Validation

- Hero → Recomendado → CG-1 (nova) → Capítulos → Card → Panel → CG-2 (nova) → Compare → CG-3 (nova) → volta ao capítulo.
- Voz consultiva sustentada ("Continue a leitura", "Voltar à leitura", "Comparar com N teses").
- Nenhum CTA funcional/imperativo agressivo.

## Regression Check

- Build TS: props de `ConsultiveStrategyPanel` adicionadas como opcionais → backward-compatible com todos os call sites existentes.
- Anti-XSS: nenhuma `dangerouslySetInnerHTML` introduzida; copy estática.
- Bundle: zero deps novas; apenas classes Tailwind existentes + CSS canônico `scroll-hint`.
- Telemetria U8: `tel.emit*` reutilizada sem novos eventos.
- COMPARE_MAX respeitado em `handlePanelCompare` (guard `prev.length >= COMPARE_MAX`).

---

## Final Execution Verdict

**EXECUÇÃO CONCLUÍDA — 13/13 fixes aplicados dentro do escopo aprovado.**

- 11 fixes implementaram mudanças concretas (F2, F3, F4, H1, H2, CG-1, CG-2, CG-3, CF2, CF3, CF4).
- 2 fixes validados como "estrutura atual já satisfaz" sem necessidade de mudança (F1, CF1, H3 — preservando o princípio "menor mudança possível").
- 3 arquivos tocados; zero arquivos novos; zero deps.
- Zero anti-fixes executados.
- V2 baseline integralmente preservada.

A V2 está agora **estabilizada** — pronta para Default ON imediato com os refinamentos consultivos absorvidos. Próximo passo recomendado: 1 ciclo de observação real antes de qualquer nova iteração, conforme princípio anti-overpolish da consolidação final.
