import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Discovery flag for the Community module (onboarding-only).
 *
 * Key: `community_discovered_{userId}` — set when the user first enters
 * the Community module. While unset, three discovery surfaces are shown:
 * banner (dashboard), one-shot toast (sino) and orange "Novo" badge
 * (sidebar/bottom-nav). After it's set, all three disappear permanently.
 *
 * Independent from `community_my_updates` (numeric red badge of new
 * activity in followed cases).
 */
export function communityDiscoveryKey(userId: string | undefined | null) {
  return userId ? `community_discovered_${userId}` : null;
}

export function useCommunityDiscovery() {
  const { user } = useAuth();
  const key = communityDiscoveryKey(user?.userId);

  const read = useCallback(() => {
    if (!key) return true; // sem usuário: não mostrar
    try { return localStorage.getItem(key) === '1'; } catch { return true; }
  }, [key]);

  const [discovered, setDiscovered] = useState<boolean>(() => read());

  useEffect(() => { setDiscovered(read()); }, [read]);

  // Sincroniza entre abas / outros componentes.
  useEffect(() => {
    if (!key) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setDiscovered(read());
    };
    const onLocal = () => setDiscovered(read());
    window.addEventListener('storage', onStorage);
    window.addEventListener('community:discovered', onLocal);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('community:discovered', onLocal);
    };
  }, [key, read]);

  const markDiscovered = useCallback(() => {
    if (!key) return;
    try { localStorage.setItem(key, '1'); } catch { /* noop */ }
    setDiscovered(true);
    try { window.dispatchEvent(new CustomEvent('community:discovered')); } catch { /* noop */ }
  }, [key]);

  return { discovered, markDiscovered };
}
