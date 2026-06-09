import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PercentInput } from '@/components/ui/percent-input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { formatCurrency, formatPercent, annualToMonthlyRate } from '@/core/finance';
import { SimulationResult } from '@/types/consortium';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { HelpHint } from '@/components/help/HelpHint';
import { ContextualInsightStrip } from '@/components/help/ContextualInsightStrip';
import { TrendingDown, ChevronDown, Info, MoveHorizontal } from 'lucide-react';

interface FinancingResult {
  priceMonthlyPayment: number;
  priceTotalCost: number;
  priceTotalWithInsurance: number;
  priceTotalMIP: number;
  priceTotalDFI: number;
  sacFirstPayment: number;
  sacLastPayment: number;
  sacTotalCost: number;
  sacTotalWithInsurance: number;
  sacTotalMIP: number;
  sacTotalDFI: number;
  sacTable: any[];
  priceTable: any[];
}

interface FinancingComparisonTabProps {
  consortiumResult: SimulationResult;
  financingResult: FinancingResult;
  financing420Result: FinancingResult;
  creditValue: number;
  /** Valor efetivamente financiado (propertyValue − entrada/lance livre). */
  financingBase: number;
  /** Valor do bem (crédito líquido após lance embutido) — base usada para "valor do bem". */
  propertyValue: number;
  /** True quando há lance embutido — propertyValue < creditValue. */
  hasEmbeddedBid: boolean;
  /** Lance livre vindo do Simulador. */
  freeBidValue: number;
  /** Lance embutido vindo do Simulador (apenas exibição). */
  embeddedBidValue: number;
  /** Entrada efetivamente aplicada (= lance livre se toggle ativo, senão manual). */
  downPayment: number;
  useBidAsDownPayment: boolean;
  setUseBidAsDownPayment: (v: boolean) => void;
  manualDownPayment: number;
  setManualDownPayment: (v: number) => void;
  termMonths: number;
  adminFee: number;
  reserveFund: number;
  financingRate: number;
  setFinancingRate: (v: number) => void;
  mipRate: number;
  setMipRate: (v: number) => void;
  dfiRate: number;
  setDfiRate: (v: number) => void;
  adminFeeMonthly: number;
  setAdminFeeMonthly: (v: number) => void;
  priceSavings: number;
  priceSavingsPercent: number;
  sacSavings: number;
  sacSavingsPercent: number;
  insuranceEnabled: boolean;
  /** Representação consultiva (não altera cálculos). */
  custoDesembolsado: number;
  creditoLiquido: number;
  custoEfetivoReal: number;
  /** FASE 1 — toggle TR (default false). */
  applyTR: boolean;
  setApplyTR: (v: boolean) => void;
  trMonthlyRate: number;
  setTrMonthlyRate: (v: number) => void;
  /** Badge XOR — quando true mostra "apenas financiamento considera correção". */
  showAsymmetryBadge?: boolean;
}

export function FinancingComparisonTab({
  consortiumResult, financingResult, financing420Result,
  creditValue,
  financingBase,
  propertyValue,
  hasEmbeddedBid,
  freeBidValue,
  embeddedBidValue,
  downPayment,
  useBidAsDownPayment, setUseBidAsDownPayment,
  manualDownPayment, setManualDownPayment,
  termMonths,
  adminFee,
  reserveFund,
  financingRate, setFinancingRate,
  mipRate, setMipRate,
  dfiRate, setDfiRate,
  adminFeeMonthly, setAdminFeeMonthly,
  priceSavings, priceSavingsPercent,
  sacSavings, sacSavingsPercent,
  insuranceEnabled,
  custoDesembolsado,
  creditoLiquido,
  custoEfetivoReal,
  applyTR, setApplyTR,
  trMonthlyRate, setTrMonthlyRate,
  showAsymmetryBadge = false,
}: FinancingComparisonTabProps) {
  const [detailTableOpen, setDetailTableOpen] = useState(false);
  const [detailTableType, setDetailTableType] = useState<'sac' | 'price'>('sac');

  const hasFreeBid = freeBidValue > 0;
  const freeBidPercent = creditValue > 0 ? (freeBidValue / creditValue) * 100 : 0;
  const embeddedBidPercent = creditValue > 0 ? (embeddedBidValue / creditValue) * 100 : 0;

  // Bases unificadas — mesmas do card "Resultado", aplicadas em todos os blocos.
  const totalBidOffered = (freeBidValue || 0) + (embeddedBidValue || 0);
  const effectiveConsortiumCost = consortiumResult.totalCost + totalBidOffered;
  const priceTotalEffective = financingResult.priceTotalWithInsurance + downPayment;
  const sacTotalEffective = financingResult.sacTotalWithInsurance + downPayment;
  const price420TotalEffective = financing420Result.priceTotalWithInsurance + downPayment;
  const sac420TotalEffective = financing420Result.sacTotalWithInsurance + downPayment;

  return (
    <div className="mt-6 space-y-6">
      {/* Input cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card id="fin-consortium-card">
          <CardHeader><CardTitle className="text-lg">Consórcio</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="input-group">
              <Label className="input-label">Valor da Carta</Label>
              <CurrencyInput value={creditValue} onChange={() => {}} disabled className="text-right" />
            </div>
            <div className="input-group">
              <Label className="input-label">Prazo (meses)</Label>
              <Input type="number" value={termMonths} disabled />
            </div>
            <div className="input-group">
              <Label className="input-label">Taxa Admin. (%)</Label>
              <PercentInput value={adminFee} onChange={() => {}} disabled />
            </div>
            <div className="input-group">
              <Label className="input-label">Fundo Reserva (%)</Label>
              <PercentInput value={reserveFund} onChange={() => {}} disabled />
            </div>

            {/* Lances vindos do Simulador */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
              <p className="text-xs font-semibold text-foreground">Lances do Simulador</p>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Lance livre</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(freeBidValue)} {hasFreeBid && <span className="text-muted-foreground">({freeBidPercent.toFixed(1)}%)</span>}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Lance embutido</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(embeddedBidValue)} {embeddedBidValue > 0 && <span className="text-muted-foreground">({embeddedBidPercent.toFixed(1)}%)</span>}
                </span>
              </div>
              <p className="text-caption text-muted-foreground italic pt-1 border-t border-border">
                Para ajustar os lances, volte ao Simulador.
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground italic">Dados sincronizados do Simulador</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Seguro Prestamista Estimado: <span className="font-medium">{insuranceEnabled ? 'Ativado' : 'Desativado'}</span></p>
              <p className="text-xs text-muted-foreground mt-1">(Configurado no Simulador)</p>
            </div>
          </CardContent>
        </Card>

        <Card id="fin-financing-card">
          <CardHeader>
            <CardTitle className="text-lg">Financiamento</CardTitle>
            <p className="text-xs text-muted-foreground">Valores do financiamento simulados sem considerar seguros obrigatórios (MIP e DFI), salvo se informado em contrário.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasEmbeddedBid && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs space-y-1">
                <p className="font-medium text-primary">Comparação ajustada pelo lance embutido</p>
                <p className="text-muted-foreground leading-relaxed">
                  O financiamento usa o <strong>valor do bem</strong> de {formatCurrency(propertyValue)} (carta de {formatCurrency(creditValue)} − lance embutido). Lance embutido <strong>não</strong> conta como entrada — apenas reduz o crédito recebido.
                </p>
              </div>
            )}

            {/* Toggle de entrada via lance livre */}
            <div className="p-3 rounded-lg border border-border bg-card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Label htmlFor="use-bid-as-down" className="text-sm font-semibold cursor-pointer">
                    Usar lance livre como entrada
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>No financiamento, o lance equivale à entrada inicial. Apenas o lance <strong>livre</strong> é usado como entrada — lance embutido não.</span>
                  </p>
                </div>
                <Switch
                  id="use-bid-as-down"
                  checked={useBidAsDownPayment}
                  onCheckedChange={setUseBidAsDownPayment}
                  disabled={!hasFreeBid}
                />
              </div>

              {!hasFreeBid && (
                <p className="text-caption text-muted-foreground italic">
                  Nenhum lance livre definido no Simulador. Informe um lance livre lá para habilitar esta opção.
                </p>
              )}

              <div className="input-group">
                <Label className="input-label text-xs">
                  Entrada do financiamento {useBidAsDownPayment && hasFreeBid ? '(= lance livre)' : '(manual)'}
                </Label>
                <CurrencyInput
                  value={useBidAsDownPayment ? freeBidValue : manualDownPayment}
                  onChange={setManualDownPayment}
                  disabled={useBidAsDownPayment}
                  className="text-right pr-4"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="input-group">
                <Label className="input-label">Taxa de Juros Anual (%)</Label>
                <PercentInput value={financingRate} onChange={setFinancingRate} className="text-center" />
              </div>
              <div className="input-group">
                <Label className="input-label">MIP (%/mês)</Label>
                <PercentInput value={mipRate} onChange={setMipRate} decimalPlaces={4} className="text-center" />
              </div>
              <div className="input-group">
                <Label className="input-label">DFI (%/mês)</Label>
                <PercentInput value={dfiRate} onChange={setDfiRate} decimalPlaces={4} className="text-center" />
              </div>
              <div className="input-group">
                <Label className="input-label">Taxa Admin. (R$/mês)</Label>
                <CurrencyInput value={adminFeeMonthly} onChange={setAdminFeeMonthly} className="text-right pr-4" />
              </div>
            </div>

            {/* FASE 1 — Toggle TR (default OFF) */}
            <div className="p-3 rounded-lg border border-border bg-card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Label htmlFor="apply-tr" className="text-sm font-semibold cursor-pointer">
                    Considerar correção TR
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    A TR corrige o saldo devedor mensalmente (não é juros). Default desligado.
                  </p>
                </div>
                <Switch id="apply-tr" checked={applyTR} onCheckedChange={setApplyTR} />
              </div>
              {applyTR && (
                <div className="input-group">
                  <Label className="input-label text-xs">TR (% a.m.)</Label>
                  <PercentInput
                    value={trMonthlyRate}
                    onChange={(v) => setTrMonthlyRate(Math.max(0, Math.min(2, v)))}
                    decimalPlaces={4}
                    className="text-center"
                  />
                  <p className="text-caption text-muted-foreground mt-1">Faixa permitida: 0% a 2% a.m.</p>
                </div>
              )}
            </div>

            {showAsymmetryBadge && (
              <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/30">
                <p className="text-caption text-amber-700 dark:text-amber-400">
                  ⚠ Apenas o financiamento considera correção monetária — comparação corrigida parcialmente.
                </p>
              </div>
            )}

            <div className="p-3 bg-muted rounded-lg space-y-1">
              <p className="text-sm text-muted-foreground">Taxa mensal equivalente: {(annualToMonthlyRate(financingRate / 100) * 100).toFixed(4)}%</p>
              <p className="text-xs text-muted-foreground">Valor do bem: <strong>{formatCurrency(propertyValue)}</strong>{hasEmbeddedBid ? ' (crédito líquido)' : ''}</p>
              <p className="text-xs text-muted-foreground">Entrada: <strong>{formatCurrency(downPayment)}</strong></p>
              <p className="text-xs text-muted-foreground">Valor financiado: <strong className="text-primary">{formatCurrency(financingBase)}</strong></p>
              <p className="text-xs text-muted-foreground">MIP, DFI e taxa admin são estimativas editáveis — consulte condições específicas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card id="fin-result" className="interactive-card">
        <CardHeader>
          <CardTitle className="text-lg">Resultado</CardTitle>
          <p className="text-xs text-muted-foreground">Comparação baseada em estimativas e parâmetros informados. Os valores reais podem variar conforme condições de mercado e contrato.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-card-sm bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary mb-1">CONSÓRCIO</p>
              <p className="text-caption text-muted-foreground mb-3">Visão consultiva do cliente</p>

              {/* Bloco consultivo: Você recebe / Você paga / Custo real */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Você recebe</span>
                  <span className="font-semibold text-foreground">{formatCurrency(creditoLiquido)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Você paga</span>
                  <span className="font-semibold text-foreground">{formatCurrency(custoDesembolsado)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-primary/10">
                  <span className="text-muted-foreground font-medium">Custo real</span>
                  <span className="font-bold text-primary">
                    {custoEfetivoReal > 0 ? `R$ ${custoEfetivoReal.toFixed(2)} / R$ 1,00` : '—'}
                  </span>
                </div>
                <p className="text-caption text-muted-foreground italic leading-snug">
                  Lance embutido sai do próprio crédito — reduz o que você recebe, não soma ao desembolso.
                </p>
              </div>

              {/* Detalhamento técnico (mantido para auditoria) */}
              <div className="space-y-2 pt-3 border-t border-primary/20">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Parcela</span>
                  <span className="font-medium">{formatCurrency(consortiumResult.installmentAfterContemplation)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Custo Total do Plano</span>
                  <span className="font-medium">{formatCurrency(consortiumResult.totalCost)}</span>
                </div>
                {(freeBidValue > 0 || embeddedBidValue > 0) && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Lance Ofertado (livre + embutido)</span>
                    <span className="font-medium">{formatCurrency((freeBidValue || 0) + (embeddedBidValue || 0))}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Custo Efetivo (técnico)</span>
                  <span className="font-medium">{formatCurrency(effectiveConsortiumCost)}</span>
                </div>
              </div>
            </div>

            <div className="p-card-sm bg-muted rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-muted-foreground">FINANCIAMENTO PRICE</p>
                <Badge className={priceSavings > 0 ? 'badge-success' : 'badge-destructive'}>
                  <TrendingDown className="h-3 w-3 mr-1" />{priceSavingsPercent.toFixed(1)}%
                </Badge>
              </div>
              <p className="text-caption text-muted-foreground mb-3">Custo total estimado</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Parcela</span><span>{formatCurrency(financingResult.priceMonthlyPayment)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Custo total das parcelas (juros incluídos)</span><span>{formatCurrency(financingResult.priceTotalCost)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">MIP + DFI</span><span>{formatCurrency(financingResult.priceTotalMIP + financingResult.priceTotalDFI)}</span></div>
                {downPayment > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Entrada</span><span>{formatCurrency(downPayment)}</span></div>
                )}
                <div className="flex justify-between font-medium pt-2 border-t border-border"><span>Custo Efetivo do Cliente</span><span>{formatCurrency(priceTotalEffective)}</span></div>
              </div>
            </div>

            <div className="p-card-sm bg-muted rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-muted-foreground">FINANCIAMENTO SAC</p>
                <Badge className={sacSavings > 0 ? 'badge-success' : 'badge-destructive'}>
                  <TrendingDown className="h-3 w-3 mr-1" />{sacSavingsPercent.toFixed(1)}%
                </Badge>
              </div>
              <p className="text-caption text-muted-foreground mb-3">Custo total estimado</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">1ª Parcela</span><span>{formatCurrency(financingResult.sacFirstPayment)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Última Parcela</span><span>{formatCurrency(financingResult.sacLastPayment)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Custo total das parcelas (juros incluídos)</span><span>{formatCurrency(financingResult.sacTotalCost)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">MIP + DFI</span><span>{formatCurrency(financingResult.sacTotalMIP + financingResult.sacTotalDFI)}</span></div>
                {downPayment > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Entrada</span><span>{formatCurrency(downPayment)}</span></div>
                )}
                <div className="flex justify-between font-medium pt-2 border-t border-border"><span>Custo Efetivo do Cliente</span><span>{formatCurrency(sacTotalEffective)}</span></div>
              </div>
            </div>
          </div>

          {/* Diferença financeira — só faz sentido quando há financiamento real (base > 0). */}
          {financingBase > 0 ? (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-card-sm rounded-lg bg-primary/5 border border-primary/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Diferença estimada vs PRICE</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(priceSavings)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Diferença estimada vs SAC</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(sacSavings)}</p>
                  </div>
                </div>
              </div>
              <div className="p-card-sm rounded-lg bg-muted">
                <div className="flex items-start gap-1.5 mb-2">
                  <p className="text-xs font-semibold text-foreground/80">Como interpretar</p>
                  <HelpHint surfaceId="comparator.sac-price" />
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p><strong>Tabela PRICE:</strong> parcelas fixas ao longo do contrato. Indicada para quem busca previsibilidade no orçamento.</p>
                  <p><strong>Tabela SAC:</strong> parcelas decrescentes (amortização constante). Resulta em menor custo total de juros ao longo do prazo.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-card-sm rounded-lg bg-muted text-xs text-muted-foreground">
              A entrada cobre 100% do valor do bem — não há financiamento a comparar.
            </div>
          )}

          <div className="mt-4">
            <ContextualInsightStrip surfaceId="comparator.financing" />
          </div>
        </CardContent>
      </Card>

      {/* Comparativo com 420 meses — só faz sentido se o prazo do consórcio difere de 420. */}
      {termMonths !== 420 && financingBase > 0 && (
      <Card id="fin-420-comparison">
        <CardHeader>
          <CardTitle className="text-lg">Comparativo com Prazo de 420 Meses (35 Anos)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Financiamento imobiliário padrão de 35 anos — prazo máximo usual do mercado
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Consórcio ({termMonths} meses)</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(effectiveConsortiumCost)}</p>
              <p className="text-xs text-muted-foreground">Parcela: {formatCurrency(consortiumResult.installmentAfterContemplation)}</p>
              {totalBidOffered > 0 && (
                <p className="text-caption text-muted-foreground mt-1">inclui lance ofertado</p>
              )}
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Price (420 meses)</p>
              <p className="text-lg font-bold">{formatCurrency(price420TotalEffective)}</p>
              <p className="text-xs text-muted-foreground">Parcela: {formatCurrency(financing420Result.priceMonthlyPayment)}</p>
              {downPayment > 0 && (
                <p className="text-caption text-muted-foreground mt-1">inclui entrada</p>
              )}
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">SAC (420 meses)</p>
              <p className="text-lg font-bold">{formatCurrency(sac420TotalEffective)}</p>
              <p className="text-xs text-muted-foreground">1ª: {formatCurrency(financing420Result.sacFirstPayment)} | Última: {formatCurrency(financing420Result.sacLastPayment)}</p>
              {downPayment > 0 && (
                <p className="text-caption text-muted-foreground mt-1">inclui entrada</p>
              )}
            </div>
          </div>

          {/* Charts */}
          <p className="scroll-hint-label md:hidden text-caption text-muted-foreground flex items-center justify-center gap-1.5 mb-2">
            <MoveHorizontal className="h-3.5 w-3.5" aria-hidden />
            <span>arraste os gráficos para ver tudo</span>
          </p>
          <div id="fin-charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6 [&>div]:overflow-x-auto [&>div]:scroll-hint">
            <div className="bg-card border border-border rounded-xl p-card-sm">
              <p className="text-sm font-medium text-center mb-2 text-foreground">Custo Total Estimado</p>
              <div className="min-w-[480px] md:min-w-0">
              <ResponsiveContainer width="100%" height={420}>
                <BarChart style={{ background: "transparent" }}
                  data={[
                    { name: 'Consórcio', value: effectiveConsortiumCost },
                    { name: '', value: 0 },
                    { name: 'Price', value: priceTotalEffective },
                    { name: 'SAC', value: sacTotalEffective },
                    { name: ' ', value: 0 },
                    { name: 'Price 420m', value: price420TotalEffective },
                    { name: 'SAC 420m', value: sac420TotalEffective },
                  ]}
                  margin={{ top: 40, right: 20, left: 20, bottom: 20 }}
                  barSize={55} barGap={6}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name"  tick={false} axisLine={{ stroke: "var(--border)" }} height={10} />
                  <YAxis  tick={{ fill: '#333333' }} tickFormatter={(v) => `R$ ${Math.round(v / 1000)}k`} width={70}
                    domain={(() => {
                      const values = [effectiveConsortiumCost, priceTotalEffective, sacTotalEffective, price420TotalEffective, sac420TotalEffective].filter(v => Number.isFinite(v) && v > 0);
                      if (values.length === 0) return [0, 100];
                      const minVal = Math.min(...values); const maxVal = Math.max(...values); const range = maxVal - minVal;
                      return [Math.max(0, minVal - range * 0.15), maxVal * 1.08];
                    })()} />
                  <Tooltip formatter={(value: number) => value > 0 ? formatCurrency(value) : ''} contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E5E5', borderRadius: '4px' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {[{ color: 'var(--caixa-blue)' }, { color: 'transparent' }, { color: 'var(--caixa-orange)' }, { color: '#666666' }, { color: 'transparent' }, { color: '#16a34a' }, { color: '#333333' }].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList dataKey="value" position="top" content={({ x, y, width, value }: any) => {
                      if (!value || value === 0) return null;
                      return <text x={x + width / 2} y={y - 8} textAnchor="middle" style={{ fontSize: '10px', fontWeight: '600', fill: '#333333' }}>{`R$ ${Math.round(value).toLocaleString('pt-BR')}`}</text>;
                    }} />
                    <LabelList dataKey="name" position="inside" content={({ x, y, width, height, value }: any) => {
                      if (!value || value === '' || height < 40) return null;
                      const labelColor = value === 'Price' ? '#333333' : '#FFFFFF';
                      return <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '11px', fontWeight: '600', fill: labelColor }} transform={`rotate(-90, ${x + width / 2}, ${y + height / 2})`}>{value}</text>;
                    }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-card-sm">
              <p className="text-sm font-medium text-center mb-2 text-foreground">Parcela Mensal</p>
              <div className="min-w-[480px] md:min-w-0">
              <ResponsiveContainer width="100%" height={420}>
                <BarChart style={{ background: "transparent" }}
                  data={[
                    { name: 'Consórcio', value: consortiumResult.installmentAfterContemplation },
                    { name: 'Price', value: financingResult.priceMonthlyPayment },
                    { name: 'SAC 1ª', value: financingResult.sacFirstPayment },
                    { name: '', value: 0 },
                    { name: 'Price 420m', value: financing420Result.priceMonthlyPayment },
                    { name: 'SAC 420m 1ª', value: financing420Result.sacFirstPayment },
                  ]}
                  margin={{ top: 40, right: 20, left: 20, bottom: 20 }}
                  barSize={65} barGap={8}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name"  tick={false} axisLine={{ stroke: "var(--border)" }} height={10} />
                  <YAxis  tick={{ fill: '#333333' }} tickFormatter={(v) => `R$ ${Math.round(v / 1000)}k`} width={70}
                    domain={(() => {
                      const values = [consortiumResult.installmentAfterContemplation, financingResult.priceMonthlyPayment, financingResult.sacFirstPayment, financing420Result.priceMonthlyPayment, financing420Result.sacFirstPayment].filter(v => Number.isFinite(v) && v > 0);
                      if (values.length === 0) return [0, 100];
                      const minVal = Math.min(...values); const maxVal = Math.max(...values); const range = maxVal - minVal;
                      return [Math.max(0, minVal - range * 0.15), maxVal * 1.08];
                    })()} />
                  <Tooltip formatter={(value: number) => value > 0 ? formatCurrency(value) : ''} contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E5E5', borderRadius: '4px' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {[{ color: 'var(--caixa-blue)' }, { color: 'var(--caixa-orange)' }, { color: '#666666' }, { color: 'transparent' }, { color: '#16a34a' }, { color: '#333333' }].map((entry, index) => (
                      <Cell key={`cell-parc-${index}`} fill={entry.color} />
                    ))}
                    <LabelList dataKey="value" position="top" content={({ x, y, width, value }: any) => {
                      if (!value || value === 0) return null;
                      return <text x={x + width / 2} y={y - 8} textAnchor="middle" style={{ fontSize: '10px', fontWeight: '600', fill: '#333333' }}>{`R$ ${Math.round(value).toLocaleString('pt-BR')}`}</text>;
                    }} />
                    <LabelList dataKey="name" position="inside" content={({ x, y, width, height, value }: any) => {
                      if (!value || value === '' || height < 40) return null;
                      const labelColor = value === 'Price' ? '#333333' : '#FFFFFF';
                      return <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '11px', fontWeight: '600', fill: labelColor }} transform={`rotate(-90, ${x + width / 2}, ${y + height / 2})`}>{value}</text>;
                    }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Detail Table */}
      <Card id="fin-detail-table">
        <Collapsible open={detailTableOpen} onOpenChange={setDetailTableOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Tabela Detalhada</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Visão técnica detalhada da evolução mensal do financiamento</p>
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${detailTableOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <Tabs value={detailTableType} onValueChange={(v) => setDetailTableType(v as 'sac' | 'price')}>
                <TabsList className="grid w-full grid-cols-2 max-w-xs">
                  <TabsTrigger value="sac">Tabela SAC</TabsTrigger>
                  <TabsTrigger value="price">Tabela Price</TabsTrigger>
                </TabsList>
              </Tabs>
              <ScrollArea className="h-[400px] print:!h-auto print:!overflow-visible">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Mês</TableHead>
                      <TableHead className="text-right">Amortização</TableHead>
                      <TableHead className="text-right">Juros</TableHead>
                      <TableHead className="text-right">MIP</TableHead>
                      <TableHead className="text-right">DFI</TableHead>
                      <TableHead className="text-right">Taxa Adm.</TableHead>
                      <TableHead className="text-right">Prestação</TableHead>
                      <TableHead className="text-right">Saldo Devedor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(detailTableType === 'sac' ? financingResult.sacTable : financingResult.priceTable).map((row) => (
                      <TableRow key={row.month}>
                        <TableCell className="text-center">{row.month}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.amortization)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.interest)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.mip)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.dfi)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.adminFee)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.payment)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
