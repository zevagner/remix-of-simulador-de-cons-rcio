/**
 * ════════════════════════════════════════════════════════════════════════════
 * WealthOperationalBar — camada paramétrica viva da Plataforma Patrimonial
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Restaura duas camadas operacionais que existiam na versão original do módulo
 * e foram fragmentadas ao longo das ondas editoriais:
 *
 *   CAMADA 1 · Dados do Consórcio  — readonly, derivado do Simulador.
 *               Transparência operacional do cenário-base.
 *   CAMADA 2 · Premissas da Simulação — editável (CDI, contemplação, ágio,
 *               valorização, yield, prazo), com presets transparentes.
 *               Todos os cards de Estratégias Patrimoniais derivam dessa
 *               matriz viva (via WealthAssumptionsContext → StrategyCalcContext).
 *
 * UX
 *   • Duas Collapsibles premium, default FECHADO — preservam a hierarquia
 *     editorial (capítulos + flagship em destaque) acima.
 *   • Chip status visível mesmo fechado: modo (preset/personalizado), CDI%,
 *     contemplação, prazo.
 *   • Reset volta aos defaults canônicos (`@/config/consortiumRates`).
 *
 * ZERO MATH NOVA
 *   • Card 1 lê `useSimulatorInput` + `useSimulatorResult`.
 *   • Card 2 escreve em `WealthAssumptionsContext` — calcContext propaga
 *     automaticamente a todos os `calculations[].result(credit, ctx)`.
 * ════════════════════════════════════════════════════════════════════════════
 */
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { Label } from '@/components/ui/label';
import { PercentInput } from '@/components/ui/percent-input';
import { Button } from '@/components/ui/button';
import { ChevronDown, FileText, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/core/finance';
import { useSimulatorInput, useSimulatorResult } from '@/components/modules/simulator/SimulatorContext';
import {
  useWealthAssumptions,
  WEALTH_PRESETS,
  type WealthPresetKey,
  type TipoVendaCarta,
} from '@/contexts/WealthAssumptionsContext';

const PRESETS: Array<{ id: WealthPresetKey; label: string; emoji: string }> = [
  { id: 'conservador', label: 'Conservador', emoji: '🛡️' },
  { id: 'realista',    label: 'Realista',    emoji: '⚖️' },
  { id: 'otimista',    label: 'Otimista',    emoji: '🚀' },
];

export function WealthOperationalBar() {
  return (
    <section
      aria-label="Camada paramétrica da Plataforma Patrimonial"
      className="space-y-3"
      data-wealth-parametric-bar="v1"
    >
      <ConsortiumDataCard />
      <AssumptionsCard />
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * CAMADA 1 · Dados do Consórcio — readonly, fonte canônica = Simulador
 * ────────────────────────────────────────────────────────────────────── */
function ConsortiumDataCard() {
  const { input, insuranceEnabled, contemplationMonth } = useSimulatorInput();
  const { effectiveAdminFeePercent, effectiveInsurancePercent, result, isValidSimulation } = useSimulatorResult();

  const hasSim = isValidSimulation;
  const estimatedInstallment = result?.fullInstallment ?? 0;
  const totalPaid = result?.totalCost ?? 0;

  return (
    <Collapsible>
      <Card className="border-border/50">
        <CollapsibleTrigger className="w-full text-left">
          <div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="h-4 w-4 text-primary/80 shrink-0" aria-hidden />
              <div className="min-w-0">
                <div className="text-caption font-semibold text-foreground">Dados do Consórcio</div>
                <div className="text-caption text-muted-foreground truncate">
                  {hasSim
                    ? `${formatCurrency(input.creditValue)} · ${input.termMonths}m · ${effectiveAdminFeePercent.toFixed(1)}% adm`
                    : 'Preencha o Simulador para popular o cenário-base.'}
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-caption">
              <ReadField label="Carta de crédito" value={formatCurrency(input.creditValue)} />
              <ReadField label="Prazo total" value={`${input.termMonths || 0} meses`} />
              <ReadField label="Taxa de administração" value={`${effectiveAdminFeePercent.toFixed(2)}%`} />
              <ReadField label="Fundo de reserva" value={`${(input.reserveFundPercent ?? 0).toFixed(2)}%`} />
              <ReadField
                label="Seguro prestamista"
                value={insuranceEnabled ? `${effectiveInsurancePercent.toFixed(4)}%` : 'Desabilitado'}
              />
              <ReadField label="Parcela estimada" value={formatCurrency(estimatedInstallment)} />
              <ReadField label="Mês de contemplação" value={`${contemplationMonth || 0}º mês`} />
              <ReadField label="Custo total" value={formatCurrency(totalPaid)} />
            </div>
            <p className="mt-3 text-caption text-muted-foreground/80 italic leading-relaxed">
              Valores espelhados do Simulador. Edição apenas lá — esta camada é somente leitura.
            </p>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5 min-w-0">
      <div className="text-caption uppercase tracking-[0.1em] text-muted-foreground">{label}</div>
      <div className="text-caption font-semibold tabular-nums text-foreground truncate">{value}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * CAMADA 2 · Premissas da Simulação — editável, propagação viva
 * ────────────────────────────────────────────────────────────────────── */
function AssumptionsCard() {
  const { assumptions, setAssumption, applyPreset, reset, isDirty, activePreset, calcContext } = useWealthAssumptions();

  const statusChip = activePreset
    ? `Preset: ${PRESETS.find((p) => p.id === activePreset)?.label ?? activePreset}`
    : isDirty
      ? 'Personalizado'
      : 'Defaults canônicos';

  // Wealth Field Truth Pass: contemplação e prazo são leitura do Simulador
  // (via calcContext.sim). Exibidos no chip mas NÃO editáveis aqui — edição
  // exclusiva no Simulador. Quando `sim` é null, mostra "—" (gate consultivo).
  const hasSim = !!calcContext.sim;
  const contempLabel = hasSim ? `mês ${calcContext.contemplationMonth}` : '—';
  const analysisLabel = hasSim ? `${calcContext.analysisMonths}m` : '—';

  return (
    <Collapsible>
      <Card className={cn('border-border/50', isDirty && 'border-primary/30 ring-1 ring-primary/10')}>
        <CollapsibleTrigger className="w-full text-left">
          <div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex items-center gap-2.5 min-w-0">
              <SlidersHorizontal className="h-4 w-4 text-primary/80 shrink-0" aria-hidden />
              <div className="min-w-0">
                <div className="text-caption font-semibold text-foreground inline-flex items-center gap-2">
                  Premissas da Simulação
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2 py-[1px] text-caption font-medium border',
                    isDirty
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border/60 bg-muted/40 text-muted-foreground',
                  )}>
                    {statusChip}
                  </span>
                </div>
                <div className="text-caption text-muted-foreground truncate">
                  CDI {assumptions.cdiPercent.toFixed(0)}% · contemplação {contempLabel} · análise {analysisLabel}
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4 space-y-4">
            {/* Presets */}
            <div className="rounded-lg bg-muted/30 px-3 py-2.5">
              <div className="text-caption uppercase tracking-[0.1em] text-muted-foreground mb-1.5">
                Cenários pré-definidos
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => {
                  const selected = activePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p.id)}
                      className={cn(
                        'px-2.5 py-1 text-caption font-medium rounded-md border transition-colors',
                        selected
                          ? 'border-primary/50 bg-primary/10 text-primary'
                          : 'border-border bg-background hover:bg-muted text-foreground/80',
                      )}
                    >
                      <span className="mr-1">{p.emoji}</span>{p.label}
                    </button>
                  );
                })}
                {isDirty && (
                  <button
                    type="button"
                    onClick={reset}
                    className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-caption font-medium rounded-md border border-border bg-background hover:bg-muted text-muted-foreground"
                    title="Voltar aos defaults canônicos"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden />
                    Resetar
                  </button>
                )}
              </div>
              <p className="text-caption text-muted-foreground/80 mt-1.5">
                Presets alteram CDI %, valorização, yield e % recebido na venda. Edite qualquer campo abaixo para personalizar.
              </p>
            </div>

            {/* Editáveis — apenas premissas editoriais (mercado).
                Contemplação e prazo NÃO aparecem aqui: vêm do Simulador. */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="CDI (% a.a.)">
                <PercentInput value={assumptions.cdiRate} onChange={(v) => setAssumption('cdiRate', v)} />
              </Field>
              <Field label="% do CDI">
                <PercentInput value={assumptions.cdiPercent} onChange={(v) => setAssumption('cdiPercent', v)} />
              </Field>
              <Field label="Valorização (% a.a.)">
                <PercentInput value={assumptions.propertyAppreciation} onChange={(v) => setAssumption('propertyAppreciation', v)} />
              </Field>
              <Field label="Yield aluguel (% a.m.)">
                <PercentInput value={assumptions.rentalYield} onChange={(v) => setAssumption('rentalYield', v)} decimalPlaces={2} />
              </Field>
              <Field label="Tipo de venda">
                <select
                  value={assumptions.tipoVendaCarta}
                  onChange={(e) => setAssumption('tipoVendaCarta', e.target.value as TipoVendaCarta)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="carta-contemplada">Carta contemplada</option>
                  <option value="cota-nao-contemplada">Cota não contemplada</option>
                </select>
              </Field>
              {assumptions.tipoVendaCarta === 'carta-contemplada' ? (
                <Field label="% recebido na venda">
                  <PercentInput value={assumptions.agioOnSale} onChange={(v) => setAssumption('agioOnSale', v)} />
                </Field>
              ) : (
                <Field label="Deságio na venda (%)">
                  <PercentInput value={assumptions.discountOnSale} onChange={(v) => setAssumption('discountOnSale', v)} />
                </Field>
              )}
            </div>

            {/* Nota de origem — contempla/prazo vêm do Simulador, sem duplicação. */}
            <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-caption text-muted-foreground">
              <span className="font-medium text-foreground/80">Mês de contemplação</span> e{' '}
              <span className="font-medium text-foreground/80">prazo da análise</span> são lidos
              automaticamente do Simulador ({contempLabel} · {analysisLabel}).
              Para alterar, edite no Simulador — esta camada não duplica a fonte.
            </div>

            <p className="text-caption text-muted-foreground/80 italic leading-relaxed">
              Premissas vivas — ao alterar, todos os cards de Estratégias Patrimoniais
              recalculam KPIs e ordenação executiva. Projeções ilustrativas, sem garantia de resultado.
            </p>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-caption uppercase tracking-[0.08em] text-muted-foreground font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}
