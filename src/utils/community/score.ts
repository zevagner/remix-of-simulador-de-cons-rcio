/**
 * Community engagement score & level
 *
 * Score determinístico:
 *   score = (simulações * 2) + (propostas * 5) + (dias ativos * 3)
 *         + (uso da IA * 2) + (respostas úteis recebidas * 4)
 *
 * Níveis:
 *   1 — Iniciante       (score < 50)
 *   2 — Ativo           (score ≥ 50)   → pode criar casos
 *   3 — Colaborador     (score ≥ 120)  → pode responder
 *   4 — Referência      (score ≥ 250)  → respostas destacadas
 *
 * O cálculo definitivo é feito no backend por
 * `community_recompute_engagement(uuid)`. Este módulo replica a lógica
 * apenas para classificação local quando já temos `score`.
 */

export type CommunityLevel = 1 | 2 | 3 | 4;

export const LEVEL_THRESHOLDS: Record<CommunityLevel, number> = {
  1: 0,
  2: 50,
  3: 120,
  4: 250,
};

export const LEVEL_LABEL: Record<CommunityLevel, string> = {
  1: 'Iniciante',
  2: 'Ativo',
  3: 'Colaborador',
  4: 'Referência',
};

export const LEVEL_DESCRIPTION: Record<CommunityLevel, string> = {
  1: 'Use o simulador e crie propostas para liberar a Comunidade.',
  2: 'Você pode criar casos e pedir ajuda da comunidade.',
  3: 'Você pode responder casos e colaborar com outros consultores.',
  4: 'Suas respostas têm destaque por consistência e qualidade.',
};

/** Pesos (mantenha alinhado com community_recompute_engagement). */
export const SCORE_WEIGHTS = {
  simulation: 2,
  proposal: 5,
  activeDay: 3,
  aiUsage: 2,
  helpfulReceived: 4,
} as const;

export interface EngagementBreakdown {
  simulationsCount: number;
  proposalsCount: number;
  activeDaysCount: number;
  aiUsageCount: number;
  helpfulRepliesCount: number;
}

/** Score local a partir do breakdown (para previews). */
export function computeScore(b: EngagementBreakdown): number {
  return (
    b.simulationsCount * SCORE_WEIGHTS.simulation +
    b.proposalsCount * SCORE_WEIGHTS.proposal +
    b.activeDaysCount * SCORE_WEIGHTS.activeDay +
    b.aiUsageCount * SCORE_WEIGHTS.aiUsage +
    b.helpfulRepliesCount * SCORE_WEIGHTS.helpfulReceived
  );
}

export function levelFromScore(score: number): CommunityLevel {
  if (score >= LEVEL_THRESHOLDS[4]) return 4;
  if (score >= LEVEL_THRESHOLDS[3]) return 3;
  if (score >= LEVEL_THRESHOLDS[2]) return 2;
  return 1;
}

/** Próximo nível e quanto falta. Retorna null no nível máximo. */
export function levelProgress(score: number): {
  current: CommunityLevel;
  next: CommunityLevel | null;
  pointsToNext: number;
  /** 0–1 do progresso dentro do nível atual. */
  ratio: number;
} {
  const current = levelFromScore(score);
  if (current === 4) return { current, next: null, pointsToNext: 0, ratio: 1 };
  const next = (current + 1) as CommunityLevel;
  const base = LEVEL_THRESHOLDS[current];
  const target = LEVEL_THRESHOLDS[next];
  const pointsToNext = Math.max(target - score, 0);
  const ratio = Math.min(Math.max((score - base) / (target - base), 0), 1);
  return { current, next, pointsToNext, ratio };
}

/** Permissões derivadas do nível. */
export interface CommunityPermissions {
  canViewCommunity: boolean;
  canCreateCases: boolean;
  canReply: boolean;
  canVote: boolean;
  isReference: boolean;
}

export function permissionsFor(level: CommunityLevel): CommunityPermissions {
  return {
    canViewCommunity: true,
    // Onda 2 revitalização: qualquer usuário autenticado/aprovado pode criar, responder e votar.
    // Níveis continuam visíveis como reputação (gatekeeping apenas para casos privados).
    canCreateCases: level >= 1,
    canReply: level >= 1,
    canVote: level >= 1,
    isReference: level === 4,
  };
}
