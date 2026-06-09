# Service Role Matrix — Lovable Cloud Edge Functions

**Última atualização:** Onda 2 (Compliance & Auditabilidade)
**Owner:** Plataforma · Segurança

`SUPABASE_SERVICE_ROLE_KEY` bypassa RLS. Cada uso deve ser justificado, escopado
no servidor (nunca exposto ao cliente) e documentado aqui.

## Regras de governança

1. **Nunca** retornar `SERVICE_ROLE_KEY` para o navegador.
2. **Toda** Edge Function que usa service-role precisa:
   - autenticar o caller via `authenticateRequest()` ou `authenticateAdmin()`
     (helpers em `supabase/functions/_shared/auth.ts`);
   - validar autorização server-side (`has_role`, `is_company_member`, etc.);
   - escopar todas as queries por `user_id` / `company_id` derivados da sessão
     verificada — nunca confiar em IDs vindos do body sem validação.
3. Toda operação destrutiva ou que altera identidade precisa deixar trilha em
   `audit_logs` (ou `admin_logs` para ações administrativas).
4. Adição de novo uso de service-role exige atualização desta matriz na mesma PR.

## Matriz atual

| Função                       | Motivo do service-role                                         | Necessário? | Auditoria                              | Owner            |
| ---------------------------- | -------------------------------------------------------------- | ----------- | -------------------------------------- | ---------------- |
| `account-purge`              | Cascade delete cross-table + `auth.admin.deleteUser`           | Sim         | `audit_logs.action='purged'`           | Plataforma       |
| `data-export`                | Leitura cross-table do próprio titular (LGPD Art. 18)          | Sim         | `audit_logs.action='exported'`         | Plataforma/LGPD  |
| `data-retention-purge`       | TTL housekeeping (PDFs, analytics, audit)                      | Sim         | `audit_logs.entity='retention_job'`    | Plataforma       |
| `create-user`                | `auth.admin.createUser` + update profile + bypass RLS          | Sim         | `admin_logs.action='create_user'`      | Admin            |
| `delete-user`                | Cascade delete + `auth.admin.deleteUser` (admin alvo)          | Sim         | `admin_logs.action='delete_user_complete'` | Admin        |
| `update-user-email`          | `auth.admin.updateUserById` + listUsers                        | Sim         | `audit_logs.action='update_email'`     | Admin            |
| `enforce-single-session`     | Revogação de sessões via admin API                             | Sim         | n/a (operacional)                      | Plataforma       |
| `generate-pdf`               | Não usa service-role (chama Browserless externo)               | Não         | n/a                                    | Plataforma       |
| `share-proposal` (POST)      | Insere registro de share por user autenticado                  | Sim         | `audit_logs` (proposal scope)          | Comercial        |
| `admin-intelligence-report`  | Agregações cross-tenant para admin                             | Sim         | n/a (leitura)                          | Admin            |
| `admin-intelligence-prompts` | Curadoria de prompts globais                                   | Sim         | n/a (config)                           | Admin            |
| IA edges (`sales-*`, `module-copilot`, etc.) | NÃO usam service-role (apenas leitura via JWT)  | Não         | n/a                                    | IA               |

## Risco residual aceito

- `data-retention-purge` exige `Bearer <SERVICE_ROLE_KEY>` no header — invocação
  destrutiva restrita a pg_cron + Vault. Anon key e JWTs de usuário são rejeitados.
- `admin-intelligence-*` apenas leitura: ausência de trilha aceitável (acesso é
  consequência de `has_role('admin')` verificada no início da request).

## Próximas revisões obrigatórias

Esta matriz deve ser revisada:
- a cada nova Edge Function que importe `SUPABASE_SERVICE_ROLE_KEY`;
- a cada rotação de chave;
- antes de qualquer auditoria corporativa externa.
