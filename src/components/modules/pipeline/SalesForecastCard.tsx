/**
 * SalesForecastCard — Previsão de vendas vs meta mensal.
 *
 * Mostra: meta, projeção total (fechados + pipeline), gap, breakdown por
 * estágio, top oportunidades. Permite editar meta inline. IA gera
 * recomendação contextual de "como bater a meta".
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Target, TrendingUp, ChevronDown, ChevronUp, Pencil, Check, X,
  Sparkles, Loader2, AlertCircle, ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '@/core/finance';
import { computeSalesForecast, STAGE_LABEL } from '@/utils/salesForecast';
import { getMonthlyGoal, setMonthlyGoal } from '@/services/salesGoal';
import { useAuth } from '@/hooks/useAuth';
import { streamCopilotResponse } from '@/services/salesCopilot';
import type { ProposalRecord, ProposalStatus } from '@/services/proposals';
import { cn } from '@/lib/utils';

interface Props {
  proposals: ProposalRecord[];
  onOpenLead?: (id: string) => void;
}

const STAGE_COLOR: Record<ProposalStatus, string> = {
  prospeccao: 'bg-accent/40',
  aguardando_retorno: 'bg-muted-foreground/30',
  em_avaliacao: 'bg-primary/40',
  proposta_ajustada: 'bg-chart-4/50',
  fechado: 'bg-success/50',
  perdido: 'bg-destructive/30',
};

export function SalesForecastCard({ proposals, onOpenLead }: Props) {
  const { user } = useAuth();
  const userId = user?.userId ?? null;

  const [goal, setGoalState] = useState(() => getMonthlyGoal(userId));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goal || ''));
  const [open, setOpen] = useState(false);
  const [aiText, setAiText] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiAbort = useRef<AbortController | null>(null);

  // Recarrega quando muda o usuário ou meta externa.
  useEffect(() => {
    setGoalState(getMonthlyGoal(userId));
    setDraft(String(getMonthlyGoal(userId) || ''));
  }, [userId]);

  useEffect(() => {
    const handler = () => setGoalState(getMonthlyGoal(userId));
    window.addEventListener('sales-goal-changed', handler);
    return () => window.removeEventListener('sales-goal-changed', handler);
  }, [userId]);

  const forecast = useMemo(() => computeSalesForecast(proposals, goal), [proposals, goal]);

  const saveGoal = () => {
    const v = Number(draft.replace(/[^\d]/g, ''));
    setMonthlyGoal(v, userId);
    setGoalState(v);
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraft(String(goal || ''));
    setEditing(false);
  };

  const progressPct = Math.min(100, Math.round(forecast.goalProgress * 100));
  const goalSet = goal > 0;
  const onTrack = goalSet && forecast.gap <= 0;

  const handleAIRecommendation = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiText('');
    aiAbort.current?.abort();
    aiAbort.current = new AbortController();

    const fmt = (n: number) =>
      n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

    const top = forecast.topOpportunities.slice(0, 3).map((r) =>
      `- ${r.proposal.client_name || 'Sem nome'} | ${STAGE_LABEL[r.proposal.status]} | carta ${fmt(r.proposal.credit_value)} | esperado ${fmt(r.expectedValue)}`,
    ).join('\n');

    const stageBreak = forecast.byStage
      .filter((s) => s.count > 0 && s.status !== 'perdido' && s.status !== 'fechado')
      .map((s) => `- ${s.label}: ${s.count} cliente(s), prob ${Math.round(s.probability * 100)}%, esperado ${fmt(s.expectedValue)}`)
      .join('\n');

    const briefing = [
      'CONTEXTO — PREVISÃO DE VENDAS DA CARTEIRA (não é um cliente individual).',
      `Meta do mês: ${goalSet ? fmt(goal) : 'não definida'}`,
      `Receita realizada (fechados no mês): ${fmt(forecast.closedRevenue)}`,
      `Pipeline esperado (carta × probabilidade): ${fmt(forecast.pipelineExpected)}`,
      `Projeção total: ${fmt(forecast.projectedTotal)} (${progressPct}% da meta)`,
      goalSet ? `Gap p/ meta: ${fmt(forecast.gap)}` : '',
      '',
      'DISTRIBUIÇÃO POR ESTÁGIO:',
      stageBreak || '(sem clientes ativos)',
      '',
      'TOP OPORTUNIDADES (maior valor esperado × proximidade do fechamento):',
      top || '(sem oportunidades)',
      '',
      'TAREFA: Como coach comercial, responda em 4 a 6 linhas curtas:',
      '1) A meta está em risco? Por quê (1 frase).',
      '2) Quais 2-3 clientes da lista TOP priorizar HOJE? Cite o nome.',
      '3) Para cada um, uma próxima ação concreta (ligar, mandar áudio, ajustar lance, etc).',
      'Sem jargão genérico. Sem repetir números já listados.',
    ].filter(Boolean).join('\n');

    try {
      let buffer = '';
      await streamCopilotResponse({
        clientMessage: briefing,
        onDelta: (chunk) => {
          buffer += chunk;
          setAiText(buffer);
        },
        onDone: () => { setAiLoading(false); },
        onError: (err) => { setAiError(err); setAiLoading(false); },
        signal: aiAbort.current.signal,
      });
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setAiError(err?.message || 'Erro ao gerar recomendação.');
      setAiLoading(false);
    }
  };

  return (
    <Card className="p-card-sm border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between gap-2 min-h-11 text-left rounded-md hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">Previsão de Vendas</h3>
                <p className="text-xs text-muted-foreground">
                  Projeção baseada na probabilidade de cada etapa do funil
                </p>
              </div>
            </div>
            <span className="h-11 w-11 inline-flex items-center justify-center shrink-0 text-muted-foreground">
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 space-y-3">
          {/* KPIs principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <KpiBox
              label="Meta do mês"
              valueNode={
                editing ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="h-7 text-sm tabular-nums"
                      placeholder="0"
                      aria-label="Meta de vendas do mês"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveGoal();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveGoal} aria-label="Salvar meta">
                      <Check aria-hidden="true" className="h-3.5 w-3.5 text-success" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit} aria-label="Cancelar edição da meta">
                      <X aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="font-semibold tabular-nums">
                      {goalSet ? formatCurrency(goal) : '—'}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditing(true)} aria-label="Editar meta">
                      <Pencil aria-hidden="true" className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                )
              }
            />
            <KpiBox
              label="Realizado (mês)"
              valueNode={<span className="font-semibold text-success tabular-nums">{formatCurrency(forecast.closedRevenue)}</span>}
            />
            <KpiBox
              label="Pipeline esperado"
              valueNode={<span className="font-semibold text-primary tabular-nums">{formatCurrency(forecast.pipelineExpected)}</span>}
              hint="Soma de carta × probabilidade"
            />
            <KpiBox
              label={onTrack ? 'Excedente' : 'Gap p/ meta'}
              valueNode={
                <span className={cn(
                  'font-semibold tabular-nums',
                  !goalSet && 'text-muted-foreground',
                  goalSet && onTrack && 'text-success',
                  goalSet && !onTrack && 'text-destructive',
                )}>
                  {goalSet ? formatCurrency(Math.abs(forecast.gap)) : '—'}
                </span>
              }
            />
          </div>

          {/* Barra de progresso */}
          {goalSet && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Projeção: <span className="font-medium text-foreground tabular-nums">{formatCurrency(forecast.projectedTotal)}</span>
                </span>
                <Badge variant="outline" className={cn(
                  'h-5 text-caption tabular-nums',
                  onTrack ? 'border-success/40 text-success bg-success/5' : 'border-warning/40 text-warning bg-warning/5',
                )}>
                  {progressPct}% da meta
                </Badge>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-[colors,box-shadow,transform]',
                    onTrack ? 'bg-success' : 'bg-primary',
                  )}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {!goalSet && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded px-2.5 py-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Defina uma meta mensal para acompanhar o gap e receber priorização orientada.</span>
            </div>
          )}

          {/* Breakdown por estágio */}
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">Pipeline por estágio</div>
            {forecast.byStage
              .filter((s) => s.count > 0 && s.status !== 'perdido')
              .map((s) => (
                <div key={s.status} className="flex items-center gap-2 text-xs">
                  <div className={cn('h-2 w-2 rounded-full shrink-0', STAGE_COLOR[s.status])} />
                  <span className="w-32 shrink-0 text-foreground truncate">{s.label}</span>
                  <span className="text-muted-foreground tabular-nums w-10 text-right">{s.count}</span>
                  <span className="text-muted-foreground tabular-nums w-12 text-right">
                    {Math.round(s.probability * 100)}%
                  </span>
                  <span className="ml-auto font-medium text-foreground tabular-nums">
                    {formatCurrency(s.expectedValue)}
                  </span>
                </div>
              ))}
          </div>

          {/* Top oportunidades */}
          {forecast.topOpportunities.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Top oportunidades para priorizar
              </div>
              <div className="space-y-1">
                {forecast.topOpportunities.map((r) => (
                  <button
                    key={r.proposal.id}
                    onClick={() => onOpenLead?.(r.proposal.id)}
                    className="w-full flex items-center gap-2 text-left bg-background/60 hover:bg-background border border-border/60 rounded px-2 py-1.5 transition-colors"
                  >
                    <span className="text-xs font-medium text-foreground truncate flex-1">
                      {r.proposal.client_name || 'Sem nome'}
                    </span>
                    <Badge variant="outline" className="h-5 text-caption shrink-0">
                      {STAGE_LABEL[r.proposal.status]}
                    </Badge>
                    <span className="text-xs font-semibold text-primary tabular-nums shrink-0">
                      {formatCurrency(r.expectedValue)}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* IA — recomendação */}
          <div className="border-t border-border/60 pt-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Recomendação da IA
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={handleAIRecommendation}
                disabled={aiLoading || proposals.length === 0}
              >
                {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {aiText ? 'Gerar novamente' : 'Como bater a meta?'}
              </Button>
            </div>
            {aiError && (
              <p className="text-xs text-destructive">{aiError}</p>
            )}
            {aiText && (
              <div className="text-xs text-foreground bg-background/70 border border-border/50 rounded p-2.5 whitespace-pre-wrap leading-relaxed">
                {aiText}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function KpiBox({ label, valueNode, hint }: { label: string; valueNode: React.ReactNode; hint?: string }) {
  return (
    <div className="bg-background/60 border border-border/60 rounded-md px-2.5 py-2">
      <div className="text-caption uppercase tracking-wide text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm">{valueNode}</div>
      {hint && <div className="text-caption text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}
