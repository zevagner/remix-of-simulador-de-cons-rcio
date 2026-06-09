/**
 * ReferenceCasesPanel — Onda 3 / curadoria leve, determinística.
 * Casos referência: resolvidos + aplicado_funcionou + resposta destacada.
 */
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, CheckCircle2, MessageSquare, Eye, Loader2, ChevronDown } from 'lucide-react';
import { listReferenceCases, type ReferenceCase } from '@/services/community';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Props {
  onOpen: (caseId: string) => void;
  limit?: number;
}

export function ReferenceCasesPanel({ onOpen, limit = 10 }: Props) {
  const { user } = useAuth();
  const storageKey = user?.userId ? `community_reference_expanded_${user.userId}` : null;
  const [expanded, setExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !storageKey) return false;
    try { return window.localStorage.getItem(storageKey) === '1'; } catch { return false; }
  });
  const [items, setItems] = useState<ReferenceCase[] | null>(null);

  useEffect(() => {
    if (!expanded) return;
    if (items !== null) return;
    let cancel = false;
    void (async () => {
      const data = await listReferenceCases(limit);
      if (!cancel) setItems(data);
    })();
    return () => { cancel = true; };
  }, [limit, expanded, items]);

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      if (storageKey) {
        try { window.localStorage.setItem(storageKey, next ? '1' : '0'); } catch { /* noop */ }
      }
      return next;
    });
  };

  return (
    <Card className="p-3 sm:p-4 border-success/30 bg-success/5">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        className="w-full flex items-center gap-2 text-left focus:outline-none focus:ring-2 focus:ring-success/30 rounded-sm"
      >
        <Award className="h-4 w-4 text-success shrink-0" />
        <span className="text-sm font-semibold">Casos referência</span>
        <span className="text-caption text-muted-foreground hidden sm:inline">
          desfechos aplicados que viraram repertório consultivo
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-auto',
            expanded && 'rotate-180',
          )}
        />
      </button>
      {expanded && (
        <div className="mt-3 animate-fade-in">
          {items === null ? (
            <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> carregando…
            </div>
          ) : items.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Ainda não há casos referência. Quando gerentes aplicarem estratégias e marcarem como "funcionou",
              os melhores casos aparecem aqui.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => onOpen(c.id)}
                    className="w-full text-left rounded-md border border-success/20 bg-background p-2.5 hover:border-success/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold truncate flex-1">{c.title}</span>
                      <Badge variant="outline" className="text-caption border-success/40 text-success gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" /> funcionou
                      </Badge>
                    </div>
                    {c.outcome && (
                      <p className="text-caption text-muted-foreground line-clamp-2 mt-0.5">{c.outcome}</p>
                    )}
                    <div className="flex items-center gap-3 text-caption text-muted-foreground mt-1">
                      <span className="inline-flex items-center gap-1"><MessageSquare className="h-2.5 w-2.5" />{c.reply_count}</span>
                      <span className="inline-flex items-center gap-1"><Eye className="h-2.5 w-2.5" />{c.view_count}</span>
                      <span className="inline-flex items-center gap-1">★ {c.helpful_count}</span>
                      {c.consortium_type && <span className="uppercase">{c.consortium_type}</span>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
