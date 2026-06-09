# Auditoria — Motor de Cálculo Único no Módulo Estratégias

**Pergunta:** o módulo Estratégias Patrimoniais criou algum novo motor de cálculo
financeiro? Está respeitando a regra Core *"Finance Façade: Fonte única =
`@/core/finance`. Proibido importar `@/utils/calculations*` direto"*?

---

## 1. Escopo auditado

Arquivos do módulo (`src/components/modules/wealth/`):

- `WealthPlatformModule.tsx`
- `StrategyLibrarySection.tsx`
- `strategyLibraryData.ts`
- `strategyContextScoring.ts`
- `strategyDecisionSupport.ts`
- `strategyExplanationEnhancements.ts`
- `intents.ts`

## 2. Imports financeiros

| Padrão | Ocorrências | Veredito |
|---|---|---|
| `from '@/utils/calculations*'` | **0** | ✅ conforme |
| `from '@/core/finance*'` | **0** | ⚠️ não usa a fachada canônica |
| `from '@/config/consortiumRates'` | **1** (strategyLibraryData.ts) | ✅ constantes vêm da fonte única |
| `calculateSimulation` / `calculatePriceSchedule` / `calculateMonthlySchedule` | **0** | ✅ nenhum motor paralelo |

## 3. Aritmética financeira encontrada

Toda a aritmética está concentrada em **`strategyLibraryData.ts`** (cálculos
ilustrativos rotulados, renderizados como texto/labels nos cards). Os demais
arquivos não fazem cálculo financeiro.

### Operações inline detectadas

| Operação | Linha | Equivalente canônico em `@/core/finance` |
|---|---|---|
| `Math.pow(1 + CDI_LIQ, 1/12) - 1` | 101 | `investment.annualToMonthlyRate(CDI_LIQ)` |
| `Math.pow(1 + CV_CDI_BRUTO_AA, 1/12) - 1` | 130 | `investment.annualToMonthlyRate(...)` |
| `capital * Math.pow(1 + CV_CDI_BRUTO_AA, N/12)` | 222 | `investment.compoundGrowthAnnualMonthly(...)` |
| `crédito × (1 + adm + FR) / N` (parcela) | 355, 406, 506, 706, 905, 1003, 1100 | `installments.computeFullInstallment(installments.computeBaseCost(...))` |
| `crédito × (1 + adm + FR)` (custo nominal) | 356, 806, 904, 1051, 1099, 1148, 1196 | `installments.computeBaseCost(credit, adminFee, reserveFund)` |

Constantes (`REF_ADM_PCT`, `REF_FR_PCT`, `REF_TERM_M`, `CDI_AA`, `CV_*`)
são todas derivadas de `@/config/consortiumRates` (`DEFAULT_ADMIN_FEE`,
`DEFAULT_RESERVE_FUND`, `DEFAULT_TERM_MONTHS`, `DEFAULT_CDI_RATE`).
**Não há hardcode de regra de negócio.**

## 4. Veredito

### ✅ O que está correto

- **Nenhum motor paralelo de simulação foi criado.** Não há reimplementação
  de `calculateSimulation`, schedule mensal, CET, Price/SAC, seguro
  prestamista ou qualquer engine real.
- **Nenhum import proibido** (`@/utils/calculations*` zero).
- **Constantes vêm da fonte única** (`consortiumRates.ts`).
- **Composição mensal correta** (`(1+i)^(1/12)−1`) — respeita a regra Core
  de equivalência composta. Não há a fórmula incorreta `taxa/12`.

### ⚠️ Risco menor (duplicação aritmética, não motor)

`strategyLibraryData.ts` reimplementa inline 2 primitivas que já existem
na fachada canônica:

1. **Parcela mensal** = `crédito × (1+adm+FR) / N`
   → existe `computeFullInstallment(computeBaseCost(...), term)` em
   `@/core/finance/installments`.

2. **Equivalência composta e capitalização**
   → existem `annualToMonthlyRate` e `compoundGrowthAnnualMonthly` em
   `@/core/finance/investment`.

São **fórmulas idênticas às canônicas** (mesma matemática, mesmos
parâmetros vindos de `consortiumRates`). Não há divergência numérica
hoje, mas a duplicação cria risco de drift se o motor canônico evoluir
(ex.: passar a considerar arredondamento institucional, seguro embutido
no rateio, etc.).

### Recomendação (não bloqueante)

Refator opcional e contido em **uma onda própria** — não tocar agora junto
de mudanças de UI:

```ts
// strategyLibraryData.ts
import {
  computeBaseCost,
  computeFullInstallment,
} from '@/core/finance/installments';
import {
  annualToMonthlyRate,
  compoundGrowthAnnualMonthly,
} from '@/core/finance/investment';

const refBaseCost     = (c: number) => computeBaseCost(c, REF_ADM_PCT, REF_FR_PCT);
const refInstallment  = (c: number) => computeFullInstallment(refBaseCost(c), REF_TERM_M);
const cdiMonthlyLiq   = annualToMonthlyRate(CDI_LIQ);
const cvInvestGrowth  = (capital: number) =>
  compoundGrowthAnnualMonthly(capital, CV_CDI_BRUTO_AA, CV_PRAZO_M);
```

Isso elimina toda aritmética inline e garante que **qualquer evolução no
motor financeiro propague automaticamente para os textos das estratégias**.

---

## 5. Conclusão

> **Não foi criado nenhum novo motor de cálculo.** O módulo Estratégias
> usa somente operações aritméticas ilustrativas com constantes
> centralizadas. A regra Core *"motor único"* está respeitada no sentido
> forte (nenhuma lógica financeira concorrente).
>
> Existe apenas **duplicação aritmética leve** (parcela e capitalização
> reescritas inline em vez de delegadas às primitivas de `@/core/finance`),
> classificada como **risco baixo de drift** e candidata a refator em onda
> própria. Não há ação urgente.
