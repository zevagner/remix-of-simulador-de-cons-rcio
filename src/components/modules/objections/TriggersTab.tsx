import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Zap, Sparkles, Loader2 } from 'lucide-react';
import { logger } from '@/utils/logger';
import {
  MENTAL_TRIGGERS,
  buildLocalScript,
  buildHowToApply,
  estimateFinancingTotal,
  estimateRent,
  getRecommendedTriggers,
  type TriggerContext,
  type MentalTrigger,
} from './triggersData';
import { useSimulatorContext } from '@/components/modules/simulator/SimulatorContext';
import { useDiagnosticContextSafe } from '@/components/modules/diagnostic/DiagnosticContext';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';
import { CONSORTIUM_TYPE_LABELS } from '@/types/consortium';
import { getSubObjetivoTexto } from '@/utils/getSubObjetivoTexto';
import { copyToClipboard } from '@/utils/clipboard';
import { trackEvent } from '@/services/analyticsTracker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProgressiveLoading } from '@/hooks/useProgressiveLoading';
import { useAIInstrumentation } from '@/hooks/useAIInstrumentation';

export function TriggersTab() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [aiScripts, setAiScripts] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  /** Por gatilho: qual versão exibir ('ai' | 'standard'). Default 'ai' quando há aiScript. */
  const [scriptView, setScriptView] = useState<Record<string, 'ai' | 'standard'>>({});
  const ai = useAIInstrumentation('trigger-script');

  const ctx = useSimulatorContext();
  const diagnostic = useDiagnosticContextSafe();
  const { navigateTo } = useModuleNavigation();
  const { input, result, isValidSimulation, contemplationMonth, actualFreeBidValue, actualEmbeddedBidValue, effectiveClientCost, postContemplationChoice } = ctx;

  // Tipo de cliente derivado do diagnóstico (objetivo + sub-objetivo).
  const clientType = useMemo(() => {
    if (!diagnostic?.data) return undefined;
    const obj = diagnostic.data.objetivoPrincipal || diagnostic.data.clientObjective;
    const sub = getSubObjetivoTexto(diagnostic.data.subObjetivo);
    return [obj, sub].filter(Boolean).join(' — ') || undefined;
  }, [diagnostic?.data]);

  // Estratégia escolhida: combinação da escolha pós-contemplação + lance simulado.
  const selectedStrategy = useMemo(() => {
    if (!isValidSimulation) return undefined;
    const parts: string[] = [];
    const bidPct = input.creditValue > 0 ? ((actualFreeBidValue + actualEmbeddedBidValue) / input.creditValue) * 100 : 0;
    if (bidPct > 0) parts.push(`Lance de ${bidPct.toFixed(1).replace('.', ',')}%`);
    if (contemplationMonth) parts.push(`contemplação no mês ${contemplationMonth}`);
    if (postContemplationChoice === 'reduce-installment') parts.push('parcela reduzida pós-contemplação');
    if (postContemplationChoice === 'reduce-term') parts.push('redução de prazo pós-contemplação');
    return parts.length ? parts.join(', ') : undefined;
  }, [isValidSimulation, input.creditValue, actualFreeBidValue, actualEmbeddedBidValue, contemplationMonth, postContemplationChoice]);

  const triggerCtx = useMemo<TriggerContext | null>(() => {
    if (!isValidSimulation) return null;
    const installment = input.reducedInstallment ? result.installmentBeforeContemplation : result.installmentAfterContemplation;
    const bidValue = (actualFreeBidValue || 0) + (actualEmbeddedBidValue || 0);
    const bidPercent = input.creditValue > 0 ? (bidValue / input.creditValue) * 100 : 0;
    const totalCost = effectiveClientCost || result.totalCost;
    const financingTotal = estimateFinancingTotal(input.creditValue, input.termMonths);
    const estimatedRent = estimateRent(input.creditValue);
    return {
      consortiumTypeLabel: CONSORTIUM_TYPE_LABELS[input.consortiumType || 'imobiliario'],
      creditValue: input.creditValue,
      installment,
      termMonths: input.termMonths,
      bidValue,
      bidPercent,
      contemplationMonth: contemplationMonth || undefined,
      totalCost,
      financingTotal,
      estimatedSavings: financingTotal - totalCost,
      estimatedRent,
    };
  }, [isValidSimulation, input, result, actualFreeBidValue, actualEmbeddedBidValue, contemplationMonth, effectiveClientCost]);

  const recommendations = useMemo(() => {
    if (!triggerCtx) {
      // Sem simulação: mostrar todos em ordem fixa
      return MENTAL_TRIGGERS.map((t, i) => ({
        trigger: t,
        reason: 'Faça uma simulação para ver a recomendação contextual',
        priority: 'secondary' as const,
        score: 50 - i,
      }));
    }
    return getRecommendedTriggers({
      creditValue: triggerCtx.creditValue,
      bidSimulated: triggerCtx.bidValue > 0,
      termMonths: triggerCtx.termMonths,
    });
  }, [triggerCtx]);

  const handleCopy = useCallback(async (id: string, script: string) => {
    await copyToClipboard(script);
    setCopiedId(id);
    trackEvent('trigger_copied', { module: 'objections', trigger: id });
    toast.success('Script copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleGenerateAI = useCallback(async (trigger: MentalTrigger) => {
    if (!triggerCtx) {
      toast.info('Faça uma simulação primeiro para gerar com IA.');
      return;
    }
    setAiLoading(trigger.id);
    // Pré-resposta imediata: limpa script anterior e mostra placeholder visual
    setAiScripts(prev => ({ ...prev, [trigger.id]: '' }));
    setScriptView(prev => ({ ...prev, [trigger.id]: 'ai' }));
    ai.start();

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-script`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          triggerId: trigger.id,
          triggerName: trigger.name,
          ...triggerCtx,
          clientType,
          selectedStrategy,
        }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) throw new Error('429: Aguarde alguns segundos.');
        if (resp.status === 402) throw new Error('402: Créditos de IA esgotados.');
        const ej = await resp.json().catch(() => ({}));
        throw new Error(ej?.error ?? 'Erro ao gerar com IA');
      }

      // Stream SSE token-a-token
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';
      let done = false;

      while (!done) {
        const { value, done: rDone } = await reader.read();
        if (rDone) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta.length) {
              if (!acc) ai.markFirstToken();
              acc += delta;
              setAiScripts(prev => ({ ...prev, [trigger.id]: acc }));
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Guardrail leve no client: se vazio, fallback
      if (!acc.trim()) {
        ai.markError();
        setAiScripts(prev => ({ ...prev, [trigger.id]: '' }));
        setScriptView(prev => ({ ...prev, [trigger.id]: 'standard' }));
        toast.error('Não foi possível gerar agora. Tente novamente.');
        return;
      }

      ai.markComplete();
      trackEvent('trigger_ai_generated', { trigger: trigger.id });
      toast.success('Script gerado com IA!');
    } catch (e) {
      ai.markError();
      logger.error('trigger-script error:', e);
      const msg: string = e?.message ?? '';
      toast.error(msg.includes('429') ? 'Aguarde alguns segundos.' :
                  msg.includes('402') ? 'Créditos de IA esgotados.' :
                  'Erro ao gerar com IA.');
      setScriptView(prev => ({ ...prev, [trigger.id]: 'standard' }));
    } finally {
      setAiLoading(null);
    }
  }, [triggerCtx, clientType, selectedStrategy, ai]);

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted-foreground flex-1">
          <Zap className="h-3 w-3 inline mr-1" />
          {triggerCtx
            ? <>Gatilhos ordenados por relevância para a sua simulação atual.</>
            : <>Gatilhos genéricos. <button onClick={() => navigateTo('simulator')} className="underline text-primary">Faça uma simulação</button> para personalizar com seus números.</>
          }
        </p>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, idx) => {
          const trigger = rec.trigger;
          const localScript = triggerCtx ? buildLocalScript(trigger, triggerCtx) : trigger.script;
          const howToApply = triggerCtx ? buildHowToApply(trigger, triggerCtx) : trigger.howToApply;
          const aiScript = aiScripts[trigger.id];
          const view = scriptView[trigger.id] ?? (aiScript ? 'ai' : 'standard');
          const displayScript = view === 'ai' && aiScript ? aiScript : localScript;
          const isCopied = copiedId === trigger.id;
          const isLoading = aiLoading === trigger.id;
          const isPrimary = rec.priority === 'primary';
          const progressMsg = isLoading ? <ProgressMsg /> : null;

          return (
            <Card
              key={trigger.id}
              id={`trigger-${trigger.id}`}
              className={`border-l-4 animate-fade-in ${isPrimary ? 'border-l-amber-500/60' : 'border-l-muted-foreground/30 opacity-90'}`}
            >
              <CardContent className="py-4 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl">{trigger.emoji}</span>
                  <h3 className="text-sm font-bold text-foreground">{trigger.name}</h3>
                  {isPrimary && idx === 0 && (
                    <Badge className="text-caption bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/15">
                      Use este primeiro
                    </Badge>
                  )}
                  {!isPrimary && (
                    <Badge variant="outline" className="text-caption">Opcional</Badge>
                  )}
                  <Badge variant="outline" className="text-caption ml-auto border-amber-500/40 text-amber-600 dark:text-amber-400">
                    Gatilho Mental
                  </Badge>
                </div>

                {/* Why this trigger */}
                <p className="text-caption text-muted-foreground/80 italic border-l-2 border-amber-500/20 pl-2">
                  {rec.reason}
                </p>

                {/* What is */}
                <div className="space-y-1">
                  <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">O que é</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{trigger.whatIs}</p>
                </div>

                {/* How to apply (contextual) */}
                <div className="space-y-1">
                  <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">Como aplicar</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{howToApply}</p>
                </div>

                {/* Script (com dados reais ou gerado por IA) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
                      Script
                    </p>
                    {aiScript && (
                      <div className="inline-flex items-center rounded-md border border-border bg-muted/30 p-0.5 text-caption">
                        <button
                          type="button"
                          onClick={() => setScriptView(prev => ({ ...prev, [trigger.id]: 'ai' }))}
                          className={`px-2 py-0.5 rounded transition-colors ${view === 'ai' ? 'bg-background text-foreground shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          ✨ IA
                        </button>
                        <button
                          type="button"
                          onClick={() => setScriptView(prev => ({ ...prev, [trigger.id]: 'standard' }))}
                          className={`px-2 py-0.5 rounded transition-colors ${view === 'standard' ? 'bg-background text-foreground shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          Padrão
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="border-l-2 border-amber-500/30 pl-3 bg-amber-50/30 dark:bg-amber-950/10 rounded-r-md py-2 pr-2 min-h-[3rem]">
                    {isLoading && view === 'ai' && !aiScript ? (
                      <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Já estou montando isso aqui pra você…
                      </p>
                    ) : (
                      <p className="text-sm text-foreground leading-relaxed italic whitespace-pre-wrap">
                        {displayScript}
                        {isLoading && view === 'ai' && aiScript && (
                          <span className="inline-block w-1.5 h-4 ml-0.5 bg-amber-500/70 align-text-bottom animate-pulse" />
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                  {triggerCtx && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateAI(trigger)}
                      disabled={isLoading}
                      className="h-8 gap-1.5 text-xs w-full sm:w-auto"
                    >
                      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {isLoading ? (progressMsg ?? 'Gerando...') : aiScript ? 'Regenerar com IA' : 'Gerar com IA'}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(trigger.id, displayScript)}
                    className="h-8 gap-1.5 text-xs w-full sm:w-auto"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {isCopied ? 'Copiado' : 'Copiar script'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ProgressMsg() {
  const { message } = useProgressiveLoading(true);
  return <>{message}</>;
}
