/**
 * Geração determinística de narrativa consultiva para a Proposta Premium.
 * Não chama IA — apenas monta frases curtas, concretas e de impacto, com base nos dados do contexto.
 *
 * REGRA: "Um PDF premium não informa. Ele conduz."
 *  - Frases curtas, com número forte.
 *  - Sempre conectar problema → solução → direção.
 *  - Evitar jargão técnico quando puder soar consultivo.
 */

import { formatCurrency } from '@/core/finance';
import type { DecisionOutput } from '@/utils/decisionEngine';

export interface NarrativeContext {
  clientName: string;
  managerName: string;
  objetivo?: string;
  subObjetivo?: string;
  capacidadeMensal: number;
  temCapital: boolean;
  capitalDisponivel: number;
  creditValue: number;
  termMonths: number;
  installment: number;
  effectiveClientCost: number;
  recommendation: DecisionOutput | null;
  /**
   * Reajuste INPC anual aplicado na simulação (% a.a.).
   * 0 = sem reajuste (padrão CAIXA). >0 = projeção consultiva opcional.
   */
  annualAdjustmentPercent?: number;
}

/**
 * Bloco de aviso INPC para narrativa/PDF.
 * Retorna `null` quando o reajuste está desligado (não deve ser exibido).
 */
export function inpcNoteBlock(ctx: NarrativeContext): {
  ativo: boolean;
  percentual: number;
  nota: string;
} | null {
  const p = Number(ctx.annualAdjustmentPercent || 0);
  if (!(p > 0)) return null;
  return {
    ativo: true,
    percentual: p,
    nota: `Esta simulação considera reajuste anual de ${p}% a.a. pelo INPC. Trata-se de uma projeção consultiva — o simulador oficial CAIXA não inclui reajuste na simulação.`,
  };
}

/** Primeiro nome formatado (Capitalizado). Vazio se não houver. */
function firstName(full?: string): string {
  if (!full) return '';
  const n = full.trim().split(/\s+/)[0] || '';
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}

/** Frase de abertura do bloco de contexto (Diagnóstico). Curta e direta. */
export function diagnosticIntro(ctx: NarrativeContext): string {
  const objLabel = ctx.subObjetivo || ctx.objetivo || 'um objetivo importante';
  const cap = ctx.capacidadeMensal > 0 ? ` (${formatCurrency(ctx.capacidadeMensal)}/mês)` : '';
  return `${firstName(ctx.clientName) || 'Cliente'}: ${objLabel.toLowerCase()}${cap}.`;
}

/**
 * RESUMO EXECUTIVO — agora com estrutura de impacto:
 *  1) frase de impacto  2) número forte  3) consequência  4) direção.
 */
export function simulationIntro(ctx: NarrativeContext): string {
  const valorBem = formatCurrency(ctx.creditValue);
  const custo = formatCurrency(ctx.effectiveClientCost);
  const parcela = formatCurrency(ctx.installment);
  return `Você acessa ${valorBem} pagando, no plano, ${custo}. Parcela de ${parcela} após a contemplação.`;
}

/**
 * Estimativa rápida do gap vs financiamento (apenas para reforçar narrativa).
 * Não substitui o cálculo oficial — usado só para dimensionar a frase.
 */
function estimatedFinancingGap(ctx: NarrativeContext): boolean {
  // Heurística: financiamento normalmente custa 1.6x–2.2x o custo efetivo do consórcio.
  return ctx.effectiveClientCost > 0 && ctx.creditValue > 0;
}

/** Frase de transição para o bloco de comparações. */
export function comparisonIntro(): string {
  return `Consórcio × financiamento, em números.`;
}

/**
 * Estratégia — agora EXPLICA o porquê (não apenas mostra o "lance de X%").
 * A IA do PDF é determinística: usa o perfil do cliente para justificar.
 */
export function strategyIntro(ctx: NarrativeContext): string {
  const path = ctx.recommendation?.recommendedPath;
  const nome = firstName(ctx.clientName);
  const intro = nome ? `${nome}, ` : '';

  switch (path) {
    case 'consorcio_com_lance':
      return `${intro}usar ${formatCurrency(ctx.capitalDisponivel)} como lance antecipa a carta, encurta a espera e reduz a parcela. Capital parado vira poder de compra.`;
    case 'investimento_financeiro':
      return `${intro}a carta vira veículo de renda recorrente — sua capacidade mensal trabalha por você.`;
    case 'compra_a_vista':
      return `${intro}à vista resolve hoje. Manter o capital aplicado e alavancar pelo consórcio costuma preservar mais patrimônio adiante.`;
    default:
      return `${intro}a estratégia abaixo foi desenhada para o seu perfil — capacidade, capital e objetivo.`;
  }
}

/** Frase de fechamento (interpretação dos ganhos). */
export function interpretationIntro(ctx: NarrativeContext): string {
  return `Em síntese: você adquire um bem de ${formatCurrency(ctx.creditValue)} pagando, na prática, ` +
    `${formatCurrency(ctx.effectiveClientCost)} ao longo de ${ctx.termMonths} meses — sem juros bancários ` +
    `e mantendo flexibilidade para usar a carta no momento certo.`;
}

/** Mensagem consultiva da página de fechamento. Curta e direta. */
export function closingMessage(ctx: NarrativeContext): string {
  const first = firstName(ctx.clientName);
  const greet = first ? `${first}, ` : '';
  return `${greet}se a estratégia faz sentido, o próximo passo é simples: escolher o grupo e formalizar. Estarei com você.`;
}

/** Os 3 argumentos de decisão padrão (usados se não houver IA). */
export function defaultArguments(ctx: NarrativeContext): string[] {
  return [
    `Você não se descapitaliza — mantém liquidez para imprevistos e oportunidades.`,
    `Sem juros bancários — paga o bem em parcelas previsíveis, com correção do índice oficial.`,
    `Disciplina financeira — o compromisso mensal vira hábito de construção patrimonial.`,
  ];
}

/** Objeções padrão com respostas consultivas (usadas se não houver IA). */
export function defaultObjections(): Array<{ q: string; a: string }> {
  return [
    {
      q: 'E se eu não for contemplado rápido?',
      a: 'A estratégia já considera o cenário sem lance. Mesmo assim, o custo efetivo continua menor que o de um financiamento equivalente, e o lance fica como ferramenta opcional para acelerar.',
    },
    {
      q: 'Posso desistir no meio do plano?',
      a: 'Sim. A cota pode ser transferida ou colocada em assembleia de devolução. Não é o cenário ideal — por isso estruturamos a parcela dentro da sua capacidade.',
    },
    {
      q: 'Por que não financiar e resolver agora?',
      a: 'O financiamento adiciona juros que, no horizonte do plano, podem dobrar o valor pago. O consórcio mantém o custo previsível e te dá flexibilidade de escolher o momento de usar a carta.',
    },
  ];
}

/**
 * STORYTELLING DETERMINÍSTICO — usado quando não há cache de IA.
 * Recebe valor da carta, prazo, parcela e objetivo do cliente e gera um cenário CONCRETO
 * (não genérico). Estrutura: cena de hoje → ponto de virada → projeção → ancoragem emocional.
 */
export function defaultStorytelling(ctx: NarrativeContext): string {
  const nome = firstName(ctx.clientName) || 'Você';
  const obj = (ctx.subObjetivo || ctx.objetivo || 'seu objetivo').toLowerCase();
  const carta = formatCurrency(ctx.creditValue);

  // Máx 4 linhas: 2 parágrafos curtos, mais emocional.
  const agora = `${nome}, hoje ${obj} parece distante. Amanhã, é só uma questão de quando.`;
  const depois = `Em pouco tempo, a carta de ${carta} já está nas suas mãos — e o que era plano vira conquista.`;

  return [agora, depois].join('\n\n');
}
