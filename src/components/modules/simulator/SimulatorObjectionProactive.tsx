import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { useSimulatorInput, useSimulatorResult } from './SimulatorContext';
import { OBJECTIONS } from '@/data/objections/data';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';

export function SimulatorObjectionProactive() {
  const { input } = useSimulatorInput();
  const { isValidSimulation } = useSimulatorResult();
  const { navigateTo } = useModuleNavigation();

  const relevantObjection = useMemo(() => {
    if (!isValidSimulation) return null;

    // Logic to select the best objection
    const type = input.consortiumType;
    const value = input.creditValue;

    // Priority 1: Match tags for consortium type
    const typeTags = {
      imobiliario: ['imovel', 'imobiliário', 'casa', 'apartamento', 'FGTS', 'aluguel'],
      auto: ['carro', 'veiculo', 'automóvel'],
      pesados: ['caminhão', 'frota', 'equipamento', 'máquina'],
    }[type as string] || [];

    let pool = OBJECTIONS.filter(obj => 
      obj.tags?.some(tag => typeTags.includes(tag.toLowerCase()))
    );

    // Priority 2: If value is high, prioritize 'investidor' or 'planejamento'
    if (value > 500000) {
      const highValueObjections = OBJECTIONS.filter(obj => 
        obj.tags?.includes('investidor') || obj.tags?.includes('custo total')
      );
      pool = [...highValueObjections, ...pool];
    }

    // Priority 3: Common objections if pool is empty
    if (pool.length === 0) {
      pool = OBJECTIONS.filter(obj => ['urgencia', 'tempo', 'preco'].includes(obj.category));
    }

    // Pick one stably for this simulation session if possible
    const seed = Math.floor(value / 1000) || 1;
    return pool[seed % pool.length] || pool[0];
  }, [isValidSimulation, input.consortiumType, input.creditValue]);

  if (!relevantObjection || !isValidSimulation) return null;

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
      <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <MessageSquare className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary/60">Argumentação Sugerida</span>
            <span className="h-1 w-1 rounded-full bg-primary/30" />
            <h4 className="text-sm font-bold text-foreground truncate">
              "{relevantObjection.clientPhrase}"
            </h4>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">
            {relevantObjection.response}
          </p>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigateTo('objections')}
          className="h-8 text-[11px] font-semibold text-primary hover:text-primary hover:bg-primary/10 gap-1.5 shrink-0"
        >
          Ver mais argumentos
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
