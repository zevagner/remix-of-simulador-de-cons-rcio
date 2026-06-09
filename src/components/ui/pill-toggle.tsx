import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface PillToggleOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

interface PillToggleProps<T extends string> {
  options: PillToggleOption<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  tooltip?: string;
  className?: string;
  itemClassName?: string;
}

/**
 * Pill toggle navy padrão da plataforma.
 * Container: border + bg-gray-100 + rounded-full
 * Ativo: bg-[#003641] text-white shadow-sm
 * Inativo: bg-transparent text-gray-400 hover:text-gray-600
 */
export function PillToggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  tooltip,
  className,
  itemClassName,
}: PillToggleProps<T>) {
  // Tap target ≥ 44px (WCAG 2.5.5 + regra interna mobile UX).
  const baseItem =
    'cursor-pointer rounded-full px-4 h-11 min-w-[44px] text-xs font-medium transition-all duration-150 flex items-center justify-center';
  const active = 'bg-[#003641] text-white shadow-sm';
  const inactive = 'bg-transparent text-gray-400 hover:text-gray-600';

  const group = (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-gray-100 p-0.5',
        className,
      )}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(opt.value)}
            className={cn(baseItem, isActive ? active : inactive, itemClassName)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  if (!tooltip) return group;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{group}</TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
