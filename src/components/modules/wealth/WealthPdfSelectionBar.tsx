/**
 * WealthPdfSelectionBar — barra flutuante de ação para seleção multi-estratégia.
 *
 * Aparece quando ≥1 estratégia está marcada. O botão "Gerar PDF" abre o
 * fluxo padrão (PdfDownloadButton) e produz `PdfEstrategiasPatrimoniais`
 * com a lista filtrada por `selectedIds`.
 */
import { useMemo, lazy, Suspense } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PdfDownloadButton } from '@/components/pdf/PdfDownloadButton';

const PdfEstrategiasPatrimoniais = lazy(() => import('@/components/pdf/PdfEstrategiasPatrimoniais').then(m => ({ default: m.PdfEstrategiasPatrimoniais })));
import { useWealthPdfSelection } from '@/contexts/WealthPdfSelectionContext';
import { useWealthAssumptions } from '@/contexts/WealthAssumptionsContext';
import { useSimulatorInput, useSimulatorResult } from '@/components/modules/simulator/SimulatorContext';
import { STRATEGY_LIBRARY } from './strategyLibraryData';

export function WealthPdfSelectionBar() {
  const { count, clear, selectedIds } = useWealthPdfSelection();
  const { assumptions, calcContext } = useWealthAssumptions();
  const { input } = useSimulatorInput();
  const { result } = useSimulatorResult();

  const selectedStrategies = useMemo(() => {
    const set = new Set(selectedIds);
    // Preserva a ordem em que o usuário selecionou.
    return selectedIds
      .map((id) => STRATEGY_LIBRARY.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => !!s && set.has(s.id));
  }, [selectedIds]);

  if (count === 0) return null;

  const label =
    count === 1 ? '1 estratégia selecionada' : `${count} estratégias selecionadas`;

  return (
    <div
      role="region"
      aria-label="Seleção de estratégias para PDF"
      className="fixed inset-x-0 bottom-0 z-40 pointer-events-none px-3 pb-3 md:pb-5"
    >
      <div className="mx-auto max-w-3xl pointer-events-auto rounded-2xl border border-border/70 bg-background/95 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.25)] backdrop-blur px-4 py-3 md:px-5 md:py-3.5 flex items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex h-7 min-w-7 px-2 items-center justify-center rounded-full bg-primary text-primary-foreground text-caption font-semibold tabular-nums">
            {count}
          </span>
          <span className="text-body font-medium text-foreground truncate">{label}</span>
        </div>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">Limpar seleção</span>
          <span className="sm:hidden">Limpar</span>
        </Button>
        <PdfDownloadButton
          moduleName="EstrategiasPatrimoniais"
          filenameSuffix={count > 1 ? `${count}-estrategias` : selectedStrategies[0]?.id}
          label="Gerar PDF"
          buildPdfElement={(pdfCtx) => (
            <Suspense fallback={null}>
              <PdfEstrategiasPatrimoniais
                data={{
                  strategies: selectedStrategies,
                  simulatorInput: input ?? null,
                  simulatorResult: result ?? null,
                  assumptions,
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
            </Suspense>
          )}
        />
      </div>
    </div>
  );
}
