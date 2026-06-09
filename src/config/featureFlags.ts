/**
 * Feature flags da plataforma.
 * Mantenha valores conservadores; cada flag deve ter um único ponto de leitura.
 *
 * Wave 2 (Legacy Cleanup): a flag `ENABLE_STRATEGY_PRESENTATION_V2` foi
 * removida junto com a árvore `src/components/modules/strategy-v2/*`.
 * Snapshot histórico: `.lovable/audit/strategy-v2-removal-snapshot.md`.
 */

/**
 * MULTI_TENANT_RLS
 * - false (Onda M1): RLS legado (auth.uid() = user_id).
 * - true  (Onda M3): RLS migra para is_company_member(company_id).
 *
 * M3-E (FLIP, atual): tenant-scoped RLS ativo. Policies tenant-aware:
 *   auth.uid() = user_id AND (company_id IS NULL OR is_company_member(company_id))
 * UX permanece idêntica (visão por usuário).
 */
export const MULTI_TENANT_RLS = true as const;

export const featureFlags = {
  MULTI_TENANT_RLS,
} as const;

export type FeatureFlag = keyof typeof featureFlags;
