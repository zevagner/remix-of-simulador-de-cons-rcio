# Super Auditoria Técnica Profunda — Pós M3-F

**Data:** 2026-05-11  
**Autor:** Principal Engineer (auditoria interna)  
**Escopo:** código + arquitetura + DB + edges + segurança + performance + debt  
**Tom:** brutalmente honesto. Sem vernizes.

---

## 0. Resumo executivo (sem suavização)

O sistema **funciona**, é tenant-aware de verdade e sobreviveu a uma migração de 6 ondas sem regressão observável. Isso é raro e merece reconhecimento. **Mas** a maturidade real é menor do que o score 9.3 da M3-F sugere — esse score mediu **a qualidade da migração**, não a saúde global.

Indicadores duros:
- **66.621 LOC** em `src/`, 32 hooks, 107 componentes em `modules/`, 15 edge functions, 61 migrations.
- **6 arquivos > 700 LOC**, lideres: `InvestmentModule.tsx` (1.037), `objectionsLibrary.ts` (971), `ProposalPdfModule.tsx` (877). Todos são pontos de manutenção tóxicos.
- **`idx_profiles_user_id`: 49,6 milhões de scans** em base com 1.604 perfis. Sinal claro de que `is_company_member` / `current_company_id` estão sendo invocados por linha em policies e/ou em loops no client. **Esse é o gargalo nº 1.**
- **Todos os índices `_company` criados na M3-A têm `idx_scan = 0`.** O planner ignora. Significa que o trabalho de M3-A entregou índices que ainda não pagam aluguel — debt silenciosa.
- **31 warnings do linter** persistem (cosmética em sua maioria, mas embaraçosos para audit externo).
- **10 componentes** ainda fazem `import` direto de `@/integrations/supabase/client` — cisão de responsabilidade vazando para a UI.
- **0 testes E2E multi-tenant**, apesar de o produto ser oficialmente multi-tenant. O checklist da M3-F existe só em markdown.

**Score honesto consolidado: 7.4 / 10** (detalhado em §14). É um produto tecnicamente correto que ainda **não é uma plataforma**.

---

## 1. Maiores riscos (top 7, ordenados por dano potencial)

| # | Risco | Severidade | Probabilidade | Por quê |
|---|-------|------------|---------------|---------|
| 1 | **RLS recursiva via helpers** disparando `is_company_member` por linha em queries grandes | 🔴 Alto | Alta | 49,6M scans em `profiles` em base ínfima — escala linearmente com tráfego |
| 2 | **Índices `_company` mortos** (0 scans) | 🟠 Médio | Já presente | Custo em INSERT/UPDATE sem benefício; planner usa `_user` |
| 3 | **`InvestmentModule.tsx` 1.037 LOC** acumulando UI + cálculo + storytelling + persistência | 🔴 Alto | Já presente | Cada toque vira regressão; impossível testar unitariamente |
| 4 | **Zero teste automatizado de isolamento tenant** | 🔴 Alto | Alta | Próxima feature M4 (manager view) pode vazar dados sem ninguém perceber |
| 5 | **`company_id NULL` ainda permitido em policies tenant** | 🟠 Médio | Média | Safety net útil hoje, bomba-relógio amanhã: qualquer trigger novo que esqueça `company_id` cria registro globalmente visível ao próprio dono |
| 6 | **Edge functions de IA sem circuit breaker nem timeout explícito** | 🟠 Médio | Média | LOVABLE_API_KEY pode degradar/travar; UI não tem fallback claro |
| 7 | **15 edge functions, várias duplicando lógica** (sales-script, sales-copilot, sales-response, trigger-script, phase-action, module-copilot) | 🟡 Aceitável agora | Alta no futuro | Cada uma com seu prompt, rate-limit, validação. Multiplicação de superfície |

---

## 2. Arquitetura geral

### 2.1 O que está bom
- Separação `core/finance` como façade financeira é correta e está sendo respeitada.
- `contexts/proposal` como façade do PDF é uma decisão acertada — evita o anti-pattern de “Context guarda‑tudo”.
- `tenantKey()` e split `useSimulatorInput`/`useSimulatorResult` mostram maturidade real em hot paths.

### 2.2 O que está ruim
- **`components/modules/` virou um lixão de domínio**: 107 arquivos misturando feature, UI atômica, sub-tab, container e hook. Não há `features/` por bounded context. Conforme cresce M4 isso vira ingovernável.
- **Hooks têm responsabilidade ambígua**: `useCentralAI`, `useCopilotRecommendedStep`, `useCopilotTriggers`, `useJourneyGuidance`, `useModuleCopilot` — cinco hooks que parecem orquestrar a mesma decisão (“o que sugerir agora”). Provável duplicação.
- **`useEffect`/`useMemo`/`useCallback`** não puderam ser contados pelo grep (tsx fora do `--type`), mas inspeção visual dos arquivos top-LOC mostra **memoização defensiva sem profile** — clássico cargo cult.
- **10 componentes importam `supabase/client` diretamente.** Quebra a regra implícita “UI não fala com DB”. Os offensores principais são `AdminAIPerformance`, `AdminDashboard`, `objections/FunnelTab`, `objections/TriggersTab`, `bids/BidAIRecommendation`. Devem virar hooks dedicados.
- **`integrations/supabase/types.ts` com 43 KB** (gerado) — ok, mas o projeto não tem `database.types.ts` slim para domínio.

### 2.3 Acoplamento perigoso
- `InvestmentModule.tsx` (1.037 LOC) referencia simulação, diagnóstico, journey, storytelling, PDF, analytics. É o equivalente arquitetural a um “controller god”. **Refatoração obrigatória antes de M4** — ou M4 nasce engessado.

---

## 3. Frontend performance

| Sintoma | Diagnóstico | Ação |
|---|---|---|
| 49,6M scans em `idx_profiles_user_id` | RLS helpers chamados por linha + provável re-fetch em cada navegação | Cache `current_company_id` no client (já feito em `useCurrentCompany`) **+ inline as policies** (§4.3) |
| `useInvestmentCalculations` split em 6 paths memoizados | Bom em teoria; precisa profiling real para confirmar que não há recompute por ref | `browser--performance_profile` antes de declarar vitória |
| Bundle: lazy-load só de `LandingPage`/admin? | Não há split por módulo grande (`InvestmentModule`, `ComparatorModule`, `PostSaleModule` são pesados) | Code-split por rota/tab — ganho estimado ~25-35% no TTI |
| Tabelas Recharts em `bids/BidsSimulationTab.tsx` (32 KB) | Re-render no slider — não há throttling/debounce explícito | `useDebouncedValue` já existe; aplicar |
| `proposalTemplates.ts` 38 KB carregado sempre | Templates de proposta são raramente usados em primeira visita | Dynamic import quando o usuário abre Proposta |

### 3.1 Memory leaks plausíveis
- Subscriptions Supabase realtime em `useProposalEvents` — verificar `channel.unsubscribe()` em cleanup.
- Listeners de `storage` (localStorage cross-tab) em `useLocalStorage` — confirmar removal.

---

## 4. React Query / cache

### 4.1 Pontos fortes
- `tenantKey()` está aplicado nos hooks operacionais corretos.
- Cleanup no logout (`removeQueries({ queryKey: ['t'] })`) é defensivo e correto.

### 4.2 Pontos fracos
- **Apenas 13 arquivos** usam `useQuery|useMutation|useInfiniteQuery`. O resto está fazendo I/O em `useEffect` ou em `services/*`. Resultado: **a maior parte do tráfego de dados não passa por React Query**, e portanto não tem dedup, retry ou stale management. Especialmente os 10 componentes admin/objections que importam `supabase/client` direto.
- Não há `staleTime` / `gcTime` configurados de forma uniforme — está nos defaults, o que para uma SPA pesada significa **refetch em cada `refetchOnWindowFocus`**. Verificar `QueryClient` global.
- Não há prefetch nas rotas — navegação Sidebar 6-passos sempre paga round-trip.
- Optimistic updates só nas mutações de proposta. Pós-venda e bids não têm — UX trava em cada save.

---

## 5. Supabase / PostgreSQL — análise dura

### 5.1 Hotspots reais (idx_scan)
```
idx_profiles_user_id           49.619.374
idx_assembly_results_group      2.429.387
idx_user_roles_user_role          157.130
idx_user_roles_user_id            302.790
user_roles_user_id_role_key        80.013
```
Tradução: **`has_role()`, `is_approved()`, `current_company_id()`, `is_company_member()` estão sendo chamados em loop**. Cada policy `tenant: ...` faz `is_company_member(company_id)` que faz `SELECT 1 FROM company_users WHERE ...`. Em SELECTs com 1.000 linhas, isso é potencialmente **1.000 sub-queries**. PostgreSQL inlinea quando consegue; helpers `STABLE SECURITY DEFINER` com `SET search_path` **frequentemente não são inlineados**.

**Recomendação concreta:** transformar policies tenant em **inline** sem helper:
```sql
USING (
  auth.uid() = user_id
  AND (
    company_id IS NULL
    OR EXISTS (SELECT 1 FROM company_users cu
               WHERE cu.company_id = proposals.company_id
                 AND cu.user_id = auth.uid() AND cu.active)
  )
)
```
Permite ao planner usar `idx_company_users_company` + `_user` em uma única semi-join. Ganho esperado: 5-20× em listagens grandes.

### 5.2 Índices mortos / redundantes
- `idx_*_company`, `idx_*_company_created`, `idx_*_company_event` na maioria das tabelas: **0 scans**. Custo em INSERT, sem benefício em SELECT. Drop em M4-pre.
- `idx_profiles_nome_lower` 0 scans — drop.
- `idx_audit_logs_user_id` 0 scans, mas `idx_audit_logs_user_created` é usado — drop o redundante.

### 5.3 Triggers
- 7 triggers DDL custom + `set_company_id_from_profile` genérico. Toda escrita em `proposals` dispara `log_proposal_*`, que dispara `set_company_id_*`. **Cadeia de triggers em cada UPDATE** — dois INSERTs adicionais por escrita. Aceitável hoje (218 propostas), perigoso a 1M.
- `validate_proposal_business_rules` levanta `RAISE EXCEPTION` com mensagem em PT-BR — boa UX, mas **sem código de erro estruturado**, dificulta tratamento no client.

### 5.4 FK strategy
- **Nenhuma FK declarada** em tabelas operacionais (`proposals`, `proposal_events`, `post_sale_*`, `audit_logs`). Todos os relacionamentos são “convencionais”. Risco de órfãos se um delete cascading falhar. ⚠️ Aceitar conscientemente ou adicionar FK + `ON DELETE`.

### 5.5 Concorrência
- Sem `SELECT ... FOR UPDATE` em mutações de status — `UPDATE proposals SET status='fechado'` em race com outro tab do mesmo usuário gera `proposal_events` duplicados. Improvável, mas plausível.

---

## 6. Edge Functions

### 6.1 Sintomas
- **15 funções**, várias com lógica sobreposta:
  - `sales-script`, `sales-copilot`, `sales-response`, `trigger-script`, `phase-action`, `module-copilot` — todas geram texto contextual com Lovable AI. Provável extrair 1 base + 6 prompts.
  - `niche-storytelling`, `investment-storytelling` — mesmo padrão.
- Sem **shared util de retry/timeout/circuit-breaker**. Cada função reimplementa fetch + parsing.
- Sem **observabilidade unificada**: cada função loga seu próprio formato. Difícil dashboard.

### 6.2 Custos
- `bid-recommendation` cache híbrido (cache→DB→IA) é o padrão correto, mas é o único. Outras funções batem IA toda vez.

### 6.3 Recomendação
- Criar `_shared/aiCall.ts` com: timeout (15s), retry (1×), normalização de erro, métrica.
- Migrar progressivamente; nada urgente, mas **cada nova edge function adicionada antes disso multiplica o trabalho**.

---

## 7. Storage / PDF

- Geração via Browserless: terceirização cara (`BROWSERLESS_API_KEY`). **Sem cache de PDF idêntico** beyond `proposal_pdf_cache` por hash. Validar que o hash é determinístico (deveria incluir `updated_at` e versão de template).
- Política legacy `Users read own pdfs` mantida — correto. Adicionar TTL/cleanup job (M5) para apagar PDFs gerados há > 90 dias e não acessados.
- Signed URLs: edge `share-proposal` gera token de 256-bit — ok. Mas não há revogação em massa caso vaze.

---

## 8. Segurança

| Item | Status |
|---|---|
| RLS em todas as tabelas operacionais | ✅ |
| Helpers SECURITY DEFINER c/ `SET search_path` | ✅ |
| `EXECUTE FROM PUBLIC` revogado em 22 fns | ✅ (M3-F) |
| Triggers SECURITY DEFINER ainda flagadas pelo linter (31) | 🟡 Cosmético |
| Zod em todas as edges | ⚠️ Parcial — auditar uma a uma |
| Rate limit por user_id | ⚠️ Documentado em memória, mas implementação fragmentada |
| Service role usado em edges | ⚠️ Verificar se é necessário em todas; preferir respeitar RLS |
| XSS em conteúdo gerado (proposals.proposal_content) | ⚠️ Renderizado como HTML em algum ponto? Auditar |

**Gap real:** ausência de **tabela `rate_limits` central**. Cada edge faz seu próprio controle, criando inconsistência.

---

## 9. UX técnica

- **Loading states:** muitos `Skeleton` → bom. Mas vários componentes mostram spinner em re-fetch invisível, criando flicker.
- **Race conditions:** `useAuth` + `useCurrentCompany` resolvem assincronamente; queries com `enabled: !!cid` evitam o pior caso, mas **um flicker de “carregando…” em cada navegação** é o preço.
- **Offline:** zero suporte. PWA cache cobre assets; mutações offline não enfileiram.
- **Empty states:** consistentes em CRM, faltam em Comunidade e Comparador.

---

## 10. Observabilidade

- `analytics_events` cresce rápido (31k em base pequena). Sem retenção, sem partitioning. Em 1 ano serão milhões.
- Edge logs por função, sem agregação cross-function.
- Sem alertas (Sentry/similar) — **toda exceção do client morre no console do usuário**.
- Sem `request_id` correlacional cliente↔edge↔db.

**Top 3 ações:**
1. Particionar `analytics_events` por mês (M4).
2. Adicionar Sentry no frontend (quick win, alto valor).
3. Padronizar log JSON em todas as edges com `request_id`.

---

## 11. Manutenibilidade

| Indicador | Valor | Veredito |
|---|---|---|
| Arquivos > 500 LOC | 12 | 🔴 muitos |
| Componentes em `modules/` | 107 | 🟠 sem subpastas por feature |
| Hooks | 32 | 🟡 alguns sobrepostos |
| Migrations | 61 | 🟡 esperado pós-M3 |
| TODO/FIXME | 8 | ✅ baixo |
| `any` declarados | 0 (encoraja) | ✅ |

**Ofensores prioritários:**
1. `src/components/modules/InvestmentModule.tsx` — quebrar em `InvestmentModule/` com `Header`, `Tabs`, `ScenarioCard`, `useInvestmentOrchestrator`.
2. `src/components/modules/ProposalPdfModule.tsx` — extrair seleção de blocos para `useProposalPdfBlocks`.
3. `src/data/objectionsLibrary.ts` — virar JSON ou tabela (caberia em `community_cases`).

---

## 12. Escalabilidade futura

Cenário M4+ (managers, multi-empresa real, 10× tráfego):

| Componente | Suporta? |
|---|---|
| RLS atual | ❌ Sem inline (§5.1) vai degradar antes de 5×. |
| Índices company-aware | ⚠️ Existem mas não são usados — primeiro é preciso refazer policies pra ativá-los. |
| React Query cache isolation | ✅ |
| Edge functions IA | ⚠️ Custo $$$ explode sem cache compartilhado (§6.3). |
| `analytics_events` | ❌ Sem partitioning vira problema em 6 meses. |
| PDF | ⚠️ Browserless: revisar contrato/quotas. |
| Auth flow | ✅ |

---

## 13. Dívida técnica — classificação

### 🔴 Perigosa (resolver antes de M4)
1. **InvestmentModule.tsx 1.037 LOC** — refatorar.
2. **RLS helpers em loop / índices `_company` ociosos** — inlinear policies.
3. **Zero teste E2E multi-tenant** — implementar `multitenant.invariants.test.ts`.

### 🟠 Importante (M4-pre)
4. **10 componentes com `supabase/client` direto** — extrair hooks.
5. **6 edges de IA duplicando lógica** — `_shared/aiCall.ts`.
6. **`company_id NULL` permissivo** — adicionar `NOT NULL` + backfill check.
7. **Sem Sentry** — adicionar.

### 🟡 Aceitável
8. 31 warnings linter (trigger fns).
9. `objectionsLibrary.ts` 971 LOC.
10. 61 migrations.

### ⚪ Cosmética
11. `idx_profiles_nome_lower` 0 scans — drop.
12. Naming: `companies` vs `organizations_pkey` (legado).

---

## 14. Score brutalmente honesto

| Dimensão | Score | Justificativa |
|---|---|---|
| Arquitetura | **6.5** | Façades certas, módulos inchados, 107 arquivos sem subdivisão |
| Performance frontend | **7.0** | Hot paths splitados, mas memoização defensiva e sem code-split por módulo |
| Performance DB | **6.0** | 49M scans em profiles é o sintoma; RLS helpers não inlineados |
| Segurança | **8.0** | Hardening real; gaps em Zod/rate-limit/Sentry |
| Multi-tenant isolation | **8.5** | Real, testado em código mas sem teste automatizado |
| Observabilidade | **5.0** | Logs por função, sem alerta, sem correlação, sem retenção |
| UX técnica | **7.5** | Loading consistente, sem offline, flicker em refetch |
| Edge functions | **6.0** | 15 funções, lógica replicada |
| Manutenibilidade | **6.5** | TS strict, 12 arquivos gigantes |
| Escalabilidade | **6.0** | Aguenta hoje; degrada com 5× tráfego |
| **Geral** | **7.4 / 10** | Produto correto, plataforma ainda não. |

---

## 15. Roadmap técnico recomendado (impacto × esforço)

### Sprint A (1-2 semanas, alto ROI)
1. Inlinear policies tenant — eliminar helper recursivo.
2. Drop `idx_*_company*` ociosos + recriar com forma que o planner use (`(user_id, company_id, updated_at DESC)`).
3. Adicionar Sentry/analytics de erro no client.
4. Code-split por módulo grande (`React.lazy` em rotas).

### Sprint B (2-3 semanas)
5. Refatorar `InvestmentModule.tsx` em subdiretório.
6. Extrair `_shared/aiCall.ts` + migrar 2 edges piloto.
7. Implementar `multitenant.invariants.test.ts` (Vitest + supabase-js).

### Sprint C (3-4 semanas, prep M4)
8. Particionar `analytics_events` por mês.
9. Tabela `rate_limits` central + util compartilhado.
10. Adicionar FKs com `ON DELETE` em tabelas operacionais.
11. `NOT NULL` em `company_id` + remover safety net das policies.

### Sprint D (M4 readiness)
12. Reorganizar `components/modules/` em `features/{venda,carteira,investimento,...}/`.
13. Manager view + switcher tenant — só agora.

---

## 16. Conclusão honesta

A migração multi-tenant foi executada com disciplina rara. Mas a base de código carrega **três pecados originais** que vão multiplicar:

1. **God modules** (`InvestmentModule`, `ProposalPdfModule`).
2. **RLS helpers que não inlineiam** (já visível em `pg_stat_user_indexes`).
3. **Edge functions que reproduzem o mesmo padrão de IA cinco vezes**.

Se entrar em M4 sem atacar esses três, M5 será reescrita.  
Se atacar nas Sprints A–B antes de M4, o produto vira plataforma de verdade.

**Veredito:** sólido, não excelente. 7.4/10. O caminho para 9 é conhecido e cabe em 6-8 semanas.
