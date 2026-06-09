import type { GovernanceBlock } from '@/data/governance';
import { cn } from '@/lib/utils';
import { Info, AlertTriangle, ShieldCheck, OctagonAlert, FileText, BookOpen, Activity } from 'lucide-react';

const metricToneStyles: Record<'positive' | 'warn' | 'critical' | 'info', string> = {
  positive: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  warn: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  critical: 'border-destructive/30 bg-destructive/5 text-destructive',
  info: 'border-border bg-muted/40 text-foreground',
};

const toneStyles: Record<NonNullable<GovernanceBlock['tone']>, { bg: string; border: string; icon: typeof Info }> = {
  info: { bg: 'bg-muted/40', border: 'border-border', icon: Info },
  positive: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/30', icon: ShieldCheck },
  warn: { bg: 'bg-amber-500/5', border: 'border-amber-500/30', icon: AlertTriangle },
  critical: { bg: 'bg-destructive/5', border: 'border-destructive/30', icon: OctagonAlert },
};

function SinceBadge({ since }: { since?: string }) {
  if (!since) return null;
  return (
    <span className="ml-2 inline-block text-micro font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground align-middle">
      desde {since}
    </span>
  );
}

export function GovernanceBlockView({ block }: { block: GovernanceBlock }) {
  switch (block.kind) {
    case 'paragraph':
      return (
        <div className="space-y-2">
          {block.title && (
            <h3 className="text-sm font-semibold text-foreground">
              {block.title}
              <SinceBadge since={block.since} />
            </h3>
          )}
          <p className="text-sm leading-relaxed text-muted-foreground">{block.text}</p>
        </div>
      );

    case 'bullets':
      return (
        <div className="space-y-2">
          {block.title && (
            <h3 className="text-sm font-semibold text-foreground">
              {block.title}
              <SinceBadge since={block.since} />
            </h3>
          )}
          <ul className="space-y-1.5">
            {block.items?.map((it, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-primary mt-1 leading-none">•</span>
                <span className="leading-relaxed">{it}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'kv':
      return (
        <div className="space-y-2">
          {block.title && (
            <h3 className="text-sm font-semibold text-foreground">
              {block.title}
              <SinceBadge since={block.since} />
            </h3>
          )}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {block.pairs?.map((p, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-4 px-3 py-2 text-xs',
                  i > 0 && 'border-t border-border'
                )}
              >
                <span className="font-medium text-foreground min-w-[140px]">{p.label}</span>
                <span className="text-muted-foreground leading-relaxed">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'callout': {
      const tone = toneStyles[block.tone ?? 'info'];
      const Icon = tone.icon;
      return (
        <div className={cn('rounded-lg border p-3 flex gap-3', tone.bg, tone.border)}>
          <Icon className="h-4 w-4 mt-0.5 text-foreground/70 shrink-0" />
          <div className="space-y-1">
            {block.title && (
              <p className="text-xs font-semibold text-foreground">
                {block.title}
                <SinceBadge since={block.since} />
              </p>
            )}
            <p className="text-xs leading-relaxed text-muted-foreground">{block.text}</p>
          </div>
        </div>
      );
    }

    case 'code':
      return (
        <div className="space-y-2">
          {block.title && <h3 className="text-sm font-semibold text-foreground">{block.title}</h3>}
          <pre className="rounded-lg border border-border bg-muted/40 p-3 text-xs overflow-x-auto">
            <code>{block.code}</code>
          </pre>
        </div>
      );

    case 'audit-link':
      return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 flex items-center gap-3">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">{block.auditDescription}</p>
            <p className="text-caption text-muted-foreground truncate font-mono">{block.auditPath}</p>
          </div>
        </div>
      );

    case 'policy':
      return (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 flex items-center gap-3">
          <BookOpen className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">
              {block.policyDescription}
              <span className="ml-2 text-micro uppercase tracking-wider text-primary">Política institucional</span>
            </p>
            <p className="text-caption text-muted-foreground truncate font-mono">{block.policyPath}</p>
          </div>
        </div>
      );

    case 'metric':
      return (
        <div className="space-y-2">
          {block.title && (
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-primary" />
              {block.title}
              <SinceBadge since={block.since} />
            </h3>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {block.metrics?.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-lg border px-3 py-2',
                  metricToneStyles[m.tone ?? 'info'],
                )}
              >
                <p className="text-caption uppercase tracking-wider opacity-70">{m.label}</p>
                <p className="text-sm font-semibold tabular-nums">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}
