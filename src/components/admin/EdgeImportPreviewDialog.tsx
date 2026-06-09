/**
 * EdgeImportPreviewDialog — Modal institucional de preview→commit do pipeline edge.
 *
 * Onda: Assemblies UX Edge Cutover.
 *
 * Fluxo:
 *   parsing (externo) → records → preview por tipo → diff/drift → commit por tipo.
 *
 * Princípios:
 *   - Nenhuma escrita ocorre sem que o admin veja diff + drift.
 *   - Drift "severe" exige confirmação explícita (checkbox).
 *   - Double-submit protection: estados isolados (loadingPreview/loadingCommit).
 *   - Refresh seguro de cache (`onCommitted`) entregue ao caller.
 *   - Observabilidade via runtimeMetrics.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2, AlertTriangle, ShieldCheck, Diff, GitCommit, FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  previewImport, commitImport,
  type PreviewResponse, type CommitResponse,
} from '@/services/assembliesImport';
import {
  AssemblyRecord, ConsortiumType, CONSORTIUM_TYPE_LABELS,
} from '@/types/consortium';
import { emitMetric } from '@/lib/runtimeMetrics';
import { logger } from '@/utils/logger';

interface Props {
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
  records: AssemblyRecord[];
  source: 'file' | 'paste';
  /** Onda Institutional History: parser usado para gerar os records. */
  parserMeta?: { parserVersion?: string; contentHash?: string };
  onCommitted?: () => void;
}

interface PerTypePreview {
  type: ConsortiumType;
  records: AssemblyRecord[];
  preview?: PreviewResponse;
  error?: string;
}

function fmtMs(ms: number) {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)}s`;
}

export default function EdgeImportPreviewDialog({
  isOpen, onOpenChange, records, source, parserMeta, onCommitted,
}: Props) {
  const [stage, setStage] = useState<'idle' | 'previewing' | 'ready' | 'committing' | 'done'>('idle');
  const [perType, setPerType] = useState<PerTypePreview[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [previewMs, setPreviewMs] = useState<number | null>(null);

  // Group records by consortiumType (edge accepts one type per call).
  const groups = useMemo<PerTypePreview[]>(() => {
    const byType = new Map<ConsortiumType, AssemblyRecord[]>();
    for (const r of records) {
      const arr = byType.get(r.consortiumType) ?? [];
      arr.push(r);
      byType.set(r.consortiumType, arr);
    }
    return Array.from(byType.entries()).map(([type, recs]) => ({ type, records: recs }));
  }, [records]);

  // Reset state when modal opens with a new payload.
  useEffect(() => {
    if (!isOpen) return;
    setStage('idle');
    setPerType(groups);
    setAcknowledged(false);
    setPreviewMs(null);
  }, [isOpen, groups]);

  const totalSevere = perType.reduce(
    (sum, g) => sum + (g.preview?.drift.filter(d => d.severity === 'severe').length ?? 0), 0,
  );
  const totalWarn = perType.reduce(
    (sum, g) => sum + (g.preview?.drift.filter(d => d.severity === 'warn').length ?? 0), 0,
  );
  const totalNew = perType.reduce((s, g) => s + (g.preview?.diff.newRows ?? 0), 0);
  const totalUpdated = perType.reduce((s, g) => s + (g.preview?.diff.updatedRows ?? 0), 0);
  const totalUnchanged = perType.reduce((s, g) => s + (g.preview?.diff.unchangedRows ?? 0), 0);
  const allMonths = Array.from(new Set(perType.flatMap(g => g.preview?.diff.affectedMonths ?? []))).sort();
  const allPruned = Array.from(new Set(perType.flatMap(g => g.preview?.diff.prunedMonths ?? []))).sort();
  const groupCount = new Set(perType.flatMap(g => g.preview?.diff.affectedGroups ?? [])).size;

  const runPreview = useCallback(async () => {
    if (records.length === 0) {
      toast.error('Nenhum registro para previsualizar');
      return;
    }
    setStage('previewing');
    const t0 = performance.now();
    const next: PerTypePreview[] = [];
    for (const g of groups) {
      try {
        const preview = await previewImport(g.type, g.records);
        next.push({ ...g, preview });
      } catch (err) {
        logger.error('[edge-cutover] preview error', err);
        next.push({ ...g, error: (err as Error).message ?? 'Falha no preview' });
      }
    }
    const dur = Math.round(performance.now() - t0);
    setPreviewMs(dur);
    setPerType(next);
    setStage('ready');
    emitMetric({
      type: 'interaction',
      name: 'assemblies.edge_preview',
      value: dur,
      module: 'admin-assemblies',
      meta: { source, types: groups.map(g => g.type).join(','), rows: records.length },
    });
    const failed = next.filter(g => g.error);
    if (failed.length > 0) {
      toast.error(`Falha no preview de ${failed.length} tipo(s)`);
    } else {
      toast.success(`Preview pronto em ${fmtMs(dur)}`);
    }
  }, [groups, records, source]);

  const runCommit = useCallback(async () => {
    if (totalSevere > 0 && !acknowledged) {
      toast.error('Confirme os avisos severos antes de prosseguir');
      return;
    }
    setStage('committing');
    const t0 = performance.now();
    const results: CommitResponse[] = [];
    let failed = 0;
    for (const g of perType) {
      if (!g.preview || g.error) { failed++; continue; }
      try {
        const res = await commitImport(g.type, g.records, g.preview.importToken, acknowledged, parserMeta);
        results.push(res);
      } catch (err) {
        logger.error('[edge-cutover] commit error', err);
        toast.error(`Falha no commit de ${CONSORTIUM_TYPE_LABELS[g.type]}: ${(err as Error).message}`);
        failed++;
      }
    }
    const dur = Math.round(performance.now() - t0);
    emitMetric({
      type: 'interaction',
      name: 'assemblies.edge_commit',
      value: dur,
      module: 'admin-assemblies',
      meta: {
        source, types: perType.map(g => g.type).join(','),
        committed: results.length, failed,
        severe: totalSevere, acknowledged,
      },
    });
    setStage('done');
    if (results.length > 0) {
      toast.success(`Commit concluído (${results.length} tipo(s) em ${fmtMs(dur)})`);
      onCommitted?.();
      onOpenChange(false);
    }
  }, [perType, acknowledged, totalSevere, source, onCommitted, onOpenChange, parserMeta]);

  const busy = stage === 'previewing' || stage === 'committing';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => { if (!busy) onOpenChange(v); }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Pipeline institucional · Preview de import
          </DialogTitle>
          <DialogDescription>
            Nenhuma alteração é aplicada sem diff e confirmação.
            {' '}Origem: <strong>{source === 'file' ? 'Upload Excel' : 'Colar dados'}</strong>
            {' · '}{records.length} registros · {groups.length} tipo(s)
          </DialogDescription>
        </DialogHeader>

        {stage === 'idle' && (
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertTitle>Pronto para previsualizar</AlertTitle>
            <AlertDescription>
              Clique em <strong>Calcular preview</strong> para ver diff e drift antes de gravar.
              Tipos detectados: {groups.map(g => `${CONSORTIUM_TYPE_LABELS[g.type]} (${g.records.length})`).join(' · ')}.
            </AlertDescription>
          </Alert>
        )}

        {stage === 'previewing' && (
          <div className="flex items-center gap-2 text-sm py-6">
            <Loader2 className="h-4 w-4 animate-spin" /> Calculando diff e drift no servidor…
          </div>
        )}

        {(stage === 'ready' || stage === 'committing' || stage === 'done') && (
          <div className="space-y-3">
            {/* Resumo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <SummaryTile label="Novos" value={totalNew} variant="success" />
              <SummaryTile label="Atualizados" value={totalUpdated} variant="warning" />
              <SummaryTile label="Inalterados" value={totalUnchanged} variant="muted" />
              <SummaryTile label="Grupos afetados" value={groupCount} />
            </div>

            {allMonths.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Meses afetados: <span className="font-mono">{allMonths.join(', ')}</span>
              </div>
            )}
            {allPruned.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Meses removidos pela retenção</AlertTitle>
                <AlertDescription>
                  <span className="font-mono">{allPruned.join(', ')}</span>
                </AlertDescription>
              </Alert>
            )}

            {previewMs !== null && (
              <div className="text-xs text-muted-foreground">
                Preview calculado em {fmtMs(previewMs)}.
              </div>
            )}

            {/* Drift por tipo */}
            <div className="space-y-2">
              {perType.map(g => (
                <div key={g.type} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{CONSORTIUM_TYPE_LABELS[g.type]}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {g.records.length} linhas enviadas
                      </span>
                    </div>
                    {g.error && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" /> {g.error}
                      </Badge>
                    )}
                    {g.preview && (
                      <div className="flex gap-1 text-xs">
                        <Badge variant="default">+{g.preview.diff.newRows}</Badge>
                        <Badge variant="secondary">~{g.preview.diff.updatedRows}</Badge>
                        {g.preview.diff.prunedMonths.length > 0 && (
                          <Badge variant="destructive">−{g.preview.diff.prunedMonths.length}m</Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {g.preview && g.preview.drift.length > 0 && (
                    <div className="space-y-1">
                      {g.preview.drift.slice(0, 8).map((d, i) => (
                        <div
                          key={i}
                          className={`text-xs rounded px-2 py-1 border ${
                            d.severity === 'severe'
                              ? 'border-destructive/40 bg-destructive/10 text-destructive'
                              : d.severity === 'warn'
                                ? 'border-warning/40 bg-warning/10'
                                : 'border-muted bg-muted/30 text-muted-foreground'
                          }`}
                        >
                          <span className="font-medium">[{d.severity}]</span> Grupo {d.groupNumber}
                          {d.assemblyMonth ? ` · ${d.assemblyMonth}` : ''} · {d.metric}: {d.message}
                          {typeof d.before === 'number' && typeof d.after === 'number' && (
                            <span className="font-mono ml-1">({d.before} → {d.after})</span>
                          )}
                        </div>
                      ))}
                      {g.preview.drift.length > 8 && (
                        <div className="text-xs text-muted-foreground">
                          … e mais {g.preview.drift.length - 8} avisos.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalSevere > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{totalSevere} aviso(s) severo(s)</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    O pipeline detectou variações fora do esperado. Confirme explicitamente
                    para prosseguir — caso contrário, cancele e revise a base.
                  </p>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={acknowledged}
                      onCheckedChange={(v) => setAcknowledged(v === true)}
                    />
                    Reconheço os avisos severos e autorizo o commit.
                  </label>
                </AlertDescription>
              </Alert>
            )}

            {totalWarn > 0 && totalSevere === 0 && (
              <div className="text-xs text-muted-foreground">
                {totalWarn} aviso(s) de atenção (não bloqueiam o commit).
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={busy}>Cancelar</Button>
          </DialogClose>
          {stage === 'idle' && (
            <Button onClick={runPreview} className="gap-2">
              <Diff className="h-4 w-4" /> Calcular preview
            </Button>
          )}
          {stage === 'previewing' && (
            <Button disabled className="gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Calculando…
            </Button>
          )}
          {stage === 'ready' && (
            <Button
              onClick={runCommit}
              disabled={(totalSevere > 0 && !acknowledged) || perType.every(g => !g.preview)}
              className="gap-2"
            >
              <GitCommit className="h-4 w-4" /> Confirmar commit
            </Button>
          )}
          {stage === 'committing' && (
            <Button disabled className="gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Aplicando…
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryTile({
  label, value, variant = 'default',
}: { label: string; value: number; variant?: 'success' | 'warning' | 'muted' | 'default' }) {
  const tone =
    variant === 'success' ? 'border-success/30 bg-success/5'
    : variant === 'warning' ? 'border-warning/30 bg-warning/5'
    : variant === 'muted' ? 'border-muted bg-muted/30'
    : 'border-primary/20 bg-primary/5';
  return (
    <div className={`border rounded-md p-2 text-center ${tone}`}>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-caption uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
