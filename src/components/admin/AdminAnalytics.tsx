import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquareText, Target, Calculator, Copy, TrendingUp, ArrowRight, Lightbulb, AlertTriangle, CheckCircle, ArrowDown, Flame, Sparkles, UserPlus, ArrowRightLeft, Eye, BookOpen, FileText, Send, Users, Repeat } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useChartTheme, CHART_COLORS } from '@/utils/chartTheme';
import { useAdminAnalytics, useAdminUsers } from '@/hooks/useAdminQueries';
import type { AnalyticsSummary, FunnelStep } from '@/services/analyticsFunnel';
import { AdminPageHeader } from './AdminPageHeader';
import { formatCurrency } from '@/utils/format';

// ---- Constants ----
const EVENT_LABELS: Record<string, { label: string; icon: typeof MessageSquareText; color: string }> = {
  simulation_generated: { label: 'Simulações Geradas', icon: Calculator, color: CHART_COLORS.blue },
  proposal_tab_viewed: { label: 'Propostas Visualizadas', icon: BookOpen, color: CHART_COLORS.purple },
  proposal_generated: { label: 'Propostas Geradas', icon: Target, color: CHART_COLORS.orange },
  proposal_copied: { label: 'Propostas Copiadas', icon: Copy, color: CHART_COLORS.green },
  pdf_generated: { label: 'PDFs Gerados', icon: FileText, color: CHART_COLORS.gray },
};

const GRANULAR_EVENT_CONFIG: Record<string, { label: string; icon: typeof MessageSquareText; color: string }> = {
  investment_scenario_expanded: { label: 'Cenário Investimento Expandido', icon: Eye, color: CHART_COLORS.purple },
  proposal_tab_viewed: { label: 'Aba Proposta Visualizada', icon: BookOpen, color: CHART_COLORS.blue },
  proposal_copied: { label: 'Proposta Copiada', icon: Copy, color: CHART_COLORS.green },
  objection_copied: { label: 'Objeção Copiada', icon: Copy, color: CHART_COLORS.orange },
  bid_ai_recommendation_generated: { label: 'Recomendação IA de Lance', icon: Sparkles, color: CHART_COLORS.purple },
  bid_scenario_simulated: { label: 'Cenário de Lance Simulado', icon: Calculator, color: CHART_COLORS.blue },
  pipeline_lead_created: { label: 'Lead Criado', icon: UserPlus, color: CHART_COLORS.green },
  pipeline_lead_moved: { label: 'Lead Movido no Pipeline', icon: ArrowRightLeft, color: CHART_COLORS.orange },
};

const PIE_COLORS = [CHART_COLORS.green, CHART_COLORS.orange, CHART_COLORS.blue, CHART_COLORS.purple];

// ---- Insight Types ----
interface Insight {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  metric?: string;
}

interface ActionRecommendation {
  priority: 'alta' | 'media' | 'baixa';
  title: string;
  description: string;
  metric?: string;
}

// ---- Insights Engine ----
function generateInsights(summary: AnalyticsSummary): Insight[] {
  const { funnel, scenarioCounts, typeCounts, totalEvents } = summary;
  const insights: Insight[] = [];
  if (totalEvents === 0) {
    insights.push({ type: 'info', title: 'Sem dados suficientes', description: 'Ainda não há eventos registrados para gerar insights.' });
    return insights;
  }
  for (let i = 1; i < funnel.length; i++) {
    const prev = funnel[i - 1];
    const curr = funnel[i];
    if (prev.count === 0) continue;
    const rawRate = (curr.count / prev.count) * 100;
    const capped = rawRate > 100;
    const rate = Math.min(rawRate, 100);
    const noteSuffix = capped ? ' (inclui períodos anteriores)' : '';
    if (rate < 20) {
      insights.push({ type: 'warning', title: `Queda crítica: ${prev.name} → ${curr.name}`, description: `Apenas ${rate.toFixed(1)}% dos usuários avançam. Este é o maior gargalo do funil.${noteSuffix}`, metric: `${rate.toFixed(1)}%` });
    } else if (rate < 50) {
      insights.push({ type: 'warning', title: `Queda moderada: ${prev.name} → ${curr.name}`, description: `${rate.toFixed(1)}% de conversão entre etapas.${noteSuffix}`, metric: `${rate.toFixed(1)}%` });
    } else if (rate >= 70) {
      insights.push({ type: 'success', title: `Boa conversão: ${prev.name} → ${curr.name}`, description: `${rate.toFixed(1)}% dos usuários avançam. O fluxo está funcionando bem.${noteSuffix}`, metric: `${rate.toFixed(1)}%` });
    }
  }
  const { overallConversionRate } = summary;
  if (overallConversionRate !== null) {
    insights.push({ type: overallConversionRate >= 30 ? 'success' : overallConversionRate >= 10 ? 'info' : 'warning', title: 'Conversão geral do funil', description: `De todos os argumentos gerados, ${overallConversionRate.toFixed(1)}% resultam em mensagem enviada ao cliente.`, metric: `${overallConversionRate.toFixed(1)}%` });
  }
  const scenarioEntries = Object.entries(scenarioCounts).filter(([, c]) => c > 0);
  if (scenarioEntries.length > 1) {
    const sorted = scenarioEntries.sort((a, b) => b[1] - a[1]);
    const total = scenarioEntries.reduce((acc, [, c]) => acc + c, 0);
    const pct = ((sorted[0][1] / total) * 100).toFixed(0);
    insights.push({ type: 'info', title: `Cenário mais popular: ${sorted[0][0]}`, description: `${pct}% das simulações usam "${sorted[0][0]}".`, metric: `${pct}%` });
  }
  const typeEntries = Object.entries(typeCounts).filter(([, c]) => c > 0);
  if (typeEntries.length > 1) {
    const sorted = typeEntries.sort((a, b) => b[1] - a[1]);
    const total = typeEntries.reduce((acc, [, c]) => acc + c, 0);
    const pct = ((sorted[0][1] / total) * 100).toFixed(0);
    insights.push({ type: 'info', title: `Tipo mais engajado: ${sorted[0][0]}`, description: `${pct}% dos argumentos são para "${sorted[0][0]}".`, metric: `${pct}%` });
  }
  // Onda Executiva: cap em 3 — prioridade warning > success > info
  const priority: Record<Insight['type'], number> = { warning: 0, success: 1, info: 2 };
  return insights.sort((a, b) => priority[a.type] - priority[b.type]).slice(0, 3);
}

function generateActionRecommendations(summary: AnalyticsSummary): ActionRecommendation[] {
  const { totalEvents, bottleneck, overallConversionRate, scenarioCounts } = summary;
  const actions: ActionRecommendation[] = [];
  if (totalEvents < 5) return actions;
  if (bottleneck && bottleneck.rate < 50) {
    const { from, to, rate } = bottleneck;
    const msgs: Record<string, { title: string; description: string }> = {
      'argument_generated→argument_copied': { title: 'Simplificar o argumento de venda', description: `Apenas ${rate.toFixed(0)}% dos argumentos são copiados. O sistema usa textos mais curtos automaticamente.` },
      'argument_copied→simulate_from_bids': { title: 'Reforçar o botão de simulação', description: `Apenas ${rate.toFixed(0)}% dos argumentos avançam para simulação.` },
      'simulate_from_bids→simulation_message_generated': { title: 'Facilitar geração de mensagem', description: `Apenas ${rate.toFixed(0)}% das simulações resultam em mensagem ao cliente.` },
    };
    const key = `${from}→${to}`;
    const msg = msgs[key];
    if (msg) actions.push({ priority: rate < 20 ? 'alta' : 'media', ...msg, metric: `${rate.toFixed(0)}%` });
  }
  const entries = Object.entries(scenarioCounts).filter(([, c]) => c > 0);
  if (entries.length >= 2) {
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((acc, [, c]) => acc + c, 0);
    const topPct = (sorted[0][1] / total) * 100;
    if (topPct > 80) actions.push({ priority: 'baixa', title: `Diversificar cenários (${sorted[0][0]} domina)`, description: `${topPct.toFixed(0)}% das simulações usam "${sorted[0][0]}".`, metric: `${topPct.toFixed(0)}%` });
  }
  if (overallConversionRate !== null && overallConversionRate >= 30) actions.push({ priority: 'baixa', title: 'Funil saudável — manter ritmo', description: `Taxa de conversão geral de ${overallConversionRate.toFixed(0)}%.`, metric: `${overallConversionRate.toFixed(0)}%` });
  return actions.sort((a, b) => ({ alta: 0, media: 1, baixa: 2 }[a.priority] - { alta: 0, media: 1, baixa: 2 }[b.priority]));
}

// ---- Granular Events Processing ----
interface GranularEventRow {
  event_name: string;
  label: string;
  count: number;
  details: Record<string, number>;
}

function processGranularEvents(
  events: AnalyticsSummary['events'],
  userFilter: string,
): GranularEventRow[] {
  const granularKeys = Object.keys(GRANULAR_EVENT_CONFIG);
  const map: Record<string, { count: number; details: Record<string, number> }> = {};

  for (const evt of events) {
    if (!granularKeys.includes(evt.event_name)) continue;
    if (userFilter && evt.user_id && evt.user_id !== userFilter) continue;

    if (!map[evt.event_name]) map[evt.event_name] = { count: 0, details: {} };
    map[evt.event_name].count++;

    // Extract detail key from event_data.scenario or event_data.module
    const detail = evt.event_data?.scenario as string || evt.event_data?.module as string || '';
    if (detail) {
      map[evt.event_name].details[detail] = (map[evt.event_name].details[detail] || 0) + 1;
    }
  }

  return granularKeys
    .filter(k => map[k])
    .map(k => ({
      event_name: k,
      label: GRANULAR_EVENT_CONFIG[k].label,
      count: map[k].count,
      details: map[k].details,
    }))
    .sort((a, b) => b.count - a.count);
}

// ---- Component ----
export function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const [userFilter, setUserFilter] = useState('');
  const { data: summary, isLoading } = useAdminAnalytics(days, userFilter);
  const { data: users } = useAdminUsers();
  const chartTheme = useChartTheme();

  const insights = useMemo(() => summary ? generateInsights(summary) : [], [summary]);
  const actionRecommendations = useMemo(() => summary ? generateActionRecommendations(summary) : [], [summary]);
  const scenarioPieData = useMemo(() =>
    summary ? Object.entries(summary.scenarioCounts).filter(([, c]) => (c as number) > 0).map(([name, value]) => ({ name, value })) : [],
    [summary]
  );

  const granularRows = useMemo(() => {
    if (!summary) return [];
    return processGranularEvents(summary.events, userFilter);
  }, [summary, userFilter]);

  const granularBarData = useMemo(() =>
    granularRows.map(r => ({ name: r.label, count: r.count })),
    [granularRows]
  );

  if (isLoading || !summary) {
    return <Card><CardContent className="py-12 text-center text-muted-foreground">Carregando analytics...</CardContent></Card>;
  }

  const { eventCounts, funnel, totalEvents } = summary;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Analytics"
        subtitle={`${totalEvents} eventos registrados no período selecionado.`}
      />
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="text-sm text-muted-foreground">Filtros do funil comercial</div>
        <div className="flex gap-3 items-end">
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Período</Label>
            <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="14">14 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="60">60 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Usuário</Label>
            <Select value={userFilter || '__all__'} onValueChange={v => setUserFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {(users ?? []).map(u => (
                  <SelectItem key={u.user_id} value={u.user_id}>{u.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Insights */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" /> Insights Automáticos</CardTitle>
          <CardDescription>Recomendações baseadas no comportamento dos usuários</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.map((insight, i) => {
            const Icon = insight.type === 'success' ? CheckCircle : insight.type === 'warning' ? AlertTriangle : Lightbulb;
            const color = insight.type === 'success' ? 'text-success' : insight.type === 'warning' ? 'text-warning' : 'text-primary';
            const bg = insight.type === 'success' ? 'bg-success/10 border-success/20' : insight.type === 'warning' ? 'bg-warning/10 border-warning/20' : 'bg-primary/10 border-primary/20';
            return (
              <div key={i} className={`p-4 rounded-lg border ${bg}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{insight.title}</p>
                      {insight.metric && <Badge variant="secondary" className="text-xs font-mono">{insight.metric}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Action Recommendations */}
      {actionRecommendations.length > 0 && (
        <Card className="border-warning/30 bg-gradient-to-br from-warning/5 via-transparent to-transparent">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Flame className="h-5 w-5 text-warning" /> Ação Recomendada Hoje</CardTitle>
            <CardDescription>Sugestões baseadas no maior gargalo atual do funil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionRecommendations.map((action, i) => {
              const priorityColor = action.priority === 'alta' ? 'bg-destructive/10 border-destructive/20' : action.priority === 'media' ? 'bg-warning/10 border-warning/20' : 'bg-muted border-border';
              const priorityLabel = action.priority === 'alta' ? 'Prioridade Alta' : action.priority === 'media' ? 'Prioridade Média' : 'Informativo';
              const priorityBadge: 'destructive' | 'secondary' | 'outline' =
                action.priority === 'alta' ? 'destructive' : action.priority === 'media' ? 'secondary' : 'outline';
              return (
                <div key={i} className={`p-4 rounded-lg border ${priorityColor}`}>
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{action.title}</p>
                    <Badge variant={priorityBadge} className="text-xs shrink-0">{priorityLabel}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                  {action.metric && <p className="text-xs font-mono text-muted-foreground mt-2">Taxa atual: {action.metric}</p>}
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              💡 O sistema ajusta automaticamente a apresentação dos cenários com base nestes dados.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Event count cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(EVENT_LABELS).map(([key, { label, icon: Icon }]) => {
          const count = eventCounts.find(e => e.event_name === key)?.count || 0;
          return (
            <Card key={key} className="bg-card border-border">
              <CardContent className="pt-4 pb-3 px-4 text-center">
                <Icon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Granular Events Detail */}
      {granularRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Eventos Detalhados por Funcionalidade
            </CardTitle>
            <CardDescription>Rastreamento granular de ações específicas dentro dos módulos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bar chart */}
            {granularBarData.length > 0 && (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart style={{ background: "transparent" }} data={granularBarData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                    <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Detail table */}
            <div className="space-y-2">
              {granularRows.map(row => {
                const cfg = GRANULAR_EVENT_CONFIG[row.event_name];
                const Icon = cfg?.icon ?? Target;
                const detailEntries = Object.entries(row.details).sort((a, b) => b[1] - a[1]);
                return (
                  <div key={row.event_name} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{row.label}</p>
                        <Badge variant="secondary" className="font-mono text-xs">{row.count}</Badge>
                      </div>
                      {detailEntries.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {detailEntries.map(([key, count]) => (
                            <span key={key} className="text-caption px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground">
                              {key}: <strong className="text-foreground">{count}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas ricas (Onda 2026-05) — usam dados já existentes em proposals/audit/events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1 — Conversão real da Carteira */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Conversão real da Carteira</CardTitle>
            <CardDescription>Baseado em audit_logs de propostas no período</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div><p className="text-xl font-bold">{summary.carteira.created}</p><p className="text-caption text-muted-foreground">Criadas</p></div>
              <div><p className="text-xl font-bold text-success">{summary.carteira.closed}</p><p className="text-caption text-muted-foreground">Fechadas</p></div>
              <div><p className="text-xl font-bold text-warning">{summary.carteira.lost}</p><p className="text-caption text-muted-foreground">Perdidas</p></div>
              <div><p className="text-xl font-bold text-destructive">{summary.carteira.deleted}</p><p className="text-caption text-muted-foreground">Deletadas</p></div>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
              <span className="text-muted-foreground">Taxa de fechamento</span>
              <Badge variant="secondary" className="font-mono">{summary.carteira.closeRate !== null ? `${summary.carteira.closeRate.toFixed(1)}%` : '—'}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tempo médio até fechar</span>
              <Badge variant="secondary" className="font-mono">{summary.carteira.avgDaysToClose !== null ? `${summary.carteira.avgDaysToClose.toFixed(1)} d` : '—'}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tempo médio até perder</span>
              <Badge variant="secondary" className="font-mono">{summary.carteira.avgDaysToLose !== null ? `${summary.carteira.avgDaysToLose.toFixed(1)} d` : '—'}</Badge>
            </div>
            {Object.keys(summary.carteira.avgTicketByType).length > 0 && (
              <div className="pt-2 border-t border-border space-y-1">
                <p className="text-caption text-muted-foreground">Ticket médio por tipo</p>
                {Object.entries(summary.carteira.avgTicketByType).map(([type, { avg, count }]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{type} <span className="text-caption text-muted-foreground">({count})</span></span>
                    <span className="font-mono">{formatCurrency(avg)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2 — Funil de PDFs */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Funil de PDFs</CardTitle>
            <CardDescription>Geração vs envio efetivo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className="text-xl font-bold">{summary.pdfFunnel.generated}</p><p className="text-caption text-muted-foreground">Gerados</p></div>
              <div><p className="text-xl font-bold text-success">{summary.pdfFunnel.sent}</p><p className="text-caption text-muted-foreground">Enviados</p></div>
              <div><p className="text-xl font-bold">{summary.pdfFunnel.sendRate !== null ? `${summary.pdfFunnel.sendRate.toFixed(1)}%` : '—'}</p><p className="text-caption text-muted-foreground">Taxa envio</p></div>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              <Send className="h-3 w-3 inline mr-1" />
              PDFs enviados pelo botão "Enviar" no PDF Premium. Taxa baixa pode indicar fricção no fluxo de envio.
            </p>
          </CardContent>
        </Card>

        {/* Card 3 — Engajamento por módulo */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Engajamento por Módulo</CardTitle>
            <CardDescription>Top 5 módulos acessados (usuários únicos)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.moduleEngagement.top.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sem dados de acesso por módulo no período.</p>
            ) : (
              <>
                {summary.moduleEngagement.top.map(m => (
                  <div key={m.module} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{m.module}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-xs">{m.uniqueUsers} usr</Badge>
                      <span className="text-caption text-muted-foreground font-mono">{m.total}</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">Média de módulos por usuário</span>
                  <Badge variant="secondary" className="font-mono">{summary.moduleEngagement.avgModulesPerUser !== null ? summary.moduleEngagement.avgModulesPerUser.toFixed(1) : '—'}</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 4 — Retenção semanal */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Repeat className="h-4 w-4 text-primary" /> Retenção</CardTitle>
            <CardDescription>Logins distribuídos em semanas ISO da janela</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className="text-xl font-bold text-success">{summary.retention.retained}</p><p className="text-caption text-muted-foreground">Retidos (2+ sem)</p></div>
              <div><p className="text-xl font-bold text-warning">{summary.retention.atRisk}</p><p className="text-caption text-muted-foreground">Em risco (1 sem)</p></div>
              <div><p className="text-xl font-bold">{summary.retention.totalActiveUsers}</p><p className="text-caption text-muted-foreground">Ativos totais</p></div>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              Usuário "retido" = logou em pelo menos 2 semanas distintas dentro do período selecionado.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel + Scenario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><ArrowDown className="h-5 w-5" /> Funil de Conversão</CardTitle>
            <CardDescription>Taxa de avanço entre cada etapa do fluxo comercial</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnel.map((step, i) => {
                const prevCount = i > 0 ? funnel[i - 1].count : step.count;
                const rawRate = prevCount > 0 ? (step.count / prevCount) * 100 : 100;
                // Cap visual em 100%: a etapa `deal_closed` vem de audit_logs
                // e pode captar fechamentos de propostas criadas antes da
                // janela selecionada, gerando taxas > 100% sem essa proteção.
                const rateNum = Math.min(rawRate, 100);
                const overflow = rawRate > 100;
                const rate = prevCount > 0 ? rateNum.toFixed(1) : '—';
                const width = funnel[0].count > 0 ? Math.max(10, Math.min(100, (step.count / funnel[0].count) * 100)) : 10;
                const rateColor = i === 0 ? '' : rateNum >= 70 ? 'text-success' : rateNum >= 40 ? 'text-warning' : 'text-destructive';
                return (
                  <div key={step.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{step.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{step.count}</span>
                        {i > 0 && <Badge variant="secondary" className={`text-xs ${rateColor}`}>{rate}%</Badge>}
                      </div>
                    </div>
                    <div className="h-6 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/70 rounded-full transition-[colors,box-shadow,transform] duration-500" style={{ width: `${width}%` }} />
                    </div>
                    {overflow && (
                      <p className="text-[11px] text-muted-foreground mt-1 italic">
                        Inclui negócios cujas propostas foram enviadas em períodos anteriores.
                      </p>
                    )}
                    {i < funnel.length - 1 && (
                      <div className="flex justify-center py-1">
                        <ArrowRight className="h-3 w-3 text-muted-foreground rotate-90" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5" /> Cenários Simulados</CardTitle>
            <CardDescription>Distribuição dos cenários escolhidos pelos usuários</CardDescription>
          </CardHeader>
          <CardContent>
            {scenarioPieData.length > 0 ? (
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart style={{ background: "transparent" }}>
                    <Pie data={scenarioPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {scenarioPieData.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum cenário registrado ainda.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
