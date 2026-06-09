import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Info, Shield, Zap, AlertTriangle, Activity, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { HelpTooltip } from '@/components/shared/HelpTooltip';
import { useBidsContext } from './BidsContext';
import { formatCreditRange } from '@/utils/formatCreditRange';

export function BidsGroupInfoCard() {
  const { studyData, selectedGroupNumber } = useBidsContext();
  if (!studyData) return null;

  return (
    <Card id="bids-group-info">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5" />
          Características do Grupo {selectedGroupNumber}
          <HelpTooltip title="Características do Grupo" content="Informações estruturais do grupo: se aceita lance embutido (parte do lance pode vir da própria carta), o percentual máximo permitido e a faixa de crédito disponível. Essas características são fixas e determinadas pela administradora." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-6">
          <div className={`p-card-sm rounded-lg flex-1 min-w-[200px] ${
            studyData.hasEmbeddedBid ? 'bg-success/10 border border-success/20' : 'bg-muted border border-border'
          }`}>
            <p className="text-sm text-muted-foreground mb-1">Lance Embutido</p>
            {studyData.hasEmbeddedBid ? (
              <>
                <p className="text-lg font-bold text-success">Permitido até {studyData.embeddedBidMaxPercent}%</p>
                <p className="text-xs text-muted-foreground mt-1">O grupo aceita lance embutido (reduz a carta de crédito)</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-muted-foreground">Não permitido</p>
                <p className="text-xs text-destructive/80 mt-1">Este grupo não permite lance embutido. O lance deverá ser ofertado integralmente com recursos próprios.</p>
              </>
            )}
          </div>
          <div className="p-card-sm bg-primary/10 rounded-lg border border-primary/20 flex-1 min-w-[250px]">
            <p className="text-sm text-muted-foreground mb-1">Faixa de Crédito</p>
            <p className="text-lg font-bold text-primary">{formatCreditRange(studyData.creditRange)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BidsBehaviorCard() {
  const { bidAnalysis } = useBidsContext();
  if (!bidAnalysis) return null;

  const { behaviorAnalysis } = bidAnalysis;

  return (
    <Card id="bids-behavior" className="interactive-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Comportamento Histórico do Grupo
          <HelpTooltip title="Comportamento Histórico" content="Classifica o grupo em 3 dimensões: Tipo (Previsível, Competitivo ou Volátil), Tendência (Alta, Estável ou Queda) e Predominância (se mais pessoas contemplam por Sorteio ou por Lance). Ajuda a escolher a estratégia certa." />
        </CardTitle>
        <CardDescription>
          Classificações baseadas no comportamento observado nos últimos {bidAnalysis.months.length} meses. Padrões históricos podem não se repetir.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-card-sm rounded-lg border ${
            behaviorAnalysis.behavior === 'previsivel' ? 'bg-success/10 border-success/20' :
            behaviorAnalysis.behavior === 'competitivo' ? 'bg-warning/10 border-warning/20' :
            'bg-destructive/10 border-destructive/20'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {behaviorAnalysis.behavior === 'previsivel' && <Shield className="h-5 w-5 text-success" />}
              {behaviorAnalysis.behavior === 'competitivo' && <Zap className="h-5 w-5 text-warning" />}
              {behaviorAnalysis.behavior === 'volatil' && <AlertTriangle className="h-5 w-5 text-destructive" />}
              <span className="font-semibold">{behaviorAnalysis.behaviorLabel}</span>
            </div>
            <p className="text-sm text-muted-foreground">{behaviorAnalysis.behaviorDescription}</p>
          </div>

          <div className={`p-card-sm rounded-lg border ${
            behaviorAnalysis.trend === 'estavel' ? 'bg-muted border-border' :
            behaviorAnalysis.trend === 'alta' ? 'bg-destructive/10 border-destructive/20' :
            'bg-success/10 border-success/20'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {behaviorAnalysis.trend === 'alta' && <TrendingUp className="h-5 w-5 text-destructive" />}
              {behaviorAnalysis.trend === 'estavel' && <Minus className="h-5 w-5 text-muted-foreground" />}
              {behaviorAnalysis.trend === 'queda' && <TrendingDown className="h-5 w-5 text-success" />}
              <span className="font-semibold">
                Tendência: {behaviorAnalysis.trend === 'alta' ? 'Alta' : behaviorAnalysis.trend === 'queda' ? 'Queda' : 'Estável'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{behaviorAnalysis.trendDescription}</p>
          </div>

          <div className={`p-card-sm rounded-lg border ${
            behaviorAnalysis.predominance === 'sorteio' ? 'bg-success/10 border-success/20' :
            behaviorAnalysis.predominance === 'lance' ? 'bg-warning/10 border-warning/20' :
            'bg-muted border-border'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5" />
              <span className="font-semibold">
                Predominância: {behaviorAnalysis.predominance === 'sorteio' ? 'Sorteio' : behaviorAnalysis.predominance === 'lance' ? 'Lance' : 'Equilibrado'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{behaviorAnalysis.predominanceDescription}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
