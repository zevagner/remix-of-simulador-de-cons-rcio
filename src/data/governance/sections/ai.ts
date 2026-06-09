import type { GovernanceSection } from '../types';

export const ai: GovernanceSection = {
  id: 'ai',
  label: 'Inteligência Artificial',
  subtitle: 'Entender o uso responsável de IA',
  group: 'product',
  updatedAt: '2026-05-12',
  owner: 'IA',
  tags: ['llm', 'gateway', 'gemini', 'gpt', 'rate limit'],
  blocks: [
    {
      kind: 'paragraph',
      text: 'A IA atua exclusivamente na camada de comunicação consultiva: geração de narrativas, roteiros de abordagem, tratamento de objeções e sugestões de próximos passos. Cálculos financeiros, taxas, parcelas e reconciliações usam motores determinísticos isolados.',
    },
    {
      kind: 'bullets',
      title: 'Garantias aplicadas',
      items: [
        'Gateway de IA gerenciado, sem chaves expostas no cliente',
        'Cláusula global "nunca prometer garantia" injetada em todos os prompts',
        'Estrutura CSAA (classificar, contextualizar, recomendar, ajustar) padronizada',
        'Rate limiting por user_id com fallback por IP',
        'Validações Zod no payload de cada edge function de IA',
        'Cache de respostas com invalidação por contexto',
      ],
    },
    {
      kind: 'callout',
      tone: 'positive',
      title: 'Princípio',
      text: 'IA generativa para comunicação. Motores determinísticos para matemática. Nunca o inverso.',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/ai-edges-map.md',
      auditDescription: 'Mapa vivo das edges de IA, modelos e responsabilidades',
    },
  ],
};
