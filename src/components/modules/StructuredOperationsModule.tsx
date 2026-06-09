import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Plus, PlayCircle } from 'lucide-react';
import { formatCurrency } from '@/core/finance';
import { getPrestamistaRate } from '@/core/finance';

import { PrintHeader } from '@/components/print/PrintHeader';
import { PrintFooter } from '@/components/print/PrintFooter';
import { PrintableParams } from '@/components/print/PrintableParams';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ResetButton } from '@/components/ui/ResetButton';
import { PdfDownloadButton } from '@/components/pdf/PdfDownloadButton';
import { PdfOperacoesEstruturadas } from '@/components/pdf/PdfOperacoesEstruturadas';
import { checkBidChartConsistency, formatBidChartIssues } from '@/components/pdf/bidChartConsistency';
import { toast } from '@/hooks/use-toast';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';

import type { CreditCard, ConsolidatedResult } from './structured-ops/structuredOpsTypes';
import { createEmptyCard, calculateCardResult, typeLabels, getMaxEmbeddedBid } from './structured-ops/structuredOpsConstants';
import { StructuredOpsTable } from './structured-ops/StructuredOpsTable';
import { StructuredOpsConsolidated } from './structured-ops/StructuredOpsConsolidated';
import { StructuredOpsCharts } from './structured-ops/StructuredOpsCharts';
import { useTrackModuleAccess } from '@/hooks/useTrackModuleAccess';
import { useStructuredOpsResults } from '@/contexts/StructuredOpsResultsContext';

const STORAGE_KEY = 'structured-ops-last-session';

/** Lê uma sessão válida do localStorage; retorna null se não houver ou estiver corrompida. */
function loadSavedCards(): CreditCard[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    // Sanidade mínima: cada item precisa ter id (string) e creditValue (number).
    const valid = parsed.every((c: unknown): c is CreditCard => {
      const item = c as { id?: unknown; creditValue?: unknown } | null;
      return !!item && typeof item.id === 'string' && typeof item.creditValue === 'number';
    });
    return valid ? (parsed as CreditCard[]) : null;
  } catch {
    return null;
  }
}

export function StructuredOperationsModule() {
  useTrackModuleAccess('structured-ops');
  const { navigateTo } = useModuleNavigation();
  // Restaura a sessão anterior ao montar (sobrevive a trocas de aba/módulo).
  const [cards, setCards] = useState<CreditCard[]>(
    () => loadSavedCards() ?? [createEmptyCard(), createEmptyCard()]
  );

  // Auto-save: persiste sempre que `cards` mudar.
  // Só grava se houver pelo menos uma carta com algum dado preenchido — evita salvar estado vazio.
  const hasMounted = useRef(false);
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    try {
      const hasContent = cards.some(c => c.creditValue > 0 || c.termMonths > 0);
      if (hasContent) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch { /* storage cheio/bloqueado — ignora silenciosamente */ }
  }, [cards]);

  const handleReset = () => {
    setCards([createEmptyCard(), createEmptyCard()]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };


  const addCard = () => {
    if (cards.length < 10) {
      const majority = cards.length > 0 && cards.filter(c => c.freeBidType === 'value').length >= cards.length / 2
        ? 'value'
        : 'percent';
      setCards([...cards, { ...createEmptyCard(), freeBidType: majority }]);
    }
  };
  const removeCard = (id: string) => { if (cards.length > 1) setCards(cards.filter(c => c.id !== id)); };
  const updateCard = <K extends keyof CreditCard>(id: string, key: K, value: CreditCard[K]) => {
    setCards(cards.map(c => {
      if (c.id !== id) return c;
      const next = { ...c, [key]: value };
      // Ao trocar o tipo, garante que embeddedBidPercent respeite o novo teto regulatório CAIXA.
      if (key === 'consortiumType') {
        const cap = getMaxEmbeddedBid(value as CreditCard['consortiumType']);
        if (next.embeddedBidPercent > cap) next.embeddedBidPercent = cap;
      }
      return next;
    }));
  };

  const updateAllCards = <K extends keyof CreditCard>(key: K, value: CreditCard[K]) => {
    setCards(cards.map(c => ({ ...c, [key]: value })));
  };

  const results = useMemo(() => cards.map(calculateCardResult), [cards]);

  const consolidated = useMemo<ConsolidatedResult>(() =>
    results.reduce((acc, r) => ({
      totalCreditValue: acc.totalCreditValue + r.totalCreditValue,
      totalInitialInstallment: acc.totalInitialInstallment + r.totalInitialInstallment,
      totalInstallmentAfterContemplation: acc.totalInstallmentAfterContemplation + r.totalInstallmentAfterContemplation,
      totalPaid: acc.totalPaid + r.totalPaid,
      totalCost: acc.totalCost + r.totalCost,
      freeBidValue: acc.freeBidValue + r.freeBidValue,
      embeddedBidValue: acc.embeddedBidValue + r.embeddedBidValue,
      totalBid: acc.totalBid + r.totalBid,
      availableCredit: acc.availableCredit + r.availableCredit,
      totalQuantity: acc.totalQuantity + r.quantity,
      adminFeeTotal: acc.adminFeeTotal + r.adminFeeTotal,
      reserveFundTotal: acc.reserveFundTotal + r.reserveFundTotal,
      insuranceTotal: acc.insuranceTotal + r.insuranceTotal,
    }), {
      totalCreditValue: 0, totalInitialInstallment: 0, totalInstallmentAfterContemplation: 0,
      totalPaid: 0, totalCost: 0, freeBidValue: 0, embeddedBidValue: 0, totalBid: 0,
      availableCredit: 0, totalQuantity: 0, adminFeeTotal: 0, reserveFundTotal: 0, insuranceTotal: 0,
    }),
  [results]);

  const effectiveRate = useMemo(() => {
    if (consolidated.totalCreditValue === 0) return 0;
    const totalFees = consolidated.adminFeeTotal + consolidated.reserveFundTotal + consolidated.insuranceTotal;
    return (totalFees / consolidated.totalCreditValue) * 100;
  }, [consolidated]);

  // Publica resultados para a Proposal/PDF lerem SEM recalcular.
  // Só publica quando há ao menos uma carta com crédito real.
  const { setResults: setStructuredOpsResults } = useStructuredOpsResults();
  useEffect(() => {
    if (consolidated.totalCreditValue > 0) {
      setStructuredOpsResults({
        consolidated,
        cards: results,
        cardsCount: cards.length,
        effectiveRate,
      });
    } else {
      setStructuredOpsResults(null);
    }
  }, [consolidated, results, cards.length, effectiveRate, setStructuredOpsResults]);

  const bidChartData = useMemo(() => {
    const totalBid = consolidated.freeBidValue + consolidated.embeddedBidValue;
    if (totalBid === 0) return [];
    return [
      { name: 'Lance Próprio', value: consolidated.freeBidValue, percent: (consolidated.freeBidValue / totalBid) * 100, color: 'var(--caixa-blue)' },
      { name: 'Lance Embutido', value: consolidated.embeddedBidValue, percent: (consolidated.embeddedBidValue / totalBid) * 100, color: 'var(--caixa-orange)' },
    ].filter(item => item.value > 0);
  }, [consolidated]);

  const costChartData = useMemo(() => {
    const costs = [
      { name: 'Valor da Carta', value: consolidated.totalCreditValue, color: 'var(--caixa-blue)' },
      { name: 'Tx. Adm.', value: consolidated.adminFeeTotal, color: 'var(--caixa-orange)' },
      { name: 'F. Reserva', value: consolidated.reserveFundTotal, color: '#4CAF50' },
    ];
    if (consolidated.insuranceTotal > 0) costs.push({ name: 'Seguro', value: consolidated.insuranceTotal, color: '#9C27B0' });
    return costs.filter(item => item.value > 0);
  }, [consolidated]);

  // Só compara parcelas quando há diferença real (caso contrário, gráfico vira ruído).
  const installmentChartData = useMemo(() => {
    const diff = Math.abs(consolidated.totalInstallmentAfterContemplation - consolidated.totalInitialInstallment);
    if (diff < 0.01) return [];
    return [
      { name: 'Parcela Inicial', value: consolidated.totalInitialInstallment, color: 'var(--caixa-blue)' },
      { name: 'Parcela Pós Contemplação', value: consolidated.totalInstallmentAfterContemplation, color: '#4CAF50' },
    ];
  }, [consolidated]);

  const printSummaryItems = [
    { label: 'Total das Cartas', value: formatCurrency(consolidated.totalCreditValue) },
    { label: 'Qtde. Cotas', value: consolidated.totalQuantity.toString() },
    { label: 'Lance Total', value: formatCurrency(consolidated.totalBid) },
    { label: 'Total a Pagar', value: formatCurrency(consolidated.totalPaid) },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div id="structured-ops-header">
        <ModuleHeader title="Operações Estruturadas" subtitle="Combine múltiplas cartas em uma estratégia patrimonial" />
      </div>

      <PrintHeader
        moduleName="Operações Estruturadas"
        summaryItems={printSummaryItems}
        conclusion={`${consolidated.totalQuantity} cota(s) simulada(s) com parcela consolidada de ${formatCurrency(consolidated.totalInstallmentAfterContemplation)}/mês`}
      />

      <PrintableParams
        title="Resumo das Cartas Simuladas"
        params={[
          { label: 'Total das Cartas', value: formatCurrency(consolidated.totalCreditValue) },
          { label: 'Qtde. Cotas', value: consolidated.totalQuantity.toString() },
          { label: 'Lance Total', value: formatCurrency(consolidated.totalBid) },
          { label: 'Total a Pagar', value: formatCurrency(consolidated.totalPaid) },
          { label: 'Parcela Inicial', value: formatCurrency(consolidated.totalInitialInstallment) },
          { label: 'Parcela Pós Contemp.', value: formatCurrency(consolidated.totalInstallmentAfterContemplation) },
          { label: 'Crédito Disponível', value: formatCurrency(consolidated.availableCredit) },
          { label: 'Taxa Efetiva', value: `${effectiveRate.toFixed(2).replace('.', ',')}%` },
        ]}
      />

      {/* Print-only: Dados de cada carta */}
      {cards.map((card, index) => {
        const actualFreeBid = card.freeBidType === 'percent'
          ? (card.creditValue * card.freeBidPercent) / 100
          : card.freeBidValue;
        return (
          <PrintableParams
            key={card.id}
            title={`Carta ${index + 1} — ${typeLabels[card.consortiumType]}`}
            params={[
              { label: 'Tipo', value: typeLabels[card.consortiumType] },
              { label: 'Qtde. Cotas', value: card.quantity.toString() },
              { label: 'Valor da Carta', value: formatCurrency(card.creditValue) },
              { label: 'Prazo', value: `${card.termMonths} meses` },
              { label: 'Taxa Admin.', value: `${card.adminFeePercent.toFixed(2).replace('.', ',')}%` },
              { label: 'Fundo Reserva', value: `${card.reserveFundPercent.toFixed(2).replace('.', ',')}%` },
              ...((card.personType ?? 'PF') === 'PJ'
                ? [{ label: 'Pessoa', value: 'Jurídica (sem prestamista)' }]
                : [
                    { label: 'Pessoa', value: 'Física' },
                    { label: 'Seguro Prestamista', value: card.insuranceEnabled ? `${(getPrestamistaRate() * 100).toFixed(4).replace('.', ',')}%/mês (sobre saldo devedor)` : 'Desabilitado' },
                  ]),
              { label: 'Lance Embutido', value: `${card.embeddedBidPercent.toFixed(0)}% (${formatCurrency((card.creditValue * card.embeddedBidPercent) / 100)})` },
              { label: 'Lance Rec. Próprios', value: formatCurrency(actualFreeBid) },
            ]}
          />
        );
      })}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print-hide px-4 sm:px-6">
        <p className="text-muted-foreground">Análise combinada de múltiplas cartas de crédito para planejamento financeiro e patrimonial</p>
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial"><ResetButton onReset={handleReset} moduleName="as Operações Estruturadas" /></div>
          
          <div className="flex-1 sm:flex-initial">
            <PdfDownloadButton
              moduleName="OperacoesEstruturadas"
              buildPdfElement={(pdfCtx) => {
                // Consistência de cor/rótulo entre tela e PDF (executa só na geração).
                const check = checkBidChartConsistency(bidChartData);
                if (!check.ok) {
                  const msg = formatBidChartIssues(check.issues);
                  console.warn('[PDF] Divergência no gráfico de Composição dos Lances:', msg);
                  if (import.meta.env.DEV) {
                    toast({
                      variant: 'destructive',
                      title: 'Divergência no gráfico de Lances',
                      description: msg,
                    });
                  }
                }
                return (
                <PdfOperacoesEstruturadas data={{
                  cards, results, consolidated, effectiveRate,
                  chartsData: {
                    lancesComposition: bidChartData,
                    custosComposition: costChartData,
                    parcelasComparison: installmentChartData,
                  },
                  managerName: pdfCtx.managerName, agencyName: pdfCtx.agencyName,
                  // Campos extras propagados via cast (PdfOperacoesEstruturadas aceita opcionais)
                  ...({
                    clientName: pdfCtx.clientName,
                    managerRole: pdfCtx.managerRole,
                    managerPhone: pdfCtx.phone,
                    managerWhatsapp: pdfCtx.whatsapp,
                    managerEmail: pdfCtx.email,
                    logoDataUrl: (pdfCtx as any).logoDataUrl,
                  } as any),
                }} />
                );
              }}
            />
          </div>
        </div>
      </div>

      <StructuredOpsTable 
        cards={cards} 
        results={results} 
        onUpdate={updateCard} 
        onUpdateAll={updateAllCards} 
        onRemove={removeCard} 
        onAdd={addCard} 
      />
      <StructuredOpsConsolidated consolidated={consolidated} effectiveRate={effectiveRate} />
      <StructuredOpsCharts bidChartData={bidChartData} costChartData={costChartData} installmentChartData={installmentChartData} />

      <p className="text-xs text-muted-foreground text-center print-hide">
        * Valores simulados considerando contemplação no 1º mês com redução de parcela.
      </p>

      {/* Continuidade consultiva — próximo passo natural após operação estruturada. */}
      <div className="print-hide rounded-xl border border-border/60 bg-muted/20 p-card-sm flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-caption font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Próximo passo
          </div>
          <p className="mt-0.5 text-caption text-foreground/85 leading-snug">
            Simular execução completa de uma das cartas no Simulador.
          </p>
        </div>
        <Button size="sm" className="shrink-0" onClick={() => navigateTo('simulator')}>
          <PlayCircle className="h-4 w-4 mr-1.5" aria-hidden />
          Abrir Simulador
        </Button>
      </div>

      <PrintFooter />
    </div>
  );
}
