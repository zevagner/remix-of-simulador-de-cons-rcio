import { useMemo } from 'react';
import { Users, UserCheck, Ban, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminUsers, useAccessLogs, type AccessEvent } from '@/hooks/useAdminQueries';

export function AdminStats() {
  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const { data: logs = [], isLoading: logsLoading } = useAccessLogs();

  const dailyAccess = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      days[d] = 0;
    }
    logs.filter(l => l.event_name === 'session_login').forEach(l => {
      const d = l.created_at.slice(0, 10);
      if (d in days) days[d]++;
    });
    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [logs]);

  const moduleUsage = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.filter(l => l.event_name === 'module_access').forEach(l => {
      const mod = (l.event_data?.module as string | undefined) ?? 'unknown';
      counts[mod] = (counts[mod] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [logs]);

  const activeUserStats = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(l => { counts[l.user_id] = (counts[l.user_id] || 0) + 1; });
    const userMap = new Map(users.map(u => [u.user_id, u.nome]));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ nome: userMap.get(id) ?? `Usuário ${id.slice(0, 8)}`, count }));
  }, [logs, users]);

  if (usersLoading || logsLoading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Carregando estatísticas...</p>;
  }

  const maxDaily = Math.max(...dailyAccess.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Estatísticas de Uso</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total de Usuários', value: users.length, icon: Users, color: 'text-primary' },
          { label: 'Ativos', value: users.filter(u => u.approved).length, icon: UserCheck, color: 'text-primary' },
          { label: 'Bloqueados', value: users.filter(u => !u.approved).length, icon: Ban, color: 'text-primary' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: ShieldCheck, color: 'text-primary' },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Acessos por Dia (14 dias)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex items-end gap-1 h-40 min-w-[400px]">
              {dailyAccess.map(d => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-caption text-muted-foreground">{d.count}</span>
                  <div
                    className="w-full bg-primary/80 rounded-t-sm min-h-[2px] transition-[colors,box-shadow,transform]"
                    style={{ height: `${(d.count / maxDaily) * 100}%` }}
                  />
                  <span className="text-caption text-muted-foreground rotate-[-45deg] origin-top-left whitespace-nowrap">
                    {d.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Módulos Mais Usados</CardTitle></CardHeader>
          <CardContent>
            {moduleUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum dado de uso de módulo.</p>
            ) : (
              <div className="space-y-3">
                {moduleUsage.map(([mod, count]) => {
                  const max = moduleUsage[0][1];
                  return (
                    <div key={mod}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium capitalize">{mod}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Usuários Mais Ativos</CardTitle></CardHeader>
          <CardContent>
            {activeUserStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum dado de atividade.</p>
            ) : (
              <div className="space-y-2">
                {activeUserStats.map((u, i) => (
                  <div key={i} className="flex justify-between text-sm border-b border-border pb-2">
                    <span className="font-medium">{u.nome}</span>
                    <span className="text-muted-foreground">{u.count} ações</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
