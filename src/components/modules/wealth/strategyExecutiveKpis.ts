/**
 * ════════════════════════════════════════════════════════════════════════════
 * STRATEGY EXECUTIVE KPIs — Canonical Relevance Mapping
 * ════════════════════════════════════════════════════════════════════════════
 *
 * PROBLEMA RESOLVIDO
 *   A heurística antiga ("últimas 3 calculations") devolvia KPIs genéricos
 *   iguais para muitas estratégias e enterrava a tese patrimonial de cada uma.
 *
 * PRINCÍPIO
 *   Cada estratégia declara explicitamente quais KPIs canônicos da plataforma
 *   reforçam sua tese — no máximo 3 (1 hero + ≤2 secundários). Cada pick é só
 *   um ponteiro para uma entrada já existente em `strategy.calculations[]` —
 *   ZERO cálculo novo, ZERO duplicação de math. O motor financeiro permanece
 *   intocado (regra Core).
 *
 * TAXONOMIA CANÔNICA (alinhada a strategy-v2/adapters.ts · KPI_LABELS)
 *   roi              — Retorno sobre o capital aportado
 *   payback          — Tempo até recuperar o aporte
 *   multiplier       — Patrimônio controlado ÷ capital próprio
 *   preserved        — Capital líquido remanescente
 *   monthlyFlow      — Fluxo / renda mensal (ou anual quando explicitado)
 *   monthlySaving    — Economia ou folga mensal recorrente
 *   annualSaving     — Economia anual (tributária, sucessória)
 *   finalPatrimony   — Patrimônio final estimado
 *   profit           — Lucro líquido da operação
 *   installment      — Parcela mensal
 *   totalCost        — Custo total do plano
 *   coverage         — Cobertura (%) — fluxo ÷ obrigação
 *   exposure         — Exposição patrimonial agregada
 * ════════════════════════════════════════════════════════════════════════════
 */

export type ExecutiveKpiKind =
  | 'roi'
  | 'payback'
  | 'multiplier'
  | 'preserved'
  | 'monthlyFlow'
  | 'monthlySaving'
  | 'annualSaving'
  | 'finalPatrimony'
  | 'profit'
  | 'installment'
  | 'totalCost'
  | 'coverage'
  | 'exposure';

/**
 * Origem do KPI — governança de transparência financeira.
 *   • 'engine'    → calculado pela engine financeira canônica (`@/core/finance`)
 *                   ou derivação determinística direta da simulação.
 *   • 'editorial' → estimativa contextual de mercado/tributária/operacional,
 *                   coerente mas não apurada pelo motor (cap rate, aluguel
 *                   estimado, economia fiscal, benchmark, etc.).
 *
 * UX: a UI deve diferenciar discretamente os dois (tooltip + ícone sutil),
 * sem badge agressiva nem aparência de dashboard técnico.
 */
export type ExecutiveKpiSource = 'engine' | 'editorial';

/**
 * Default por tipo de KPI — base institucional. Picks podem sobrescrever
 * caso a estratégia use o mesmo `kind` com semântica distinta (ex.:
 * `monthlyFlow` como "renda investida em CDI" é engine; como "aluguel
 * estimado de mercado" é editorial).
 */
export const EXECUTIVE_KPI_DEFAULT_SOURCE: Record<ExecutiveKpiKind, ExecutiveKpiSource> = {
  roi:            'engine',
  payback:        'engine',
  multiplier:     'engine',
  preserved:      'engine',
  finalPatrimony: 'engine',
  profit:         'engine',
  installment:    'engine',
  totalCost:      'engine',
  monthlyFlow:    'editorial',
  monthlySaving:  'editorial',
  annualSaving:   'editorial',
  coverage:       'editorial',
  exposure:       'editorial',
};

/** Hint textual exibido em tooltip ao lado do KPI. */
export const EXECUTIVE_KPI_SOURCE_HINT: Record<ExecutiveKpiSource, string> = {
  engine:    'Calculado pela simulação',
  editorial: 'Estimativa de mercado',
};

export interface ExecutiveKpiPick {
  /** Tipo canônico — usado para badge/tooltip e telemetria futura. */
  kind: ExecutiveKpiKind;
  /** Rótulo canônico exibido no card (curto, executivo). */
  label: string;
  /** Índice em `strategy.calculations[]` cujo `result(credit)` será o valor. */
  calculationIndex: number;
  /** Hero KPI da estratégia — protagonismo visual. Apenas 1 por estratégia. */
  hero?: boolean;
  /**
   * Override de origem (engine/editorial). Quando omitido, usa
   * `EXECUTIVE_KPI_DEFAULT_SOURCE[kind]`. Útil para discriminar fluxos
   * mensais que vêm de simulação (engine) vs benchmark de mercado (editorial).
   */
  source?: ExecutiveKpiSource;
}

/**
 * Mapa estratégia → KPIs canônicos.
 * Toda nova estratégia em `strategyLibraryData.ts` deve ganhar entrada aqui.
 * Estratégia sem entrada cai no fallback antigo (últimas 3 calculations).
 */
export const STRATEGY_EXECUTIVE_KPIS: Record<string, ExecutiveKpiPick[]> = {
  // ─────────── Aquisição ───────────
  'compra-hibrida': [
    { kind: 'preserved',   label: 'Capital preservado',  calculationIndex: 2, hero: true },
    { kind: 'monthlyFlow', label: 'Rendimento mensal',   calculationIndex: 3, source: 'engine' },
  ],
  'compra-planejada': [
    { kind: 'installment', label: 'Parcela mensal',     calculationIndex: 0, hero: true },
    { kind: 'totalCost',   label: 'Custo total do plano', calculationIndex: 1 },
  ],
  'aquisicao-acelerada': [
    { kind: 'installment', label: 'Parcela pós-lance',  calculationIndex: 2, hero: true },
    { kind: 'preserved',   label: 'Capital de lance',   calculationIndex: 0 },
  ],

  // ─────────── Multiplicação / Alavancagem ───────────
  'leverage-patrimonial': [
    { kind: 'multiplier',  label: 'Exposição patrimonial', calculationIndex: 1, hero: true },
    { kind: 'installment', label: 'Parcela agregada',      calculationIndex: 2 },
  ],
  'usar-carta-investir': [
    { kind: 'profit',         label: 'Lucro líquido estimado', calculationIndex: 3, hero: true },
    { kind: 'roi',            label: 'ROI sobre custo total',  calculationIndex: 4 },
    { kind: 'finalPatrimony', label: 'Saldo aplicado final',   calculationIndex: 2 },
  ],
  'alavancagem-imobiliaria': [
    { kind: 'monthlyFlow', label: 'Renda de aluguel',     calculationIndex: 0, hero: true },
    { kind: 'coverage',    label: 'Cobertura da parcela', calculationIndex: 2 },
    { kind: 'installment', label: 'Parcela mensal',       calculationIndex: 1 },
  ],
  'multiplicacao-cotas': [
    { kind: 'multiplier',  label: 'Multiplicador patrimonial', calculationIndex: 2, hero: true },
    { kind: 'monthlyFlow', label: 'Renda mensal por cota',     calculationIndex: 0 },
    { kind: 'preserved',   label: 'Capital reinvestível',      calculationIndex: 1 },
  ],

  // ─────────── Venda da carta / ROI puro ───────────
  'venda-carta-lucro': [
    { kind: 'roi',     label: 'ROI da operação',  calculationIndex: 3, hero: true },
    { kind: 'profit',  label: 'Lucro líquido',    calculationIndex: 2 },
    { kind: 'payback', label: 'Janela de payback', calculationIndex: 4 },
  ],

  // ─────────── Renda recorrente ───────────
  'reinvestimento-estruturado': [
    { kind: 'monthlyFlow', label: 'Renda anual gerada',  calculationIndex: 0, hero: true, source: 'engine' },
    { kind: 'preserved',   label: 'Capital acumulado',   calculationIndex: 1 },
  ],
  'autoquitacao-estruturada': [
    { kind: 'monthlyFlow',   label: 'Renda mensal do ativo', calculationIndex: 0, hero: true },
    { kind: 'installment',   label: 'Parcela ordinária',     calculationIndex: 1 },
    { kind: 'monthlySaving', label: 'Folga mensal',          calculationIndex: 2 },
  ],

  // ─────────── Eficiência tributária / sucessória ───────────
  'patrimonio-escalavel': [
    { kind: 'annualSaving', label: 'Economia anual de IR', calculationIndex: 2, hero: true },
    { kind: 'totalCost',    label: 'IR como PF',           calculationIndex: 0 },
  ],
  'holding-patrimonial': [
    { kind: 'annualSaving', label: 'Economia anual de IR', calculationIndex: 2, hero: true },
    { kind: 'totalCost',    label: 'IR como PF',           calculationIndex: 0 },
  ],
  'planejamento-sucessorio': [
    { kind: 'annualSaving', label: 'Economia sucessória', calculationIndex: 2, hero: true },
    { kind: 'totalCost',    label: 'Custo de inventário', calculationIndex: 1 },
  ],

  // ─────────── Obra / Reforma / Solar ───────────
  'reforma-ampliacao': [
    { kind: 'totalCost', label: 'Custo total do plano', calculationIndex: 1, hero: true },
    { kind: 'preserved', label: 'Valor da obra',        calculationIndex: 0 },
  ],
  'retrofit-patrimonial': [
    { kind: 'finalPatrimony', label: 'Valor final do ativo', calculationIndex: 2, hero: true },
    { kind: 'totalCost',      label: 'Custo da compra',      calculationIndex: 0 },
    { kind: 'preserved',      label: 'Custo do retrofit',    calculationIndex: 1 },
  ],
  'energia-solar': [
    { kind: 'installment',    label: 'Parcela mensal',     calculationIndex: 1, hero: true },
    { kind: 'monthlySaving',  label: 'Economia mensal',    calculationIndex: 2 },
    { kind: 'totalCost',      label: 'Custo total',        calculationIndex: 0 },
  ],

  // ─────────── Veículos / Frota / Pesados / Agro ───────────
  'upgrade-veiculo': [
    { kind: 'installment', label: 'Parcela mensal',  calculationIndex: 1, hero: true },
    { kind: 'totalCost',   label: 'Custo nominal',   calculationIndex: 0 },
  ],
  'renovacao-frota': [
    { kind: 'installment', label: 'Parcela por veículo', calculationIndex: 1, hero: true },
    { kind: 'totalCost',   label: 'Custo nominal',       calculationIndex: 0 },
  ],
  'expansao-produtiva': [
    { kind: 'totalCost', label: 'Custo total no consórcio', calculationIndex: 0, hero: true },
  ],
  'equipamentos-pesados': [
    { kind: 'installment', label: 'Parcela mensal',  calculationIndex: 1, hero: true },
    { kind: 'totalCost',   label: 'Custo total',     calculationIndex: 0 },
  ],
  'agronegocio': [
    { kind: 'totalCost', label: 'Custo total no consórcio', calculationIndex: 0, hero: true },
  ],
  'patrimonio-rural': [
    { kind: 'monthlyFlow', label: 'Receita anual de arrendamento', calculationIndex: 1, hero: true },
    { kind: 'totalCost',   label: 'Custo total no consórcio',      calculationIndex: 0 },
  ],

  // ─────────── Renda passiva agregada ───────────
  'renda-passiva': [
    { kind: 'monthlyFlow', label: 'Renda mensal por cota',  calculationIndex: 0, hero: true },
    { kind: 'exposure',    label: 'Renda agregada (10 cotas)', calculationIndex: 2 },
  ],
  'patrimonio-gerador-caixa': [
    { kind: 'monthlyFlow', label: 'Renda mensal projetada', calculationIndex: 1, hero: true },
    { kind: 'coverage',    label: 'Cap rate alvo',          calculationIndex: 0 },
  ],
};

/** Hint canônico exibido como tooltip do tipo de KPI. */
export const EXECUTIVE_KPI_HINTS: Record<ExecutiveKpiKind, string> = {
  roi:            'Retorno sobre o capital efetivamente aportado.',
  payback:        'Tempo até recuperar o aporte (saldo zero).',
  multiplier:     'Patrimônio controlado ÷ capital próprio investido.',
  preserved:      'Capital líquido que permanece disponível ao cliente.',
  monthlyFlow:    'Fluxo / renda gerada pela estratégia.',
  monthlySaving:  'Economia ou folga mensal recorrente.',
  annualSaving:   'Economia anual estimada.',
  finalPatrimony: 'Patrimônio total estimado ao fim do período.',
  profit:         'Lucro líquido da operação.',
  installment:    'Parcela mensal estimada.',
  totalCost:      'Custo total do plano consolidado.',
  coverage:       'Cobertura percentual sobre a obrigação.',
  exposure:       'Exposição patrimonial agregada da estratégia.',
};
