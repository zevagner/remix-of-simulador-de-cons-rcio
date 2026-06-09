import type { NarrativeContext } from '@/utils/proposalPdf/narrative';
import type { PdfPropostaCompletaData } from './types';

// ════════ HELPERS ════════
export function buildNarrativeContext(data: PdfPropostaCompletaData): NarrativeContext {
  return {
    clientName: data.clientName,
    managerName: data.managerName || '',
    objetivo: data.diagnostic.objetivo,
    subObjetivo: data.diagnostic.subObjetivo,
    capacidadeMensal: data.diagnostic.capacidadeMensal,
    temCapital: data.diagnostic.temCapital,
    capitalDisponivel: data.diagnostic.capitalDisponivel,
    creditValue: data.simulation.creditValue,
    termMonths: data.simulation.termMonths,
    installment: data.simulation.installment,
    effectiveClientCost: data.simulation.effectiveClientCost,
    recommendation: data.recommendation,
    annualAdjustmentPercent: (data.simulation as { annualAdjustmentPercent?: number }).annualAdjustmentPercent,
  };
}

/**
 * Sanitiza mensagem personalizada do gerente:
 *  - remove HTML/tags
 *  - colapsa múltiplas quebras em uma única
 *  - limita a 300 caracteres
 *  - retorna null se vazio após sanitização
 */
export function sanitizeManagerNote(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const noTags = raw.replace(/<[^>]*>/g, '');
  const collapsed = noTags.replace(/\r/g, '').replace(/\n{2,}/g, '\n').replace(/[ \t]+/g, ' ').trim();
  if (!collapsed) return null;
  return collapsed.slice(0, 300);
}

/**
 * Sanitiza um valor monetário para exibição no bloco de impacto.
 * Garante: número finito > 0. Caso contrário retorna null (renderiza placeholder seguro).
 */
export function sanitizeImpactValue(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  // Limite superior defensivo (R$ 100 milhões) — protege contra dados corrompidos.
  if (n > 100_000_000) return null;
  return n;
}
