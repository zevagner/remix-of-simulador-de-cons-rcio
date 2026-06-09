import { useEffect, useState, useCallback } from 'react';
import { BarChart3, Crosshair, Lightbulb, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'bids-block-reference', label: 'O Grupo', icon: BarChart3 },
  { id: 'bids-block-position', label: 'Sua Posição', icon: Crosshair },
  { id: 'bids-block-action', label: 'O que Fazer', icon: Lightbulb },
] as const;

export function BidsProgressStepper() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    STEPS.forEach((step, idx) => {
      const el = document.getElementById(step.id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveIndex(idx);
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="sticky top-0 z-10 bg-background border-b py-3 px-4 sm:px-6 print-hide">
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === activeIndex;
          const isCompleted = idx < activeIndex;

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => scrollTo(step.id)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div
                  className={cn(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors',
                    isActive && 'bg-primary text-primary-foreground shadow-sm',
                    isCompleted && 'bg-primary/20 text-primary',
                    !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                </div>
                <span
                  className={cn(
                    'text-caption sm:text-xs font-medium transition-colors',
                    isActive && 'text-primary',
                    isCompleted && 'text-primary/70',
                    !isActive && !isCompleted && 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </button>

              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 mt-[-16px] sm:mt-[-18px] transition-colors',
                    idx < activeIndex ? 'bg-primary/40' : 'bg-muted'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
