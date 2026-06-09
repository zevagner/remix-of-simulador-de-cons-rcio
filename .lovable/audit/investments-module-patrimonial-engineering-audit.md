# Auditoria Estratégica — Módulo Investimentos vs Engenharia Patrimonial

**Data:** 2026-05-15
**Escopo:** `src/components/modules/InvestmentModule.tsx` + `src/components/modules/investment/**` + `src/hooks/useInvestmentCalculations.ts` + `src/services/proposals/investmentProposalGenerator.ts`
**Tipo:** Diagnóstico estratégico — **zero implementação nesta fase.**

---

## 1. Sumário Executivo

| Dimensão                              | Score | Comentário curto                                                               |
| ------------------------------------- | :---: | ------------------------------------------------------------------------------ |
| Maturidade consultiva                 | 7.5/10| Acima da média do mercado, mas ainda com viés de "comparador de cenários".     |
| Profundidade matemática               | 8.5/10| Engine canônica (`@/core/finance/investment`) sólida, IR regressivo, INCC composto, FVS, Price PMT, Monte Carlo nos lances. |
| Diferenciação vs concorrentes         | 7/10  | StrategicNiches + Storytelling IA destacam, mas falta vocabulário "engenharia patrimonial". |
| Clareza executiva (scanning)          | 7/10  | Bom, mas 5 cenários + 7 nichos + comparador + assumptions geram densidade alta.|
| Aderência ao perfil Caixa             | 9/10  | Disclaimers, tom consultivo, sem promessas de garantia — **muito bem.**        |
| Cobertura de estratégias modernas     | 6/10  | **Lacuna principal:** ausência de autoquitação, escada patrimonial, empilhamento, holding, mercado secundário, TIR/ROI explícitos. |

**Veredito:** o módulo já é **forte como simulador comparativo**, mas ainda é percebido pelo cliente como "calculadora de estratégias" e **não como mesa de engenharia patrimonial**. A virada de chave depende de ~6 estratégias ausentes, vocabulário patrimonial e indicadores executivos (TIR, ROI, multiplicador).

---

## 2. Mapa do que o módulo JÁ possui

### 2.1 Cenários comparativos (5 paths em `useInvestmentScenarios.tsx`)

| ID                   | Nome                          | Categoria   | Lógica                                                          |
| -------------------- | ----------------------------- | ----------- | --------------------------------------------------------------- |
| `investment`         | Aplicar em Investimentos      | referência  | Path 4 — aporte da parcela em CDI (renda fixa)                  |
| `traditional`        | Comprar e Valorizar           | seguro      | Path 1 — contemplação + valorização imobiliária composta        |
| `sale`               | Entrar para Revender          | agressivo   | Path 2 — venda com ágio (carta) ou deságio (cota)               |
| `rental`             | Gerar Renda com Aluguel       | equilibrado | Path 3 — imóvel + renda mensal de locação                       |
| `quick-contemplation`| Usar a Carta para Investir    | estratégico | Path 5 — carta inteira aplicada em CDI pós-contemplação         |

Adicionalmente: **Path 6** (`previdencia-turbinada`) calculado em hook mas atualmente exposto sob outro fluxo (Previdência via INCC + carta corrigida).

### 2.2 Componentes funcionais

- **`InvestmentStrategyTab`** — aba principal: `ScenarioComparisonChart` + `InvestmentScenarioCard[]` + `RecommendationCard`.
- **`CashComparisonTab`** — comparador "Compra à vista vs Consórcio com lance embutido vs Lance livre" (3 modalidades).
- **`CotaMultiplicationCard`** — multiplicação patrimonial (1 carta vs N cotas / mesma parcela total).
- **`StrategicNicheCards`** + **`NicheStorytelling`** — 7 nichos consultivos: reforma, sucessão, energia solar, expansão produtiva, upgrade veículo, renovação frota, agronegócio, equipamentos pesados.
- **`InvestmentSummaryCards`** — KPIs do topo (ganho/percentual/cenário top).
- **`InvestmentAssumptions`** — sliders editáveis (valorização, retorno, yield, ágio/deságio, INCC, CDI %, tipo de venda).
- **`InvestmentStorytelling`** — narrativa IA WhatsApp por cenário.
- **`ConsortiumDataCard`** — leitura cruzada Simulador → Investimento.
- **`InvestmentPdfActions`** + **`InvestmentPrintBlock`** — exportação A4.
- **`AIInsightsPanel`** — recomendação contextual rodapé (boundary Cockpit).

### 2.3 Engine matemática (já canônica)

Confirmado em `mem://logic/investimento/engine-canonica-b1` e `src/core/finance/investment/index.ts`:

- `annualToMonthlyRate` (`(1+i)^(1/12)−1`) — sem drift.
- `compoundGrowth`, `compoundGrowthAnnualMonthly`, `futureValueOfSeries`.
- `inccAdjust` / `inccAdjustYears` (composto mensal/anual).
- `pricePmt` / `pricePmtAnnualMonthly`.
- `calculateInvestmentProjection`.
- IR regressivo único em `src/utils/calculations/investimento.ts` (`calculateIR`).
- Bid analysis com Monte Carlo + percentis (`utils/bidAnalysis/**`).

### 2.4 IA contextual

- `investment-storytelling` (edge) → narrativa WhatsApp 6 linhas por cenário.
- `niche-storytelling` (edge) → roteiro consultivo por nicho.
- `module-copilot` → próximo passo / triggers.
- Façade `centralAI` consolida intents.

### 2.5 Jornada / saídas

- Comparador → Storytelling → Proposta IA (`investmentProposalGenerator.ts`) → PDF/WhatsApp/Compartilhável.
- `InvestmentResultsContext` publica para Proposta sem recálculo.

---

## 3. Classificação por nível de maturidade

| Nível                  | Itens                                                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Básico**             | InvestmentSummaryCards (KPIs), ConsortiumDataCard, sliders de assumptions.                                                                      |
| **Intermediário**      | 5 cenários (paths 1-5), ScenarioComparisonChart, RecommendationCard.                                                                            |
| **Avançado**           | CashComparisonTab (3 modalidades), CotaMultiplicationCard, Path 6 (Previdência turbinada), StorytellingIA por cenário.                          |
| **Premium consultivo** | StrategicNiches (7 nichos com argumento + audience + when), NicheStorytelling IA, InvestmentResultsContext canônico, integração Simulador→PDF.  |

**Falta um 5º nível** que poderíamos chamar de **Engenharia Patrimonial** — onde o módulo deixa de comparar cenários e passa a **construir trilhas patrimoniais multi-ativo, multi-ano, multi-cota**.

---

## 4. Sobreposições detectadas

| Sobreposição                                                                  | Severidade | Recomendação                                                                                                  |
| ----------------------------------------------------------------------------- | :--------: | ------------------------------------------------------------------------------------------------------------- |
| `Path 4` (aplicar em CDI) vs `Path 5` (carta em CDI)                          | Baixa      | Mantida — premissas distintas (capital de origem). Ok, são complementares.                                    |
| `traditional` (valorização) e `rental` (aluguel + valorização)                | Média      | `rental` herda matemática de `traditional`. Considerar consolidar em "imóvel" com toggle aluguel sim/não.     |
| `CashComparisonTab` (lance embutido vs livre) e `Path 5` (carta em CDI)       | Média      | Tema parcialmente sobreposto: ambos discutem alavancagem da carta. Manter, mas linkar cross-reference.        |
| `StrategicNiches` (reforma, frota, agro) e Cenário `traditional`              | Baixa      | Nichos são **abordagem comercial**, cenários são **matemática**. Ok, papéis distintos.                        |
| Recomendação IA (`AIInsightsPanel`) e `RecommendationCard`                    | Média      | Risco de "dois cards de recomendação" no scanning. Avaliar fundir em uma área "Veredito" no header.           |
| `InvestmentStorytelling` por cenário e `proposalGenerator` final              | Baixa      | Diferentes audiências (1 cenário vs proposta consolidada). Manter.                                            |

---

## 5. Lacunas estratégicas vs Engenharia Patrimonial moderna

### 5.1 Estratégias AUSENTES (alto valor consultivo)

| Estratégia ausente                           | O que é                                                                                                  | Por que importa                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Autoquitação**                             | Usar parte da carta contemplada para quitar o saldo devedor do próprio consórcio.                        | Estratégia clássica de redução de prazo / parcela — hoje só aparece no Simulador.|
| **Escada patrimonial (laddering)**           | Sequenciar 2-4 cotas em prazos escalonados para gerar contemplações periódicas (renda/troca cíclica).    | Vocabulário avançado de wealth planning. Ausente.                                |
| **Empilhamento de ativos (stacking)**        | Combinar consórcio + financiamento + recursos próprios em mesmo ativo para reduzir CET combinado.        | Diferenciação de mesa proprietária vs banco de varejo.                           |
| **Renda passiva estruturada multi-cota**     | N cotas pequenas → contemplações sequenciais → 1 imóvel/aluguel a cada X meses.                          | Hoje `CotaMultiplicationCard` só mostra "N cotas pelo mesmo orçamento", sem timing de aluguel sequencial. |
| **Desalienação parcial (refinanciamento da carta)** | Liberar parte da carta usada como garantia após N parcelas pagas.                                  | Liquidez + reciclagem de capital. Ausente.                                       |
| **Arbitragem de contempladas (mercado secundário)** | Compra de cotas contempladas com deságio para ganho na carta + venda do ativo.                    | Hoje só "venda com deságio" (Path 2 inverso). Falta o lado **compra** estruturado.|
| **Holding patrimonial / sucessão estruturada** | Cotas alocadas em PJ holding para blindagem + ITCMD reduzido.                                         | Existe como nicho ("Sucessão"), mas sem matemática (economia ITCMD, custódia).   |
| **Alavancagem PJ (Lucro Real)**              | Taxa administrativa como despesa dedutível → CET efetivo pós-IR.                                         | Citado em nichos (frota/agro/galpão) mas **sem cálculo de economia tributária real**. |
| **Energia solar com payback fechado**        | Comparar fluxo de caixa: parcela do consórcio vs economia mensal de energia → payback meses.            | Existe nicho mas sem matemática de payback.                                      |
| **Capital preservado vs capital comprometido** | KPI: quanto da liquidez do cliente fica preservada usando consórcio vs financiamento bancário.         | Indicador executivo ausente.                                                     |
| **Funding barato (CET vs CDI)**              | "Custo do dinheiro" comparativo: taxa adm anualizada vs CDI / Selic / CDC.                               | Calculado parcialmente em `CashComparisonTab`, sem destaque executivo.           |

### 5.2 Indicadores AUSENTES (linguagem de wealth/family office)

- **TIR implícita (IRR)** por cenário — fluxo de caixa real → taxa interna anualizada.
- **ROI patrimonial** — ganho líquido sobre patrimônio total mobilizado.
- **Multiplicador patrimonial** — quanto de ativo controlado por R$ desembolsado (existe parcialmente em CotaMultiplication, faltando KPI explícito).
- **Payback period** (em meses) — quando o cenário "vira o jogo" vs CDI.
- **CET efetivo do consórcio** vs CET de financiamento equivalente (Caixa SBPE / CDC).

### 5.3 Vocabulário consultivo ausente

- "Engenharia patrimonial" / "trilha" / "arquitetura"
- "Funding" / "alavancagem" / "preservação de liquidez"
- "Multiplicador" / "ladder" / "stacking"
- Hoje predomina vocabulário de "comparativo" e "cenário".

---

## 6. Auditoria por dimensão

### 6.1 Profundidade matemática — 8.5/10

✅ Engine canônica única (`@/core/finance/investment`)
✅ INCC composto, IR regressivo, FVS, Price PMT
✅ Reconciliação Simulador→Investimento sem recálculo
⚠️ Falta TIR (IRR) — cálculo via Newton-Raphson já existe em `core/finance/financing/cet.ts` e poderia ser reusado para fluxo de caixa de cenários.
⚠️ Payback não é exposto como métrica.

### 6.2 Potencial consultivo — 7/10

✅ Storytelling IA + nichos com argumento copy-pronto
✅ Proposta WhatsApp consolidada
⚠️ Gerente alta-renda sente falta de "trilha" (não de "cenário"): cliente quer ver R$ → 5 anos → 10 anos → renda final.
⚠️ Falta visão consolidada multi-cota / multi-ativo (hoje cada cenário é "uma cota").

### 6.3 Potencial de encantamento — 6.5/10

✅ `CotaMultiplicationCard` é **o item mais "wow"** atual (mesma parcela, 3x mais ativos).
✅ Storytelling IA personalizado.
⚠️ Falta efeito "virada de chave" para alta renda — escada patrimonial e holding seriam os candidatos #1.

### 6.4 Clareza operacional — 8/10

✅ Disclaimers obrigatórios, tom educativo
✅ Risco/prazo/contemplação claros nos cards
⚠️ **Liquidez** não tem KPI dedicado (quanto fica preservado)
⚠️ **Timing** de contemplação tratado, mas falta "janela esperada" estatística

### 6.5 Risco de promessa excessiva — 9/10 ✅

✅ DISCLAIMERS.WHATSAPP_INVESTMENT, copy "estimado", sem garantia
✅ Path 2 (revenda) sempre marcado "agressivo" + breakeven calculado
✅ Storytelling IA roda com fragmento `TRUST` no `_shared-edges/promptFragments`
**Nada a corrigir aqui.**

### 6.6 Aderência Caixa — 9/10 ✅

✅ Tom sólido, consultivo, educativo
✅ Sem narrativa de "enriquecimento garantido"
✅ Brand config respeitado

### 6.7 Arquitetura visual — 7/10

⚠️ 5 cenários + 3 abas (Strategy/Cash/Multiplication?) + 7 nichos + assumptions + IA + recomendação → **densidade alta** em desktop, agressiva em mobile.
⚠️ Dois cards de recomendação (RecommendationCard + AIInsightsPanel) competem.
✅ Stepper / collapsible já mitigam.

### 6.8 Jornada consultiva — 6.5/10

Hoje: **economia → comparativo → escolha → proposta**.
Falta: **economia → estratégia → patrimônio → renda → legado** (etapas 4 e 5 são fracas — renda só em `rental`, legado só em nicho `sucessao` sem matemática).

---

## 7. Mapa de Evolução

### A. MANTER (intactos)

- Engine canônica `@/core/finance/investment` + `useInvestmentCalculations`
- 5 paths atuais (são a base matemática válida)
- `InvestmentResultsContext` (fonte única para PDF)
- StrategicNicheCards (catálogo + storytelling)
- Disclaimers, tom Caixa, gates de integridade do PDF
- IR regressivo único

### B. MELHORAR

1. **`CotaMultiplicationCard`** — adicionar timeline de contemplações sequenciais (ladder visual) + KPI multiplicador explícito.
2. **`CashComparisonTab`** — destacar CET efetivo + "capital preservado" como KPI de topo.
3. **Nichos PJ (frota/agro/galpão/expansão)** — adicionar cálculo de **economia tributária Lucro Real** (taxa adm × alíquota IR/CSLL).
4. **Nicho "Energia Solar"** — adicionar simulador de payback (parcela vs economia).
5. **Nicho "Sucessão"** — adicionar economia ITCMD estimada (% × patrimônio).
6. **`InvestmentSummaryCards`** — incluir TIR + Payback + Multiplicador.

### C. CONSOLIDAR

1. Fundir `RecommendationCard` + `AIInsightsPanel` em **um único bloco "Veredito Consultivo"** no header da aba (reduz redundância de scanning).
2. Aproximar `Path 1` (traditional) e `Path 3` (rental) como **um cenário "Imóvel" com toggle** (valorização ± aluguel) — reduz 5 → 4 cards.

### D. REMOVER (ou degradar)

- Nada a remover hoje. Toda peça tem função clara — o problema é **falta**, não excesso.

### E. CRIAR (priorizado em §8)

Estratégias e KPIs ausentes listados em §5.1 e §5.2.

---

## 8. Priorização por impacto consultivo

| # | Iniciativa                                                                  | Impacto emocional | Sofisticação | Diferenciação | Esforço | Score |
| - | --------------------------------------------------------------------------- | :---------------: | :----------: | :-----------: | :-----: | :---: |
| 1 | **Escada patrimonial (laddering)** — N cotas, prazos escalonados, timeline  | 🔥🔥🔥             | 🔥🔥🔥        | 🔥🔥🔥         | M       | **★★★★★** |
| 2 | **TIR + ROI + Payback + Multiplicador** como KPIs nos summary cards         | 🔥🔥               | 🔥🔥🔥        | 🔥🔥           | S       | **★★★★★** |
| 3 | **Autoquitação** (uso da carta p/ quitar saldo) como cenário/aba dedicada   | 🔥🔥🔥             | 🔥🔥          | 🔥🔥           | M       | **★★★★** |
| 4 | **Renda passiva estruturada** (ladder + aluguel sequencial)                 | 🔥🔥🔥             | 🔥🔥🔥        | 🔥🔥🔥         | M       | **★★★★★** |
| 5 | **Holding/Sucessão com matemática** (economia ITCMD + custódia)             | 🔥🔥🔥             | 🔥🔥🔥        | 🔥🔥🔥         | M       | **★★★★** |
| 6 | **Alavancagem PJ Lucro Real** (economia tributária real)                    | 🔥🔥               | 🔥🔥🔥        | 🔥🔥🔥         | S       | **★★★★** |
| 7 | **Mercado secundário (compra de contempladas com deságio)**                 | 🔥🔥🔥             | 🔥🔥🔥        | 🔥🔥           | M       | **★★★★** |
| 8 | **Capital preservado** (KPI vs financiamento bancário)                      | 🔥🔥               | 🔥🔥          | 🔥🔥           | S       | **★★★** |
| 9 | **Energia solar com payback fechado**                                       | 🔥🔥               | 🔥🔥          | 🔥🔥           | S       | **★★★** |
| 10| **Empilhamento de ativos (consórcio + financiamento + recursos próprios)**  | 🔥🔥               | 🔥🔥🔥        | 🔥🔥🔥         | M       | **★★★** |
| 11| **Desalienação parcial / liberação de carta como garantia**                 | 🔥🔥               | 🔥🔥🔥        | 🔥🔥           | M       | **★★★** |
| 12| Consolidar Recommendation + AIInsights em "Veredito"                        | 🔥                | 🔥            | —             | XS      | **★★** (UX) |
| 13| Fundir Path 1+3 em cenário "Imóvel" com toggle                              | 🔥                | 🔥            | —             | S       | **★★** (UX) |

**Sequência sugerida (próximas ondas de implementação, ainda sem fazer agora):**

- **Onda P1 — Indicadores Executivos:** TIR + ROI + Payback + Multiplicador + Capital Preservado (S, alto retorno).
- **Onda P2 — Engenharia Patrimonial:** Escada Patrimonial + Renda Passiva Estruturada + Autoquitação (M, virada de chave).
- **Onda P3 — Trilha Avançada:** Holding+ITCMD, Lucro Real PJ, Mercado Secundário, Empilhamento, Desalienação (M-G, premium alta renda).
- **Onda P4 — Refinamento UX:** Consolidar Veredito, fundir Path 1+3, ajustar densidade (S).

---

## 9. Riscos a observar nas próximas ondas

- **Promessa excessiva:** "escada patrimonial" e "mercado secundário" são temas onde a copy precisa **manter o tom Caixa**: nada de "renda garantida", "sem risco", "lucro certo". Reforçar `TRUST` fragment + `DISCLAIMERS.WHATSAPP_INVESTMENT` em todo storytelling novo.
- **Densidade visual:** adicionar 6+ estratégias sem consolidar exige nova aba ou submódulo "Engenharia Patrimonial" para não sobrecarregar a aba Estratégia atual.
- **Drift matemático:** TIR/IRR e Payback DEVEM viver em `@/core/finance/investment` (extensão da engine canônica). Não recalcular fora.
- **Tributação:** cálculos de ITCMD/Lucro Real devem ser **estimativas conservadoras** com disclaimer "consulte seu contador/advogado".

---

## 10. Conclusão

O módulo Investimentos está **operacionalmente sólido e matematicamente íntegro**, com base canônica que suporta evolução sem refactor estrutural. O **gargalo atual não é técnico — é narrativo e de cobertura estratégica.**

Para virar a chave de "comparador de cenários" para "**mesa de engenharia patrimonial**" basta:

1. Adicionar 4 KPIs executivos (TIR, ROI, Payback, Multiplicador).
2. Adicionar 3 estratégias âncora (Escada, Renda Estruturada, Autoquitação).
3. Acrescentar 3 trilhas premium (Holding, PJ Lucro Real, Mercado Secundário).
4. Consolidar redundâncias visuais (Veredito único, Imóvel com toggle).

Tudo isso **sem mexer na engine matemática atual** e **sem comprometer o perfil consultivo Caixa**.

---

**Próxima ação sugerida:** aprovar a sequência P1→P4 e iniciar **Onda P1 (Indicadores Executivos)** como primeira entrega de implementação.
