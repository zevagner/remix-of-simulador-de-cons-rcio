/**
 * ════════════════════════════════════════════════════════════════════════════
 * strategyContextScoring — Inteligência consultiva silenciosa.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Lê sinais já existentes (simulador + diagnóstico) e devolve um pequeno
 * mapa por estratégia com:
 *   - boost  : peso para reordenação editorial sutil (0 = neutro)
 *   - hint   : micro-frase consultiva curta (≤ 5 palavras) quando aderente
 *
 * Princípios:
 *   • Determinístico, sem IA, sem promessas.
 *   • Nunca esconde, nunca filtra — apenas reordena.
 *   • Hints sóbrios e financeiramente coerentes.
 *   • Quando não há sinais suficientes, retorna mapa vazio.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface StrategyContextSignals {
  consortiumType?: string;
  creditValue?: number;
  // Diagnostic (opcional — pode ser null)
  objetivoPrincipal?: string;
  subObjetivo?: string;
  prioridade?: string;
  temCapitalDisponivel?: boolean;
  capitalDisponivel?: number;
  urgencia?: string;
}

export interface StrategyContextScore {
  boost: number;
  hint?: string;
}

type Bucket = { ids: string[]; boost: number; hint: string };

/* ───── Buckets de coerência financeira (silenciosos) ───── */

const RULES: Array<(s: StrategyContextSignals) => Bucket | null> = [
  // Tipo de carta — coerência básica
  (s) => s.consortiumType === 'imobiliario' ? {
    ids: ['compra-planejada', 'alavancagem-imobiliaria', 'reforma-ampliacao',
          'retrofit-patrimonial', 'energia-solar', 'patrimonio-gerador-caixa', 'renda-passiva',
          'patrimonio-escalavel'],
    boost: 1, hint: 'Compatível com tipo de carta',
  } : null,
  (s) => s.consortiumType === 'auto' ? {
    ids: ['upgrade-veiculo', 'aquisicao-acelerada'],
    boost: 1, hint: 'Compatível com tipo de carta',
  } : null,
  (s) => s.consortiumType === 'pesados' ? {
    ids: ['equipamentos-pesados', 'renovacao-frota', 'agronegocio', 'patrimonio-rural',
          'expansao-produtiva'],
    boost: 1, hint: 'Compatível com tipo de carta',
  } : null,
  (s) => s.consortiumType === 'servicos' ? {
    ids: ['expansao-produtiva', 'renovacao-frota', 'equipamentos-pesados'],
    boost: 1, hint: 'Compatível com perfil PJ',
  } : null,

  // Objetivo principal — alinhamento estratégico
  (s) => s.objetivoPrincipal === 'imovel_investimento' ? {
    ids: ['renda-passiva', 'patrimonio-gerador-caixa', 'alavancagem-imobiliaria',
          'leverage-patrimonial'],
    boost: 2, hint: 'Alinhada ao objetivo informado',
  } : null,
  (s) => s.objetivoPrincipal === 'imovel_moradia' ? {
    ids: ['compra-planejada', 'reforma-ampliacao', 'autoquitacao-estruturada'],
    boost: 2, hint: 'Alinhada ao objetivo informado',
  } : null,
  (s) => s.objetivoPrincipal === 'investimento' ? {
    ids: ['leverage-patrimonial', 'venda-carta-lucro', 'multiplicacao-cotas',
          'reinvestimento-estruturado', 'usar-carta-investir'],
    boost: 2, hint: 'Alinhada ao objetivo informado',
  } : null,
  (s) => (s.objetivoPrincipal === 'veiculo' || s.objetivoPrincipal === 'troca_veiculo') ? {
    ids: ['upgrade-veiculo'],
    boost: 2, hint: 'Alinhada ao objetivo informado',
  } : null,
  (s) => s.objetivoPrincipal === 'troca_imovel' ? {
    ids: ['compra-hibrida', 'autoquitacao-estruturada', 'patrimonio-escalavel'],
    boost: 2, hint: 'Alinhada ao objetivo informado',
  } : null,

  // ─── Raízes produtivas (Wave: Productive Wealth Root Integration) ───
  (s) => s.objetivoPrincipal === 'patrimonio_produtivo' ? {
    ids: ['leverage-patrimonial', 'multiplicacao-cotas', 'agronegocio',
          'patrimonio-rural', 'venda-carta-lucro'],
    boost: 2, hint: 'Alinhada à estruturação patrimonial produtiva',
  } : null,
  (s) => s.objetivoPrincipal === 'expandir_operacao' ? {
    ids: ['renovacao-frota', 'equipamentos-pesados', 'expansao-produtiva',
          'multiplicacao-cotas'],
    boost: 2, hint: 'Alinhada à expansão operacional',
  } : null,

  // Sub-objetivos produtivos — refinamento consultivo
  (s) => s.subObjetivo === 'estruturacao_rural' ? {
    ids: ['agronegocio', 'patrimonio-rural'],
    boost: 1, hint: 'Aderente ao subobjetivo declarado',
  } : null,
  (s) => s.subObjetivo === 'maquinas_implementos' ? {
    ids: ['equipamentos-pesados', 'agronegocio', 'expansao-produtiva'],
    boost: 1, hint: 'Aderente ao subobjetivo declarado',
  } : null,
  (s) => s.subObjetivo === 'sucessao_consolidacao' ? {
    ids: ['holding-patrimonial', 'planejamento-sucessorio', 'multiplicacao-cotas'],
    boost: 1, hint: 'Aderente ao subobjetivo declarado',
  } : null,
  (s) => s.subObjetivo === 'frota_pesados' ? {
    ids: ['renovacao-frota', 'equipamentos-pesados'],
    boost: 1, hint: 'Aderente ao subobjetivo declarado',
  } : null,
  (s) => s.subObjetivo === 'sede_galpao' ? {
    ids: ['patrimonio-gerador-caixa', 'alavancagem-imobiliaria', 'expansao-produtiva'],
    boost: 1, hint: 'Aderente ao subobjetivo declarado',
  } : null,
  (s) => s.subObjetivo === 'capacidade_produtiva' ? {
    ids: ['expansao-produtiva', 'equipamentos-pesados', 'multiplicacao-cotas'],
    boost: 1, hint: 'Aderente ao subobjetivo declarado',
  } : null,

  // Subobjetivo — refinamento consultivo
  (s) => s.subObjetivo === 'aluguel' ? {
    ids: ['renda-passiva', 'patrimonio-gerador-caixa', 'alavancagem-imobiliaria'],
    boost: 1, hint: 'Aderente ao subobjetivo declarado',
  } : null,
  (s) => s.subObjetivo === 'valorizacao' ? {
    ids: ['reforma-ampliacao', 'retrofit-patrimonial', 'patrimonio-escalavel'],
    boost: 1, hint: 'Aderente ao subobjetivo declarado',
  } : null,
  (s) => s.subObjetivo === 'reforma' ? {
    ids: ['reforma-ampliacao', 'retrofit-patrimonial'],
    boost: 1, hint: 'Aderente ao subobjetivo declarado',
  } : null,
  (s) => s.subObjetivo === 'construcao' ? {
    ids: ['patrimonio-escalavel', 'reforma-ampliacao'],
    boost: 1, hint: 'Aderente ao subobjetivo declarado',
  } : null,
  (s) => s.subObjetivo === 'patrimonio' ? {
    ids: ['leverage-patrimonial', 'venda-carta-lucro', 'holding-patrimonial',
          'planejamento-sucessorio', 'usar-carta-investir'],
    boost: 1, hint: 'Aderente ao subobjetivo declarado',
  } : null,
  (s) => s.subObjetivo === 'aposentadoria' ? {
    ids: ['renda-passiva', 'patrimonio-gerador-caixa', 'planejamento-sucessorio'],
    boost: 1, hint: 'Aderente ao subobjetivo declarado',
  } : null,
  (s) => s.subObjetivo === 'protecao' ? {
    ids: ['holding-patrimonial', 'planejamento-sucessorio'],
    boost: 1, hint: 'Aderente ao subobjetivo declarado',
  } : null,
  (s) => s.subObjetivo === 'uso_profissional' ? {
    ids: ['renovacao-frota', 'equipamentos-pesados', 'expansao-produtiva'],
    boost: 1, hint: 'Aderente ao subobjetivo declarado',
  } : null,
  (s) => s.subObjetivo === 'upgrade' ? {
    ids: ['upgrade-veiculo'],
    boost: 1, hint: 'Aderente ao subobjetivo declarado',
  } : null,

  // Prioridade — coerência de liquidez/custo/velocidade
  (s) => s.prioridade === 'manter_liquidez' ? {
    ids: ['leverage-patrimonial', 'compra-hibrida', 'venda-carta-lucro',
          'reinvestimento-estruturado', 'usar-carta-investir'],
    boost: 1, hint: 'Coerente com perfil de liquidez',
  } : null,
  (s) => s.prioridade === 'menor_custo' ? {
    ids: ['autoquitacao-estruturada', 'compra-planejada'],
    boost: 1, hint: 'Otimiza custo no cenário simulado',
  } : null,
  (s) => s.prioridade === 'rapidez' ? {
    ids: ['aquisicao-acelerada'],
    boost: 1, hint: 'Compatível com janela curta',
  } : null,
  (s) => s.prioridade === 'menor_parcela' ? {
    ids: ['compra-planejada', 'venda-carta-lucro', 'autoquitacao-estruturada'],
    boost: 1, hint: 'Compatível com parcela enxuta',
  } : null,

  // Capital disponível ≥ 30% do crédito → estratégias de alavancagem fazem sentido
  (s) => {
    if (!s.temCapitalDisponivel || !s.capitalDisponivel || !s.creditValue) return null;
    if (s.capitalDisponivel < s.creditValue * 0.3) return null;
    return {
      ids: ['leverage-patrimonial', 'compra-hibrida', 'venda-carta-lucro'],
      boost: 1, hint: 'Compatível com capital disponível',
    };
  },

  // Urgência imediata → acelerar contemplação
  (s) => s.urgencia === 'imediato' ? {
    ids: ['aquisicao-acelerada'],
    boost: 1, hint: 'Compatível com janela curta',
  } : null,
];

/**
 * Devolve mapa `strategyId → { boost, hint }`. Boosts são somados quando a mesma
 * estratégia aparece em múltiplos buckets; o hint preservado é o de **maior boost**
 * (em empate, o primeiro encontrado — regra estável).
 */
export function scoreStrategies(
  signals: StrategyContextSignals,
): Map<string, StrategyContextScore> {
  const out = new Map<string, { boost: number; hint: string; hintBoost: number }>();

  for (const rule of RULES) {
    const bucket = rule(signals);
    if (!bucket) continue;
    for (const id of bucket.ids) {
      const prev = out.get(id);
      if (!prev) {
        out.set(id, { boost: bucket.boost, hint: bucket.hint, hintBoost: bucket.boost });
      } else {
        prev.boost += bucket.boost;
        if (bucket.boost > prev.hintBoost) {
          prev.hint = bucket.hint;
          prev.hintBoost = bucket.boost;
        }
      }
    }
  }

  const result = new Map<string, StrategyContextScore>();
  for (const [id, v] of out) result.set(id, { boost: v.boost, hint: v.hint });
  return result;
}

/** True quando há ao menos um sinal consultivo legível. */
export function hasContextSignals(signals: StrategyContextSignals): boolean {
  return Boolean(
    signals.consortiumType ||
    signals.objetivoPrincipal ||
    signals.subObjetivo ||
    signals.prioridade ||
    signals.urgencia ||
    (signals.temCapitalDisponivel && (signals.capitalDisponivel ?? 0) > 0),
  );
}
