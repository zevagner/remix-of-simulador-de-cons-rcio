import type { GovernanceSection } from '../types';

export const compliance: GovernanceSection = {
  id: 'compliance',
  label: 'Compliance',
  subtitle: 'Validar conformidade regulatória e LGPD',
  group: 'security',
  updatedAt: '2026-05-12',
  owner: 'Compliance',
  tags: ['lgpd', 'disclaimer', 'simulação', 'neutralidade'],
  blocks: [
    {
      kind: 'paragraph',
      text: 'A plataforma se posiciona como ferramenta consultiva de simulação. Todos os artefatos gerados (propostas, PDFs, links compartilháveis) carregam disclaimers explícitos de simulação ilustrativa. Nenhum valor exibido representa contratação oficial.',
    },
    {
      kind: 'bullets',
      title: 'Práticas aplicadas',
      items: [
        'Disclaimer obrigatório em PDFs e propostas: "Simulação ilustrativa, não oficial"',
        'IA nunca promete garantia de contemplação ou retorno financeiro',
        'Nomenclatura institucional centralizada em brandConfig (em construção)',
        'Logs de auditoria registram ações críticas com user_id, timestamp e contexto',
        'Dados pessoais de clientes restritos por RLS ao usuário criador',
        'Storage de PDFs em bucket privado, com URLs assinadas',
      ],
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Pontos em evolução',
      text: 'Neutralização de referências institucionais hardcoded e centralização de domínios autorizados em brandConfig.ts estão na próxima onda de hardening.',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/compliance-content-exposure-audit.md',
      auditDescription: 'Auditoria de exposição institucional e compliance',
    },
  ],
};
