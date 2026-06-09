/**
 * ════════════════════════════════════════════════════════════════════════════
 * StrategyLibrarySection — Biblioteca patrimonial (24 estratégias)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Refinement Pass: rhythm, hierarchy, breathing room.
 *   • Cards com altura perceptiva uniforme (header normalizado, CTA ancorado).
 *   • Expansão editorial: blocos respiráveis, tabelas leves, sem painel pesado.
 *   • Tipografia consistente (eyebrow / título / tagline / label / corpo).
 *   • Mobile-first com padding confortável e tabelas com scroll horizontal.
 * ════════════════════════════════════════════════════════════════════════════
 */
import { Fragment, memo, useCallback, useEffect, useMemo, useState } from "react";
import { 
  ArrowRight, BookOpen, AlertTriangle, Lightbulb, Calculator, Map as MapIcon, 
  Scale, Sparkles, Quote, Compass, ShieldAlert, ArrowLeftRight, Clock, X, 
  PlayCircle, Crown, ArrowUpDown, ChevronDown, Loader2, Copy, RefreshCw, Pencil 
} from 'lucide-react';
import { DialogClose } from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';
import { useActiveStrategy } from '@/contexts/ActiveStrategyContext';
import { useSimulatorInput, useSimulatorResult } from '@/components/modules/simulator/SimulatorContext';
import { useDiagnosticContextSafe } from '@/components/modules/diagnostic/DiagnosticContext';
import { useWealthAssumptionsSafe, toCalcContext, buildSimSlice, type SimSlice } from '@/contexts/WealthAssumptionsContext';
import { useWealthPdfSelectionSafe } from '@/contexts/WealthPdfSelectionContext';
import { STRATEGY_LIBRARY_ORDERED, type LibraryStrategy, type MentalTrigger } from './strategyLibraryData';
import { InteractiveSimulator } from './InteractiveSimulator';
import { getStrategyNextSteps, type StrategyNextStep } from './strategyNextSteps';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { cacheKey, getCached, setCached } from '@/utils/aiResponseCache';
import {
  MODALITY_OPTIONS,
  modalityFromConsortiumType,
  strategyMatchesModality,
  getStrategyModalities,
  type ConsortiumModality,
} from './strategyModalities';
import {
  scoreStrategies,
  hasContextSignals,
  type StrategyContextScore,
} from './strategyContextScoring';
import {
  getCalcMeaning,
  getComparisonWhy,
  getPatrimonialReading,
} from './strategyExplanationEnhancements';
import { getDecisionSupport } from './strategyDecisionSupport';
import {
  STRATEGY_EXECUTIVE_KPIS,
  EXECUTIVE_KPI_HINTS,
  EXECUTIVE_KPI_DEFAULT_SOURCE,
  EXECUTIVE_KPI_SOURCE_HINT,
  type ExecutiveKpiSource,
} from './strategyExecutiveKpis';
import {
  FLAGSHIP_STRATEGIES,
  EXECUTIVE_ORDER_OPTIONS,
  getKpiNumericValue,
  isFlagshipStrategy,
  getFlagshipMeta,
  getMentalTrigger,
  type ExecutiveOrderKey,
} from './strategyFlagships';

const ACCENT_CLS: Record<LibraryStrategy['accent'], {
  border: string; dot: string; chip: string; ring: string;
}> = {
  primary:     { border: 'border-border/60', dot: 'bg-primary',       chip: 'bg-primary/10 text-primary',         ring: 'ring-primary/20' },
  success:     { border: 'border-border/60', dot: 'bg-success',       chip: 'bg-success/10 text-success',         ring: 'ring-success/20' },
  warning:     { border: 'border-border/60', dot: 'bg-warning',       chip: 'bg-warning/10 text-warning',         ring: 'ring-warning/20' },
  destructive: { border: 'border-border/60', dot: 'bg-destructive',   chip: 'bg-destructive/10 text-destructive', ring: 'ring-destructive/20' },
  muted:       { border: 'border-border/60', dot: 'bg-foreground/40', chip: 'bg-muted text-foreground/70',        ring: 'ring-border/60' },
};

/* ──────────────────────────────────────────────────────────────────────
 * Checkbox de seleção para PDF consolidado (multi-estratégia).
 * Renderiza apenas se houver provider ativo (`WealthPdfSelectionProvider`).
 * Visual discreto, top-right, com label oculto para acessibilidade.
 * ────────────────────────────────────────────────────────────────────── */
function PdfSelectCheckbox({
  strategyId,
  strategyTitle,
}: {
  strategyId: string;
  strategyTitle: string;
}) {
  const sel = useWealthPdfSelectionSafe();
  if (!sel) return null;
  const checked = sel.isSelected(strategyId);
  return (
    <label
      className={cn(
        'absolute top-3 right-3 z-10 inline-flex items-center justify-center',
        'h-8 w-8 rounded-lg border bg-background/85 backdrop-blur cursor-pointer',
        'transition-colors',
        checked
          ? 'border-primary bg-primary/10'
          : 'border-border/60 hover:border-foreground/30',
      )}
      onClick={(e) => e.stopPropagation()}
      title={checked ? 'Remover da seleção de PDF' : 'Selecionar para PDF consolidado'}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => sel.toggle(strategyId)}
        className="sr-only"
        aria-label={`Selecionar ${strategyTitle} para PDF consolidado`}
      />
      <span
        aria-hidden
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded border transition-colors',
          checked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background',
        )}
      >
        {checked && (
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8.5l3.5 3.5L13 5" />
          </svg>
        )}
      </span>
    </label>
  );
}

/* Mapa estático de ring por accent (Core rule: no template-literal classes). */
const ACCENT_SELECTED_RING: Record<LibraryStrategy['accent'], string> = {
  primary: 'ring-2 ring-primary/50 border-primary/40',
  success: 'ring-2 ring-success/50 border-success/40',
  warning: 'ring-2 ring-warning/50 border-warning/40',
  destructive: 'ring-2 ring-destructive/50 border-destructive/40',
  muted: 'ring-2 ring-foreground/25 border-foreground/25',
};

// DEFAULT_REFERENCE_CREDIT removido — sem fallback fake. Gate por isValidSimulation.

/* ──────────────────────────────────────────────────────────────────────
 * StrategyIncompatibilityCard — short-circuit terminal.
 *
 * Quando a modalidade real do Simulador (suggestedModality, derivada de
 * `input.consortiumType`) não combina com as modalidades suportadas pela
 * tese, a estratégia NÃO renderiza cálculo nenhum: nem KPI, nem preview,
 * nem PDF, nem dialog. Apenas explica o porquê e indica a ação corretiva.
 *
 * Princípio: "Estratégias interpretam uma operação financeira já validada
 * pelo simulador" — se não há operação compatível, não há interpretação.
 * ────────────────────────────────────────────────────────────────────── */
function StrategyIncompatibilityCard({
  strategy, simModality,
}: {
  strategy: LibraryStrategy;
  simModality: ConsortiumModality;
}) {
  const Icon = strategy.icon;
  const simLabel =
    MODALITY_OPTIONS.find((m) => m.id === simModality)?.label ?? simModality;
  const allowed = getStrategyModalities(strategy.id)
    .map((t) => MODALITY_OPTIONS.find((m) => m.id === t)?.label ?? t)
    .join(' · ');
  return (
    <article
      className={cn(
        'group relative flex flex-col rounded-2xl border border-dashed border-border/50 bg-muted/20 text-card-foreground',
        'p-card-lg',
      )}
      aria-label={`Estratégia incompatível com a modalidade ${simLabel}`}
      data-incompatible="true"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-caption font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {strategy.chapter}
          </span>
          <h4 className="mt-2 text-subtitle font-semibold leading-[1.22] tracking-[-0.005em] text-foreground/80">
            {strategy.title}
          </h4>
        </div>
      </div>
      <p className="mt-4 text-body text-muted-foreground leading-relaxed">
        Esta tese não se aplica à modalidade simulada
        <span className="font-medium text-foreground/80"> ({simLabel})</span>.
        {allowed && (
          <>
            {' '}
            Faz sentido apenas para: <span className="font-medium text-foreground/80">{allowed}</span>.
          </>
        )}
      </p>
      <p className="mt-3 text-caption text-muted-foreground/80">
        Para avaliar esta estratégia, ajuste a operação no Simulador para uma modalidade compatível.
      </p>
    </article>
  );
}


export function StrategyLibrarySection() {
  const {
    input, insuranceEnabled, contemplationMonth,
    adminFeeDiscount, annualAdjustmentPercent,
    embeddedBidPercent, freeBidPercent,
  } = useSimulatorInput();
  const {
    effectiveAdminFeePercent, effectiveInsurancePercent,
    effectiveClientCost, isValidSimulation,
    baseMonthlySchedule, baseResult,
  } = useSimulatorResult();
  const diagnostic = useDiagnosticContextSafe();
  const wealthCtx = useWealthAssumptionsSafe();

  // ──────────────────────────────────────────────────────────────────────
  // SINGLE-SOURCE-OF-TRUTH: simSlice canônico construído por `buildSimSlice`
  // (Object.freeze). Mesmo objeto persistido em localStorage pelo Simulador.
  // Zero hardcoded: TUDO vem do estado real do Simulador.
  //
  // GATE MATEMÁTICO GLOBAL: se `isValidSimulation === false`, simSlice = null.
  // Estratégias então renderizam "—" via guard `ctx?.sim` — nenhum cálculo
  // parcial, tooltip, preview, PDF ou skeleton produz número.
  // ──────────────────────────────────────────────────────────────────────
  const simSlice: SimSlice | null = useMemo(() => {
    if (!isValidSimulation) return null;
    return buildSimSlice({
      creditValue: input.creditValue,
      consortiumType: input.consortiumType,
      termMonths: input.termMonths,
      adminFeePercent: input.adminFeePercent,
      adminFeeDiscountPercent: adminFeeDiscount,
      reserveFundPercent: input.reserveFundPercent,
      insuranceEnabled,
      insurancePercent: input.insurancePercent,
      annualAdjustmentPercent,
      embeddedBidPercent,
      freeBidPercent,
      contemplationMonth: contemplationMonth ?? 0,
      effectiveAdminFeePercent,
      effectiveInsurancePercent,
      costPlan: baseMonthlySchedule.costPlan,
      totalInsurance: baseMonthlySchedule.totalInsurance,
      totalCost: baseResult.totalCost,
      fullInstallment: baseResult.fullInstallment,
      effectiveClientCost,
    });
  }, [
    isValidSimulation,
    input.creditValue, input.consortiumType, input.termMonths,
    input.adminFeePercent, input.reserveFundPercent, input.insurancePercent,
    adminFeeDiscount, insuranceEnabled, annualAdjustmentPercent,
    embeddedBidPercent, freeBidPercent, contemplationMonth,
    effectiveAdminFeePercent, effectiveInsurancePercent,
    baseMonthlySchedule.costPlan, baseMonthlySchedule.totalInsurance,
    baseResult.totalCost, baseResult.fullInstallment,
    effectiveClientCost,
  ]);

  const calcCtx = useMemo(
    () => wealthCtx ? toCalcContext(wealthCtx.assumptions, simSlice) : undefined,
    [wealthCtx, simSlice],
  );

  const credit = input?.creditValue && input.creditValue > 0 ? input.creditValue : 0;


  const signals = useMemo(() => ({
    consortiumType: input?.consortiumType,
    creditValue: input?.creditValue,
    objetivoPrincipal: diagnostic?.data?.objetivoPrincipal,
    subObjetivo: diagnostic?.data?.subObjetivo,
    prioridade: diagnostic?.data?.prioridade,
    temCapitalDisponivel: diagnostic?.data?.temCapitalDisponivel,
    capitalDisponivel: diagnostic?.data?.capitalDisponivel,
    urgencia: diagnostic?.data?.urgencia,
  }), [input?.consortiumType, input?.creditValue, diagnostic?.data]);

  const contextActive = hasContextSignals(signals);
  const scoreMap = useMemo(
    () => contextActive ? scoreStrategies(signals) : new Map<string, StrategyContextScore>(),
    [contextActive, signals],
  );

  // ── Contexto operacional (modalidade de consórcio) ───────────────────────
  // Auto-detecta a modalidade do Simulador na primeira entrada. Só persiste
  // no localStorage quando o usuário interage manualmente — evitando que um
  // default salvo automaticamente bloqueie futuras detecções.
  const suggestedModality = modalityFromConsortiumType(input?.consortiumType);
  const MANUAL_OVERRIDE_KEY = 'wealth:modality:manual:v1';
  const MODALITY_STORAGE_KEY = 'wealth:modality:v1';

  const [modality, setModality] = useState<ConsortiumModality>(() => {
    if (typeof window === 'undefined') return suggestedModality;
    try {
      const hasManualOverride = window.localStorage.getItem(MANUAL_OVERRIDE_KEY) === '1';
      if (hasManualOverride) {
        const stored = window.localStorage.getItem(MODALITY_STORAGE_KEY) as ConsortiumModality | null;
        if (stored && MODALITY_OPTIONS.some((m) => m.id === stored)) return stored;
      }
    } catch { /* ignore */ }
    return suggestedModality;
  });

  // Handler de mudança manual: salva valor + marca override para que
  // futuras entradas no módulo respeitem a escolha do usuário.
  const handleModalityChange = useCallback((m: ConsortiumModality) => {
    setModality(m);
    try {
      window.localStorage.setItem(MODALITY_STORAGE_KEY, m);
      window.localStorage.setItem(MANUAL_OVERRIDE_KEY, '1');
    } catch { /* ignore */ }
  }, []);

  // ── Ordenação executiva (opcional, consultiva) ───────────────────────────
  // Default: 'editorial' — preserva narrativa curada. Persistido em localStorage.
  const [orderKey, setOrderKey] = useState<ExecutiveOrderKey>(() => {
    if (typeof window === 'undefined') return 'editorial';
    try {
      const stored = window.localStorage.getItem('wealth:order:v1') as ExecutiveOrderKey | null;
      if (stored && EXECUTIVE_ORDER_OPTIONS.some((o) => o.id === stored)) return stored;
    } catch { /* ignore */ }
    return 'editorial';
  });
  useEffect(() => {
    try { window.localStorage.setItem('wealth:order:v1', orderKey); } catch { /* ignore */ }
  }, [orderKey]);
  const orderOption = EXECUTIVE_ORDER_OPTIONS.find((o) => o.id === orderKey) ?? EXECUTIVE_ORDER_OPTIONS[0];

  // Base: todas as estratégias do catálogo.
  const baseStrategies = STRATEGY_LIBRARY_ORDERED;

  // Score combinado: boost de diagnóstico + aderência à modalidade selecionada.
  // Não esconde nada; apenas reordena por relevância contextual.
  const combinedScore = (s: LibraryStrategy): number => {
    const ctxBoost = scoreMap.get(s.id)?.boost ?? 0;
    const modBoost = strategyMatchesModality(s.id, modality) ? 1 : 0;
    // Modalidade pesa fortemente quando ativa (≠ all), garantindo subida natural.
    return modBoost * (modality === 'all' ? 0 : 10) + ctxBoost;
  };

  /**
   * Comparator executivo: aplica ordenação consultiva opcional.
   *   • 'editorial' → preserva ordem do catálogo + combinedScore como tiebreak
   *     leve quando há contexto/modalidade ativos.
   *   • 'context'   → ordena por combinedScore (legado).
   *   • KPI kinds   → ordena pelo valor numérico parseado de
   *     `strategy.calculations[i].result(credit)`. Nulls vão ao final
   *     (visíveis, nunca ocultos). Tiebreak por combinedScore.
   */
  const executiveCompare = (a: LibraryStrategy, b: LibraryStrategy): number => {
    if (orderOption.kind) {
      const va = getKpiNumericValue(a, orderOption.kind, credit, calcCtx);
      const vb = getKpiNumericValue(b, orderOption.kind, credit, calcCtx);
      if (va == null && vb == null) return combinedScore(b) - combinedScore(a);
      if (va == null) return 1;
      if (vb == null) return -1;
      const delta = orderOption.direction === 'asc' ? va - vb : vb - va;
      if (delta !== 0) return delta;
      return combinedScore(b) - combinedScore(a);
    }
    // 'editorial' ou 'context': sempre por combinedScore (que é 0 quando
    // não há contexto nem modalidade ativos — preserva ordem do catálogo).
    return combinedScore(b) - combinedScore(a);
  };

  // Agrupamento editorial — chapters reais com narrativa consultiva.
  const chaptersGrouped = useMemo(() => {
    const grouped = new Map<string, LibraryStrategy[]>();
    for (const ch of CHAPTER_ORDER) grouped.set(ch.rawKey, []);
    for (const s of baseStrategies) {
      const bucket = grouped.get(s.chapter);
      if (bucket) bucket.push(s);
    }
    // Reordena dentro do capítulo quando há contexto, modalidade ativa OU
    // ordenação executiva ≠ editorial.
    const shouldSort = contextActive || modality !== 'all' || orderKey !== 'editorial';
    if (shouldSort) {
      for (const [k, list] of grouped) {
        grouped.set(k, [...list].sort(executiveCompare));
      }
    }
    return CHAPTER_ORDER
      .map((ch) => {
        const items = grouped.get(ch.rawKey) ?? [];
        const matchCount = modality === 'all'
          ? items.length
          : items.filter((s) => strategyMatchesModality(s.id, modality)).length;
        return { ...ch, items, matchCount };
      })
      .filter((c) => c.items.length > 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseStrategies, contextActive, scoreMap, modality, orderKey, credit, calcCtx]);

  // Recomendadas — top 3 por boost quando há contexto, restritas à modalidade ativa.
  const recommended = useMemo(() => {
    if (!contextActive) return [];
    return [...baseStrategies]
      .filter((s) => strategyMatchesModality(s.id, modality))
      .map((s) => ({ s, boost: scoreMap.get(s.id)?.boost ?? 0 }))
      .filter((x) => x.boost > 0)
      .sort((a, b) => b.boost - a.boost)
      .slice(0, 3)
      .map((x) => x.s);
  }, [baseStrategies, contextActive, scoreMap, modality]);

  // Flagship strategies — instâncias reais do catálogo.
  const flagshipItems = useMemo(
    () => FLAGSHIP_STRATEGIES
      .map((f) => baseStrategies.find((s) => s.id === f.id))
      .filter((s): s is LibraryStrategy => !!s),
    [baseStrategies],
  );

  return (
    <section aria-labelledby="strategy-library-title" className="space-y-14 md:space-y-20">
      {/* ════════════════════════════════════════════════════════════════
       * HEADER — Information Architecture com 3 níveis hierárquicos:
       *
       *   NÍVEL 1 (dominante)   ▸ Capítulos patrimoniais (navegação editorial)
       *   NÍVEL 2 (contextual)  ▸ Contexto operacional (sugerido pelo simulador)
       *   NÍVEL 3 (utilitário)  ▸ Ordenação (dropdown discreto)
       *
       * Princípio: cada nível tem peso visual e linguagem de interação
       * próprios — o cérebro identifica prioridade em <2s. NÃO é painel
       * de filtros: é navegação editorial de uma biblioteca patrimonial.
       * ════════════════════════════════════════════════════════════════ */}
      <header className="space-y-section-gap md:space-y-9">
        {/* ─── Eyebrow + título + descrição (intro editorial) ─── */}
        <div className="space-y-5 md:space-y-6 max-w-3xl">
          <div className="flex items-center gap-3 text-caption font-medium uppercase tracking-[0.22em] text-primary">
            <BookOpen className="h-3 w-3" aria-hidden />
            <span>Mesa consultiva patrimonial</span>
            <span className="hidden sm:inline-block h-px flex-1 max-w-[80px] bg-border/70" aria-hidden />
          </div>
          <h2 id="strategy-library-title" className="text-display md:text-display font-semibold leading-[1.05] tracking-[-0.01em] text-foreground">
            Todas as Estratégias
          </h2>
          <p className="text-body md:text-subtitle text-muted-foreground leading-[1.65] max-w-2xl">
            Explore linhas patrimoniais por objetivo financeiro — comprar sem descapitalizar,
            multiplicar patrimônio, gerar renda, acumular ou operar produtivamente. Cada
            tese carrega racional, impacto em liquidez, cálculos e quando <em>não</em> usar.
          </p>
        </div>

        {/* ─── NÍVEL 1 · CAPÍTULOS PATRIMONIAIS (dominante) ─── */}
        <nav
          aria-label="Capítulos patrimoniais"
          className="relative -mx-1 md:mx-0"
        >
          <div className="text-caption font-medium uppercase tracking-[0.22em] text-muted-foreground/85 px-1 md:px-0 mb-3">
            Capítulos
          </div>
          <ul className="flex flex-wrap gap-2 md:gap-2.5 px-1 md:px-0">
            {chaptersGrouped.map((c) => (
              <li key={c.rawKey} className="relative">
                <a
                  href={`#${c.anchor}`}
                  onClick={(e) => smoothScrollTo(e, c.anchor)}
                  className={cn(
                    'group/tab inline-flex items-center gap-2.5 h-11 px-5 md:px-6 rounded-full',
                    'text-body md:text-body font-medium tracking-tight',
                    'border border-border/60 bg-background text-foreground/75',
                    'transition-[color,background-color,border-color,box-shadow] duration-200',
                    'hover:bg-primary hover:text-primary-foreground hover:border-primary',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  )}
                >
                  <span>{c.label}</span>
                  <span className="text-caption font-normal tabular-nums opacity-75 group-hover/tab:opacity-90">
                    {c.items.length}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* ─── NÍVEL 2+3 · BARRA OPERACIONAL (contextual + utilitário) ───
             Linha única discreta. Visual unificado mas semanticamente
             dividido: esquerda = contexto consultivo, direita = ordenação
             utilitária. Tipografia menor, sem competir com Nível 1. */}
        <OperatingContextBar
          modality={modality}
          onModalityChange={handleModalityChange}
          suggestedModality={suggestedModality}
          orderKey={orderKey}
          onOrderChange={setOrderKey}
          contextActive={contextActive}
        />

        {!isValidSimulation && (
          <div
            role="status"
            className="text-caption text-muted-foreground/90 leading-relaxed border-l-2 border-warning/60 pl-3 max-w-2xl"
          >
            <strong className="text-foreground">Estratégias bloqueadas:</strong> preencha o Simulador
            com uma operação válida (carta, prazo, taxa) para que as teses calculem em cima dos
            números reais. Nenhuma estratégia produz valor sem simulação ativa.
          </div>
        )}
      </header>

      {/* ───── FLAGSHIP LAYER — teses patrimoniais em destaque ───── */}
      {flagshipItems.length > 0 && (
        <FlagshipLayer items={flagshipItems} credit={credit} />
      )}

      {/* ───── RECOMMENDED LAYER ───── */}
      {recommended.length > 0 && (
        <section aria-labelledby="wealth-recommended-title" className="space-y-section-gap">
          <header className="flex items-end justify-between gap-6 flex-wrap">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-caption font-medium uppercase tracking-[0.22em] text-primary">
                <Sparkles className="h-3 w-3" aria-hidden />
                Mais aderentes ao seu cenário
              </div>
              <h3 id="wealth-recommended-title" className="text-subtitle md:text-title font-semibold tracking-[-0.005em] text-foreground">
                Estratégias prioritárias
              </h3>
            </div>
            <p className="text-caption text-muted-foreground max-w-md leading-relaxed">
              Selecionadas a partir do diagnóstico e simulação atuais. A biblioteca completa
              continua acessível logo abaixo.
            </p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-7 md:gap-8 auto-rows-fr [grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-6 auto-rows-fr>*]:min-w-0">
            {recommended.map((strategy) => (
              <StrategyLibraryCard
                key={`rec-${strategy.id}`}
                strategy={strategy}
                credit={credit}
                contextHint={scoreMap.get(strategy.id)?.hint}
              />
            ))}
          </div>
        </section>
      )}

      {/* ───── EDITORIAL CHAPTERS — narrativa contínua ───── */}
      {chaptersGrouped.map((chapter, idx) => (
        <section
          key={chapter.rawKey}
          id={chapter.anchor}
          aria-labelledby={`${chapter.anchor}-title`}
          className="space-y-section-gap md:space-y-8 scroll-mt-24"
        >
          {/* Separador premium — hairline + numeral romano discreto.
              Substitui o border-t direto: cria pausa editorial sem virar régua. */}
          {idx > 0 && (
            <div className="flex items-center gap-6 pt-2" aria-hidden>
              <span className="text-caption text-muted-foreground">
                {chapter.eyebrow.replace(/^Cap[íi]tulo\s+/i, '')}
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-border/70 via-border/40 to-transparent" />
            </div>
          )}

          <header className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2.5 text-caption font-medium uppercase tracking-[0.22em] text-primary">
              <span>{chapter.eyebrow}</span>
              <span className="text-muted-foreground/70 normal-case tracking-normal">
                · {chapter.items.length} {chapter.items.length === 1 ? 'estratégia' : 'estratégias'}
              </span>
            </div>
            <h3 id={`${chapter.anchor}-title`} className="text-title md:text-display font-semibold leading-[1.1] tracking-[-0.01em] text-foreground">
              {chapter.label}
            </h3>
            <p className="text-body md:text-subtitle text-muted-foreground leading-[1.65] max-w-2xl">
              {chapter.narrative}
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-7 md:gap-8 auto-rows-fr [grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-6 auto-rows-fr>*]:min-w-0">
            {chapter.items.map((strategy) => {
              // ─────────────────────────────────────────────────────────────
              // SHORT-CIRCUIT REAL por modalidade do Simulador.
              // Se a operação real (suggestedModality, derivada de
              // input.consortiumType) não combina com a tese, a estratégia
              // LITERALMENTE não calcula: zero result(), zero KPI, zero PDF.
              // Renderiza apenas um cartão de incompatibilidade explícito.
              // O filtro manual `modality` continua só dimensionando opacidade.
              // ─────────────────────────────────────────────────────────────
              const simIncompatible =
                !!simSlice &&
                !strategyMatchesModality(strategy.id, suggestedModality);
              if (simIncompatible) {
                return (
                  <StrategyIncompatibilityCard
                    key={strategy.id}
                    strategy={strategy}
                    simModality={suggestedModality}
                  />
                );
              }
              const offModality = modality !== 'all' && !strategyMatchesModality(strategy.id, modality);
              return (
                <div
                  key={strategy.id}
                  className={cn(
                    'transition-opacity duration-300 motion-reduce:transition-none',
                    offModality && 'opacity-55 hover:opacity-100 focus-within:opacity-100',
                  )}
                  aria-label={offModality ? 'Fora da modalidade selecionada' : undefined}
                >
                  <StrategyLibraryCard
                    strategy={strategy}
                    credit={credit}
                    contextHint={scoreMap.get(strategy.id)?.hint}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * CHAPTER ORDER · narrativa editorial consultiva
 *
 * Map sobre `chapter` original (mantido em strategyLibraryData) → eyebrow,
 * label premium, narrativa curta e anchor. Sem alterar dados-fonte.
 * ────────────────────────────────────────────────────────────────────── */
type ChapterMeta = {
  rawKey: string;
  anchor: string;
  eyebrow: string;
  label: string;
  narrative: string;
};

const CHAPTER_ORDER: ChapterMeta[] = [
  {
    rawKey: 'Aquisição',
    anchor: 'wealth-ch-aquisicao',
    eyebrow: 'Capítulo I',
    label: 'Comprar sem descapitalizar',
    narrative:
      'Adquirir o bem preservando liquidez — aquisição planejada, acelerada e upgrades patrimoniais sem queimar reserva.',
  },
  {
    rawKey: 'Leverage',
    anchor: 'wealth-ch-leverage',
    eyebrow: 'Capítulo II',
    label: 'Multiplicação patrimonial',
    narrative:
      'Controlar mais patrimônio com menos capital próprio — alavancagem imobiliária e multiplicação de cotas com capital reaplicado.',
  },
  {
    rawKey: 'Acumulação',
    anchor: 'wealth-ch-acumulacao',
    eyebrow: 'Capítulo III',
    label: 'Acumulação & escada patrimonial',
    narrative:
      'Construir patrimônio em camadas — escada de contemplações, construção inteligente e formação consistente de ativos.',
  },
  {
    rawKey: 'Uso',
    anchor: 'wealth-ch-uso',
    eyebrow: 'Capítulo IV',
    label: 'Empresas & uso produtivo',
    narrative:
      'Ativos que trabalham — frota, agro, equipamentos, energia solar e estruturas que se autossustentam no fluxo operacional.',
  },
  {
    rawKey: 'Renda & Sucessão',
    anchor: 'wealth-ch-renda-sucessao',
    eyebrow: 'Capítulo V',
    label: 'Renda, liquidez & sucessão',
    narrative:
      'Liquidez estruturada, renda passiva recorrente e patrimônio organizado para a próxima geração.',
  },
];

function smoothScrollTo(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Atualiza hash sem novo jump.
  history.replaceState(null, '', `#${id}`);
}

/* ────────────────────────────────────────────────────────────────────── */

/**
 * StrategyLibraryCard - Memoized component for strategy display.
 * Participating props: strategy (object, stable ref from chaptersGrouped), credit (number), contextHint (string).
 */
const StrategyLibraryCard = memo(function StrategyLibraryCard({
  strategy, credit, contextHint, isFeatured,
}: {
  strategy: LibraryStrategy;
  credit: number;
  contextHint?: string;
  isFeatured?: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const accent = ACCENT_CLS[strategy.accent];
  const Icon = strategy.icon;
  const sel = useWealthPdfSelectionSafe();
  const selected = sel?.isSelected(strategy.id) ?? false;

  return (
    <>
      <article
        className={cn(
          'group relative flex flex-col rounded-2xl border border-border bg-card text-card-foreground',
          'shadow-sm',
          'transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform',
          'hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] hover:border-foreground/15',
          'motion-reduce:transform-none motion-reduce:transition-none',
          selected && ACCENT_SELECTED_RING[strategy.accent],
        )}
      >
        <PdfSelectCheckbox strategyId={strategy.id} strategyTitle={strategy.title} />
        <header className="p-card-lg flex-1 flex flex-col">
          <div className="flex items-start gap-6">
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', accent.chip)}>
              <Icon className="h-[18px] w-[18px]" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={cn('inline-block h-1.5 w-1.5 rounded-full', accent.dot)} aria-hidden />
                  <span className="text-caption font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {strategy.chapter}
                  </span>
                </div>
                {isFeatured && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 h-5 px-1.5 text-[9px] uppercase tracking-wider font-bold shrink-0">
                    <Sparkles className="h-2 w-2 mr-1" />
                    Destaque
                  </Badge>
                )}
              </div>
              <h4 className="mt-2 text-subtitle md:text-subtitle font-semibold leading-[1.22] tracking-[-0.005em] text-foreground">
                {strategy.title}
              </h4>
            </div>
          </div>
          <p className="mt-4 text-body text-muted-foreground leading-relaxed line-clamp-3 min-h-[3.6em]">
            {strategy.tagline}
          </p>
          <ViabilityPreview strategy={strategy} credit={credit} />
          {contextHint && (
            <div className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full border border-primary/20 bg-primary/[0.06] px-2.5 py-1 text-caption font-medium text-primary">
              <Sparkles className="h-2.5 w-2.5" aria-hidden />
              <span className="leading-none">{contextHint}</span>
            </div>
          )}
        </header>

        <div className="px-7 md:px-8 pb-7 md:pb-8">
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className={cn(
              'w-full flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-4 py-3 min-h-11 md:min-h-0 text-body font-medium text-foreground/80 transition-[colors,box-shadow,transform] active:bg-background',
              'hover:border-primary/40 hover:bg-background hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            )}
            aria-haspopup="dialog"
          >
            <span>Ver estratégia completa</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
          </button>
        </div>
      </article>

      <StrategyDetailDialog
        strategy={strategy}
        credit={credit}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
});

/* ────────────────────────────────────────────────────────────────────── */

function StrategyDetailDialog({
  strategy, credit, open, onOpenChange,
}: {
  strategy: LibraryStrategy;
  credit: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const accent = ACCENT_CLS[strategy.accent];
  const Icon = strategy.icon;
  // Estratégia legada `compra-a-vista` foi removida do catálogo (movida para o Comparador).
  // Mantemos o flag para preservar a estrutura de branches da modal; sempre false agora.
  const isCashStrategy = false;
  const reading = getPatrimonialReading(strategy.id);
  const mentalTrigger = getMentalTrigger(strategy.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[calc(100vw-1.5rem)] sm:w-full max-w-[880px] max-h-[88vh] p-0 gap-0 flex flex-col overflow-hidden sm:rounded-2xl [&>button[type=button]]:hidden"
      >
        {/* Sticky header */}
        <header className="sticky top-0 z-10 flex items-start gap-3.5 border-b border-border/60 bg-background/95 backdrop-blur p-card-md">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', accent.chip)}>
            <Icon className="h-[18px] w-[18px]" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-1.5">
              <span className={cn('inline-block h-1.5 w-1.5 rounded-full', accent.dot)} aria-hidden />
              <span className="text-caption font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {strategy.chapter}
              </span>
            </div>
            <DialogTitle className="mt-1 text-subtitle md:text-subtitle font-semibold leading-tight tracking-tight text-foreground">
              {strategy.title}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-caption md:text-body text-muted-foreground leading-relaxed">
              {strategy.tagline}
            </DialogDescription>
          </div>
          <DialogClose
            aria-label="Fechar"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-caption font-medium text-foreground/75 transition-colors hover:border-primary/40 hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">Fechar</span>
          </DialogClose>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 md:px-7 py-6 md:py-8 space-y-section-gap md:space-y-10 text-body leading-relaxed">
          {/* STORYTELLING HERO — abertura dominante do expanded state.
              Visão (tagline) → Contexto (lógica patrimonial) → Consequência
              (primeira vantagem estrutural). Deriva 100% de campos curados
              já existentes em strategyLibraryData — zero conteúdo novo,
              zero matemática, zero regressão. Espelha o padrão do
              ConsultiveStrategyPanel (strategy-v2). */}
          <section
            aria-label="Visão consultiva"
            className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-primary/[0.02] to-transparent px-5 py-5 md:px-6 md:py-6"
          >
            <div className="text-caption uppercase tracking-[0.16em] text-primary/80 font-semibold mb-3">
              Visão estratégica
            </div>
            {mentalTrigger && (
              <p className="text-body md:text-body font-medium leading-snug text-foreground tracking-tight mb-2.5">
                {mentalTrigger}
              </p>
            )}
            <p className="italic text-subtitle md:text-subtitle leading-snug text-foreground/85 tracking-tight">
              “{strategy.tagline}”
            </p>
            <div className="mt-4 space-y-2.5 border-t border-primary/15 pt-3.5">
              <p className="text-body md:text-body leading-relaxed text-foreground/85">
                <span className="text-micro uppercase tracking-[0.14em] text-muted-foreground/80 font-semibold mr-1.5 align-middle">
                  Contexto
                </span>
                {strategy.heroContext ?? strategy.patrimonialLogic}
              </p>
              {(strategy.heroConsequence ?? strategy.advantages[0]) && (
                <p className="text-body md:text-body leading-relaxed text-foreground/85">
                  <span className="text-micro uppercase tracking-[0.14em] text-muted-foreground/80 font-semibold mr-1.5 align-middle">
                    Consequência
                  </span>
                  {strategy.heroConsequence ?? strategy.advantages[0]}
                </p>
              )}
            </div>
          </section>

          {isCashStrategy ? (
            <section className="space-y-2.5">
              <p className="text-foreground/85 whitespace-pre-line">{strategy.howItWorks}</p>
              <p className="text-caption text-muted-foreground leading-relaxed">
                <span className="text-foreground/80 font-medium">Essência:</span>{' '}
                preservar liquidez, manter capital aplicado, usar o rendimento
                para compensar a parcela e adquirir o bem sem descapitalizar.
              </p>
            </section>
          ) : (
            <>
              <Block icon={BookOpen} title="Como funciona & racional">
                <p className="text-foreground/85 whitespace-pre-line">{strategy.howItWorks}</p>
                <Definition label="Lógica patrimonial" text={strategy.patrimonialLogic} />
                <Definition label="Impacto em liquidez" text={strategy.liquidityImpact} />
                <Definition label="Timing ideal" text={strategy.timing} />
              </Block>

              <DecisionSupportBlock strategyId={strategy.id} />

              {reading && (
                <section className="rounded-xl border border-primary/15 bg-primary/[0.025] px-4 py-5 md:px-6 md:py-6">
                  <header className="flex items-center gap-2 mb-3">
                    <Quote className="h-3.5 w-3.5 text-primary/70" aria-hidden />
                    <h5 className="text-caption font-semibold uppercase tracking-[0.14em] text-foreground/75">
                      Leitura patrimonial
                    </h5>
                  </header>
                  <p className="text-body leading-relaxed text-foreground/85">
                    {reading}
                  </p>
                </section>
              )}
            </>
          )}

          {/* Cálculos + Comparativos (simulação-first para Compra à Vista) */}
          {isCashStrategy && (
            <div className="space-y-8 md:space-y-10">
              <CalculationsBlock strategy={strategy} credit={credit} />
              <ComparisonsBlock strategy={strategy} />
            </div>
          )}

          {/* Vantagens / Riscos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-6">
            <Block icon={Lightbulb} title="Vantagens estruturais">
              <ul className="space-y-1.5 list-disc list-outside pl-4 marker:text-primary/60 text-foreground/85">
                {strategy.advantages.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </Block>
            <Block icon={AlertTriangle} title="Riscos & limites" accent="warning">
              <SubGroup label="Riscos" items={strategy.risks} />
              <SubGroup label="Erros comuns" items={strategy.commonMistakes} />
              <SubGroup label="Quando NÃO usar" items={strategy.whenNotToUse} />
            </Block>
          </div>

          {/* Cálculos — apenas demais estratégias (Compra à Vista já mostrou acima) */}
          {!isCashStrategy && <CalculationsBlock strategy={strategy} credit={credit} />}

          {/* Mini-simulador interativo — gate declarativo via `embeddedSimulation`. */}
          {strategy.embeddedSimulation && <InteractiveSimulator strategy={strategy} />}



          {/* Cenários */}
          <Block icon={MapIcon} title="Cenários de aplicação">
            <div className="space-y-2.5">
              {strategy.scenarios.map((sc, i) => (
                <div key={i} className="rounded-lg border border-border/50 bg-muted/20 p-3.5">
                  <div className="text-caption font-medium uppercase tracking-[0.14em] text-primary">{sc.context}</div>
                  <p className="mt-1.5 text-foreground/85 leading-relaxed">{sc.detail}</p>
                </div>
              ))}
            </div>
          </Block>

          {/* Gatilhos para a conversa — só renderiza se a estratégia declarar mentalTriggers. */}
          {strategy.mentalTriggers && strategy.mentalTriggers.length > 0 && (
            <MentalTriggersBlock strategy={strategy} triggers={strategy.mentalTriggers} />
          )}

          {/* Comparativos — apenas demais estratégias */}
          {!isCashStrategy && <ComparisonsBlock strategy={strategy} />}

          {/* Nota tributária — renderiza apenas se a estratégia declarar `taxNote`. */}
          {strategy.taxNote && <TaxNoteBlock text={strategy.taxNote} />}



          {/* Continuidade consultiva — não força, apenas sugere o próximo passo. */}
          <ContinuityCTA strategyId={strategy.id} onAfterAction={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

/**
 * ContinuityCTA — sugere o próximo passo natural da jornada (não força).
 * Grava a tese ativa no contexto global leve e leva ao Simulador.
 */
function ContinuityCTA({ strategyId, onAfterAction }: { strategyId: string; onAfterAction: () => void }) {
  const { setActiveStrategy } = useActiveStrategy();
  const { navigateTo } = useModuleNavigation();
  const steps = getStrategyNextSteps(strategyId);
  const primary = steps.find((s) => s.kind === 'primary') ?? steps[0];
  const secondaries = steps.filter((s) => s !== primary).slice(0, 2);

  const handle = (step: StrategyNextStep) => {
    setActiveStrategy(strategyId, 'wealth-library');
    onAfterAction();
    navigateTo(step.to);
  };

  return (
    <div className="mt-2 rounded-xl border border-border/60 bg-muted/20 p-card-sm md:p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap md:flex-nowrap">
        <div className="min-w-0">
          <div className="text-caption font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Continuidade consultiva
          </div>
          <p className="mt-0.5 text-caption text-foreground/85 leading-snug">
            Próximos passos naturais desta tese — a plataforma preserva o contexto.
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0"
          onClick={() => handle(primary)}
        >
          <PlayCircle className="h-4 w-4 mr-1.5" aria-hidden />
          {primary.label}
        </Button>
      </div>
      {secondaries.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {secondaries.map((step) => (
            <button
              key={`${step.to}-${step.label}`}
              type="button"
              onClick={() => handle(step)}
              className="inline-flex items-center gap-1 text-caption font-medium text-primary hover:text-primary hover:underline underline-offset-[3px] decoration-primary/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            >
              <span>{step.label}</span>
              <ArrowRight className="h-3 w-3" aria-hidden />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

function Block({
  icon: Icon, title, children, accent = 'primary',
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  accent?: 'primary' | 'warning';
}) {
  const tone = accent === 'warning' ? 'text-warning' : 'text-primary';
  return (
    <section className="space-y-3">
      <header className="flex items-center gap-2">
        <Icon className={cn('h-3.5 w-3.5', tone)} />
        <h5 className="text-caption font-semibold uppercase tracking-[0.14em] text-foreground/75">{title}</h5>
      </header>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function Definition({ label, text }: { label: string; text: string }) {
  return (
    <p className="text-foreground/80">
      <span className="text-foreground font-medium">{label}.</span>{' '}
      <span className="whitespace-pre-line">{text}</span>
    </p>
  );
}

function SubGroup({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-caption font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <ul className="mt-1.5 space-y-1 list-disc list-outside pl-4 marker:text-warning/60 text-foreground/85">
        {items.map((m, i) => <li key={i}>{m}</li>)}
      </ul>
    </div>
  );
}

/**
 * KPIs executivos do card — taxonomia canônica por estratégia.
 *
 * Fonte canônica: `strategyExecutiveKpis.ts` declara, por estratégia, quais
 * KPIs (ROI, TIR, Payback, Multiplicador, Capital Preservado, Fluxo Mensal,
 * Patrimônio Final, Lucro, Economia, Parcela, Custo Total, Cobertura,
 * Exposição) reforçam a tese — máximo 3 (1 hero + ≤2 secundários).
 *
 * Os valores vêm de `strategy.calculations[index].result(credit)` — ZERO
 * cálculo novo, ZERO duplicação de math. O motor financeiro permanece
 * intocado (regra Core).
 *
 * Fallback: estratégias sem entrada no mapa caem na heurística antiga
 * (últimas 3 calculations) — permite rollout incremental.
 */
const ViabilityPreview = memo(function ViabilityPreview({ strategy, credit }: { strategy: LibraryStrategy; credit: number }) {
  const calcCtx = useWealthAssumptionsSafe()?.calcContext;
  
  const kpis = useMemo(() => {
    const all = strategy.calculations;
    if (all.length === 0) return [];

    const picks = STRATEGY_EXECUTIVE_KPIS[strategy.id];
    const shortValue = (s: string) => s.replace(/\s*\([^)]*\)\s*$/, '').trim();

    // Modo canônico — picks declarados.
    const canonical = picks
      ?.map((p) => {
        const calc = all[p.calculationIndex];
        if (!calc) return null;
        const source: ExecutiveKpiSource = p.source ?? EXECUTIVE_KPI_DEFAULT_SOURCE[p.kind];
        const baseHint = EXECUTIVE_KPI_HINTS[p.kind];
        const sourceHint = EXECUTIVE_KPI_SOURCE_HINT[source];
        return {
          kind: p.kind as string,
          label: p.label,
          value: shortValue(calc.result(credit, calcCtx)),
          hero: !!p.hero,
          hint: `${baseHint} · ${sourceHint}`,
          source,
        };
      })
      .filter((x): x is NonNullable<typeof x> => !!x);

    if (canonical && canonical.length > 0) return canonical;

    // Fallback — últimas 3 calculations com label limpo (sem governança de source).
    return all.slice(-3).map((calc, i, arr) => ({
      kind: 'generic',
      label: calc.label.replace(/\s*\([^)]*\)\s*$/, '').trim(),
      value: shortValue(calc.result(credit, calcCtx)),
      hero: i === arr.length - 1,
      hint: '',
      source: 'engine' as ExecutiveKpiSource,
    }));
  }, [strategy.calculations, strategy.id, credit, calcCtx]);

  if (kpis.length === 0) return null;

  const hero = kpis.find((k) => k.hero) ?? kpis[0];
  const secondary = kpis.filter((k) => k !== hero);

  return (
    <div className="mt-4 border-t border-border/40 pt-3">
      <div className="mb-2 flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Calculator className="h-3 w-3 text-primary/70" aria-hidden />
        <span>Indicadores da estratégia</span>
      </div>

      {/* Hero KPI — destaque visual da tese.
        * Layout: grid `[minmax(0,1fr) auto]` — VALOR tem prioridade absoluta de
        * largura (auto + whitespace-nowrap), LABEL cede espaço (min-w-0 + truncate).
        * Sem max-width no número: financeiros (R$ 5.000.000, 8.2 anos) sempre íntegros.
        */}
      <div
        className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 rounded-md bg-muted/30 px-2.5 py-1.5"
        title={hero.hint || hero.label}
      >
        <span className="min-w-0 truncate text-caption font-medium text-muted-foreground inline-flex items-center gap-1">
          <span className="truncate">{hero.label}</span>
          {hero.source === 'editorial' && (
            <span
              aria-label="Estimativa de mercado"
              className="text-micro text-muted-foreground/75 italic font-normal shrink-0"
            >
              ~
            </span>
          )}
        </span>
        <span className="text-right text-body font-bold tabular-nums text-foreground whitespace-nowrap">
          {hero.value}
        </span>
      </div>

      {/* Secundários — leitura rápida.
        * Mesma regra: número íntegro, label cede. Grid auto na coluna do valor
        * elimina cap artificial de 58% (causa do "R$ 5..." e "8...").
        */}
      {secondary.length > 0 && (
        <dl className="space-y-1">
          {secondary.map((k) => (
            <div
              key={`${k.kind}-${k.label}`}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 text-caption leading-snug"
            >
              <dt
                className="min-w-0 truncate text-muted-foreground inline-flex items-center gap-1"
                title={k.hint || k.label}
              >
                <span className="truncate">{k.label}</span>
                {k.source === 'editorial' && (
                  <span
                    aria-label="Estimativa de mercado"
                    className="text-micro text-muted-foreground/75 italic shrink-0"
                  >
                    ~
                  </span>
                )}
              </dt>
              <dd
                className="text-right font-semibold tabular-nums text-foreground whitespace-nowrap"
                title={k.value}
              >
                {k.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {/* Rodapé de transparência — discreto, só quando há editorial */}
      {kpis.some((k) => k.source === 'editorial') && (
        <p className="mt-2 text-micro leading-snug text-muted-foreground/70 italic">
          <span aria-hidden>~</span> estimativa de mercado · demais valores calculados pela simulação
        </p>
      )}
    </div>
  );
});

/* ──────────────────────────────────────────────────────────────────────
 * OperatingContextBar · Nível 2+3 unificados em uma linha discreta
 *
 * Esquerda  · Contexto operacional (modalidade, contextual)
 * Direita   · Ordenação (utilitário, dropdown nativo institucional)
 *
 * Separação semântica explícita via divisor vertical. Tipografia
 * intencionalmente menor que os capítulos (Nível 1) — o cérebro
 * lê a hierarquia em <2s sem esforço.
 * ────────────────────────────────────────────────────────────────────── */
function OperatingContextBar({
  modality,
  onModalityChange,
  suggestedModality,
  orderKey,
  onOrderChange,
  contextActive,
}: {
  modality: ConsortiumModality;
  onModalityChange: (m: ConsortiumModality) => void;
  suggestedModality: ConsortiumModality;
  orderKey: ExecutiveOrderKey;
  onOrderChange: (k: ExecutiveOrderKey) => void;
  contextActive: boolean;
}) {
  const isAuto = modality === suggestedModality && suggestedModality !== 'all';
  const activeModality = MODALITY_OPTIONS.find((m) => m.id === modality) ?? MODALITY_OPTIONS[0];
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-5',
        'rounded-xl border border-border/55 bg-muted/25 px-3.5 md:px-4 py-3 md:py-2.5',
      )}
    >
      {/* ─── Esquerda · Contexto operacional ─── */}
      <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
        <div className="flex items-center gap-1.5 shrink-0">
          <Compass className="h-3 w-3 text-primary/70" aria-hidden />
          <span className="text-caption font-medium uppercase tracking-[0.18em] text-muted-foreground/85">
            Contexto
          </span>
        </div>
        <div
          role="radiogroup"
          aria-label="Modalidade de consórcio em análise"
          className="flex flex-wrap items-center gap-1"
        >
          {MODALITY_OPTIONS.map((m) => {
            const selected = m.id === modality;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onModalityChange(m.id)}
                title={m.hint}
                className={cn(
                  'inline-flex items-center rounded-md h-9 px-4 text-caption font-medium tracking-tight transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  selected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground/70 hover:text-foreground hover:bg-background/70',
                )}
              >
                {m.label}
              </button>
            );
          })}
        </div>
        {isAuto && (
          <span className="text-caption text-muted-foreground/75 italic shrink-0">
            sugerido pelo simulador
          </span>
        )}
      </div>

      {/* ─── Divisor vertical (desktop) ─── */}
      <div className="hidden md:block h-5 w-px bg-border/60" aria-hidden />

      {/* ─── Direita · Ordenação (utilitário) ─── */}
      <label className="flex items-center gap-2 shrink-0 self-start md:self-auto">
        <span className="inline-flex items-center gap-1.5 text-caption font-medium uppercase tracking-[0.18em] text-muted-foreground/85">
          <ArrowUpDown className="h-3 w-3 text-primary/60" aria-hidden />
          Ordenar
        </span>
        <select
          value={orderKey}
          onChange={(e) => onOrderChange(e.target.value as ExecutiveOrderKey)}
          aria-label="Ordenação executiva das estratégias"
          className={cn(
            'rounded-md border border-border/60 bg-background px-2.5 py-1 pr-7 text-caption font-medium tracking-tight text-foreground/85',
            'hover:border-primary/40 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:0.7em] cursor-pointer',
          )}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath fill='none' stroke='%23666' stroke-width='1.5' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E\")",
          }}
        >
          {EXECUTIVE_ORDER_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </label>

      {/* ─── Helper microcopy (full-width, abaixo) ─── */}
      <p className="md:hidden text-caption text-muted-foreground/75 leading-snug">
        {activeModality.hint}
        {contextActive && orderKey === 'editorial' && ' Ordem ajustada ao contexto da simulação.'}
      </p>
    </div>
  );
}


/* ────────────────────────────────────────────────────────────────────── */


/** Cálculos ilustrativos — tabela ≥md, card-stack no mobile. Reutilizado
 * pela camada simulação-first (Compra à Vista) e pela camada analítica
 * padrão das demais estratégias. */
function CalculationsBlock({ strategy, credit }: { strategy: LibraryStrategy; credit: number }) {
  const calcCtx = useWealthAssumptionsSafe()?.calcContext;
  const calculationRows = useMemo(
    () => strategy.calculations.map((c) => ({
      label: c.label,
      formula: c.formula,
      result: c.result(credit, calcCtx),
      meaning: getCalcMeaning(strategy.id, c.label),
    })),
    [
      strategy.calculations,
      strategy.id,
      credit,
      calcCtx?.cdiAnnual,
      calcCtx?.cdiGrossAnnual,
      calcCtx?.cdiAnnualLiq,
      calcCtx?.cdiMonthlyLiq,
      calcCtx?.contemplationMonth,
      calcCtx?.analysisMonths,
      calcCtx?.monthsAfterContemplation,
      calcCtx?.propertyAppreciation,
      calcCtx?.rentalYield,
      calcCtx?.agioOnSale,
      calcCtx?.discountOnSale,
      calcCtx?.tipoVendaCarta,
      calcCtx?.fullInstallment,
      calcCtx?.sim?.creditValue,
      calcCtx?.sim?.consortiumType,
      calcCtx?.sim?.termMonths,
      calcCtx?.sim?.adminFeePercent,
      calcCtx?.sim?.adminFeeDiscountPercent,
      calcCtx?.sim?.reserveFundPercent,
      calcCtx?.sim?.insuranceEnabled,
      calcCtx?.sim?.insurancePercent,
      calcCtx?.sim?.annualAdjustmentPercent,
      calcCtx?.sim?.embeddedBidPercent,
      calcCtx?.sim?.freeBidPercent,
      calcCtx?.sim?.contemplationMonth,
      calcCtx?.sim?.effectiveAdminFeePercent,
      calcCtx?.sim?.effectiveInsurancePercent,
      calcCtx?.sim?.costPlan,
      calcCtx?.sim?.totalInsurance,
      calcCtx?.sim?.totalCost,
      calcCtx?.sim?.fullInstallment,
      calcCtx?.sim?.effectiveClientCost,
    ],
  );
  return (
    <Block icon={Calculator} title="Cálculos ilustrativos">
      <ul className="md:hidden space-y-2.5">
        {calculationRows.map((row, i) => {
          return (
            <li key={i} className="rounded-lg border border-border/50 bg-muted/15 p-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-caption font-medium text-foreground/90">{row.label}</span>
                <span className="text-body font-semibold tabular-nums text-foreground shrink-0">{row.result}</span>
              </div>
              <div className="mt-1.5 text-caption font-mono text-muted-foreground leading-snug break-all">
                {row.formula}
              </div>
              {row.meaning && (
                <p className="mt-2 text-caption italic text-muted-foreground/85 leading-snug">
                  <span className="text-foreground/60 font-medium not-italic mr-1">Leitura:</span>{row.meaning}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <div className="hidden md:block overflow-x-auto -mx-1 px-1">
        <table className="w-full text-caption border-separate border-spacing-0">
          <thead>
            <tr className="text-caption font-medium uppercase tracking-[0.1em] text-muted-foreground">
              <th className="pb-2 pr-3 text-left font-medium border-b border-border/60">Métrica</th>
              <th className="pb-2 px-3 text-left font-medium border-b border-border/60">Fórmula</th>
              <th className="pb-2 pl-3 text-right font-medium border-b border-border/60">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {calculationRows.map((row, i) => {
              return (
                <Fragment key={i}>
                  <tr className="group/row">
                    <td className="py-2.5 pr-3 text-foreground/90 border-b border-border/30 align-top">{row.label}</td>
                    <td className="py-2.5 px-3 text-muted-foreground font-mono text-caption border-b border-border/30 align-top">{row.formula}</td>
                    <td className="py-2.5 pl-3 text-right font-semibold tabular-nums text-foreground border-b border-border/30 align-top">{row.result}</td>
                  </tr>
                  {row.meaning && (
                    <tr>
                      <td colSpan={3} className="pb-2.5 pt-0 pr-3 pl-0 text-caption italic text-muted-foreground/85 leading-snug border-b border-border/20">
                        <span className="text-foreground/60 font-medium not-italic mr-1.5">Leitura:</span>{row.meaning}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-caption text-muted-foreground/80 italic mt-2.5">
        Valores ilustrativos — não constituem promessa de retorno.
      </p>
    </Block>
  );
}

/** Comparativos vs alternativas — tabela ≥md, card-stack no mobile. */
function ComparisonsBlock({ strategy }: { strategy: LibraryStrategy }) {
  return (
    <Block icon={Scale} title="Comparativos vs alternativas">
      <ul className="md:hidden space-y-2.5">
        {strategy.comparisons.map((row, i) => {
          const why = getComparisonWhy(strategy.id, row.label);
          return (
            <li key={i} className="rounded-lg border border-border/50 bg-muted/15 p-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-caption font-medium text-foreground/90">{row.label}</span>
                <span className="text-body font-semibold tabular-nums text-primary shrink-0">{row.delta}</span>
              </div>
              <dl className="mt-2 space-y-1 text-caption leading-snug">
                <div className="flex gap-2">
                  <dt className="text-caption uppercase tracking-[0.1em] font-medium text-muted-foreground shrink-0 pt-0.5 w-[68px]">Consórcio</dt>
                  <dd className="text-foreground/85">{row.consortium}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-caption uppercase tracking-[0.1em] font-medium text-muted-foreground shrink-0 pt-0.5 w-[68px]">Alternativa</dt>
                  <dd className="text-muted-foreground">{row.alternative}</dd>
                </div>
              </dl>
              {why && (
                <p className="mt-2 text-caption italic text-muted-foreground/85 leading-snug">
                  <span className="text-foreground/60 font-medium not-italic mr-1">Por quê:</span>{why}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <div className="hidden md:block overflow-x-auto -mx-1 px-1">
        <table className="w-full text-caption border-separate border-spacing-0">
          <thead>
            <tr className="text-caption font-medium uppercase tracking-[0.1em] text-muted-foreground">
              <th className="pb-2 pr-3 text-left font-medium border-b border-border/60">Dimensão</th>
              <th className="pb-2 px-3 text-left font-medium border-b border-border/60">Consórcio</th>
              <th className="pb-2 px-3 text-left font-medium border-b border-border/60">Alternativa</th>
              <th className="pb-2 pl-3 text-right font-medium border-b border-border/60">Δ</th>
            </tr>
          </thead>
          <tbody>
            {strategy.comparisons.map((row, i) => {
              const why = getComparisonWhy(strategy.id, row.label);
              return (
                <Fragment key={i}>
                  <tr>
                    <td className="py-2.5 pr-3 text-foreground/90 border-b border-border/30 align-top">{row.label}</td>
                    <td className="py-2.5 px-3 text-foreground/85 border-b border-border/30 align-top">{row.consortium}</td>
                    <td className="py-2.5 px-3 text-muted-foreground border-b border-border/30 align-top">{row.alternative}</td>
                    <td className="py-2.5 pl-3 text-right font-semibold tabular-nums text-primary border-b border-border/30 align-top">{row.delta}</td>
                  </tr>
                  {why && (
                    <tr>
                      <td colSpan={4} className="pb-2.5 pt-0 pr-3 pl-0 text-caption italic text-muted-foreground/85 leading-snug border-b border-border/20">
                        <span className="text-foreground/60 font-medium not-italic mr-1.5">Por quê:</span>{why}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Block>
  );
}

/** Nota tributária — bloco de atenção, só renderiza se a estratégia declarar `taxNote`. */
function TaxNoteBlock({ text }: { text: string }) {
  return (
    <Block icon={ShieldAlert} title="Nota tributária" accent="warning">
      <div className="space-y-2 text-foreground/85 leading-relaxed whitespace-pre-line">
        {text}
      </div>
      <p className="text-caption text-muted-foreground/80 italic mt-2.5">
        Conteúdo informativo — não substitui orientação de contador ou advogado tributarista.
      </p>
    </Block>
  );
}

/**
 * Gatilhos para a conversa — só renderiza se a estratégia declarar `mentalTriggers`.
 * Inclui no topo o painel opcional de Storytelling Personalizado por IA.
 */
function MentalTriggersBlock({
  strategy,
  triggers,
}: {
  strategy: LibraryStrategy;
  triggers: MentalTrigger[];
}) {
  return (
    <Block icon={Lightbulb} title="Gatilhos para a conversa" accent="primary">
      <div className="space-y-4">
        {/* Storytelling personalizado por IA (topo do bloco) */}
        {/* Storytelling personalizado por IA (topo do bloco).
            Round 3.A.2: gating depende APENAS de `narrativeContext` populado.
            Edge Function agora é tese-agnóstica e consome o contrato. */}
        {strategy.narrativeContext && (
          <StrategyStorytellingPanel strategy={strategy} />
        )}

        {triggers.map((t, i) => (
          <div
            key={i}
            className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3.5 space-y-2"
          >
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-caption font-medium text-primary">
              {t.label}
            </span>
            <p className="text-foreground/90 leading-relaxed">{t.example}</p>
            <p className="text-caption text-muted-foreground/85 leading-relaxed italic">
              {t.context}
            </p>
          </div>
        ))}
      </div>
    </Block>
  );
}

/* InteractiveSimulator extraído para `./InteractiveSimulator` (Round 4.2). */





/* ──────────────────────────────────────────────────────────────────────
 * StrategyStorytellingPanel — narrativa personalizada via edge
 * `strategy-storytelling`. Form mínimo (nome, objetivo, perfil), cache
 * local de sessão (aiResponseCache, TTL 15min) para evitar burst.
 * ────────────────────────────────────────────────────────────────────── */
type PerfilRisco = 'conservador' | 'moderado' | 'arrojado';

function StrategyStorytellingPanel({ strategy }: { strategy: LibraryStrategy }) {


  const { toast } = useToast();
  const { input } = useSimulatorInput();
  const { baseResult, isValidSimulation } = useSimulatorResult();
  const wealthCtx = useWealthAssumptionsSafe();
  const { currentCompanyId } = useCurrentCompany();

  const fullInstallment = baseResult?.fullInstallment ?? 0;
  // contemplationMonth: usa o valor das premissas patrimoniais (canônico),
  // com fallback para metade do prazo do Simulador.
  const contemplationMonth = useMemo(() => {
    const fromAssumptions = wealthCtx?.assumptions?.contemplationMonth ?? 0;
    if (fromAssumptions > 0) return fromAssumptions;
    const term = input?.termMonths ?? 0;
    return term > 0 ? Math.max(1, Math.round(term / 2)) : 1;
  }, [wealthCtx?.assumptions?.contemplationMonth, input?.termMonths]);
  // (agioOnSale agora vem do wealthCtx.calcContext consumido pelos
  // computeFields da estratégia — não é mais montado aqui.)

  const simReady =
    isValidSimulation &&
    (input?.creditValue ?? 0) > 0 &&
    fullInstallment > 0 &&
    contemplationMonth > 0;

  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [perfilRisco, setPerfilRisco] = useState<PerfilRisco>('moderado');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const reset = useCallback(() => {
    setNarrative(null);
    setError(null);
    setEditing(false);
    setFromCache(false);
  }, []);

  const generate = useCallback(async (opts?: { force?: boolean }) => {
    setError(null);
    if (nome.trim().length < 2) { setError('Informe o nome do cliente.'); return; }
    if (objetivo.trim().length < 5) { setError('Descreva o objetivo do cliente.'); return; }
    if (!simReady) { setError('Faça uma simulação válida no Simulador antes de gerar a narrativa.'); return; }
    if (!strategy.narrativeContext) {
      setError('Esta estratégia ainda não tem narrativa consultiva configurada.');
      return;
    }

    const clientContext = {
      nome: nome.trim(),
      objetivo: objetivo.trim(),
      perfilRisco,
    };

    // Round 3.A.2 — computa campos via narrativeContext (fonte única).
    const ctx = wealthCtx?.calcContext ?? null;
    if (!ctx) {
      setError('Premissas patrimoniais indisponíveis. Abra o módulo Wealth e tente novamente.');
      return;
    }
    const computedFields = strategy.narrativeContext.computeFields(ctx);

    const narrativeContextPayload = {
      thesisFrame: strategy.narrativeContext.thesisFrame,
      vocabulary: strategy.narrativeContext.vocabulary,
      primaryRisk: strategy.narrativeContext.primaryRisk,
      nextStepHint: strategy.narrativeContext.nextStepHint,
      computedFields,
    };

    // v2 — invalida cache antigo envenenado.
    const key = cacheKey(
      'strategy-storytelling-v2',
      { strategyId: strategy.id, clientContext, narrativeContext: narrativeContextPayload },
      currentCompanyId,
    );

    if (!opts?.force) {
      const cached = getCached<string>(key);
      if (cached) {
        setNarrative(cached);
        setFromCache(true);
        setEditing(false);
        return;
      }
    }

    setLoading(true);
    setFromCache(false);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'strategy-storytelling',
        {
          body: {
            strategyId: strategy.id,
            strategyTitle: strategy.title,
            thesisShort: strategy.tagline,
            narrativeContext: narrativeContextPayload,
            clientContext,
          },
        },
      );
      if (invokeError) throw invokeError;
      const resp = (data as {
        storytelling?: string;
        safeFallback?: boolean;
        fallbackReason?: string;
      } | null) ?? {};
      const text = resp.storytelling;
      if (!text) throw new Error('Resposta vazia da IA.');

      if (resp.safeFallback === true) {
        // NÃO renderiza como narrativa válida. NÃO grava em cache.
        console.warn('[Storytelling] Safe fallback triggered', {
          strategyId: strategy.id,
          fallbackReason: resp.fallbackReason,
        });
        toast({
          title: 'Não consegui gerar uma narrativa segura desta vez.',
          description: 'Tente novamente em alguns segundos.',
          variant: 'destructive',
        });
        return;
      }

      setNarrative(text);
      setCached(key, text);
      setEditing(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Não foi possível gerar a narrativa agora.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [
    nome, objetivo, perfilRisco, simReady,
    wealthCtx?.calcContext,
    strategy.id, strategy.title, strategy.tagline, strategy.narrativeContext,
    currentCompanyId, toast,
  ]);

  const handleCopy = useCallback(async () => {
    const text = editing ? draft : narrative;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Narrativa copiada', description: 'Cole no WhatsApp ou e-mail do cliente.' });
    } catch {
      toast({ title: 'Falha ao copiar', variant: 'destructive' });
    }
  }, [editing, draft, narrative, toast]);

  const startEdit = useCallback(() => {
    if (!narrative) return;
    setDraft(narrative);
    setEditing(true);
  }, [narrative]);

  // CTA inicial: botão sutil
  if (!open && !narrative) {
    return (
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.025] p-3.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-caption font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Gerar narrativa personalizada
        </button>
        <p className="mt-1 text-caption text-muted-foreground/85">
          Crie um storytelling sob medida para um cliente específico, usando os números desta simulação.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden />
        <h6 className="text-caption font-semibold uppercase tracking-[0.12em] text-primary">
          Narrativa personalizada
        </h6>
      </div>

      {/* FORM */}
      {!narrative && open && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-caption font-medium text-foreground/80">Nome do cliente</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="ex.: João Silva"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-caption font-medium text-foreground/80">Objetivo curto</label>
            <input
              type="text"
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              placeholder="ex.: diversificar reserva, fazer dinheiro render"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-caption font-medium text-foreground/80">Perfil de risco</label>
            <select
              value={perfilRisco}
              onChange={(e) => setPerfilRisco(e.target.value as PerfilRisco)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="conservador">Conservador</option>
              <option value="moderado">Moderado</option>
              <option value="arrojado">Arrojado</option>
            </select>
          </div>
          {error && (
            <p className="text-caption text-destructive leading-relaxed">{error}</p>
          )}
          {!simReady && (
            <p className="text-caption text-muted-foreground leading-relaxed">
              Faça uma simulação válida no Simulador para usar os números reais.
            </p>
          )}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setOpen(false); setError(null); }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => generate()}
              disabled={loading || !simReady}
            >
              {loading ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" aria-hidden /> Gerando narrativa personalizada...</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5 mr-1.5" aria-hidden /> Gerar narrativa</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* RESULT */}
      {narrative && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-caption font-medium text-foreground/85">
              Narrativa para {nome}
              {fromCache && (
                <span className="ml-2 text-muted-foreground/85 italic">
                  (narrativa anterior — gerar outra?)
                </span>
              )}
            </p>
          </div>
          {editing ? (
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-[260px] text-sm leading-relaxed whitespace-pre-line"
            />
          ) : (
            <div className="rounded-md border border-border/60 bg-background px-3.5 py-3 text-body leading-relaxed text-foreground/90 whitespace-pre-line">
              {narrative}
            </div>
          )}
          {error && (
            <p className="text-caption text-destructive leading-relaxed">{error}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5 mr-1.5" aria-hidden /> Copiar texto
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => generate({ force: true })}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden />
              )}
              Gerar outra versão
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={editing ? () => setEditing(false) : startEdit}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" aria-hidden />
              {editing ? 'Concluir edição' : 'Editar antes de usar'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Nova narrativa
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


/* ────────────────────────────────────────────────────────────────────── */


/**
 * Bloco de Apoio à Decisão — guidance consultivo silencioso.
 * Renderiza apenas se houver dados de decisão para a estratégia.
 * Cinco micro-blocos: Fit, Atenção, Perfil, Trade-off, Horizonte.
 */
function DecisionSupportBlock({ strategyId }: { strategyId: string }) {
  const ds = getDecisionSupport(strategyId);
  if (!ds) return null;

  return (
    <section className="rounded-xl border border-border/60 bg-muted/15 px-4 py-5 md:px-6 md:py-6 space-y-5">
      <header className="flex items-center gap-2">
        <Compass className="h-3.5 w-3.5 text-primary" aria-hidden />
        <h5 className="text-caption font-semibold uppercase tracking-[0.14em] text-foreground/75">
          Apoio à decisão
        </h5>
      </header>

      {/* Fit + Caution: lado-a-lado no desktop, empilhados no mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-5">
        <DecisionLine
          icon={Lightbulb}
          tone="primary"
          label="Faz mais sentido quando"
          text={ds.fit}
        />
        <DecisionLine
          icon={ShieldAlert}
          tone="warning"
          label="Exige atenção quando"
          text={ds.caution}
        />
      </div>

      {/* Perfil patrimonial — chips discretos */}
      {ds.profile.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-caption font-medium uppercase tracking-[0.12em] text-muted-foreground mr-1">
            Aderência patrimonial
          </span>
          {ds.profile.map((p) => (
            <span
              key={p}
              className="inline-flex items-center rounded-full border border-border/60 bg-background px-2.5 py-0.5 text-caption font-medium text-foreground/75"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      {/* Trade-off explícito */}
      <DecisionLine
        icon={ArrowLeftRight}
        tone="primary"
        label="Trade-off"
        compact
      >
        <span className="text-foreground/85">
          <span className="font-medium text-foreground">Ganha · </span>{ds.tradeoff.gains}
        </span>
        <span className="block mt-1 text-foreground/75">
          <span className="font-medium text-foreground">Troca · </span>{ds.tradeoff.trades}
        </span>
      </DecisionLine>

      {/* Horizonte — evolução curto / médio / longo */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Clock className="h-3 w-3 text-primary/70" aria-hidden />
          <span className="text-caption font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Evolução no tempo
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {([
            ['Curto prazo', ds.horizon.short],
            ['Médio prazo', ds.horizon.medium],
            ['Longo prazo', ds.horizon.long],
          ] as const).map(([label, text]) => (
            <div
              key={label}
              className="rounded-lg border border-border/50 bg-background p-card-sm"
            >
              <div className="text-caption font-semibold uppercase tracking-[0.14em] text-primary/80">
                {label}
              </div>
              <p className="mt-1.5 text-caption text-foreground/80 leading-relaxed">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DecisionLine({
  icon: Icon, tone, label, text, children, compact = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: 'primary' | 'warning';
  label: string;
  text?: string;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  const toneCls = tone === 'warning' ? 'text-warning' : 'text-primary';
  return (
    <div className={cn('space-y-1.5', compact && 'space-y-1')}>
      <div className="flex items-center gap-1.5">
        <Icon className={cn('h-3 w-3', toneCls)} aria-hidden />
        <span className="text-caption font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
      </div>
      {text && <p className="text-caption text-foreground/85 leading-relaxed">{text}</p>}
      {children && <div className="text-caption leading-relaxed">{children}</div>}
    </div>
  );
}


/* ──────────────────────────────────────────────────────────────────────
 * FlagshipLayer — Teses patrimoniais em destaque
 *
 * Camada editorial discreta (≤4 itens) acima dos capítulos. Dá protagonismo
 * silencioso às teses mais sofisticadas: alavancagem, multiplicação de
 * cotas, uso da carta como funding. NÃO é hero, NÃO é "top ganhos".
 * Visual: eyebrow + numerais romanos + linha-tese em itálico serif + CTA
 * sutil que abre o mesmo `StrategyDetailDialog` do catálogo.
 * ────────────────────────────────────────────────────────────────────── */
function FlagshipLayer({
  items,
  credit,
}: {
  items: LibraryStrategy[];
  credit: number;
}) {
  return (
    <Collapsible defaultOpen className="space-y-section-gap group/flagship">
      <header className="flex items-end justify-between gap-6 flex-wrap">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-caption font-medium uppercase tracking-[0.22em] text-primary">
            <Crown className="h-3 w-3" aria-hidden />
            Estratégias em destaque
          </div>
          <h3 id="wealth-flagship-title" className="text-subtitle md:text-title font-semibold tracking-[-0.005em] text-foreground">
            As mais utilizadas em atendimentos
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden md:block text-caption text-muted-foreground max-w-md leading-relaxed">
            Estruturas patrimoniais de maior profundidade consultiva. Compõem o repertório
            que diferencia a mesa — continuam acessíveis nos capítulos abaixo.
          </p>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/flagship:rotate-180" />
              <span className="group-data-[state=open]/flagship:hidden">Mostrar</span>
              <span className="group-data-[state=closed]/flagship:hidden">Recolher</span>
            </Button>
          </CollapsibleTrigger>
        </div>
      </header>

      <CollapsibleContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-5 pt-2">
          {items.map((strategy) => (
            <div key={strategy.id} className="relative">
              <StrategyLibraryCard
                strategy={strategy}
                credit={credit}
                isFeatured
              />
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const __flagshipUtils = { isFlagshipStrategy };
