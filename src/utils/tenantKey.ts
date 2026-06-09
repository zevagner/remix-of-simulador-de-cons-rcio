/**
 * M3-D — Tenant-aware query key strategy
 *
 * Helper canônico para prefixar todas as query keys operacionais
 * com o tenant atual: `['t', companyId, ...partes]`.
 *
 * Por que existir:
 * - Garante isolamento de cache entre tenants (mesmo usuário em múltiplas
 *   companies no futuro / multi-membership / manager workflows).
 * - Permite cache-bust cirúrgico via `removeQueries({ queryKey: ['t'] })`
 *   sem afetar queries globais (admin, auth, tenant resolver).
 * - Padroniza invalidação: `invalidateQueries({ queryKey: tenantKey(cid, 'proposals') })`.
 *
 * NÃO usar para queries que não têm escopo tenant (admin global, auth,
 * tenant resolver, assemblies/groups públicos, etc.).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type TenantId = string | null | undefined;

/** Sentinela usada antes do companyId resolver — `enabled: !!cid` evita chamada. */
export const TENANT_PENDING = '_pending' as const;

/**
 * Constrói uma query key tenant-aware estável.
 * Quando `companyId` é null/undefined retorna o prefixo `_pending` para
 * evitar colisão com a tenant real; combine com `enabled: !!companyId`.
 */
export function tenantKey(
  companyId: TenantId,
  ...parts: ReadonlyArray<unknown>
): readonly unknown[] {
  return ['t', companyId ?? TENANT_PENDING, ...parts] as const;
}

async function resolveCurrentCompanyId(): Promise<string | null> {
  const { data: u } = await supabase.auth.getUser();
  const userId = u?.user?.id;
  if (!userId) return null;
  const { data } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('user_id', userId)
    .maybeSingle();
  return (data?.company_id as string | null) ?? null;
}

/**
 * Hook reativo para o companyId do usuário corrente. Cacheado por 5min e
 * compartilhado entre todas as queries operacionais.
 *
 * M3-D: resolve a partir de `profiles.company_id` (workspace pessoal).
 * M4 (futuro): será substituído por um TenantContext com switcher.
 */
export function useCurrentCompanyId(): string | null {
  const q = useQuery({
    queryKey: ['tenant', 'current-company-id'],
    queryFn: resolveCurrentCompanyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  return q.data ?? null;
}
