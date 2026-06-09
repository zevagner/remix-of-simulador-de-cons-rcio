import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';

interface NextStepCTAProps {
  targetModule: string;
  label: string;
  description: string;
}

export function NextStepCTA({ targetModule, label, description }: NextStepCTAProps) {
  const { navigateTo } = useModuleNavigation();

  return (
    <div className="print-hide mt-6 flex flex-col items-center gap-2 py-5 px-4 rounded-xl border border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
      <p className="text-xs text-muted-foreground text-center max-w-md">{description}</p>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
        onClick={() => navigateTo(targetModule)}
      >
        {label}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
