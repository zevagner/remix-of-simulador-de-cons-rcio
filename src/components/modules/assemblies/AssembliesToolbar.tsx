/**
 * AssembliesToolbar — superfície CONSULTIVA (read-only).
 *
 * Onda: Assemblies Legacy Context Removal Wave.
 * Recebe dados via props (sem context legado). Operação administrativa
 * permanece em Admin → Operações de Assembleias.
 */
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { DataUpdateBadge } from '@/components/ui/DataUpdateBadge';
import { getUniqueGroups } from '@/utils/assemblyData';
import type { AssemblyRecord } from '@/types/consortium';

interface AssembliesToolbarProps {
  assemblies: AssemblyRecord[];
  showInsights: boolean;
  setShowInsights: (v: boolean) => void;
}

export function AssembliesToolbar({ assemblies, showInsights, setShowInsights }: AssembliesToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 print-hide px-4 sm:px-6">
      <div>
        <p className="text-muted-foreground">Informações operacionais do grupo selecionado</p>
        <DataUpdateBadge className="mt-1" assemblies={assemblies} />
        <p className="text-xs text-muted-foreground mt-1">
          Imob: {getUniqueGroups(assemblies, 'imobiliario').length} grupos |
          Veículos: {getUniqueGroups(assemblies, 'auto').length} grupos |
          Pesados: {getUniqueGroups(assemblies, 'pesados').length} grupos
        </p>
      </div>

      <div className="flex gap-2 flex-wrap w-full sm:w-auto">
        <Button
          variant={showInsights ? 'default' : 'outline'}
          size="sm"
          className="gap-2 w-full sm:w-auto"
          onClick={() => setShowInsights(!showInsights)}
          disabled={assemblies.length < 10}
        >
          <Sparkles className="h-4 w-4" />
          {showInsights ? 'Ocultar Insights' : 'Insights Comerciais'}
        </Button>
      </div>
    </div>
  );
}
