import { useState, useMemo } from 'react';
import { type AdminLog } from '@/services/adminLogs';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';
import { useAdminLogs, useAdminUsers } from '@/hooks/useAdminQueries';

const ACTION_LABELS: Record<string, string> = {
  edit_user: '✏️ Editou usuário',
  activate_user: '✅ Ativou usuário',
  deactivate_user: '🚫 Desativou usuário',
  delete_user: '🗑️ Excluiu usuário',
  create_user: '➕ Criou usuário',
};

export function AdminLogs() {
  const { data: logs = [], isLoading: logsLoading } = useAdminLogs();
  const { data: users = [] } = useAdminUsers();
  const [filterAction, setFilterAction] = useState('todos');

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach(u => map.set(u.user_id, u.nome));
    return map;
  }, [users]);

  const filtered = filterAction === 'todos' ? logs : logs.filter(l => l.action === filterAction);
  const uniqueActions = useMemo(() => [...new Set(logs.map(l => l.action))], [logs]);

  if (logsLoading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Carregando logs...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
        <ClipboardList className="h-5 w-5" /> Logs de Auditoria ({filtered.length})
      </h1>

      <div className="flex flex-wrap gap-3">
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="todos">Todas as ações</option>
          {uniqueActions.map(a => (
            <option key={a} value={a}>{ACTION_LABELS[a] ?? a}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Nenhum log encontrado.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(l => (
            <Card key={l.id} className="rounded-xl">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {ACTION_LABELS[l.action] ?? l.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Por: <span className="font-medium text-foreground">{userMap.get(l.admin_user_id) ?? 'Admin'}</span>
                    {l.target_user_id && (
                      <> → <span className="font-medium text-foreground">{userMap.get(l.target_user_id) ?? 'Usuário removido'}</span></>
                    )}
                  </p>
                  {l.details && <p className="text-xs text-muted-foreground mt-0.5">{l.details}</p>}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(l.created_at).toLocaleString('pt-BR')}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
