import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/core/finance';
import { useSimulatorInput, useSimulatorResult } from './SimulatorContext';
import { HelpTooltip } from '@/components/shared/HelpTooltip';
import { PostContemplationChoice } from '@/types/consortium';

export function SimulatorContemplationCard() {
  const {
    input, contemplated, setContemplated, postContemplationChoice,
    setPostContemplationChoice, contemplationMonth, setContemplationMonth,
    maxReducedMonths, insuranceEnabled,
    usedCreditForAsset, setUsedCreditForAsset,
    creditUsageMonth, setCreditUsageMonth,
  } = useSimulatorInput();
  const {
    isValidSimulation, result, contemplationType,
    actualFreeBidValue, actualEmbeddedBidValue,
  } = useSimulatorResult();

  const hasBid = (actualFreeBidValue ?? 0) > 0 || (actualEmbeddedBidValue ?? 0) > 0;
  const embeddedBidValue = actualEmbeddedBidValue ?? 0;
  const hasEmbeddedBid = embeddedBidValue > 0;
  const cartaLiquida = Math.max(0, (input.creditValue || 0) - embeddedBidValue);

  const isLance = contemplationType === 'lance';
  const isSorteio = contemplationType === 'sorteio';
  const hasReducedInstallment = input.reducedInstallment;

  return (
    <Card id="simulator-contemplation" data-anchor="post-contemplation-scenario" className="border-warning/30 scroll-mt-24">
      <span id="post-contemplation-scenario" className="block -translate-y-20 invisible h-0" aria-hidden="true" />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Cenário Pós-Contemplação
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Impacto da estratégia escolhida (lance/sorteio) sobre parcela, prazo e saldo.</p>
            {!hasBid && (
              <p className="text-xs text-muted-foreground/70 mt-1 italic">Informe um lance para habilitar a simulação</p>
            )}
            {hasBid && !contemplated && (
              <p className="text-xs text-primary/70 mt-1 italic">Lance detectado — ative para simular o cenário pós-contemplação</p>
            )}
          </div>
          <Switch checked={contemplated} onCheckedChange={setContemplated} disabled={!hasBid} className={!hasBid ? 'opacity-50' : ''} />
        </div>
      </CardHeader>
      
      {contemplated && isValidSimulation && (
        <CardContent className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="input-group">
              <Label className="input-label">Mês da contemplação</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={contemplationMonth}
                onChange={(e) => setContemplationMonth(Math.max(1, Math.min(input.termMonths, parseInt(e.target.value) || 1)))}
                min={1}
                max={input.termMonths}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {hasReducedInstallment && contemplationMonth <= maxReducedMonths
                  ? 'Durante período de parcela reduzida'
                  : hasReducedInstallment
                    ? 'Após período de parcela reduzida'
                    : `Parcelas já pagas: ${contemplationMonth}`}
              </p>
            </div>
            <div className="input-group">
              <Label className="input-label">Após contemplação</Label>
              <Select value={postContemplationChoice} onValueChange={(v) => setPostContemplationChoice(v as PostContemplationChoice)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {isLance ? (
                    <>
                      <SelectItem value="reduce-installment">Reduzir parcela mensal</SelectItem>
                      <SelectItem value="reduce-term">Reduzir prazo restante</SelectItem>
                    </>
                  ) : isSorteio && hasReducedInstallment ? (
                    <>
                      <SelectItem value="keep-reduced-credit-adjusted">Manter parcela reduzida (ajustar crédito)</SelectItem>
                      <SelectItem value="restore-installment-keep-credit">Restaurar parcela cheia (manter crédito)</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="reduce-installment">Reduzir parcela mensal</SelectItem>
                      <SelectItem value="reduce-term">Reduzir prazo restante</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!insuranceEnabled && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Label className="text-sm font-medium">Cliente utilizou a carta para aquisição de bem</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Seguro Prestamista obrigatório a partir do mês de utilização — não se aplica a estratégias de venda de carta ou aplicação financeira.
                  </p>
                </div>
                <Switch checked={usedCreditForAsset} onCheckedChange={setUsedCreditForAsset} />
              </div>
              {usedCreditForAsset && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="input-group">
                    <Label className="input-label">Mês de utilização da carta</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={creditUsageMonth}
                      onChange={(e) => {
                        const raw = parseInt(e.target.value) || contemplationMonth;
                        setCreditUsageMonth(Math.max(contemplationMonth, Math.min(input.termMonths, raw)));
                      }}
                      min={contemplationMonth}
                      max={input.termMonths}
                    />
                  </div>
                  {(!input.proponentAge || input.proponentAge <= 0) && (
                    <div className="rounded-md border border-warning/30 bg-warning/10 p-2 text-xs text-foreground self-end">
                      Informe a idade do proponente para calcular o seguro corretamente.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <Separator />

          <div className="p-card-sm bg-warning/5 rounded-lg border border-warning/20">
            <p className="text-sm font-medium text-foreground mb-3">
              Cenário Pós-Contemplação
              {isLance && <span className="text-xs text-muted-foreground ml-2">(por lance)</span>}
              {isSorteio && <span className="text-xs text-muted-foreground ml-2">(por sorteio)</span>}
            </p>
            {/* KPI dominante — Nova Parcela */}
            <div className="rounded-md bg-background/60 border border-success/30 p-3 mb-3 text-center">
              <p className="text-caption uppercase tracking-wide text-muted-foreground flex items-center justify-center gap-1">
                Nova Parcela
                <HelpTooltip title="Nova Parcela" content="Valor da parcela recalculada após a contemplação, conforme a opção escolhida." />
              </p>
              <p className="text-3xl font-bold text-success tracking-tight tabular-nums mt-1">{formatCurrency(result.installmentAfterContemplation)}</p>
            </div>
            {/* KPIs secundários compactos */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-md bg-background/40 border border-border/50">
                <p className="text-caption uppercase tracking-wide text-muted-foreground flex items-center justify-center gap-1">
                  Parcelas restantes
                  <HelpTooltip title="Parcelas Restantes" content="Quantidade de parcelas que faltam para encerrar o plano após a contemplação." />
                </p>
                <p className="text-base font-semibold text-foreground tabular-nums mt-0.5">{result.remainingTermAfterContemplation}</p>
              </div>
              <div className="text-center p-2 rounded-md bg-background/40 border border-border/50">
                <p className="text-caption uppercase tracking-wide text-muted-foreground flex items-center justify-center gap-1">
                  Saldo devedor
                  <HelpTooltip title="Saldo Devedor" content="Valor restante a ser pago após a contemplação, considerando as parcelas já quitadas até o mês informado." />
                </p>
                <p className="text-base font-semibold text-warning tabular-nums mt-0.5">{formatCurrency(result.debtAfterContemplation)}</p>
              </div>
              <div className="text-center p-2 rounded-md bg-background/40 border border-border/50">
                <p className="text-caption uppercase tracking-wide text-muted-foreground">Mês contemplação</p>
                <p className="text-base font-semibold text-foreground tabular-nums mt-0.5">{contemplationMonth}º</p>
              </div>
            </div>
            {isSorteio && hasReducedInstallment && postContemplationChoice === 'keep-reduced-credit-adjusted' && (
              <div className="mt-3 pt-3 border-t border-warning/20 text-center">
                <p className="text-caption uppercase tracking-wide text-muted-foreground">Crédito Ajustado</p>
                <p className="text-lg font-semibold text-primary tabular-nums">{formatCurrency(result.adjustedCreditValue)}</p>
                <p className="text-caption text-muted-foreground">Proporcional à capacidade de pagamento com parcela reduzida</p>
              </div>
            )}

            {/* Carta líquida + Valor total */}
            <div className="mt-3 pt-3 border-t border-warning/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-caption uppercase tracking-wide text-muted-foreground flex items-center justify-center gap-1">
                  Carta Líquida
                  <HelpTooltip
                    title="Carta Líquida"
                    content="Valor da carta de crédito disponível para o cliente após o uso do lance embutido. Fórmula: Valor da carta − Lance embutido."
                  />
                </p>
                <p className={`text-base font-semibold tabular-nums ${hasEmbeddedBid ? 'text-primary' : 'text-foreground'}`}>
                  {formatCurrency(cartaLiquida)}
                </p>
                {hasEmbeddedBid ? (
                  <p className="text-caption text-muted-foreground mt-0.5">
                    {formatCurrency(input.creditValue)} − {formatCurrency(embeddedBidValue)}
                  </p>
                ) : (
                  <p className="text-caption text-muted-foreground mt-0.5">Sem lance embutido</p>
                )}
              </div>
              <div className="text-center">
                <p className="text-caption uppercase tracking-wide text-muted-foreground flex items-center justify-center gap-1">
                  Valor Total do Plano
                  <HelpTooltip
                    title="Valor Total do Plano"
                    content="Soma de todas as parcelas previstas no plano (fundo comum, taxa de administração, fundo de reserva e seguro, quando aplicável)."
                  />
                </p>
                <p className="text-base font-semibold text-foreground tabular-nums">{formatCurrency(result.totalCost)}</p>
                <p className="text-caption text-muted-foreground mt-0.5">Custo total considerando taxas e prazo</p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
