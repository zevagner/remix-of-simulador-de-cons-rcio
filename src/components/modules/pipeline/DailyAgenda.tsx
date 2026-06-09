/**
 * DailyAgenda — "O que fazer hoje"
 * Lista derivada (sem schema novo) que prioriza ações para o vendedor:
 *  🔴 Atrasados   → next_contact_date < hoje
 *  🟡 Hoje        → next_contact_date == hoje
 *  🟠 Parados 3+d → updated_at < hoje-3 (status ativo)
 *  🔥 Top 3       → maiores priorityScore (status ativo)
 *
 * Estado colapsado persiste em localStorage.
 */
import { useMemo, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, AlertCircle, CalendarClock, Clock, Flame, ArrowRight, Target, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProposalWithPriority } from '@/utils/proposalPriority';
import { ACTIVE_STATUSES, STALE_DAYS_WARN } from './cadenceRules';

const STORAGE_KEY = 'carteira-daily-agenda-collapsed';

interface DailyAgendaProps {
  proposals: ProposalWithPriority[];
  onOpenLead: (id: string) => void;
  onCompleteAction?: (id: string) => void;
}

interface AgendaItem {
  proposal: ProposalWithPriority;
  action: string;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function DailyAgenda({ proposals, onOpenLead, onCompleteAction }: DailyAgendaProps) {
  // Default OPEN — "O que fazer hoje" é a informação mais importante da Carteira.
  // Usuário pode recolher manualmente; preferência persiste em localStorage.
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === '0') setCollapsed(false);
    } catch { /* noop */ }
  }, []);

  const toggle = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch { /* noop */ }
      return next;
    });
  };

  const { overdue, today, stale, hot, noAction, total } = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const staleCutoff = new Date(todayStart);
    staleCutoff.setDate(staleCutoff.getDate() - STALE_DAYS_WARN);

    const active = proposals.filter(p => ACTIVE_STATUSES.has(p.status));
    const overdue: AgendaItem[] = [];
    const today: AgendaItem[] = [];
    const stale: AgendaItem[] = [];

    const seen = new Set<string>();

    for (const p of active) {
      if (p.next_contact_date) {
        const d = new Date(p.next_contact_date + 'T00:00:00');
        if (d < todayStart) {
          overdue.push({ proposal: p, action: 'Contato em atraso' });
          seen.add(p.id);
          continue;
        }
        if (d.getTime() === todayStart.getTime()) {
          today.push({ proposal: p, action: 'Contato agendado' });
          seen.add(p.id);
          continue;
        }
      }
      const updated = new Date(p.updated_at);
      if (updated < staleCutoff) {
        const days = Math.floor((todayStart.getTime() - startOfDay(updated).getTime()) / (1000 * 60 * 60 * 24));
        stale.push({ proposal: p, action: `Sem atualização há ${days}d` });
        seen.add(p.id);
      }
    }

    const hot = active
      .filter(p => !seen.has(p.id) && p.priority === 'alta')
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 3)
      .map(p => ({ proposal: p, action: p.priorityReason || 'Alta prioridade' }));

    hot.forEach(h => seen.add(h.proposal.id));

    // Sem próxima ação definida (independente de data) — força definição de ação
    const noAction: AgendaItem[] = active
      .filter(p => !p.next_action_type)
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .map(p => ({ proposal: p, action: 'Definir próxima ação' }));

    return {
      overdue,
      today,
      stale,
      hot,
      noAction,
      total: overdue.length + today.length + stale.length + hot.length + noAction.length,
    };
  }, [proposals]);

  if (total === 0) return null;

  return (
    <Card className="border-l-4 border-l-primary">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">📋</span>
          <span className="text-sm font-semibold text-foreground">O que fazer hoje</span>
          <Badge variant="secondary" className="text-caption h-5">{total}</Badge>
          {!collapsed ? null : (
            <div className="hidden sm:flex items-center gap-1.5 ml-2 text-caption text-muted-foreground">
              {overdue.length > 0 && <span className="text-destructive">🔴 {overdue.length}</span>}
              {today.length > 0 && <span className="text-warning">🟡 {today.length}</span>}
              {stale.length > 0 && <span className="text-chart-4">🟠 {stale.length}</span>}
              {hot.length > 0 && <span className="text-destructive">🔥 {hot.length}</span>}
              {noAction.length > 0 && <span className="text-primary">🎯 {noAction.length}</span>}
            </div>
          )}
        </div>
        {collapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <AgendaSection
            title="Atrasados"
            icon={<AlertCircle className="h-3.5 w-3.5" />}
            tone="destructive"
            items={overdue}
            onOpenLead={onOpenLead}
            onCompleteAction={onCompleteAction}
          />
          <AgendaSection
            title="Hoje"
            icon={<CalendarClock className="h-3.5 w-3.5" />}
            tone="warning"
            items={today}
            onOpenLead={onOpenLead}
            onCompleteAction={onCompleteAction}
          />
          <AgendaSection
            title={`Parados ${STALE_DAYS_WARN}+ dias`}
            icon={<Clock className="h-3.5 w-3.5" />}
            tone="orange"
            items={stale}
            onOpenLead={onOpenLead}
            onCompleteAction={onCompleteAction}
          />
          <AgendaSection
            title="Prioridade alta"
            icon={<Flame className="h-3.5 w-3.5" />}
            tone="destructive"
            items={hot}
            onOpenLead={onOpenLead}
            onCompleteAction={onCompleteAction}
          />
          <AgendaSection
            title="Sem próxima ação"
            icon={<Target className="h-3.5 w-3.5" />}
            tone="primary"
            items={noAction}
            onOpenLead={onOpenLead}
          />
        </div>
      )}
    </Card>
  );
}

interface AgendaSectionProps {
  title: string;
  icon: React.ReactNode;
  tone: 'destructive' | 'warning' | 'orange' | 'primary';
  items: AgendaItem[];
  onOpenLead: (id: string) => void;
  onCompleteAction?: (id: string) => void;
}

const TONE_STYLES: Record<AgendaSectionProps['tone'], { header: string; dot: string }> = {
  destructive: { header: 'text-destructive', dot: 'bg-destructive' },
  warning: { header: 'text-warning', dot: 'bg-warning' },
  orange: { header: 'text-chart-4', dot: 'bg-chart-4' },
  primary: { header: 'text-primary', dot: 'bg-primary' },
};

function AgendaSection({ title, icon, tone, items, onOpenLead, onCompleteAction }: AgendaSectionProps) {
  const styles = TONE_STYLES[tone];
  return (
    <div className="rounded-md border border-border bg-card/50 p-2">
      <div className={cn('flex items-center gap-1.5 mb-1.5 text-caption font-semibold uppercase tracking-wide', styles.header)}>
        {icon}
        <span>{title}</span>
        <span className="ml-auto text-caption font-normal text-muted-foreground">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-caption text-muted-foreground/75 italic px-1 py-1">Nada por aqui ✓</p>
      ) : (
        <ul className="space-y-0.5">
          {items.slice(0, 5).map(({ proposal, action }) => {
            const hasAction = !!proposal.next_action_type;
            const showComplete = hasAction && !!onCompleteAction;
            return (
              <li key={proposal.id} className="group flex items-stretch gap-0.5 rounded-md hover:bg-muted/40">
                <button
                  type="button"
                  onClick={() => onOpenLead(proposal.id)}
                  className="flex-1 flex items-center gap-1.5 px-1.5 py-1 text-left rounded-md min-w-0"
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', styles.dot)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-caption font-medium text-foreground truncate leading-tight">
                      {proposal.client_name || 'Sem nome'}
                    </p>
                    <p className="text-caption text-muted-foreground truncate leading-tight">{action}</p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                </button>
                {showComplete && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onCompleteAction!(proposal.id); }}
                    title="Concluir ação e definir a próxima"
                    aria-label="Concluir ação"
                    className="shrink-0 px-1.5 rounded-md text-success hover:bg-success/10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
          {items.length > 5 && (
            <li className="text-caption text-muted-foreground/70 text-center pt-0.5">
              + {items.length - 5} no Kanban
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
