# ARCHITECTURE.md

Documentação oficial da arquitetura do sistema. Foco em **quem vai manter** o
projeto: onde está cada coisa, por que está ali e como evoluir sem quebrar.

---

## 1. Visão geral

**Propósito.** Plataforma consultiva para vendas de consórcio Caixa: simula
operações, analisa lances reais de assembleias, monta cenários de
investimento, gera proposta comercial em PDF e acompanha o cliente do
primeiro contato ao pós-venda.

**Principais módulos (jornada linear de 6 passos):**

| # | Módulo | Responsabilidade |
|---|--------|------------------|
| 1 | **Diagnóstico** | Captura perfil do cliente (objetivo, prazo, perfil de risco). |
| 2 | **Simulador** | Monta a operação base (crédito, prazo, taxas, lance). |
| 3 | **Análise** | Abas: Investimento, Comparador, Lances, Op. Estruturadas, Assembleias. |
| 4 | **Abordagem** | 3 abas (Antes da conversa / Durante a conversa / Funil de vendas). |
| 5 | **Proposta** | 2 abas (Proposta completa / Mensagem rápida) + link para Abordagem. |
| 6 | **Proposta Premium** | Wizard de blocos selecionáveis + geração de PDF consultivo. |
| 7 | **Carteira / Pós-venda** | CRM Kanban, cadência, pós-venda e auditoria. |

Camadas transversais: **CRM/Pipeline**, **Comunidade**, **Admin/Auditoria**,
**Comunicação por IA** (insights e copy, nunca cálculo).

---

## 2. Estrutura do projeto

```
src/
├── core/finance/          ← FACHADA ÚNICA de cálculo financeiro
│   ├── index.ts           ← API pública (re-exports)
│   ├── internal/          ← motores reais — privado
│   └── README.md
├── contexts/              ← Producer Contexts (Investment, Bids, SelectedGroup…)
│   └── proposal/          ← façade useProposalData() para o PDF
├── hooks/                 ← estado e cálculos derivados
├── components/
│   ├── modules/           ← módulos da jornada (Simulator, Investment, Bids…)
│   ├── pdf/               ← templates de PDF (proposta, simulador, lances…)
│   │   └── proposta/      ← pipeline modular do PDF de proposta
│   └── ui/                ← shadcn primitives
├── services/              ← integrações (Supabase, IA, analytics, CRM)
├── utils/                 ← funções auxiliares organizadas por categoria
│   ├── format/  validation/  data/  dom/  system/  domain/
│   ├── bidAnalysis/  proposalPdf/  salesScript/  community/
│   └── *.ts               ← arquivos físicos preservados
├── config/                ← regras de negócio (consortiumRates, businessRules)
├── pages/                 ← rotas top-level
└── integrations/supabase/ ← client e tipos auto-gerados (NÃO editar)
```

**Resumo das camadas:**

- **`core/finance`** — única fonte de cálculo financeiro (simulação, IR,
  schedule mensal, reconciliação). Imutável durante mudanças de UI.
- **`hooks/`** — estado de UI + cálculos derivados (ex.: `useInvestmentCalculations`,
  `useCashComparison`, `useProposalEvents`). Quando um cálculo cresce, sai
  do componente e vira hook.
- **`components/`** — UI. Componentes são pequenos e focados; módulos
  grandes orquestram componentes menores.
- **`utils/`** — funções auxiliares (formatação, validação, parsing,
  heurísticas de domínio). Nunca contém cálculo financeiro canônico.
- **`config/`** — regras de negócio (taxas, limites, prazos). Façade em
  `businessRules.ts`; fonte real em `consortiumRates.ts`.

---

## 3. Motor financeiro (CRÍTICO)

### Por que `core/finance` é a única fonte

Antes da fachada existiam ~30 arquivos importando `@/utils/calculations*`
direto, sem rastreabilidade. Mudar uma fórmula exigia caçar call-sites.
Hoje, **toda matemática financeira passa por `@/core/finance`**.

Benefícios:
- Auditoria centralizada (1 ponto, não 30).
- Testes consolidados (`src/test/calculations.test.ts`,
  `src/tests/calculationConsistency.test.ts`).
- ESLint bloqueia importações fora da fachada.

### API pública (símbolos principais)

```ts
import {
  // Motor mensal atuarial (fonte da verdade)
  calculateMonthlySchedule,
  getInsuranceRate,

  // Reconciliação legado ↔ mensal
  reconcileWithSchedule,
  getEffectiveClientCost,

  // Legado (uso restrito, mantido por compatibilidade)
  calculateSimulation,
  calculateSimulationLegacy,
  deriveContemplationType,
  calculateFinancingCost,

  // Investimento
  calculateIR,

  // Lances
  analyzeBidHistory,
  estimateBidProbabilityMonteCarlo,

  // Formatação canônica
  formatCurrency,
  formatPercent,
} from '@/core/finance';
```

### Regra de ouro

> **Nunca calcule fora do `core/finance`.**
> Componentes, hooks, serviços e edges consomem a fachada — nunca
> reimplementam fórmulas localmente. Se a fórmula não existe na fachada,
> ela é adicionada lá primeiro (ver §7).

---

## 4. Fluxo de dados

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   INPUTS     │───▶│  CÁLCULO     │───▶│  CONTEXTS    │───▶│  UI / PDF    │
│ (formulários,│    │ (core/finance│    │ (Producer    │    │ (componentes,│
│  Diagnóstico,│    │  + hooks)    │    │  Contexts)   │    │  PDF pipeline│
│  Simulador)  │    │              │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                          │                    │
                          ▼                    ▼
                    ┌──────────────┐    ┌──────────────┐
                    │ Persistência │    │  IA (copy)   │
                    │ (Supabase,   │    │ via edges    │
                    │  localStorage)    │ — nunca cálc.│
                    └──────────────┘    └──────────────┘
```

**Detalhes:**

1. **Inputs** entram em `SimulatorContext` (operação base) e
   `DiagnosticContext` (perfil do cliente).
2. **Hooks de cálculo** (`useInvestmentCalculations`, `useCashComparison`,
   `useBidAnalysis`) consomem `core/finance` e produzem resultados
   derivados.
3. **Producer Contexts** publicam os resultados:
   - `InvestmentResultsContext` (cenários de investimento)
   - `BidsStudyContext` (análise de lances)
   - `SelectedGroupContext` (grupo escolhido — fonte única para Bids e
     Assemblies)
4. **Façade `useProposalData()`** (`src/contexts/proposal`) agrega tudo e
   é a **única** porta de entrada para o PDF.
5. **PDF pipeline** (`src/components/pdf/proposta/pipeline.tsx`) lê a
   façade, aplica gates por bloco e renderiza páginas A4.

---

## 5. Regras importantes

### 🔒 Imports proibidos (bloqueados por ESLint)

```ts
// ❌ NÃO
import { ... } from '@/core/finance/internal';
import { ... } from '@/core/finance/internal/monthlySchedule';
import { ... } from '@/utils/calculations';
import { ... } from '@/utils/calculations/consorcio';

// ✅ SIM
import { ... } from '@/core/finance';
```

### 🔒 Outras regras invioláveis

- **Nunca** modificar lógica financeira durante mudanças de UI/UX.
- **Nunca** hardcodar taxas, limites ou prazos — usar `BUSINESS_RULES`
  em `src/config/businessRules.ts`.
- **Nunca** hardcodar branding (`'CAIXA'`, `'@caixa.gov.br'`) — usar
  `brandConfig.ts`.
- **Nunca** criar `ProposalDataContext` genérico com `any` ou `setData`
  consolidado. Novos blocos do PDF seguem o padrão **Producer Context
  tipado + reexport na façade**.
- **Nunca** editar `src/integrations/supabase/client.ts` ou
  `src/integrations/supabase/types.ts` (auto-gerados).
- **Sempre** incluir filtro explícito por `user_id` em deletes no Supabase.
- **Sempre** incluir disclaimer legal nas propostas (simulação ilustrativa).

---

## 6. Estrutura do PDF

O PDF de proposta foi extraído de um monólito de 1.900 linhas para uma
pipeline modular. Ponto de entrada: `src/components/pdf/PdfPropostaCompleta.tsx`
(orquestrador de ~60 linhas).

```
src/components/pdf/proposta/
├── pipeline.tsx          ← buildProposalPages() — orquestração
├── gates.ts              ← regras de "bloco tem dados úteis?"
├── theme.ts              ← constantes A4 (margens, cores, tamanhos)
├── types.ts              ← PdfPropostaCompletaData
├── labels.ts             ← strings de UI
├── narrativeContext.ts   ← sanitização de texto narrativo
├── primitives.tsx        ← Header, Footer, MetricCard, PdfTable, gráficos
└── pages/                ← uma página por arquivo
    ├── CoverPage.tsx
    ├── OpeningImpactPage.tsx
    ├── DiagnosticPage.tsx
    ├── SimulationPage.tsx
    ├── ComparisonPages.tsx        (Financiamento / À vista)
    ├── StrategyPages.tsx          (Lance / Renda / Venda)
    ├── BidsStudyPages.tsx         (Histórico / Contemplação / Argumentos)
    ├── StorytellingPage.tsx
    ├── ObjectionsPage.tsx
    └── ClosingDecisionPage.tsx
```

### Como funciona

1. **`buildProposalPages(data)`** monta a lista de páginas baseando-se
   nos blocos selecionados pelo usuário e no que `gates.ts` aprova.
2. **Gates relaxados** (regra fixa do produto): bloco selecionado
   **sempre** renderiza. Se faltam dados, a página interna mostra
   `MissingDataNote` em vez de ser omitida.
3. Cada página é um componente puro que consome `PdfPropostaCompletaData`.
4. O orquestrador aplica `pageBreakBefore` entre páginas (exceto a
   primeira) e gera o HTML que vai para o **Browserless** (edge
   `generate-pdf`) renderizar como Chromium real.

### Dados que alimentam o PDF

Sempre via `useProposalData()`. Nunca acessar contextos individuais
direto no template do PDF.

---

## 7. Como adicionar um novo cálculo

Suponha que você precisa calcular **"economia projetada em 5 anos"**.

### Passo 1 — Criar dentro de `core/finance/internal`

```ts
// src/core/finance/internal/projectedSavings.ts
export function projectedSavings5y(input: {
  monthlyContribution: number;
  monthlyRate: number;
}): number {
  // implementação pura, testável
}
```

### Passo 2 — Expor pela fachada

```ts
// src/core/finance/index.ts
export { projectedSavings5y } from './internal/projectedSavings';
```

### Passo 3 — Cobrir com teste

```ts
// src/test/calculations.test.ts
describe('projectedSavings5y', () => {
  it('matches expected value for known input', () => { ... });
});
```

### Passo 4 — Consumir

Em hook (preferido para cálculo complexo):

```ts
// src/hooks/useProjectedSavings.ts
import { projectedSavings5y } from '@/core/finance';

export function useProjectedSavings(input) {
  return useMemo(() => projectedSavings5y(input), [input]);
}
```

Em componente (para uso simples):

```tsx
import { projectedSavings5y, formatCurrency } from '@/core/finance';

const value = projectedSavings5y({ monthlyContribution, monthlyRate });
return <span>{formatCurrency(value)}</span>;
```

### ⚠️ O que NÃO fazer

- ❌ Implementar a fórmula direto no componente.
- ❌ Adicionar em `src/utils/calculations*` (caminho legado, em
  remoção na Onda 5).
- ❌ Importar de `@/core/finance/internal/projectedSavings` em outro
  lugar — sempre via `@/core/finance`.

---

## 8. Boas práticas

### Não duplicar lógica
- Cálculo financeiro: **`core/finance`** — sempre.
- Formatação: **`@/utils/format`** — sempre.
- Regras de negócio: **`BUSINESS_RULES`** — sempre.
- Se você está prestes a copiar-colar uma função, pare e extraia.

### Usar hooks para cálculo complexo
- Cálculo derivado de 2+ inputs ou que envolve `useMemo`/`useEffect`
  vira hook em `src/hooks/`.
- Componentes ficam declarativos: leem hook, renderizam.

### Manter componentes pequenos
- Limite informal: ~300 linhas. Acima disso, decompor.
- Padrão de decomposição validado neste projeto:
  - **PdfPropostaCompleta**: 1.900 → 60 linhas (16 arquivos).
  - **InvestmentModule**: 1.096 → 904 linhas (3 componentes + 1 hook).
- Estratégia: extrair seções visuais (`*Card`, `*Block`), extrair lógica
  (hooks), e deixar o componente principal como **orquestrador**.

### Producer Context para dados compartilhados
- Quando dado precisa cruzar módulos (ex.: resultado do Investment usado
  no PDF), criar **Producer Context tipado** e reexportar pela façade
  `useProposalData()`. Nunca prop drilling pesado.

### IA é narrativa, nunca cálculo
- Edges de IA (`sales-copilot`, `investment-storytelling`,
  `phase-action`, etc.) geram **texto** consultivo a partir de números
  já calculados localmente. Nunca pedir à IA para calcular taxa,
  parcela ou IR.

### Tailwind sem classes dinâmicas
- ❌ `` `text-${color}-500` ``
- ✅ Mapa estático: `const COLOR = { red: 'text-red-500', ... }`

### Testes obrigatórios
- Toda função em `core/finance` tem teste unitário.
- Cross-module: `src/tests/crossModuleConsistency.test.ts` valida que
  Simulador, Análise, Investimento e PDF concordam nos mesmos números.

---

## Referências rápidas

| Tópico | Onde |
|--------|------|
| Fachada financeira | `src/core/finance/README.md` |
| Regras de negócio | `src/config/businessRules.ts` |
| Branding | `src/config/brandConfig.ts` |
| Façade do PDF | `src/contexts/proposal/index.ts` |
| Pipeline do PDF | `src/components/pdf/proposta/pipeline.tsx` |
| Edges de IA | `supabase/functions/*/index.ts` |
| Memória do projeto | `.lovable/memory/index.md` |
| Modo Escuro | `docs/governance/DARK_MODE.md` |

---

**Mantenedores:** ao alterar este documento, atualizar também a memória
correspondente em `.lovable/memory/` e revisar a seção §5 se novas
regras forem introduzidas.
