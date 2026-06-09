import type { UserProfile } from '@/services/users';

/**
 * Stable tie-breaker for email sorting:
 *   1) name (pt-BR, ascending)
 *   2) created_at (oldest first)
 * Returned as a positive/negative integer so it can be added to the
 * primary comparator result (which must be 0 to fall through here).
 */
export function emailTieBreaker(a: UserProfile, b: UserProfile): number {
  const byName = a.nome.localeCompare(b.nome, 'pt-BR');
  if (byName !== 0) return byName;
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}
