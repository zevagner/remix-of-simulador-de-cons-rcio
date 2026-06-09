/**
 * ════════════════════════════════════════════════════════════════════════════
 * PRESTAMISTA — TABELAS OPERACIONAIS (V1)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Engenharia reversa dos PDFs operacionais oficiais CAIXA Consórcio.
 *
 * Fórmula confirmada:
 *   premium_mensal = (Crédito + TA + FR) × FatorOperacional × 0,000765
 *                  = Categoria Inicial × FatorOperacional × taxa_oficial
 *
 * O FatorOperacional NÃO é universal — varia por (modalidade, prazo).
 * Esta tabela é a ÚNICA fonte legítima desses fatores no sistema.
 *
 * Cenários confirmados (V1):
 *   - vehicle_light  /  80m  → 1,000  (ref. PDF 100k/18%/3,5% → 92,95)
 *   - vehicle_heavy  / 100m  → 0,900  (ref. PDF 200k/15%/3,5% → 163,20)
 *   - real_estate    / 173m  → 0,566  (ref. PDF 325.969,42/21%/2,5% → 174,32)
 *
 * Nesta V1 NÃO interpolamos: lookup é EXATO. Fora dos pontos confirmados o
 * sistema entrega `source: 'fallback'` com fator 1.0 e registra warning para
 * permitir ampliação progressiva da tabela sem drift silencioso.
 * ════════════════════════════════════════════════════════════════════════════
 */
import { logger } from '@/utils/logger';
import type { ConsortiumType } from '@/types/consortium';

/** Modalidade operacional do seguro (estrutura institucional CAIXA). */
export type PrestamistaModality = 'vehicle_light' | 'vehicle_heavy' | 'real_estate';

/** Linha da tabela operacional. */
export interface PrestamistaOperationalRow {
  modality: PrestamistaModality;
  /** Prazo do plano em meses (chave de lookup). */
  termMonths: number;
  /** Fator operacional aplicado sobre a Categoria Inicial. */
  operationalFactor: number;
  /** Fonte / referência do PDF que originou o fator. */
  reference: string;
}

/**
 * Tabela operacional V1 — somente cenários confirmados via PDFs oficiais.
 * Adições futuras devem citar PDF/anexo de origem.
 */
export const PRESTAMISTA_OPERATIONAL_TABLE_V1: ReadonlyArray<PrestamistaOperationalRow> = [
  {
    modality: 'vehicle_light',
    termMonths: 80,
    operationalFactor: 1.0,
    reference: 'PDF veículos leves 80m — crédito 100k / TA 18% / FR 3,5% → seguro 92,95',
  },
  {
    modality: 'vehicle_heavy',
    termMonths: 100,
    operationalFactor: 0.9,
    reference: 'PDF veículos pesados 100m — crédito 200k / TA 15% / FR 3,5% → seguro 163,20',
  },
  // NOTA: entrada `real_estate / 173m / 0.566` removida (auditoria 2026-06-09).
  // O fator 0,566 era workaround histórico (= 0,000433/0,000765), criado quando
  // a engine usava taxa única 0,0765% para imobiliário. Após adoção da taxa
  // vigente da modalidade imobiliária (0,04330%), o fallback factor=1.0
  // reproduz o PDF oficial 173m (R$ 174,31 vs R$ 174,32 — diff R$ 0,01).

];

/** Resultado do lookup operacional (sempre tipado, nunca silencioso). */
export interface PrestamistaOperationalFactorResult {
  factor: number;
  source: 'exact' | 'fallback';
  modality: PrestamistaModality;
  termMonths: number;
  reference?: string;
}

/**
 * Mapeia o ConsortiumType (`imobiliario`/`auto`/`pesados`) para a modalidade
 * operacional usada nas tabelas oficiais.
 */
export function modalityFromConsortiumType(t: ConsortiumType): PrestamistaModality {
  switch (t) {
    case 'imobiliario':
      return 'real_estate';
    case 'auto':
      return 'vehicle_light';
    case 'pesados':
      return 'vehicle_heavy';
  }
}

let __unmatchedWarned: Record<string, boolean> = {};

/**
 * Lookup oficial do fator operacional para (modalidade, prazo).
 *
 *  - lookup EXATO em `PRESTAMISTA_OPERATIONAL_TABLE_V1`.
 *  - sem interpolação (V1).
 *  - fallback controlado: factor = 1.0, `source = 'fallback'`, warning único
 *    por chave (modality+termMonths) no console (dev/test).
 */
export function getPrestamistaOperationalFactor(
  modality: PrestamistaModality,
  termMonths: number,
): PrestamistaOperationalFactorResult {
  const term = Math.max(0, Math.floor(termMonths || 0));
  const hit = PRESTAMISTA_OPERATIONAL_TABLE_V1.find(
    (r) => r.modality === modality && r.termMonths === term,
  );
  if (hit) {
    return {
      factor: hit.operationalFactor,
      source: 'exact',
      modality,
      termMonths: term,
      reference: hit.reference,
    };
  }
  const key = `${modality}|${term}`;
  if (!__unmatchedWarned[key]) {
    __unmatchedWarned[key] = true;
    logger.warn(
      `[prestamista/operational] sem entrada exata para modality=${modality} ` +
        `termMonths=${term}. Aplicando fallback factor=1.0. ` +
        `Adicione o cenário a PRESTAMISTA_OPERATIONAL_TABLE_V1 quando o PDF oficial estiver disponível.`,
    );
  }
  return { factor: 1.0, source: 'fallback', modality, termMonths: term };
}

/** Apenas para testes — limpa dedup do warning. */
export function __resetOperationalFactorWarnCacheForTests(): void {
  __unmatchedWarned = {};
}
