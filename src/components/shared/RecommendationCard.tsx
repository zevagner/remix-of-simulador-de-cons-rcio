import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, ArrowRight, TrendingUp, FileText } from 'lucide-react';
import { formatCurrency } from '@/core/finance';

interface RecommendationCardProps {
  /** Título do bloco — ex.: "Melhor estratégia para o seu objetivo" */
  title?: string;
  /** Nome curto/orientado a decisão da estratégia escolhida */
  strategyName: string;
  /** Etiqueta/categoria opcional — ex.: "Maior lucro estimado" */
  strategyTag?: string;
  /** Valor monetário do "resultado final" (Valor final estimado) */
  finalResultValue: number;
  /** Rótulo do resultado final — mantido para compat; default "Valor final estimado" */
  finalResultLabel?: string;
  /** Valor que o cliente investe (Você investe) */
  investedValue: number;
  /** Rótulo do valor investido — default "Você investe" */
  investedLabel?: string;
  /** Lucro estimado (absoluteGain) */
  absoluteGain: number;
  /** Retorno percentual — exibido como secundário, nunca como destaque */
  percentGain: number;
  /** Texto explicando o motivo da vantagem */
  reasonText: string;
  /** Comparação opcional contra alternativa (mantida para compat) */
  comparison?: {
    chosenLabel: string;
    chosenValue: number;
    alternativeLabel: string;
    alternativeValue: number;
    metricLabel: string;
  };
  /** Texto do CTA principal */
  ctaLabel: string;
  /** Texto curto exibido acima do CTA explicando o que acontece ao clicar */
  ctaHelperText?: string;
  /** Handler do CTA */
  onCtaClick: () => void;
  /** Se true, indica menor é melhor (custos). Default: false */
  lowerIsBetter?: boolean;
}

export function RecommendationCard({
  title = 'Melhor estratégia para o seu objetivo',
  strategyName,
  strategyTag,
  finalResultValue,
  finalResultLabel = 'Valor final estimado',
  investedValue,
  investedLabel = 'Você investe',
  absoluteGain,
  percentGain,
  reasonText,
  comparison,
  ctaLabel,
  ctaHelperText,
  onCtaClick,
  lowerIsBetter = false,
}: RecommendationCardProps) {
  const gainIsPositive = absoluteGain > 0;
  const gainColor = gainIsPositive ? 'text-success' : 'text-muted-foreground';
  const gainSign = gainIsPositive ? (lowerIsBetter ? '−' : '+') : '';

  return (
    <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg no-break animate-fade-in">
      <CardContent className="py-6 px-5 sm:px-6 space-y-5">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/15">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wide">{title}</p>
              <h3 className="text-lg sm:text-xl font-bold text-foreground leading-tight">{strategyName}</h3>
            </div>
          </div>
          {strategyTag && (
            <Badge variant="secondary" className="text-xs gap-1">
              <TrendingUp className="h-3 w-3" />
              {strategyTag}
            </Badge>
          )}
        </div>

        {/* Explicação curta */}
        <p className="text-sm text-foreground leading-relaxed">{reasonText}</p>

        {/* ── Bloco comercial padrão: Você investe / Valor final estimado / Lucro estimado ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg bg-background/60 border border-border p-3">
            <p className="text-caption text-muted-foreground uppercase tracking-wide">{investedLabel}</p>
            <p className="text-xl font-bold text-foreground mt-1 tabular-nums">
              {formatCurrency(investedValue)}
            </p>
          </div>
          <div className="rounded-lg bg-background/60 border border-border p-3">
            <p className="text-caption text-muted-foreground uppercase tracking-wide">{finalResultLabel}</p>
            <p className="text-xl font-bold text-foreground mt-1 tabular-nums">
              {formatCurrency(finalResultValue)}
            </p>
          </div>
          <div className="rounded-lg bg-primary/10 border-2 border-primary/30 p-3">
            <p className="text-caption text-primary uppercase tracking-wide font-semibold">Lucro estimado</p>
            <p className={`text-xl font-bold mt-1 tabular-nums ${gainColor}`}>
              {gainSign}{formatCurrency(Math.abs(absoluteGain))}
            </p>
            <p className={`text-xs mt-0.5 ${gainColor} tabular-nums`}>
              ({gainIsPositive ? '+' : ''}{percentGain.toFixed(1)}% de retorno)
            </p>
          </div>
        </div>

        {/* Comparação opcional cenário escolhido vs alternativa */}
        {comparison && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Comparação ({comparison.metricLabel})
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border-2 border-primary/40 bg-primary/5 p-3">
                <p className="text-caption text-muted-foreground">Escolhido</p>
                <p className="text-sm font-semibold text-foreground truncate" title={comparison.chosenLabel}>
                  {comparison.chosenLabel}
                </p>
                <p className="text-base font-bold text-primary mt-1 tabular-nums">
                  {formatCurrency(comparison.chosenValue)}
                </p>
              </div>
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <p className="text-caption text-muted-foreground">Alternativa</p>
                <p className="text-sm font-semibold text-foreground truncate" title={comparison.alternativeLabel}>
                  {comparison.alternativeLabel}
                </p>
                <p className="text-base font-bold text-muted-foreground mt-1 tabular-nums">
                  {formatCurrency(comparison.alternativeValue)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer comercial padrão */}
        <p className="text-caption text-muted-foreground/80 italic text-center">
          Resultados estimados com base nas premissas da simulação
        </p>

        {/* CTA */}
        <div className="space-y-2">
          {ctaHelperText && (
            <p className="text-xs text-muted-foreground text-center">{ctaHelperText}</p>
          )}
          <Button
            size="lg"
            onClick={onCtaClick}
            className="w-full gap-2 min-h-[52px] text-base"
          >
            <FileText className="h-5 w-5" />
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
