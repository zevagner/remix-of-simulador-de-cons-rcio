import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { HelpTooltip } from '@/components/shared/HelpTooltip';
import type { BidAnalysisResult } from '@/utils/bidAnalysis';
import { trackEvent } from '@/services/analyticsTracker';
import { supabase } from '@/integrations/supabase/client';
import { cacheKey, getCached, setCached } from '@/utils/aiResponseCache';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';

export interface BidAIRecommendationProps {
  groupName: string;
  groupType: string;
  creditRange: string;
  bidEmbeddedAllowed: boolean;
  embeddedBidMaxPercent: number;
  analysis: BidAnalysisResult;
  clientBid: number;
}

interface DerivedContext {
  avgBid: number;
  minBid: number;
  maxBid: number;
  faixaIdealMin: number;
  faixaIdealMax: number;
  suggestedBid: number;
}

function deriveContext(analysis: BidAnalysisResult): DerivedContext | null {
  const { zones } = analysis;
  // Faixa ideal = entre o mínimo da equilibrada e o máximo da conservadora
  const faixaIdealMin = Math.min(zones.equilibrada.minBid, zones.conservadora.minBid);
  const faixaIdealMax = Math.max(zones.equilibrada.maxBid, zones.conservadora.maxBid);
  const suggestedBid = (zones.equilibrada.minBid + zones.conservadora.minBid) / 2;
  const minBid = zones.agressiva.minBid > 0 ? zones.agressiva.minBid : zones.equilibrada.minBid;
  const maxBid = Math.max(zones.conservadora.maxBid, zones.equilibrada.maxBid, zones.agressiva.maxBid);
  const avgBid = (zones.equilibrada.minBid + zones.equilibrada.maxBid) / 2;

  if (!isFinite(avgBid) || !isFinite(minBid) || !isFinite(maxBid)) return null;
  if (avgBid <= 0 && minBid <= 0 && maxBid <= 0) return null;

  return {
    avgBid,
    minBid,
    maxBid,
    faixaIdealMin,
    faixaIdealMax,
    suggestedBid,
  };
}

function classifyProbability(clientBid: number, ctx: DerivedContext): 'baixa' | 'média' | 'alta' {
  if (clientBid >= ctx.faixaIdealMin && clientBid <= ctx.faixaIdealMax) return 'média';
  if (clientBid > ctx.faixaIdealMax) return 'alta';
  return 'baixa';
}

export function BidAIRecommendation({
  groupName,
  groupType,
  creditRange,
  bidEmbeddedAllowed: _bidEmbeddedAllowed,
  embeddedBidMaxPercent: _embeddedBidMaxPercent,
  analysis,
  clientBid,
}: BidAIRecommendationProps) {
  const [visible, setVisible] = useState(false);
  const { currentCompanyId } = useCurrentCompany();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const ctx = useMemo(() => deriveContext(analysis), [analysis]);
  const validBid = clientBid > 0 && clientBid <= 100;

  async function fetchRecommendation() {
    if (!ctx || !validBid) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const probabilityLevel = classifyProbability(clientBid, ctx);
    const diffFromAvg = Number((clientBid - ctx.avgBid).toFixed(2));

    const body = {
      clientBid,
      avgBid: Number(ctx.avgBid.toFixed(2)),
      minBid: Number(ctx.minBid.toFixed(2)),
      maxBid: Number(ctx.maxBid.toFixed(2)),
      faixaIdealMin: Number(ctx.faixaIdealMin.toFixed(2)),
      faixaIdealMax: Number(ctx.faixaIdealMax.toFixed(2)),
      suggestedBid: Number(ctx.suggestedBid.toFixed(2)),
      diffFromAvg,
      probabilityLevel,
      groupName,
      groupType,
      creditRange,
    };

    const ck = cacheKey('bid-recommendation', body, currentCompanyId);
    const cached = getCached<string>(ck);
    if (cached) {
      setRecommendation(cached);
      setLoading(false);
      trackEvent('ai_cache_hit', { module: 'bid-recommendation' });
      return;
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('bid-recommendation', {
        body,
      });

      if (controller.signal.aborted) return;

      if (fnError) {
        const msg = fnError.message || '';
        if (/429/.test(msg)) setError('Muitas requisições. Aguarde alguns segundos e tente novamente.');
        else if (/402/.test(msg)) setError('Cota de IA esgotada no momento. Tente mais tarde.');
        else setError('Não foi possível gerar a recomendação. Tente novamente.');
        setLoading(false);
        return;
      }

      const text = (data && typeof data === 'object' && 'recommendation' in data)
        ? String((data as { recommendation: string }).recommendation)
        : '';

      if (!text) {
        setError('Resposta vazia da IA.');
      } else {
        setRecommendation(text);
        setCached(ck, text);
        trackEvent('bid_ai_recommendation_generated', {
          module: 'bids',
          group_number: groupName,
          probability_level: probabilityLevel,
        });
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  // Auto-refetch quando o lance do cliente mudar (debounce 600ms),
  // somente se o bloco estiver visível.
  useEffect(() => {
    if (!visible || !validBid || !ctx) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      fetchRecommendation();
    }, 600);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientBid, visible, ctx?.avgBid, ctx?.minBid, ctx?.maxBid, ctx?.faixaIdealMin, ctx?.faixaIdealMax]);

  // Cancela qualquer chamada pendente ao desmontar.
  useEffect(() => () => abortRef.current?.abort(), []);

  const handleShow = () => {
    setVisible(true);
    if (validBid && ctx) fetchRecommendation();
  };

  return (
    <Card id="bids-ai-recommendation" className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Recomendação Inteligente de Lance
          <HelpTooltip
            title="Recomendação de Lance"
            content="Analisa seu lance frente ao histórico real do grupo e diz objetivamente o que fazer."
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!visible && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {validBid
                ? 'Receba uma análise objetiva do seu lance comparado ao grupo.'
                : 'Informe seu lance no card "Seu lance" acima e gere a recomendação.'}
            </p>
            <Button
              onClick={handleShow}
              disabled={!validBid || !ctx}
              className="gap-2 active:scale-[0.97] transition-transform"
            >
              <Sparkles className="h-4 w-4" />
              Gerar recomendação
            </Button>
          </div>
        )}

        {visible && (
          <>
            {!validBid && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 border border-muted text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span>Informe um lance válido (maior que 0%) no card "Seu lance" para gerar a recomendação.</span>
              </div>
            )}

            {validBid && loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando seu lance frente ao grupo…
              </div>
            )}

            {validBid && !loading && error && (
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span>{error}</span>
                </div>
                <Button size="sm" variant="outline" onClick={fetchRecommendation} className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Tentar novamente
                </Button>
              </div>
            )}

            {validBid && !loading && !error && recommendation && (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                  {recommendation}
                </p>
                <div className="flex justify-end">
                  <Button size="sm" variant="ghost" onClick={fetchRecommendation} className="gap-1.5 text-xs">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Atualizar
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
