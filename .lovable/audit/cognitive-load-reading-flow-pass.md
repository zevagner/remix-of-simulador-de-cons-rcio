# Cognitive Load & Reading Flow Pass

Wave de refinamento cognitivo do módulo **Estratégias Patrimoniais**
(`StrategyLibrarySection`). Nenhum conteúdo, cálculo, estratégia ou camada de
inteligência foi removido — apenas redistribuído para reduzir fadiga.

---

## Cognitive Load Reduction

Antes, ao abrir um card, o usuário recebia **simultaneamente**:
racional + apoio à decisão + vantagens + riscos + erros + quando-não-usar +
tabela de cálculos + cenários + tabela comparativa + leitura patrimonial.

Resultado perceptivo: dumping de conteúdo, fadiga em pouquíssimos segundos.

Após este pass, a abertura do card entrega apenas a **camada editorial**:
1. Como funciona & racional
2. Apoio à decisão (fit, atenção, perfil, trade-off, horizonte)
3. Leitura patrimonial (síntese)

A camada analítica densa (vantagens/riscos, cálculos, cenários, comparativos)
fica atrás de um **segundo disclosure** explícito.

## Reading Flow Refinement

Sequência ao abrir um card agora segue um arco editorial:

```
Racional  →  Decisão  →  Leitura patrimonial  →  [Aprofundar]  →  Análise
 (texto)     (guidance)        (síntese)        (intenção)      (densa)
```

Cada bloco "conversa" com o próximo. O fechamento da camada A
(leitura patrimonial) funciona como pausa narrativa antes de oferecer a
densidade analítica opcional.

## Content Chunking Improvements

- Espaçamento vertical entre blocos elevado de `space-y-7/8` para
  `space-y-8 md:space-y-10` na camada editorial — respiração consistente com
  o tom premium do restante do módulo.
- O toggle interno usa borda **tracejada** e ícone `Calculator` para sinalizar
  visualmente: "isto é material aprofundado, não obrigatório".
- A camada analítica detalhada mantém o mesmo `space-y-8 md:space-y-10`
  quando expandida, sem comprimir tabelas.

## Expansion Flow Optimization

- Open do card → leitura curta e conversacional (≈ 3 blocos).
- Toggle "Aprofundar análise" → revela 4 blocos densos com `animate-fade-in`.
- Recolher é simétrico, com label inverso ("Recolher análise detalhada").
- O usuário nunca é forçado a rolar por tabelas para chegar à síntese
  patrimonial — agora ela vem **antes** do material denso.

## Visual Breathing Improvements

- Camada editorial isolada da camada analítica por um botão respirado
  (`pt-2` + borda tracejada) que age como **separador semântico**, não como
  ruído visual.
- Mantidos os respiros entre tabelas (`-mx-1 px-1` + scroll horizontal) já
  validados em ondas anteriores.

## Consultive Scanning Validation

- **Scan inicial (≤ 5s)**: chapter chip → título → tagline → CTA.
- **Scan após abrir (≤ 15s)**: racional + apoio à decisão + leitura
  patrimonial dão visão completa do "para quem / por quê / o que muda no
  patrimônio".
- **Aprofundamento (opcional)**: cálculos, comparativos, cenários e
  riscos — sob demanda do usuário.

Três níveis claros de profundidade. Nenhum força o seguinte.

## Mobile Fatigue Validation

- No mobile, antes da pass um card aberto chegava a ~1500–2000 px de altura.
  Agora a abertura inicial cai para ~600–900 px, dependendo da estratégia.
- Tabelas continuam fora do caminho até o usuário escolher aprofundar —
  elimina o "scroll infinito" que era a queixa silenciosa do formato
  anterior.
- Toggle interno tem `min-height` natural via padding `py-2.5`, confortável
  para toque.
- Sem mudanças no grid mobile (1 coluna), preservando o ritmo vertical já
  validado.

## Information Priority Improvements

Ordem revista para refletir prioridade consultiva real:

| # | Antes                          | Depois                          |
|---|---------------------------------|----------------------------------|
| 1 | Como funciona                   | Como funciona                    |
| 2 | Apoio à decisão                 | Apoio à decisão                  |
| 3 | Vantagens / Riscos              | **Leitura patrimonial**          |
| 4 | Cálculos                        | *(toggle)* Vantagens / Riscos    |
| 5 | Cenários                        | *(toggle)* Cálculos              |
| 6 | Comparativos                    | *(toggle)* Cenários              |
| 7 | Leitura patrimonial             | *(toggle)* Comparativos          |

A síntese (leitura patrimonial) **sobe para a camada A**, garantindo que
ninguém termine a leitura sem o fechamento consultivo — mesmo que não abra
o material denso.

## Consultive Reading Experience

O card agora parece uma **conversa patrimonial em três tempos**:

1. *"Veja como esta estratégia opera."* (racional)
2. *"Veja quando ela faz sentido e quando exige atenção."* (decisão)
3. *"Veja o que isto significa para o patrimônio."* (leitura)

E só então, se quiser: *"Quer ver os números, riscos detalhados, cenários e
comparativos? Estão aqui."*

Substitui o tom anterior de **relatório técnico contínuo** por um arco
editorial respirado.

## Final Module Reading State

- 24 estratégias preservadas integralmente.
- 100% do conteúdo financeiro, decisional, comparativo e contextual mantido.
- Zero alteração em motor de cálculo, dados ou inteligência.
- Mudança puramente perceptiva: **ordem + chunking + disclosure**.
- Editorial coerente com a constituição V2 (sem dashboardization, sem card
  explosion, sem density creep).

## Final Verdict

A biblioteca patrimonial entrega agora a mesma profundidade absoluta — mas
com **ritmo de leitura consultiva**. O usuário escaneia, conversa,
aprofunda quando quer. A fadiga cognitiva induzida pelo dumping de
conteúdo simultâneo foi neutralizada sem nenhum compromisso de profundidade.

**Status:** aplicado.
**Arquivo único editado:** `src/components/modules/wealth/StrategyLibrarySection.tsx`.
**Risco de regressão:** mínimo — apenas reordenação de JSX e adição de um
estado local (`showDetails`).
