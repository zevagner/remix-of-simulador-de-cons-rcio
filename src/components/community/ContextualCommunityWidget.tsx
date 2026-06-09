/**
 * ContextualCommunityWidget — Onda 3 / integração contextual.
 * Widget recolhido por padrão: "Casos parecidos da Comunidade".
 * Pode ser integrado em qualquer fluxo (Cockpit, Carteira, Pós-venda, Nichos)
 * sem inflar a UI — só aparece se houver casos parecidos.
 */
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ChevronRight, ChevronDown, MessageSquare, CheckCircle2 } from 'lucide-react';
import { listSimilarCases, type SimilarCase } from '@/services/community';
import { cn } from '@/lib/utils';

interface Props {
  consortiumType?: string | null;
  stage?: string | null;
  query?: string | null;
  /** Callback ao clicar em um caso. Recebe o id; quem chama decide a navegação. */
  onOpenCase?: (caseId: string) => void;
  /** Callback "Ver mais na Comunidade" — abre o módulo Comunidade. */
  onOpenCommunity?: () => void;
  className?: string;
}

export function ContextualCommunityWidget({
  consortiumType, stage, query, onOpenCase, onOpenCommunity, className,
}: Props) {
  const [items, setItems] = useState<SimilarCase[] | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      const data = await listSimilarCases({ consortiumType, stage, query, limit: 3 });
      if (!cancel) setItems(data);
    })();
    return () => { cancel = true; };
  }, [consortiumType, stage, query]);

  // Não renderiza nada se não há nada a mostrar — preserva enxutez.
  if (!items || items.length === 0) return null;

  return (
    <Card className={cn('p-3 border-primary/20 bg-primary/5', className)}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-center gap-2 text-left"
      >
        <Users className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold">Gerentes com casos parecidos</span>
        <Badge variant="outline" className="text-caption border-primary/40 text-primary">
          {items.length}
        </Badge>
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-muted-foreground ml-auto transition-transform', expanded && 'rotate-180')}
        />
      </button>
      {expanded && (
        <>
          {onOpenCommunity && (
            <div className="flex justify-end mt-2">
              <button
                onClick={onOpenCommunity}
                className="text-caption text-primary hover:underline inline-flex items-center"
              >
                ver tudo <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
          <ul className="space-y-1.5 mt-2">
            {items.map((c) => {
              const worked = c.outcome_kind === 'aplicou_funcionou';
              return (
                <li key={c.id}>
                  <button
                    disabled={!onOpenCase}
                    onClick={() => onOpenCase?.(c.id)}
                    className={cn(
                      'w-full text-left rounded-md border border-primary/15 bg-background p-2 transition-colors',
                      onOpenCase && 'hover:border-primary/40 cursor-pointer',
                    )}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-caption font-medium truncate flex-1">{c.title}</span>
                      {worked && (
                        <Badge variant="outline" className="text-caption border-success/40 text-success gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5" /> funcionou
                        </Badge>
                      )}
                      <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
                        <MessageSquare className="h-2.5 w-2.5" />{c.reply_count}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}
