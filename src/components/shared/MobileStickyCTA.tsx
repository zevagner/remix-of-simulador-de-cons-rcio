import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Sticky bottom action bar — apenas mobile (<md).
 * Posiciona-se acima do BottomNav (h ≈ 56px) e respeita safe-area-inset-bottom.
 * Some quando o teclado virtual está aberto (mesma heurística do BottomNav).
 *
 * Uso:
 *   <MobileStickyCTA>
 *     <Button variant="outline">Voltar</Button>
 *     <Button className="flex-1">Próximo</Button>
 *   </MobileStickyCTA>
 *
 * Não substitui o footer existente de fluxo — adiciona uma versão sticky para
 * eliminar a fricção de "CTA fora do viewport" em forms longos no mobile.
 *
 * Princípio: zero impacto em desktop/tablet (md+ esconde tudo).
 */
interface MobileStickyCTAProps {
  children: ReactNode;
  className?: string;
  /** Texto curto opcional acima dos botões (ex.: "Preencha seu nome para continuar"). */
  helperText?: string;
}

export function MobileStickyCTA({ children, className, helperText }: MobileStickyCTAProps) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setKeyboardOpen(vv.height < window.innerHeight * 0.75);
    vv.addEventListener('resize', onResize);
    onResize();
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  if (keyboardOpen) return null;

  return (
    <>
      {/* Spacer para o conteúdo não ficar atrás do sticky em mobile */}
      <div aria-hidden className="md:hidden h-[88px]" />

      <div
        data-mobile-sticky-cta="true"
        className={cn(
          'fixed left-0 right-0 z-40 md:hidden print-hide',
          'bottom-[56px]', // logo acima do BottomNav (min-h-[56px])
          'border-t border-border bg-card/95 backdrop-blur-sm',
          'safe-area-bottom',
          'animate-fade-in',
          className,
        )}
      >
        {helperText && (
          <p className="px-4 pt-2 text-caption text-center text-muted-foreground leading-tight">
            {helperText}
          </p>
        )}
        <div className="flex items-stretch gap-2 px-3 py-2 [&>button]:min-h-[44px]">
          {children}
        </div>
      </div>
    </>
  );
}
