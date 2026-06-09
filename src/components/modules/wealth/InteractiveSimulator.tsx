/**
 * ════════════════════════════════════════════════════════════════════════════
 * InteractiveSimulator — mini-simulação interativa declarativa (Round 4.2)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Componente único, dirigido por schema (`strategy.embeddedSimulation`).
 * Renderiza controls/results/actions dinamicamente — sem hardcode por id.
 *
 * Regras invioláveis:
 *   • Não recalcula matemática da estratégia: usa exclusivamente as
 *     fórmulas declaradas em `embeddedSimulation.results[i].compute`.
 *   • Não substitui shadcn <Slider/>: mantém <input type="range"> nativo
 *     idêntico ao piloto (débito de polish posterior).
 *   • "Aplicar" empurra valores aos contextos canônicos (SimulatorContext +
 *     WealthAssumptionsContext) via `applyTargets`. Modal permanece aberta.
 *
 * O componente deve ficar visualmente idêntico ao piloto venda-carta-lucro
 * — qualquer mudança em layout/microcopia é fora do escopo desta extração.
 * ──────────────────────────────────────────────────────────────────────── */
import { useCallback, useMemo, useState } from 'react';
import { PlayCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  useSimulatorInput,
  useSimulatorResult,
} from '@/components/modules/simulator/SimulatorContext';
import { useWealthAssumptionsSafe } from '@/contexts/WealthAssumptionsContext';
import type {
  EmbeddedSimControl,
  EmbeddedSimResult,
  LibraryStrategy,
  StrategyCalcContext,
} from './strategyLibraryData';

/* ──────────────────────────────────────────────────────────────────────
 * Block local — markup idêntico ao usado em StrategyLibrarySection.
 * Duplicado intencionalmente para evitar import circular.
 * ────────────────────────────────────────────────────────────────────── */
function Block({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <header className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <h5 className="text-caption font-semibold uppercase tracking-[0.14em] text-foreground/75">
          {title}
        </h5>
      </header>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Helpers de formatação
 * ────────────────────────────────────────────────────────────────────── */
function brlShort(v: number): string {
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  return `${sign}R$ ${abs.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

function formatResultValue(value: number, format: EmbeddedSimResult['format']): string {
  switch (format) {
    case 'currency':
    case 'currency-short':
      return brlShort(value);
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'multiplier':
      return `${value.toFixed(2)}x`;
    case 'months':
      return `${Math.round(value)} ${Math.abs(Math.round(value)) === 1 ? 'mês' : 'meses'}`;
    default:
      return String(value);
  }
}

function formatControlDisplay(value: number, unit: EmbeddedSimControl['unit']): string {
  switch (unit) {
    case 'currency':
      return `R$ ${value.toLocaleString('pt-BR')}`;
    case 'percent':
      return `${value}%`;
    case 'months':
      return `Mês ${value}`;
    case 'integer':
    default:
      return String(value);
  }
}

function resolveMax(
  max: EmbeddedSimControl['max'],
  ctx: StrategyCalcContext,
): number {
  return typeof max === 'function' ? max(ctx) : max;
}

function resolveMaxLabel(
  maxLabel: EmbeddedSimControl['maxLabel'],
  ctx: StrategyCalcContext,
): string | undefined {
  if (!maxLabel) return undefined;
  return typeof maxLabel === 'function' ? maxLabel(ctx) : maxLabel;
}

/* ──────────────────────────────────────────────────────────────────────
 * ControlField — slider nativo idêntico ao piloto
 * ────────────────────────────────────────────────────────────────────── */
function ControlField({
  label,
  display,
  min,
  max,
  step,
  value,
  onChange,
  minLabel,
  maxLabel,
}: {
  label: string;
  display: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  minLabel?: string;
  maxLabel?: string;
}) {
  const fallbackMin =
    typeof min === 'number' && min >= 1000 ? `R$ ${(min / 1000).toFixed(0)}k` : String(min);
  const fallbackMax =
    typeof max === 'number' && max >= 1000 ? `R$ ${(max / 1000).toFixed(0)}k` : String(max);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-caption font-medium text-foreground/85">{label}</label>
        <span className="text-caption font-semibold tabular-nums text-primary">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-primary/15 accent-primary cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/70 tabular-nums">
        <span>{minLabel ?? fallbackMin}</span>
        <span>{maxLabel ?? fallbackMax}</span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * ResultCell — célula de resultado idêntica ao piloto
 * ────────────────────────────────────────────────────────────────────── */
function ResultCell({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: 'positive' | 'negative';
}) {
  const valueTone =
    emphasis === 'positive'
      ? 'text-success'
      : emphasis === 'negative'
        ? 'text-destructive'
        : 'text-foreground';
  return (
    <div className="rounded-lg border border-border/50 bg-background/60 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-medium">
        {label}
      </div>
      <div className={cn('mt-1 text-body font-semibold tabular-nums', valueTone)}>{value}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * InteractiveSimulator — componente principal
 * ────────────────────────────────────────────────────────────────────── */
interface InteractiveSimulatorProps {
  strategy: LibraryStrategy;
}

export function InteractiveSimulator({ strategy }: InteractiveSimulatorProps) {
  const schema = strategy.embeddedSimulation;
  const { toast } = useToast();
  const { input, updateInput, contemplationMonth, setContemplationMonth } = useSimulatorInput();
  const { baseResult, isValidSimulation } = useSimulatorResult();
  const wealthCtx = useWealthAssumptionsSafe();

  const simCreditValue = input?.creditValue ?? 0;
  const simFullInstallment = baseResult?.fullInstallment ?? 0;
  const simTermMonths = input?.termMonths ?? 0;
  const simReady =
    !!schema &&
    isValidSimulation &&
    simCreditValue > 0 &&
    simFullInstallment > 0 &&
    simTermMonths > 0;

  // calcContext canônico para defaults/limites/compute.
  const ctx = useMemo<StrategyCalcContext | null>(
    () => wealthCtx?.calcContext ?? null,
    [wealthCtx?.calcContext],
  );

  // ── Estado local: dicionário { [controlId]: value }. ──
  // Inicializa uma vez via defaultValue(ctx), clamping a [min, resolveMax(ctx)].
  const initialValues = useMemo<Record<string, number>>(() => {
    if (!schema || !ctx) return {};
    const out: Record<string, number> = {};
    for (const c of schema.controls) {
      const dv = c.defaultValue(ctx);
      const maxN = resolveMax(c.max, ctx);
      out[c.id] = Math.max(c.min, Math.min(maxN, dv));
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, ctx === null]); // só re-inicializa quando ctx aparece/desaparece

  const [values, setValues] = useState<Record<string, number>>(initialValues);

  // Sincroniza valores se a lista de control ids mudar de forma significativa.
  // Em uso normal (mesma estratégia) isso não roda — só ao trocar de modal.
  useMemo(() => {
    setValues((prev) => {
      const next = { ...prev };
      let touched = false;
      if (schema) {
        for (const c of schema.controls) {
          if (!(c.id in next)) {
            next[c.id] = initialValues[c.id] ?? c.min;
            touched = true;
          }
        }
      }
      return touched ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema?.controls]);

  const setControl = useCallback((id: string, v: number) => {
    setValues((prev) => ({ ...prev, [id]: v }));
  }, []);

  // ── Cálculos ao vivo ──
  const computed = useMemo<Record<string, number>>(() => {
    if (!schema || !ctx) return {};
    const out: Record<string, number> = {};
    for (const r of schema.results) {
      out[r.id] = r.compute(values, ctx);
    }
    return out;
  }, [schema, ctx, values]);

  // ── Reset ──
  const handleReset = useCallback(() => {
    if (!schema || !ctx) return;
    const fresh: Record<string, number> = {};
    for (const c of schema.controls) {
      const dv = c.defaultValue(ctx);
      const maxN = resolveMax(c.max, ctx);
      fresh[c.id] = Math.max(c.min, Math.min(maxN, dv));
    }
    setValues(fresh);
    toast({
      title: schema.resetButtonLabel
        ? `${schema.resetButtonLabel} ✓`
        : 'Voltou aos valores da sua simulação',
      duration: 2000,
    });
  }, [schema, ctx, toast]);

  // ── Apply ──
  const handleApply = useCallback(() => {
    if (!schema) return;
    for (const tgt of schema.applyTargets) {
      const raw = values[tgt.sourceControlId];
      if (raw == null || !Number.isFinite(raw)) continue;
      const v = tgt.transform ? tgt.transform(raw) : raw;
      switch (tgt.type) {
        case 'simulatorInput':
          if (tgt.field) {
            // updateInput é tipado por chave; cast controlado por schema.
            updateInput(tgt.field as Parameters<typeof updateInput>[0], v as never);
          }
          break;
        case 'simulatorContemplation':
          setContemplationMonth(v);
          break;
        case 'wealthAssumption':
          if (tgt.key && wealthCtx) {
            wealthCtx.setAssumption(
              tgt.key as Parameters<typeof wealthCtx.setAssumption>[0],
              v as never,
            );
          }
          break;
      }
    }
    toast({
      title: schema.applyToastMessage ?? 'Simulador atualizado com seus valores',
      duration: 2400,
    });
  }, [schema, values, updateInput, setContemplationMonth, wealthCtx, toast]);

  if (!schema) return null;

  const blockTitle = schema.blockTitle ?? 'Explore os cenários';

  if (!simReady) {
    return (
      <Block icon={PlayCircle} title={blockTitle}>
        <p className="text-foreground/75 text-caption leading-relaxed">
          Configure uma simulação no módulo Simulador para liberar a exploração interativa.
        </p>
      </Block>
    );
  }

  return (
    <Block icon={PlayCircle} title={blockTitle}>
      <p className="text-caption text-muted-foreground leading-relaxed -mt-1 mb-2">
        {schema.introText ??
          'Ajuste os valores e veja como o resultado muda em tempo real. Não altera nada na sua simulação.'}
      </p>

      <div className="rounded-xl border border-primary/15 bg-primary/[0.025] p-4 md:p-5 space-y-5">
        {/* ── Controles ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {schema.controls.map((c) => {
            const maxN = resolveMax(c.max, ctx!);
            const value = values[c.id] ?? c.defaultValue(ctx!);
            return (
              <ControlField
                key={c.id}
                label={c.label}
                display={formatControlDisplay(value, c.unit)}
                min={c.min}
                max={maxN}
                step={c.step}
                value={value}
                onChange={(v) => setControl(c.id, v)}
                minLabel={c.minLabel}
                maxLabel={resolveMaxLabel(c.maxLabel, ctx!)}
              />
            );
          })}
        </div>

        {/* ── Resultados ao vivo ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {schema.results.map((r) => {
            const raw = computed[r.id] ?? 0;
            const formatted = formatResultValue(raw, r.format);
            const emphasis =
              r.emphasis === 'positive-negative'
                ? raw >= 0
                  ? ('positive' as const)
                  : ('negative' as const)
                : undefined;
            return (
              <ResultCell key={r.id} label={r.label} value={formatted} emphasis={emphasis} />
            );
          })}
        </div>

        <p className="text-caption text-muted-foreground/80 italic">
          {schema.disclaimerText ??
            'Valores ilustrativos — a parcela real depende do plano específico no Simulador.'}
        </p>

        {/* ── Ações ── */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={handleReset} className="sm:flex-none">
            <RefreshCw className="h-3.5 w-3.5" />{' '}
            {schema.resetButtonLabel ?? 'Voltar aos valores originais'}
          </Button>
          <Button variant="default" size="sm" onClick={handleApply} className="sm:ml-auto">
            <PlayCircle className="h-3.5 w-3.5" />{' '}
            {schema.applyButtonLabel ?? 'Aplicar ao Simulador real'}
          </Button>
        </div>
      </div>
    </Block>
  );
}
