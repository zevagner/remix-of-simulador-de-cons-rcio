/**
 * Assemblies content components — superfícies CONSULTIVAS read-only.
 *
 * Onda: Assemblies Legacy Context Removal Wave.
 * Recebem dados via props (sem AssembliesContext). Toda operação
 * administrativa permanece em Admin → Operações de Assembleias.
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AssemblyRecord, ConsortiumType, CONSORTIUM_TYPE_LABELS } from '@/types/consortium';
import { MAX_MONTHS_TO_KEEP, parseAssemblyMonth } from '@/utils/assemblyData';
import { Building2, Car, Truck, Calendar, Database, Users, Clock, CalendarDays } from 'lucide-react';
import { formatCreditRange } from '@/utils/formatCreditRange';

const typeIcons: Record<ConsortiumType, React.ReactNode> = {
  imobiliario: <Building2 className="h-4 w-4" />,
  auto: <Car className="h-4 w-4" />,
  pesados: <Truck className="h-4 w-4" />,
};

function formatExcelDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  const LONG: Intl.DateTimeFormatOptions = {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  };
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  try {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);
      if (year < 100) year += year > 50 ? 1900 : 2000;
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) return cap(date.toLocaleDateString('pt-BR', LONG));
    }
    const fallback = new Date(dateStr);
    if (!isNaN(fallback.getTime())) return cap(fallback.toLocaleDateString('pt-BR', LONG));
    return dateStr;
  } catch { return dateStr; }
}

function formatAssemblyMonthLabel(month: string): string {
  const date = parseAssemblyMonth(month);
  if (isNaN(date.getTime())) return month;
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

interface StatsCardsProps {
  stats: { totalAssemblies: number; totalGroups: number; totalMonths: number; months: string[] };
  selectedTab: ConsortiumType;
}

export function AssembliesStatsCards({ stats, selectedTab }: StatsCardsProps) {
  return (
    <section className="editorial-section mb-6">
      <div className="editorial-section-mark">
        <span className="editorial-counter">01</span>
        <span className="module-eyebrow">Saúde da base · {CONSORTIUM_TYPE_LABELS[selectedTab]}</span>
      </div>
      <h2 className="editorial-headline mb-4">
        Inteligência <em>operacional</em> de assembleias
      </h2>
      <div className="metric-row" style={{ ['--metric-cols' as never]: 4 }}>
        <div className="metric-cell">
          <div className="metric-cell-label"><Database className="h-3 w-3" /> Assembleias</div>
          <div className="metric-cell-value">{stats.totalAssemblies}</div>
          <div className="metric-cell-hint">registros consolidados</div>
        </div>
        <div className="metric-cell">
          <div className="metric-cell-label">{typeIcons[selectedTab]} Grupos</div>
          <div className="metric-cell-value">{stats.totalGroups}</div>
          <div className="metric-cell-hint">cadastrados no segmento</div>
        </div>
        <div className="metric-cell">
          <div className="metric-cell-label"><Calendar className="h-3 w-3" /> Histórico</div>
          <div className="metric-cell-value">{stats.totalMonths}<span className="text-muted-foreground text-base font-normal">/{MAX_MONTHS_TO_KEEP}</span></div>
          <div className="metric-cell-hint">meses retidos</div>
        </div>
        <div className="metric-cell">
          <div className="metric-cell-label"><Calendar className="h-3 w-3" /> Cobertura</div>
          <div className="text-xs text-foreground/80 mt-2 leading-snug line-clamp-3">{stats.months.join(' · ') || 'Nenhum mês disponível'}</div>
        </div>
      </div>
    </section>
  );
}

interface GroupSelectorProps {
  selectedTab: ConsortiumType;
  selectedGroupNumber: string;
  setSelectedGroupNumber: (v: string) => void;
  availableGroups: number[];
}

export function AssembliesGroupSelector({
  selectedGroupNumber, setSelectedGroupNumber, availableGroups,
}: GroupSelectorProps) {
  return (
    <Card className="mb-6">
      <CardHeader><CardTitle className="text-lg">Selecionar Grupo</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-6 flex-1">
            <div className="w-full sm:w-64">
              <Label className="text-xs">Número do Grupo</Label>
              <Select value={selectedGroupNumber} onValueChange={setSelectedGroupNumber}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione um grupo" /></SelectTrigger>
                <SelectContent>
                  {availableGroups.length === 0 ? (
                    <div className="py-2 px-3 text-sm text-muted-foreground">Nenhum grupo cadastrado.</div>
                  ) : (
                    availableGroups.map((groupNum) => (
                      <SelectItem key={groupNum} value={groupNum.toString()}>Grupo {groupNum}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface GroupDetailProps {
  selectedTab: ConsortiumType;
  selectedGroupNumber: string;
  latestValidRecord: AssemblyRecord | null;
}

export function AssembliesGroupDetail({ selectedTab, selectedGroupNumber, latestValidRecord }: GroupDetailProps) {
  if (!selectedGroupNumber || !latestValidRecord) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {typeIcons[selectedTab]}
          Grupo {selectedGroupNumber} - Informações Atuais
        </CardTitle>
        <CardDescription>Base: {formatAssemblyMonthLabel(latestValidRecord.assemblyMonth)} (mês mais recente válido)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="p-card-sm bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Mês da Última Assembleia</span></div>
            <p className="text-xl font-bold capitalize">{formatAssemblyMonthLabel(latestValidRecord.assemblyMonth)}</p>
          </div>
          <div className="p-card-sm bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2"><Calendar className="h-4 w-4 text-primary" /><span className="text-sm text-muted-foreground">Próxima Assembleia</span></div>
            <p className="text-xl font-bold text-primary">{formatExcelDate(latestValidRecord.nextAssemblyDate)}</p>
          </div>
          <div className="p-card-sm bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Vencimento da Parcela</span></div>
            <p className="text-xl font-bold">{formatExcelDate(latestValidRecord.installmentDueDate)}</p>
          </div>
          <div className="p-card-sm bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Número de Participantes</span></div>
            <p className="text-xl font-bold">{latestValidRecord.participants.toLocaleString('pt-BR')}</p>
          </div>
          <div className="p-card-sm bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Prazo Total</span></div>
            <p className="text-xl font-bold">{latestValidRecord.totalTerm} meses</p>
          </div>
          <div className="p-card-sm bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4 text-success" /><span className="text-sm text-muted-foreground">Prazo Remanescente</span></div>
            <p className="text-xl font-bold text-success">{latestValidRecord.remainingTerm} meses</p>
          </div>
        </div>
        <div className="metric-row mt-8" style={{ ['--metric-cols' as never]: 4 }}>
          <div className="metric-cell">
            <div className="metric-cell-label">Faixa de crédito</div>
            <div className="text-sm font-medium text-foreground mt-2">{formatCreditRange(latestValidRecord.creditRange)}</div>
          </div>
          <div className="metric-cell">
            <div className="metric-cell-label">Lance embutido</div>
            <div className="text-sm font-medium text-foreground mt-2">{latestValidRecord.hasEmbeddedBid ? `Até ${latestValidRecord.embeddedBidMaxPercent}%` : 'Não permitido'}</div>
          </div>
          <div className="metric-cell">
            <div className="metric-cell-label">Total contemplados</div>
            <div className="metric-cell-value">{latestValidRecord.totalContemplations}</div>
          </div>
          <div className="metric-cell">
            <div className="metric-cell-label">Última assembleia</div>
            <div className="metric-cell-value">{latestValidRecord.contemplationsLastAssembly}</div>
            <div className="metric-cell-hint">contemplados no mês</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EmptyStatesProps {
  selectedTab: ConsortiumType;
  selectedGroupNumber: string;
  latestValidRecord: AssemblyRecord | null;
  availableGroups: number[];
}

export function AssembliesEmptyStates({
  selectedTab, selectedGroupNumber, latestValidRecord, availableGroups,
}: EmptyStatesProps) {
  if (!selectedGroupNumber && availableGroups.length > 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Selecione um grupo para visualizar as informações operacionais</p>
      </CardContent></Card>
    );
  }

  if (selectedGroupNumber && !latestValidRecord) {
    return (
      <Card><CardContent className="py-12 text-center">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhum registro válido encontrado para o Grupo {selectedGroupNumber}. Todos os registros podem estar marcados como cancelados.</p>
      </CardContent></Card>
    );
  }

  if (availableGroups.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          Nenhum dado de assembleia cadastrado para {CONSORTIUM_TYPE_LABELS[selectedTab]}.
          A atualização mensal é feita pelo time administrativo em Admin → Operações de Assembleias.
        </p>
      </CardContent></Card>
    );
  }

  return null;
}
