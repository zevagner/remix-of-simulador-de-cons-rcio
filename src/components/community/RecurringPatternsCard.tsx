/**
 * RecurringPatternsCard — Onda 3 / memória consultiva.
 * Mostra padrões recorrentes (tipo + etapa) com taxa de "funcionou".
 * Sem analytics inflado — apenas leitura determinística.
 */
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Loader2, ChevronDown } from 'lucide-react';
import { listRecurringPatterns, type RecurringPattern } from '@/services/community';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const TYPE_LABEL: Record<string, string> = {
  imobiliario: 'Imóveis',
  auto: 'Auto',
  pesados: 'Pesados',
  agro: 'Agro',
  energia_solar: 'Solar',
  geral: 'Geral',
};

const STAGE_LABEL: Record<string, string> = {
  cliente_proposta: 'Cliente / proposta',
  objecao: 'Objeção',
  estrategia: 'Estratégia',
  grupos_lances: 'Grupos / lances',
  duvida_operacional: 'Dúvida operacional',
  outro: 'Outro',
  proposta: 'Da Carteira',
  simulacao: 'Do Simulador',
  pos_venda: 'Pós-venda',
  geral: 'Geral',
};

export function RecurringPatternsCard() {
  const { user } = useAuth();
  const storageKey = user?.userId ? `community_patterns_expanded_${user.userId}` : null;
  const [expanded, setExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !storageKey) return false;
    try { return window.localStorage.getItem(storageKey) === '1'; } catch { return false; }
  });
  const [items, setItems] = useState<RecurringPattern[] | null>(null);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      const data = await listRecurringPatterns();
      if (!cancel) setItems(data);
    })();
    return () => { cancel = true; };
  }, []);

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      if (storageKey) {
        try { window.localStorage.setItem(storageKey, next ? '1' : '0'); } catch { /* noop */ }
      }
      return next;
    });
  };

  if (items === null) {
    return (
      <Card className="p-3 text-xs text-muted-foreground inline-flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin" /> lendo padrões…
      </Card>
    );
  }
  if (items.length === 0) return null;

  return (
    <Card className="p-3 sm:p-4">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        className="w-full flex items-center gap-2 text-left focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-sm"
      >
        <TrendingUp className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-semibold">Onde a comunidade mais aprende</span>
        <span className="text-caption text-muted-foreground hidden sm:inline">últimos 6 meses</span>
        <Badge variant="outline" className="text-caption ml-auto">{items.length}</Badge>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0',
            expanded && 'rotate-180',
          )}
        />
      </button>
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 animate-fade-in">
          {items.map((p, i) => {
            const ratio = p.total_cases > 0 ? p.worked_cases / p.total_cases : 0;
            return (
              <div key={i} className="rounded-md border border-border bg-background p-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium">
                    {TYPE_LABEL[p.consortium_type] ?? p.consortium_type}
                  </span>
                  <span className="text-caption text-muted-foreground">·</span>
                  <span className="text-xs">{STAGE_LABEL[p.stage] ?? p.stage}</span>
                  <Badge variant="outline" className="text-caption ml-auto">{p.total_cases} casos</Badge>
                </div>
                <div className="text-caption text-muted-foreground mt-1">
                  {p.resolved_cases} resolvidos · {p.worked_cases} funcionaram
                  {ratio >= 0.6 && p.worked_cases >= 2 && (
                    <span className="text-success ml-1">· repertório forte</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
