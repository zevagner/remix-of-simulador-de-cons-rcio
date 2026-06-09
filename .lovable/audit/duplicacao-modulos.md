# Auditoria de Duplicação — Reorganização de Módulos (Onda Navegação)

Data: 2026-04-19
Escopo: mapear redundâncias **sem alterar código de cálculo**. Esta onda
entregou apenas a reorganização de navegação (sidebar 6 passos + módulo
`analysis` com abas). Os pontos abaixo ficam para ondas futuras.

## 1. Formatação (UI) misturada com cálculo

- `src/utils/calculations.ts` exporta `formatCurrency`, `formatPercent` e
  `formatDate` — funções de **apresentação**, não de domínio financeiro.
- `src/services/smartMessages.ts` redefine localmente `formatCurrencyShort`
  em vez de importar de um util compartilhado.
- **Risco:** divergência de formato entre módulos; difícil i18n futura.
- **Sugestão (futura):** extrair para `src/utils/format.ts` e migrar imports.

## 2. Re-export em cascata em `calculations`

- `src/utils/calculations/index.ts` re-exporta `consorcio`, `investimento`,
  `lances` — mas `src/utils/calculations.ts` (raiz) também expõe parte do
  mesmo conteúdo, gerando 2+ caminhos canônicos para a mesma função
  (`@/utils/calculations` vs `@/utils/calculations/consorcio`).
- **Risco:** import inconsistente em ~40 arquivos; tree-shaking prejudicado.

## 3. "God file" `calculations.ts` (387 linhas)

- Concentra: simulação de consórcio, custo de financiamento (SAC/Price) e
  formatadores de UI.
- **Sugestão (futura):** mover `calculateFinancingCost` para
  `calculations/financiamento.ts` e isolar formatadores.

## 4. Módulos de apoio antes da onda

Antes desta onda, `Investment`, `Comparator`, `Bids`, `Advanced` (Op.
Estruturadas) e `Assemblies` eram itens de **primeiro nível** na sidebar,
competindo visualmente com os 6 passos do fluxo de venda. Cada um possuía
seu próprio cabeçalho/CTA, sem agrupamento lógico.

**Mitigação aplicada:** consolidados em `AnalysisModule` (abas), mantendo
estado de sub-aba preservado durante navegação top-level.

## 5. IDs legados ainda em uso

`NextStepCTA`, `useJourneyGuidance`, `FunnelTab` e `helpContent` ainda
referenciam os IDs antigos (`investment`, `comparator`, etc.). Isso é
**intencional**: `Index.tsx` intercepta esses IDs via `isAnalysisTabId` e
faz `setActiveModule('analysis')` + `setAnalysisTab(id)` — preservando
todos os triggers de navegação existentes sem refactor.

**Risco residual:** baixo. Documentado em `mem://arch/navigation/...`.

## 6. O que NÃO foi alterado nesta onda

- Nenhum motor de cálculo (`utils/calculations/*`, `bidsEngine`, `decisionEngine`).
- Nenhuma regra de IR (`investmentTypes.ts`, `effectiveAssumptions.ts`).
- Nenhum hook de cálculo (`useInvestmentCalculations`).
- Nenhuma RLS / edge function.

## Próximas ondas sugeridas (em ordem)

1. Extrair formatadores → `src/utils/format.ts`.
2. Quebrar `calculations.ts` por domínio real.
3. Atualizar `helpContent.ts` para refletir a nova hierarquia (Análise > abas).
4. Migrar `MORE_TABS` mobile gradualmente conforme telemetria.
