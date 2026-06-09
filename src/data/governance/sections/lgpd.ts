import type { GovernanceSection } from '../types';

export const lgpd: GovernanceSection = {
  id: 'lgpd',
  label: 'LGPD & Compliance',
  subtitle: 'Validar conformidade com a LGPD',
  group: 'security',
  updatedAt: '2026-05-12',
  owner: 'Compliance',
  tags: ['lgpd', 'privacidade', 'retenção', 'titular', 'dados pessoais'],
  blocks: [
    {
      kind: 'paragraph',
      text: 'A plataforma trata dados pessoais de clientes finais (nome, contato, simulação) sob responsabilidade do consultor que os cadastra. Todos os dados são segregados por tenant via RLS, registrados em logs de auditoria quando alterados criticamente, e protegidos por disclaimers explícitos de simulação ilustrativa nos artefatos gerados.',
    },
    {
      kind: 'kv',
      title: 'Bases e princípios aplicados',
      pairs: [
        { label: 'Finalidade', value: 'Apoio à simulação consultiva e relacionamento comercial do consultor' },
        { label: 'Minimização', value: 'Apenas campos necessários à simulação e ao contato direto' },
        { label: 'Segregação', value: 'RLS por user_id e company_id em proposals e post_sale_*' },
        { label: 'Rastreabilidade', value: 'audit_logs registram criação, edição e remoção críticas' },
        { label: 'Retenção', value: 'Dados vinculados ao consultor; remoção em cascata ao excluir conta' },
        { label: 'Disclaimers', value: 'Todos os PDFs e propostas marcam "Simulação ilustrativa, não oficial"' },
      ],
    },
    {
      kind: 'bullets',
      title: 'Direitos do titular suportados',
      items: [
        'Acesso: consultor visualiza todos os dados do cliente que cadastrou',
        'Correção: edição livre nos módulos Carteira e Pós-venda',
        'Eliminação: remoção em cascata respeita filtro de user_id',
        'Portabilidade: exportação via PDF e link compartilhável assinado',
        'Revogação de compartilhamento: tokens de proposta podem ser invalidados',
      ],
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Pontos em evolução',
      since: 'Roadmap',
      text: 'Centralização de domínios institucionais autorizados em brandConfig.ts e formalização de política de retenção máxima por categoria de dado estão na próxima onda de hardening.',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/compliance-content-exposure-audit.md',
      auditDescription: 'Auditoria de exposição institucional e compliance',
    },
  ],
};
