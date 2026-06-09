/**
 * ════════════════════════════════════════════════════════════════════════════
 * SEGURO PRESTAMISTA — CONSTANTES OFICIAIS (FONTE ÚNICA)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Regras oficiais CAIXA — consórcio:
 *   • Prêmio MENSAL = saldo devedor × percentual FIXO
 *   • Percentual NÃO varia por idade, tipo, modalidade ou faixa etária
 *   • Idade interfere APENAS na ELEGIBILIDADE (idade + prazo ≤ 80 anos)
 *   • PJ não possui prestamista
 *
 * Esta é a ÚNICA fonte legítima dos percentuais a partir da Onda 1.
 * Qualquer outra constante (DEFAULT_INSURANCE_PERCENT, getInsuranceRate,
 * getMIPRateByAge, …) está marcada para deprecação nas próximas ondas.
 * ════════════════════════════════════════════════════════════════════════════
 */

/** Cota contratada antes de 02/10/2023 — 0,0680% a.m. (decimal). Legado sem modality split. */
export const PRESTAMISTA_RATE_LEGACY = 0.000680;

/** Cota nova (≥ 02/10/2023) — VEÍCULOS (taxa vigente da modalidade) — 0,0765% a.m. */
export const PRESTAMISTA_RATE_CURRENT = 0.000765;

/** Cota nova (≥ 02/10/2023) — IMOBILIÁRIO (taxa vigente da modalidade) — 0,04330% a.m. */
export const PRESTAMISTA_RATE_CURRENT_REAL_ESTATE = 0.000433;

/** Data de corte oficial entre cotas antigas e novas (ISO). */
export const PRESTAMISTA_COHORT_CUTOFF_ISO = '2023-10-02';

/** Idade máxima ao FINAL do plano (CAIXA: < 80 anos). */
export const PRESTAMISTA_MAX_AGE_AT_END = 80;

/** Idade mínima do proponente. */
export const PRESTAMISTA_MIN_AGE = 18;

/** Coorte de cota — determina o percentual aplicável. */
export type PrestamistaCohort = 'pre_2023_10_02' | 'post_2023_10_02';

/** Tipo de pessoa — PJ não tem prestamista. */
export type PersonType = 'PF' | 'PJ';

/** Coorte default quando não informada (cotas novas). */
export const DEFAULT_PRESTAMISTA_COHORT: PrestamistaCohort = 'post_2023_10_02';

/**
 * Modalidade operacional aceita pelo cálculo de taxa.
 * Declarada aqui para evitar dependência circular com prestamistaOperationalTables.
 */
export type PrestamistaRateModality = 'vehicle_light' | 'vehicle_heavy' | 'real_estate';

/**
 * Retorna o percentual mensal (decimal) vigente por modalidade × coorte.
 *
 * Regra operacional vigente (cota nova ≥ 02/10/2023):
 *   • real_estate  → 0,04330%  (taxa vigente da modalidade imobiliária)
 *   • vehicle_*    → 0,07650%  (taxa vigente da modalidade veículos)
 *   • cota antiga  → 0,06800%  (legado, sem modality split documentado)
 *
 * `modality` é opcional para preservar compatibilidade com chamadores
 * informativos (labels/UI). Omitido → comportamento histórico (veículos).
 */
export function getPrestamistaRate(
  cohort: PrestamistaCohort = DEFAULT_PRESTAMISTA_COHORT,
  modality?: PrestamistaRateModality,
): number {
  if (cohort === 'pre_2023_10_02') {
    return PRESTAMISTA_RATE_LEGACY;
  }
  if (modality === 'real_estate') {
    return PRESTAMISTA_RATE_CURRENT_REAL_ESTATE;
  }
  return PRESTAMISTA_RATE_CURRENT;
}

/**
 * Deriva a coorte a partir de uma data de contratação (ISO ou Date).
 * Cotas contratadas em ou após 02/10/2023 = cohort 'post_2023_10_02'.
 */
export function cohortFromContractDate(
  contractDate: string | Date | null | undefined,
): PrestamistaCohort {
  if (!contractDate) return DEFAULT_PRESTAMISTA_COHORT;
  const d = typeof contractDate === 'string' ? new Date(contractDate) : contractDate;
  if (isNaN(d.getTime())) return DEFAULT_PRESTAMISTA_COHORT;
  const cutoff = new Date(PRESTAMISTA_COHORT_CUTOFF_ISO);
  return d.getTime() >= cutoff.getTime() ? 'post_2023_10_02' : 'pre_2023_10_02';
}
