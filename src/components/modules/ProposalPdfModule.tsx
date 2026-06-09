/**
 * ProposalPdfModule — wizard de geração da Proposta Premium em PDF.
 *
 * Fluxo:
 *  1. Base (Diagnóstico + Simulação — sempre incluídos)
 *  2. Comparações (financiamento, à vista, estratégia de lance/renda/venda)
 *  3. Aprofundamento (estudo de lances, contemplação)
 *  4. Convencimento (storytelling, argumentos, objeções)
 *
 * O usuário marca o que quer; a ordem do PDF é AUTOMÁTICA (sortBlocks).
 * Storytelling: estratégia híbrida — usa cache; senão, usa narrativa default.
 */
import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { useSimulatorInput, useSimulatorResult } from '@/components/modules/simulator/SimulatorContext';
import { useDiagnosticContextSafe } from '@/components/modules/diagnostic/DiagnosticContext';
import { useClientJourneySafe } from '@/components/layout/ClientJourneyContext';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { getStorytelling } from '@/utils/storytellingCache';
import { useDebouncedLocalStorageString } from '@/utils/storage/throttledWriter';
import { useStorytellingAutoGen } from './proposalPdf/useStorytellingAutoGen';
import { getSubObjetivoTexto } from '@/utils/getSubObjetivoTexto';
import { logger } from '@/utils/logger';
import {
  PROPOSAL_BLOCKS, defaultSelectedIds, sortBlocks, type ProposalBlockDef,
} from '@/utils/proposalPdf/sections';
import { PdfDownloadButton, type PdfBuildContext } from '@/components/pdf/PdfDownloadButton';
import {
  getMissingDataBlocks,
  type PdfPropostaCompletaData,
} from '@/components/pdf/PdfPropostaCompleta';

const PdfPropostaCompleta = lazy(() => import('@/components/pdf/PdfPropostaCompleta').then(m => ({ default: m.PdfPropostaCompleta })));
import { useCentralAI } from '@/hooks/useCentralAI';
import { calculateFinancingCost } from '@/core/finance';
import { BUSINESS_RULES } from '@/config/businessRules';
import { Sparkles, FileText, AlertTriangle, CheckCircle2, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { trackEvent } from '@/services/analyticsTracker';
import { validateImpactValues } from '@/utils/proposalPdf/impactValidation';
const ProposalPdfPreviewDialog = lazy(() => import('@/components/pdf/ProposalPdfPreviewDialog').then(m => ({ default: m.ProposalPdfPreviewDialog })));
import { useInvestmentResults } from '@/contexts/InvestmentResultsContext';
import { FollowupCard } from './proposalPdf/FollowupCard';
import { useBidsStudyResults } from '@/contexts/BidsStudyContext';
import { useActiveStrategySafe } from '@/contexts/ActiveStrategyContext';
import { readWealthCalcContextFromStorage, useWealthAssumptionsSafe } from '@/contexts/WealthAssumptionsContext';
import { useStructuredOpsResults } from '@/contexts/StructuredOpsResultsContext';
import { STRATEGY_LIBRARY } from '@/components/modules/wealth/strategyLibraryData';
import { typeLabels as STRUCTURED_TYPE_LABELS } from '@/components/modules/structured-ops/structuredOpsConstants';

const CATEGORY_META = {
  base: { title: '1. Base do estudo', subtitle: 'Sempre incluído — entendimento do cliente e cenário.' },
  comparison: { title: '2. Comparações e estratégia', subtitle: 'Marque o que faz sentido para esta venda.' },
  depth: { title: '3. Aprofundamento (opcional)', subtitle: 'Adicione prova técnica quando quiser reforçar credibilidade.' },
  persuasion: { title: '4. Convencimento (recomendado)', subtitle: 'Eleva a proposta de técnica para consultiva.' },
} as const;

export function ProposalPdfModule() {
  const simInput = useSimulatorInput();
  const simResult = useSimulatorResult();
  const sim = { ...simInput, ...simResult };
  const diag = useDiagnosticContextSafe();
  const journey = useClientJourneySafe();
  const userId = useCurrentUserId();
  const centralAI = useCentralAI();
  const { results: investment } = useInvestmentResults();
  const { results: bidsStudy } = useBidsStudyResults();
  const activeStrategyCtx = useActiveStrategySafe();
  const { results: structuredOps } = useStructuredOpsResults();
  // Wealth parametric continuity: usa context se montado, senão lê do localStorage
  // (premissas vivas persistidas pelo WealthPlatformModule). Garante que os KPIs
  // editoriais da tese reflitam o cenário ajustado pelo consultor.
  const wealthCalcCtx = useWealthAssumptionsSafe()?.calcContext ?? readWealthCalcContextFromStorage();

  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultSelectedIds()));

  // Mensagens personalizadas do gerente (abertura/fechamento) — persistidas por userId.
  const openingStorageKey = userId ? `proposalPdf:customOpening:${userId}` : null;
  const closingStorageKey = userId ? `proposalPdf:customClosing:${userId}` : null;
  const [customOpening, setCustomOpening] = useState<string>(() => {
    if (typeof window === 'undefined' || !openingStorageKey) return '';
    try { return localStorage.getItem(openingStorageKey) ?? ''; } catch { return ''; }
  });
  const [customClosing, setCustomClosing] = useState<string>(() => {
    if (typeof window === 'undefined' || !closingStorageKey) return '';
    try { return localStorage.getItem(closingStorageKey) ?? ''; } catch { return ''; }
  });
  // Wave 5 — Storage Write Throttling: textareas (300 chars) escrevem por tecla.
  // Debounce 220ms + bailout + flush no unmount preserva último valor digitado.
  const persistOpening = useDebouncedLocalStorageString(openingStorageKey ?? '__noop__');
  const persistClosing = useDebouncedLocalStorageString(closingStorageKey ?? '__noop__');
  const updateOpening = (v: string) => {
    const trimmed = v.slice(0, 300);
    setCustomOpening(trimmed);
    if (openingStorageKey) persistOpening(trimmed);
  };
  const updateClosing = (v: string) => {
    const trimmed = v.slice(0, 300);
    setCustomClosing(trimmed);
    if (closingStorageKey) persistClosing(trimmed);
  };


  const validSimulation = sim.isValidSimulation;

  const blocksByCategory = useMemo(() => {
    const map: Record<string, ProposalBlockDef[]> = { base: [], comparison: [], depth: [], persuasion: [] };
    for (const b of PROPOSAL_BLOCKS) map[b.category].push(b);
    return map;
  }, []);

  const orderedSelected = useMemo(() => sortBlocks([...selected]), [selected]);

  // Storytelling auto-gen: hook isolado (Sprint B.2).
  // Auto-trigger interno quando bloco está selecionado e não há cache.
  const {
    autoGenerating,
    hasAnyStorytellingCached,
    cachedList,
    ensureStorytelling,
  } = useStorytellingAutoGen({
    userId,
    centralAI,
    enabled: selected.has('storytelling'),
  });

  const toggle = (id: string, required?: boolean) => {
    if (required) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  /**

   * Monta o PdfPropostaCompletaData compartilhado entre o PDF real e o preview HTML.
   * - mode='strict' (PDF real): valida impacto, dispara toast/erro se inválido, dispara trackEvents.
   * - mode='preview': tolera valores ausentes (usa fallbacks neutros), nome de cliente placeholder,
   *   sem trackEvent. Retorna null apenas se a simulação for completamente inutilizável.
   */
  const buildData = (
    ctx: PdfBuildContext,
    mode: 'strict' | 'preview',
  ): PdfPropostaCompletaData | null => {
    const impact = validateImpactValues({
      effectiveClientCost: sim.effectiveClientCost,
      totalCost: sim.result.totalCost,
      creditValue: sim.input.creditValue,
    });
    // Em strict, exige valores de impacto válidos. Em preview, aceita fallback (página tem MissingDataNote).
    if (impact.ok === false && mode === 'strict') {
      toast.error('Não é possível gerar o PDF', { description: impact.error });
      throw new Error(`[ProposalPdf] Impact values invalid: ${impact.error}`);
    }
    const impactValues = impact.ok ? impact.values : {
      paga: sim.effectiveClientCost || sim.result.totalCost || 0,
      acessa: sim.input.creditValue || 0,
    };
    if (impact.ok && impact.usedFallback && mode === 'strict') {
      toast.warning('Custo efetivo indisponível', {
        description: 'Usando o custo total do plano como fallback no bloco de impacto.',
      });
    }

    const cachedStory = cachedList[0]?.entry?.text;

    let comparisons: PdfPropostaCompletaData['comparisons'] | undefined;
    if (sim.input.creditValue > 0 && sim.input.termMonths > 0) {
      const fin = calculateFinancingCost(
        sim.input.creditValue,
        sim.input.termMonths,
        BUSINESS_RULES.financing.annualRate,
        BUSINESS_RULES.financing.mipRate,
        BUSINESS_RULES.financing.dfiRate,
        BUSINESS_RULES.financing.monthlyAdminFee,
      );
      comparisons = {
        financingTotal: fin.priceTotalCost,
        financingMonthly: fin.priceMonthlyPayment,
        financingRate: BUSINESS_RULES.financing.annualRate,
      };
    }

    // Bloco "Consórcio × À Vista": fonte ÚNICA = `investment.cashComparison`
    // (engine canônica `useCashComparison`, mesma da UI). Proibido heurística,
    // proibido cálculo paralelo, proibido fallback financeiro. Se a sessão
    // ainda não computou o cash (usuário não abriu o Investimento), a página
    // é descartada pelo gate de integridade — sem texto inventado.
    const wantsCash = orderedSelected.some((b) => b.id === 'cmp-cash');
    if (wantsCash && investment?.cashComparison) {
      const cash = investment.cashComparison;
      const fmt = (n: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
      const months = cash.termMonths;
      const propertyValue = cash.propertyValue;
      const finalNet = cash.consortiumFinalPatrimony;
      const diff = cash.patrimonyDifference;
      const diffPct = cash.patrimonyDifferencePercent;
      const monthlyYield = cash.monthlyYield;
      const monthlyInstallment = cash.monthlyInstallment;
      const capitalInvested = cash.capitalToInvest;
      comparisons = {
        ...(comparisons ?? {}),
        cashImpact:
          `Pagar à vista significa retirar ${fmt(propertyValue)} da sua reserva hoje — ` +
          `e ficar com exatamente ${fmt(propertyValue)} em patrimônio final.\n\n` +
          `Com consórcio alavancado, ${fmt(capitalInvested)} permanecem investidos rendendo ` +
          `${fmt(monthlyYield)}/mês, cobrindo grande parte da parcela de ${fmt(monthlyInstallment)} ` +
          `ao longo de ${months} meses.\n\n` +
          `Patrimônio final projetado: ${fmt(finalNet)} ` +
          `— ${diff >= 0 ? 'vantagem' : 'desvantagem'} de ${fmt(Math.abs(diff))} ` +
          `(${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(1)}%) sobre a compra à vista.\n\n` +
          `Você acessa o bem sem sacrificar a reserva — mantém capital de giro ` +
          `para emergências, oportunidades e novos projetos.`,
      };
    }

    const bidPercent = journey?.slots?.bidStrategy?.bidPercent;
    const bidValueFromJourney = bidPercent != null && sim.input.creditValue > 0
      ? Math.round((bidPercent / 100) * sim.input.creditValue)
      : undefined;
    const bidValueFromSim = (sim.actualFreeBidValue ?? 0) > 0 ? sim.actualFreeBidValue : undefined;
    const bidValueResolved = bidValueFromJourney ?? bidValueFromSim;
    const bidPercentResolved = bidPercent != null
      ? bidPercent
      : bidValueFromSim && sim.input.creditValue > 0
        ? (bidValueFromSim / sim.input.creditValue) * 100
        : undefined;

    // ─── Estratégia: lance (já existente) + dados de Investimento via context ───
    // Os campos `incomeMonthly`, `saleProfit` e `contemplationMonth` vêm do
    // `InvestmentResultsContext`, alimentado pelo `InvestmentModule`. Mesmo
    // cálculo da UI — sem recalcular aqui. Se o usuário ainda não abriu o
    // módulo Investimento nesta sessão, esses campos ficam ausentes e os
    // gates de integridade (`hasStrategyData`) descartam os respectivos blocos.
    if (!investment) {
      logger.warn('[ProposalPdf] InvestmentResults indisponível — blocos strategy-income/sell serão omitidos pelo gate de integridade.');
    }
    const strategy: PdfPropostaCompletaData['strategy'] | undefined =
      bidValueResolved || investment
        ? {
            bidValue: bidValueResolved,
            bidPercent: bidPercentResolved,
            incomeMonthly: investment?.incomeMonthly ?? undefined,
            saleProfit: investment?.saleProfit && investment.saleProfit > 0 ? investment.saleProfit : undefined,
            contemplationMonth: investment?.contemplationMonth ?? undefined,
          }
        : undefined;

    // [PDF FIX] Espelho estruturado de strategy no formato `investment`,
    // que é o nome esperado pelos consumidores das páginas de Investimento.
    // strategy continua existindo (fonte de verdade); investment é apenas alias
    // + payload denso (cenários + premissas) lido do InvestmentResultsContext.
    const investmentMirror: PdfPropostaCompletaData['investment'] = {
      incomeMonthly: strategy?.incomeMonthly ?? null,
      saleProfit: strategy?.saleProfit ?? null,
      contemplationMonth: strategy?.contemplationMonth ?? null,
      scenarios: investment?.calculations
        ? (() => {
            const c = investment.calculations;
            const mk = (id: string, name: string, p: { totalPaid: number; finalResult: number; absoluteGain: number; percentGain: number }) => ({
              id, name,
              totalPaid: p.totalPaid,
              finalResult: p.finalResult,
              absoluteGain: p.absoluteGain,
              percentGain: p.percentGain,
            });
            return [
              mk('path1', 'Imóvel valorizado', c.path1),
              mk('path2', 'Venda da carta', c.path2),
              mk('path3', 'Renda de aluguel', c.path3),
              mk('path4', 'CDI puro', c.path4),
              mk('path5', 'Renda + venda', c.path5),
              mk('path6', 'Previdência turbinada', c.path6),
            ];
          })()
        : null,
      bestStrategyId: investment?.bestStrategy?.id ?? null,
      assumptions: investment?.assumptions
        ? {
            propertyAppreciation: investment.assumptions.propertyAppreciation,
            investmentReturn: investment.assumptions.investmentReturn,
            rentalYield: investment.assumptions.rentalYield,
            cdiPercent: investment.assumptions.cdiPercent,
            analysisMonths: investment.assumptions.analysisMonths,
          }
        : null,
    };

    // Schedule mensal SLIM — vem direto do SimulatorContext (motor atuarial).
    // Mapeia apenas os campos usados no PDF para evitar payload pesado.
    const monthlyScheduleSlim: PdfPropostaCompletaData['monthlyScheduleSlim'] =
      sim.monthlySchedule?.rows?.map((r) => ({
        month: r.month,
        payment: r.payment,
        insurance: r.insurance,
        balanceEnd: r.balanceEnd,
        regime: r.regime,
      })) ?? null;

    // [PDF FINAL DATA] Garantia de objeto padronizado — nenhum bloco recebe undefined
    // nas chaves de topo. Cada bloco continua tendo seus próprios gates internos para
    // dados parciais (MissingDataNote), mas a estrutura global é sempre completa.
    const safe = <T,>(v: T | undefined | null): T | null => (v ?? null) as T | null;

    const finalData: PdfPropostaCompletaData = {
      clientName: ctx.clientName,
      managerName: ctx.managerName,
      managerRole: ctx.managerRole,
      agencyName: ctx.agencyName,
      managerPhone: ctx.phone,
      managerWhatsapp: ctx.whatsapp,
      managerEmail: ctx.email,
      logoDataUrl: ctx.logoDataUrl,
      diagnostic: {
        objetivo: diag?.data?.objetivoPrincipal || diag?.data?.clientObjective || undefined,
        subObjetivo: diag?.data?.subObjetivo
          ? getSubObjetivoTexto(diag.data.subObjetivo)
          : undefined,
        capacidadeMensal: diag?.data?.capacidadeMensal ?? diag?.data?.monthlyCapacity ?? 0,
        temCapital: !!diag?.data?.temCapitalDisponivel,
        capitalDisponivel: diag?.data?.capitalDisponivel ?? 0,
        urgencia: diag?.data?.urgencia || diag?.data?.urgencyLevel || undefined,
        situacao: diag?.data?.clientSituation || undefined,
        prioridade: diag?.data?.prioridade || undefined,
      },
      simulation: {
        consortiumType: sim.input.consortiumType,
        creditValue: impactValues.acessa,
        termMonths: sim.input.termMonths,
        installment: sim.result.installmentAfterContemplation,
        effectiveClientCost: impactValues.paga,
        totalCost: sim.result.totalCost,
        freeBidValue: sim.actualFreeBidValue,
        embeddedBidValue: sim.actualEmbeddedBidValue,
        fullInstallment: sim.result.fullInstallment,
        installmentBeforeContemplation: sim.result.installmentBeforeContemplation,
        reducedInstallmentValue: sim.result.reducedInstallmentValue,
        reducedInstallmentMonths: sim.result.reducedInstallmentMonths,
      },
      recommendation: journey?.recommendation ?? null,
      comparisons,
      strategy,
      investment: investmentMirror,
      // bidsStudy: estrutura mínima sempre presente (sem undefined). Campos vazios
      // viram null e a página exibe MissingDataNote interna quando aplicável.
      bidsStudy: {
        groupNumber: bidsStudy?.groupNumber ?? null,
        avgBid: bidsStudy?.avgBid ?? null,
        minBid: bidsStudy?.minBid ?? null,
        maxBid: bidsStudy?.maxBid ?? null,
        recommendedBid: bidsStudy?.recommendedBid ?? null,
        monthsAnalyzed: bidsStudy?.monthsAnalyzed ?? null,
      },
      // ── Wealth/Patrimonial (bloco `wealth-thesis`) ──
      // Resolve estratégia ATIVA (ActiveStrategyContext) contra STRATEGY_LIBRARY.
      // NÃO exporta catálogo — apenas a tese personalizada do caso. Se não há
      // escolha consultiva, o payload vem `null` e a página mostra MissingDataNote.
      wealth: (() => {
        const active = activeStrategyCtx?.activeStrategy;
        if (!active) return null;
        const lib = STRATEGY_LIBRARY.find((s) => s.id === active.id);
        if (!lib) return null;
        return {
          strategyId: lib.id,
          title: lib.title,
          chapter: lib.chapter,
          tagline: lib.tagline,
          source: active.source,
          howItWorks: lib.howItWorks,
          patrimonialLogic: lib.patrimonialLogic,
          advantages: lib.advantages?.slice(0, 4),
          risks: lib.risks?.slice(0, 4),
          kpis: lib.calculations?.slice(0, 3).map((c) => ({
            label: c.label,
            value: c.result(sim.input.creditValue || 300_000, wealthCalcCtx),
          })),
        };
      })(),
      // ── Structured Ops (bloco `structured-ops`) ──
      structuredOps: structuredOps && structuredOps.consolidated.totalCreditValue > 0
        ? {
            cardsCount: structuredOps.cardsCount,
            totalQuantity: structuredOps.consolidated.totalQuantity,
            totalCreditValue: structuredOps.consolidated.totalCreditValue,
            totalInitialInstallment: structuredOps.consolidated.totalInitialInstallment,
            totalInstallmentAfterContemplation: structuredOps.consolidated.totalInstallmentAfterContemplation,
            totalPaid: structuredOps.consolidated.totalPaid,
            totalBid: structuredOps.consolidated.totalBid,
            effectiveRatePercent: structuredOps.effectiveRate,
            cards: structuredOps.cards
              .filter((c) => c.totalCreditValue > 0)
              .map((c) => ({
                consortiumType: STRUCTURED_TYPE_LABELS[c.consortiumType] ?? c.consortiumType,
                quantity: c.quantity,
                creditValue: c.creditValue,
                totalCreditValue: c.totalCreditValue,
                installmentAfterContemplation: c.installmentAfterContemplation,
              })),
          }
        : null,
      storytellingText: cachedStory,
      customOpening: customOpening.trim() || undefined,
      customClosing: customClosing.trim() || undefined,
      monthlyScheduleSlim,
      blocks: orderedSelected,
    };

    // [PDF FINAL DATA] Log único, consolidado, do payload final entregue ao componente.
    logger.log('[CHECK] simulation:', finalData.simulation);
    logger.log('[CHECK] diagnostic:', finalData.diagnostic);
    logger.log('[CHECK] investment:', finalData.investment);
    logger.log('[CHECK] bidsStudy:', finalData.bidsStudy);
    logger.log('[CHECK] strategy:', finalData.strategy);
    logger.log('[CHECK] comparisons:', finalData.comparisons);
    logger.log('[PDF FINAL DATA]', {
      simulation: safe(finalData.simulation),
      diagnostic: safe(finalData.diagnostic),
      investment: safe(finalData.investment),
      bidsStudy: safe(finalData.bidsStudy),
      comparisons: safe(finalData.comparisons),
      strategy: safe(finalData.strategy),
      storytelling: safe(finalData.storytellingText),
      blocks: finalData.blocks.map((b) => b.id),
    });

    return finalData;
  };

  const buildPdf = (ctx: PdfBuildContext) => {
    // [AUDIT] Fase 2 — Build do PDF
    // eslint-disable-next-line no-console
    console.group('[PDF] BUILD START');
    const data = buildData(ctx, 'strict');
    logger.log('selected blocks:', data?.blocks.map((b) => b.id));
    logger.log('full data:', data);
    // eslint-disable-next-line no-console
    console.groupEnd();

    if (!data) {
      // buildData em strict já lançou; este return é apenas defensivo.
      throw new Error('[ProposalPdf] buildData returned null in strict mode');
    }

    // [AUDIT] Fase 3 — Snapshot dos dados consolidados
    // eslint-disable-next-line no-console
    console.group('[PDF] DATA SNAPSHOT');
    logger.log('simulation:', data.simulation);
    logger.log('diagnostic:', data.diagnostic);
    logger.log('investment:', (data as unknown as { investment?: unknown }).investment);
    logger.log('bidsStudy:', data.bidsStudy);
    logger.log('strategy:', data.strategy);
    // eslint-disable-next-line no-console
    console.groupEnd();

    trackEvent('proposal_pdf_premium_generated', {
      blocks_count: orderedSelected.length,
      has_storytelling: !!cachedList[0]?.entry?.text,
      has_financing: !!data.comparisons?.financingTotal,
      has_strategy: !!data.strategy,
      blocks: orderedSelected.map((b) => b.id).join(','),
    });

    trackEvent('proposal_pdf_sent', {
      client_name: ctx.clientName,
      consortium_type: data.simulation.consortiumType,
      credit_value: data.simulation.creditValue,
    });

    return (
      <Suspense fallback={null}>
        <PdfPropostaCompleta data={data} />
      </Suspense>
    );
  };

  // ─── Preview HTML state ─────────────────────────────────────────────────
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PdfPropostaCompletaData | null>(null);

  const openPreview = async () => {
    // Auto-gera storytelling antes do preview (idempotente).
    await ensureStorytelling();
    const ctx: PdfBuildContext = {
      managerName: '',
      managerRole: '',
      agencyName: '',
      phone: '',
      whatsapp: '',
      email: '',
      logoDataUrl: '',
      clientName: diag?.data?.clientName || 'Cliente (preview)',
    };
    const data = buildData(ctx, 'preview');
    if (!data) {
      toast.error('Pré-visualização indisponível', {
        description: 'Os valores da simulação ainda não estão prontos. Volte ao Simulador.',
      });
      return;
    }
    setPreviewData(data);
    setPreviewOpen(true);
  };

  // (auto-gen do storytelling agora vive em useStorytellingAutoGen — sem useEffect inline)

  // ─── Aviso de blocos selecionados sem dados reais (serão omitidos) ──
  const missingBlocks = useMemo(() => {
    if (!validSimulation) return [];
    // Monta um data fictício apenas para rodar os gates (não persiste).
    const ctx: PdfBuildContext = {
      managerName: '', managerRole: '', agencyName: '',
      phone: '', whatsapp: '', email: '', logoDataUrl: '',
      clientName: diag?.data?.clientName || 'Cliente',
    };
    try {
      const data = buildData(ctx, 'preview');
      if (!data) return [];
      const missingIds = getMissingDataBlocks(data);
      return PROPOSAL_BLOCKS.filter((b) => missingIds.includes(b.id) && !b.required);
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, validSimulation, journey?.slots?.bidStrategy, sim.input.creditValue, sim.input.termMonths, customOpening, customClosing, cachedList]);


  return (
    <div>
      <ModuleHeader
        title="Proposta Premium"
        subtitle="Monte um PDF consultivo premium em poucos cliques."
        moduleId="proposal-pdf"
      />

      <div className="space-y-4">
        {!validSimulation && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              É necessário ter uma simulação válida antes de montar a proposta. Volte ao Simulador e gere uma simulação.
            </AlertDescription>
          </Alert>
        )}

        {(['base', 'comparison', 'depth', 'persuasion'] as const).map((cat) => {
          const meta = CATEGORY_META[cat];
          return (
            <Card key={cat}>
              <CardContent className="p-card-sm space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{meta.title}</h3>
                  <p className="text-xs text-muted-foreground">{meta.subtitle}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {blocksByCategory[cat].map((b) => {
                    const isSel = selected.has(b.id);
                    const isStorytelling = b.id === 'storytelling';
                    const showCacheBadge = isStorytelling && hasAnyStorytellingCached;
                    return (
                      <label
                        key={b.id}
                        className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                          isSel ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                        } ${b.required ? 'opacity-90 cursor-default' : ''}`}
                      >
                        <Checkbox
                          checked={isSel}
                          disabled={!!b.required}
                          onCheckedChange={() => toggle(b.id, b.required)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{b.label}</span>
                            {b.required && <Badge variant="secondary" className="text-caption">Sempre</Badge>}
                            {b.recommended && !b.required && (
                              <Badge variant="outline" className="text-caption border-primary/40 text-primary">Recomendado</Badge>
                            )}
                            {showCacheBadge && (
                              <Badge variant="outline" className="text-caption border-success/40 text-success gap-1">
                                <Sparkles className="h-3 w-3" /> Já gerado
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{b.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Card>
          <CardContent className="p-card-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Mensagens pessoais (opcional)</h3>
              <p className="text-xs text-muted-foreground">
                Aproxime o cliente com uma frase sua. Se deixar em branco, usamos uma mensagem padrão consultiva.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="custom-opening" className="text-xs">Mensagem inicial</Label>
                  <span className="text-caption text-muted-foreground">{customOpening.length}/300</span>
                </div>
                <Textarea
                  id="custom-opening"
                  value={customOpening}
                  onChange={(e) => updateOpening(e.target.value)}
                  placeholder="Ex: Preparei esse estudo pensando no seu momento atual e no objetivo que você comentou comigo..."
                  maxLength={300}
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="custom-closing" className="text-xs">Mensagem final</Label>
                  <span className="text-caption text-muted-foreground">{customClosing.length}/300</span>
                </div>
                <Textarea
                  id="custom-closing"
                  value={customClosing}
                  onChange={(e) => updateClosing(e.target.value)}
                  placeholder="Ex: Se fizer sentido pra você, posso te ajudar a dar o próximo passo com segurança..."
                  maxLength={300}
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        {missingBlocks.length > 0 && validSimulation && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="text-sm font-medium mb-1">
                {missingBlocks.length === 1
                  ? "1 bloco selecionado será omitido por falta de dados reais:"
                  : `${missingBlocks.length} blocos selecionados serão omitidos por falta de dados reais:`}
              </div>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                {missingBlocks.map((b) => {
                  const isBidsRelated = b.id === "bids-study" || b.id === "contemplation";
                  return (
                    <li key={b.id}>
                      <strong>{b.label}</strong>
                      {isBidsRelated && " — selecione um grupo no Estudo de Lances"}
                      {b.id === "strategy-income" && " — projete a renda no módulo Investimento"}
                      {b.id === "strategy-sell" && " — simule a Venda da Carta no Investimento"}
                      {b.id === "cmp-cash" && " — informe capital disponível no Diagnóstico"}
                    </li>
                  );
                })}
              </ul>
              <p className="text-caption text-muted-foreground mt-2 italic">
                Regra: sem dado real, o bloco não aparece. Nenhum texto genérico será incluído no PDF.
              </p>
            </AlertDescription>
          </Alert>
        )}


        <Card className="border-primary/40">
          <CardContent className="p-card-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground">
                  Pronto para gerar — {orderedSelected.length} blocos selecionados
                </div>
                <p className="text-xs text-muted-foreground">
                  A ordem é organizada automaticamente como narrativa consultiva (capa → contexto → cenário → comparações → estratégia → prova → fechamento).
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={openPreview}
                disabled={!validSimulation}
                className="gap-1.5 text-xs"
              >
                <Eye className="h-3.5 w-3.5" />
                Pré-visualizar
              </Button>
              <PdfDownloadButton
                moduleName="Proposta-Completa"
                defaultClientName={diag?.data?.clientName || ''}
                disabled={!validSimulation}
                label="Gerar PDF Premium"
                buildPdfElement={buildPdf}
              />
            </div>
          </CardContent>
        </Card>

        <FollowupCard clientName={diag?.data?.clientName || ''} />

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <FileText className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            O PDF inclui capa, considerações regulatórias, contexto, cenário, prova técnica, fechamento consultivo
            e página de avaliação (NPS). Conteúdos de IA (storytelling, argumentos) são reaproveitados quando já
            gerados nos módulos correspondentes.
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <ProposalPdfPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          data={previewData}
        />
      </Suspense>
    </div>
  );
}

// FollowupCard extracted to ./proposalPdf/FollowupCard.tsx (Sprint B.2)

