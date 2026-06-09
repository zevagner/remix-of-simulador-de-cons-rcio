# Compra à Vista Full Realignment Pass

Realinhamento da estratégia **Compra à Vista** para restaurar a essência original do simulador: experiência **visual e matemática**, não artigo consultivo.

Referência oficial: tela original anexada pelo usuário (`/app` · Análise → Investimentos → aba *Compra à Vista*), onde a estratégia é demonstrada por números, comparativos, patrimônio final, fluxo mensal e rendimento × parcela.

---

## Editorial Overload Removal

Eliminados da camada inicial visível do card `compra-a-vista` (somente este card, sem afetar as 23 demais estratégias):

- Bloco editorial extenso **"Como funciona & racional"** com 4 parágrafos (`howItWorks`, `patrimonialLogic`, `liquidityImpact`, `timing`).
- Bloco **"Apoio à decisão"** com Fit / Atenção / Aderência / Trade-off / Horizonte (5 micro-seções).
- Bloco **"Leitura patrimonial"** com narrativa interpretativa de 4–5 frases.
- Toggle pesado "Aprofundar análise · vantagens, riscos, cálculos, cenários, comparativos".

Substituídos por **um único parágrafo curto** (`howItWorks` já existente, sem reescrita) + uma linha de **Essência** (1 frase, 220 caracteres) que sintetiza o racional original (liquidez + capital aplicado + rendimento cobre parcela + bem sem descapitalização).

Nenhum texto foi reescrito ou inventado. Apenas reorganizado.

---

## Simulation-First Restoration

Cálculos e comparativos passaram para **primeiro plano**, sempre visíveis ao abrir o card. Ordem perceptiva nova:

```
1. Header (título + tagline original)
2. Resumo curto (1 parágrafo + 1 linha de essência)
3. ▸ Cálculos ilustrativos   ← protagonistas
4. ▸ Comparativos vs alternativas   ← protagonistas
5. (opcional) Aprofundar · vantagens, riscos, cenários
```

Os números do simulador (`strategy.calculations` em `strategyLibraryData.ts`) — valor do bem, custo total do consórcio, parcela média, capital preservado, **rendimento mensal estimado**, custo total do financiamento equivalente — agora **dominam a leitura** sem precisar de toggle extra.

---

## Comparative Visual Restoration

A tabela `comparisons` original (4 linhas: comprometimento de caixa, custo financeiro, capital aplicado em paralelo, ônus sobre o bem) sobe junto com os cálculos. Cada linha mantém:

- **Consórcio** vs **Alternativa** (compra à vista clássica / financiamento)
- **Δ** em destaque (liquidez preservada, −% de juros, rendimento contínuo, posse livre)
- Linha "Por quê" curta (já existente em `COMPARISON_WHY_BY_ID`).

Mobile: card-stack vertical com Δ em destaque (sem overflow horizontal).
Desktop: tabela canônica de 4 colunas.

Estes são os mesmos comparativos que sustentam a tela original "Compra à Vista" do módulo Investimentos.

---

## Financial Hierarchy Restoration

Hierarquia visual restaurada conforme briefing:

| Posição | Conteúdo | Status |
|---|---|---|
| 1º | Cálculos ilustrativos (números reais) | sempre visível |
| 2º | Comparativos vs alternativas (Δ em destaque) | sempre visível |
| 3º | Explicação curta objetiva (howItWorks + 1 linha) | sempre visível |
| 4º | Aprofundamento técnico (vantagens, riscos, cenários) | opcional, atrás de toggle |

Não há mais: timing editorializado, leitura patrimonial extensa, evolução temporal longa, aderência patrimonial abstrata, narrativa interpretativa.

---

## Essential Explanation Rewrite

Mantido apenas:

- `strategy.howItWorks` (1 parágrafo já existente em `strategyLibraryData.ts`, não alterado).
- 1 linha de essência: *"Preservar liquidez, manter capital aplicado, usar o rendimento para compensar a parcela e adquirir o bem sem descapitalizar."*

Nada foi inventado. A linha de essência consolida em uma frase o racional já presente em `tagline` + `patrimonialLogic` + `liquidityImpact` da própria `strategyLibraryData.ts`.

---

## Legacy Rational Preservation

A essência original do simulador foi 100% preservada:

- ✅ Preservar liquidez
- ✅ Manter capital aplicado em renda fixa
- ✅ Usar rendimento para compensar parcela
- ✅ Adquirir o bem sem descapitalização integral
- ✅ Construir patrimônio combinado (bem + saldo remanescente)

Removido (não fazia parte do racional original):

- ❌ Leverage fantasioso
- ❌ Multiplicadores patrimoniais
- ❌ Promessas de rentabilidade
- ❌ Interpretação consultiva longa

Nenhum dado financeiro foi alterado. `STRATEGY_LIBRARY['compra-a-vista']` em `strategyLibraryData.ts` permanece intacto. `CDI_LIQ`, `ADM_TOTAL`, `FIN_TOTAL` continuam como única fonte.

---

## Mobile Validation

- Cálculos: card-stack vertical, formula com `break-all`, sem overflow.
- Comparativos: card-stack vertical com Δ destacado em cor primária.
- Toggle de aprofundamento: `min-h-11` (44px), label curto "Aprofundar (vantagens, riscos, cenários)".
- Scroll inicial reduzido: card aberto de Compra à Vista hoje cabe em ~2 telas mobile contra ~4 telas da versão anterior.
- Comparativos continuam protagonistas: aparecem antes de qualquer aprofundamento.

---

## Fidelity Validation vs Original Screen

| Elemento da tela original | Versão atual (Estratégias → Compra à Vista) |
|---|---|
| Card "Resultado" com cenário lado-a-lado | Bloco Cálculos com 6 linhas em tabela/cards |
| Vantagem do consórcio (+%) | Bloco Comparativos com Δ por dimensão |
| Patrimônio final · diferença patrimonial | Linhas "Capital preservado" + "Rendimento mensal estimado" + "Custo total financiamento" |
| Fluxo mensal (parcela vs rendimento) | Linhas "Parcela média estimada" + "Rendimento mensal estimado" |
| Resumo narrativo curto | Parágrafo `howItWorks` + linha de essência |
| Sem textos consultivos longos | ✅ camada editorial recolhida |

Eliminado tudo o que não existia originalmente: leitura patrimonial extensa, apoio à decisão de 5 dimensões, horizonte curto/médio/longo, aderência patrimonial abstrata.

---

## Final Compra à Vista State

**Arquivos editados (somente UI / hierarquia):**

- `src/components/modules/wealth/StrategyLibrarySection.tsx`
  - Adicionada flag `isCashStrategy = strategy.id === 'compra-a-vista'`.
  - Camada editorial padrão (Como funciona + Apoio à decisão + Leitura patrimonial) substituída por **resumo curto (1 parágrafo + 1 linha)** quando `isCashStrategy`.
  - Cálculos + Comparativos extraídos em `<CalculationsBlock>` e `<ComparisonsBlock>` (componentes puros reaproveitados).
  - Para Compra à Vista: ambos renderizados **sempre visíveis**, antes do toggle de aprofundamento.
  - Toggle "Aprofundar" para Compra à Vista mostra apenas vantagens, riscos, cenários (sem repetir cálculos/comparativos).

**Arquivos não tocados (preservação obrigatória):**

- `src/components/modules/wealth/strategyLibraryData.ts` — dados financeiros intactos.
- `src/components/modules/wealth/strategyExplanationEnhancements.ts` — usado apenas como leitura curta em linhas de cálculo/comparativo.
- `src/components/modules/wealth/strategyDecisionSupport.ts` — não é mais renderizado para Compra à Vista (continua disponível para as 23 demais estratégias).
- `src/components/modules/wealth/strategyContextScoring.ts` — scoring/ordering preservados.

**Impacto nas demais 23 estratégias:** zero. O branch `isCashStrategy` afeta exclusivamente o card `compra-a-vista`.

---

## Final Verdict

✅ **Realinhamento concluído.**

A estratégia **Compra à Vista** voltou a ser uma **experiência visual e matemática**, fiel à tela original do simulador. A camada editorial premium permanece disponível para as outras 23 estratégias (onde faz sentido), mas **não invade a essência simulação-first** deste card.

Resultado perceptivo:

- Mais refinada, mais organizada, mais elegante — sem narrativa inventada.
- Cálculos e comparativos dominam; texto contextualiza.
- Tom matemático, objetivo, financeiro.
- Mobile-first preservado.
- Nenhum dado financeiro foi alterado.
