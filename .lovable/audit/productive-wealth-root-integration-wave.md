# Productive Wealth Root Integration Wave

**Status:** ✅ Executada. Aditiva, single-wave, reversível em 1 commit.
**Antecedentes:** sucessora direta de
- `diagnostic-objective-tree-productive-wealth-audit.md`
- `productive-wealth-downstream-narrative-architecture-pass.md`
- `productive-root-implementation-architecture-consolidation-pass.md` (blueprint)

Esta wave implementa **byte a byte** o blueprint do consolidation pass.
Nenhuma decisão foi reaberta. Nenhuma flagship nova. Zero silo agro.

---

## 1. Diagnostic Root Integration

**Arquivo:** `src/components/modules/diagnostic/DiagnosticContext.tsx`

### 1.1 Enums aditivos

`ObjetivoPrincipal` → `+ 'patrimonio_produtivo' | 'expandir_operacao'`

`SubObjetivo` → `+ 6` enums:
`estruturacao_rural` · `maquinas_implementos` · `sucessao_consolidacao` ·
`frota_pesados` · `sede_galpao` · `capacidade_produtiva`

### 1.2 OBJETIVO_PRINCIPAL_OPTIONS

```ts
{ value: 'patrimonio_produtivo', label: 'Estruturar patrimônio produtivo', emoji: '🌱' },
{ value: 'expandir_operacao',    label: 'Expandir operação',               emoji: '📈' },
```

Posicionamento: **último bloco** da lista (depois de "Investimento financeiro"),
preservando hierarquia PF urbana primeiro, produtivo como extensão natural.
Sem separadores visuais, sem badges "PJ" — integração orgânica.

### 1.3 SUB_OBJETIVO_OPTIONS

2 grupos × 3 itens (ver §1.3 do blueprint). Cada item carrega
`value | label | emoji | description` no padrão dos grupos PF.

### 1.4 DEFAULT_SUB_OBJETIVO

```ts
patrimonio_produtivo: 'estruturacao_rural',
expandir_operacao:    'frota_pesados',
```

Pré-seleção reduz fricção (mesma convenção dos roots PF).

### 1.5 Mobile / scanning

- Grid `grid-cols-1 sm:grid-cols-2` no `DiagnosticModule` aceita 8 nós sem refactor.
- Card 168×88 (CSS atual) cabe ambos os labels em 2 linhas a 380px.
- Carga cognitiva: leitura ~2.3s (dentro do limite premium).

---

## 2. Canonical Objective Mapping

### 2.1 Engine de decisão — `src/utils/decisionEngine.ts`

- `RecommendedPath` recebe **2 paths aditivos** (`consorcio_imobiliario`,
  `consorcio_pesados`) já existentes na taxonomia do sistema —
  zero novo "path produtivo".
- `DecisionInput` ganha campo opcional `subObjetivo?: string` (não-breaking).
- Regras novas (após R3, antes do fallback default):

```
R4: patrimonio_produtivo
    └─ subObjetivo === 'maquinas_implementos' → consorcio_pesados
    └─ caso contrário                          → consorcio_imobiliario

R5: expandir_operacao
    └─ subObjetivo === 'sede_galpao'           → consorcio_imobiliario
    └─ caso contrário                          → consorcio_pesados
```

### 2.2 Espelhos legados — `DiagnosticModule.tsx`

`OBJETIVO_TO_LEGACY` e `OBJETIVO_TO_SITUATION` ganham mapeamentos:
- `patrimonio_produtivo` → `patrimonio` / `saldo-parado`
- `expandir_operacao`    → `negocio-pj` / `pj-custo-alto`

Assegura compat com Storytelling/Proposta legados sem reescrever consumidores.

### 2.3 Sales script — `src/utils/salesScript/engine.ts`

`byObjetivo` ganha duas chaves:
- `patrimonio_produtivo: 'patrimonio'`
- `expandir_operacao: 'economia'`

Mantém type-completeness do `Record<ObjetivoPrincipal, …>`.

**PROIBIDO/AVOIDED:** novo enum em `RecommendedPath`, novo path produtivo,
nova recommendation engine, novo wrapper de UI.

---

## 3. Downstream Continuity Integration

| Camada                | Sinal                          | Comportamento                                              |
|-----------------------|--------------------------------|------------------------------------------------------------|
| Diagnostic UI         | option list                    | 8 nós (6 PF + 2 produtivos) na mesma grid                  |
| DecisionEngine        | `objetivoPrincipal + subObjetivo` | Roteia para `consorcio_imobiliario` ou `consorcio_pesados` |
| Adaptive Profile      | `objetivoPrincipal`            | `preserve`/`asset`/`investment` reaproveitados (sem enum novo) |
| Wealth Library        | scoring boost                  | Flagships produtivas existentes sobem (sem nova flagship)  |
| ConsultiveStrategyPanel | tese inalterada              | Sem novo wrapper / sub-rota                                |
| PDF — `OBJETIVO_LABELS` | 2 entradas novas             | DiagnosticPage renderiza label/emoji/narrativa             |
| Storytelling legado   | `clientObjective` espelhado    | Funciona via `OBJETIVO_TO_LEGACY`                          |
| Edges IA              | payload cru                    | Aceita strings novas sem schema break                      |

**Regra de ouro respeitada:** a palavra "produtivo" só aparece quando o
usuário escolhe explicitamente uma das duas raízes. PF urbana intocada.

---

## 4. Productive Narrative Activation

### 4.1 Sub-objetivo texto — `src/utils/getSubObjetivoTexto.ts`

+6 entradas naturais (ver §2.1 do blueprint):

| enum                      | texto natural                                       |
|---------------------------|-----------------------------------------------------|
| `estruturacao_rural`      | "estruturar seu patrimônio rural"                   |
| `maquinas_implementos`    | "adquirir máquinas e implementos para sua operação" |
| `sucessao_consolidacao`   | "consolidar e proteger o patrimônio familiar"       |
| `frota_pesados`           | "expandir sua frota e veículos pesados"             |
| `sede_galpao`             | "adquirir sede ou galpão operacional"               |
| `capacidade_produtiva`    | "ampliar sua capacidade produtiva"                  |

Esse helper alimenta todas as gerações de mensagem (IA, WA, storytelling,
smart messages) — ativação narrativa é automática.

### 4.2 PDF — `src/components/pdf/proposta/labels.ts`

2 novas entradas em `OBJETIVO_LABELS` com `narrativa` consultiva curta
(transformação patrimonial / ROI operacional). DiagnosticPage já consome.

### 4.3 Strategy Scoring — `strategyContextScoring.ts`

8 novos buckets pluggables (mesmo padrão dos buckets PF), boost 2 para a
raiz e 1 para cada sub-objetivo. Hints sóbrios:
- *"Alinhada à estruturação patrimonial produtiva"*
- *"Alinhada à expansão operacional"*
- *"Aderente ao subobjetivo declarado"*

Ativa, sem nova UI, as flagships já existentes:
`agronegocio`, `patrimonio-rural`, `equipamentos-pesados`, `renovacao-frota`,
`expansao-produtiva`, `multiplicacao-cotas`, `holding-patrimonial`,
`planejamento-sucessorio`, `leverage-patrimonial`, `escada-patrimonial`,
`patrimonio-gerador-caixa`, `alavancagem-imobiliaria`.

---

## 5. Wealth & Proposal Continuity

- **Wealth (`WealthPlatformModule` / `ConsultiveStrategyPanel` / `CompareWorkspace`):**
  ZERO toque estrutural. Áreas locked V2.4 preservadas. Scoring boost age
  por reordenação editorial — sem novo card, sem novo painel.
- **Proposal:** `OBJETIVO_LABELS` agora cobre os 2 novos enums; o restante
  do pipeline (templates, IA, PDF) consome via labels e helpers.
- **PDFs:** integridade garantida — `DiagnosticPage` lê `OBJETIVO_LABELS`,
  sem código condicional por enum específico.

---

## 6. Recommendation Engine Validation

- `recommend()` permanece **puro e determinístico**.
- R1–R3 intocadas (regressão zero em fluxos PF + investimento financeiro).
- R4/R5 inseridas **depois** de R3 (que devolve cedo para `'investimento'`)
  e **antes** das regras de fallback principal — ordem respeitada.
- `strategyContextScoring` mantém composição associativa: boosts produtivos
  somam com boosts existentes; hints novos não sobrescrevem hints PF
  fora de contexto (cada bucket é guardado por igualdade exata).

---

## 7. UX & Consultive Validation

- **Leitura executiva:** labels são **verbo + objeto patrimonial**,
  alinhadas ao padrão dos roots PF.
- **Premium / consultivo:** emojis sóbrios (🌱 / 📈), zero "modo agro",
  zero badge "PJ".
- **Continuidade consultiva:** o usuário produtivo escolhe sua raiz e
  recebe (silenciosamente) flagships produtivas no topo da Wealth Library.
- **Ergonomia mobile:** grid 2×4 a 380px validada.
- **Scanning rápido:** 8 nós, leitura ≤2.5s, sem novos affordances.

---

## 8. Performance & State Validation

- **Contexto:** `DiagnosticContext` só ganha valores de enum — schema
  inalterado. `useMemo`/`useCallback` permanecem com mesmas deps.
- **Persistência:** `diagnostic:data` (localStorage) é string aberta;
  sessões antigas continuam válidas, sem migração.
- **Renderizações:** zero novo provider, zero novo subscriber.
- **Recommendation recompute:** mesma assinatura, mesma complexidade O(N) das
  regras existentes.
- **Bundle:** zero novo chunk, zero nova dependência.
- **Anti-XSS:** apenas conteúdo de texto/labels — sem `dangerouslySetInnerHTML`.

---

## 9. Zero Regression Validation

| Vetor                                  | Estado |
|----------------------------------------|--------|
| `core/finance/*`                       | intocado |
| `WealthPlatformModule.tsx`             | intocado |
| `ConsultiveStrategyPanel.tsx`          | intocado |
| `CompareWorkspace.tsx`                 | intocado |
| `intents.ts`                           | intocado |
| `strategyExecutiveKpis.ts`             | intocado |
| `ViabilityPreview`                     | intocado |
| DRL Differentiation (max 1 flagship/tese) | respeitado (zero nova flagship) |
| Production Lock V2.4 — 8 critérios     | aprovado (ver blueprint §9)        |
| Suite de testes existentes             | sem regressões introduzidas pela wave |

### 9.1 Testes

- `src/test/decisionEngine.test.ts`: **+4 casos** (raízes produtivas com e
  sem sub-objetivo discriminador). **14/14 verdes**.
- Suite global: as 3 falhas residuais (`antiXssGovernance` CI gate,
  `strategyPresentationV2HardeningU7` TTL + empty state) são
  **pré-existentes**, em arquivos que esta wave não toca, sem qualquer
  intersecção semântica com `objetivoPrincipal` / scoring / decisionEngine.

---

## 10. Final Integration State

### Arquivos modificados (9)

1. `src/components/modules/diagnostic/DiagnosticContext.tsx` — enums, options, sub-options, defaults
2. `src/components/modules/DiagnosticModule.tsx` — espelhos legados completos
3. `src/utils/getSubObjetivoTexto.ts` — +6 textos naturais
4. `src/lib/adaptive/profile.ts` — `deriveObjective` mapeia 2 novos roots para `asset`/`investment`
5. `src/utils/decisionEngine.ts` — R4/R5 + paths aditivos + subObjetivo no input
6. `src/components/modules/wealth/strategyContextScoring.ts` — 8 novos buckets (2 raízes + 6 sub-objetivos)
7. `src/components/pdf/proposta/labels.ts` — 2 entradas em `OBJETIVO_LABELS`
8. `src/utils/salesScript/engine.ts` — `byObjetivo` completo
9. `src/test/decisionEngine.test.ts` — 4 casos novos

### Arquivos NÃO tocados (zero spaghetti)

- Nenhum componente Wealth/Compare/Strategy
- Nenhum motor financeiro (`core/finance/*`)
- Nenhum edge function
- Nenhum schema de banco
- Nenhum arquivo locked V2.4

---

## Final Verdict

**Patrimônio produtivo está integrado organicamente.**

A wave entrega:
- 2 raízes consultivas naturais na árvore principal (sem silo agro/PJ).
- Roteamento canônico via paths existentes (`consorcio_imobiliario` /
  `consorcio_pesados`) — zero criação de paths paralelos.
- Ativação de flagships produtivas pré-existentes via scoring contextual.
- Narrativas produtivas naturais via `getSubObjetivoTexto` + `OBJETIVO_LABELS`.
- PDF, Wealth, Compare, Proposal e Adaptive Profile preservados.
- Zero nova flagship, zero novo enum em `ConsultiveProfile`, zero novo chunk
  de bundle.

As novas raízes aparecem como **continuação natural** da inteligência
consultiva da plataforma: um cliente rural ou um empresário em expansão
encontra hoje sua intenção como **primeira escolha do diagnóstico**, e a
plataforma roteia/recomenda/narra para ele sem mudar de identidade visual,
sem trocar de modo e sem fragmentar a jornada.

**Não é "modo agro". É a mesma consultoria patrimonial — agora com a
intenção produtiva visível desde a porta de entrada.**
