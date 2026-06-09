import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, ArrowDown, ArrowUp, ArrowRight, MoveHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { HelpTooltip } from '@/components/shared/HelpTooltip';
import { useScrollHint } from '@/hooks/useScrollHint';
import { useBidsContext } from './BidsContext';

export function BidsHistoryTable() {
  const { studyData, bidAnalysis } = useBidsContext();
  const { containerRef, labelRef } = useScrollHint<HTMLDivElement, HTMLParagraphElement>();
  const [showAllRows, setShowAllRows] = useState(false);
  if (!studyData || !bidAnalysis) return null;

  return (
    <Card id="bids-history-table">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico dos Últimos {studyData.months.length} Meses
              <HelpTooltip title="Tabela de Histórico" content="Dados brutos das últimas assembleias importados diretamente do Excel oficial. Mostra mês a mês: contemplados por sorteio e lance, lance mínimo, médio e máximo. Use para comparar a evolução e identificar padrões." />
            </CardTitle>
            <CardDescription>Últimos 6 meses disponíveis. Dados diretos do Excel (sem recalcular).</CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAllRows(v => !v)}
            className="hidden md:inline-flex h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            {showAllRows ? <><ChevronUp className="h-3.5 w-3.5" /> Ocultar detalhes</> : <><ChevronDown className="h-3.5 w-3.5" /> Ver todas as linhas</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <p ref={labelRef} className="scroll-hint-label md:hidden text-caption text-muted-foreground mb-2 flex items-center justify-center gap-1.5">
          <MoveHorizontal className="h-3.5 w-3.5" aria-hidden />
          <span>arraste para ver mais</span>
        </p>
        <div ref={containerRef} className="overflow-x-auto print:overflow-visible scroll-hint [&_td]:px-2 [&_th]:px-2 sm:[&_td]:px-4 sm:[&_th]:px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px] sm:min-w-[180px] sticky left-0 bg-card z-10">Indicador</TableHead>
                {studyData.months.map((month) => {
                  const quality = bidAnalysis.monthQuality.find(q => q.month === month);
                  const dotColor = !quality || quality.level === 'completo' ? 'bg-success' :
                    quality.level === 'parcial' ? 'bg-warning' : 'bg-destructive';
                  const dotTitle = !quality || quality.level === 'completo' ? 'Dados completos' :
                    quality.level === 'parcial' ? `Dados parciais: faltam ${quality.missingFields.join(', ')}` :
                    'Dados mínimos';
                  return (
                    <TableHead key={month} className="text-center min-w-[80px]">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`inline-block w-2 h-2 rounded-full ${dotColor}`} title={dotTitle} />
                        {month}
                      </div>
                    </TableHead>
                  );
                })}
                <TableHead className="text-center min-w-[100px] bg-primary/5">Média</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell className="font-semibold sticky left-0 bg-muted/30 z-10">Contemplações Totais no Mês</TableCell>
                {studyData.contemplationsBySorteio.map((sorteio, idx) => {
                  const total = sorteio + (studyData.contemplationsByLance[idx] || 0);
                  return <TableCell key={idx} className="text-center">{total || '-'}</TableCell>;
                })}
                <TableCell className="text-center bg-primary/5 font-bold">
                  {(studyData.avgContemplationsBySorteio + studyData.avgContemplationsByLance).toFixed(1)}
                </TableCell>
              </TableRow>
              {showAllRows && (
                <>
                  <TableRow>
                    <TableCell className="font-medium pl-6 text-muted-foreground sticky left-0 bg-card z-10">↳ por Sorteio</TableCell>
                    {studyData.contemplationsBySorteio.map((val, idx) => (
                      <TableCell key={idx} className="text-center">{val || '-'}</TableCell>
                    ))}
                    <TableCell className="text-center bg-primary/5 font-bold">{studyData.avgContemplationsBySorteio.toFixed(1)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium pl-6 text-muted-foreground sticky left-0 bg-card z-10">↳ por Lance</TableCell>
                    {studyData.contemplationsByLance.map((val, idx) => (
                      <TableCell key={idx} className="text-center">{val || '-'}</TableCell>
                    ))}
                    <TableCell className="text-center bg-primary/5 font-bold">{studyData.avgContemplationsByLance.toFixed(1)}</TableCell>
                  </TableRow>
                </>
              )}
              <TableRow>
                <TableCell colSpan={studyData.months.length + 2} className="h-2 bg-muted/50" />
              </TableRow>
              {showAllRows && (
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-card z-10">Lance Máximo</TableCell>
                  {studyData.lanceMaximo.map((val, idx) => (
                    <TableCell key={idx} className="text-center text-destructive">{val > 0 ? `${val.toFixed(2)}%` : '-'}</TableCell>
                  ))}
                  <TableCell className="text-center bg-muted/30 text-muted-foreground">—</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="font-medium sticky left-0 bg-card z-10">Lance Médio (3 Últimas)</TableCell>
                {studyData.lanceMedio.map((val, idx) => (
                  <TableCell key={idx} className="text-center font-medium text-primary">{val > 0 ? `${val.toFixed(2)}%` : '-'}</TableCell>
                ))}
                <TableCell className="text-center bg-muted/30 text-muted-foreground">—</TableCell>
              </TableRow>
              <TableRow id="bids-lance-minimo-row">
                <TableCell className="font-medium sticky left-0 bg-card z-10">Lance Mínimo</TableCell>
                {studyData.lanceMinimo.map((val, idx) => {
                  const prev = idx > 0 ? studyData.lanceMinimo[idx - 1] : 0;
                  const isLast = idx === studyData.lanceMinimo.length - 1;
                  let arrow: React.ReactNode = null;
                  if (idx > 0 && val > 0 && prev > 0) {
                    if (val < prev) arrow = <ArrowDown className="inline h-3 w-3 text-success ml-0.5" />;
                    else if (val > prev) arrow = <ArrowUp className="inline h-3 w-3 text-destructive ml-0.5" />;
                    else arrow = <ArrowRight className="inline h-3 w-3 text-muted-foreground ml-0.5" />;
                  }
                  return (
                    <TableCell key={idx} className={`text-center text-success ${isLast ? 'bg-primary/5 font-bold ring-1 ring-primary/20 rounded' : ''}`}>
                      {val > 0 ? <>{val.toFixed(2)}%{arrow}</> : '-'}
                    </TableCell>
                  );
                })}
                <TableCell className="text-center bg-muted/30 text-muted-foreground">—</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
