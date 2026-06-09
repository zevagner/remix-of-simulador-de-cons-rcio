import type { GovernanceSection } from '../types';

export const storage: GovernanceSection = {
  id: 'storage-pdf',
  label: 'Storage & PDFs',
  subtitle: 'Saber como artefatos são gerados e armazenados',
  group: 'product',
  updatedAt: '2026-05-12',
  owner: 'Plataforma',
  tags: ['pdf', 'browserless', 'storage', 'cache'],
  blocks: [
    {
      kind: 'paragraph',
      text: 'PDFs são gerados server-side por edge function que delega renderização ao Browserless (Chromium real), garantindo fidelidade visual idêntica à pré-visualização. O artefato resultante é armazenado em bucket privado com URL assinada por demanda.',
    },
    {
      kind: 'kv',
      title: 'Pipeline de geração',
      pairs: [
        { label: 'Origem', value: 'Templates A4 off-screen renderizados no cliente' },
        { label: 'Renderer', value: 'Edge function generate-pdf → Browserless' },
        { label: 'Bucket', value: 'proposal-pdfs (privado)' },
        { label: 'Cache', value: 'proposal_pdf_cache invalidado por trigger ao alterar proposta' },
        { label: 'Bloqueio', value: 'Blocos sem dados úteis exibem MissingDataNote, nunca espaço vazio' },
      ],
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/sprint-b2-pdf-hardening-report.md',
      auditDescription: 'Hardening do pipeline de PDF',
    },
  ],
};
