/**
 * Checagem de consistência do payload "Composição dos Lances" entre tela e PDF.
 *
 * Rationale: o gráfico do PDF não recalcula valores nem cores — ele apenas
 * renderiza o que recebe. Se o payload divergir do canônico da tela
 * (BID_COLORS + nomes oficiais), a divergência só aparece no documento final.
 * Esta checagem antecipa o problema antes da geração.
 */
import { BID_COLORS } from '@/components/modules/structured-ops/structuredOpsConstants';

export interface BidChartItem {
  name: string;
  value: number;
  color?: string;
  percent?: number;
}

/** Mapa canônico nome → cor esperada (mesma da tela). */
export const CANONICAL_BID_COLOR_MAP: Record<string, string> = {
  'Lance Rec. Próprios': BID_COLORS[0], // #005CA9
  'Lance Embutido': BID_COLORS[1],      // #F39200
};

export interface BidChartConsistencyIssue {
  index: number;
  name: string;
  kind: 'unknown_label' | 'color_mismatch' | 'missing_color';
  expected?: string;
  received?: string;
}

export interface BidChartConsistencyResult {
  ok: boolean;
  issues: BidChartConsistencyIssue[];
}

/**
 * Valida que cada item do payload usa um nome canônico e a cor exata da tela.
 * Itens com value === 0 já são filtrados antes de chegar aqui (ver
 * StructuredOperationsModule.bidChartData), mas tolera lista vazia.
 */
export function checkBidChartConsistency(items: BidChartItem[]): BidChartConsistencyResult {
  const issues: BidChartConsistencyIssue[] = [];

  items.forEach((item, index) => {
    const expected = CANONICAL_BID_COLOR_MAP[item.name];

    if (!expected) {
      issues.push({ index, name: item.name, kind: 'unknown_label' });
      return;
    }

    if (!item.color) {
      issues.push({ index, name: item.name, kind: 'missing_color', expected });
      return;
    }

    if (item.color.toLowerCase() !== expected.toLowerCase()) {
      issues.push({
        index, name: item.name, kind: 'color_mismatch',
        expected, received: item.color,
      });
    }
  });

  return { ok: issues.length === 0, issues };
}

/** Formata as divergências para log/console em uma única linha legível. */
export function formatBidChartIssues(issues: BidChartConsistencyIssue[]): string {
  return issues.map(i => {
    if (i.kind === 'unknown_label') return `[${i.index}] rótulo desconhecido: "${i.name}"`;
    if (i.kind === 'missing_color') return `[${i.index}] "${i.name}" sem cor (esperada ${i.expected})`;
    return `[${i.index}] "${i.name}" cor ${i.received} ≠ esperada ${i.expected}`;
  }).join(' | ');
}
