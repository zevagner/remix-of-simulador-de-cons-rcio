import type { PdfPropostaCompletaData } from './types';

// ════════ DATA-AVAILABILITY GATES ════════
//
// REGRA NOVA (relaxada): bloco selecionado SEMPRE renderiza.
// Se vier sem dados completos, a página interna mostra `MissingDataNote`
// com narrativa consultiva válida — nunca página em branco, nunca silêncio.
// Bloco só é descartado se NÃO houver absolutamente nenhum dado utilizável.
//
// Antes: gate exigia campo numérico específico (>0) → bloco sumia em silêncio.
// Agora: gate aceita objeto presente OU campo parcial → fallback visual cobre o resto.

/** Verdadeiro se ao menos um campo do objeto for não-nulo/não-vazio. */
export function hasAnyUsefulField(obj: Record<string, unknown> | undefined | null): boolean {
  if (!obj) return false;
  return Object.values(obj).some((v) => {
    if (v === null || v === undefined) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (typeof v === 'number') return Number.isFinite(v);
    return true;
  });
}

export function hasComparisonData(d: PdfPropostaCompletaData, blockId: string): boolean {
  // Financing: sempre há cálculo determinístico via BUSINESS_RULES quando há simulação válida.
  // Cash: depende de o usuário ter marcado o bloco (texto é gerado em buildData só nesse caso).
  // Em ambos os casos, se o objeto comparisons existe OU a simulação é válida, renderiza com fallback.
  if (blockId === 'cmp-financing') {
    return d.simulation.creditValue > 0 || hasAnyUsefulField(d.comparisons);
  }
  if (blockId === 'cmp-cash') {
    return d.simulation.creditValue > 0 || hasAnyUsefulField(d.comparisons);
  }
  return false;
}
export function hasStrategyData(_d: PdfPropostaCompletaData, _blockId: string): boolean {
  // Estratégia (lance/renda/venda) sempre tem narrativa consultiva válida.
  // Sem números → MissingDataNote interna explica como enriquecer.
  return true;
}
export function hasBidsStudyData(_d: PdfPropostaCompletaData): boolean {
  // BidsStudyPage tem MissingDataNote interna que orienta a selecionar grupo.
  // O bloco selecionado deve aparecer para reforçar o método.
  return true;
}
export function hasStorytellingData(_d: PdfPropostaCompletaData): boolean {
  // Sempre verdadeiro: se IA não gerou, usamos defaultStorytelling determinístico (cenário concreto).
  return true;
}
