/**
 * ════════════════════════════════════════════════════════════════════════════
 * strategyNextSteps — Continuidade consultiva (estratégia → ação)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Mapa declarativo dos próximos passos naturais por estratégia. Sem cálculo,
 * sem novo estado, sem CRM. Apenas materializa o "depois desta tese,
 * a consultoria continua aqui".
 *
 * Princípios (V2 Lock · Production Lock V2.4):
 *   • Voz consultiva, NUNCA marketing ("Levar para…", "Comparar…", "Projetar…").
 *   • Máximo 3 passos por estratégia: 1 primário + ≤2 secundários.
 *   • Reusa `navigateTo()` + `setActiveStrategy()` (zero duplicação de estado).
 *   • Defaults cobrem 100% das estratégias — overrides só onde a tese pede.
 * ════════════════════════════════════════════════════════════════════════════
 */
export type NextStepKind = 'primary' | 'secondary';

export interface StrategyNextStep {
  /** Módulo destino (id válido em ModuleNavigationContext). */
  to: 'simulator' | 'comparator' | 'proposals' | 'bids' | 'investment' | 'diagnostic' | 'patrimonial';
  /** Rótulo consultivo curto (voz executiva, sem CTA agressivo). */
  label: string;
  /** Hierarquia visual — apenas o primário vira Button preenchido. */
  kind: NextStepKind;
}

const DEFAULT_NEXT_STEPS: StrategyNextStep[] = [
  { to: 'simulator',  label: 'Simular esta tese',           kind: 'primary'   },
  { to: 'comparator', label: 'Comparar cenário patrimonial', kind: 'secondary' },
  { to: 'proposals',  label: 'Levar para Proposal',          kind: 'secondary' },
];

/**
 * Overrides por estratégia. Só declare quando a continuidade natural diverge
 * do default — manter a tabela enxuta evita inflação editorial.
 */
const OVERRIDES: Record<string, StrategyNextStep[]> = {
  // ── Aquisição ─────────────────────────────────────────────────────────────
  'compra-planejada':  [
    { to: 'simulator',  label: 'Estruturar lance ideal',        kind: 'primary'   },
    { to: 'bids',       label: 'Projetar contemplação',         kind: 'secondary' },
    { to: 'proposals',  label: 'Levar para Proposal',           kind: 'secondary' },
  ],
  'compra-hibrida': [
    { to: 'simulator',  label: 'Modelar mix carta + capital',   kind: 'primary'   },
    { to: 'comparator', label: 'Comparar cenário patrimonial',  kind: 'secondary' },
  ],

  // ── Multiplicação patrimonial ─────────────────────────────────────────────
  'multiplicacao-cotas': [
    { to: 'simulator',  label: 'Estruturar fluxo multi-cotas',  kind: 'primary'   },
    { to: 'comparator', label: 'Comparar expansão vs financiamento', kind: 'secondary' },
    { to: 'proposals',  label: 'Levar tese para Proposal',      kind: 'secondary' },
  ],
  'alavancagem-imobiliaria': [
    { to: 'simulator',  label: 'Simular crescimento patrimonial', kind: 'primary'   },
    { to: 'comparator', label: 'Comparar contra capital próprio', kind: 'secondary' },
  ],
  'leverage-patrimonial': [
    { to: 'simulator',  label: 'Projetar fluxo patrimonial',    kind: 'primary'   },
    { to: 'comparator', label: 'Comparar cenário patrimonial',  kind: 'secondary' },
  ],
  'patrimonio-escalavel': [
    { to: 'simulator',  label: 'Modelar escada patrimonial',    kind: 'primary'   },
    { to: 'proposals',  label: 'Levar para Proposal',           kind: 'secondary' },
  ],
  'usar-carta-investir': [
    { to: 'simulator',  label: 'Modelar com contemplação cedo',             kind: 'primary'   },
    { to: 'investment', label: 'Comparar com aplicação tradicional',        kind: 'secondary' },
    { to: 'bids',       label: 'Calibrar lance para antecipar contemplação', kind: 'secondary' },
  ],
  'venda-carta-lucro': [
    { to: 'simulator',  label: 'Modelar venda da carta',        kind: 'primary'   },
    { to: 'bids',       label: 'Calibrar lance para contemplar antes', kind: 'secondary' },
  ],

  // ── Liquidez / venda de carta ─────────────────────────────────────────────
  'reinvestimento-estruturado': [
    { to: 'simulator',  label: 'Simular liquidez gerada',        kind: 'primary'   },
    { to: 'comparator', label: 'Comparar valorização da carta',  kind: 'secondary' },
    { to: 'proposals',  label: 'Estruturar operação patrimonial', kind: 'secondary' },
  ],
  'renda-passiva': [
    { to: 'simulator',  label: 'Projetar renda recorrente',     kind: 'primary'   },
    { to: 'proposals',  label: 'Levar tese para Proposal',      kind: 'secondary' },
  ],
  'patrimonio-gerador-caixa': [
    { to: 'simulator',  label: 'Simular fluxo de caixa',        kind: 'primary'   },
    { to: 'comparator', label: 'Comparar contra renda fixa',    kind: 'secondary' },
  ],

  // ── Empresas & uso produtivo ──────────────────────────────────────────────
  'expansao-produtiva': [
    { to: 'simulator',  label: 'Simular expansão operacional',  kind: 'primary'   },
    { to: 'comparator', label: 'Comparar contra financiamento bancário', kind: 'secondary' },
  ],
  'renovacao-frota': [
    { to: 'simulator',  label: 'Estruturar plano de frota',     kind: 'primary'   },
    { to: 'proposals',  label: 'Levar para Proposal',           kind: 'secondary' },
  ],
  'equipamentos-pesados': [
    { to: 'simulator',  label: 'Modelar aquisição estruturada', kind: 'primary'   },
    { to: 'comparator', label: 'Comparar contra leasing',       kind: 'secondary' },
  ],
  'agronegocio': [
    { to: 'simulator',  label: 'Estruturar ciclo agro',         kind: 'primary'   },
    { to: 'comparator', label: 'Comparar contra crédito rural', kind: 'secondary' },
  ],
  'patrimonio-rural': [
    { to: 'simulator',  label: 'Modelar tese patrimonial rural', kind: 'primary'  },
    { to: 'proposals',  label: 'Levar para Proposal',           kind: 'secondary' },
  ],

  // ── Sucessão / proteção ───────────────────────────────────────────────────
  'holding-patrimonial': [
    { to: 'simulator',  label: 'Modelar estrutura patrimonial', kind: 'primary'   },
    { to: 'proposals',  label: 'Levar tese para Proposal',      kind: 'secondary' },
  ],
  'planejamento-sucessorio': [
    { to: 'simulator',  label: 'Projetar fluxo sucessório',     kind: 'primary'   },
    { to: 'proposals',  label: 'Levar para Proposal',           kind: 'secondary' },
  ],

  // ── Aquisição acelerada / específicas ─────────────────────────────────────
  'aquisicao-acelerada': [
    { to: 'bids',       label: 'Projetar contemplação rápida',  kind: 'primary'   },
    { to: 'simulator',  label: 'Estruturar lance ideal',        kind: 'secondary' },
  ],
  'autoquitacao-estruturada': [
    { to: 'simulator',  label: 'Estruturar autoquitação',       kind: 'primary'   },
    { to: 'comparator', label: 'Comparar contra parcela cheia', kind: 'secondary' },
  ],
};

/** Retorna os próximos passos consultivos para uma estratégia. */
export function getStrategyNextSteps(strategyId: string): StrategyNextStep[] {
  return OVERRIDES[strategyId] ?? DEFAULT_NEXT_STEPS;
}
