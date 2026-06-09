# Full System Logic & Flow Integrity Audit

> Auditoria sistêmica ponta a ponta — lógica, fluxo, encadeamento, integridade financeira e coerência consultiva. Não trata de pixels, cores ou microcopy.
> Escopo: 16 módulos top-level em `src/components/modules`, engine `src/core/finance`, contextos canônicos em `src/contexts` e `ClientJourneyContext`.

---

## 1. Executive Verdict

O sistema **hoje é, tecnicamente, uma plataforma única** — existe engine financeira canônica (`src/core/finance`), existe fachada única de dados de proposta (`useProposalData`), existe scoring unificado, existe AI central. A espinha dorsal está construída.

Mas **perceptivamente ainda parece duas plataformas convivendo**:

1. **Plataforma Operacional Comercial** (Diagnóstico → Simulador → Análise → Comparador → Bids → Assembleias → Proposta → PDF → CRM/Pós-venda → Carteira) — coesa, encadeada, com fluxo cognitivo claro, dados propagados, engine única, telemetria. Esta camada é world-class.

2. **Plataforma Patrimonial Consultiva** (Wealth / Strategy Library / Strategy-v2 / Compare / Patrimonial / Structured Ops) — **paralela**, carrega Diagnóstico e Simulador como inputs, mas **não devolve nada ao fluxo operacional**. Estratégias não viram simulações pré-configuradas, não viram propostas, não viram itens de proposta consolidada, não atualizam o Cockpit. É uma biblioteca consultiva editorial — útil, bonita, mas terminal.

**Veredito honesto:** o produto **não é ainda "uma jornada patrimonial integrada"**. É uma **plataforma comercial sólida com uma camada consultiva acoplada por cima**. A integração existe na direção `operacional → consultivo` (entrada de dados), mas **não existe na direção inversa** (consultivo → ação). Sem isso, a camada Wealth funciona como um ensaio premium, não como motor de decisão.

---

## 2. End-to-End User Journey Audit

### Fluxo real reconstruído

```
Login
  └─ Diagnóstico (5 steps, perfil + objetivo + sub-objetivo + trade-in)
       └─ Simulador (consortiumType, credit, term, ...) — pré-preenche via diagnostic
            ├─ Análise (Investment, Comparator, Bids, Advanced, Assemblies — abas)
            │    └─ todas leem useSimulatorResult / useDiagnostic / SelectedGroupContext
            ├─ Objections / Abordagem (Storytelling, Triggers, Funnel, Sales Script)
            │    └─ alimentado por centralAI + diagnostic + simulator
            ├─ Proposta (status pipeline, próximas ações, CRM)
            ├─ PDF (proposalPdf / useProposalData fachada única)
            ├─ Carteira (clientScoring, portfolioSignals, salesForecast)
            └─ Pós-venda (post_sale, follow-up)

  └─ (paralelo) Wealth Platform
       └─ StrategyLibrary (lê diagnostic + simulator.input)
            └─ ConsultiveStrategyPanel (Compra à Vista / Reforma / etc.)
                 └─ CompareWorkspace (até 3 estratégias)
       └─ (NÃO há retorno: estratégia escolhida não vira simulação/proposta)

  └─ (paralelo) StructuredOperations
       └─ relatório próprio, não conversa com proposal/PDF
```

### Coerência cognitiva: **8/10 no eixo operacional, 4/10 no eixo patrimonial**

- O usuário **entende** a progressão Diagnóstico → Simulador → Análise → Proposta. NextStepCTA + Sidebar 6-step deixam isso claro.
- O usuário **não entende** onde Wealth/Strategy se encaixa: é "exploração paralela" sem ponto de saída claro. Não há "Aplicar esta estratégia ao simulador" nem "Gerar proposta a partir desta estratégia".

---

## 3. Diagnostic Influence Audit

### Onde o diagnóstico REALMENTE influencia (verificado por `rg useDiagnostic`)

| Consumidor | Uso | Eficaz? |
|---|---|---|
| `SimulatorModule` | pré-preenche tipo/crédito/objetivo | **Sim, real** |
| `AnalysisOverview` | contexto de exibição | Sim |
| `ObjectionsModule` (Storytelling, Triggers, Funnel, SalesScript) | prompt de IA | **Sim, real** |
| `ProposalModule` / `ProposalPdfModule` | tom contextual, PDF | Sim |
| `ClientJourneyContext` | distribui para IA central | Sim |
| `salesScript/engine.ts`, `decisionEngine.ts` | retórica | Sim |
| `useAdaptiveProfile` / `adaptive/profile.ts` | sugestão de próximo módulo | Sim |
| `wealth/StrategyLibrarySection` | filtra/ordena teses | **Parcial — lê mas pouco diferencia** |
| `wealth/strategyContextScoring.ts` | scoring de estratégias | Sim, mas isolado |
| `WealthPlatformModule.tsx` | **não consome diagnóstico diretamente** | **Não — só StrategyLibrarySection consome** |
| `comparator/*` | parâmetros de comparação | Parcial |
| `InvestmentModule` | premissas iniciais | Parcial — usa simulator, não diagnostic |

### Onde o diagnóstico **NÃO** influencia (deveria)

- **BidsModule** — não usa perfil de risco/urgência para sugerir agressividade de lance. `clientScoring` poderia entrar aqui, não entra.
- **Assemblies** — ranking de grupos não usa horizonte/objetivo do diagnóstico.
- **StructuredOperations** — completamente cego ao diagnóstico.
- **PatrimonialModule** — usa pouco.
- **CompareWorkspace (strategy-v2)** — não pondera "winner" com base no perfil do diagnóstico (usa heurística própria).

### Veredito

Diagnóstico **não é fake** — alimenta IA, retórica, pré-preenchimento e scoring. Mas seu **alcance estrutural está concentrado no eixo comercial-narrativo** (IA + propostas). No eixo patrimonial-analítico (bids, assemblies, structured ops, compare), o efeito é **decorativo**: os dados estão lá, mas as engines não condicionam saídas pelo perfil.

**Risco:** o usuário responde 5 passos e percebe efeito principalmente em textos gerados, não em números. Isso, com o tempo, mina confiança no diagnóstico.

---

## 4. Module Linking Audit

| Módulo | Lê contexto upstream? | Devolve algo downstream? | Status |
|---|---|---|---|
| Diagnostic | — | Simulator, Objections, Proposal, Wealth | **Hub real** |
| Simulator | Diagnostic | Analysis, Investment, Comparator, Bids, Proposal, PDF, Wealth | **Hub real** |
| Analysis (overview) | Simulator, Diagnostic | Sub-abas | OK |
| Investment | Simulator (`InvestmentResultsContext`) | Proposal, PDF | **Bem ligado** |
| Comparator | Simulator | Proposal | OK |
| Bids | Simulator, `SelectedGroupContext` | `BidsStudyContext` → PDF | **Bem ligado** |
| Assemblies | `SelectedGroupContext` | Bids (estatísticas) | OK |
| Objections | Diagnostic, Simulator, IA | UI consultiva | OK (terminal) |
| Patrimonial | Simulator, hooks próprios | — | **Ilha parcial** |
| Wealth/Strategy | Diagnostic, Simulator (leitura) | **Nada** | **Ilha consultiva** |
| Strategy-v2/Compare | Strategy seleção | **Nada** | **Terminal** |
| StructuredOps | próprio | relatório próprio | **Ilha completa** |
| Proposal | tudo acima via `useProposalData` | PDF, CRM, Carteira | **Hub final** |
| PDF | fachada `useProposalData` | export | Hub bem montado |
| Carteira | proposals, scoring | sugestões | Bem ligado |
| Pós-venda | proposals fechadas | follow-up | Bem ligado |
| Community / Help | — | — | OK (suporte) |

### Ilhas críticas

1. **Wealth / Strategy Library** — leitura sem escrita. Não há "Aplicar estratégia" que atualize `SimulatorInput`, nem "Gerar proposta com esta tese".
2. **StructuredOperations** — completamente paralelo. Relatório próprio, gerador próprio, não vai para PDF unificado nem para Carteira como item de proposta.
3. **Patrimonial** — meia-ilha. Usa simulador mas não publica resultado canônico para Proposal.

---

## 5. Financial Engine Integrity Audit

### Pontos fortes (verificados)

- `src/core/finance` é fachada única — installments, financing (price/SAC/CET), insurance, prestamista, investment.
- Testes de paridade existem: `installmentSingleSourceOfTruth`, `simulationResultGoldenSnapshot`, `financingEngineParity`, `comparatorEngineParity`, `simulatorContextParity`, `crossModuleConsistency`.
- `reconcileWithSchedule` garante que `result.fullInstallment/reduced/rediluted` derivam do schedule mensal.
- `consortiumRates.ts` + `businessRules.ts` = fonte única de taxas/limites; ESLint bloqueia hardcode.
- Tolerâncias documentadas entre motor mensal atuarial vs legado.

### Pontos de drift residual

- `useInvestmentCalculations.ts` é parcialmente independente: gera 6 paths (path1..path6) com derivações próprias (cdiDerived, scheduleWithINCC). **Não é duplicação de math**, mas é uma segunda camada de orquestração — qualquer regra nova precisa ser replicada manualmente lá.
- `strategyLibraryData.ts` contém **cálculos editoriais hardcoded** (KPIs por estratégia: "Parcela mensal estimada (80m)", "Lucro líquido em N anos", etc.). Esses números **não passam pela engine canônica** — são strings ilustrativas. Isso é a maior fonte de drift conceitual ativa hoje.
- `StructuredOperationsModule` tem seu próprio caminho de cálculo para o relatório; precisa auditoria de paridade.
- `useInvestmentCalculations` e `core/finance/investment` coexistem — façade existe mas hot path do módulo Investment ainda passa pelo hook.

### Veredito

Engine **financeira está limpa** no eixo simulador/proposta/PDF. **Drift conceitual real** está em: (a) números editoriais de `strategyLibraryData.ts`, (b) StructuredOps, (c) orquestração paralela do Investment hook.

---

## 6. Consultive Consistency Audit

### Coerência narrativa: **boa no operacional, frágil no patrimonial**

- IA central (`centralAI`) padroniza tom (CSAA, tom contextual por perfil, disclaimer obrigatório, "nunca prometer garantia"). Isso unifica Objections, Proposal, Storytelling, Sales Script.
- Mas a **camada Wealth tem voz editorial paralela**: `strategyExplanationEnhancements.ts`, `strategyDecisionSupport.ts`, `strategyLibraryData.ts` são conteúdo curado, não IA. **Não passam pelos fragments de prompt (CONSULTATIVE_TONE/TRUST/OBJECTION/URGENCY)**.

### Contradições potenciais

- Wealth Library pode recomendar uma "Compra à Vista" como flagship enquanto o Diagnóstico classificou o cliente como "alavancagem patrimonial agressiva". Não há guard cruzado.
- Cockpit boundary (rule de memória) diz "Cockpit indica, não resolve" — mas Wealth também só indica. Há **dois indicadores sem resolvedor único**.

### Veredito

Consistência consultiva **operacionalmente sim, filosoficamente parcial**. A "filosofia patrimonial" da Library não é reconciliada com a "filosofia comercial" do funil.

---

## 7. Wealth Journey Validation

Pergunta: **o produto parece uma jornada patrimonial integrada?**

**Resposta honesta: ainda não.**

Razões:
1. A "jornada" tem dois trilhos paralelos (comercial e patrimonial) sem ponte de saída do patrimonial para o comercial.
2. Estratégia escolhida no Wealth **não vira ação** — não pré-configura simulador, não abre proposta, não entra na Carteira como tese rastreada.
3. Não existe estado "estratégia ativa do cliente" persistido — ao sair do módulo, a escolha se perde.
4. Compare (até 3 teses) termina em "Winner" mas **o winner não dispara nada**.

O que existe de jornada real: **Diagnóstico → Simulador → Análise → Proposta → CRM**. Isso sim é uma jornada. Wealth é uma **enciclopédia consultiva acoplada**, não um eixo da jornada.

---

## 8. Decision Support Validation

| Pergunta | Resposta |
|---|---|
| Comparativos são úteis? | Sim — Comparator (consórcio vs financiamento), Investment (6 paths), CompareWorkspace (até 3 teses). Math sólida. |
| Estratégias são acionáveis? | **Parcialmente.** No funil comercial sim (NextStepCTA, status pipeline). Na Library Wealth, **não** — falta CTA "aplicar". |
| Guidance é coerente? | Sim no operacional. Adaptive layer (`useAdaptiveProfile`) sugere próximo módulo com confidence guard. |
| Existe progressão lógica até decisão final? | Sim no eixo Proposta. Não no eixo Estratégia. |
| O Cockpit ajuda a decidir? | Funciona como hub de roteamento ("indica, não resolve"). Por design não resolve — então a pergunta de "decisão final" vive no funil comercial. |

**Gap principal:** a "decisão patrimonial" (qual tese seguir) não tem fechamento. A "decisão comercial" (qual proposta enviar) tem.

---

## 9. Redundancy & Dead Flow Audit

### Redundâncias

- **Recomendação de estratégia** aparece em 3 lugares com lógicas diferentes: `useAdaptiveProfile.recommendations`, `wealth/strategyContextScoring`, `centralAI` (next_step intent). Três motores sugerindo coisas semelhantes sem reconciliação.
- **"Análise"** existe como módulo agregador (AnalysisModule) e também como abas espalhadas. OK por design (sidebar-6-step), mas usuário pode confundir.
- **PDF data** já foi consolidado em `useProposalData` — isso resolveu uma redundância anterior. Bom estado atual.
- **Cálculo de parcela** já foi resolvido por `reconcileWithSchedule`. Bom.

### Fluxos mortos / componentes sem retorno

- **CompareWorkspace.Winner** — calcula vencedor, sem CTA de aplicação.
- **StrategyLibrary.ViabilityPreview** — mostra KPIs ilustrativos sem caminho para virar simulação real.
- **StructuredOperations** — gera relatório isolado.
- **CommunityModule / HelpModule** — funcionam como suporte, OK.

### Telas sem função real

Nenhuma totalmente vazia. Mas Wealth funciona como "destino sem saída" — alta carga cognitiva, baixo throughput para ação.

---

## 10. Cognitive Flow Audit

- **Sidebar 6-step linear** dá estrutura clara — bom.
- **NextStepCTA** padroniza progressão — bom.
- **Onboarding** com nomenclatura corrigida ("Resumo" → "Proposta") — bom.
- **Sobrecarga real:** AnalysisModule com 5 sub-abas + Wealth com Library de muitas teses + Compare + Cockpit + Patrimonial = **o usuário precisa decidir onde olhar**. A V2 Constitution proíbe "dashboardization" — está bem aplicada no operacional, mas Wealth + Strategy-v2 + Patrimonial juntos **flertam com layering**.
- Falta um "mapa mental" único: "você está aqui na jornada".

---

## 11. System Truth Audit

> O sistema inteiro parece uma única plataforma patrimonial inteligente?

**Resposta brutal: parece uma plataforma comercial inteligente com uma camada patrimonial editorial colada por cima.**

Justificativa:
- O eixo Diagnóstico → Simulador → Análise → Proposta → CRM → Carteira → Pós-venda é **uma plataforma real, com engine única, contexto compartilhado, IA padronizada, governance aplicada**. Esse eixo, isolado, **é world-class**.
- O eixo Wealth + Strategy-v2 + StructuredOps é **uma camada editorial-consultiva sofisticada que vive ao lado**, lê o contexto operacional, mas não devolve estado nem ação. É **alta qualidade isolada, baixo encaixe sistêmico**.

A diferença entre "plataforma única" e "duas plataformas vizinhas" hoje está exatamente no **retorno**: nada do consultivo vira ação rastreada no operacional.

---

## 12. Critical Problems

1. **Wealth Strategy não tem CTA de aplicação** — escolher uma tese não muda o estado da jornada. Maior bug conceitual ativo.
2. **`strategyLibraryData.ts` contém números editoriais hardcoded** — viola a regra de engine única e cria drift narrativo vs. simulação real.
3. **CompareWorkspace.Winner é terminal** — calcula vencedor, sem próxima ação.
4. **StructuredOperations é módulo-ilha** — não emite estado para Proposal/PDF/Carteira.
5. **Três motores de recomendação convivendo sem reconciliação** (adaptive, strategy scoring, centralAI).

## 13. Structural Weaknesses

- Não existe entidade **`ActiveStrategy`** persistida por cliente. Sem isso, nenhum link consultivo→operacional é possível.
- Não existe **bridge** "estratégia → simulator input + diagnostic anchors".
- Bids/Assemblies/StructuredOps são cegos ao diagnóstico em nível analítico (só ao nível narrativo).
- Adaptive layer e Strategy scoring são paralelos e podem divergir silenciosamente.

## 14. Hidden Risks

- Usuário responde diagnóstico e sente que "nada muda" na parte analítica → erosão de confiança no diagnóstico.
- Números ilustrativos da Library divergindo de simulações reais → percepção de "marketing dentro do produto".
- Compare patrimonial recomendando A enquanto Comparator financeiro recomenda B → contradição visível.
- Crescimento contínuo da camada Wealth sem rota de retorno → "feature layering" proibido pela V2 Constitution se materializando lentamente.

## 15. What Feels World-Class

- Engine financeira canônica + testes de paridade + golden snapshot.
- `useProposalData` como fachada única de PDF.
- Reconciliação parcela canônica (single source of truth).
- Pipeline cadence + scoring unificado + portfolio signals.
- AI central com fragments compartilhados, rate limit por usuário, cache tenant-aware.
- Governance executável (lint anti-XSS, anti-import direto de utils/calculations, bundle policy, runtime policy).
- Anti-drift de assembleias (edge pipeline, parser canônico, snapshot/diff).
- V2 Constitution + Adaptive layer com confidence guard.

## 16. What Still Feels Disconnected

- Wealth Strategy Library ↔ Simulator/Proposal (sem ponte de ação).
- StructuredOperations ↔ resto do sistema.
- Patrimonial ↔ Proposal canônica.
- Diagnóstico ↔ Bids/Assemblies (uso analítico, não só narrativo).
- Três camadas de recomendação ↔ entre si.
- CompareWorkspace ↔ funil de proposta.

---

## 17. Final System Integrity Verdict

**O sistema hoje é uma plataforma comercial-patrimonial de alta engenharia com uma camada consultiva premium ainda acoplada — não fundida.**

- Como **plataforma de simulação e venda de consórcio com inteligência consultiva**: **9/10**. Engine sólida, dados propagados, IA padronizada, governance real, jornada clara.
- Como **plataforma patrimonial integrada** (a promessa da V2 Constitution): **6/10**. A camada existe, é sofisticada, mas vive em paralelo. Não fecha o ciclo "tese → ação → acompanhamento".

**Próximas ondas de integridade sistêmica (em ordem de impacto):**

1. **Bridge "Aplicar estratégia"** — toda estratégia da Library e todo Winner do Compare precisa de CTA que escreva em `SimulatorInput` + crie/atualiza proposta + grava `ActiveStrategy` no cliente.
2. **Substituir números editoriais de `strategyLibraryData.ts`** por chamadas à engine canônica com inputs do simulador/diagnóstico. KPIs do card devem ser **derivados**, não hardcoded.
3. **Reconciliar três motores de recomendação** em uma única hierarquia (adaptive como leve, strategy scoring como específico, centralAI como narrativo) com regra de precedência declarada.
4. **Promover diagnóstico a input analítico** em Bids (agressividade), Assemblies (ranking), StructuredOps (cenários).
5. **Integrar StructuredOperations** ao pipeline canônico de proposta/PDF/Carteira.

Sem essas pontes, a camada Wealth continuará crescendo em sofisticação visual sem ganhar peso sistêmico — e a constituição da V2 será violada por acúmulo, não por decisão.

— Fim da auditoria.
