/**
 * ════════════════════════════════════════════════════════════════════════════
 * strategyModalities — Camada contextual operacional (consórcio × tese)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Mapa declarativo strategyId → modalidades suportadas. Não substitui o agrupamento
 * editorial por capítulo — adiciona a CAMADA OPERACIONAL ("que tipo de consórcio
 * estou trabalhando?") que naturalmente precede a leitura por intenção.
 *
 * Princípios:
 *   • Multi-tag: uma tese pode ser relevante em mais de uma modalidade.
 *   • Sem ocultar: modalidade muda ORDEM e ÊNFASE, nunca remove estratégias.
 *   • Sem cálculo, sem novo estado financeiro, sem CRM.
 *   • Reusa `SimulatorInput.consortiumType` para sugestão automática.
 * ════════════════════════════════════════════════════════════════════════════
 */

export type ConsortiumModality = 'all' | 'imobiliario' | 'veiculos' | 'pesados';

export interface ModalityMeta {
  id: ConsortiumModality;
  label: string;
  hint: string;
}

export const MODALITY_OPTIONS: ModalityMeta[] = [
  { id: 'all',          label: 'Todas as modalidades', hint: 'Visão consultiva completa.' },
  { id: 'imobiliario',  label: 'Imobiliário',          hint: 'Imóvel próprio, leverage, renda e sucessão.' },
  { id: 'veiculos',     label: 'Veículos',             hint: 'Upgrade, renovação e aquisição leve.' },
  { id: 'pesados',      label: 'Pesados & Produtivo',  hint: 'Frota pesada, agro, equipamentos e expansão.' },
];

/**
 * Tese → modalidades aderentes. Toda tese tem ao menos uma; a maioria tem 1–2.
 * Curadoria conservadora: marcar uma modalidade significa "esta tese rende
 * sentido operacional aqui", e não apenas "tecnicamente possível".
 */
const STRATEGY_MODALITY_MAP: Record<string, ConsortiumModality[]> = {
  // ── Aquisição (multi-modalidade por natureza) ───────────────────────────
  'compra-hibrida':            ['imobiliario', 'veiculos'],
  'compra-planejada':          ['imobiliario', 'veiculos'],
  'aquisicao-acelerada':       ['imobiliario', 'veiculos', 'pesados'],

  // ── Leverage / Acumulação ──────────────────────────────────────────────
  'leverage-patrimonial':      ['imobiliario', 'pesados'],
  'usar-carta-investir':       ['imobiliario', 'veiculos', 'pesados'],
  'alavancagem-imobiliaria':   ['imobiliario'],
  'multiplicacao-cotas':       ['imobiliario', 'veiculos', 'pesados'],
  'venda-carta-lucro':         ['imobiliario'],
  'reinvestimento-estruturado': ['imobiliario'],
  'autoquitacao-estruturada':  ['imobiliario', 'veiculos'],
  'patrimonio-escalavel':      ['imobiliario'],

  // ── Uso / produtivo ─────────────────────────────────────────────────────
  'reforma-ampliacao':         ['imobiliario'],
  'retrofit-patrimonial':      ['imobiliario'],
  'energia-solar':             ['imobiliario'],
  'upgrade-veiculo':           ['veiculos'],
  'renovacao-frota':           ['veiculos', 'pesados'],
  'expansao-produtiva':        ['pesados'],
  'equipamentos-pesados':      ['pesados'],
  'agronegocio':               ['pesados'],
  'patrimonio-rural':          ['pesados', 'imobiliario'],

  // ── Renda & Sucessão (predominantemente imob, mas relevantes em frota) ──
  'renda-passiva':             ['imobiliario'],
  'patrimonio-gerador-caixa':  ['imobiliario', 'pesados'],
  'holding-patrimonial':       ['imobiliario'],
  'planejamento-sucessorio':   ['imobiliario'],
};

/** Retorna as modalidades de uma estratégia (vazio → tratada como universal). */
export function getStrategyModalities(strategyId: string): ConsortiumModality[] {
  return STRATEGY_MODALITY_MAP[strategyId] ?? [];
}

/** Verdadeiro se a estratégia adere à modalidade (ou se a seleção é 'all'). */
export function strategyMatchesModality(
  strategyId: string,
  modality: ConsortiumModality,
): boolean {
  if (modality === 'all') return true;
  const tags = STRATEGY_MODALITY_MAP[strategyId];
  // Estratégias sem tags são consideradas universais → sempre aparecem.
  if (!tags || tags.length === 0) return true;
  return tags.includes(modality);
}

/**
 * Mapeia `SimulatorInput.consortiumType` (`'imobiliario' | 'auto' | 'pesados'`)
 * para a modalidade canônica do seletor patrimonial. Retorna `'all'` quando
 * não há sinal.
 */
export function modalityFromConsortiumType(
  consortiumType: string | undefined,
): ConsortiumModality {
  if (consortiumType === 'imobiliario') return 'imobiliario';
  if (consortiumType === 'auto')        return 'veiculos';
  if (consortiumType === 'pesados')     return 'pesados';
  return 'all';
}
