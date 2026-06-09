/**
 * StrategyCardHeader — header unificado de cards de estratégia.
 *
 * Investments & Patrimonial Experience Unification Wave.
 *
 * Padrão visual base = Patrimonial (icon block + gradient suave + tag badge).
 * Suporta slot opcional à direita (Crown "Melhor", Checkbox de seleção, etc.)
 * para preservar as forças do Investments (compare mode + best-pick).
 *
 * Sem motor financeiro, sem IA — puramente presentational.
 */
import { isValidElement, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  icon: LucideIcon | ReactNode;
  title: string;
  /** Tag/chip institucional curto (≤ 3 palavras). */
  tag?: string;
  /** Subtítulo curto de 1 linha (tese resumida). */
  subtitle?: string;
  /** Slot à esquerda (ex.: Checkbox de seleção). */
  leading?: ReactNode;
  /** Slot à direita (ex.: badge "Melhor"). */
  trailing?: ReactNode;
}

export function StrategyCardHeader({
  icon, title, tag, subtitle, leading, trailing,
}: Props) {
  // Investments envia ReactElement pronto (<Icon />); Patrimonial envia o componente Lucide.
  // ReactElement também tem $$typeof, então precisa ser separado antes de tratar como Component.
  const iconNode = isValidElement(icon) ? icon : null;
  const isComponent = !iconNode && (
    typeof icon === 'function' ||
    (typeof icon === 'object' && icon !== null && 'render' in (icon as object))
  );
  const Icon = isComponent ? (icon as LucideIcon) : null;
  return (
    <div className="px-4 py-3 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border/40 flex items-start gap-3">
      {leading}
      <div className="rounded-lg bg-primary/15 p-2 text-primary shrink-0">
        {Icon ? <Icon className="h-5 w-5" aria-hidden /> : (iconNode ?? (icon as ReactNode))}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-base leading-tight text-foreground">{title}</h3>
          {tag && (
            <Badge variant="secondary" className="text-caption uppercase tracking-wide font-semibold">
              {tag}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-caption text-muted-foreground mt-0.5 leading-snug line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}
