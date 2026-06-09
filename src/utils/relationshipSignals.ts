/**
 * relationshipSignals — microinteligência contextual (Onda 3).
 *
 * Centraliza, em um único arquivo, os "micro sinais" leves exibidos como chips
 * discretos em cards da Carteira (proposals) e do Pós-venda (post_sale_clients).
 *
 * REGRAS:
 *  • Determinístico, sem IA. Reaproveita score unificado, datas e próxima ação
 *    que já existem — não exige nada novo do banco.
 *  • Saída sempre como CHIPS COMPACTOS (sem modal, sem toast, sem popup).
 *  • Tom NÃO alarmista. Sem vermelho agressivo: usa primary/warning/muted.
 *  • Não duplica responsabilidades de outros sistemas:
 *      - Cockpit  → próximo passo da venda atual
 *      - Cadência → SLA por coluna (warn/critical) — segue exclusivo do Kanban
 *      - Risco    → inadimplência / contemplação (Pós-venda)
 *    Aqui ficam APENAS sinais de RELACIONAMENTO (esfriando, esquecido, janela).
 *  • Para evitar ruído, no máximo 2 sinais por card; ordenação por prioridade.
 */
import type { ProposalRecord } from '@/services/proposals';
import type { PostSaleClient, PostSaleEvent } from '@/services/postSale';
import type { ClientScore } from './clientScoring';
import {
  STALE_CONTACT_DAYS,
  POST_CONTEMPLATION_OPPORTUNITY_DAYS,
} from '@/components/modules/postSale/postSaleConstants';

export type RelationshipSignalId =
  | 'hot_forgotten'
  | 'cooling'
  | 'post_contemplation_window'
  | 'losing_traction';

export type SignalTone = 'subtle' | 'attention' | 'opportunity';

export interface RelationshipSignal {
  id: RelationshipSignalId;
  emoji: string;
  label: string;
  /** Tooltip curto explicando o sinal e sugerindo ação. */
  hint: string;
  tone: SignalTone;
  /** Quanto menor, mais relevante (usado para ordenar e cortar em 2). */
  priority: number;
}

const MAX_SIGNALS_PER_CARD = 2;

/** Estilos por tom — 100% via design tokens semânticos. */
export const SIGNAL_TONE_CLASS: Record<SignalTone, string> = {
  attention:   'bg-warning/10 text-warning border-warning/30',
  opportunity: 'bg-primary/10 text-primary border-primary/30',
  subtle:      'bg-muted text-muted-foreground border-border',
};

const daysSince = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
};

const isNextContactOverdue = (iso: string | null | undefined): boolean => {
  if (!iso) return false;
  const d = new Date(iso + 'T00:00:00').getTime();
  if (Number.isNaN(d)) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d < today.getTime();
};

const sortAndTrim = (signals: RelationshipSignal[]): RelationshipSignal[] =>
  signals
    .sort((a, b) => a.priority - b.priority)
    .slice(0, MAX_SIGNALS_PER_CARD);

// ─── Carteira (proposals) ───
/**
 * Sinais de relacionamento para uma proposta da carteira.
 * Ignora estados terminais (fechado/perdido) e prospecção pura.
 */
export function getProposalRelationshipSignals(
  proposal: ProposalRecord,
  unified: ClientScore,
): RelationshipSignal[] {
  const out: RelationshipSignal[] = [];

  if (proposal.status === 'fechado' || proposal.status === 'perdido') return out;

  const sinceUpdate = daysSince(proposal.updated_at) ?? 0;
  const hasNextAction = !!proposal.next_action_type;
  const overdueContact = isNextContactOverdue(proposal.next_contact_date ?? null);

  // 1) Quente esquecido — score alto + sem próxima ação + sem update recente.
  if (unified.temperature === 'quente' && !hasNextAction && sinceUpdate >= 5) {
    out.push({
      id: 'hot_forgotten',
      emoji: '🔥',
      label: 'Quente esquecido',
      hint: `Cliente quente há ${sinceUpdate}d sem próxima ação. Agende contato hoje.`,
      tone: 'attention',
      priority: 1,
    });
  }

  // 2) Perdendo tração — tinha contato agendado e venceu, ou estava morno e parou.
  if (
    proposal.status !== 'prospeccao' &&
    (overdueContact || (unified.temperature === 'morno' && !hasNextAction && sinceUpdate >= 10))
  ) {
    out.push({
      id: 'losing_traction',
      emoji: '👀',
      label: 'Perdendo tração',
      hint: overdueContact
        ? 'Follow-up vencido — reativar antes do cliente esfriar.'
        : 'Engajamento caindo sem próximo passo agendado.',
      tone: 'attention',
      priority: 2,
    });
  }

  // 3) Relacionamento esfriando — discreto, antes de virar dormente.
  if (
    unified.temperature !== 'frio' &&
    sinceUpdate >= STALE_CONTACT_DAYS &&
    !out.some(s => s.id === 'hot_forgotten' || s.id === 'losing_traction')
  ) {
    out.push({
      id: 'cooling',
      emoji: '🌡️',
      label: 'Relacionamento esfriando',
      hint: `Há ${sinceUpdate}d sem interação. Um toque rápido reativa o vínculo.`,
      tone: 'subtle',
      priority: 3,
    });
  }

  return sortAndTrim(out);
}

// ─── Pós-venda (post_sale_clients) ───
/**
 * Sinais de relacionamento para um cliente de pós-venda.
 * Não duplica os opportunityChips (potencial nova operação / crédito alto):
 * aqui o foco é janela e atenção contínua.
 */
export function getPostSaleRelationshipSignals(
  client: PostSaleClient,
  unified: ClientScore,
  nextAction: PostSaleEvent | null,
): RelationshipSignal[] {
  const out: RelationshipSignal[] = [];

  // Não emitir sinais para inadimplentes — esse caso já é tratado pelo risco/momento.
  if (client.status === 'inadimplente') return out;

  const sinceContact = daysSince(client.last_contact_date) ?? daysSince(client.created_at) ?? 0;
  const hasNextAction = !!nextAction;

  // 1) Quente esquecido — ativo + quente + sem próxima ação + ≥ STALE.
  if (
    client.status === 'ativo' &&
    unified.temperature === 'quente' &&
    !hasNextAction &&
    sinceContact >= STALE_CONTACT_DAYS
  ) {
    out.push({
      id: 'hot_forgotten',
      emoji: '🔥',
      label: 'Quente esquecido',
      hint: `Cliente quente há ${sinceContact}d sem ação agendada. Contato hoje evita perder oportunidade.`,
      tone: 'attention',
      priority: 1,
    });
  }

  // 2) Janela pós-contemplação — 0 a POST_CONTEMPLATION_OPPORTUNITY_DAYS.
  if (client.status === 'contemplado') {
    const sinceContemplation = daysSince(client.contemplation_date);
    if (
      sinceContemplation !== null &&
      sinceContemplation >= 0 &&
      sinceContemplation <= POST_CONTEMPLATION_OPPORTUNITY_DAYS
    ) {
      out.push({
        id: 'post_contemplation_window',
        emoji: '💡',
        label: 'Janela forte de relacionamento',
        hint: 'Pós-contemplação até 90d — momento ideal para indicação, upgrade ou nova carta.',
        tone: 'opportunity',
        priority: 2,
      });
    }
  }

  // 3) Relacionamento esfriando — ativo + ≥ STALE, sem ser quente esquecido.
  if (
    client.status === 'ativo' &&
    unified.temperature !== 'frio' &&
    sinceContact >= STALE_CONTACT_DAYS &&
    !out.some(s => s.id === 'hot_forgotten')
  ) {
    out.push({
      id: 'cooling',
      emoji: '🌡️',
      label: 'Relacionamento esfriando',
      hint: `Há ${sinceContact}d sem contato. Um toque leve reativa o vínculo.`,
      tone: 'subtle',
      priority: 3,
    });
  }

  return sortAndTrim(out);
}
