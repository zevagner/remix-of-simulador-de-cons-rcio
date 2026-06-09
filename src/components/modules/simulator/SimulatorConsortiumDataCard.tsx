import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PercentInput } from '@/components/ui/percent-input';
import { PillToggle } from '@/components/ui/pill-toggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ConsortiumType } from '@/types/consortium';
import { formatCurrency } from '@/core/finance';
import { useDiagnosticContextSafe } from '@/components/modules/diagnostic/DiagnosticContext';

import { DEFAULT_TERM_MONTHS, MAX_TERM_MONTHS, CREDIT_LETTER_UPDATE_WARNING_MONTHS } from '@/config/consortiumRates';
import { useSimulatorInput, useSimulatorResult, PLAN_MODALITY_LABELS, PlanModality } from './SimulatorContext';

const MODALITY_TOOLTIPS: Partial<Record<PlanModality, string>> = {
  agroflex:
    'É focado em investimentos estratégicos para o produtor rural, abrangendo máquinas agrícolas, equipamentos e caminhões, com parcelas alinhadas ao ciclo da safra.',
  empresarialflex:
    'Além da aquisição de frotas (ônibus e caminhões), este plano viabiliza investimentos em imóveis comerciais, sede própria e reformas, permitindo que a empresa modernize suas operações respeitando picos de faturamento semestrais.',
};

const TYPE_OPTIONS: { value: ConsortiumType; label: string }[] = [
  { value: 'imobiliario', label: 'Imobiliário' },
  { value: 'auto', label: 'Veículos' },
  { value: 'pesados', label: 'Pesados' },
];

export function SimulatorConsortiumDataCard() {
  const {
    input, updateInput, insuranceEnabled, setInsuranceEnabled,
    planModality, setPlanModality, flexAvailable, isFlexPlan,
    maxReducedMonths, adminFeeDiscount, setAdminFeeDiscount,
    annualAdjustmentPercent, setAnnualAdjustmentPercent,
  } = useSimulatorInput();
  const {
    mipRate, effectiveMonthlyInsurance, ageTermValidation, effectiveAdminFeePercent,
    prestamistaEligibility,
  } = useSimulatorResult();
  const diagnosticCtx = useDiagnosticContextSafe();

  // Perfil patrimonial = cliente tende a NÃO usar a carta para aquisição de bem
  // (venda de carta, aplicação financeira, imóvel para renda/valorização etc.).
  // Banner é apenas informativo — não bloqueia o seguro.
  const hasPatrimonialProfile = (() => {
    const d = diagnosticCtx?.data;
    if (!d) return false;
    const obj = d.objetivoPrincipal;
    const sub = d.subObjetivo;
    const prio = d.prioridade;
    return (
      obj === 'imovel_investimento' ||
      obj === 'investimento' ||
      obj === 'patrimonio_produtivo' ||
      sub === 'aluguel' ||
      sub === 'valorizacao' ||
      prio === 'manter_liquidez'
    );
  })();

  const disableReducedInstallment = adminFeeDiscount > 0;
  const disableDiscount = input.reducedInstallment === true;

  return (
    <div className="space-y-2.5">
      {/* BLOCO 0 — Tipo de Consórcio (definição do produto, antes de tudo) */}
      <div
        id="simulator-consortium-type"
        className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-muted/30"
      >
        <span className="text-caption font-semibold uppercase tracking-wide text-muted-foreground shrink-0">
          Tipo de Consórcio
        </span>
        <PillToggle
          options={TYPE_OPTIONS}
          value={input.consortiumType}
          onChange={(v) => updateInput('consortiumType', v)}
          ariaLabel="Tipo de consórcio"
        />

      </div>

    <Card id="simulator-consortium-data" data-editorial-form="true" className="overflow-hidden shadow-none">
      <CardHeader data-editorial-form-header="true" className="py-2 px-4 border-b">
        <CardTitle className="text-caption font-semibold tracking-[0.18em] uppercase text-muted-foreground">Dados do Consórcio</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 space-y-3">
        {/* NÍVEL 1 — Carta de crédito (protagonista, centralizada e proporcional) */}
        <div className="mx-auto w-full max-w-[640px]">
          <div className="mx-auto w-[62%] min-w-[300px]">
          <Label className="text-xs font-medium text-muted-foreground mb-1 block text-center">Carta de crédito</Label>
          <CurrencyInput
            value={input.creditValue}
            onChange={(v) => updateInput('creditValue', v)}
            className="h-10 text-base font-semibold text-center md:text-base"
          />
          </div>
        </div>

        {/* NÍVEL 2 — Parâmetros operacionais (compactos, centralizados, com respiro proporcional) */}
        <div className="mx-auto w-full max-w-[420px] grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-3 items-end">
          <div>
            <div className="h-4 mb-0.5 flex items-center justify-center">
              <Label className="text-caption font-medium text-muted-foreground leading-none">
                Prazo
              </Label>
            </div>
            <div className="relative">
              <Input
                type="text" inputMode="numeric" value={input.termMonths}
                onChange={(e) => {
                  const max = MAX_TERM_MONTHS[input.consortiumType];
                  const raw = parseInt(e.target.value) || 0;
                  updateInput('termMonths', Math.min(raw, max));
                }}
                min={1} max={MAX_TERM_MONTHS[input.consortiumType]}
                className="pr-6 h-10 sm:h-8 text-base sm:text-sm font-medium tabular-nums slashed-zero tracking-wide px-2 text-center"
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-caption text-muted-foreground">m</span>
            </div>
          </div>

          <div>
            <div className="h-4 mb-0.5 flex items-center justify-center">
              <Label className="text-caption font-medium text-muted-foreground leading-none">Taxa</Label>
            </div>
            <PercentInput
              value={input.adminFeePercent}
              onChange={(v) => updateInput('adminFeePercent', v)}
              className="h-10 sm:h-8 text-base sm:text-sm font-medium tabular-nums slashed-zero tracking-wide px-2 text-center"

              aria-label="Taxa administrativa (editável)"
            />
          </div>

          <div>
            <div className="h-4 mb-0.5 flex items-center justify-center">
              <Label className="text-caption font-medium text-muted-foreground leading-none">Reserva</Label>
            </div>
            <PercentInput
              value={input.reserveFundPercent}
              onChange={(v) => updateInput('reserveFundPercent', v)}
              className="h-10 sm:h-8 text-base sm:text-sm font-medium tabular-nums slashed-zero tracking-wide px-2 text-center"
            />
          </div>
        </div>

        {(() => {
          const referenceTotal = DEFAULT_TERM_MONTHS[input.consortiumType];
          const monthsElapsed = referenceTotal - (input.termMonths || 0);
          if (monthsElapsed > CREDIT_LETTER_UPDATE_WARNING_MONTHS) {
            return (
              <div className="flex items-center gap-1.5 rounded border border-warning/40 bg-warning/10 px-2 py-1 text-caption text-foreground">
                <AlertTriangle className="h-3 w-3 shrink-0 text-warning" />
                <span>{monthsElapsed}m decorridos — verificar atualização da carta.</span>
              </div>
            );
          }
          return null;
        })()}

        {flexAvailable && (
          <div className="mx-auto w-full max-w-[640px] flex items-center justify-center gap-x-2 gap-y-1.5 flex-wrap">
            <span className="text-caption font-medium text-muted-foreground uppercase tracking-wide">Modalidade</span>
            {(Object.keys(PLAN_MODALITY_LABELS) as PlanModality[]).map((m) => {
              const tip = MODALITY_TOOLTIPS[m];
              const isActive = planModality === m;
              return (
                <div
                  key={m}
                  onClick={() => setPlanModality(m)}
                  className={`flex items-center gap-1 h-7 px-2 rounded border text-caption font-medium transition-[colors,box-shadow,transform] cursor-pointer ${
                    isActive
                      ? 'bg-[#003641] text-white border-[#003641]'
                      : 'bg-background text-foreground border-border hover:border-[#003641]/50'
                  }`}
                  role="button"
                  tabIndex={0}
                >
                  <span>{PLAN_MODALITY_LABELS[m]}</span>
                  {tip && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" onClick={(e) => e.stopPropagation()} aria-label={`Sobre ${PLAN_MODALITY_LABELS[m]}`}>
                          <Info className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="top" align="center" className="max-w-[300px] text-xs leading-relaxed p-3">
                        <p className="font-semibold text-sm mb-1">{PLAN_MODALITY_LABELS[m]}</p>
                        <p className="text-muted-foreground">{tip}</p>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              );
            })}
            {isFlexPlan && (
              <span className="text-caption text-muted-foreground">· parcela semestral</span>
            )}
          </div>
        )}

        {/* SEÇÃO — Opções (sem título, separadas por linhas divisórias) */}
        <div id="simulator-financial-options" className="-mx-3 sm:-mx-4 px-3 sm:px-4">
          <div className="mx-auto w-full max-w-[640px] divide-y divide-gray-100 border-t border-gray-100">

            {/* Item 1 — Seguro Prestamista */}
            <div className={`py-2.5 ${!prestamistaEligibility.eligible ? 'opacity-70' : ''}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Seguro Prestamista
                  </span>
                </div>
                <Switch
                  checked={insuranceEnabled && prestamistaEligibility.eligible}
                  disabled={!prestamistaEligibility.eligible}
                  onCheckedChange={(v) => {
                    if (v && !prestamistaEligibility.eligible) return;
                    setInsuranceEnabled(v);
                  }}
                  className="scale-75 -mx-1 data-[state=checked]:bg-[#003641]"
                />
              </div>
              {insuranceEnabled && prestamistaEligibility.eligible && (
                <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3">
                  <span>Mensal: <span className="font-medium text-foreground tabular-nums">{formatCurrency(effectiveMonthlyInsurance)}</span></span>
                  <span>Total: <span className="font-medium text-foreground tabular-nums">{formatCurrency(effectiveMonthlyInsurance * input.termMonths)}</span></span>
                  <span className="tabular-nums">
                    {mipRate.toFixed(4).replace('.', ',')}%/m sobre SDi
                    {input.consortiumType === 'imobiliario' ? ' (Carta + Taxa de Administração + Fundo de Reserva)' : ''}
                  </span>
                </div>
              )}
              {!prestamistaEligibility.eligible && (
                <div className="mt-1.5 text-xs text-muted-foreground bg-muted/40 border border-border rounded px-2 py-1 flex gap-1.5 items-start">
                  <Info className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>Seguro indisponível: idade + prazo excedem o limite institucional. Reduza o prazo para habilitar.</span>
                </div>
              )}
              {insuranceEnabled && prestamistaEligibility.eligible && hasPatrimonialProfile && (
                <div className="mt-1.5 text-xs bg-warning/10 border border-warning/30 rounded px-2 py-1 flex gap-1.5 items-start">
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-warning" />
                  <span className="text-foreground">
                    Perfil patrimonial detectado no Diagnóstico — confirme com o cliente antes de incluir o Prestamista.
                  </span>
                </div>
              )}
            </div>

            {/* Item 2 — Parcela Reduzida */}
            <div className={`py-2.5 ${disableReducedInstallment ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Parcela Reduzida
                </span>
                <Switch
                  disabled={disableReducedInstallment}
                  checked={input.reducedInstallment}
                  onCheckedChange={(v) => {
                    updateInput('reducedInstallment', v);
                    if (v) setAdminFeeDiscount(0);
                  }}
                  className="scale-75 -mx-1 data-[state=checked]:bg-[#003641]"
                />
              </div>
              {input.reducedInstallment && !disableReducedInstallment && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Ativa até {maxReducedMonths} meses iniciais (fator 0,7).
                </div>
              )}
            </div>

            {/* Item 3 — Desconto Taxa */}
            <div className={`py-2.5 ${disableDiscount ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Desconto Taxa
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24">
                    <PercentInput
                      value={adminFeeDiscount}
                      onChange={(v) => {
                        setAdminFeeDiscount(v);
                        if (v > 0) updateInput('reducedInstallment', false);
                      }}
                      disabled={disableDiscount}
                      className="h-7 text-xs tabular-nums text-center pr-6 pl-2"
                    />
                  </div>
                  {!disableDiscount && adminFeeDiscount > 0 && (
                    <span className="text-xs text-success font-medium tabular-nums">
                      → {effectiveAdminFeePercent.toFixed(2).replace('.', ',')}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Nota de exclusividade — abaixo dos dois itens correspondentes */}
            <div className="py-1.5 border-t-0">
              <p className="text-xs text-muted-foreground">
                Parcela reduzida e desconto na taxa são mutuamente exclusivos.
              </p>
            </div>

            {/* Item 4 — Reajuste INPC */}
            <div className="py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Reajuste INPC
                </span>
                <div className="flex items-center gap-2">
                  {annualAdjustmentPercent > 0 && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="text"
                        inputMode="decimal"
                        aria-label="Percentual de reajuste anual (INPC)"
                        value={annualAdjustmentPercent}
                        onChange={(e) => {
                          const raw = String(e.target.value).replace(',', '.');
                          const n = Number(raw);
                          setAnnualAdjustmentPercent(Math.max(0, Math.min(15, Number.isFinite(n) ? n : 0)));
                        }}
                        className="h-10 sm:h-7 w-14 text-base sm:text-xs tabular-nums px-1.5 text-right"
                      />
                      <span className="text-xs text-muted-foreground">% a.a.</span>
                    </div>
                  )}
                  <Switch
                    checked={annualAdjustmentPercent > 0}
                    onCheckedChange={(v) => setAnnualAdjustmentPercent(v ? 4 : 0)}
                    className="scale-75 -mx-1 data-[state=checked]:bg-[#003641]"
                  />
                </div>
              </div>
              {annualAdjustmentPercent > 0 && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Projeção consultiva
                </div>
              )}
            </div>

          </div>
        </div>

      </CardContent>
    </Card>
    </div>
  );
}
