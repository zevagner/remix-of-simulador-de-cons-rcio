import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, ChevronDown, ChevronUp, ExternalLink, Sparkles, Loader2, Wand2, MessageCircle, HelpCircle, ArrowRight, Zap } from 'lucide-react';
import { copyToClipboard } from '@/utils/clipboard';
import { trackEvent } from '@/services/analyticsTracker';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSimulatorContext } from '@/components/modules/simulator/SimulatorContext';
import { useDiagnosticContextSafe } from '@/components/modules/diagnostic/DiagnosticContext';
import { CONSORTIUM_TYPE_LABELS } from '@/types/consortium';
import { getSubObjetivoTexto } from '@/utils/getSubObjetivoTexto';
import {
  PRIMARY_DRIVER_OPTIONS, SALE_STAGE_OPTIONS,
  deriveClientProfile, suggestSaleStage,
  type SaleStage,
} from '@/utils/salesScript/engine';
import { estimateFinancingTotal, estimateRent } from '@/components/modules/objections/triggersData';
import { openInWhatsApp } from '@/utils/whatsapp';
import { supabase } from '@/integrations/supabase/client';
import { useAIInstrumentation } from '@/hooks/useAIInstrumentation';
import { cacheKey, getCached, setCached } from '@/utils/aiResponseCache';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';

type PhaseId = 'prospeccao' | 'qualificacao' | 'apresentacao' | 'fechamento';

interface FunnelTool {
  label: string;
  module: string;
  tab?: string;
}

interface FunnelPhase {
  id: PhaseId;
  number: number;
  title: string;
  emoji: string;
  colorClass: string;
  borderClass: string;
  bgClass: string;
  objective: string;
  whatToDo: string;
  whatNotToDo: string;
  extraContent?: { heading: string; items: string[] };
  scripts?: { label: string; text: string }[];
  tools: FunnelTool[];
}

const PHASES: FunnelPhase[] = [
  {
    id: 'prospeccao',
    number: 1,
    title: 'Prospecção e Quebra de Padrão',
    emoji: '🎯',
    colorClass: 'text-blue-700 dark:text-blue-400',
    borderClass: 'border-blue-500/40',
    bgClass: 'bg-blue-500/10',
    objective: 'Vender a ideia de uma conversa — não o consórcio.',
    whatToDo: 'O objetivo exclusivo desta fase é conseguir uma reunião ou chamada de diagnóstico. Não mencione consórcio diretamente. Ofereça uma \'assessoria gratuita de estruturação patrimonial\'. Isso desativa as defesas automáticas do cliente contra vendedores.',
    whatNotToDo: 'Não envie simulações, PDFs ou valores nesta fase. Não fale em parcela, taxa ou prazo. Não tente fechar nada. Quem tenta vender consórcio no primeiro contato raramente converte.',
    tools: [
      { label: 'Aba Abordagem (contexto + nível Novo/Frio)', module: 'proposal', tab: 'follow-up' },
      { label: 'Pipeline: criar card em Prospecção', module: 'proposals' },
    ],
  },
  {
    id: 'qualificacao',
    number: 2,
    title: 'Qualificação e Entendimento',
    emoji: '🔍',
    colorClass: 'text-emerald-700 dark:text-emerald-400',
    borderClass: 'border-emerald-500/40',
    bgClass: 'bg-emerald-500/10',
    objective: 'Mapear a realidade do cliente antes de apresentar qualquer número.',
    whatToDo: 'Dedique 10 a 15 minutos fazendo perguntas direcionadas. Descubra: qual o limite mensal de desembolso confortável, quem são os tomadores de decisão (cônjuge, sócios), o conhecimento prévio sobre consórcio e se há FGTS disponível. Nunca apresente proposta sem ter essas respostas.',
    whatNotToDo: 'Não pule para os números antes de entender o perfil. Não fale com apenas um dos decisores — garanta que todos estejam presentes na apresentação.',
    extraContent: {
      heading: 'Perguntas-chave',
      items: [
        'Quanto você consegue comprometer por mês sem impactar sua qualidade de vida?',
        'Você e seu cônjuge decidem juntos ou você decide sozinho?',
        'Você já teve alguma experiência com consórcio antes?',
        'Você tem FGTS acumulado?',
      ],
    },
    tools: [
      { label: 'Pipeline: mover para Aguardando Retorno', module: 'proposals' },
      { label: 'Biblioteca → filtro por Perfil do Cliente', module: 'objections' },
    ],
  },
  {
    id: 'apresentacao',
    number: 3,
    title: 'Apresentação de Valor',
    emoji: '💎',
    colorClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-500/40',
    bgClass: 'bg-amber-500/10',
    objective: 'Demonstrar matematicamente a vantagem do consórcio e desconstruir objeções proativamente.',
    whatToDo: 'Inicie ancorando o custo do financiamento — mostre o impacto destrutivo dos juros compostos com a Selic a 15%. Depois apresente o consórcio como antídoto. Use o Comparador para materializar a diferença em números reais. Desconstrua as objeções previstas antes que o cliente as verbalize.',
    whatNotToDo: 'Não envie a simulação por WhatsApp antes da reunião — isso destrói o valor percebido. Não apresente para apenas um decisor se há mais de um. Não deixe objeções sem resposta para o final.',
    tools: [
      { label: 'Simulador: simular cenário do cliente', module: 'simulator' },
      { label: 'Comparador: consórcio vs financiamento', module: 'comparator' },
      { label: 'Gatilhos: Antecipação + Autoridade', module: 'objections' },
      { label: 'Pipeline: mover para Em Avaliação', module: 'proposals' },
    ],
  },
  {
    id: 'fechamento',
    number: 4,
    title: 'Fechamento por Condução',
    emoji: '🏆',
    colorClass: 'text-purple-700 dark:text-purple-400',
    borderClass: 'border-purple-500/40',
    bgClass: 'bg-purple-500/10',
    objective: 'Conduzir naturalmente para o fechamento sem pressão aparente.',
    whatToDo: 'Aja sob a premissa de que a decisão já está tomada. Conduza a conversa para os trâmites práticos — como funciona a adesão, dinâmica das assembleias, estratégia de lance. Use a Pergunta Dupla para selar a decisão: dê duas opções onde qualquer escolha confirma o fechamento.',
    whatNotToDo: 'Não pergunte \'O que você achou?\' ou \'Podemos avançar?\' — essas perguntas abertas transferem a liderança para o cliente e estimulam procrastinação. Nunca demonstre ansiedade no fechamento.',
    scripts: [
      {
        label: 'Pergunta Dupla',
        text: 'Para o faturamento da taxa de adesão, é mais estratégico alocar no seu CPF ou no CNPJ da sua empresa?',
      },
      {
        label: 'Condução Natural',
        text: 'Deixa eu te explicar como funciona o processo de adesão — é simples e rápido. Você prefere fazer isso ainda hoje ou amanhã de manhã?',
      },
    ],
    tools: [
      { label: 'Proposta: gerar proposta personalizada', module: 'proposal' },
      { label: 'Pipeline: mover para Fechado', module: 'proposals' },
      { label: 'Gatilho Desapego se houver hesitação', module: 'objections' },
    ],
  },
];

// ─── Mapa estágio CRM → fase recomendada ───
const STAGE_TO_PHASE: Record<SaleStage, PhaseId> = {
  primeiro_contato: 'prospeccao',
  follow_up: 'apresentacao',
  sumido: 'qualificacao',
  fechamento: 'fechamento',
};

interface PhaseAction {
  message: string;
  question: string;
  nextStep: string;
}

interface FunnelTabProps {
  onNavigateToModule: (module: string) => void;
  /** Estágio sugerido (ex.: vindo da Carteira / Proposta). */
  suggestedStage?: SaleStage;
  /** Estratégia escolhida (cenário, lance, parcela reduzida etc). */
  selectedStrategy?: string;
}

export function FunnelTab({ onNavigateToModule, suggestedStage, selectedStrategy }: FunnelTabProps) {
  const ctx = useSimulatorContext();
  const diagnostic = useDiagnosticContextSafe();
  const { currentCompanyId } = useCurrentCompany();
  const {
    input, result, isValidSimulation,
    actualFreeBidValue, actualEmbeddedBidValue, effectiveClientCost,
    contemplationMonth,
  } = ctx;

  // ─── Driver e estágio ───
  const auto = useMemo(() => deriveClientProfile(diagnostic?.data ?? null), [diagnostic?.data]);
  const stageSuggestion = useMemo(
    () => suggestedStage ? { stage: suggestedStage } : suggestSaleStage({}),
    [suggestedStage],
  );
  const recommendedPhase: PhaseId = STAGE_TO_PHASE[stageSuggestion.stage];

  const driverLabel = PRIMARY_DRIVER_OPTIONS.find(d => d.value === auto.primaryDriver)?.label || auto.primaryDriver;
  const stageLabel = SALE_STAGE_OPTIONS.find(s => s.value === stageSuggestion.stage)?.label || stageSuggestion.stage;

  const clientType = useMemo(() => {
    if (!diagnostic?.data) return undefined;
    const obj = diagnostic.data.objetivoPrincipal || diagnostic.data.clientObjective;
    const sub = getSubObjetivoTexto(diagnostic.data.subObjetivo);
    return [obj?.replace('_', ' '), sub].filter(Boolean).join(' — ') || undefined;
  }, [diagnostic?.data]);
  const clientName = diagnostic?.data?.clientName || undefined;

  // ─── Estado ───
  const [expandedPhase, setExpandedPhase] = useState<PhaseId | null>(recommendedPhase);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [phaseActions, setPhaseActions] = useState<Partial<Record<PhaseId, PhaseAction>>>({});
  const [loadingPhase, setLoadingPhase] = useState<PhaseId | null>(null);
  const [directModePhases, setDirectModePhases] = useState<Partial<Record<PhaseId, boolean>>>({});
  // Mensagem progressiva simulada por fase (phase-action é tool call, não SSE)
  const [progressMsgByPhase, setProgressMsgByPhase] = useState<Partial<Record<PhaseId, string>>>({});
  const ai = useAIInstrumentation('phase-action');

  const togglePhase = (id: PhaseId) => {
    setExpandedPhase(prev => prev === id ? null : id);
  };

  const handleCopy = useCallback(async (
    text: string,
    key: string,
    eventName: 'funnel_action_copied' | 'funnel_script_copied',
  ) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    trackEvent(eventName, { phase: key });
    toast.success('Copiado!');
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const generatePhaseAction = useCallback(async (phase: FunnelPhase, directMode = false) => {
    // 1) limpa estado anterior + mostra resposta parcial imediata
    setPhaseActions(prev => ({ ...prev, [phase.id]: undefined }));
    setLoadingPhase(phase.id);
    setProgressMsgByPhase(prev => ({ ...prev, [phase.id]: 'Analisando seu cenário…' }));
    ai.start();

    // 2) simulação de streaming (phase-action é tool call estruturado — não suporta SSE real)
    const t1 = window.setTimeout(() => {
      setProgressMsgByPhase(prev =>
        prev[phase.id] === undefined ? prev : { ...prev, [phase.id]: 'Montando a melhor abordagem…' },
      );
    }, 600);
    const t2 = window.setTimeout(() => {
      setProgressMsgByPhase(prev =>
        prev[phase.id] === undefined ? prev : { ...prev, [phase.id]: 'Preparando recomendação final…' },
      );
    }, 1200);

    try {
      // Payload de simulação (opcional — em prospecção pode não existir)
      let simPayload: Record<string, unknown> = {};
      if (isValidSimulation) {
        const installment = input.reducedInstallment
          ? result.installmentBeforeContemplation
          : result.installmentAfterContemplation;
        const totalCost = effectiveClientCost > 0 ? effectiveClientCost : result.totalCost;
        const financing = estimateFinancingTotal(input.creditValue, input.termMonths);
        const rent60 = estimateRent(input.creditValue) * 60;
        const totalBidValue = (actualFreeBidValue || 0) + (actualEmbeddedBidValue || 0);
        const bidPercent = input.creditValue > 0 && totalBidValue > 0
          ? (totalBidValue / input.creditValue) * 100
          : undefined;
        simPayload = {
          consortiumTypeLabel: CONSORTIUM_TYPE_LABELS[input.consortiumType || 'imobiliario'],
          creditValue: input.creditValue,
          installment,
          termMonths: input.termMonths,
          totalCost,
          estimatedFinancingTotal: financing,
          estimatedSavings: financing - totalCost,
          estimatedRent60: rent60,
          ...(totalBidValue > 0 ? { bidValue: totalBidValue } : {}),
          ...(bidPercent ? { bidPercent } : {}),
          ...(contemplationMonth ? { contemplationMonth } : {}),
        };
      }

      const reqBody = {
        phaseId: phase.id,
        phaseTitle: phase.title,
        primaryDriver: auto.primaryDriver,
        primaryDriverLabel: driverLabel,
        saleStage: stageSuggestion.stage,
        saleStageLabel: stageLabel,
        clientName,
        clientType,
        selectedStrategy,
        directMode,
        ...simPayload,
      };

      const ck = cacheKey('phase-action', reqBody, currentCompanyId);
      const cachedAction = getCached<PhaseAction>(ck);
      if (cachedAction) {
        ai.markFirstToken();
        setPhaseActions(prev => ({ ...prev, [phase.id]: cachedAction }));
        ai.markComplete();
        trackEvent('ai_cache_hit', { module: 'phase-action' });
        return;
      }

      const { data, error } = await supabase.functions.invoke('phase-action', {
        body: reqBody,
      });

      if (error) throw error;
      ai.markFirstToken();
      const action = data as PhaseAction;
      if (!action?.message || !action?.question || !action?.nextStep) {
        throw new Error('Resposta inválida');
      }
      setPhaseActions(prev => ({ ...prev, [phase.id]: action }));
      setCached(ck, action);
      ai.markComplete();
      trackEvent('funnel_action_generated', { phase: phase.id, driver: auto.primaryDriver, stage: stageSuggestion.stage, directMode });
    } catch (e) {
      ai.markError();
      const msg = e instanceof Error ? e.message : '';
      toast.error(
        msg.includes('429') ? 'Muitas requisições. Aguarde alguns segundos.' :
        msg.includes('402') ? 'Créditos de IA esgotados.' :
        'Não foi possível gerar a ação. Tente novamente.',
      );
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setProgressMsgByPhase(prev => ({ ...prev, [phase.id]: undefined }));
      setLoadingPhase(null);
    }
  }, [
    isValidSimulation, input, result, effectiveClientCost,
    auto.primaryDriver, driverLabel, stageSuggestion.stage, stageLabel,
    clientName, clientType, selectedStrategy, contemplationMonth,
    actualFreeBidValue, actualEmbeddedBidValue, ai, currentCompanyId,
  ]);

  return (
    <div className="space-y-3 mt-4 animate-fade-in">
      <div className="flex flex-wrap items-center gap-2 px-1">
        <p className="text-xs text-muted-foreground">
          As 4 fases da venda consultiva — siga a sequência para maximizar conversão.
        </p>
        <Badge variant="outline" className="text-caption gap-1">
          <Sparkles className="h-3 w-3" />
          Driver: {driverLabel} · Estágio: {stageLabel}
        </Badge>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-400 via-emerald-400 via-amber-400 to-purple-400 opacity-30 hidden md:block" />

        <div className="space-y-3">
          {[...PHASES].sort((a, b) => {
            // Fase recomendada vai pro topo, demais mantêm ordem original
            if (a.id === recommendedPhase) return -1;
            if (b.id === recommendedPhase) return 1;
            return a.number - b.number;
          }).map((phase) => {
            const isExpanded = expandedPhase === phase.id;
            const isRecommended = phase.id === recommendedPhase;
            const action = phaseActions[phase.id];
            const isLoading = loadingPhase === phase.id;

            return (
              <Card
                key={phase.id}
                className={cn(
                  'transition-[colors,box-shadow,transform] duration-200 border-l-4',
                  phase.borderClass,
                  isExpanded && 'shadow-md',
                  isRecommended && 'ring-2 ring-primary shadow-lg shadow-primary/10',
                )}
              >
                <button
                  onClick={() => togglePhase(phase.id)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3"
                >
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                    phase.bgClass, phase.colorClass,
                  )}>
                    {phase.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base">{phase.emoji}</span>
                      <h3 className={cn('text-sm font-semibold', phase.colorClass)}>{phase.title}</h3>
                      {isRecommended && (
                        <Badge className="text-micro h-4 px-1.5 bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
                          Use esta fase agora
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{phase.objective}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <CardContent className="pt-0 pb-4 px-4 space-y-4 animate-fade-in">
                    {/* Ação prática IA — destaque no topo */}
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          Ação prática para esta fase
                        </p>
                        <Badge variant="secondary" className="text-caption">IA</Badge>
                      </div>

                      {!action && (
                        <div className="space-y-1.5">
                          <Button
                            size="sm"
                            onClick={() => {
                              setDirectModePhases(prev => ({ ...prev, [phase.id]: false }));
                              generatePhaseAction(phase, false);
                            }}
                            disabled={isLoading}
                            className="w-full gap-1.5"
                          >
                            {isLoading && !directModePhases[phase.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                            {isLoading && !directModePhases[phase.id]
                              ? (progressMsgByPhase[phase.id] || 'Gerando…')
                              : 'Gerar mensagem + pergunta + próximo passo'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDirectModePhases(prev => ({ ...prev, [phase.id]: true }));
                              generatePhaseAction(phase, true);
                            }}
                            disabled={isLoading}
                            className="w-full gap-1.5 border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                          >
                            {isLoading && directModePhases[phase.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                            Gerar versão mais direta
                          </Button>
                          {isLoading && ai.isSlow && (
                            <p className="text-caption text-muted-foreground italic text-center pt-1">
                              Isso pode levar alguns segundos…
                            </p>
                          )}
                        </div>
                      )}

                      {action && (
                        <div className="space-y-3 animate-fade-in">
                          {/* 1. Mensagem pronta — entrega principal */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-caption font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" /> Mensagem pronta
                              </p>
                              {directModePhases[phase.id] && (
                                <Badge className="text-micro h-4 px-1.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/15 gap-0.5">
                                  <Zap className="h-2.5 w-2.5" /> Versão direta
                                </Badge>
                              )}
                            </div>
                            <div className="rounded-md bg-card border border-border/60 p-2.5 text-sm whitespace-pre-wrap">
                              {action.message}
                            </div>
                          </div>

                          {/* 2. CTA principal: Executar ação recomendada (WhatsApp + copia) */}
                          <Button
                            size="sm"
                            onClick={() => {
                              copyToClipboard(action.message);
                              openInWhatsApp(action.message);
                              trackEvent('funnel_action_whatsapp', { phase: phase.id });
                              toast.success('Mensagem copiada e WhatsApp aberto');
                            }}
                            className="w-full gap-1.5 bg-whatsapp-green hover:bg-[#1ebe5b] text-white"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Executar ação recomendada
                          </Button>

                          <div className="flex gap-1.5 flex-wrap">
                            <Button
                              variant="outline" size="sm"
                              onClick={() => handleCopy(action.message, `${phase.id}-msg`, 'funnel_action_copied')}
                              className="h-7 gap-1 text-xs flex-1 min-w-[120px]"
                            >
                              {copiedKey === `${phase.id}-msg` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              Copiar
                            </Button>
                            <Button
                              variant="outline" size="sm"
                              onClick={() => generatePhaseAction(phase, !!directModePhases[phase.id])}
                              disabled={isLoading}
                              className="h-7 gap-1 text-xs flex-1 min-w-[120px]"
                            >
                              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                              Regenerar
                            </Button>
                            <Button
                              variant="outline" size="sm"
                              onClick={() => {
                                const next = !directModePhases[phase.id];
                                setDirectModePhases(prev => ({ ...prev, [phase.id]: next }));
                                generatePhaseAction(phase, next);
                              }}
                              disabled={isLoading}
                              className={cn(
                                "h-7 gap-1 text-xs flex-1 min-w-[120px]",
                                directModePhases[phase.id]
                                  ? "border-primary/40 text-primary"
                                  : "border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10",
                              )}
                            >
                              <Zap className="h-3 w-3" />
                              {directModePhases[phase.id] ? 'Versão consultiva' : 'Versão direta'}
                            </Button>
                          </div>

                          {/* 3. Pergunta */}
                          <div className="space-y-1.5">
                            <p className="text-caption font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                              <HelpCircle className="h-3 w-3" /> Pergunta para o cliente
                            </p>
                            <div className="rounded-md bg-card border border-border/60 p-2.5 text-sm italic">
                              "{action.question}"
                            </div>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => handleCopy(action.question, `${phase.id}-q`, 'funnel_action_copied')}
                              className="h-7 gap-1 text-xs"
                            >
                              {copiedKey === `${phase.id}-q` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              Copiar pergunta
                            </Button>
                          </div>

                          {/* 4. Próximo passo do gerente */}
                          <div className="space-y-1.5">
                            <p className="text-caption font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                              <ArrowRight className="h-3 w-3" /> Próximo passo do gerente
                            </p>
                            <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-2.5 text-sm font-medium text-foreground">
                              {action.nextStep}
                            </div>
                          </div>
                        </div>
                      )}

                      {!isValidSimulation && (
                        <p className="text-caption text-muted-foreground italic">
                          Sem simulação — a IA vai gerar sem citar números financeiros.
                        </p>
                      )}
                    </div>

                    {/* Objetivo */}
                    <div className={cn('rounded-lg p-3', phase.bgClass)}>
                      <p className={cn('text-xs font-semibold mb-1', phase.colorClass)}>🎯 Objetivo</p>
                      <p className="text-sm font-medium">{phase.objective}</p>
                    </div>

                    {/* What to do */}
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">✅ O que fazer</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{phase.whatToDo}</p>
                    </div>

                    {/* Extra content */}
                    {phase.extraContent && (
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-semibold text-foreground">{phase.extraContent.heading}</p>
                        <ul className="space-y-1.5">
                          {phase.extraContent.items.map((item, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span>"{item}"</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Scripts */}
                    {phase.scripts && phase.scripts.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-foreground">📋 Scripts de fechamento</p>
                        {phase.scripts.map((script) => {
                          const isCopied = copiedKey === `${phase.id}-${script.label}`;
                          return (
                            <div key={script.label} className="bg-muted/50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <Badge variant="secondary" className="text-caption">{script.label}</Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopy(script.text, `${phase.id}-${script.label}`, 'funnel_script_copied')}
                                  className="h-7 gap-1 text-xs"
                                >
                                  {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                  {isCopied ? 'Copiado' : 'Copiar'}
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground italic">"{script.text}"</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* What NOT to do */}
                    <div>
                      <p className="text-xs font-semibold text-destructive mb-1.5">❌ O que NÃO fazer</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{phase.whatNotToDo}</p>
                    </div>

                    {/* Tools */}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">🛠️ Ferramentas do sistema</p>
                      <div className="space-y-1">
                        {phase.tools.map((tool, i) => (
                          <button
                            key={i}
                            onClick={() => onNavigateToModule(tool.module)}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30 hover:bg-muted/60 transition-colors text-sm group"
                          >
                            <span className="text-primary">→</span>
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">{tool.label}</span>
                            <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
