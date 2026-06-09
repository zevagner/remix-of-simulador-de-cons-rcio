import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { MessageSquare, CheckCircle2, Eye, Trash2, Bug, Lightbulb, Globe, Download, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { useAdminFeedbacks, useUpdateFeedbackStatus, useDeleteFeedback, useResolveFeedback, type Feedback } from '@/hooks/useAdminQueries';
import { ResolveFeedbackDialog, type ResolvePayload } from './ResolveFeedbackDialog';
import { AdminPageHeader } from './AdminPageHeader';
import { categorizeFeedback, ALL_CATEGORIES_FOR_FILTER, type FeedbackCategory } from '@/utils/feedbackCategorization';

const MODULE_LABELS: Record<string, string> = {
  simulator: 'Simulador',
  comparator: 'Comparador',
  investment: 'Investimento',
  advanced: 'Op. Estruturadas',
  assemblies: 'Assembleias',
  bids: 'Estudo de Lances',
  summary: 'Proposta',
  analysis: 'Análise',
  objections: 'Abordagem',
  proposals: 'Carteira',
  diagnostic: 'Diagnóstico',
  help: 'Central de Ajuda',
  postsale: 'Pós-venda',
  community: 'Comunidade',
};

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  novo: { label: 'Novo', class: 'bg-destructive/15 text-destructive' },
  lido: { label: 'Lido', class: 'bg-amber-500/15 text-amber-600' },
  resolvido: { label: 'Resolvido', class: 'bg-emerald-500/15 text-emerald-600' },
};

const DAY_MS = 86_400_000;

function daysBetween(from: string, to: string | number = Date.now()): number {
  const start = new Date(from).getTime();
  const end = typeof to === 'string' ? new Date(to).getTime() : to;
  return Math.floor((end - start) / DAY_MS);
}

function moduleLabel(m: string | null | undefined): string {
  if (!m) return 'Sem módulo';
  return MODULE_LABELS[m] ?? m;
}

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

interface EnrichedFeedback extends Feedback {
  _categories: FeedbackCategory[];
  _ageDays: number;
  _responseDays: number | null;
}

export function AdminFeedbacks() {
  const { data: feedbacks = [], isLoading } = useAdminFeedbacks();
  const updateStatusMutation = useUpdateFeedbackStatus();
  const resolveMutation = useResolveFeedback();
  const deleteMutation = useDeleteFeedback();

  const [filterType, setFilterType] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterCategory, setFilterCategory] = useState('todos');
  const [filterModule, setFilterModule] = useState('todos');
  const [filterPeriod, setFilterPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('all');
  const [sortMode, setSortMode] = useState<'recent' | 'oldest' | 'unanswered'>('recent');
  const [groupByModule, setGroupByModule] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<Feedback | null>(null);

  const isMobile = useIsMobile();

  // Enriquecer com categorias + idade
  const enriched: EnrichedFeedback[] = useMemo(() =>
    feedbacks.map((f) => ({
      ...f,
      _categories: categorizeFeedback(f.message),
      _ageDays: daysBetween(f.created_at),
      _responseDays: f.resolved_at ? daysBetween(f.created_at, f.resolved_at) : null,
    })),
    [feedbacks]
  );

  // ─── Métricas globais (sobre TODOS os feedbacks) ──────────
  const metrics = useMemo(() => {
    const total = enriched.length;
    const pending = enriched.filter((f) => (f.status === 'novo' || f.status === 'lido') && !f.admin_response).length;
    const resolved = enriched.filter((f) => f.status === 'resolvido').length;
    const respondedTimes = enriched.map((f) => f._responseDays).filter((d): d is number => d !== null);
    const avgResponseDays = respondedTimes.length
      ? respondedTimes.reduce((s, d) => s + d, 0) / respondedTimes.length
      : null;
    const resolutionRate = total ? (resolved / total) * 100 : 0;
    return { total, pending, avgResponseDays, resolutionRate };
  }, [enriched]);

  // ─── Distribuição por módulo (para gráfico) ───────────────
  const byModule = useMemo(() => {
    const map = new Map<string, { module: string; errors: number; suggestions: number; resolved: number; total: number }>();
    for (const f of enriched) {
      const key = f.module ?? '__none__';
      const cur = map.get(key) ?? { module: moduleLabel(f.module), errors: 0, suggestions: 0, resolved: 0, total: 0 };
      if (f.type === 'erro') cur.errors++;
      if (f.type === 'sugestao') cur.suggestions++;
      if (f.status === 'resolvido') cur.resolved++;
      cur.total++;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [enriched]);

  const maxModuleVolume = byModule[0]?.total ?? 1;

  // ─── Filtragem ────────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = Date.now();
    const periodMs = filterPeriod === '7d' ? 7 * DAY_MS : filterPeriod === '30d' ? 30 * DAY_MS : filterPeriod === '90d' ? 90 * DAY_MS : null;

    let list = enriched.filter((f) => {
      if (filterType !== 'todos' && f.type !== filterType) return false;
      if (filterStatus !== 'todos' && f.status !== filterStatus) return false;
      if (filterModule !== 'todos' && (f.module ?? '__none__') !== filterModule) return false;
      if (filterCategory !== 'todos' && !f._categories.some((c) => c.key === filterCategory)) return false;
      if (periodMs !== null && now - new Date(f.created_at).getTime() > periodMs) return false;
      return true;
    });

    if (sortMode === 'oldest') {
      list = [...list].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    } else if (sortMode === 'unanswered') {
      list = [...list].sort((a, b) => {
        const aOpen = !a.admin_response ? 1 : 0;
        const bOpen = !b.admin_response ? 1 : 0;
        if (aOpen !== bOpen) return bOpen - aOpen;
        return +new Date(b.created_at) - +new Date(a.created_at);
      });
    } else {
      list = [...list].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }
    return list;
  }, [enriched, filterType, filterStatus, filterCategory, filterModule, filterPeriod, sortMode]);

  // ─── Agrupamento por módulo ───────────────────────────────
  const grouped = useMemo(() => {
    if (!groupByModule) return null;
    const map = new Map<string, EnrichedFeedback[]>();
    for (const f of filtered) {
      const k = moduleLabel(f.module);
      const arr = map.get(k) ?? [];
      arr.push(f);
      map.set(k, arr);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filtered, groupByModule]);

  // ─── Lista de módulos para filtro dropdown ────────────────
  const moduleOptions = useMemo(() => {
    const set = new Set<string>();
    enriched.forEach((f) => set.add(f.module ?? '__none__'));
    return Array.from(set).map((k) => ({ value: k, label: k === '__none__' ? 'Sem módulo' : moduleLabel(k) }));
  }, [enriched]);

  // ─── Ações ────────────────────────────────────────────────
  const updateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status }, {
      onSuccess: () => toast({ title: `Feedback marcado como ${STATUS_LABELS[status]?.label ?? status}` }),
    });
  };

  const handleResolveConfirm = (payload: ResolvePayload) => {
    if (!resolveTarget) return;
    resolveMutation.mutate({ id: resolveTarget.id, ...payload }, {
      onSuccess: () => {
        toast({ title: 'Feedback resolvido', description: payload.is_public ? 'Aparecerá em "Melhorias recentes".' : undefined });
        setResolveTarget(null);
      },
      onError: () => toast({ title: 'Erro ao resolver', variant: 'destructive' }),
    });
  };

  const deleteFeedback = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast({ title: 'Feedback excluído' }),
    });
  };

  const handleExportCsv = () => {
    const header = ['data', 'tipo', 'status', 'modulo', 'categorias', 'texto', 'autor', 'resposta', 'dias_ate_resposta'];
    const rows = filtered.map((f) => [
      new Date(f.created_at).toISOString(),
      f.type,
      f.status,
      moduleLabel(f.module),
      f._categories.map((c) => c.label).join('|'),
      f.message,
      f.user_nome ?? '',
      f.admin_response ?? '',
      f._responseDays ?? '',
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedbacks_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: `${filtered.length} feedbacks exportados` });
  };

  const selectClass = 'h-9 rounded-md border border-input bg-background px-3 text-sm';

  if (isLoading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Carregando feedbacks...</p>;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Feedbacks (${filtered.length}${filtered.length !== feedbacks.length ? ` / ${feedbacks.length}` : ''})`}
        subtitle="Sugestões e erros reportados pelos gerentes"
      />
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={handleExportCsv} disabled={filtered.length === 0}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> Exportar CSV
        </Button>
      </div>

      {/* ─── Cards de resumo ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-card border-border"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold mt-1">{metrics.total}</p>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Pendentes</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{metrics.pending}</p>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Tempo médio resposta</p>
          <p className="text-2xl font-bold mt-1">{metrics.avgResponseDays !== null ? `${metrics.avgResponseDays.toFixed(1)}d` : '—'}</p>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Taxa de resolução</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{metrics.resolutionRate.toFixed(0)}%</p>
        </CardContent></Card>
      </div>

      {/* ─── Distribuição por módulo (mini bars) ──────────── */}
      {byModule.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Feedbacks por módulo (top {byModule.length})</p>
            <div className="space-y-1.5">
              {byModule.map((m) => (
                <div key={m.module} className="flex items-center gap-2 text-xs">
                  <span className="w-32 truncate text-muted-foreground" title={m.module}>{m.module}</span>
                  <div className="flex-1 h-5 bg-muted/40 rounded overflow-hidden flex">
                    <div
                      className="bg-destructive/70"
                      style={{ width: `${(m.errors / maxModuleVolume) * 100}%` }}
                      title={`${m.errors} erros`}
                    />
                    <div
                      className="bg-amber-500/70"
                      style={{ width: `${(m.suggestions / maxModuleVolume) * 100}%` }}
                      title={`${m.suggestions} sugestões`}
                    />
                  </div>
                  <span className="w-12 text-right tabular-nums font-medium">{m.total}</span>
                  <span className="w-16 text-right tabular-nums text-emerald-600" title="Resolvidos">{m.resolved} ✓</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-1 text-caption text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-destructive/70 rounded-sm" /> Erros</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500/70 rounded-sm" /> Sugestões</span>
              <span className="flex items-center gap-1 text-emerald-600">✓ Resolvidos</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Filtros ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectClass}>
          <option value="todos">Todos os tipos</option>
          <option value="erro">🐛 Erros</option>
          <option value="sugestao">💡 Sugestões</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectClass}>
          <option value="todos">Todos os status</option>
          <option value="novo">Novos</option>
          <option value="lido">Lidos</option>
          <option value="resolvido">Resolvidos</option>
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={selectClass}>
          <option value="todos">Todas as categorias</option>
          {ALL_CATEGORIES_FOR_FILTER.map((c) => (
            <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
          ))}
        </select>
        <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className={selectClass}>
          <option value="todos">Todos os módulos</option>
          {moduleOptions.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value as typeof filterPeriod)} className={selectClass}>
          <option value="all">Todo o período</option>
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="90d">Últimos 90 dias</option>
        </select>
        <select value={sortMode} onChange={(e) => setSortMode(e.target.value as typeof sortMode)} className={selectClass}>
          <option value="recent">Mais recente</option>
          <option value="oldest">Mais antigo</option>
          <option value="unanswered">Sem resposta primeiro</option>
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={groupByModule}
            onChange={(e) => setGroupByModule(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Agrupar por módulo
        </label>
      </div>

      {/* ─── Lista ───────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Nenhum feedback encontrado.</p>
      ) : grouped ? (
        <div className="space-y-6">
          {grouped.map(([mod, items]) => (
            <div key={mod} className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground/80 border-b border-border pb-1">
                {mod} <span className="text-muted-foreground font-normal">({items.length})</span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((f) => (
                  <FeedbackCard
                    key={f.id}
                    f={f}
                    onMarkRead={() => updateStatus(f.id, 'lido')}
                    onResolve={() => setResolveTarget(f)}
                    onDelete={() => deleteFeedback(f.id)}
                    isPending={updateStatusMutation.isPending || resolveMutation.isPending || deleteMutation.isPending}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((f) => (
            <FeedbackCard
              key={f.id}
              f={f}
              onMarkRead={() => updateStatus(f.id, 'lido')}
              onResolve={() => setResolveTarget(f)}
              onDelete={() => deleteFeedback(f.id)}
              isPending={updateStatusMutation.isPending || resolveMutation.isPending || deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      <ResolveFeedbackDialog
        key={resolveTarget?.id ?? 'none'}
        open={!!resolveTarget}
        onOpenChange={(open) => !open && setResolveTarget(null)}
        feedbackPreview={resolveTarget?.message ?? ''}
        initial={{
          admin_response: resolveTarget?.admin_response ?? null,
          is_public: resolveTarget?.is_public ?? false,
          public_summary: resolveTarget?.public_summary ?? null,
        }}
        onConfirm={handleResolveConfirm}
        isPending={resolveMutation.isPending}
      />
    </div>
  );
}

// ─── Card individual ──────────────────────────────────────
interface FeedbackCardProps {
  f: EnrichedFeedback;
  onMarkRead: () => void;
  onResolve: () => void;
  onDelete: () => void;
  isPending: boolean;
}

function FeedbackCard({ f, onMarkRead, onResolve, onDelete, isPending }: FeedbackCardProps) {
  const statusInfo = STATUS_LABELS[f.status] ?? STATUS_LABELS.novo;
  const unanswered = !f.admin_response && f.status !== 'resolvido';
  const showWarn = unanswered && f._ageDays >= 3 && f._ageDays <= 7;
  const showUrgent = unanswered && f._ageDays > 7;

  return (
    <Card className="rounded-xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {f.type === 'erro' ? <Bug className="h-4 w-4 text-destructive" /> : <Lightbulb className="h-4 w-4 text-amber-500" />}
            <span className="text-xs font-medium">{f.type === 'erro' ? 'Erro' : 'Sugestão'}</span>
          </div>
          <span className={`text-caption px-2 py-0.5 rounded-full font-medium ${statusInfo.class}`}>
            {statusInfo.label}
          </span>
        </div>

        {showWarn && (
          <div className="text-caption px-2 py-1 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium">
            ⚠️ {f._ageDays} dias sem resposta
          </div>
        )}
        {showUrgent && (
          <div className="text-caption px-2 py-1 rounded-md bg-destructive/15 text-destructive font-medium">
            🔴 {f._ageDays} dias sem resposta — urgente
          </div>
        )}

        <p className="text-sm leading-relaxed">{f.message}</p>

        <div className="flex flex-wrap gap-1">
          {f._categories.map((c) => (
            <span key={c.key} className={`text-caption px-2 py-0.5 rounded-full font-medium ${c.className}`}>
              {c.emoji} {c.label}
            </span>
          ))}
        </div>

        {f.status === 'resolvido' && f.admin_response && (
          <div className="rounded-md bg-emerald-500/5 border border-emerald-500/20 p-2 text-xs">
            <p className="font-semibold text-emerald-700 mb-1">
              Resposta enviada{f._responseDays !== null ? ` (após ${f._responseDays}d)` : ''}:
            </p>
            <p className="text-foreground/80 leading-relaxed">{f.admin_response}</p>
          </div>
        )}

        {f.status === 'resolvido' && f.is_public && f.public_summary && (
          <div className="flex items-center gap-1.5 text-caption text-primary">
            <Globe className="h-3 w-3" />
            <span>Público: "{f.public_summary}"</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>👤 {f.user_nome}</p>
          {f.module && <p>📍 {moduleLabel(f.module)}</p>}
          <p>📅 {new Date(f.created_at).toLocaleString('pt-BR')}</p>
        </div>

        <div className="flex gap-1 pt-1 flex-wrap">
          {f.status === 'novo' && (
            <Button size="sm" variant="outline" onClick={onMarkRead} disabled={isPending}>
              <Eye className="h-3.5 w-3.5 mr-1" /> Lido
            </Button>
          )}
          {f.status !== 'resolvido' && (
            <Button size="sm" variant="outline" onClick={onResolve} className="text-emerald-600" disabled={isPending}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolver
            </Button>
          )}
          {f.status === 'resolvido' && (
            <Button size="sm" variant="ghost" onClick={onResolve} className="text-muted-foreground" disabled={isPending}>
              Editar resposta
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive ml-auto" disabled={isPending}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
