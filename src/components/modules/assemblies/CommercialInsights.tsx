import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AssemblyRecord } from '@/types/consortium';
import { analyzeOpportunities, type OpportunityInsights, type GroupOpportunity } from '@/utils/opportunityAnalysis';
import { SafeNarrative } from '@/utils/safeFormattedText';
import {
  TrendingDown, Target, Shield, Sparkles,
  Trophy, BarChart3, ChevronDown, ChevronUp,
} from 'lucide-react';

interface CommercialInsightsProps {
  assemblies: AssemblyRecord[];
  visible: boolean;
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 80) return <Badge className="bg-success/20 text-success border-success/30">{score}</Badge>;
  if (score >= 60) return <Badge className="bg-warning/20 text-warning border-warning/30">{score}</Badge>;
  return <Badge variant="secondary">{score}</Badge>;
}

function RiskBadge({ risk }: { risk: string }) {
  switch (risk) {
    case 'baixo': return <Badge className="bg-success/20 text-success border-success/30">Baixo</Badge>;
    case 'medio': return <Badge className="bg-warning/20 text-warning border-warning/30">Médio</Badge>;
    case 'alto': return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Alto</Badge>;
    default: return <Badge variant="secondary">{risk}</Badge>;
  }
}

function TrendBadge({ trend }: { trend: string }) {
  switch (trend) {
    case 'queda': return <Badge className="bg-success/20 text-success border-success/30">↓ Queda</Badge>;
    case 'alta': return <Badge className="bg-destructive/20 text-destructive border-destructive/30">↑ Alta</Badge>;
    default: return <Badge variant="secondary">→ Estável</Badge>;
  }
}

function GroupTable({ groups, title, icon }: { groups: GroupOpportunity[]; title: string; icon: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? groups : groups.slice(0, 5);

  if (groups.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title}
          <Badge variant="outline" className="ml-auto">{groups.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs w-16">Score</TableHead>
                <TableHead className="text-xs">Grupo</TableHead>
                <TableHead className="text-xs">Tipo</TableHead>
                <TableHead className="text-xs text-right">Lance Ideal</TableHead>
                <TableHead className="text-xs">Tendência</TableHead>
                <TableHead className="text-xs">Risco</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((g) => (
                <TableRow key={`${g.consortiumType}-${g.groupNumber}`}>
                  <TableCell><ScoreBadge score={g.opportunityScore} /></TableCell>
                  <TableCell className="font-medium">{g.groupNumber}</TableCell>
                  <TableCell className="text-xs">{g.typeLabel}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{g.conservadoraBid.toFixed(1)}%</TableCell>
                  <TableCell><TrendBadge trend={g.trend} /></TableCell>
                  <TableCell><RiskBadge risk={g.riskLevel} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{g.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {groups.length > 5 && (
          <Button variant="ghost" size="sm" className="w-full mt-2 gap-1" onClick={() => setExpanded(!expanded)}>
            {expanded ? <><ChevronUp className="h-3 w-3" /> Mostrar menos</> : <><ChevronDown className="h-3 w-3" /> Ver todos ({groups.length})</>}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/** Generate deterministic commercial recommendation from opportunity data */
function generateLocalInsights(insights: OpportunityInsights): string {
  const { summary, bestGroups, decliningBidGroups, highContemplationGroups } = insights;
  const lines: string[] = [];

  lines.push(`## 🏆 Melhores Oportunidades do Momento`);
  lines.push('');
  const top = bestGroups.slice(0, 5);
  if (top.length === 0) {
    lines.push('Nenhum grupo com score elevado identificado no momento.');
  } else {
    for (const g of top) {
      const embeddedNote = g.hasEmbeddedBid ? ` Lance embutido até ${g.embeddedBidMaxPercent}%.` : '';
      const trendLabel = g.trend === 'queda' ? 'lance em queda' : g.trend === 'alta' ? 'lance em alta' : 'lance estável';
      lines.push(`- **Grupo ${g.groupNumber}** (${g.typeLabel}) — Crédito ${g.creditRange}, lance conservador ${g.conservadoraBid.toFixed(1)}%, ${trendLabel}, risco ${g.riskLevel}. Score ${g.opportunityScore}/100.${embeddedNote}`);
    }
  }
  lines.push('');

  lines.push(`## 📊 Cenário Geral do Mercado`);
  lines.push('');
  lines.push(`Foram analisados **${summary.totalGroupsAnalyzed} grupos**, dos quais **${summary.totalOpportunities}** apresentam score ≥ 70 (oportunidades reais). O lance ideal médio está em **${summary.avgIdealBid.toFixed(1)}%**, com faixa variando de ${summary.bidRange.min.toFixed(1)}% a ${summary.bidRange.max.toFixed(1)}%. O risco predominante é **${summary.dominantRisk}**.`);
  lines.push('');

  if (decliningBidGroups.length > 0) {
    lines.push(`## 📉 Janelas de Oportunidade`);
    lines.push('');
    lines.push(`${decliningBidGroups.length} grupo(s) com lances em queda — momento ideal para contemplação com menor desembolso:`);
    for (const g of decliningBidGroups.slice(0, 5)) {
      lines.push(`- Grupo ${g.groupNumber} (${g.typeLabel}): lance conservador ${g.conservadoraBid.toFixed(1)}%`);
    }
    lines.push('');
  }

  if (highContemplationGroups.length > 0) {
    lines.push(`## 🎲 Alta Contemplação por Sorteio`);
    lines.push('');
    for (const g of highContemplationGroups.slice(0, 5)) {
      lines.push(`- Grupo ${g.groupNumber} (${g.typeLabel}): forte histórico de contemplação por sorteio.`);
    }
    lines.push('');
  }

  lines.push(`## 💬 Argumento de Venda`);
  lines.push('');
  if (summary.totalOpportunities > 0 && top.length > 0) {
    const best = top[0];
    lines.push(`"Identifiquei ${summary.totalOpportunities} oportunidades reais nos grupos ativos. O Grupo ${best.groupNumber} está com score de ${best.opportunityScore}/100 — ${best.trend === 'queda' ? 'lances caindo, momento ideal para agir' : 'cenário favorável para planejamento'}."`);
  } else {
    lines.push('"O mercado está com cenário estável. É um bom momento para planejar a entrada com segurança."');
  }

  return lines.join('\n');
}

export function CommercialInsights({ assemblies, visible }: CommercialInsightsProps) {
  const [showRecommendation, setShowRecommendation] = useState(false);

  const insights = useMemo<OpportunityInsights | null>(() => {
    if (!visible || assemblies.length < 10) return null;
    return analyzeOpportunities(assemblies);
  }, [assemblies, visible]);

  const localRecommendation = useMemo(() => {
    if (!insights) return '';
    return generateLocalInsights(insights);
  }, [insights]);

  if (!visible || !insights) return null;

  const { summary, bestGroups, decliningBidGroups, highContemplationGroups } = insights;

  // SEGURANÇA: renderização via SafeNarrative — JSX puro, sem HTML dinâmico.
  // Proibido reintroduzir dangerouslySetInnerHTML neste pipeline.
  const renderContent = (text: string) => <SafeNarrative text={text} />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Grupos Analisados</span>
            </div>
            <p className="text-2xl font-bold text-primary">{summary.totalGroupsAnalyzed}</p>
          </CardContent>
        </Card>
        <Card className="border-success/20 bg-success/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Oportunidades</span>
            </div>
            <p className="text-2xl font-bold text-success">{summary.totalOpportunities}</p>
            <p className="text-xs text-muted-foreground">score ≥ 70</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Lance Ideal Médio</span>
            </div>
            <p className="text-2xl font-bold">{summary.avgIdealBid.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">{summary.bidRange.min.toFixed(0)}% – {summary.bidRange.max.toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Risco Predominante</span>
            </div>
            <div className="mt-1">
              <RiskBadge risk={summary.dominantRisk} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Group Tables */}
      <div className="space-y-4">
        <GroupTable
          groups={bestGroups}
          title="Melhores Grupos do Momento"
          icon={<Trophy className="h-4 w-4 text-success" />}
        />
        <GroupTable
          groups={decliningBidGroups}
          title="Lance em Queda — Janela de Oportunidade"
          icon={<TrendingDown className="h-4 w-4 text-primary" />}
        />
        <GroupTable
          groups={highContemplationGroups}
          title="Alta Contemplação por Sorteio"
          icon={<Target className="h-4 w-4 text-warning" />}
        />
      </div>

      {/* Local Recommendation */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recomendação Comercial
          </CardTitle>
          <CardDescription>
            Argumentos de venda e análise pronta para usar com clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showRecommendation ? (
            <div className="prose prose-sm dark:prose-invert max-w-none bg-background/50 rounded-lg p-card-sm border">
              {renderContent(localRecommendation)}
            </div>
          ) : (
            <Button onClick={() => setShowRecommendation(true)} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Ver Recomendação Comercial
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
