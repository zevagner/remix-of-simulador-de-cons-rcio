/**
 * useCopilotTriggers — avalia gatilhos proativos do copiloto a partir de useProposalData().
 *
 * REGRAS:
 *  - NÃO recalcula nada (apenas lê do contexto).
 *  - NÃO cria contexto novo.
 *  - Retorna lista de "razões" (strings curtas) e uma chave estável (`signature`)
 *    para o consumidor disparar a IA no máximo 1x por cenário.
 */
import { useMemo } from 'react';
import { useProposalData } from '@/contexts/proposal';
import type { ProposalRecord } from '@/services/proposals';
import type { PostSaleClient } from '@/services/postSale';

export interface CopilotTriggerInput {
  proposal?: ProposalRecord | null;
  postSaleClient?: PostSaleClient | null;
  /** risco pós-venda já calculado por postSaleRisk.ts ('low'|'medium'|'high') */
  riskLevel?: 'low' | 'medium' | 'high' | null;
  /** dias desde último contato (se não informado, calculamos a partir de proposal/postSale) */
  daysSinceLastContact?: number | null;
}

export interface CopilotTriggerResult {
  reasons: string[];
  /** chave estável que muda quando o cenário relevante muda (anti-loop) */
  signature: string;
  fired: boolean;
}

const COST_RATIO_THRESHOLD = 1.85;        // custo efetivo > 1.85x crédito
const BID_PERCENT_THRESHOLD = 20;         // lance embutido > 20%
const STALE_DAYS_THRESHOLD = 7;           // cliente parado há > 7 dias

function daysSince(dateIso?: string | null): number | null {
  if (!dateIso) return null;
  const t = new Date(dateIso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

export function useCopilotTriggers(input: CopilotTriggerInput = {}): CopilotTriggerResult {
  const data = useProposalData();

  return useMemo(() => {
    const reasons: string[] = [];
    const sim = data.simulation;
    const credit = sim?.input?.creditValue ?? 0;
    const cost = sim?.effectiveClientCost ?? sim?.result?.totalCost ?? 0;
    const ratio = credit > 0 ? cost / credit : 0;
    const bidPercent = data.journey?.slots?.bidStrategy?.bidPercent ?? 0;

    const days =
      input.daysSinceLastContact ??
      daysSince(input.proposal?.updated_at ?? input.postSaleClient?.last_contact_date ?? null);

    if (sim?.isValidSimulation && ratio >= COST_RATIO_THRESHOLD) {
      reasons.push(`custo_alto:${ratio.toFixed(2)}`);
    }
    if (bidPercent > BID_PERCENT_THRESHOLD) {
      reasons.push(`lance_embutido:${Math.round(bidPercent)}`);
    }
    if (days !== null && days > STALE_DAYS_THRESHOLD) {
      reasons.push(`cliente_parado:${days}`);
    }
    if (input.riskLevel === 'high') {
      reasons.push('risco_alto_pos_venda');
    }

    const signature = reasons.join('|') || 'idle';
    return { reasons, signature, fired: reasons.length > 0 };
  }, [data, input.proposal, input.postSaleClient, input.riskLevel, input.daysSinceLastContact]);
}
