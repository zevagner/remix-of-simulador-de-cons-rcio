/**
 * Dica única e contextual exibida no topo de cada módulo (via ModuleHeader).
 * Mantém o header minimalista: uma única orientação por módulo, sem repetições.
 */

export interface ModuleTip {
  id: string;
  message: string;
  title?: string;
  variant?: 'tip' | 'warning';
}

export const MODULE_TIPS: Record<string, ModuleTip> = {
  diagnostic: {
    id: 'tip-diagnostic',
    message: 'Comece entendendo o objetivo do cliente antes de mostrar números.',
  },
  simulator: {
    id: 'tip-simulator',
    message: 'Monte o cenário base antes de comparar. Foque em mostrar como funciona o plano.',
  },
  comparator: {
    id: 'tip-comparator',
    variant: 'warning',
    title: 'Importante',
    message: 'No consórcio com lance embutido, o cliente não desembolsa esse valor, mas também recebe menos crédito. Avalie o custo em relação ao crédito líquido.',
  },
  analysis: {
    id: 'tip-analysis',
    message: 'Veja o perfil do cliente e escolha a ferramenta de análise certa para o momento da venda.',
  },
  investment: {
    id: 'tip-investment',
    message: 'Compare cenários de investimento para mostrar o melhor uso do crédito.',
  },
  bids: {
    id: 'tip-bids',
    message: 'Use o histórico real do grupo para sugerir um lance com chance concreta de contemplação.',
  },
  assemblies: {
    id: 'tip-assemblies',
    message: 'Mostre as últimas assembleias para dar segurança ao cliente sobre o grupo escolhido.',
  },
  proposal: {
    id: 'tip-proposal',
    message: 'Personalize a proposta com a linguagem do cliente — clareza fecha mais que técnica.',
  },
  'proposal-pdf': {
    id: 'tip-proposal-pdf',
    message: 'Use o PDF para consolidar a decisão do cliente e reforçar os números apresentados.',
  },
  proposals: {
    id: 'tip-proposals',
    message: 'Acompanhe o pipeline e priorize quem está mais próximo de fechar.',
  },
  objections: {
    id: 'tip-objections',
    message: 'Antecipe a objeção mais provável do perfil antes do cliente trazê-la.',
  },
  'post-sale': {
    id: 'tip-post-sale',
    message: 'Pós-venda ativo reduz desistência e gera indicações.',
  },
};

export function getModuleTip(moduleId?: string): ModuleTip | null {
  if (!moduleId) return null;
  return MODULE_TIPS[moduleId] ?? null;
}
