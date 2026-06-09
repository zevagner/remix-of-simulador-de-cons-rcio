import { useState, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleInfoCardProps {
  storageKey: string;
  children: ReactNode;
  collapsedSummary?: string;
  className?: string;
}

/**
 * Info card that shows fully on first visit, then collapsed.
 * State persisted via sessionStorage.
 */
export function CollapsibleInfoCard({
  storageKey,
  children,
  collapsedSummary,
  className,
}: CollapsibleInfoCardProps) {
  const [expanded, setExpanded] = useState(() => {
    try {
      return sessionStorage.getItem(storageKey) !== 'collapsed';
    } catch {
      return true;
    }
  });

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    try {
      sessionStorage.setItem(storageKey, next ? 'expanded' : 'collapsed');
    } catch {
      // silently fail
    }
  };

  return (
    <Card
      className={cn(
        'border-primary/20 bg-primary/5 no-break cursor-pointer transition-[colors,box-shadow,transform] duration-200',
        className,
      )}
      onClick={toggle}
    >
      <CardContent className={cn('pt-4 pb-4', expanded && 'pt-6')}>
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            {expanded ? (
              children
            ) : (
              <p className="text-sm text-muted-foreground truncate">
                {collapsedSummary ?? 'Toque para expandir'}
              </p>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
          ) : (
            <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
