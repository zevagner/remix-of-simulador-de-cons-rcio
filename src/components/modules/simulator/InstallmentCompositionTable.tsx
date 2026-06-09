import { memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { ScrollAffordance } from '@/components/shared/ScrollAffordance';
import { formatCurrency } from '@/core/finance';
import { SimulationResult, ConsortiumType } from '@/types/consortium';
import { REDUCED_INSTALLMENT_FACTOR } from '@/config/consortiumRates';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface InstallmentCompositionTableProps {
  creditValue: number;
  termMonths: number;
  adminFeePercent: number;
  reserveFundPercent: number;
  insuranceEnabled: boolean;
  result: SimulationResult;
  reducedInstallment: boolean;
  reducedInstallmentMonths: number;
  consortiumType: ConsortiumType;
  /** Quando true, valores em R$ são exibidos no agrupamento semestral (mensal × 6). */
  isFlexPlan?: boolean;
}

interface InstallmentRow {
  range: string;
  months: number;
  commonFundPercent: number;
  commonFundValue: number;
  adminFeePercent: number;
  adminFeeValue: number;
  adminFeeLabel: string; // "Taxa de Administração (Antecipada)" ou "Taxa de Administração"
  reserveFundPercent: number;
  reserveFundValue: number;
  insuranceValue: number;
  totalInstallment: number;
}

// Constantes para antecipação de taxa de administração por tipo de consórcio
// Veículos e Pesados: 9 meses a 0,6012%
// Imobiliário padrão: 27 meses a 0,2134%
// Imobiliário com parcela reduzida: 24 meses a 0,17%
const VEHICLE_ADVANCE_MONTHS = 9;
const VEHICLE_ADVANCE_RATE = 0.6012;
const REAL_ESTATE_ADVANCE_MONTHS = 27;
const REAL_ESTATE_ADVANCE_RATE = 0.2134;
const REAL_ESTATE_REDUCED_ADVANCE_MONTHS = 24;
const REAL_ESTATE_REDUCED_ADVANCE_RATE = 0.17;

// Função para obter parâmetros de antecipação por tipo de consórcio
function getAdvanceParams(consortiumType: ConsortiumType, reducedInstallment: boolean): { months: number; rate: number } {
  if (consortiumType === 'auto' || consortiumType === 'pesados') {
    return { months: VEHICLE_ADVANCE_MONTHS, rate: VEHICLE_ADVANCE_RATE };
  }
  if (consortiumType === 'imobiliario') {
    if (reducedInstallment) {
      return { months: REAL_ESTATE_REDUCED_ADVANCE_MONTHS, rate: REAL_ESTATE_REDUCED_ADVANCE_RATE };
    }
    return { months: REAL_ESTATE_ADVANCE_MONTHS, rate: REAL_ESTATE_ADVANCE_RATE };
  }
  return { months: 0, rate: 0 };
}

export const InstallmentCompositionTable = memo(function InstallmentCompositionTable({
  creditValue,
  termMonths,
  adminFeePercent,
  reserveFundPercent,
  insuranceEnabled,
  result,
  reducedInstallment,
  reducedInstallmentMonths,
  consortiumType,
  isFlexPlan = false,
}: InstallmentCompositionTableProps) {
  // Fator de exibição: Flex agrupa 6 parcelas mensais em 1 semestral (apresentação).
  const flexFactor = isFlexPlan ? 6 : 1;
  const unitLabel = isFlexPlan ? 'semestral' : 'mensal';
  // Obtém parâmetros de antecipação baseado no tipo e se tem parcela reduzida
  const advanceParams = getAdvanceParams(consortiumType, reducedInstallment);
  const hasAdvanceFee = advanceParams.months > 0 && advanceParams.rate > 0;
  const advanceMonths = hasAdvanceFee ? Math.min(advanceParams.months, termMonths) : 0;
  const advanceRate = advanceParams.rate;
  
  // Taxa de administração TOTAL do contrato (única, não duplicada)
  const adminFeeTotal = result.adminFee;
  const reserveFundTotal = result.reserveFund;
  const monthlyInsurance = insuranceEnabled ? result.monthlyInsurance : 0;

  // ============================================================
  // ONDA A — SINGLE SOURCE OF TRUTH DA PARCELA
  // ============================================================
  // A parcela cheia, reduzida e rediluída são CONSUMIDAS do `result`
  // já reconciliado com o motor mensal canônico (reconcileWithSchedule).
  // Esta tabela NÃO recalcula `totalPlan` nem `fullInstallment` localmente
  // — apenas DECOMPÕE a parcela oficial em seus componentes.
  // ============================================================
  const fullInstallment = result.fullInstallment;
  const reducedInstallmentValueCanonical = result.reducedInstallmentValue;
  const redilutedInstallmentValueCanonical = result.redilutedInstallmentValue;

  // Componentes base mensais (para exibição detalhada)
  const monthlyCommonFundBase = creditValue / termMonths;
  const monthlyAdminFeeBase = adminFeeTotal / termMonths;
  const monthlyReserveFundBase = reserveFundTotal / termMonths;

  // Calcula percentuais sobre o crédito
  const commonFundPercentOfCredit = (monthlyCommonFundBase / creditValue) * 100;
  const reserveFundPercentOfCredit = (monthlyReserveFundBase / creditValue) * 100;

  // Gera as linhas da tabela baseado no cenário
  const rows: InstallmentRow[] = [];

  // ============================================================
  // CENÁRIO: IMOBILIÁRIO COM PARCELA REDUZIDA
  // ============================================================
  // REGRA CORRETA:
  // 1. Parcela REDUZIDA = 70% da parcela CHEIA (valor fixo, não componente por componente)
  // 2. Apenas DUAS fases de parcela: reduzida (1-80) e cheia (81-fim)
  // 3. A antecipação de taxa é redistribuição INTERNA, não altera o valor da parcela
  // 4. O fundo comum é ajustado para manter a parcela constante em cada fase
  
  if (reducedInstallment && reducedInstallmentMonths > 0 && reducedInstallmentMonths < termMonths) {
    const reductionFactor = REDUCED_INSTALLMENT_FACTOR;
    const effectiveReducedMonths = reducedInstallmentMonths;
    const remainingMonths = termMonths - effectiveReducedMonths;

    // Onda A: parcelas vêm da fonte canônica (sem fallback paralelo).
    const reducedInstallmentValue = reducedInstallmentValueCanonical || fullInstallment * reductionFactor;
    const redilutedInstallmentValue = redilutedInstallmentValueCanonical || fullInstallment;
    
    // ============================================================
    // REGRA FUNDAMENTAL: Os totais de cada componente são FIXOS
    // Fundo Comum Total = creditValue (R$ 450.000)
    // Taxa Adm Total = adminFeeTotal (R$ 78.390 para 17,42%)
    // Fundo Reserva Total = reserveFundTotal (R$ 11.250 para 2,5%)
    // 
    // A distribuição mensal varia, mas a SOMA deve bater exatamente
    // ============================================================
    
    // Componentes mensais BASE (se não houvesse redução)
    // monthlyCommonFundBase = creditValue / termMonths
    // monthlyAdminFeeBase = adminFeeTotal / termMonths
    // monthlyReserveFundBase = reserveFundTotal / termMonths
    
    // PERÍODO REDUZIDO: cada componente é 70% do valor base
    const reducedMonthlyCommonFund = monthlyCommonFundBase * reductionFactor;
    const reducedMonthlyAdminFee = monthlyAdminFeeBase * reductionFactor;
    const reducedMonthlyReserveFund = monthlyReserveFundBase * reductionFactor;
    
    // Total pago no período reduzido
    const commonFundPaidReduced = reducedMonthlyCommonFund * effectiveReducedMonths;
    const adminFeePaidReduced = reducedMonthlyAdminFee * effectiveReducedMonths;
    const reserveFundPaidReduced = reducedMonthlyReserveFund * effectiveReducedMonths;
    
    // PERÍODO REDILUÍDO: saldo restante ÷ meses restantes
    const redilutedMonthlyCommonFund = (creditValue - commonFundPaidReduced) / remainingMonths;
    const redilutedMonthlyAdminFee = (adminFeeTotal - adminFeePaidReduced) / remainingMonths;
    const redilutedMonthlyReserveFund = (reserveFundTotal - reserveFundPaidReduced) / remainingMonths;
    
    // Com ou sem antecipação de taxa, a lógica da PARCELA é a mesma:
    // - Período reduzido: parcela = 70% da cheia (FIXA)
    // - Período rediluído: parcela = cheia + déficit distribuído (FIXA)
    // A antecipação afeta apenas a distribuição INTERNA dos componentes
    
    if (hasAdvanceFee && advanceMonths > 0) {
      // Taxa de administração antecipada por mês (valor FIXO da regra de antecipação)
      const monthlyAdvanceAdminFee = creditValue * (advanceRate / 100);
      
      // Total da taxa cobrada nos meses de antecipação
      const totalAdvanceCollected = monthlyAdvanceAdminFee * advanceMonths;
      
      // Saldo da taxa a ser diluído nos meses após antecipação
      const remainingAdminFeeAfterAdvance = adminFeeTotal - totalAdvanceCollected;
      const normalAdminFeeMonths = termMonths - advanceMonths;
      const monthlyNormalAdminFee = normalAdminFeeMonths > 0 ? remainingAdminFeeAfterAdvance / normalAdminFeeMonths : 0;
      
      // Quantos meses de cada tipo em cada período
      const advanceMonthsInReduced = Math.min(advanceMonths, effectiveReducedMonths);
      const normalMonthsInReduced = effectiveReducedMonths - advanceMonthsInReduced;
      const advanceMonthsInFull = Math.max(0, advanceMonths - effectiveReducedMonths);
      const normalMonthsInFull = remainingMonths - advanceMonthsInFull;
      
      // PERÍODO REDUZIDO COM ANTECIPAÇÃO
      // Parcela = 70% da cheia (FIXA), fundo comum absorve a diferença
      if (advanceMonthsInReduced > 0) {
        const adjustedCommonFund = reducedInstallmentValue - monthlyAdvanceAdminFee - reducedMonthlyReserveFund - monthlyInsurance;
        
        rows.push({
          range: `1ª a ${advanceMonthsInReduced}ª`,
          months: advanceMonthsInReduced,
          commonFundPercent: (adjustedCommonFund / creditValue) * 100,
          commonFundValue: adjustedCommonFund,
          adminFeePercent: advanceRate,
          adminFeeValue: monthlyAdvanceAdminFee,
          adminFeeLabel: 'Taxa de Administração (Antecipada)',
          reserveFundPercent: (reducedMonthlyReserveFund / creditValue) * 100,
          reserveFundValue: reducedMonthlyReserveFund,
          insuranceValue: monthlyInsurance,
          totalInstallment: reducedInstallmentValue, // FIXA em 70% da cheia
        });
      }
      
      // PERÍODO REDUZIDO SEM ANTECIPAÇÃO
      if (normalMonthsInReduced > 0) {
        const adjustedCommonFund = reducedInstallmentValue - monthlyNormalAdminFee - reducedMonthlyReserveFund - monthlyInsurance;
        
        rows.push({
          range: `${advanceMonthsInReduced + 1}ª a ${effectiveReducedMonths}ª`,
          months: normalMonthsInReduced,
          commonFundPercent: (adjustedCommonFund / creditValue) * 100,
          commonFundValue: adjustedCommonFund,
          adminFeePercent: (monthlyNormalAdminFee / creditValue) * 100,
          adminFeeValue: monthlyNormalAdminFee,
          adminFeeLabel: 'Taxa de Administração',
          reserveFundPercent: (reducedMonthlyReserveFund / creditValue) * 100,
          reserveFundValue: reducedMonthlyReserveFund,
          insuranceValue: monthlyInsurance,
          totalInstallment: reducedInstallmentValue, // FIXA em 70% da cheia
        });
      }
      
      // PERÍODO REDILUÍDO COM ANTECIPAÇÃO (se antecipação > período reduzido)
      if (advanceMonthsInFull > 0) {
        const adjustedCommonFund = redilutedInstallmentValue - monthlyAdvanceAdminFee - redilutedMonthlyReserveFund - monthlyInsurance;
        
        rows.push({
          range: `${effectiveReducedMonths + 1}ª a ${advanceMonths}ª`,
          months: advanceMonthsInFull,
          commonFundPercent: (adjustedCommonFund / creditValue) * 100,
          commonFundValue: adjustedCommonFund,
          adminFeePercent: advanceRate,
          adminFeeValue: monthlyAdvanceAdminFee,
          adminFeeLabel: 'Taxa de Administração (Antecipada)',
          reserveFundPercent: (redilutedMonthlyReserveFund / creditValue) * 100,
          reserveFundValue: redilutedMonthlyReserveFund,
          insuranceValue: monthlyInsurance,
          totalInstallment: redilutedInstallmentValue, // FIXA
        });
      }
      
      // PERÍODO REDILUÍDO SEM ANTECIPAÇÃO
      if (normalMonthsInFull > 0) {
        const adjustedCommonFund = redilutedInstallmentValue - monthlyNormalAdminFee - redilutedMonthlyReserveFund - monthlyInsurance;
        const startMonth = Math.max(effectiveReducedMonths, advanceMonths) + 1;
        
        rows.push({
          range: `${startMonth}ª a ${termMonths}ª`,
          months: normalMonthsInFull,
          commonFundPercent: (adjustedCommonFund / creditValue) * 100,
          commonFundValue: adjustedCommonFund,
          adminFeePercent: (monthlyNormalAdminFee / creditValue) * 100,
          adminFeeValue: monthlyNormalAdminFee,
          adminFeeLabel: 'Taxa de Administração',
          reserveFundPercent: (redilutedMonthlyReserveFund / creditValue) * 100,
          reserveFundValue: redilutedMonthlyReserveFund,
          insuranceValue: monthlyInsurance,
          totalInstallment: redilutedInstallmentValue, // FIXA
        });
      }
    } else {
      // SEM antecipação de taxa: apenas duas faixas simples
      rows.push({
        range: `1ª a ${effectiveReducedMonths}ª`,
        months: effectiveReducedMonths,
        commonFundPercent: (reducedMonthlyCommonFund / creditValue) * 100,
        commonFundValue: reducedMonthlyCommonFund,
        adminFeePercent: (reducedMonthlyAdminFee / creditValue) * 100,
        adminFeeValue: reducedMonthlyAdminFee,
        adminFeeLabel: 'Taxa de Administração',
        reserveFundPercent: (reducedMonthlyReserveFund / creditValue) * 100,
        reserveFundValue: reducedMonthlyReserveFund,
        insuranceValue: monthlyInsurance,
        totalInstallment: reducedInstallmentValue,
      });

      rows.push({
        range: `${effectiveReducedMonths + 1}ª a ${termMonths}ª`,
        months: remainingMonths,
        commonFundPercent: (redilutedMonthlyCommonFund / creditValue) * 100,
        commonFundValue: redilutedMonthlyCommonFund,
        adminFeePercent: (redilutedMonthlyAdminFee / creditValue) * 100,
        adminFeeValue: redilutedMonthlyAdminFee,
        adminFeeLabel: 'Taxa de Administração',
        reserveFundPercent: (redilutedMonthlyReserveFund / creditValue) * 100,
        reserveFundValue: redilutedMonthlyReserveFund,
        insuranceValue: monthlyInsurance,
        totalInstallment: redilutedInstallmentValue,
      });
    }
  }
  // ============================================================
  // CENÁRIO: VEÍCULOS/PESADOS COM ANTECIPAÇÃO (sem parcela reduzida)
  // ============================================================
  else if (hasAdvanceFee && advanceMonths > 0 && termMonths > advanceMonths) {
    // Taxa de administração antecipada por mês
    const monthlyAdvanceAdminFee = creditValue * (advanceRate / 100);
    
    // Total da taxa cobrada nos meses de antecipação
    const totalAdvanceCollected = monthlyAdvanceAdminFee * advanceMonths;
    
    // Saldo restante da taxa de administração a ser diluído nos meses restantes
    const remainingAdminFee = adminFeeTotal - totalAdvanceCollected;
    const remainingMonths = termMonths - advanceMonths;
    const monthlyNormalAdminFee = remainingMonths > 0 ? remainingAdminFee / remainingMonths : 0;
    
    // PARCELA FIXA: o fundo comum se ajusta para manter a parcela constante
    const commonFundAdvancePeriod = fullInstallment - monthlyAdvanceAdminFee - monthlyReserveFundBase - monthlyInsurance;
    const commonFundNormalPeriod = fullInstallment - monthlyNormalAdminFee - monthlyReserveFundBase - monthlyInsurance;
    
    // Linha 1: Meses com taxa antecipada
    rows.push({
      range: `1ª a ${advanceMonths}ª`,
      months: advanceMonths,
      commonFundPercent: (commonFundAdvancePeriod / creditValue) * 100,
      commonFundValue: commonFundAdvancePeriod,
      adminFeePercent: advanceRate,
      adminFeeValue: monthlyAdvanceAdminFee,
      adminFeeLabel: 'Taxa de Administração (Antecipada)',
      reserveFundPercent: reserveFundPercentOfCredit,
      reserveFundValue: monthlyReserveFundBase,
      insuranceValue: monthlyInsurance,
      totalInstallment: fullInstallment,
    });

    // Linha 2: Meses com taxa normal diluída
    rows.push({
      range: `${advanceMonths + 1}ª a ${termMonths}ª`,
      months: remainingMonths,
      commonFundPercent: (commonFundNormalPeriod / creditValue) * 100,
      commonFundValue: commonFundNormalPeriod,
      adminFeePercent: (monthlyNormalAdminFee / creditValue) * 100,
      adminFeeValue: monthlyNormalAdminFee,
      adminFeeLabel: 'Taxa de Administração',
      reserveFundPercent: reserveFundPercentOfCredit,
      reserveFundValue: monthlyReserveFundBase,
      insuranceValue: monthlyInsurance,
      totalInstallment: fullInstallment,
    });
  } 
  // ============================================================
  // CENÁRIO PADRÃO: parcela única ao longo do plano
  // ============================================================
  else {
    rows.push({
      range: `1ª a ${termMonths}ª`,
      months: termMonths,
      commonFundPercent: commonFundPercentOfCredit,
      commonFundValue: monthlyCommonFundBase,
      adminFeePercent: (monthlyAdminFeeBase / creditValue) * 100,
      adminFeeValue: monthlyAdminFeeBase,
      adminFeeLabel: 'Taxa de Administração',
      reserveFundPercent: reserveFundPercentOfCredit,
      reserveFundValue: monthlyReserveFundBase,
      insuranceValue: monthlyInsurance,
      totalInstallment: fullInstallment,
    });
  }

  // Calcula subtotais com validação
  const totalCommonFund = rows.reduce((sum, row) => sum + (row.commonFundValue * row.months), 0);
  const totalAdminFee = rows.reduce((sum, row) => sum + (row.adminFeeValue * row.months), 0);
  const totalReserveFund = rows.reduce((sum, row) => sum + (row.reserveFundValue * row.months), 0);
  const totalInsurance = insuranceEnabled ? result.insuranceTotal : 0;
  
  // Total geral do plano
  const grandTotal = totalCommonFund + totalAdminFee + totalReserveFund + totalInsurance;

  return (
    <div className="space-y-4">
      {/* Alerta informativo para antecipação de taxa */}
      {hasAdvanceFee && advanceMonths > 0 && termMonths > advanceMonths && (
        <Alert className="border-primary/30 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm text-foreground">
            <strong>Taxa de Administração com Antecipação:</strong> Nos primeiros {advanceMonths} meses, 
            a taxa é cobrada de forma antecipada ({advanceRate.toFixed(4).replace('.', ',')}% da carta). 
            O saldo restante é diluído nas parcelas seguintes. 
            {reducedInstallment && consortiumType === 'imobiliario' 
              ? ' Durante a parcela reduzida, fundo comum e reserva são 70% do valor base.'
              : ' A parcela permanece fixa, com o fundo comum compensando a variação.'}
          </AlertDescription>
        </Alert>
      )}

      <ScrollAffordance containerClassName="border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/10">
              <TableHead className="text-primary font-semibold text-xs w-28">Faixa</TableHead>
              <TableHead className="text-primary font-semibold text-xs text-center" colSpan={2}>Fundo Comum</TableHead>
              <TableHead className="text-primary font-semibold text-xs text-center" colSpan={2}>Taxa de Administração</TableHead>
              <TableHead className="text-primary font-semibold text-xs text-center" colSpan={2}>Fundo Reserva</TableHead>
              <TableHead className="text-primary font-semibold text-xs text-right">Seguro</TableHead>
              <TableHead className="text-primary font-semibold text-xs text-right">
                Parcela {isFlexPlan ? 'semestral' : ''}
              </TableHead>
            </TableRow>
            <TableRow className="bg-muted/30">
              <TableHead className="text-muted-foreground text-xs"></TableHead>
              <TableHead className="text-muted-foreground text-xs text-center">%</TableHead>
              <TableHead className="text-muted-foreground text-xs text-right">R$</TableHead>
              <TableHead className="text-muted-foreground text-xs text-center">%</TableHead>
              <TableHead className="text-muted-foreground text-xs text-right">R$</TableHead>
              <TableHead className="text-muted-foreground text-xs text-center">%</TableHead>
              <TableHead className="text-muted-foreground text-xs text-right">R$</TableHead>
              <TableHead className="text-muted-foreground text-xs text-right">R$ (fixo)</TableHead>
              <TableHead className="text-muted-foreground text-xs text-right">R$</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index} className="hover:bg-muted/20">
                <TableCell className="font-medium text-sm text-foreground">
                  <div>{row.range}</div>
                  {hasAdvanceFee && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {row.adminFeeLabel === 'Taxa de Administração (Antecipada)' ? '(antecipada)' : '(diluída)'}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {row.commonFundPercent.toFixed(4).replace('.', ',')}%
                </TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums">
                  {formatCurrency(row.commonFundValue * flexFactor)}
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {row.adminFeePercent.toFixed(4).replace('.', ',')}%
                </TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums">
                  {formatCurrency(row.adminFeeValue * flexFactor)}
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {row.reserveFundPercent.toFixed(4).replace('.', ',')}%
                </TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums">
                  {formatCurrency(row.reserveFundValue * flexFactor)}
                </TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums">
                  {insuranceEnabled ? formatCurrency(row.insuranceValue * flexFactor) : '—'}
                </TableCell>
                <TableCell className="text-right text-sm font-bold text-primary tabular-nums">
                  <div>{formatCurrency(row.totalInstallment * flexFactor)}</div>
                  {isFlexPlan && (
                    <div className="text-caption font-normal text-muted-foreground mt-0.5">
                      mensal: {formatCurrency(row.totalInstallment)}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/50 border-t-2 border-primary/20">
              <TableCell className="font-semibold text-sm text-foreground">Subtotal</TableCell>
              <TableCell className="text-center text-sm font-medium text-muted-foreground">
                {((totalCommonFund / creditValue) * 100).toFixed(2).replace('.', ',')}%
              </TableCell>
              <TableCell className="text-right text-sm font-semibold tabular-nums">
                {formatCurrency(totalCommonFund)}
              </TableCell>
              <TableCell className="text-center text-sm font-medium text-muted-foreground">
                {adminFeePercent.toFixed(2).replace('.', ',')}%
              </TableCell>
              <TableCell className="text-right text-sm font-semibold tabular-nums">
                {formatCurrency(totalAdminFee)}
              </TableCell>
              <TableCell className="text-center text-sm font-medium text-muted-foreground">
                {reserveFundPercent.toFixed(2).replace('.', ',')}%
              </TableCell>
              <TableCell className="text-right text-sm font-semibold tabular-nums">
                {formatCurrency(totalReserveFund)}
              </TableCell>
              <TableCell className="text-right text-sm font-semibold tabular-nums">
                {insuranceEnabled ? formatCurrency(totalInsurance) : '—'}
              </TableCell>
              <TableCell className="text-right text-sm font-bold text-primary tabular-nums">
                —
              </TableCell>
            </TableRow>
            <TableRow className="bg-primary/10 border-t-2 border-primary/30">
              <TableCell colSpan={8} className="font-bold text-base text-foreground">
                Total Geral do Plano
              </TableCell>
              <TableCell className="text-right text-lg font-bold text-primary tabular-nums">
                {formatCurrency(grandTotal)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </ScrollAffordance>

      {/* Legenda */}
      <div className="flex flex-wrap gap-6 text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30"></div>
          <span>Fundo Comum: recursos para aquisição do bem</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-caixa-orange/20 border border-caixa-orange/30"></div>
          <span>Taxa Adm.: remuneração da administradora</span>
        </div>
        {hasAdvanceFee && advanceMonths > 0 && termMonths > advanceMonths && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-warning/20 border border-warning/30"></div>
            <span>Antecipação: {advanceRate.toFixed(4).replace('.', ',')}% nos {advanceMonths} primeiros meses, saldo diluído após</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-muted border border-muted-foreground/30"></div>
          <span>Seguro Prestamista: prêmio mensal fixo</span>
        </div>
      </div>
    </div>
  );
});
