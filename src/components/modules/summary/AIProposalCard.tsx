import { useState, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Copy, Check, ExternalLink, RefreshCw, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { copyToClipboard } from '@/utils/clipboard';
import { openInWhatsApp, isMobileDevice } from '@/utils/whatsapp';
import { formatCurrency } from '@/core/finance';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { logger } from '@/utils/logger';
import { applyBusinessRules } from '@/services/proposals/businessRulesEnricher';
import { trackEvent } from '@/services/analyticsTracker';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-proposal`;

interface AIProposalData {
  clientName?: string;
  consortiumType: string;
  creditValue: number;
  installment: number;
  termMonths: number;
  totalCost: number;
  bidPercent?: number;
  bidType?: string;
  scenarioProfile?: string;
  financingInstallment?: number;
  financingTotal?: number;
  savings?: number;
  savingsPercent?: number;
  contemplated?: boolean;
  contemplationMonth?: number;
  reducedInstallment?: boolean;
  reducedInstallmentMonths?: number;
  reducedInstallmentValue?: number;
  redilutedInstallmentValue?: number;
  /** Refinamento opcional do objetivo (label legível, ex: "Reforma"). */
  subObjetivo?: string;
  usedCreditForAsset?: boolean;
  creditUsageMonth?: number;
}

interface AIProposalCardProps {
  proposalData: AIProposalData;
}

// ─── Validation ───

function isFinitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

interface ValidationResult {
  valid: boolean;
  missing: string[];
}

function validateProposalData(data: AIProposalData): ValidationResult {
  const missing: string[] = [];
  if (!data.consortiumType?.trim()) missing.push('tipo de consórcio');
  if (!isFinitePositive(data.creditValue)) missing.push('valor da carta');
  if (!isFiniteNumber(data.installment) || data.installment < 0) missing.push('parcela');
  if (!isFinitePositive(data.termMonths)) missing.push('prazo');
  if (!isFiniteNumber(data.totalCost) || data.totalCost < 0) missing.push('custo total');
  return { valid: missing.length === 0, missing };
}

// ─── Payload builder ───

function buildProposalRequest(proposalData: AIProposalData) {
  const normalized: Record<string, unknown> = {
    consortiumType: proposalData.consortiumType.trim(),
    creditValue: Number(proposalData.creditValue),
    installment: Number(proposalData.installment),
    termMonths: Number(proposalData.termMonths),
    totalCost: Number(proposalData.totalCost),
    contemplated: Boolean(proposalData.contemplated),
  };

  if (proposalData.clientName?.trim()) normalized.clientName = proposalData.clientName.trim();
  if (isFinitePositive(proposalData.bidPercent)) normalized.bidPercent = proposalData.bidPercent;
  if (proposalData.bidType?.trim()) normalized.bidType = proposalData.bidType.trim();
  if (proposalData.scenarioProfile?.trim()) normalized.scenarioProfile = proposalData.scenarioProfile.trim();
  if (isFinitePositive(proposalData.financingInstallment)) normalized.financingInstallment = proposalData.financingInstallment;
  if (isFinitePositive(proposalData.financingTotal)) normalized.financingTotal = proposalData.financingTotal;
  if (isFiniteNumber(proposalData.savings)) normalized.savings = proposalData.savings;
  if (isFiniteNumber(proposalData.savingsPercent)) normalized.savingsPercent = proposalData.savingsPercent;
  if (proposalData.contemplated && isFinitePositive(proposalData.contemplationMonth)) {
    normalized.contemplationMonth = proposalData.contemplationMonth;
  }
  if (proposalData.reducedInstallment) {
    normalized.reducedInstallment = true;
    if (isFinitePositive(proposalData.reducedInstallmentMonths)) {
      normalized.reducedInstallmentMonths = proposalData.reducedInstallmentMonths;
    }
    if (isFinitePositive(proposalData.reducedInstallmentValue)) {
      normalized.reducedInstallmentValue = proposalData.reducedInstallmentValue;
    }
    if (isFinitePositive(proposalData.redilutedInstallmentValue)) {
      normalized.redilutedInstallmentValue = proposalData.redilutedInstallmentValue;
    }
  }
  if (proposalData.subObjetivo?.trim()) {
    normalized.subObjetivo = proposalData.subObjetivo.trim();
  }
  if (proposalData.usedCreditForAsset) {
    normalized.usedCreditForAsset = true;
    if (isFinitePositive(proposalData.creditUsageMonth)) {
      normalized.creditUsageMonth = proposalData.creditUsageMonth;
    }
  }

  return { proposalData: normalized };
}

// ─── Error handling ───

function getFunctionErrorMessage(status: number, errorBody?: unknown): string {
  if (status === 429) return 'Limite de requisições excedido. Tente novamente em alguns segundos.';
  if (status === 402) return 'Créditos de IA insuficientes.';

  if (errorBody && typeof errorBody === 'object') {
    const body = errorBody as { error?: string; details?: Record<string, string[]> };
    if (body.error) {
      const invalidFields = body.details
        ? Object.entries(body.details)
            .filter(([, msgs]) => Array.isArray(msgs) && msgs.length > 0)
            .map(([field]) => field)
        : [];
      return invalidFields.length > 0 ? `${body.error}: ${invalidFields.join(', ')}` : body.error;
    }
  }

  return 'Não foi possível gerar a proposta agora. Tente novamente.';
}

// ─── Component ───

export function AIProposalCard({ proposalData }: AIProposalCardProps) {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const cacheKeyRef = useRef<string>('');
  const cachedTextRef = useRef<string>('');
  const abortRef = useRef<AbortController | null>(null);

  const validation = useMemo(() => validateProposalData(proposalData), [proposalData]);
  const dataKey = JSON.stringify(proposalData);

  const generate = useCallback(async (forceRegenerate = false) => {
    // Cache hit
    if (!forceRegenerate && cacheKeyRef.current === dataKey && cachedTextRef.current) {
      setText(cachedTextRef.current);
      return;
    }

    // Pre-flight validation
    if (!validation.valid) {
      const msg = `Dados insuficientes: ${validation.missing.join(', ')}. Faça uma simulação primeiro.`;
      setError(msg);
      toast.error(msg);
      return;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsStreaming(true);
    setError(null);
    setText('');

    // Timeout de 25s para edge functions com IA
    const timeout = setTimeout(() => controller.abort(new Error('Tempo limite excedido ao gerar proposta. Tente novamente.')), 25000);

    try {
      const requestPayload = buildProposalRequest(proposalData);

      if (import.meta.env.DEV) {
        logger.log('[AI Proposal] Payload:', JSON.stringify(requestPayload, null, 2));
        logger.log('[AI Proposal] URL:', FUNCTION_URL);
      }

      let resp: Response;
      try {
        resp = await fetch(FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(requestPayload),
          signal: controller.signal,
        });
      } catch (fetchError) {
        // Network-level error (CORS blocked, DNS, offline, etc.)
        const isOffline = !navigator.onLine;
        const networkMsg = isOffline
          ? 'Sem conexão com a internet. Verifique sua rede e tente novamente.'
          : 'Erro de conexão com o servidor. Verifique sua rede ou tente novamente em alguns segundos.';
        logger.error('[AI Proposal] Network error:', fetchError);
        setError(networkMsg);
        toast.error(networkMsg);
        setIsStreaming(false);
        return;
      }

      if (!resp.ok) {
        let errorBody: unknown;
        try { errorBody = await resp.json(); } catch { errorBody = undefined; }
        logger.error('[AI Proposal] Error response:', resp.status, errorBody);
        const message = getFunctionErrorMessage(resp.status, errorBody);
        setError(message);
        toast.error(message);
        setIsStreaming(false);
        return;
      }

      if (!resp.body) {
        setError('Resposta vazia do servidor.');
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullText += content;
              setText(fullText);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      if (!fullText.trim()) {
        setError('A IA não retornou conteúdo. Tente novamente.');
        return;
      }

      // Enriquecimento determinístico: garante regras de negócio (ex: parcela reduzida)
      // mesmo que o modelo de IA tenha omitido a menção.
      fullText = applyBusinessRules(fullText, {
        reducedInstallment: proposalData.reducedInstallment,
        format: 'markdown',
      });
      setText(fullText);

      logger.log('[AI Proposal] Success, length:', fullText.length);
      cacheKeyRef.current = dataKey;
      cachedTextRef.current = fullText;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        // Check if it was our timeout
        const isTimeout = e.message?.includes('Tempo limite');
        if (isTimeout) {
          const msg = 'Tempo limite excedido ao gerar proposta. Tente novamente.';
          setError(msg);
          toast.error(msg);
        }
        return;
      }
      logger.error('[AI Proposal] Error:', e);
      const message = e instanceof Error ? e.message : 'Não foi possível gerar a proposta agora. Tente novamente.';
      setError(message);
      toast.error(message);
    } finally {
      clearTimeout(timeout);
      setIsStreaming(false);
    }
  }, [proposalData, dataKey, validation]);

  const handleRegenerate = useCallback(() => {
    cacheKeyRef.current = '';
    cachedTextRef.current = '';
    generate(true);
  }, [generate]);

  const handleCopy = useCallback(async () => {
    const plainText = text
      .replace(/\*\*(.*?)\*\*/g, '*$1*')
      .replace(/^#{1,3}\s/gm, '')
      .replace(/^- /gm, '• ');
    await copyToClipboard(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    trackEvent('ai_content_copied', { module: 'ai-proposal-card', scenario: 'summary', copy_format: 'plain' });
    toast.success('Proposta IA copiada!');
  }, [text]);

  const handleWhatsApp = useCallback(() => {
    const plainText = text
      .replace(/\*\*(.*?)\*\*/g, '*$1*')
      .replace(/^#{1,3}\s/gm, '')
      .replace(/^- /gm, '• ');
    openInWhatsApp(plainText);
    trackEvent('ai_content_sent_whatsapp', { module: 'ai-proposal-card', scenario: 'summary' });
  }, [text]);

  // ─── Empty state: no data ───
  if (!validation.valid && !text && !isStreaming && !error) {
    return (
      <Card className="border-2 border-dashed border-muted-foreground/20 print-hide animate-fade-in">
        <CardContent className="py-8 flex flex-col items-center text-center gap-6">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">Simulação necessária</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Faça uma simulação no <strong>Simulador</strong> para gerar uma proposta personalizada com IA.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Dados faltando: {validation.missing.join(', ')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── CTA state: has data, not yet generated ───
  if (!text && !isStreaming && !error) {
    return (
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent print-hide animate-fade-in">
        <CardContent className="py-8 flex flex-col items-center text-center gap-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">Proposta com IA</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Gere uma mensagem personalizada e persuasiva, pronta para enviar ao cliente via WhatsApp.
            </p>
          </div>

          {/* Data summary pill */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-caption text-muted-foreground">
            <span className="px-2 py-0.5 rounded-full bg-muted">{proposalData.consortiumType}</span>
            <span className="px-2 py-0.5 rounded-full bg-muted">{formatCurrency(proposalData.creditValue)}</span>
            <span className="px-2 py-0.5 rounded-full bg-muted">{proposalData.termMonths}m</span>
            <span className="px-2 py-0.5 rounded-full bg-muted">Parcela {formatCurrency(proposalData.installment)}</span>
          </div>

          <Button id="ai-generate-btn" onClick={() => generate()} size="lg" className="gap-2 min-h-[48px] px-8">
            <Sparkles className="h-5 w-5" />
            Gerar proposta com IA
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ─── Main state: streaming / result / error ───
  return (
    <Card id="ai-result-area" className="border-primary/20 print-hide animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Proposta com IA</CardTitle>
          </div>
          {text && !isStreaming && (
            <Button variant="ghost" size="sm" onClick={handleRegenerate} className="gap-1.5 text-muted-foreground">
              <RefreshCw className="h-4 w-4" />
              Regenerar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Skeleton while waiting for first token */}
        {isStreaming && !text && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Gerando proposta personalizada...</span>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[75%]" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-start gap-3 p-card-sm rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm text-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isStreaming}
                className="gap-1.5"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          </div>
        )}

        {/* Generated text */}
        {text && (
          <>
            <div className="rounded-lg bg-muted/50 border border-border p-card-sm text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleCopy} className="gap-2 flex-1 min-h-[44px]">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiada!' : 'Copiar texto'}
              </Button>
              {isMobileDevice() && (
                <Button
                  variant="outline"
                  onClick={handleWhatsApp}
                  className="gap-2 flex-1 min-h-[44px] border-whatsapp-green/40 text-whatsapp-green hover:bg-whatsapp-green/10 hover:text-whatsapp-green"
                >
                  <ExternalLink className="h-4 w-4" />
                  Enviar via WhatsApp
                </Button>
              )}
            </div>

            {isStreaming && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                Gerando proposta...
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
