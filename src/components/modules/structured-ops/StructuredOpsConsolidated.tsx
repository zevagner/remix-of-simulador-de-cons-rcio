import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Info } from 'lucide-react';
import { formatCurrency } from '@/core/finance';
import type { ConsolidatedResult } from './structuredOpsTypes';

interface Props {
  consolidated: ConsolidatedResult;
  effectiveRate: number;
}

interface KpiItem {
  label: string;
  value: string;
  helper?: string;
  emphasis?: 'primary' | 'secondary';
}

/**
 * Mapeia 1..6 itens visíveis em uma grid responsiva sem deixar colunas órfãs.
 * Mantém cap em 5/4/3 conforme o bloco original.
 */
const GRID_BY_COUNT: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
  5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
};

function KpiBlock({ items }: { items: KpiItem[] }) {
  if (items.length === 0) return null;
  const gridClass = GRID_BY_COUNT[items.length] ?? 'grid-cols-2 md:grid-cols-3';
  return (
    <div className={`grid ${gridClass} gap-6`}>
      {items.map((it) => (
        <div key={it.label} className="space-y-1">
          <p className="text-sm text-muted-foreground">{it.label}</p>
          <p className={it.emphasis === 'primary' ? 'text-xl font-bold text-foreground' : 'text-lg font-semibold'}>
            {it.value}
          </p>
          {it.helper && <p className="text-xs text-muted-foreground">{it.helper}</p>}
        </div>
      ))}
    </div>
  );
}

export function StructuredOpsConsolidated({ consolidated, effectiveRate }: Props) {
  const hasBid = consolidated.totalBid > 0;
  const hasFreeBid = consolidated.freeBidValue > 0;
  const hasEmbeddedBid = consolidated.embeddedBidValue > 0;
  const installmentChanges =
    Math.abs(consolidated.totalInstallmentAfterContemplation - consolidated.totalInitialInstallment) > 0.01;

  // Bloco 1 — visão executiva. "Lance Total" só aparece se houver lance;
  // "Parcela Pós Contemplação" só aparece quando difere da inicial (sem lance, é redundante).
  const headlineItems: KpiItem[] = [
    { label: 'Total das Cartas', value: formatCurrency(consolidated.totalCreditValue), emphasis: 'primary' },
    { label: 'Parcela Inicial', value: formatCurrency(consolidated.totalInitialInstallment), emphasis: 'primary' },
    ...(installmentChanges
      ? [{
          label: 'Parcela Pós Contemplação',
          value: formatCurrency(consolidated.totalInstallmentAfterContemplation),
          emphasis: 'primary' as const,
        }]
      : []),
    ...(hasBid
      ? [{ label: 'Lance Total', value: formatCurrency(consolidated.totalBid), emphasis: 'primary' as const }]
      : []),
    { label: 'Total a Pagar', value: formatCurrency(consolidated.totalPaid), emphasis: 'primary' },
  ];

  // Bloco 2 — composição do lance. Só aparece se houver algum lance.
  // "Crédito Disponível" só faz sentido se houver embutido (caso contrário = Total das Cartas).
  // "Valor Emprestado" só faz sentido se houver lance (caso contrário = Total das Cartas).
  const bidItems: KpiItem[] = hasBid
    ? [
        ...(hasFreeBid
          ? [{
              label: 'Lance Recursos Próprios',
              value: formatCurrency(consolidated.freeBidValue),
              helper:
                consolidated.totalCreditValue > 0
                  ? `${((consolidated.freeBidValue / consolidated.totalCreditValue) * 100).toFixed(0)}%`
                  : undefined,
            }]
          : []),
        ...(hasEmbeddedBid
          ? [{
              label: 'Lance Embutido',
              value: formatCurrency(consolidated.embeddedBidValue),
              helper:
                consolidated.totalCreditValue > 0
                  ? `${((consolidated.embeddedBidValue / consolidated.totalCreditValue) * 100).toFixed(0)}%`
                  : undefined,
            }]
          : []),
        ...(hasEmbeddedBid
          ? [{ label: 'Crédito Disponível', value: formatCurrency(consolidated.availableCredit) }]
          : []),
        { label: 'Valor Emprestado', value: formatCurrency(consolidated.totalCreditValue - consolidated.totalBid) },
      ]
    : [];

  // Bloco 3 — custos institucionais. Sempre relevante.
  const costsItems: KpiItem[] = [
    {
      label: 'Custo das Taxas',
      value: formatCurrency(consolidated.totalCost - (consolidated.totalCreditValue - consolidated.totalBid)),
    },
    {
      label: 'Taxa Total',
      value: `${effectiveRate.toFixed(2).replace('.', ',')}%`,
      helper: `(Tx. Admin.${consolidated.insuranceTotal > 0 ? ' + Seguro' : ''} + F. Reserva)`,
    },
    { label: 'Qtde. Total de Cotas', value: consolidated.totalQuantity.toString() },
  ];

  return (
    <Card id="structured-ops-consolidated" className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">Resultado Consolidado</CardTitle>
      </CardHeader>
      <CardContent>
        <KpiBlock items={headlineItems} />

        {bidItems.length > 0 && (
          <>
            <Separator className="my-6" />
            <KpiBlock items={bidItems} />
          </>
        )}

        <Separator className="my-6" />
        <KpiBlock items={costsItems} />

        <div className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3 w-3 shrink-0 mt-0.5" />
          <span>
            Valores nominais — sem projeção de reajuste INPC. Ative o Reajuste INPC no Simulador para ver o impacto ao longo do tempo.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

