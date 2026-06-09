import { formatCurrency, annualToMonthlyRate, pricePmt } from '@/core/finance';

export interface MentalTrigger {
  id: string;
  name: string;
  emoji: string;
  whatIs: string;
  /** Como aplicar genérico (fallback). Use buildHowToApply() para versão contextual. */
  howToApply: string;
  /** Script genérico (fallback, com placeholders). Use buildLocalScript() para versão preenchida. */
  script: string;
}

export const MENTAL_TRIGGERS: MentalTrigger[] = [
  {
    id: 'antecipacao',
    name: 'Antecipação',
    emoji: '🔮',
    whatIs: 'Projeta mentalmente dois futuros paralelos — com e sem o consórcio — tornando a decisão visualmente concreta.',
    howToApply: 'Use quando o cliente está indeciso. Mostre a linha do tempo de 5 anos pagando aluguel versus 5 anos construindo patrimônio.',
    script: '"Vou te mostrar dois cenários para daqui a 5 anos. No primeiro, você continua como está — e em 60 meses terá pago [aluguel × 60] em aluguel, sem construir nada. No segundo, você entra no consórcio hoje — e em 60 meses está muito mais próximo de ter seu imóvel quitado, sem ter pago um centavo de juros bancários. Qual cenário faz mais sentido para você?"',
  },
  {
    id: 'desapego',
    name: 'Desapego',
    emoji: '🎯',
    whatIs: 'O vendedor demonstra que não depende da venda — invertendo a polaridade da negociação. O cliente passa a sentir que está perdendo uma oportunidade, não sendo pressionado.',
    howToApply: 'Use quando o cliente procrastina ou pede tempo. Nunca demonstre ansiedade.',
    script: '"[Nome], entendo que você precisa de tempo para pensar — e faz todo sentido. Só quero deixar claro: não estou aqui para te convencer de nada. Esse grupo tem vagas limitadas e os dados mostram uma janela favorável agora. Se não for o momento certo para você, tudo bem — mas não quero que você perca essa janela por falta de informação. O que ainda ficou sem resposta?"',
  },
  {
    id: 'autoridade',
    name: 'Autoridade',
    emoji: '🏆',
    whatIs: 'Posiciona o vendedor como detentor de conhecimento exclusivo — não pelo cargo, mas pela capacidade de revelar informações que o cliente não teria acesso sozinho.',
    howToApply: 'Use no início da conversa para estabelecer credibilidade. Compartilhe dados reais das assembleias e estratégias avançadas.',
    script: '"[Nome], tenho acesso aos dados das últimas assembleias desse grupo — e há algo interessante acontecendo agora que a maioria das pessoas não percebe. Os lances estão numa faixa que raramente aparece. Quem entender isso agora tem uma vantagem real. Posso te mostrar os números?"',
  },
  {
    id: 'prova_social',
    name: 'Prova Social',
    emoji: '👥',
    whatIs: 'Usa o instinto humano de seguir comportamentos de grupos com perfil semelhante — especialmente eficaz quando citado de forma específica e contextualizada.',
    howToApply: 'Nunca use depoimentos genéricos. Cite perfis específicos semelhantes ao cliente.',
    script: '"[Nome], nos últimos meses tenho atendido vários clientes com um perfil muito parecido com o seu. A maioria chegou com as mesmas dúvidas que você tem agora. Depois de entender a estratégia de lance, todos decidiram entrar. Dois já foram contemplados. O que te diferencia deles é que você ainda está avaliando — e isso é inteligente. O que falta para você ter a mesma clareza que eles tiveram?"',
  },
];

// ═══════ CONTEXTO DA SIMULAÇÃO PARA OS GATILHOS ═══════

export interface TriggerContext {
  consortiumTypeLabel: string;
  creditValue: number;
  installment: number;
  termMonths: number;
  /** Lance total (livre + embutido) em R$ */
  bidValue: number;
  bidPercent: number;
  contemplationMonth?: number;
  /** Estimativa de custo equivalente em financiamento PRICE (juros típico imóvel 11% a.a.) */
  financingTotal: number;
  /** financingTotal - totalCost */
  estimatedSavings: number;
  /** Custo total real do cliente (do schedule) */
  totalCost: number;
  /** Estimativa rápida: aluguel mensal ~ 0,5% do crédito (regra de mercado) */
  estimatedRent: number;
  clientName?: string;
}

const fmt = (n: number) => formatCurrency(Math.max(0, Math.round(n)));

/** Estima o custo total de um financiamento PRICE para mesmo crédito/prazo. */
export function estimateFinancingTotal(creditValue: number, termMonths: number, annualRate = 0.11): number {
  if (creditValue <= 0 || termMonths <= 0) return 0;
  const i = annualToMonthlyRate(annualRate);
  const installment = pricePmt(creditValue, i, termMonths);
  return installment * termMonths;
}

/** Aluguel estimado ~ 0,5% do valor do imóvel/crédito (regra de mercado conservadora). */
export function estimateRent(creditValue: number): number {
  return creditValue * 0.005;
}

/** Substitui placeholders do script genérico por números reais da simulação. */
export function buildLocalScript(trigger: MentalTrigger, ctx: TriggerContext): string {
  const nome = ctx.clientName?.trim() || 'cliente';
  const aluguel60 = ctx.estimatedRent * 60;

  switch (trigger.id) {
    case 'antecipacao':
      return `"Vou te mostrar dois cenários para daqui a 5 anos. No primeiro, você continua pagando aluguel — em 60 meses serão cerca de ${fmt(aluguel60)} desembolsados, sem construir patrimônio. No segundo, com o consórcio de ${fmt(ctx.creditValue)} e parcela de ${fmt(ctx.installment)}, você está caminhando para um bem próprio sem juros bancários. Diferença estimada: ${fmt(ctx.estimatedSavings)} a menos do que um financiamento equivalente. Qual cenário faz mais sentido para você?"`;

    case 'desapego':
      return `"${nome}, entendo que precisa de tempo — faz todo sentido. Só pra deixar claro: não estou aqui pra te convencer. Esse grupo tem vagas limitadas e a parcela atual de ${fmt(ctx.installment)} está dentro de uma janela favorável${ctx.bidPercent > 0 ? ` — com lance de ${ctx.bidPercent.toFixed(1).replace('.', ',')}% a chance de contemplar mais cedo aumenta` : ''}. Se não for o momento, tudo bem — só não quero que você perca essa janela por falta de informação. O que ainda ficou sem resposta?"`;

    case 'autoridade':
      return `"${nome}, tenho acesso aos dados das últimas assembleias desse grupo de ${ctx.consortiumTypeLabel.toLowerCase()}. Há um detalhe que a maioria não percebe: pra um crédito de ${fmt(ctx.creditValue)} em ${ctx.termMonths} meses, a parcela hoje sai por ${fmt(ctx.installment)} e o custo total estimado é ${fmt(ctx.totalCost)} — contra ${fmt(ctx.financingTotal)} num financiamento equivalente. Quem entende esses números agora tem uma vantagem real. Posso te mostrar como cheguei nisso?"`;

    case 'prova_social':
      return `"${nome}, atendo bastante cliente com perfil parecido com o seu, buscando ${ctx.consortiumTypeLabel.toLowerCase()} na faixa de ${fmt(ctx.creditValue)}. A maioria chega com as mesmas dúvidas. Depois que vê os números — parcela de ${fmt(ctx.installment)} e economia estimada de ${fmt(ctx.estimatedSavings)} frente ao financiamento — a decisão fica natural. O que ainda falta pra você ter essa mesma clareza?"`;

    default:
      return trigger.script;
  }
}

/** Como aplicar contextualizado por estágio da simulação. */
export function buildHowToApply(trigger: MentalTrigger, ctx: TriggerContext): string {
  const hasBid = ctx.bidValue > 0;
  const longTerm = ctx.termMonths >= 180;
  const highValue = ctx.creditValue >= 300000;

  switch (trigger.id) {
    case 'antecipacao':
      return longTerm
        ? `Prazo de ${ctx.termMonths} meses pede projeção temporal. Mostre o desembolso acumulado em aluguel (${fmt(ctx.estimatedRent * 60)} em 5 anos) versus a construção de patrimônio. Use a economia de ${fmt(ctx.estimatedSavings)} vs financiamento como âncora.`
        : `Compare 5 anos pagando aluguel (~${fmt(ctx.estimatedRent * 60)}) com 5 anos de consórcio. Mostre que a parcela de ${fmt(ctx.installment)} já constrói patrimônio, diferente do aluguel.`;

    case 'desapego':
      return hasBid
        ? `Cliente já simulou lance de ${ctx.bidPercent.toFixed(1).replace('.', ',')}% — está engajado. Não pressione: reforce que a janela de oportunidade existe e que ele decide o ritmo.`
        : `Cliente ainda não simulou lance. Use o desapego para baixar a guarda — fale da vaga limitada sem urgência forçada, deixando ele puxar a próxima pergunta.`;

    case 'autoridade':
      return highValue
        ? `Carta de ${fmt(ctx.creditValue)} é decisão de peso. Estabeleça credibilidade com dados concretos: custo total de ${fmt(ctx.totalCost)} vs ${fmt(ctx.financingTotal)} no financiamento. Números específicos vencem ceticismo.`
        : `Use no início da conversa. Compartilhe dados reais do grupo (taxa, prazo, lances típicos) antes de oferecer qualquer coisa. Conhecimento gera confiança.`;

    case 'prova_social':
      return hasBid
        ? `Cliente já está modelando lance — cite contemplados recentes do mesmo grupo com lance similar. Especificidade gera identificação.`
        : `Mencione perfis parecidos buscando ${ctx.consortiumTypeLabel.toLowerCase()} na mesma faixa de crédito (${fmt(ctx.creditValue)}). Evite depoimentos genéricos.`;

    default:
      return trigger.howToApply;
  }
}

// ═══════ RECOMENDAÇÃO / ORDENAÇÃO ═══════

export interface TriggerRecommendation {
  trigger: MentalTrigger;
  reason: string;
  priority: 'primary' | 'secondary';
  /** Score 0-100 para ordenação */
  score: number;
}

export function getRecommendedTriggers(params: {
  creditValue: number;
  bidSimulated: boolean;
  termMonths: number;
}): TriggerRecommendation[] {
  const { creditValue, bidSimulated, termMonths } = params;
  const result: TriggerRecommendation[] = [];
  const byId = (id: string) => MENTAL_TRIGGERS.find(t => t.id === id)!;

  const highValue = creditValue > 300000;
  const longTerm = termMonths > 150;

  if (highValue) {
    result.push({ trigger: byId('autoridade'), reason: 'Carta de alto valor — credibilidade é decisiva', priority: 'primary', score: 95 });
    result.push({ trigger: byId('antecipacao'), reason: 'Projeção de cenários reforça decisão em valores altos', priority: 'primary', score: 85 });
  }

  if (!bidSimulated && !highValue) {
    result.push({ trigger: byId('autoridade'), reason: 'Sem lance simulado — use dados do grupo para gerar interesse', priority: 'primary', score: 80 });
  }

  if (bidSimulated && !highValue) {
    result.push({ trigger: byId('antecipacao'), reason: 'Lance simulado — projeção reforça o compromisso', priority: 'primary', score: 88 });
    result.push({ trigger: byId('prova_social'), reason: 'Perfil com lance — validação social acelera fechamento', priority: 'primary', score: 78 });
  }

  if (longTerm && !result.some(r => r.trigger.id === 'antecipacao')) {
    result.push({ trigger: byId('antecipacao'), reason: 'Prazo longo — projeção temporal é essencial', priority: 'primary', score: 82 });
  }

  if (!result.some(r => r.trigger.id === 'desapego')) {
    result.push({ trigger: byId('desapego'), reason: 'Sempre útil para reduzir pressão percebida', priority: 'secondary', score: 50 });
  }

  if (!result.some(r => r.trigger.id === 'prova_social')) {
    result.push({ trigger: byId('prova_social'), reason: 'Validação de pares reduz ceticismo', priority: 'secondary', score: 45 });
  }

  return result.sort((a, b) => b.score - a.score);
}
