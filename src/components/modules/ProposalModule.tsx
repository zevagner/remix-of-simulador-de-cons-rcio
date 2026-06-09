/**
 * Unified Proposal Module — Only responsible for generating final proposals.
 * Two tabs: IA and Templates.
 */
import { useState, useMemo, lazy, Suspense, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '@/utils/logger';
import {
  FileText, Sparkles, User, ArrowRight, Target, ChevronDown, ChevronUp, AlertTriangle, Info, Award, MessageSquare,
} from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { NextStepCTA } from '@/components/layout/NextStepCTA';
import { useSimulatorContext } from '@/components/modules/simulator/SimulatorContext';
import { useDiagnosticContextSafe, OBJECTIVE_OPTIONS, SITUATION_OPTIONS } from '@/components/modules/diagnostic/DiagnosticContext';
import { getSubObjetivoTexto } from '@/utils/getSubObjetivoTexto';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatCurrency } from '@/core/finance';
import { CONSORTIUM_TYPE_LABELS } from '@/types/consortium';
import { type ProposalData } from '@/services/proposals/proposalGenerator';
import { ModuleSkeleton } from '@/components/ui/ModuleSkeleton';
import { DelayedFallback } from '@/components/ui/DelayedFallback';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/services/analyticsTracker';
import { DISCLAIMERS } from '@/config/copy';

import { useTrackModuleAccess } from '@/hooks/useTrackModuleAccess';

const ProposalTemplateTab = lazy(() =>
  import('@/components/modules/proposal/ProposalTemplateTab').then(m => ({ default: m.ProposalTemplateTab }))
);
const ProposalAITab = lazy(() =>
  import('@/components/modules/proposal/ProposalAITab').then(m => ({ default: m.ProposalAITab }))
);

const preloadMap: Record<string, () => void> = {
  templates: () => import('@/components/modules/proposal/ProposalTemplateTab'),
  ai: () => import('@/components/modules/proposal/ProposalAITab'),
};

const OBJECTIVE_SUGGESTIONS = [
  'Sair do aluguel',
  'Trocar de carro',
  'Investir em imóvel',
  'Comprar primeiro imóvel',
  'Comprar carro novo',
  'Construir patrimônio',
];

export function ProposalModule() {
  useTrackModuleAccess('proposal');
  const ctx = useSimulatorContext();
  const {
    input, result, isValidSimulation,
    actualFreeBidValue, actualEmbeddedBidValue,
    contemplated, contemplationMonth, postContemplationChoice,
    planModality,
    effectiveClientCost,
    usedCreditForAsset, creditUsageMonth,
    insuranceEnabled,
  } = ctx;

  // Custo a EXIBIR e enviar para a IA/proposta. Fonte de verdade = motor mensal.
  // `result.totalCost` é legado e inclui lance embutido (não é desembolso real).
  // Mantemos fallback p/ não quebrar fluxo se o motor mensal não estiver pronto.
  const displayCost = isValidSimulation && effectiveClientCost > 0
    ? effectiveClientCost
    : result.totalCost;

  // Telemetria de inconsistência (não-bloqueante)
  if (
    import.meta.env.DEV &&
    isValidSimulation &&
    effectiveClientCost > 0 &&
    effectiveClientCost > result.totalCost + 1
  ) {
    // eslint-disable-next-line no-console
    logger.warn('[ProposalModule] Inconsistência: effectiveClientCost > totalCost', {
      effectiveClientCost, totalCost: result.totalCost,
    });
  }
  const diagnosticCtx = useDiagnosticContextSafe();
  const { navigateTo, recommendation, clearRecommendation } = useModuleNavigation();
  const isMobile = useIsMobile();

  // Mapa de rótulos para a recomendação propagada (Investment → Proposta)
  const recommendationLabel = useMemo(() => {
    if (!recommendation) return null;
    if (recommendation.source === 'investment' && recommendation.scenarioName) {
      return { source: 'Investimento', strategy: recommendation.scenarioName };
    }
    return null;
  }, [recommendation]);

  // Auto-seleciona a aba IA quando vem com recomendação (narrativa pré-configurada)
  useEffect(() => {
    if (recommendation) setActiveTab('ai');
  }, [recommendation]);

  const [clientName, setClientName] = useState('');
  const [clientObjective, setClientObjective] = useState('');
  const [clientSituation, setClientSituation] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [activeTab, setActiveTab] = useState('ai');
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);

  // Pre-fill from DiagnosticContext — only empty fields, only once
  const didAutoFill = useRef(false);
  useEffect(() => {
    if (didAutoFill.current || !diagnosticCtx?.hasStarted) return;
    didAutoFill.current = true;
    const filled: string[] = [];
    const d = diagnosticCtx.data;

    if (!clientName && d.clientName) {
      setClientName(d.clientName);
      filled.push('nome');
    }
    if (!clientObjective && d.clientObjective) {
      const label = OBJECTIVE_OPTIONS.find(o => o.value === d.clientObjective)?.label || '';
      if (label) { setClientObjective(label); filled.push('objetivo'); }
    }
    if (!clientSituation && d.clientSituation) {
      const label = SITUATION_OPTIONS.find(o => o.value === d.clientSituation)?.label || '';
      if (label) { setClientSituation(label); filled.push('situação'); }
    }
    if (filled.length > 0) {
      setShowContext(filled.includes('objetivo') || filled.includes('situação'));
      setAutoFilledFields(filled);
    }
  }, [diagnosticCtx]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    trackEvent('proposal_tab_viewed', { module: 'proposal', scenario: tab });
  }, []);

  const creditValue = input.creditValue;
  const termMonths = input.termMonths;
  const typeLabel = CONSORTIUM_TYPE_LABELS[input.consortiumType || 'imobiliario'];

  const displayInstallment = input.reducedInstallment
    ? result.installmentBeforeContemplation
    : result.installmentAfterContemplation;

  const totalBidPercent = creditValue > 0
    ? ((actualFreeBidValue + actualEmbeddedBidValue) / creditValue) * 100
    : 0;

  const scenarioProfile = useMemo(() => {
    if (totalBidPercent >= 30) return 'agressivo' as const;
    if (totalBidPercent >= 10) return 'equilibrado' as const;
    return 'conservador' as const;
  }, [totalBidPercent]);

  const proposalData: ProposalData | null = useMemo(() => {
    if (!isValidSimulation) return null;
    // Quando parcela reduzida está ativa E cliente NÃO está contemplado, propagamos
    // as duas fases (1..maxReduzido / restante..fim) para que o template e a IA
    // descrevam corretamente — sem isso, a parcela única reduzida × prazo total
    // gera narrativa inconsistente com o custo total.
    const phasedReduced = input.reducedInstallment && !contemplated;
    // Seguro Prestamista só passa a vigorar a partir do mês de utilização da carta
    // quando: cliente contemplado, sem seguro marcado desde o início, e toggle ativo.
    const usedCreditActive = contemplated && !insuranceEnabled && usedCreditForAsset;
    return {
      clientName: clientName.trim(),
      creditValue,
      installment: displayInstallment,
      termMonths,
      totalCost: displayCost,
      consortiumType: typeLabel,
      suggestedBidPercent: totalBidPercent > 0 ? totalBidPercent : undefined,
      netCreditValue: result.netCreditValue,
      embeddedBidValue: actualEmbeddedBidValue > 0 ? actualEmbeddedBidValue : undefined,
      contemplated,
      contemplationMonth,
      postContemplationChoice,
      installmentAfterContemplation: displayInstallment,
      scenarioProfile,
      clientObjective: clientObjective.trim() || undefined,
      clientSituation: clientSituation.trim() || undefined,
      reducedInstallment: input.reducedInstallment,
      reducedInstallmentMonths: phasedReduced ? result.reducedInstallmentMonths : undefined,
      reducedInstallmentValue: phasedReduced ? result.reducedInstallmentValue : undefined,
      redilutedInstallmentValue: phasedReduced ? result.redilutedInstallmentValue : undefined,
      subObjetivo: diagnosticCtx?.data.subObjetivo || undefined,
      usedCreditForAsset: usedCreditActive || undefined,
      creditUsageMonth: usedCreditActive ? creditUsageMonth : undefined,
    };
  }, [isValidSimulation, clientName, creditValue, termMonths, result, displayCost, typeLabel, totalBidPercent, actualEmbeddedBidValue, contemplated, contemplationMonth, postContemplationChoice, scenarioProfile, clientObjective, clientSituation, input.reducedInstallment, displayInstallment, diagnosticCtx?.data.subObjetivo, insuranceEnabled, usedCreditForAsset, creditUsageMonth]);

  const handleObjectiveSuggestion = useCallback((suggestion: string) => {
    setClientObjective(suggestion);
    if (!showContext) setShowContext(true);
  }, [showContext]);

  // Empty state
  if (!isValidSimulation) {
    return (
      <div className="space-y-5 animate-fade-in">
        <ModuleHeader title="Proposta" subtitle="Personalize e envie a proposta ao cliente" moduleId="proposal" />
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center gap-6">
            <FileText className="h-12 w-12 text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="text-base font-medium text-foreground">Nenhuma simulação ativa</p>
              <p className="text-sm text-muted-foreground">Faça uma simulação primeiro para gerar propostas comerciais.</p>
            </div>
            <Button onClick={() => navigateTo('simulator')} className="gap-2 mt-2">
              <ArrowRight className="h-4 w-4" />
              Ir para Simulador
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <ModuleHeader title="Proposta" subtitle="Personalize e envie a proposta ao cliente" moduleId="proposal" />


      {/* Banner: estratégia recomendada propagada de Análise/Investimento */}
      {recommendationLabel && (
        <Card className="border-2 border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent animate-fade-in">
          <CardContent className="py-3 px-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-full bg-primary/15">
                <Award className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-caption font-medium text-primary uppercase tracking-wide">
                  Estratégia recomendada · vinda de {recommendationLabel.source}
                </p>
                <p className="text-sm font-bold text-foreground leading-tight">
                  {recommendationLabel.strategy}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRecommendation}
              className="text-xs text-muted-foreground h-8"
            >
              Limpar
            </Button>
          </CardContent>
        </Card>
      )}
      {/* Quick summary — strip inline sem Card; remove chrome redundante (Wave: nested-cards cleanup) */}
      <div id="proposal-simulation-data" className="px-1">
        <div className="grid grid-cols-3 gap-2 md:gap-3 text-center">
          <div className="min-w-0">
            <p className="text-caption text-muted-foreground">Carta</p>
            <p className="text-sm md:text-lg font-bold text-foreground truncate">{formatCurrency(creditValue)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-caption text-muted-foreground">Parcela</p>
            <p className="text-sm md:text-lg font-bold text-primary truncate">{formatCurrency(displayInstallment)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-caption text-muted-foreground">Prazo</p>
            <p className="text-sm md:text-lg font-bold text-foreground truncate">{termMonths}<span className="text-xs font-normal">m</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge variant="secondary" className="text-xs">{typeLabel}</Badge>
          {totalBidPercent > 0 && (
            <Badge variant="outline" className="text-xs">Lance {totalBidPercent.toFixed(1)}%</Badge>
          )}
          {input.reducedInstallment && (
            <Badge variant="outline" className="text-xs text-primary border-primary/30">Parcela reduzida</Badge>
          )}
        </div>
      </div>

      {/* Client personalization */}
      <Card id="proposal-client-name" className="border-border">
        <CardContent className="pt-4 pb-4 space-y-3">
          {/* Client name */}
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
              <User className="h-3 w-3" /> Nome do cliente
            </Label>
            <Input
              value={clientName}
              onChange={(e) => { setClientName(e.target.value); setAutoFilledFields(f => f.filter(x => x !== 'nome')); }}
              placeholder="Ex: João (personaliza a proposta)"
              className="h-10"
            />
          </div>

          {autoFilledFields.length > 0 && (
            <div className="flex items-center gap-1.5 text-caption text-primary/70 px-1">
              <Info className="h-3 w-3 shrink-0" />
              <span>Dados preenchidos automaticamente a partir do Diagnóstico</span>
            </div>
          )}

          {/* Context toggle */}
          <button
            onClick={() => setShowContext(!showContext)}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline w-full justify-center py-1"
          >
            <Target className="h-3 w-3" />
            {showContext ? 'Ocultar contexto do cliente' : 'Personalizar com contexto do cliente'}
            {showContext ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {/* Context fields */}
          {showContext && (
            <div className="space-y-3 animate-fade-in">
              {/* Objective */}
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                  <Target className="h-3 w-3" /> Objetivo do cliente
                  <span className="text-muted-foreground/75">(opcional)</span>
                </Label>
                <Input
                  value={clientObjective}
                  onChange={(e) => setClientObjective(e.target.value)}
                  placeholder="Ex: sair do aluguel, trocar de carro"
                  className="h-10"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {OBJECTIVE_SUGGESTIONS
                    .filter(s => {
                      const isImob = (input.consortiumType || 'imobiliario').includes('imob');
                      if (isImob) return !s.toLowerCase().includes('carro');
                      return !s.toLowerCase().includes('imóvel') && !s.toLowerCase().includes('aluguel');
                    })
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => handleObjectiveSuggestion(s)}
                        className={cn(
                          'text-caption px-2 py-1 rounded-full border transition-[colors,box-shadow,transform]',
                          clientObjective === s
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                </div>
              </div>

              {/* Situation */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">
                  Situação atual <span className="text-muted-foreground/75">(opcional)</span>
                </Label>
                <Textarea
                  value={clientSituation}
                  onChange={(e) => setClientSituation(e.target.value)}
                  placeholder="Ex: paga aluguel de R$ 1.500, quer sair em 2 anos..."
                  className="min-h-[60px] text-sm resize-none"
                  rows={2}
                />
              </div>

              {(clientObjective || clientSituation) && (
                <p className="text-caption text-primary/80 text-center">
                  ✨ A proposta será personalizada com esse contexto
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground">
        Precisa preparar o argumento antes?{' '}
        <button onClick={() => navigateTo('objections')} className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
          Ir para Abordagem →
        </button>
      </p>

      {/* Tabs — only IA and Templates */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-11">
          <TabsTrigger value="ai" className="gap-1.5 text-xs" onMouseEnter={() => preloadMap.ai()}>
            <FileText className="h-3.5 w-3.5" />
            Proposta completa
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5 text-xs" onMouseEnter={() => preloadMap.templates()}>
            <MessageSquare className="h-3.5 w-3.5" />
            Mensagem rápida
          </TabsTrigger>
        </TabsList>

        <Suspense fallback={<DelayedFallback minHeight="50vh"><ModuleSkeleton /></DelayedFallback>}>
          <TabsContent value="ai" className="mt-4">
            {activeTab === 'ai' && (
              <ProposalAITab
                clientName={clientName}
                typeLabel={typeLabel}
                creditValue={creditValue}
                installment={displayInstallment}
                termMonths={termMonths}
                totalCost={displayCost}
                totalBidPercent={totalBidPercent}
                scenarioProfile={scenarioProfile}
                contemplated={contemplated}
                contemplationMonth={contemplationMonth}
                reducedInstallment={input.reducedInstallment}
                reducedInstallmentMonths={input.reducedInstallment && !contemplated ? result.reducedInstallmentMonths : undefined}
                reducedInstallmentValue={input.reducedInstallment && !contemplated ? result.reducedInstallmentValue : undefined}
                redilutedInstallmentValue={input.reducedInstallment && !contemplated ? result.redilutedInstallmentValue : undefined}
                subObjetivo={getSubObjetivoTexto(diagnosticCtx?.data.subObjetivo) || undefined}
                usedCreditForAsset={contemplated && !insuranceEnabled && usedCreditForAsset ? true : undefined}
                creditUsageMonth={contemplated && !insuranceEnabled && usedCreditForAsset ? creditUsageMonth : undefined}
              />
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            {activeTab === 'templates' && proposalData && (
              <ProposalTemplateTab
                proposalData={proposalData}
                clientName={clientName}
                creditValue={creditValue}
                termMonths={termMonths}
                installment={displayInstallment}
                totalCost={displayCost}
                typeLabel={typeLabel}
                totalBidPercent={totalBidPercent}
                planModality={planModality}
              />
            )}
          </TabsContent>
        </Suspense>
      </Tabs>

      {/* Disclaimer obrigatório */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-warning/5 border border-warning/20 text-warning">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed">
          {DISCLAIMERS.INLINE_PROPOSAL}
        </p>
      </div>

      <NextStepCTA
        targetModule="proposals"
        label="Ir para carteira"
        description="Proposta gerada? Acompanhe o status e gerencie seus leads na carteira"
      />
    </div>
  );
}
