# Complete Strategy Content Rewrite

Reescrita integral do conteúdo das 24 estratégias do módulo **Estratégias
Patrimoniais** para tom técnico, consultivo e conservador — alinhado à
referência oficial (estratégia legada de **Compra à Vista** no módulo
Investimentos).

## Rewrite Principles Applied

- Tom técnico, sóbrio, matemático. Sem hype.
- Linguagem de engenharia financeira, não de marketing.
- Verbos no condicional/indicativo neutro: "tende a", "pode", "depende de".
- Premissas explicitamente ilustrativas (`ADM_TOTAL=1,25`, `FIN_TOTAL=1,80`,
  `CDI_LIQ=8,5% a.a.`, `CAP_RATE=0,55% a.m.`), declaradas no topo do arquivo.
- Disclaimer mantido: "Valores ilustrativos — simulação não constitui promessa
  de retorno".

## Compra à Vista Rewrite

Reconstruída para refletir o racional original mostrado na tela legada
(Investimentos → Compra à Vista):

1. **Preservação de liquidez** como ideia central — capital próprio permanece
   investido em renda fixa em vez de ser convertido em ativo único.
2. **Rendimento mensal** do capital aplicado compensa parte (ou toda) a
   parcela do consórcio.
3. **Comparativo matemático** entre consórcio (~1,25× crédito) e financiamento
   (~1,80× crédito).
4. **Sem números fantasiosos**: removidos "multiplicador 3x–5x", "leverage
   sem dívida", "arbitragem mais poderosa do mercado consórcio".
5. Cálculos ilustrativos usam a equivalência composta `((1+i)^(1/12)−1)`
   para rendimento mensal.

## Strategy Tone Standardization

Aplicado às 24 estratégias. Substituições representativas:

| Antes | Depois |
|---|---|
| "Multiplicador patrimonial real: 3x a 5x" | (removido) |
| "Arbitragem patrimonial mais poderosa do mercado" | "A decisão patrimonial central é preservar liquidez" |
| "Crescimento exponencial de patrimônio" | "Crescimento patrimonial composto, dependente da disciplina de reinvestimento" |
| "Alavancagem extrema" | "Exposição patrimonial maior, sem juros bancários" |
| "Renda passiva acelerada" | "Renda passiva programada para a fase pós-laboral" |
| "Estratégia mais forte do portfólio" | (removido) |
| "Capítulo: Multiplicação" | "Capítulo: Acumulação" |
| Título "Multiplicação de Cotas" | "Acumulação por Cotas Sucessivas" |
| Título "Renda Passiva" | "Renda Passiva Programada" |

## Financial Plausibility Corrections

- Cap rate locatício explicitado como ilustrativo (`0,55% a.m.`) e marcado
  como "depende de mercado, vacância, custos".
- Removida afirmação "aluguel real ajustado por inflação ⇒ vantagem
  inflacionária" sem ressalva; substituída por "aluguel reajustável conforme
  índices".
- Retrofit Patrimonial: margem teórica passa a explicitar "margem real depende
  do mercado" em vez de afirmar 15% líquido.
- Energia Solar: removidos números absolutos não suportados (R$ 1.500/mês,
  +R$ 295/mês), substituídos por "depende do consumo e tarifa locais".
- Equipamentos Pesados / Agro / Expansão Produtiva: payback ilustrativo
  substituído por "calcular com hora-máquina contratada" / "conforme execução
  comercial".

## Hype Removal Pass

Termos eliminados em todo o arquivo (busca textual):

- "multiplicador" (exceto onde se refere a referência matemática neutra)
- "explosão", "explosivo", "exponencial" (no sentido promocional)
- "poderoso", "mais forte", "decisivo" (no sentido promocional)
- "riqueza acelerada", "leverage extremo", "ganho garantido"
- "fantasia patrimonial", "promessa", "mágico"

## Calculation Corrections

- Todas as fórmulas agora explicitam premissa e horizonte.
- Resultado de rendimento mensal usa equivalência composta correta
  `(1+i)^(1/12) − 1` em vez de divisão simples por 12.
- Cap rate aplicado uniformemente (`0,55% a.m.` → 6,8% a.a.) com label
  "ilustrativo".
- Custos comparativos (consórcio vs. financiamento vs. crédito rural / FINAME)
  apresentados em faixas, não valores fechados.

## Consultive Narrative Standardization

Estrutura aplicada a todas as 24 estratégias:

1. `howItWorks` — mecânica operacional descritiva, sem adjetivos promocionais.
2. `patrimonialLogic` — racional financeiro com escopo definido.
3. `liquidityImpact` — efeito objetivo no caixa do cliente.
4. `timing` — quando faz sentido, sem urgência artificial.
5. `advantages` — benefícios estruturais condicionais ("quando bem
   dimensionada", "tende a", "em mercados favoráveis").
6. `risks` / `commonMistakes` / `whenNotToUse` — preservados e reforçados.

## Final Module State

- 24 cards renderizados em sequência editorial única
  (`STRATEGY_LIBRARY_ORDERED`), ordem flagship-first.
- Header do módulo simplificado: "Estratégias patrimoniais" + parágrafo
  descritivo neutro (removido "cada uma uma engenharia completa").
- CTA dos cards mantido: **Abrir Estratégia Completa** / **Fechar Estratégia
  Completa**.
- Disclaimer institucional preservado em cada bloco de cálculos.
- Zero alterações no engine financeiro, nos contratos de simulação ou na
  fachada `useProposalData()`.

## Final Verdict

O módulo passa a se ler como **consultoria patrimonial conservadora**: cada
estratégia descreve sua engenharia, seus trade-offs e suas premissas, sem
prometer resultado. A referência oficial (Compra à Vista) é honrada — a
preservação de liquidez e o rendimento do capital aplicado em paralelo são
agora a tese central do flagship, com os demais conteúdos calibrados no
mesmo registro técnico.
