import { createContext, useContext, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AssemblyRecord, ConsortiumType, CONSORTIUM_TYPE_LABELS } from '@/types/consortium';
import { useAssemblies } from '@/hooks/useAssemblies';
import { getUniqueGroups, parseAssemblyMonth, needsDataImport } from '@/utils/assemblyData';
import { analyzeBidHistory, estimateBidProbabilityMonteCarlo, BidAnalysisResult } from '@/utils/bidAnalysis';
import type { BidProjection } from '@/utils/bidAnalysis/projection';
import { useSelectedGroup } from '@/contexts/SelectedGroupContext';

/**
 * NOTA DE ARQUITETURA: a seleção (tipo + grupo) NÃO vive mais aqui.
 * Fonte única em `SelectedGroupContext` — compartilhada com Assembléias.
 * Este provider só lê o estado global e expõe `selectedType`/`selectedGroupNumber`
 * para os consumidores existentes (compat) + lógica derivada (analysis, studyData).
 *
 * Persistência localStorage também migrou para o context global.
 */

export interface BidStudyData {
  hasEmbeddedBid: boolean;
  embeddedBidMaxPercent: number;
  creditRange: string;
  months: string[];
  contemplations: number[];
  contemplationsBySorteio: number[];
  contemplationsByLance: number[];
  lancesOfertados: number[];
  avgContemplations: number;
  avgContemplationsBySorteio: number;
  avgContemplationsByLance: number;
  avgLancesOfertados: number;
  lanceMaximo: number[];
  lanceMedio: number[];
  lanceMinimo: number[];
  chartData: Array<{
    month: string;
    sorteio: number;
    lanceLivre: number;
    lanceMinimo: number;
    lanceMedio: number;
    lanceMaximo: number;
  }>;
  chartItems: Array<{ label: string; value: number; color: string }>;
  historyColumns: Array<{ header: string; align?: 'left' | 'right' }>;
  history: Array<Array<string | number>>;
  /** Tabela histórica pronta para o PDF — mesma orientação da tela
   *  (linhas = indicadores; colunas = meses + Média). PDF apenas itera. */
  historyTablePdf: {
    columns: Array<{ header: string; align?: 'left' | 'right' }>;
    rows: Array<Array<string>>;
  };
  avgContemplationsTotalDisplay: string;
  avgContemplationsBySorteioDisplay: string;
  avgContemplationsByLanceDisplay: string;
}

export interface BidProjectionPdfData extends BidProjection {
  tableRows: Array<Array<string | number>>;
  tableRowStyles: Array<React.CSSProperties | undefined>;
  milestoneCompetitivoDisplay: string;
  milestoneForteDisplay: string;
  currentStatusLabel: string;
  currentStatusColor: string;
  currentStatusDescription: string;
  currentGapDisplay: string;
}

export interface BidPosition {
  status: string;
  label: string;
  color: 'destructive' | 'success' | 'warning';
  description: string;
  zone: 'abaixo' | 'conservadora' | 'equilibrada' | 'agressiva';
}

interface BidsContextValue {
  assemblies: AssemblyRecord[];
  isLoading: boolean;
  selectedType: ConsortiumType;
  setSelectedType: (t: ConsortiumType) => void;
  selectedGroupNumber: string;
  setSelectedGroupNumber: (g: string) => void;
  clientBid: number;
  setClientBid: (b: number) => void;
  showImportWarning: boolean;
  availableGroups: number[];
  bidAnalysis: BidAnalysisResult | null;
  studyData: BidStudyData | null;
  projection: BidProjectionPdfData | null;
  setProjection: (projection: BidProjectionPdfData | null) => void;
  bidPosition: BidPosition | null;
  monteCarloProbability: number | null;
  handleReset: () => void;
  handleApplyBidToSimulator: (bidPercent: number, zone: 'conservadora' | 'equilibrada' | 'agressiva') => void;
  typeLabels: typeof CONSORTIUM_TYPE_LABELS;
  onApplyBidToSimulator?: BidsProviderProps['onApplyBidToSimulator'];
}

interface BidsProviderProps {
  onApplyBidToSimulator?: (bidData: {
    bidPercent: number;
    zone: 'conservadora' | 'equilibrada' | 'agressiva';
    hasEmbeddedBid: boolean;
    embeddedBidMaxPercent: number;
    groupNumber: number;
    creditRange: string;
  }) => void;
  children: React.ReactNode;
}

const BidsContext = createContext<BidsContextValue | null>(null);

// Stable reference
const TYPE_LABELS = CONSORTIUM_TYPE_LABELS;

export function useBidsContext() {
  const ctx = useContext(BidsContext);
  if (!ctx) throw new Error('useBidsContext must be used within BidsProvider');
  return ctx;
}

export function BidsProvider({ onApplyBidToSimulator, children }: BidsProviderProps) {
  const { assemblies, isLoading } = useAssemblies();

  // Fonte única de seleção (compartilhada com Assembléias).
  const { selectedGroup, setSelectedType, setSelectedGroupNumber } = useSelectedGroup();
  const selectedType = selectedGroup.type;
  const selectedGroupNumber = selectedGroup.groupNumber;

  const [clientBid, setClientBid] = useState(0);
  const [projection, setProjection] = useState<BidProjectionPdfData | null>(null);

  // Pick up pre-selection from Assemblies module (sobrescreve a persistência quando vem do fluxo "Analisar grupo").
  useEffect(() => {
    const raw = sessionStorage.getItem('bids-preselect');
    if (!raw) return;
    try {
      const { type, group } = JSON.parse(raw) as { type: ConsortiumType; group: string };
      sessionStorage.removeItem('bids-preselect');
      if (type) setSelectedType(type);
      if (group) {
        // Delay to let availableGroups recalculate after type change
        setTimeout(() => setSelectedGroupNumber(group), 50);
      }
    } catch { /* ignore */ }
  }, [setSelectedType, setSelectedGroupNumber]);

  const handleReset = useCallback(() => {
    setSelectedType('imobiliario');
    setSelectedGroupNumber('');
    setClientBid(0);
  }, [setSelectedType, setSelectedGroupNumber]);


  const showImportWarning = useMemo(() => needsDataImport(assemblies), [assemblies]);
  const availableGroups = useMemo(() => getUniqueGroups(assemblies, selectedType), [assemblies, selectedType]);

  const groupRecords = useMemo(() => {
    if (!selectedGroupNumber) return [];
    const groupNum = parseInt(selectedGroupNumber, 10);
    return assemblies.filter(a => a.consortiumType === selectedType && a.groupNumber === groupNum);
  }, [assemblies, selectedType, selectedGroupNumber]);

  const bidAnalysis = useMemo((): BidAnalysisResult | null => {
    if (groupRecords.length === 0) return null;
    return analyzeBidHistory(groupRecords);
  }, [groupRecords]);

  const studyData = useMemo((): BidStudyData | null => {
    if (!selectedGroupNumber || groupRecords.length === 0) return null;

    const sortedRecords = [...groupRecords].sort((a, b) =>
      parseAssemblyMonth(a.assemblyMonth).getTime() - parseAssemblyMonth(b.assemblyMonth).getTime()
    );

    const allMonths = [...new Set(sortedRecords.map(r => r.assemblyMonth))];
    const selectedMonths = allMonths.slice(-6);
    if (selectedMonths.length === 0) return null;

    const latestRecord = sortedRecords[sortedRecords.length - 1];

    const monthlyData = selectedMonths.map(month => ({
      month,
      record: sortedRecords.find(r => r.assemblyMonth === month),
    }));

    const contemplations: number[] = [];
    const contemplationsBySorteio: number[] = [];
    const contemplationsByLance: number[] = [];
    const lancesOfertados: number[] = [];
    const lanceMaximo: number[] = [];
    const lanceMedio: number[] = [];
    const lanceMinimo: number[] = [];

    for (const { record } of monthlyData) {
      if (record) {
        contemplations.push(record.totalContemplations || 0);
        contemplationsBySorteio.push(record.contemplationsBySorteio || 0);
        contemplationsByLance.push((record.contemplationsByLanceLivre || 0) + (record.contemplationsByLanceFixo || 0));
        lancesOfertados.push((record.lanceLivre || 0) + (record.lanceFixo || 0));
        lanceMaximo.push(record.maxBidLastAssembly || record.maxBidPercentage || 0);
        lanceMedio.push(record.avgBid3Months || record.avgBidPercentage || 0);
        lanceMinimo.push(record.minBidLastAssembly || record.minBidPercentage || 0);
      } else {
        contemplations.push(0);
        contemplationsBySorteio.push(0);
        contemplationsByLance.push(0);
        lancesOfertados.push(0);
        lanceMaximo.push(0);
        lanceMedio.push(0);
        lanceMinimo.push(0);
      }
    }

    const avg = (arr: number[]) => {
      const valid = arr.filter(v => v > 0);
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
    };

    const chartData = monthlyData.map(({ month, record }) => ({
      month,
      sorteio: record?.contemplationsBySorteio || 0,
      lanceLivre: (record?.contemplationsByLanceLivre || 0) + (record?.contemplationsByLanceFixo || 0),
      lanceMinimo: record?.minBidLastAssembly || record?.minBidPercentage || 0,
      lanceMedio: record?.avgBid3Months || record?.avgBidPercentage || 0,
      lanceMaximo: record?.maxBidLastAssembly || record?.maxBidPercentage || 0,
    }));

    const chartItems = chartData.map((row) => ({ label: row.month, value: row.lanceMedio, color: '#0066B3' }));
    const historyColumns: BidStudyData['historyColumns'] = [
      { header: 'Mês' },
      { header: 'Sorteio', align: 'right' },
      { header: 'Lance', align: 'right' },
      { header: 'Lance Mín.', align: 'right' },
      { header: 'Lance Méd.', align: 'right' },
      { header: 'Lance Máx.', align: 'right' },
    ];
    const history = chartData.map((row) => [
      row.month,
      row.sorteio,
      row.lanceLivre,
      `${row.lanceMinimo.toFixed(2).replace('.', ',')}%`,
      `${row.lanceMedio.toFixed(2).replace('.', ',')}%`,
      `${row.lanceMaximo.toFixed(2).replace('.', ',')}%`,
    ]);
    const avgContemplationsBySorteio = avg(contemplationsBySorteio);
    const avgContemplationsByLance = avg(contemplationsByLance);

    // Tabela histórica para o PDF — mesma orientação da tela (BidsHistoryTable)
    const fmtPct = (v: number) => (v > 0 ? `${v.toFixed(2).replace('.', ',')}%` : '-');
    const fmtInt = (v: number) => (v > 0 ? String(v) : '-');
    const totalsByMonth = contemplationsBySorteio.map((s, i) => s + (contemplationsByLance[i] || 0));
    const historyTablePdf = {
      columns: [
        { header: 'Indicador' as string },
        ...selectedMonths.map((m) => ({ header: m, align: 'right' as const })),
        { header: 'Média', align: 'right' as const },
      ],
      rows: [
        ['Contemplações Totais no Mês', ...totalsByMonth.map(fmtInt), (avgContemplationsBySorteio + avgContemplationsByLance).toFixed(1)],
        ['↳ por Sorteio', ...contemplationsBySorteio.map(fmtInt), avgContemplationsBySorteio.toFixed(1)],
        ['↳ por Lance', ...contemplationsByLance.map(fmtInt), avgContemplationsByLance.toFixed(1)],
        ['Lance Máximo', ...lanceMaximo.map(fmtPct), '—'],
        ['Lance Médio (3 Últimas)', ...lanceMedio.map(fmtPct), '—'],
        ['Lance Mínimo', ...lanceMinimo.map(fmtPct), '—'],
      ],
    };

    return {
      hasEmbeddedBid: latestRecord.hasEmbeddedBid,
      embeddedBidMaxPercent: latestRecord.embeddedBidMaxPercent || 0,
      creditRange: latestRecord.creditRange,
      months: selectedMonths,
      contemplations,
      contemplationsBySorteio,
      contemplationsByLance,
      lancesOfertados,
      avgContemplations: avg(contemplations),
      avgContemplationsBySorteio,
      avgContemplationsByLance,
      avgLancesOfertados: avg(lancesOfertados),
      lanceMaximo,
      lanceMedio,
      lanceMinimo,
      chartData,
      chartItems,
      historyColumns,
      history,
      historyTablePdf,
      avgContemplationsTotalDisplay: (avgContemplationsBySorteio + avgContemplationsByLance).toFixed(1),
      avgContemplationsBySorteioDisplay: avgContemplationsBySorteio.toFixed(1),
      avgContemplationsByLanceDisplay: avgContemplationsByLance.toFixed(1),
    };
  }, [groupRecords, selectedGroupNumber]);

  // Memoize bidPosition instead of computing via function call
  const bidPosition = useMemo((): BidPosition | null => {
    if (!bidAnalysis || clientBid === 0) return null;
    const { stats, zones } = bidAnalysis;

    if (clientBid < stats.minOfMinBids) {
      return { status: 'below', label: 'Abaixo da faixa histórica', color: 'destructive', description: 'Com base nos dados analisados, este lance está abaixo do menor lance contemplado nas últimas assembleias. Probabilidade histórica reduzida.', zone: 'abaixo' };
    } else if (clientBid >= zones.conservadora.minBid) {
      return { status: 'conservadora', label: 'Alta Segurança', color: 'success', description: `Com base nos dados analisados, lance competitivo que teria sido contemplado em ${zones.conservadora.confidence}. Probabilidade histórica elevada.`, zone: 'conservadora' };
    } else if (clientBid >= zones.equilibrada.minBid) {
      return { status: 'equilibrada', label: 'Equilíbrio', color: 'warning', description: `Com base nos dados analisados, lance na faixa média que teria sido contemplado em ${zones.equilibrada.confidence}. Probabilidade histórica moderada.`, zone: 'equilibrada' };
    } else if (clientBid >= zones.agressiva.minBid) {
      return { status: 'agressiva', label: 'Menor Desembolso', color: 'destructive', description: `Com base nos dados analisados, lance próximo ao mínimo histórico. Contemplação histórica em ${zones.agressiva.confidence}. Risco elevado.`, zone: 'agressiva' };
    }
    return { status: 'below', label: 'Abaixo do mínimo histórico', color: 'destructive', description: 'Com base nos dados analisados, este lance está abaixo do menor lance contemplado. Probabilidade histórica muito baixa.', zone: 'abaixo' };
  }, [bidAnalysis, clientBid]);

  // Monte Carlo with debounce
  const [monteCarloProbability, setMonteCarloProbability] = useState<number | null>(null);
  const monteCarloTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!bidAnalysis || clientBid <= 0) {
      setMonteCarloProbability(null);
      return;
    }
    if (monteCarloTimerRef.current) clearTimeout(monteCarloTimerRef.current);
    monteCarloTimerRef.current = setTimeout(() => {
      setMonteCarloProbability(estimateBidProbabilityMonteCarlo(clientBid, bidAnalysis.minBids, 10000, bidAnalysis.stats.stdDev));
    }, 300);
    return () => { if (monteCarloTimerRef.current) clearTimeout(monteCarloTimerRef.current); };
  }, [bidAnalysis, clientBid]);

  const handleApplyBidToSimulator = useCallback((bidPercent: number, zone: 'conservadora' | 'equilibrada' | 'agressiva') => {
    if (!studyData || !onApplyBidToSimulator) return;
    onApplyBidToSimulator({
      bidPercent,
      zone,
      hasEmbeddedBid: studyData.hasEmbeddedBid,
      embeddedBidMaxPercent: studyData.embeddedBidMaxPercent,
      groupNumber: parseInt(selectedGroupNumber, 10),
      creditRange: studyData.creditRange,
    });
  }, [studyData, onApplyBidToSimulator, selectedGroupNumber]);

  // Memoize context value to prevent consumer re-renders when nothing changed
  const value = useMemo<BidsContextValue>(() => ({
    assemblies,
    isLoading,
    selectedType, setSelectedType,
    selectedGroupNumber, setSelectedGroupNumber,
    clientBid, setClientBid,
    showImportWarning,
    availableGroups,
    bidAnalysis,
    studyData,
    projection,
    setProjection,
    bidPosition,
    monteCarloProbability,
    handleReset,
    handleApplyBidToSimulator,
    typeLabels: TYPE_LABELS,
    onApplyBidToSimulator,
  }), [
    assemblies, isLoading, selectedType, selectedGroupNumber, clientBid,
    showImportWarning, availableGroups, bidAnalysis, studyData, projection,
    bidPosition, monteCarloProbability,
    handleReset, handleApplyBidToSimulator, onApplyBidToSimulator,
  ]);

  return <BidsContext.Provider value={value}>{children}</BidsContext.Provider>;
}
