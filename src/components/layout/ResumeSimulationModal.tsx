import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RotateCcw, Play, Home, Car } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface SavedSimulationSummary {
  consortiumType: string;
  creditValue: number;
  termMonths: number;
  savedAt: string;
}

interface ResumeSimulationModalProps {
  open: boolean;
  summary: SavedSimulationSummary | null;
  onResume: () => void;
  onNewSimulation: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  imobiliario: 'Imóvel',
  veiculos: 'Veículo',
  pesados: 'Pesados',
};

const TYPE_ICONS: Record<string, typeof Home> = {
  imobiliario: Home,
  veiculos: Car,
};


function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function ResumeSimulationModal({ open, summary, onResume, onNewSimulation }: ResumeSimulationModalProps) {
  if (!summary) return null;

  const Icon = TYPE_ICONS[summary.consortiumType] || Home;
  const typeLabel = TYPE_LABELS[summary.consortiumType] || summary.consortiumType;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-lg">Continuar simulação?</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Você deseja continuar de onde parou ou iniciar uma nova simulação?
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-3 rounded-lg bg-muted/50 border border-border space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{typeLabel}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(summary.creditValue)} • {summary.termMonths} meses
              </p>
            </div>
          </div>
          <p className="text-caption text-muted-foreground">
            Última alteração: {formatDate(summary.savedAt)}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={onResume} className="w-full gap-2">
            <Play className="h-4 w-4" />
            Continuar simulação
          </Button>
          <Button onClick={onNewSimulation} variant="outline" className="w-full gap-2">
            <RotateCcw className="h-4 w-4" />
            Nova simulação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
