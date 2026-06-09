import { useState, useCallback, memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Target, Sparkles, Trophy, CheckCircle2, MoreHorizontal, Trash2, AlarmClock,
} from 'lucide-react';
import { CONSORTIUM_TYPE_LABELS, type ConsortiumType } from '@/types/consortium';
import { formatCurrency } from '@/core/finance';
import { STATUS_EMOJI } from './postSaleConstants';
import { getClientRisk, RISK_STYLES } from './postSaleRisk';
import { getNextActionUrgency } from './postSaleNextAction';
import { computeClientPriority, PRIORITY_BADGE } from './postSalePriority';
import { scorePostSaleClient, TEMPERATURE_BADGE } from '@/utils/clientScoring';
import { getPostSaleRelationshipSignals, SIGNAL_TONE_CLASS } from '@/utils/relationshipSignals';
import { getPostSaleTimingSignal, TIMING_TONE_CLASS } from '@/utils/relationshipTimingSignals';
import { daysUntil, type OpportunityChip } from './postSaleMoments';
import { suggestPostSaleAction } from '@/utils/nextActionSuggestion';
import { PostSaleQuickActions } from './PostSaleQuickActions';
import type { PostSaleClient, PostSaleEvent } from '@/services/postSale';

// Wave 2 — render stabilization: callbacks por id (estáveis no parent) +
// React.memo. Em listas com 50+ clientes, evita N re-renders quando o usuário
// digita no campo de busca, alterna o "What to do today" ou abre/fecha um
// momento. ClientCard recebe identidade (client) e re-renderiza apenas se
// algum dos derivados mudar de referência.
export interface ClientCardProps {
  client: PostSaleClient;
  risk: ReturnType<typeof getClientRisk>;
  nextAction: PostSaleEvent | null;
  isOpportunity: boolean;
  priority: ReturnType<typeof computeClientPriority>;
  nextAssemblyDate?: string | null;
  opportunityChips?: OpportunityChip[];
  onOpenDetail: (id: string) => void;
  onRequestDelete: (client: PostSaleClient) => void;
}

export const ClientCard = memo(function ClientCard({
  client, risk, nextAction, isOpportunity, priority,
  nextAssemblyDate, opportunityChips,
  onOpenDetail, onRequestDelete,
}: ClientCardProps) {
  const styles = RISK_STYLES[risk.level];
  const priorityBadge = PRIORITY_BADGE[priority.level];
  // Camada unificada: score 0–100, temperatura quente/morno/frio + sugestão.
  const unified = scorePostSaleClient(client, nextAction);
  const tempCfg = TEMPERATURE_BADGE[unified.temperature];
  const suggestion = suggestPostSaleAction(client, nextAction, unified);
  // Onda 3 — microinteligência contextual (chips leves de relacionamento).
  const relationshipSignals = getPostSaleRelationshipSignals(client, unified, nextAction);
  const timingSignal = getPostSaleTimingSignal(client);

  const [menuOpen, setMenuOpen] = useState(false);

  // Onda Hierarchy: barra lateral de prioridade operacional (silenciosa em "baixa")
  const priorityAccent =
    priority.level === 'alta'
      ? 'before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r before:bg-destructive'
      : priority.level === 'media'
        ? 'before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r before:bg-amber-500/70'
        : '';
  const showPriorityBadge = priority.level !== 'baixa';
  const consortiumLabel =
    CONSORTIUM_TYPE_LABELS[client.consortium_type as ConsortiumType] ?? client.consortium_type;

  const handleOpen = useCallback(() => onOpenDetail(client.id), [onOpenDetail, client.id]);
  const handleDelete = useCallback(() => onRequestDelete(client), [onRequestDelete, client]);

  return (
    <div
      className={`relative px-3 py-2.5 pr-10 rounded-lg border bg-card hover:bg-accent/30 transition-colors ${styles.row} ${priorityAccent}`}
    >
      {/* Menu ⋯ — exclusão segura via confirmação */}
      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
              aria-label="Mais ações"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                window.setTimeout(() => {
                  handleDelete();
                }, 120);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir cliente
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Header: nome + prioridade (silenciosa em baixa) + risco crítico */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Dot de risco/status — agora carrega a temperatura via tooltip */}
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      tabIndex={0}
                      onClick={(e) => e.stopPropagation()}
                      className={`h-2 w-2 rounded-full cursor-help ${styles.dot}`}
                      aria-label={`Temperatura: ${tempCfg.label} · Risco: ${risk.label}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[260px] p-2">
                    <p className="text-caption font-semibold mb-1">
                      {tempCfg.emoji} Classificação · {tempCfg.label}
                    </p>
                    <p className="text-caption text-muted-foreground mb-1">
                      Score unificado: {unified.score}/100<br />
                      ≥80 quente · 50–79 morno · &lt;50 frio
                    </p>
                    <p className="text-caption text-muted-foreground">
                      Risco: <span className="font-medium">{risk.label}</span> — {risk.reason}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-base">{STATUS_EMOJI[client.status]}</span>
              <span className="font-semibold text-foreground truncate">{client.client_name}</span>
              {/* Prioridade operacional — só aparece quando alta/média */}
              {showPriorityBadge && (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        tabIndex={0}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex"
                      >
                        <Badge
                          variant="outline"
                          className={`text-caption cursor-help ${priorityBadge.chip}`}
                        >
                          {priorityBadge.emoji} {priorityBadge.label}
                        </Badge>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[240px] p-2">
                      <p className="text-caption font-semibold mb-1">
                        {priorityBadge.emoji} {priorityBadge.label}
                      </p>
                      {priority.reasons.length === 0 ? (
                        <p className="text-caption text-muted-foreground">Sem sinais de urgência</p>
                      ) : (
                        <ul className="text-caption space-y-0.5">
                          {priority.reasons.slice(0, 4).map((r) => (
                            <li key={r}>• {r}</li>
                          ))}
                        </ul>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {/* Risco crítico — único badge textual de risco; demais níveis ficam só na cor da borda/dot */}
              {risk.level === 'critical' && (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0} onClick={(e) => e.stopPropagation()} className="inline-flex">
                        <Badge variant="outline" className="text-caption cursor-help bg-destructive/10 text-destructive border-destructive/40">
                          🚨 Em risco
                        </Badge>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[240px] p-2">
                      <p className="text-caption">{risk.reason}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
              <span>{consortiumLabel}</span>
              <span>•</span>
              <span>{formatCurrency(client.credit_value)}</span>
              <span>•</span>
              <span>{client.term_months}m</span>
              {client.group_number && (<><span>•</span><span>Grupo {client.group_number}</span></>)}
              {/* Carteira context — quando veio da Carteira (proposal_id), mostra fechamento */}
              {client.proposal_id && (
                <>
                  <span>•</span>
                  <span title="Data em que a proposta foi fechada e o cliente entrou no pós-venda">
                    Fechado em {new Date(client.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Alerta pré-assembleia (≤ 7 dias) — sinal contextual leve. */}
      {(() => {
        const d = daysUntil(nextAssemblyDate ?? null);
        if (d === null || d < 0 || d > 7) return null;
        const label = d === 0 ? 'hoje' : d === 1 ? 'amanhã' : `em ${d} dias`;
        return (
          <div className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded-md bg-amber-500/10">
            <AlarmClock className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300 shrink-0" />
            <p className="text-caption font-medium text-amber-800 dark:text-amber-200">
              Assembleia {label} — reativar antes do evento.
            </p>
          </div>
        );
      })()}

      {/* Chips consolidados (Wave Density): oportunidade + relacionamento + timing em uma única linha */}
      {((opportunityChips && opportunityChips.length > 0) || relationshipSignals.length > 0 || timingSignal) && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {opportunityChips?.map((chip) => (
            <TooltipProvider key={`op-${chip.label}`} delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-flex">
                    <Badge
                      variant="outline"
                      className="text-caption cursor-help bg-primary/5 text-primary border-primary/20"
                    >
                      {chip.emoji} {chip.label}
                    </Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] p-2">
                  <p className="text-caption">{chip.hint}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {relationshipSignals.map((sig) => (
            <TooltipProvider key={`rs-${sig.id}`} delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-flex">
                    <Badge
                      variant="outline"
                      className={`text-caption cursor-help ${SIGNAL_TONE_CLASS[sig.tone]}`}
                    >
                      {sig.emoji} {sig.label}
                    </Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] p-2">
                  <p className="text-caption">{sig.hint}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {timingSignal && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-flex">
                    <Badge
                      variant="outline"
                      className={`text-caption cursor-help ${TIMING_TONE_CLASS[timingSignal.tone]}`}
                    >
                      {timingSignal.emoji} {timingSignal.label}
                    </Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] p-2">
                  <p className="text-caption">{timingSignal.hint}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      {/* Banner de oportunidade (contemplado/quitado) */}
      {isOpportunity && (
        <div className="mt-2 flex items-start gap-2 p-2 rounded-md bg-primary/5">
          {client.status === 'contemplado'
            ? <Trophy className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            : <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
          <div className="text-xs flex-1">
            <p className="font-semibold text-primary">
              {client.status === 'contemplado' ? 'Cliente recém-contemplado' : 'Cliente quitado'}
            </p>
            <p className="text-foreground/80">
              {client.status === 'contemplado'
                ? 'Momento ideal para pedir indicações e oferecer nova venda.'
                : 'Aborde para próximo bem ou indicações de família/amigos.'}
            </p>
          </div>
        </div>
      )}

      {/* Próxima ação */}
      {nextAction && <NextActionStrip event={nextAction} />}

      {/* Ações inline */}
      <div className="mt-1.5 flex items-center justify-between gap-2 flex-wrap">
        <PostSaleQuickActions client={client} onOpenDetail={handleOpen} />
        {!nextAction && (
          <span
            className="text-caption text-primary italic flex items-center gap-1"
            title="Sugestão derivada do status e do score do cliente"
          >
            <Sparkles className="h-3 w-3" /> {suggestion.text}
          </span>
        )}
      </div>
    </div>
  );
});

function NextActionStrip({ event }: { event: PostSaleEvent }) {
  const meta = event.metadata as Record<string, unknown> | null;
  const action = String(meta?.action ?? '');
  const dueDate = String(meta?.due_date ?? event.event_date);
  const urgency = getNextActionUrgency(dueDate);

  const urgencyStyles = {
    overdue: { chip: 'bg-destructive/15 text-destructive border-destructive/30', label: 'Atrasada' },
    today:   { chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30', label: 'Hoje' },
    soon:    { chip: 'bg-primary/10 text-primary border-primary/30', label: 'Em breve' },
    future:  { chip: 'bg-muted text-muted-foreground border-border', label: 'Agendada' },
  }[urgency];

  return (
    <div className="mt-2 flex items-start gap-2 p-2 rounded-md bg-muted/40">
      <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-medium text-foreground truncate">{action}</p>
          <Badge variant="outline" className={`text-caption ${urgencyStyles.chip}`}>
            {urgencyStyles.label}
          </Badge>
        </div>
        <p className="text-caption text-muted-foreground mt-0.5">
          Prevista para {new Date(dueDate).toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  );
}
