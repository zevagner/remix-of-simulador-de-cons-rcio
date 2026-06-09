/**
 * Definições das seções/blocos da Proposta Premium.
 *
 * Cada bloco selecionável pelo usuário tem um `id` estável, uma `category`
 * (que define em qual etapa do wizard aparece) e uma `order` ABSOLUTA — usada
 * para reorganizar automaticamente o PDF na ordem narrativa correta,
 * independente da ordem de seleção do usuário.
 */

export type BlockCategory = 'base' | 'comparison' | 'depth' | 'persuasion';

export interface ProposalBlockDef {
  id: string;
  label: string;
  description: string;
  category: BlockCategory;
  /** Posição final no PDF (1..n). Quanto menor, mais cedo no documento. */
  order: number;
  /** Bloco obrigatório (não desmarcável). */
  required?: boolean;
  /** Recomendado por padrão (vem marcado). */
  recommended?: boolean;
}

/**
 * Catálogo único — fonte de verdade para o wizard E para o renderizador do PDF.
 *
 * Ordem narrativa (após Capa / Considerações iniciais que são fixas):
 *  10 — Contexto do cliente (Diagnóstico)
 *  20 — Cenário atual (Simulação)
 *  30..39 — Comparações (Financiamento, À Vista)
 *  40..49 — Estratégia recomendada (Lance, Renda, Venda da Carta)
 *  50 — Prova técnica (Estudo de Lances)
 *  60 — Interpretação (resumo de ganhos)
 *  70 — Storytelling
 *  80 — Argumentos de decisão
 *  90 — Objeções e respostas
 * 100 — Fechamento (sempre)
 * 110 — NPS (sempre)
 */
export const PROPOSAL_BLOCKS: ProposalBlockDef[] = [
  // ─── Etapa 1: Base (sempre) ───
  {
    id: 'diagnostic',
    label: 'Diagnóstico do cliente',
    description: 'Objetivo, situação e capacidade — entendimento da necessidade.',
    category: 'base',
    order: 10,
    required: true,
  },
  {
    id: 'simulation',
    label: 'Simulação principal',
    description: 'Carta, prazo, parcela e custo total da estratégia recomendada.',
    category: 'base',
    order: 20,
    required: true,
  },

  // ─── Etapa 2: Comparações ───
  {
    id: 'cmp-financing',
    label: 'Consórcio × Financiamento',
    description: 'Compara custo total, juros e desembolso ao longo do tempo.',
    category: 'comparison',
    order: 30,
    recommended: true,
  },
  {
    id: 'cmp-cash',
    label: 'Consórcio × À vista',
    description: 'Mostra impacto patrimonial de não se descapitalizar.',
    category: 'comparison',
    order: 31,
  },
  {
    id: 'strategy-bid',
    label: 'Estratégia de lance',
    description: 'Lance recomendado e impacto na contemplação e parcela.',
    category: 'comparison',
    order: 40,
    recommended: true,
  },
  {
    id: 'strategy-income',
    label: 'Geração de renda passiva',
    description: 'Como usar a carta de crédito para gerar renda mensal.',
    category: 'comparison',
    order: 41,
  },
  {
    id: 'strategy-sell',
    label: 'Venda da carta contemplada',
    description: 'Cenário de saída antecipada com ganho de capital.',
    category: 'comparison',
    order: 42,
  },
  {
    id: 'wealth-thesis',
    label: 'Tese patrimonial consultiva',
    description: 'Estratégia patrimonial selecionada — racional, aplicações e KPIs.',
    category: 'comparison',
    order: 45,
    recommended: true,
  },
  {
    id: 'structured-ops',
    label: 'Operação estruturada multi-cartas',
    description: 'Consolidação de múltiplas cotas — racional operacional e impacto.',
    category: 'comparison',
    order: 46,
  },

  // ─── Etapa 3: Aprofundamento ───
  {
    id: 'bids-study',
    label: 'Estudo de lances do grupo',
    description: 'Histórico real de contemplações e zonas de lance.',
    category: 'depth',
    order: 50,
  },
  {
    id: 'contemplation',
    label: 'Análise de contemplação',
    description: 'Probabilidades estatísticas com base no histórico.',
    category: 'depth',
    order: 51,
  },

  // ─── Etapa 4: Convencimento ───
  {
    id: 'storytelling',
    label: 'Storytelling com IA',
    description: 'Narrativa de visão futura adaptada ao perfil do cliente.',
    category: 'persuasion',
    order: 70,
    recommended: true,
  },
  {
    id: 'arguments',
    label: 'Argumentos de decisão',
    description: 'Os 3 motivos mais fortes para seguir essa estratégia.',
    category: 'persuasion',
    order: 80,
    recommended: true,
  },
  {
    id: 'objections',
    label: 'Objeções e respostas',
    description: 'Antecipa dúvidas comuns com respostas consultivas.',
    category: 'persuasion',
    order: 90,
  },
];

/** Reorganiza IDs selecionados na ordem narrativa do catálogo. */
export function sortBlocks(selectedIds: string[]): ProposalBlockDef[] {
  const set = new Set(selectedIds);
  return PROPOSAL_BLOCKS
    .filter((b) => b.required || set.has(b.id))
    .sort((a, b) => a.order - b.order);
}

/** IDs marcados por padrão ao abrir o wizard. */
export function defaultSelectedIds(): string[] {
  return PROPOSAL_BLOCKS.filter((b) => b.required || b.recommended).map((b) => b.id);
}
