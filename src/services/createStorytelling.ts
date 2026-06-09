/**
 * Storytelling generator v3 — organic, varied, human narratives.
 * 
 * Improvements over v2:
 * - 3 structural variations (classic, problem-first, result-first)
 * - 3 tone styles (direct, conversational, analytical)
 * - Human elements (hesitation, doubt, small objections)
 * - Micro-variations in connectives, rhythm, paragraph length
 * - Repetition control via lightweight history
 */

import type { ClientObjective, ClientSituation, UrgencyLevel } from '@/components/modules/diagnostic/DiagnosticContext';
import { formatCurrency } from '@/core/finance';
import { getSubObjetivoTexto } from '@/utils/getSubObjetivoTexto';

// ═══════ TYPES ═══════

export interface StorytellingInput {
  clientName: string;
  clientObjective: ClientObjective;
  clientSituation: ClientSituation;
  monthlyCapacity: number;
  urgencyLevel: UrgencyLevel;
  creditValue?: number;
  termMonths?: number;
  installment?: number;
  /** Refinamento opcional do objetivo (label legível, ex: "Reforma"). */
  subObjetivo?: string;
}

export interface StorytellingResult {
  title: string;
  narrative: string;
  whatsapp: string;
  highlights: string[];
}

// ═══════ HELPERS ═══════

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Pick from array avoiding last used index */
function pickAvoid<T>(arr: T[], avoidIndex: number): { value: T; index: number } {
  if (arr.length <= 1) return { value: arr[0], index: 0 };
  let idx: number;
  do { idx = Math.floor(Math.random() * arr.length); } while (idx === avoidIndex);
  return { value: arr[idx], index: idx };
}

function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

function capacityBand(monthly: number): string {
  if (monthly <= 0) return '';
  if (monthly < 1000) return 'menos de R$1.000';
  if (monthly < 2000) return 'cerca de R$1.500';
  if (monthly < 3000) return 'por volta de R$2.500';
  if (monthly < 5000) return 'entre R$3.000 e R$5.000';
  return 'acima de R$5.000';
}

// ═══════ REPETITION CONTROL ═══════
// Lightweight in-memory history to avoid consecutive repeats

const _history = {
  lastOpeningIdx: -1,
  lastVariantIdx: -1,
  lastTone: '' as string,
  lastStructure: '' as string,
};

// ═══════ TONE STYLES ═══════

type ToneStyle = 'direct' | 'conversational' | 'analytical';

const TONE_STYLES: ToneStyle[] = ['direct', 'conversational', 'analytical'];

const TONE_CONNECTIVES: Record<ToneStyle, string[]> = {
  direct: ['O fato é que', 'Na prática', 'Simples assim', 'Direto ao ponto'],
  conversational: ['E aí, sabe o que aconteceu?', 'Olha só', 'Pra você ter ideia', 'A real é que'],
  analytical: ['Quando analisamos os números', 'Do ponto de vista financeiro', 'Na conta final', 'Matematicamente falando'],
};

// ═══════ HUMAN ELEMENTS ═══════

const HESITATIONS = [
  'No começo, ele ficou inseguro — e é normal. Todo mundo fica.',
  'Ela confessou que quase desistiu na primeira conversa. "Será que vale a pena?"',
  'Ele hesitou. Me pediu pra mandar tudo por escrito pra pensar com calma.',
  'No início ela disse: "Não sei se é pra mim." Eu entendi — é muita informação de uma vez.',
  'Ele ficou quieto uns 10 segundos depois que mostrei os números. Dava pra ver que estava processando.',
];

const SMALL_OBJECTIONS = [
  'A primeira reação dele foi: "Mas consórcio não demora muito?" — a pergunta que todo mundo faz.',
  'Ela me perguntou: "E se eu não for contemplado cedo?" — legítimo, e a gente montou o plano pensando nisso.',
  'Ele disse: "Já vi gente reclamar de consórcio." Eu respondi: "Também já vi gente reclamar de financiamento. A diferença está nos números."',
  'A dúvida dela era: "Não é melhor juntar e comprar à vista?" — fizemos a conta juntos e a resposta ficou clara.',
];

// ═══════ STRUCTURAL VARIATIONS ═══════

type NarrativeStructure = 'classic' | 'problem-first' | 'result-first';

const STRUCTURES: NarrativeStructure[] = ['classic', 'problem-first', 'result-first'];

// ═══════ OPENINGS ═══════

const OPENINGS_WITH_NAME = [
  '{name}, essa semana lembrei de um caso que tem tudo a ver com o que você me contou.',
  '{name}, vou te contar uma coisa que aconteceu com outro cliente meu — a situação dele era quase idêntica à sua.',
  '{name}, antes de continuar, deixa eu te contar uma história rápida. Acho que vai fazer sentido pra você.',
  '{name}, sabe o que aconteceu com um cliente meu que estava na mesma situação que você?',
  '{name}, outro dia atendi alguém com um cenário muito parecido com o seu. Deixa eu te contar.',
  '{name}, quer ouvir o que aconteceu com alguém que pensava exatamente como você?',
  '{name}, deixa eu te mostrar um caso real — pode mudar a forma como você enxerga isso.',
];

const OPENINGS_WITHOUT_NAME = [
  'Essa semana lembrei de um caso que tem tudo a ver com o que estamos conversando.',
  'Vou te contar uma coisa que aconteceu com outro cliente meu — a situação dele era quase idêntica.',
  'Antes de continuar, deixa eu te contar uma história rápida. Acho que vai fazer sentido.',
  'Sabe o que aconteceu com um cliente meu que estava na mesma situação?',
  'Outro dia atendi alguém com um cenário muito parecido. Deixa eu te contar.',
  'Quer ouvir um caso real? Pode mudar a forma como você enxerga isso.',
  'Deixa eu te mostrar o que aconteceu com alguém que pensava igual.',
];

// Problem-first openings (no persona intro)
const PROBLEM_FIRST_OPENINGS = [
  'Imagina pagar {rentValue} todo mês durante {rentYears} anos e não ter nada pra mostrar no final.',
  'Sabe aquela sensação de trabalhar o mês inteiro e ver o dinheiro indo pro bolso de outra pessoa?',
  'Quanto dinheiro uma pessoa perde em {rentYears} anos de aluguel? A resposta assusta.',
  'Todo mundo fala em investir. Mas e quem está perdendo dinheiro sem perceber?',
];

// Result-first openings
const RESULT_FIRST_OPENINGS = [
  'Há 8 meses, ele estava na mesma situação que você. Hoje, está com a chave do imóvel próprio na mão.',
  'Uma cliente minha saiu do aluguel em menos de um ano. E ela pagava menos do que você imagina.',
  'Sabe aquele caso que parece bom demais? Pois é, aconteceu de verdade — com números reais.',
  'O desfecho dessa história é simples: patrimônio próprio, sem juros, sem dívida longa.',
];

// ═══════ SITUATION VARIANTS ═══════

interface SituationVariant {
  persona: string;
  problem: string;
  decision: string;
  result: string;
  beforeAfter: [string, string];
}

const SITUATION_VARIANTS: Record<string, SituationVariant[]> = {
  'pagando-aluguel': [
    {
      persona: 'um cara de {age} anos, casado, dois filhos, pagando {rentValue} de aluguel num apartamento de 2 quartos',
      problem: 'Ele fez a conta comigo: nos últimos {rentYears} anos, já tinha jogado fora mais de {totalRent} em aluguel. Esse dinheiro nunca voltou, nunca valorizou, nunca virou nada. Ele estava basicamente pagando o imóvel de outra pessoa.',
      decision: 'Quando coloquei no papel que a parcela do consórcio ficaria em {installment} — praticamente o que ele já gastava de aluguel — ele parou e disse: "Espera, eu já pago isso todo mês e não fico com nada?"',
      result: 'Ele entrou no consórcio, ofereceu lance com FGTS, e em {contemplationTime} já estava com a chave na mão. Hoje, cada parcela que ele paga vai pro patrimônio dele. O aluguel acabou.',
      beforeAfter: ['Pagava {rentValue}/mês sem construir nada', 'Mesmo valor constrói patrimônio próprio'],
    },
    {
      persona: 'uma profissional liberal que morava de aluguel há {rentYears} anos',
      problem: 'Ela gostava do bairro, mas cada vez que o contrato renovava, vinha reajuste. Em {rentYears} anos, o aluguel dela já tinha subido quase 40%. E ela continuava sem nada no nome.',
      decision: 'Mostrei que com {installment} por mês — menos que o aluguel com condomínio que ela pagava — ela poderia construir patrimônio real. Sem juros bancários, sem entrada enorme, sem burocracia de financiamento.',
      result: 'Ela entrou, usou o FGTS como lance estratégico, e conseguiu a contemplação antes do prazo. Agora mora no próprio apartamento, no mesmo bairro, pagando menos do que pagava de aluguel.',
      beforeAfter: ['Aluguel com reajuste todo ano', 'Parcela fixa construindo patrimônio'],
    },
  ],
  'tem-fgts': [
    {
      persona: 'um servidor público com mais de {fgtsYears} anos de CLT acumulados',
      problem: 'O FGTS dele estava parado, rendendo TR + 3% ao ano. Na prática, estava perdendo pra inflação. Em {fgtsYears} anos de trabalho, juntou {fgtsAmount} — e esse valor estava encolhendo em poder de compra, mês a mês, em silêncio.',
      decision: 'Em vez de deixar o dinheiro morrendo na conta, ele usou como lance no consórcio. Transformou um recurso estagnado em uma alavanca de contemplação — sem tirar um centavo extra do bolso.',
      result: 'Foi contemplado em menos de um ano. O FGTS que estava parado virou a entrada do imóvel próprio. Ele me ligou depois e disse: "Se eu soubesse que era tão simples, tinha feito há 5 anos."',
      beforeAfter: ['FGTS parado perdendo pra inflação', 'FGTS virou entrada do imóvel próprio'],
    },
    {
      persona: 'uma professora com {fgtsYears} anos de contribuição',
      problem: 'Ela nem lembrava quanto tinha de FGTS. Quando consultamos: {fgtsAmount}. Tudo parado, rendendo quase nada. Ela ficou surpresa — não sabia que esse dinheiro podia ser usado de outra forma.',
      decision: 'Montamos a estratégia: entrar no consórcio com parcela de {installment} e usar o FGTS inteiro como lance. A chance de contemplação com esse lance era altíssima.',
      result: 'Deu certo. Em poucos meses ela já tinha a carta contemplada. Saiu do apê alugado e entrou no próprio — usando um recurso que ela nem contava como "dinheiro de verdade".',
      beforeAfter: ['FGTS esquecido rendendo 3% a.a.', 'Transformado em imóvel próprio'],
    },
  ],
  'saindo-financiamento': [
    {
      persona: 'um engenheiro que tinha um financiamento imobiliário há 8 anos',
      problem: 'Ele fez as contas comigo e quase não acreditou: do total que já tinha pago, mais de 60% era juros. Estava pagando {financingPayment} por mês, e o saldo devedor mal tinha caído. Ele disse: "Estou trabalhando pro banco."',
      decision: 'Mostrei o comparativo: no consórcio, ele pagaria taxa de administração — não juros compostos. A economia total ao longo do prazo chegava a {savings}. Ele não precisou de mais argumentos.',
      result: 'Ele quitou o financiamento, entrou no consórcio para a próxima aquisição, e hoje dorme tranquilo sabendo que não está mais enriquecendo banco nenhum.',
      beforeAfter: ['60% da parcela era juros pro banco', 'Zero juros, 100% patrimônio'],
    },
    {
      persona: 'um casal jovem que tinha entrado num financiamento sem pesquisar alternativas',
      problem: 'Quando fizeram a conta do CET (custo efetivo total), descobriram que iam pagar quase o triplo do valor do imóvel. A parcela de {financingPayment} mal amortizava o saldo nos primeiros anos.',
      decision: 'Apresentei o consórcio como estratégia para a segunda aquisição. Sem juros, parcela menor, e possibilidade de lance pra antecipar. Eles entenderam na hora: "A gente não vai cometer o mesmo erro."',
      result: 'Hoje eles usam o consórcio como ferramenta de planejamento patrimonial. A mentalidade mudou: de "parcela como dívida" pra "parcela como investimento".',
      beforeAfter: ['Pagavam o triplo do valor em juros', 'Consórcio sem juros para a próxima'],
    },
  ],
  'pj-custo-alto': [
    {
      persona: 'um dono de clínica odontológica que pagava {rentValue} de aluguel no ponto comercial',
      problem: 'A cada ano vinha o reajuste — e ele não podia se mudar porque os clientes já conheciam o endereço. Estava refém do locador. O aluguel já tinha consumido mais de {totalRent} nos últimos {rentYears} anos.',
      decision: 'Montamos um plano com consórcio empresarial: parcela de {installment} que cabia no fluxo de caixa. Sem juros, sem entrada exorbitante. A empresa poderia adquirir o ponto sem comprometer o capital de giro.',
      result: 'Ele foi contemplado, comprou a sala comercial, e agora o que era aluguel virou patrimônio da empresa. O custo fixo caiu, e ele ganhou liberdade pra investir na operação.',
      beforeAfter: ['Aluguel comercial de {rentValue} sem retorno', 'Sede própria no patrimônio da empresa'],
    },
    {
      persona: 'uma advogada sócia de um escritório que operava em espaço alugado',
      problem: 'O escritório estava crescendo, mas o aluguel acompanhava — e às vezes ultrapassava. Cada reforma que ela fazia no espaço, sabia que era dinheiro investido no imóvel de outro.',
      decision: 'Com parcela de {installment} e sem juros, o consórcio fez mais sentido que qualquer linha de crédito PJ. Ela colocou como despesa operacional e o fluxo de caixa absorveu naturalmente.',
      result: 'Comprou a sala. O escritório agora funciona em sede própria, com a placa na porta. As reformas são investimento real. O aluguel? Nunca mais.',
      beforeAfter: ['Reformava imóvel alugado', 'Sede própria valorizada a cada melhoria'],
    },
  ],
  'saldo-parado': [
    {
      persona: 'um empresário que tinha {fgtsAmount} parado entre poupança e CDB de banco grande',
      problem: 'Ele achava que estava "investindo", mas o rendimento real — descontada a inflação — era praticamente zero. Em 3 anos, o poder de compra daquele dinheiro tinha caído. Ele estava perdendo dinheiro achando que estava guardando.',
      decision: 'Mostrei uma conta simples: se ele usasse parte como lance no consórcio e o restante em um investimento melhor, em poucos meses teria um patrimônio imobiliário e o dinheiro restante rendendo de verdade.',
      result: 'Ele usou {fgtsAmount} como lance, foi contemplado rápido, e comprou um imóvel que já se valorizou mais do que tudo que a poupança teria rendido em 10 anos.',
      beforeAfter: ['Dinheiro na poupança perdendo pra inflação', 'Patrimônio imobiliário que valoriza'],
    },
    {
      persona: 'uma médica que juntava dinheiro na conta corrente sem saber o que fazer',
      problem: 'Ela tinha disciplina pra guardar, mas não sabia como fazer o dinheiro trabalhar. O saldo ficava lá, parado, enquanto os imóveis da região que ela queria subiam de preço todo ano.',
      decision: 'Sugeri usar parte do saldo como lance agressivo no consórcio. Com a capacidade mensal dela de {capacityBand}, a parcela era confortável. O lance dava uma vantagem enorme na contemplação.',
      result: 'Foi contemplada em 4 meses. Comprou o apartamento que vinha namorando há 2 anos — antes que subisse mais. O dinheiro parado virou endereço próprio.',
      beforeAfter: ['Saldo parado enquanto imóveis subiam', 'Dinheiro virou patrimônio antes da alta'],
    },
  ],
  'primeiro-imovel': [
    {
      persona: 'um casal de 28 anos, ambos CLT, sem filhos ainda, morando de aluguel',
      problem: 'Eles achavam que precisavam de R$80 mil de entrada pra comprar qualquer coisa. Tinham olhado financiamento e desistido quando viram os juros. Estavam quase conformados com a ideia de "alugar pra sempre".',
      decision: 'Quando mostrei que com {installment} por mês — sem entrada, sem juros — eles já poderiam iniciar o caminho pro primeiro apê, os dois se olharam. Ela disse: "A gente paga mais que isso de aluguel hoje."',
      result: 'Entraram no consórcio, juntaram FGTS dos dois como lance, e em menos de 2 anos estavam assinando a escritura. Primeiro imóvel. Sem dívida. Sem juros.',
      beforeAfter: ['Achavam que precisavam de R$80 mil de entrada', 'Primeiro apê sem entrada e sem juros'],
    },
    {
      persona: 'um desenvolvedor de software, 26 anos, solteiro, que morava com os pais',
      problem: 'Ele ganhava bem mas não conseguia se organizar pra sair de casa. Financiamento pedia comprovação complicada pra autônomo, e ele não queria se amarrar a 30 anos de juros.',
      decision: 'O consórcio resolveu os dois problemas: parcela acessível de {installment}, sem juros, e sem a burocracia do financiamento tradicional. Ele percebeu que podia planejar sem se endividar.',
      result: 'Juntou um lance em 8 meses, foi contemplado, e comprou um studio perto do trabalho. Saiu da casa dos pais com patrimônio próprio — não com dívida.',
      beforeAfter: ['Morava com os pais sem perspectiva', 'Studio próprio com patrimônio no nome'],
    },
  ],
};

// ═══════ TITLES ═══════

const OBJECTIVE_TITLES: Record<string, string[]> = {
  'comprar-imovel': ['🏠 Como ele saiu do zero ao imóvel próprio', '🏠 A história de quem parou de pagar o sonho dos outros', '🏠 Do aluguel à escritura — sem juros'],
  'sair-aluguel': ['🔑 De inquilino a proprietário', '🔑 O dia que o aluguel virou patrimônio', '🔑 Cada parcela agora é dele'],
  'investir': ['📈 Quando guardar dinheiro virou perder dinheiro', '📈 A virada de quem parou de perder pra inflação', '📈 De poupança pra patrimônio real'],
  'trocar-imovel': ['🔄 Trocando de imóvel sem loucura', '🔄 O upgrade que fez sentido financeiro'],
  'patrimonio': ['💎 Patrimônio que cresce enquanto você dorme', '💎 Como ele construiu patrimônio sem dívida'],
  'negocio-pj': ['🏢 De inquilino a dono do ponto', '🏢 Quando o aluguel parou de comer a margem'],
};

// ═══════ URGENCY CLOSINGS ═══════

const URGENCY_CLOSINGS: Record<string, string[]> = {
  alta: [
    'Ele me disse uma coisa que ficou na minha cabeça: "Se eu tivesse esperado mais um mês, as condições já tinham mudado." Às vezes o timing é tudo.',
    'O interessante é que ele não ficou semanas pensando. Analisou, entendeu os números, e agiu. Três meses depois já estava com a chave.',
    'Ela me ligou dois dias depois e disse: "Não quero ser a pessoa que olha pra trás e pensa: por que não fiz antes?"',
  ],
  media: [
    'Ele não fez nada no impulso. Levou uma semana pra pensar, revisou os números comigo, e quando decidiu, já sabia exatamente o que queria. Planejamento inteligente.',
    'Ela me disse: "Não vou fazer nada no desespero, mas também não vou deixar pra quando ficar mais caro." Planejou por um mês e entrou na hora certa.',
    'Levou duas semanas pra decidir. E tudo bem — foi o tempo que ele precisou pra se convencer pelos números, não pela emoção.',
  ],
  baixa: [
    'Ele fez tudo com calma. Estudou por semanas, comparou cenários, e quando entrou, estava tão preparado que o lance dele foi certeiro. Planejamento de verdade.',
    'Ela não tinha pressa — mas também não ficou parada. Usou o tempo a favor, entrou no momento certo, e quando a oportunidade apareceu, já estava pronta.',
  ],
};

// ═══════ TRANSITIONS ═══════

const TRANSITIONS_TO_DECISION = [
  'Foi aí que fizemos uma conta simples juntos.',
  'Quando coloquei os números na mesa, ficou claro.',
  'Aí mostrei uma alternativa que ele não tinha considerado.',
  'Foi quando analisamos o consórcio como estratégia — não como produto.',
  'Sentamos, abrimos a planilha, e a conta falou por si.',
];

// ═══════ GENERATOR ═══════

export function createStorytelling(input: StorytellingInput): StorytellingResult {
  const situation = input.clientSituation || 'pagando-aluguel';
  const objective = input.clientObjective || 'comprar-imovel';

  // Pick variant avoiding last used
  const variants = SITUATION_VARIANTS[situation] || SITUATION_VARIANTS['pagando-aluguel'];
  const { value: variant, index: variantIdx } = pickAvoid(variants, _history.lastVariantIdx);
  _history.lastVariantIdx = variantIdx;

  // Pick title
  const titles = OBJECTIVE_TITLES[objective] || OBJECTIVE_TITLES['comprar-imovel'];
  const title = pick(titles);

  // Pick opening avoiding last used
  const openings = input.clientName ? OPENINGS_WITH_NAME : OPENINGS_WITHOUT_NAME;
  const { value: opening, index: openingIdx } = pickAvoid(openings, _history.lastOpeningIdx);
  _history.lastOpeningIdx = openingIdx;

  // Pick tone avoiding last used
  const availableTones = TONE_STYLES.filter(t => t !== _history.lastTone);
  const tone = pick(availableTones) as ToneStyle;
  _history.lastTone = tone;

  // Pick structure avoiding last used
  const availableStructures = STRUCTURES.filter(s => s !== _history.lastStructure);
  const structure = pick(availableStructures) as NarrativeStructure;
  _history.lastStructure = structure;

  // Pick urgency closing
  const closings = URGENCY_CLOSINGS[input.urgencyLevel] || URGENCY_CLOSINGS['media'];
  const urgencyClosing = pick(closings);

  const transition = pick(TRANSITIONS_TO_DECISION);
  const connective = pick(TONE_CONNECTIVES[tone]);

  // Build interpolation variables
  const monthlyCapacity = input.monthlyCapacity || 0;
  const rentYears = monthlyCapacity > 0 ? Math.max(3, Math.round(Math.random() * 4 + 3)) : 5;
  const fgtsYears = Math.max(5, Math.round(Math.random() * 8 + 5));
  const age = Math.round(Math.random() * 15 + 28);

  const vars: Record<string, string> = {
    name: input.clientName || '',
    age: `${age}`,
    rentValue: monthlyCapacity > 0 ? formatCurrency(monthlyCapacity * (0.9 + Math.random() * 0.3)) : 'R$2.500',
    totalRent: monthlyCapacity > 0 ? formatCurrency(monthlyCapacity * rentYears * 12) : 'R$150.000',
    rentYears: `${rentYears}`,
    fgtsYears: `${fgtsYears}`,
    fgtsAmount: monthlyCapacity > 0 ? formatCurrency(monthlyCapacity * fgtsYears * 0.8) : 'R$45.000',
    installment: input.installment ? formatCurrency(input.installment) : (monthlyCapacity > 0 ? formatCurrency(monthlyCapacity * 0.85) : 'R$1.800'),
    creditValue: input.creditValue ? formatCurrency(input.creditValue) : 'R$300.000',
    termMonths: input.termMonths ? `${input.termMonths}` : '200',
    contemplationTime: pick(['6 meses', '8 meses', '10 meses', 'menos de um ano']),
    financingPayment: monthlyCapacity > 0 ? formatCurrency(monthlyCapacity * 1.4) : 'R$3.500',
    savings: input.creditValue ? formatCurrency(input.creditValue * 0.35) : 'R$100.000',
    capacityBand: capacityBand(monthlyCapacity),
  };

  // Whether to inject human elements (60% chance)
  const addHesitation = Math.random() < 0.6;
  const addObjection = Math.random() < 0.4;

  const hesitation = addHesitation ? pick(HESITATIONS) : '';
  const objection = addObjection ? pick(SMALL_OBJECTIONS) : '';

  // ═══════ BUILD NARRATIVE ═══════
  const lines: string[] = [];
  const [before, after] = variant.beforeAfter;

  // Linha de foco padronizada (subObjetivo) — abre a narrativa quando disponível
  const subObjetivoTexto = getSubObjetivoTexto(input.subObjetivo);
  if (subObjetivoTexto) {
    lines.push(`Se o objetivo é *${subObjetivoTexto}*, existe uma forma inteligente de fazer isso. Olha esse caso:`);
    lines.push('');
  }

  if (structure === 'classic') {
    // Classic: opening → persona → problem → decision → result
    lines.push(interpolate(opening, vars));
    lines.push('');
    lines.push(`Era ${interpolate(variant.persona, vars)}.`);
    lines.push('');
    lines.push(interpolate(variant.problem, vars));
    if (hesitation) { lines.push(''); lines.push(hesitation); }
    lines.push('');
    lines.push(transition);
    lines.push('');
    lines.push(interpolate(variant.decision, vars));
    if (objection) { lines.push(''); lines.push(objection); }
  } else if (structure === 'problem-first') {
    // Problem-first: impactful hook → persona → problem → transition → decision
    lines.push(interpolate(pick(PROBLEM_FIRST_OPENINGS), vars));
    lines.push('');
    lines.push(`${connective}: ${interpolate(variant.persona, vars)}.`);
    lines.push('');
    lines.push(interpolate(variant.problem, vars));
    if (hesitation) { lines.push(''); lines.push(hesitation); }
    lines.push('');
    lines.push(transition);
    lines.push('');
    lines.push(interpolate(variant.decision, vars));
    if (objection) { lines.push(''); lines.push(objection); }
  } else {
    // Result-first: spoiler → then flashback
    lines.push(interpolate(pick(RESULT_FIRST_OPENINGS), vars));
    lines.push('');
    lines.push(`Mas vou voltar pro começo. Era ${interpolate(variant.persona, vars)}.`);
    lines.push('');
    lines.push(interpolate(variant.problem, vars));
    if (hesitation) { lines.push(''); lines.push(hesitation); }
    lines.push('');
    lines.push(transition);
    lines.push('');
    lines.push(interpolate(variant.decision, vars));
    if (objection) { lines.push(''); lines.push(objection); }
  }

  // Simulation bridge
  if (input.installment && input.creditValue) {
    lines.push('');
    lines.push(`No caso dele, uma carta de ${formatCurrency(input.creditValue)} com parcela de ${formatCurrency(input.installment)} em ${input.termMonths || 200} meses. Quando ele viu o custo total comparado ao financiamento, não teve dúvida.`);
  }
  lines.push('');

  // Result
  lines.push(interpolate(variant.result, vars));
  lines.push('');

  // Before → After
  lines.push(`*Antes:* ${interpolate(before, vars)}`);
  lines.push(`*Depois:* ${interpolate(after, vars)}`);
  lines.push('');

  // Urgency closing
  lines.push(urgencyClosing);

  // SubObjetivo (refinamento opcional) — reforça o foco no fim da narrativa
  if (subObjetivoTexto) {
    lines.push('');
    lines.push(`No seu caso, o foco é *${subObjetivoTexto}* — e o consórcio se ajusta direitinho a esse objetivo.`);
  }

  const narrative = lines.join('\n');

  // ═══════ WHATSAPP VERSION ═══════
  const waLines: string[] = [];
  const waName = input.clientName ? `${input.clientName}, ` : '';

  waLines.push(`${waName}${pick([
    'deixa eu te contar uma coisa rápida.',
    'vou compartilhar algo que aconteceu com outro cliente.',
    'isso aqui vai fazer sentido pra você.',
    'tenho um caso pra te contar — rápido.',
  ])}`);
  waLines.push('');

  if (structure === 'result-first') {
    // WhatsApp result-first: outcome first
    waLines.push(`Resultado? ${interpolate(variant.result, vars).split('.').slice(0, 2).join('.')}. ✅`);
    waLines.push('');
    waLines.push(`A história: ${pick(['atendi', 'conversei com', 'ajudei'])} ${interpolate(variant.persona, vars)}.`);
  } else {
    waLines.push(`${pick(['Atendi', 'Conversei com', 'Outro dia ajudei'])} ${interpolate(variant.persona, vars)}.`);
    waLines.push('');
    waLines.push(interpolate(variant.problem, vars).split('.').slice(0, 2).join('.') + '.');
    waLines.push('');
    waLines.push(`Resultado? ${interpolate(variant.result, vars).split('.').slice(0, 2).join('.')}. ✅`);
  }

  waLines.push('');
  waLines.push(`*Antes:* ${interpolate(before, vars)}`);
  waLines.push(`*Depois:* ${interpolate(after, vars)}`);

  if (input.installment) {
    waLines.push('');
    waLines.push(`No seu caso, com parcela de ${formatCurrency(input.installment)}, dá pra fazer algo parecido. Quer que eu te mostre os números?`);
  } else {
    waLines.push('');
    waLines.push('Quer que eu faça uma simulação pro seu caso? Sem compromisso.');
  }

  const whatsapp = waLines.join('\n');

  // Highlights
  const highlights: string[] = [];
  if (subObjetivoTexto) highlights.push(`🎯 Foco: ${subObjetivoTexto}`);
  if (input.creditValue) highlights.push(`Carta: ${formatCurrency(input.creditValue)}`);
  if (input.installment) highlights.push(`Parcela: ${formatCurrency(input.installment)}`);
  if (input.monthlyCapacity) highlights.push(`Capacidade: ${formatCurrency(input.monthlyCapacity)}/mês`);
  highlights.push(`✨ ${interpolate(after, vars)}`);

  return { title, narrative, whatsapp, highlights };
}
