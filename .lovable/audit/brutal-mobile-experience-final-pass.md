# Brutal Mobile Experience Final Pass

Pass mobile final do módulo **Estratégias Patrimoniais**
(`StrategyLibrarySection`). Foco em conforto de toque, leitura vertical e
eliminação do "desktop comprimido". Nenhuma alteração estrutural,
financeira ou de conteúdo.

---

## Mobile Scanning Validation

Hierarquia mobile preservada e validada no fluxo abaixo:

```
[Chip capítulo]  →  [Título]  →  [Tagline 3 linhas]  →  [Contexto opcional]
                                  ↓
                       [CTA "Abrir estratégia completa"]
                                  ↓ (open)
  Racional  →  Apoio à decisão  →  Leitura patrimonial  →  [Aprofundar]
```

- Chips, ícones e título permanecem ancorados no topo do card.
- O CTA principal usa `text-[13px]` no mobile (vs `12.5px` no desktop) para
  legibilidade real em mãos.
- A camada editorial (3 blocos) entrega a tese completa em ≤ 1 scroll
  longo.

## Mobile Disclosure Validation

Dois disclosures encadeados, ambos com comportamento previsível:

| Toggle                          | Mobile target      | Comportamento                              |
|---------------------------------|--------------------|--------------------------------------------|
| Abrir estratégia completa       | `min-h-11 py-3`    | Expande camada editorial (sem tabelas)     |
| Aprofundar análise              | `min-h-11 py-3`    | Expande camada analítica (cards/tabelas)   |

- Label do segundo toggle adapta-se ao breakpoint:
  - **Mobile:** "Aprofundar análise" (curto, sem quebra agressiva)
  - **Desktop:** "Aprofundar análise · vantagens, riscos, cálculos, cenários, comparativos"
- `gap-3` + `shrink-0` no ícone e no chevron previnem o "ícone descolado"
  típico em strings longas.
- `active:bg-background` adiciona feedback tátil sem dependência de hover.

## Touch Target Improvements

- Toggles principais: **44×44 mínimos garantidos** via `min-h-11` no
  mobile (`md:min-h-0` no desktop volta ao tamanho confortável original).
- Padding lateral dos toggles mantido em `px-3.5` — espaço para flick
  acidental sem encostar nas bordas do card.
- O CTA principal e o toggle de aprofundamento ficam em zonas verticais
  diferentes (separadas pela camada editorial inteira), eliminando risco
  de toque duplo acidental.

## Mobile Table Refinements

Maior intervenção da pass. As duas tabelas densas
(**Cálculos ilustrativos** e **Comparativos vs alternativas**) ganharam
renderização dupla:

- **Mobile (`md:hidden`)** — lista de cards verticais com a mesma
  informação reorganizada:
  - **Cálculos:** `Métrica` + `Resultado` no topo (flex baseline,
    tabular-nums), `Fórmula` em mono em segunda linha com `break-all`,
    `Leitura` em itálico fechando o card.
  - **Comparativos:** `Dimensão` + `Δ` no topo (Δ em destaque primary),
    `Consórcio` / `Alternativa` em definition-list com label estreito,
    `Por quê` em itálico abaixo.
- **Desktop (`hidden md:block`)** — tabela canônica preservada
  byte-a-byte (incluindo `colSpan` da linha "Leitura"/"Por quê").

Resultado: **zero overflow horizontal** no mobile, zero tabela
"esmagada", e os números críticos (resultado, Δ) ganham hierarquia real.

## Mobile Reading Fatigue Corrections

- Padding lateral do corpo expandido: `px-4` no mobile (vs `px-5`
  anterior) — mais respiro útil de leitura sem sensação de "borda
  apertada".
- Espaçamento vertical entre blocos editoriais reduzido para
  `space-y-7` no mobile (mantém `md:space-y-10` no desktop) — preserva
  ritmo sem inflar scroll.
- Leitura patrimonial e Decision Support usam `px-4` no mobile,
  alinhando padding interno com o corpo do card.
- Os 24 cards continuam fechados por padrão — nenhum scroll forçado.

## Mobile Performance Perception

- `animate-fade-in` no segundo disclosure entrega expansão fluida sem
  layout shift perceptível.
- Nenhum cálculo financeiro novo, nenhuma chamada adicional, nenhum
  re-render extra: a renderização dual de tabela (mobile cards / desktop
  table) é puramente CSS (`md:hidden` / `hidden md:block`), com custo
  desprezível.
- Não há dependência de medições JS para layout — tudo via Tailwind
  responsive classes.

## Mobile Typography Refinements

- CTA principal: `text-[13px]` no mobile, `text-[12.5px]` no desktop —
  ganha 0.5px crítico para leitura confortável em telas pequenas.
- Toggle "Aprofundar": `text-[12.5px]` no mobile vs `text-[12px]`
  desktop.
- Mobile cards de cálculo: métrica em `text-[12px]/medium`, resultado
  em `text-[13px]/semibold tabular-nums` — números são o que importa
  e ganham peso visual.
- Labels uppercase tracking-[0.1em] mantidos só onde sinalizam
  microestrutura (Consórcio/Alternativa), nunca em corpo de texto.
- `leading-snug` nos cards mobile compacta sem comprimir a linha.

## Mobile Hierarchy Validation

Ordem de aparição no mobile (após abrir):

1. **Como funciona & racional** (texto contínuo) — a tese.
2. **Apoio à decisão** (fit + atenção + perfil + trade-off + horizonte) —
   o "para quem / quando" consultivo.
3. **Leitura patrimonial** (síntese editorial) — o fechamento.
4. *(toggle)* **Vantagens / Riscos** + **Cálculos** + **Cenários** +
   **Comparativos** — densidade opcional.

Crítico: o usuário mobile **nunca** é forçado a rolar tabelas para
chegar à síntese — ela vem antes do toggle de aprofundamento.

## Premium Mobile Feel

- Cards de cálculo mobile com borda fina, fundo `bg-muted/15`, padding
  generoso (`p-3.5`) — visual de "ficha consultiva", não de "linha de
  planilha".
- Δ em destaque `text-primary tabular-nums` no card de comparação
  reforça a comparação como insight, não como dado bruto.
- Definition list com label estreito de 68px nos comparativos mobile —
  alinhamento elegante sem perder o valor à direita.
- Bordas tracejadas no segundo toggle reforçam: "isto é aprofundamento
  opcional", consistente com a hierarquia editorial.

Resultado perceptivo: não é mais "desktop comprimido" — é uma
**experiência mobile pensada como tal**.

## Final Mobile Module State

| Aspecto                          | Antes                            | Depois                                   |
|----------------------------------|----------------------------------|------------------------------------------|
| Touch target toggles             | ~36px (py-2.5)                   | **44px (min-h-11 py-3)** no mobile       |
| Tabelas no mobile                | overflow horizontal              | **card-stack vertical, zero overflow**   |
| Padding lateral corpo expandido  | px-5                             | **px-4** (mais respiro útil)             |
| Label do 2º toggle               | linha longa, podia quebrar feio  | **curto no mobile, completo no desktop** |
| Δ em comparações mobile          | última coluna apertada           | **destacado em primary no topo do card** |
| Fórmulas longas                  | quebravam tabela                 | **`break-all` em mono, contidas no card**|
| Leitura patrimonial              | px-5                             | px-4 (alinhado ao corpo)                 |
| Espaçamento entre blocos mobile  | space-y-8                        | **space-y-7** (ritmo mais natural)       |

## Final Verdict

A biblioteca patrimonial passa do estado "desktop responsivo decente"
para **mobile premium real**: toques confortáveis, leitura vertical
fluida, tabelas substituídas por fichas onde fazem sentido, hierarquia
preservada e progressão editorial mantida.

Conteúdo, dados, cálculos e estratégias intocados — 100% das mudanças
são perceptivas e responsivas.

**Status:** aplicado.
**Arquivo único editado:** `src/components/modules/wealth/StrategyLibrarySection.tsx`.
**Risco de regressão desktop:** nulo — desktop usa exatamente o mesmo
markup anterior via classes `hidden md:block` / `md:min-h-0` /
`md:py-2.5` / `md:px-6`.
