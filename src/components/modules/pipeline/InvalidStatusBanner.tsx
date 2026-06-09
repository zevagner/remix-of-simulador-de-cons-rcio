/**
 * InvalidStatusBanner — exibe leads com status desconhecido (não-enum, não-legado)
 * em uma faixa isolada acima do Kanban. Política da Onda 3: não mascarar erros.
 *
 * Cada item lista: nome, valor original do status no DB, ID e CTAs:
 *   • Reportar problema  → abre o FeedbackModal pré-preenchido
 *   • Editar             → abre o EditProposalModal para correção manual
 */
import { useEffect, useState } from 'react';
import { AlertTriangle, MessageSquarePlus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';
import { trackEvent } from '@/services/analyticsTracker';
import type { ProposalWithPriority } from '@/utils/proposalPriority';

interface Props {
  items: ProposalWithPriority[];
  onEdit: (id: string) => void;
}

export function InvalidStatusBanner({ items, onEdit }: Props) {
  const [reportOpen, setReportOpen] = useState(false);

  // Telemetria: 1 evento por render quando há inválidos.
  useEffect(() => {
    if (items.length === 0) return;
    trackEvent('proposal_invalid_status_detected', {
      module: 'pipeline',
      count: items.length,
      raw_values: items.map(i => i.rawStatus).slice(0, 10),
    });
  }, [items]);

  if (items.length === 0) return null;

  return (
    <>
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-destructive">
                {items.length} {items.length === 1 ? 'lead com problema' : 'leads com problema'}
              </p>
              <p className="text-xs text-muted-foreground">
                Status fora do padrão — não exibido nas colunas. Edite ou reporte para correção.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs shrink-0"
              onClick={() => setReportOpen(true)}
            >
              <MessageSquarePlus className="h-3 w-3" />
              Reportar
            </Button>
          </div>

          <ul className="space-y-1">
            {items.map(it => (
              <li
                key={it.id}
                className="flex items-center gap-2 rounded border border-destructive/20 bg-background/60 p-2 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{it.client_name || 'Sem nome'}</p>
                  <p className="text-muted-foreground truncate">
                    Status no banco: <code className="font-mono">{it.rawStatus || '(vazio)'}</code>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={() => onEdit(it.id)}
                  aria-label="Editar lead"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <FeedbackModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        currentModule="pipeline"
      />
    </>
  );
}
