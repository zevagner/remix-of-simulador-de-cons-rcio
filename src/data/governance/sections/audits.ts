import type { GovernanceSection } from '../types';

export const audits: GovernanceSection = {
  id: 'audits',
  label: 'Auditorias',
  subtitle: 'Consultar a memória institucional',
  group: 'operations',
  updatedAt: '2026-05-12',
  owner: 'Operações',
  tags: ['relatório', 'auditoria', 'histórico'],
  blocks: [
    {
      kind: 'paragraph',
      text: 'Auditorias técnicas, estratégicas, de UX e de compliance são preservadas como memória institucional viva. Cada onda de evolução gera um relatório arquivado em .lovable/audit/, garantindo rastreabilidade de decisões.',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/super-auditoria-tecnica-completa.md',
      auditDescription: 'Auditoria técnica completa',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/multitenant-audit.md',
      auditDescription: 'Multi-tenant',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/compliance-content-exposure-audit.md',
      auditDescription: 'Compliance e exposição institucional',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/fine-polish-super-audit.md',
      auditDescription: 'Refinamento fino de UX',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/strategic-intelligence-wave5.md',
      auditDescription: 'Inteligência estratégica (Onda 5)',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/temporal-intelligence-wave4.md',
      auditDescription: 'Inteligência temporal (Onda 4)',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/microintelligence-wave3.md',
      auditDescription: 'Microinteligência contextual (Onda 3)',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/posvenda-wave2-relationship-evolution.md',
      auditDescription: 'Evolução do relacionamento pós-venda (Onda 2)',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/carteira-posvenda-wave1-implementation.md',
      auditDescription: 'Carteira e Pós-venda (Onda 1)',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/sprint-b2-pdf-hardening-report.md',
      auditDescription: 'Hardening de PDF',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/sprint-a-performance-hardening-report.md',
      auditDescription: 'Performance hardening',
    },
  ],
};
