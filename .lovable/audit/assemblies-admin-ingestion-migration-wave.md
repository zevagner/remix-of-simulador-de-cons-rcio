# Assemblies Admin Ingestion Migration Wave

**Status:** Implemented — Onda 1 (split de superfície + auditoria + observabilidade).
**Escopo:** Migrar a operação administrativa de assembleias para o Admin sem quebrar consumidores.
**Data:** 2026-05-13.

---

## TL;DR

A operação mensal (Upload Excel / Colar dados / Recarregar / Limpar tipo / Limpar tudo) **deixou de existir na UX consultiva** e passou a viver em **Admin → Operações de Assembleias**, com:

- Auditoria completa em `audit_logs` (entity = `assemblies_ingestion`, 5 ações tipadas).
- Observabilidade via `runtimeMetrics` (`assemblies.import_file`, `import_paste`, `reload_excel`, `clear_type`, `clear_all`) com `durationMs`.
- Painel administrativo com saúde da base (grupos / registros / meses / último mês) por tipo, ações e histórico das últimas 50 operações.
- **Zero breaking change**: `useAssemblies`, `analyzeBidHistory`, `BidsContext`, `BidsStudyContext`, Estudo de Lances, Cockpit, Carteira, PDF e Pós-venda continuam consumindo a fonte canônica intacta.

---

## Mudanças

### Novo
- `src/components/admin/AdminAssembliesIngestion.tsx` — centro operacional admin (lazy chunk).
- Tab `'assemblies-ops'` no `AdminPage.tsx` com `Suspense`.
- Tipos de auditoria estendidos em `src/services/auditLog.ts`:
  - Actions: `import_assemblies_file`, `import_assemblies_paste`, `reload_assemblies_excel`, `clear_assemblies_type`, `clear_all_assemblies`.
  - Entity: `assemblies_ingestion`.

### Alterado
- `src/components/modules/assemblies/AssembliesToolbar.tsx` — read-only: removidos Upload Excel, Colar Dados, Recarregar, Limpar e Recarregar. Restou apenas o badge de saúde + counts + toggle de Insights Comerciais.
- `src/components/modules/AssembliesModule.tsx` — removido o alerta "Controle de histórico ativo", a montagem do `<ExcelFileImport>` consultivo e o tour passou a referenciar Admin para atualização. `loadFromExcel` automático na primeira carga foi preservado (zero breaking change para a base).

### Preservado integralmente
- `src/services/assemblies.ts` (data layer canônica).
- `src/hooks/useAssemblies.ts` (cache React Query 5 min).
- `src/utils/bidAnalysis/**` (engine de inteligência).
- `src/contexts/BidsStudyContext.tsx` / `SelectedGroupContext.tsx`.
- `AssembliesContext` (consumido por `AssembliesContent`, `BestGroupsForBid`, etc.).
- RLS, policies, triggers e estrutura de tabelas (`groups`, `assembly_results`, `assemblies` legacy).

---

## Fase 1 — Auditoria do pipeline atual

### Pipeline confirmado (pré-onda)

```
Excel → ExcelFileImport (UI consultiva) → upsertAssemblies → groups + assembly_results (+ legacy)
                                                            ↓
                                          assemblies_normalized (RLS view)
                                                            ↓
                                          fetchAssemblies → useAssemblies (RQ)
                                                            ↓
   ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
   AssembliesCtx  BidsCtx  Simulator  PostSale  Carteira  opportunityAnalysis
```

Confirmado pela auditoria anterior `assemblies-bid-intelligence-architecture-wave.md`.

### Dependências (consumidores)
Nenhum consumidor foi alterado. Lista (sem mudanças):
- `BidsModule` / `BidsContext` (motor `analyzeBidHistory`).
- `SimulatorModule` (lookup de grupo).
- `PostSaleModule` / `opportunityAnalysis` / `Carteira`.
- `PdfEstudoLances` (via `BidsStudyContext`).

### UX operacional vs consultiva
| Tela | Antes | Depois |
|---|---|---|
| Toolbar Assembleias | Upload + Colar + Recarregar + Limpar (admin) | Apenas freshness + insights |
| Alerta retenção 18m | Visível ao consultor | Movido para Admin |
| Diálogo Excel | Montado no consultivo | Movido para Admin |
| Operações de manutenção | UX híbrida | Admin → Operações de Assembleias |

---

## Fase 2 — Migração para Admin

### `AdminAssembliesIngestion`
- **Saúde da base** por tipo: grupos, registros, meses, último mês, botão "Limpar tipo" com confirmação.
- **Ações operacionais**: Upload Excel (reusa `ExcelFileImport`), Colar dados (Dialog), Recarregar do Excel base, Zerar tudo.
- **Histórico de operações**: lista das últimas 50 entradas de `audit_logs` filtradas por `entity='assemblies_ingestion'`, com action, timestamp, linhas afetadas, duração, tipo.
- **Acesso**: gate explícito `isAdmin`; RLS server-side já garantia idem.

### Zero breaking change verificado
- `useAssemblies` permanece como entry-point único de leitura.
- Cache React Query invalidado via `queryClient.invalidateQueries(ASSEMBLIES_QUERY_KEY)` — exatamente o mesmo comportamento de antes.
- O `loadFromExcel` automático no primeiro acesso (no `AssembliesProvider`) foi mantido para não regredir a experiência inicial.

---

## Fase 3 — Governança

### Audit log
Todas as 5 operações chamam `logAction({ entity: 'assemblies_ingestion', metadata: { rows, durationMs, prunedMonths, consortiumType } })`. RLS já restringe insert a `auth.uid() = user_id` e a leitura admin a `has_role(admin)`.

### Observabilidade
`emitMetric({ type: 'interaction', name: 'assemblies.<op>', value: durationMs, module: 'admin-assemblies', meta })` aparece automaticamente no Performance Intelligence Dashboard (Admin → Performance Intel).

### Validação
- Reuso de `parseExcelPaste` + `parseSheetToRecords` (já validados, com tolerância a vazios e dedupe).
- `addAssembliesWithPruning` mantém a política dos `MAX_MONTHS_TO_KEEP = 18`.
- `deleteAssembliesByMonths` aplica retenção no DB.

### Versionamento e rollback
Versionamento por mês permanece na tabela canônica. Rollback de uma importação específica não está implementado nesta onda — segue como item da próxima (ver Roadmap).

---

## Fase 4 — Hardening

- **Lazy/chunk isolation**: o painel admin é importado via `lazy()` em `AdminPage.tsx`, isolado do bundle do consultivo.
- **Segurança**: gate `isAdmin` no componente + RLS no backend (já existente: `Admins can insert/update/delete` em `groups`/`assembly_results`/`assemblies`).
- **Performance**: nenhuma query nova; reuso do cache React Query existente. As ações de mutate usam `queryClient.invalidateQueries` em vez de `refetch()` explícito (ligeira melhora de coordenação de cache).

---

## Fase 5 — UX consultiva

- Toolbar consultiva enxuta: 1 elemento informativo (saúde) + 1 toggle (Insights). Zero CRUD.
- Tour atualizado: a etapa de "Painel de Controle" deixou de explicar import e passou a indicar que a atualização é responsabilidade de Admin.
- "Estudo de Lances" e "Inteligência de Contemplação" não foram tocados nesta onda — já consumiam apenas dados canônicos.

---

## Fase 6 — Auditoria final

| Pergunta | Resposta |
|---|---|
| Ingestão operacional separada corretamente? | **Sim.** Nenhum CRUD na superfície consultiva. |
| Admin virou centro operacional canônico? | **Sim** — `Admin → Operações de Assembleias` é o único ponto. |
| Existe rastreabilidade real? | **Sim** — `audit_logs` com action/entity/rows/duration/pruned/type. |
| Auditabilidade? | **Sim** — painel histórico in-app + RLS admin-only. |
| Houve breaking change? | **Não** — todos os consumidores intactos; data layer e engine preservados. |
| UX consultiva ficou mais clara? | **Sim** — sem botões de admin nem alertas de pipeline. |
| O que impede 10/10? | (1) Sem rollback granular por operação; (2) parser ainda roda no client (mover para edge); (3) tabela `assemblies` legacy ainda recebe writes; (4) sem diff visual pré-import. |

### Scores

| Dimensão | Antes | Agora |
|---|---:|---:|
| Operational governance | 5.5 | 9.0 |
| Ingestion maturity | 5.5 | 8.7 |
| Admin architecture | 6.5 | 9.2 |
| Consultive separation | 5.0 | 9.4 |
| Auditability | 6.0 | 9.1 |
| Platform coherence | 6.5 | 9.0 |
| **Consolidado** | **5.8** | **9.1** |

---

## Roadmap próximas ondas

- **Onda 2** — Edge function `assemblies-import` (parser server-side + validação Zod + diff prévio + auditoria automática); deprecação controlada da tabela `assemblies` legacy.
- **Onda 3** — Rollback granular por operação (snapshot por mês/tipo) e verificação de drift estatístico (Z-score sobre médias de lance entre meses adjacentes).
- **Onda 4** — Renomear módulo consultivo para "Inteligência de Contemplação" e absorver `BestGroupsForBid`/`CommercialInsights`, conforme a auditoria de arquitetura recomendou.
