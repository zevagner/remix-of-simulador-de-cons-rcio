import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clock, Shield, User, MoveHorizontal } from 'lucide-react';
import { HelpTooltip } from '@/components/shared/HelpTooltip';
import { useScrollHint } from '@/hooks/useScrollHint';
import { useBidsContext } from './BidsContext';
import { useSimulatorContextSafe } from '../simulator/SimulatorContext';
import {
  type ScenarioType,
  type AdvantageStatus,
  
  type MonthProjection,
  type ScenarioResult,
  type GroupStats,
  type BidProjection,
  computeGroupStatsFromAnalysis,
  computeScenarios,
  computeScenariosFromZones,
  resolveActiveLance,
  calculateBidProjection,
  getAdvantageStatus,
  getStatusConfig,
  
  buildStrategySummary,
} from '@/utils/bidAnalysis/projection';

// ─── Static UI config ────────────────────────────────────────────────────────

interface ScenarioConfig {
  label: string;
  emoji: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
  subtitle: string;
}

const SCENARIO_CONFIG: Record<Exclude<ScenarioType, 'cliente'>, ScenarioConfig> = {
  conservador: {
    label: 'Lance mínimo histórico',
    emoji: '🛡️',
    bgClass: 'bg-card',
    borderClass: 'border-border',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    subtitle: 'Menor esforço, menor chance',
  },
  competitivo: {
    label: 'Na média do grupo',
    emoji: '⚔️',
    bgClass: 'bg-card',
    borderClass: 'border-border',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    subtitle: 'Equilíbrio entre valor e chance',
  },
  agressivo: {
    label: 'Acima da média',
    emoji: '🎯',
    bgClass: 'bg-card',
    borderClass: 'border-border',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    subtitle: 'Maior esforço, maior chance',
  },
};

// Status label/arrow override for the scenario cards (visual-only, does not change engine logic).
function getStatusDisplay(status: AdvantageStatus): { label: string; arrow: string; chance: string; chanceClass: string } {
  switch (status) {
    case 'abaixo':
      return { label: 'Abaixo da média do grupo', arrow: '⬇️', chance: 'Chance estimada: baixa', chanceClass: 'text-red-600 dark:text-red-400' };
    case 'competitivo':
      return { label: 'Na média do grupo', arrow: '✔', chance: 'Chance estimada: média', chanceClass: 'text-amber-600 dark:text-amber-400' };
    case 'forte':
      return { label: 'Acima da média do grupo', arrow: '⬆️', chance: 'Chance estimada: alta', chanceClass: 'text-emerald-600 dark:text-emerald-400' };
  }
}

const STATUS_PDF_META: Record<AdvantageStatus, { label: string; color: string; description: string }> = {
  abaixo: {
    label: 'Abaixo do competitivo',
    color: '#dc2626',
    description: 'Lance abaixo da faixa de entrada — chance reduzida.',
  },
  competitivo: {
    label: 'Competitivo',
    color: '#d97706',
    description: 'Lance na faixa média — boa chance histórica de contemplação.',
  },
  forte: {
    label: 'Forte',
    color: '#16a34a',
    description: 'Lance na faixa alta — alta probabilidade histórica de contemplação.',
  },
};

// ─── Sub-components (render-only) ────────────────────────────────────────────

function ScenarioCard({
  type,
  lanceLivre,
  valorReais,
  avgBid,
  strongThreshold,
  isActive,
  onClick,
}: {
  type: Exclude<ScenarioType, 'cliente'>;
  lanceLivre: number;
  valorReais: number | null;
  avgBid: number;
  strongThreshold: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const cfg = SCENARIO_CONFIG[type];
  const vantagem = lanceLivre - avgBid;
  const status = getAdvantageStatus(vantagem, strongThreshold);
  const statusCfg = getStatusConfig(status);

  return (
    <button
      onClick={onClick}
      className={`rounded-lg border-2 p-card-sm text-left transition-[colors,box-shadow,transform] w-full ${
        isActive
          ? `${cfg.bgClass} ${cfg.borderClass} ring-2 ring-primary/20`
          : 'bg-card border-muted hover:border-muted-foreground/30'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg">{cfg.emoji}</span>
        <Badge className={isActive ? cfg.badgeClass : 'bg-muted text-muted-foreground'}>
          {cfg.label}
        </Badge>
      </div>
      <p className="text-3xl sm:text-2xl font-semibold tracking-tight leading-none">{lanceLivre.toFixed(1)}%</p>
      {valorReais !== null && (
        <p className="text-sm text-muted-foreground mt-1">
          R$ {valorReais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      )}
      <p className={`text-xs font-semibold mt-2 ${statusCfg.className} flex items-center gap-1`}>
        <span aria-hidden>{getStatusDisplay(status).arrow}</span>
        <span>{getStatusDisplay(status).label}</span>
      </p>
      <p className="text-caption text-muted-foreground/75 mt-1">
        {type === 'conservador' && `Média − ${Math.abs(lanceLivre - avgBid).toFixed(1)}pp`}
        {type === 'competitivo' && 'Igual à média do grupo'}
        {type === 'agressivo' && `Média + ${Math.abs(lanceLivre - avgBid).toFixed(1)}pp`}
      </p>
      <p className={`text-caption font-medium mt-0.5 ${getStatusDisplay(status).chanceClass}`}>
        {getStatusDisplay(status).chance}
      </p>
      <p className="text-caption text-muted-foreground/70 italic mt-0.5">
        {cfg.subtitle}
      </p>
    </button>
  );
}

function ClientBidCard({
  clientBid,
  onClientBidChange,
  valorReais,
  avgBid,
  minBid,
  maxBid,
  strongThreshold,
  isActive,
  onClick,
  recommendation,
}: {
  clientBid: string;
  onClientBidChange: (value: string) => void;
  valorReais: number | null;
  avgBid: number;
  minBid: number;
  maxBid: number;
  strongThreshold: number;
  isActive: boolean;
  onClick: () => void;
  recommendation?: { minRef: number; maxRef: number; suggested: number } | null;
}) {
  const parsedBid = parseFloat(clientBid);
  const hasValue = !isNaN(parsedBid) && parsedBid > 0;
  const vantagem = hasValue ? parsedBid - avgBid : 0;
  const status = hasValue ? getAdvantageStatus(vantagem, strongThreshold) : null;
  const statusCfg = status ? getStatusConfig(status) : null;
  const display = status ? getStatusDisplay(status) : null;

  // Pontos percentuais formatados
  const ppText = hasValue
    ? Math.abs(vantagem) < 0.05
      ? '0,0 pp na média'
      : `${vantagem > 0 ? '+' : '−'}${Math.abs(vantagem).toFixed(1).replace('.', ',')} pp ${vantagem > 0 ? 'acima' : 'abaixo'} da média`
    : '';
  const ppClass = !hasValue
    ? 'text-muted-foreground'
    : Math.abs(vantagem) < 0.05
      ? 'text-amber-600 dark:text-amber-400'
      : vantagem > 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-red-600 dark:text-red-400';

  // Posição na régua (mín → máx) — visual only
  const rangeMin = Math.min(minBid, parsedBid || minBid);
  const rangeMax = Math.max(maxBid, parsedBid || maxBid, avgBid);
  const range = Math.max(rangeMax - rangeMin, 0.0001);
  const posPct = (v: number) => Math.max(0, Math.min(100, ((v - rangeMin) / range) * 100));

  const consequence: Record<AdvantageStatus, string> = {
    abaixo: 'Abaixo da média (menor chance de contemplação)',
    competitivo: 'Na média (equilíbrio entre valor e chance)',
    forte: 'Acima da média (maior chance de contemplação)',
  };

  const bgClass = 'bg-card';
  const borderClass = 'border-[#F5821F]/40';
  const badgeClass = 'bg-[#F5821F] text-white hover:bg-[#F5821F]/90';

  return (
    <div id="sim-client-bid"
      onClick={() => { if (hasValue) onClick(); }}
      className={`relative rounded-xl border-2 p-card-sm sm:p-6 text-left transition-[colors,box-shadow,transform] w-full shadow-sm ${
        isActive && hasValue
          ? `${bgClass} ${borderClass} ring-2 ring-primary/30 shadow-md`
          : hasValue
            ? `${bgClass} ${borderClass} hover:shadow-md cursor-pointer`
            : 'bg-card border-dashed border-[#F5821F]/30 opacity-95'
      } ${hasValue ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F5821F] text-white text-caption font-semibold shadow-sm">
        ⭐ Seu lance
      </span>

      <div className="flex items-center justify-between mb-3 mt-1">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-[#F5821F]" />
          <span className="text-base font-bold text-foreground">Seu lance</span>
        </div>
        <Badge className="bg-[#F5821F] text-white hover:bg-[#F5821F]/90">
          Personalizado
        </Badge>
      </div>

      <div className="mb-2" onClick={(e) => e.stopPropagation()}>
        <Input
          type="text"
          inputMode="decimal"
          placeholder="Ex: 30"
          value={clientBid}
          onChange={(e) => onClientBidChange(e.target.value)}
          className="h-12 text-2xl font-semibold w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          min={0}
          max={100}
          step={0.1}
        />
        <p className="text-caption text-muted-foreground mt-1">% do lance livre</p>
      </div>

      {hasValue && valorReais !== null && (
        <p className="text-sm font-semibold text-foreground mb-2">
          R$ {valorReais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      )}

      {/* Status com consequência */}
      {hasValue && status && statusCfg && display && (
        <p className={`text-sm font-semibold mt-1 ${statusCfg.className} flex items-start gap-1.5`}>
          <span aria-hidden>{display.arrow}</span>
          <span>{consequence[status]}</span>
        </p>
      )}

      {/* Comparação direta: seu lance vs média + diferença em pp */}
      {hasValue && (
        <div className="mt-3 rounded-lg bg-background/70 dark:bg-background/40 border border-border/50 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Seu lance:</span>
            <span className="font-bold text-foreground">{parsedBid.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-muted-foreground">Média do grupo:</span>
            <span className="font-bold text-foreground">{avgBid.toFixed(1)}%</span>
          </div>
          <div className={`flex items-center justify-end text-xs font-semibold mt-1.5 pt-1.5 border-t border-border/40 ${ppClass}`}>
            {ppText}
          </div>

          {/* Barra de posição: mín — seu lance — média — máx */}
          {range > 0.0001 && (
            <div className="mt-3">
              <div className="relative h-2 rounded-full bg-muted overflow-visible">
                {/* marca da média */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 bg-amber-500"
                  style={{ left: `${posPct(avgBid)}%` }}
                  aria-label="Média do grupo"
                />
                {/* marca do lance do cliente */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-[#F5821F] border-2 border-background shadow"
                  style={{ left: `calc(${posPct(parsedBid)}% - 8px)` }}
                  aria-label="Seu lance"
                />
              </div>
              <div className="flex justify-between text-micro text-muted-foreground mt-1">
                <span>mín {minBid.toFixed(1)}%</span>
                <span>máx {maxBid.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chance estimada */}
      {hasValue && display && (
        <p className={`text-xs font-semibold mt-2 ${display.chanceClass}`}>
          {display.chance}
        </p>
      )}

      {/* Recomendação do sistema (fonte única de verdade) */}
      {hasValue && recommendation && (() => {
        const { minRef, maxRef, suggested } = recommendation;
        const dentroFaixa = parsedBid >= minRef - 1e-9 && parsedBid <= maxRef + 1e-9;
        const gap = dentroFaixa ? 0 : parsedBid < minRef ? minRef - parsedBid : parsedBid - maxRef;
        const gapBelow = !dentroFaixa && parsedBid < minRef;
        return (
          <div className="mt-3 rounded-lg border-2 border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span aria-hidden>💡</span>
              <span className="text-xs font-bold text-primary uppercase tracking-wide">Recomendação do sistema</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Faixa ideal:</span>
              <span className="font-bold text-foreground">
                {minRef.toFixed(1).replace('.', ',')}% a {maxRef.toFixed(1).replace('.', ',')}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-muted-foreground">Sugestão:</span>
              <span className="font-bold text-primary">~{suggested.toFixed(1).replace('.', ',')}%</span>
            </div>
            <div className={`mt-2 pt-2 border-t border-primary/20 text-xs font-semibold flex items-start gap-1.5 ${
              dentroFaixa ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {dentroFaixa ? (
                <>
                  <span aria-hidden>✅</span>
                  <span>Você está dentro da faixa ideal</span>
                </>
              ) : (
                <>
                  <span aria-hidden>{gapBelow ? '⬆️' : '⬇️'}</span>
                  <span>
                    {gapBelow ? 'Faltam' : 'Excedeu em'} {gap.toFixed(1).replace('.', ',')} pp para {gapBelow ? 'entrar na' : 'voltar à'} faixa ideal
                  </span>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {!hasValue && (
        <p className="text-xs text-muted-foreground mt-1 italic">
          Digite o lance para ativar
        </p>
      )}
    </div>
  );
}

function ProjectionTable({ projections, milestoneCompetitivo, milestoneForte, recommendationText }: {
  projections: MonthProjection[];
  milestoneCompetitivo: number | null;
  milestoneForte: number | null;
  recommendationText: string;
}) {
  // Complemento técnico (posição temporal do lance ativo selecionado)
  const milestoneSummary = buildStrategySummary(milestoneCompetitivo, milestoneForte);

  const { containerRef: projContainerRef, labelRef: projLabelRef } = useScrollHint<HTMLDivElement, HTMLParagraphElement>();

  return (
    <Card id="sim-projection-table">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Quando seu lance pode contemplar
          <HelpTooltip
            title="Quando seu lance pode contemplar"
            content="Projeta os próximos 12 meses comparando seu lance fixo com o lance necessário estimado para o grupo. O lance necessário diminui ao longo do tempo à medida que participantes são contemplados e a competição reduz."
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Veja em quais meses seu lance passa a ser suficiente para contemplação, com base na dinâmica do grupo.
        </p>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-card-sm">
          <p className="text-xs font-semibold text-primary mb-1">📋 Resumo da estratégia</p>
          <p className="text-sm">{recommendationText}</p>
          <p className="text-xs text-muted-foreground mt-2">{milestoneSummary}</p>
        </div>


        <p ref={projLabelRef} className="scroll-hint-label md:hidden text-caption text-muted-foreground flex items-center justify-center gap-1.5 -mb-2">
          <MoveHorizontal className="h-3.5 w-3.5" aria-hidden />
          <span>arraste para ver mais</span>
        </p>
        <div ref={projContainerRef} className="overflow-x-auto rounded-lg border scroll-hint">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-1.5 sm:p-2 text-xs font-medium text-muted-foreground sticky left-0 bg-muted/50 z-10">Mês</th>
                <th className="text-center p-1.5 sm:p-2 text-xs font-medium text-muted-foreground">Seu lance</th>
                <th className="text-center p-1.5 sm:p-2 text-xs font-medium text-muted-foreground">Necessário</th>
                <th className="text-center p-1.5 sm:p-2 text-xs font-medium text-muted-foreground">Vantagem</th>
                <th className="text-center p-1.5 sm:p-2 text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {projections.map(p => {
                const isComp = milestoneCompetitivo === p.month;
                const isForte = milestoneForte === p.month;
                const statusCfg = getStatusConfig(p.status);
                return (
                  <tr
                    key={p.month}
                    className={`border-t ${
                      isForte ? 'bg-emerald-50/50 dark:bg-emerald-950/20' :
                      isComp ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    <td className={`p-1.5 sm:p-2 font-medium sticky left-0 z-10 ${
                      isForte ? 'bg-emerald-50/95 dark:bg-emerald-950/40' :
                      isComp ? 'bg-amber-50/95 dark:bg-amber-950/40' : 'bg-card'
                    }`}>
                      {p.month}
                      {isComp && <Badge className="ml-1 text-micro bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">★</Badge>}
                      {isForte && <Badge className="ml-1 text-micro bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">★★</Badge>}
                    </td>
                    <td className="p-1.5 sm:p-2 text-center whitespace-nowrap">{p.lanceCliente.toFixed(1)}%</td>
                    <td className="p-1.5 sm:p-2 text-center whitespace-nowrap">{p.lanceNecessario.toFixed(1)}%</td>
                    <td className="p-1.5 sm:p-2 text-center font-semibold whitespace-nowrap">
                      {p.vantagem >= 0 ? '+' : ''}{p.vantagem.toFixed(1)}%
                    </td>
                    <td className={`p-1.5 sm:p-2 text-center text-xs font-semibold whitespace-nowrap ${statusCfg.className}`}>
                      {statusCfg.emoji} {statusCfg.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div id="sim-position-index" className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-3">
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-card-sm text-center">
            <p className="text-xs text-muted-foreground mb-1">★ Competitivo</p>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
              {milestoneCompetitivo ? `Mês ${milestoneCompetitivo}` : '> 12 meses'}
            </p>
            <p className="text-caption text-muted-foreground mt-1">Seu lance alcança o necessário do grupo</p>
          </div>
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-card-sm text-center">
            <p className="text-xs text-muted-foreground mb-1">★★ Forte</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
              {milestoneForte ? `Mês ${milestoneForte}` : '> 12 meses'}
            </p>
            <p className="text-caption text-muted-foreground mt-1">Seu lance supera o necessário com margem</p>
          </div>
        </div>

        <p className="text-caption text-muted-foreground italic text-center">
          Projeção baseada no histórico do grupo. O lance necessário diminui conforme participantes são contemplados. Não garante contemplação.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Main Tab Component ──────────────────────────────────────────────────────

export function BidsSimulationTab() {
  const { studyData, bidAnalysis, assemblies, selectedType, selectedGroupNumber, setClientBid: ctxSetClientBidRaw, setProjection: setCtxProjection } = useBidsContext();
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('cliente');
  const [clientBid, setClientBid] = useState('');
  const [isUserEdited, setIsUserEdited] = useState(false);

  const simCtx = useSimulatorContextSafe();
  const creditValue = simCtx?.input?.creditValue && simCtx.input.creditValue > 0 ? simCtx.input.creditValue : null;

  const groupRecords = useMemo(() => {
    if (!selectedGroupNumber) return [];
    const groupNum = parseInt(selectedGroupNumber, 10);
    return assemblies.filter(a => a.consortiumType === selectedType && a.groupNumber === groupNum);
  }, [assemblies, selectedType, selectedGroupNumber]);

  const latestRecord = useMemo(() => {
    if (groupRecords.length === 0) return null;
    return groupRecords.reduce((latest, curr) =>
      new Date(curr.assemblyDate).getTime() > new Date(latest.assemblyDate).getTime() ? curr : latest
    );
  }, [groupRecords]);

  // Core: compute GroupStats via engine
  const groupStats = useMemo((): GroupStats | null => {
    if (!studyData || !bidAnalysis || !latestRecord) return null;
    return computeGroupStatsFromAnalysis(bidAnalysis);
  }, [studyData, bidAnalysis, latestRecord]);

  // Auto-populate clientBid with avgBid when group changes (unless user edited)
  useEffect(() => {
    if (!groupStats) return;
    if (!isUserEdited) {
      setClientBid(groupStats.avgBid.toFixed(1));
      setSelectedScenario('cliente');
    }
  }, [groupStats?.avgBid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset isUserEdited when group changes
  useEffect(() => {
    setIsUserEdited(false);
  }, [selectedGroupNumber]);

  // Scenarios via engine — prefer zones (single source of truth from bidAnalysis),
  // fallback to legacy avgBid ± offset model when zones are unavailable.
  const scenarios = useMemo((): ScenarioResult[] | null => {
    if (!groupStats) return null;
    if (bidAnalysis?.zones) {
      return computeScenariosFromZones(bidAnalysis.zones, creditValue);
    }
    return computeScenarios(groupStats.avgBid, groupStats.scenarioOffset, creditValue);
  }, [groupStats, bidAnalysis, creditValue]);

  // Active lance via engine
  const activeLance = useMemo((): number | null => {
    if (!scenarios) return null;
    return resolveActiveLance(selectedScenario, scenarios, clientBid);
  }, [scenarios, selectedScenario, clientBid]);

  // Projection via engine
  const projection = useMemo((): BidProjection | null => {
    if (!groupStats || activeLance === null) return null;
    return calculateBidProjection(activeLance, groupStats);
  }, [groupStats, activeLance]);

  // ─── Fonte única: propaga activeLance da tela para o BidsContext.
  // PDF lê ctx.clientBid e gera a mesma projection sem fallback.
  useEffect(() => {
    if (activeLance !== null && activeLance > 0) {
      ctxSetClientBidRaw(activeLance);
    } else {
      ctxSetClientBidRaw(0);
    }
  }, [activeLance, ctxSetClientBidRaw]);

  useEffect(() => {
    if (!projection) {
      setCtxProjection(null);
      return;
    }

    const currentStatus = projection.months[0]?.status;
    const statusMeta = currentStatus ? STATUS_PDF_META[currentStatus] : null;

    setCtxProjection({
      ...projection,
      tableRows: projection.months.map((p) => [
        `Mês ${p.month}`,
        `${p.lanceCliente.toFixed(1)}%`,
        `${p.lanceNecessario.toFixed(1)}%`,
        `${p.vantagem >= 0 ? '+' : ''}${p.vantagem.toFixed(1)}%`,
        getStatusConfig(p.status).label,
      ]),
      tableRowStyles: projection.months.map((p) => {
        if (projection.milestoneForte === p.month) return { background: '#ECFDF5' };
        if (projection.milestoneCompetitivo === p.month) return { background: '#FEF3C7' };
        return undefined;
      }),
      milestoneCompetitivoDisplay: projection.milestoneCompetitivo ? `Mês ${projection.milestoneCompetitivo}` : '> 12 meses',
      milestoneForteDisplay: projection.milestoneForte ? `Mês ${projection.milestoneForte}` : '> 12 meses',
      currentStatusLabel: statusMeta?.label || '',
      currentStatusColor: statusMeta?.color || '',
      currentStatusDescription: statusMeta?.description || '',
      currentGapDisplay: projection.months[0]
        ? `${projection.months[0].vantagem >= 0 ? '+' : ''}${projection.months[0].vantagem.toFixed(2).replace('.', ',')} pp`
        : '',
    });
  }, [projection, setCtxProjection]);


  // Client bid derived values
  const clientBidParsed = parseFloat(clientBid);
  const clientHasValue = !isNaN(clientBidParsed) && clientBidParsed > 0;
  const clientValorReais = clientHasValue && creditValue ? (clientBidParsed / 100) * creditValue : null;

  if (!studyData || !bidAnalysis || !groupStats || !scenarios) return null;

  return (
    <div className="space-y-6">
      {/* Section 1 — Scenario Configuration */}
      <Card id="sim-scenario-config">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <CardTitle className="text-base flex items-center gap-2 flex-1 min-w-0">
              <Shield className="h-4 w-4 shrink-0" />
              <span className="break-words">Escolha o lance que deseja simular</span>
              <HelpTooltip title="Configuração do Cenário" content="Escolha entre 3 estratégias de lance: Abaixo da média (−3%), Na média do grupo (equilíbrio) ou Acima da média (+3%). Ou use o card 'Lance do Cliente' para informar um valor personalizado. O sistema recalcula toda a projeção mês a mês com base no cenário escolhido." />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Lance do cliente — destacado em primeiro, com média e recomendação integradas */}
          <div className="mb-4">
            <ClientBidCard
              clientBid={clientBid}
              onClientBidChange={(val) => {
                setClientBid(val);
                setIsUserEdited(true);
                const parsed = parseFloat(val);
                if (!isNaN(parsed) && parsed > 0) {
                  setSelectedScenario('cliente');
                }
              }}
              valorReais={clientValorReais}
              avgBid={groupStats.avgBid}
              minBid={groupStats.minBid}
              maxBid={groupStats.maxBid}
              strongThreshold={groupStats.strongThreshold}
              isActive={selectedScenario === 'cliente'}
              onClick={() => setSelectedScenario('cliente')}
              recommendation={{
                minRef: bidAnalysis.recommendation.aggressiveBid,
                maxRef: bidAnalysis.recommendation.primaryBid,
                suggested: bidAnalysis.recommendation.alternativeBid,
              }}
            />
          </div>

          {/* Referências históricas */}
          <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Compare com referências do grupo:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scenarios.map(s => (
              <ScenarioCard
                key={s.type}
                type={s.type}
                lanceLivre={s.lanceLivre}
                valorReais={s.valorReais}
                avgBid={groupStats.avgBid}
                strongThreshold={groupStats.strongThreshold}
                isActive={selectedScenario === s.type}
                onClick={() => setSelectedScenario(s.type)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — Month-by-month projection */}
      {projection ? (
        <ProjectionTable
          projections={projection.months}
          milestoneCompetitivo={projection.milestoneCompetitivo}
          milestoneForte={projection.milestoneForte}
          recommendationText={bidAnalysis.recommendation.justification}
        />
      ) : (
        selectedScenario === 'cliente' && !clientHasValue && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Digite o percentual do lance no card "Lance do Cliente" para ver a projeção mês a mês.
              </p>
            </CardContent>
          </Card>
        )
      )}


      {/* Footer — Disclaimer */}
      <div className="text-center">
        <p className="text-caption text-muted-foreground/75 italic">
          ⚠️ Simulação baseada em dados históricos. Resultados passados não garantem contemplação futura.
        </p>
      </div>
    </div>
  );
}
