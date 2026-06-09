import type { GovernanceSection } from '../types';

export const multitenant: GovernanceSection = {
  id: 'multitenant',
  label: 'Multi-tenant',
  subtitle: 'Garantir isolamento entre workspaces',
  group: 'security',
  updatedAt: '2026-05-12',
  owner: 'Segurança',
  tags: ['companies', 'company_users', 'isolamento', 'workspace'],
  blocks: [
    {
      kind: 'paragraph',
      text: 'Cada usuário possui um workspace pessoal (company) criado automaticamente no cadastro. Tabelas operacionais carregam company_id, com policies RLS que filtram por current_company_id() ou is_company_member(), garantindo isolamento entre tenants mesmo em consultas paginadas server-side.',
    },
    {
      kind: 'kv',
      title: 'Mecanismos de isolamento',
      pairs: [
        { label: 'Função-chave', value: 'current_company_id() — SECURITY DEFINER' },
        { label: 'Membership', value: 'company_users (active, role)' },
        { label: 'Auto-provisionamento', value: 'Trigger handle_new_user cria company + vínculo owner' },
        { label: 'Backfill', value: 'set_company_id_from_profile preenche company_id em inserts' },
        { label: 'Paginação', value: 'RPCs list_proposals_page / list_post_sale_clients_page filtram tenant' },
      ],
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/multitenant-audit.md',
      auditDescription: 'Auditoria multi-tenant detalhada',
    },
  ],
};
