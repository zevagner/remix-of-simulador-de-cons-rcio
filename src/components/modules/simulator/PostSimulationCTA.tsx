import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, GitCompare, PiggyBank, ChevronRight, MessageSquareQuote, Copy, Loader2, Save, X } from 'lucide-react';
import { useSimulatorInput, useSimulatorResult } from './SimulatorContext';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';
import { copyToClipboard } from '@/utils/clipboard';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { requestOpenNewLead } from '@/utils/pipelineLaunch';
import { trackEvent } from '@/services/analyticsTracker';

// Lazy types (type-only import has zero runtime cost / no bundle impact)
import type { getContextualObjections as GetContextualObjectionsFn } from '@/utils/objectionRecommender';

type SuggestedObjection = ReturnType<typeof GetContextualObjectionsFn extends (...a: any) => infer R ? never : never>;
// Fallback inline type to avoid pulling the library types eagerly
interface SuggestedItem {
  objection: { id: string; clientPhrase: string; response: string; category: string };
  reason: string;
}
interface CategoryInfo { id: string; emoji: string; label: string }

// Module-scope cache so we only load the library once per session
let cachedRecommender: typeof import('@/utils/objectionRecommender') | null = null;
let cachedLibrary: typeof import('@/data/objectionsLibrary') | null = null;
let inflight: Promise<void> | null = null;

async function loadObjectionsAssets() {
  if (cachedRecommender && cachedLibrary) return;
  if (!inflight) {
    inflight = Promise.all([
      import('@/utils/objectionRecommender'),
      import('@/data/objectionsLibrary'),
    ]).then(([rec, lib]) => {
      cachedRecommender = rec;
      cachedLibrary = lib;
    });
  }
  await inflight;
}

export function PostSimulationCTA() {
  const { input, contemplated } = useSimulatorInput();
  const { isValidSimulation } = useSimulatorResult();
  const { navigateTo } = useModuleNavigation();
  const [showObjections, setShowObjections] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestedObjections, setSuggestedObjections] = useState<SuggestedItem[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  // Auto-nudge: aparece após 30s na tela de resultado válido (uma vez por sessão)
  const [showNudge, setShowNudge] = useState(false);

  // Save-as-proposal handler — abre Carteira já com NewLeadModal pré-preenchido
  const handleSaveAsProposal = () => {
    if (!isValidSimulation) return;
    requestOpenNewLead();
    trackEvent('simulator_save_as_proposal_click', {
      module: 'simulator',
      consortium_type: input.consortiumType,
      credit_value: input.creditValue,
    });
    navigateTo('proposals');
  };

  // Load objections lib only when the user expands the section
  useEffect(() => {
    if (!showObjections || !isValidSimulation) return;
    let mounted = true;
    setLoading(true);
    loadObjectionsAssets()
      .then(() => {
        if (!mounted || !cachedRecommender || !cachedLibrary) return;
        const items = cachedRecommender.getContextualObjections(
          {
            creditValue: input.creditValue,
            consortiumType: input.consortiumType,
            contemplated,
            termMonths: input.termMonths,
          },
          3,
        ) as unknown as SuggestedItem[];
        setSuggestedObjections(items);
        setCategories(cachedLibrary.CATEGORIES as unknown as CategoryInfo[]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [showObjections, isValidSimulation, input.creditValue, input.consortiumType, input.termMonths, contemplated]);

  // Auto-nudge após 30s na simulação válida (1x por simulação, não por sessão)
  useEffect(() => {
    if (!isValidSimulation) { setShowNudge(false); return; }
    setShowNudge(false); // reset a cada nova simulação válida
    const t = setTimeout(() => {
      setShowNudge(true);
      trackEvent('simulator_nudge_shown', { module: 'simulator' });
    }, 30_000);
    return () => clearTimeout(t);
  }, [isValidSimulation, input.creditValue, input.termMonths, input.consortiumType]);

  const dismissNudge = () => {
    setShowNudge(false);
  };

  if (!isValidSimulation) return null;

  const steps = [
    {
      icon: GitCompare,
      label: 'Comparar com financiamento',
      description: 'Veja quanto o cliente economiza',
      action: () => navigateTo('comparator'),
      color: 'text-blue-500',
    },
    {
      icon: PiggyBank,
      label: 'Analisar como investimento',
      description: 'Mostre o retorno ao cliente',
      action: () => navigateTo('investment'),
      color: 'text-emerald-500',
    },
    {
      icon: FileText,
      label: 'Gerar proposta comercial',
      description: 'Mensagem pronta para enviar',
      action: () => navigateTo('proposal'),

      color: 'text-primary',
      primary: true,
    },
  ];

  return (
    <>
      {/* Auto-nudge — banner discreto após 30s */}
      {showNudge && (
        <div className="sticky top-2 z-30 mx-auto max-w-2xl animate-fade-in print-hide">
          <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/[0.08] backdrop-blur px-4 py-2.5 shadow-md">
            <Save className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm text-foreground flex-1">
              <strong>Gostou?</strong> Salva essa simulação pra não perder.
            </p>
            <Button
              size="sm"
              onClick={() => { handleSaveAsProposal(); dismissNudge(); }}
              className="h-8 text-xs gap-1"
            >
              Salvar agora
            </Button>
            <button
              onClick={() => { dismissNudge(); trackEvent('simulator_nudge_dismissed', { module: 'simulator' }); }}
              className="text-muted-foreground hover:text-foreground p-1"
              aria-label="Dispensar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <Card className="border-primary/15 bg-gradient-to-br from-primary/[0.04] via-transparent to-primary/[0.02] print-hide">
        <CardContent className="p-card-sm space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">✅ Simulação pronta — próximos passos</p>
            <p className="text-caption text-muted-foreground mt-0.5">Avance na jornada de venda com o cliente</p>
          </div>

          {/* CTA primária — Salvar como proposta (dominante) */}
          <Button
            onClick={handleSaveAsProposal}
            size="lg"
            className="w-full justify-center gap-2 h-12 text-sm font-semibold shadow-sm bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4" />
            Criar proposta para este cliente
          </Button>

          <p className="text-caption uppercase tracking-wider text-muted-foreground/70 pt-1">Ações auxiliares</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.label}
                  onClick={step.action}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-md border border-border/60 bg-background/50 transition-[colors,box-shadow,transform] text-left hover:bg-muted/50 hover:border-border active:scale-[0.98]"
                >
                  <Icon className={`h-4 w-4 shrink-0 ${step.color} opacity-80`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-caption font-medium text-foreground/90 leading-tight">{step.label}</p>
                    <p className="text-caption text-muted-foreground leading-tight mt-0.5 line-clamp-1">{step.description}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/75 shrink-0" />
                </button>
              );
            })}
          </div>

        {/* Contextual objection suggestions (lazy-loaded on expand) */}
        <div className="pt-2 border-t border-border">
          <button
            onClick={() => setShowObjections(!showObjections)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquareQuote className="h-3.5 w-3.5" />
            <span className="font-medium">Objeções prováveis do cliente</span>
            <ChevronRight className={`h-3 w-3 transition-transform ${showObjections ? 'rotate-90' : ''}`} />
          </button>

          {showObjections && (
            <div className="mt-2 space-y-2">
              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Carregando objeções...
                </div>
              )}

              {!loading && suggestedObjections.map(({ objection, reason }) => {
                const cat = categories.find(c => c.id === objection.category);
                return (
                  <div key={objection.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/30 border border-border/50">
                    <span className="text-sm shrink-0">{cat?.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">"{objection.clientPhrase}"</p>
                      <p className="text-caption text-muted-foreground mt-0.5 line-clamp-2">{objection.response}</p>
                      <p className="text-caption text-muted-foreground/75 mt-0.5 italic">{reason}</p>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => { copyToClipboard(objection.response); toast.success('Resposta copiada!'); }}
                            className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                          >
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">Copiar resposta</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                );
              })}

              {!loading && suggestedObjections.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 w-full"
                  onClick={() => navigateTo('objections')}
                >
                  Ver todas as objeções →
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </>
  );
}
