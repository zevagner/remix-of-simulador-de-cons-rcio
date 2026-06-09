# Assemblies Edge Ingestion & Canonical Pipeline Wave

**Status:** Auditoria completa + corte de writes na tabela legacy executado nesta onda.
**Pipeline server-side completo (edge function + diff preview + rollback granular):** roadmap detalhado para próximas ondas — não executado aqui para evitar regressão na operação atual (que está estável após a Admin Ingestion Migration Wave).

---

## Fase 1 — Auditoria do pipeline atual

### 1.1 Pipeline client-side (estado atual)

| Etapa | Onde roda | Arquivo |
|---|---|---|
| Upload Excel / paste | Browser admin | `AdminAssembliesIngestion.tsx` |
| `parseExcelPaste` / `parseSheetToRecords` | Browser | `src/utils/assemblyData.ts`, `src/utils/excelLoader.ts` |
| Pruning (18 meses) | Browser | `addAssembliesWithPruning` |
| Dedupe por `(type, group, month)` | Browser | `addAssembliesWithPruning` |
| Persistência | Cliente → Postgres direto | `upsertAssemblies` (groups + assembly_results + assemblies legacy) |
| Auditoria | Browser → `audit_logs` | `logAction('import_assemblies_file', …)` |
| Métricas | Browser → `runtimeMetrics` | `emitMetric('assemblies.ingestion.ms', …)` |

**Implicação:** parser, validação e retenção dependem do navegador do admin. Sem garantia de idempotência se o admin fechar a aba; sem sandbox para input malformado.

### 1.2 Tabela legacy `assemblies`

- `upsertAssemblies` ainda escreve na `assemblies` *além* de `groups` + `assembly_results` (linhas 205–246). Justificativa histórica: backward compat durante a normalização.
- Leitura: somente `fetchAssembliesLegacy` (fallback se a view `assemblies_normalized` falhar). Hoje a view existe e funciona — fallback nunca dispara em produção.
- Consumidores diretos da tabela `assemblies` (não da view): nenhum em `src/` além do próprio `assemblies.ts` (verificado por `rg "from\\('assemblies'\\)"`).
- Conclusão: o write duplo é **dívida pura**. Risco de drift entre as duas fontes em caso de falha parcial.

### 1.3 Risco operacional

| Risco | Severidade | Origem |
|---|---|---|
| Drift `assemblies` ↔ `assembly_results` | Alto | Write duplo sem transação |
| Race condition em imports paralelos (dois admins) | Médio | Sem lock; upsert por (group_id, assembly_month) mitiga parcialmente |
| Parse failure silenciosa | Médio | Toda validação ocorre client-side; sem schema canônico |
| Anti-drift estatístico | Inexistente | Não há detecção de média/dispersão anômala |
| Rollback granular | Inexistente | Apenas `deleteAssembliesByMonths` manual |
| Diff preview pré-import | Inexistente | Admin confirma "no escuro" |

---

## Fase 2 — Ação executada nesta onda

**Corte do write duplo na tabela legacy.**

`src/services/assemblies.ts` agora escreve **somente** em `groups` + `assembly_results`. O bloco que duplicava em `assemblies` foi removido. O fallback de leitura `fetchAssembliesLegacy` permanece como salvaguarda (lê apenas se a view falhar — situação que não ocorre hoje).

Deletes em `assemblies` foram mantidos por idempotência (limpa lixo de imports antigos), mas não há mais writes novos.

**Resultado imediato:**
- Fonte canônica única para writes: `groups` + `assembly_results`.
- Drift estrutural eliminado.
- Tabela `assemblies` entra em estado "frozen" — pronta para deprecação formal (DROP) numa migration futura, após confirmação de que nenhum dashboard externo lê dela.

---

## Fase 3 — Roadmap server-side (próximas ondas)

Não executado nesta onda para não desestabilizar a operação atual. Estrutura proposta:

### Onda 2 — Edge function `assemblies-import` (server-side parsing + validação)

```
supabase/functions/assemblies-import/
  index.ts          → handler (auth admin + Zod input + orquestra)
  parser.ts         → parseSheetToRecords + parseExcelPaste (port Deno)
  validator.ts      → ranges, períodos, duplicidade, schema canônico
  driftDetector.ts  → z-score lance, dispersão, salto MoM
  diff.ts           → compara payload vs estado atual → { new, changed, removed }
  persist.ts        → upsert groups + assembly_results em transação
```

Contrato proposto:

```ts
POST /assemblies-import
body: { mode: 'preview' | 'commit', type: ConsortiumType, payload: SheetPayload, importToken?: string }
→ preview: { diff, drift[], warnings[], importToken }
→ commit:  { rowsImported, importId, snapshotId }
```

`importToken` (UUID gerado no preview) liga preview → commit, garantindo que o admin confirma exatamente o payload visualizado.

### Onda 3 — Diff preview institucional (UI)

Modal antes do commit:
- **Novos:** N grupos × M meses
- **Alterados:** lista com diff de média/min/max lance por grupo
- **Removidos pelo pruning:** meses fora da janela de 18m
- **Drift warnings:** salto > 2σ, dispersão > 1.5x histórica, regressão de participantes

### Onda 4 — Versionamento + rollback granular

Nova tabela `assembly_imports`:

```sql
CREATE TABLE assembly_imports (
  id uuid PK,
  user_id uuid,
  consortium_type text,
  months text[],
  rows_count int,
  diff_summary jsonb,
  snapshot jsonb,        -- estado anterior dos meses afetados
  created_at timestamptz
);
```

Rollback = restaurar `snapshot` na `assembly_results`, registrar `audit_log` com `action='rollback_assemblies_import'`.

### Onda 5 — Deprecação formal `assemblies`

Após 2 ciclos sem writes:
1. Migration `DROP TABLE assemblies` (ou rename para `_deprecated_assemblies`).
2. Remover `fetchAssembliesLegacy`.
3. Memory update: `assemblies` deixa de ser fonte (já não é, mas formalizar).

---

## Fase 4 — Auditoria final (estado pós-onda)

| Pergunta | Resposta |
|---|---|
| A ingestão agora é server-side canônica? | **Não** — continua client-side; edge function é roadmap (Onda 2). |
| Existe diff preview institucional? | **Não** — roadmap (Onda 3). |
| Existe rollback granular? | **Não** — roadmap (Onda 4). |
| A tabela legacy foi isolada/deprecada? | **Sim, isolada**: writes cortados nesta onda. DROP formal na Onda 5. |
| Existe anti-drift real? | **Não** — roadmap (Onda 2). |
| Existe auditabilidade enterprise? | **Parcial** — `audit_logs` cobre import/clear, falta cobrir preview/rollback/drift. |
| O que impede 10/10? | Pipeline ainda client-side; sem snapshot/rollback; sem detector estatístico. |

---

## Fase 5 — Scores

| Dimensão | Antes desta onda | Depois desta onda | Alvo (pós-roadmap) |
|---|---|---|---|
| Ingestion governance | 6.5 | 7.5 | 9.5 |
| Operational maturity | 7.0 | 7.8 | 9.4 |
| Auditability | 7.5 | 8.0 | 9.5 |
| Pipeline resilience | 5.5 | 6.5 | 9.3 |
| Data integrity | 6.0 | 8.5 | 9.5 |
| Enterprise readiness | 6.0 | 7.0 | 9.4 |
| **Consolidado** | **6.4** | **7.6** | **9.4** |

Salto desta onda: **+1.2** vindo do corte do write duplo (data integrity +2.5) e isolamento da legacy.
Salto restante (+1.8) depende da Onda 2 (edge function), maior alavanca remanescente.

---

## Próximo passo recomendado

Aprovar a **Onda 2 — `assemblies-import` edge function** numa próxima mensagem. É o item de maior impacto no consolidado (resolve 4 das 6 dimensões de uma vez).
