import { useEffect, useMemo, useState } from 'react';
import {
  useAdminUsers,
  useAdminDailyLogins,
  useAdminActiveUsers,
  useAdminModuleUsage,
  adminKeys,
} from '@/hooks/useAdminQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, CalendarDays, Activity, Bell, X, Ban, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AdminPageHeader } from './AdminPageHeader';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const MODULE_LABELS: Record<string, string> = {
  simulator: 'Simulador', comparator: 'Comparador', investment: 'Investimento',
  advanced: 'Op. Estruturadas', assemblies: 'Assembleias', bids: 'Lances',
  summary: 'Proposta', analysis: 'Análise', help: 'Ajuda',
};

export function AdminDashboard() {
  const { data: users = [] } = useAdminUsers();
  const { data: dailyLogins = [] } = useAdminDailyLogins(7);
  const { data: dailyActive = [] } = useAdminActiveUsers(7);
  const { data: moduleUsageRows = [] } = useAdminModuleUsage(30);
  const [lastSeenAt, setLastSeenAt] = useLocalStorage<string>('admin_last_seen_users', '');

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const totalUsers = users.length;
  const approvedUsers = users.filter(u => u.approved).length;
  const blockedUsers = users.filter(u => !u.approved).length;
  const newUsersWeek = users.filter(u => u.created_at >= sevenDaysAgo).length;
  const totalLogins = dailyLogins.reduce((acc, d) => acc + d.logins, 0);
  const admins = users.filter(u => u.role === 'admin').length;
  const activeUsersWeek = dailyActive.reduce((max, d) => Math.max(max, d.activeUsers), 0); // peak distinct/day

  // Validation failures (Saúde absorvida)
  const validationFailures = useMemo(() => {
    try {
      const raw = localStorage.getItem('system_validation_logs');
      if (!raw) return 0;
      const logs = JSON.parse(raw) as Array<{ totalFailures: number }>;
      return logs.reduce((sum, log) => sum + (log.totalFailures || 0), 0);
    } catch { return 0; }
  }, []);

  const newUsers = useMemo(() => {
    if (!lastSeenAt) return users;
    return users.filter(u => u.created_at > lastSeenAt);
  }, [users, lastSeenAt]);

  const dismissNotification = () => setLastSeenAt(new Date().toISOString());

  // Build full 7-day series (fill missing days with zero)
  const buildSeries = <T extends { day: string }>(rows: T[], key: keyof T) => {
    const map = new Map(rows.map(r => [r.day, r[key] as unknown as number]));
    const out: { date: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      out.push({ date: d.slice(5), value: Number(map.get(d) ?? 0) });
    }
    return out;
  };
  const loginsSeries = useMemo(() => buildSeries(dailyLogins, 'logins').map(r => ({ date: r.date, logins: r.value })), [dailyLogins]);
  const activeSeries = useMemo(() => buildSeries(dailyActive, 'activeUsers').map(r => ({ date: r.date, ativos: r.value })), [dailyActive]);

  const moduleUsage = useMemo(
    () => moduleUsageRows.slice(0, 8).map(r => ({ name: MODULE_LABELS[r.module] ?? r.module, usos: r.usage })),
    [moduleUsageRows],
  );

  const recentUsers = [...users].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);

  const stats = [
    { label: 'Total de Usuários', value: totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Aprovados', value: approvedUsers, icon: UserCheck, color: 'text-primary' },
    { label: 'Desativados', value: blockedUsers, icon: Ban, color: 'text-primary' },
    { label: 'Admins', value: admins, icon: ShieldCheck, color: 'text-primary' },
    { label: 'Novos (7d)', value: newUsersWeek, icon: CalendarDays, color: 'text-primary' },
    { label: 'Sessões (7d)', value: totalLogins, icon: Activity, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Visão Geral"
        subtitle={`Pico de ${activeUsersWeek} usuários ativos por dia nos últimos 7 dias.`}
        invalidateKeys={[adminKeys.all as unknown as unknown[]]}
      />

      {validationFailures > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-semibold">{validationFailures}</span> validações de sistema falharam recentemente.
            </p>
          </CardContent>
        </Card>
      )}

      {newUsers.length > 0 && (() => {
        const first = newUsers[0];
        const rest = newUsers.length - 1;
        const dateLabel = new Date(first.created_at).toLocaleDateString('pt-BR');
        return (
          <div className="flex items-center gap-2 h-10 px-3 rounded-md bg-muted/40 border border-border text-sm">
            <Bell className="h-4 w-4 text-primary shrink-0" />
            <p className="flex-1 min-w-0 truncate text-foreground">
              <span className="font-semibold">{newUsers.length}</span>{' '}
              {newUsers.length === 1 ? 'novo usuário cadastrado' : 'novos usuários cadastrados'}
              {' — '}
              <span className="font-medium">{first.nome}</span>
              {rest > 0 && <span className="text-muted-foreground"> e mais {rest} {rest === 1 ? 'outro' : 'outros'}</span>}
              <span className="text-muted-foreground"> · {dateLabel}</span>
            </p>
            <button
              onClick={dismissNotification}
              className="p-1 rounded hover:bg-muted transition-colors shrink-0"
              title="Dispensar"
              aria-label="Dispensar"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        );
      })()}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className={`p-2 rounded-xl bg-muted ${s.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-caption text-muted-foreground leading-tight">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Usuários ativos por dia (7 dias)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart style={{ background: "transparent" }} data={activeSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="ativos" className="stroke-success" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-caption text-muted-foreground mt-2">
              Distintos com uso real por dia (exclui login/logout). Fonte: agregação server-side.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top módulos (30 dias)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              {moduleUsage.length === 0 ? (
                <p className="text-sm text-muted-foreground pt-8 text-center">Nenhum dado de uso.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart style={{ background: "transparent" }} data={moduleUsage} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" stroke="var(--border)" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={100} />
                    <Tooltip />
                    <Bar dataKey="usos" className="fill-primary" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Usuários recentes</CardTitle></CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuário criado.</p>
          ) : (
            <div className="space-y-2">
              {recentUsers.map(u => (
                <div key={u.id} className="flex flex-col sm:flex-row sm:justify-between text-sm border-b border-border pb-2 gap-0.5">
                  <div className="truncate">
                    <span className="font-medium">{u.nome}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{u.role}</span>
                  </div>
                  <span className="text-muted-foreground text-xs sm:text-sm shrink-0">{new Date(u.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
