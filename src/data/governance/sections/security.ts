import type { GovernanceSection } from '../types';

export const security: GovernanceSection = {
  id: 'security',
  label: 'Segurança',
  subtitle: 'Conhecer as garantias de proteção',
  group: 'security',
  updatedAt: '2026-05-27',
  owner: 'Segurança',
  tags: ['rls', 'auth', 'jwt', 'rate limit', 'roles', 'v2.10.1'],
  blocks: [
    {
      kind: 'paragraph',
      text: 'A segurança é tratada em camadas: autenticação gerenciada, autorização por papéis (roles) em tabela isolada, Row Level Security (RLS) em todas as tabelas operacionais, validação server-side em edge functions e rate limiting por usuário.',
    },
    {
      kind: 'bullets',
      title: 'Fluxo de acesso e autenticação',
      items: [
        'Usuário cria conta com email @caixa.gov.br',
        'Recebe email de confirmação Supabase',
        'Clica no link → acesso liberado automaticamente (sem aprovação manual obrigatória)',
        'Admin pode bloquear usuário a qualquer momento via approved=false no banco',
        'Bloqueio é detectado em até 5 minutos durante sessão ativa via verificação periódica',
        'Sessões expiradas ou bloqueadas limpam automaticamente dados PII do localStorage',
      ],
    },
    {
      kind: 'kv',
      title: 'Estados do usuário',
      pairs: [
        { label: 'Aguardando confirmação', value: 'Conta criada, link de e-mail não clicado' },
        { label: 'Ativo', value: 'Email confirmado, acesso liberado automaticamente' },
        { label: 'Bloqueado', value: 'Admin definiu campo approved=false manualmente' },
      ],
    },
    {
      kind: 'bullets',
      title: 'Controles secundários',
      items: [
        'Autenticação JWT com tokens de refresh rotacionados',
        'Roles em tabela dedicada (user_roles) — nunca em profiles',
        'Function SECURITY DEFINER has_role() para evitar recursão em RLS',
        'RLS ativa em proposals, post_sale_clients, audit_logs, analytics_events',
        'Edge functions validam payload com Zod e aplicam rate limit por user_id',
        'Trigger prevent_profile_self_approval bloqueia auto-aprovação',
        'Política AS RESTRICTIVE protege escalada de privilégios em user_roles',
      ],
    },
    {
      kind: 'callout',
      tone: 'critical',
      title: 'O que nunca acontece',
      text: 'Roles armazenadas no perfil do usuário. Verificação de admin via localStorage. Edge function aceitar payload sem validação. Delete sem filtro explícito de user_id. Persistência de PII em localStorage após expiração de sessão.',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/multitenant-audit.md',
      auditDescription: 'Auditoria multi-tenant e isolamento',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/tenant-blast-radius-report.md',
      auditDescription: 'Análise de blast radius entre tenants',
    },
  ],
};
