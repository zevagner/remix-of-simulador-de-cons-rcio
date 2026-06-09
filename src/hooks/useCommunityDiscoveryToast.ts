import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useCommunityDiscovery } from '@/hooks/useCommunityDiscovery';

/**
 * Notificação one-shot (sino/toast) anunciando a abertura da Comunidade.
 *
 * Dispara uma única vez por usuário, controlada por
 * `community_notif_shown_{userId}`. Clicar no toast navega para o módulo
 * Comunidade via `nav:goto` e marca a notificação como lida.
 *
 * Não dispara se o usuário já tiver descoberto a Comunidade
 * (`community_discovered_{userId}`).
 */
export function useCommunityDiscoveryToast() {
  const { user } = useAuth();
  const { discovered, markDiscovered } = useCommunityDiscovery();
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    const uid = user?.userId;
    if (!uid) return;
    if (firedRef.current === uid) return;
    if (discovered) return;

    const key = `community_notif_shown_${uid}`;
    try {
      if (localStorage.getItem(key) === '1') {
        firedRef.current = uid;
        return;
      }
    } catch { /* noop */ }

    firedRef.current = uid;
    const t = setTimeout(() => {
      try { localStorage.setItem(key, '1'); } catch { /* noop */ }
      toast('🎉 A Comunidade foi aberta para todos os consultores.', {
        description: 'Veja casos reais e compartilhe experiências.',
        duration: 9000,
        action: {
          label: 'Abrir',
          onClick: () => {
            markDiscovered();
            try {
              window.dispatchEvent(
                new CustomEvent('nav:goto', { detail: { module: 'community', source: 'cta' } }),
              );
            } catch { /* noop */ }
          },
        },
        className: 'mb-20 sm:mb-0',
      });
    }, 2000);

    return () => clearTimeout(t);
  }, [user?.userId, discovered, markDiscovered]);
}
