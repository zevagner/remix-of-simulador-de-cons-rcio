import { AlertCircle } from 'lucide-react';

export function SimulatorDisclaimerCard() {
  return (
    <div className="no-break rounded-md border border-border/60 bg-muted/20 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/70 mt-0.5 shrink-0" />
        <div className="space-y-1.5 text-caption leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground/80">Informações importantes:</strong>{' '}
            valores apresentados são <strong>estimativas</strong> e podem variar conforme condições do grupo.
            Contemplação ocorre por <strong>sorteio ou lance</strong>, sem garantia de prazo.
            Parcelas podem sofrer reajustes conforme regulamento e índices aplicáveis.
            Condições finais seguem o regulamento vigente.
          </p>
          <p className="text-foreground/70">
            Esta ferramenta é apoio à decisão e <strong>não constitui promessa</strong> de contemplação ou rentabilidade.
          </p>
        </div>
      </div>
    </div>
  );
}
