/**
 * Unified Sales Copy Engine
 * 
 * Central function for all commercial text generation.
 * Two modes:
 *   - "proposta": full AIDA/PAS structure for closing (used by ProposalModule)
 *   - "estudo_lances": short, interest-driven for opening conversations (used by BidsModule)
 * 
 * Shared copy patterns ensure consistent brand voice across modules.
 */

import { applyBusinessRules } from '@/services/proposals/businessRulesEnricher';

// ─── Shared copy pools ───

const GREETINGS = [
  (name: string) => `Olá${name ? `, ${name}` : ''}! 👋`,
  (name: string) => `${name ? `${name}, tudo bem` : 'Tudo bem'}? 😊`,
  (name: string) => `Oi${name ? `, ${name}` : ''}! 👋`,
];

const TREND_CONTEXT = {
  queda: [
    (months: number) => `📊 Analisei as últimas *${months} assembleias* e tenho uma ótima notícia: *os lances estão caindo*.\n\nIsso significa que está ficando mais barato ser contemplado.`,
    (months: number) => `📊 O cenário está muito favorável: nas últimas *${months} assembleias*, *os lances vêm diminuindo* mês a mês.\n\nAs chances de contemplação com valores menores estão aumentando.`,
    (months: number) => `📊 Os números das últimas *${months} assembleias* mostram uma tendência clara: *lances em queda*.\n\nEsse é o tipo de momento que a gente espera para agir.`,
  ],
  alta: [
    (months: number) => `📊 Nas últimas *${months} assembleias*, percebi que *os lances estão subindo*.\n\nO grupo está mais competitivo, mas com a estratégia certa ainda dá pra aproveitar.`,
    (months: number) => `📊 Os dados das últimas *${months} assembleias* mostram *lances em alta*.\n\nÉ importante ter uma boa estratégia nesse momento para não pagar mais do que o necessário.`,
  ],
  estavel: [
    (months: number) => `📊 As últimas *${months} assembleias* mostram um cenário *estável e previsível*.\n\nIsso é bom porque permite planejar o lance com mais segurança.`,
    (months: number) => `📊 Comportamento *consistente* nos lances das últimas *${months} assembleias*.\n\nUm cenário assim facilita bastante o planejamento.`,
  ],
} as const;

const OPPORTUNITY = {
  queda: [
    '✅ *Janela de oportunidade aberta.* Quando os lances caem, quem age rápido consegue ser contemplado investindo menos.',
    '✅ *Momento ideal para agir.* Com lances em queda, o custo para ser contemplado está mais acessível.',
  ],
  alta: [
    '⚠️ *O momento pede atenção.* A estratégia certa faz toda diferença quando os lances estão subindo.',
    '⚠️ *Planejamento é essencial agora.* Escolher a faixa certa de lance evita surpresas.',
  ],
  estavel: [
    '💡 *Cenário previsível é oportunidade.* Você consegue calcular com mais precisão o lance ideal.',
    '💡 *A estabilidade permite estratégia calculada.* É possível escolher exatamente a faixa que faz sentido.',
  ],
} as const;

const MICRO_URGENCY = [
  'As condições desse grupo estão muito boas nesse momento.',
  'Vi que esse plano está em um patamar interessante agora.',
  'Esse tipo de oportunidade aparece em janelas específicas.',
  'As assembleias mais recentes mostram um cenário bem favorável.',
];

// ─── CTAs por contexto ───

const CTA_BIDS = [
  (name: string) => `Quer que eu simule esse cenário pra você${name ? `, ${name}` : ''}? Posso te mostrar exatamente quanto ficaria. 🚀`,
  (name: string) => `${name ? `${name}, p` : 'P'}osso preparar uma simulação personalizada agora mesmo. É só me chamar! 💬`,
  (name: string) => `Faz sentido a gente avançar com uma simulação${name ? `, ${name}` : ''}? Te mostro os números na hora. 📋`,
];

const CTA_PROPOSAL_DIRECT = [
  (name: string) => `Quer que eu já veja o melhor grupo pra você${name ? `, ${name}` : ''}?`,
  (name: string) => `Faz sentido avançar com essa estratégia${name ? `, ${name}` : ''}?`,
  (name: string) => `Posso reservar uma posição pra você${name ? `, ${name}` : ''}?`,
  (name: string) => `Quer que eu te passe os próximos passos${name ? `, ${name}` : ''}?`,
];

const CTA_PROPOSAL_EXPLAIN = [
  (name: string) => `Ficou alguma dúvida${name ? `, ${name}` : ''}? Me manda aqui que eu explico.\nSe estiver alinhado, o próximo passo é simples.`,
  (name: string) => `Quer que eu detalhe algum ponto${name ? `, ${name}` : ''}?\nSe já fez sentido, posso te passar o que precisa pra começar.`,
];

const CTA_PROPOSAL_CONSULT = [
  (name: string) => `Não precisa decidir agora${name ? `, ${name}` : ''}.\nMas se fez sentido, me chama que damos o próximo passo juntos. 💬`,
  (name: string) => `Pensa com calma${name ? `, ${name}` : ''}.\nQuando quiser, é só me chamar que a gente organiza tudo. 💬`,
];

// ─── Helpers ───

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function formatBidPercent(val: number): string {
  return `${val.toFixed(2)}%`;
}

// ─── Types ───

export type SalesMode = 'proposta' | 'estudo_lances';

export interface SalesArgumentContext {
  mode: SalesMode;

  // Common
  clientName?: string;
  variation?: number;

  // Bids study context
  groupNumber?: string | number;
  trend?: 'queda' | 'alta' | 'estavel';
  predominance?: 'sorteio' | 'lance' | 'equilibrado';
  conservadoraBid?: number;
  equilibradaBid?: number;
  riskLevel?: 'baixo' | 'medio' | 'alto';
  months?: number;
  hasEmbeddedBid?: boolean;
  embeddedBidMaxPercent?: number;
  creditRange?: string;
  clientBid?: number;
  monteCarloProbability?: number | null;
  compact?: boolean;

  // Proposal context (only for mode "proposta")
  tone?: 0 | 1 | 2; // direta, explicativa, consultiva
  clientObjective?: string;
  clientSituation?: string;

  // Business rules (applied as final enrichment, regardless of mode)
  reducedInstallment?: boolean;
}

export interface SalesArgumentResult {
  text: string;
  highlights: string[];
}

// ─── Main generator ───

export function generateSalesArgument(ctx: SalesArgumentContext): SalesArgumentResult {
  const result = ctx.mode === 'estudo_lances'
    ? generateBidsArgument(ctx)
    : generateProposalArgument(ctx);
  return {
    text: applyBusinessRules(result.text, {
      reducedInstallment: ctx.reducedInstallment,
      format: 'whatsapp',
    }),
    highlights: result.highlights,
  };
}

// ─── Bids mode ───

function generateBidsArgument(ctx: SalesArgumentContext): SalesArgumentResult {
  const {
    clientName = '', groupNumber = '', trend = 'estavel',
    predominance, conservadoraBid = 0, equilibradaBid = 0,
    riskLevel, months = 6, hasEmbeddedBid, embeddedBidMaxPercent = 0,
    creditRange = '', clientBid = 0, monteCarloProbability,
    variation = 0, compact,
  } = ctx;

  const name = clientName.trim();
  const highlights: string[] = [];
  const lines: string[] = [];

  // Greeting — shared pool
  lines.push(pick(GREETINGS, variation)(name));
  lines.push('');

  const trendHighlight = trend === 'queda' ? '📉 Lances em queda'
    : trend === 'alta' ? '📈 Lances em alta' : '➡️ Cenário estável';

  // COMPACT MODE
  if (compact) {
    const trendLabel = trend === 'queda' ? 'em queda 📉' : trend === 'alta' ? 'em alta 📈' : 'estáveis ➡️';
    lines.push(`🏷️ *Grupo ${groupNumber}* — Crédito *R$ ${creditRange}*`);
    lines.push(`📊 Lances ${trendLabel} nas últimas ${months} assembleias.`);
    lines.push('');
    lines.push(`🎯 *Faixa ideal:* ${formatBidPercent(equilibradaBid)} a ${formatBidPercent(conservadoraBid)}`);
    if (hasEmbeddedBid) lines.push(`💡 Lance embutido até ${embeddedBidMaxPercent}% disponível.`);
    if (clientBid > 0 && monteCarloProbability != null) {
      lines.push(`📌 Lance de ${clientBid.toFixed(2)}% → *${monteCarloProbability.toFixed(1)}%* de chance.`);
    }
    lines.push('');
    lines.push(pick(CTA_BIDS, variation + 1)(name));
    highlights.push(trendHighlight);
    highlights.push(`Faixa: ${formatBidPercent(equilibradaBid)} a ${formatBidPercent(conservadoraBid)}`);
    return { text: lines.join('\n'), highlights };
  }

  // Context — shared trend copy
  lines.push(pick(TREND_CONTEXT[trend], variation)(months));
  highlights.push(trendHighlight);
  lines.push('');

  // Group info
  lines.push(`🏷️ *Grupo ${groupNumber}* — Crédito de *R$ ${creditRange}*`);
  lines.push('');

  // Opportunity — shared pool
  lines.push(pick(OPPORTUNITY[trend], variation));
  lines.push('');

  // Predominance bonus
  if (predominance === 'sorteio') {
    lines.push('🎲 E tem mais: esse grupo tem um histórico forte de contemplação por *sorteio*. Ou seja, mesmo sem dar lance, você tem chances reais.');
    highlights.push('🎲 Forte por sorteio');
    lines.push('');
  }

  // Bid range
  lines.push(`🎯 *Faixa ideal de lance hoje:*\n• Equilibrado: *${formatBidPercent(equilibradaBid)}*\n• Conservador: *${formatBidPercent(conservadoraBid)}*`);
  highlights.push(`Faixa: ${formatBidPercent(equilibradaBid)} a ${formatBidPercent(conservadoraBid)}`);
  lines.push('');

  // Risk
  if (riskLevel === 'baixo') {
    lines.push('🟢 O risco atual é *baixo*, com dados consistentes e previsíveis.');
    highlights.push('Risco baixo');
  } else if (riskLevel === 'medio') {
    lines.push('🟡 Risco *moderado* — vale acompanhar de perto as próximas assembleias.');
  } else if (riskLevel === 'alto') {
    lines.push('🔴 O grupo tem mostrado *alguma volatilidade* — recomendo cautela na escolha do lance.');
  }
  lines.push('');

  // Embedded bid
  if (hasEmbeddedBid) {
    lines.push(`💡 Esse grupo permite *lance embutido de até ${embeddedBidMaxPercent}%*, ou seja, você pode ofertar lance sem tirar nada do bolso.`);
    highlights.push(`Embutido até ${embeddedBidMaxPercent}%`);
    lines.push('');
  }

  // Client bid + probability
  if (clientBid > 0 && monteCarloProbability != null) {
    lines.push(`📌 Simulei um lance de *${clientBid.toFixed(2)}%* e a probabilidade estimada de contemplação é de *${monteCarloProbability.toFixed(1)}%*, com base no histórico do grupo.`);
    highlights.push(`${clientBid.toFixed(2)}% → ${monteCarloProbability.toFixed(1)}%`);
    lines.push('');
  }

  // Micro-urgency — shared pool
  const urgency = pick(MICRO_URGENCY, new Date().getDate());
  lines.push(`💡 _${urgency}_`);
  lines.push('');

  // CTA — bids-specific (drives to simulation)
  lines.push(pick(CTA_BIDS, variation + 1)(name));

  return { text: lines.join('\n'), highlights };
}

// ─── Proposal mode (delegates to proposalTemplates for full AIDA) ───

function generateProposalArgument(ctx: SalesArgumentContext): SalesArgumentResult {
  // For proposal mode, the full template engine handles it.
  // This wrapper adds trend-aware opening when bids data is available.
  const highlights: string[] = [];
  const lines: string[] = [];
  const name = (ctx.clientName || '').trim();
  const variation = ctx.variation || 0;

  lines.push(pick(GREETINGS, variation)(name));
  lines.push('');

  // If we have trend data, add context
  if (ctx.trend && ctx.months) {
    lines.push(pick(TREND_CONTEXT[ctx.trend], variation)(ctx.months));
    const trendHighlight = ctx.trend === 'queda' ? '📉 Lances em queda'
      : ctx.trend === 'alta' ? '📈 Lances em alta' : '➡️ Cenário estável';
    highlights.push(trendHighlight);
    lines.push('');
  }

  if (ctx.groupNumber && ctx.creditRange) {
    lines.push(`🏷️ *Grupo ${ctx.groupNumber}* — Crédito de *R$ ${ctx.creditRange}*`);
    lines.push('');
  }

  if (ctx.trend) {
    lines.push(pick(OPPORTUNITY[ctx.trend], variation));
    lines.push('');
  }

  if (ctx.equilibradaBid && ctx.conservadoraBid) {
    lines.push(`🎯 *Faixa ideal de lance:*\n• Equilibrado: *${formatBidPercent(ctx.equilibradaBid)}*\n• Conservador: *${formatBidPercent(ctx.conservadoraBid)}*`);
    highlights.push(`Faixa: ${formatBidPercent(ctx.equilibradaBid)} a ${formatBidPercent(ctx.conservadoraBid)}`);
    lines.push('');
  }

  // Micro-urgency
  const urgency = pick(MICRO_URGENCY, new Date().getDate());
  lines.push(`💡 _${urgency}_`);
  lines.push('');

  // CTA — proposal-specific (drives to closing)
  const tone = ctx.tone ?? 0;
  const ctaPool = tone === 0 ? CTA_PROPOSAL_DIRECT : tone === 1 ? CTA_PROPOSAL_EXPLAIN : CTA_PROPOSAL_CONSULT;
  lines.push(pick(ctaPool, new Date().getDate())(name));

  return { text: lines.join('\n'), highlights };
}

// Re-export strip helper
export function stripFormatting(text: string): string {
  return text.replace(/\*/g, '');
}
