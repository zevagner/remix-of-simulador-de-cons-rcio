/**
 * ConsultiveBridge — ponte consultiva entre módulos da jornada patrimonial.
 *
 * Onda C1 — Consultive Continuity & Narrative Cohesion.
 *
 * Princípios:
 *   • Linguagem única ("continuidade", "próximo nível", "evolução").
 *   • Visual leve — não compete com cards executivos.
 *   • Direção semântica via `direction`:
 *       - "forward":  evolução natural (Investimentos → Patrimonial → Legado).
 *       - "lateral":  continuidade entre vistas do mesmo nível (ex.: voltar
 *                     ao Investimentos para detalhamento numérico).
 *   • Zero motor financeiro, zero IA, zero dependência de Supabase.
 */
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

export interface ConsultiveBridgeProps {
  /** Microcategoria — uppercase, ex.: "Continuidade patrimonial". */
  eyebrow: string;
  /** Título curto, sem verbo de marketing. */
  title: string;
  /** 1 linha consultiva (≤ 140 chars). */
  description: string;
  /** Texto do CTA. */
  ctaLabel: string;
  /** Ação ao clicar no CTA. */
  onCta: () => void;
  /** Ícone à esquerda (default Building2 não importado para manter peso). */
  icon?: LucideIcon;
  /** Direção semântica da ponte. */
  direction?: 'forward' | 'lateral';
  /** Esconde quando dados ainda não estão disponíveis (opcional). */
  disabled?: boolean;
}

export function ConsultiveBridge({
  eyebrow,
  title,
  description,
  ctaLabel,
  onCta,
  icon: Icon,
  direction = 'forward',
  disabled = false,
}: ConsultiveBridgeProps) {
  const ChevronIcon = direction === 'forward' ? ArrowUpRight : ArrowRight;

  return (
    <div
      className={[
        'group relative flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border px-4 py-3 print-hide',
        direction === 'forward'
          ? 'border-primary/20 bg-gradient-to-r from-primary/[0.05] via-card to-card'
          : 'border-border bg-card',
      ].join(' ')}
      role="region"
      aria-label={eyebrow}
    >
      {Icon && (
        <div
          className={[
            'rounded-lg p-2 shrink-0',
            direction === 'forward'
              ? 'bg-primary/12 text-primary'
              : 'bg-muted text-muted-foreground',
          ].join(' ')}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-caption uppercase tracking-wider text-muted-foreground font-semibold">
          {eyebrow}
        </p>
        <p className="text-sm font-semibold text-foreground leading-tight mt-0.5">
          {title}
        </p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {description}
        </p>
      </div>

      <Button
        size="sm"
        variant={direction === 'forward' ? 'default' : 'outline'}
        className="gap-2 shrink-0 self-start sm:self-center"
        onClick={onCta}
        disabled={disabled}
      >
        {ctaLabel}
        <ChevronIcon className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </div>
  );
}
