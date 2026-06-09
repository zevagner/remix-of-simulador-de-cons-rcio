/**
 * AlertsCenter — Sino de alertas no header da Carteira.
 * Agrega: leads atrasados, sem próxima ação, propostas paradas 5+d.
 * Derivado da lista local de propostas — sem schema novo.
 */
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, AlertCircle, BellOff, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProposalWithPriority } from '@/utils/proposalPriority';
import { ACTIVE_STATUSES, STALE_DAYS_CRITICAL, daysSince, hasNextAction } from './cadenceRules';

interface AlertItem {
  id: string;
  name: string;
  reason: string;
  severity: 'high' | 'medium';
}

interface AlertsCenterProps {
  proposals: ProposalWithPriority[];
  onOpenLead: (id: string) => void;
}

export function AlertsCenter({ proposals, onOpenLead }: AlertsCenterProps) {
  const [open, setOpen] = useState(false);

  const { overdue, missingAction, veryStale, total } = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    const overdue: AlertItem[] = [];
    const missingAction: AlertItem[] = [];
    const veryStale: AlertItem[] = [];

    for (const p of proposals) {
      if (!ACTIVE_STATUSES.has(p.status)) continue;
      const name = p.client_name || 'Sem nome';

      // Atrasado
      if (p.next_contact_date) {
        const d = new Date(p.next_contact_date + 'T00:00:00');
        if (d.getTime() < todayStart.getTime()) {
          const days = Math.ceil((todayStart.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
          overdue.push({ id: p.id, name, reason: `Atrasado há ${days}d`, severity: 'high' });
          continue;
        }
      }

      // Sem próxima ação definida
      if (!hasNextAction(p) && !p.next_contact_date) {
        missingAction.push({ id: p.id, name, reason: 'Sem próxima ação', severity: 'medium' });
        continue;
      }

      // Inatividade crítica (cadência única)
      const days = daysSince(p.updated_at);
      if (days >= STALE_DAYS_CRITICAL) {
        veryStale.push({ id: p.id, name, reason: `Sem mexer há ${days}d`, severity: 'medium' });
      }
    }

    return {
      overdue,
      missingAction,
      veryStale,
      total: overdue.length + missingAction.length + veryStale.length,
    };
  }, [proposals]);

  const handleOpenLead = (id: string) => {
    setOpen(false);
    onOpenLead(id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'relative h-8 gap-1.5 text-xs',
            total > 0 && 'border-warning/40 text-warning hover:bg-warning/10 hover:text-warning',
          )}
        >
          <Bell className="h-3.5 w-3.5" />
          Alertas
          {total > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-caption bg-warning/20 text-warning border-0">
              {total}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            Centro de Alertas
            <span className="text-muted-foreground font-normal ml-auto">{total} ativo{total !== 1 ? 's' : ''}</span>
          </p>
        </div>

        {total === 0 ? (
          <div className="px-3 py-6 text-center">
            <BellOff className="h-6 w-6 text-muted-foreground/70 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Tudo sob controle ✓</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            <AlertGroup
              title="Atrasados"
              icon={<AlertCircle className="h-3 w-3" />}
              tone="destructive"
              items={overdue}
              onOpenLead={handleOpenLead}
            />
            <AlertGroup
              title="Sem próxima ação"
              icon={<Bell className="h-3 w-3" />}
              tone="warning"
              items={missingAction}
              onOpenLead={handleOpenLead}
            />
            <AlertGroup
              title={`Sem mexer ${STALE_DAYS_CRITICAL}+ dias`}
              icon={<Clock className="h-3 w-3" />}
              tone="muted"
              items={veryStale}
              onOpenLead={handleOpenLead}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface AlertGroupProps {
  title: string;
  icon: React.ReactNode;
  tone: 'destructive' | 'warning' | 'muted';
  items: AlertItem[];
  onOpenLead: (id: string) => void;
}

const TONE: Record<AlertGroupProps['tone'], string> = {
  destructive: 'text-destructive',
  warning: 'text-warning',
  muted: 'text-muted-foreground',
};

function AlertGroup({ title, icon, tone, items, onOpenLead }: AlertGroupProps) {
  if (items.length === 0) return null;
  return (
    <div className="border-b border-border last:border-b-0">
      <div className={cn('flex items-center gap-1.5 px-3 py-1.5 bg-muted/30 text-caption font-semibold uppercase tracking-wide', TONE[tone])}>
        {icon}
        <span>{title}</span>
        <span className="ml-auto text-muted-foreground font-normal">{items.length}</span>
      </div>
      <ul className="py-1">
        {items.slice(0, 6).map(item => (
          <li key={item.id}>
            <button
              onClick={() => onOpenLead(item.id)}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted/40 text-left transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate leading-tight">{item.name}</p>
                <p className="text-caption text-muted-foreground truncate leading-tight">{item.reason}</p>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/70 shrink-0" />
            </button>
          </li>
        ))}
        {items.length > 6 && (
          <li className="px-3 py-1 text-caption text-muted-foreground/70 text-center">
            + {items.length - 6} no Kanban
          </li>
        )}
      </ul>
    </div>
  );
}
