/**
 * Contextual Help Registry
 * ════════════════════════════════════════════════════════════════
 *
 * Single source of truth para mapear "surfaces" operacionais
 * (pontos de decisão / interpretação dentro dos módulos) →
 * artigos institucionais da Central de Ajuda + insights
 * consultivos curtos.
 *
 * Princípios:
 *   1. NÃO redefine conteúdo — apenas referencia `helpContent.ts`.
 *   2. Cada surface tem ≤ 3 articleIds + ≤ 2 insights curtos.
 *   3. Tom institucional, sem verbos de marketing.
 *   4. Componentes consumidores usam `getSurface(id)` — proibido
 *      passar artigos inline em UI.
 *   5. Quando dúvida sobre "criar surface novo vs reutilizar",
 *      reutilizar.
 */
// Wave Bundle Lazy Split: tipo vem do meta (1 KB); `articleById` é
// dinâmico em `getSurfaceArticles` para não arrastar o catálogo de
// ~117 KB no grafo de imports síncrono.
import type { ConsultiveBlockKind } from '@/data/helpContent.meta';

/** Insight contextual curto exibido inline (não substitui artigo). */
export interface ContextualInsight {
  /** Pequeno rótulo visual ("interpretação", "estratégia", "atenção"). */
  kind: Extract<
    ConsultiveBlockKind,
    'when-to-use' | 'common-mistake' | 'explain-client' | 'strategy' | 'objection' | 'deep-dive'
  >;
  body: string;
}

export interface HelpSurface {
  /** ID estável (kebab-case, único). Use em registros e telemetria. */
  id: string;
  /** Título curto (mostrado em tooltip header). */
  title: string;
  /** Resumo 1 linha — exibido no popover acima do CTA "Aprofundar". */
  summary: string;
  /** Artigos relacionados (máx 3). */
  articleIds: string[];
  /** Insights consultivos contextuais (máx 2). */
  insights?: ContextualInsight[];
  /** Aviso de risco curto (mostrado como callout warning). */
  riskNote?: string;
}

// ─────────────────────────────────────────────────────────────────
// Registry — adicionar novos surfaces aqui (NÃO inline em componentes)
// ─────────────────────────────────────────────────────────────────

export const HELP_SURFACES: Record<string, HelpSurface> = {
  // ── Simulador ────────────────────────────────────────────────
  'simulator.installment-composition': {
    id: 'simulator.installment-composition',
    title: 'Composição da parcela',
    summary:
      'Toda parcela tem 4 componentes: Fundo Comum, Taxa de Administração, Fundo de Reserva e Seguro. Saber explicar cada um eleva a percepção de profundidade.',
    articleIds: ['composicao-parcela', 'seguro', 'reduzida'],
    insights: [
      {
        kind: 'explain-client',
        body: 'A parcela cai porque o seguro acompanha o saldo — proteção real, não custo escondido.',
      },
      {
        kind: 'common-mistake',
        body: 'Comparar "parcela inicial" vs financiamento. O custo real vive no total e na evolução mensal.',
      },
    ],
  },

  'simulator.reduced-installment': {
    id: 'simulator.reduced-installment',
    title: 'Parcela reduzida',
    summary:
      'Fator 0,7 sobre a parcela cheia em um período inicial. Útil para clientes em fase de acomodação financeira — mas exige clareza.',
    articleIds: ['reduzida', 'composicao-parcela'],
    insights: [
      {
        kind: 'when-to-use',
        body: 'Cliente com fôlego financeiro crescente (recém-promovido, profissional liberal iniciando).',
      },
      {
        kind: 'common-mistake',
        body: 'Vender a "parcela menor" sem explicar que sobe depois — quebra confiança.',
      },
    ],
    riskNote: 'Custo total NÃO muda; só a distribuição no tempo. Explique sempre.',
  },

  'simulator.bid-types': {
    id: 'simulator.bid-types',
    title: 'Tipos de lance',
    summary:
      'Livre, Fixo e Embutido. A escolha errada custa contemplação — use o Estudo de Lances para decidir com base em dado real.',
    articleIds: ['tipos-de-lance', 'contemplacao'],
    insights: [
      {
        kind: 'strategy',
        body: 'Cliente com caixa → livre estratégico na faixa amarela. Sem caixa → embutido + livre pequeno.',
      },
    ],
  },

  // ── Investimento ─────────────────────────────────────────────
  'investment.scenarios': {
    id: 'investment.scenarios',
    title: 'Cenários de investimento',
    summary:
      'Conservador, Realista e Otimista — presets ajustáveis. Apresentar 1 cenário só é fragilidade comercial.',
    articleIds: ['cenarios', 'logica-investimento', 'incc'],
    insights: [
      {
        kind: 'strategy',
        body: 'Sempre 3 cenários. Cliente decide com clareza, você demonstra profundidade.',
      },
      {
        kind: 'objection',
        body: '"E se a bolsa cair?" → Por isso o cenário Conservador é ancorado em CDI.',
      },
    ],
  },

  'investment.incc': {
    id: 'investment.incc',
    title: 'INPC e correção da carta',
    summary:
      'INPC corrige cartas imobiliárias anualmente. Ignorá-lo subestima o valor futuro do crédito.',
    articleIds: ['incc', 'logica-investimento'],
    insights: [
      {
        kind: 'common-mistake',
        body: 'Apresentar simulação SEM INPC para cliente analítico. Ele descobre e perde a confiança.',
      },
      {
        kind: 'explain-client',
        body: '"Sua carta acompanha a inflação da construção — você não fica defasado."',
      },
    ],
  },

  // ── Comparadores ─────────────────────────────────────────────
  'comparator.financing': {
    id: 'comparator.financing',
    title: 'Consórcio × Financiamento',
    summary:
      'Comparação justa = custo real do cliente. Inclui parcelas, entrada, MIP, DFI e CET institucional.',
    articleIds: ['comparador-fin', 'sac-price'],
    insights: [
      {
        kind: 'explain-client',
        body: '"No financiamento você paga juros sobre o saldo. No consórcio, taxa diluída. Olhe o total."',
      },
      {
        kind: 'deep-dive',
        body: 'CET via Newton-Raphson sobre VPL=0. É a única taxa comparável entre instituições.',
      },
    ],
  },

  'comparator.sac-price': {
    id: 'comparator.sac-price',
    title: 'SAC × PRICE',
    summary:
      'PRICE = parcela fixa, mais juros no total. SAC = parcela decrescente, custo total menor.',
    articleIds: ['sac-price', 'comparador-fin'],
    insights: [
      {
        kind: 'when-to-use',
        body: 'PRICE → cliente prioriza previsibilidade. SAC → cliente prioriza economia total.',
      },
    ],
  },

  'comparator.cash-leverage': {
    id: 'comparator.cash-leverage',
    title: 'À vista × Alavancagem',
    summary:
      'À vista nem sempre é melhor. O capital aplicado pode render mais que o custo do consórcio.',
    articleIds: ['comparador-cash', 'op-estruturadas'],
    insights: [
      {
        kind: 'strategy',
        body: 'Apresente como segunda opinião financeira — não como venda. Cliente decide.',
      },
    ],
  },

  // ── Operações Estruturadas ───────────────────────────────────
  'op.structured': {
    id: 'op.structured',
    title: 'Quando usar Operações Estruturadas',
    summary:
      'Não é para todo cliente. É para perfis com objetivo patrimonial claro e horizonte de médio/longo prazo.',
    articleIds: ['op-estruturadas', 'comparador-cash', 'venda-cota'],
    insights: [
      {
        kind: 'common-mistake',
        body: 'Apresentar OE sem antes validar perfil no Diagnóstico. Quebra credibilidade.',
      },
    ],
    riskNote:
      'Cliente comprando primeiro imóvel/carro NÃO é alvo. Use o Simulador padrão.',
  },

  // ── Carteira & Pós-venda ─────────────────────────────────────
  'carteira.cadence': {
    id: 'carteira.cadence',
    title: 'Cadência institucional',
    summary:
      'SLA por coluna (prospec 5/10, agard 3/7, aval 4/8). Movimentação ativa exige próxima ação.',
    articleIds: ['carteira', 'previsao'],
    insights: [
      {
        kind: 'strategy',
        body: 'Foque nos Top 5 da Previsão de Vendas. Costumam responder por 70%+ do esperado.',
      },
    ],
  },

  // ── Comunidade ───────────────────────────────────────────────
  'community.ask': {
    id: 'community.ask',
    title: 'Como pedir ajuda',
    summary:
      'Anonimização automática: dados pessoais nunca aparecem. Foque em contexto + dúvida específica.',
    articleIds: ['pedir-ajuda', 'responder'],
    insights: [
      {
        kind: 'common-mistake',
        body: 'Postar "alguém me ajuda?" sem contexto. Ninguém responde.',
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────

export function getSurface(id: string): HelpSurface | undefined {
  return HELP_SURFACES[id];
}

/**
 * Async — carrega o catálogo institucional sob demanda (popover abrir).
 * Evita arrastar ~117 KB no chunk inicial só para hints discretos.
 */
export async function getSurfaceArticles(id: string) {
  const surface = HELP_SURFACES[id];
  if (!surface) return [];
  const { articleById } = await import('@/data/helpContent');
  return surface.articleIds
    .map((aid) => articleById[aid])
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
}

/**
 * Telemetria (placeholder). Hoje apenas envia para `runtimeMetrics` se
 * disponível; sem PII. Substituir por analytics se/quando necessário.
 */
export function trackHelpInteraction(
  surfaceId: string,
  action: 'open' | 'expand' | 'article-click' | 'insight-view'
): void {
  try {
    // Lazy access — não criar dependência hard com runtimeMetrics
    if (typeof window === 'undefined') return;
    const w = window as unknown as {
      __runtimeMetrics?: { emit?: (e: unknown) => void };
    };
    w.__runtimeMetrics?.emit?.({
      type: 'interaction',
      name: 'help.contextual',
      surfaceId,
      action,
      ts: Date.now(),
    });
  } catch {
    // silencioso — telemetria nunca quebra UI
  }
}
