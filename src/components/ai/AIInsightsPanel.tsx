/**
 * AIInsightsPanel — análise consultiva da CentralAI (versão enxuta).
 *
 * CONSOLIDAÇÃO ONDA FINAL (final-module-boundary-consolidation):
 *  - Removidas as sub-seções "Resumo" (duplicava Simulador) e
 *    "Próximo passo" (duplicava o hero do Cockpit).
 *  - Mantém apenas a "Análise consultiva" — texto curto da IA.
 *  - O painel é renderizado **recolhido por padrão** no rodapé do Cockpit
 *    (ver AnalysisModule.tsx, <details>). Não deve ser usado como hero.
 *
 * REGRAS:
 *  - Não exige input do usuário.
 *  - Não duplica dados (lê do journey).
 *  - Atualiza a análise automaticamente quando a simulação relevante muda
 *    (debounce 600ms para evitar requests em cascata).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, RefreshCw, Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCentralAI } from '@/hooks/useCentralAI';
import { useClientJourney } from '@/components/layout/ClientJourneyContext';
import { cn } from '@/lib/utils';

interface AIInsightsPanelProps {
  /** Renderização compacta (ex: dentro de uma aba). */
  compact?: boolean;
  /** Dispara a análise automaticamente ao montar (default: true). */
  autoRun?: boolean;
}

export function AIInsightsPanel({ compact = false, autoRun = true }: AIInsightsPanelProps) {
  const { ready, generateInsight } = useCentralAI();
  const journey = useClientJourney();

  const [analysis, setAnalysis] = useState<string>('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const sim = journey.simulation;
  // Chave que dispara o auto-refresh (evita reagir a mudanças irrelevantes)
  const simKey = `${sim.consortiumType}|${sim.creditValue}|${sim.termMonths}|${sim.installmentAfterContemplation}|${journey.slots.bidStrategy?.bidPercent ?? ''}`;

  const runAnalysis = useCallback(async () => {
    if (!ready) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    const r = await generateInsight('analysis');
    setAnalysisLoading(false);
    if (r.ok === false) {
      setAnalysisError(r.message);
      return;
    }
    if (r.kind === 'text') setAnalysis(r.text);
  }, [ready, generateInsight]);

  // Auto-refresh debounced quando simulação muda (se autoRun e já houve análise inicial)
  const lastKeyRef = useRef<string>('');
  useEffect(() => {
    if (!ready || !autoRun) return;
    if (lastKeyRef.current === simKey) return;
    lastKeyRef.current = simKey;
    const t = setTimeout(() => { runAnalysis(); }, 600);
    return () => clearTimeout(t);
  }, [ready, autoRun, simKey, runAnalysis]);

  if (!ready) {
    return (
      <Card className={cn('border-dashed print-hide', compact && 'shadow-none')}>
        <CardContent className="py-4 text-sm text-muted-foreground flex items-center gap-2">
          <Info className="h-4 w-4" />
          Configure a simulação para ativar a análise da CentralAI.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('print-hide border-primary/20', compact && 'shadow-none')}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Análise da CentralAI
          <Badge variant="secondary" className="ml-auto text-caption uppercase tracking-wide">
            Beta
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Leitura consultiva curta da simulação atual.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 text-xs"
            onClick={runAnalysis}
            disabled={analysisLoading}
          >
            {analysisLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Atualizar
          </Button>
        </div>
        {analysisError ? (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">{analysisError}</AlertDescription>
          </Alert>
        ) : analysisLoading && !analysis ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2 py-3">
            <Loader2 className="h-4 w-4 animate-spin" /> Gerando análise…
          </div>
        ) : analysis ? (
          <div className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">
            {analysis}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Clique em "Atualizar" para gerar a análise.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
