/**
 * ════════════════════════════════════════════════════════════════════════════
 * Sim-Slice Bridge — Hardened envelope + assertions (Wave 4 / Sim-slice Bridge)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Arquitetura preservada (V2.4 LOCKED): a ponte continua sendo
 *   SimulatorContext ──► localStorage(strategy:sim-slice:v1)
 *                       + CustomEvent('wealth:sim-slice:changed')
 *                                      │
 *                                      ▼
 *                     WealthAssumptionsContext / readers off-screen
 *
 * Esta camada adiciona, sem mudar o protocolo:
 *   • Envelope versionado    { schemaVersion, timestamp, origin, payload }
 *   • Back-compat            leitura aceita formato legado (payload raw)
 *   • Assertions defensivas  validações de shape antes de hidratar/persistir
 *   • Bailout                igualdade estrutural via string canônica
 *
 * Não há debounce aqui — o debounce vive no produtor (SimulatorContext),
 * para não atrasar leituras síncronas (PDF off-screen / boot).
 */

import type { SimSlice } from '@/contexts/WealthAssumptionsContext';

export const SIM_SLICE_SCHEMA_VERSION = 1 as const;
export const SIM_SLICE_BRIDGE_EVENT = 'wealth:sim-slice:changed' as const;

export interface SimSliceEnvelope {
  schemaVersion: typeof SIM_SLICE_SCHEMA_VERSION;
  timestamp: number;
  origin: 'simulator';
  payload: SimSlice;
}

/** Campos numéricos críticos do SimSlice — devem ser finitos. */
const CRITICAL_NUMERIC_FIELDS: ReadonlyArray<keyof SimSlice> = [
  'creditValue',
  'termMonths',
  'adminFeePercent',
  'reserveFundPercent',
  'effectiveAdminFeePercent',
  'effectiveInsurancePercent',
  'costPlan',
  'totalCost',
  'fullInstallment',
  'effectiveClientCost',
];

/**
 * Validação defensiva do payload SimSlice.
 * Falha silenciosa → null. NUNCA lança.
 */
export function assertValidSimSlice(value: unknown): SimSlice | null {
  if (!value || typeof value !== 'object') return null;
  const s = value as Partial<SimSlice>;
  if (typeof s.creditValue !== 'number' || !(s.creditValue > 0)) return null;
  if (typeof s.termMonths !== 'number' || !(s.termMonths > 0)) return null;
  if (typeof s.consortiumType !== 'string' || s.consortiumType.length === 0) return null;
  for (const k of CRITICAL_NUMERIC_FIELDS) {
    const v = s[k];
    if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  }
  return s as SimSlice;
}

/**
 * Lê o slice canônico do storage, suportando envelope versionado E o
 * formato legado (payload raw). Retorna null em qualquer falha.
 */
export function readSimSlicePayload(raw: string | null): SimSlice | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'schemaVersion' in parsed &&
      'payload' in parsed
    ) {
      const env = parsed as Partial<SimSliceEnvelope>;
      // Versões desconhecidas → null (forward-incompat seguro).
      if (env.schemaVersion !== SIM_SLICE_SCHEMA_VERSION) return null;
      return assertValidSimSlice(env.payload);
    }
    // Legado: payload na raiz (snapshots pré-Wave 4).
    return assertValidSimSlice(parsed);
  } catch {
    return null;
  }
}

/**
 * Serializa o envelope canônico para persistência. Pure — sem side-effects.
 * Retorna a string serializada (para writes) E o "fingerprint" usado para
 * bailout (igualdade estrutural, ignorando timestamp).
 */
export function serializeSimSliceEnvelope(payload: SimSlice): {
  serialized: string;
  fingerprint: string;
} {
  const envelope: SimSliceEnvelope = {
    schemaVersion: SIM_SLICE_SCHEMA_VERSION,
    timestamp: Date.now(),
    origin: 'simulator',
    payload,
  };
  // Fingerprint omite timestamp para que writes idênticos em conteúdo
  // sejam bailout-ados (write storm reduction).
  const fingerprint = JSON.stringify(payload);
  return { serialized: JSON.stringify(envelope), fingerprint };
}
