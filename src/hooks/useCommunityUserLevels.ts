/**
 * useCommunityUserLevels — busca níveis (community_user_level RPC) de uma lista
 * de user_ids com cache em memória, evitando re-queries por render.
 *
 * Restrições: leitura puramente passiva, sem alterar lógica de score.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const cache = new Map<string, number>();

export function useCommunityUserLevels(userIds: ReadonlyArray<string | null | undefined>): Record<string, number> {
  const unique = Array.from(new Set(userIds.filter((x): x is string => !!x)));
  const cacheKey = unique.slice().sort().join('|');
  const [levels, setLevels] = useState<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const id of unique) {
      const cached = cache.get(id);
      if (cached !== undefined) out[id] = cached;
    }
    return out;
  });

  useEffect(() => {
    const missing = unique.filter((id) => !cache.has(id));
    if (missing.length === 0) {
      const snap: Record<string, number> = {};
      for (const id of unique) snap[id] = cache.get(id) ?? 1;
      setLevels(snap);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc('community_user_levels', { p_user_ids: missing });
        if (!error && Array.isArray(data)) {
          for (const row of data as Array<{ user_id: string; level: number }>) {
            cache.set(row.user_id, typeof row.level === 'number' ? row.level : 1);
          }
        }
        // Garante que ids ausentes na resposta caem em fallback 1
        for (const id of missing) if (!cache.has(id)) cache.set(id, 1);
      } catch {
        for (const id of missing) if (!cache.has(id)) cache.set(id, 1);
      }
      if (cancelled) return;
      const snap: Record<string, number> = {};
      for (const id of unique) snap[id] = cache.get(id) ?? 1;
      setLevels(snap);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return levels;
}
