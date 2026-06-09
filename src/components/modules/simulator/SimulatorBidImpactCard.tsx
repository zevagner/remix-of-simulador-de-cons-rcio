import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, TrendingDown, X } from 'lucide-react';
import { formatCurrency } from '@/core/finance';
import { useSimulatorInput, useSimulatorResult } from './SimulatorContext';
import { HelpTooltip } from '@/components/shared/HelpTooltip';

export const SimulatorBidImpactCard = memo(function SimulatorBidImpactCard() {
  const { input, suggestedBidFromStudy, clearSuggestedBid } = useSimulatorInput();
  const { result, isValidSimulation } = useSimulatorResult();

  if (!isValidSimulation || !suggestedBidFromStudy) return null;

  const bidValue = (input.creditValue * suggestedBidFromStudy.bidPercent) / 100;
  const netCredit = suggestedBidFromStudy.hasEmbeddedBid ? input.creditValue - bidValue : input.creditValue;
  const installmentReduction = result.installmentBeforeContemplation - result.installmentAfterContemplation;
  const reductionPercent = result.installmentBeforeContemplation > 0
    ? (installmentReduction / result.installmentBeforeContemplation) * 100
    : 0;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-primary">
            <Target className="h-5 w-5" />
            Impacto Estimado do Lance na Parcela
          </CardTitle>
          {clearSuggestedBid && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={clearSuggestedBid}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Cenário hipotético de contemplação por lance - Grupo {suggestedBidFromStudy.groupNumber} ({suggestedBidFromStudy.creditRange})
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-background rounded-lg border border-warning/30">
          <p className="text-xs text-muted-foreground">
            A parcela apresentada considera um <strong>cenário hipotético de contemplação por lance</strong>, com base nas premissas atuais do grupo e nas taxas informadas.
            Os valores são estimativas e podem variar conforme regras do grupo e condições da assembleia.
          </p>
        </div>

        <div className="p-3 bg-background rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              suggestedBidFromStudy.zone === 'conservadora' ? 'bg-success/20 text-success' :
              suggestedBidFromStudy.zone === 'equilibrada' ? 'bg-warning/20 text-warning' :
              'bg-destructive/20 text-destructive'
            }`}>
              Zona {suggestedBidFromStudy.zone.charAt(0).toUpperCase() + suggestedBidFromStudy.zone.slice(1)} (histórica)
            </span>
            {suggestedBidFromStudy.hasEmbeddedBid ? (
              <span className="text-xs text-muted-foreground">
                Lance simulado como embutido (até {suggestedBidFromStudy.embeddedBidMaxPercent}% permitido pelo grupo)
              </span>
            ) : (
              <span className="text-xs text-destructive/80">
                Este grupo não permite lance embutido. Lance simulado integralmente como recursos próprios.
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="p-3 bg-background rounded-lg border text-center">
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              Percentual do Lance
              <HelpTooltip title="Percentual do Lance" content="Porcentagem da carta de crédito ofertada como lance para antecipar a contemplação." />
            </p>
            <p className="text-xl font-bold text-primary">{suggestedBidFromStudy.bidPercent.toFixed(2).replace('.', ',')}%</p>
          </div>
          <div className="p-3 bg-background rounded-lg border text-center">
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              Valor do Lance
              <HelpTooltip title="Valor do Lance" content="Valor em reais correspondente ao percentual de lance sobre a carta de crédito." />
            </p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(bidValue)}</p>
          </div>
          <div className="p-3 bg-background rounded-lg border text-center">
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              Carta Líquida Estimada
              <HelpTooltip title="Carta Líquida" content="Crédito efetivamente disponível após descontar o lance embutido do valor total da carta." />
            </p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(netCredit)}</p>
            {suggestedBidFromStudy.hasEmbeddedBid && <p className="text-xs text-muted-foreground">Após lance embutido</p>}
          </div>
          <div className="p-3 bg-background rounded-lg border text-center">
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              Parcela após Contemplação
              <HelpTooltip title="Parcela Pós-Contemplação" content="Valor estimado da parcela após a contemplação por lance, com base no saldo devedor remanescente." />
            </p>
            <p className="text-xl font-bold text-success">{formatCurrency(result.installmentAfterContemplation)}</p>
            <p className="text-xs text-muted-foreground">{result.remainingTermAfterContemplation} parcelas restantes (prazo remanescente)</p>
          </div>
          <div className="p-3 bg-background rounded-lg border text-center col-span-2 md:col-span-2">
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              Redução Estimada da Parcela
              <HelpTooltip title="Redução da Parcela" content="Diferença entre a parcela antes e depois da contemplação, mostrando a economia mensal estimada." />
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1 text-success">
                <TrendingDown className="h-5 w-5" />
                <span className="text-xl font-bold">{formatCurrency(installmentReduction)}</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span className="text-lg font-semibold text-success">{reductionPercent.toFixed(1).replace('.', ',')}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Em relação à parcela antes da contemplação</p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center pt-3 border-t space-y-1">
          <p>⚠️ Os valores apresentados são estimativas baseadas nas condições informadas. A contemplação não possui prazo garantido e depende de sorteio ou oferta de lance competitivo.</p>
          <p className="font-medium text-foreground/80">Esta ferramenta é um apoio à decisão e não constitui promessa de contemplação ou de rentabilidade. As condições do consórcio seguem integralmente o regulamento do grupo e as normas vigentes da administradora.</p>
        </div>
      </CardContent>
    </Card>
  );
});
