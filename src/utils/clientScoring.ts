/**
 * clientScoring — motor unificado de score (0–100), classificação e prioridade
 * para clientes da Carteira (proposals) e do Pós-venda (post_sale_clients).
 *
 * REGRAS:
 *  • NÃO substitui `proposalPriority.ts` nem `postSalePriority.ts` — esses
 *    sistemas continuam dirigindo cadência interna (alta/média/baixa). Aqui
 *    adicionamos uma CAMADA de classificação comercial (quente/morno/frio) e
 *    de prioridade de ação (urgente/atenção/reativar) coerente entre módulos.
 *  • Determinístico: mesmas entradas → mesmo score. Sem IA neste arquivo.
 *  • Score 0–100 normalizado a partir de sinais já existentes (status, recência,
 *    valor, próxima ação, eventos) — nada novo é exigido do banco.
 *
 * Mapa de classificação (pedido):
 *   ≥80  → quente
 *   50–79→ morno
 *   <50  → frio
 *
 * Prioridade:
 *   score alto + tempo sem contato → urgente
 *   score médio + tempo            → atenção
 *   longo tempo sem contato        → reativar
 *   demais                         → acompanhar
 */
import type { ProposalRecord } from '@/services/proposals';
import type { PostSaleClient, PostSaleEvent } from '@/services/postSale';
import { scoreProposal } from './proposalPriority';
import { computeClientPriority } from '@/components/modules/postSale/postSalePriority';
import { getNextActionUrgency } from '@/components/modules/postSale/postSaleNextAction';
import { STALE_CONTACT_DAYS, URGENT_CONTACT_DAYS } from '@/components/modules/postSale/postSaleConstants';

// ─── Tipos públicos ───
export type Temperature = 'quente' | 'morno' | 'frio';
export type ActionPriority = 'urgente' | 'atencao' | 'reativar' | 'acompanhar';

export interface ClientScore {
  /**
   * Onda 6: nome canônico = `engagementScore`. Mantemos `score` como alias
   * para compatibilidade durante a migração. Novos consumidores devem ler
   * `engagementScore`. `score` será removido na próxima onda.
   */
  score: number;            // 0–100 (alias deprecado)
  engagementScore: number;  // 0–100 (canônico)
  temperature: Temperature; // quente/morno/frio
  priority: ActionPriority; // urgente/atencao/reativar/acompanhar
  reasons: string[];
}

// ─── Helpers internos ───
const daysSince = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
};

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

function classify(score: number, lastContactDays: number | null): {
  temperature: Temperature;
  priority: ActionPriority;
} {
  const temperature: Temperature =
    score >= 80 ? 'quente' : score >= 50 ? 'morno' : 'frio';

  // Prioridade combina score com inatividade.
  let priority: ActionPriority = 'acompanhar';
  const stale = lastContactDays !== null && lastContactDays >= STALE_CONTACT_DAYS;
  const veryStale = lastContactDays !== null && lastContactDays >= URGENT_CONTACT_DAYS;

  if (score >= 80 && stale) priority = 'urgente';
  else if (score >= 50 && stale) priority = 'atencao';
  else if (veryStale) priority = 'reativar';
  else if (score >= 80) priority = 'urgente'; // quente sem inatividade ainda é prioridade
  else if (score >= 50) priority = 'atencao';

  return { temperature, priority };
}

// ─── Carteira (proposals) ───
/**
 * Score 0–100 para uma proposta da carteira. Reaproveita `scoreProposal`
 * (que já normaliza em 0–100 via clamp interno) e enriquece com classificação.
 */
export function scoreProposalUnified(
  proposal: ProposalRecord,
  maxCreditValue: number,
): ClientScore {
  const sp = scoreProposal(proposal, maxCreditValue);
  const score = clamp(sp.priorityScore);

  // Recência baseada no último update da proposta (proxy de "último contato").
  const lastDays = daysSince(proposal.updated_at);
  const { temperature, priority } = classify(score, lastDays);

  const reasons: string[] = [];
  if (sp.priorityReason) reasons.push(sp.priorityReason);
  if (lastDays !== null && lastDays >= STALE_CONTACT_DAYS) {
    reasons.push(`${lastDays}d sem atualização`);
  }
  if (proposal.status === 'fechado') reasons.push('Negócio fechado');
  if (proposal.status === 'perdido') reasons.push('Proposta perdida');

  // Status terminais não têm prioridade ativa.
  const finalPriority: ActionPriority =
    proposal.status === 'fechado' || proposal.status === 'perdido'
      ? 'acompanhar'
      : priority;

  return { score, engagementScore: score, temperature, priority: finalPriority, reasons };
}

// ─── Pós-venda (post_sale_clients) ───
/**
 * Score 0–100 para um cliente pós-venda. Combina o score determinístico
 * existente (`computeClientPriority`, escala ~0–10) com sinais de oportunidade
 * e recência, normalizando em 0–100.
 *
 * Pesos (totalizam até 100):
 *   • urgência base (postSalePriority.score x 8) — até 40
 *   • inadimplência                              — +20
 *   • contemplado / quitado (oportunidade)       — +20
 *   • ação atrasada                              — +15
 *   • ação para hoje                             — +10
 *   • ≥ STALE_CONTACT_DAYS sem contato           — +10
 *   • ≥ URGENT_CONTACT_DAYS sem contato          — +20
 */
export function scorePostSaleClient(
  client: PostSaleClient,
  nextAction: PostSaleEvent | null,
): ClientScore {
  const base = computeClientPriority(client, nextAction); // 0..10
  const reasons: string[] = [...base.reasons];

  let score = Math.min(40, base.score * 8);

  if (client.status === 'inadimplente') score += 20;
  if (client.status === 'contemplado' || client.status === 'quitado') {
    score += 20;
    if (!reasons.some(r => r.toLowerCase().includes('oportunidade'))) {
      reasons.push('Janela de oportunidade');
    }
  }

  if (nextAction) {
    const meta = nextAction.metadata as Record<string, unknown> | null;
    const due = String(meta?.due_date ?? nextAction.event_date);
    const urgency = getNextActionUrgency(due);
    if (urgency === 'overdue') score += 15;
    else if (urgency === 'today') score += 10;
  }

  const lastDays = daysSince(client.last_contact_date) ?? daysSince(client.created_at);
  if (lastDays !== null) {
    if (lastDays >= URGENT_CONTACT_DAYS) score += 20;
    else if (lastDays >= STALE_CONTACT_DAYS) score += 10;
  }

  score = clamp(Math.round(score));
  const { temperature, priority } = classify(score, lastDays);

  return { score, engagementScore: score, temperature, priority, reasons };
}

// ─── Estilos visuais (semantic tokens) ───
export const TEMPERATURE_BADGE: Record<Temperature, { emoji: string; label: string; chip: string }> = {
  quente: { emoji: '🔥', label: 'Quente', chip: 'bg-destructive/15 text-destructive border-destructive/30' },
  morno:  { emoji: '🌤️', label: 'Morno',  chip: 'bg-warning/15 text-warning border-warning/30' },
  frio:   { emoji: '❄️', label: 'Frio',   chip: 'bg-muted text-muted-foreground border-border' },
};

export const ACTION_PRIORITY_BADGE: Record<ActionPriority, { emoji: string; label: string; chip: string }> = {
  urgente:    { emoji: '⚡', label: 'Contatar agora',  chip: 'bg-destructive/15 text-destructive border-destructive/30' },
  atencao:    { emoji: '👀', label: 'Atenção',         chip: 'bg-warning/15 text-warning border-warning/30' },
  reativar:   { emoji: '🔄', label: 'Reativar',        chip: 'bg-primary/10 text-primary border-primary/30' },
  acompanhar: { emoji: '📋', label: 'Acompanhar',      chip: 'bg-muted text-muted-foreground border-border' },
};
