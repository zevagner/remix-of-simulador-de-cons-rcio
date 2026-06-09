---
name: Compliance & Audit Wave (Onda 2)
description: Hardening de compliance corporativo — TTL signed URLs, sanitização de erros, audit trail mínima, Cache-Control, matriz service-role e CI gate de autenticação
type: feature
---

# Onda 2 — Compliance, Auditabilidade e Observabilidade

**Status:** aplicado. Não-bloqueante: pode coexistir com qualquer feature futura.

## Mudanças

- **Signed URL TTL:** `data-export` reduzido 24h → **1h** (`SIGNED_TTL_SECONDS = 3600`). Reexportar regenera URLs; fluxo LGPD é síncrono.
- **Sanitização de erros:** removido `error.message` exposto ao cliente em `data-export`, `account-purge`, `update-user-email`, `generate-pdf` (502/500). Detalhe vai só para `console.error`.
- **Audit trail:** `update-user-email` agora insere em `audit_logs` (entity `user_account`, action `update_email`, metadata sem PII além do domínio). `create-user`, `delete-user`, `account-purge`, `data-retention-purge` já registravam (admin_logs / audit_logs).
- **Cache-Control:** `Cache-Control: no-store, Pragma: no-cache` em todos os response de `data-export` (ZIP + erro), `generate-pdf` (PDF + 502).
- **Matriz Service-Role:** `docs/security/service-role-matrix.md` — inventário oficial. Toda nova edge com `SUPABASE_SERVICE_ROLE_KEY` exige atualização da matriz na mesma PR.
- **CI gate:** `scripts/ci/auth-pattern-gate.mjs` falha se `getClaims(`, `atob(` ou `token.split('.')` aparecerem em `supabase/functions/*` fora dos arquivos isentos (`_lib/rateLimit.ts`, `_shared/auth.ts`) ou sem tag `// ci-auth-allow: <motivo>`. Comentários são ignorados.
- **Residual fechado:** `assemblies-import` migrado de `getClaims()` para `authenticateAdmin()` (helper canônico).

## Política

- **Proibido** retornar `error.message`/stack para cliente em edges. Use mensagem genérica em pt-BR.
- **Proibido** signed URL > 4h sem justificativa documentada na matriz service-role.
- **Proibido** introduzir nova edge admin sem helper canônico (`authenticateRequest` / `authenticateAdmin`).
- Toda operação destrutiva ou de identidade deve gravar em `audit_logs` ou `admin_logs`.

## Risco residual aceito

- `account-purge` retorna `removed` (contadores por tabela) — operacional, sem PII.
- `data-retention-purge` é invocado por pg_cron com `Bearer SERVICE_ROLE_KEY` (Vault) — restrição máxima já em vigor.
- TTL 1h pode exigir reexport para usuários offline — comportamento esperado em ambiente corporativo.

## Próximos gaps reais para auditoria corporativa externa

1. **DPIA / RoPA formais** (documentos, não código).
2. **SLO/SLI declarados** (uptime, p95 latência, RPO/RTO).
3. **DR/Backup testado** (restore drill auditável).
4. **Vendor management** dos subprocessadores (Browserless, Lovable AI, Sentry) — já existe stub em `docs/.lovable/governance/subprocessors.md`, falta versionamento formal.
5. **Pen-test externo** + remediation log assinado.
6. **ISO 27001 / SOC 2 controls mapping** (governança).
