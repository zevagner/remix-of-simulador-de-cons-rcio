import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminPageHeader } from './AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShieldAlert, CheckCircle2, Filter } from 'lucide-react';
import { adminKeys } from '@/hooks/useAdminQueries';
import { toast } from '@/components/ui/use-toast';

export interface SecurityAlertRow {
  id: string;
  user_id: string;
  alert_type: string;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  reviewed: boolean;
  // joined via separate lookup
  user_email?: string | null;
  user_name?: string | null;
}

const ALERT_TYPE_LABEL: Record<string, string> = {
  unauthorized_admin_access: 'Acesso admin não autorizado',
  sensitive_function_call: 'Chamada de função sensível',
  high_volume_activity: 'Volume anormal de eventos',
  external_domain_activity: 'Atividade de domínio externo',
};

function labelFor(t: string): string {
  return ALERT_TYPE_LABEL[t] ?? t;
}

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR');
  } catch {
    return iso;
  }
}

async function fetchSecurityAlerts(): Promise<SecurityAlertRow[]> {
  // Tabela ainda não está nos tipos gerados; cast pontual.
  const client = supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        order: (col: string, opts: { ascending: boolean }) => {
          order: (col: string, opts: { ascending: boolean }) => {
            limit: (n: number) => Promise<{ data: SecurityAlertRow[] | null; error: unknown }>;
          };
        };
      };
    };
  };
  const { data, error } = await client
    .from('security_alerts')
    .select('id, user_id, alert_type, description, metadata, created_at, reviewed')
    .order('reviewed', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  const rows = (data ?? []) as SecurityAlertRow[];

  // Hidrata nome/email
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  if (userIds.length === 0) return rows;
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, nome, email')
    .in('user_id', userIds);
  const map = new Map<string, { nome: string | null; email: string | null }>();
  (profiles ?? []).forEach((p) =>
    map.set(p.user_id, { nome: p.nome ?? null, email: p.email ?? null }),
  );
  return rows.map((r) => ({
    ...r,
    user_email: map.get(r.user_id)?.email ?? null,
    user_name: map.get(r.user_id)?.nome ?? null,
  }));
}

export function useSecurityAlerts() {
  return useQuery<SecurityAlertRow[]>({
    queryKey: adminKeys.securityAlerts(),
    queryFn: fetchSecurityAlerts,
    staleTime: 30_000,
  });
}

export function useUnreviewedAlertsCount(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminKeys.securityAlertsCount(),
    queryFn: async () => {
      const client = supabase as unknown as {
        from: (t: string) => {
          select: (
            cols: string,
            opts: { count: 'exact'; head: true },
          ) => {
            eq: (
              col: string,
              v: boolean,
            ) => Promise<{ count: number | null; error: unknown }>;
          };
        };
      };
      const { count, error } = await client
        .from('security_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('reviewed', false);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: opts?.enabled ?? true,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

function useMarkReviewed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const client = supabase as unknown as {
        from: (t: string) => {
          update: (v: { reviewed: boolean }) => {
            eq: (col: string, v: string) => Promise<{ error: unknown }>;
          };
        };
      };
      const { error } = await client
        .from('security_alerts')
        .update({ reviewed: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.securityAlerts() });
      qc.invalidateQueries({ queryKey: adminKeys.securityAlertsCount() });
      toast({ title: 'Alerta marcado como revisado' });
    },
    onError: () => toast({ title: 'Falha ao marcar alerta', variant: 'destructive' }),
  });
}

export function SecurityAlertsPanel() {
  const { data: alerts = [], isLoading } = useSecurityAlerts();
  const markReviewed = useMarkReviewed();
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const types = useMemo(() => {
    const set = new Set<string>();
    alerts.forEach((a) => set.add(a.alert_type));
    return Array.from(set);
  }, [alerts]);

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return alerts;
    return alerts.filter((a) => a.alert_type === typeFilter);
  }, [alerts, typeFilter]);

  const last24h = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return alerts.filter((a) => new Date(a.created_at).getTime() >= cutoff).length;
  }, [alerts]);

  const unreviewed = filtered.filter((a) => !a.reviewed);
  const reviewed = filtered.filter((a) => a.reviewed);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Alertas de segurança"
        subtitle="Monitore comportamento suspeito e revise alertas"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Não revisados</p>
          <p className="text-2xl font-bold text-destructive">{unreviewed.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Últimas 24h</p>
          <p className="text-2xl font-bold">{last24h}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total carregado</p>
          <p className="text-2xl font-bold">{alerts.length}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {labelFor(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Carregando alertas…</p>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <ShieldAlert className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum alerta encontrado.</p>
        </div>
      )}

      {unreviewed.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-2">
            Não revisados ({unreviewed.length})
          </h3>
          <ul className="space-y-2">
            {unreviewed.map((a) => (
              <AlertCard
                key={a.id}
                alert={a}
                onReview={() => markReviewed.mutate(a.id)}
                pending={markReviewed.isPending}
              />
            ))}
          </ul>
        </section>
      )}

      {reviewed.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
            Revisados ({reviewed.length})
          </h3>
          <ul className="space-y-2">
            {reviewed.map((a) => (
              <AlertCard key={a.id} alert={a} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function AlertCard({
  alert,
  onReview,
  pending,
}: {
  alert: SecurityAlertRow;
  onReview?: () => void;
  pending?: boolean;
}) {
  return (
    <li
      className={
        'rounded-lg border p-3 flex items-start gap-3 ' +
        (alert.reviewed
          ? 'border-border bg-muted/30 opacity-70'
          : 'border-destructive/40 bg-destructive/5')
      }
    >
      <ShieldAlert
        className={
          'h-5 w-5 flex-shrink-0 mt-0.5 ' +
          (alert.reviewed ? 'text-muted-foreground' : 'text-destructive')
        }
      />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge variant={alert.reviewed ? 'secondary' : 'destructive'}>
            {labelFor(alert.alert_type)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {fmtDateTime(alert.created_at)}
          </span>
        </div>
        <p className="text-sm font-medium truncate">
          {alert.user_name ?? '(sem nome)'}{' '}
          <span className="text-xs text-muted-foreground">
            {alert.user_email ?? alert.user_id}
          </span>
        </p>
        <p className="text-sm text-foreground/80 mt-1 break-words">
          {alert.description}
        </p>
        {alert.metadata && Object.keys(alert.metadata).length > 0 && (
          <details className="mt-2">
            <summary className="text-xs text-muted-foreground cursor-pointer">
              Metadados
            </summary>
            <pre className="text-xs bg-muted/40 rounded p-2 mt-1 overflow-x-auto">
              {JSON.stringify(alert.metadata, null, 2)}
            </pre>
          </details>
        )}
      </div>
      {!alert.reviewed && onReview && (
        <Button
          size="sm"
          variant="outline"
          onClick={onReview}
          disabled={pending}
          className="flex-shrink-0"
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Revisado
        </Button>
      )}
    </li>
  );
}

export default SecurityAlertsPanel;
