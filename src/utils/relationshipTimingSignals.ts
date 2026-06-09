/**
 * relationshipTimingSignals — inteligência temporal silenciosa (Onda 4).
 *
 * Centraliza, em um único arquivo, sinais TEMPORAIS leves que complementam
 * `relationshipSignals.ts` (que cobre estado/atenção). Aqui o foco é RITMO
 * e CADÊNCIA: melhor momento, janela natural por trigger, relacionamento maduro.
 *
 * REGRAS:
 *  • Determinístico, sem IA. Heurísticas curtas a partir de dados existentes
 *    (status, prospect_trigger, datas, last_contact_date).
 *  • Saída como CHIP COMPACTO, no máximo **1 sinal temporal por card**.
 *  • Tom não preditivo: "costuma", "bom momento", nunca "vai converter".
 *  • Não compete com:
 *      - cadenceRules (SLA por coluna — alerta operacional)
 *      - relationshipSignals (atenção: quente esquecido / esfriando / janela)
 *      - cockpit (próximo passo)
 *  • Cores via design tokens; sem destructive (proibido alarmar).
 */
import type { ProposalRecord } from '@/services/proposals';
import type { PostSaleClient } from '@/services/postSale';

export type TimingSignalId =
  | 'cadence_retake'
  | 'trigger_window'
  | 'mature_relationship';

export type TimingTone = 'subtle' | 'opportunity';

export interface TimingSignal {
  id: TimingSignalId;
  emoji: string;
  label: string;
  hint: string;
  tone: TimingTone;
}

/** Estilos por tom — design tokens semânticos. */
export const TIMING_TONE_CLASS: Record<TimingTone, string> = {
  subtle:      'bg-muted text-muted-foreground border-border',
  opportunity: 'bg-primary/10 text-primary border-primary/30',
};

const daysSince = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
};

// ─── Heurísticas por prospect_trigger ───
// Texto curto, sem promessa. Baseado em padrão de mercado bancário consultivo.
const TRIGGER_TIMING: Record<string, { emoji: string; hint: string }> = {
  fgts:          { emoji: '💎', hint: 'Trigger FGTS costuma converter rápido — janela curta.' },
  financiamento: { emoji: '🔄', hint: 'Saindo de financiamento: decisão tende a ser rápida.' },
  aluguel:       { emoji: '🏠', hint: 'Pagando aluguel: ciclo médio, exige nutrição constante.' },
  liquidez:      { emoji: '💰', hint: 'Liquidez parada: decisão acelera quando o argumento amadurece.' },
  investidor:    { emoji: '📈', hint: 'Investidor: ciclo médio — costuma comparar antes de fechar.' },
  pj:            { emoji: '🚛', hint: 'PJ/frota: decisão multi-pessoa — follow-up paciente.' },
  agro:          { emoji: '🌾', hint: 'Agro: ciclo longo, sazonal — follow-up sem pressa.' },
  sucessao:      { emoji: '🏛️', hint: 'Sucessão patrimonial: ciclo longo e sensível.' },
};

/**
 * Cadência sugerida para Carteira: por status, sugere "bom momento de retomar"
 * quando passou tempo suficiente sem virar alerta crítico.
 */
function getProposalCadenceSignal(proposal: ProposalRecord): TimingSignal | null {
  if (proposal.status === 'fechado' || proposal.status === 'perdido') return null;
  if (proposal.next_action_type) return null; // já tem ação programada — silenciar.

  const sinceUpdate = daysSince(proposal.updated_at) ?? 0;

  if (proposal.status === 'aguardando_retorno' && sinceUpdate >= 3 && sinceUpdate <= 7) {
    return {
      id: 'cadence_retake',
      emoji: '⏱️',
      label: 'Bom momento para retomar',
      hint: `${sinceUpdate}d desde o envio — clientes nesse estágio costumam esfriar após 7d.`,
      tone: 'subtle',
    };
  }
  if (proposal.status === 'em_avaliacao' && sinceUpdate >= 4 && sinceUpdate <= 10) {
    return {
      id: 'cadence_retake',
      emoji: '🔁',
      label: 'Hora de reaproximar',
      hint: `${sinceUpdate}d em avaliação — toque leve mantém a decisão viva.`,
      tone: 'subtle',
    };
  }
  if (proposal.status === 'proposta_ajustada' && sinceUpdate >= 2 && sinceUpdate <= 5) {
    return {
      id: 'cadence_retake',
      emoji: '⏱️',
      label: 'Decisão próxima',
      hint: 'Após o ajuste, a decisão costuma vir nos próximos 3–5 dias.',
      tone: 'opportunity',
    };
  }
  return null;
}

function getTriggerWindowSignal(proposal: ProposalRecord): TimingSignal | null {
  const t = proposal.prospect_trigger;
  if (!t || t === 'nao_identificado') return null;
  const cfg = TRIGGER_TIMING[t];
  if (!cfg) return null;
  // Apenas em status ainda em movimento — evita ruído em fechado/perdido.
  if (proposal.status === 'fechado' || proposal.status === 'perdido') return null;
  return {
    id: 'trigger_window',
    emoji: cfg.emoji,
    label: 'Ritmo típico do trigger',
    hint: cfg.hint,
    tone: 'subtle',
  };
}

/**
 * Carteira: máximo 1 sinal temporal — cadência tem prioridade sobre trigger.
 */
export function getProposalTimingSignal(proposal: ProposalRecord): TimingSignal | null {
  return getProposalCadenceSignal(proposal) ?? getTriggerWindowSignal(proposal);
}

// ─── Pós-venda ───
const MATURE_RELATIONSHIP_DAYS = 365;

/**
 * Pós-venda: máximo 1 sinal temporal.
 * Prioridade:
 *   1. cadence_retake — ativo sem contato em janela "natural" de retomada
 *   2. mature_relationship — relacionamento consolidado (≥ 1 ano)
 */
export function getPostSaleTimingSignal(client: PostSaleClient): TimingSignal | null {
  if (client.status === 'inadimplente') return null; // tratado por risco

  const sinceContact = daysSince(client.last_contact_date) ?? daysSince(client.created_at) ?? 0;
  const sinceCreated = daysSince(client.created_at) ?? 0;

  // 1) Cadência de retomada — só quando ativo, em janela natural (60–120d).
  if (client.status === 'ativo' && sinceContact >= 60 && sinceContact <= 120) {
    return {
      id: 'cadence_retake',
      emoji: '🔁',
      label: 'Bom momento para retomar',
      hint: `Há ${sinceContact}d sem contato — janela natural de reativação patrimonial.`,
      tone: 'subtle',
    };
  }

  // 2) Relacionamento consolidado — relacionamento longo na carteira.
  if (sinceCreated >= MATURE_RELATIONSHIP_DAYS) {
    return {
      id: 'mature_relationship',
      emoji: '🤝',
      label: 'Relacionamento consolidado',
      hint: 'Cliente de longa data — base de confiança alta, terreno fértil para indicação e nova operação.',
      tone: 'opportunity',
    };
  }

  return null;
}
