/**
 * Argumentação Module — Reorganized into 3 clear blocks:
 * 1. Antes da conversa (preparation)
 * 2. Durante a conversa (conversation)
 * 3. Funil de vendas (funnel)
 */
import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, Copy, Check, MessageSquareQuote, X,
  Target, Sparkles, GraduationCap, Zap, BookOpen, MessageSquareText,
  Clock, MessageSquare, TrendingUp, ArrowRight, ChevronDown, ChevronUp
} from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { NextStepCTA } from '@/components/layout/NextStepCTA';
import { TriggersTab } from '@/components/modules/objections/TriggersTab';
import { FunnelTab } from '@/components/modules/objections/FunnelTab';
import { StorytellingCard } from '@/components/modules/objections/StorytellingCard';
import { ContextualSalesScript } from '@/components/modules/objections/ContextualSalesScript';
import { useSimulatorContext } from '@/components/modules/simulator/SimulatorContext';
import { useModuleNavigation } from '@/components/layout/ModuleNavigationContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatCurrency } from '@/core/finance';
import { CONSORTIUM_TYPE_LABELS, type ConsortiumType } from '@/types/consortium';
import {
  OBJECTIONS, CATEGORIES,
  type ObjectionCategory, type Objection,
  getCategoryInfo, countByCategory,
  CLIENT_PROFILES, type ClientProfile,
} from '@/data/objectionsLibrary';
import { getContextualObjections } from '@/utils/objectionRecommender';
import { copyToClipboard } from '@/utils/clipboard';
import { trackEvent } from '@/services/analyticsTracker';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ModuleSkeleton } from '@/components/ui/ModuleSkeleton';
import { DelayedFallback } from '@/components/ui/DelayedFallback';
import { useTrackModuleAccess } from '@/hooks/useTrackModuleAccess';

// Lazy load tabs moved from Proposal
const ProposalFollowUpTab = lazy(() =>
  import('@/components/modules/proposal/ProposalFollowUpTab').then(m => ({ default: m.ProposalFollowUpTab }))
);

export function ObjectionsModule() {
  useTrackModuleAccess('objections');
  const ctx = useSimulatorContext();
  const { input, result, isValidSimulation, contemplationMonth } = ctx;
  const { navigateTo } = useModuleNavigation();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState('preparation');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ObjectionCategory | null>(null);
  const [activeProfile, setActiveProfile] = useState<ClientProfile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [libraryExpanded, setLibraryExpanded] = useState(false);

  const creditValue = input.creditValue;
  const termMonths = input.termMonths;
  const typeLabel = CONSORTIUM_TYPE_LABELS[input.consortiumType || 'imobiliario'];
  const counts = useMemo(() => countByCategory(), []);

  // Contextual recommendations
  const recommendations = useMemo(() => {
    if (!isValidSimulation) return [];
    return getContextualObjections({
      creditValue,
      consortiumType: input.consortiumType as ConsortiumType,
      contemplated: false,
      termMonths,
    }, 5);
  }, [isValidSimulation, creditValue, input.consortiumType, termMonths]);

  // Library filter
  const filtered = useMemo(() => {
    let list = OBJECTIONS;
    if (activeProfile) list = list.filter(o => o.clientProfile === activeProfile);
    if (activeCategory) list = list.filter(o => o.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.clientPhrase.toLowerCase().includes(q) ||
        o.response.toLowerCase().includes(q) ||
        o.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [search, activeCategory, activeProfile]);

  const handleCopy = useCallback(async (obj: Objection) => {
    const cat = getCategoryInfo(obj.category);
    const text = `${cat.emoji} *Objeção: "${obj.clientPhrase}"*\n\n${obj.response}`;
    await copyToClipboard(text);
    setCopiedId(obj.id);
    trackEvent('objection_copied', { module: 'objections', scenario: obj.category, copy_format: 'whatsapp' });
    toast.success('Resposta copiada!');
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Follow-up context for the Respostas tab
  const followUpContext = useMemo(() => ({
    consortiumType: typeLabel,
    creditValue,
    installment: isValidSimulation ? (input.reducedInstallment ? result.installmentBeforeContemplation : result.installmentAfterContemplation) : 0,
    termMonths,
    totalCost: isValidSimulation ? result.totalCost : 0,
    bidPercent: creditValue > 0 ? ((ctx.actualFreeBidValue + ctx.actualEmbeddedBidValue) / creditValue) * 100 : undefined,
    clientName: undefined as string | undefined,
    clientObjective: undefined as string | undefined,
  }), [typeLabel, creditValue, termMonths, isValidSimulation, result, input.reducedInstallment, ctx.actualFreeBidValue, ctx.actualEmbeddedBidValue]);

  return (
    <div className="space-y-5 pb-24 md:pb-8 animate-fade-in">
      <ModuleHeader
        title="Abordagem"
        subtitle="Prepare-se para a conversa com o cliente"
        moduleId="objections"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-11">
          <TabsTrigger value="preparation" className="gap-1 text-caption sm:text-xs px-1">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            Antes da conversa
          </TabsTrigger>
          <TabsTrigger value="conversation" className="gap-1 text-caption sm:text-xs px-1">
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            Durante a conversa
          </TabsTrigger>
          <TabsTrigger value="funnel" className="gap-1 text-caption sm:text-xs px-1">
            <TrendingUp className="h-3.5 w-3.5 shrink-0" />
            Funil de vendas
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: Antes da conversa (preparation) ─── */}
        <TabsContent value="preparation" className="space-y-4 mt-4">
          <ContextualSalesScript />
          <StorytellingCard />
        </TabsContent>

        {/* ─── TAB 2: Durante a conversa (conversation) ─── */}
        <TabsContent value="conversation" className="space-y-4 mt-4">
          {!isValidSimulation ? (
            <Card className="border-dashed border-2 border-muted-foreground/20">
              <CardContent className="py-10 flex flex-col items-center text-center gap-3">
                <Sparkles className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Faça uma simulação para receber objeções contextualizadas automaticamente.
                </p>
                <Button size="sm" onClick={() => navigateTo('simulator')} className="gap-1.5">
                  Ir para Simulador
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Respostas IA */}
              <div className="pb-2">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Respostas com IA
                  <span className="text-caption text-muted-foreground font-normal">Cole a resposta do cliente e receba sugestões</span>
                </h3>
                <Suspense fallback={<DelayedFallback minHeight="50vh"><ModuleSkeleton /></DelayedFallback>}>
                  <ProposalFollowUpTab proposalContext={followUpContext} />
                </Suspense>
              </div>

              {/* Contextual recommendations */}
              <div className="border-t border-border pt-4 space-y-4">
                <div id="objections-context-info" className="px-1">
                  <p className="text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Objeções mais prováveis para <strong>{typeLabel}</strong> de{' '}
                    <strong>{formatCurrency(creditValue)}</strong> em {termMonths} meses
                  </p>
                </div>

                <div className="space-y-3">
                  {recommendations.map(({ objection: obj, reason }, idx) => {
                    const cat = getCategoryInfo(obj.category);
                    const isCopied = copiedId === obj.id;
                    return (
                      <Card key={obj.id} id={idx === 0 ? 'objections-first-card' : undefined} className="border-l-4 border-l-primary/40 animate-fade-in">
                        <CardContent className="py-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1">
                              <Badge variant="secondary" className="shrink-0 text-caption mt-0.5">
                                {cat.emoji} {cat.label}
                              </Badge>
                              <p className="text-sm font-medium text-foreground italic leading-snug">
                                "{obj.clientPhrase}"
                              </p>
                            </div>
                          </div>

                          <div className="border-l-2 border-primary/20 pl-3">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {obj.response}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-caption text-muted-foreground/75 italic">{reason}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(obj)}
                              className="h-8 gap-1.5 text-xs"
                            >
                              {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              {isCopied ? 'Copiado' : 'Copiar'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Link para gatilhos de reforço */}
              <div className="flex justify-center py-2">
                <Button 
                  variant="link" 
                  onClick={() => setActiveTab('funnel')}
                  className="text-primary gap-1 text-sm font-medium"
                >
                  Ver gatilhos de reforço <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Full library (expandable) */}
          <div className="border-t border-border pt-6">
            <button
              onClick={() => setLibraryExpanded(!libraryExpanded)}
              className={cn(
                "flex items-center gap-4 w-full p-4 rounded-xl border border-border bg-secondary hover:bg-secondary/80 transition-all text-left group shadow-sm",
                libraryExpanded && "rounded-b-none border-b-0"
              )}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border/50 shadow-sm shrink-0">
                <BookOpen className="h-5 w-5 text-[#F5821F]" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">Biblioteca de objeções</h3>
                  <Badge className="bg-[#F5821F]/10 text-[#F5821F] border-[#F5821F]/20 hover:bg-[#F5821F]/20 text-xs px-1.5 py-0">
                    {OBJECTIONS.length}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {OBJECTIONS.length} respostas prontas para qualquer situação
                </p>
              </div>

              <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full border border-border/50 group-hover:border-border transition-colors">
                {libraryExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {libraryExpanded && (
              <div className="bg-secondary/30 border-x border-b border-border rounded-b-xl p-4 -mt-px space-y-4 animate-fade-in">
                {/* Search */}
                <div id="library-search" className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar objeção ou palavra-chave..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Profile filters */}
                <div className="space-y-1.5">
                  <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">Perfil do Cliente</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeProfile && (
                      <Button variant="ghost" size="sm" onClick={() => setActiveProfile(null)} className="h-7 px-2 text-xs gap-1">
                        <X className="h-3 w-3" /> Limpar
                      </Button>
                    )}
                    {CLIENT_PROFILES.map(prof => {
                      const isActive = activeProfile === prof.id;
                      const profileCount = OBJECTIONS.filter(o => o.clientProfile === prof.id).length;
                      return (
                        <button
                          key={prof.id}
                          onClick={() => setActiveProfile(isActive ? null : prof.id)}
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-caption font-semibold transition-colors border',
                            isActive
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                          )}
                        >
                          <span>{prof.emoji}</span>
                          <span className="hidden sm:inline">{prof.label}</span>
                          <span className="opacity-60">({profileCount})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category filters */}
                <div className="space-y-1.5">
                  <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">Categoria</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCategory && (
                      <Button variant="ghost" size="sm" onClick={() => setActiveCategory(null)} className="h-7 px-2 text-xs gap-1">
                        <X className="h-3 w-3" /> Limpar
                      </Button>
                    )}
                    {CATEGORIES.map(catInfo => {
                      const count = counts[catInfo.id] || 0;
                      const isActive = activeCategory === catInfo.id;
                      return (
                        <button
                          key={catInfo.id}
                          onClick={() => setActiveCategory(isActive ? null : catInfo.id)}
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-caption font-semibold transition-colors border',
                            isActive
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                          )}
                        >
                          <span>{catInfo.emoji}</span>
                          <span className="hidden sm:inline">{catInfo.label}</span>
                          <span className="opacity-60">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Results */}
                <p className="text-xs text-muted-foreground">
                  {filtered.length} objeções encontradas
                </p>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {filtered.map((obj, idx) => {
                    const cat = getCategoryInfo(obj.category);
                    const isCopied = copiedId === obj.id;
                    return (
                      <Card key={obj.id} id={idx === 0 ? 'library-first-card' : undefined} className="border-l-4 border-l-muted-foreground/20">
                        <CardContent className="py-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <Badge variant="secondary" className="shrink-0 text-caption mt-0.5">
                              {cat.emoji} {cat.label}
                            </Badge>
                            <p className="text-sm font-medium text-foreground italic flex-1">"{obj.clientPhrase}"</p>
                          </div>
                          <div className="border-l-2 border-primary/20 pl-3">
                            <p className="text-sm text-muted-foreground leading-relaxed">{obj.response}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            {obj.tags && (
                              <div className="flex gap-1 flex-wrap">
                                {obj.tags.slice(0, 3).map(t => (
                                  <span key={t} className="text-micro px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
                                ))}
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(obj)}
                              className="h-7 gap-1 text-xs shrink-0"
                            >
                              {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              {isCopied ? 'Copiado' : 'Copiar'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── TAB 3: Funil de vendas (funnel) ─── */}
        <TabsContent value="funnel" className="space-y-4 mt-4">
          <FunnelTab onNavigateToModule={navigateTo} />
          <div className="border-t border-border pt-4">
            <TriggersTab />
          </div>
        </TabsContent>
      </Tabs>

      <NextStepCTA
        targetModule="proposal"
        label="Gerar proposta"
        description="Com a abordagem preparada, gere a proposta comercial personalizada para o cliente"
      />
    </div>
  );
}

