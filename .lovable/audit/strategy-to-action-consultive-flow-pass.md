# Strategy-to-Action Consultive Flow Pass

**Wave:** Continuidade consultiva operacional
**Risco dominante atendido:** descoberta sem continuidade · estratégia isolada
**Restrições honradas:** V2 Constitution · Production Lock V2.4 · Zero Regression · sem CRM · sem CTA agressivo
**Escopo de toque:** mínimo (1 novo arquivo declarativo + 1 refactor de componente local).

---

## Strategy Continuity Layer

Criado mapa declarativo `src/components/modules/wealth/strategyNextSteps.ts`:

- Tipo `StrategyNextStep` (`to`, `label`, `kind: 'primary' | 'secondary'`).
- `DEFAULT_NEXT_STEPS` (Simular · Comparar · Proposal) cobre 100% das 24 estratégias.
- `OVERRIDES` por estratégia onde a tese pede continuidade específica (flagships e nichos):
  - `compra-a-vista` → Comparar contra financiamento · Simular patrimônio preservado · Gerar Proposal.
  - `multiplicacao-cotas` → Estruturar fluxo multi-cotas · Comparar expansão vs financiamento · Levar para Proposal.
  - `reinvestimento-estruturado` (venda de carta) → Simular liquidez · Comparar valorização · Estruturar operação.
  - `aquisicao-acelerada` → Projetar contemplação rápida · Estruturar lance ideal.
  - `escada-patrimonial` / `alavancagem-imobiliaria` / `leverage-patrimonial` / `holding-patrimonial` / `planejamento-sucessorio` / `agronegocio` / `equipamentos-pesados` / `expansao-produtiva` / `renovacao-frota` / `patrimonio-rural` / `patrimonio-gerador-caixa` / `renda-passiva` / `compra-planejada` / `compra-hibrida` / `autoquitacao-estruturada` / `patrimonio-escalavel`.
- Máximo **1 primário + ≤2 secundários** por estratégia (anti-card-explosion).

Sem cálculo, sem snapshot, sem CRM, sem telemetria nova.

## Cross-Module Consultive Bridges

Bridges materializadas reusando primitivas existentes:

- `useModuleNavigation().navigateTo(to)` (única fonte de navegação cross-module).
- `useActiveStrategy().setActiveStrategy(id, 'wealth-library')` grava tese ativa (já consumido por `CompareWorkspace` via `compare-winner` e demais consumidores).
- Destinos válidos auditados: `simulator` · `comparator` · `proposals` · `bids` · `investment` · `diagnostic` · `patrimonial`. Nenhum destino inventado.
- Zero acoplamento: o mapa é dado puro; o componente consumidor único é `ContinuityCTA` dentro de `StrategyDetailDialog`.

## Executive Next-Step UX

Refactor cirúrgico de `ContinuityCTA` em `StrategyLibrarySection.tsx` (linhas 534–582):

- Header: eyebrow `Continuidade consultiva` (substituiu `Próximo passo`) + microcopy "Próximos passos naturais desta tese — a plataforma preserva o contexto."
- Hierarquia: 1 botão primário (label dinâmico por estratégia) + faixa hairline com 1–2 secundários (link consultivo com seta).
- Tipografia/espacamento: tokens semânticos (`text-foreground/85`, `text-primary/85`, `border-border/40`), `mt-3 pt-3 border-t border-border/40` para ritmo editorial.
- Microcopy auditada: verbos consultivos (`Modelar`, `Estruturar`, `Projetar`, `Levar para`, `Comparar contra`). **Nenhum imperativo de marketing**, nenhum "Compre agora", "Faça já", sem caps lock, sem urgência fabricada.
- A11y: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` em todos os secundários; `aria-hidden` em ícones decorativos.
- Mobile: `flex-wrap md:flex-nowrap` + `gap-x-4 gap-y-1.5` (não quebra em viewport ≥380px).

## Strategic Journey Flow

Fluxo agora explícito por estratégia:

```
StrategyDetailDialog (descoberta)
  └─ ContinuityCTA
       ├─ primário → setActiveStrategy(id,'wealth-library') → navigateTo(<modulo>)
       └─ secundários (≤2) → mesma sequência, destino alternativo
```

- Contexto preservado pela tese ativa global (`ActiveStrategyContext`, persistido em localStorage).
- Cenário preservado pela `SimulatorContext` (não tocada).
- Diagnóstico preservado pela `DiagnosticContext` (não tocada).
- Compare preservado por `ActiveStrategy` source `compare-winner` (lock V2 mantido).

## Contextual Memory Validation

- ✅ `ActiveStrategyContext` continua sendo a fonte única de tese ativa (sem duplicação).
- ✅ Nenhum novo provider, nenhum novo storage key.
- ✅ Nenhum estado local efêmero introduzido (o map é estático).
- ✅ `selectedAt` reescrito a cada clique, fornecendo recência consistente para qualquer consumidor (CompareWorkspace, ExecutiveStrategyCard, futuros bridges).

## Proposal Bridge Validation

- Destino `proposals` figura em **15 das 24** estratégias (flagships + sucessão + nichos produtivos).
- Tese é gravada antes da navegação → módulo Proposal pode consultar `useActiveStrategy()` para destacar a tese vigente (capacidade pré-existente, não regredida).
- Sem novos campos, sem novos snapshots, sem novo schema — bridge é narrativo (contexto + memória global), não dados duplicados.

## Premium Continuity UX

- Visual: faixa única `border border-border/60 bg-muted/20`, mesma linguagem dos demais painéis editoriais do dialog. Não compete com hero, KPIs ou cards.
- Microcopy: voz de consultoria, não de funil.
- Ritmo: 1 ação dominante visualmente + 1–2 caminhos alternativos com peso secundário — preserva o princípio "simples mesmo ficando mais profunda".
- Sem novos modais, novos drawers, novas rotas, novos badges promocionais.

## Zero Regression Validation

- 🔒 `src/core/finance/*` — intocado.
- 🔒 `strategyLibraryData.ts` (1441 linhas) — intocado.
- 🔒 `strategyContextScoring.ts` / `strategyDecisionSupport.ts` / `strategyExecutiveKpis.ts` / `strategyExplanationEnhancements.ts` — intocados.
- 🔒 `CompareWorkspace.tsx` / `ConsultiveStrategyPanel.tsx` / `WealthPlatformModule.tsx` / `intents.ts` — intocados (V2 LOCK).
- 🔒 `SimulatorContext` / `DiagnosticContext` / `BidsContext` / `SelectedGroupContext` — intocados.
- 🔒 `useActiveStrategy` — API preservada, apenas novo call site (mesma assinatura).
- ✅ Anti-XSS: nenhum `dangerouslySetInnerHTML` introduzido; rótulos vêm de constantes locais.
- ✅ Tailwind: apenas tokens semânticos; nenhum literal de cor.
- ✅ Bundle: `strategyNextSteps.ts` é dado puro (≈4 KB raw, tree-shakeable), zero deps.

## Final Consultive Flow State

| Critério (V2) | Status |
| --- | --- |
| Necessidade real (continuidade era gap apontado) | ✅ |
| Mínimo toque (1 arquivo novo + 1 função refatorada) | ✅ |
| Hierarquia preservada (1 primário + ≤2 secundários) | ✅ |
| Elegância (faixa única, microcopy consultivo) | ✅ |
| Engine única (mesma `navigateTo` + `setActiveStrategy`) | ✅ |
| Governança (mapa declarativo auditável) | ✅ |
| Mobile ≥380px (flex-wrap + gap controlado) | ✅ |
| Reversibilidade (remover mapa = volta ao default trivial) | ✅ |

## Final Verdict

O módulo Estratégias Patrimoniais **deixou de ser destino final** e passou a operar como **hub estratégico** da plataforma:

- Cada tese carrega seus próximos passos consultivos próprios (até 3).
- A escolha persiste em contexto global leve já existente.
- A navegação cross-module é silenciosa, executiva e contextual — sem marketing, sem CRM, sem CTA berrando, sem poluição visual.
- Wealth · Simulador · Comparator · Proposal · Bids agora conversam por meio de uma camada declarativa de 4 KB, sem nenhuma regressão nos motores financeiros ou nos contextos canônicos.

A plataforma agora se comporta como **uma consultoria patrimonial interativa contínua**, e não como uma coleção de módulos isolados.
