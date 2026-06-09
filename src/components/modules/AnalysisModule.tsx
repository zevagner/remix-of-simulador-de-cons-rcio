import { lazy, Suspense, useCallback, useEffect, useMemo } from 'react';
import {
  ArrowLeft, ArrowRight, Stethoscope, Calculator, ShieldCheck,
  TrendingUp, BarChart2, Gavel, Layers, Calendar,
} from 'lucide-react';
import { ModuleSkeleton } from '@/components/ui/ModuleSkeleton';
import { DelayedFallback } from '@/components/ui/DelayedFallback';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ModuleShellContext } from '@/components/layout/ModuleShellContext';
import { useSimulatorInput, useSimulatorResult } from '@/components/modules/simulator/SimulatorContext';
import { useTrackModuleAccess } from '@/hooks/useTrackModuleAccess';
import { useClientJourneySafe } from '@/components/layout/ClientJourneyContext';
import { useIsMobile } from '@/hooks/use-mobile';

import { AnalysisCopilot } from '@/components/ai/AnalysisCopilot';
import { ContextualCommunityWidget } from '@/components/community/ContextualCommunityWidget';
import { ANALYSIS_SUBITEMS, ANALYSIS_TABS, type AnalysisTabId } from '@/config/modules';
import {
  useDiagnosticContext,
  OBJETIVO_PRINCIPAL_OPTIONS,
  getSubObjetivoLabel,
} from '@/components/modules/diagnostic/DiagnosticContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/core/finance';
import { cn } from '@/lib/utils';

// Dynamic imports memoizados — permitem preload via .preload()
const importInvestment = () => import('@/components/modules/wealth/WealthPlatformModule').then(m => ({ default: m.WealthPlatformModule }));
const importPatrimonial = () => import('@/components/modules/wealth/WealthPlatformModule').then(m => ({ default: m.WealthPlatformModule }));
const importWealth = () => import('@/components/modules/wealth/WealthPlatformModule').then(m => ({ default: m.WealthPlatformModule }));
const importComparator = () => import('@/components/modules/ComparatorModule').then(m => ({ default: m.ComparatorModule }));
const importBids = () => import('@/components/modules/BidsModule').then(m => ({ default: m.BidsModule }));
const importStructured = () => import('@/components/modules/StructuredOperationsModule').then(m => ({ default: m.StructuredOperationsModule }));
const importAssemblies = () => import('@/components/modules/AssembliesModule').then(m => ({ default: m.AssembliesModule }));

const InvestmentModule = lazy(importInvestment);
const PatrimonialModule = lazy(importPatrimonial);
const WealthPlatformModule = lazy(importWealth);
const ComparatorModule = lazy(importComparator);
const BidsModule = lazy(importBids);
const StructuredOperationsModule = lazy(importStructured);
const AssembliesModule = lazy(importAssemblies);

interface AnalysisModuleProps {
  /** Submódulo ativo. `null` = renderiza a tela própria do Módulo Análise. */
  activeTab: AnalysisTabId | null;
  onTabChange: (tab: AnalysisTabId | null) => void;
  onNavigateToModule: (moduleId: string) => void;
}

// Idle preload: dispara download dos demais chunks após entrada
function schedulePreload(fns: Array<() => Promise<unknown>>) {
  const run = () => fns.forEach(fn => { try { fn(); } catch { /* noop */ } });
  const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 800);
  }
}

// ─── Labels legíveis (espec do módulo) ──────────────────────────────────────
const PRIORIDADE_LABEL: Record<string, string> = {
  menor_custo: 'Menor custo',
  rapidez: 'Rapidez',
  manter_liquidez: 'Manter liquidez',
  equilibrio: 'Equilíbrio',
};

const URGENCIA_LABEL: Record<string, string> = {
  imediato: 'Imediato',
  curto_prazo: 'Curto prazo',
  sem_pressa: 'Sem pressa',
};

// ─── Cards do Bloco 6 (somente submódulos visíveis no menu) ────────────────
interface ToolCard {
  id: AnalysisTabId;
  icon: React.ElementType;
  title: string;
  description: string;
}
const TOOL_CARDS: ToolCard[] = [
  { id: ANALYSIS_TABS.WEALTH, icon: TrendingUp, title: 'Estratégias Patrimoniais', description: 'Compare e escolha a melhor tese para o cliente' },
  { id: ANALYSIS_TABS.COMPARATOR, icon: BarChart2, title: 'Comparador', description: 'Consórcio vs financiamento vs à vista' },
  { id: ANALYSIS_TABS.BIDS, icon: Gavel, title: 'Estudo de Lances', description: 'Simule lances e antecipe a contemplação' },
  { id: ANALYSIS_TABS.ADVANCED, icon: Layers, title: 'Operações Estruturadas', description: 'Estratégias avançadas para créditos acima de R$ 500k' },
  { id: ANALYSIS_TABS.ASSEMBLIES, icon: Calendar, title: 'Assembleias', description: 'Acompanhe assembleias e chances de contemplação' },
];

// ─── Variantes semânticas do Bloco 4 (semáforo de postura) ─────────────────
// Static map (regra: zero classes dinâmicas via template literals).
const BEHAVIOR_VARIANT: Record<'confiante' | 'neutro' | 'resistente', { className: string; text: string }> = {
  confiante: {
    className: 'border-green-500/30 bg-green-500/5',
    text: 'Cliente confiante — momento ideal para avançar na proposta.',
  },
  neutro: {
    className: 'border-yellow-500/30 bg-yellow-500/5',
    text: 'Cliente neutro — reforce os diferenciais do consórcio CAIXA.',
  },
  resistente: {
    className: 'border-red-500/30 bg-red-500/5',
    text: 'Cliente resistente — use comparativos e cases antes de propor.',
  },
};

export function AnalysisModule({ activeTab, onTabChange, onNavigateToModule }: AnalysisModuleProps) {
  useTrackModuleAccess('analysis');
  const { applyBidFromStudy, input } = useSimulatorInput();
  const { result, isValidSimulation } = useSimulatorResult();
  const { data: diag, hasStarted, clientProfileLabel, clientBehavior } = useDiagnosticContext();
  const journey = useClientJourneySafe();
  const isMobile = useIsMobile();

  const handleApplyBid = useCallback((bidData: Parameters<typeof applyBidFromStudy>[0]) => {
    applyBidFromStudy(bidData);
    journey?.updateSlots({
      bidStrategy: {
        consortiumType: input.consortiumType,
        groupNumber: bidData.groupNumber,
        bidPercent: bidData.bidPercent,
        zone: bidData.zone,
        appliedAt: new Date().toISOString(),
      },
    });
    onNavigateToModule('simulator');
  }, [applyBidFromStudy, onNavigateToModule, journey, input.consortiumType]);

  const currentItem = useMemo(
    () => (activeTab ? ANALYSIS_SUBITEMS.find((s) => s.id === activeTab) ?? null : null),
    [activeTab],
  );
  const shellValue = useMemo(() => ({ suppressHeader: true }), []);

  // Pré-carrega os outros submódulos no idle
  useEffect(() => {
    // schedulePreload removido para garantir carregamento estritamente sob demanda
  }, []);

  const isOnSubmodule = activeTab !== null;

  // ─── Derivações dos blocos da home ──────────────────────────────────────
  const objetivoLabel = useMemo(
    () => OBJETIVO_PRINCIPAL_OPTIONS.find(o => o.value === diag.objetivoPrincipal)?.label ?? '',
    [diag.objetivoPrincipal],
  );
  const subObjetivoLabel = useMemo(
    () => getSubObjetivoLabel(diag.subObjetivo),
    [diag.subObjetivo],
  );

  return (
    <ModuleShellContext.Provider value={shellValue}>
      <div className="space-y-4">
        {/* Header dinâmico — reflete o subitem ativo OU a home do módulo */}
        {activeTab !== ANALYSIS_TABS.WEALTH && (
          <ModuleHeader
            title={currentItem?.label ?? 'Análise'}
            subtitle={currentItem?.hint ?? 'Visão consultiva do cliente e ferramentas de análise'}
            forceShow
            moduleId="analysis"
          />
        )}

        {/* Breadcrumb removido — o ModuleHeader de cada submódulo já identifica o contexto. */}

        {/* Voltar para Análise — apenas mobile, dentro de submódulos */}
        {isMobile && isOnSubmodule && (
          <button
            type="button"
            onClick={() => onTabChange(null)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Análise
          </button>
        )}

        {/* ═══════ HOME do Módulo Análise (nenhum submódulo ativo) ═══════ */}
        <div className={activeTab === null ? '' : 'hidden'}>
          {!hasStarted ? (
            /* BLOCO 0 — Estado vazio */
            <Card className="border-dashed">
              <CardContent className="pt-10 pb-10 flex flex-col items-center text-center gap-4">
                <Stethoscope className="h-12 w-12 text-muted-foreground" />
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold">Diagnóstico não preenchido</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Preencha o diagnóstico do cliente para liberar a análise consultiva.
                  </p>
                </div>
                <Button onClick={() => onNavigateToModule('diagnostic')} className="gap-2">
                  Ir para o Diagnóstico
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-5">
              {/* BLOCO 1 — Identidade do cliente */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-5 pb-5 space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-bold truncate">
                      {diag.clientName || 'Cliente'}
                    </h2>
                    {clientProfileLabel && (
                      <Badge variant="secondary" className="shrink-0">
                        {clientProfileLabel}
                      </Badge>
                    )}
                  </div>
                  {(objetivoLabel || subObjetivoLabel) && (
                    <p className="text-sm text-muted-foreground">
                      {objetivoLabel}
                      {subObjetivoLabel && <> · {subObjetivoLabel}</>}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* BLOCO 2 — Capacidade e perfil */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-4 space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Parcela confortável</p>
                    <p className="text-lg font-bold">{formatCurrency(diag.capacidadeMensal)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4 space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Prioridade</p>
                    <p className="text-lg font-bold">
                      {PRIORIDADE_LABEL[diag.prioridade] || '—'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4 space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Urgência</p>
                    <p className="text-lg font-bold">
                      {URGENCIA_LABEL[diag.urgencia] || '—'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* BLOCO 3 — Status da simulação */}
              <section className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-primary font-bold">
                  Simulação atual
                </p>
                {isValidSimulation ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card>
                      <CardContent className="pt-4 pb-4 space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Carta de Crédito</p>
                        <p className="text-lg font-bold">{formatCurrency(input.creditValue)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4 space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Prazo</p>
                        <p className="text-lg font-bold">{input.termMonths} meses</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4 space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Custo Total</p>
                        <p className="text-lg font-bold">{formatCurrency(result.totalCost)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4 space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Parcela</p>
                        <p className="text-lg font-bold">{formatCurrency(result.fullInstallment)}</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="pt-5 pb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Calculator className="h-6 w-6 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Nenhuma simulação configurada</p>
                      </div>
                      <Button variant="ghost" onClick={() => onNavigateToModule('simulator')} className="gap-2">
                        Ir para o Simulador
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </section>

              {/* BLOCO 4 — Perfil de confiança */}
              {diag.confiancaConsorcio !== '' && (
                <Card className={cn(BEHAVIOR_VARIANT[clientBehavior].className)}>
                  <CardContent className="pt-4 pb-4 flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-foreground/80 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Postura do cliente</p>
                      <p className="text-sm text-foreground/80">
                        {BEHAVIOR_VARIANT[clientBehavior].text}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* BLOCO 5 — AnalysisCopilot */}
              <AnalysisCopilot module="analysis" proactive />


              {/* BLOCO 6 — Ferramentas de análise */}
              <section className="space-y-3 pt-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-bold">
                  Ferramentas de análise
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {TOOL_CARDS.map((card) => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => onTabChange(card.id)}
                        className="group/card text-left rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer p-6 flex flex-col gap-3 min-h-[160px]"
                      >
                        <Icon size={28} className="text-primary" />
                        <div className="space-y-1 flex-1">
                          <h3 className="text-base font-bold">{card.title}</h3>
                          <p className="text-sm text-muted-foreground">{card.description}</p>
                        </div>
                        <div className="flex justify-end">
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover/card:text-primary transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Comunidade contextual — casos parecidos de outros consultores.
                  Renderiza-se sozinho como null quando não há matches. */}
              {isValidSimulation && (
                <ContextualCommunityWidget
                  consortiumType={input.consortiumType}
                  stage="simulacao"
                  onOpenCommunity={() => onNavigateToModule('community')}
                />
              )}
            </div>
          )}
        </div>

        {/* ═══════ Submódulos (renderizados condicionalmente, `hidden` preserva estado) ═══════ */}
        <div className={activeTab === ANALYSIS_TABS.WEALTH ? '' : 'hidden'}>
          <Suspense fallback={<DelayedFallback minHeight="50vh"><ModuleSkeleton /></DelayedFallback>}>
            <WealthPlatformModule />
          </Suspense>
        </div>
        {/* Wave Redirection: investment e patrimonial agora apontam para wealth e usam o mesmo componente */}
        <div className={(activeTab as string) === 'investment' || (activeTab as string) === 'patrimonial' ? '' : 'hidden'}>
          <Suspense fallback={<DelayedFallback minHeight="50vh"><ModuleSkeleton /></DelayedFallback>}>
            <WealthPlatformModule />
          </Suspense>
        </div>
        <div className={activeTab === ANALYSIS_TABS.COMPARATOR ? '' : 'hidden'}>
          <Suspense fallback={<DelayedFallback minHeight="50vh"><ModuleSkeleton /></DelayedFallback>}>
            <ComparatorModule />
          </Suspense>
        </div>
        <div className={activeTab === ANALYSIS_TABS.BIDS ? '' : 'hidden'}>
          <Suspense fallback={<DelayedFallback minHeight="50vh"><ModuleSkeleton /></DelayedFallback>}>
            <BidsModule onApplyBidToSimulator={handleApplyBid} />
          </Suspense>
        </div>
        <div className={activeTab === ANALYSIS_TABS.ADVANCED ? '' : 'hidden'}>
          <Suspense fallback={<DelayedFallback minHeight="50vh"><ModuleSkeleton /></DelayedFallback>}>
            <StructuredOperationsModule />
          </Suspense>
        </div>
        <div className={activeTab === ANALYSIS_TABS.ASSEMBLIES ? '' : 'hidden'}>
          <Suspense fallback={<DelayedFallback minHeight="50vh"><ModuleSkeleton /></DelayedFallback>}>
            <AssembliesModule />
          </Suspense>
        </div>
      </div>
    </ModuleShellContext.Provider>
  );
}
