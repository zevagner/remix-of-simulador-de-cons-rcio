/**
 * ProposalHistoryTab — timeline imutável dos eventos de um lead.
 * Lê de proposal_events (populada por triggers de DB).
 */
import { useProposalEvents } from '@/hooks/useProposalEvents';
import type { ProposalEvent } from '@/services/proposalEvents';
import { Sparkles, ArrowRight, Bell, FileEdit, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COLUMNS, NEXT_ACTION_LOOKUP, type NextActionType } from './pipelineConstants';

interface ProposalHistoryTabProps {
  proposalId: string;
}

function statusLabel(s: string | null): string {
  if (!s) return '—';
  return COLUMNS.find(c => c.status === s)?.label ?? s;
}

function statusEmoji(s: string | null): string {
  if (!s) return '•';
  return COLUMNS.find(c => c.status === s)?.emoji ?? '•';
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d atrás`;
  return formatDateTime(iso);
}

export function ProposalHistoryTab({ proposalId }: ProposalHistoryTabProps) {
  const { data: events = [], isLoading } = useProposalEvents(proposalId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Carregando histórico...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Nenhum evento registrado ainda.
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {events.map((ev, idx) => (
        <EventRow key={ev.id} event={ev} isFirst={idx === 0} />
      ))}
    </div>
  );
}

function EventRow({ event, isFirst }: { event: ProposalEvent; isFirst: boolean }) {
  const { icon, label, detail, tone } = describeEvent(event);
  return (
    <div className={cn(
      'flex gap-3 rounded-md border p-2.5',
      isFirst ? 'border-primary/30 bg-primary/5' : 'border-border bg-card/40',
    )}>
      <div className={cn(
        'shrink-0 h-7 w-7 rounded-full flex items-center justify-center',
        tone === 'primary' && 'bg-primary/15 text-primary',
        tone === 'success' && 'bg-success/15 text-success',
        tone === 'warning' && 'bg-warning/15 text-warning',
        tone === 'muted' && 'bg-muted text-muted-foreground',
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground leading-tight">{label}</p>
        {detail && <p className="text-caption text-muted-foreground mt-0.5 leading-snug">{detail}</p>}
        <p className="text-caption text-muted-foreground/70 mt-1" title={formatDateTime(event.created_at)}>
          {relativeTime(event.created_at)}
        </p>
      </div>
    </div>
  );
}

function describeEvent(ev: ProposalEvent): {
  icon: React.ReactNode;
  label: string;
  detail: string | null;
  tone: 'primary' | 'success' | 'warning' | 'muted';
} {
  switch (ev.event_type) {
    case 'created':
      return {
        icon: <Sparkles className="h-3.5 w-3.5" />,
        label: 'Lead criado',
        detail: ev.to_status ? `Iniciado em ${statusEmoji(ev.to_status)} ${statusLabel(ev.to_status)}` : null,
        tone: 'primary',
      };
    case 'status_change': {
      const fromL = `${statusEmoji(ev.from_status)} ${statusLabel(ev.from_status)}`;
      const toL = `${statusEmoji(ev.to_status)} ${statusLabel(ev.to_status)}`;
      return {
        icon: <ArrowRight className="h-3.5 w-3.5" />,
        label: 'Status alterado',
        detail: `${fromL} → ${toL}`,
        tone: ev.to_status === 'fechado' ? 'success' : ev.to_status === 'perdido' ? 'muted' : 'primary',
      };
    }
    case 'next_action_set': {
      const cfg = ev.next_action_type ? NEXT_ACTION_LOOKUP[ev.next_action_type as NextActionType] : null;
      const dateLabel = ev.next_contact_date
        ? new Date(ev.next_contact_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        : null;
      const detail = [
        cfg ? `${cfg.icon} ${cfg.label}` : null,
        dateLabel ? `Para ${dateLabel}` : null,
        ev.next_action_notes ? `"${ev.next_action_notes}"` : null,
      ].filter(Boolean).join(' · ');
      return {
        icon: <Bell className="h-3.5 w-3.5" />,
        label: 'Próxima ação registrada',
        detail: detail || null,
        tone: 'warning',
      };
    }
    case 'notes_updated':
      return {
        icon: <FileEdit className="h-3.5 w-3.5" />,
        label: 'Notas atualizadas',
        detail: null,
        tone: 'muted',
      };
    default:
      return { icon: <FileEdit className="h-3.5 w-3.5" />, label: ev.event_type, detail: null, tone: 'muted' };
  }
}
