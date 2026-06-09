/**
 * StorytellingCard — generates and displays emotional narratives
 * for consultative selling based on diagnostic + simulation data.
 * Full narrative only (no WhatsApp version) — final messages belong to Proposta.
 */
import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Copy, Check, RefreshCw, Sparkles } from 'lucide-react';
import { useSimulatorContext } from '@/components/modules/simulator/SimulatorContext';
import { useDiagnosticContextSafe } from '@/components/modules/diagnostic/DiagnosticContext';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';
import { createStorytelling, type StorytellingResult } from '@/services/createStorytelling';
import { WhatsAppTextPreview } from '@/components/shared/WhatsAppTextPreview';
import { copyToClipboard } from '@/utils/clipboard';
import { trackEvent } from '@/services/analyticsTracker';
import { toast } from 'sonner';

export function StorytellingCard() {
  const sim = useSimulatorContext();
  const diag = useDiagnosticContextSafe();
  const { navigateTo } = useModuleNavigation();

  const [story, setStory] = useState<StorytellingResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [seed, setSeed] = useState(0);

  const hasDiagnostic = diag?.hasStarted ?? false;
  const hasSimulation = sim.isValidSimulation;

  const generate = useCallback(() => {
    const result = createStorytelling({
      clientName: diag?.data.clientName || '',
      clientObjective: diag?.data.clientObjective || 'comprar-imovel',
      clientSituation: diag?.data.clientSituation || 'pagando-aluguel',
      monthlyCapacity: diag?.data.monthlyCapacity || 0,
      urgencyLevel: diag?.data.urgencyLevel || 'media',
      creditValue: sim.input.creditValue || undefined,
      termMonths: sim.input.termMonths || undefined,
      installment: sim.isValidSimulation ? sim.result.installmentBeforeContemplation : undefined,
      subObjetivo: diag?.data.subObjetivo || undefined,
    });
    setStory(result);
    setSeed(s => s + 1);
    trackEvent('storytelling_generated', { module: 'objections', has_diagnostic: hasDiagnostic, has_simulation: hasSimulation });
  }, [diag, sim, hasDiagnostic, hasSimulation]);

  const handleCopy = useCallback(async () => {
    if (!story) return;
    await copyToClipboard(story.narrative);
    setCopied(true);
    trackEvent('storytelling_copied', { module: 'objections', copy_format: 'plain' });
    toast.success('História copiada!');
    setTimeout(() => setCopied(false), 2000);
  }, [story]);

  // Empty state
  if (!hasDiagnostic && !hasSimulation) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20">
        <CardContent className="py-10 flex flex-col items-center text-center gap-3">
          <BookOpen className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Preencha o <strong>Diagnóstico</strong> ou faça uma <strong>Simulação</strong> para gerar uma história personalizada.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigateTo('diagnostic')} className="gap-1.5">
              Ir para Diagnóstico
            </Button>
            <Button size="sm" onClick={() => navigateTo('simulator')} className="gap-1.5">
              Ir para Simulação
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info + generate */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Narrativa baseada no perfil {hasDiagnostic ? 'do diagnóstico' : 'da simulação'}
        </p>
      </div>

      {!story && (
        <Button 
          onClick={generate} 
          className="w-full gap-2 bg-[#003641] hover:bg-[#003641]/90 text-white shadow-md py-6 text-base font-semibold transition-all hover:scale-[1.01]"
        >
          <Sparkles className="h-5 w-5 fill-white/20" />
          Gerar história personalizada
        </Button>
      )}

      {/* Story card */}
      {story && (
        <Card
          key={seed}
          className="border-l-4 animate-fade-in border-l-accent bg-gradient-to-br from-card to-accent/5"
        >
          <CardContent className="py-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground">{story.title}</h3>
              <Badge variant="secondary" className="text-caption shrink-0">Storytelling</Badge>
            </div>

            {/* Highlights */}
            {story.highlights.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {story.highlights.map((h, i) => (
                  <Badge key={i} variant="outline" className="text-caption font-normal">{h}</Badge>
                ))}
              </div>
            )}

            {/* Full narrative */}
            <div className="rounded-lg bg-muted/40 p-card-sm border border-border/50">
              <WhatsAppTextPreview text={story.narrative} />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={generate} className="gap-1.5 text-xs">
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerar
              </Button>
              <Button size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips — only visible after story is generated */}
      {story && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-4 space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              💡 <strong>Dica:</strong> A história é gerada com base no perfil do cliente — situação, objetivo e capacidade financeira.
              Use como referência para conduzir a conversa. Para enviar ao cliente, gere a proposta no módulo <strong>Proposta</strong>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
