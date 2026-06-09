import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MetricPillProps {
  icon: React.ElementType;
  value: number;
  label: string;
}

export function MetricPill({ icon: Icon, value, label }: MetricPillProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Icon className="h-3 w-3" />
            {value}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top"><p className="text-xs">{label}: {value}</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
