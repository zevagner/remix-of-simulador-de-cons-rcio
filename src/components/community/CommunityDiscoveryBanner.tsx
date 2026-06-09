import { useEffect, useState } from 'react';
import { Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCommunityDiscovery } from '@/hooks/useCommunityDiscovery';

/**
 * Onboarding banner anunciando que a Comunidade foi aberta para todos.
 *
 * Visível apenas enquanto o usuário não tiver descoberto a Comunidade
 * (chave `community_discovered_{userId}`) E não tiver fechado o banner
 * explicitamente (chave `community_banner_dismissed_{userId}`).
 *
 * Independente do badge "Novo" e da notificação por toast — fechar aqui
 * NÃO marca discovered.
 */
export function CommunityDiscoveryBanner({
  activeModule,
  onOpenCommunity,
}: {
  activeModule: string;
  onOpenCommunity: () => void;
}) {
  const { user } = useAuth();
  const { discovered } = useCommunityDiscovery();
  const dismissKey = user?.userId ? `community_banner_dismissed_${user.userId}` : null;

  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (!dismissKey) return true;
    try { return localStorage.getItem(dismissKey) === '1'; } catch { return true; }
  });

  useEffect(() => {
    if (!dismissKey) { setDismissed(true); return; }
    try { setDismissed(localStorage.getItem(dismissKey) === '1'); } catch { /* noop */ }
  }, [dismissKey]);

  // Não exibir dentro do próprio módulo Comunidade.
  if (activeModule === 'community') return null;
  if (discovered) return null;
  if (dismissed) return null;
  if (!user?.userId) return null;

  const handleDismiss = () => {
    if (!dismissKey) return;
    try { localStorage.setItem(dismissKey, '1'); } catch { /* noop */ }
    setDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label="Comunidade aberta para todos"
      className="mb-4 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-[#F5821F]/10 p-4 md:p-5 shadow-sm"
    >
      <div className="flex items-start gap-3 md:gap-4">
        <div className="shrink-0 h-10 w-10 md:h-12 md:w-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
          <Users className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base md:text-lg font-semibold text-foreground leading-tight">
                Comunidade agora aberta para todos
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground leading-snug">
                Tire dúvidas, compartilhe casos e aprenda com outros gerentes CAIXA.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Fechar aviso"
              className="shrink-0 -mr-1 -mt-1 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={onOpenCommunity}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Conhecer a Comunidade
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Agora não
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
