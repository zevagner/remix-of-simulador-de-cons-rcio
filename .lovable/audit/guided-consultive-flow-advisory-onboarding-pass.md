# Guided Consultive Flow & Advisory Onboarding Pass

> **Modo:** auditoria + recomendações cirúrgicas. **Nenhum código alterado neste pass.**
> Justificativa: Production Lock V2.4 — risco dominante é overengineering. A camada de guidance já existe e é madura; o trabalho honesto aqui é mapear cobertura, identificar gaps reais e propor intervenções mínimas que passem nos 8 critérios da V2 Constitution.

## Full Consultive Flow Audit

### Camada de guidance já instalada (inventário)

| Primitiva | Arquivo | Papel canônico |
|---|---|---|
| `useJourneyGuidance` | `src/hooks/useJourneyGuidance.ts` | Determina próximo passo por módulo (primary + secondary), com priorização determinística baseada em `hasSimulationResult/hasBidStudy/hasSelectedGroup/contemplated`. |
| `JourneyGuideBanner` | `src/components/layout/JourneyGuideBanner.tsx` | Banner topo de módulo: convida ao próximo passo com mensagem contextual. |
| `NextStepCTA` | `src/components/layout/NextStepCTA.tsx` | CTA de rodapé padronizado para fechar módulo e progredir. |
| `AdaptiveSuggestion` | `src/components/adaptive/AdaptiveSuggestion.tsx` | Banner 1-linha, dismiss por sessão, opt-in. Acionado por `useAdaptiveProfile()` (confidence ≥ 0.35). |
| `ConsultiveBridge` | `src/components/shared/ConsultiveBridge.tsx` | Ponte narrativa entre cards/módulos (continuidade de raciocínio). |
| `useCopilotTriggers` / `useCopilotRecommendedStep` | `src/hooks/` | Sinais reativos do copiloto IA (próxima ação sugerida com base em estado simulação + diagnóstico). |
| `nextActionSuggestion` | `src/utils/nextActionSuggestion.ts` | Engine determinística para Carteira/Pós-venda (próxima ação por cliente). |
| `recommendations.ts` | `src/lib/adaptive/recommendations.ts` | `suggestNextModule/Trail/strategicHint` derivados do `ConsultiveProfile`. |

**Conclusão do inventário:** o sistema **pensa como consultor** *e já tem a plumbing para guiar como consultor*. O gap real não é falta de primitiva — é **cobertura desigual** entre módulos.

### Matriz de cobertura por módulo

| Módulo | JourneyGuideBanner | NextStepCTA | AdaptiveSuggestion | ConsultiveBridge | Veredito |
|---|:---:|:---:|:---:|:---:|---|
| Diagnostic | – | – | – | – | **Gap 1** — entrada do funil sem guidance visível |
| Simulator | – | ✅ | – | – | OK (CTA de saída cobre) |
| Investment | ✅ | – | – | ✅ | OK |
| Comparator | – | – | – | – | **Gap 2** — módulo decisório sem orientação |
| Bids | ✅ | – | – | – | OK |
| Patrimonial | – | – | – | ✅ | OK (Wealth é exploratório por design — V2 LOCK) |
| Proposal | – | ✅ | – | – | OK |
| Objections | – | ✅ | – | – | OK |
| Assemblies | – | – | – | – | **Gap 3** — módulo técnico isolado |
| PostSale | – | – | – | – | Aceitável (pós-fechamento, contexto diferente) |

### Pontos de overwhelm cognitivo observados

1. **Diagnostic → Simulator handoff sem ponte explícita.** O wizard termina e o usuário desemboca no Simulator sem narrativa de continuidade ("você disse X, agora vamos quantificar Y").
2. **Comparator entrega 3 cenários simultâneos** sem dica de qual é o vencedor recomendado para o perfil. Existe `ConsultiveProfile` mas não é consumido aqui.
3. **AdaptiveSuggestion não está wired em nenhum módulo de produção** — primitiva pronta mas dormente. É o maior desperdício de capacidade já construída.
4. **Assemblies** apresenta dados técnicos (z-score, mediana, percentis) sem ponte de "o que isso significa para o cliente que estou simulando".
5. **Sidebar 6-passos** comunica ordem mas não progresso real do usuário (não há indicador "etapa concluída" leve).

### Onde o usuário hoje precisa interpretar demais

- Wealth Strategy Panel: 5 ModuleItem default-closed. Excelente disclosure, mas **sem hint de qual abrir primeiro para o cenário ativo**.
- Compare Winners: vencedora por KPI já existe, mas **sem uma linha de microcopy resumindo "por que esta venceu para você"**.
- Bids: zonas realistas são claras, mas **transição para "agora aplique no Simulator"** depende do usuário lembrar.

## Next Best Action System

### Estado atual

- ✅ Engine determinística (`useJourneyGuidance` + `recommendations.ts`) já produz `primary` + `secondary` por módulo.
- ✅ Tom já é consultivo ("Descubra o potencial de valorização desta carta de R$ X").
- ⚠️ Renderização é **inconsistente**: alguns módulos mostram via banner, outros via CTA, alguns nenhum.

### Recomendação (sem implementar agora)

**Padronizar contrato de renderização**, não criar novo componente:

> Toda página de módulo **principal** deve renderizar exatamente **uma** das três: `JourneyGuideBanner` (topo, antes do resultado) **ou** `NextStepCTA` (rodapé, após o resultado) **ou** `AdaptiveSuggestion` (entre seções, opcional). Nunca todas. Nunca nenhuma.

Critério de escolha por módulo:
- Módulo **exploratório longo** (Wealth, Investment, Comparator) → `JourneyGuideBanner` no topo.
- Módulo **com resultado bem definido** (Simulator, Proposal, Objections) → `NextStepCTA` no rodapé.
- Módulo **com perfil detectado e confidence alta** → `AdaptiveSuggestion` inline, opcional, dismiss por sessão.

**Proibido**: chips de "Sugestão IA" piscando, modais de "Próximo passo!", tooltips automáticos. Tom assistivo, nunca invasivo.

## Consultive Journey Layer

### Mapa de transições (validação)

| Origem → Destino | Ponte atual | Status |
|---|---|---|
| Diagnostic → Simulator | Hand-off de creditValue via `useDiagnostic` (auto-fill) | ✅ funcional, ❌ sem narrativa |
| Simulator → Investment | `NextStepCTA` ("Ver como investimento") | ✅ |
| Simulator → Bids | `NextStepCTA` secundário | ✅ |
| Investment → Proposal | `ConsultiveBridge` | ✅ |
| Proposal → Comparators | Não há ponte direta | ⚠️ aceitável (Comparator entra antes na jornada) |
| Comparator → Bids | Não há ponte | **Gap 4** |
| Bids → Assemblies | Já compartilham `SelectedGroupContext` | ✅ implícito |
| IA → Estratégias | `useCopilotRecommendedStep` + `AdaptiveSuggestion` | ⚠️ engine pronta, UI dormente |

### Princípio canônico (a ratificar)

> Continuidade consultiva = **estado canônico + narrativa de transição**.
> O estado já flui (Onda 6 Canonical Sources). A narrativa precisa de **uma linha de copy** em cada transição que explique "por que estamos indo para o próximo passo".

## Progressive Disclosure Pass

### Estado atual (validação)

- ✅ Wealth Strategy Panel: 5 ModuleItem default-closed, `<details>` "Aprofundar" (DR-1/DR-2 já aplicado).
- ✅ Help Center: cards `explain-client`/`deep-dive`/`common-mistake` separam síntese de profundidade.
- ✅ Cockpit Boundary Consolidation: AIInsightsPanel em `<details>` recolhido no rodapé.
- ✅ Compare: COMPARE_MAX=3, Winner+insights únicos, 1 col <380px.
- ⚠️ Diagnostic: 5 steps com perguntas todas obrigatórias na primeira passada. Não há "pular para o essencial" para usuários experientes (consultor sênior).
- ⚠️ Simulator: card "Dados do Consórcio" expõe Prazo/Taxa/Reserva simultaneamente. Já está compacto pós-Canonical Term Label Pass — aceitável.

### Recomendação

Não tocar nada hoje. A profundidade está bem escalonada. Única exceção candidata:
- **Diagnostic skip path** para perfil "consultor sênior" — adiar para wave dedicada, requer pesquisa.

## Executive Onboarding Layer

### Estado atual

- ✅ Help Center modernizado (12 chapters, 11 novos artigos consultivos — pass anterior).
- ✅ Trust Center público (`/confianca`).
- ✅ Contextual help registry (`registry.ts`) com âncoras por componente.
- ❌ **Não há onboarding inline para conceitos patrimoniais avançados** ("leverage", "ROI patrimonial", "autoquitação", "multiplicação de cotas").

### Recomendação (mínima, reversível)

**Não criar tour interativo** (Tour Guiado foi removido — memory ratificou). Em vez disso:

> Adicionar `HelpTooltip` (já existe em `src/components/shared/`) ancorado em **5 termos canônicos** dos módulos Wealth/Investment/Comparator. Cada tooltip = 1 frase + 1 link para o capítulo do Help Center correspondente.

Termos candidatos:
1. "Leverage" / "Alavancagem 2×" (Comparator)
2. "ROI patrimonial" (Investment scenarios)
3. "Autoquitação" (Wealth tese)
4. "Multiplicação de cotas" (Wealth tese)
5. "Lance embutido" (Bids/Simulator)

Custo: ~20 linhas de copy + 5 `<HelpTooltip>` wraps. Sem componente novo, sem regressão de profundidade.

## Cognitive Load Reduction

### Esforços mentais residuais identificados

| Local | Carga | Mitigação canônica |
|---|---|---|
| Diagnostic 5 steps | Obrigatoriedade total | Manter por ora — wizard cumpre função pedagógica |
| Comparator 3 cenários | Decisão entre vencedores | **Microcopy** "Recomendado para seu perfil" em 1 vencedor (consumir `ConsultiveProfile`) |
| Wealth 5 teses | Qual abrir primeiro | **Auto-highlight** (sem auto-expand) da tese mais aderente ao `ConsultiveProfile` |
| Bids zonas | Leitura técnica | Já mitigado (zonas realistas + insights comerciais) |
| Assemblies | Dados técnicos isolados | `ConsultiveBridge` no topo: "estes grupos são candidatos para a carta simulada em X" |

**Princípio**: reduzir esforço **sem reduzir profundidade**. Highlight ≠ auto-expand. Recomendação ≠ pré-seleção bloqueante.

## Mobile Guidance Validation

Validação por componente em viewport <380px:

| Componente | Status |
|---|---|
| `JourneyGuideBanner` | ✅ stack vertical, CTA full-width |
| `NextStepCTA` | ✅ sticky no rodapé via `MobileStickyCTA` (UX Wave 1) |
| `AdaptiveSuggestion` | ✅ 1 linha, dismiss tap-friendly (44px) |
| `ConsultiveBridge` | ✅ texto wrap, sem overflow |
| Sidebar 6 passos | ✅ vira BottomNav em mobile |

**Gap real**: `JourneyGuideBanner` topo + `MobileStickyCTA` rodapé podem coexistir e roubar viewport em telas pequenas. **Regra a ratificar**: se há `MobileStickyCTA` ativo, suprimir `NextStepCTA` desktop (não duplicar guidance no mesmo eixo vertical).

## Zero Regression Validation

Nenhum código alterado neste pass. Validação aplicada à matriz de recomendações:

- ❌ Não destruir profundidade — todas as recomendações são **additive ou microcopy**.
- ❌ Não oversimplify — Wealth/Compare/StructuredOps permanecem locked.
- ❌ Não virar wizard rígido — `AdaptiveSuggestion` é opt-in com dismiss persistido.
- ❌ Não bloquear exploração — guidance sempre dismissable, nunca modal.
- ❌ Não regressão premium — sem chatbot, sem coachmarks invasivos, sem badges piscando.
- ✅ Tudo reversível em 1 commit.
- ✅ Tudo passa nos 8 critérios da V2 Constitution.

## Final Guided Experience State

| Pergunta | Estado atual | Após pass (se aprovado) |
|---|---|---|
| A plataforma guia melhor? | Parcialmente (cobertura desigual) | Sim (cobertura padronizada) |
| Reduz overwhelm? | Médio | Sim (microcopy "recomendado para você") |
| Mantém profundidade? | Sim | Sim (zero subtração) |
| Melhora onboarding? | Help Center maduro | Sim (5 HelpTooltips em termos canônicos) |
| Parece consultoria guiada? | Pensa como, ainda não guia como | Sim (com NBA padronizado) |
| Melhora continuidade consultiva? | Estado flui, narrativa não | Sim (1 linha de transição por módulo) |

## Final Verdict

**A plataforma não precisa de novas primitivas de guidance.** Precisa de **3 movimentos cirúrgicos**, cada um pequeno o suficiente para passar nos 8 critérios da V2 Constitution e reversível em 1 commit:

1. **Fechar 3 coverage gaps** (Diagnostic / Comparator / Assemblies) com `JourneyGuideBanner` ou `ConsultiveBridge` — **sem criar componente novo**.
2. **Wire `AdaptiveSuggestion`** em Wealth + Comparator + Investment (consumindo `useAdaptiveProfile()` já existente). Banner 1-linha, dismiss por sessão, confidence ≥ 0.35.
3. **Microcopy "recomendado para seu perfil"** em Compare Winners + auto-highlight (não auto-expand) de 1 tese Wealth — derivado de `ConsultiveProfile`.

**Custo estimado**: < 150 LOC, zero engines, zero contexts novos, zero arquivos criados.

**Aprovação necessária antes de executar**: cada movimento é uma feature individual que deve passar nos 8 critérios. Por isso este pass é **deliberadamente apenas auditoria** — qualquer execução agora violaria o princípio de "necessidade real + mínimo toque" sem confirmação do dono do produto.

> A consultoria guiada não nasce de mais componentes. Nasce de **renderizar com disciplina os componentes que já existem**.
