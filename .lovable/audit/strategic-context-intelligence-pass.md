# Strategic Context Intelligence Pass

Escopo: `src/components/modules/wealth/strategyContextScoring.ts` (novo) +
`src/components/modules/wealth/StrategyLibrarySection.tsx` (reorder + micro-hint).
Nenhuma estratégia oculta, nenhum modal/IA/chatbot adicionado, nenhuma mudança em motor financeiro.

## Context Signal Mapping

Sinais lidos diretamente (sem novo provider, sem fetch):

| Fonte | Campo |
|---|---|
| `useSimulatorInput()` | `consortiumType`, `creditValue` |
| `useDiagnosticContextSafe()` | `objetivoPrincipal`, `subObjetivo`, `prioridade`, `urgencia`, `temCapitalDisponivel`, `capitalDisponivel` |

`hasContextSignals()` retorna `false` quando nenhum desses sinais existe — nesse caso
o módulo permanece **idêntico ao catálogo editorial original** (zero efeito visual).

## Dynamic Priority Logic

Implementada em `scoreStrategies(signals)` — função pura, determinística:

- Cada regra é um bucket `{ ids[], boost, hint }`.
- Boosts são **somados** quando uma estratégia satisfaz múltiplos sinais.
- O hint preservado é o do **maior boost** (em empate, o primeiro).
- Ordenação: `boost desc → ordem editorial original (estável)`.

Pesos canônicos:
- `2` para objetivo principal (sinal mais forte).
- `1` para tipo de carta, subobjetivo, prioridade, urgência, capital disponível.

## Financial Coherence Rules

Buckets aplicados (resumo):

- **Tipo de carta:** imobiliário → estratégias imobiliárias; auto → veículo;
  pesados → frota/agro/expansão; serviços → PJ.
- **Objetivo principal:** `imovel_investimento` → Renda Passiva / Gerador de Caixa /
  Alavancagem Imobiliária / Leverage; `imovel_moradia` → Compra à Vista / Planejada /
  Reforma / Autoquitação; `investimento` → Leverage / Escada / Multiplicação;
  `veiculo` → Upgrade; `troca_imovel` → Híbrida / Autoquitação / Escalável.
- **Subobjetivo:** `aluguel` → Renda Passiva; `valorizacao` → Reforma / Retrofit;
  `aposentadoria` → Renda Passiva / Sucessório; `protecao` → Holding / Sucessório;
  `uso_profissional` → Frota / Equipamentos / Expansão; etc.
- **Prioridade:** `manter_liquidez` → Leverage / Híbrida / Escada / Reinvestimento;
  `menor_custo` → Compra à Vista / Autoquitação; `rapidez` → Aquisição Acelerada;
  `menor_parcela` → Planejada / Escada / Autoquitação.
- **Capital ≥ 30% do crédito:** boost em Compra à Vista / Leverage / Híbrida / Escada.
- **Urgência imediata:** boost em Aquisição Acelerada / Compra à Vista.

Todas as combinações são plausíveis financeiramente — nenhum bucket promove
estratégias incoerentes (ex.: Compra à Vista nunca recebe boost de "manter liquidez").

## Micro Guidance Layer

Chip institucional renderizado **apenas quando há hint** para a estratégia:

```
[✦ Alinhada ao objetivo informado]
```

Especificação visual:
- `rounded-full`, borda `border-primary/20`, fundo `bg-primary/[0.06]`.
- Texto `text-[10.5px] text-primary/90 font-medium`.
- Ícone Sparkles 2.5×2.5 (sutil).
- Posição: dentro do header, abaixo da tagline, `self-start`.

Hints disponíveis (≤ 5 palavras, tom consultivo):
- "Alinhada ao objetivo informado"
- "Aderente ao subobjetivo declarado"
- "Coerente com perfil de liquidez"
- "Compatível com tipo de carta"
- "Compatível com perfil PJ"
- "Compatível com capital disponível"
- "Compatível com janela curta"
- "Compatível com parcela enxuta"
- "Otimiza custo no cenário simulado"

Sem "IA", sem "recomendação", sem promessa — apenas constatação contextual.

## Strategic Journey Flow

- O header da biblioteca exibe uma linha discreta quando o contexto está ativo:
  *"Ordem ajustada silenciosamente ao contexto da simulação. Nenhuma estratégia é ocultada."*
- A reordenação preserva a ordem editorial original como tie-breaker, evitando
  "embaralhamento" perceptível entre simulações vizinhas.
- Estratégias sem boost permanecem exatamente na sequência editorial canônica.

## Non-Invasive UX Validation

- Nenhum modal, popup, banner, drawer ou toast adicionados.
- Nenhuma IA, nenhuma chamada de rede, nenhum streaming.
- Chip aparece somente onde houver coerência — máximo 1 chip por card.
- Sem badges promocionais, sem "Top 3", sem "Recomendado para você".
- Header consultivo discreto (12px muted) — informa sem instruir.

## Mobile Validation

- Chip respeita `self-start` (não estica em containers flex).
- Reordenação não altera tamanho/altura dos cards (todas mantêm `min-h-[3.6em]` na tagline).
- `auto-rows-fr` + `flex-1` no header continuam garantindo altura perceptiva uniforme.
- Scrolling preservado — nenhum sticky novo, nenhum overlay.

## Discoverability Preservation

- **100% das 24 estratégias continuam visíveis** em todas as configurações de contexto.
- Sem filtros, sem `.filter()`, sem ocultação condicional.
- Quando não há contexto (`hasContextSignals === false`), o array é retornado
  por referência ao `STRATEGY_LIBRARY_ORDERED` original — zero recomputação,
  zero diferença visual.

## Premium Consultive Validation

Resultado perceptivo:
- Quando o consultor abre a biblioteca **sem** simulação preenchida → catálogo editorial limpo.
- Quando abre **com** simulação + diagnóstico → as estratégias mais aderentes
  emergem naturalmente no topo, marcadas por um chip sutil que justifica a
  proeminência sem agredir. As demais permanecem acessíveis, no mesmo grid.
- Sensação: "a mesa entende o cliente" — não "a IA escolheu por mim".

## Final Module State

- `strategyContextScoring.ts` — engine determinística, ~140 linhas, sem dependências externas.
- `StrategyLibrarySection.tsx` — consome `useSimulatorInput` + `useDiagnosticContextSafe`,
  reordena via `useMemo`, injeta `contextHint?: string` no card.
- `strategyLibraryData.ts` — **inalterado**.
- `WealthPlatformModule.tsx` — **inalterado**.
- Nenhum motor financeiro tocado. Nenhum schema/DB alterado.

## Final Verdict

A biblioteca patrimonial passa a operar como uma **mesa consultiva silenciosa**:
lê os sinais já disponíveis, reordena com coerência financeira plausível, e
oferece micro-justificativas elegantes apenas onde fazem sentido. Sem IA visível,
sem marketing, sem recomendação artificial — inteligência contextual discreta,
preservando integralmente a descoberta de todas as 24 estratégias.
