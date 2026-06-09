---
name: Paginação server-side + organization_id nullable
description: RPCs list_proposals_page / list_post_sale_clients_page / list_proposal_events_page com hard cap 200; coluna organization_id nullable em 8 tabelas + tabela organizations vazia (compat)
type: feature
---

## Paginação
- Hooks novos em `src/hooks/usePaginatedQueries.ts`: `useProposalsPage`, `usePostSaleClientsPage`, `useProposalEventsPage`.
- RPCs SECURITY DEFINER, EXECUTE só para `authenticated`, hard cap 200/página no servidor.
- Hooks legados (`useProposals` etc) seguem ativos para dashboards agregados.

## Multi-tenant (compat)
- Coluna `organization_id uuid` NULLABLE em: proposals, post_sale_clients, post_sale_events, post_sale_bids, proposal_events, audit_logs, analytics_events, profiles.
- Tabela `organizations` (id, name, owner_user_id) com RLS owner-only.
- RLS atual NÃO foi alterada — acesso continua por user_id. Quando ativar B2B, adicionar OR em policies.

## Proibido
- Adicionar lógica que dependa de organization_id estar preenchido (ainda é nullable).
- Carregar mais de 200 registros em telas operacionais — usar paginação.
