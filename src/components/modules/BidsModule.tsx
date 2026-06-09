import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info, ChevronDown, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ResetButton } from '@/components/ui/ResetButton';

import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintableParams } from '@/components/print/PrintableParams';
import { DataUpdateBadge } from '@/components/ui/DataUpdateBadge';
import { JourneyGuideBanner } from '@/components/layout/JourneyGuideBanner';
import { useJourneyGuidance } from '@/hooks/useJourneyGuidance';
import { ModuleSkeleton } from '@/components/ui/ModuleSkeleton';
import { DelayedFallback } from '@/components/ui/DelayedFallback';
import { Separator } from '@/components/ui/separator';
import { PdfDownloadButton } from '@/components/pdf/PdfDownloadButton';
import { PdfEstudoLances } from '@/components/pdf/PdfEstudoLances';

import { BidsProvider, useBidsContext } from './bids/BidsContext';
import { BidsGroupSelector } from './bids/BidsGroupSelector';
import { BidsHeroInsight } from './bids/BidsHeroInsight';
import { BidsGroupInfoCard } from './bids/BidsGroupInfo';
import { BidsZonesCard } from './bids/BidsZonesCard';
import { BidAIRecommendation } from './bids/BidAIRecommendation';
import { BidsChart } from './bids/BidsChart';
import { BidsHistoryTable } from './bids/BidsHistoryTable';
import { BidsSimulationTab } from './bids/BidsSimulationTab';
import { BidsProgressStepper } from './bids/BidsProgressStepper';
import { useTrackModuleAccess } from '@/hooks/useTrackModuleAccess';
import { useBidsStudyResults } from '@/contexts/BidsStudyContext';

// Assembleias virou seção interna de Estudo de Lances ("Histórico do grupo").
// Lazy: só carrega quando o gerente expande a seção.
const AssembliesModule = lazy(() =>
  import('@/components/modules/AssembliesModule').then((m) => ({ default: m.AssembliesModule })),
);

interface BidsModuleProps {
  onApplyBidToSimulator?: (bidData: {
    bidPercent: number;
    zone: 'conservadora' | 'equilibrada' | 'agressiva';
    hasEmbeddedBid: boolean;
    embeddedBidMaxPercent: number;
    groupNumber: number;
    creditRange: string;
  }) => void;
}

export function BidsModule({ onApplyBidToSimulator }: BidsModuleProps) {
  return (
    <BidsProvider onApplyBidToSimulator={onApplyBidToSimulator}>
      <BidsModuleContent />
    </BidsProvider>
  );
}

function BidsModuleContent() {
  useTrackModuleAccess('bids');
  const { assemblies, isLoading, selectedType, selectedGroupNumber, clientBid, showImportWarning, studyData, bidAnalysis, projection, monteCarloProbability, handleReset, typeLabels } = useBidsContext();
  const [showHistory, setShowHistory] = useState(false);

  const guidance = useJourneyGuidance({
    currentModule: 'bids',
    creditValue: 0,
    termMonths: 0,
    hasSimulationResult: false,
    hasBidStudy: !!bidAnalysis,
    hasSelectedGroup: !!selectedGroupNumber,
    contemplated: false,
  });

  // ─── Publicação no BidsStudyContext ───
  // Fonte única de leitura para o PDF. NÃO recalcula — apenas espelha
  // `bidAnalysis` (já produzido por `analyzeBidHistory`).
  const { setResults: setBidsStudyResults } = useBidsStudyResults();
  useEffect(() => {
    if (!selectedGroupNumber || !bidAnalysis) {
      setBidsStudyResults(null);
      return;
    }
    setBidsStudyResults({
      groupNumber: String(selectedGroupNumber),
      avgBid: bidAnalysis.stats.avgOfAvgBids,
      minBid: bidAnalysis.stats.minOfMinBids,
      maxBid: bidAnalysis.stats.maxOfMaxBids,
      recommendedBid: bidAnalysis.recommendation.primaryBid,
      monthsAnalyzed: bidAnalysis.months.length,
      publishedAt: Date.now(),
    });
  }, [selectedGroupNumber, bidAnalysis, setBidsStudyResults]);


  if (isLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <ModuleHeader title="Estudo de Lances" subtitle="Analise probabilidade de contemplação por grupo" />
        <ModuleSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <ModuleHeader title="Estudo de Lances" subtitle="Analise probabilidade de contemplação por grupo" />

      <PrintHeader
        moduleName="Estudo de Lances"
        consortiumType={selectedGroupNumber ? `Grupo ${selectedGroupNumber} - ${typeLabels[selectedType]}` : typeLabels[selectedType]}
      />

      <PrintableParams
        title="Parâmetros do Estudo de Lances"
        params={[
          { label: 'Tipo de Consórcio', value: typeLabels[selectedType] },
          { label: 'Grupo', value: selectedGroupNumber ? `Grupo ${selectedGroupNumber}` : 'Não selecionado' },
          ...(studyData ? [
            { label: 'Faixa de Crédito', value: `R$ ${studyData.creditRange}` },
            { label: 'Lance Embutido', value: studyData.hasEmbeddedBid ? `Até ${studyData.embeddedBidMaxPercent}%` : 'Não permitido' },
          ] : []),
          ...(clientBid > 0 ? [{ label: 'Lance do Cliente', value: `${clientBid.toFixed(2)}%` }] : []),
        ]}
        columns={3}
      />

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 print-hide px-4 sm:px-6">
        <div className="flex-1">
          <DataUpdateBadge assemblies={assemblies} showTrust />
        </div>
        <div className="flex gap-2 flex-wrap w-full sm:w-auto [&_button]:w-full sm:[&_button]:w-auto">
          <div className="flex-1 sm:flex-initial"><ResetButton onReset={handleReset} moduleName="o Estudo de Lances" /></div>
          
          {selectedGroupNumber && studyData && bidAnalysis && (
            <div className="flex-1 sm:flex-initial">
              <PdfDownloadButton
                moduleName="EstudoLances"
                filenameSuffix={`Grupo${selectedGroupNumber}`}
                buildPdfElement={(pdfCtx) => {
                  const data = {
                    studyData, bidAnalysis, clientBid, projection,
                    monteCarloProbability,
                  };
                  const meta = {
                    selectedType, selectedGroupNumber,
                    managerName: pdfCtx.managerName, agencyName: pdfCtx.agencyName,
                    clientName: pdfCtx.clientName,
                    managerRole: pdfCtx.managerRole, managerPhone: pdfCtx.phone,
                    managerWhatsapp: pdfCtx.whatsapp, managerEmail: pdfCtx.email,
                    logoDataUrl: pdfCtx.logoDataUrl,
                  };
                  return <PdfEstudoLances data={data} meta={meta} />;
                }}
              />
            </div>
          )}
        </div>
      </div>

      <Alert className="mx-4 sm:mx-6 border-primary/15 bg-primary/[0.04] py-2.5">
        <Info className="h-3.5 w-3.5" />
        <AlertDescription className="text-xs text-muted-foreground ml-1">
          Análise baseada nos últimos 6 meses de assembleias. Comportamento passado não garante contemplação futura.
        </AlertDescription>
      </Alert>

      {showImportWarning && (
        <Alert variant="destructive" className="mx-4 sm:mx-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dados incompletos</AlertTitle>
          <AlertDescription>
            Os dados dos grupos não estão completos. Acesse o módulo <strong>Assembleias</strong> e clique em <strong>"Importar do Excel"</strong> para carregar todos os grupos das últimas 6 assembleias.
          </AlertDescription>
        </Alert>
      )}

      <BidsGroupSelector />

      {selectedGroupNumber && studyData && bidAnalysis && (
        <>
          <BidsProgressStepper />
          <div className="space-y-10">
            {/* ═══ BLOCO 1: REFERÊNCIA — COMO ESTÁ O GRUPO ═══ */}
            <section id="bids-block-reference" className="space-y-6 scroll-mt-24">
              <div className="px-4 sm:px-6">
                <div className="editorial-section-mark">
                  <span className="editorial-counter">01</span>
                  <span className="module-eyebrow">Referência</span>
                </div>
                <h2 className="editorial-headline">
                  Como o <em>grupo</em> está se comportando
                </h2>
              </div>
              <BidsHeroInsight />
              <BidsGroupInfoCard />
              <BidsChart />
              <BidsHistoryTable />
              <BidsZonesCard />
            </section>

            {/* ═══ BLOCO 2: POSIÇÃO — ONDE SEU LANCE SE POSICIONA ═══ */}
            <section id="bids-block-position" className="space-y-6 scroll-mt-24">
              <div className="px-4 sm:px-6">
                <div className="editorial-section-mark">
                  <span className="editorial-counter">02</span>
                  <span className="module-eyebrow">Posição</span>
                </div>
                <h2 className="editorial-headline">
                  Onde seu <em>lance</em> se posiciona
                </h2>
              </div>
              <BidsSimulationTab />
            </section>

            {/* ═══ BLOCO 3: AÇÃO — O QUE FAZER AGORA ═══ */}
            <section id="bids-block-action" className="space-y-6 scroll-mt-24">
              <div className="px-4 sm:px-6">
                <div className="editorial-section-mark">
                  <span className="editorial-counter">03</span>
                  <span className="module-eyebrow">Ação</span>
                </div>
                <h2 className="editorial-headline">
                  A melhor <em>estratégia</em> diante do que vimos
                </h2>
              </div>
              <div className="px-4 sm:px-6">
                <BidAIRecommendation
                  groupName={`Grupo ${selectedGroupNumber}`}
                  groupType={selectedType}
                  creditRange={studyData.creditRange}
                  bidEmbeddedAllowed={studyData.hasEmbeddedBid}
                  embeddedBidMaxPercent={studyData.embeddedBidMaxPercent}
                  analysis={bidAnalysis}
                  clientBid={clientBid}
                />
              </div>
            </section>
          </div>
        </>
      )}

      {!selectedGroupNumber && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Selecione um tipo de consórcio e um grupo para visualizar a análise de lances</p>
          </CardContent>
        </Card>
      )}

      {selectedGroupNumber && (!studyData || !bidAnalysis) && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Não há dados suficientes para este grupo</p>
            <p className="text-sm text-muted-foreground mt-2">Importe dados de assembleias no módulo "Assembleias" para visualizar a análise</p>
          </CardContent>
        </Card>
      )}

      {/* ─── Histórico do grupo (ex-módulo Assembleias) ─── */}
      <section className="rounded-xl border border-border bg-card/50 print:hidden">
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          aria-expanded={showHistory}
          className="w-full flex items-center justify-between p-card-sm hover:bg-muted/30 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <div className="text-left">
              <h3 className="text-sm font-semibold text-foreground">Histórico do grupo</h3>
              <p className="text-xs text-muted-foreground">
                Ranking de melhores grupos e estatísticas de assembleias.
              </p>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showHistory ? 'rotate-180' : ''}`} />
        </button>
        {showHistory && (
          <div className="border-t border-border p-3">
            <Suspense fallback={<DelayedFallback minHeight="50vh"><ModuleSkeleton /></DelayedFallback>}>
              <AssembliesModule />
            </Suspense>
          </div>
        )}
      </section>

      <JourneyGuideBanner primary={guidance.primary} secondary={guidance.secondary} />

      <PrintFooter />
    </div>
  );
}
