/**
 * ContextualSalesScript — gerador de argumento contextual (perfil + estágio + simulação).
 * Reutilizável em Abordagem (aba Reforços) e na Proposta.
 *
 * - primaryDriver: auto do diagnóstico, com override.
 * - saleStage: sugerido pelo CRM (status da proposta), com override manual.
 */
import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Copy, Check, Loader2, Wand2, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSimulatorContext } from '@/components/modules/simulator/SimulatorContext';
import { useDiagnosticContextSafe } from '@/components/modules/diagnostic/DiagnosticContext';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';
import { CONSORTIUM_TYPE_LABELS } from '@/types/consortium';
import { getSubObjetivoTexto } from '@/utils/getSubObjetivoTexto';
import {
  PRIMARY_DRIVER_OPTIONS, SALE_STAGE_OPTIONS,
  deriveClientProfile, suggestSaleStage,
  type PrimaryDriver, type SaleStage, type SalesScriptPayload,
} from '@/utils/salesScript/engine';
import {
  estimateFinancingTotal, estimateRent,
} from '@/components/modules/objections/triggersData';
import { copyToClipboard } from '@/utils/clipboard';
import { trackEvent } from '@/services/analyticsTracker';
import { supabase } from '@/integrations/supabase/client';
import { cacheKey, getCached, setCached } from '@/utils/aiResponseCache';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { openInWhatsApp } from '@/utils/whatsapp';
import { toast } from 'sonner';
import { useProgressiveLoading } from '@/hooks/useProgressiveLoading';
import { useAIInstrumentation } from '@/hooks/useAIInstrumentation';

export interface ContextualSalesScriptProps {
  /** Estágio sugerido pelo CRM (vindo da Carteira/Proposta). */
  suggestedStage?: SaleStage;
  /** Nome do cliente (override do diagnóstico). */
  clientNameOverride?: string;
  /** Variante visual: 'card' (default) ou 'inline' (sem wrapper Card). */
  variant?: 'card' | 'inline';
}

export function ContextualSalesScript({
  suggestedStage,
  clientNameOverride,
  variant = 'card',
}: ContextualSalesScriptProps) {
  const ctx = useSimulatorContext();
  const diagnostic = useDiagnosticContextSafe();
  const { navigateTo } = useModuleNavigation();
  const { currentCompanyId } = useCurrentCompany();
  const {
    input, result, isValidSimulation, contemplationMonth,
    actualFreeBidValue, actualEmbeddedBidValue, effectiveClientCost,
  } = ctx;

  // ─── Driver e estágio (com override) ───
  const auto = useMemo(() => deriveClientProfile(diagnostic?.data ?? null), [diagnostic?.data]);
  const stageSuggestion = useMemo(
    () => suggestedStage ? { stage: suggestedStage, reason: 'Sugerido pelo contexto.' } : suggestSaleStage({}),
    [suggestedStage],
  );

  const [driver, setDriver] = useState<PrimaryDriver>(auto.primaryDriver);
  const [stage, setStage] = useState<SaleStage>(stageSuggestion.stage);
  const [script, setScript] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const ai = useAIInstrumentation('sales-script');

  // ─── Tipo de cliente (perfil narrativo) ───
  const clientType = useMemo(() => {
    if (!diagnostic?.data) return undefined;
    const obj = diagnostic.data.objetivoPrincipal || diagnostic.data.clientObjective;
    const sub = getSubObjetivoTexto(diagnostic.data.subObjetivo);
    return [obj?.replace('_', ' '), sub].filter(Boolean).join(' — ') || undefined;
  }, [diagnostic?.data]);

  const clientName = clientNameOverride || diagnostic?.data.clientName || '';

  const generate = useCallback(async () => {
    if (!isValidSimulation) {
      toast.error('Faça uma simulação primeiro.');
      return;
    }
    // limpa estado anterior + mostra resposta parcial
    setScript('');
    setLoading(true);
    ai.start();
    try {
      const installment = input.reducedInstallment
        ? result.installmentBeforeContemplation
        : result.installmentAfterContemplation;
      const totalCost = effectiveClientCost > 0 ? effectiveClientCost : result.totalCost;
      const bidValue = actualFreeBidValue + actualEmbeddedBidValue;
      const bidPercent = input.creditValue > 0 ? (bidValue / input.creditValue) * 100 : 0;
      const financing = estimateFinancingTotal(input.creditValue, input.termMonths);
      const rent60 = estimateRent(input.creditValue) * 60;

      const driverLabel = PRIMARY_DRIVER_OPTIONS.find(d => d.value === driver)?.label || driver;
      const stageLabel = SALE_STAGE_OPTIONS.find(s => s.value === stage)?.label || stage;

      const payload: SalesScriptPayload = {
        primaryDriver: driver,
        primaryDriverLabel: driverLabel,
        saleStage: stage,
        saleStageLabel: stageLabel,
        clientName: clientName || undefined,
        clientType,
        consortiumTypeLabel: CONSORTIUM_TYPE_LABELS[input.consortiumType || 'imobiliario'],
        creditValue: input.creditValue,
        installment,
        termMonths: input.termMonths,
        totalCost,
        bidValue,
        bidPercent,
        contemplationMonth: contemplationMonth || undefined,
        estimatedFinancingTotal: financing,
        estimatedSavings: financing - totalCost,
        estimatedRent60: rent60,
      };

      const ck = cacheKey('sales-script', payload, currentCompanyId);
      const cached = getCached<string>(ck);
      if (cached) {
        ai.markFirstToken();
        setScript(cached);
        ai.markComplete();
        trackEvent('ai_cache_hit', { module: 'sales-script' });
        return;
      }

      const { data, error } = await supabase.functions.invoke('sales-script', { body: payload });
      if (error) throw error;
      ai.markFirstToken();
      const text = (data as { script?: string })?.script;
      if (!text) throw new Error('Resposta vazia da IA');

      setScript(text);
      setCached(ck, text);
      ai.markComplete();
      trackEvent('sales_script_generated', { module: 'sales_script', driver, stage });
    } catch (e) {
      ai.markError();
      const msg = e instanceof Error ? e.message : 'Erro ao gerar argumento';
      toast.error(msg.includes('429') ? 'Muitas requisições. Aguarde alguns segundos.' :
                  msg.includes('402') ? 'Créditos de IA esgotados. Adicione saldo.' :
                  'Não foi possível gerar agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [
    isValidSimulation, input, result, effectiveClientCost,
    actualFreeBidValue, actualEmbeddedBidValue, contemplationMonth,
    driver, stage, clientName, clientType, ai, currentCompanyId,
  ]);

  const handleCopy = useCallback(async () => {
    if (!script) return;
    await copyToClipboard(script);
    setCopied(true);
    trackEvent('sales_script_copied', { module: 'sales_script', driver, stage });
    toast.success('Argumento copiado!');
    setTimeout(() => setCopied(false), 2000);
  }, [script, driver, stage]);

  const handleWhatsApp = useCallback(() => {
    if (!script) return;
    openInWhatsApp(script);
    trackEvent('sales_script_whatsapp', { module: 'sales_script', driver, stage });
  }, [script, driver, stage]);

  // Empty state — sem simulação
  if (!isValidSimulation) {
    const Wrapper = variant === 'card' ? Card : 'div';
    return (
      <Wrapper className="border-dashed border-2 border-muted-foreground/20">
        <CardContent className="py-8 flex flex-col items-center text-center gap-3">
          <Wand2 className="h-9 w-9 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Faça uma <strong>simulação</strong> para gerar argumentos contextuais.
          </p>
          <Button size="sm" onClick={() => navigateTo('simulator')}>Ir para Simulador</Button>
        </CardContent>
      </Wrapper>
    );
  }

  const body = (
    <CardContent className="py-5 space-y-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            Argumento contextual
          </h3>
          <p className="text-caption text-muted-foreground mt-0.5">
            Perfil + estágio + dados reais da simulação
          </p>
        </div>
        <Badge variant="secondary" className="text-caption">IA</Badge>
      </div>

      {/* Seletores de perfil e estágio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
            Driver do cliente
          </label>
          <Select value={driver} onValueChange={(v) => setDriver(v as PrimaryDriver)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIMARY_DRIVER_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  <span className="mr-1.5">{opt.emoji}</span>
                  {opt.label} <span className="text-muted-foreground/70">— {opt.description}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {driver === auto.primaryDriver && (
            <p className="text-caption text-muted-foreground/80 italic">
              Auto: {auto.reason}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
            Estágio da venda
          </label>
          <Select value={stage} onValueChange={(v) => setStage(v as SaleStage)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SALE_STAGE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  <span className="mr-1.5">{opt.emoji}</span>
                  {opt.label} <span className="text-muted-foreground/70">— {opt.description}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {stage === stageSuggestion.stage && (
            <p className="text-caption text-muted-foreground/80 italic">
              {stageSuggestion.reason}
            </p>
          )}
        </div>
      </div>

      {/* Botão gerar */}
      <Button onClick={generate} disabled={loading} className="w-full gap-1.5">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        {loading ? <ProgressMsg /> : (script ? 'Gerar novo argumento' : 'Gerar argumento completo')}
      </Button>

      {/* Resultado */}
      {script && (
        <div className="space-y-3 animate-fade-in">
          <div className="rounded-lg bg-muted/40 border border-border/60 p-3 text-sm whitespace-pre-wrap leading-relaxed">
            {script}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" onClick={generate} disabled={loading} className="gap-1.5 text-xs flex-1 min-w-0">
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerar
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs flex-1 min-w-0">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="truncate">{copied ? 'Copiado!' : 'Copiar'}</span>
            </Button>
          </div>
        </div>
      )}
    </CardContent>
  );

  if (variant === 'inline') {
    return <div className="border border-border/60 rounded-lg bg-card">{body}</div>;
  }
  return <Card className="border-l-4 border-l-primary/40">{body}</Card>;
}

function ProgressMsg() {
  const { message } = useProgressiveLoading(true);
  return <>{message}</>;
}
