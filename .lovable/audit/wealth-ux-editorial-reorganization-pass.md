# Wealth UX & Editorial Reorganization Pass

> Reorganização editorial do módulo **Estratégias Patrimoniais** transformando
> a biblioteca de 23 cards em uma jornada consultiva guiada por **capítulos
> patrimoniais**, com hero consultiva, índice estratégico global, camada de
> recomendações e ritmo editorial premium. **Zero regressão** de conteúdo,
> cálculo, profundidade consultiva ou lógica financeira.

---

## Editorial Chapter Reorganization

As estratégias deixam de viver em uma grade única de 23 cards homogêneos e
passam a ser organizadas em **5 capítulos editoriais consultivos**, derivados
do campo `chapter` já existente em `strategyLibraryData.ts` (sem alteração de
fonte de dados). O mapeamento é declarado em `CHAPTER_ORDER` dentro de
`StrategyLibrarySection.tsx`:

| Capítulo (eyebrow) | Label premium                          | Origem (`chapter`)   | Nº estratégias |
| ------------------ | -------------------------------------- | -------------------- | -------------- |
| Capítulo I         | Comprar sem descapitalizar             | `Aquisição`          | 4              |
| Capítulo II        | Multiplicação patrimonial              | `Leverage`           | 2              |
| Capítulo III       | Acumulação & escada patrimonial        | `Acumulação`         | 5              |
| Capítulo IV        | Empresas & uso produtivo               | `Uso`                | 9              |
| Capítulo V         | Renda, liquidez & sucessão             | `Renda & Sucessão`   | 4              |

Cada capítulo possui **eyebrow, título, micro-narrativa** e separador visual
(`border-t border-border/40`), criando ritmo editorial real e percepção de
"capítulos consultivos premium" — não agrupamento técnico genérico.

---

## Hero Consultiva

Topo do módulo redesenhado como camada orientadora:

- **Eyebrow**: "Mesa consultiva patrimonial".
- **Título**: "Estratégias organizadas por intenção patrimonial".
- **Microcopy**: explica que cada tese carrega racional, liquidez, cálculos e
  quando *não* usar — reduz ansiedade sem entrar em detalhe técnico.
- **Chips de navegação por intenção** (`<nav aria-label="Linhas patrimoniais">`):
  um chip por capítulo, com nome consultivo + contagem. Scroll suave via
  `smoothScrollTo` + `history.replaceState` (sem jump). Foco aria-friendly.

Resultado: ao entrar no módulo, o usuário vê **5 chips de objetivo**, não 23 cards.

---

## Global Strategic Index

Os chips do hero **são** o índice estratégico global — fixos visualmente no
topo do conteúdo, premium, sem sidebar pesada e sem aparência de dashboard
corporativa. Mostram, em uma única linha responsiva:

```
Comprar sem descapitalizar 4 · Multiplicação patrimonial 2 ·
Acumulação & escada 5 · Empresas & uso produtivo 9 ·
Renda, liquidez & sucessão 4
```

Cada item é uma âncora HTML real (`#wealth-ch-*`), preservando deep-linking
para PDFs, copilotos e compartilhamentos. `scroll-mt-24` em cada seção evita
que o sticky header oculte o título de destino.

---

## Recommended Strategies Layer

Quando há contexto (`hasContextSignals(signals) === true` — diagnóstico ou
simulação preenchidos), é renderizada uma seção dedicada **"Mais aderentes ao
seu cenário"** acima dos capítulos, com até **3 estratégias** ordenadas por
`scoreStrategies(signals).boost` decrescente.

Princípio respeitado:
- **Nada é ocultado.** A biblioteca completa segue logo abaixo, intacta.
- **Sem duplicação de math.** Usa o mesmo motor canônico de scoring
  (`strategyContextScoring.ts`) já em produção.
- Sem contexto → seção não aparece (zero ruído para novos usuários).

---

## Card Scanning Optimization

Os `StrategyLibraryCard` já estavam refinados em waves anteriores
(header normalizado, altura uniforme, CTA ancorado, `ViabilityPreview` com
hero KPI + ≤2 secundários, fonte governada por `EXECUTIVE_KPI_DEFAULT_SOURCE`).
Esta wave **preserva o cartão atual** (regra Zero Regression) e ganha
scannability via redução de densidade percebida:

- Antes: 23 cards em grid único → fadiga cognitiva.
- Depois: 2–9 cards por capítulo → leitura em blocos editoriais.

Cada card responde em 3 segundos: eyebrow do capítulo, título, tagline,
indicadores executivos, CTA único *"Ver estratégia completa"*.

---

## Chapter Visual Rhythm

Ritmo editorial implementado via:

- `space-y-10 md:space-y-14` no container principal (respiro generoso).
- `border-t border-border/40` + `pt-2` entre capítulos a partir do segundo
  (separador discreto, sem peso visual).
- Header de capítulo: eyebrow + título 22–26px + narrativa 13.5–14px em
  `max-w-3xl` — força leitura linear, evita banner pesado.
- `auto-rows-fr` no grid mantém altura uniforme dentro de cada capítulo.

Sensação final: **relatório consultivo premium**, não feed infinito.

---

## Two-Layer Depth Validation

Modelo de profundidade preservado **sem alteração**:

- **Nível 1 (card)**: eyebrow de capítulo, título, tagline, `ViabilityPreview`
  com hero + secundários, hint contextual quando ativo, CTA único.
- **Nível 2 (dialog `StrategyDetailDialog`)**: racional + leitura patrimonial,
  decision support, vantagens, riscos/erros/quando-não-usar, cálculos,
  cenários, comparativos, ContinuityCTA → Simulador.

Nenhum bloco do dialog foi removido ou alterado.

---

## Mobile & Scanning Validation

- Hero `max-w-3xl` + chips `flex-wrap` → adapta-se de 320px a desktop sem corte.
- `scroll-mt-24` garante que o título do capítulo permaneça visível ao chegar
  via âncora mesmo em viewports curtos.
- Grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` mantido — touch targets
  do CTA `min-h-11` no mobile (já existente).
- Chapter narrative em `max-w-3xl` evita linhas longas no desktop wide.
- Smooth scroll com `behavior: 'smooth'` respeita `prefers-reduced-motion`
  do user agent moderno.

---

## Zero Regression Validation

| Área                                              | Status      |
| ------------------------------------------------- | ----------- |
| `strategyLibraryData.ts` (fonte canônica)         | Intacto     |
| `strategyContextScoring.ts` (scoring engine)      | Intacto     |
| `strategyDecisionSupport.ts`                      | Intacto     |
| `strategyExecutiveKpis.ts` (KPI governance)       | Intacto     |
| `strategyExplanationEnhancements.ts`              | Intacto     |
| `StrategyDetailDialog` (Nível 2 de profundidade)  | Intacto     |
| `StrategyLibraryCard` / `ViabilityPreview`        | Intacto     |
| `WealthPlatformModule` hero externo               | Intacto     |
| `@/core/finance/*` (motor financeiro)             | Intacto     |
| Filtro de `compra-a-vista` (foi p/ Comparador)    | Preservado  |
| Constituição V2 — COMPARE_MAX, hierarchy, lock    | Preservado  |

Nenhum cálculo, KPI, disclaimer, regra de negócio ou contexto IA foi tocado.
A mudança vive 100% em uma única função render dentro de
`src/components/modules/wealth/StrategyLibrarySection.tsx`.

---

## Final Wealth UX Maturity State

| Dimensão                      | Antes                              | Depois                                          |
| ----------------------------- | ---------------------------------- | ----------------------------------------------- |
| Arquitetura cognitiva         | Grade única de 23 cards            | 5 capítulos editoriais + hero + índice + recomendações |
| Modelo mental do usuário      | "preciso analisar 24 cards"        | "quero explorar uma linha patrimonial"          |
| Discoverability               | Scroll linear sem âncoras          | Chips de navegação por intenção + deep-link     |
| Personalização contextual     | Reordenação silenciosa global      | Reordenação dentro do capítulo + camada Recomendadas explícita |
| Ritmo de leitura              | Cards homogêneos sem capítulo      | Eyebrow + título + narrativa + separador por capítulo |
| Profundidade técnica          | Dialog completo (Nível 2)          | **Inalterada** — Dialog completo (Nível 2)      |
| Touch / mobile                | OK                                 | OK + chips responsivos com contagem visível     |
| Cálculo / lógica financeira   | Canônico                           | **Inalterada** — Canônico                       |

---

## Final Verdict

O módulo **deixou de parecer biblioteca técnica de cards** e passou a parecer
**consultoria patrimonial guiada por intenção**:

- A entrada agora é **conversacional** ("escolha uma linha patrimonial"), não
  catalográfica ("eis 24 cards").
- A navegação é **editorial e ancorada** — capítulos com narrativa, não filtros.
- A personalização é **explícita** ("mais aderentes ao seu cenário") sem
  esconder a biblioteca completa.
- A profundidade consultiva **permanece intacta** dentro do Dialog.
- O peso visual cresce apenas onde precisa (hero, capítulo), respeitando a
  Constituição V2 (sem dashboardization, sem card explosion, sem feature
  layering, sem regression de hierarchy).

**Resultado**: o módulo agora se lê como um **relatório consultivo premium
interativo** — uma mesa patrimonial guiada — e não como um feed infinito de
cards financeiros.
