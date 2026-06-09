import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingDown, TrendingUp, Minus, Trophy, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { AssemblyRecord, ConsortiumType } from '@/types/consortium';
import { formatBidPercent } from '@/utils/bidAnalysis';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';
import { computeBestGroupsRanking, type GroupRanking } from './bestGroupsRanking';

const TrendIcon = ({ trend }: { trend: 'alta' | 'estavel' | 'queda' }) => {
  switch (trend) {
    case 'queda':
      return <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800"><TrendingDown className="h-3 w-3" />Queda</Badge>;
    case 'alta':
      return <Badge variant="outline" className="gap-1 text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800"><TrendingUp className="h-3 w-3" />Alta</Badge>;
    default:
      return <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800"><Minus className="h-3 w-3" />Estável</Badge>;
  }
};

interface Props {
  assemblies: AssemblyRecord[];
  selectedTab: ConsortiumType;
}

type EmbeddedFilter = 'com' | 'sem';

export function BestGroupsForBid({ assemblies, selectedTab }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [embeddedFilter, setEmbeddedFilter] = useState<EmbeddedFilter>('com');
  const { navigateTo } = useModuleNavigation();

  const allRankings = useMemo<GroupRanking[]>(
    () => computeBestGroupsRanking(assemblies, selectedTab),
    [assemblies, selectedTab]
  );

  const withEmbedded = useMemo(() => allRankings.filter(r => r.hasEmbeddedBid), [allRankings]);
  const withoutEmbedded = useMemo(() => allRankings.filter(r => !r.hasEmbeddedBid), [allRankings]);

  const rankings = embeddedFilter === 'com' ? withEmbedded : withoutEmbedded;

  const handleAnalyze = (groupNumber: number) => {
    sessionStorage.setItem('bids-preselect', JSON.stringify({
      type: selectedTab,
      group: groupNumber.toString(),
    }));
    navigateTo('bids');
  };

  if (allRankings.length === 0) return null;

  const displayedRankings = showAll ? rankings : rankings.slice(0, 10);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Melhores Grupos para Lance
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Grupos ativos e relevantes, separados por tipo de lance, ordenados por comportamento recente dos lances.
        </p>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <Tabs value={embeddedFilter} onValueChange={(v) => { setEmbeddedFilter(v as EmbeddedFilter); setShowAll(false); }}>
          <TabsList className="grid w-full max-w-md grid-cols-2" data-tabs-keep-pill="true">
            <TabsTrigger value="com" className="border border-[#1e3a5f] bg-transparent data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white data-[state=active]:border-[#1e3a5f] hover:bg-[#1e3a5f]/10">Com lance embutido ({withEmbedded.length})</TabsTrigger>
            <TabsTrigger value="sem" className="border border-[#1e3a5f] bg-transparent data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white data-[state=active]:border-[#1e3a5f] hover:bg-[#1e3a5f]/10">Sem lance embutido ({withoutEmbedded.length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {rankings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum grupo {embeddedFilter === 'com' ? 'com' : 'sem'} lance embutido atende aos critérios atuais.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="hidden sm:table-cell">Lance Médio</TableHead>
                  <TableHead className="hidden sm:table-cell">Tendência</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedRankings.map((r, idx) => (
                  <TableRow key={r.groupNumber}>
                    <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">Grupo {r.groupNumber}</div>
                      <div className="sm:hidden flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{formatBidPercent(r.avgBid)}</span>
                        <TrendIcon trend={r.trend} />
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-mono">{formatBidPercent(r.avgBid)}</TableCell>
                    <TableCell className="hidden sm:table-cell"><TrendIcon trend={r.trend} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => handleAnalyze(r.groupNumber)}>
                        <Search className="h-3 w-3" />
                        <span className="hidden sm:inline">Analisar</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {rankings.length > 10 && (
              <div className="flex justify-center mt-4">
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => setShowAll(!showAll)}>
                  {showAll ? (
                    <><ChevronUp className="h-4 w-4" />Mostrar top 10</>
                  ) : (
                    <><ChevronDown className="h-4 w-4" />Ver todos ({rankings.length} grupos)</>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
