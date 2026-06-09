import logoConsorcio from '/logo-consorcio.png';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  variant?: 'light' | 'dark';
  compact?: boolean;
  className?: string;
  onClick?: () => void;
}

export function BrandLogo({ variant = 'light', compact = false, className, onClick }: BrandLogoProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center focus:outline-none cursor-pointer',
        className
      )}
      aria-label="Simulador de Consórcio Inteligente — Ir para o início"
    >
      <img
        src={logoConsorcio}
        alt="Simulador de Consórcio Inteligente"
        className={cn(
          'object-contain',
          compact ? 'h-8' : 'h-12 md:h-14'
        )}
        draggable={false}
      />
    </button>
  );
}
