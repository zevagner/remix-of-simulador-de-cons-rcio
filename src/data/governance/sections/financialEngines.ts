import type { GovernanceSection } from '../types';

export const financialEngines: GovernanceSection = {
  id: 'financial-engines',
  label: 'Engines Financeiras Canônicas',
  subtitle: 'Eliminar drift matemático',
  group: 'foundations',
  updatedAt: '2026-05-13',
  owner: 'Plataforma',
  criticality: 'critical',
  status: 'enforced',
  maturity: 'mature',
  executiveSummary:
    'src/core/finance é a fonte única de cálculo financeiro (parcelas, financiamento, CET, schedule, prestamista). Golden snapshots travam estrutura SimulationResult; ESLint bloqueia imports legados.',
  impact:
    'Zero drift matemático entre Simulador, PDF, IA, Comparador e Carteira. Tabelas operacionais prestamista por (modalidade, prazo) com fallback explícito.',
  risk:
    'Divergência tolerada entre motor mensal e legado (≤2% padrão, ≤5% idosos/longos) por seguro atuarial — não forçar paridade.',
  tags: ['financeiro', 'consórcio', 'price', 'sac', 'cet', 'prestamista'],
  blocks: [
    {
      kind: 'paragraph',
      text:
        'Toda matemática financeira passa pela fachada @/core/finance. Não há cálculo paralelo em UI, PDF ou IA. A camada IA é estritamente comunicacional — nunca calcula valores, taxas ou parcelas. Golden snapshots e testes de paridade impedem regressão silenciosa.',
    },
    {
      kind: 'kv',
      title: 'Engines canônicas',
      pairs: [
        { label: 'Parcelas', value: 'src/core/finance/installments — full/reduced/rediluted derivadas' },
        { label: 'Financiamento', value: 'src/core/finance/financing — Price + SAC + CET (Newton-Raphson + bissecção)' },
        { label: 'Simulação', value: 'calculateSimulation orquestrador puro; primitivas isoladas' },
        { label: 'Schedule mensal', value: 'calculateMonthlySchedule — seguro decrescente, lance proporcional' },
        { label: 'Prestamista', value: 'calculateOperationalPrestamistaForType — fator por (modalidade, prazo) + fallback 1.0' },
        { label: 'Reconciliação', value: 'reconcileWithSchedule — fonte única para PDF e UI' },
      ],
    },
    {
      kind: 'callout',
      tone: 'positive',
      title: 'Garantias de paridade',
      since: 'Onda B3',
      text:
        'Golden snapshot trava SimulationResult byte-a-byte. 313/313 testes verdes. Tolerâncias oficiais documentadas para divergência intencional motor mensal × legado (seguro atuarial).',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Proibições institucionais',
      text:
        'Proibido importar @/utils/calculations* direto (ESLint). Proibido hardcodar taxas/limites/prazos — usar BUSINESS_RULES (consortiumRates.ts via businessRules.ts).',
    },
    {
      kind: 'audit-link',
      auditPath: '.lovable/audit/super-auditoria-tecnica-completa.md',
      auditDescription: 'Auditoria técnica completa',
    },
  ],
};
