import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Target, Shield, AlertTriangle, Minus, Lightbulb, AlertCircle, ArrowRight, CheckCircle2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { HelpTooltip } from '@/components/shared/HelpTooltip';
import { formatBidPercent } from '@/utils/bidAnalysis';
import { useBidsContext } from './BidsContext';
import { logger } from '@/utils/logger';
import { BidAIRecommendation, type BidAIRecommendationProps } from './BidAIRecommendation';

// Static class maps to ensure Tailwind purge includes all needed classes
const COLOR_CLASSES = {
  success: {
    bg: 'bg-success/10',
    border: 'border-success/20',
    text: 'text-success',
    bar: 'bg-success',
    btnBorder: 'border-success',
    btnHover: 'hover:bg-success/10',
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    text: 'text-warning',
    bar: 'bg-warning',
    btnBorder: 'border-warning',
    btnHover: 'hover:bg-warning/10',
  },
  destructive: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
    text: 'text-destructive',
    bar: 'bg-destructive',
    btnBorder: 'border-destructive',
    btnHover: 'hover:bg-destructive/10',
  },
} as const;

type ColorKey = keyof typeof COLOR_CLASSES;

const ZONE_LABELS = {
  conservadora: { name: 'Alta chance de contemplação', subtitle: 'Lance no patamar mais alto — máxima probabilidade histórica', Icon: Shield, color: 'success' as ColorKey },
  equilibrada: { name: 'Chance moderada', subtitle: 'Lance intermediário — equilíbrio entre esforço e chance', Icon: Minus, color: 'warning' as ColorKey },
  agressiva: { name: 'Baixa chance', subtitle: 'Lance no patamar mais baixo — menor esforço, menor probabilidade', Icon: AlertTriangle, color: 'destructive' as ColorKey },
} as const;

type ZoneKey = 'agressiva' | 'equilibrada' | 'conservadora';

interface ZoneBand {
  key: ZoneKey;
  minBid: number;
  maxBid: number;
  occurrences: number; // count of historical minBids contemplated at or below maxBid
  totalMonths: number;
}

export function BidsZonesCard() {
  const { bidAnalysis } = useBidsContext();

  // Build probability-based bands from real historical minBids — sem forçamento.
  // Thresholds são valores REAIS (percentis 33/75/100); occurrences = countAtOrBelow(threshold) puro.
  // Se duas bandas tiverem mesma probabilidade, a redundante é removida.
  const bands = useMemo<ZoneBand[] | null>(() => {
    if (!bidAnalysis) return null;
    const validBids = bidAnalysis.minBids.filter(v => v > 0);
    if (validBids.length === 0) return null;
    const sorted = [...validBids].sort((a, b) => a - b);
    const totalMonths = sorted.length;

    const idxEntry = Math.max(0, Math.floor((sorted.length - 1) * 0.33));
    const idxComp = Math.max(idxEntry, Math.floor((sorted.length - 1) * 0.75));
    const idxHigh = sorted.length - 1;

    const entryMax = sorted[idxEntry];
    const compMax = sorted[idxComp];
    const highMax = sorted[idxHigh];

    const countAtOrBelow = (threshold: number) =>
      sorted.filter(v => v <= threshold + 1e-9).length;

    // SEM forçamento: contagem reflete dado real
    const entryCount = countAtOrBelow(entryMax);
    const compCount = countAtOrBelow(compMax);
    const highCount = countAtOrBelow(highMax);

    const bandsRaw: ZoneBand[] = [
      { key: 'agressiva', minBid: sorted[0], maxBid: entryMax, occurrences: entryCount, totalMonths },
      { key: 'equilibrada', minBid: entryMax, maxBid: compMax, occurrences: compCount, totalMonths },
      { key: 'conservadora', minBid: compMax, maxBid: highMax, occurrences: highCount, totalMonths },
    ];

    // Remove faixas redundantes (mesma probabilidade que a anterior já mantida).
    // Garante progressão estritamente crescente sem inventar números.
    const kept: ZoneBand[] = [];
    for (const b of bandsRaw) {
      if (kept.length === 0 || b.occurrences > kept[kept.length - 1].occurrences) {
        kept.push(b);
      } else {
        logger.info(`[BidsZonesCard] Faixa ${b.key} removida — probabilidade duplicada (${b.occurrences}/${totalMonths})`);
      }
    }

    return kept;
  }, [bidAnalysis]);

  // Lance recomendado: mediana da faixa de chance moderada (ou única faixa intermediária disponível).
  const recommendedBid = useMemo(() => {
    if (!bands || bands.length === 0) return null;
    const moderate = bands.find(b => b.key === 'equilibrada');
    const target = moderate ?? (bands.length === 1 ? bands[0] : bands[Math.floor(bands.length / 2)]);
    if (!target) return null;
    return (target.minBid + target.maxBid) / 2;
  }, [bands]);

  if (!bidAnalysis || !bands || bands.length === 0) return null;

  const maxValue = Math.max(...bands.map(b => b.maxBid), 0.01);
  const gridCols = bands.length === 3 ? 'md:grid-cols-3' : bands.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1';

  return (
    <Card id="bids-zones" className="interactive-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5" />Como o grupo costuma contemplar <HelpTooltip title="Faixas de Contemplação" content="Mostra faixas de lance ordenadas por chance histórica de contemplação, com base nas últimas assembleias do grupo. Faixas com mesma probabilidade são automaticamente unificadas." /></CardTitle>
        <CardDescription>
          Veja em quais faixas de lance o grupo costuma contemplar, com base nas últimas {bidAnalysis.months.length} assembleias.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
          {bands.map((band, idx) => {
            const { name, subtitle, Icon, color } = ZONE_LABELS[band.key];
            const classes = COLOR_CLASSES[color];
            const barWidth = maxValue > 0 ? Math.max(8, (band.maxBid / maxValue) * 100) : 0;
            const probability = band.totalMonths > 0 ? Math.round((band.occurrences / band.totalMonths) * 100) : 0;
            const isFirst = idx === 0;
            const prevMax = !isFirst ? bands[idx - 1].maxBid : 0;
            // Visual-only: evita sobreposição entre faixas adjacentes (ex: "Até 74%" + "De 74% a 78%")
            const displayMin = isFirst ? band.minBid : prevMax + 0.01;
            const sameRange = !isFirst && Math.abs(band.maxBid - displayMin) < 0.01;
            const isRecommended = band.key === 'equilibrada';

            return (
              <div key={band.key} className={`relative p-card-sm rounded-lg bg-card border border-border ${isRecommended ? 'ring-2 ring-primary/40' : ''}`}>
                {isRecommended && (
                  <span className="absolute -top-2 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-caption font-semibold shadow-sm">
                    ⭐ Recomendado
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`h-5 w-5 ${classes.text}`} />
                  <span className={`font-semibold ${classes.text}`}>{name}</span>
                </div>
                <p className="text-caption text-muted-foreground mb-3">{subtitle}</p>
                <p className="text-xs text-muted-foreground mb-0.5">Faixa de lance:</p>
                <p className={`text-2xl font-bold ${classes.text} mb-2`}>
                  {isFirst
                    ? <>Até {formatBidPercent(band.maxBid)}</>
                    : sameRange
                      ? formatBidPercent(band.maxBid)
                      : <>De {formatBidPercent(displayMin)} a {formatBidPercent(band.maxBid)}</>}
                </p>
                <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${classes.bar} transition-[colors,box-shadow,transform] duration-500`} style={{ width: `${barWidth}%` }} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Chance histórica: <strong className={classes.text}>{probability}%</strong>
                  <span className="block text-xs text-muted-foreground/80">({band.occurrences} de {band.totalMonths} assembleias)</span>
                </p>
              </div>
            );
          })}
        </div>

        {/* Recomendação já é destacada visualmente pela banda "Recomendado" — evita redundância. */}


        {(() => {
          const allBids = bidAnalysis.minBids.filter(v => v > 0);
          if (allBids.length === 0) return null;
          const minObs = Math.min(...allBids);
          const maxObs = Math.max(...allBids);
          return (
            <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>Menor lance contemplado: <strong className="text-foreground">{formatBidPercent(minObs)}</strong></span>
              <span>Maior lance contemplado: <strong className="text-foreground">{formatBidPercent(maxObs)}</strong></span>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}

export function BidsRecommendationCard({ aiRecommendationProps }: { aiRecommendationProps?: BidAIRecommendationProps }) {
  const { bidAnalysis, handleApplyBidToSimulator, onApplyBidToSimulator } = useBidsContext();
  const [showAI, setShowAI] = useState(false);

  const actionInsight = useMemo(() => {
    if (!bidAnalysis) return [];
    const lastMinBid = bidAnalysis.minBids[bidAnalysis.minBids.length - 1] || 0;
    const lines: string[] = [];

    if (lastMinBid > 0) {
      lines.push(`O menor lance contemplado recentemente foi ${formatBidPercent(lastMinBid)}. Evite ofertar abaixo disso.`);
    }

    if (bidAnalysis.recommendation.warnings.length > 0) {
      lines.push(bidAnalysis.recommendation.warnings[0]);
    }

    return lines;
  }, [bidAnalysis]);

  if (!bidAnalysis) return null;

  const { recommendation, months } = bidAnalysis;
  const recommendedBid = recommendation.alternativeBid;
  const minRef = recommendation.aggressiveBid;
  const maxRef = recommendation.primaryBid;

  const suggestions = [
    { label: 'Mínimo observado', desc: 'Referência do menor lance contemplado', bid: minRef, zone: 'conservadora' as const, color: 'success' as ColorKey },
    { label: 'Faixa recomendada', desc: 'Melhor equilíbrio entre esforço e chance', bid: recommendedBid, zone: 'equilibrada' as const, color: 'warning' as ColorKey, highlight: true },
    { label: 'Para aumentar chances', desc: 'Lance mais alto, maior probabilidade', bid: maxRef, zone: 'agressiva' as const, color: 'destructive' as ColorKey },
  ];

  return (
    <Card id="bids-recommendation-card" className="border-primary/30 bg-primary/5 interactive-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-primary">
          <Lightbulb className="h-5 w-5" />
          Recomendação de Lance
          <HelpTooltip title="Recomendação de Lance" content="Calculada com base na análise estatística das últimas assembleias. Indica a faixa de lance com melhor relação entre esforço financeiro e chance de contemplação." />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hero recommendation */}
        <div className="p-card-sm bg-background rounded-lg border-2 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/10 mt-0.5">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Com base nos últimos {months.length} meses</p>
              <p className="text-base font-semibold text-foreground leading-snug">
                Seu lance ideal neste momento está entre{' '}
                <span className="text-primary">{formatBidPercent(minRef)}</span>
                {' '}e{' '}
                <span className="text-primary">{formatBidPercent(maxRef)}</span>.
              </p>
              <div className="mt-3 flex items-center gap-2 p-2.5 rounded-md bg-primary/5 border border-primary/10">
                <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm font-medium text-primary">
                  Recomendação: ofertar ~{formatBidPercent(recommendedBid)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Three reference bands */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {suggestions.map(({ label, desc, bid, zone, color, highlight }) => {
            const classes = COLOR_CLASSES[color];
            return (
              <div
                key={zone}
                className={`text-center p-3 rounded-lg border bg-card border-border ${highlight ? 'ring-2 ring-primary/30' : ''}`}
              >
                <p className={`text-xs font-semibold mb-0.5 ${highlight ? 'text-primary' : 'text-muted-foreground'}`}>{label}</p>
                <p className="text-caption text-muted-foreground mb-1">{desc}</p>
                <p className={`text-xl font-bold ${highlight ? 'text-primary' : classes.text}`}>{formatBidPercent(bid)}</p>
              </div>
            );
          })}
        </div>

        {/* Action insights */}
        {actionInsight.length > 0 && (
          <div className="space-y-2">
            {actionInsight.map((line, idx) => (
              <Alert key={idx} variant="default" className="bg-background">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{line}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* AI deep analysis - collapsible */}
        {aiRecommendationProps && (
          <div className="pt-3 border-t">
            {!showAI ? (
              <button
                onClick={() => setShowAI(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-primary/20 text-sm text-primary hover:bg-primary/5 transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Receber análise personalizada com IA
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="space-y-3 animate-fade-in">
                <button
                  onClick={() => setShowAI(false)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronUp className="h-3 w-3" />
                  Ocultar análise com IA
                </button>
                <BidAIRecommendation {...aiRecommendationProps} />
              </div>
            )}
          </div>
        )}

        <p className="text-caption text-muted-foreground text-center pt-3 border-t">
          ⚠️ Orientação baseada em comportamento histórico. Não constitui garantia de contemplação. As condições seguem o regulamento do grupo e normas da administradora.
        </p>
      </CardContent>
    </Card>
  );
}
