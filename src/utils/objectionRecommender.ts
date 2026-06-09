/**
 * Contextual objection recommender — suggests likely objections
 * based on credit value, consortium type and contemplation status.
 */
import { OBJECTIONS, type Objection, type ObjectionCategory } from '@/data/objectionsLibrary';
import type { ConsortiumType } from '@/types/consortium';

interface RecommendationContext {
  creditValue: number;
  consortiumType: ConsortiumType;
  contemplated?: boolean;
  termMonths?: number;
}

interface ScoredObjection {
  objection: Objection;
  score: number;
  reason: string;
}

const CATEGORY_WEIGHTS: Partial<Record<ObjectionCategory, (ctx: RecommendationContext) => { score: number; reason: string } | null>> = {
  preco: (ctx) => {
    if (ctx.creditValue >= 200000) return { score: 90, reason: 'Valor alto — preço é objeção comum' };
    if (ctx.creditValue >= 100000) return { score: 60, reason: 'Valor médio-alto' };
    return { score: 30, reason: 'Valor menor' };
  },
  tempo: (ctx) => {
    if ((ctx.termMonths ?? 0) >= 180) return { score: 85, reason: 'Prazo longo (≥180 meses)' };
    if ((ctx.termMonths ?? 0) >= 120) return { score: 60, reason: 'Prazo médio-longo' };
    return null;
  },
  contemplacao: (ctx) => {
    if (!ctx.contemplated) return { score: 80, reason: 'Sem contemplação simulada — dúvidas prováveis' };
    return { score: 40, reason: 'Contemplação já simulada' };
  },
  financiamento: (ctx) => {
    if (ctx.consortiumType === 'imobiliario') return { score: 85, reason: 'Imobiliário — comparação com financiamento é frequente' };
    if (ctx.consortiumType === 'auto') return { score: 70, reason: 'Veículos — clientes comparam com financiamento' };
    return { score: 50, reason: 'Pesados' };
  },
  lance: (ctx) => {
    if (ctx.creditValue >= 150000) return { score: 75, reason: 'Valor alto — lance embutido é relevante' };
    return { score: 40, reason: 'Valor menor' };
  },
  urgencia: (ctx) => {
    if (ctx.consortiumType === 'auto') return { score: 80, reason: 'Veículos — urgência comum' };
    return { score: 45, reason: 'Urgência menos provável' };
  },
  confianca: () => ({ score: 65, reason: 'Objeção universal' }),
  entendimento: () => ({ score: 55, reason: 'Complexidade do consórcio' }),
  risco: () => ({ score: 50, reason: 'Medo natural' }),
  financeiro: (ctx) => {
    if (ctx.creditValue >= 300000) return { score: 70, reason: 'Valor muito alto — situação financeira em foco' };
    return { score: 35, reason: 'Valor acessível' };
  },
};

/**
 * Returns top N recommended objections ranked by contextual relevance.
 */
export function getContextualObjections(ctx: RecommendationContext, limit = 5): ScoredObjection[] {
  const scored: ScoredObjection[] = [];

  for (const obj of OBJECTIONS) {
    const weightFn = CATEGORY_WEIGHTS[obj.category];
    const result = weightFn?.(ctx);
    if (result && result.score > 0) {
      scored.push({ objection: obj, score: result.score, reason: result.reason });
    }
  }

  // Deduplicate by category — pick highest-scored per category, then mix
  const byCategory = new Map<ObjectionCategory, ScoredObjection[]>();
  for (const s of scored) {
    const arr = byCategory.get(s.objection.category) ?? [];
    arr.push(s);
    byCategory.set(s.objection.category, arr);
  }

  // Pick top 1 from each category, sorted by category score
  const categoryPicks: ScoredObjection[] = [];
  for (const [, items] of byCategory) {
    items.sort((a, b) => b.score - a.score);
    if (items[0]) categoryPicks.push(items[0]);
  }

  // Sort by score descending, take top N
  categoryPicks.sort((a, b) => b.score - a.score);
  return categoryPicks.slice(0, limit);
}
