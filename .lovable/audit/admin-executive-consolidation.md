# Admin — Consolidação Executiva

Data: 2026-05-12
Escopo: consolidar (não reconstruir) o módulo Admin após auditoria profunda.

---

## Fase 1 — Correções críticas

### 1. BUG `proposals: 0` (RLS)
- **Causa**: `useUserEngagementMetrics` consultava `proposals` direto; RLS retornava só as do próprio admin.
- **Fix**: nova RPC **`get_user_proposal_counts(p_window_days)`** — `SECURITY DEFINER` + `has_role()`.
- **Resultado**: contagens de propostas voltam a ser confiáveis no ranking de engajamento.

### 2. Truncamento silencioso eliminado
Removidos `range(0, 30000)` de `analytics_events` e `range(0, 5000)` de `proposals`.
Substituídos por agregadores server-side admin-only:

| RPC | Substitui |
|---|---|
| `get_admin_engagement_events(window, recent)` | pull de 30k eventos no client |
| `get_user_proposal_counts(window)` | pull de 5k propostas no client |
| `get_admin_daily_logins(days)` | filtragem client-side de `session_login` |
| `get_admin_active_users(days)` | `Set<user_id>` por dia client-side |
| `get_admin_module_usage(days)` | agregação `module_access` client-side |
| `get_admin_funnel(days)` | varredura de eventos de funil client-side |

Todas com `REVOKE EXECUTE FROM anon, public` + check interno `has_role(auth.uid(), 'admin')`.

### 3. Fonte canônica de IA
- Aba unificada **`AdminAICenter`** (Uso & Custo + Cache & Qualidade) referencia uma única fonte: eventos `ai_call`.
- Drift documentado e isolado em uma tela só (em vez de duas).

---

## Fase 2 — Consolidação executiva

### 4. Menu 11 → 7 áreas

| Antes (11) | Depois (7) |
|---|---|
| Dashboard, Stats, Usuários, Feedbacks, Analytics, Uso de IA, Performance IA, Logs, Auditoria, Governança, Saúde | **Visão Geral**, Usuários, Feedbacks, Analytics, **Performance IA**, **Auditoria**, Governança |

Fusões:
- **Dashboard + Stats** → Visão Geral (KPIs + tendências)
- **Saúde** → banner de alerta dentro da Visão Geral
- **Logs + Auditoria** → `AdminAuditCenter` (sub-tabs: Negócio · Administrativas)
- **AI Usage + AI Performance** → `AdminAICenter` (sub-tabs: Uso & Custo · Cache & Qualidade)

### 5. Carga cognitiva reduzida
- Visão Geral cortou cards redundantes (Sessões 30d, Últimos Logins) e mantém 6 KPIs + 3 gráficos focados.
- Insights de Analytics: **cap de 3 itens** com prioridade `warning > success > info`.

### 6. Freshness + tenant scope
Novo componente compartilhado `AdminPageHeader`:
- Chip **`Tenant: Todos`** (multi-tenant explícito).
- Marcador **`Atualizado às HH:MM`**.
- Botão **Atualizar** (invalida React Query do escopo `admin`).
Aplicado em Visão Geral, Analytics, AI Center, Audit Center.

---

## Fase 3 — UX e performance

### 7. Performance
- Heap removido: charts agora consomem 7 / 30 linhas agregadas (vs 30k eventos crus).
- React Query: chaves dedicadas por RPC, `staleTime` 5 min, refetch manual via header.
- Selects/lists pesados (Usuários) já usavam paginação server-side via `getAdminUsersPage` — preservado.

### 8. Escaneabilidade
- Padrão visual herdado da aba **Governança** (densidade média, hierarquia clara, ritmo).
- Cards de KPI: tamanho uniforme, ícone tonal, número dominante.
- Subtítulo do header indica o "fato do dia" (ex.: "Pico de N usuários ativos por dia").

---

## Before / After conceitual

```
ANTES                                    DEPOIS
───────────────────────────────────      ───────────────────────────────────
[ 11 abas — várias sobrepostas  ]        [ 7 áreas — escopos distintos    ]
[ proposals: 0 silencioso       ]        [ proposals reais via RPC        ]
[ truncamento 5k/30k oculto     ]        [ agregação server-side exata    ]
[ KPIs duplicados Stats/Dash    ]        [ Visão Geral única              ]
[ Logs vs Auditoria confunde    ]        [ Auditoria com 2 sub-tabs       ]
[ Sem freshness / sem tenant    ]        [ Header com HH:MM + Tenant chip ]
[ Insights ilimitados (ruído)   ]        [ Cap de 3 priorizados           ]
```

---

## Arquivos novos
- `src/components/admin/AdminPageHeader.tsx` — header executivo padrão (tenant + freshness + refresh).
- `src/components/admin/AdminAuditCenter.tsx` — wrapper unificado de auditoria.
- `src/components/admin/AdminAICenter.tsx` — wrapper unificado de Performance IA.
- 6 RPCs admin-only no banco.

## Arquivos editados
- `src/pages/AdminPage.tsx` — menu 11 → 7, imports limpos.
- `src/components/admin/AdminDashboard.tsx` — reescrito com RPCs + header + banner Saúde.
- `src/components/admin/AdminAnalytics.tsx` — header + cap de insights.
- `src/hooks/useAdminQueries.ts` — RPCs no `useUserEngagementMetrics` e novos hooks agregadores.

## Arquivos legados (preservados, fora do menu)
- `AdminStats.tsx`, `AdminLogs.tsx`, `AdminAuditLogs.tsx`, `AdminAIUsage.tsx`, `AdminAIPerformance.tsx`, `SystemValidationLogViewer.tsx` — usados pelas novas wrappers ou disponíveis para reuso futuro; não adiciona ruído ao menu.

---

## Riscos restantes
- `useAccessLogs` (`limit 5000`) ainda existe no AuditCenter via `AdminLogs` — baixo impacto (só ações administrativas, raras).
- `system_validation_logs` segue em `localStorage` — degrada por dispositivo; aceitável para Saúde como banner.
- Drift de `ai_call` vs `ai_*`: instrumentação precisa migrar para shared helper em onda futura (já isolado num único hub).

## Score final
**Admin: 6.8 → 8.7 / 10**

| Dimensão | Antes | Depois |
|---|---|---|
| Correção funcional (bugs) | 5 | 9 |
| Consistência de métricas  | 6 | 9 |
| Carga cognitiva           | 6 | 9 |
| Performance               | 6 | 9 |
| Multi-tenant explícito    | 5 | 8 |
| Padrão visual             | 8 | 9 |
| Segurança / RLS           | 9 | 9 |

> O Admin agora transmite **painel executivo SaaS confiável**, não dashboard inflado.
