# Auditoria Profunda — Módulo Admin

**Data:** 2026-05-12
**Tipo:** Auditoria (sem alterações de código)
**Escopo:** 10 abas + hooks + serviços (~5.025 linhas)
**Score final:** **6.8 / 10** — robusto em segurança e governança, com inconsistências mensuráveis em métricas, redundância visível entre cards e gargalos de I/O em escala.

---

## 1. Mapa do Admin

| Aba | Componente | Linhas | Fonte primária | Função |
|---|---|---|---|---|
| Dashboard | `AdminDashboard.tsx` | 315 | `useAdminUsers` + `useAccessLogs(30)` | KPIs gerais + 3 charts + listas |
| Usuários | `AdminUsers.tsx` (+ subpasta) | 449 + 1.001 | `useAdminUsers` / `useAdminUsersPage` + `useUserEngagementMetrics` | CRUD + ranking de engajamento |
| Feedbacks | `AdminFeedbacks.tsx` | 185 | `useAdminFeedbacks` | Triagem + resposta |
| Analytics | `AdminAnalytics.tsx` | 429 | `useAdminAnalytics` | Funil comercial + insights |
| Uso de IA | `AdminAIUsage.tsx` | 331 | `analytics_events.event_name='ai_call'` | Volume de chamadas |
| Performance IA | `AdminAIPerformance.tsx` | 523 | `ai_ttft / ai_total_time / ai_abandon` | TTFT, p95, abandono |
| Logs | `AdminLogs.tsx` | 77 | `admin_logs` (tabela) | 5 ações administrativas |
| Auditoria | `AdminAuditLogs.tsx` | 139 | `audit_logs` (tabela) | 11 ações operacionais |
| Saúde | `SystemValidationLogViewer.tsx` | 179 | `localStorage` | Falhas do `validateSystem()` |
| Estatísticas | `AdminStats.tsx` | 142 | `useAdminUsers` + `useAccessLogs(30)` | KPIs + 3 charts (duplica Dashboard) |
| Governança | `AdminGovernance.tsx` | 172 | Static registry | Documentação institucional |

**Total efetivo:** 11 abas (Dashboard + Stats são quase idênticos).

---

## 2. Achados críticos

### 2.1 Inconsistências de métricas e fórmulas

| # | Lugar | Problema | Severidade |
|---|---|---|---|
| C1 | `AdminDashboard` KPI "Sessões iniciadas (30d)" | Limite hard-coded `range(0, 5000)` em `useAccessLogs`. Acima disso o número é silenciosamente truncado. Não há sinal visual. | **Alta** |
| C2 | `useUserEngagementMetrics` | `range(0, 30000)` em `analytics_events` + `range(0, 5000)` em `proposals`. Em base com 200+ usuários ativos a janela 90d satura e o ranking fica enviesado. | **Alta** |
| C3 | `AdminAIUsage` | Lê `event_name='ai_call'` apenas. `AdminAIPerformance` lê `ai_ttft / ai_total_time / ai_abandon`. Se uma edge emite um e não o outro, os totais divergem entre as duas abas — **e divergem hoje** (ai_call não é universal). | **Alta** |
| C4 | `AdminDashboard` "Usuários ativos (uso real) 7d" (card + chart) | Duas representações do mesmo número, calculadas em pontos diferentes do código. Risco de drift se um for atualizado e o outro não. | Média |
| C5 | `AdminDashboard.recencyBonus` | Variável chamada `hoursAgo` mas dividida por `ONE_DAY` — está em **dias**. Funciona mas é armadilha de manutenção. | Baixa (cosmético) |
| C6 | `AdminAnalytics.generateInsights` | Sem cap. Em funil saudável gera 4–6 cards de insight + 2 cards de "Ação recomendada" — pode falar do mesmo gargalo duas vezes. | Média |
| C7 | `AdminStats.maxDaily` | `Math.max(...arr)` sem proteção contra NaN, mas com fallback `1`. OK. **Mas** o gráfico inteiro duplica `loginsByDay` do Dashboard com período diferente (14d vs 7d) sem aviso. | Média |
| C8 | `AdminAIUsage.byUser` | Mapeia user_id → nome via `profiles`, mas **profiles é cross-tenant** para admin. Em multi-tenant real, mistura usuários de tenants diferentes sem rótulo. | Média |
| C9 | `processAnalyticsEvents` | `range(0, 30000)` em `fetchAnalyticsEvents`. Para 90d em produção ativa, satura. Funil torna-se sub-amostrado. | Média |
| C10 | `AdminDashboard.moduleUsage` | Conta `module_access` cumulativo, sem distinct por usuário. Um usuário que visita 50× o Simulador pesa 50, distorcendo "Uso por Módulo". | Média |

### 2.2 Redundâncias

| # | Onde | O que repete |
|---|---|---|
| R1 | Dashboard ↔ Estatísticas | KPIs (Total/Ativos/Bloqueados/Admins) + chart de logins diários + ranking de usuários ativos. **AdminStats é virtualmente subset do Dashboard.** |
| R2 | Logs ↔ Auditoria | Duas abas com semântica próxima. `admin_logs` cobre só ações de admin sobre usuários; `audit_logs` cobre ações operacionais. UX confunde — usuários abrem ambas para procurar a mesma coisa. |
| R3 | AdminAnalytics: bar chart + tabela de eventos granulares | Mesmo dataset renderizado duas vezes. |
| R4 | AdminAnalytics: "Insights Automáticos" + "Ação Recomendada" | Ambos partem do mesmo `bottleneck`; mensagens podem se repetir. |
| R5 | AdminDashboard: card "Usuários ativos 7d" gigante + LineChart "Usuários ativos por dia 7d" | Mesmo número (último ponto da série). |
| R6 | Badges no menu lateral (`AdminPage`) | `dashboard` e `users` recebem o mesmo `newUsersCount`. Soma visualmente o mesmo dado em dois itens. |

### 2.3 Cards/KPIs de baixo valor decisório

| Card | Crítica |
|---|---|
| AIUsage: "Funções utilizadas" | Sempre 3–5. Não orienta decisão. |
| AIUsage: "Usuários ativos em IA" | Repete info disponível na tabela "Por usuário". |
| Dashboard: "Sessões iniciadas (30d)" | Login não é proxy de uso (memória "Operational Data Isolation" reconhece). Mantém-se mas com peso visual igual aos KPIs reais. |
| Stats: "Bloqueados" | Sempre baixo (≤5%); KPI ocupa espaço sem trazer ação. |
| AIPerformance: 3 badges no header (crítico/atenção/ok) | Soma 100% dos edges; informação redundante com a lista logo abaixo. |

### 2.4 Gargalos de UX executiva

- **Dashboard tem 9 blocos verticais** (notification + 6 KPIs + 3 charts + card grande + 2 listas). Ler em <10s é impossível.
- **Analytics tem 8 blocos** com 3 níveis de "insight". Carga cognitiva alta.
- **AIPerformance tem 1 banner + 1 disclaimer + 1 cache card + N edge cards** (N=6). Scroll obrigatório para chegar nas piores edges (ainda que estejam ordenadas no topo, header ocupa muito).
- **Falta timestamp "atualizado há X"** em todas as abas. Impossível saber se o número é stale (React Query cache de 1–5 min).

### 2.5 Performance / I/O

| # | Hook | Problema |
|---|---|---|
| P1 | `useAccessLogs(30)` | 5.000 rows. Carregado por Dashboard, Stats, AdminPage (badge). React Query dedupe ajuda, mas `staleTime: 5 min` pode mostrar dado velho sem aviso. |
| P2 | `useUserEngagementMetrics` | 30.000 events + 5.000 proposals em **memória cliente**. JS heap notável em base grande. |
| P3 | `useAdminAnalytics` | 30.000 events. Reprocessa client-side a cada mudança de filtro. |
| P4 | `AdminAnalytics.userFilter` Select | Renderiza `<SelectItem>` para **todos os usuários** sem virtualização. 500 usuários = 500 nodes. |
| P5 | `AdminUsers` heavy mode | Documenta-se ("modo análise completo carrega base inteira") mas é o **default** (`sortBy: 'priority-desc'`). Light mode só ativa se admin clicar em ordenar por nome/email/data. |

### 2.6 Multi-tenant (CRÍTICO)

A memória `Operational Data Isolation` é clara: **admin é tratado como usuário comum em proposals/post_sale_*; só `analytics_events`, `profiles` e `feedbacks` têm acesso global**.

**Resultado prático:**
- Dashboard, Stats, Analytics, AIUsage, AIPerformance leem `analytics_events` cross-tenant. ✅ correto pelo design.
- Tabelas operacionais (proposals, post_sale_clients) **não aparecem em nenhuma aba do Admin**. ✅ correto.
- **MAS:** as métricas que dependem de `proposals.count` em `useUserEngagementMetrics` usam `supabase.from('proposals').select(...)` — RLS retorna **apenas as do próprio admin**. Se o admin tem 0 propostas, todos os usuários aparecem com `proposals: 0` no engajamento. **Bug funcional confirmado por leitura.** Severidade: **Alta**.

### 2.7 Governança (área nova)

- ✅ Conteúdo modular tipado (10 seções, 11 audit-links).
- ✅ Apenas admin (herdado de `AdminRoute`).
- ⚠️ Status manual (já documentado como roadmap).
- ⚠️ Sem permalink (`?section=architecture`).
- ⚠️ Changelog manual; pode dessincronizar do roadmap real.

---

## 3. Quick wins (≤ 30 min cada)

| # | Ação | Impacto | Risco |
|---|---|---|---|
| Q1 | **Remover ou ocultar AdminStats** (mover apenas o "Acessos por Dia 14d" para um `<details>` no Dashboard) | -1 aba, -142 LoC | Baixo |
| Q2 | **Substituir KPI "Sessões iniciadas (30d)" por consulta `count` head-only** (RPC ou `count: 'exact', head: true`) | Métrica passa a ser exata mesmo acima de 5k | Baixo |
| Q3 | **Cap de insights**: máximo 3 cards no `generateInsights` (priorizar warnings) | Reduz ruído | Nenhum |
| Q4 | **Mesclar Logs + Auditoria em uma única aba "Auditoria"** com tab interna `Sistema | Operacional` | -1 item de menu, hierarquia mais clara | Baixo |
| Q5 | **Remover bar chart de eventos granulares no Analytics** (manter só tabela) | Menos altura, mesmo valor | Nenhum |
| Q6 | **Remover card "Usuários ativos 7d" gigante** (já está no LineChart) | Reduz redundância | Nenhum |
| Q7 | **Corrigir nome `hoursAgo` → `daysAgo`** em `useUserEngagementMetrics` | Manutenibilidade | Nenhum |
| Q8 | **Adicionar timestamp "Atualizado HH:MM" + botão "Atualizar"** no header do Dashboard, Analytics, AIPerformance | Confiança operacional | Nenhum |
| Q9 | **Virtualizar Select de usuários no Analytics** (`Combobox` com search) ou paginar | Performance em 500+ users | Baixo |
| Q10 | **Distinct user por dia em `moduleUsage`** | Métrica para de inflar com power users | Médio (muda número exibido) |

---

## 4. Melhorias prioritárias (impacto alto, > 30 min)

### M1 — Corrigir engajamento de propostas (CRÍTICO)
`useUserEngagementMetrics` lê `from('proposals')` que respeita RLS — admin só vê **as próprias** propostas. Resultado: ranking de engajamento mostra `proposals: 0` para 100% dos usuários, exceto o próprio admin.

**Solução:** criar RPC `get_user_proposal_counts(window_days)` `SECURITY DEFINER` que retorna `(user_id, count)` para todos os usuários (admin-only via `has_role` check).

### M2 — Unificar fonte de truth de IA
Decidir: `ai_call` OU os 4 eventos `ai_*`. Idealmente disparar `ai_call` automaticamente sempre que qualquer edge IA é invocada (instrumentação shared). Hoje há drift mensurável entre AIUsage e AIPerformance.

### M3 — Server-side aggregation
Substituir `range(0, 30000)` por RPCs agregadores:
- `get_admin_daily_logins(days)` → `(date, count)`
- `get_admin_active_users(days)` → `(date, count)`
- `get_admin_module_usage(days)` → `(module, distinct_users, total)`
- `get_admin_funnel(days)` → `(step, count)`

Ganho: removes 30k rows from heap, métricas exatas, mantém ≤5 queries small.

### M4 — Tenant scoping no Admin
Adicionar Select `Tenant: [Todos | Workspace X | ...]` no header global do Admin. Aplicar filtro client-side a todas as métricas. Em projetos com 1 tenant é no-op; em multi-tenant evita confusão.

### M5 — Reorganização do menu (consolidação)
Hoje: Dashboard / Usuários / Feedbacks / Analytics / Uso de IA / Performance IA / Logs / Auditoria / Saúde / Estatísticas / Governança = **11 itens.**

Proposta: **7 itens** agrupados.
```
Visão geral     (Dashboard único + saúde inline)
Usuários
Feedbacks
Analytics       (Funil + uso de IA em sub-tabs)
Performance IA
Auditoria       (Sistema + Operacional em sub-tabs)
Governança
```

---

## 5. Before / After conceitual

**Antes**
- 11 abas, 2 quase duplicadas (Dashboard/Stats, Logs/Auditoria)
- KPIs com risco de truncamento silencioso (5k/30k)
- "proposals: 0" para todos por bug de RLS
- Carga cognitiva alta no Dashboard (9 blocos)
- Sem timestamp de freshness
- 6 chips de status visíveis + duplicação visual

**Depois (aplicando M1–M5 + Quick Wins)**
- 7 abas com hierarquia clara
- Métricas server-side, exatas, com timestamp
- Engajamento de propostas correto via RPC
- Dashboard executivo escaneável em 5s (4 KPIs + 2 charts + saúde inline)
- Insights capados a 3 mensagens prioritárias
- Tenant scoping explícito

---

## 6. Riscos restantes (após quick wins)

1. **Drift entre `analytics_events` e tabelas operacionais**: contagem de "propostas geradas" via evento ≠ via `proposals` table. Documentar canonical source.
2. **Cache stale de React Query**: 5 min para dados que mudam por minuto. Considerar `refetchInterval` no Dashboard.
3. **Localstorage como fonte de saúde** (`SystemValidationLogViewer`): isolado por máquina/usuário; um admin não vê falhas do outro. Migrar para tabela `system_health_events` em Onda futura.
4. **Recharts pesado** em mobile: pode considerar `react-window` para listas longas.
5. **`AdminPage.tsx` validationFailuresCount**: lido **uma única vez no mount** (sem dep no useMemo). Não atualiza durante a sessão. Bug menor.

---

## 7. Score detalhado

| Dimensão | Score |
|---|---|
| Segurança (RLS, roles, has_role) | 9.5 / 10 |
| Governança (auditoria, changelog, área nova) | 8.5 / 10 |
| Consistência de fórmulas | 5.5 / 10 |
| Confiabilidade de números (cap, drift) | 5.0 / 10 |
| UX executiva (carga cognitiva, escaneabilidade) | 6.0 / 10 |
| Performance (I/O, heap, queries) | 6.5 / 10 |
| Multi-tenant correto no Admin | 7.0 / 10 |
| Redundância de cards | 6.0 / 10 |
| **Geral** | **6.8 / 10** |

Aplicando Quick Wins + M1: **8.0 / 10**.
Aplicando M1–M5 completo: **9.0 / 10**.

---

## 8. Conclusão

O Admin é **funcional e seguro**, mas hoje carrega cicatrizes de evolução incremental: cards duplicados, KPIs com truncamento silencioso, dois eventos diferentes para "uso de IA", e um bug funcional em engajamento de propostas (RLS). Os ajustes propostos não exigem refatoração estrutural — são consolidações cirúrgicas que restauram a percepção de **painel executivo confiável**, sem inflar nem inventar funcionalidades novas.

A área **Governança** entregue na onda anterior é o primeiro bloco que já nasce maduro; serve de referência estética e conceitual para o restante do Admin.
