/**
 * ════════════════════════════════════════════════════════════════════════════
 * CashComparisonTab — Engenharia Patrimonial · Compra à Vista vs Consórcio
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Flagship Cash Purchase Experience Restoration Pass.
 *
 * Restaura a sensação de engenharia patrimonial premium SEM clonar literalmente
 * o layout antigo do InvestmentModule e SEM engine paralela:
 *
 *   • CAMADA 1 — Compra à Vista (referência simples)
 *   • CAMADA 2 — Estratégia Patrimonial (carta dobrada + lances + capital
 *                 + premissas + "Como funciona")
 *   • CAMADA 3 — Resultado Patrimonial (patrimônio final, fluxo, vantagem)
 *
 * Engine viva: `useCashComparison` (mesmo hook canônico usado por Investimentos).
 * Premissas vivas alimentadas por:
 *   • SimulatorInput (creditValue, adminFee, reserveFund, termMonths, insurance)
 *   • WealthAssumptionsContext (CDI, %CDI, contemplation, IR) via storage reader
 *   • Local engineering controls (lance embutido, lance livre, reinvestimento)
 *
 * Visual: linguagem moderna da `StrategyLibrarySection` (eyebrows uppercase,
 * hairlines, tabular-nums, semantic tokens) — não copia o card-pesado antigo.
 * ════════════════════════════════════════════════════════════════════════════
 */
import { useMemo, useState, useEffect } from 'react';
import {
  Gem, Home, Wallet, TrendingUp, Lightbulb, Calculator,
  RefreshCw, Info, Compass, ArrowRight, Sparkles,
} from 'lucide-react';
import { formatCurrency } from '@/core/finance';
import { CASH_LEVERAGE_MULTIPLIER, DEFAULT_TERM_MONTHS } from '@/config/consortiumRates';
import { useSimulatorContextSafe } from '../simulator/SimulatorContext';
import { useCashComparison } from '@/hooks/useCashComparison';
import { readWealthCalcContextFromStorage } from '@/contexts/WealthAssumptionsContext';
import { DEFAULT_ASSUMPTIONS } from '../investment/investmentTypes';
import { PercentInput } from '@/components/ui/percent-input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const DEFAULT_REFERENCE_CREDIT = 300_000;
const DEFAULT_EMBEDDED_BID_PCT = 50;
const DEFAULT_FREE_BID_PCT = 25;
const DEFAULT_ADMIN_FEE = 22;
const DEFAULT_RESERVE_FUND = 2.5;

export interface CashComparisonSnapshot {
  cashComparison: ReturnType<typeof useCashComparison>;
  cashPropertyValue: number;
  cashEmbeddedBidPercent: number;
  cashFreeBidPercent: number;
  cashTermMonths: number;
  cashInvestmentRate: number;
  cashCdiRate: number;
}

interface CashComparisonTabProps {
  /** Publica snapshot vivo dos dados de Compra à Vista para uso no PDF (parent). */
  onSnapshot?: (snap: CashComparisonSnapshot) => void;
}

export function CashComparisonTab({ onSnapshot }: CashComparisonTabProps = {}) {
  const sim = useSimulatorContextSafe();

  // ── Premissas canônicas (Wealth) — snapshot vivo via storage reader ───────
  // Re-lê quando a aba ganha foco, permitindo que mudanças feitas em Wealth
  // se propaguem sem refresh manual. ZERO engine paralela.
  const [wealthCtx, setWealthCtx] = useState(() => readWealthCalcContextFromStorage());
  useEffect(() => {
    const sync = () => setWealthCtx(readWealthCalcContextFromStorage());
    // Chaves canônicas lidas por readWealthCalcContextFromStorage — evita
    // re-leitura quando qualquer outra chave do localStorage muda.
    const WATCHED_KEYS = new Set<string>([
      'wealth:assumptions:v1',
      'wealth:assumptions:preset:v1',
      'strategy:sim-slice:v1',
    ]);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && !WATCHED_KEYS.has(e.key)) return;
      sync();
    };
    window.addEventListener('focus', sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // ── Fonte canônica dos inputs do consórcio ────────────────────────────────
  const simulatorCredit = sim?.input?.creditValue;
  const hasValidSimulation = !!simulatorCredit && simulatorCredit > 0;
  const cashPropertyValue = hasValidSimulation
    ? simulatorCredit!
    : DEFAULT_REFERENCE_CREDIT;

  const cashTermMonths = sim?.input?.termMonths && sim.input.termMonths > 0
    ? sim.input.termMonths
    : DEFAULT_TERM_MONTHS.imobiliario;

  const cashAdminFee = sim?.input?.adminFeePercent && sim.input.adminFeePercent > 0
    ? sim.input.adminFeePercent
    : DEFAULT_ADMIN_FEE;

  const cashReserveFund = sim?.input?.reserveFundPercent && sim.input.reserveFundPercent > 0
    ? sim.input.reserveFundPercent
    : DEFAULT_RESERVE_FUND;

  const insuranceEnabled = sim?.insuranceEnabled ?? false;
  const monthlySchedule = sim?.monthlySchedule
    ? { totalInsurance: sim.monthlySchedule.totalInsurance }
    : null;

  // ── Engineering controls locais (lances + reinvestimento) ─────────────────
  const [cashEmbeddedBidPercent, setCashEmbeddedBidPercent] = useState<number>(DEFAULT_EMBEDDED_BID_PCT);
  const [cashFreeBidPercent, setCashFreeBidPercent] = useState<number>(DEFAULT_FREE_BID_PCT);
  const [reinvestSurplus, setReinvestSurplus] = useState<boolean>(true);

  // ── Premissas vivas vindas do WealthAssumptionsContext ────────────────────
  const cashCdiRate = wealthCtx.cdiAnnual * 100; // %a.a.
  const cashInvestmentRate = (wealthCtx.cdiGrossAnnual / Math.max(wealthCtx.cdiAnnual, 1e-9)) * 100; // % do CDI

  // ── Assumptions sintética para o hook canônico (sem engine paralela) ──────
  const assumptions = useMemo(() => ({
    ...DEFAULT_ASSUMPTIONS,
    cdiRate: cashCdiRate,
    cdiPercent: cashInvestmentRate,
    analysisMonths: cashTermMonths,
    contemplationMonthOverride: wealthCtx.contemplationMonth,
    previdenciaTermMonths: cashTermMonths,
  }), [cashCdiRate, cashInvestmentRate, cashTermMonths, wealthCtx.contemplationMonth]);

  const cashComparison = useCashComparison({
    assumptions,
    cashCdiRate,
    cashInvestmentRate,
    cashTermMonths,
    cashPropertyValue,
    cashEmbeddedBidPercent,
    cashFreeBidPercent,
    cashAdminFee,
    cashReserveFund,
    reinvestSurplus,
    insuranceEnabled,
    monthlySchedule,
  });

  const monthlyPositive = cashComparison.monthlyResult >= 0;
  const totalBidPct = cashEmbeddedBidPercent + cashFreeBidPercent;

  // Publica snapshot vivo para o PDF (parent ComparatorModule).
  useEffect(() => {
    onSnapshot?.({
      cashComparison,
      cashPropertyValue,
      cashEmbeddedBidPercent,
      cashFreeBidPercent,
      cashTermMonths,
      cashInvestmentRate,
      cashCdiRate,
    });
  }, [onSnapshot, cashComparison, cashPropertyValue, cashEmbeddedBidPercent, cashFreeBidPercent, cashTermMonths, cashInvestmentRate, cashCdiRate]);


  return (
    <div className="space-y-7 md:space-y-10 px-3 sm:px-6 animate-fade-in">
      {/* ───── Hero consultivo ───── */}
      <header className="space-y-3 max-w-3xl">
        <div className="flex items-center gap-2 text-caption font-medium uppercase tracking-[0.22em] text-primary">
          <Gem className="h-3 w-3" aria-hidden />
          Engenharia patrimonial · carta dobrada
        </div>
        <h3 className="text-title md:text-title font-semibold leading-[1.15] tracking-tight text-foreground">
          Consórcio × Compra à Vista
        </h3>
        <p className="text-body md:text-body text-muted-foreground leading-relaxed">
          Carta de crédito {CASH_LEVERAGE_MULTIPLIER}× o valor do imóvel: o lance embutido cobre o bem,
          o lance livre garante a contemplação e o capital remanescente segue
          rendendo — pagando a parcela com o próprio rendimento.
        </p>
        {!hasValidSimulation && (
          <p className="text-caption text-muted-foreground/90 leading-relaxed border-l-2 border-primary/40 pl-3">
            Cálculos usam crédito de referência{' '}
            <strong className="text-foreground">{formatCurrency(DEFAULT_REFERENCE_CREDIT)}</strong>.
            Preencha o Simulador para personalizar com o crédito real do cliente.
          </p>
        )}
      </header>

      {/* ═════════════════════════════════════════════════════════════════
        * 3-LAYER FINANCIAL FLOW
        * Camada 1 (referência) → Camada 2 (engenharia) → Camada 3 (resultado)
        * ═════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-6 items-start">

        {/* ── CAMADA 1 — COMPRA À VISTA (referência) ───────────────────── */}
        <section className="rounded-2xl border border-border/60 bg-card text-card-foreground p-card-sm md:p-6 space-y-4 min-w-0">
          <header className="flex items-center gap-2 text-caption font-medium uppercase tracking-[0.22em] text-muted-foreground">
            <Home className="h-3 w-3 text-foreground/60" aria-hidden />
            Camada 1 · Compra à vista
          </header>
          <div>
            <p className="text-caption uppercase tracking-[0.14em] text-muted-foreground">Valor do imóvel</p>
            <p className="mt-1 text-title md:text-title font-bold tabular-nums text-foreground break-words">{formatCurrency(cashPropertyValue)}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-card-sm border border-border/40">
            <p className="text-caption uppercase tracking-[0.14em] text-muted-foreground">Patrimônio final</p>
            <p className="mt-1 text-subtitle font-bold tabular-nums text-foreground">{formatCurrency(cashComparison.cashFinalPatrimony)}</p>
            <p className="mt-1 text-caption text-muted-foreground leading-snug">
              Apenas o imóvel — capital próprio totalmente consumido na aquisição.
            </p>
          </div>
          <p className="text-caption text-muted-foreground/85 italic leading-relaxed">
            Referência simples: cliente troca todo o capital pelo bem, sem fluxo de
            caixa associado nem capital aplicado em paralelo.
          </p>
        </section>

        {/* ── CAMADA 2 — ESTRATÉGIA PATRIMONIAL (coração) ──────────────── */}
        <section className="rounded-2xl border border-primary/30 bg-primary/[0.025] text-card-foreground p-card-sm md:p-6 space-y-5 lg:row-span-1 shadow-[0_1px_2px_rgba(15,23,42,0.03)] min-w-0">
          <header className="flex items-center gap-2 text-caption font-medium uppercase tracking-[0.22em] text-primary">
            <Gem className="h-3 w-3" aria-hidden />
            Camada 2 · Estratégia patrimonial
          </header>

          {/* Carta dobrada */}
          <div className="rounded-xl border border-primary/25 bg-background/60 px-4 py-3.5">
            <p className="text-caption uppercase tracking-[0.14em] text-muted-foreground">Carta de crédito ({CASH_LEVERAGE_MULTIPLIER}× imóvel)</p>
            <p className="mt-1 text-title md:text-title font-bold tabular-nums text-primary break-words">{formatCurrency(cashComparison.creditLetterValue)}</p>
            <p className="mt-0.5 text-caption text-muted-foreground leading-snug">
              Imóvel <span className="tabular-nums">{formatCurrency(cashPropertyValue)}</span> × {CASH_LEVERAGE_MULTIPLIER}
            </p>
          </div>

          {/* Bloco "Como essa estratégia funciona" — educacional consultivo */}
          <div className="rounded-xl border border-border/60 bg-background/70 px-4 py-3.5">
            <header className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="h-3.5 w-3.5 text-primary" aria-hidden />
              <h4 className="text-caption font-semibold uppercase tracking-[0.14em] text-foreground/80">
                Como essa estratégia funciona
              </h4>
            </header>
            <ol className="space-y-1.5 list-decimal list-outside pl-4 marker:text-primary/70 text-caption text-foreground/85 leading-relaxed">
              <li>
                Cliente entra em consórcio de{' '}
                <strong className="text-foreground tabular-nums">{formatCurrency(cashComparison.creditLetterValue)}</strong>{' '}
                e dá um lance de <strong className="text-foreground">{totalBidPct}%</strong> (embutido {cashEmbeddedBidPercent}% + livre {cashFreeBidPercent}%).
              </li>
              <li>
                O lance embutido reduz a carta para{' '}
                <strong className="text-foreground tabular-nums">{formatCurrency(cashComparison.creditLetterValue - cashComparison.embeddedBidValue)}</strong>
                {' '}— exatamente o valor do imóvel.
              </li>
              <li>
                Com {totalBidPct}% de lance total, a contemplação é praticamente garantida nas primeiras assembleias.
              </li>
              <li>
                O capital próprio remanescente{' '}
                (<strong className="text-foreground tabular-nums">{formatCurrency(cashComparison.capitalToInvest)}</strong>)
                fica aplicado em renda fixa — o rendimento cobre a parcela.
              </li>
            </ol>
          </div>

          {/* Engineering controls — lances */}
          <div className="space-y-3">
            <div>
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <label className="text-caption uppercase tracking-[0.12em] font-medium text-muted-foreground">
                  Lance embutido (%)
                </label>
                <span className="text-caption tabular-nums text-foreground/70">
                  = {formatCurrency(cashComparison.embeddedBidValue)}
                </span>
              </div>
              <PercentInput value={cashEmbeddedBidPercent} onChange={setCashEmbeddedBidPercent} />
            </div>
            <div>
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <label className="text-caption uppercase tracking-[0.12em] font-medium text-muted-foreground">
                  Lance livre (% da carta)
                </label>
                <span className="text-caption tabular-nums text-foreground/70">
                  = {formatCurrency(cashComparison.freeBidValue)}
                </span>
              </div>
              <PercentInput value={cashFreeBidPercent} onChange={setCashFreeBidPercent} />
            </div>
          </div>

          {/* Engenharia operacional — totais */}
          <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 space-y-1.5">
            <Row label="Total de lances" value={formatCurrency(cashComparison.totalBidValue)} />
            <Row label="Capital investido" value={formatCurrency(cashComparison.capitalToInvest)} accent="primary" />
            <Row label="Parcela mensal" value={formatCurrency(cashComparison.monthlyInstallment)} />
            <Row label="Rendimento mensal" value={`+${formatCurrency(cashComparison.monthlyYield)}`} accent="success" />
          </div>

          {/* Premissas estratégicas — visíveis, sem "número mágico" */}
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 px-4 py-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Compass className="h-3 w-3 text-primary/70" aria-hidden />
              <p className="text-caption uppercase tracking-[0.14em] font-medium text-muted-foreground">
                Premissas da estratégia
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 text-caption">
              <Premise label="Prazo" value={`${cashTermMonths} m`} />
              <Premise label="CDI a.a." value={`${cashCdiRate.toFixed(2)}%`} />
              <Premise label="% do CDI" value={`${cashInvestmentRate.toFixed(0)}%`} />
              <Premise label="Contemplação" value={`mês ${wealthCtx.contemplationMonth}`} />
              <Premise label="Taxa adm." value={`${cashAdminFee.toFixed(2)}%`} />
              <Premise label="Fundo reserva" value={`${cashReserveFund.toFixed(2)}%`} />
              <Premise label="IR sobre ganho" value="15% (longo prazo)" />
              <Premise label="Seguro prestamista" value={insuranceEnabled ? 'ativo' : 'estimado'} />
            </div>
            <p className="text-caption text-muted-foreground/80 italic leading-snug pt-1">
              Premissas vivas — alteradas em Estratégias Patrimoniais → Premissas da Simulação propagam aqui automaticamente.
            </p>
          </div>

          {/* Reinvestimento */}
          <label className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-background/40 p-card-sm cursor-pointer">
            <Checkbox
              checked={reinvestSurplus}
              onCheckedChange={(v) => setReinvestSurplus(v === true)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3 text-muted-foreground" aria-hidden />
                <span className="text-caption font-medium text-foreground/85">Reinvestir excedente mensal</span>
              </div>
              <p className="mt-0.5 text-caption text-muted-foreground leading-snug">
                {reinvestSurplus
                  ? `O excedente mensal é capitalizado, gerando +${formatCurrency(cashComparison.surplusAccumulated)} ao longo do prazo.`
                  : 'O excedente é tratado como fluxo de caixa, sem compor o patrimônio final.'}
              </p>
            </div>
          </label>
        </section>

        {/* ── CAMADA 3 — RESULTADO PATRIMONIAL ─────────────────────────── */}
        <section className="rounded-2xl border border-border/60 bg-card text-card-foreground p-card-sm md:p-6 space-y-4 min-w-0">
          <header className="flex items-center gap-2 text-caption font-medium uppercase tracking-[0.22em] text-primary">
            <TrendingUp className="h-3 w-3" aria-hidden />
            Camada 3 · Resultado patrimonial
          </header>

          {/* Resultado mensal — destaque executivo */}
          <div className={cn(
            'rounded-xl border px-4 py-3.5',
            monthlyPositive
              ? 'border-success/30 bg-success/[0.06]'
              : 'border-destructive/30 bg-destructive/[0.06]',
          )}>
            <p className="text-caption uppercase tracking-[0.14em] text-muted-foreground">Resultado mensal</p>
            <p className={cn(
              'mt-1 text-title md:text-title font-bold tabular-nums break-words',
              monthlyPositive ? 'text-success' : 'text-destructive',
            )}>
              {monthlyPositive ? '+' : ''}{formatCurrency(cashComparison.monthlyResult)}
            </p>
            <p className="mt-0.5 text-caption text-muted-foreground leading-snug">
              {monthlyPositive
                ? 'O rendimento cobre a parcela e ainda sobra.'
                : 'Parcela superior ao rendimento — déficit mensal.'}
            </p>
          </div>

          {/* Patrimônio final detalhado */}
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet className="h-3 w-3 text-primary/70" aria-hidden />
              <p className="text-caption uppercase tracking-[0.14em] text-muted-foreground">
                Patrimônio final ({cashTermMonths} meses)
              </p>
            </div>
            <Row label="Imóvel" value={formatCurrency(cashPropertyValue)} />
            <Row label="Investimento bruto" value={formatCurrency(cashComparison.accumulatedInvestmentGross)} />
            <Row
              label={`IR estimado (${(cashComparison.irAliquota * 100).toFixed(1)}%)`}
              value={`−${formatCurrency(cashComparison.irValue)}`}
              accent="destructive"
            />
            <Row label="Investimento líquido" value={formatCurrency(cashComparison.accumulatedInvestmentNet)} accent="success" />
            <div className="border-t border-border/40 pt-1.5 mt-1">
              <Row label="Patrimônio total (líquido)" value={formatCurrency(cashComparison.consortiumFinalPatrimony)} accent="primary" bold />
            </div>
          </div>

          {/* Vantagem do consórcio — KPI executivo */}
          <div className="rounded-xl border border-primary/25 bg-primary/[0.05] px-4 py-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
              <div className="min-w-0">
                <p className="text-caption uppercase tracking-[0.14em] text-muted-foreground">Vantagem do consórcio</p>
                <p className="mt-1 text-title md:text-title font-bold tabular-nums text-primary break-words">
                  +{formatCurrency(cashComparison.patrimonyDifference)}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-success/15 px-2.5 py-1 text-caption font-semibold text-success tabular-nums shrink-0">
                +{cashComparison.patrimonyDifferencePercent.toFixed(1)}%
              </span>
            </div>
            <p className="mt-1.5 text-caption text-muted-foreground leading-snug">
              Diferença patrimonial líquida vs compra à vista clássica.
            </p>
          </div>
        </section>
      </div>

      {/* ═════════════════════════════════════════════════════════════════
        * NARRATIVE SUMMARY — leitura humana da engenharia
        * ═════════════════════════════════════════════════════════════════ */}
      <section className="rounded-2xl border border-border/60 bg-card p-card-sm md:p-7 space-y-5 min-w-0">
        <header className="flex items-center gap-2 text-caption font-medium uppercase tracking-[0.22em] text-primary">
          <Info className="h-3 w-3" aria-hidden />
          Resumo narrativo executivo
        </header>

        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] via-transparent to-success/[0.04] px-4 py-4 md:px-6 md:py-6 space-y-3 text-body md:text-body leading-[1.65] text-foreground/85">
          <p>
            Nesta engenharia, o <strong className="text-foreground">consórcio</strong> permite a aquisição de um imóvel
            de <strong className="text-primary tabular-nums">{formatCurrency(cashPropertyValue)}</strong> sem
            descapitalizar o cliente — o capital próprio segue produtivo em paralelo.
          </p>
          <p>
            O capital aplicado de{' '}
            <strong className="text-foreground tabular-nums">{formatCurrency(cashComparison.capitalToInvest)}</strong>{' '}
            gera renda mensal de{' '}
            <strong className="text-success tabular-nums">+{formatCurrency(cashComparison.monthlyYield)}</strong>,
            enquanto a parcela é de{' '}
            <strong className="text-foreground tabular-nums">{formatCurrency(cashComparison.monthlyInstallment)}</strong>{' '}
            — resultado mensal{' '}
            <strong className={cn('tabular-nums', monthlyPositive ? 'text-success' : 'text-destructive')}>
              {monthlyPositive ? '+' : ''}{formatCurrency(cashComparison.monthlyResult)}
            </strong>.
          </p>
          <p>
            Ao final de <strong className="text-foreground">{cashTermMonths} meses</strong>, o patrimônio total líquido
            estimado é <strong className="text-primary tabular-nums">{formatCurrency(cashComparison.consortiumFinalPatrimony)}</strong>{' '}
            — uma vantagem de{' '}
            <strong className="text-success tabular-nums">+{formatCurrency(cashComparison.patrimonyDifference)}</strong>{' '}
            ({cashComparison.patrimonyDifferencePercent.toFixed(1)}%) sobre a compra à vista clássica.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/60 bg-muted/25 px-4 py-4 text-center">
            <p className="text-caption uppercase tracking-[0.14em] text-muted-foreground">Patrimônio à vista</p>
            <p className="mt-1.5 text-title md:text-title font-bold tabular-nums text-foreground">
              {formatCurrency(cashComparison.cashFinalPatrimony)}
            </p>
            <p className="mt-0.5 text-caption text-muted-foreground">Apenas o imóvel</p>
          </div>
          <div className="rounded-xl border border-primary/25 bg-primary/[0.05] px-4 py-4 text-center">
            <p className="text-caption uppercase tracking-[0.14em] text-muted-foreground">Patrimônio consórcio</p>
            <p className="mt-1.5 text-title md:text-title font-bold tabular-nums text-primary">
              {formatCurrency(cashComparison.consortiumFinalPatrimony)}
            </p>
            <p className="mt-0.5 text-caption text-muted-foreground">Imóvel + investimento</p>
          </div>
        </div>

        <div className="rounded-xl border border-success/25 bg-success/[0.06] px-4 py-4 text-center min-w-0">
          <p className="text-caption uppercase tracking-[0.14em] text-muted-foreground">Diferença patrimonial</p>
          <p className="mt-1.5 text-title md:text-display font-bold tabular-nums text-success break-words">
            +{formatCurrency(cashComparison.patrimonyDifference)}
          </p>
          <p className="mt-0.5 text-caption text-muted-foreground">
            {cashComparison.patrimonyDifferencePercent.toFixed(2)}% a mais com a engenharia do consórcio
          </p>
        </div>

        <p className="text-caption text-muted-foreground/80 italic leading-snug text-center pt-1">
          <Sparkles className="inline h-2.5 w-2.5 mr-1 text-primary/60" aria-hidden />
          Simulação de apoio à decisão. Valores estimados, sujeitos a variação de mercado e regulamento do grupo.
        </p>
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function Row({
  label, value, accent, bold = false,
}: {
  label: string;
  value: string;
  accent?: 'primary' | 'success' | 'destructive';
  bold?: boolean;
}) {
  const valueCls = accent === 'primary'
    ? 'text-primary'
    : accent === 'success'
      ? 'text-success'
      : accent === 'destructive'
        ? 'text-destructive'
        : 'text-foreground';
  return (
    <div className="flex items-baseline justify-between gap-3 text-caption">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('tabular-nums whitespace-nowrap', bold ? 'font-bold' : 'font-medium', valueCls)}>
        {value}
      </span>
    </div>
  );
}

function Premise({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-caption uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="text-caption font-semibold tabular-nums text-foreground/90">{value}</p>
    </div>
  );
}
