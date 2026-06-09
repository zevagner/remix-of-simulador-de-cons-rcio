/**
 * Normalização e validação de status de proposta.
 * Política da Onda 3: NÃO mascarar valores inválidos. Sempre devolver `valid`
 * para que a UI possa exibi-los como itens com problema (CTA "Reportar").
 */
import type { ProposalStatus } from '@/services/proposals';
import { logger } from './logger';

const VALID: ReadonlySet<string> = new Set([
  'prospeccao', 'aguardando_retorno', 'em_avaliacao',
  'proposta_ajustada', 'fechado', 'perdido',
]);

/** Mapeamento explícito de valores antigos (pré-Onda 2) para o enum atual. */
const LEGACY_MAP: Record<string, ProposalStatus> = {
  enviado: 'aguardando_retorno',
  em_negociacao: 'em_avaliacao',
  novo: 'prospeccao',
  contato: 'prospeccao',
  follow_up: 'aguardando_retorno',
  ganho: 'fechado',
  cancelado: 'perdido',
};

export interface NormalizedStatus {
  /** Status efetivo a usar na UI quando o lead é renderizável. */
  status: ProposalStatus;
  /** True se o status original era válido OU mapeado de legado conhecido. */
  valid: boolean;
  /** True somente quando o valor era totalmente desconhecido (problema real). */
  unknown: boolean;
  /** Valor original para diagnóstico. */
  raw: string;
}

/**
 * Classifica e normaliza. NÃO mascara silenciosamente:
 *   - valor válido       → {valid:true,  unknown:false}
 *   - valor legado mapa  → {valid:true,  unknown:false} (migração transparente)
 *   - desconhecido       → {valid:false, unknown:true}  (UI deve isolar)
 */
export function classifyProposalStatus(raw: string | null | undefined): NormalizedStatus {
  const value = (raw ?? '').toString();

  if (VALID.has(value)) {
    return { status: value as ProposalStatus, valid: true, unknown: false, raw: value };
  }

  const mapped = LEGACY_MAP[value];
  if (mapped) {
    return { status: mapped, valid: true, unknown: false, raw: value };
  }

  // Valor desconhecido: NÃO mascarar. Loga e reporta como inválido.
  logger.error('[proposalStatus] valor desconhecido detectado', { raw: value });
  return { status: 'prospeccao', valid: false, unknown: true, raw: value };
}

/** Compat: helper antigo que sempre devolvia status válido. Continua útil
 *  internamente para o engine de scoring, que precisa de um valor utilizável. */
export function normalizeProposalStatus(raw: string | null | undefined): ProposalStatus {
  return classifyProposalStatus(raw).status;
}
