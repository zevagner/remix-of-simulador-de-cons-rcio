import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PercentInput } from '@/components/ui/percent-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/core/finance';
import { SimulationResult } from '@/types/consortium';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { ZoomIn, ZoomOut, CheckCircle2, XCircle, Percent, TrendingDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ConsortiumComparisonTabProps {
  consortiumResult: SimulationResult;
  consortium2Result: SimulationResult;
  creditValue: number;
  termMonths: number;
  adminFee: number;
  reserveFund: number;
  adminFee2: number;
  setAdminFee2: (v: number) => void;
  reserveFund2: number;
  setReserveFund2: (v: number) => void;
  insuranceEnabled: boolean;
  reducedInstallment?: boolean;
  adminFeeDiscount?: number;
  effectiveAdminFeePercent?: number;
  useAdjustedScale: boolean;
  setUseAdjustedScale: (v: boolean) => void;
  getAdjustedDomain: (values: number[], useAdjusted: boolean) => [number, number];
  /** FASE 1 — toggle INCC/IPCA (default false). */
  applyConsortiumAdjustment: boolean;
  setApplyConsortiumAdjustment: (v: boolean) => void;
  consortiumAdjustmentPercent: number;
  setConsortiumAdjustmentPercent: (v: number) => void;
  /** Badge XOR — quando true mostra "apenas consórcio considera correção". */
  showAsymmetryBadge?: boolean;
}

export function ConsortiumComparisonTab({
  consortiumResult, consortium2Result,
  creditValue,
  termMonths,
  adminFee,
  reserveFund,
  adminFee2, setAdminFee2,
  reserveFund2, setReserveFund2,
  insuranceEnabled,
  reducedInstallment = false,
  adminFeeDiscount = 0,
  effectiveAdminFeePercent,
  useAdjustedScale, setUseAdjustedScale,
  getAdjustedDomain,
  applyConsortiumAdjustment, setApplyConsortiumAdjustment,
  consortiumAdjustmentPercent, setConsortiumAdjustmentPercent,
  showAsymmetryBadge = false,
}: ConsortiumComparisonTabProps) {
  const isMobile = useIsMobile();
  const chartBarSize = isMobile ? 56 : 100;
  const chartYWidth = isMobile ? 48 : 70;
  const chartHeight = isMobile ? 280 : 360;
  const hasDiscount = adminFeeDiscount > 0 && effectiveAdminFeePercent !== undefined && effectiveAdminFeePercent < adminFee;
  const fmtPct = (v: number) => `${v.toFixed(2).replace('.', ',')}%`;
  const comparison = {
    option1: { name: 'Consórcio 1', monthly: consortiumResult.installmentAfterContemplation, total: consortiumResult.totalCost },
    option2: { name: 'Consórcio 2', monthly: consortium2Result.installmentAfterContemplation, total: consortium2Result.totalCost },
  };

  const totalCostDomain = getAdjustedDomain([consortiumResult.totalCost, consortium2Result.totalCost], useAdjustedScale);
  const installmentDomain = getAdjustedDomain([consortiumResult.installmentAfterContemplation, consortium2Result.installmentAfterContemplation], useAdjustedScale);

  return (
    <div className="mt-6 space-y-6">
      {/* Input cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card id="cc-caixa-card">
          <CardHeader><CardTitle className="text-lg">Consórcio 1</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="input-group">
              <Label className="input-label">Valor da Carta</Label>
              <CurrencyInput value={creditValue} onChange={() => {}} disabled />
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

            {/* FASE 1 — Toggle INCC/IPCA (default OFF) */}
            <div className="p-3 rounded-lg border border-border bg-card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Label htmlFor="apply-consortium-adjust" className="text-sm font-semibold cursor-pointer">
                    Considerar reajuste anual (INPC)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aplica correção monetária anual ao saldo do consórcio. Default desligado.
                  </p>
                </div>
                <Switch
                  id="apply-consortium-adjust"
                  checked={applyConsortiumAdjustment}
                  onCheckedChange={setApplyConsortiumAdjustment}
                />
              </div>
              {applyConsortiumAdjustment && (
                <div className="input-group">
                  <Label className="input-label text-xs">Índice anual (% a.a.)</Label>
                  <PercentInput
                    value={consortiumAdjustmentPercent}
                    onChange={(v) => setConsortiumAdjustmentPercent(Math.max(0, Math.min(15, v)))}
                  />
                  <p className="text-caption text-muted-foreground mt-1">Faixa permitida: 0% a 15% a.a.</p>
                </div>
              )}
            </div>

            {showAsymmetryBadge && (
              <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/30">
                <p className="text-caption text-amber-700 dark:text-amber-400">
                  ⚠ Apenas o consórcio considera correção monetária — comparação corrigida parcialmente.
                </p>
              </div>
            )}

            <div className="p-3 bg-muted rounded-lg space-y-1.5">
              <p className="text-xs text-muted-foreground">Seguro Prestamista Estimado: <span className="font-medium">{insuranceEnabled ? 'Ativado' : 'Desativado'}</span></p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                {reducedInstallment
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                  : <XCircle className="h-3.5 w-3.5 text-muted-foreground/75 shrink-0" />}
                Parcela reduzida: <span className="font-medium">{reducedInstallment ? 'Sim' : 'Não'}</span>
              </p>
              {hasDiscount ? (
                <p className="text-xs text-success flex items-center gap-1.5">
                  <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                  Taxa Adm.: <span className="font-medium">{fmtPct(adminFee)} → {fmtPct(effectiveAdminFeePercent!)}</span>
                  <span className="text-caption bg-success/10 text-success px-1.5 py-0.5 rounded">com desconto</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 shrink-0" />
                  Taxa Adm. efetiva: <span className="font-medium">{fmtPct(adminFee)}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground italic mt-1">Dados sincronizados do Simulador</p>
            </div>
          </CardContent>
        </Card>

        <Card id="cc-outro-card">
          <CardHeader><CardTitle className="text-lg">Consórcio 2</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="input-group">
              <Label className="input-label">Taxa Admin. (%)</Label>
              <PercentInput value={adminFee2} onChange={setAdminFee2} />
            </div>
            <div className="input-group">
              <Label className="input-label">Fundo Reserva (%)</Label>
              <PercentInput value={reserveFund2} onChange={setReserveFund2} />
            </div>
            <div className="p-3 bg-muted rounded-lg space-y-1.5">
              <p className="text-xs text-muted-foreground">Seguro Prestamista Estimado: <span className="font-medium">{insuranceEnabled ? 'Ativado' : 'Desativado'}</span></p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-muted-foreground/75 shrink-0" />
                Parcela reduzida: <span className="font-medium">Não</span>
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 shrink-0" />
                Taxa Adm. efetiva: <span className="font-medium">{fmtPct(adminFee2)}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">(Mesmo seguro do Simulador)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card id="cc-result" className="interactive-card">
        <CardHeader>
          <CardTitle className="text-lg">Resultado</CardTitle>
          <p className="text-xs text-muted-foreground">Comparação baseada em estimativas e parâmetros informados.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-card-sm bg-muted rounded-lg">
              <div className="text-center flex-1">
                <p className="text-sm text-muted-foreground">{comparison.option1.name}</p>
                <p className="font-bold text-lg">{formatCurrency(comparison.option1.total)}</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-sm text-muted-foreground">{comparison.option2.name}</p>
                <p className="font-bold text-lg">{formatCurrency(comparison.option2.total)}</p>
              </div>
            </div>
            <div className="p-card-sm rounded-lg bg-primary/5 border border-primary/10 flex items-center">
              <p className="text-base font-medium text-primary">
                {(() => {
                  const diff = comparison.option2.total - comparison.option1.total;
                  // Empate consultivo: diferença abaixo de R$ 1,00 não justifica veredito.
                  if (Math.abs(diff) < 1) return 'Custo equivalente entre os dois cenários';
                  return diff > 0
                    ? `${comparison.option1.name} é ${formatCurrency(diff)} mais barato`
                    : `${comparison.option2.name} é ${formatCurrency(-diff)} mais barato`;
                })()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Comparativo Visual</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setUseAdjustedScale(!useAdjustedScale)} className="flex items-center gap-2">
              {useAdjustedScale ? <><ZoomOut className="h-4 w-4" /><span className="hidden sm:inline">Escala Completa</span></> : <><ZoomIn className="h-4 w-4" /><span className="hidden sm:inline">Escala Ajustada</span></>}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {useAdjustedScale ? 'Escala ajustada para destacar diferenças (valores numéricos preservados)' : 'Escala completa iniciando em zero'}
          </p>
        </CardHeader>
        <CardContent>
          <div id="cc-charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-card-sm">
              <p className="text-sm font-medium text-center mb-2 text-foreground">Custo Total do Plano</p>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart style={{ background: "transparent" }} data={[{ name: 'Consórcio 1', value: consortiumResult.totalCost }, { name: 'Consórcio 2', value: consortium2Result.totalCost }]} margin={{ top: 40, right: 12, left: 4, bottom: 8 }} barSize={chartBarSize} barGap={isMobile ? 12 : 30}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name"   axisLine={{ stroke: "var(--border)" }} height={isMobile ? 24 : 10} tick={{ fill: "var(--muted-foreground)" }} />
                  <YAxis   tickFormatter={(v) => `R$ ${Math.round(v / 1000)}k`} width={chartYWidth} domain={totalCostDomain} allowDataOverflow={false} tick={{ fill: "var(--muted-foreground)" }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E5E5', borderRadius: '4px' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {[{ color: 'var(--caixa-blue)' }, { color: 'var(--caixa-orange)' }].map((entry, index) => <Cell key={`cell-cons-total-${index}`} fill={entry.color} />)}
                    <LabelList dataKey="value" position="top" content={({ x, y, width, value }: any) => { if (!value) return null; return <text x={x + width / 2} y={y - 8} textAnchor="middle" style={{ fontSize: isMobile ? '10px' : '11px', fontWeight: '600', fill: '#333333' }}>{`R$ ${Math.round(value).toLocaleString('pt-BR')}`}</text>; }} />
                    {!isMobile && <LabelList dataKey="name" position="inside" content={({ x, y, width, height, value }: any) => { if (!value || height < 40) return null; return <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '12px', fontWeight: '600', fill: '#FFFFFF' }} transform={`rotate(-90, ${x + width / 2}, ${y + height / 2})`}>{value}</text>; }} />}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-xl p-card-sm">
              <p className="text-sm font-medium text-center mb-2 text-foreground">Parcela Mensal</p>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart style={{ background: "transparent" }} data={[{ name: 'Consórcio 1', value: consortiumResult.installmentAfterContemplation }, { name: 'Consórcio 2', value: consortium2Result.installmentAfterContemplation }]} margin={{ top: 40, right: 12, left: 4, bottom: 8 }} barSize={chartBarSize} barGap={isMobile ? 12 : 30}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name"   axisLine={{ stroke: "var(--border)" }} height={isMobile ? 24 : 10} tick={{ fill: "var(--muted-foreground)" }} />
                  <YAxis   tickFormatter={(v) => `R$ ${Math.round(v / 1000)}k`} width={chartYWidth} domain={installmentDomain} allowDataOverflow={false} tick={{ fill: "var(--muted-foreground)" }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E5E5', borderRadius: '4px' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {[{ color: 'var(--caixa-blue)' }, { color: 'var(--caixa-orange)' }].map((entry, index) => <Cell key={`cell-cons-parc-${index}`} fill={entry.color} />)}
                    <LabelList dataKey="value" position="top" content={({ x, y, width, value }: any) => { if (!value) return null; return <text x={x + width / 2} y={y - 8} textAnchor="middle" style={{ fontSize: isMobile ? '10px' : '11px', fontWeight: '600', fill: '#333333' }}>{`R$ ${Math.round(value).toLocaleString('pt-BR')}`}</text>; }} />
                    {!isMobile && <LabelList dataKey="name" position="inside" content={({ x, y, width, height, value }: any) => { if (!value || height < 40) return null; return <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '12px', fontWeight: '600', fill: '#FFFFFF' }} transform={`rotate(-90, ${x + width / 2}, ${y + height / 2})`}>{value}</text>; }} />}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
