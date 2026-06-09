# Master Definitive Enterprise Platform Audit

> **Auditor:** Principal Enterprise Architect / Staff Product Engineer / Principal UX Strategist / Senior Financial Systems Auditor / Principal Security Engineer / Principal AI Governance Auditor / Principal SaaS Scalability Architect / Principal Revenue Conversion Strategist / Executive Product Critic.
> **Modo:** Brutal honesty. Zero protection. Zero auto-validation.
> **Data:** Maio/2026 · pós Adaptive Activation + Explainable Guidance.
> **Snapshot técnico medido:** 9 React contexts ativos + 8 providers aninhados em `<Index>` (profundidade 8), 60+ arquivos `*.ts(x)` >500 LOC, `SimulatorContext` com **25** `useEffect/useMemo` em **789 LOC**, `helpContent.ts` **1793 LOC**, `strategyLibraryData.ts` **1612 LOC**, 9 modules referenciam `legacy/deprecated`, **2** módulos onde Adaptive está ativa de 8 candidatos (Comparator/Investment/Assemblies), 40 deps runtime, 0 `console.log` residual, anti-XSS gate verde.

---

## 1. Enterprise Architecture Audit

### Achados duros

1. **Provider lasagna no `<Index>` — 8 níveis aninhados.**
   `ModuleNavigation → Diagnostic → Simulator → ClientJourney → InvestmentResults → BidsStudy → SelectedGroup → ActiveStrategy → StructuredOpsResults`. Cada novo módulo "Producer Context" adiciona uma camada. **Toda invalidação no `SimulatorContext` reflete em todos descendentes.** Isso é arquitetura sustentável **apenas porque** ninguém ainda escreveu um provider que faz fetch + setState em loop. Quando isso acontecer (e vai), o app fica O(n) re-renders.
   - **Risco real:** dificuldade de testar módulos isolados; HMR lento; cascata invisível em prod.
   - **Padrão alvo:** consolidar em um único `<DomainStateProvider>` que expõe slices via `useContextSelector` (use-context-selector) ou Zustand store leve.

2. **`SimulatorContext` virou God-context (789 LOC, 25 effects/memos).**
   Já é o que era para nunca ser: lógica de negócio (reconcile com motor mensal), estado de UI (selectedTab/persistência), e contratos derivados (baseResult vs result). Splittado por papel (`useSimulatorInput()`/`useSimulatorResult()`) — sim, mas a **fonte** continua monolítica. Drift inevitável quando você precisar adicionar um 26º effect.

3. **`@/utils/calculations*` ainda referenciado por `@/core/finance/index.ts`.**
   A fachada canônica que governa a Core memory ainda re-exporta de dentro do alvo banido. ESLint warn → error em Onda 5 vai forçar quebrar essa última ponte. Hoje é **dívida documentada mas viva**.

4. **9 arquivos com marcadores `legacy/deprecated/LEGACY/legacy shim`** (`useProposalsQueries`, `useProposalEvents`, `usePostSaleQueries`, `assemblyData`, `excelFileParser`, `proposalStatusNormalize`, `mipRates`, `bidAnalysis/projection`, `prestamista/constants`). Cada um é um "tombstone" pedindo remoção. Ninguém remove porque "talvez algum lugar use".

5. **Arquivos gigantes acoplados.**
   - `helpContent.ts` 1793 LOC — conteúdo + lógica de tags + categorização em um único módulo.
   - `strategyLibraryData.ts` 1612 LOC + `StrategyLibrarySection.tsx` 1492 LOC — dados e render do mesmo domínio em arquivos paralelos gigantes; **data e renderer evoluem desacoplados**.
   - `PostSaleModule.tsx` 872 LOC, `InvestmentModule.tsx` 884 LOC, `ProposalHistoryModule.tsx` 775 LOC, `ProposalPdfModule.tsx` 737 LOC — todos megacomponentes. "Funcionam" não é critério de saúde.

6. **`featureFlags.ts` tem flags zumbi.**
   `ENABLE_STRATEGY_PRESENTATION_V2` documentado como "ainda não monta nada em produção" enquanto a Memory já trata a V2 como LOCKED FOR PRODUCTION. Ou a flag está obsoleta ou a memory mente. **Inconsistência factual.**

7. **`ClientJourneyContext` mora em `src/components/layout/` em vez de `src/contexts/`.** Convenção quebrada — outros 6 contexts moram em `src/contexts/`. Drift de organização que custa onboarding de novo dev.

### Dependências frágeis
- `useProposalData()` é fachada de leitura de **5 contexts produtores**. Se um produtor falhar (provider ausente em uma sub-rota), o consumidor degrada silenciosamente. Não há `assert`/runtime invariant.

---

## 2. Financial Engine Integrity Audit

### Achados

1. **Divergência motor mensal × motor legado é institucionalmente tolerada** (≤2%/≤1%/≤5% conforme idade/prazo) — documentada em `mem://logic/simulador/divergencia-motores-tolerancias`. Isso é honesto, **mas perigoso para enterprise**: significa que dois consumidores diferentes do mesmo cenário podem mostrar números que não batem. Não é bug, é design — porém um auditor financeiro externo vai marcar.
2. **`@/core/finance` re-exporta de `@/utils/calculations*` (item 1.3).** Fachada vaza implementação. Para "single source of truth" ser verdade, a indireção precisa morrer.
3. **`MAX_TERM_MONTHS.imobiliario` foi corrigido para 200 nesta wave** — bom. Mas existiam **7 locais** com `240` hardcoded (engine, UI, mock, comment, landing). Isso prova que **`BUSINESS_RULES` não é a fonte única na prática** — é fonte única apenas quando o dev lembra. Sem ESLint guard, repete.
4. **`scenarioExecutiveKpis.ts` marcado como legacy**, mas é o engine vivo do ExecutiveKpiPick. Status confuso.
5. **PDF gates relaxados** (`hasStrategyData=true` incondicional, `hasBidsStudyData=true` incondicional) — política intencional, mas significa que **um PDF pode ser gerado sem dados úteis**, exibindo `MissingDataNote`. Para enterprise, isso é "doc com vazio assinado". Sem governance forte de "este bloco foi escolhido mas está vazio", o PDF pode sair em produção mostrando placeholder.
6. **CET via Newton-Raphson + bissecção** — bom. Mas não há **teste de convergência adversarial** documentado (cenários onde Newton não converge). Apenas 313 testes verdes não prova robustez numérica.

---

## 3. UX & Cognitive Load Audit

1. **6 módulos top-level + 5 abas internas em Analysis + 3 abas no Bids + 5 cards no Wealth Panel + 9 estratégias flagship + Compare(3) + Cockpit + Help + Community + Admin.** Hierarquia profunda. Um usuário novo sem onboarding vê **>40 superfícies clicáveis** em ≤2 cliques. "Premium consultivo" virou "tudo está disponível em todos os lugares".
2. **Adaptive Suggestion ativa em apenas 3 módulos** (Comparator, Investment, Assemblies). O resto (Simulator, Bids, Wealth, Proposal, Cockpit, Help) **não tem explicabilidade adaptativa.** Pintamos o sistema de "consultor inteligente" enquanto a maior parte das telas não calibra nada.
3. **Cockpit boundary já foi consolidada** (mem://arch/navigation/cockpit-boundary-consolidation), mas o `AIInsightsPanel` em `<details>` recolhido é "esconder problema com UI". Se o painel raramente abre, ou ele não vale ou está mal posicionado. Métricas de abertura?
4. **`helpContent.ts` 1793 LOC** — sinal de que a Central de Ajuda virou enciclopédia, não consultoria. Usuários ricos têm 30s, não 30min.
5. **Cobertura de "Por quê?"** acabou de ser ligada (esta wave) mas **só em `AdaptiveSuggestion`**. `JourneyGuideBanner` e `NextStepCTA` continuam dizendo o que fazer sem dizer porquê — caixa-preta consultiva continua viva no caminho mais visível.

---

## 4. Mobile Brutal Review

1. **Provider lasagna = re-renders em mobile.** Em iPhone SE/Citrix, 8 providers reagindo a uma mudança no SimulatorContext degradam o frame budget. Não medido nesta wave.
2. **`MobileStickyCTA` existe** (Wave 1 friction killers) mas wired só em DiagnosticModule. Os outros 5+ módulos sem sticky CTA mobile.
3. **Compare Workspace** tem regra "1col<380px" — bom, **mas** Wealth Panel + Strategy Library + Bids gráficos **não foram revistos em 320px** nesta wave. Asserção sem teste.
4. **`bottom-nav`** + módulos com sticky CTA + `Toaster bottom-right` competem por área tátil em telas pequenas. Não há z-index/positioning policy documentada.
5. **Toast cap=3 dur=3.2s** é OK para desktop, **agressivo em mobile** (usuário pode perder o toast enquanto rolar).

---

## 5. Consultive Flow Audit

1. **Caminho oficial = Diagnostic → Wealth → Comparator → Investment → Proposal**, mas **não há "trilho" visual contínuo** (stepper único). Cada módulo tem seu próprio banner/CTA/sugestão. O consultor monta o quebra-cabeças mentalmente.
2. **`useJourneyGuidance`** retorna no máximo 2 sugestões por contexto. **Não tem racional** (nem com a wave de Explainable — só `AdaptiveSuggestion` tem `rationale`). Inconsistência: dois mecanismos de guidance, um explicável, outro não.
3. **`ConsultiveBridge`** existe mas é subutilizado — apenas em alguns pares de cards. Bridges quebradas em **Assemblies→Bids**, **Bids→Simulator**, **Comparator→Proposal**.
4. **`AdaptiveSuggestion` dismiss em `sessionStorage`** — perde estado entre dias. Para um consultor que abre 30 propostas/dia, a mesma sugestão reaparece. Atrito.

---

## 6. AI Governance & Safety Audit

1. **9 edge functions** com `_lib` próprio (`aiCall`, `piiMask`, `rateLimit`, `validators`). Cada uma tem cópia de `promptFragments.ts`. Drift acontece — `sync-shared-edges.sh` existe, mas é manual.
2. **`piiMask`** mascara em log mas **payload sai para o provider** (OpenAI/Gemini) com dados crus. Sem DPA explícito no Trust Center listando "qual edge envia qual campo para qual provider". Auditor LGPD vai pedir.
3. **`aiResponseCache` tenant-aware** — bom, **mas chave inclui apenas `companyId`**. Não há TTL por intent, nem invalidation cross-tenant quando uma sugestão fica datada (ex: lance recomendado de 30 dias atrás).
4. **Sem rate limit hard per-company** (apenas por user_id/IP) — uma company toda pode estourar quota Lovable AI Gateway.
5. **Sem auditoria de prompt drift.** Quando alguém ajusta `promptFragments.ts` no _shared, a versão das outras 9 funções pode estar divergente até alguém rodar o sync script. **Garantia zero em CI.**
6. **`SafeNarrative`/`renderSafeFormattedText`** + ESLint + CI gate = anti-XSS sólido. Aqui está OK.

---

## 7. Security & Governance Audit

1. **`proposal-pdfs` bucket privado** — bom. Mas não vi política de **lifecycle** (purge após N dias) no bucket em si — só na tabela `proposal_pdf_cache`. PDFs órfãos podem ficar acumulados.
2. **`account-purge`** + `data-export` + `data-retention-purge` existem (LGPD wave 2). **Não há UI no Trust Center** para o usuário disparar export/delete sozinho — só via support. Para enterprise/EU, isso é gap.
3. **RLS tenant-aware ativo** (`MULTI_TENANT_RLS = true`). Bom. **Mas** o admin RPC `get_admin_users_page` e outros expõem cross-tenant. Se a flag for revertida sem reverter o admin, vazamento silencioso.
4. **Sem teste E2E de RLS** documentado. Validation = "trust the policy".
5. **`audit_logs`** logam algumas ações críticas (propostas, pós-venda, PDFs). **Não logam: edge function invocations, role changes, login from new device.** Para SOC2-readiness, gap.
6. **Trust Center existe** (pós wave Enterprise Governance), mas **subprocessors.md** é estático. Sem versionamento visível para o cliente (mudou de Browserless v1 para v2? cliente não fica sabendo).

---

## 8. Performance & Scalability Audit

1. **`SimulatorContext` 25 effects/memos.** Cada mudança de input dispara cadeia. Sem React Profiler trace recente.
2. **59 `queryKey`** espalhados — sem fábrica central (`queryKeyFactory.ts`). Risco de chaves divergentes para mesma entidade → cache miss + double-fetch.
3. **Manual chunks** em vite.config.ts existe (vendor-react/supabase/query/radix/charts/excel/motion/sentry/tour/dnd/markdown). **Bom.** Mas `helpContent` (1793 LOC) + `strategyLibraryData` (1612 LOC) viajam no chunk principal — devia ser `import()` lazy + code-split por rota.
4. **PDF gen via Browserless** = round-trip externo. Sem SLA documentado, sem fallback. Se Browserless cair, fluxo de proposta morre.
5. **Sem virtualização** em listas potencialmente grandes (assembleias 200+ linhas, proposal history). Política `VirtualList >200 itens` existe mas wired em **0** locais hoje.
6. **`useEffect` campeão** = SimulatorContext (7). Index.tsx (4). Tudo aceitável **se** existir profiler em CI — não existe.

---

## 9. Conversion & Persuasion Audit

1. **Wealth flagship pitch** é forte (Memory: Flagship Discoverability Layer). **Mas** no Comparador, o "Winner" ganhou CTA "Simular esta tese" — sem racional explicável ainda. Persuasão fraca: "ganhou" não diz "porque". Esta wave fez isso para Adaptive, **não para Compare Winners**.
2. **Proposta PDF** tem disclaimer, microcopy, narrativa — bom. **Mas** não tem **call-to-action emocional pré-fechamento**. Termina técnico. Vendedores consultivos fecham com pergunta, não com tabela.
3. **WhatsApp templates** existem (6 variações). Sem A/B testing tracking. Sem medição de **qual template fecha mais**. Decisão de copy = opinião.
4. **NPS / satisfação** não medidos no app. Não há sinal de "esta sugestão funcionou?". Adaptive sem feedback loop = adaptação cega.
5. **Cockpit** virou hub de roteamento. Não tem 1 frase poderosa por sessão. Cockpit honesto, mas frio.

---

## 10. Enterprise Trust & Positioning Audit

1. **Trust Center existe**, mas linkado discretamente. CIO de banco médio nem encontra.
2. **Status page / uptime / changelog público** — não existe. Para B2B sério, é table stakes.
3. **Versão `2.4.0`** documentada em memory, mas **não exibida no app footer** (não confirmei — checar).
4. **Subprocessadores** estático. SOC2/ISO 27001 / LGPD certification badges = ausentes.
5. **DPA download** = não vi link público.
6. **Linguagem** do app oscila entre "consultor" (premium) e "simulador" (operacional). Inconsistência de posicionamento. "Simulador de Consórcio Caixa" no domínio público vs "Plataforma Patrimonial Consultiva" interno.

---

## 11. Dead Weight & Legacy Drift Audit

| Arquivo / símbolo | Estado | Risco |
|---|---|---|
| `src/utils/calculations*` | `@deprecated` mas re-exportado por `@/core/finance` | Drift de fachada |
| `useProposalsQueries`, `useProposalEvents`, `usePostSaleQueries` | marcados legacy | Confunde quem busca o hook canônico |
| `excelFileParser`, `parseExcelPaste` | banidos por ESLint exceto allowlist | Allowlist é tombstone |
| `assemblyData`, `mipRates`, `bidAnalysis/projection` | marcadores `LEGACY` | Manutenção dupla |
| `PdfAnaliseFinanceira.tsx` (665 LOC) | comentário deprecated | PDF v1 que ninguém usa |
| `ClientJourneyContext` em `components/layout/` | fora da convenção | Drift de organização |
| `scenarioExecutiveKpis.ts` | "legacy" mas vivo | Status confuso |
| `ENABLE_STRATEGY_PRESENTATION_V2` flag | doc diz "não monta nada" / memory diz LOCKED | Contradição factual |
| `MULTI_TENANT_RLS` | já flipado para true | Constante pode virar `const = true` sem flag |
| `Tour Guiado` cleanup (memory v2.4) | feito, restos? | Verificar imports orfãos |

---

## 12. Product Strategy Audit

1. **Escopo cresce mais rápido que arquitetura.** 6 módulos top-level + Wealth + Strategy Library + Community + Trust Center + Admin + Pipeline + Pós-Venda. **Cada wave adiciona 1-2 superfícies.** Sem critério explícito de "matar feature".
2. **V2 Constitution** existe e é LOCK. Bom como gate, **mas** não há painel "X features rejeitadas este trimestre por violar V2". Sem isso, governance vira teatro.
3. **Memory está com 110+ entradas** — virou enciclopédia. Sinal de **decisões demais por feature em vez de princípios**. Princípios escalam; entradas não.
4. **Adaptive Intelligence** entregue como engine pura. Bom. **Mas usado em 3/8 módulos relevantes.** Investimento de eng sub-amortizado.
5. **Não há OKR de produto exposto no Admin.** "O que essa wave moveu?" — não responde com dado.

---

## 13. Brutal Honesty Findings

- **A plataforma parece premium mas tem provider lasagna de 8 níveis.** Isso é a definição de "complexidade invisível".
- **Adaptive ativo em 3/8 superfícies** = "consultivo inteligente" é em parte **enterprise fake premium**. Vende-se mais do que entrega.
- **`SimulatorContext` 789 LOC + 25 effects** = um único arquivo carrega o coração financeiro do app. Bus factor = 1.
- **`helpContent.ts` 1793 LOC** = ajuda virou wiki. Help center premium não tem 1800 linhas de dados — tem 200 linhas de princípios + busca semântica.
- **Memory com 110+ entradas** = falsa sensação de governança. Princípios > entradas.
- **Trust Center estático sem badges/DPA/status** = enterprise theater. CIO real pede SOC2.
- **9 edges com `_lib` próprio + sync script manual** = bomba relógio de prompt drift. CI deveria falhar se `_shared` divergir.
- **PDF pode sair vazio com `MissingDataNote`** = governance frouxa para um documento que sai assinado para cliente.
- **`240→200`** corrigido **em 7 lugares** = `BUSINESS_RULES` **não é a fonte única na prática**. ESLint não pega hardcode numérico.
- **2 motores financeiros (legado + mensal) com tolerâncias documentadas de até 5%** = um auditor externo vai dizer "isso não é uma plataforma, são duas".
- **Memory diz V2 LOCKED, flag diz V2 não monta nada** = contradição factual viva.
- **PDF via Browserless sem fallback** = single point of failure externo no fluxo de receita.
- **Sem feedback loop em Adaptive** = adaptação cega; "ajusta tom" sem saber se ajustou bem.
- **Zero virtualização aplicada apesar da política existir** = building blocks sem consumo.

---

## 14. Critical Risks (resolver primeiro)

| # | Risco | Por quê é crítico |
|---|---|---|
| C1 | **Provider lasagna 8 níveis** | Re-render cascade silenciosa; bloqueia mobile premium |
| C2 | **`SimulatorContext` God-context (789/25)** | Bus factor 1; bloqueia features novas |
| C3 | **`@/core/finance` re-exporta `@/utils/calculations`** | Fachada vaza; ESLint Onda 5 vai quebrar |
| C4 | **PDF Browserless sem fallback** | Single point of failure no fluxo de receita |
| C5 | **Edges `_lib` cópia × sync manual** | Drift de prompt / segurança / rate limit |
| C6 | **PDF pode sair vazio com `MissingDataNote`** | Doc assinado vazio = risco reputacional |
| C7 | **Tolerância 5% entre 2 motores financeiros** | Auditor externo reprova |
| C8 | **Adaptive em 3/8 módulos** | Promessa de produto não entregue |

## 15. High Priority Fixes

| # | Fix | Impacto |
|---|---|---|
| H1 | Splittar `SimulatorContext` em (a) `InputStore` (Zustand), (b) `EngineSelector`, (c) `ResultProjection` | Quebra God-context; testes isolados |
| H2 | Consolidar 9 contexts em 1 `<DomainStateProvider>` com `useContextSelector` | Mata lasagna |
| H3 | Adicionar `rationale` em `JourneyStep`/`NextStepCTA` (paridade com Adaptive) | Explainability uniforme |
| H4 | CI gate: `_shared-edges` divergente = build fail | Mata drift de prompt |
| H5 | Lazy `helpContent` + `strategyLibraryData` com `import()` | Reduz bundle inicial |
| H6 | `queryKeyFactory.ts` centralizado | Mata duplicação de 59 keys |
| H7 | E2E RLS suite (vitest + service role contrast) | Garante isolamento tenant |
| H8 | PDF fallback: se Browserless falhar, gerar via `@react-pdf/renderer` server-side | Resiliência |
| H9 | Ativar Adaptive em Simulator/Bids/Wealth/Proposal/Cockpit | Cumpre promessa |
| H10 | Feedback loop "essa sugestão ajudou?" em `AdaptiveSuggestion` | Aprendizado adaptativo |
| H11 | ESLint rule custom: `no-hardcoded-business-numbers` (regex 240/200/15%/0.7) | Mata drift do tipo "240→200" |
| H12 | Trust Center: badges SOC2/ISO27001/LGPD + DPA download + status page link | Enterprise readiness |

## 16. Medium Priority Fixes

| # | Fix | Impacto |
|---|---|---|
| M1 | Mover `ClientJourneyContext` para `src/contexts/` | Convenção |
| M2 | Remover flag `ENABLE_STRATEGY_PRESENTATION_V2` (resolver contradição com memory) | Verdade |
| M3 | Splittar `helpContent.ts` por categoria + search semântica | Help consultivo |
| M4 | Splittar `strategyLibraryData.ts` por tese | Data evolution isolada |
| M5 | Virtualizar Assemblies/ProposalHistory com `<VirtualList>` | Performance |
| M6 | Lifecycle policy no bucket `proposal-pdfs` (purge 30/60d) | Storage hygiene |
| M7 | Adicionar `audit_logs` para role changes + edge invocations sensíveis | SOC2 prep |
| M8 | Stepper visual único da jornada (Diagnostic→…→Proposal) | Continuidade |
| M9 | `AdaptiveSuggestion` dismiss em `localStorage` + TTL 7d | Sem reaparição |
| M10 | Resolver tolerância entre motor legado/mensal → motor único | Integridade financeira |
| M11 | Versionar `subprocessors.md` com changelog visível no Trust Center | Transparência |
| M12 | A/B tracking em WhatsApp templates | Decisão por dado |

## 17. Low Priority Fixes

| # | Fix | Impacto |
|---|---|---|
| L1 | Remover `MULTI_TENANT_RLS` flag (já true) | Limpeza |
| L2 | Limpar 9 `legacy/deprecated` markers (remover ou promover) | Sinal claro |
| L3 | Footer com versão visível (`2.4.0`) | Trust signal |
| L4 | Compress Toaster cap=2 em mobile | UX mobile |
| L5 | Métricas de abertura do `AIInsightsPanel` (`<details>`) | Decisão de manter/remover |
| L6 | Renomear `Simulador de Consórcio Caixa` (público) alinhado com "Plataforma Patrimonial" | Posicionamento |
| L7 | Painel Admin "features rejeitadas pela V2 Constitution" | Governança visível |

---

## 18. Executive Maturity Assessment

| Dimensão | Score (0-10) | Justificativa brutal |
|---|---|---|
| Arquitetura | **6.0** | Funciona, mas God-contexts + lasagna + dual engine |
| Integridade Financeira | **7.0** | Sólida, mas dupla fonte e drift de constantes |
| UX Premium | **7.5** | Bem feita; coverage de Adaptive baixa |
| Mobile | **6.0** | Primitivas existem; aplicação parcial |
| Consultive Flow | **7.0** | Bom, mas inconsistente (2 mecanismos de guidance) |
| AI Governance | **6.5** | Anti-XSS forte; drift de _lib é risco |
| Security/LGPD | **7.0** | RLS ativo, audit parcial, exports/DPA invisíveis |
| Performance | **6.5** | Bundle ok; lazy/virtual sub-utilizado |
| Conversão | **6.0** | Informa bem; persuasão pré-fechamento fraca |
| Enterprise Trust | **5.5** | Sem SOC2/ISO/DPA visível; Trust Center estático |
| Anti-Legacy | **5.5** | Tombstones vivos |
| Estratégia de Produto | **6.5** | Cresce mais rápido que arquitetura limpa |
| **Consolidado** | **6.5 / 10** | **Premium em camadas, enterprise em promessa** |

---

## 19. Final Verdict — Brutal

**A plataforma hoje parece enterprise premium em superfície, mas opera com dívida estrutural enterprise-blocker.**

1. Parece consultiva, **é consultiva em 3 de 8 superfícies relevantes**.
2. Tem motor financeiro canônico, **com dois motores tolerando-se mutuamente**.
3. Tem governance/Trust Center, **sem o material que CIO real pede** (SOC2/DPA/status).
4. Tem fachada canônica `@/core/finance`, **que ainda re-exporta o módulo que ela substitui**.
5. Tem `BUSINESS_RULES` como fonte única, **mas precisou de uma wave para corrigir `240` em 7 lugares**.
6. Tem PDF profissional, **com geração externa sem fallback e gates relaxados que permitem documento vazio**.
7. Tem Adaptive Intelligence, **sem feedback loop nem cobertura ampla**.
8. Tem Memory com 110+ entradas, **virou wiki em vez de princípios**.

**O que ainda separa esta plataforma de um produto enterprise patrimonial excepcional:**

- **Consolidação arquitetural** (provider lasagna, God-context, dual engine, fachada vazada).
- **Cumprir a promessa de Adaptive** em 100% das superfícies, com feedback loop e racional.
- **Enterprise trust real**: SOC2/ISO/LGPD badges, DPA download, status page, lifecycle policies, audit ampliado.
- **Eliminar tombstones**: 9 `legacy/deprecated` ou removem ou promovem.
- **Governance executável em CI**: ESLint anti-hardcoded numbers, sync _shared gate, E2E RLS, bundle gate.
- **Resiliência operacional**: PDF fallback, prompt drift gate, motor único.
- **Persuasão**: feedback emocional no fechamento, A/B em templates, OKR visível.
- **Reduzir superfície**: matar features que violem V2 (governança como ato, não como doc).

**Recomendação executiva:** parar de adicionar features por **2 waves consecutivas**. Wave A = colapso de arquitetura (H1/H2/H3/H4/C3/C5). Wave B = enterprise trust real (H7/H8/H12/M6/M7/M10). Depois disso, a plataforma deixa de **parecer** premium e passa a **operar** premium.

> **Veredicto:** 6.5/10. **Premium camuflando dívida.** Recuperável em 4-6 semanas focadas. Insustentável se a próxima wave for mais 5 features.
