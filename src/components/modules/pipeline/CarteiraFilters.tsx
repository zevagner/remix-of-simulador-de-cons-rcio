/**
 * CarteiraFilters — chips compactos de mineração da Carteira (Onda 1).
 *
 * Lentes operacionais que reusam motores existentes:
 *  • Triggers (PROSPECT_TRIGGERS) viram lentes com contagem + atrasados.
 *  • Toggles: 🔥 Quentes, 🟡 Mornos, ❄️ Frios, ⚠️ Sem ação, ⏰ Atrasados.
 *  • Faixa de crédito (até 200k · 200–500 · 500k–1M · 1M+).
 *
 * Sem novo motor: temperatura vem de `scoreProposalUnified`, atraso de
 * `next_contact_date < hoje`, "sem ação" de `next_action_type == null`.
 */
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { PROSPECT_TRIGGERS } from './pipelineConstants';
import type { ProposalWithPriority } from '@/utils/proposalPriority';
import { scoreProposalUnified } from '@/utils/clientScoring';
import { ACTIVE_STATUSES } from './cadenceRules';

export type TempFilter = 'quente' | 'morno' | 'frio' | null;
export type CreditBucket = 'lt200' | 'lt500' | 'lt1M' | 'gte1M' | null;

export interface CarteiraFilterState {
  trigger: string | null;
  temperature: TempFilter;
  missingAction: boolean;
  overdue: boolean;
  creditBucket: CreditBucket;
}

export const EMPTY_FILTERS: CarteiraFilterState = {
  trigger: null,
  temperature: null,
  missingAction: false,
  overdue: false,
  creditBucket: null,
};

interface Props {
  proposals: ProposalWithPriority[];
  filters: CarteiraFilterState;
  onChange: (next: CarteiraFilterState) => void;
}

const CREDIT_BUCKETS: Array<{ key: CreditBucket; label: string; min: number; max: number }> = [
  { key: 'lt200', label: 'até 200k',   min: 0,        max: 200_000 },
  { key: 'lt500', label: '200k–500k',  min: 200_000,  max: 500_000 },
  { key: 'lt1M',  label: '500k–1M',    min: 500_000,  max: 1_000_000 },
  { key: 'gte1M', label: '1M+',        min: 1_000_000, max: Infinity },
];

function isOverdue(dateIso: string | null | undefined): boolean {
  if (!dateIso) return false;
  const d = new Date(dateIso + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

export function applyCarteiraFilters(
  proposals: ProposalWithPriority[],
  f: CarteiraFilterState,
): ProposalWithPriority[] {
  if (
    !f.trigger && !f.temperature && !f.missingAction && !f.overdue && !f.creditBucket
  ) return proposals;

  return proposals.filter((p) => {
    if (f.trigger && (p.prospect_trigger ?? 'nao_identificado') !== f.trigger) return false;
    if (f.missingAction) {
      if (!ACTIVE_STATUSES.has(p.status)) return false;
      if (p.next_action_type) return false;
    }
    if (f.overdue && !isOverdue(p.next_contact_date)) return false;
    if (f.creditBucket) {
      const b = CREDIT_BUCKETS.find(x => x.key === f.creditBucket);
      if (b && (p.credit_value < b.min || p.credit_value >= b.max)) return false;
    }
    if (f.temperature) {
      const u = scoreProposalUnified(p, p.credit_value || 1);
      if (u.temperature !== f.temperature) return false;
    }
    return true;
  });
}

export function CarteiraFilters({ proposals, filters, onChange }: Props) {
  // Contagem por trigger (e atrasados dentro dele) — só ativos.
  const triggerStats = useMemo(() => {
    const map = new Map<string, { total: number; overdue: number }>();
    for (const p of proposals) {
      if (!ACTIVE_STATUSES.has(p.status)) continue;
      const t = p.prospect_trigger ?? 'nao_identificado';
      const s = map.get(t) ?? { total: 0, overdue: 0 };
      s.total += 1;
      if (isOverdue(p.next_contact_date)) s.overdue += 1;
      map.set(t, s);
    }
    return map;
  }, [proposals]);

  // Contagens das lentes
  const lensCounts = useMemo(() => {
    let quente = 0, morno = 0, frio = 0;
    let missing = 0, overdue = 0;
    for (const p of proposals) {
      if (!ACTIVE_STATUSES.has(p.status)) continue;
      const u = scoreProposalUnified(p, p.credit_value || 1);
      if (u.temperature === 'quente') quente += 1;
      else if (u.temperature === 'morno') morno += 1;
      else frio += 1;
      if (!p.next_action_type) missing += 1;
      if (isOverdue(p.next_contact_date)) overdue += 1;
    }
    return { quente, morno, frio, missing, overdue };
  }, [proposals]);

  const hasAny = filters.trigger || filters.temperature || filters.missingAction || filters.overdue || filters.creditBucket;

  // Apenas triggers com pelo menos 1 lead aparecem como chip (mantém compactação).
  const visibleTriggers = PROSPECT_TRIGGERS.filter(t => (triggerStats.get(t.value)?.total ?? 0) > 0);

  return (
    <div className="space-y-3">
      {/* Linha 2: Lentes (Triggers) em scroll horizontal */}
      {visibleTriggers.length > 0 && (
        <div className="">
          <div 
            className="flex items-center gap-2 flex-wrap pb-1"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            {visibleTriggers.map((t) => {
              const s = triggerStats.get(t.value)!;
              const active = filters.trigger === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => onChange({ ...filters, trigger: active ? null : t.value })}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition whitespace-nowrap',
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card hover:bg-muted/40 text-foreground',
                  )}
                  style={{ flexShrink: 0 }}
                  title={t.label}
                >
                  <span>{t.icon}</span>
                  <span>{t.label.replace(/^\S+\s/, '')}</span>
                  <span className="text-muted-foreground/60">{s.total}</span>
                  {s.overdue > 0 && (
                    <Badge variant="outline" className="h-4 px-1 text-[10px] bg-destructive/10 text-destructive border-destructive/30">
                      {s.overdue}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Linha 1: Temperatura e Filtros de Cadência */}
      <div className="flex flex-nowrap gap-2 items-center overflow-x-auto scrollbar-hide">
        <ChipToggle
          active={filters.temperature === 'quente'}
          onClick={() => onChange({ ...filters, temperature: filters.temperature === 'quente' ? null : 'quente' })}
          tone="destructive"
          label={`Quentes · ${lensCounts.quente}`}
        />
        <ChipToggle
          active={filters.temperature === 'morno'}
          onClick={() => onChange({ ...filters, temperature: filters.temperature === 'morno' ? null : 'morno' })}
          tone="warning"
          label={`Mornos · ${lensCounts.morno}`}
        />
        <ChipToggle
          active={filters.temperature === 'frio'}
          onClick={() => onChange({ ...filters, temperature: filters.temperature === 'frio' ? null : 'frio' })}
          tone="muted"
          label={`Frios · ${lensCounts.frio}`}
        />

        <div className="h-4 w-px bg-border mx-1" />

        <ChipToggle
          active={filters.missingAction}
          onClick={() => onChange({ ...filters, missingAction: !filters.missingAction })}
          tone="warning"
          label={`Sem ação · ${lensCounts.missing}`}
        />
        <ChipToggle
          active={filters.overdue}
          onClick={() => onChange({ ...filters, overdue: !filters.overdue })}
          tone="destructive"
          label={`Atrasados · ${lensCounts.overdue}`}
        />

        {hasAny && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1 ml-auto text-muted-foreground hover:text-foreground"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}

function ChipToggle({
  active, onClick, label, tone,
}: {
  active: boolean; onClick: () => void; label: string;
  tone: 'destructive' | 'warning' | 'primary' | 'muted';
}) {
  const tones: Record<'destructive' | 'warning' | 'primary' | 'muted', string> = {
    destructive: 'border-destructive/40 bg-destructive/10 text-destructive',
    warning:     'border-warning/40 bg-warning/10 text-warning',
    primary:     'border-primary/40 bg-primary/10 text-primary',
    muted:       'border-border bg-muted/40 text-foreground',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2 py-0.5 rounded-full border text-caption font-medium transition whitespace-nowrap flex-shrink-0',
        active ? tones[tone] : 'border-border bg-card hover:bg-muted/40 text-muted-foreground',
      )}
    >
      {label}
    </button>
  );
}
