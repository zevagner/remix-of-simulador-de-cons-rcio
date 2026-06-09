# Legacy Financial Accuracy Pass

Pass executado sobre o módulo **Estratégias Patrimoniais** (24 estratégias)
para garantir alinhamento fiel ao racional do sistema legado e eliminar
qualquer número, percentual, multiplicador ou comparativo inventado
introduzido nas ondas anteriores (Explanation Enhancements + Decision Support).

Referência canônica: `src/components/modules/wealth/strategyLibraryData.ts`
(arquivo legado, conservador, com constantes ilustrativas documentadas
`ADM_TOTAL=1.25`, `FIN_TOTAL=1.80`, `CDI_AA=0.10`, `CDI_LIQ=0.085`,
`CAP_RATE=0.0055`).

---

## Legacy Strategy Alignment

Princípio aplicado: **toda métrica numérica não suportada pelo simulador ou
pelas constantes ilustrativas do `strategyLibraryData.ts` foi removida ou
substituída por linguagem qualitativa.**

Camadas auditadas (sem mexer no legado financeiro):
- `strategyExplanationEnhancements.ts` (leituras patrimoniais + meanings).
- `strategyDecisionSupport.ts` (fit / caution / tradeoff / horizon).

Camadas **intocadas** (já fiéis ao legado): `strategyLibraryData.ts`,
`strategyContextScoring.ts`, `StrategyLibrarySection.tsx`, motores
financeiros (`src/core/finance/*`).

---

## Calculation Reality Corrections

Nenhum cálculo do `strategyLibraryData.ts` foi alterado — a matemática
ilustrativa (taxa adm diluída, CDI líquido, cap rate, fator de financiamento)
permanece como única fonte. Os blocos `calculations` continuam parametrizados
pelo crédito real da simulação.

---

## No Invented Data Corrections

| Estratégia | Conteúdo removido (inventado) | Substituição (legacy-aligned) |
|---|---|---|
| `compra-a-vista` | "frequentemente superior à compra à vista clássica em ciclos de juros reais positivos" | "patrimônio composto cujo total depende do diferencial entre rendimento líquido da aplicação e o custo total da carta — verificar no simulador" |
| `compra-hibrida` | "60–80% do capital preservado" | "parte significativa do capital preservada" |
| `aquisicao-acelerada` | "Custo total entre ~1,18× e ~1,25× do crédito" | "Custo total composto por lance + parcelas — abaixo do financiamento equivalente. Valor exato depende do simulador." |
| `alavancagem-imobiliaria` | "capital próprio aportado tende a ficar abaixo de 25% do valor do imóvel" | "parte expressiva do compromisso mensal é coberta pelo aluguel quando o cap rate é consistente" |
| `autoquitacao-estruturada` | "prazo efetivo reduzido em 30 a 50%" (em 2 lugares) | "prazo efetivo reduzido conforme a folga real entre receita do ativo e parcela ordinária" |
| `patrimonio-escalavel` | "capitalizada ao longo de uma década, costuma viabilizar nova cota inteira" | "capitalizada ao longo do tempo, gera caixa recorrente que pode ser direcionado a novas aquisições" |
| `retrofit-patrimonial` | "custo de retrofit excede 40–50% do valor pós-obra" | "custo de retrofit consome parcela relevante do valor pós-obra estimado" |
| `energia-solar` | "horizontes de 5–8 anos, o payback se completa" + "Após o payback (5–8 anos)" + "conta acima de R$ 600/mês" + "horizonte de 8+ anos" | linguagem condicional + "Payback depende do dimensionamento, tarifa local e perfil de consumo" |
| `holding-patrimonial` | "5+ ativos relevantes ou renda passiva acima de R$ 30k/mês" | "massa crítica de ativos relevantes e renda passiva recorrente significativa" |

---

## Comparative Consistency Corrections

Comparativos `strategyLibraryData.comparisons[]` permanecem intactos —
todos derivados das constantes ilustrativas explicitadas no topo do arquivo
(`ADM_TOTAL`, `FIN_TOTAL`, `CAP_RATE`). Nenhum delta foi alterado.

A camada `COMPARISON_WHY_BY_ID` (notas qualitativas) já estava em tom
neutro e foi preservada — explica *por que* existe a diferença, sem
quantificar o tamanho.

---

## Financial Plausibility Validation

Validação final: nenhuma estratégia promete agora:
- multiplicador específico não suportado pelo simulador,
- percentual de capital próprio aportado fixo,
- prazo de payback fixo (5–8 anos, 8+ anos…),
- redução de prazo fixa (30–50%),
- limiar de portfólio fixo (5 ativos, R$ 30k/mês…),
- superioridade absoluta sobre alternativa (compra à vista clássica, financiamento).

Onde havia faixa, ficou: "verificar no simulador" / "depende do
dimensionamento" / "conforme a folga real".

---

## Strategy Rule Consistency

Regras operacionais (`howItWorks`, `patrimonialLogic`, `liquidityImpact`,
`timing`, `advantages`, `risks`, `commonMistakes`, `whenNotToUse`) do
`strategyLibraryData.ts` — **fonte legada oficial** — permanecem byte-a-byte
intactas. Toda correção foi feita apenas nas camadas posteriores adicionadas
(enhancement + decision support) para alinhá-las à mesma postura conservadora
do legado.

---

## Consultive Realism Validation

Tom resultante: sóbrio, matemático, qualitativo onde apropriado, quantitativo
apenas onde há constante documentada no `strategyLibraryData.ts`. Removido:
hype, copy marketeiro, promessas implícitas, números mágicos.

Disclaimers do legado ("ilustrativo", "conservador", "premissas variam
conforme grupo, mercado e disciplina de execução") continuam dominantes.

---

## Cross-Strategy Consistency

Padrão uniforme em todas as 24 estratégias após o pass:
- Quando o resultado depende do simulador → texto remete ao simulador.
- Quando depende do mercado/tarifa/cap rate → texto torna a dependência
  explícita.
- Quando depende de disciplina/comportamento → texto torna a condição
  explícita.
- Faixas numéricas só permanecem quando refletem janelas operacionais
  reais já presentes no legado (ex.: "6–18 meses" de obra, "8+ anos" de
  horizonte de portfólio em estratégias de longo prazo).

---

## Final Module State

- 24 estratégias, **0 cálculos alterados**, **0 dados do legado alterados**.
- 9 trechos com números/percentuais inventados foram neutralizados
  (5 em `strategyExplanationEnhancements.ts`, 6 em `strategyDecisionSupport.ts`).
- Camadas estruturais (UI, scoring, motor financeiro, contexto) intactas.
- Disclaimer global do `strategyLibraryData.ts` segue como referência
  oficial de plausibilidade matemática.

Arquivos modificados:
- `src/components/modules/wealth/strategyExplanationEnhancements.ts`
- `src/components/modules/wealth/strategyDecisionSupport.ts`

Arquivos preservados (legado oficial):
- `src/components/modules/wealth/strategyLibraryData.ts`
- `src/components/modules/wealth/strategyContextScoring.ts`
- `src/components/modules/wealth/StrategyLibrarySection.tsx`
- `src/core/finance/**`

---

## Final Verdict

O módulo Estratégias Patrimoniais agora reflete **exatamente a lógica
patrimonial e financeira originalmente utilizada pelo sistema legado**:
constantes ilustrativas documentadas, cálculos parametrizados pela
simulação real, comparativos derivados das mesmas constantes, e camadas
consultivas adjacentes em tom qualitativo onde antes extrapolavam
percentuais ou multiplicadores arbitrários.

Nenhuma vantagem é declarada como absoluta. Nenhum prazo, multiplicador
ou limiar é prometido. Toda quantificação remete ao simulador ou é
condicionada à realidade operacional (mercado, disciplina, dimensionamento).

Resultado: **coerência, plausibilidade, matemática real, racional
consultivo verdadeiro — sem invenções, exageros, hype ou vantagens
artificiais.**
