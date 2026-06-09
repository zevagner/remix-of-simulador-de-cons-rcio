import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { HelpTooltip } from '@/components/shared/HelpTooltip';
import { useBidsContext } from './BidsContext';

export function BidsHeroInsight() {
  const { bidAnalysis, selectedGroupNumber } = useBidsContext();
  if (!bidAnalysis) return null;

  const trend = bidAnalysis.behaviorAnalysis.trend;
  const lastMin = bidAnalysis.stats.lastMonthMinBid;
  const latestMonth = bidAnalysis.months[bidAnalysis.months.length - 1] || '';

  let heroText = '';
  let heroType: 'opportunity' | 'warning' | 'neutral' = 'neutral';
  const TrendIcon = trend === 'queda' ? TrendingDown : trend === 'alta' ? TrendingUp : Minus;

  if (trend === 'queda') {
    heroText = `Os lances vêm caindo nos últimos meses. O lance mínimo mais recente (${latestMonth}) foi de ${lastMin.toFixed(2)}%. Momento potencialmente favorável para contemplação com valores menores.`;
    heroType = 'opportunity';
  } else if (trend === 'alta') {
    heroText = `Os lances estão subindo. O lance mínimo mais recente (${latestMonth}) foi de ${lastMin.toFixed(2)}%. Ambiente mais competitivo — considere lance na zona de Alta Segurança.`;
    heroType = 'warning';
  } else {
    heroText = `Os lances estão estáveis. O lance mínimo mais recente (${latestMonth}) foi de ${lastMin.toFixed(2)}%. Cenário previsível para planejamento.`;
  }

  const bgClass = heroType === 'opportunity' ? 'bg-success/10 border-success/30' :
    heroType === 'warning' ? 'bg-warning/10 border-warning/30' : 'bg-primary/10 border-primary/30';

  // Render with id for tour
  // (id is added to the returned Card below)
  const iconColor = heroType === 'opportunity' ? 'text-success' :
    heroType === 'warning' ? 'text-warning' : 'text-primary';

  return (
    <Card id="bids-hero-insight" className={`border-2 ${bgClass}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-6">
          <div className={`p-3 rounded-full ${heroType === 'opportunity' ? 'bg-success/20' : heroType === 'warning' ? 'bg-warning/20' : 'bg-primary/20'}`}>
            <TrendIcon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-base">Cenário Atual — Grupo {selectedGroupNumber}</h3>
              <HelpTooltip title="Cenário Atual" content="Resumo da tendência dos lances nas últimas assembleias. Mostra se os lances estão subindo, caindo ou estáveis, ajudando a decidir o melhor momento para ofertar." />
              <Badge variant="outline" className="text-xs">
                {trend === 'queda' ? '↓ Queda' : trend === 'alta' ? '↑ Alta' : '→ Estável'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{heroText}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
