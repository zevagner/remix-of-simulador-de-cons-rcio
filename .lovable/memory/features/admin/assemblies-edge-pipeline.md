---
name: Assemblies Edge Pipeline
description: Pipeline server-side institucional de ingestão de assembleias com preview/commit/rollback, snapshot, diff e anti-drift z-score
type: feature
---

Edge function `assemblies-import` é o ponto de entrada canônico server-side para ingestão administrativa de assembleias. Modos: `preview` (diff + drift, sem mutação), `commit` (snapshot+upsert+pruning, registra em `assembly_imports`), `rollback` (restaura snapshot, marca `status='rolled_back'`).

**Tabela canônica:** `assembly_imports` armazena `diff_summary`, `drift_warnings`, `snapshot` (estado anterior dos meses afetados), `status`. RLS admin-only.

**Anti-drift determinístico:** z-score em `avg_bid_3_months` (z>3 ∧ Δ>5pp ⇒ severe; z>2 ∧ Δ>3pp ⇒ warn), MoM participantes (>50% ⇒ warn), sanidade min>max ⇒ severe. Severo bloqueia commit a menos que `acknowledgedDriftWarnings=true`.

**Cliente:** `src/services/assembliesImport.ts` expõe `previewImport`/`commitImport`/`rollbackImport`/`fetchImportHistory`. UI de histórico em `AdminAssembliesImportHistory` (lazy no Admin).

**Auditoria:** `edge_import_assemblies_commit` e `edge_rollback_assemblies_import` em `audit_logs`.

**Pendências (não regressão):** cutover dos botões Excel/colar do `AdminAssembliesIngestion` para usar `previewImport`+`commitImport` ainda usa caminho legacy client-side; parser xlsx ainda no browser.
