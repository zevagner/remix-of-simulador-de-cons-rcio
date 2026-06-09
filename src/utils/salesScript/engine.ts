/**
 * salesScript/engine — gera o payload contextual (perfil + estágio + simulação)
 * consumido pelo edge sales-script. Determinístico, sem chamadas de rede.
 *
 * Princípios:
 * - primaryDriver derivado do diagnóstico (com override manual).
 * - saleStage sugerido a partir do status da proposta (com override manual).
 * - Sem promessas, sem inventar números — apenas dados do simulador.
 */

import type {
  DiagnosticData,
  ObjetivoPrincipal,
  Prioridade,
  Urgencia,
} from '@/components/modules/diagnostic/DiagnosticContext';
import type { ProposalStatus } from '@/services/proposals';

// ─── Driver dominante (motor de persuasão) ───
export type PrimaryDriver =
  | 'economia'      // menor_custo / patrimônio
  | 'seguranca'     // proteção / sair-aluguel
  | 'rapidez'       // urgência alta + rapidez
  | 'liquidez'      // manter capital
  | 'status'        // upgrade / valorização
  | 'patrimonio';   // imóvel investimento / aposentadoria

export const PRIMARY_DRIVER_OPTIONS: { value: PrimaryDriver; label: string; emoji: string; description: string }[] = [
  { value: 'economia',   label: 'Economia',     emoji: '💰', description: 'Menor custo total vs financiamento' },
  { value: 'seguranca',  label: 'Segurança',    emoji: '🛡️', description: 'Proteção e estabilidade financeira' },
  { value: 'rapidez',    label: 'Rapidez',      emoji: '⚡', description: 'Resolver no menor tempo possível' },
  { value: 'liquidez',   label: 'Liquidez',     emoji: '💧', description: 'Preservar capital disponível' },
  { value: 'status',     label: 'Status',       emoji: '⭐', description: 'Upgrade de padrão ou modelo' },
  { value: 'patrimonio', label: 'Patrimônio',   emoji: '💎', description: 'Construção de riqueza no longo prazo' },
];

// ─── Estágio da venda ───
export type SaleStage = 'primeiro_contato' | 'follow_up' | 'sumido' | 'fechamento';

export const SALE_STAGE_OPTIONS: { value: SaleStage; label: string; emoji: string; description: string }[] = [
  { value: 'primeiro_contato', label: 'Primeiro contato', emoji: '👋', description: 'Apresentação inicial — gerar interesse' },
  { value: 'follow_up',        label: 'Follow-up',        emoji: '🔁', description: 'Cliente ativo — manter o calor' },
  { value: 'sumido',           label: 'Cliente sumido',   emoji: '🌫️', description: 'Reativação após silêncio' },
  { value: 'fechamento',       label: 'Fechamento',       emoji: '🏁', description: 'Empurrão final para fechar' },
];

// ─── Derivação determinística do primaryDriver ───
export function deriveClientProfile(d: DiagnosticData | null): {
  primaryDriver: PrimaryDriver;
  reason: string;
} {
  if (!d) return { primaryDriver: 'economia', reason: 'Padrão (sem diagnóstico).' };

  // Prioridade declarada tem peso máximo
  const byPrioridade: Record<Prioridade, PrimaryDriver | null> = {
    menor_custo: 'economia',
    menor_parcela: 'seguranca',
    rapidez: 'rapidez',
    manter_liquidez: 'liquidez',
    '': null,
  };
  if (d.prioridade && byPrioridade[d.prioridade]) {
    return {
      primaryDriver: byPrioridade[d.prioridade]!,
      reason: `Prioridade declarada: ${d.prioridade.replace('_', ' ')}.`,
    };
  }

  // Urgência alta vira rapidez
  if (d.urgencia === 'imediato' || d.urgencyLevel === 'alta') {
    return { primaryDriver: 'rapidez', reason: 'Urgência alta declarada.' };
  }

  // Objetivo principal
  const byObjetivo: Record<ObjetivoPrincipal, PrimaryDriver | null> = {
    imovel_moradia: 'seguranca',
    imovel_investimento: 'patrimonio',
    troca_imovel: 'status',
    veiculo: 'economia',
    troca_veiculo: 'status',
    investimento: 'patrimonio',
    patrimonio_produtivo: 'patrimonio',
    expandir_operacao: 'economia',
    '': null,
  };
  if (d.objetivoPrincipal && byObjetivo[d.objetivoPrincipal]) {
    return {
      primaryDriver: byObjetivo[d.objetivoPrincipal]!,
      reason: `Objetivo principal: ${d.objetivoPrincipal.replace('_', ' ')}.`,
    };
  }

  // Fallback pelo objetivo legado
  if (d.clientObjective === 'sair-aluguel') return { primaryDriver: 'seguranca', reason: 'Sair do aluguel.' };
  if (d.clientObjective === 'patrimonio')  return { primaryDriver: 'patrimonio', reason: 'Formar patrimônio.' };
  if (d.clientObjective === 'investir')    return { primaryDriver: 'patrimonio', reason: 'Investir / rentabilizar.' };

  return { primaryDriver: 'economia', reason: 'Padrão (perfil não declarado).' };
}

// ─── Sugestão de estágio a partir do status da proposta + dias sem contato ───
export function suggestSaleStage(args: {
  status?: ProposalStatus;
  daysSinceLastContact?: number;
}): { stage: SaleStage; reason: string } {
  const { status, daysSinceLastContact } = args;

  if (!status) {
    return { stage: 'primeiro_contato', reason: 'Sem proposta vinculada.' };
  }

  if (status === 'fechado' || status === 'perdido') {
    return { stage: 'fechamento', reason: 'Proposta em status terminal.' };
  }

  if (typeof daysSinceLastContact === 'number' && daysSinceLastContact >= 7) {
    return { stage: 'sumido', reason: `Sem contato há ${daysSinceLastContact} dias.` };
  }

  if (status === 'prospeccao') {
    return { stage: 'primeiro_contato', reason: 'Status: prospecção.' };
  }

  if (status === 'em_avaliacao' || status === 'proposta_ajustada') {
    return { stage: 'fechamento', reason: 'Cliente avaliando — momento de fechar.' };
  }

  // aguardando_retorno, em_negociacao, enviado
  return { stage: 'follow_up', reason: 'Negociação ativa.' };
}

// ─── Tipos do payload enviado ao edge ───
export interface SalesScriptPayload {
  primaryDriver: PrimaryDriver;
  primaryDriverLabel: string;
  saleStage: SaleStage;
  saleStageLabel: string;

  // Cliente
  clientName?: string;
  clientType?: string; // ex: "Imóvel para moradia — Compra"

  // Simulação (números reais)
  consortiumTypeLabel: string;
  creditValue: number;
  installment: number;
  termMonths: number;
  totalCost: number;
  bidValue: number;
  bidPercent: number;
  contemplationMonth?: number;

  // Comparativos
  estimatedFinancingTotal: number;
  estimatedSavings: number;
  estimatedRent60: number;
}
