/**
 * Smart Messages — Professional outreach message generator.
 * Uses engagement-level psychology and consultive selling techniques.
 *
 * Framework:
 * - Hot: Assumptive close + urgency → cliente já está pronto, não perca momentum
 * - Warm: Social proof + value reinforcement → manter o interesse, resolver dúvidas
 * - Cold: Pattern interrupt + curiosity gap → reengajar sem parecer spam
 * - New: Welcome + education + low commitment → construir confiança desde o início
 */

import { applyBusinessRules } from '@/services/proposals/businessRulesEnricher';
import { formatCurrencyShort } from '@/utils/format';

export type EngagementLevel = 'hot' | 'warm' | 'cold' | 'new';
export type ClientContext = 'generico' | 'aluguel' | 'fgts' | 'financiamento' | 'pj' | 'liquidez' | 'investidor' | 'sucessao' | 'agro';

export interface SmartMessageContext {
  level: EngagementLevel;
  clientContext?: ClientContext;
  clientName?: string;
  consortiumType?: string;
  creditValue?: number;
  reducedInstallment?: boolean;
}

interface MessageTemplate {
  text: string;
}

const TEMPLATES: Record<EngagementLevel, MessageTemplate[]> = {
  // ═══ HOT — Pronto para fechar ═══
  // Técnica: Assumptive close, urgência sutil, facilitação do "sim"
  hot: [
    {
      text: 'Revisando sua simulação, vi que o cenário está bem favorável. Organizei tudo pra você — se quiser, podemos fechar em 15 minutos. Quer que eu prepare a documentação?',
    },
    {
      text: 'Com base na sua última simulação, identifiquei a melhor janela de oportunidade no seu grupo. Quanto mais cedo entrarmos, melhor o posicionamento. Posso avançar com a proposta?',
    },
    {
      text: 'Você já tem tudo que precisa pra tomar a decisão. Montei um resumo final — se estiver alinhado, o próximo passo é simples e rápido. Me diz: bora?',
    },
    {
      text: 'Encontrei uma condição especial que se encaixa perfeitamente no seu perfil. Mas ela depende do momento do grupo. Posso te mostrar em 5 minutos — vale a pena.',
    },
    {
      text: 'Sua simulação está completa e o cenário é sólido. A única coisa que falta é a sua confirmação. Quer que eu organize os próximos passos?',
    },
  ],

  // ═══ WARM — Em desenvolvimento ═══
  // Técnica: Reforço de valor, prova social, resolução preventiva de objeções
  warm: [
    {
      text: 'Vi que você começou a explorar as simulações — e os números do seu grupo estão interessantes. Quer que eu te mostre uma análise mais detalhada? Sem compromisso.',
    },
    {
      text: 'Muitos clientes que começam como você acabam descobrindo que o consórcio é mais vantajoso que o financiamento. Posso te mostrar a comparação com os seus números?',
    },
    {
      text: 'Percebi que você tem explorado diferentes cenários. Isso é ótimo — mostra que você pesquisa antes de decidir. Posso te ajudar a interpretar os dados e chegar na melhor estratégia?',
    },
    {
      text: 'Salve! Uma dúvida comum nesse estágio é: "será que vale a pena dar lance?". Posso te mostrar os dados reais do seu grupo — a resposta pode te surpreender.',
    },
    {
      text: 'Preparei uma análise personalizada com base nas suas simulações. São 3 cenários diferentes — conservador, equilibrado e agressivo. Qual deles combina mais com você?',
    },
  ],

  // ═══ COLD — Frio / Reengajamento ═══
  // Técnica: Pattern interrupt, curiosity gap, micro-compromisso
  cold: [
    {
      text: 'Descobri uma coisa interessante analisando os grupos de consórcio. Sabia que quem entra com estratégia certa contempla em média 40% mais rápido? Posso te mostrar como funciona.',
    },
    {
      text: 'Sei que talvez não seja o momento — mas queria te deixar com um dado: no consórcio, você economiza em média 35% comparado ao financiamento. Se um dia fizer sentido, estou aqui.',
    },
    {
      text: 'Não sei se você já considerou o consórcio, mas preparei um comparativo rápido. São 2 minutos de leitura que podem mudar sua visão sobre como adquirir patrimônio. Posso enviar?',
    },
    {
      text: 'Uma pergunta rápida: se existisse uma forma de comprar seu imóvel/veículo sem pagar juros e com parcela menor que um financiamento, você teria interesse em conhecer? Sem compromisso.',
    },
    {
      text: 'Estava revisando minha carteira e lembrei de você. Os grupos estão com condições especialmente boas neste momento. Se tiver 3 minutos, posso te atualizar.',
    },
  ],

  // ═══ NEW — Primeiro contato ═══
  // Técnica: Welcome sequence, educação, redução de barreira, confiança
  new: [
    {
      text: 'Seja bem-vindo(a)! Vou te explicar de forma simples: o consórcio é como um planejamento inteligente — você paga parcelas acessíveis e recebe sua carta de crédito com poder de compra à vista, sem juros. Quer ver um exemplo prático?',
    },
    {
      text: 'Que bom ter você aqui! Antes de qualquer coisa, saiba que meu papel é te ajudar a entender se o consórcio faz sentido pra você — sem pressão. Posso te mostrar uma simulação rápida com base no seu perfil?',
    },
    {
      text: 'Bem-vindo(a)! Uma coisa que surpreende quem está conhecendo o consórcio agora: a parcela costuma ser 30-40% menor que a de um financiamento. Quer entender por quê? Te explico em 2 minutos.',
    },
    {
      text: 'Oi! Se é sua primeira vez com consórcio, deixa eu simplificar: imagine pagar parcelas menores que um financiamento e, quando contemplado, comprar à vista com desconto. É basicamente isso. Quer ver os números?',
    },
    {
      text: 'Prazer em te conhecer! Trabalho com consórcio e minha especialidade é encontrar a melhor estratégia para cada perfil. Sem pressão e sem jargão — só clareza. Posso começar com uma simulação pra você?',
    },
  ],
};

/**
 * Context-specific scripts by client context + engagement level.
 * Only defined combinations are listed; missing ones fall back to generic TEMPLATES.
 */
const CONTEXT_TEMPLATES: Partial<Record<ClientContext, Partial<Record<EngagementLevel, MessageTemplate[]>>>> = {
  aluguel: {
    new: [
      { text: '[Nome], tudo bem? Aqui é o [seu nome], consultor de consórcio. Uma pergunta direta: você paga aluguel hoje? Se sim, tenho um comparativo que mostra como converter esse custo mensal em patrimônio próprio — sem entrada e sem juros bancários. Posso te mostrar em 10 minutos. Quando você prefere?' },
    ],
    cold: [
      { text: '[Nome], só uma reflexão rápida: cada mês de aluguel é dinheiro que vai embora sem construir nada. Calculei quanto você já pagou de aluguel nos últimos 12 meses — e o que esse valor poderia ter representado num consórcio. O número surpreende. Quer ver?' },
    ],
    hot: [
      { text: '[Nome], você já sabe que aluguel é dinheiro jogado fora. Agora é só dar o próximo passo. O cenário está favorável — o grupo que analisei para você tem lances na faixa de [LANCE_MEDIO]%. Com seu FGTS, já seria suficiente para uma estratégia de lance competitiva. Me confirma: fechamos essa semana?' },
    ],
  },
  fgts: {
    new: [
      { text: '[Nome], você sabia que o FGTS rende abaixo da inflação? Seu dinheiro está perdendo poder de compra todo mês parado lá. No consórcio imobiliário você pode usar o saldo do FGTS como lance para antecipar sua contemplação. Posso te mostrar como funciona na prática?' },
    ],
    cold: [
      { text: '[Nome], seu FGTS está trabalhando pra você ou dormindo? A maioria das pessoas não sabe que pode usar esse saldo como lance estratégico no consórcio — antecipando a contemplação em anos. Tenho uma simulação pronta com o seu perfil. Vale 10 minutos da sua atenção?' },
    ],
    hot: [
      { text: '[Nome], com o saldo de FGTS que você tem, já conseguimos estruturar um lance competitivo no grupo que analisei. Os dados das últimas assembleias mostram que esse lance contempla na faixa de [LANCE_MEDIO]% de probabilidade. É agora ou esperar mais um ciclo. Vamos fechar?' },
    ],
  },
  financiamento: {
    new: [
      { text: '[Nome], ouvi dizer que você está nos meses finais do seu financiamento — parabéns pela disciplina. Quem consegue honrar um compromisso de longo prazo tem o perfil exato para o próximo passo: usar esse mesmo valor mensal para construir mais patrimônio, desta vez sem pagar juros bancários. Posso te mostrar como?' },
    ],
    hot: [
      { text: '[Nome], você provou que consegue. Agora esse valor mensal que estava comprometido pode trabalhar para você — no consórcio, sem juros, construindo o próximo patrimônio. A parcela já cabe no orçamento que você estava acostumado. É só redirecionar. Quando podemos conversar?' },
    ],
  },
  pj: {
    new: [
      { text: '[Nome], revisando estrategicamente sua carteira, notei que parte da liquidez da sua empresa permanece em aplicações que não estão maximizando o potencial contra a inflação atual. Estruturei uma modelagem financeira com cartas de crédito focada em alavancagem de capital sem incidência de juros bancários. Você prefere que eu te ligue amanhã às 14h ou às 16h para conversarmos 10 minutos?' },
    ],
    cold: [
      { text: '[Nome], com a Selic a 15%, os financiamentos tradicionais tornaram-se um passivo destrutivo para empresas. Cada equipamento financiado hoje custa o dobro ao final do contrato. O consórcio de veículos e pesados elimina esse custo — e a taxa administrativa é dedutível no Lucro Real. Vale uma conversa rápida?' },
    ],
    hot: [
      { text: '[Nome], o cenário está montado. Consórcio sem juros, taxa dedutível no IR e renovação da frota planejada sem comprometer capital de giro. Para o faturamento da taxa de adesão, é mais estratégico alocar no CNPJ da empresa ou no seu CPF pessoal?' },
    ],
  },
  liquidez: {
    new: [
      { text: '[Nome], capital parado em poupança perde para a inflação todo mês. Tenho uma estratégia que transforma esse capital em alavancagem real — você usa parte como lance no consórcio e mantém o restante em aplicações de liquidez. É diversificação inteligente sem abrir mão da segurança. Posso te explicar em 10 minutos?' },
    ],
    hot: [
      { text: '[Nome], o momento está favorável. Com parte do seu capital como lance e o restante mantido em renda fixa, você alavanca um ativo de [CARTA] com exposição mínima. O grupo que analisei tem lances na faixa de [LANCE_MEDIO]%. É uma janela que não fica aberta para sempre. Fechamos?' },
    ],
  },
  investidor: {
    new: [
      { text: '[Nome], investidores que constroem patrimônio de forma consistente usam alavancagem — e o consórcio é a alavancagem mais barata do mercado financeiro brasileiro. Com parcelas mensais você adquire um ativo de alto valor, e o aluguel recebido amortiza parte das parcelas. Posso te mostrar a matemática disso em 10 minutos?' },
    ],
    cold: [
      { text: '[Nome], uma reflexão: com R$ 2.000 por mês no consórcio você alavanca um imóvel de R$ 300.000. Nenhuma aplicação financeira oferece essa relação. O aluguel desse imóvel pode pagar boa parte da parcela — e ao final você tem o ativo quitado. Vale analisar juntos?' },
    ],
    warm: [
      { text: '[Nome], você já entende de investimentos — então sabe que alavancagem bem estruturada multiplica resultado. O consórcio permite adquirir um ativo de alto valor com exposição mínima de capital próprio. Tenho uma simulação completa com o fluxo de caixa do investimento. Quando posso te apresentar?' },
    ],
    hot: [
      { text: '[Nome], os números estão fechados. Carta de [CARTA], alavancagem com retorno consistente via renda de aluguel. É alavancagem com exposição mínima de capital próprio. Para finalizar: o consórcio fica no seu CPF ou estruturamos numa holding?' },
    ],
  },
  sucessao: {
    new: [
      { text: '[Nome], uma pergunta direta: você já pensou em quanto seu patrimônio perderia num inventário hoje? ITCMD, honorários e tempo podem consumir até 20% dos seus bens. O consórcio com seguro prestamista é uma das ferramentas mais eficientes de proteção patrimonial — o imóvel vai quitado para os herdeiros, sem burocracia. Posso te explicar?' },
    ],
    cold: [
      { text: '[Nome], patrimônio que levou décadas para construir pode ser parcialmente consumido num inventário mal planejado. Há uma forma simples de proteger isso — e o consórcio com seguro prestamista é peça central dessa estratégia. Vale uma conversa de 15 minutos?' },
    ],
    hot: [
      { text: '[Nome], a estrutura está clara: consórcio com seguro prestamista garante que o imóvel vai quitado aos herdeiros. Sem inventário sobre dívida, sem deságio forçado para pagar ITCMD. Para avançar: formalizamos no seu CPF ou já estruturamos na holding familiar?' },
    ],
  },
  agro: {
    new: [
      { text: '[Nome], com o Plano Safra sendo progressivamente contingenciado, quem depende só dele para renovar equipamentos corre risco de ficar sem crédito na hora certa. O consórcio de pesados é a alternativa planejada — você programa a renovação com antecedência, sem juros e sem depender de aprovação bancária. Posso te mostrar como funciona?' },
    ],
    cold: [
      { text: '[Nome], um equipamento financiado pelo banco a juros compostos pode custar o dobro ao final do contrato. Isso corrói sua margem por anos. O consórcio de pesados elimina esse custo — e você pode estruturar as parcelas conforme seu fluxo de caixa sazonal. Vale analisar?' },
    ],
    hot: [
      { text: '[Nome], o cenário está montado: consórcio de pesados, sem juros, parcelas adaptáveis ao ciclo da safra. Para o faturamento, é mais estratégico alocar no CPF ou no CNPJ da propriedade rural?' },
    ],
  },
};

/** Replace dynamic placeholders in context scripts */
function injectVariables(text: string, ctx: SmartMessageContext): string {
  const firstName = ctx.clientName?.trim().split(' ')[0];
  let result = text.replace(/\[Nome\]/g, firstName || 'Cliente');
  result = result.replace(/\[seu nome\]/g, '[seu nome]'); // kept as placeholder for user
  if (ctx.creditValue && ctx.creditValue > 0) {
    result = result.replace(/\[CARTA\]/g, formatCurrencyShort(ctx.creditValue));
  }
  // [LANCE_MEDIO] kept as-is since we don't have group data here
  return result;
}

export function generateSmartMessage(
  ctx: SmartMessageContext,
  variationIndex?: number
): string {
  const message = buildSmartMessage(ctx, variationIndex);
  return applyBusinessRules(message, {
    reducedInstallment: ctx.reducedInstallment,
    format: 'whatsapp',
  });
}

function buildSmartMessage(
  ctx: SmartMessageContext,
  variationIndex?: number
): string {
  // Check for context-specific template first
  const clientCtx = ctx.clientContext || 'generico';
  const contextTemplates = clientCtx !== 'generico'
    ? CONTEXT_TEMPLATES[clientCtx]?.[ctx.level]
    : undefined;

  if (contextTemplates && contextTemplates.length > 0) {
    const idx = variationIndex !== undefined
      ? variationIndex % contextTemplates.length
      : 0;
    let msg = contextTemplates[idx].text;
    msg = injectVariables(msg, ctx);

    // Append context suffix for context scripts too
    const parts: string[] = [];
    if (ctx.consortiumType)
      parts.push(`consórcio de ${ctx.consortiumType.toLowerCase()}`);
    if (ctx.creditValue && ctx.creditValue > 0)
      parts.push(`carta de ${formatCurrencyShort(ctx.creditValue)}`);
    const suffix =
      parts.length > 0
        ? `\n\nEstamos falando de ${parts.join(' — ')}.`
        : '';

    return `${msg}${suffix}`;
  }

  // Fallback to generic templates
  const templates = TEMPLATES[ctx.level];
  const idx =
    variationIndex !== undefined
      ? variationIndex % templates.length
      : Math.floor(Math.random() * templates.length);
  let msg = templates[idx].text;

  // Build greeting
  const firstName = ctx.clientName?.trim().split(' ')[0];
  const greeting = firstName ? `Oi, ${firstName}! ` : '';

  // Build context suffix — only when we have specific data
  const parts: string[] = [];
  if (ctx.consortiumType)
    parts.push(`consórcio de ${ctx.consortiumType.toLowerCase()}`);
  if (ctx.creditValue && ctx.creditValue > 0)
    parts.push(`carta de ${formatCurrencyShort(ctx.creditValue)}`);
  const suffix =
    parts.length > 0
      ? `\n\nEstamos falando de ${parts.join(' — ')}.`
      : '';

  return `${greeting}${msg}${suffix}`;
}

export function getSmartMessageVariations(
  ctx: SmartMessageContext
): string[] {
  const clientCtx = ctx.clientContext || 'generico';
  const contextTemplates = clientCtx !== 'generico'
    ? CONTEXT_TEMPLATES[clientCtx]?.[ctx.level]
    : undefined;

  if (contextTemplates && contextTemplates.length > 0) {
    return contextTemplates.map((_, i) => generateSmartMessage(ctx, i));
  }
  return TEMPLATES[ctx.level].map((_, i) => generateSmartMessage(ctx, i));
}

export function getLevelLabel(level: EngagementLevel): string {
  switch (level) {
    case 'hot':
      return '🔥 Pronto para fechar';
    case 'warm':
      return '⚠️ Em desenvolvimento';
    case 'cold':
      return '💤 Frio / Reengajamento';
    case 'new':
      return '🆕 Primeiro contato';
  }
}
