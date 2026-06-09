import { CheckCircle2, AlertTriangle, Calendar, ShieldCheck } from 'lucide-react';
import { AssemblyRecord } from '@/types/consortium';
import { parseAssemblyMonth } from '@/utils/assemblyData';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface DataUpdateBadgeProps {
  className?: string;
  assemblies?: AssemblyRecord[];
  compact?: boolean;
  /** Show the trust reinforcement line */
  showTrust?: boolean;
}

function getDataFreshness(assemblies?: AssemblyRecord[]) {
  if (!assemblies || assemblies.length === 0) {
    return {
      label: 'Sem dados importados',
      status: 'empty' as const,
      tooltip: 'Importe dados de assembleias para utilizar as funcionalidades.',
      trustLine: '',
    };
  }

  const months = [...new Set(assemblies.map(a => a.assemblyMonth))];
  months.sort((a, b) => parseAssemblyMonth(b).getTime() - parseAssemblyMonth(a).getTime());
  const latestMonth = parseAssemblyMonth(months[0]);
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const monthLabel = `${monthNames[latestMonth.getMonth()]}/${latestMonth.getFullYear()}`;

  const createdDates = assemblies
    .map(a => a.createdAt ? new Date(a.createdAt).getTime() : 0)
    .filter(t => t > 0);
  const lastImport = createdDates.length > 0 ? new Date(Math.max(...createdDates)) : null;
  const lastImportLabel = lastImport
    ? lastImport.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  const now = new Date();
  const diffMonths = (now.getFullYear() - latestMonth.getFullYear()) * 12 + (now.getMonth() - latestMonth.getMonth());
  const status = diffMonths > 2 ? 'stale' as const : 'fresh' as const;

  const trustLine = status === 'fresh'
    ? 'Dados atualizados e confiáveis'
    : 'Dados podem não refletir o cenário atual';

  const tooltip = [
    `📅 Dados até: ${monthLabel}`,
    `📊 ${months.length} mês(es) de histórico`,
    lastImportLabel ? `🔄 Última importação: ${lastImportLabel}` : null,
    '',
    status === 'fresh'
      ? '✅ Baseado em dados reais recentes — análises e recomendações refletem o cenário atual do mercado.'
      : '⚠️ Os dados podem estar desatualizados. Importe assembleias recentes para maior precisão.',
  ].filter(v => v !== null).join('\n');

  return { label: monthLabel, status, tooltip, lastImportLabel, trustLine };
}

export function DataUpdateBadge({ className = '', assemblies, compact = false, showTrust = false }: DataUpdateBadgeProps) {
  const { label, status, tooltip, lastImportLabel, trustLine } = getDataFreshness(assemblies);

  const StatusIcon = status === 'fresh' ? CheckCircle2 : status === 'stale' ? AlertTriangle : Calendar;
  const statusColor = status === 'fresh' ? 'text-success' : status === 'stale' ? 'text-warning' : 'text-muted-foreground';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex flex-col gap-0.5 ${className}`}>
            <span className={`inline-flex items-center gap-1.5 text-xs ${statusColor}`}>
              <StatusIcon className="h-3 w-3 shrink-0" />
              {status === 'empty' ? (
                'Sem dados importados'
              ) : compact ? (
                `Até ${label}`
              ) : (
                <>
                  📅 Dados até: {label}
                  {lastImportLabel && (
                    <span className="text-muted-foreground ml-1">• Importado: {lastImportLabel}</span>
                  )}
                </>
              )}
            </span>
            {showTrust && status !== 'empty' && (
              <span className="inline-flex items-center gap-1 text-caption leading-tight text-muted-foreground/70">
                <ShieldCheck className="h-2.5 w-2.5 shrink-0" />
                {trustLine}
              </span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="whitespace-pre-line text-xs max-w-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
