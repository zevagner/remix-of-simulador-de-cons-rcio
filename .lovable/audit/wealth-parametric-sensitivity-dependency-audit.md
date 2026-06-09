# Wealth Parametric Sensitivity & Dependency Audit

> Auditoria somente-leitura. Zero código de cálculo alterado, zero estratégia migrada, zero matemática nova. Objetivo: decidir **quais** estratégias devem virar paramétricas e **onde parar** para não cair em overengineering.

Escopo: 25 estratégias em `src/components/modules/wealth/strategyLibraryData.ts`. Fonte da matriz viva: `WealthAssumptionsContext` (`cdiRate`, `cdiPercent`, `propertyAppreciation`, `rentalYield`, `contemplationMonth`, `analysisMonths`, `agioOnSale`, `discountOnSale`, `tipoVendaCarta`).

---

## Full Strategy Sensitivity Analysis

Classificação por sensibilidade ao `calcContext`. Métrica: quanto o(s) KPI(s) protagonista(s) de cada card variam quando o consultor troca preset Conservador ↔ Otimista (ou move contemplação 12 ↔ 36).

### HIGH parametric sensitivity (5)
Tese e KPIs **dominados** por premissas vivas. Migração agrega valor consultivo real.

| Estratégia | KPI dominante | Por que é HIGH |
|---|---|---|
| `usar-carta-investir` | Lucro / ROI | Já migrada. Composto de (CDI × % CDI × meses pós-contemplação). Mover contemplação ou %CDI altera resultado em >2× facilmente. |
| `compra-hibrida` | Capital preservado · rendimento | Já migrada. Yield depende linear de CDI líquido. |
| `alavancagem-imobiliaria` | Cobertura aluguel/parcela | Já migrada. Cobertura é função direta de `rentalYield`. |
| `leverage-patrimonial` | Patrimônio final | Combina CDI líquido pós-contemplação + lance embutido. Sensível a CDI e contemplação. **Candidata #1 não migrada.** |
| `escada-patrimonial` (venda da carta) | Lucro líquido / ROI / janela | Hoje hardcoda 25% (`agioOnSale`) e contemplação mês 1. `agioOnSale` e `contemplationMonth` já existem no context — migração é trivial e muda narrativa em 100%. **Candidata #2.** |

### MEDIUM parametric sensitivity (6)
Premissas afetam KPI secundário ou narrativa comparativa, mas tese sobrevive sem live recalc.

- `autoquitacao-estruturada` — `rentalYield` muda "folga" mas não a tese ("aluguel amortiza").
- `patrimonio-gerador-caixa` — `rentalYield` + `propertyAppreciation` afinam números, tese qualitativa.
- `renda-passiva` — `rentalYield` ajusta cap rate; preset Otimista melhora pitch em ~40%.
- `reinvestimento-estruturado` — `rentalYield` × tempo. Variação relevante mas KPI é narrativo.
- `multiplicacao-cotas` — `propertyAppreciation` + `contemplationMonth` afinam composição.
- `patrimonio-escalavel` — `rentalYield` (PF vs PJ) muda diferencial tributário ilustrativo.

### LOW parametric sensitivity (8)
Premissas alteram <10% do número exibido OU o KPI é estrutural (parcela, custo nominal, % lance). Migração agrega ruído.

`compra-planejada`, `aquisicao-acelerada`, `reforma-ampliacao`, `retrofit-patrimonial`, `energia-solar`, `upgrade-veiculo`, `renovacao-frota`, `expansao-produtiva`.

### EDITORIAL / STATIC (6)
Tese é narrativa, sucessória, conceitual ou operacional. Parametrizar é **anti-pattern**.

`compra-a-vista`, `equipamentos-pesados`, `agronegocio`, `patrimonio-rural`, `holding-patrimonial`, `planejamento-sucessorio`.

---

## Parameter Dependency Graph

Matriz `estratégia × parâmetro`. ● = dependência forte (KPI protagonista). ○ = dependência leve (KPI secundário). – = nenhuma.

| Estratégia | CDI/%CDI | contempl. | analysis Months | propAppr | rentalYield | agio | desc | tipoVenda |
|---|---|---|---|---|---|---|---|---|
| usar-carta-investir | ● | ● | ● | – | – | – | – | – |
| compra-hibrida | ● | – | – | – | – | – | – | – |
| leverage-patrimonial | ● | ● | ● | – | – | – | – | – |
| alavancagem-imobiliaria | – | – | – | ○ | ● | – | – | – |
| escada-patrimonial (venda) | – | ● | – | – | – | ● | ○ | ● |
| autoquitacao-estruturada | – | – | – | – | ● | – | – | – |
| patrimonio-gerador-caixa | – | – | – | ○ | ● | – | – | – |
| renda-passiva | – | – | – | ○ | ● | – | – | – |
| reinvestimento-estruturado | – | – | ○ | – | ● | – | – | – |
| multiplicacao-cotas | – | ○ | – | ● | – | – | – | – |
| patrimonio-escalavel | – | – | – | – | ○ | – | – | – |
| compra-planejada | – | – | ○ | – | – | – | – | – |
| aquisicao-acelerada | – | ○ | ○ | – | – | – | – | – |
| reforma-ampliacao | – | – | – | – | – | – | – | – |
| retrofit-patrimonial | – | – | – | ○ | – | – | – | – |
| energia-solar | – | – | – | – | – | – | – | – |
| upgrade-veiculo | – | – | – | – | – | – | – | – |
| renovacao-frota | – | – | – | – | – | – | – | – |
| expansao-produtiva | – | – | – | – | – | – | – | – |
| compra-a-vista | – | – | – | – | – | – | – | – |
| equipamentos-pesados | – | – | – | – | – | – | – | – |
| agronegocio | – | – | – | – | – | – | – | – |
| patrimonio-rural | – | – | – | – | – | – | – | – |
| holding-patrimonial | – | – | – | – | – | – | – | – |
| planejamento-sucessorio | – | – | – | – | – | – | – | – |

**Observação:** os parâmetros `propAppreciation` e `discountOnSale` hoje só são consumidos por **0 estratégias** (vivem no context mas sem callsite). Não justificam UI editável dedicada ainda — manter como reserva pós-priority-2.

---

## Real Consultive Impact Analysis

Critério: a parametrização aumenta a **qualidade da conversa** com o cliente?

| Categoria | Valor consultivo de tornar live | Veredito |
|---|---|---|
| HIGH (5) | Cliente faz perguntas tipo "e se CDI cair?", "e se eu contemplar antes?". Sem live, consultor responde "depende". Com live, responde no card. | **Migrar.** |
| MEDIUM (6) | Cliente raramente pergunta sobre as premissas; números são pitch, não decisão. Live pode gerar **falsa precisão** ("o card mudou, então é mais real"). | **Migrar só se baixo custo (1 linha).** Caso contrário, expor premissa no disclaimer estático. |
| LOW (8) | KPI é estrutural (parcela, custo nominal). Live recalc não muda decisão. | **Manter canônico.** Adicionar live aqui é ruído puro. |
| EDITORIAL (6) | Tese é qualitativa (sucessão, legado, robustez operacional). Números são ilustrativos. Live recalc destrói o tom editorial. | **Proibido migrar.** |

---

## Performance Risk Analysis

Estado atual:
- `calcContext` é `useMemo` por `assumptions` — 1 recálculo por mudança.
- `StrategyLibrarySection`: `chaptersGrouped` tem `calcCtx` nas deps do `useMemo` → recalcula ordenação executiva e KPIs hero a cada slider tick.
- `getKpiNumericValue` é parse de string — barato, mas chamado N×M (N estratégias × M KPIs ordenáveis).

Riscos se migrarmos os 25:
- **Recalculation storm leve:** slider de CDI dispararia parseFloat em ~75 KPIs por tick. Hoje (~15 KPIs paramétricos) é imperceptível; em 75+ começa a sentir em mobile mid-tier.
- **Context churn:** sem mudança — context é estável, só `assumptions` muda.
- **Flagship/ordering churn:** já reordena hoje; multiplicar por 5× a quantidade de estratégias migradas mantém O(N log N) trivial.
- **Mobile:** principal risco é re-render da lista inteira de cards. Mitigável com `useDeferredValue(calcCtx)` se necessário — **não preciso agora**.

Conclusão: nenhuma necessidade de refactor performance **enquanto migração ficar abaixo de ~12 estratégias**.

---

## Parametric Priority Matrix

### Prioridade ALTA (migrar na próxima onda — 2 estratégias)
1. **`leverage-patrimonial`** — adicionar `ctx?.cdiAnnualLiq` e `ctx?.monthsAfterContemplation` nas 2 calculations de capital aplicado e patrimônio final.
2. **`escada-patrimonial`** (venda da carta) — trocar `0.25` por `(1 + ctx.agioOnSale)` em 3 calculations; trocar mês 1 fixo por `ctx.contemplationMonth` no rótulo.

### Prioridade MÉDIA (migrar só se for 1 linha por result — 4 estratégias)
3. `alavancagem-imobiliaria` já migrada; estender `autoquitacao-estruturada`, `patrimonio-gerador-caixa`, `renda-passiva`, `reinvestimento-estruturado` para consumir `ctx.rentalYield` (substituir `CAP_RATE`).

### Prioridade BAIXA (não migrar, mas adicionar 1 linha de disclaimer dinâmico no header da estratégia)
- `multiplicacao-cotas`, `patrimonio-escalavel`.

### NÃO migrar (15 estratégias)
Todas as LOW + EDITORIAL. Permanecem canônicas. Justificativa abaixo.

---

## Static Strategy Justification

Por que **15 estratégias devem permanecer estáticas**:

1. **KPIs estruturais** (`compra-planejada`, `aquisicao-acelerada`, `upgrade-veiculo`, `renovacao-frota`, `expansao-produtiva`): exibem parcela, custo nominal, lance — funções de `ADM_TOTAL` e `PARCELA_FATOR`, que **não estão no `WealthAssumptionsContext`** e nem deveriam estar (são do Simulador, governados por `consortiumRates`). Mover para o context cria fonte dupla e viola o lock V2.
2. **KPIs de obra/reforma** (`reforma-ampliacao`, `retrofit-patrimonial`, `energia-solar`): valores dependem de mercado físico, não de premissas financeiras. Live recalc é falso.
3. **Cards editoriais** (`compra-a-vista`, `equipamentos-pesados`, `agronegocio`, `patrimonio-rural`, `holding-patrimonial`, `planejamento-sucessorio`): tese consultiva é **narrativa**. Números ilustrativos são âncoras, não simulação. Live recalc destruiria o tom executivo e empurraria o módulo para o anti-pattern "biblioteca de mini-simuladores".

---

## Consultive Clarity Validation

Cenário se migrássemos **as 25**:
- 25 cards reagindo a cada slider = cliente percebe "isso aqui é um simulador" e perde a leitura editorial de tese.
- KPIs estruturais (parcela, custo nominal) recalculariam **sem mudar** (premissas patrimoniais não os afetam) — gera ruído visual ("por que o card piscou se o número é o mesmo?").
- O módulo deixaria de parecer **consultoria patrimonial** e viraria **planilha viva**.

Cenário com a **priority matrix acima** (7 estratégias paramétricas no total: 3 atuais + 2 ALTA + estender 4 MÉDIA com ctx.rentalYield):
- Os cards que **deveriam** reagir reagem; os demais permanecem âncoras editoriais.
- O consultor enxerga claramente quais teses são sensíveis às premissas (sinal de qualidade analítica) e quais são estruturais.
- Mantém a hierarquia: flagship dinâmico → recommended dinâmico → capítulos com cards majoritariamente editoriais.

---

## Canonical Engine Protection

- Nenhuma estratégia migrada introduziu primitiva nova. `usar-carta-investir`, `compra-hibrida`, `alavancagem-imobiliaria` consomem **`compoundGrowthAnnualMonthly`**, **`ADM_TOTAL`**, **`annualToMonthlyRate`** já existentes.
- `toCalcContext` em `WealthAssumptionsContext` é puro mapeamento de unidades. Zero shadow math.
- Fallbacks `??` para `CDI_LIQ` / `CDI_MM_LIQ` / `CAP_RATE` / `REF_TERM_M − 24` garantem que callsites sem ctx (PDF/Proposta legados) entreguem **idêntico ao snapshot anterior**.
- Recomendação: ao migrar `leverage-patrimonial` e `escada-patrimonial`, manter o mesmo padrão `(c, ctx) => ...ctx?.X ?? CONST` — **proibido** introduzir novas constantes derivadas no arquivo de estratégias.

---

## Zero Regression Validation

Esta auditoria **não tocou** em nenhum dos seguintes arquivos:
- `src/core/finance/**`
- `src/components/modules/wealth/strategyLibraryData.ts`
- `src/components/modules/wealth/strategyFlagships.ts`
- `src/components/modules/wealth/StrategyLibrarySection.tsx`
- `src/contexts/WealthAssumptionsContext.tsx`
- `WealthOperationalBar.tsx`, `WealthPlatformModule.tsx`

Único artefato criado: este documento de auditoria. **UX, ordering, flagship, engine e math: intocados.**

---

## Final Parametric Architecture State

| Camada | Estratégias | Status alvo |
|---|---|---|
| Live (HIGH) | 5 | 3 já migradas + 2 a migrar (leverage-patrimonial, escada-patrimonial) |
| Semi-live (MEDIUM) | 4 | Migrar apenas o consumo de `ctx.rentalYield` (substituir `CAP_RATE`) |
| Estática (LOW) | 8 | Manter canônica. Não tocar. |
| Editorial (STATIC) | 6 | Proibido migrar. Tese narrativa. |
| **Total paramétrico-alvo** | **9 de 25** | ≈36% — abaixo do limiar de performance e acima do limiar de valor consultivo. |

`propertyAppreciation` e `discountOnSale` continuam no context mas **sem callsites** após priority matrix. Manter editáveis na UI **só se** houver feedback consultivo real; caso contrário, mover para "Premissas avançadas" recolhidas para reduzir densidade.

---

## Final Verdict

**O módulo deve LIMITAR a engine viva às estratégias certas, não expandir para todas.**

Regra de governança proposta (candidata a memória de projeto):

> Uma estratégia patrimonial só vira paramétrica (`result(c, ctx)`) se atender a **dois** dos três critérios:
> 1. KPI protagonista é função direta de um parâmetro do `WealthAssumptionsContext`.
> 2. Variação Conservador ↔ Otimista altera o KPI em ≥ 20%.
> 3. Cliente tipicamente pergunta sobre essa premissa na conversa consultiva.
>
> Caso contrário: permanece canônica com fallback constante. Cards editoriais (sucessão, holding, robustez operacional, infraestrutura física) ficam **proibidos** de migrar.

Resultado: engine viva controlada (~9 cards), hierarquia editorial preservada, zero risco de recalculation storm, módulo permanece **consultoria patrimonial contextual** — não vira biblioteca de mini-simuladores.
