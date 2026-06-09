import type { GovernanceSection } from '../types';

export const securityIsolation: GovernanceSection = {
  id: 'security-isolation',
  label: 'Segurança & Isolamento',
  subtitle: 'Entender como tenants são isolados',
  group: 'security',
  updatedAt: '2026-05-12',
  owner: 'Segurança',
  tags: ['rls', 'multi-tenant', 'company_id', 'cache', 'storage', 'jwt'],
  blocks: [
    {
      kind: 'paragraph',
      text: 'Isolamento entre workspaces (companies) é tratado em múltiplas camadas defensivas: autenticação, autorização por papéis, Row Level Security em todas as tabelas operacionais, chaves de cache tenant-aware e bucket de storage com URLs assinadas. Nenhuma camada depende exclusivamente da outra.',
    },
    {
      kind: 'kv',
      title: 'Camadas de isolamento',
      pairs: [
        { label: 'Autenticação', value: 'JWT gerenciado, refresh rotacionado, sessão invalidada server-side' },
        { label: 'Autorização', value: 'user_roles em tabela isolada · função has_role() SECURITY DEFINER' },
        { label: 'Tenant-key', value: 'current_company_id() SECURITY DEFINER usada em todas as policies' },
        { label: 'RLS', value: 'Ativa em proposals, post_sale_*, audit_logs, analytics_events, assemblies' },
        { label: 'Cache de IA', value: 'cacheKey(scope, payload, companyId) — nunca cruza tenants' },
        { label: 'Storage', value: 'Buckets privados; URLs assinadas com TTL curto' },
        { label: 'Edge Functions', value: 'Validação Zod no payload + rate limit por user_id (fallback IP)' },
      ],
    },
    {
      kind: 'bullets',
      title: 'O que nunca acontece',
      items: [
        'Roles armazenadas em profiles ou checadas via localStorage',
        'Edge function aceitar payload sem schema validado',
        'Delete sem filtro explícito de user_id ou company_id',
        'Cache de IA reutilizado entre companies diferentes',
        'URL pública direta para PDFs ou anexos privados',
        'Auto-aprovação de perfil ou auto-promoção de role',
      ],
    },
    {
      kind: 'callout',
      tone: 'critical',
      title: 'Garantia de blast radius',
      since: 'Onda 6',
      text: 'Comprometimento de uma sessão jamais expõe dados de outro tenant: RLS bloqueia leitura, cache de IA bloqueia reuso de respostas, storage bloqueia leitura cruzada. Cada barreira foi auditada de forma independente.',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/multitenant-audit.md',
      auditDescription: 'Auditoria multi-tenant e RLS',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/tenant-blast-radius-report.md',
      auditDescription: 'Análise de blast radius entre tenants',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/wave6-systemic-convergence-report.md',
      auditDescription: 'Convergência sistêmica e cache tenant-aware (Onda 6)',
    },
  ],
};
