import { useMemo } from 'react';
import { FileDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PdfDownloadButton } from '@/components/pdf/PdfDownloadButton';
import { PdfEstrategiaPatrimonial } from '@/components/pdf/proposalPdf/PdfEstrategiaPatrimonial';
import { STRATEGY_LIBRARY } from './strategyLibraryData';
import { useActiveStrategySafe } from '@/contexts/ActiveStrategyContext';
import { useWealthAssumptions } from '@/contexts/WealthAssumptionsContext';
import { useSimulatorInput } from '@/components/modules/simulator/SimulatorContext';

/**
 * WealthPdfButton — gera PDF do módulo Estratégias Patrimoniais.
 *
 * Modo: Tese atual (detalhada) — usa `ActiveStrategyContext` (estratégia
 * selecionada em Library ou Compare). Sem cálculo novo: apenas lê estado
 * existente e delega ao template puro.
 *
 * Nota (Wave 2): o modo "Comparativo" dependia de `CompareSelectionContext`
 * da árvore strategy-v2 removida — esse provider nunca foi montado em
 * runtime, então a opção não era acionável. Reintroduzir comparativo aqui
 * exige um provider novo dentro da arquitetura consolidada.
 */
export function WealthPdfButton() {
  const activeStrategy = useActiveStrategySafe()?.activeStrategy ?? null;
  const { calcContext } = useWealthAssumptions();
  const { input } = useSimulatorInput();

  const creditValue = input?.creditValue ?? 0;

  const singleStrategy = useMemo(
    () => (activeStrategy ? STRATEGY_LIBRARY.find((s) => s.id === activeStrategy.id) ?? null : null),
    [activeStrategy],
  );

  const canSingle = !!singleStrategy;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={!canSingle}
          className="gap-2"
          aria-label="Gerar PDF da estratégia"
        >
          <FileDown className="h-4 w-4" />
          Gerar PDF
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3 space-y-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            PDF da tese ativa
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Geramos um PDF com a capa institucional, KPIs canônicos e premissas vivas do módulo.
          </p>
        </div>

        <div className="rounded-md border border-border/60 p-2.5 space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Tese atual (detalhada)
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {singleStrategy
              ? <>Estratégia ativa: <span className="font-medium text-foreground">{singleStrategy.title}</span>.</>
              : 'Selecione uma estratégia na biblioteca ou no Comparativo para ativar.'}
          </p>
          <PdfDownloadButton
            disabled={!canSingle}
            moduleName="EstrategiaPatrimonial"
            filenameSuffix={singleStrategy?.id}
            buildPdfElement={(pdfCtx) => (
              <PdfEstrategiaPatrimonial
                data={{
                  mode: 'single',
                  strategies: singleStrategy ? [singleStrategy] : [],
                  creditValue,
                  calcContext,
                  clientName: pdfCtx.clientName,
                  consultorName: pdfCtx.managerName,
                  managerName: pdfCtx.managerName,
                  managerRole: pdfCtx.managerRole,
                  agencyName: pdfCtx.agencyName,
                  managerPhone: pdfCtx.phone,
                  managerWhatsapp: pdfCtx.whatsapp,
                  managerEmail: pdfCtx.email,
                  logoDataUrl: pdfCtx.logoDataUrl,
                }}
              />
            )}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
