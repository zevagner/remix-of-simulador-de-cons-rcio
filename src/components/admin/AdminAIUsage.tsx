import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Bot, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Period = '7d' | '30d' | '90d';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
];

const MODULE_LABELS: Record<string, string> = {
  'generate-proposal': 'Proposta IA',
  'sales-copilot': 'Copiloto de Vendas',
  'sales-response': 'Respostas IA',
};

function periodDays(p: Period): number {
  return p === '7d' ? 7 : p === '30d' ? 30 : 90;
}

interface AIEvent {
  created_at: string;
  user_id: string;
  event_data: { module?: string } | null;
}

export function AdminAIUsage() {
  const [period, setPeriod] = useState<Period>('30d');

  const since = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - periodDays(period));
    return d.toISOString();
  }, [period]);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['admin-ai-usage', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('created_at, user_id, event_data')
        .eq('event_name', 'ai_call')
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .range(0, 20000);
      if (error) throw error;
      return (data ?? []) as AIEvent[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-profiles-for-ai'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, nome');
      return data ?? [];
    },
  });

  const profileMap = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach((p) => m.set(p.user_id, p.nome));
    return m;
  }, [profiles]);

  // === Derived data ===

  const totalCalls = events.length;

  const byModule = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => {
      const mod = (e.event_data as { module?: string })?.module ?? 'unknown';
      map.set(mod, (map.get(mod) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([module, count]) => ({ module, count, pct: totalCalls ? ((count / totalCalls) * 100).toFixed(1) : '0' }))
      .sort((a, b) => b.count - a.count);
  }, [events, totalCalls]);

  const byUser = useMemo(() => {
    const map = new Map<string, { count: number; modules: Map<string, number> }>();
    events.forEach((e) => {
      const mod = (e.event_data as { module?: string })?.module ?? 'unknown';
      if (!map.has(e.user_id)) map.set(e.user_id, { count: 0, modules: new Map() });
      const u = map.get(e.user_id)!;
      u.count++;
      u.modules.set(mod, (u.modules.get(mod) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([userId, { count, modules }]) => {
        let topMod = '';
        let topCount = 0;
        modules.forEach((c, m) => { if (c > topCount) { topCount = c; topMod = m; } });
        return { userId, count, topModule: topMod, name: profileMap.get(userId) ?? userId.slice(0, 8) };
      })
      .sort((a, b) => b.count - a.count);
  }, [events, profileMap]);

  const avgPerUser = byUser.length > 0 ? totalCalls / byUser.length : 0;
  const top10 = byUser.slice(0, 10);

  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => {
      const day = e.created_at.slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Uso de IA
        </h2>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                period === opt.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalCalls}</p>
              <p className="text-xs text-muted-foreground">Chamadas no período</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{byModule.length}</p>
              <p className="text-xs text-muted-foreground">Funções utilizadas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{byUser.length}</p>
              <p className="text-xs text-muted-foreground">Usuários ativos em IA</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Volume diário de chamadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma chamada de IA registrada no período.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart style={{ background: "transparent" }} data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" stroke="var(--border)" />
                <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} tick={{ fill: "var(--muted-foreground)" }} />
                <YAxis  allowDecimals={false} tick={{ fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Chamadas" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* By function table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Chamadas por função</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Função</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Total</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {byModule.map((row) => (
                  <tr key={row.module} className="border-b border-border/50">
                    <td className="py-2 text-foreground">{MODULE_LABELS[row.module] ?? row.module}</td>
                    <td className="py-2 text-right font-medium text-foreground">{row.count}</td>
                    <td className="py-2 text-right text-muted-foreground">{row.pct}%</td>
                  </tr>
                ))}
                {byModule.length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">Sem dados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* By user table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Chamadas por usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Usuário</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Total</th>
                  <th className="text-left py-2 pl-4 text-muted-foreground font-medium">Função mais usada</th>
                </tr>
              </thead>
              <tbody>
                {byUser.map((row) => (
                  <tr key={row.userId} className="border-b border-border/50">
                    <td className="py-2 text-foreground">{row.name}</td>
                    <td className="py-2 text-right font-medium text-foreground">{row.count}</td>
                    <td className="py-2 pl-4 text-muted-foreground">{MODULE_LABELS[row.topModule] ?? row.topModule}</td>
                  </tr>
                ))}
                {byUser.length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">Sem dados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top 10 ranking */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">🏆 Top 10 — Ranking de uso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">#</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Usuário</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Chamadas</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">vs Média</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((row, i) => {
                  const ratio = avgPerUser > 0 ? row.count / avgPerUser : 0;
                  const isHighUsage = ratio > 2;
                  return (
                    <tr key={row.userId} className={cn('border-b border-border/50', isHighUsage && 'bg-yellow-500/10')}>
                      <td className="py-2 text-foreground font-medium">{i + 1}</td>
                      <td className="py-2 text-foreground">{row.name}</td>
                      <td className="py-2 text-right font-medium text-foreground">{row.count}</td>
                      <td className={cn('py-2 text-right', isHighUsage ? 'text-yellow-600 dark:text-yellow-400 font-semibold' : 'text-muted-foreground')}>
                        {ratio.toFixed(1)}x
                      </td>
                    </tr>
                  );
                })}
                {top10.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">Sem dados</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {avgPerUser > 0 && (
            <p className="text-caption text-muted-foreground mt-2">
              Média: {avgPerUser.toFixed(1)} chamadas/usuário. Destaque em amarelo = uso &gt; 2x a média.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
