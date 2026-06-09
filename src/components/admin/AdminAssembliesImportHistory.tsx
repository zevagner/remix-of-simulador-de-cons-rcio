/**
 * AdminAssembliesImportHistory — Timeline institucional de imports de assembleias.
 *
 * Onda: Assemblies Institutional Timeline & Governance UX.
 *
 * Transforma o histórico operacional em painel enterprise de rastreabilidade:
 *  - Health insights (últimos 30d / severos / avisos / rollback / parser dominante).
 *  - Filtros operacionais (modalidade, severidade, parser, rollback, drift, período).
 *  - Search livre (hash, parser, mês, grupo, usuário).
 *  - Timeline com badges (OK, Warning, Severo, Revertido, Parser legado).
 *  - Detail expand com diff + drift + parser report + rollback trail.
 *  - Hash UX (preview curto + copy).
 *  - Empty / error states explícitos.
 *  - Telemetria de interação (timeline_open, detail_open, hash_copy, filter, search).
 *
 * Princípio absoluto: toda operação crítica é visível, rastreável e compreensível.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  History, RotateCcw, AlertTriangle, Loader2, ShieldCheck,
  Copy, ChevronDown, ChevronRight, Search, Filter, Activity,
  GitCommit, Cpu, Hash, Clock, Layers, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchImportHistory, rollbackImport, type AssemblyImportRow,
  type DriftWarning,
} from '@/services/assembliesImport';
import { CONSORTIUM_TYPE_LABELS, type ConsortiumType } from '@/types/consortium';
import { emitMetric } from '@/lib/runtimeMetrics';
import { logger } from '@/utils/logger';
import { DestructiveConfirmDialog } from '@/components/ui/destructive-confirm-dialog';

// ─── Constantes institucionais ─────────────────────────────────

/**
 * Parser canônico em produção neste momento.
 * Imports com `parser_version` diferente (ou nulo) são rotulados como
 * "Parser legado" — sinal para investigação ou reprocessamento.
 */
const CANONICAL_PARSER_VERSION = 'svr-parser-1.0.0';

const SEVERITY_FILTERS = [
  { value: 'all', label: 'Toda severidade' },
  { value: 'severe', label: 'Apenas severo' },
  { value: 'warn', label: 'Avisos (não bloqueantes)' },
  { value: 'clean', label: 'Sem drift' },
] as const;
type SeverityFilter = typeof SEVERITY_FILTERS[number]['value'];

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos status' },
  { value: 'committed', label: 'Apenas ativos' },
  { value: 'rolled_back', label: 'Apenas revertidos' },
] as const;
type StatusFilter = typeof STATUS_FILTERS[number]['value'];

const PERIOD_FILTERS = [
  { value: 'all', label: 'Todo período' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
] as const;
type PeriodFilter = typeof PERIOD_FILTERS[number]['value'];

const TYPE_FILTERS: { value: ConsortiumType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas modalidades' },
  { value: 'imobiliario', label: CONSORTIUM_TYPE_LABELS.imobiliario },
  { value: 'auto', label: CONSORTIUM_TYPE_LABELS.auto },
  { value: 'pesados', label: CONSORTIUM_TYPE_LABELS.pesados },
];

// ─── Helpers ───────────────────────────────────────────────────

function fmtDateTime(iso: string): string {
  try { return new Date(iso).toLocaleString('pt-BR'); } catch { return iso; }
}

function fmtRelative(iso: string): string {
  try {
    const t = new Date(iso).getTime();
    const diffMs = Date.now() - t;
    const min = Math.round(diffMs / 60000);
    if (min < 1) return 'agora';
    if (min < 60) return `${min}m atrás`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h atrás`;
    const d = Math.round(hr / 24);
    if (d < 30) return `${d}d atrás`;
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch { return iso; }
}

function fmtMs(ms: number | null | undefined): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function shortHash(hash: string | null | undefined): string {
  if (!hash) return '—';
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`;
}

function periodCutoff(period: PeriodFilter): number | null {
  if (period === 'all') return null;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  return Date.now() - days * 24 * 3600 * 1000;
}

function severityOf(row: AssemblyImportRow): 'severe' | 'warn' | 'clean' {
  const drift = row.drift_warnings ?? [];
  if (drift.some(d => d.severity === 'severe')) return 'severe';
  if (drift.some(d => d.severity === 'warn')) return 'warn';
  return 'clean';
}

function isLegacyParser(row: AssemblyImportRow): boolean {
  return !row.parser_version || row.parser_version !== CANONICAL_PARSER_VERSION;
}

// ─── Public component ─────────────────────────────────────────

interface Props {
  onRolledBack?: () => void;
}

export default function AdminAssembliesImportHistory({ onRolledBack }: Props) {
  const [rows, setRows] = useState<AssemblyImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [rollbackId, setRollbackId] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ConsortiumType | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [parserFilter, setParserFilter] = useState<string>('all'); // 'all' | 'canonical' | 'legacy'

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchImportHistory(60);
      setRows(data);
      emitMetric({
        type: 'interaction',
        name: 'assemblies.history_load',
        value: data.length,
        module: 'admin-assemblies',
      });
    } catch (e) {
      logger.error('[admin-history] load error', e);
      setLoadError((e as Error).message ?? 'Erro ao carregar histórico');
      toast.error('Erro ao carregar histórico de imports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const handleRollback = useCallback(async (id: string) => {
    setBusyId(id);
    try {
      const res = await rollbackImport(id);
      toast.success(`Rollback concluído (${res.restoredRows} linhas restauradas)`);
      emitMetric({
        type: 'interaction',
        name: 'assemblies.history_rollback',
        value: res.restoredRows,
        module: 'admin-assemblies',
        meta: { importId: id, durationMs: res.durationMs },
      });
      await reload();
      onRolledBack?.();
    } catch (e) {
      logger.error('[admin-history] rollback error', e);
      toast.error((e as Error).message ?? 'Erro no rollback');
    } finally {
      setBusyId(null);
    }
  }, [reload, onRolledBack]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        emitMetric({
          type: 'interaction',
          name: 'assemblies.history_detail_open', value: 1,
          module: 'admin-assemblies',
          meta: { importId: id },
        });
      }
      return next;
    });
  }, []);

  const copyHash = useCallback(async (hash: string | null) => {
    if (!hash) { toast.error('Sem hash para copiar'); return; }
    try {
      await navigator.clipboard.writeText(hash);
      toast.success(`Hash copiado · ${shortHash(hash)}`);
      emitMetric({
        type: 'interaction',
        name: 'assemblies.history_hash_copy', value: 1,
        module: 'admin-assemblies',
      });
    } catch {
      toast.error('Falha ao copiar hash');
    }
  }, []);

  // ─── Health insights ─────────────────────────────────────────
  const insights = useMemo(() => {
    const cutoff30 = Date.now() - 30 * 24 * 3600 * 1000;
    const last30 = rows.filter(r => new Date(r.created_at).getTime() >= cutoff30);
    const severe = rows.filter(r => severityOf(r) === 'severe').length;
    const warn = rows.filter(r => severityOf(r) === 'warn').length;
    const rolled = rows.filter(r => r.status === 'rolled_back').length;
    const legacy = rows.filter(isLegacyParser).length;

    // Parser dominante (mais usado nos últimos 30d)
    const parserCount = new Map<string, number>();
    for (const r of last30) {
      const p = r.parser_version ?? '(legado)';
      parserCount.set(p, (parserCount.get(p) ?? 0) + 1);
    }
    let dominantParser = '—';
    let dominantCount = 0;
    parserCount.forEach((count, parser) => {
      if (count > dominantCount) { dominantParser = parser; dominantCount = count; }
    });

    // Hashes duplicados (replay suspeito)
    const hashGroups = new Map<string, number>();
    for (const r of rows) {
      if (!r.content_hash) continue;
      hashGroups.set(r.content_hash, (hashGroups.get(r.content_hash) ?? 0) + 1);
    }
    const duplicateHashes = Array.from(hashGroups.values()).filter(c => c > 1).length;

    return {
      last30: last30.length,
      severe,
      warn,
      rolled,
      legacy,
      dominantParser,
      duplicateHashes,
    };
  }, [rows]);

  // Hash duplicados (set de hashes que aparecem >1x — usado para badge "Replay")
  const duplicateHashSet = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      if (!r.content_hash) continue;
      counts.set(r.content_hash, (counts.get(r.content_hash) ?? 0) + 1);
    }
    return new Set(Array.from(counts.entries()).filter(([, c]) => c > 1).map(([h]) => h));
  }, [rows]);

  // ─── Filtros aplicados ──────────────────────────────────────
  const filteredRows = useMemo(() => {
    const cutoff = periodCutoff(periodFilter);
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (typeFilter !== 'all' && r.consortium_type !== typeFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (cutoff !== null && new Date(r.created_at).getTime() < cutoff) return false;

      const sev = severityOf(r);
      if (severityFilter !== 'all' && severityFilter !== sev) return false;

      if (parserFilter === 'canonical' && isLegacyParser(r)) return false;
      if (parserFilter === 'legacy' && !isLegacyParser(r)) return false;

      if (q) {
        const haystack = [
          r.content_hash ?? '',
          r.parser_version ?? '',
          r.user_id ?? '',
          r.consortium_type,
          ...(r.months ?? []),
          ...(r.diff_summary?.affectedGroups ?? []).map(String),
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, typeFilter, statusFilter, periodFilter, severityFilter, parserFilter, search]);

  const onFilterChange = useCallback((kind: string, value: string) => {
    emitMetric({
      type: 'interaction',
      name: 'assemblies.history_filter', value: 1,
      module: 'admin-assemblies',
      meta: { filter: kind, value },
    });
  }, []);

  // ─── Render ─────────────────────────────────────────────────

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 flex-wrap">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" /> Timeline institucional de imports
            <Badge variant="outline" className="ml-2 gap-1">
              <ShieldCheck className="h-3 w-3" /> Edge pipeline
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Cada operação é rastreável: parser, hash, diff, drift, rollback.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={reload} disabled={loading} className="gap-1">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Activity className="h-3 w-3" />}
          Atualizar
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Health insights */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <InsightTile icon={<GitCommit className="h-3.5 w-3.5" />} label="Últimos 30d" value={insights.last30} />
          <InsightTile icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Severo (total)" value={insights.severe} tone={insights.severe > 0 ? 'destructive' : undefined} />
          <InsightTile icon={<AlertCircle className="h-3.5 w-3.5" />} label="Avisos (total)" value={insights.warn} tone={insights.warn > 0 ? 'warning' : undefined} />
          <InsightTile icon={<RotateCcw className="h-3.5 w-3.5" />} label="Revertidos" value={insights.rolled} />
          <InsightTile icon={<Cpu className="h-3.5 w-3.5" />} label="Parser dominante" textValue={insights.dominantParser} />
          <InsightTile icon={<Hash className="h-3.5 w-3.5" />} label="Hashes duplicados" value={insights.duplicateHashes} tone={insights.duplicateHashes > 0 ? 'warning' : undefined} />
        </div>

        {insights.legacy > 0 && (
          <Alert variant="default" className="border-warning/40 bg-warning/5">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertTitle>{insights.legacy} import(s) com parser legado</AlertTitle>
            <AlertDescription className="text-xs">
              Recomenda-se reprocessar com parser canônico ({CANONICAL_PARSER_VERSION}).
              Use o filtro "Parser → Legado" para isolar.
            </AlertDescription>
          </Alert>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 border rounded-md p-2 bg-muted/20">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => search && onFilterChange('search', 'used')}
              placeholder="Buscar hash, parser, mês, grupo, user…"
              className="pl-7 h-8 text-xs"
            />
          </div>
          <FilterSelect
            value={typeFilter} options={TYPE_FILTERS as readonly { value: string; label: string }[]}
            onChange={(v) => { setTypeFilter(v as ConsortiumType | 'all'); onFilterChange('type', v); }}
          />
          <FilterSelect
            value={severityFilter} options={SEVERITY_FILTERS as readonly { value: string; label: string }[]}
            onChange={(v) => { setSeverityFilter(v as SeverityFilter); onFilterChange('severity', v); }}
          />
          <FilterSelect
            value={statusFilter} options={STATUS_FILTERS as readonly { value: string; label: string }[]}
            onChange={(v) => { setStatusFilter(v as StatusFilter); onFilterChange('status', v); }}
          />
          <FilterSelect
            value={parserFilter}
            options={[
              { value: 'all', label: 'Todo parser' },
              { value: 'canonical', label: 'Canônico' },
              { value: 'legacy', label: 'Legado' },
            ]}
            onChange={(v) => { setParserFilter(v); onFilterChange('parser', v); }}
          />
          <FilterSelect
            value={periodFilter} options={PERIOD_FILTERS as readonly { value: string; label: string }[]}
            onChange={(v) => { setPeriodFilter(v as PeriodFilter); onFilterChange('period', v); }}
          />
          <span className="text-caption text-muted-foreground ml-auto">
            {filteredRows.length} de {rows.length}
          </span>
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando histórico…
          </div>
        )}

        {loadError && !loading && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar histórico</AlertTitle>
            <AlertDescription className="text-xs">
              {loadError}
              <Button size="sm" variant="outline" onClick={reload} className="ml-2 h-6 text-xs">
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!loading && !loadError && rows.length === 0 && (
          <Alert>
            <FileSpreadsheet />
            <AlertTitle>Nenhum import server-side ainda</AlertTitle>
            <AlertDescription className="text-xs">
              Use "Upload Excel" ou "Colar dados" para iniciar o pipeline institucional.
              Cada operação aparecerá aqui com diff, drift e rollback rastreáveis.
            </AlertDescription>
          </Alert>
        )}

        {!loading && !loadError && rows.length > 0 && filteredRows.length === 0 && (
          <Alert>
            <Filter className="h-4 w-4" />
            <AlertTitle>Nenhum import corresponde aos filtros</AlertTitle>
            <AlertDescription className="text-xs">
              Ajuste filtros ou limpe a busca para ver todos os {rows.length} registros.
            </AlertDescription>
          </Alert>
        )}

        {/* Timeline */}
        <ol className="relative border-l border-border ml-2 space-y-3">
          {filteredRows.map(r => {
            const sev = severityOf(r);
            const legacy = isLegacyParser(r);
            const expanded = expandedIds.has(r.id);
            const driftCount = r.drift_warnings?.length ?? 0;
            const isDuplicate = r.content_hash ? duplicateHashSet.has(r.content_hash) : false;
            const dotTone =
              r.status === 'rolled_back' ? 'bg-muted-foreground'
              : sev === 'severe' ? 'bg-destructive'
              : sev === 'warn' ? 'bg-warning'
              : 'bg-success';

            return (
              <li key={r.id} className="ml-4">
                <span className={`absolute -left-[5px] mt-2 h-2.5 w-2.5 rounded-full ring-2 ring-background ${dotTone}`} />
                <Collapsible open={expanded} onOpenChange={() => toggleExpand(r.id)}>
                  <div className="border rounded-lg p-3 space-y-2 bg-card">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <CollapsibleTrigger asChild>
                            <button className="inline-flex items-center gap-1 font-medium text-sm hover:underline">
                              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              {CONSORTIUM_TYPE_LABELS[r.consortium_type]}
                            </button>
                          </CollapsibleTrigger>
                          <StatusBadge row={r} severity={sev} legacy={legacy} duplicate={isDuplicate} />
                        </div>
                        <p className="text-caption text-muted-foreground">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {fmtRelative(r.created_at)} · {fmtDateTime(r.created_at)}
                          {' · '}
                          <span className="tabular-nums">{r.rows_added} novos</span>
                          {' · '}
                          <span className="tabular-nums">{r.rows_updated} atualizados</span>
                          {r.rows_pruned > 0 && <> · <span className="tabular-nums">{r.rows_pruned} podados</span></>}
                          {r.duration_ms != null && <> · {fmtMs(r.duration_ms)}</>}
                          {driftCount > 0 && <> · {driftCount} drift</>}
                        </p>
                        <div className="flex items-center gap-1.5 text-caption text-muted-foreground flex-wrap">
                          <Cpu className="h-3 w-3" />
                          <span className="font-mono" title={r.parser_version ?? ''}>
                            {r.parser_version ?? '(parser ausente)'}
                          </span>
                          <span>·</span>
                          <Hash className="h-3 w-3" />
                          <button
                            type="button"
                            onClick={() => copyHash(r.content_hash)}
                            className="font-mono hover:text-foreground inline-flex items-center gap-1"
                            title={r.content_hash ?? 'Sem hash'}
                            disabled={!r.content_hash}
                          >
                            {shortHash(r.content_hash)}
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {r.status === 'committed' && (
                        <Button
                          variant="outline" size="sm" className="gap-1"
                          disabled={busyId === r.id}
                          onClick={() => setRollbackId(r.id)}
                        >
                          {busyId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                          Rollback
                        </Button>
                      )}
                    </div>

                    {/* Months chip line */}
                    {r.months.length > 0 && (
                      <p className="text-caption text-muted-foreground">
                        <Layers className="inline h-3 w-3 mr-1" />
                        Meses: <span className="font-mono">{r.months.join(', ')}</span>
                      </p>
                    )}

                    {/* Detail */}
                    <CollapsibleContent>
                      <DetailPanel row={r} />
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>

    <DestructiveConfirmDialog
      open={rollbackId !== null}
      onOpenChange={(o) => { if (!o) setRollbackId(null); }}
      title="Reverter este import?"
      description="O estado anterior dos meses afetados será restaurado a partir do snapshot. Esta ação é irreversível — para refazer o import será preciso reenviá-lo."
      confirmWord="REVERTER"
      confirmLabel="Reverter import"
      loading={busyId !== null}
      onConfirm={async () => {
        const id = rollbackId;
        setRollbackId(null);
        if (id) await handleRollback(id);
      }}
    />
    </>
  );
}

// ─── Subcomponents ────────────────────────────────────────────

function InsightTile({
  icon, label, value, textValue, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  textValue?: string;
  tone?: 'destructive' | 'warning';
}) {
  const toneClass =
    tone === 'destructive' ? 'border-destructive/40 bg-destructive/5'
    : tone === 'warning' ? 'border-warning/40 bg-warning/5'
    : 'border-border bg-muted/20';
  return (
    <div className={`border rounded-md p-2 ${toneClass}`}>
      <div className="flex items-center gap-1 text-caption uppercase tracking-wide text-muted-foreground">
        {icon}<span>{label}</span>
      </div>
      <div className="text-base font-semibold tabular-nums truncate" title={textValue ?? String(value ?? '')}>
        {textValue ?? value ?? 0}
      </div>
    </div>
  );
}

function FilterSelect({
  value, options, onChange,
}: {
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-auto min-w-[140px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => (
          <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StatusBadge({
  row, severity, legacy, duplicate,
}: {
  row: AssemblyImportRow;
  severity: 'severe' | 'warn' | 'clean';
  legacy: boolean;
  duplicate: boolean;
}) {
  return (
    <>
      {row.status === 'rolled_back' ? (
        <Badge variant="secondary" className="text-caption gap-1">
          <RotateCcw className="h-3 w-3" /> Revertido
        </Badge>
      ) : severity === 'severe' ? (
        <Badge variant="destructive" className="text-caption gap-1">
          <AlertTriangle className="h-3 w-3" /> Drift severo
        </Badge>
      ) : severity === 'warn' ? (
        <Badge variant="outline" className="text-caption gap-1 border-warning text-warning">
          <AlertCircle className="h-3 w-3" /> Avisos
        </Badge>
      ) : (
        <Badge variant="default" className="text-caption gap-1">
          <ShieldCheck className="h-3 w-3" /> OK
        </Badge>
      )}
      {legacy && (
        <Badge variant="outline" className="text-caption gap-1 border-warning/60 text-warning">
          Parser legado
        </Badge>
      )}
      {duplicate && (
        <Badge variant="outline" className="text-caption gap-1">
          Hash repetido
        </Badge>
      )}
    </>
  );
}

function DetailPanel({ row }: { row: AssemblyImportRow }) {
  const diff = row.diff_summary;
  const drift = row.drift_warnings ?? [];
  const severeDrift = drift.filter(d => d.severity === 'severe');
  const warnDrift = drift.filter(d => d.severity === 'warn');
  const infoDrift = drift.filter(d => d.severity === 'info');

  return (
    <div className="mt-3 space-y-3 border-t pt-3 text-xs">
      {/* Diff summary */}
      <section>
        <h4 className="font-semibold mb-1.5 flex items-center gap-1">
          <GitCommit className="h-3 w-3" /> Diff
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <KV label="Novos" value={diff?.newRows ?? 0} />
          <KV label="Atualizados" value={diff?.updatedRows ?? 0} />
          <KV label="Inalterados" value={diff?.unchangedRows ?? 0} />
          <KV label="Grupos afetados" value={diff?.affectedGroups?.length ?? 0} />
        </div>
        {diff?.affectedMonths?.length ? (
          <p className="mt-1.5 text-muted-foreground">
            Meses afetados: <span className="font-mono">{diff.affectedMonths.join(', ')}</span>
          </p>
        ) : null}
        {diff?.prunedMonths?.length ? (
          <p className="mt-0.5 text-destructive">
            Removidos pela retenção: <span className="font-mono">{diff.prunedMonths.join(', ')}</span>
          </p>
        ) : null}
      </section>

      {/* Drift */}
      <section>
        <h4 className="font-semibold mb-1.5 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Drift detectado
          <Badge variant="outline" className="text-caption">{drift.length}</Badge>
        </h4>
        {drift.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma anomalia detectada nesta importação.</p>
        ) : (
          <div className="space-y-1">
            {[...severeDrift, ...warnDrift, ...infoDrift].slice(0, 12).map((d, i) => (
              <DriftLine key={i} drift={d} />
            ))}
            {drift.length > 12 && (
              <p className="text-muted-foreground">… e mais {drift.length - 12} avisos.</p>
            )}
          </div>
        )}
      </section>

      {/* Parser report */}
      <section>
        <h4 className="font-semibold mb-1.5 flex items-center gap-1">
          <Cpu className="h-3 w-3" /> Parser & integridade
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <KV label="Parser" value={row.parser_version ?? '(ausente)'} mono />
          <KV label="Duração" value={fmtMs(row.duration_ms)} />
          <KV label="Content hash" value={row.content_hash ?? '—'} mono small />
          <KV label="Import token" value={row.import_token ?? '—'} mono small />
        </div>
      </section>

      {/* Rollback trail */}
      {row.status === 'rolled_back' && (
        <section>
          <h4 className="font-semibold mb-1.5 flex items-center gap-1">
            <RotateCcw className="h-3 w-3" /> Trilha de rollback
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <KV label="Revertido em" value={row.rolled_back_at ? fmtDateTime(row.rolled_back_at) : '—'} />
            <KV label="Operador" value={row.rolled_back_by ?? '—'} mono small />
          </div>
        </section>
      )}
    </div>
  );
}

function DriftLine({ drift }: { drift: DriftWarning }) {
  const tone =
    drift.severity === 'severe' ? 'border-destructive/40 bg-destructive/10 text-destructive'
    : drift.severity === 'warn' ? 'border-warning/40 bg-warning/10'
    : 'border-muted bg-muted/30 text-muted-foreground';
  return (
    <div className={`rounded px-2 py-1 border ${tone}`}>
      <span className="font-medium uppercase text-caption mr-1">[{drift.severity}]</span>
      Grupo {drift.groupNumber}
      {drift.assemblyMonth ? ` · ${drift.assemblyMonth}` : ''} · {drift.metric}: {drift.message}
      {typeof drift.before === 'number' && typeof drift.after === 'number' && (
        <span className="font-mono ml-1">({drift.before} → {drift.after})</span>
      )}
    </div>
  );
}

function KV({
  label, value, mono, small,
}: { label: string; value: string | number; mono?: boolean; small?: boolean }) {
  return (
    <div className="border rounded p-1.5 bg-muted/20 min-w-0">
      <div className="text-caption uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={`${mono ? 'font-mono' : ''} ${small ? 'text-caption' : 'text-xs'} truncate`}
        title={String(value)}
      >
        {value}
      </div>
    </div>
  );
}

// FileSpreadsheet icon used in empty state — re-export pattern to avoid extra import line.
function FileSpreadsheet(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/>
    </svg>
  );
}
