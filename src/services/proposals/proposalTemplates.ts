/**
 * Proposal templates — Sales-focused copywriting for consortium closing.
 *
 * Framework AIDA + PAS combinado:
 * 1. ABERTURA — Hook emocional + personalização (Atenção)
 * 2. CONTEXTO — Dor real do cliente, cenário que ele vive (Problema/Interesse)
 * 3. SOLUÇÃO — Consórcio como virada de chave (Desejo)
 * 4. ESTRATÉGIA — Plano concreto com dados (Prova)
 * 5. FECHAMENTO — CTA direcionado de baixo atrito (Ação)
 *
 * Princípios:
 * - Cada frase tem propósito (nenhuma frase "de encher")
 * - Linguagem de conversa real, não de panfleto
 * - Dados concretos geram confiança
 * - CTA direcionado = mais resposta
 * - Personalização real quando há contexto do cliente
 */

import { DISCLAIMERS } from '@/config/copy';
import { applyBusinessRules } from '@/services/proposals/businessRulesEnricher';
import { getSubObjetivoTexto } from '@/utils/getSubObjetivoTexto';

export type Tone = 0 | 1 | 2;
export type ProposalFormat = 'whatsapp' | 'formal';

export interface BlockContext {
  clientName: string;
  consortiumType: string;
  creditValue: string;
  netCreditValue?: string;
  embeddedBidValue?: string;
  hasEmbeddedBid: boolean;
  termMonths: number;
  installment: string;
  totalCost: string;
  groupNumber?: number;
  bidPercent?: string;
  bidZone?: string;
  contemplated: boolean;
  contemplationMonth?: number;
  postContemplationChoice?: string;
  installmentAfterContemplation?: string;
  reducedTermMonths?: number;
  scenarioProfile: 'conservador' | 'equilibrado' | 'agressivo';
  date: string;
  clientObjective?: string;
  clientSituation?: string;
  reducedInstallment?: boolean;
  /** Fases de parcela quando reducedInstallment === true e cliente NÃO contemplado. */
  reducedInstallmentMonths?: number;
  /** Já formatado em moeda (R$). */
  reducedInstallmentValue?: string;
  /** Já formatado em moeda (R$). */
  redilutedInstallmentValue?: string;
  /** Enum ou label do subObjetivo (usado para enriquecer copy de forma padronizada). */
  subObjetivo?: string;
  /** Seguro Prestamista passa a vigorar somente a partir do mês de utilização da carta. */
  usedCreditForAsset?: boolean;
  creditUsageMonth?: number;
  /** Reajuste INPC anual aplicado (% a.a.). 0 ou ausente = sem reajuste. */
  annualAdjustmentPercent?: number;
}

type VariantFn = (ctx: BlockContext) => string;
type BlockVariants = [VariantFn, VariantFn, VariantFn]; // [direta, explicativa, consultiva]

interface BlockDefinition {
  wa: BlockVariants;
  formal: BlockVariants;
  condition?: (ctx: BlockContext) => boolean;
}

// ─── Helpers ───

function termYears(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (m === 0) return `${y} anos`;
  return `${y} anos e ${m} meses`;
}

function isImovel(ctx: BlockContext): boolean {
  return ctx.consortiumType.toLowerCase().includes('imob') || ctx.consortiumType.toLowerCase().includes('imóv');
}

function firstName(ctx: BlockContext): string {
  return ctx.clientName?.trim().split(' ')[0] || '';
}

/** Build a personalized objective line when context is available */
function objectiveLine(ctx: BlockContext): string {
  if (ctx.clientObjective) {
    return ctx.clientObjective;
  }
  if (ctx.clientSituation) {
    return ctx.clientSituation;
  }
  return '';
}

/** Pick a micro-urgency phrase — uses shared pool from salesCopyEngine for consistency */
function microUrgency(_ctx: BlockContext): string {
  // Shared urgency phrases — keep in sync with salesCopyEngine.ts MICRO_URGENCY
  const urgencies = [
    'As condições desse grupo estão muito boas nesse momento.',
    'Vi que as parcelas desse plano estão em um patamar interessante agora.',
    'Esse tipo de oportunidade aparece em janelas específicas.',
    'As assembleias mais recentes mostram um cenário bem favorável.',
  ];
  const day = new Date().getDate();
  return urgencies[day % urgencies.length];
}

/** Rotate CTA variations for freshness */
function ctaVariation(tone: Tone, ctx: BlockContext): string {
  const day = new Date().getDate();
  const name = firstName(ctx);
  const nameRef = name ? `, ${name}` : '';

  const directCTAs = [
    `Quer que eu já veja o melhor grupo pra você${nameRef}?`,
    `Faz sentido avançar com essa estratégia${nameRef}?`,
    `Posso reservar uma posição pra você${nameRef}?`,
    `Quer que eu te passe os próximos passos${nameRef}?`,
  ];

  const explainCTAs = [
    `Ficou alguma dúvida${nameRef}? Me manda aqui que eu explico.\nSe estiver alinhado, o próximo passo é simples.`,
    `Quer que eu detalhe algum ponto${nameRef}?\nSe já fez sentido, posso te passar o que precisa pra começar.`,
    `Tem alguma pergunta${nameRef}? Pode mandar sem compromisso.\nSe quiser seguir, te explico o processo — é bem simples.`,
  ];

  const consultCTAs = [
    `Não precisa decidir agora${nameRef}.\nMas se fez sentido, me chama que damos o próximo passo juntos. 💬`,
    `Pensa com calma${nameRef}.\nQuando quiser, é só me chamar que a gente organiza tudo. 💬`,
    `Sem pressa${nameRef}. Estou aqui pra quando fizer sentido.\nQualquer dúvida, pode perguntar. 💬`,
  ];

  if (tone === 0) return directCTAs[day % directCTAs.length];
  if (tone === 1) return explainCTAs[day % explainCTAs.length];
  return consultCTAs[day % consultCTAs.length];
}

// ═══════════════════════════════════════════════
// BLOCO 1 — ABERTURA (Hook + Rapport + Personalização)
// Se tem objetivo/situação do cliente → usa na abertura
// Técnica: referência pessoal + promessa específica
// ═══════════════════════════════════════════════

const abertura: BlockDefinition = {
  wa: [
    // Direta — hook curto, promessa clara
    (ctx) => {
      const name = firstName(ctx);
      const greeting = name ? `*${name}*, ` : '';
      const obj = objectiveLine(ctx);
      const asset = isImovel(ctx) ? 'seu imóvel' : 'seu veículo';

      if (obj) {
        return `${greeting}como você comentou sobre *${obj}*, montei um cenário que encaixa direto nesse plano.\n\nDá uma olhada 👇`;
      }
      return `${greeting}encontrei um caminho pra você conquistar ${asset} pagando *menos por mês* e *sem juros*. 👇`;
    },
    // Explicativa — contextualiza a oportunidade
    (ctx) => {
      const name = firstName(ctx);
      const greeting = name ? `Oi, *${name}*! ` : 'Oi! ';
      const obj = objectiveLine(ctx);

      if (obj) {
        return `${greeting}Lembrei da nossa conversa sobre *${obj}* e fiz uma análise bem detalhada.\n\nCada número aqui foi pensado pra esse objetivo. Olha só:`;
      }
      return `${greeting}Fiz uma análise detalhada e montei um cenário sob medida pra você.\n\nNão é proposta genérica — cada número aqui tem um porquê. Olha só:`;
    },
    // Consultiva — empatia + autoridade
    (ctx) => {
      const name = firstName(ctx);
      const greeting = name ? `*${name}*` : 'Oi';
      const obj = objectiveLine(ctx);
      const asset = isImovel(ctx) ? 'um imóvel' : 'um veículo';

      if (obj) {
        return `${greeting}, entendo que *${obj}* é importante pra você.\n\nPensei bastante e preparei algo diferente — com *transparência total* e focado nesse objetivo.\n\nVem comigo 👇`;
      }
      return `${greeting}, sei que decidir sobre ${asset} é uma das decisões financeiras mais importantes.\n\nPor isso preparei algo diferente — com *transparência total* e sem surpresa.\n\nVem comigo que eu te mostro 👇`;
    },
  ],
  formal: [
    (ctx) => `PROPOSTA COMERCIAL — ${ctx.consortiumType.toUpperCase()}\n═══════════════════════════════════\n${ctx.clientName ? `Cliente: ${ctx.clientName}\n` : ''}Data: ${ctx.date}\n${ctx.clientObjective ? `Objetivo: ${ctx.clientObjective}\n` : ''}\nApresentamos cenário personalizado para sua avaliação.`,
    (ctx) => `PROPOSTA COMERCIAL — ${ctx.consortiumType.toUpperCase()}\n═══════════════════════════════════\n${ctx.clientName ? `Cliente: ${ctx.clientName}\n` : ''}Data: ${ctx.date}\n${ctx.clientObjective ? `Objetivo: ${ctx.clientObjective}\n` : ''}\nProposta elaborada com base em análise individualizada.`,
    (ctx) => `PROPOSTA COMERCIAL — ${ctx.consortiumType.toUpperCase()}\n═══════════════════════════════════\n${ctx.clientName ? `Cliente: ${ctx.clientName}\n` : ''}Data: ${ctx.date}\n${ctx.clientObjective ? `Objetivo: ${ctx.clientObjective}\n` : ''}\nPlanejamento transparente focado nos seus objetivos.`,
  ],
};

// ═══════════════════════════════════════════════
// BLOCO 2 — CONTEXTO (Dor + Cenário Atual)
// ═══════════════════════════════════════════════

const contexto: BlockDefinition = {
  wa: [
    (ctx) => {
      if (isImovel(ctx)) {
        return `Hoje, quem financia imóvel paga *juros de 10% a 12% ao ano*.\nNo final do prazo, o custo quase *dobra*.\n\nMas existe outra forma — sem juros e com parcela menor.`;
      }
      return `Financiar veículo hoje significa pagar *30% a 60% a mais* do valor real.\nSão juros sobre juros que pesam no bolso por anos.\n\nSó que tem uma alternativa que inverte essa conta.`;
    },
    (ctx) => {
      if (isImovel(ctx)) {
        return `Vou te dar um contexto rápido:\n\nNo financiamento imobiliário, os juros compostos fazem você pagar quase *o dobro* do valor do imóvel.\n\nA parcela parece ok no início, mas quando soma tudo… assusta.\n\nO consórcio funciona diferente — e vou te mostrar *exatamente* como.`;
      }
      return `Olha só o cenário atual:\n\nNo financiamento de veículo, os juros compostos adicionam *30% a 60%* ao valor real do bem.\n\nOu seja: você paga pelo carro e *mais meio carro* só de juros.\n\nMas tem um caminho onde essa conta é muito diferente.`;
    },
    (ctx) => {
      if (isImovel(ctx)) {
        return `Eu sei que conquistar o imóvel próprio é um dos maiores objetivos.\n\nE sei também que olhar as condições de financiamento *desanima* — juros altos, parcelas que pesam, prazo eterno.\n\nMas existe um caminho onde *você não paga juros*.\nE é mais acessível do que parece.`;
      }
      return `Entendo que ter o veículo certo faz diferença no dia a dia.\n\nO problema é que financiar hoje sai *muito caro* — os juros transformam uma parcela "acessível" em algo que aperta o orçamento por anos.\n\nQuero te mostrar algo que muda essa equação.`;
    },
  ],
  formal: [
    (ctx) => `CENÁRIO ATUAL\n───────────────────────────────────\n${isImovel(ctx)
      ? 'O financiamento imobiliário pratica juros compostos de 10-12% a.a.,\nelevando significativamente o custo total de aquisição.'
      : 'O financiamento de veículos acrescenta 30-60% sobre o valor\nreal do bem em juros compostos.'}`,
    (ctx) => `CONTEXTO DE MERCADO\n───────────────────────────────────\n${isImovel(ctx)
      ? 'Taxas atuais de financiamento imobiliário resultam em custo\ntotal consideravelmente superior ao valor do imóvel.'
      : 'O custo efetivo do financiamento de veículos supera\nsignificativamente o valor de mercado do bem.'}`,
    (ctx) => `ANÁLISE COMPARATIVA\n───────────────────────────────────\n${isImovel(ctx)
      ? 'O financiamento imobiliário onera o comprador com juros\ncompostos durante todo o prazo contratado.'
      : 'O financiamento automotivo acumula juros que comprometem\no planejamento financeiro do comprador.'}`,
  ],
};

// ═══════════════════════════════════════════════
// BLOCO 3 — SOLUÇÃO (Consórcio como virada de chave)
// ═══════════════════════════════════════════════

const solucao: BlockDefinition = {
  wa: [
    (ctx) => {
      const lines = [
        `📋 *Seu plano personalizado:*`,
        '',
        `💰 Carta de crédito: *${ctx.creditValue}*`,
      ];
      if (ctx.hasEmbeddedBid) {
        lines.push(`   ↳ Crédito líquido: *${ctx.netCreditValue}*`);
      }
      lines.push(
        `📅 Prazo: *${ctx.termMonths} meses* (${termYears(ctx.termMonths)})`,
        parcelaLineWA(ctx),
        '',
        `✅ Sem juros bancários`,
        `✅ Quando contemplado, compra *à vista* — com poder total de negociação`,
        `✅ Parcela previsível do início ao fim`,
      );
      const reducedLine = buildReducedInstallmentLine(ctx, 'whatsapp');
      if (reducedLine) lines.push(reducedLine.trim());
      return lines.join('\n');
    },
    (ctx) => {
      const lines = [
        `📋 *Na prática, funciona assim:*`,
        '',
        `Você entra num grupo de consórcio ${ctx.consortiumType.toLowerCase()} com uma carta de *${ctx.creditValue}*.`,
      ];
      if (ctx.hasEmbeddedBid) {
        lines.push(`\nDesse total, *${ctx.netCreditValue}* é seu crédito líquido (o restante já funciona como lance automático, que *acelera* sua contemplação).`);
      }
      lines.push(
        '',
        `O investimento? *${ctx.installment} por mês* durante ${termYears(ctx.termMonths)}.`,
        '',
        `A diferença pro financiamento:`,
        `→ No financiamento, você paga *juros sobre juros*`,
        `→ No consórcio, cada parcela *vira patrimônio*`,
        '',
        `E quando for contemplado? Compra *à vista* — com desconto de quem paga na hora.`,
      );
      const reducedLine = buildReducedInstallmentLine(ctx, 'whatsapp');
      if (reducedLine) lines.push(reducedLine.trim());
      return lines.join('\n');
    },
    (ctx) => {
      const asset = isImovel(ctx) ? 'o imóvel' : 'o veículo';
      const lines = [
        `📋 *O que eu recomendo pra você:*`,
        '',
        `Um consórcio ${ctx.consortiumType.toLowerCase()} com carta de *${ctx.creditValue}*.`,
      ];
      if (ctx.hasEmbeddedBid) {
        lines.push(`(Crédito líquido de *${ctx.netCreditValue}* — parte já funciona como lance automático)`);
      }
      lines.push(
        '',
        `Parcela de *${ctx.installment}/mês* por ${termYears(ctx.termMonths)}.`,
        '',
        `Sem juros. Sem taxa surpresa. Parcela que não muda.`,
        `Quando contemplado, você escolhe ${asset} e compra *à vista* — com todo o poder de negociação que isso traz.`,
      );
      const reducedLine = buildReducedInstallmentLine(ctx, 'whatsapp');
      if (reducedLine) lines.push(reducedLine.trim());
      return lines.join('\n');
    },
  ],
  formal: [
    (ctx) => {
      const lines = [`SOLUÇÃO PROPOSTA — ${ctx.consortiumType.toUpperCase()}`, '───────────────────────────────────', `Carta de crédito:     ${ctx.creditValue}`];
      if (ctx.hasEmbeddedBid) { lines.push(`Crédito líquido:      ${ctx.netCreditValue}`, `Lance embutido:       ${ctx.embeddedBidValue}`); }
      lines.push(`Prazo:                ${ctx.termMonths} meses (${termYears(ctx.termMonths)})`, parcelaLineFormal(ctx, "Parcela mensal:      "), '', `Modalidade sem juros bancários.`, `Contemplação confere poder de compra à vista.`);
      const reducedLine = buildReducedInstallmentLine(ctx, 'formal');
      if (reducedLine) lines.push(reducedLine.trim());
      return lines.join('\n');
    },
    (ctx) => {
      const lines = [`PROPOSTA — ${ctx.consortiumType.toUpperCase()}`, '───────────────────────────────────', `Valor da carta:       ${ctx.creditValue}`];
      if (ctx.hasEmbeddedBid) { lines.push(`Crédito líquido:      ${ctx.netCreditValue}`, `  (lance embutido:    ${ctx.embeddedBidValue})`); }
      lines.push(`Prazo do plano:       ${ctx.termMonths} meses (${termYears(ctx.termMonths)})`, parcelaLineFormal(ctx, "Parcela estimada:    ", "/mês"), '', `Isento de juros compostos. Custo total transparente.`);
      const reducedLine = buildReducedInstallmentLine(ctx, 'formal');
      if (reducedLine) lines.push(reducedLine.trim());
      return lines.join('\n');
    },
    (ctx) => {
      const lines = [`CENÁRIO PROPOSTO — ${ctx.consortiumType.toUpperCase()}`, '───────────────────────────────────', `Carta de crédito:     ${ctx.creditValue}`];
      if (ctx.hasEmbeddedBid) { lines.push(`Crédito líquido:      ${ctx.netCreditValue}`, `Lance embutido:       ${ctx.embeddedBidValue}`); }
      lines.push(`Prazo total:          ${ctx.termMonths} meses`, parcelaLineFormal(ctx, "Investimento mensal: "), '', `Modalidade que substitui juros por planejamento.`);
      const reducedLine = buildReducedInstallmentLine(ctx, 'formal');
      if (reducedLine) lines.push(reducedLine.trim());
      return lines.join('\n');
    },
  ],
};

// ═══════════════════════════════════════════════
// BLOCO 4 — ESTRATÉGIA (Plano de contemplação com lance)
// ═══════════════════════════════════════════════

function buildContemplationLine(ctx: BlockContext, format: ProposalFormat): string {
  if (!ctx.contemplated || !ctx.contemplationMonth) return '';
  if (ctx.postContemplationChoice === 'reduce-installment' && ctx.installmentAfterContemplation) {
    return format === 'whatsapp'
      ? `\n\n✨ *Bônus:* Se contemplado no mês *${ctx.contemplationMonth}*, sua parcela cai pra *${ctx.installmentAfterContemplation}*.\nVocê recebe o bem *e* folga o orçamento.`
      : `\n\nProjeção pós-contemplação (mês ${ctx.contemplationMonth}): parcela de ${ctx.installmentAfterContemplation}`;
  }
  if (ctx.postContemplationChoice === 'reduce-term' && ctx.reducedTermMonths) {
    return format === 'whatsapp'
      ? `\n\n✨ *Bônus:* Se contemplado no mês *${ctx.contemplationMonth}*, o prazo cai pra *${ctx.reducedTermMonths} meses*.\nVocê quita antes e se livra das parcelas mais cedo.`
      : `\n\nProjeção pós-contemplação (mês ${ctx.contemplationMonth}): prazo reduzido para ${ctx.reducedTermMonths} meses`;
  }
  return '';
}

/** Build reduced installment mention when the strategy is active */
function buildReducedInstallmentLine(ctx: BlockContext, format: ProposalFormat): string {
  if (!ctx.reducedInstallment) return '';
  if (format === 'whatsapp') {
    return `\n\n💡 *Estratégia de Parcela Reduzida:* Começamos com parcelas menores no início, facilitando a entrada, e depois ajustamos ao longo do plano.`;
  }
  return `\n\nEstratégia de parcela reduzida: valor inicial inferior com reajuste programado ao longo do plano.`;
}

/**
 * Quando há parcela reduzida ATIVA e cliente NÃO contemplado, retorna o bloco
 * de duas fases (parcelas 1..N reduzidas; parcelas N+1..fim rediluídas).
 * Retorna `null` quando não aplicável — caller usa a linha de parcela única.
 */
function buildPhasedInstallmentBlock(ctx: BlockContext, format: ProposalFormat): string | null {
  const months = ctx.reducedInstallmentMonths;
  const reducedVal = ctx.reducedInstallmentValue;
  const redilutedVal = ctx.redilutedInstallmentValue;
  if (!ctx.reducedInstallment || ctx.contemplated) return null;
  if (!months || months <= 0 || months >= ctx.termMonths) return null;
  if (!reducedVal || !redilutedVal) return null;
  if (format === 'whatsapp') {
    return [
      `💵 Parcelas 1 a ${months}: *${reducedVal}/mês*`,
      `💵 Parcelas ${months + 1} a ${ctx.termMonths}: *${redilutedVal}/mês*`,
    ].join('\n');
  }
  return [
    `Parcelas 1 a ${months}:        ${reducedVal}/mês`,
    `Parcelas ${months + 1} a ${ctx.termMonths}:  ${redilutedVal}/mês`,
  ].join('\n');
}

/**
 * Linha de "Parcela" no bloco de resumo WhatsApp.
 * Retorna as duas fases quando aplicável; senão, a linha única tradicional.
 */
function parcelaLineWA(ctx: BlockContext): string {
  const phased = buildPhasedInstallmentBlock(ctx, 'whatsapp');
  return phased ?? `💵 Parcela: *${ctx.installment}/mês*`;
}

/**
 * Linha(s) de parcela para o formato formal. Quando há fases, retorna duas
 * linhas com cabeçalho `${label}`; senão, a linha única `${label} ${installment}`.
 */
function parcelaLineFormal(ctx: BlockContext, label: string, suffix = ''): string {
  const phased = buildPhasedInstallmentBlock(ctx, 'formal');
  if (phased) return phased;
  return `${label} ${ctx.installment}${suffix}`;
}

const estrategia: BlockDefinition = {
  condition: (ctx) => !!ctx.bidPercent && !!ctx.groupNumber,
  wa: [
    (ctx) => {
      const profileMsg: Record<string, string> = {
        conservador: 'Posição segura — você compete sem apertar o orçamento.',
        equilibrado: 'Equilíbrio entre investimento e chance real de contemplação.',
        agressivo: 'Posição forte — maximiza suas chances nas próximas assembleias.',
      };
      return `🎯 *Sua estratégia de contemplação:*\n\nGrupo *${ctx.groupNumber}* → Lance de *${ctx.bidPercent}*\n\n${profileMsg[ctx.scenarioProfile]}\n\nIsso significa que você *não depende da sorte*.\nTem um plano baseado em dados reais do grupo.${buildContemplationLine(ctx, 'whatsapp')}`;
    },
    (ctx) => {
      return `🎯 *Deixa eu te explicar a estratégia:*\n\nAnalisei o histórico de lances vencedores do grupo *${ctx.groupNumber}*.\n\nO lance de *${ctx.bidPercent}* (zona *${ctx.bidZone}*) é o ponto ideal:\n\n→ Não é o maior lance (não precisa ser)\n→ Mas é competitivo o suficiente pra te colocar no jogo\n→ Baseado em *dados reais*, não em chute\n\n${ctx.scenarioProfile === 'agressivo' ? 'Seu perfil permite entrar com força — e os números sustentam.' : 'Inteligência > sorte. É assim que se contempla.'}${buildContemplationLine(ctx, 'whatsapp')}`;
    },
    (ctx) => {
      const profileAdvice: Record<string, string> = {
        conservador: 'Pensei num cenário que cabe no seu bolso sem aperto.',
        equilibrado: 'Equilibramos risco e resultado — nem conservador demais, nem agressivo.',
        agressivo: 'É um posicionamento ousado, mas os dados históricos sustentam.',
      };
      return `🎯 *Minha recomendação:*\n\nPelo histórico do grupo *${ctx.groupNumber}*, o lance de *${ctx.bidPercent}* te coloca numa posição muito boa.\n\nO que isso significa na prática:\n→ Você não precisa dar o maior lance\n→ Precisa estar na *faixa certa* — e é exatamente onde esse valor te posiciona\n\n${profileAdvice[ctx.scenarioProfile]}${buildContemplationLine(ctx, 'whatsapp')}`;
    },
  ],
  formal: [
    (ctx) => `ESTRATÉGIA DE CONTEMPLAÇÃO\n───────────────────────────────────\nGrupo:                ${ctx.groupNumber}\nLance recomendado:    ${ctx.bidPercent} (zona ${ctx.bidZone})\nPerfil:               ${ctx.scenarioProfile}\n\nPosicionamento calculado com base em dados históricos.${buildContemplationLine(ctx, 'formal')}`,
    (ctx) => `RECOMENDAÇÃO ESTRATÉGICA\n───────────────────────────────────\nGrupo:                ${ctx.groupNumber}\nFaixa de lance:       ${ctx.bidPercent} (zona ${ctx.bidZone})\n\nRelação custo-benefício otimizada conforme histórico.${buildContemplationLine(ctx, 'formal')}`,
    (ctx) => `PLANO DE CONTEMPLAÇÃO\n───────────────────────────────────\nGrupo:                ${ctx.groupNumber}\nLance sugerido:       ${ctx.bidPercent} (zona ${ctx.bidZone})\n\nEstratégia orientada por dados para resultado controlado.${buildContemplationLine(ctx, 'formal')}`,
  ],
};

// ═══════════════════════════════════════════════
// BLOCO 4B — PLANEJAMENTO (sem lance)
// ═══════════════════════════════════════════════

const planejamento: BlockDefinition = {
  condition: (ctx) => !ctx.bidPercent || !ctx.groupNumber,
  wa: [
    (ctx) => {
      const asset = isImovel(ctx) ? 'o imóvel' : 'o veículo';
      return `📌 *Por que isso funciona:*\n\n→ Você constrói patrimônio todo mês, sem juros\n→ Cada parcela te aproxima de conquistar ${asset}\n→ Quando contemplado, compra com *poder de negociação à vista*\n\nÉ planejamento inteligente — não sorte.`;
    },
    (ctx) => {
      return `📌 *O diferencial do consórcio:*\n\nEnquanto no financiamento você paga juros sobre juros, no consórcio *cada real investido* se transforma em patrimônio.\n\nVocê pode ser contemplado por:\n→ *Sorteio* (todo mês tem)\n→ *Lance* (quando quiser acelerar)\n\nE o melhor: se precisar, pode *antecipar parcelas* e melhorar ainda mais sua posição.`;
    },
    (ctx) => {
      const asset = isImovel(ctx) ? 'seu imóvel' : 'seu veículo';
      return `📌 *O que eu gosto nesse plano:*\n\nVocê não precisa ter pressa — o consórcio respeita seu ritmo.\n\nTodo mês tem sorteio. Quando quiser acelerar, pode dar lance.\nE enquanto isso, está *construindo patrimônio* em direção a ${asset}.\n\nÉ um caminho seguro, previsível e sem juros.`;
    },
  ],
  formal: [
    () => `VANTAGENS DO PLANEJAMENTO\n───────────────────────────────────\n• Isento de juros bancários\n• Contemplação por sorteio mensal ou lance\n• Poder de compra à vista após contemplação`,
    () => `BENEFÍCIOS DA MODALIDADE\n───────────────────────────────────\n• Sem incidência de juros compostos\n• Flexibilidade de contemplação\n• Custo total significativamente inferior ao financiamento`,
    () => `DIFERENCIAL COMPETITIVO\n───────────────────────────────────\n• Planejamento financeiro sem juros\n• Múltiplas formas de contemplação\n• Previsibilidade de parcelas`,
  ],
};

// ═══════════════════════════════════════════════
// BLOCO 5 — FECHAMENTO (CTA direcionado + micro-urgência)
// Objetivo: pergunta simples, próxima ação clara, sem pressão
// ═══════════════════════════════════════════════

const fechamento: BlockDefinition = {
  wa: [
    // Direta — resumo + CTA direcionado + micro-urgência
    (ctx) => {
      const urgency = microUrgency(ctx);
      const cta = ctaVariation(0, ctx);
      return `━━━━━━━━━━━━━━━━━━━━\n📊 *Resumo:*\n💰 Carta: *${ctx.creditValue}*\n${parcelaLineWA(ctx)}\n📅 Prazo: *${ctx.termMonths} meses*\n💲 Total: *${ctx.totalCost}*\n━━━━━━━━━━━━━━━━━━━━\n\n💡 _${urgency}_\n\n${cta} 🤝`;
    },
    // Explicativa
    (ctx) => {
      const urgency = microUrgency(ctx);
      const cta = ctaVariation(1, ctx);
      return `━━━━━━━━━━━━━━━━━━━━\n📊 *Resumo do plano:*\n💰 Carta: *${ctx.creditValue}*\n${parcelaLineWA(ctx)}\n📅 Prazo: *${ctx.termMonths} meses*\n💲 Total: *${ctx.totalCost}*\n━━━━━━━━━━━━━━━━━━━━\n\nSem taxas escondidas. O que está aqui é o que é.\n\n💡 _${urgency}_\n\n${cta} 📋`;
    },
    // Consultiva
    (ctx) => {
      const urgency = microUrgency(ctx);
      const cta = ctaVariation(2, ctx);
      return `━━━━━━━━━━━━━━━━━━━━\n📊 *Seu cenário:*\n💰 Carta: *${ctx.creditValue}*\n${parcelaLineWA(ctx)}\n📅 Prazo: *${ctx.termMonths} meses*\n💲 Total: *${ctx.totalCost}*\n━━━━━━━━━━━━━━━━━━━━\n\n💡 _${urgency}_\n\n${cta}`;
    },
  ],
  formal: [
    (ctx) => {
      const phased = buildPhasedInstallmentBlock(ctx, 'formal');
      const parcelaLine = phased ?? `Parcela: ${ctx.installment} x ${ctx.termMonths} meses`;
      return `═══════════════════════════════════\nInvestimento total: ${ctx.totalCost}\n${parcelaLine}\n\nPróximo passo: formalização.\nEstou à disposição para esclarecimentos.\n\n${DISCLAIMERS.WHATSAPP_FORMAL_FULL}`;
    },
    (ctx) => {
      const phased = buildPhasedInstallmentBlock(ctx, 'formal');
      const parcelaLine = phased ?? `Condição: ${ctx.termMonths}x de ${ctx.installment}`;
      return `═══════════════════════════════════\nInvestimento total: ${ctx.totalCost}\n${parcelaLine}\n\nFicamos à disposição para esclarecimentos\ne agendamento de formalização.\n\n${DISCLAIMERS.WHATSAPP_FORMAL_SHORT}`;
    },
    (ctx) => {
      const phased = buildPhasedInstallmentBlock(ctx, 'formal');
      const parcelaLine = phased ?? `Condição: ${ctx.termMonths}x de ${ctx.installment}`;
      return `═══════════════════════════════════\nInvestimento total: ${ctx.totalCost}\n${parcelaLine}\n\nProposta elaborada com total transparência.\nDisponível para dar andamento quando considerar oportuno.\n\n${DISCLAIMERS.WHATSAPP_FORMAL_SHORT}`;
    },
  ],
};

// ─── Block registry (ordered) ───

const BLOCKS: BlockDefinition[] = [
  abertura,
  contexto,
  solucao,
  estrategia,
  planejamento,
  fechamento,
];

// ─── Helpers for new standalone templates ───

function lanceMedio(ctx: BlockContext): string {
  return ctx.bidPercent || 'histórica do grupo';
}

// ═══════════════════════════════════════════════
// STANDALONE WHATSAPP TEMPLATES (3 tones × 2 lengths)
// ═══════════════════════════════════════════════

function waDirectShort(ctx: BlockContext): string {
  const name = firstName(ctx);
  const reduced = ctx.reducedInstallment ? `\n\n💡 _Começamos com parcelas menores no início, facilitando a entrada, e depois ajustamos ao longo do plano._` : '';
  return [
    `${name}, separei uma proposta objetiva pra você. 👇`,
    '',
    `💰 Carta: *${ctx.creditValue}*`,
    parcelaLineWA(ctx),
    `📅 Prazo: *${ctx.termMonths} meses*`,
    `💲 Total investido: *${ctx.totalCost}*`,
    '',
    `Sem juros. Quando contemplado, compra à vista — e quem compra à vista negocia desconto.`,
    reduced,
    `Quer os próximos passos? 🤝`,
  ].filter(Boolean).join('\n');
}

function waDirectFull(ctx: BlockContext): string {
  const name = firstName(ctx);
  const bid = lanceMedio(ctx);
  const reduced = ctx.reducedInstallment ? `\n💡 *Parcela reduzida:* Começamos com parcelas menores no início, facilitando a entrada, e depois ajustamos ao longo do plano.\n` : '';
  return [
    `${name}, fiz a simulação completa pra você. Veja o que encontrei:`,
    '',
    `📋 *Seu plano:*`,
    `💰 Carta: *${ctx.creditValue}*`,
    parcelaLineWA(ctx),
    `📅 Prazo: *${ctx.termMonths} meses* (${termYears(ctx.termMonths)})`,
    `💲 Total: *${ctx.totalCost}*`,
    reduced,
    `O que isso significa na prática:`,
    `→ Sem juros bancários — você paga só o valor real do imóvel mais as taxas administrativas`,
    `→ Contemplação por sorteio todo mês — ou por lance quando quiser acelerar`,
    `→ Na contemplação, compra à vista — com poder de negociação real`,
    '',
    `*Por que isso importa:*`,
    `No financiamento tradicional, o custo final de um imóvel de ${ctx.creditValue} pode chegar a mais do dobro. Aqui, o total é ${ctx.totalCost} — e você ainda compra com desconto à vista.`,
    '',
    `━━━━━━━━━━━━━━━━━━━━`,
    `💡 *Cenário atual do grupo:* lances na faixa de ${bid}% — momento favorável para entrar.`,
    `━━━━━━━━━━━━━━━━━━━━`,
    '',
    `Me fala o que achou. Se fizer sentido, te passo os próximos passos. 🤝`,
  ].filter(Boolean).join('\n');
}

function waExplainShort(ctx: BlockContext): string {
  const name = firstName(ctx);
  const reduced = ctx.reducedInstallment ? `\n💡 _E tem mais: as primeiras parcelas são menores, facilitando a entrada no plano._\n` : '';
  return [
    `${name}, vou te explicar de forma simples o que montei pra você.`,
    '',
    `Consórcio não é sorteio de loteria — é um grupo de pessoas comprando juntas, sem banco no meio. Sem juros.`,
    '',
    `*O seu cenário:*`,
    `💰 Carta de *${ctx.creditValue}*`,
    `💵 Parcela de *${ctx.installment}/mês*`,
    `📅 ${ctx.termMonths} meses — você é contemplado por sorteio ou lance`,
    reduced,
    `Quando contemplado: recebe a carta de crédito e compra à vista. Quem compra à vista consegue negociar — isso já vale uma boa economia.`,
    '',
    `Ficou alguma dúvida? Me pergunta aqui. 👇`,
  ].filter(Boolean).join('\n');
}

function waExplainFull(ctx: BlockContext): string {
  const name = firstName(ctx);
  const bid = lanceMedio(ctx);
  const reduced = ctx.reducedInstallment ? `\n💡 *Parcela reduzida:* As primeiras parcelas são menores, facilitando a entrada no plano. Depois, o valor é ajustado ao longo do tempo.\n` : '';
  return [
    `${name}, deixa eu te explicar direitinho como isso funciona — porque consórcio ainda gera muita dúvida, e você merece entender antes de decidir.`,
    '',
    `*Como funciona na prática:*`,
    `Você entra num grupo de pessoas com o mesmo objetivo — adquirir um imóvel de *${ctx.creditValue}*. Todo mês, uma ou mais pessoas do grupo são contempladas por sorteio ou lance e recebem a carta de crédito para comprar.`,
    '',
    `Enquanto não é contemplado, você paga *${ctx.installment}/mês* — sem juros, sem correção surpresa.`,
    reduced,
    `*Por que o lance faz diferença:*`,
    `Se quiser ser contemplado antes do sorteio, pode oferecer um lance — um percentual do valor da carta que você antecipa. O grupo tem mostrado lances na faixa de ${bid}% — o que significa que com planejamento é possível antecipar a contemplação significativamente.`,
    '',
    `*O que acontece quando você é contemplado:*`,
    `Recebe *${ctx.creditValue}* em carta de crédito e compra o imóvel à vista. Vendedor que recebe à vista negocia. Essa diferença pode representar de 5% a 10% de desconto.`,
    '',
    `━━━━━━━━━━━━━━━━━━━━`,
    `📊 *Resumo do seu plano:*`,
    `💰 Carta: *${ctx.creditValue}*`,
    parcelaLineWA(ctx),
    `📅 Prazo: *${ctx.termMonths} meses*`,
    `💲 Total: *${ctx.totalCost}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    '',
    `Ficou alguma dúvida? Me pergunta — estou aqui pra explicar o que precisar. 👇`,
  ].filter(Boolean).join('\n');
}

function waConsultShort(ctx: BlockContext): string {
  const name = firstName(ctx);
  const reduced = ctx.reducedInstallment ? ` E as primeiras parcelas são menores, facilitando a entrada.` : '';
  return [
    `${name}, analisei sua situação e montei um cenário que faz sentido pra você.`,
    '',
    `Não vou te mandar uma proposta genérica — isso não te ajuda a decidir.`,
    '',
    `O que encontrei: uma carta de *${ctx.creditValue}* com parcela de *${ctx.installment}/mês*. Sem juros. Prazo de ${ctx.termMonths} meses com possibilidade real de contemplação antes, dependendo da sua estratégia de lance.${reduced}`,
    '',
    `Quando fizer sentido pra você conversar, me chama. Sem pressa — mas sem deixar passar uma boa janela também. 😉`,
  ].join('\n');
}

function waConsultFull(ctx: BlockContext): string {
  const name = firstName(ctx);
  const bid = lanceMedio(ctx);
  const reduced = ctx.reducedInstallment ? `\n💡 *Parcela reduzida:* Começamos com parcelas menores, facilitando a entrada. Depois, o valor é ajustado gradualmente.\n` : '';
  return [
    `${name}, sei que uma decisão do tamanho de um imóvel não se toma na pressa. Por isso fui cuidadoso na análise que fiz pra você.`,
    '',
    `*O que eu encontrei:*`,
    `Um caminho que preserva seu patrimônio sem te colocar numa armadilha de juros compostos por décadas.`,
    '',
    `Um consórcio imobiliário com carta de *${ctx.creditValue}*, parcela de *${ctx.installment}/mês*, por ${ctx.termMonths} meses. Total investido: ${ctx.totalCost} — contra mais do dobro que você pagaria num financiamento equivalente.`,
    reduced,
    `*O que isso significa pra você especificamente:*`,
    `→ Parcela previsível — você consegue planejar`,
    `→ Sem juros — cada real vai para o seu imóvel, não pro banco`,
    `→ Na contemplação, poder de compra à vista — e desconto real na negociação`,
    '',
    `*Sobre o timing:*`,
    `O grupo está num momento favorável. Lances na faixa de ${bid}% — abaixo da média histórica. Quem entra agora tem uma janela interessante.`,
    '',
    `━━━━━━━━━━━━━━━━━━━━`,
    `📊 *Seu cenário:*`,
    `💰 Carta: *${ctx.creditValue}*`,
    parcelaLineWA(ctx),
    `📅 Prazo: *${ctx.termMonths} meses*`,
    `💲 Total: *${ctx.totalCost}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    '',
    `Não precisa responder agora. Mas se surgir qualquer dúvida — sobre o processo, sobre o grupo, sobre a estratégia de lance — me chama. Estou aqui pra isso. 💬`,
  ].filter(Boolean).join('\n');
}

// Standalone template lookup: [tone][length]
const WA_TEMPLATES: Record<Tone, Record<'short' | 'full', (ctx: BlockContext) => string>> = {
  0: { short: waDirectShort, full: waDirectFull },
  1: { short: waExplainShort, full: waExplainFull },
  2: { short: waConsultShort, full: waConsultFull },
};

/** Build a standardized subObjetivo line, appended after the main proposal body. */
function buildSubObjetivoLine(ctx: BlockContext, format: ProposalFormat): string {
  const texto = getSubObjetivoTexto(ctx.subObjetivo);
  if (!texto) return '';
  if (format === 'whatsapp') {
    return `\n\n🎯 _Pensando em *${texto}*, essa estratégia faz muito sentido pra você._`;
  }
  return `\n\nObservação: estratégia alinhada ao objetivo de ${texto}.`;
}

/**
 * Linha complementar quando o cliente utilizou a carta para aquisição de bem
 * após a contemplação (cenário em que o seguro Prestamista passa a vigorar
 * somente a partir do mês de utilização).
 */
function buildUsedCreditLine(ctx: BlockContext, format: ProposalFormat): string {
  if (!ctx.usedCreditForAsset) return '';
  const mes = ctx.creditUsageMonth && ctx.creditUsageMonth > 0 ? ctx.creditUsageMonth : null;
  if (format === 'whatsapp') {
    return mes
      ? `\n\n🛡️ _Seguro Prestamista incide a partir do mês *${mes}* (utilização da carta para aquisição do bem)._`
      : `\n\n🛡️ _Seguro Prestamista incide a partir do mês de utilização da carta para aquisição do bem._`;
  }
  return mes
    ? `\n\nObservação: o seguro Prestamista passa a vigorar a partir do mês ${mes}, quando a carta é utilizada para aquisição do bem.`
    : `\n\nObservação: o seguro Prestamista passa a vigorar a partir do mês de utilização da carta para aquisição do bem.`;
}

/**
 * Linha de aviso INPC: inserida quando o reajuste foi ativado na simulação.
 * Não promete contemplação. Apenas sinaliza que os valores futuros são projeção.
 */
function buildInpcNoticeLine(ctx: BlockContext, format: ProposalFormat): string {
  const p = Number(ctx.annualAdjustmentPercent || 0);
  if (!(p > 0)) return '';
  const txt = `Simulação com projeção de reajuste INPC de ${p}% a.a. — valores futuros são estimativas.`;
  return format === 'whatsapp'
    ? `\n\n⚠️ ${txt}`
    : `\n\n⚠️ ${txt}`;
}




/**
 * Render all proposal blocks for a given format and tone.
 * WhatsApp uses standalone templates; formal uses block system.
 */
export function renderProposal(ctx: BlockContext, format: ProposalFormat, tone: Tone): string {
  let text: string;
  if (format === 'whatsapp') {
    text = WA_TEMPLATES[tone].full(ctx);
  } else {
    const blocks: string[] = [];
    for (const block of BLOCKS) {
      if (block.condition && !block.condition(ctx)) continue;
      const variants = block.formal;
      blocks.push(variants[tone](ctx));
    }
    text = blocks.join('\n\n');
  }
  text += buildSubObjetivoLine(ctx, format);
  text += buildUsedCreditLine(ctx, format);
  text += buildInpcNoticeLine(ctx, format);
  return applyBusinessRules(text, {
    reducedInstallment: ctx.reducedInstallment,
    format,
  });
}

/**
 * Render SHORT version.
 * WhatsApp uses standalone templates; formal uses block system.
 */
export function renderShortProposal(ctx: BlockContext, format: ProposalFormat, tone: Tone): string {
  let text: string;
  if (format === 'whatsapp') {
    text = WA_TEMPLATES[tone].short(ctx);
  } else {
    const shortBlocks: BlockDefinition[] = [abertura, solucao, fechamento];
    const blocks: string[] = [];
    for (const block of shortBlocks) {
      if (block.condition && !block.condition(ctx)) continue;
      const variants = block.formal;
      blocks.push(variants[tone](ctx));
    }
    text = blocks.join('\n\n');
  }
  text += buildSubObjetivoLine(ctx, format);
  text += buildUsedCreditLine(ctx, format);
  text += buildInpcNoticeLine(ctx, format);
  return applyBusinessRules(text, {
    reducedInstallment: ctx.reducedInstallment,
    format,
  });
}

/**
 * Deterministic tone selection based on proposal data.
 */
export function selectTone(clientName: string, creditValue: number, termMonths: number): Tone {
  const str = `${clientName}${creditValue}${termMonths}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 3) as Tone;
}
