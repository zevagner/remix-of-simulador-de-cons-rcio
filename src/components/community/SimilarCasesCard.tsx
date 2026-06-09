/**
 * SimilarCasesCard — Onda 3 / inteligência consultiva coletiva.
 * Mostra casos parecidos resolvidos, priorizando outcomes que funcionaram.
 * Reutilizável dentro do CaseDetail e em widgets contextuais (Cockpit/Carteira).
 */
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, CheckCircle2, ArrowRight, Loader2, MessageSquare, Eye } from 'lucide-react';
import { listSimilarCases, type SimilarCase, type SimilarCasesParams } from '@/services/community';

interface Props extends SimilarCasesParams {
  onOpen?: (caseId: string) => void;
  /** Quando renderizado fora da Comunidade (Cockpit/Carteira), permite abrir em nova navegação. */
  hrefBuilder?: (caseId: string) => string;
  title?: string;
  emptyHint?: string;
  compact?: boolean;
}

export function SimilarCasesCard({
  onOpen, hrefBuilder, title = 'Casos parecidos resolvidos',
  emptyHint = 'Ainda não há histórico parecido. Seja referência: registre seu desfecho.',
  compact = false,
  ...params
}: Props) {
  const [items, setItems] = useState<SimilarCase[] | null>(null);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      const data = await listSimilarCases({ limit: compact ? 3 : 5, ...params });
      if (!cancel) setItems(data);
    })();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.caseId, params.consortiumType, params.stage, params.query]);

  if (items === null) {
    return (
      <Card className="p-3 text-xs text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin" /> Buscando histórico…
      </Card>
    );
  }

  return (
    <Card className="p-3 sm:p-4 border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        <History className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">{title}</span>
        {items.length > 0 && (
          <Badge variant="outline" className="text-caption">{items.length}</Badge>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyHint}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => {
            const worked = c.outcome_kind === 'aplicou_funcionou';
            const inner = (
              <div className="rounded-md border border-border bg-background p-2.5 hover:border-primary/40 transition-colors text-left w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium truncate flex-1">{c.title}</span>
                  {worked && (
                    <Badge variant="outline" className="text-caption border-success/40 text-success gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" /> funcionou
                    </Badge>
                  )}
                  {c.status === 'resolvido' && !worked && (
                    <Badge variant="outline" className="text-caption border-success/30 text-success">resolvido</Badge>
                  )}
                </div>
                {!compact && (
                  <p className="text-caption text-muted-foreground line-clamp-2 mt-0.5">{c.summary}</p>
                )}
                <div className="flex items-center gap-3 text-caption text-muted-foreground mt-1">
                  <span className="inline-flex items-center gap-1"><MessageSquare className="h-2.5 w-2.5" />{c.reply_count}</span>
                  <span className="inline-flex items-center gap-1"><Eye className="h-2.5 w-2.5" />{c.view_count}</span>
                  {c.consortium_type && <span className="uppercase">{c.consortium_type}</span>}
                </div>
              </div>
            );
            if (onOpen) {
              return (
                <li key={c.id}>
                  <button onClick={() => onOpen(c.id)} className="w-full">{inner}</button>
                </li>
              );
            }
            if (hrefBuilder) {
              return (
                <li key={c.id}>
                  <a href={hrefBuilder(c.id)} className="block">{inner}</a>
                </li>
              );
            }
            return <li key={c.id}>{inner}</li>;
          })}
        </ul>
      )}
      {items.length > 0 && (
        <p className="text-caption text-muted-foreground mt-2 inline-flex items-center gap-1">
          <ArrowRight className="h-2.5 w-2.5" /> Histórico determinístico — ordenado por desfecho aplicado.
        </p>
      )}
    </Card>
  );
}

export default SimilarCasesCard;
