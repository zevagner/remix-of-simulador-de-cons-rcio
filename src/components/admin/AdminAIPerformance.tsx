/**
 * AdminAIPerformance — Dashboard de performance das edges de IA.
 *
 * Lê eventos `ai_ttft`, `ai_total_time`, `ai_abandon`, `ai_slow_indicator_shown`
 * de `analytics_events` e agrega por edge (últimos 7d) com:
 *   - p50/p95 TTFT
 *   - tempo total médio
 *   - taxa de abandono (%)
 *   - % de casos lentos (>2s)
 *   - tendência (7d atual vs 7d anteriores)
 *   - alerta visual (crítico/atenção/ok)
 *   - insight direto por edge
 *
 * Ranking automático: mais lenta → mais rápida (p95 desc).
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, Minus, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

type EventName = 'ai_ttft' | 'ai_total_time' | 'ai_abandon' | 'ai_slow_indicator_shown';

interface PerfEvent {
  created_at: string;
  event_name: EventName;
  event_data: { edge?: string; ttft?: number; total?: number; reason?: string } | null;
}

const EDGE_LABELS: Record<string, string> = {
  'phase-action': 'Ação por Fase (Funil)',
  'trigger-script': 'Gatilhos Mentais',
  'sales-script': 'Argumento Contextual',
  'investment-storytelling': 'Storytelling Cenários',
  'niche-storytelling': 'Storytelling Nichos',
  'sales-response': 'Respostas Pós-Proposta',
};

const TRACKED_EDGES = Object.keys(EDGE_LABELS);

interface EdgeStats {
  edge: string;
  label: string;
  ttftP50: number | null;
  ttftP95: number | null;
  avgTotal: number | null;
  abandonRate: number;
  slowRate: number;
  totalCalls: number;
  abandons: number;
  level: 'critical' | 'warning' | 'ok' | 'no-data';
  insight: string;
  trend: 'up' | 'down' | 'stable' | 'no-data';
  trendDelta: number; // ms (current p95 - previous p95)
}

function percentile(arr: number[], p: number): number | null {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p));
  return sorted[idx];
}

function avg(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function formatMs(v: number | null): string {
  if (v == null) return '—';
  if (v < 1000) return `${Math.round(v)}ms`;
  return `${(v / 1000).toFixed(2)}s`;
}

function classify(ttftP95: number | null, abandonRate: number): EdgeStats['level'] {
  if (ttftP95 == null) return 'no-data';
  if (ttftP95 > 2500 || abandonRate > 20) return 'critical';
  if (ttftP95 > 1500 || abandonRate > 10) return 'warning';
  return 'ok';
}

function buildInsight(s: { ttftP95: number | null; abandonRate: number; slowRate: number; totalCalls: number }): string {
  if (s.totalCalls === 0) return 'Sem chamadas no período. Aguarde uso para gerar diagnóstico.';
  const issues: string[] = [];
  if (s.ttftP95 != null && s.ttftP95 > 2500) issues.push(`TTFT alto (${formatMs(s.ttftP95)} no p95)`);
  else if (s.ttftP95 != null && s.ttftP95 > 1500) issues.push(`TTFT acima do ideal (${formatMs(s.ttftP95)} no p95)`);
  if (s.abandonRate > 20) issues.push(`abandono crítico (${s.abandonRate.toFixed(1)}%)`);
  else if (s.abandonRate > 10) issues.push(`abandono alto (${s.abandonRate.toFixed(1)}%)`);
  if (s.slowRate > 30) issues.push(`${s.slowRate.toFixed(0)}% das chamadas demoram >2s`);

  if (issues.length === 0) return 'Performance dentro do esperado.';
  return `Essa etapa está mais lenta que o ideal: ${issues.join(', ')}.`;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low' | 'none';
  actions: string[];
}

/**
 * Regras determinísticas de recomendação por edge.
 * Ordenadas por severidade — primeira regra que casar define prioridade.
 * Sempre retorna exatamente 1 ação (mensagem coerente).
 */
export function buildRecommendation(s: {
  ttftP95: number | null;
  avgTotal: number | null;
  abandonRate: number;
  slowRate: number;
  totalCalls: number;
}): Recommendation {
  if (s.totalCalls === 0) {
    return { priority: 'none', actions: ['Aguardando dados para análise.'] };
  }

  const ttftCritical = s.ttftP95 != null && s.ttftP95 > 2500;
  const abandonCritical = s.abandonRate > 20;

  // 🔴 Alta prioridade — uma única mensagem coerente, mesmo com múltiplos sintomas
  if (ttftCritical && abandonCritical) {
    return {
      priority: 'high',
      actions: ['TTFT crítico está causando abandono. Reduzir prompt ou trocar modelo por versão mais rápida.'],
    };
  }
  if (abandonCritical) {
    return {
      priority: 'high',
      actions: ['Usuários estão desistindo. Priorizar tempo percebido (streaming ou pré-resposta).'],
    };
  }
  if (ttftCritical) {
    return {
      priority: 'high',
      actions: ['Reduzir prompt ou trocar modelo de IA para versão mais rápida.'],
    };
  }

  // 🟡 Média prioridade — escolhe a causa raiz mais provável (uma única mensagem)
  const slowHigh = s.slowRate > 30;
  const totalHigh = s.avgTotal != null && s.avgTotal > 4000;
  const ttftWarn = s.ttftP95 != null && s.ttftP95 > 1500;
  const abandonWarn = s.abandonRate > 10;

  if (slowHigh) {
    return {
      priority: 'medium',
      actions: ['Alta incidência de respostas lentas. Avaliar cache ou simplificação do contexto enviado.'],
    };
  }
  if (totalHigh && !ttftWarn) {
    return {
      priority: 'medium',
      actions: ['Resposta começa rápido, mas demora a concluir. Avaliar tamanho da resposta gerada.'],
    };
  }
  if (ttftWarn) {
    return {
      priority: 'medium',
      actions: ['TTFT acima do ideal. Reduzir prompt ou aplicar pré-warming na edge.'],
    };
  }
  if (abandonWarn) {
    return {
      priority: 'medium',
      actions: ['Abandono moderado. Reforçar feedback visual durante a espera.'],
    };
  }

  // 🟢 Tudo ok
  return { priority: 'low', actions: ['Nenhuma ação necessária no momento.'] };
}

function aggregateEdge(edge: string, events: PerfEvent[]): Omit<EdgeStats, 'trend' | 'trendDelta'> {
  const ttfts: number[] = [];
  const totals: number[] = [];
  let abandons = 0;
  let slows = 0;
  let completedOrAbandoned = 0;

  for (const ev of events) {
    if (ev.event_data?.edge !== edge) continue;
    switch (ev.event_name) {
      case 'ai_ttft':
        if (typeof ev.event_data.ttft === 'number') ttfts.push(ev.event_data.ttft);
        break;
      case 'ai_total_time':
        if (typeof ev.event_data.total === 'number') totals.push(ev.event_data.total);
        completedOrAbandoned++;
        break;
      case 'ai_abandon':
        abandons++;
        completedOrAbandoned++;
        break;
      case 'ai_slow_indicator_shown':
        slows++;
        break;
    }
  }

  const totalCalls = completedOrAbandoned;
  const abandonRate = totalCalls > 0 ? (abandons / totalCalls) * 100 : 0;
  // slows como % das chamadas que produziram TTFT (ou abandonaram antes dele)
  const slowDenom = ttfts.length + abandons;
  const slowRate = slowDenom > 0 ? (slows / slowDenom) * 100 : 0;
  const ttftP95 = percentile(ttfts, 0.95);

  return {
    edge,
    label: EDGE_LABELS[edge] ?? edge,
    ttftP50: percentile(ttfts, 0.5),
    ttftP95,
    avgTotal: avg(totals),
    abandonRate,
    slowRate,
    totalCalls,
    abandons,
    level: classify(ttftP95, abandonRate),
    insight: buildInsight({ ttftP95, abandonRate, slowRate, totalCalls }),
  };
}

export function AdminAIPerformance() {
  const since14 = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString();
  }, []);
  const since7 = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }, []);

  // Pega últimos 14 dias para comparar 7d atual vs 7d anteriores (tendência)
  const { data: allEvents = [], isLoading } = useQuery<PerfEvent[]>({
    queryKey: ['admin-ai-performance', since14],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('created_at, event_name, event_data')
        .in('event_name', ['ai_ttft', 'ai_total_time', 'ai_abandon', 'ai_slow_indicator_shown'])
        .gte('created_at', since14)
        .order('created_at', { ascending: false })
        .limit(10000);
      if (error) throw error;
      return (data ?? []) as PerfEvent[];
    },
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  // Cache hits/miss (últimos 7d) — ROI das otimizações
  const { data: cacheEvents = [] } = useQuery({
    queryKey: ['admin-ai-cache', since7],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_name, event_data')
        .in('event_name', [
          'ai_cache_hit',
          'investment_storytelling_cache_hit',
          'investment_storytelling_cache_miss',
          'bid_recommendation_hybrid_local',
        ])
        .gte('created_at', since7)
        .limit(10000);
      if (error) throw error;
      return data ?? [];
    },
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const cacheSummary = useMemo(() => {
    let hits = 0;
    let miss = 0;
    let hybrid = 0;
    for (const e of cacheEvents) {
      if (e.event_name === 'ai_cache_hit' || e.event_name === 'investment_storytelling_cache_hit') hits++;
      else if (e.event_name === 'investment_storytelling_cache_miss') miss++;
      else if (e.event_name === 'bid_recommendation_hybrid_local') hybrid++;
    }
    const total = hits + miss;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;
    return { hits, miss, hybrid, hitRate };
  }, [cacheEvents]);

  const stats = useMemo<EdgeStats[]>(() => {
    if (allEvents.length === 0) {
      return TRACKED_EDGES.map(edge => ({
        ...aggregateEdge(edge, []),
        trend: 'no-data' as const,
        trendDelta: 0,
      }));
    }
    const current = allEvents.filter(e => e.created_at >= since7);
    const previous = allEvents.filter(e => e.created_at < since7);

    return TRACKED_EDGES.map(edge => {
      const cur = aggregateEdge(edge, current);
      const prev = aggregateEdge(edge, previous);
      // Tendência baseada em p95 TTFT
      let trend: EdgeStats['trend'] = 'no-data';
      let trendDelta = 0;
      if (cur.ttftP95 != null && prev.ttftP95 != null) {
        trendDelta = cur.ttftP95 - prev.ttftP95;
        if (Math.abs(trendDelta) < 100) trend = 'stable';
        else if (trendDelta < 0) trend = 'down'; // melhorou
        else trend = 'up'; // piorou
      }
      return { ...cur, trend, trendDelta };
    }).sort((a, b) => {
      // Mais lenta → mais rápida (p95 desc). No-data por último.
      if (a.ttftP95 == null && b.ttftP95 == null) return 0;
      if (a.ttftP95 == null) return 1;
      if (b.ttftP95 == null) return -1;
      return b.ttftP95 - a.ttftP95;
    });
  }, [allEvents, since7]);

  const summary = useMemo(() => {
    const withData = stats.filter(s => s.totalCalls > 0);
    const totalCalls = withData.reduce((s, x) => s + x.totalCalls, 0);
    const critical = stats.filter(s => s.level === 'critical').length;
    const warning = stats.filter(s => s.level === 'warning').length;
    const ok = stats.filter(s => s.level === 'ok').length;
    return { totalCalls, critical, warning, ok };
  }, [stats]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Performance IA
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Últimos 7 dias · {summary.totalCalls.toLocaleString('pt-BR')} chamadas medidas
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 hover:bg-red-500/15">
            🔴 {summary.critical} crítico{summary.critical !== 1 && 's'}
          </Badge>
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/15">
            🟡 {summary.warning} atenção
          </Badge>
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15">
            🟢 {summary.ok} ok
          </Badge>
        </div>
      </div>

      <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
        <p><strong>TTFT</strong> = tempo até a primeira resposta da IA. <strong>P50</strong> = mediana, <strong>P95</strong> = 95% das chamadas ficam abaixo disso.</p>
        <p><strong>Crítico:</strong> p95 &gt; 2.5s ou abandono &gt; 20%. <strong>Atenção:</strong> p95 entre 1.5s e 2.5s ou abandono entre 10% e 20%.</p>
      </div>

      {/* Cache ROI — economia das otimizações */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            Cache & Otimizações (7d)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric label="Cache hits" value={cacheSummary.hits.toLocaleString('pt-BR')} highlight={cacheSummary.hits > 0} />
            <Metric label="Cache miss" value={cacheSummary.miss.toLocaleString('pt-BR')} />
            <Metric label="Hit rate" value={cacheSummary.hits + cacheSummary.miss > 0 ? `${cacheSummary.hitRate.toFixed(1)}%` : '—'} highlight={cacheSummary.hitRate > 30} />
            <Metric label="Bid híbrido (local)" value={cacheSummary.hybrid.toLocaleString('pt-BR')} />
          </div>
          <p className="text-caption text-muted-foreground mt-2">
            Hits = chamadas evitadas (economia direta de tokens). Híbrido local = parcela determinística calculada antes da IA.
          </p>
        </CardContent>
      </Card>

      {summary.totalCalls === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum evento de performance registrado ainda nos últimos 14 dias.
            <br />
            Os dados começam a aparecer assim que usuários acionarem qualquer IA.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {stats.map(s => (
          <EdgeCard key={s.edge} stats={s} />
        ))}
      </div>
    </div>
  );
}

function EdgeCard({ stats: s }: { stats: EdgeStats }) {
  const levelMap = {
    critical: { color: 'border-red-500/40 bg-red-500/5', icon: <AlertTriangle className="h-4 w-4 text-red-600" />, label: '🔴 Crítico' },
    warning:  { color: 'border-amber-500/40 bg-amber-500/5', icon: <AlertTriangle className="h-4 w-4 text-amber-600" />, label: '🟡 Atenção' },
    ok:       { color: 'border-emerald-500/40 bg-emerald-500/5', icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />, label: '🟢 OK' },
    'no-data':{ color: 'border-border bg-muted/20', icon: <Minus className="h-4 w-4 text-muted-foreground" />, label: 'Sem dados' },
  };
  const lv = levelMap[s.level];

  const trendMap = {
    up:    { icon: <TrendingUp className="h-3.5 w-3.5 text-red-600" />, label: 'piorando', cls: 'text-red-600' },
    down:  { icon: <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />, label: 'melhorando', cls: 'text-emerald-600' },
    stable:{ icon: <Minus className="h-3.5 w-3.5 text-muted-foreground" />, label: 'estável', cls: 'text-muted-foreground' },
    'no-data': { icon: null, label: '', cls: '' },
  };
  const tr = trendMap[s.trend];

  return (
    <Card className={cn('border-l-4 transition-[colors,box-shadow,transform]', lv.color)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {lv.icon}
            <CardTitle className="text-base">{s.label}</CardTitle>
            <code className="text-caption text-muted-foreground font-mono">{s.edge}</code>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-caption">{lv.label}</Badge>
            {s.trend !== 'no-data' && (
              <span className={cn('flex items-center gap-1 text-caption', tr.cls)}>
                {tr.icon} {tr.label}
                {s.trend !== 'stable' && <span>({s.trendDelta > 0 ? '+' : ''}{Math.round(s.trendDelta)}ms)</span>}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Metric label="TTFT p50" value={formatMs(s.ttftP50)} />
          <Metric label="TTFT p95" value={formatMs(s.ttftP95)} highlight={s.level === 'critical' || s.level === 'warning'} />
          <Metric label="Tempo total médio" value={formatMs(s.avgTotal)} />
          <Metric label="Abandono" value={s.totalCalls > 0 ? `${s.abandonRate.toFixed(1)}%` : '—'} highlight={s.abandonRate > 10} />
          <Metric label="% lentos (>2s)" value={s.totalCalls > 0 ? `${s.slowRate.toFixed(0)}%` : '—'} />
        </div>

        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Diagnóstico:</span> {s.insight}
        </p>

        <RecommendationBlock stats={s} />

        <p className="text-caption text-muted-foreground">
          {s.totalCalls.toLocaleString('pt-BR')} chamadas · {s.abandons} abandonos no período.
        </p>
      </CardContent>
    </Card>
  );
}

function RecommendationBlock({ stats: s }: { stats: EdgeStats }) {
  const rec = useMemo(
    () => buildRecommendation({
      ttftP95: s.ttftP95,
      avgTotal: s.avgTotal,
      abandonRate: s.abandonRate,
      slowRate: s.slowRate,
      totalCalls: s.totalCalls,
    }),
    [s.ttftP95, s.avgTotal, s.abandonRate, s.slowRate, s.totalCalls],
  );

  const priorityMap = {
    high:   { label: 'Prioridade: Alta',   cls: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30' },
    medium: { label: 'Prioridade: Média',  cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' },
    low:    { label: 'Prioridade: Baixa',  cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
    none:   { label: 'Sem prioridade',     cls: 'bg-muted text-muted-foreground border-border' },
  };
  const p = priorityMap[rec.priority];

  return (
    <div className="rounded-md border border-border/60 bg-background/60 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Lightbulb className="h-3.5 w-3.5 text-primary" />
          Ação recomendada
        </div>
        <Badge variant="outline" className={cn('text-caption', p.cls)}>{p.label}</Badge>
      </div>
      <ul className="space-y-1">
        {rec.actions.map((a, i) => (
          <li key={i} className="text-xs text-foreground/90 leading-snug flex gap-1.5">
            <span className="text-muted-foreground">→</span>
            <span>{a}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-caption uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('text-base font-semibold tabular-nums', highlight && 'text-amber-700 dark:text-amber-400')}>
        {value}
      </p>
    </div>
  );
}
