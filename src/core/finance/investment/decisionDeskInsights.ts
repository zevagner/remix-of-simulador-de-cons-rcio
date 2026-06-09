/**
 * ════════════════════════════════════════════════════════════════════════════
 * DECISION DESK INSIGHTS — ranking determinístico multi-estratégia
 * (Onda Patrimonial Decision Desk)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Princípios:
 *   • Consumer-only: usa projectPatrimonialTimeline já existente.
 *   • Determinístico, idempotente, zero IA.
 *   • Tom institucional: "melhor para…", nunca "garantido".
 *   • Sem ranking-milagroso: escolhas qualificadas + disclaimer.
 *   • Sem motor financeiro novo.
 * ════════════════════════════════════════════════════════════════════════════
 */
import {
  projectPatrimonialTimeline,
  type PatrimonialArchetype,
  type TimelineMilestone,
} from './patrimonialTimeline';

export type DecisionProfile =
  | 'conservador'
  | 'crescimento'
  | 'renda'
  | 'multiplicacao'
  | 'equilibrio'
  | 'longo-prazo';

export type DecisionInsight =
  | 'maior-multiplicacao'
  | 'menor-capital-imobilizado'
  | 'melhor-preservacao-liquidez'
  | 'maior-aceleracao'
  | 'melhor-equilibrio';

export interface ProfileWinner {
  profile: DecisionProfile;
  label: string;            // "Melhor para conservador"
  archetype: PatrimonialArchetype;
  rationale: string;        // 1 linha consultiva
  headlineMetric: string;   // ex.: "Multiplicador 3,4× em 15a"
}

export interface InsightCallout {
  insight: DecisionInsight;
  label: string;            // "Maior multiplicação patrimonial"
  archetype: PatrimonialArchetype;
  metric: string;           // ex.: "3,4× capital aportado"
  rationale: string;        // 1 linha consultiva
}

export interface DecisionDeskAggregate {
  archetype: PatrimonialArchetype;
  m5: TimelineMilestone | undefined;
  m10: TimelineMilestone | undefined;
  m15: TimelineMilestone | undefined;
  /** Aceleração: Δ patrimônio (5→15) ÷ patrimônio Y5. */
  accelerationRatio: number;
  /** Liquidez score: preserved Y10 ÷ controlledAsset Y10. */
  liquidityScore: number;
  /** Equilíbrio: média normalizada (mult, liquidez, renda). */
  balanceScore: number;
}

export interface DecisionDeskResult {
  byProfile: ProfileWinner[];
  insights: InsightCallout[];
  aggregates: DecisionDeskAggregate[];
}

interface BuildInput {
  creditValue: number;
  ownCapitalInvested: number;
  preservedCapital?: number;
}

const ALL_ARCHETYPES: PatrimonialArchetype[] = [
  'autoquitacao',
  'escada-patrimonial',
  'renda-passiva',
  'construcao-inteligente',
  'multiplicacao-ativos',
  'holding-sucessao',
];

const ARCHETYPE_TITLE: Record<PatrimonialArchetype, string> = {
  'autoquitacao': 'Autoquitação',
  'escada-patrimonial': 'Escada Patrimonial',
  'renda-passiva': 'Renda Passiva Estruturada',
  'construcao-inteligente': 'Construção Inteligente',
  'multiplicacao-ativos': 'Multiplicação de Ativos',
  'holding-sucessao': 'Holding & Sucessão',
};

const fmtBRL = (v: number): string => {
  if (!Number.isFinite(v) || v <= 0) return 'R$ 0';
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(2).replace('.', ',')} mi`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)} mil`;
  return `R$ ${Math.round(v)}`;
};

const fmtMult = (v: number) => `${v.toFixed(2).replace('.', ',')}×`;

export function buildDecisionDesk(inp: BuildInput): DecisionDeskResult | null {
  const { creditValue, ownCapitalInvested, preservedCapital = 0 } = inp;
  if (!Number.isFinite(creditValue) || creditValue <= 0) return null;
  if (!Number.isFinite(ownCapitalInvested) || ownCapitalInvested <= 0) return null;

  // 1) Projetar todos os arquétipos.
  const aggregates: DecisionDeskAggregate[] = ALL_ARCHETYPES.map((a) => {
    const milestones = projectPatrimonialTimeline({
      archetype: a,
      creditValue,
      ownCapitalInvested,
      preservedCapital,
    });
    const m5 = milestones.find((m) => m.year === 5);
    const m10 = milestones.find((m) => m.year === 10);
    const m15 = milestones.find((m) => m.year === 15);

    const p5 = m5?.controlledAsset ?? 0;
    const p15 = m15?.controlledAsset ?? 0;
    const accelerationRatio = p5 > 0 ? (p15 - p5) / p5 : 0;

    const c10 = m10?.controlledAsset ?? 0;
    const pres10 = m10?.preservedCapital ?? 0;
    const liquidityScore = c10 > 0 ? pres10 / (c10 + pres10) : 0;

    // Normalização leve para equilíbrio: mult/4, liquidez (0-1), renda/c10.
    const mult15 = m15?.multiplier ?? 0;
    const inc15 = m15?.annualIncome ?? 0;
    const c15 = m15?.controlledAsset ?? 1;
    const incomeYield = c15 > 0 ? Math.min(inc15 / c15, 0.15) / 0.15 : 0;
    const balanceScore =
      Math.min(mult15 / 4, 1) * 0.4 + liquidityScore * 0.3 + incomeYield * 0.3;

    return { archetype: a, m5, m10, m15, accelerationRatio, liquidityScore, balanceScore };
  });

  const byArchetype = new Map(aggregates.map((a) => [a.archetype, a]));

  // 2) Vencedores por perfil — escolha qualificada (não puro argmax).
  const pick = (
    profile: DecisionProfile,
    label: string,
    archetype: PatrimonialArchetype,
    rationale: string,
    headline: (a: DecisionDeskAggregate) => string,
  ): ProfileWinner => ({
    profile,
    label,
    archetype,
    rationale,
    headlineMetric: headline(byArchetype.get(archetype)!),
  });

  // Conservador → maior preservação Y10 entre arquétipos não-alavancados.
  const conservadorPool = aggregates.filter((a) =>
    ['autoquitacao', 'renda-passiva', 'holding-sucessao'].includes(a.archetype),
  );
  const conservadorWin =
    conservadorPool.sort((a, b) => b.liquidityScore - a.liquidityScore)[0]?.archetype ??
    'holding-sucessao';

  // Crescimento → maior multiplicador Y15.
  const crescimentoWin =
    [...aggregates].sort(
      (a, b) => (b.m15?.multiplier ?? 0) - (a.m15?.multiplier ?? 0),
    )[0]?.archetype ?? 'multiplicacao-ativos';

  // Renda → maior renda anual Y10.
  const rendaWin =
    [...aggregates].sort(
      (a, b) => (b.m10?.annualIncome ?? 0) - (a.m10?.annualIncome ?? 0),
    )[0]?.archetype ?? 'renda-passiva';

  // Multiplicação → maior multiplicador Y15 entre alavancados.
  const multipPool = aggregates.filter((a) =>
    ['multiplicacao-ativos', 'escada-patrimonial', 'construcao-inteligente'].includes(a.archetype),
  );
  const multipWin =
    multipPool.sort((a, b) => (b.m15?.multiplier ?? 0) - (a.m15?.multiplier ?? 0))[0]?.archetype ??
    'multiplicacao-ativos';

  // Equilíbrio → melhor balanceScore.
  const equilibrioWin =
    [...aggregates].sort((a, b) => b.balanceScore - a.balanceScore)[0]?.archetype ??
    'autoquitacao';

  // Longo prazo → maior patrimônio Y15 absoluto.
  const longoWin =
    [...aggregates].sort(
      (a, b) => (b.m15?.controlledAsset ?? 0) - (a.m15?.controlledAsset ?? 0),
    )[0]?.archetype ?? 'escada-patrimonial';

  const byProfile: ProfileWinner[] = [
    pick('conservador', 'Melhor para perfil conservador', conservadorWin,
      'Maior preservação de liquidez no horizonte de 10 anos.',
      (a) => `Preservado ${fmtBRL(a.m10?.preservedCapital ?? 0)} em 10a`),
    pick('crescimento', 'Melhor para crescimento', crescimentoWin,
      'Multiplicador patrimonial mais elevado no horizonte de 15 anos.',
      (a) => `Multiplicador ${fmtMult(a.m15?.multiplier ?? 0)} em 15a`),
    pick('renda', 'Melhor para geração de renda', rendaWin,
      'Maior fluxo recorrente projetado no horizonte de 10 anos.',
      (a) => `Renda anual ${fmtBRL(a.m10?.annualIncome ?? 0)} em 10a`),
    pick('multiplicacao', 'Melhor para multiplicação', multipWin,
      'Melhor relação patrimônio controlado vs capital aportado.',
      (a) => `Multiplicador ${fmtMult(a.m15?.multiplier ?? 0)} em 15a`),
    pick('equilibrio', 'Melhor equilíbrio', equilibrioWin,
      'Melhor combinação entre multiplicação, liquidez e renda.',
      (a) => `Patrimônio ${fmtBRL(a.m15?.controlledAsset ?? 0)} em 15a`),
    pick('longo-prazo', 'Melhor para longo prazo', longoWin,
      'Maior patrimônio bruto controlado no horizonte de 15 anos.',
      (a) => `Patrimônio ${fmtBRL(a.m15?.controlledAsset ?? 0)} em 15a`),
  ];

  // 3) Insights executivos curados (máx 5).
  const insights: InsightCallout[] = [
    {
      insight: 'maior-multiplicacao',
      label: 'Maior multiplicação patrimonial',
      archetype: crescimentoWin,
      metric: `${fmtMult(byArchetype.get(crescimentoWin)?.m15?.multiplier ?? 0)} em 15 anos`,
      rationale: `${ARCHETYPE_TITLE[crescimentoWin]} entrega o maior multiplicador entre as estratégias avaliadas.`,
    },
    {
      insight: 'melhor-preservacao-liquidez',
      label: 'Melhor preservação de liquidez',
      archetype: conservadorWin,
      metric: `${fmtBRL(byArchetype.get(conservadorWin)?.m10?.preservedCapital ?? 0)} em 10 anos`,
      rationale: `${ARCHETYPE_TITLE[conservadorWin]} mantém maior parcela do capital líquido investido em paralelo.`,
    },
    {
      insight: 'maior-aceleracao',
      label: 'Maior aceleração patrimonial',
      archetype:
        [...aggregates].sort((a, b) => b.accelerationRatio - a.accelerationRatio)[0]
          ?.archetype ?? 'escada-patrimonial',
      metric: (() => {
        const win = [...aggregates].sort((a, b) => b.accelerationRatio - a.accelerationRatio)[0];
        return win ? `+${Math.round(win.accelerationRatio * 100)}% entre 5 e 15 anos` : '';
      })(),
      rationale: 'Maior expansão patrimonial relativa entre o 5º e o 15º ano.',
    },
    {
      insight: 'menor-capital-imobilizado',
      label: 'Menor capital imobilizado',
      archetype: 'multiplicacao-ativos',
      metric: `${fmtBRL(byArchetype.get('multiplicacao-ativos')?.m10?.preservedCapital ?? 0)} preservados em 10a`,
      rationale: 'Lance embutido reduz o capital próprio comprometido na aquisição.',
    },
    {
      insight: 'melhor-equilibrio',
      label: 'Melhor equilíbrio risco / retorno',
      archetype: equilibrioWin,
      metric: `Patrimônio ${fmtBRL(byArchetype.get(equilibrioWin)?.m15?.controlledAsset ?? 0)} em 15a`,
      rationale: `${ARCHETYPE_TITLE[equilibrioWin]} combina multiplicação, renda e liquidez de forma equilibrada.`,
    },
  ];

  return { byProfile, insights, aggregates };
}

export const ARCHETYPE_TITLES = ARCHETYPE_TITLE;
