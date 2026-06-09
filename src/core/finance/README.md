# core/finance — Fachada de Cálculo Financeiro

Fonte única de entrada para cálculo financeiro do projeto.

## Por que existe

Antes desta fachada, módulos importavam de `@/utils/calculations*` direto, em ~30 arquivos. Isso permitia que cada módulo escolhesse motor (legado vs mensal) sem rastreabilidade, criando risco de divergência silenciosa.

Esta fachada **não introduz lógica nova**. Apenas centraliza o ponto de entrada para que o enforcement (ESLint + revisão de PR) possa garantir uso consistente.

## Como usar

```ts
// ✅ Correto — fachada pública
import { calculateMonthlySchedule, reconcileWithSchedule } from '@/core/finance';

// ❌ Proibido — import direto do motor legado (warn Onda 0, error Onda 5)
import { calculateMonthlySchedule } from '@/utils/calculations/monthlySchedule';
import { calculateSimulation } from '@/utils/calculations';

// ❌ Proibido SEMPRE — internal é privado, não importar fora de core/finance
import { calculateMonthlySchedule } from '@/core/finance/internal/monthlySchedule';
```

### Regra de ouro
Toda lógica financeira do app DEVE passar pela fachada `@/core/finance`.
Não há exceção: nem `utils/calculations*`, nem `core/finance/internal/*`.

## O que está exposto

| Símbolo | Uso recomendado |
|---|---|
| `calculateMonthlySchedule` | **Fonte de verdade.** Motor atuarial mensal. |
| `reconcileWithSchedule` | Projeta agregados do schedule no shape legado. |
| `getEffectiveClientCost` | Custo real do cliente (sem lance embutido). |
| `calculateSimulation` | **Legado.** Apenas dentro do `SimulatorContext`. |
| `calculateSimulationLegacy` | Alias para cenários paramétricos (Comparator, Investment, QuickSale). |
| `calculateFinancingCost` | Comparador financiamento (Price/SAC). |
| `calculateIR` | Tabela regressiva — único IR do projeto. |
| `analyzeBidHistory` | Estatística de lances reais. |
| `estimateBidProbabilityMonteCarlo` | Probabilidade de contemplação. |

## O que NÃO está exposto (proibido fora desta pasta)

- Funções internas de `monthlySchedule.ts` (auxiliares de saldo, regime).
- Funções privadas de `bidAnalysis/`.

## Plano de migração (resumo)

1. **Onda 0 (atual)**: fachada criada, ESLint em modo `warn`. Nada mais muda.
2. **Onda 1**: mover fisicamente arquivos para `core/finance/internal/`.
3. **Onda 2–4**: migrar consumidores em ondas (1 módulo por PR).
4. **Onda 5**: ESLint vira `error`. Imports diretos quebram build.
5. **Onda 6**: avaliar remoção de `legacyAggregate`.

Detalhes completos: `mem://arch/core-finance-fachada`.

## Regras absolutas

- ❌ NÃO reescrever motor.
- ❌ NÃO alterar regras de negócio nesta fachada.
- ❌ NÃO adicionar lógica nova aqui — apenas re-exports.
- ✅ Toda nova função financeira entra primeiro em `utils/calculations/*`, depois é exposta aqui.
