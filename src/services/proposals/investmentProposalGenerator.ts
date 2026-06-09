/**
 * Investment proposal generator — creates WhatsApp-ready comparative proposals.
 */
import { formatCurrency } from '@/core/finance';
import { DISCLAIMERS } from '@/config/copy';

export interface InvestmentScenarioData {
  id: string;
  name: string;
  totalPaid: number;
  finalResult: number;
  absoluteGain: number;
  percentGain: number;
  details: string;
}

interface InvestmentProposalContext {
  creditValue: number;
  termMonths: number;
  installment: number;
  scenarios: InvestmentScenarioData[];
}

const SCENARIO_SUMMARIES: Record<string, (ctx: InvestmentProposalContext, s: InvestmentScenarioData) => string> = {
  investment: (ctx, s) =>
    `Aplicando mensalmente *${formatCurrency(ctx.installment)}* em renda fixa (100% CDI) por ${ctx.termMonths} meses, o resultado líquido estimado seria *${formatCurrency(s.finalResult)}*. Ganho estimado de *${s.percentGain.toFixed(1)}%*.`,

  traditional: (ctx, s) =>
    `Após contemplação, o imóvel de *${formatCurrency(ctx.creditValue)}* tende a se valorizar. Patrimônio estimado ao final do prazo: *${formatCurrency(s.finalResult)}*. Resultado estimado: *${s.absoluteGain >= 0 ? '+' : ''}${formatCurrency(s.absoluteGain)}* (${s.percentGain.toFixed(1)}%).`,

  sale: (_ctx, s) =>
    `Com a venda da cota/carta, o resultado estimado é *${formatCurrency(s.finalResult)}* sobre um investimento de *${formatCurrency(s.totalPaid)}*. Retorno estimado: *${s.percentGain.toFixed(1)}%*.`,

  rental: (ctx, s) =>
    `Adquirindo o imóvel e colocando para locação, o resultado total estimado (imóvel + aluguéis) é *${formatCurrency(s.finalResult)}*. Rentabilidade estimada: *${s.percentGain.toFixed(1)}%*.`,

  'quick-contemplation': (ctx, s) =>
    `Após contemplação, a carta de *${formatCurrency(ctx.creditValue)}* aplicada em renda fixa geraria um resultado líquido estimado de *${formatCurrency(s.finalResult)}*. Ganho estimado: *${s.percentGain.toFixed(1)}%*.`,

};

const SCENARIO_EMOJI: Record<string, string> = {
  investment: '📈',
  traditional: '🏠',
  sale: '💰',
  rental: '🏢',
  'quick-contemplation': '💎',
};

export function generateInvestmentProposal(ctx: InvestmentProposalContext): string {
  const { scenarios } = ctx;
  const isSingle = scenarios.length === 1;

  // ─── Abertura ───
  const lines: string[] = [];

  if (isSingle) {
    lines.push(`👋 Olá!\n\nAnalisei uma estratégia de investimento via consórcio para uma carta de *${formatCurrency(ctx.creditValue)}* em *${ctx.termMonths} meses*.\n\nVeja o cenário:`);
  } else {
    lines.push(`👋 Olá!\n\nPreparei *${scenarios.length} estratégias* de investimento via consórcio para você avaliar.\n\nCarta de crédito: *${formatCurrency(ctx.creditValue)}*\nPrazo: *${ctx.termMonths} meses*\nParcela estimada: *${formatCurrency(ctx.installment)}*`);
  }

  // ─── Blocos por cenário ───
  scenarios.forEach((s, i) => {
    const emoji = SCENARIO_EMOJI[s.id] || '📊';
    const summaryFn = SCENARIO_SUMMARIES[s.id];
    const summary = summaryFn ? summaryFn(ctx, s) : `Resultado estimado: *${formatCurrency(s.finalResult)}* (${s.percentGain.toFixed(1)}%).`;

    lines.push('');
    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`${emoji} *${isSingle ? '' : `Opção ${i + 1}: `}${s.name}*`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push('');
    lines.push(summary);
    lines.push('');
    lines.push(`📊 Investido: *${formatCurrency(s.totalPaid)}*`);
    lines.push(`📊 Resultado: *${formatCurrency(s.finalResult)}*`);
    lines.push(`${s.absoluteGain >= 0 ? '✅' : '⚠️'} Diferença: *${s.absoluteGain >= 0 ? '+' : ''}${formatCurrency(s.absoluteGain)}* (${s.percentGain.toFixed(1)}%)`);
  });

  // ─── Comparativo (apenas se múltiplos) ───
  if (scenarios.length > 1) {
    const best = scenarios.reduce((a, b) => a.percentGain > b.percentGain ? a : b);
    const safest = scenarios.reduce((a, b) => {
      // "safest" = menor risco = menor variação de ganho (mais próximo de zero positivo)
      const aScore = a.absoluteGain >= 0 ? a.percentGain : 1000;
      const bScore = b.absoluteGain >= 0 ? b.percentGain : 1000;
      return aScore < bScore ? a : b;
    });

    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push('⚖️ *Comparativo Rápido*');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push(`🏆 Maior retorno estimado: *${best.name}* (${best.percentGain.toFixed(1)}%)`);
    if (safest.id !== best.id) {
      lines.push(`🛡️ Mais conservador: *${safest.name}* (${safest.percentGain.toFixed(1)}%)`);
    }
    lines.push('');
    lines.push('_Cada cenário tem premissas diferentes. O ideal depende do seu perfil e objetivo._');
  }

  // ─── Fechamento ───
  lines.push('');
  if (isSingle) {
    lines.push(`Se fizer sentido, podemos avançar com essa estratégia. Fico à disposição! 🤝`);
  } else {
    lines.push(`Podemos seguir com o cenário que fizer mais sentido para você. Qual chamou mais atenção? 🤝`);
  }

  lines.push('');
  lines.push(DISCLAIMERS.WHATSAPP_INVESTMENT);

  return lines.join('\n');
}
