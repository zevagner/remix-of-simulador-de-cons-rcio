import { useEffect } from 'react';
import { trackEvent } from '@/services/analyticsTracker';

/**
 * Fires a `module_access` analytics event ONCE per module per session.
 * Prevents duplicate writes when a module remounts (tab switching, route
 * changes, React StrictMode dev double-invoke). Reduces I/O significantly:
 * before this guard the same user could trigger 100+ inserts/day for the
 * same module just by navigating around.
 *
 * Use a stable module key (e.g. 'simulator', 'analysis', 'bids', 'proposal',
 * 'postsale', 'diagnostic', 'comparator', 'investment', 'assemblies', 'help').
 *
 * The guard is in-memory (cleared on full page reload) — that's the desired
 * granularity: 1 event per module per browser session.
 */
const trackedModules = new Set<string>();

export function useTrackModuleAccess(module: string): void {
  useEffect(() => {
    if (!module) return;
    if (trackedModules.has(module)) return;
    trackedModules.add(module);
    trackEvent('module_access', { module });
  }, [module]);
}
