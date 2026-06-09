/**
 * ════════════════════════════════════════════════════════════════════════════
 * STRATEGY LIBRARY DATA — 24 estratégias patrimoniais
 * Última revisão estrutural: 2026-06-07
 *   • Removida `compra-a-vista` (migrada para o módulo Comparador).
 *   • Renomeada `escada-patrimonial` → `venda-carta-lucro`
 *     (título: "Vender a Carta com Lucro").
 *   • Adicionados tipos opcionais p/ piloto: MentalTrigger, StorytellingConfig,
 *     EmbeddedSimulationConfig (não populados nesta etapa).
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Tom editorial: técnico, consultivo, sóbrio, matemático.
 * Conteúdo descreve engenharia patrimonial conservadora — não promete retorno,
 * não usa linguagem de marketing, não estipula "multiplicadores mágicos".
 *
 * Todos os números nos blocos "cálculos" são EXEMPLOS parametrizados pelo
 * crédito da simulação (ou R$ 300k de referência quando não houver simulação
 * ativa) e usam EXCLUSIVAMENTE as constantes canônicas do sistema
 * (`@/config/consortiumRates`): taxa adm. e fundo reserva oficiais por
 * modalidade, prazo padrão CAIXA (200m imobiliário / 80m auto / 100m
 * pesados), CDI 14,90% a.a. Resultados reais variam conforme grupo,
 * mercado, idade e disciplina de execução.
 */
import type { LucideIcon } from 'lucide-react';
import {
  Gem, Layers, Calendar, Rocket, TrendingUp, Building2,
  Repeat, GitBranch, Recycle, Boxes, Hammer, Wrench, Sun,
  Car, Truck, Factory, Tractor, Wheat, Mountain, PiggyBank,
  Coins, Crown, ScrollText, Wallet,
} from 'lucide-react';
import {
  DEFAULT_ADMIN_FEE,
  DEFAULT_RESERVE_FUND,
  DEFAULT_TERM_MONTHS,
  DEFAULT_CDI_RATE,
  DEFAULT_FINANCING_RATE,
} from '@/config/consortiumRates';
import {
  computeAdminFee,
  computeReserveFund,
  computeBaseCost,
  computeFullInstallment,
  annualToMonthlyRate,
  compoundGrowthAnnualMonthly,
} from '@/core/finance';
import { formatPercent } from '@/utils/format';

export interface StrategyExample {
  context: string;
  detail: string;
}

export interface StrategyComparisonRow {
  label: string;
  consortium: string;
  alternative: string;
  delta: string;
}

/**
 * Contexto patrimonial vivo. As `calculations[].result` recebem
 * `(credit, ctx)` e derivam os números EXCLUSIVAMENTE de `ctx.sim.*`
 * (single-source-of-truth do Simulador). Quando `ctx` ou `ctx.sim` for null
 * (sem simulação válida), a estratégia retorna "—" — sem matemática parcial,
 * sem fallback editorial, sem default de 300k.
 *
 * IMPORTAÇÃO INVERTIDA propositalmente para evitar ciclo: declaramos um
 * structural type idêntico ao definido em `@/contexts/WealthAssumptionsContext`.
 */
export interface SimSliceShape {
  readonly creditValue: number;
  readonly consortiumType: string;
  readonly termMonths: number;
  readonly adminFeePercent: number;
  readonly adminFeeDiscountPercent: number;
  readonly reserveFundPercent: number;
  readonly insuranceEnabled: boolean;
  readonly insurancePercent: number;
  readonly annualAdjustmentPercent: number;
  readonly embeddedBidPercent: number;
  readonly freeBidPercent: number;
  readonly contemplationMonth: number;
  readonly effectiveAdminFeePercent: number;
  readonly effectiveInsurancePercent: number;
  readonly costPlan: number;
  readonly totalInsurance: number;
  readonly totalCost: number;
  readonly fullInstallment: number;
  readonly effectiveClientCost: number;
}

export interface StrategyCalcContext {
  cdiAnnual: number;
  cdiGrossAnnual: number;
  cdiAnnualLiq: number;
  cdiMonthlyLiq: number;
  contemplationMonth: number;
  analysisMonths: number;
  monthsAfterContemplation: number;
  propertyAppreciation: number;
  rentalYield: number;
  agioOnSale: number;
  discountOnSale: number;
  tipoVendaCarta: 'carta-contemplada' | 'cota-nao-contemplada';
  /** Fonte ÚNICA da operação financeira. Null ⇒ estratégia retorna "—". */
  sim: SimSliceShape | null;
  /** Compat: espelha sim?.fullInstallment. */
  fullInstallment?: number;
}

export interface StrategyCalculation {
  label: string;
  formula: string;
  /**
   * Retorna SEMPRE string. Quando `ctx?.sim` é null/undefined, retorna "—".
   * NUNCA pode derivar custo de `credit × taxa` — toda matemática de plano
   * vem de `ctx.sim.*` (taxonomia oficial em WealthAssumptionsContext).
   */
  result: (credit: number, ctx?: StrategyCalcContext) => string;
}


/* ──────────────────────────────────────────────────────────────────────
 * TIPOS OPCIONAIS — Piloto consultivo (gatilhos, storytelling, simulação)
 * Adicionados em 2026-06-07. Nenhuma estratégia popula esses campos
 * nesta etapa; existem apenas para suportar o piloto incremental.
 * ────────────────────────────────────────────────────────────────────── */

export interface MentalTrigger {
  type:
    | 'escassez'
    | 'reciprocidade'
    | 'prova_social'
    | 'autoridade'
    | 'compromisso'
    | 'afinidade'
    | 'urgencia'
    | 'aversao_perda'
    | 'novidade'
    | 'exclusividade';
  /** Rótulo curto exibido na UI (ex.: "Escassez"). */
  label: string;
  /** 1-2 frases sobre quando/por que usar este gatilho para esta estratégia. */
  context: string;
  /** Frase pronta que o consultor pode adaptar e usar com o cliente. */
  example: string;
}

export interface StorytellingConfig {
  enabled: boolean;
  /** Prompt base que orienta a IA sobre a tese. */
  systemPrompt: string;
  requiredInputs: Array<{
    key: string;
    label: string;
    placeholder: string;
    type: 'text' | 'number' | 'select' | 'currency';
    /** Usado quando `type === 'select'`. */
    options?: string[];
  }>;
  tone: 'formal' | 'consultivo' | 'casual' | 'persuasivo' | 'educativo';
  /** Limite do texto gerado (default 1500). */
  maxLengthChars?: number;
}

/* ──────────────────────────────────────────────────────────────────────
 * EmbeddedSimulation — schema declarativo da mini-simulação interativa
 * embutida no modal de estratégia (Round 4.2). Substitui o antigo
 * `EmbeddedSimulationConfig` (scaffold nunca populado).
 *
 * Cada estratégia que declara `embeddedSimulation` ganha automaticamente
 * o bloco `<InteractiveSimulator strategy={...} />` no modal — sem
 * hardcode por id. Controls / results / applyTargets vivem aqui;
 * componente só renderiza.
 * ────────────────────────────────────────────────────────────────────── */
export type EmbeddedSimUnit = 'currency' | 'percent' | 'months' | 'integer';
export type EmbeddedSimEmphasis = 'positive-negative' | 'neutral';

export interface EmbeddedSimControl {
  /** Identificador local: 'carta', 'agio', 'mes', 'cdi', etc. */
  id: string;
  /** Rótulo visível ao usuário. */
  label: string;
  /** Unidade lógica (orienta formatação visual). */
  unit: EmbeddedSimUnit;
  min: number;
  /** Max estático ou derivado de ctx (ex: min(termMonths, 60)). */
  max: number | ((ctx: StrategyCalcContext) => number);
  step: number;
  /** Valor inicial computado a partir do contexto. */
  defaultValue: (ctx: StrategyCalcContext) => number;
  /** Textos opcionais nas pontas do slider. */
  minLabel?: string;
  maxLabel?: string | ((ctx: StrategyCalcContext) => string);
}

export interface EmbeddedSimResult {
  /** Identificador local: 'parcela', 'capital', 'receita', etc. */
  id: string;
  label: string;
  format: 'currency' | 'currency-short' | 'percent' | 'multiplier' | 'months';
  /** Verde/vermelho condicional ou tom neutro. */
  emphasis?: EmbeddedSimEmphasis;
  /** Recebe dict { [controlId]: number } + ctx canônico. */
  compute: (values: Record<string, number>, ctx: StrategyCalcContext) => number;
}

export type EmbeddedSimApplyTargetType =
  | 'simulatorInput'         // chama updateInput(field, value)
  | 'simulatorContemplation' // chama setContemplationMonth(value)
  | 'wealthAssumption';      // chama wealthCtx.setAssumption(key, value)

export interface EmbeddedSimApplyTarget {
  type: EmbeddedSimApplyTargetType;
  /** Qual control alimenta este target. */
  sourceControlId: string;
  /** Para simulatorInput: campo do input (ex: 'creditValue'). */
  field?: string;
  /** Para wealthAssumption: key (ex: 'agioOnSale'). */
  key?: string;
  /** Transformação opcional antes de aplicar (ex: Math.round). */
  transform?: (value: number) => number;
}

export interface EmbeddedSimulation {
  controls: EmbeddedSimControl[];
  results: EmbeddedSimResult[];
  applyTargets: EmbeddedSimApplyTarget[];
  /** Textos opcionais — defaults sensatos no componente. */
  blockTitle?: string;
  introText?: string;
  disclaimerText?: string;
  applyButtonLabel?: string;
  resetButtonLabel?: string;
  applyToastMessage?: string;
}

export interface NarrativeComputedField {
  /** Rótulo curto e humano. Ex.: "Saldo aplicado ao fim do prazo". */
  label: string;
  /** Valor já formatado para humano (R$, %, "X meses"). */
  value: string;
}

/**
 * Contrato consultivo da narrativa personalizada (Round 3.A.1).
 *
 * Declara, por estratégia, o frame da tese, vocabulário permitido/proibido,
 * risco principal, próximo passo natural e função que calcula os números
 * a serem injetados na Edge Function `strategy-storytelling`.
 *
 * Esta etapa SOMENTE adiciona o schema e popula 2 estratégias (piloto).
 * Edge Function e cliente continuam usando o payload antigo até o Round 3.A.2.
 */
export interface NarrativeContext {
  /** Eixo central da tese em uma frase curta (≤ 200 chars). */
  thesisFrame: string;

  /** Vocabulário específico — orienta a IA a usar/evitar termos. */
  vocabulary?: {
    allowed?: string[];
    forbidden?: string[];
  };

  /** Risco principal a ser citado honestamente na narrativa. */
  primaryRisk: string;

  /** Sugestão de próximo passo natural (CTA dentro da narrativa). */
  nextStepHint?: string;

  /**
   * Calcula os campos numéricos a serem injetados na narrativa.
   * Deve usar APENAS primitivas canônicas (compoundGrowthAnnualMonthly,
   * CDI_LIQ, etc.) e ler de ctx.sim.* — proibido engine paralela.
   */
  computeFields: (ctx: StrategyCalcContext) => NarrativeComputedField[];
}

export interface LibraryStrategy {
  id: string;
  chapter: string;
  title: string;
  tagline: string;
  icon: LucideIcon;
  accent: 'primary' | 'success' | 'warning' | 'destructive' | 'muted';
  /** Ordem editorial (1 = primeiro). Indefinido = ordem do catálogo. */
  priority?: number;

  howItWorks: string;
  patrimonialLogic: string;
  liquidityImpact: string;
  timing: string;

  advantages: string[];
  risks: string[];
  commonMistakes: string[];
  whenNotToUse: string[];

  calculations: StrategyCalculation[];

  scenarios: StrategyExample[];
  comparisons: StrategyComparisonRow[];

  /** Nota tributária opcional — renderizada na modal após `comparisons`
   *  com visual de atenção quando preenchida. */
  taxNote?: string;

  /** Hero "Visão estratégica" — sobrepõe `patrimonialLogic` e `advantages[0]`
   *  quando preenchidos. Mantém compat para estratégias ainda não migradas. */
  heroContext?: string;
  heroConsequence?: string;

  /* ── Piloto consultivo (opcionais, ainda não populados) ── */
  mentalTriggers?: MentalTrigger[];
  storytelling?: StorytellingConfig;

  /** Contrato consultivo da narrativa personalizada (Round 3.A.1). */
  narrativeContext?: NarrativeContext;

  /** Mini-simulação interativa declarativa (Round 4.2). */
  embeddedSimulation?: EmbeddedSimulation;
}

/* Helpers de formatação */
const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

/* ──────────────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH — Custo, parcela e prazo vêm EXCLUSIVAMENTE de
 * `ctx.sim.*` (snapshot canônico do Simulador). Engine paralela proibida.
 *
 * Quando `ctx.sim` é null/undefined ⇒ estratégia retorna "—". Sem matemática
 * parcial. Sem fallback. Sem default de 200m / 21% / 18%.
 *
 * Mapeamento semântico oficial (do Simulador para a estratégia):
 *   • custo SEM seguro        → ctx.sim.costPlan
 *   • custo COM seguro        → ctx.sim.totalCost
 *   • parcela cheia contratual → ctx.sim.fullInstallment
 *   • desembolso líquido      → ctx.sim.effectiveClientCost
 *   • prazo                   → ctx.sim.termMonths
 *
 * Lint guard (`no-restricted-syntax` em wealth/**) bloqueia ADM_TOTAL /
 * REF_* / PARCELA_FATOR / `credit * taxa` para evitar shadow engines.
 * ────────────────────────────────────────────────────────────────────── */

/** Placeholder padrão quando não há simulação válida. */
const NA = '—';

/** CDI canônico — premissa patrimonial editável (WealthAssumptions). */
const CDI_AA          = DEFAULT_CDI_RATE / 100;
const CDI_LIQ         = CDI_AA * (1 - 0.15);                     // IR 15% longo prazo
const CDI_MM_LIQ      = annualToMonthlyRate(CDI_LIQ);

/** Label editorial — referência de mercado, NÃO taxa contratual CAIXA.
 *  Usado em strings estáticas de `comparisons[]` (não acessam ctx). */
const FIN_RATE_LABEL  = `~${DEFAULT_FINANCING_RATE.toFixed(0)}% a.a. (comparativo ilustrativo de mercado)`;

/** Cap rate locatício de mercado — FALLBACK editorial APENAS para snapshots /
 *  PDF off-screen / export sem `StrategyCalcContext` carregado. Proibido como
 *  fonte primária de KPI patrimonial: cálculos reativos devem consumir
 *  `ctx.rentalYield` (premissa editável em `WealthAssumptionsContext`).
 *  Onda 3 — Parametric Yield Reunification. */
const CAP_RATE        = 0.005;                                   // ~0,5% a.m.

/** Helper canônico — yield mensal a aplicar em valores patrimoniais.
 *  Retorna `ctx.rentalYield` quando presente (premissa viva do consultor);
 *  cai em `CAP_RATE` apenas em snapshots/off-screen sem contexto. */
const yieldOf = (ctx?: StrategyCalcContext): number =>
  ctx?.rentalYield ?? CAP_RATE;

/* ============================================================================
 * 24 ESTRATÉGIAS — biblioteca completa
 * ========================================================================== */
export const STRATEGY_LIBRARY: LibraryStrategy[] = [
  // ───────────────── CAPÍTULO 1: AQUISIÇÃO ─────────────────


  {
    id: 'compra-hibrida',
    chapter: 'Aquisição',
    title: 'Comprar com Entrada e Diluir o Resto',
    tagline: 'Usa 20–40% do valor como lance, dilui o restante na cota e preserva ~70% da liquidez.',
    icon: GitBranch,
    accent: 'primary',
    howItWorks:
      'Parte do capital (tipicamente 20–40%) é usada como lance para acelerar a contemplação. O restante é diluído nas parcelas do consórcio. O cliente preserva parte significativa da liquidez e antecipa a posse do bem em relação a um plano sem lance.',
    patrimonialLogic:
      'A estratégia equilibra três variáveis: tempo de contemplação, custo total e liquidez preservada. Quanto maior o lance, mais rápida a contemplação — em contrapartida, menor o capital remanescente aplicado.',
    liquidityImpact:
      'Preserva tipicamente 60–80% do capital inicial. O rendimento do capital remanescente cobre parte da parcela. Reserva de emergência tende a permanecer intacta.',
    timing:
      'Indicada para quem deseja antecipar a posse sem comprometer toda a liquidez e sem assumir o custo de juros do financiamento.',
    advantages: [
      'Antecipa a posse em relação ao plano sem lance.',
      'Liquidez parcialmente preservada para emergências e oportunidades.',
      'Rendimento do capital remanescente compensa parte da parcela.',
    ],
    risks: [
      'Lance pode não ser contemplado de imediato — exige reserva para parcelas durante a espera.',
      'Disciplina necessária para não consumir o capital remanescente.',
      'Queda de juros reduz o rendimento que cobre a parcela.',
    ],
    commonMistakes: [
      'Dar lance e em seguida consumir o capital remanescente.',
      'Não comparar o custo da parcela com o rendimento líquido esperado da aplicação.',
      'Ignorar o seguro prestamista no custo efetivo.',
    ],
    whenNotToUse: [
      'Quando o cliente tem o capital total e não vê valor em preservar liquidez.',
      'Quando a urgência da posse é incompatível com o tempo médio de contemplação por lance.',
    ],
    calculations: [
      { label: 'Lance / entrada (30%)', formula: '0,30 × crédito', result: (c) => brl(c * 0.30) },
      { label: 'Saldo a parcelar', formula: '0,70 × crédito', result: (c) => brl(c * 0.70) },
      {
        label: 'Capital preservado em renda fixa',
        formula: 'capital total − lance',
        result: (c, ctx) => `${brl(c * 0.70)} a ~${pct(ctx?.cdiAnnualLiq ?? CDI_LIQ)} a.a.`,
      },
      {
        label: 'Rendimento mensal estimado',
        formula: 'capital × ((1+CDI)^(1/12) − 1)',
        result: (c, ctx) => `${brl(c * 0.70 * (ctx?.cdiMonthlyLiq ?? CDI_MM_LIQ))}/mês`,
      },
    ],
    scenarios: [
      { context: 'Profissional 35 anos', detail: 'Aquisição residencial com lance de 30%; rendimento do capital remanescente cobre parte expressiva da parcela.' },
      { context: 'Empresa adquirindo veículo', detail: 'Entrada de 30% acelera contemplação; capital de giro preservado.' },
    ],
    comparisons: [
      { label: 'Liquidez pós-compra', consortium: '~70% preservada', alternative: 'À vista: 0% / Financ.: 0%', delta: 'Vantagem operacional' },
      { label: 'Custo financeiro nominal', consortium: 'Estrutura administrativa (taxa adm + FR), sem juros bancários', alternative: `Financiamento bancário: ${FIN_RATE_LABEL}`, delta: 'Ver Comparador para o total real conforme prazo' },
    ],
  },

  {
    id: 'compra-planejada',
    chapter: 'Aquisição',
    title: 'Comprar em 24–60 Meses sem Juros',
    tagline: 'Aquisição programada via cota curta: troca o juro do financiamento por disciplina mensal.',
    icon: Calendar,
    accent: 'primary',
    howItWorks:
      'O cliente entra no consórcio sem urgência de contemplação. Paga parcelas regulares e contempla por sorteio ou lance modesto entre 24 e 60 meses. O bem é adquirido quando o plano patrimonial absorve naturalmente o custo.',
    patrimonialLogic:
      'O cliente troca juros bancários por taxa administrativa diluída. A diferença pode ser capitalizada em paralelo se o cliente mantiver uma reserva financeira investida.',
    liquidityImpact:
      'Apenas a parcela mensal sai do orçamento. Reserva de emergência preservada integralmente.',
    timing:
      'Indicada para quem não tem urgência (1ª casa em 3 anos, troca de carro em 4 anos, expansão de negócio planejada).',
    advantages: [
      'Custo total significativamente menor que financiamento equivalente.',
      'Disciplina financeira: a parcela funciona como compromisso de poupança vinculada a um objetivo.',
      'Possibilidade de lance livre quando houver capital adicional, acelerando a contemplação.',
    ],
    risks: [
      'Contemplação imprevisível sem lance — pode atrasar em relação ao planejado.',
      'Inflação do bem pode superar o reajuste da carta de crédito em alguns ciclos.',
      'Desistência no meio do plano gera devolução com deságio.',
    ],
    commonMistakes: [
      'Tratar a parcela como poupança líquida (não é resgatável a qualquer momento).',
      'Não revisar grupo / parcela quando a renda cresce.',
      'Subestimar o impacto do INPC na carta.',
    ],
    whenNotToUse: [
      'Quando o cliente precisa do bem em prazo inferior a 12 meses.',
      'Quando há expectativa de instabilidade severa de renda nos próximos 24 meses.',
    ],
    calculations: [
      { label: 'Parcela cheia (com seguro prestamista)', formula: 'fullInstallment do Simulador', result: (_c, ctx) => !ctx?.sim ? NA : `${brl(ctx.sim.fullInstallment)}/mês` },
      { label: 'Custo do plano sem seguro', formula: 'costPlan do Simulador (crédito + adm efetiva + FR)', result: (_c, ctx) => !ctx?.sim ? NA : brl(ctx.sim.costPlan) },
      { label: 'Financiamento comparável', formula: `juros ${FIN_RATE_LABEL} + amortização`, result: () => 'Total exato calculado no Comparador conforme prazo e sistema (Price/SAC)' },
    ],
    scenarios: [
      { context: 'Casal planejando 1º imóvel', detail: 'Entrada no consórcio 36 meses antes do objetivo; carta usada como pagamento à vista no lançamento.' },
      { context: 'Pequena empresa', detail: 'Renovação de frota planejada em 48 meses; parcelas absorvidas como custo operacional dedutível.' },
    ],
    comparisons: [
      { label: 'Custo nominal', consortium: 'Estrutura administrativa (adm + FR), sem juros bancários', alternative: `Financiamento: ${FIN_RATE_LABEL}`, delta: 'Ver Comparador para total real' },
      { label: 'Urgência exigida', consortium: 'Baixa (12–60m)', alternative: 'Financiamento: imediato', delta: 'Trade-off tempo × custo' },
    ],
  },

  {
    id: 'aquisicao-acelerada',
    chapter: 'Aquisição',
    title: 'Dar Lance para Contemplar Rápido',
    tagline: 'Lance estruturado nos primeiros meses encurta a espera de contemplação e mantém o custo abaixo do financiamento.',
    icon: Rocket,
    accent: 'warning',
    howItWorks:
      'Cliente entra no consórcio e oferta lance livre ou embutido nas primeiras assembleias. Em grupos com histórico forte, a probabilidade de contemplação no primeiro semestre é relevante. O saldo segue diluído nas parcelas, sem juros adicionais.',
    patrimonialLogic:
      'Combina velocidade (próxima ao financiamento) com custo menor. Aceita o trade-off de comprometer parte do capital no lance em troca de antecipar a posse.',
    liquidityImpact:
      'Compromete tipicamente 25–40% do capital no lance. O restante permanece disponível, mas há obrigação das parcelas pós-contemplação.',
    timing:
      'Urgência moderada (necessidade do bem em 6–12 meses) e capital parcial para lance estruturado.',
    advantages: [
      'Posse em 6–12 meses, com custo total inferior ao financiamento.',
      'Reduz o tempo de exposição aos reajustes da carta.',
      'Mantém parte da liquidez preservada após o lance.',
    ],
    risks: [
      'Lance não contemplado mantém capital comprometido sem o bem.',
      'Concorrência por lance reduz a probabilidade efetiva em cada assembleia.',
      'Parcela pós-contemplação pode pesar se o fluxo não estiver dimensionado.',
    ],
    commonMistakes: [
      'Ofertar lance abaixo da média histórica do grupo.',
      'Não estudar o histórico de contemplação antes de entrar.',
      'Concentrar a aposta em uma única assembleia sem plano B.',
    ],
    whenNotToUse: [
      'Quando a urgência é inferior a 3 meses (use financiamento ou compra direta).',
      'Quando o lance comprometeria a reserva de emergência.',
    ],
    calculations: [
      { label: 'Lance estruturado (30%)', formula: '0,30 × crédito', result: (c) => brl(c * 0.30) },
      { label: 'Saldo a diluir pós-contemplação', formula: 'costPlan do Simulador − lance (30%)', result: (_c, ctx) => !ctx?.sim ? NA : brl(ctx.sim.costPlan - ctx.sim.creditValue * 0.30) },
      { label: 'Parcela média estimada pós-lance', formula: '(costPlan − lance) ÷ prazo do Simulador', result: (_c, ctx) => !ctx?.sim ? NA : `${brl((ctx.sim.costPlan - ctx.sim.creditValue * 0.30) / ctx.sim.termMonths)}/mês` },
    ],
    scenarios: [
      { context: 'Negócio em expansão', detail: 'Equipamento necessário em 6 meses via lance estruturado; custo final abaixo do financiamento.' },
      { context: 'Casal trocando de imóvel', detail: 'Lance para contemplar antes da venda do imóvel atual; venda futura amortiza o saldo.' },
    ],
    comparisons: [
      { label: 'Tempo de espera', consortium: '6–12 meses', alternative: 'Plano sem lance: 24–60m', delta: 'Antecipação relevante' },
      { label: 'Custo nominal', consortium: 'Estrutura administrativa (adm + FR), sem juros bancários', alternative: `Financiamento: ${FIN_RATE_LABEL}`, delta: 'Ver Comparador para total real' },
    ],
  },

  // ───────────────── CAPÍTULO 2: LEVERAGE ─────────────────
  {
    id: 'leverage-patrimonial',
    chapter: 'Leverage',
    priority: 2,
    title: 'Comprar Várias Cartas ao Mesmo Tempo',
    tagline: 'Distribui o mesmo capital em múltiplas cotas simultâneas: mais exposição patrimonial, sem juros bancários.',
    icon: TrendingUp,
    accent: 'primary',
    howItWorks:
      'Em vez de adquirir um único ativo à vista, o cliente utiliza o capital como lance em duas ou mais cotas paralelas. As contemplações ocorrem de forma escalonada, e o capital remanescente em renda fixa contribui para o fluxo das parcelas.',
    patrimonialLogic:
      'A exposição patrimonial cresce proporcionalmente ao número de cotas, enquanto o custo financeiro permanece restrito à taxa administrativa de cada cota — sem juros bancários compostos. É uma estratégia de exposição, não de retorno garantido.',
    liquidityImpact:
      'A soma das parcelas mensais é o ponto crítico. Exige planejamento de fluxo e capacidade comprovada de absorver o agregado, mesmo em cenários adversos.',
    timing:
      'Indicada para quem tem renda estável, reserva de emergência robusta e visão patrimonial de médio/longo prazo.',
    advantages: [
      'Exposição patrimonial maior sem contrair dívida bancária.',
      'Diversificação natural se as cotas forem distribuídas entre ativos/grupos diferentes.',
      'Contemplações escalonadas geram liquidez recorrente ao longo do plano.',
    ],
    risks: [
      'Parcelas agregadas podem ultrapassar a capacidade de pagamento em cenários adversos.',
      'Inadimplência em uma cota afeta o conjunto.',
      'Reajustes (INPC) em múltiplas cartas amplificam a exposição mensal.',
    ],
    commonMistakes: [
      'Não dimensionar a soma das parcelas em relação à renda líquida.',
      'Concentrar várias cotas no mesmo grupo (reduz diversificação real).',
      'Subestimar o custo agregado do seguro prestamista.',
    ],
    whenNotToUse: [
      'Renda instável ou baixa capacidade de absorver choques.',
      'Sem reserva de emergência cobrindo ao menos 6 meses do agregado de parcelas.',
    ],
    calculations: [
      { label: 'Cotas paralelas viabilizadas (ilustrativo)', formula: 'capital ÷ lance médio por cota', result: (c) => `Capital ${brl(c)} ⇒ ~3 cotas com lance de ~33% cada` },
      { label: 'Exposição patrimonial agregada', formula: 'n × crédito médio', result: (c) => `~${brl(c * 3)} em ativos sob plano` },
      { label: 'Parcela agregada estimada (3 cotas)', formula: '3 × parcela cheia do Simulador', result: (_c, ctx) => !ctx?.sim ? NA : `~${brl(3 * ctx.sim.fullInstallment)}/mês` },
    ],
    scenarios: [
      { context: 'Investidor experiente', detail: '3 cotas imobiliárias paralelas com contemplação escalonada em 24/30/36 meses.' },
      { context: 'Empresa em expansão', detail: '3 cotas de equipamentos com cronograma alinhado à curva de receita.' },
    ],
    comparisons: [
      { label: 'Exposição com o mesmo capital', consortium: 'Múltiplos ativos sob plano', alternative: 'À vista: 1 ativo', delta: 'Exposição ampliada' },
      { label: 'Custo de capital', consortium: 'Taxa adm por cota', alternative: 'Financiamento: juros sobre saldo devedor', delta: 'Estrutura sem juros bancários' },
    ],
  },

  {
    // ─── Estratégia "Usar a Carta para Investir" ─────────────
    // Tese de antecipação patrimonial: poucos meses de aporte destravam
    // um capital muitas vezes maior, que passa a render em fundo CAIXA
    // regulamentado (Lei 11.795/2008, art. 24; BACEN/CVM) desde a
    // contemplação até o fim do plano. Cálculos derivam exclusivamente
    // de ctx.sim.* e primitivas canônicas (compoundGrowthAnnualMonthly,
    // CDI_LIQ). Zero engine paralela.
    id: 'usar-carta-investir',
    chapter: 'Leverage',
    priority: 2,
    title: 'Usar a Carta para Investir',
    tagline: 'Pague poucos meses. Tenha o capital inteiro rendendo. O consórcio antecipa anos de acumulação patrimonial.',
    heroContext: 'O cliente paga poucos meses de aporte até a contemplação. A partir dali, o valor integral da carta passa a render em fundo CAIXA regulamentado até o fim do plano. As parcelas continuam, sustentadas pelo orçamento próprio.',
    heroConsequence: 'O cliente termina o plano com um capital muitas vezes maior do que conseguiria acumulando o mesmo aporte em aplicação tradicional.',
    icon: Wallet,
    accent: 'primary',
    howItWorks:
      'Imagine duas pessoas com a mesma capacidade mensal de aporte. A primeira aplica em CDI todo mês — em 12 meses, terá cerca de R$ 18 mil rendendo. A segunda entra num consórcio CAIXA: paga as mesmas parcelas e, se for contemplada no mês 12 (sorteio ou lance), passa a ter o valor integral da carta — por exemplo R$ 250 mil — aplicado em fundo CAIXA até o fim do plano.\n\nA diferença é estrutural: a primeira pessoa rende sobre o que conseguiu juntar. A segunda rende sobre um capital muitas vezes maior, antecipado pela contemplação. As duas continuam pagando o aporte mensal — mas a base produtiva é completamente diferente.\n\nNo fim do plano, a segunda pessoa saca o saldo integral (valor da carta + rendimento acumulado). A primeira saca o que conseguiu acumular mês a mês.',
    patrimonialLogic:
      'A força da estratégia está na alavancagem temporal. O consórcio funciona, neste caso, como um instrumento que antecipa o tempo de acumulação: poucos meses de aporte destravam um capital muitas vezes maior, que passa a render desde a contemplação.\n\nO fundo onde os recursos da carta contemplada são aplicados é regulamentado pelo BACEN e CVM, conforme previsto na Lei 11.795/2008 (art. 24). Pela escala do volume aplicado pela CAIXA Consórcios e pelas condições negociadas, a rentabilidade típica equivale a fundos que, no varejo direto, exigem aplicação mínima de R$ 5 milhões para acesso.',
    liquidityImpact:
      'Capital ilíquido durante todo o plano. O cliente não saca, parcial ou totalmente, durante o ciclo — nem o capital aplicado, nem o rendimento gerado. O acesso ao saldo total acontece apenas no resgate final.\n\nA parcela mensal continua sendo obrigação contínua do orçamento até a última assembleia. O rendimento gerado no fundo não compensa nem reduz a parcela durante o plano — fica retido junto ao capital.\n\nA liquidez retorna integral no fim, quando todo o saldo é resgatado de uma vez.',
    timing:
      'Indicada para clientes com horizonte longo (idealmente ≥10 anos restantes após a contemplação esperada), orçamento estável para sustentar parcelas em paralelo à aplicação e disciplina patrimonial para não consumir o capital antes do fim do plano. A estratégia ganha força quando a contemplação ocorre cedo — quanto maior o tempo entre contemplação e fim do plano, maior o efeito de capitalização composta sobre o capital antecipado.',
    advantages: [
      'Antecipa anos de acumulação patrimonial com poucos meses de aporte.',
      'Acesso, via consórcio, a fundo CAIXA com condições equivalentes a produtos que exigem R$ 5 milhões para entrada direta no varejo private.',
      'Aplicação regulamentada por BACEN e CVM (Lei 11.795/2008, art. 24).',
      'Sem juros bancários — custo financeiro é apenas a taxa administrativa.',
      'Tributação padrão de fundo de renda fixa, com IR regressivo na fonte (alíquota mínima 15% para horizonte superior a 720 dias).',
    ],
    risks: [
      'Quanto mais tarde a contemplação, menor o efeito de antecipação patrimonial.',
      'Capital totalmente ilíquido durante o plano — nem o rendimento pode ser sacado parcialmente.',
      'Parcelas continuam sendo obrigação mensal do orçamento até o fim do plano.',
      'Parcelas reajustadas anualmente pelo INPC (padrão CAIXA), elevando o desembolso ao longo do plano.',
      'Queda do CDI ao longo do plano reduz o ganho final projetado.',
    ],
    commonMistakes: [
      'Apresentar como "promessa de rentabilidade" — é cenário ilustrativo dependente do CDI futuro.',
      'Apresentar como "parcela paga pelo rendimento" — não é. A parcela continua sendo obrigação mensal real até o fim do plano; o rendimento fica retido no fundo.',
      'Ignorar a tributação no cálculo do resultado líquido final.',
      'Apresentar a comparação com "R$ 5 milhões" sem contextualizar a base regulatória do fundo.',
      'Confundir com "Venda da Carta" — aqui o cliente mantém a carta aplicada, não vende.',
      'Apresentar como estratégia exclusiva de lance — a tese funciona com contemplação por sorteio também.',
    ],
    whenNotToUse: [
      'Cliente que precisa adquirir o bem imediatamente após a contemplação.',
      'Cliente que precisa de liquidez parcial em algum momento durante o plano.',
      'Orçamento mensal sem folga para sustentar as parcelas em paralelo à aplicação.',
      'Horizonte curto após a contemplação (menos de ~5 anos restantes).',
      'Cliente sem perfil patrimonial — quem só quer adquirir o bem deve usar a tese de aquisição direta.',
    ],
    calculations: [
      {
        label: 'Carta de crédito (referência)',
        formula: 'valor do crédito contratado',
        result: (c) => brl(c),
      },
      {
        label: 'Custo total no consórcio (com seguro prestamista)',
        formula: 'totalCost do Simulador',
        result: (_c, ctx) => !ctx?.sim ? NA : brl(ctx.sim.totalCost),
      },
      {
        label: 'Saldo aplicado ao fim do prazo',
        formula: 'carta × (1 + CDI líquido)^(meses restantes após contemplação esperada)',
        result: (c, ctx) => !ctx?.sim ? NA : brl(compoundGrowthAnnualMonthly(
          c,
          ctx.cdiAnnualLiq ?? CDI_LIQ,
          ctx.monthsAfterContemplation,
        )),
      },
      {
        label: 'Lucro líquido estimado',
        formula: 'saldo aplicado − custo total (com seguro)',
        result: (c, ctx) => !ctx?.sim ? NA : brl(
          compoundGrowthAnnualMonthly(
            c,
            ctx.cdiAnnualLiq ?? CDI_LIQ,
            ctx.monthsAfterContemplation,
          ) - ctx.sim.totalCost,
        ),
      },
      {
        label: 'ROI sobre o capital efetivamente desembolsado',
        formula: 'lucro líquido ÷ totalCost do Simulador',
        result: (c, ctx) => {
          if (!ctx?.sim) return NA;
          const lucro = compoundGrowthAnnualMonthly(
            c,
            ctx.cdiAnnualLiq ?? CDI_LIQ,
            ctx.monthsAfterContemplation,
          ) - ctx.sim.totalCost;
          return `${((lucro / ctx.sim.totalCost) * 100).toFixed(1)}%`;
        },
      },
    ],
    scenarios: [
      {
        context: 'Contemplação precoce — efeito máximo de antecipação',
        detail: 'Cliente contrata consórcio imobiliário de R$ 250 mil em 200 meses, com parcela inicial de aproximadamente R$ 1.500. É contemplado por sorteio no mês 12. Após pagar cerca de R$ 18 mil em parcelas, passa a ter R$ 250 mil aplicados no fundo CAIXA até o fim do plano (mais de 15 anos pela frente). As parcelas seguem sendo pagas do orçamento. No fim do plano, saca o saldo integral capitalizado.',
      },
      {
        context: 'Contemplação tardia — tese enfraquecida',
        detail: 'Mesmo perfil, mas contemplado por sorteio só no mês 100. Já pagou cerca de R$ 150 mil em parcelas, e o capital aplicado só passa a render nos 100 meses restantes. A estratégia ainda gera retorno, mas o argumento de antecipação patrimonial fica enfraquecido. Para clientes que querem garantir o benefício, vale considerar lance para antecipar a contemplação.',
      },
    ],
    comparisons: [
      {
        label: 'Foco patrimonial',
        consortium: 'Capital antecipado e capitalizado',
        alternative: 'Aplicação mensal tradicional acumula devagar',
        delta: 'Antecipação de anos de acumulação',
      },
      {
        label: 'Custo de capital',
        consortium: 'Apenas taxa administrativa',
        alternative: `Financiamento: ${FIN_RATE_LABEL}`,
        delta: 'Sem juros bancários compostos',
      },
      {
        label: 'Acesso ao fundo',
        consortium: 'Acesso via consórcio CAIXA',
        alternative: 'Acesso direto exige ~R$ 5 milhões aplicados',
        delta: 'Porta de entrada institucionalizada',
      },
      {
        label: 'Resultado final esperado',
        consortium: 'Saldo capitalizado + rendimento composto',
        alternative: 'Saldo proporcional ao volume mensal aplicado',
        delta: 'Ganho ampliado pela antecipação',
      },
    ],
    taxNote:
      'Os recursos da carta contemplada e não utilizada são aplicados em fundo CAIXA regulamentado por BACEN e CVM, conforme previsto na Lei 11.795/2008 (art. 24). A tributação segue o padrão de fundos de renda fixa de longo prazo: come-cotas semestral e IR regressivo na fonte, com alíquota mínima de 15% sobre o rendimento para horizonte superior a 720 dias. O cliente recebe o valor líquido no resgate, sem necessidade de declaração ou pagamento adicional. Para Pessoa Jurídica, validar com a contabilidade da empresa o tratamento fiscal específico aplicável.',
    mentalTriggers: [
      {
        type: 'exclusividade',
        label: 'Acesso institucional a produto private',
        context: 'Use com cliente que se reconhece como investidor e valoriza acessar produtos normalmente reservados ao varejo private. Ativa o desejo de pertencer a um patamar superior de aplicação.',
        example: 'Por uma parcela mensal acessível, seu cliente acessa um fundo CAIXA com condições equivalentes a produtos que exigem R$ 5 milhões para entrada direta no varejo private. O consórcio virou a porta de entrada institucionalizada.',
      },
      {
        type: 'autoridade',
        label: 'Base regulatória sólida',
        context: 'Use com cliente analítico, conservador ou cético, que precisa entender que a tese se apoia em norma do sistema financeiro — não em arranjo comercial da casa.',
        example: 'A aplicação dos recursos da carta contemplada está prevista em lei (Lei 11.795/2008, art. 24) e regulamentada pelo BACEN e CVM. Não é um arranjo da casa — é norma do sistema financeiro nacional.',
      },
      {
        type: 'aversao_perda',
        label: 'Cada mês de demora reduz o salto patrimonial',
        context: 'Use quando o cliente já entendeu a tese mas hesita em decidir. Foca no custo do tempo perdido, não em ganho hipotético, evitando promessa.',
        example: 'Contemplação no mês 12 destrava R$ 250 mil rendendo por 188 meses. Contemplação no mês 100 destrava o mesmo valor, mas rendendo por apenas 100 meses. O tempo perdido não volta.',
      },
      {
        type: 'novidade',
        label: 'Inversão da lógica do consórcio',
        context: 'Use logo na abertura, quando o cliente associa consórcio apenas a compra parcelada. Reposiciona a conversa em outro plano antes de qualquer objeção clássica.',
        example: 'A maioria pensa no consórcio como forma de adquirir um bem. Esta tese inverte: o cliente não está financiando uma compra — está antecipando anos de acumulação patrimonial com poucos meses de aporte.',
      },
      {
        type: 'afinidade',
        label: 'Conversa de investidor, não de comprador',
        context: 'Use com cliente que se enxerga como gestor do próprio patrimônio. Eleva o registro da conversa — consultor falando com investidor, não vendedor com comprador.',
        example: 'Esta estratégia é para clientes que pensam em patrimônio, não em consumo. O argumento de venda é o de um consultor financeiro falando com investidor — não de um vendedor falando com comprador de imóvel.',
      },
    ],
    narrativeContext: {
      thesisFrame:
        'Manter a carta contemplada aplicada em fundo CAIXA regulamentado pelo BACEN e CVM (Lei 11.795/2008, art. 24) até o fim do plano, para antecipação patrimonial. NÃO há venda da carta. O cliente paga parcelas em paralelo e saca o saldo capitalizado apenas no final.',
      vocabulary: {
        allowed: [
          'fundo CAIXA',
          'capitalização composta',
          'rendimento mensal',
          'antecipação patrimonial',
          'saldo aplicado',
          'resgate final',
          'aplicação em renda fixa',
          'CDI',
          'IR regressivo na fonte',
        ],
        forbidden: [
          'venda da carta',
          'ágio na venda',
          'comprador da carta',
          'carta pronta para uso',
          'lucro com revenda',
          'mercado secundário',
        ],
      },
      primaryRisk:
        'A contemplação tardia reduz drasticamente o efeito de antecipação patrimonial. O capital fica totalmente ilíquido durante todo o plano — nem o rendimento pode ser sacado parcialmente. As parcelas continuam sendo obrigação mensal do orçamento até o fim.',
      nextStepHint:
        'Vamos calibrar lance para antecipar a contemplação e maximizar o tempo de capitalização.',
      computeFields: (ctx) => {
        if (!ctx?.sim) return [];
        const credit = ctx.sim.creditValue;
        const totalCost = ctx.sim.totalCost;
        const cdi = ctx.cdiAnnualLiq ?? CDI_LIQ;
        const monthsAfter = ctx.monthsAfterContemplation;
        const saldoFinal = compoundGrowthAnnualMonthly(credit, cdi, monthsAfter);
        const ganho = saldoFinal - totalCost;
        return [
          { label: 'Valor da carta aplicada no fundo', value: brl(credit) },
          { label: 'Meses de capitalização após contemplação', value: `${monthsAfter} meses` },
          { label: 'Custo total do plano (parcelas + seguro)', value: brl(totalCost) },
          { label: 'Saldo final estimado no resgate', value: brl(saldoFinal) },
          { label: 'Ganho líquido estimado', value: brl(ganho) },
        ];
      },
    },
    embeddedSimulation: {
      controls: [
        {
          id: 'carta',
          label: 'Valor da carta',
          unit: 'currency',
          min: 50_000,
          max: 1_000_000,
          step: 10_000,
          defaultValue: (ctx) => Math.max(50_000, Math.min(1_000_000, ctx.sim?.creditValue ?? 250_000)),
          minLabel: 'R$ 50 mil',
          maxLabel: 'R$ 1 mi',
        },
        {
          id: 'mes',
          label: 'Mês de contemplação',
          unit: 'months',
          min: 1,
          max: (ctx) => ctx.sim?.termMonths ?? 200,
          step: 1,
          defaultValue: (ctx) => Math.max(1, Math.min(ctx.sim?.termMonths ?? 200, ctx.sim?.contemplationMonth ?? 12)),
          minLabel: 'mês 1',
          maxLabel: (ctx) => `mês ${ctx.sim?.termMonths ?? 200}`,
        },
        {
          id: 'cdiPct',
          label: 'Rentabilidade (% do CDI)',
          unit: 'percent',
          min: 50,
          max: 150,
          step: 5,
          defaultValue: () => 100,
          minLabel: '50%',
          maxLabel: '150%',
        },
      ],
      results: [
        {
          id: 'totalPago',
          label: 'Total pago até contemplação',
          format: 'currency',
          compute: (v, ctx) => {
            const baseInstallment = ctx.sim?.fullInstallment ?? 0;
            const baseCredit = ctx.sim?.creditValue ?? 1;
            const parcela = baseInstallment * (v.carta / baseCredit);
            return parcela * v.mes;
          },
        },
        {
          id: 'capitalAplicado',
          label: 'Capital aplicado no fundo',
          format: 'currency',
          compute: (v) => v.carta,
        },
        {
          id: 'mesesRestantes',
          label: 'Meses rendendo no fundo',
          format: 'months',
          compute: (v, ctx) => Math.max(0, (ctx.sim?.termMonths ?? 200) - v.mes),
        },
        {
          id: 'saldoFinal',
          label: 'Saldo final no resgate',
          format: 'currency',
          compute: (v, ctx) => {
            const cdiBase = ctx.cdiAnnualLiq ?? CDI_LIQ;
            const cdiAjustado = cdiBase * (v.cdiPct / 100);
            const mesesRestantes = Math.max(0, (ctx.sim?.termMonths ?? 200) - v.mes);
            return compoundGrowthAnnualMonthly(v.carta, cdiAjustado, mesesRestantes);
          },
        },
        {
          id: 'equivalenteTradicional',
          label: 'Equivalente em aplicação tradicional',
          format: 'currency',
          compute: (v, ctx) => {
            const baseInstallment = ctx.sim?.fullInstallment ?? 0;
            const baseCredit = ctx.sim?.creditValue ?? 1;
            const parcela = baseInstallment * (v.carta / baseCredit);
            const cdiBase = ctx.cdiAnnualLiq ?? CDI_LIQ;
            const cdiAjustado = cdiBase * (v.cdiPct / 100);
            const termMonths = ctx.sim?.termMonths ?? 200;
            const monthlyRate = Math.pow(1 + cdiAjustado, 1 / 12) - 1;
            if (monthlyRate === 0) return parcela * termMonths;
            return parcela * ((Math.pow(1 + monthlyRate, termMonths) - 1) / monthlyRate);
          },
        },
        {
          id: 'gapPatrimonial',
          label: 'Diferença vs aplicação tradicional',
          format: 'currency',
          emphasis: 'positive-negative',
          compute: (v, ctx) => {
            const cdiBase = ctx.cdiAnnualLiq ?? CDI_LIQ;
            const cdiAjustado = cdiBase * (v.cdiPct / 100);
            const mesesRestantes = Math.max(0, (ctx.sim?.termMonths ?? 200) - v.mes);
            const saldoFinal = compoundGrowthAnnualMonthly(v.carta, cdiAjustado, mesesRestantes);
            const baseInstallment = ctx.sim?.fullInstallment ?? 0;
            const baseCredit = ctx.sim?.creditValue ?? 1;
            const parcela = baseInstallment * (v.carta / baseCredit);
            const termMonths = ctx.sim?.termMonths ?? 200;
            const monthlyRate = Math.pow(1 + cdiAjustado, 1 / 12) - 1;
            const equivTradicional = monthlyRate === 0
              ? parcela * termMonths
              : parcela * ((Math.pow(1 + monthlyRate, termMonths) - 1) / monthlyRate);
            return saldoFinal - equivTradicional;
          },
        },
      ],
      applyTargets: [
        { type: 'simulatorInput', sourceControlId: 'carta', field: 'creditValue' },
        { type: 'simulatorContemplation', sourceControlId: 'mes' },
      ],
      disclaimerText: 'Valores ilustrativos. Rendimento real depende das condições do fundo CAIXA durante o ciclo do consórcio.',
    },
  },

  {
    id: 'alavancagem-imobiliaria',
    chapter: 'Leverage',
    priority: 3,
    title: 'Comprar Imóveis para Alugar',
    tagline: 'Cotas imobiliárias escalonadas formam um portfólio locatício — o aluguel projetado paga parte da parcela.',
    icon: Building2,
    accent: 'primary',
    howItWorks:
      'Cliente usa cotas imobiliárias para adquirir imóveis destinados à locação. Com lance moderado e contemplação em 12–24 meses, o aluguel passa a cobrir parcela relevante do compromisso mensal — em regiões com cap rate adequado.',
    patrimonialLogic:
      'O inquilino amortiza progressivamente o ativo. Ao final do plano, o cliente fica com o imóvel quitado, tendo aportado capital próprio próximo ao lance somado a eventuais diferenças mensais.',
    liquidityImpact:
      'Fluxo líquido próximo de zero quando aluguel e parcela se equiparam. Capital próprio comprometido tende a ficar abaixo de 25% do valor do imóvel.',
    timing:
      'Mercados com cap rate locatício consistente e baixa vacância. Visão de portfólio (não apenas um imóvel isolado).',
    advantages: [
      'O aluguel contribui de forma estrutural para a amortização.',
      'Valorização do imóvel agrega ao patrimônio independentemente do fluxo.',
      'Renda passiva cresce conforme cotas são quitadas.',
    ],
    risks: [
      'Vacância prolongada interrompe o fluxo previsto.',
      'Reajuste do aluguel pode descolar do reajuste da carta.',
      'Manutenção, inadimplência e custos recorrentes corroem o cap rate líquido.',
    ],
    commonMistakes: [
      'Adquirir imóvel sem demanda locatícia comprovada.',
      'Ignorar IPTU, condomínio e manutenção no cap rate líquido.',
      'Assumir ocupação plena em todos os meses.',
    ],
    whenNotToUse: [
      'Regiões com vacância elevada ou cap rate insuficiente para cobrir a parcela.',
      'Cliente sem perfil para gestão locatícia (ou sem intermediário qualificado).',
    ],
    calculations: [
      {
        label: 'Aluguel estimado (cap rate ilustrativo)',
        formula: 'yield mensal × valor do imóvel',
        result: (c, ctx) => `${brl(c * yieldOf(ctx))}/mês`,
      },
      { label: 'Parcela cheia do consórcio (com seguro)', formula: 'fullInstallment do Simulador', result: (_c, ctx) => !ctx?.sim ? NA : `${brl(ctx.sim.fullInstallment)}/mês` },
      {
        label: 'Cobertura aluguel ÷ parcela',
        formula: 'aluguel ÷ fullInstallment do Simulador',
        result: (c, ctx) => !ctx?.sim ? NA : pct((c * yieldOf(ctx)) / ctx.sim.fullInstallment),
      },
      { label: 'Capital próprio aportado (lance 25%)', formula: '0,25 × crédito', result: (c) => brl(c * 0.25) },
    ],
    scenarios: [
      { context: 'Profissional construindo portfólio', detail: 'Imóveis adquiridos via cotas; aluguel cobre parcela substancial das obrigações mensais.' },
      { context: 'Planejamento de longo prazo', detail: 'Cotas escalonadas ao longo de 15 anos para gerar renda passiva consolidada na fase pós-laboral.' },
    ],
    comparisons: [
      { label: 'Capital próprio aportado', consortium: '~25% do valor do imóvel', alternative: 'À vista: 100%', delta: 'Comprometimento menor' },
      { label: 'Custo financeiro nominal', consortium: 'Estrutura administrativa (adm + FR), sem juros bancários', alternative: `Financiamento: ${FIN_RATE_LABEL}`, delta: 'Estrutura sem juros bancários' },
    ],
  },

  // ───────────────── CAPÍTULO 3: ACUMULAÇÃO ─────────────────
  {
    id: 'multiplicacao-cotas',
    chapter: 'Acumulação',
    title: 'Usar a Contemplação para Comprar Outra Cota',
    tagline: 'Cada contemplação financia uma nova cota: crescimento patrimonial composto e disciplinado.',
    icon: Layers,
    accent: 'primary',
    howItWorks:
      'O fluxo gerado por uma cota já produtiva (aluguel, revenda, monetização) é direcionado, total ou parcialmente, ao lance de uma nova cota. O ciclo se repete em intervalos pré-definidos. O crescimento é composto, mas depende da disciplina de reinvestimento.',
    patrimonialLogic:
      'A estratégia transforma renda passiva em capacidade de aquisição. Ao longo de múltiplos ciclos, o portfólio cresce sem novos aportes relevantes do capital pessoal.',
    liquidityImpact:
      'Fluxo equilibrado quando cada cota gera retorno consistente. Exige disciplina rigorosa para não consumir o capital liberado em despesas de uso pessoal.',
    timing:
      'Horizonte de 10 anos ou mais. Indicada para quem tem disposição para reinvestir sistematicamente a renda gerada.',
    advantages: [
      'Crescimento patrimonial composto a partir de um aporte inicial.',
      'Diversificação natural ao longo do tempo (várias cotas, ciclos distintos).',
      'Renda passiva agregada cresce em escada conforme cotas quitam.',
    ],
    risks: [
      'Falha de monetização em um ciclo interrompe o crescimento previsto.',
      'Concentração se todos os reinvestimentos forem no mesmo segmento.',
      'Exposição prolongada a ciclos macroeconômicos adversos.',
    ],
    commonMistakes: [
      'Consumir o caixa liberado em vez de reinvestir.',
      'Não recalcular cap rate e viabilidade antes de cada novo ciclo.',
      'Subestimar custos de transação (impostos, ITBI, corretagem).',
    ],
    whenNotToUse: [
      'Horizonte curto (próximo da fase de desacumulação).',
      'Sem capacidade de gestão de portfólio crescente.',
    ],
    calculations: [
      { label: 'Renda passiva ilustrativa por cota quitada', formula: 'yield mensal × valor do ativo', result: (c, ctx) => `${brl(c * yieldOf(ctx))}/mês` },
      { label: 'Capital acumulado para novo lance (60 meses)', formula: '60 × renda mensal', result: (c, ctx) => brl(c * yieldOf(ctx) * 60) },
      { label: 'Exposição patrimonial após 3 ciclos (ilustrativo)', formula: 'somatório de cartas contratadas', result: (c) => `~${brl(c * 3)} em ativos sob plano` },
    ],
    scenarios: [
      { context: 'Acumulador disciplinado', detail: 'Aluguel da primeira cota financia o lance da segunda; ciclo se repete em janelas pré-definidas.' },
      { context: 'Empresa de operação previsível', detail: 'Receita gerada por um ativo viabiliza o lance do próximo, sem aporte adicional relevante.' },
    ],
    comparisons: [
      { label: 'Crescimento patrimonial', consortium: 'Composto via reinvestimento', alternative: 'Renda fixa pura: linear', delta: 'Curva crescente vs. linear' },
      { label: 'Aporte adicional exigido', consortium: 'Mínimo após o ciclo inicial', alternative: 'Aporte continuado em renda fixa', delta: 'Autossustentável' },
    ],
  },

  {
    id: 'venda-carta-lucro',
    chapter: 'Acumulação',
    priority: 5,
    title: 'Vender a Carta com Lucro',
    tagline:
      'Use o consórcio como ferramenta de investimento. Entre, seja contemplado, e venda seu lugar com lucro — sem precisar comprar nada.',
    icon: GitBranch,
    accent: 'primary',
    howItWorks:
      'Você entra num consórcio, mas com um objetivo diferente do normal: em vez de querer comprar um imóvel ou carro no final, você quer vender o seu lugar no consórcio depois de ser contemplado.\n\nComo funciona na prática:\n\n1. Você assina um contrato de consórcio com a CAIXA e começa a pagar as parcelas mensais.\n\n2. Você pode dar um lance livre (oferecer um valor pra tentar ser contemplado mais cedo) ou simplesmente esperar ser sorteado.\n\n3. Quando é contemplado, você ganha o direito de receber o valor da carta. Mas em vez de usar esse dinheiro pra comprar um bem, você passa esse direito pra outra pessoa.\n\n4. Essa pessoa te paga uma quantia em dinheiro (chamada de ágio — tipicamente entre 15% e 30% do valor da carta) e assume todas as parcelas que ainda faltam pagar.\n\nResultado: você sai do consórcio com dinheiro líquido no bolso, sem ter comprado nada. O comprador continua o consórcio no seu lugar.',
    patrimonialLogic:
      'Atenção: esta NÃO é uma estratégia para construir patrimônio. É uma operação financeira de curto prazo.\n\nPense assim: você está usando o consórcio como uma ferramenta de investimento, e não como uma forma de comprar um bem. Você coloca seu dinheiro no consórcio por um período, ganha quando é contemplado, e sai da operação.\n\nQuanto mais cedo a contemplação acontecer, melhor o resultado financeiro. Se for sorteado no mês 6, você investiu pouco e leva um bom ganho. Se demorar 36 meses pra ser contemplado, o ganho fica pequeno — pode até render menos que um CDB no mesmo período.',
    liquidityImpact:
      'Durante a operação:\n- Você precisa ter dinheiro pra pagar a parcela todo mês até ser contemplado\n- Esse dinheiro fica "preso" no consórcio até você vender o seu lugar\n- Se precisar tirar antes de ser contemplado, sai com prejuízo (vender uma cota NÃO contemplada dá deságio, não ágio)\n\nDepois da venda:\n- Você recebe o valor combinado à vista\n- Não tem mais nenhuma obrigação com o consórcio\n- O comprador segue pagando as parcelas no seu lugar',
    timing:
      'Esta estratégia faz sentido para você se:\n\n- Tem dinheiro de reserva e pode pagar as parcelas sem aperto\n- Pode esperar de 1 a 3 anos pra ver o resultado\n- Não tem pressa de comprar um imóvel ou carro específico\n- Quer diversificar seus investimentos pra fora de poupança, CDB e bolsa\n- Aceita o risco de que a contemplação pode demorar — o que reduz o ganho\n\nNÃO é pra você se:\n\n- Precisa do imóvel ou carro de verdade (faça o consórcio tradicional)\n- Está apertado financeiramente — vai sofrer pagando as parcelas\n- Precisa do dinheiro em meses, não em anos\n- Não tem como esperar — pode demorar pra ser contemplado',
    advantages: [
      'Ganho rápido comparado a outros investimentos do mesmo prazo.',
      'Você não precisa entender de imóvel, achar inquilino ou cuidar de bem.',
      'Recebe o dinheiro todo de uma vez na venda — liquidez total na saída.',
      'Não depende de bolsa de valores ou flutuação de mercado.',
      'Tributação geralmente mais leve que renda fixa de mesmo prazo (consulte um contador).',
      'Opção de diversificar — você pode entrar em 2 ou 3 grupos diferentes pra aumentar a chance de ser contemplado.',
    ],
    risks: [
      'Demora pra ser contemplado: quanto mais demora, menor o ganho. Acima de 36 meses, pode dar prejuízo.',
      'Variação do mercado: o ágio (adicional pago pelo comprador) pode diminuir se muita gente quiser vender ao mesmo tempo.',
      'Mudanças nas regras da CAIXA podem dificultar ou encarecer a venda no futuro.',
      'Se você precisar do dinheiro antes da contemplação, vai sair com prejuízo.',
      'A parcela sobe um pouco todo ano (correção pelo INPC), então o custo cresce com o tempo.',
    ],
    commonMistakes: [
      'Usar lance embutido: ele REDUZ o valor da carta que você vai vender, diminuindo o ganho. Use apenas lance livre (que sai do seu próprio bolso).',
      'Achar que sempre vai ser contemplado rápido: planeje considerando o cenário médio, não só o otimista.',
      'Confundir com investimento em imóvel: aqui você NÃO fica com o imóvel. Vende o direito antes de comprar.',
      'Esquecer do imposto de renda: dependendo do ganho, há tributação sobre o lucro.',
      'Concentrar tudo num grupo só: se demorar pra contemplar, você está exposto. Diversifique em 2-3 grupos diferentes.',
    ],
    whenNotToUse: [
      'Cliente que realmente quer comprar o bem (imóvel ou veículo).',
      'Cliente sem reserva financeira pra aguentar as parcelas com folga.',
      'Cliente com horizonte de tempo curto demais (menos de 12 meses).',
      'Cliente que precisa de previsibilidade total — esta operação tem variável de tempo incerto.',
      'Cliente em fase de aposentadoria sem outros recursos — operação tem janela de risco.',
    ],
    /* ──────────────────────────────────────────────────────────────────────
     * NOTA DE PRECISÃO — `fullInstallment × meses`
     * Capital aproximado pelo produto da parcela nominal do Simulador
     * pelos meses até a contemplação. Não aplica reajuste INPC mês a mês
     * (alinhado com as demais 23 estratégias do catálogo). Reajuste real
     * ficará como melhoria futura quando o motor expuser `costPlan` como
     * array de parcelas reajustadas (hoje é escalar = custo total do plano).
     * ────────────────────────────────────────────────────────────────────── */
    calculations: [
      /* — Bloco 1: cenário ATUAL (usa contemplationMonth do Simulador) — */
      {
        label: 'Quanto você investe até a venda',
        formula: 'Parcela mensal × meses até contemplação',
        result: (_c, ctx) => {
          if (!ctx?.sim) return NA;
          const capital = ctx.sim.fullInstallment * ctx.sim.contemplationMonth;
          return brl(capital);
        },
      },
      {
        label: 'Quanto você recebe na venda',
        formula: '% do valor da carta que vai pro vendedor em mãos',
        result: (c, ctx) => {
          if (!ctx?.sim) return NA;
          const receita = c * (ctx.agioOnSale ?? 0.25);
          return brl(receita);
        },
      },
      {
        label: 'Seu lucro líquido',
        formula: 'Recebido na venda menos o investido',
        result: (c, ctx) => {
          if (!ctx?.sim) return NA;
          const capital = ctx.sim.fullInstallment * ctx.sim.contemplationMonth;
          const receita = c * (ctx.agioOnSale ?? 0.25);
          return brl(receita - capital);
        },
      },
      {
        label: 'Rendimento total',
        formula: 'Lucro dividido pelo investido (em %)',
        result: (c, ctx) => {
          if (!ctx?.sim) return NA;
          const capital = ctx.sim.fullInstallment * ctx.sim.contemplationMonth;
          const receita = c * (ctx.agioOnSale ?? 0.25);
          const roi = capital > 0 ? ((receita - capital) / capital) * 100 : 0;
          return formatPercent(roi);
        },
      },
      {
        label: 'Rendimento ao ano (comparável ao CDI)',
        formula: 'Conversão do rendimento total para base anual',
        result: (c, ctx) => {
          if (!ctx?.sim) return NA;
          const meses = ctx.sim.contemplationMonth;
          const capital = ctx.sim.fullInstallment * meses;
          const receita = c * (ctx.agioOnSale ?? 0.25);
          const totalRet = capital > 0 ? (receita - capital) / capital : 0;
          const anualizado =
            meses > 0 ? (Math.pow(1 + totalRet, 12 / meses) - 1) * 100 : 0;
          return formatPercent(anualizado);
        },
      },
      {
        label: 'Quantas vezes seu dinheiro multiplicou',
        formula: 'Recebido dividido pelo investido',
        result: (c, ctx) => {
          if (!ctx?.sim) return NA;
          const capital = ctx.sim.fullInstallment * ctx.sim.contemplationMonth;
          const receita = c * (ctx.agioOnSale ?? 0.25);
          const mult = capital > 0 ? receita / capital : 0;
          return `${mult.toFixed(2)}x`;
        },
      },
      /* — Bloco 2: cenários COMPARATIVOS (meses fixos 6/24/36) — */
      {
        label: 'Cenário ideal — contemplação no mês 6',
        formula: 'Resultado se for sorteado nos primeiros 6 meses',
        result: (c, ctx) => {
          if (!ctx?.sim) return NA;
          const meses = 6;
          const capital = ctx.sim.fullInstallment * meses;
          const receita = c * (ctx.agioOnSale ?? 0.25);
          const lucro = receita - capital;
          const roi = capital > 0 ? (lucro / capital) * 100 : 0;
          return `Investiu ${brl(capital)} · Recebe ${brl(receita)} · Lucro ${brl(lucro)} · Rendimento ${formatPercent(roi)}`;
        },
      },
      {
        label: 'Cenário esperado — contemplação no mês 24',
        formula: 'Resultado em contemplação típica (2 anos)',
        result: (c, ctx) => {
          if (!ctx?.sim) return NA;
          const meses = 24;
          const capital = ctx.sim.fullInstallment * meses;
          const receita = c * (ctx.agioOnSale ?? 0.25);
          const lucro = receita - capital;
          const roi = capital > 0 ? (lucro / capital) * 100 : 0;
          return `Investiu ${brl(capital)} · Recebe ${brl(receita)} · Lucro ${brl(lucro)} · Rendimento ${formatPercent(roi)}`;
        },
      },
      {
        label: 'Cenário limite — contemplação no mês 36',
        formula: 'Resultado em contemplação tardia (3 anos)',
        result: (c, ctx) => {
          if (!ctx?.sim) return NA;
          const meses = 36;
          const capital = ctx.sim.fullInstallment * meses;
          const receita = c * (ctx.agioOnSale ?? 0.25);
          const lucro = receita - capital;
          const roi = capital > 0 ? (lucro / capital) * 100 : 0;
          return `Investiu ${brl(capital)} · Recebe ${brl(receita)} · Lucro ${brl(lucro)} · Rendimento ${formatPercent(roi)}`;
        },
      },
    ],
    scenarios: [
      {
        context: 'Profissional liberal recebeu um bônus anual',
        detail:
          'Em vez de aplicar tudo num CDB e ver render lentamente, entra em 2 grupos de consórcio imobiliário com cartas equivalentes. Paga as parcelas com a renda mensal normal. Se um dos dois grupos contemplar em 18-24 meses, sai com lucro líquido superior à renda fixa do mesmo período. Diversificar em 2 grupos diferentes aumenta a chance estatística de sair cedo.',
      },
      {
        context: 'Investidor experiente diversificando fora da bolsa',
        detail:
          'Aloca 10-15% do patrimônio em consórcios imobiliários como classe descorrelacionada do mercado financeiro. Sabe que pode demorar pra contemplar e aceita esse risco de tempo. Trata o consórcio como ferramenta financeira, não como meio de comprar um bem. Se a contemplação vier antes do mês 30, ganho consistente acima da renda fixa.',
      },
    ],
    comparisons: [
      {
        label: 'Retorno em 24 meses (cenário base)',
        consortium:
          'Rendimento total de 50% a 120% sobre o capital investido em parcelas',
        alternative:
          'CDB 100% CDI no mesmo período rende ~26% líquido de IR',
        delta:
          'Vantagem clara do consórcio se a contemplação vier em até 24 meses',
      },
      {
        label: 'Liquidez antes da contemplação',
        consortium:
          'Difícil — vender carta NÃO contemplada gera deságio (prejuízo)',
        alternative:
          'CDB com liquidez diária ou Tesouro Selic: saque a qualquer momento',
        delta: 'Renda fixa vence em flexibilidade; consórcio exige paciência',
      },
      {
        label: 'Independência de mercado',
        consortium:
          'Não correlacionado com bolsa, taxa de juros ou inflação',
        alternative:
          'Renda fixa: sensível à Selic. Bolsa: sensível a humor de mercado',
        delta: 'Consórcio = diversificação real do portfólio',
      },
    ],
    taxNote:
      'Atenção tributária — o que você precisa saber\n\nO lucro que você ganha na venda da carta é considerado pela Receita Federal como "ganho de capital". Você pode ter que pagar imposto sobre esse ganho.\n\nPara Pessoa Física:\n- Se o ganho mensal total — somando todas as vendas de bens e direitos que você fizer no mês — for até R$ 35.000, há isenção\n- Acima desse valor, paga 15% sobre o ganho que ultrapassar o limite\n- Ganhos muito altos (acima de R$ 5 milhões) têm alíquotas progressivas (17,5% a 22,5%)\n\nPara Pessoa Jurídica:\n- A tributação depende do regime da empresa (Simples, Lucro Presumido, Lucro Real)\n- Algumas pessoas estruturam holdings patrimoniais pra otimizar a tributação — pode valer a pena conversar com um contador\n\nImportante:\n- O simulador mostra valores BRUTOS, antes de impostos\n- Antes de fazer a operação, consulte um contador. A tributação pode mudar bastante o ganho final\n- Guarde todos os comprovantes de pagamento das parcelas — eles servem como custo na hora de calcular o imposto',
    mentalTriggers: [
      {
        type: 'novidade',
        label: 'Resultado fora do óbvio',
        context: 'Use na abertura, com cliente prático que decide pelo resultado antes de entender o mecanismo. Funciona bem com perfil pouco paciente para explicação técnica.',
        example: 'Imagina pegar R$ 35 mil, deixar parado em parcelas por 12 meses, e sair com R$ 125 mil líquidos na conta. Sem mexer em bolsa, sem caçar inquilino, sem comprar nenhum imóvel. Esse é o jogo dessa operação.',
      },
      {
        type: 'exclusividade',
        label: 'Estratégia pouco usada',
        context: 'Use com cliente intelectualizado que valoriza saber das coisas que pouca gente sabe. Cria sensação de estratégia exclusiva e desperta interesse em entender mais.',
        example: 'Existe uma forma de usar o consórcio CAIXA como ferramenta financeira — entra, é contemplado, e vende seu lugar com lucro pra outro investidor. Operação totalmente legal, mas quase ninguém usa porque pouca gente conhece.',
      },
      {
        type: 'autoridade',
        label: 'Contraste com renda fixa',
        context: 'Use com cliente que tem CDB, Tesouro ou outras aplicações de renda fixa e calcula rendimento mentalmente. Os números concretos da comparação afastam a percepção de promessa milagrosa.',
        example: 'Você ia colocar R$ 35 mil num CDB de 14% pra render uns R$ 5 mil em um ano. E se eu te disser que tem uma operação dentro da CAIXA que, no mesmo prazo, pode render R$ 90 mil em vez de R$ 5 mil?',
      },
      {
        type: 'aversao_perda',
        label: 'Custo de oportunidade',
        context: 'Use com cliente conservador que tem reserva confortável mas paralisada na poupança. Provoca movimento sem agredir, focando no que ele já está perdendo.',
        example: 'Cada R$ 30 mil que tá parado na poupança é R$ 30 mil que poderia tá numa operação rendendo bem mais. A pergunta não é "risco demais?". A pergunta é: quanto tempo você quer continuar perdendo essa janela?',
      },
      {
        type: 'afinidade',
        label: 'Sem complicação',
        context: 'Use com cliente avesso a complexidade, profissional ocupado, ou que já se queimou tentando administrar imóvel ou inquilino. Posiciona o consultor como aliado ativo, não vendedor que some depois da assinatura.',
        example: 'Você não vai precisar entender de imóvel, achar inquilino, lidar com inquilino que não paga, ou olhar bolsa todo dia. Paga as parcelas como qualquer consórcio. Quando for contemplado, eu mesmo te ajudo a vender com lucro. Você só assina e recebe.',
      },
    ],
    narrativeContext: {
      thesisFrame:
        'Venda da carta contemplada no mercado secundário para captura de ágio. Tese financeira de revenda — não envolve manter a carta ou adquirir o bem.',
      vocabulary: {
        allowed: [
          'venda da carta',
          'ágio',
          'mercado secundário',
          'comprador interessado',
          'carta pronta para uso',
          'lance livre',
          'sorteio',
          'rendimento da operação',
        ],
        forbidden: [
          'aplicar em fundo',
          'manter a carta aplicada',
          'rendimento composto',
          'fundo CAIXA',
          'antecipação patrimonial',
          'capitalização composta',
        ],
      },
      primaryRisk:
        'A contemplação pode demorar e isso reduz o ganho final. Acima de 36 meses sem contemplar, a operação tende a deixar de fazer sentido financeiramente.',
      nextStepHint:
        'Vamos olhar grupos com lances competitivos para acelerar a contemplação.',
      computeFields: (ctx) => {
        if (!ctx?.sim) return [];
        const credit = ctx.sim.creditValue;
        const installment = ctx.sim.fullInstallment;
        const contempMonth = ctx.sim.contemplationMonth;
        const agio = ctx.agioOnSale ?? 0;
        const receita = credit * agio;
        const investido = installment * contempMonth;
        const lucro = receita - investido;
        return [
          { label: 'Valor da carta', value: brl(credit) },
          { label: 'Ágio na venda', value: `${(agio * 100).toFixed(0)}%` },
          { label: 'Receita estimada na venda', value: brl(receita) },
          { label: 'Total investido até contemplação', value: brl(investido) },
          { label: 'Lucro estimado', value: brl(lucro) },
        ];
      },
    },
    embeddedSimulation: {
      controls: [
        {
          id: 'carta',
          label: 'Valor da carta',
          unit: 'currency',
          min: 50_000,
          max: 1_000_000,
          step: 10_000,
          defaultValue: (ctx) =>
            Math.max(50_000, Math.min(1_000_000, ctx.sim?.creditValue ?? 300_000)),
          minLabel: 'R$ 50 mil',
          maxLabel: 'R$ 1 mi',
        },
        {
          id: 'agio',
          label: 'Ágio esperado',
          unit: 'percent',
          min: 10,
          max: 40,
          step: 1,
          defaultValue: (ctx) =>
            Math.max(10, Math.min(40, Math.round((ctx.agioOnSale ?? 0.25) * 100))),
          minLabel: '10%',
          maxLabel: '40%',
        },
        {
          id: 'mes',
          label: 'Mês de contemplação',
          unit: 'months',
          min: 1,
          max: (ctx) => Math.min(ctx.sim?.termMonths ?? 60, 60),
          step: 1,
          defaultValue: (ctx) =>
            Math.max(1, Math.min(60, ctx.sim?.contemplationMonth ?? 1)),
          minLabel: 'mês 1',
          maxLabel: (ctx) => `mês ${Math.min(ctx.sim?.termMonths ?? 60, 60)}`,
        },
      ],
      results: [
        {
          id: 'parcela',
          label: 'Parcela estimada',
          format: 'currency',
          compute: (v, ctx) => {
            const baseInstallment = ctx.sim?.fullInstallment ?? 0;
            const baseCredit = ctx.sim?.creditValue ?? 1;
            return baseInstallment * (v.carta / baseCredit);
          },
        },
        {
          id: 'capital',
          label: 'Capital aplicado',
          format: 'currency',
          compute: (v, ctx) => {
            const baseInstallment = ctx.sim?.fullInstallment ?? 0;
            const baseCredit = ctx.sim?.creditValue ?? 1;
            const parcela = baseInstallment * (v.carta / baseCredit);
            return parcela * v.mes;
          },
        },
        {
          id: 'receita',
          label: 'Receita na venda',
          format: 'currency',
          compute: (v) => v.carta * (v.agio / 100),
        },
        {
          id: 'lucro',
          label: 'Lucro líquido',
          format: 'currency',
          emphasis: 'positive-negative',
          compute: (v, ctx) => {
            const baseInstallment = ctx.sim?.fullInstallment ?? 0;
            const baseCredit = ctx.sim?.creditValue ?? 1;
            const parcela = baseInstallment * (v.carta / baseCredit);
            const capital = parcela * v.mes;
            const receita = v.carta * (v.agio / 100);
            return receita - capital;
          },
        },
        {
          id: 'rendimento',
          label: 'Rendimento total',
          format: 'percent',
          emphasis: 'positive-negative',
          compute: (v, ctx) => {
            const baseInstallment = ctx.sim?.fullInstallment ?? 0;
            const baseCredit = ctx.sim?.creditValue ?? 1;
            const parcela = baseInstallment * (v.carta / baseCredit);
            const capital = parcela * v.mes;
            if (capital === 0) return 0;
            const receita = v.carta * (v.agio / 100);
            const lucro = receita - capital;
            return (lucro / capital) * 100;
          },
        },
        {
          id: 'multiplicador',
          label: 'Multiplicador',
          format: 'multiplier',
          compute: (v, ctx) => {
            const baseInstallment = ctx.sim?.fullInstallment ?? 0;
            const baseCredit = ctx.sim?.creditValue ?? 1;
            const parcela = baseInstallment * (v.carta / baseCredit);
            const capital = parcela * v.mes;
            if (capital === 0) return 0;
            const receita = v.carta * (v.agio / 100);
            return receita / capital;
          },
        },
      ],
      applyTargets: [
        { type: 'simulatorInput', sourceControlId: 'carta', field: 'creditValue' },
        { type: 'simulatorContemplation', sourceControlId: 'mes' },
        { type: 'wealthAssumption', sourceControlId: 'agio', key: 'agioOnSale', transform: Math.round },
      ],
    },
  },


  {
    id: 'reinvestimento-estruturado',
    chapter: 'Acumulação',
    priority: 6,
    title: 'Reinvestir Aluguel/Renda em Novas Cotas',
    tagline: 'Renda passiva existente entra automaticamente em consórcios novos — composição patrimonial sem aporte adicional.',
    icon: Recycle,
    accent: 'primary',
    howItWorks:
      'Toda renda passiva gerada (aluguéis, dividendos, monetização) é direcionada, conforme regra previamente definida, para lances em novas cotas. O capital trabalha em duas camadas: no ativo atual e na próxima aquisição.',
    patrimonialLogic:
      'A composição é o motor da estratégia. Pequenas taxas de reinvestimento sustentadas ao longo do tempo produzem efeito patrimonial relevante em horizontes longos.',
    liquidityImpact:
      'Renda passiva não chega ao orçamento pessoal — fica reinvestida. Exige fonte de renda separada (renda ativa) para sustentar o custo de vida.',
    timing:
      'Fase de acumulação (tipicamente 30–55 anos) com renda ativa robusta.',
    advantages: [
      'Aceleração patrimonial sem novos aportes ativos relevantes.',
      'Disciplina contratual — renda passiva nunca vira consumo.',
      'Combina renda passiva crescente com nova exposição patrimonial.',
    ],
    risks: [
      'Renda passiva volátil interrompe o ciclo de reinvestimento.',
      'Concentração se sempre reinvestir no mesmo segmento.',
      'Tributação reduz o capital líquido disponível para reinvestir.',
    ],
    commonMistakes: [
      'Misturar renda passiva com fluxo de consumo pessoal.',
      'Não revisar a alocação a cada novo ciclo.',
      'Reinvestir sem manter reserva tática para oportunidades pontuais.',
    ],
    whenNotToUse: [
      'Cliente em fase de desacumulação (precisa da renda passiva).',
      'Renda ativa insuficiente para custear a vida sem a renda passiva.',
    ],
    calculations: [
      { label: 'Renda passiva ilustrativa (ano 1)', formula: 'yield mensal × patrimônio × 12', result: (c, ctx) => `${brl(c * yieldOf(ctx) * 12)}/ano` },
      { label: 'Capital acumulado para novo lance (5 anos)', formula: '5 × renda anual', result: (c, ctx) => brl(c * yieldOf(ctx) * 12 * 5) },
    ],
    scenarios: [
      { context: 'Profissional liberal', detail: 'Renda de imóveis financia novo lance em ciclos pré-definidos, sem aporte adicional.' },
      { context: 'Sócio de empresa', detail: 'Dividendos anuais reinvestidos em cota patrimonial, com critério escrito.' },
    ],
    comparisons: [
      { label: 'Trajetória patrimonial', consortium: 'Crescente por composição', alternative: 'Sem reinvestimento: estagnada', delta: 'Diferença estrutural no longo prazo' },
      { label: 'Aporte adicional exigido', consortium: 'Mínimo após início do ciclo', alternative: 'Aporte contínuo em renda fixa', delta: 'Autossustentável' },
    ],
  },

  {
    id: 'autoquitacao-estruturada',
    chapter: 'Acumulação',
    title: 'Quitar a Cota com o Próprio Aluguel',
    tagline: 'O aluguel do bem contemplado amortiza a parcela: encurta o prazo e libera capital para o próximo ciclo.',
    icon: Repeat,
    accent: 'success',
    howItWorks:
      'O fluxo gerado pelo ativo (aluguel, receita operacional) é canalizado para amortizações extras na cota. O prazo efetivo pode cair de 180 para 90–120 meses, e a cota é quitada antes do prazo nominal — liberando o ativo desembaraçado.',
    patrimonialLogic:
      'Compressão temporal: o cliente alcança o patrimônio livre em prazo menor, mantendo o ativo gerando renda durante a redução do saldo devedor.',
    liquidityImpact:
      'Fluxo neutro durante a estratégia (renda do ativo ≈ parcela + amortização). Liberação patrimonial concentrada ao fim do plano.',
    timing:
      'Quando o ativo gera renda recorrente acima da parcela ordinária do consórcio.',
    advantages: [
      'Quita o ativo antes do prazo nominal sem novos aportes relevantes.',
      'Aumenta o retorno efetivo (TIR) da cota.',
      'Liberação antecipada de capital acelera o próximo ciclo.',
    ],
    risks: [
      'Quebra na renda do ativo trava a aceleração.',
      'Custos não-monetários (gestão, inadimplência) corroem a renda líquida.',
      'Antecipação reduz tempo de exposição a reajustes — efeito variável conforme cenário.',
    ],
    commonMistakes: [
      'Amortizar com capital de giro pessoal (descapitaliza).',
      'Não validar a regra do grupo para amortização extra.',
      'Confundir amortização de saldo com redução de parcela (efeitos distintos).',
    ],
    whenNotToUse: [
      'Renda do ativo abaixo da parcela ordinária.',
      'Cliente prefere alongar prazo para preservar fluxo.',
    ],
    calculations: [
      { label: 'Renda mensal do ativo (ilustrativo)', formula: 'yield mensal × valor do ativo', result: (c, ctx) => `${brl(c * yieldOf(ctx))}/mês` },
      { label: 'Parcela cheia (com seguro)', formula: 'fullInstallment do Simulador', result: (_c, ctx) => !ctx?.sim ? NA : `${brl(ctx.sim.fullInstallment)}/mês` },
      { label: 'Folga disponível para amortização', formula: 'renda − fullInstallment', result: (c, ctx) => !ctx?.sim ? NA : `${brl(Math.max(0, c * yieldOf(ctx) - ctx.sim.fullInstallment))}/mês` },
    ],
    scenarios: [
      { context: 'Imóvel comercial alugado', detail: 'Aluguel cobre parcela e ainda permite amortização extra; cota quita antes do prazo nominal.' },
      { context: 'Veículo sob contrato', detail: 'Receita contratada é alocada para amortizações periódicas; equipamento desembaraçado em prazo reduzido.' },
    ],
    comparisons: [
      { label: 'Prazo efetivo', consortium: 'Reduzido por amortização extra', alternative: 'Plano nominal: 200m', delta: 'Liberação patrimonial antecipada' },
      { label: 'Capital próprio adicional', consortium: 'Mínimo (renda do próprio ativo)', alternative: 'À vista: 100%', delta: 'Estrutura autossustentável' },
    ],
  },

  {
    id: 'patrimonio-escalavel',
    chapter: 'Acumulação',
    title: 'Abrir PJ ou Holding antes de Comprar as Cotas',
    tagline: 'Constitui a empresa antes de escalar o portfólio: eficiência tributária e sucessão organizada desde o começo.',
    icon: Boxes,
    accent: 'primary',
    howItWorks:
      'O cliente estrutura PJ ou holding patrimonial antes do crescimento. Novas cotas e ativos são adquiridos diretamente pela pessoa jurídica, com tributação otimizada, contabilidade unificada e segregação clara entre patrimônio pessoal e operacional.',
    patrimonialLogic:
      'Reduz fricção fiscal sobre renda passiva (PJ no lucro presumido vs. PF). Permite governança formal, planejamento sucessório por cotas societárias e reinvestimento sem tributação intermediária na pessoa física.',
    liquidityImpact:
      'A liquidez fica concentrada na PJ. Distribuição de lucros segue regras tributárias vigentes. A estrutura permite reinvestir sem trânsito pela PF.',
    timing:
      'Indicada quando o portfólio atinge massa crítica (tipicamente 3+ ativos ou renda passiva consistente).',
    advantages: [
      'Tributação otimizada sobre renda passiva.',
      'Segregação patrimonial entre pessoa física e operacional.',
      'Estrutura sucessória mais simples (transferência de cotas).',
    ],
    risks: [
      'Custo de manutenção da PJ (contabilidade, taxas).',
      'Mudança de regime tributário ou reforma tributária pode alterar a vantagem.',
      'Misturar despesas pessoais descaracteriza a estrutura.',
    ],
    commonMistakes: [
      'Estruturar PJ antes do portfólio atingir massa crítica.',
      'Definir regime tributário sem orientação contábil qualificada.',
      'Misturar despesas pessoais na PJ.',
    ],
    whenNotToUse: [
      'Portfólio inicial sem escala suficiente para absorver o custo da PJ.',
      'Cliente sem disciplina contábil ou sem apoio profissional.',
    ],
    calculations: [
      { label: 'IR sobre aluguel — PF (faixa máxima)', formula: 'aluguel × 27,5%', result: (c, ctx) => `${brl(c * yieldOf(ctx) * 12 * 0.275)}/ano` },
      { label: 'IR sobre aluguel — PJ lucro presumido', formula: 'aluguel × ~11,33%', result: (c, ctx) => `${brl(c * yieldOf(ctx) * 12 * 0.1133)}/ano` },
      { label: 'Diferença anual ilustrativa', formula: 'PF − PJ', result: (c, ctx) => `${brl(c * yieldOf(ctx) * 12 * (0.275 - 0.1133))}/ano` },
    ],
    scenarios: [
      { context: 'Investidor com portfólio consolidado', detail: 'Migração para holding; economia tributária recorrente reaplicada em novas cotas.' },
      { context: 'Família empresária', detail: 'Holding familiar consolida ativos e organiza sucessão por cotas societárias.' },
    ],
    comparisons: [
      { label: 'Carga tributária sobre renda passiva', consortium: '~11% (PJ presumido)', alternative: 'PF: até 27,5%', delta: 'Estrutura mais eficiente' },
      { label: 'Sucessão', consortium: 'Transferência de cotas', alternative: 'Inventário tradicional', delta: 'Processo mais simples' },
    ],
  },

  // ───────────────── CAPÍTULO 4: USO PRODUTIVO ─────────────────
  {
    id: 'reforma-ampliacao',
    chapter: 'Uso',
    title: 'Carta para Reformar ou Ampliar Imóvel',
    tagline: 'Usa a carta imobiliária para reforma ou ampliação — agrega valor ao imóvel sem alienação fiduciária bancária.',
    icon: Hammer,
    accent: 'success',
    howItWorks:
      'O consórcio imobiliário permite usar a carta para reforma ou ampliação de imóvel já existente. O cliente faz lance, contempla e direciona o valor à obra — sem assumir alienação fiduciária adicional sobre o imóvel.',
    patrimonialLogic:
      'Em projetos bem dimensionados, a valorização do imóvel após a obra tende a superar o custo financeiro da operação. O ganho líquido depende fortemente de bairro, padrão da obra e ciclo de mercado.',
    liquidityImpact:
      'Lance compromete capital pontual; parcelas mensais absorvidas pelo orçamento doméstico ou por eventual aumento de aluguel quando o imóvel é locado.',
    timing:
      'Imóvel com potencial razoável de valorização (bairro estável ou em valorização, espaço subutilizado, padrão abaixo do entorno).',
    advantages: [
      'Sem alienação fiduciária do imóvel.',
      'Em obras bem dimensionadas, a valorização pode superar o custo financeiro.',
      'Para imóvel locado, aumento de aluguel ajuda a custear a estratégia.',
    ],
    risks: [
      'Obra estourar orçamento.',
      'Valorização menor que a esperada (bairro estagnado).',
      'Reajuste da carta superar a inflação da construção em determinados períodos.',
    ],
    commonMistakes: [
      'Orçar obra sem margem para imprevistos.',
      'Reformar com gosto pessoal demais — limita a liquidez de revenda.',
      'Iniciar obra antes da contemplação confirmada.',
    ],
    whenNotToUse: [
      'Bairro em desvalorização estrutural.',
      'Cliente sem capacidade de acompanhar e gerir obra.',
    ],
    calculations: [
      { label: 'Custo da obra', formula: 'carta de crédito (Simulador)', result: (_c, ctx) => !ctx?.sim ? NA : brl(ctx.sim.creditValue) },
      { label: 'Custo do plano sem seguro', formula: 'costPlan do Simulador', result: (_c, ctx) => !ctx?.sim ? NA : brl(ctx.sim.costPlan) },
      { label: 'Linha bancária comparável (crédito reforma)', formula: 'taxa de mercado variável', result: () => 'Consultar Comparador / banco para taxa vigente' },
    ],
    scenarios: [
      { context: 'Apartamento em bairro consolidado', detail: 'Reforma agrega valor compatível com o padrão do entorno; ganho líquido depende do mercado.' },
      { context: 'Casa locada', detail: 'Ampliação aumenta valor locatício; parte da parcela passa a ser custeada pelo novo aluguel.' },
    ],
    comparisons: [
      { label: 'Custo financeiro', consortium: 'Estrutura administrativa (adm + FR), sem juros bancários', alternative: 'Crédito reforma bancário: ~100–120%', delta: 'Estrutura mais econômica' },
      { label: 'Garantias exigidas', consortium: 'Apenas a cota', alternative: 'Banco: alienação do imóvel', delta: 'Posse preservada' },
    ],
  },

  {
    id: 'retrofit-patrimonial',
    chapter: 'Uso',
    title: 'Carta para Retrofit de Imóvel Antigo',
    tagline: 'Modernização estrutural reposiciona o imóvel no mercado e melhora o cap rate locatício.',
    icon: Wrench,
    accent: 'success',
    howItWorks:
      'Retrofit é uma reforma profunda: substituição de instalações, fachada e layout interno. A carta de crédito viabiliza o reposicionamento de um imóvel antigo em padrão atual de mercado — desde que haja margem entre o custo de retrofit e o valor de mercado pós-obra.',
    patrimonialLogic:
      'A operação só é racional quando o custo de aquisição somado ao custo de retrofit fica abaixo do valor de mercado pós-obra — com margem suficiente para absorver imprevistos e tempo de execução.',
    liquidityImpact:
      'Investimento concentrado em 6–12 meses (obra). Após a entrega, o aluguel ou o valor de venda devem refletir o novo padrão.',
    timing:
      'Imóvel adquirido com desconto consistente sobre o valor pós-retrofit, em região com demanda comprovada.',
    advantages: [
      'Margem entre custo total e valor pós-retrofit (quando bem dimensionada).',
      'Aluguel mais alto após reposicionamento.',
      'Possibilidade de revenda com ganho consistente em mercados favoráveis.',
    ],
    risks: [
      'Custo de retrofit em imóvel antigo pode crescer com problemas estruturais ocultos.',
      'Aprovação em condomínios antigos pode ser complexa.',
      'O mercado pode não absorver o padrão premium na região.',
    ],
    commonMistakes: [
      'Não fazer laudo estrutural completo antes da aquisição.',
      'Subestimar tempo e custo de obra.',
      'Reformar acima do padrão do bairro.',
    ],
    whenNotToUse: [
      'Imóvel sem margem clara entre custo total e valor pós-obra.',
      'Região sem demanda para o padrão final.',
    ],
    calculations: [
      { label: 'Compra do imóvel (ilustrativo)', formula: '60% do valor pós-retrofit', result: (c) => brl(c * 0.6) },
      { label: 'Custo do retrofit (carta)', formula: '~40% do valor pós-retrofit', result: (_c, ctx) => !ctx?.sim ? NA : brl(ctx.sim.creditValue * 0.4) },
      { label: 'Valor pós-retrofit (referência)', formula: 'mercado pós-obra', result: (c) => brl(c) },
      { label: 'Margem teórica (sem custo financeiro)', formula: 'pós − (compra + retrofit)', result: () => '~0% (referencial — margem real depende do mercado)' },
    ],
    scenarios: [
      { context: 'Apto antigo em bairro consolidado', detail: 'Aquisição com desconto + retrofit; reavaliação alinhada ao padrão atual do entorno.' },
      { context: 'Sala comercial em prédio antigo', detail: 'Retrofit reposiciona o imóvel para perfil de inquilino diferente, com aluguel mais alto.' },
    ],
    comparisons: [
      { label: 'Custo total', consortium: 'Compra + retrofit financiado por cota', alternative: 'Comprar novo equivalente', delta: 'Margem depende do mercado' },
      { label: 'Yield pós-obra', consortium: 'Próximo ao padrão de imóvel novo', alternative: 'Imóvel antigo sem retrofit', delta: 'Reposicionamento de cap rate' },
    ],
  },

  {
    id: 'energia-solar',
    chapter: 'Uso',
    title: 'Carta para Energia Solar',
    tagline: 'Sistema fotovoltaico via consórcio: transforma a conta de luz em ativo amortizável.',
    icon: Sun,
    accent: 'success',
    howItWorks:
      'A carta de crédito de bem móvel financia o sistema fotovoltaico. A redução na conta de energia tende a cobrir parte (ou a totalidade) da parcela do consórcio. O sistema tem vida útil de aproximadamente 25 anos; o consórcio costuma se encerrar em prazo menor.',
    patrimonialLogic:
      'A operação converte uma despesa recorrente (energia elétrica) em ativo amortizável. Após a quitação da cota, a energia gerada passa a representar economia direta no orçamento.',
    liquidityImpact:
      'Fluxo tendendo a neutro durante o consórcio (economia ≈ parcela). Após o fim do plano, economia integral permanece pela vida útil restante do sistema.',
    timing:
      'Consumo elétrico mensal relevante. Telhado/área disponível e regulamentação favorável à geração distribuída.',
    advantages: [
      'Economia mensal contribui de forma estrutural para o pagamento da parcela.',
      'Vida útil do sistema substancialmente maior que o prazo do consórcio.',
      'Após a quitação, economia recorrente permanece por anos.',
    ],
    risks: [
      'Mudança regulatória pode alterar a economia esperada (Lei 14.300 e desdobramentos).',
      'Manutenção e troca de inversores ao longo da vida útil.',
      'Sombreamento ou dimensionamento inadequado reduz a geração esperada.',
    ],
    commonMistakes: [
      'Dimensionar sem estudo solarimétrico real.',
      'Contratar instalador sem certificação.',
      'Ignorar custos de homologação e troca de equipamentos.',
    ],
    whenNotToUse: [
      'Consumo elétrico baixo (payback se alonga).',
      'Imóvel locado por curto prazo (cliente não captura economia no longo prazo).',
    ],
    calculations: [
      { label: 'Custo do plano sem seguro', formula: 'costPlan do Simulador', result: (_c, ctx) => !ctx?.sim ? NA : brl(ctx.sim.costPlan) },
      { label: 'Parcela cheia (com seguro)', formula: 'fullInstallment do Simulador', result: (_c, ctx) => !ctx?.sim ? NA : `${brl(ctx.sim.fullInstallment)}/mês` },
      { label: 'Economia mensal de referência', formula: 'redução estimada na conta', result: () => 'Depende do consumo e tarifa locais' },
    ],
    scenarios: [
      { context: 'Residência com consumo relevante', detail: 'Sistema dimensionado para o consumo; economia mensal contribui de forma estrutural para a parcela.' },
      { context: 'Comércio com alto consumo', detail: 'Sistema cobre fração significativa da demanda; economia recorrente pós-quitação.' },
    ],
    comparisons: [
      { label: 'Custo financeiro', consortium: 'Estrutura administrativa (adm + FR), sem juros bancários', alternative: 'Financiamento solar: ~50–60%', delta: 'Estrutura mais econômica' },
      { label: 'Payback', consortium: 'Acelerado pela economia recorrente', alternative: 'Sem sistema: não há payback', delta: 'Conversão de despesa em ativo' },
    ],
  },

  {
    id: 'upgrade-veiculo',
    chapter: 'Uso',
    title: 'Trocar de Carro a Cada 3–4 Anos',
    tagline: 'Ciclo programado de troca de veículo via consórcio — custo total mais baixo que financiamento bancário.',
    icon: Car,
    accent: 'warning',
    howItWorks:
      'Cliente entra em consórcio de auto, contempla por lance ou sorteio e adquire o veículo. Após 36–48 meses, vende o carro e, com o equity residual somado a uma nova cota, realiza a próxima troca em ciclo contínuo.',
    patrimonialLogic:
      'O veículo é ativo depreciativo, mas o consórcio reduz o custo total de propriedade frente ao financiamento. O ciclo de troca preserva equity residual e mantém o cliente sempre dentro da garantia de fábrica.',
    liquidityImpact:
      'Fluxo previsível com parcela mensal constante. Pequenos impulsos de caixa nas trocas (revenda acima do saldo devedor).',
    timing:
      'Cliente que valoriza ter carro novo ou seminovo e usa o veículo de forma intensa.',
    advantages: [
      'Custo de propriedade abaixo do financiamento equivalente.',
      'Veículo permanece dentro do prazo de garantia.',
      'Equity de revenda contribui para o próximo ciclo.',
    ],
    risks: [
      'Depreciação mais agressiva em modelos específicos.',
      'Mercado de seminovos pode oscilar.',
      'Manutenção fora da garantia em ciclos curtos.',
    ],
    commonMistakes: [
      'Trocar antes do break-even do ciclo (perde equity).',
      'Não pesquisar a curva de depreciação do modelo.',
      'Esquecer IPVA, seguro e manutenção no cálculo de TCO.',
    ],
    whenNotToUse: [
      'Cliente que pretende manter o mesmo veículo por 8+ anos.',
      'Veículos com curva de depreciação muito acentuada.',
    ],
    calculations: [
      { label: 'Custo nominal do consórcio (do Simulador)', formula: 'totalCost do Simulador', result: (_c, ctx) => !ctx?.sim ? NA : brl(ctx.sim.totalCost) },
      { label: 'Parcela cheia (do Simulador)', formula: 'fullInstallment do Simulador', result: (_c, ctx) => !ctx?.sim ? NA : `${brl(ctx.sim.fullInstallment)}/mês` },
      { label: 'Financiamento comparável (CDC veículo)', formula: 'juros de mercado a.a. + amortização', result: () => 'Total exato depende de taxa CDC vigente — ver Comparador' },
    ],
    scenarios: [
      { context: 'Profissional com ciclo de troca regular', detail: 'Sempre carro novo, custo recorrente abaixo do financiamento ao longo do tempo.' },
      { context: 'Veículo profissional', detail: 'Cota comercial; parcela tratada como custo dedutível na PJ.' },
    ],
    comparisons: [
      { label: 'Custo nominal', consortium: '~20% sobre o crédito (adm + FR auto)', alternative: 'CDC veículo: juros a.a. de mercado', delta: 'Ver Comparador para total real' },
      { label: 'Cobertura de garantia', consortium: 'Veículo sempre na garantia', alternative: 'À vista: depende do prazo de uso', delta: 'Operacional' },
    ],
  },

  {
    id: 'renovacao-frota',
    chapter: 'Uso',
    title: 'Renovar a Frota da Empresa em Ciclos',
    tagline: 'Frota renovada em ciclos escalonados: capex previsível e dedução fiscal preservada.',
    icon: Truck,
    accent: 'warning',
    howItWorks:
      'A empresa estrutura múltiplas cotas com contemplação escalonada. A cada ciclo, um veículo é renovado, mantendo a idade média da frota controlada e a manutenção previsível.',
    patrimonialLogic:
      'Capex anual transformado em compromisso previsível, com custo total tipicamente abaixo do financiamento. A receita operacional dos veículos contribui para as parcelas.',
    liquidityImpact:
      'Capital de giro preservado. Capex distribuído ao longo do tempo, com fluxo planejável.',
    timing:
      'Empresa com 5+ veículos em operação e ciclo de renovação previsível.',
    advantages: [
      'Custo total tipicamente abaixo do financiamento bancário.',
      'Capex previsível e diluído.',
      'Dedução fiscal preservada conforme regime tributário.',
    ],
    risks: [
      'Quebra na receita operacional trava a renovação.',
      'Concentração em fornecedor único (mesma marca/modelo).',
      'Mudança fiscal ou tributária impacta a dedução esperada.',
    ],
    commonMistakes: [
      'Não escalonar contemplação (todas as cotas no mesmo mês).',
      'Subestimar a capacidade de absorção operacional.',
      'Comprar modelos sem rede de assistência adequada.',
    ],
    whenNotToUse: [
      'Empresa em estresse de caixa.',
      'Operação sazonal sem previsibilidade mínima de receita.',
    ],
    calculations: [
      { label: 'Custo do plano sem seguro por veículo', formula: 'costPlan do Simulador', result: (_c, ctx) => !ctx?.sim ? NA : brl(ctx.sim.costPlan) },
      { label: 'Parcela cheia por veículo (com seguro)', formula: 'fullInstallment do Simulador', result: (_c, ctx) => !ctx?.sim ? NA : `${brl(ctx.sim.fullInstallment)}/mês` },
      { label: 'Financiamento comparável', formula: `juros ${FIN_RATE_LABEL} + amortização`, result: () => 'Total exato calculado no Comparador' },
    ],
    scenarios: [
      { context: 'Transportadora regional', detail: 'Cotas escalonadas; renovação contínua mantém a idade média da frota dentro do alvo operacional.' },
      { context: 'Construtora', detail: 'Renovação programada de equipamentos pesados em ciclos compatíveis com obras de longo prazo.' },
    ],
    comparisons: [
      { label: 'Custo nominal', consortium: 'Estrutura administrativa (adm + FR), sem juros bancários', alternative: `Financiamento: ${FIN_RATE_LABEL}`, delta: 'Ver Comparador para total real' },
      { label: 'Capital de giro', consortium: 'Preservado', alternative: 'À vista: comprometido', delta: 'Vantagem operacional' },
    ],
  },

  {
    id: 'expansao-produtiva',
    chapter: 'Uso',
    title: 'Carta para Máquinas e Expansão Industrial',
    tagline: 'Maquinário ou ampliação industrial via cota — sem dívida bancária no balanço.',
    icon: Factory,
    accent: 'warning',
    howItWorks:
      'A empresa entra em consórcio para máquinas, linha de produção ou ampliação industrial. A contemplação ocorre por lance moderado, o ativo é instalado, e a receita incremental gerada pela nova capacidade contribui para amortizar o saldo.',
    patrimonialLogic:
      'A operação só faz sentido quando a receita incremental projetada cobre a parcela com folga e tem demanda contratada ou comprovada. Não se trata de retorno garantido — depende fortemente da execução comercial.',
    liquidityImpact:
      'Capital de giro preservado. Após a instalação, o fluxo livre cresce em paralelo à amortização — quando a receita prevista se materializa.',
    timing:
      'Demanda comprovada e gargalo de produção identificado. Margens operacionais estáveis.',
    advantages: [
      'Sem dívida bancária no balanço (preserva indicadores financeiros).',
      'Custo financeiro tipicamente abaixo das linhas tradicionais de financiamento de bens de capital.',
      'O próprio bem entra como garantia da cota.',
    ],
    risks: [
      'Demanda projetada pode não se materializar no prazo esperado.',
      'Curva de aprendizado da nova linha reduz ROI inicial.',
      'Câmbio (no caso de equipamento importado).',
    ],
    commonMistakes: [
      'Expandir sem demanda contratada ou comprovada.',
      'Ignorar custo de treinamento e integração.',
      'Adquirir capacidade muito acima do crescimento real esperado.',
    ],
    whenNotToUse: [
      'Setor em retração estrutural.',
      'Empresa em processo de renegociação de dívidas.',
    ],
    calculations: [
      { label: 'Custo do plano sem seguro', formula: 'costPlan do Simulador', result: (_c, ctx) => !ctx?.sim ? NA : brl(ctx.sim.costPlan) },
      { label: 'Linha bancária comparável (FINAME / capital)', formula: 'taxa BNDES + spread bancário', result: () => 'Consultar Comparador / banco para taxa vigente' },
    ],
    scenarios: [
      { context: 'Indústria com demanda confirmada', detail: 'Nova máquina amplia a capacidade já contratada; payback estimado conforme execução comercial.' },
      { context: 'Pequena empresa em expansão', detail: 'Equipamento adicional viabiliza turno extra; receita incremental contribui para a parcela.' },
    ],
    comparisons: [
      { label: 'Custo financeiro', consortium: 'Estrutura administrativa (adm + FR), sem juros bancários', alternative: 'FINAME: ~40–50%', delta: 'Estrutura mais econômica' },
      { label: 'Garantias exigidas', consortium: 'A própria cota / bem', alternative: 'Banco: aval + bens', delta: 'Operacional' },
    ],
  },

  {
    id: 'equipamentos-pesados',
    chapter: 'Uso',
    title: 'Carta para Equipamentos Pesados',
    tagline: 'Maquinário pesado de alto valor com prazos longos alinhados ao fluxo operacional da cota.',
    icon: Mountain,
    accent: 'warning',
    howItWorks:
      'Modalidade específica para equipamentos de alto valor. Prazos longos, taxas administrativas competitivas e contemplação por sorteio ou lance. Útil para construção, mineração e transporte pesado.',
    patrimonialLogic:
      'O equipamento começa a gerar receita operacional desde a contemplação. A parcela deve ser dimensionada para ser coberta pela receita prevista, com margem para meses de baixa utilização.',
    liquidityImpact:
      'Fluxo operacional positivo na maioria dos meses quando há contrato/demanda. Reserva técnica necessária para manutenção pesada.',
    timing:
      'Contrato ou demanda comprovada que justifique o equipamento ao longo do plano.',
    advantages: [
      'Prazo longo dilui a parcela.',
      'Sem entrada exigida (vs. linhas tradicionais).',
      'Equipamento como garantia principal.',
    ],
    risks: [
      'Ociosidade do equipamento (sem obra/contrato).',
      'Manutenção pesada e imprevista.',
      'Obsolescência tecnológica antes do fim do plano.',
    ],
    commonMistakes: [
      'Adquirir sem contrato de uso confirmado.',
      'Não dimensionar reserva técnica de manutenção.',
      'Subestimar tempo de paralisação por manutenção.',
    ],
    whenNotToUse: [
      'Demanda esporádica (preferir locação).',
      'Empresa sem estrutura de manutenção própria ou terceirizada confiável.',
    ],
    calculations: [
      { label: 'Custo do plano sem seguro', formula: 'costPlan do Simulador', result: (_c, ctx) => !ctx?.sim ? NA : brl(ctx.sim.costPlan) },
      { label: 'Parcela cheia (com seguro)', formula: 'fullInstallment do Simulador', result: (_c, ctx) => !ctx?.sim ? NA : `${brl(ctx.sim.fullInstallment)}/mês` },
      { label: 'Receita operacional necessária para break-even', formula: 'parcela + OPEX médio', result: () => 'Calcular com hora-máquina contratada' },
    ],
    scenarios: [
      { context: 'Empreiteira', detail: 'Equipamento adquirido com contrato municipal já firmado; receita cobre integralmente a parcela.' },
      { context: 'Operação extrativa', detail: 'Pá-carregadeira com utilização contínua; payback dimensionado pelo contrato.' },
    ],
    comparisons: [
      { label: 'Custo financeiro', consortium: 'Estrutura administrativa (adm + FR), sem juros bancários', alternative: 'FINAME: ~40–45%', delta: 'Estrutura mais econômica' },
      { label: 'Prazo', consortium: 'Até 200 meses', alternative: 'FINAME: até 120m', delta: 'Maior diluição' },
    ],
  },

  {
    id: 'agronegocio',
    chapter: 'Uso',
    title: 'Carta para Trator, Colheitadeira e Implementos',
    tagline: 'Maquinário agrícola via consórcio com parcelas alinhadas ao calendário de safra.',
    icon: Tractor,
    accent: 'warning',
    howItWorks:
      'Consórcios específicos para o agronegócio permitem alinhar a contemplação ao calendário de safra. Pagamento via receita pós-colheita, com modulação de parcelas em meses de entressafra (conforme regras do grupo).',
    patrimonialLogic:
      'A receita anual de safra (um ou dois ciclos) tende a amortizar parcela significativa do plano anual. Reinvestimento ordenado leva à composição gradual do parque de máquinas.',
    liquidityImpact:
      'Caixa concentrado em janelas de safra. A estratégia respeita esse ciclo.',
    timing:
      'Produtor com ciclos de safra estabilizados e área produtiva confirmada.',
    advantages: [
      'Alinhamento com o fluxo agrícola.',
      'Sem dívida bancária no balanço (relevante para CPR e barter).',
      'Possibilidade de uso integrado com operações de barter.',
    ],
    risks: [
      'Quebra de safra (clima, praga, doença).',
      'Volatilidade de preços de commodities.',
      'Câmbio (no caso de equipamento importado).',
    ],
    commonMistakes: [
      'Não casar contemplação com a janela de plantio.',
      'Subestimar manutenção em equipamentos agrícolas.',
      'Ignorar seguro agrícola no custo total da operação.',
    ],
    whenNotToUse: [
      'Produtor recém-instalado sem histórico mínimo de safra.',
      'Área arrendada sem renovação contratual garantida.',
    ],
    calculations: [
      { label: 'Custo do plano sem seguro', formula: 'costPlan do Simulador', result: (_c, ctx) => !ctx?.sim ? NA : brl(ctx.sim.costPlan) },
      { label: 'Linha rural comparável (Pronaf / Pronamp / CPR)', formula: 'taxa subsidiada + correção', result: () => 'Consultar Comparador / banco para taxa vigente' },
    ],
    scenarios: [
      { context: 'Produtor de grãos', detail: 'Trator e plantadeira via cotas; concentração de pagamento na janela de colheita.' },
      { context: 'Pecuária leiteira', detail: 'Equipamento de ordenha via consórcio; receita mensal cobre a parcela.' },
    ],
    comparisons: [
      { label: 'Custo financeiro', consortium: 'Estrutura administrativa (adm + FR), sem juros bancários', alternative: 'Crédito rural: ~30–40%', delta: 'Competitivo' },
      { label: 'Flexibilidade de fluxo', consortium: 'Compatível com safra', alternative: 'Financiamento: parcela fixa', delta: 'Operacional' },
    ],
  },

  {
    id: 'patrimonio-rural',
    chapter: 'Uso',
    title: 'Carta para Comprar ou Expandir Terras',
    tagline: 'Aquisição de terras rurais via consórcio imobiliário — prazos longos compatíveis com a renda agrícola.',
    icon: Wheat,
    accent: 'primary',
    howItWorks:
      'A carta imobiliária é aplicada à aquisição de terras agrícolas, sítios produtivos ou expansão de propriedade existente. Prazos longos permitem que a renda da terra contribua para a parcela.',
    patrimonialLogic:
      'Terra é ativo de cap rate moderado, mas com tendência de valorização real ao longo de ciclos longos. O consórcio permite acumular hectares sem comprometer o capital de safra.',
    liquidityImpact:
      'Parcela amortizada pela renda da terra (arrendamento ou produção própria). Capital de giro produtivo preservado.',
    timing:
      'Janelas de aquisição em regiões com expansão de infraestrutura, beneficiamento ou demanda crescente.',
    advantages: [
      'Valorização real da terra em ciclos favoráveis.',
      'Possibilidade de produção própria ou arrendamento.',
      'Sem dívida adicional em linhas de crédito rural.',
    ],
    risks: [
      'Conflito fundiário e questões de regularização.',
      'Mudanças regulatórias (Código Florestal, CAR).',
      'Liquidez baixa em caso de necessidade de venda rápida.',
    ],
    commonMistakes: [
      'Adquirir sem due diligence ambiental e fundiária.',
      'Ignorar custos de regularização (CAR, georreferenciamento).',
      'Não estudar o cap rate de arrendamento da região.',
    ],
    whenNotToUse: [
      'Áreas com passivo ambiental relevante.',
      'Cliente sem horizonte de longo prazo.',
    ],
    calculations: [
      { label: 'Custo do plano sem seguro', formula: 'costPlan do Simulador', result: (_c, ctx) => !ctx?.sim ? NA : brl(ctx.sim.costPlan) },
      { label: 'Arrendamento estimado (ilustrativo)', formula: '~5 a 7% do valor/ano', result: (c) => `${brl(c * 0.06)}/ano` },
    ],
    scenarios: [
      { context: 'Ampliação de propriedade', detail: 'Aquisição de área lindeira via consórcio; arrendada durante a fase inicial.' },
      { context: 'Investidor patrimonial', detail: 'Terra como reserva de valor de longo prazo; arrendamento contribui para a parcela.' },
    ],
    comparisons: [
      { label: 'Custo financeiro', consortium: 'Estrutura administrativa (adm + FR), sem juros bancários', alternative: 'Crédito rural: ~30–50%', delta: 'Estrutura mais econômica' },
      { label: 'Valorização do ativo', consortium: 'Real, ao longo de ciclos', alternative: 'Renda fixa: real próximo à inflação', delta: 'Perfil de ativo distinto' },
    ],
  },

  // ───────────────── CAPÍTULO 5: RENDA & SUCESSÃO ─────────────────
  {
    id: 'renda-passiva',
    chapter: 'Renda & Sucessão',
    priority: 4,
    title: 'Renda Mensal com Cartas Quitadas',
    tagline: 'Portfólio de cotas quitadas em janelas escalonadas gera renda recorrente para a fase pós-laboral.',
    icon: PiggyBank,
    accent: 'success',
    howItWorks:
      'O cliente estrutura múltiplas cotas imobiliárias em janelas de quitação escalonadas (uma a cada 18–24 meses, por exemplo). Cada cota quitada gera fluxo de aluguel líquido. Em horizonte de 10–15 anos, o agregado tende a complementar de forma relevante a renda ativa.',
    patrimonialLogic:
      'Renda passiva escalonada: o cronograma é desenhado para produzir fluxo crescente em janelas específicas, conforme objetivos do cliente.',
    liquidityImpact:
      'Durante a fase de acumulação, fluxo tende a neutro (aluguel ≈ parcela). Pós-quitação, o aluguel passa a representar renda líquida recorrente.',
    timing:
      'Idealmente iniciada entre 30–50 anos para colher fluxo consolidado a partir dos 55–60.',
    advantages: [
      'Renda passiva programada para a fase pós-laboral.',
      'Aluguel acompanha índices de inflação ao longo do tempo.',
      'Patrimônio transferível por sucessão (imóveis ou cotas societárias).',
    ],
    risks: [
      'Vacância coletiva em recessão.',
      'Mudanças regulatórias na Lei do Inquilinato.',
      'Concentração geográfica em um único mercado.',
    ],
    commonMistakes: [
      'Concentrar todas as cotas em um único bairro.',
      'Não diversificar tipologia (residencial, comercial, sala).',
      'Subestimar custos recorrentes (IPTU, condomínio, manutenção).',
    ],
    whenNotToUse: [
      'Horizonte inferior a 8 anos.',
      'Cliente sem disciplina para escalonar cotas ao longo do tempo.',
    ],
    calculations: [
      { label: 'Renda passiva por cota quitada (ilustrativo)', formula: 'yield mensal × valor do imóvel', result: (c, ctx) => `${brl(c * yieldOf(ctx))}/mês` },
      { label: 'Renda agregada com 6 cotas (referência)', formula: '6 × renda', result: (c, ctx) => `${brl(c * yieldOf(ctx) * 6)}/mês` },
      { label: 'Renda agregada com 10 cotas (referência)', formula: '10 × renda', result: (c, ctx) => `${brl(c * yieldOf(ctx) * 10)}/mês` },
    ],
    scenarios: [
      { context: 'Profissional em fase de acumulação', detail: 'Plano estruturado de cotas escalonadas ao longo de 15 anos para gerar fluxo recorrente.' },
      { context: 'Complemento de renda pós-laboral', detail: 'Cotas em janelas pré-definidas para complementar previdência.' },
    ],
    comparisons: [
      { label: 'Renda passiva ajustada por inflação', consortium: 'Aluguel reajustável', alternative: 'CDB nominal: depende da taxa real', delta: 'Perfil de ativo distinto' },
      { label: 'Patrimônio transferível', consortium: 'Imóveis ou cotas societárias', alternative: 'Renda fixa: ativo líquido', delta: 'Trade-off liquidez × patrimônio' },
    ],
  },

  {
    id: 'patrimonio-gerador-caixa',
    chapter: 'Renda & Sucessão',
    title: 'Portfólio de Imóveis Selecionados pelo Aluguel',
    tagline: 'Cada ativo é escolhido pelo cap rate locatício — portfólio que caminha para a autossuficiência financeira.',
    icon: Coins,
    accent: 'success',
    howItWorks:
      'Filosofia de seleção: nenhum ativo entra no portfólio sem cap rate líquido mínimo estabelecido. Cotas são direcionadas exclusivamente a ativos validados por estudo de demanda locatícia.',
    patrimonialLogic:
      'O portfólio é desenhado para que a receita líquida agregada cubra despesas e parcelas. O critério de seleção substitui a busca por valorização especulativa.',
    liquidityImpact:
      'Fluxo positivo desde o início, quando o cap rate é efetivamente validado. Reinvestimento opcional.',
    timing:
      'Após o cliente ter portfólio inicial de 2–3 ativos comprovadamente rentáveis.',
    advantages: [
      'Autossuficiência financeira como objetivo central.',
      'Crescimento orgânico via reinvestimento da renda gerada.',
      'Redução do risco de carregar ativo improdutivo.',
    ],
    risks: [
      'Disciplina rigorosa na seleção (rejeitar ativos abaixo do critério).',
      'Pode preterir ativos com baixo cap rate e alta valorização potencial.',
    ],
    commonMistakes: [
      'Aceitar ativo abaixo do cap rate-alvo por pressa.',
      'Ignorar custos não-monetários (gestão, tempo).',
      'Confundir cap rate bruto com líquido.',
    ],
    whenNotToUse: [
      'Quando o objetivo é capturar valorização pura (foco diferente).',
      'Cliente que valoriza prioritariamente o uso próprio do ativo.',
    ],
    calculations: [
      { label: 'Cap rate mínimo de referência', formula: '~0,55% a.m. (líquido)', result: (_c, ctx) => `~${pct(yieldOf(ctx) * 12)} a.a.` },
      { label: 'Renda mensal projetada (portfólio = crédito)', formula: 'yield mensal × patrimônio', result: (c, ctx) => `${brl(c * yieldOf(ctx))}/mês` },
    ],
    scenarios: [
      { context: 'Investidor metódico', detail: 'Critério rígido de seleção; portfólio cresce de forma orgânica via reinvestimento.' },
      { context: 'Transição de carreira planejada', detail: 'Renda do portfólio substitui salário ao longo de janela pré-estabelecida.' },
    ],
    comparisons: [
      { label: 'Foco do retorno', consortium: 'Cash flow operacional', alternative: 'Apenas valorização: equity ilíquido', delta: 'Trade-off fluxo × valorização' },
      { label: 'Reinvestimento', consortium: 'Via fluxo gerado', alternative: 'Aporte ativo: depende de poupança', delta: 'Autossustentável' },
    ],
  },

  {
    id: 'holding-patrimonial',
    chapter: 'Renda & Sucessão',
    title: 'Montar Holding Patrimonial',
    tagline: 'Holding consolida o portfólio em cotas societárias: eficiência tributária, governança e sucessão simplificada.',
    icon: Crown,
    accent: 'primary',
    howItWorks:
      'O cliente constitui holding patrimonial (LTDA ou SA fechada). Os ativos vão para a holding via integralização. As cotas societárias substituem os imóveis no patrimônio pessoal. A sucessão pode ser planejada via doação de cotas com reserva de usufruto.',
    patrimonialLogic:
      'Tributação de renda passiva otimizada (lucro presumido vs. PF). Transmissão entre gerações por cotas societárias — em diversos estados, ITCMD reduzido e processo mais simples que o inventário tradicional.',
    liquidityImpact:
      'A renda fica retida na holding; a distribuição é planejada. A estrutura permite reinvestimento sem trânsito intermediário pela pessoa física.',
    timing:
      'Patrimônio com massa crítica (referencial: a partir de R$ 2M) e/ou família com sucessão a planejar.',
    advantages: [
      'Eficiência tributária sobre renda passiva.',
      'Blindagem patrimonial (separação PF/PJ).',
      'Sucessão por cotas — processo mais simples que inventário tradicional.',
    ],
    risks: [
      'Custo recorrente de manutenção (contabilidade, taxas).',
      'Reforma tributária pode alterar a vantagem relativa.',
      'Erro de estrutura inicial torna a reorganização cara.',
    ],
    commonMistakes: [
      'Estruturar holding antes de atingir massa crítica.',
      'Não utilizar reserva de usufruto na doação de cotas.',
      'Misturar despesas pessoais com a PJ.',
    ],
    whenNotToUse: [
      'Patrimônio inicial sem escala para absorver o custo da estrutura.',
      'Família sem alinhamento mínimo de governança.',
    ],
    calculations: [
      { label: 'IR sobre aluguel — PF', formula: 'até 27,5%', result: (c, ctx) => `${brl(c * yieldOf(ctx) * 12 * 0.275)}/ano (referência)` },
      { label: 'IR sobre aluguel — PJ lucro presumido', formula: '~11,33%', result: (c, ctx) => `${brl(c * yieldOf(ctx) * 12 * 0.1133)}/ano` },
      { label: 'Diferença anual ilustrativa', formula: 'PF − PJ', result: (c, ctx) => `${brl(c * yieldOf(ctx) * 12 * (0.275 - 0.1133))}/ano` },
    ],
    scenarios: [
      { context: 'Família empresária 2ª geração', detail: 'Holding consolida imóveis; doação de cotas aos herdeiros com reserva de usufruto.' },
      { context: 'Investidor consolidando portfólio', detail: 'Migração de ativos para holding; economia tributária recorrente reaplicada.' },
    ],
    comparisons: [
      { label: 'Tributação sobre renda passiva', consortium: '~11% (PJ presumido)', alternative: 'PF: até 27,5%', delta: 'Estrutura mais eficiente' },
      { label: 'Sucessão', consortium: 'Transferência de cotas', alternative: 'Inventário: 6–24 meses', delta: 'Processo mais simples' },
    ],
  },

  {
    id: 'planejamento-sucessorio',
    chapter: 'Renda & Sucessão',
    title: 'Doar Cotas com Usufruto Vitalício',
    tagline: 'Doação programada de cotas com usufruto vitalício: sucessão organizada, sem inventário tradicional.',
    icon: ScrollText,
    accent: 'muted',
    howItWorks:
      'O patrimônio estruturado (preferencialmente em holding) é transmitido em vida via doação de cotas com reserva de usufruto. O patriarca/matriarca mantém renda e controle; herdeiros recebem a nua-propriedade.',
    patrimonialLogic:
      'Evita o inventário (custo, tempo, conflito). A operação envolve ITCMD na doação, normalmente em alíquotas estaduais menores que o conjunto de custos típicos de inventário (ITCMD + custas + honorários).',
    liquidityImpact:
      'Sem impacto operacional. A renda passiva continua fluindo para o usufrutuário enquanto vivo.',
    timing:
      'A partir de 55–60 anos, ou quando o portfólio atinge maturidade.',
    advantages: [
      'Sucessão organizada, sem litígio.',
      'Custo total tende a ser menor que o inventário tradicional.',
      'Governança familiar formalizada via acordo de cotistas.',
    ],
    risks: [
      'Doação é irreversível — erros têm custo elevado.',
      'Disputas se o acordo de cotistas for mal redigido.',
      'Mudanças na alíquota do ITCMD estadual.',
    ],
    commonMistakes: [
      'Doar sem reserva de usufruto (perde controle e renda).',
      'Não estabelecer acordo de cotistas.',
      'Ignorar a legítima dos herdeiros necessários.',
    ],
    whenNotToUse: [
      'Patrimônio sem escala que justifique a complexidade.',
      'Família sem alinhamento mínimo.',
    ],
    calculations: [
      { label: 'ITCMD doação (referência média BR)', formula: '~4% sobre o valor doado', result: (c) => brl(c * 0.04) },
      { label: 'Custos típicos de inventário', formula: '~10–14% (ITCMD + custas + honorários)', result: (c) => brl(c * 0.12) },
      { label: 'Diferença ilustrativa', formula: 'inventário − doação programada', result: (c) => brl(c * 0.08) },
    ],
    scenarios: [
      { context: 'Patriarca 65 anos', detail: 'Doa cotas da holding com usufruto; mantém renda e controle, herdeiros recebem nua-propriedade.' },
      { context: 'Sucessão empresarial', detail: 'Acordo de cotistas define governança pós-falecimento; transição organizada.' },
    ],
    comparisons: [
      { label: 'Custo total de transmissão', consortium: '~4% (doação)', alternative: 'Inventário: ~12%', delta: 'Estrutura mais econômica' },
      { label: 'Tempo de transição', consortium: 'Planejado em vida', alternative: 'Inventário: 1–3 anos pós-óbito', delta: 'Operacional' },
    ],
  },
];

/**
 * Lista única ordenada — o campo `priority` (1..N) controla EXCLUSIVAMENTE a
 * ordem editorial no topo do grid. NÃO existe "flagship principal absoluta":
 * todas as estratégias priorizadas renderizam com o mesmo card, mesmo CTA,
 * mesmo KPI surface e mesma hierarquia visual. As demais aparecem em seguida
 * preservando a ordem do catálogo.
 */
export const STRATEGY_LIBRARY_ORDERED: LibraryStrategy[] = (() => {
  const prioritized = STRATEGY_LIBRARY
    .filter((s) => typeof s.priority === 'number')
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  const prioritizedIds = new Set(prioritized.map((s) => s.id));
  const rest = STRATEGY_LIBRARY.filter((s) => !prioritizedIds.has(s.id));
  return [...prioritized, ...rest];
})();
