import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShieldCheck,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { fetchAuditLogs, type AuditLogRecord } from '@/services/auditLog';
import { useAdminUsers } from '@/hooks/useAdminQueries';

/** Mapeia verbos legados para o padrão canônico (apenas display). */
function canonicalAction(action: string): string {
  if (action === 'proposal.insert') return 'create_proposal';
  if (action === 'proposal.update') return 'update_proposal';
  if (action === 'proposal.delete') return 'delete_proposal';
  return action;
}

const ACTION_LABELS: Record<string, string> = {
  create_proposal: '📝 Proposta criada',
  update_proposal: '✏️ Proposta atualizada',
  close_proposal: '✅ Proposta fechada',
  lose_proposal: '❌ Proposta perdida',
  delete_proposal: '🗑️ Proposta excluída',
  contact_post_sale_client: '📞 Contato pós-venda',
  schedule_post_sale_action: '🎯 Próxima ação agendada',
  register_post_sale_referral: '👥 Indicação registrada',
  change_post_sale_status: '🔄 Status pós-venda alterado',
  register_post_sale_bid: '💰 Lance registrado',
  generate_pdf: '📄 PDF gerado',
  save_simulation: '🧮 Simulação salva',
};

const ENTITY_LABELS: Record<string, string> = {
  proposal: 'Proposta',
  post_sale_client: 'Cliente pós-venda',
  post_sale_event: 'Evento pós-venda',
  post_sale_bid: 'Lance pós-venda',
  pdf: 'PDF',
  simulation: 'Simulação',
};

const PERIODS = [
  { id: '24h', label: 'Últimas 24h', hours: 24 },
  { id: '7d', label: 'Últimos 7 dias', hours: 24 * 7 },
  { id: '30d', label: 'Últimos 30 dias', hours: 24 * 30 },
  { id: '90d', label: 'Últimos 90 dias', hours: 24 * 90 },
  { id: 'all', label: 'Todos', hours: 0 },
];

const DESTRUCTIVE_ACTIONS = new Set(['delete_proposal', 'lose_proposal']);
const PAGE_SIZE = 50;
const FETCH_CAP = 5000;

function isOutsideBusinessHours(iso: string): boolean {
  const d = new Date(iso);
  const dow = d.getDay(); // 0 dom, 6 sab
  const hour = d.getHours();
  return dow === 0 || dow === 6 || hour < 8 || hour > 18;
}

function formatMetadataValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'number') return v.toLocaleString('pt-BR');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

const METADATA_LABELS: Record<string, string> = {
  client_name: 'Cliente',
  credit_value: 'Valor da carta (R$)',
  consortium_type: 'Tipo de consórcio',
  pdf_type: 'Tipo de PDF',
  module: 'Módulo',
  term: 'Prazo (meses)',
  status: 'Status',
  reason: 'Motivo',
  proposal_id: 'ID da proposta',
};

function labelKey(k: string): string {
  return METADATA_LABELS[k] ?? k;
}

export function AdminAuditLogs() {
  const [action, setAction] = useState('todos');
  const [entity, setEntity] = useState('todos');
  const [period, setPeriod] = useState('7d');
  const [userId, setUserId] = useState('todos');
  const [search, setSearch] = useState('');
  const [outsideHours, setOutsideHours] = useState(false);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fromDate = useMemo(() => {
    const p = PERIODS.find(p => p.id === period);
    if (!p || p.hours === 0) return undefined;
    return new Date(Date.now() - p.hours * 60 * 60 * 1000).toISOString();
  }, [period]);

  const { data: rawLogs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', action, entity, period, userId],
    queryFn: () => fetchAuditLogs({ action, entity, fromDate, userId, limit: FETCH_CAP }),
    staleTime: 30_000,
  });

  const { data: users = [] } = useAdminUsers();
  const userMap = useMemo(() => {
    const m = new Map<string, string>();
    users.forEach(u => m.set(u.user_id, u.nome));
    return m;
  }, [users]);

  // Aplica filtros client-side (search + outsideHours) sobre o conjunto carregado.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rawLogs.filter(l => {
      if (outsideHours && !isOutsideBusinessHours(l.created_at)) return false;
      if (!q) return true;
      const userName = userMap.get(l.user_id) ?? '';
      const metaText = l.metadata ? JSON.stringify(l.metadata) : '';
      const hay = `${userName} ${l.action} ${l.entity} ${metaText}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rawLogs, search, outsideHours, userMap]);

  // Reset página quando filtros mudam
  const filtersKey = `${action}|${entity}|${period}|${userId}|${search}|${outsideHours}`;
  useEffect(() => { setPage(1); }, [filtersKey]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  // Resumo (sobre filtered, ou seja, período + filtros aplicados)
  const summary = useMemo(() => {
    const userCounts: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};
    let destructive = 0;
    for (const l of filtered) {
      if (l.user_id) userCounts[l.user_id] = (userCounts[l.user_id] || 0) + 1;
      const canon = canonicalAction(l.action);
      actionCounts[canon] = (actionCounts[canon] || 0) + 1;
      if (DESTRUCTIVE_ACTIONS.has(canon)) destructive++;
    }
    const topUser = Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0];
    const topAction = Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0];
    return {
      total: filtered.length,
      topUserName: topUser ? (userMap.get(topUser[0]) ?? topUser[0].slice(0, 8)) : '—',
      topUserCount: topUser ? topUser[1] : 0,
      topAction: topAction ? (ACTION_LABELS[topAction[0]] ?? topAction[0]) : '—',
      topActionCount: topAction ? topAction[1] : 0,
      destructive,
    };
  }, [filtered, userMap]);

  const exportCsv = () => {
    const rows = filtered;
    const header = ['data', 'hora', 'usuario', 'action', 'entity', 'entity_id', 'metadata'];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [header.join(',')];
    for (const l of rows) {
      const d = new Date(l.created_at);
      const data = d.toLocaleDateString('pt-BR');
      const hora = d.toLocaleTimeString('pt-BR');
      const usuario = userMap.get(l.user_id) ?? l.user_id;
      const meta = l.metadata ? JSON.stringify(l.metadata) : '';
      lines.push([data, hora, usuario, canonicalAction(l.action), l.entity, l.entity_id ?? '', meta]
        .map(v => escape(String(v))).join(','));
    }
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" /> Auditoria de Ações
        </h1>
        <Button onClick={exportCsv} variant="outline" size="sm" disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-2" /> Exportar CSV ({filtered.length})
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-caption text-muted-foreground">Total de ações</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-caption text-muted-foreground">Usuário mais ativo</p>
            <p className="text-sm font-semibold truncate">{summary.topUserName}</p>
            <p className="text-xs text-muted-foreground">{summary.topUserCount} ações</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-caption text-muted-foreground">Ação mais frequente</p>
            <p className="text-sm font-semibold truncate">{summary.topAction}</p>
            <p className="text-xs text-muted-foreground">{summary.topActionCount} ocorrências</p>
          </CardContent>
        </Card>
        <Card className={`rounded-xl ${summary.destructive > 0 ? 'border-destructive/40' : ''}`}>
          <CardContent className="p-4">
            <p className="text-caption text-muted-foreground">Ações destrutivas</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{summary.destructive}</p>
              {summary.destructive > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" /> atenção
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por usuário, ação, entidade ou conteúdo do metadata..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {PERIODS.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <select
            value={action}
            onChange={e => setAction(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="todos">Todas as ações</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={entity}
            onChange={e => setEntity(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="todos">Todas as entidades</option>
            {Object.entries(ENTITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={userId}
            onChange={e => setUserId(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm max-w-[240px]"
          >
            <option value="todos">Todos os usuários</option>
            {users.map(u => (
              <option key={u.user_id} value={u.user_id}>{u.nome}</option>
            ))}
          </select>
          <label className="inline-flex items-center gap-2 text-sm border border-input rounded-md px-3 h-9 cursor-pointer hover:bg-muted/50">
            <input
              type="checkbox"
              checked={outsideHours}
              onChange={e => setOutsideHours(e.target.checked)}
              className="h-4 w-4"
            />
            Fora do horário comercial
          </label>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Carregando logs...</p>
      ) : pageItems.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Nenhum registro encontrado para os filtros aplicados.</p>
      ) : (
        <>
          <div className="space-y-2">
            {pageItems.map(l => {
              const canon = canonicalAction(l.action);
              const isDestructive = DESTRUCTIVE_ACTIONS.has(canon);
              const isExpanded = expanded.has(l.id);
              const metaEntries = l.metadata ? Object.entries(l.metadata) : [];
              return (
                <Card
                  key={l.id}
                  className={`rounded-xl ${isDestructive ? 'border-destructive/40 bg-destructive/5' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium flex items-center gap-2 flex-wrap">
                          <span className={isDestructive ? 'text-destructive' : ''}>
                            {ACTION_LABELS[canon] ?? canon}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            [{ENTITY_LABELS[l.entity] ?? l.entity}]
                          </span>
                          {isDestructive && (
                            <Badge variant="destructive" className="text-xs">destrutiva</Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Por: <span className="font-medium text-foreground">
                            {userMap.get(l.user_id) ?? l.user_id.slice(0, 8)}
                          </span>
                        </p>
                        {metaEntries.length > 0 && !isExpanded && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {metaEntries.slice(0, 4).map(([k, v]) =>
                              `${labelKey(k)}: ${formatMetadataValue(v)}`
                            ).join(' • ')}
                          </p>
                        )}
                        {metaEntries.length > 0 && isExpanded && (
                          <div className="mt-3 rounded-md border border-border bg-muted/30 p-3 text-xs space-y-1">
                            {metaEntries.map(([k, v]) => (
                              <div key={k} className="flex flex-col sm:flex-row sm:gap-2">
                                <span className="font-medium text-foreground sm:min-w-[160px]">
                                  {labelKey(k)}:
                                </span>
                                <span className="text-muted-foreground break-all">
                                  {formatMetadataValue(v)}
                                </span>
                              </div>
                            ))}
                            {l.entity_id && (
                              <div className="flex flex-col sm:flex-row sm:gap-2 pt-1 border-t border-border/50 mt-1">
                                <span className="font-medium text-foreground sm:min-w-[160px]">ID da entidade:</span>
                                <span className="text-muted-foreground break-all font-mono">{l.entity_id}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {metaEntries.length > 0 && (
                          <button
                            onClick={() => toggleExpand(l.id)}
                            className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <><ChevronUp className="h-3 w-3" /> Ocultar detalhes</>
                            ) : (
                              <><ChevronDown className="h-3 w-3" /> Ver detalhes</>
                            )}
                          </button>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(l.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
            <p className="text-xs text-muted-foreground">
              Exibindo {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, total)} de {total} registros
              {rawLogs.length >= FETCH_CAP && (
                <span className="ml-1 text-warning">(limite de {FETCH_CAP} atingido — refine os filtros)</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                Página {safePage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
              >
                Próxima <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
