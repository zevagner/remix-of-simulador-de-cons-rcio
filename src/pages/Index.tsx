import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { VersionModal } from '@/components/layout/VersionModal';
import { SwipeableModule } from '@/components/layout/SwipeableModule';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { isAnalysisTabId, ANALYSIS_TABS, DEFAULT_ANALYSIS_TAB, type AnalysisTabId } from '@/config/modules';

import { useAuth } from '@/hooks/useAuth';
import { FeedbackButton } from '@/components/feedback/FeedbackButton';
import { MockSeedFab } from '@/components/dev/MockSeedFab';
import { ModuleSkeleton } from '@/components/ui/ModuleSkeleton';
import { DelayedFallback } from '@/components/ui/DelayedFallback';

import { AppProviders } from '@/contexts/AppProviders';
import { useSimulatorContext } from '@/components/modules/simulator/SimulatorContext';
import { ResumeSimulationModal } from '@/components/layout/ResumeSimulationModal';
import { useFeedbackNotifications } from '@/hooks/useFeedbackNotifications';
import { useCommunityDiscoveryToast } from '@/hooks/useCommunityDiscoveryToast';
import { useCommunityDiscovery } from '@/hooks/useCommunityDiscovery';
import { CommunityDiscoveryBanner } from '@/components/community/CommunityDiscoveryBanner';
import { markAppShellReady } from '@/lib/observers/runtimeObservers';
import { toast } from 'sonner';
import { persistNavState, readLastNavState, readUrlNavTarget, resolveTarget, trackNavigation, writeUrlNavTarget, type NavSource } from '@/utils/navState';


// Lazy-loaded modules
const AnalysisModule = lazy(() => import('@/components/modules/AnalysisModule').then(m => ({ default: m.AnalysisModule })));
const ProposalModule = lazy(() => import('@/components/modules/ProposalModule').then(m => ({ default: m.ProposalModule })));
const HelpModule = lazy(() => import('@/components/modules/HelpModule').then(m => ({ default: m.HelpModule })));
const ProposalHistoryModule = lazy(() => import('@/components/modules/ProposalHistoryModule').then(m => ({ default: m.ProposalHistoryModule })));
const ObjectionsModule = lazy(() => import('@/components/modules/ObjectionsModule').then(m => ({ default: m.ObjectionsModule })));
const PostSaleModule = lazy(() => import('@/components/modules/PostSaleModule').then(m => ({ default: m.PostSaleModule })));
const CommunityModule = lazy(() => import('@/components/modules/CommunityModule').then(m => ({ default: m.CommunityModule })));
const ProposalPdfModule = lazy(() => import('@/components/modules/ProposalPdfModule').then(m => ({ default: m.ProposalPdfModule })));
const SimulatorModule = lazy(() => import('@/components/modules/SimulatorModule').then(m => ({ default: m.SimulatorModule })));
const DiagnosticModule = lazy(() => import('@/components/modules/DiagnosticModule').then(m => ({ default: m.DiagnosticModule })));

const FEEDBACK_TIP_KEY = 'app-feedback-tip-shown';
const COLLAPSED_KEY = 'sidebar-collapsed';

const Index = () => {
  const { user, loading } = useAuth();

  // Restauração de sessão no boot (prioridade: URL > localStorage > simulator).
  // Fase 3 analysis-decouple: `?m=<id>` na URL é fonte primária; deep-links
  // funcionam (ex.: `/app?m=wealth`) e o estado restaurado é sempre
  // consistente com a URL exibida.
  const initial = (() => {
    const urlTarget = readUrlNavTarget();
    if (urlTarget) {
      if (urlTarget === 'analysis') return { module: 'analysis', sub: DEFAULT_ANALYSIS_TAB };
      if (isAnalysisTabId(urlTarget)) return { module: urlTarget, sub: urlTarget as AnalysisTabId };
      return { module: urlTarget, sub: DEFAULT_ANALYSIS_TAB };
    }
    const last = readLastNavState();
    if (!last) return { module: 'simulator', sub: DEFAULT_ANALYSIS_TAB };
    if (last.module === 'analysis' && last.submodule) return { module: last.submodule, sub: last.submodule };
    if (isAnalysisTabId(last.module)) return { module: last.module, sub: last.module };
    return { module: last.module, sub: (last.submodule ?? DEFAULT_ANALYSIS_TAB) as AnalysisTabId };
  })();

  const [activeModule, setActiveModuleRaw] = useState<string>(initial.module);
  const [analysisTab, setAnalysisTab] = useState<AnalysisTabId>(initial.sub);
  const isMobile = useIsMobile();

  // Refs para tracking sem causar re-render do callback estável
  const activeModuleRef = useRef(activeModule);
  const analysisTabRef = useRef(analysisTab);
  useEffect(() => { activeModuleRef.current = activeModule; }, [activeModule]);
  useEffect(() => { analysisTabRef.current = analysisTab; }, [analysisTab]);
  // Wave 3 — login → app shell ready timing (executa uma única vez no mount).
  useEffect(() => { markAppShellReady(); }, []);

  /**
   * Navegação livre, com:
   * - Validação leve (IDs desconhecidos caem em fallback seguro, sem bloquear o usuário)
   * - Persistência de último módulo + sub-aba
   * - Telemetria `navigation_changed` com source
   *
   * Mantém compatibilidade com `setActiveModule(id)` chamado por NextStepCTA / hooks legados.
   */
  const setActiveModule = useCallback((moduleId: string, source: NavSource = 'cta') => {
    const fromModule = activeModuleRef.current;
    const fromSub = analysisTabRef.current;
    const inAnalysisFamily = fromModule === 'analysis' || isAnalysisTabId(fromModule);

    // Caso especial: clique no item-pai "Análise".
    // Fase 1 (analysis decouple): se já estamos em qualquer submódulo da
    // família Análise (Wealth/Compare/Investment/etc.), o clique é NO-OP —
    // não sequestra para o Cockpit. Só abre Cockpit quando vindo de fora.
    if (moduleId === 'analysis') {
      if (inAnalysisFamily) return; // preserva submódulo atual
      setAnalysisTab(DEFAULT_ANALYSIS_TAB);
      setActiveModuleRaw('analysis');
      persistNavState('analysis', DEFAULT_ANALYSIS_TAB);
      writeUrlNavTarget(DEFAULT_ANALYSIS_TAB);
      trackNavigation({ fromModule, toModule: 'analysis', fromSub, toSub: DEFAULT_ANALYSIS_TAB, source });
      return;
    }

    const { module, submodule } = resolveTarget(moduleId);

    // IDs inválidos: resolveTarget retorna module=null. Fase 1: não navegar
    // (não mascarar como Cockpit). Telemetria já é emitida pelo resolveTarget.
    if (module === null) return;

    if (isAnalysisTabId(module)) {
      setAnalysisTab(submodule ?? (module as AnalysisTabId));
      setActiveModuleRaw(module);
      persistNavState('analysis', module);
      writeUrlNavTarget(module);
      trackNavigation({ fromModule, toModule: module, fromSub, toSub: module, source });
      return;
    }

    setActiveModuleRaw(module);
    persistNavState(module, null);
    writeUrlNavTarget(module);
    trackNavigation({ fromModule, toModule: module, fromSub, toSub: null, source });
  }, []);

  // Sincroniza URL no boot (caso entrada tenha vindo de localStorage sem `?m=`)
  // e escuta `popstate` para refletir back/forward do navegador.
  useEffect(() => {
    writeUrlNavTarget(activeModuleRef.current);
    const onPop = () => {
      const target = readUrlNavTarget();
      if (target && target !== activeModuleRef.current) {
        setActiveModule(target, 'deep-link');
      }
    };
    window.addEventListener('popstate', onPop);
    // Canal leve para navegação imperativa entre módulos a partir de qualquer
    // componente (sem prop drilling). Use `window.dispatchEvent(new CustomEvent(
    // 'nav:goto', { detail: { module: 'community', source?: 'cta' } }))`.
    const onGoto = (e: Event) => {
      const detail = (e as CustomEvent<{ module?: string; source?: NavSource }>).detail;
      const target = detail?.module;
      if (target && target !== activeModuleRef.current) {
        setActiveModule(target, detail?.source ?? 'cta');
      }
    };
    window.addEventListener('nav:goto', onGoto as EventListener);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('nav:goto', onGoto as EventListener);
    };
  }, [setActiveModule]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === 'true'; } catch { return false; }
  });

  // Notify user about resolved feedbacks (sonner toasts, runs once per session)
  useFeedbackNotifications();
  // Onboarding one-shot toast anunciando a Comunidade aberta para todos.
  useCommunityDiscoveryToast();
  // Marca Comunidade como descoberta na primeira visita real ao módulo.
  const { discovered: communityDiscovered, markDiscovered: markCommunityDiscovered } = useCommunityDiscovery();
  useEffect(() => {
    if (activeModule === 'community' && !communityDiscovered) {
      markCommunityDiscovered();
    }
  }, [activeModule, communityDiscovered, markCommunityDiscovered]);

  useEffect(() => {
    if (!user || loading) return;
    const alreadyShown = localStorage.getItem(FEEDBACK_TIP_KEY);
    if (alreadyShown) return;
    const timer = setTimeout(() => {
      toast.info('💡 Dica: use o botão no canto inferior direito da tela para reportar erros ou enviar sugestões. Sua opinião nos ajuda a melhorar!', {
        duration: 5000,
        closeButton: true,
        // Eleva o toast acima da bottom nav em mobile (~64px) sem afetar desktop
        style: { marginBottom: 'env(safe-area-inset-bottom, 0px)' },
        className: 'mb-20 sm:mb-0',
      });
      localStorage.setItem(FEEDBACK_TIP_KEY, 'true');
    }, 3000);
    return () => clearTimeout(timer);
  }, [user, loading]);


  return (
    <div className="flex flex-col min-h-screen bg-background animate-fade-in" data-shell-workspace="v2">
      {/* a11y: skip link — fica oculto até receber foco via Tab */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:shadow-lg focus:outline-none"
      >
        Pular para o conteúdo
      </a>
      {/* Banner técnico removido — não relevante para o usuário final */}
      <div className="flex flex-1 min-h-0" data-shell-stage="v2">
        <VersionModal />
        {!isMobile && (
          <Sidebar
            activeModule={activeModule}
            onModuleChange={(id) => setActiveModule(id, 'sidebar')}
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
        )}
        <AppProviders onModuleChange={(id) => setActiveModule(id, 'cta')}>
          <IndexContent
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            analysisTab={analysisTab}
            setAnalysisTab={setAnalysisTab}
            isMobile={isMobile}
            sidebarCollapsed={sidebarCollapsed}
          />
        </AppProviders>
        <FeedbackButton currentModule={activeModule} />
        {import.meta.env.DEV && <MockSeedFab />}
        {isMobile && (
          <BottomNav activeModule={activeModule} onModuleChange={(id) => setActiveModule(id, 'bottom-nav')} />
        )}
      </div>
    </div>
  );
};

function IndexContent({
  activeModule,
  setActiveModule,
  analysisTab,
  setAnalysisTab,
  isMobile,
  sidebarCollapsed,
}: {
  activeModule: string;
  setActiveModule: (m: string) => void;
  analysisTab: AnalysisTabId;
  setAnalysisTab: (t: AnalysisTabId) => void;
  isMobile: boolean;
  sidebarCollapsed: boolean;
}) {
  const { pendingRestore, restoreSession, dismissRestore } = useSimulatorContext();

  const handleRestore = useCallback(() => {
    restoreSession();
    setActiveModule('simulator');
  }, [restoreSession, setActiveModule]);

  const handleNewSimulation = useCallback(() => {
    dismissRestore();
    setActiveModule('simulator');
  }, [dismissRestore, setActiveModule]);

  const renderModule = () => {
    // Qualquer ID da família "Análise" (overview ou subitens) renderiza o container.
    if (activeModule === 'analysis' || isAnalysisTabId(activeModule)) {
      return (
        <AnalysisModule
          activeTab={analysisTab}
          onTabChange={(t) => {
            setAnalysisTab(t);
            setActiveModule(t); // sincroniza activeModule para sidebar destacar o subitem
          }}
          onNavigateToModule={setActiveModule}
        />
      );
    }
    switch (activeModule) {
      case 'diagnostic':
        return <DiagnosticModule />;
      case 'simulator':
        return <SimulatorModule />;
      case 'proposal':
        return <ProposalModule />;
      case 'proposal-pdf':
        return <ProposalPdfModule />;
      case 'help':
        return <HelpModule />;
      case 'proposals':
        return <ProposalHistoryModule />;
      case 'objections':
        return <ObjectionsModule />;
      case 'post-sale':
        return <PostSaleModule />;
      case 'community':
        return <CommunityModule />;
      default:
        return null;
    }
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      data-shell-main="v2"
      className={cn(
      "flex-1 min-w-0 pt-0 overflow-y-auto transition-[padding-left] duration-200",
      "[&]:[-webkit-overflow-scrolling:touch]",
      // Mobile: 128px (bottom-nav ~64px + FAB ~40px + folga) + safe-area iOS para notch/home indicator.
      // Desktop mantém pb-8.
      !isMobile && "pb-8",
      !isMobile && (sidebarCollapsed ? "pl-16" : "pl-64"),
    )}
    style={isMobile ? { paddingBottom: 'calc(128px + env(safe-area-inset-bottom, 0px))' } : undefined}
    >
      <ResumeSimulationModal
        open={!!pendingRestore}
        summary={pendingRestore ? {
          consortiumType: pendingRestore.input.consortiumType,
          creditValue: pendingRestore.input.creditValue,
          termMonths: pendingRestore.input.termMonths,
          savedAt: pendingRestore.savedAt,
        } : null}
        onResume={handleRestore}
        onNewSimulation={handleNewSimulation}
      />

      {/* Orientação (Próximo passo + Passo X/Y + AI) renderizada DENTRO do ModuleHeader
          de cada módulo, garantindo hierarquia: Header → Orientação → Conteúdo. */}
      <div className="px-4 md:px-8 pt-3" data-module-canvas="v1">
        <CommunityDiscoveryBanner
          activeModule={activeModule}
          onOpenCommunity={() => setActiveModule('community')}
        />
        <Suspense fallback={<DelayedFallback minHeight="60vh"><ModuleSkeleton /></DelayedFallback>}>
          {/*
           * Anti-freeze (analysis-cockpit-navigation-freeze-fix):
           * Toda a família "Análise" (overview + 4 subitens) compartilha a mesma
           * `swipeKey = 'analysis'`. Assim, trocar de sub-aba dentro da Análise
           * NÃO remonta a AnalysisModule — ela já preserva estado interno via
           * `hidden`. Sem isso, cada clique em sub-item disparava
           * unmount/exit-anim (mode="wait" → 200ms bloqueante) + lazy+Suspense
           * + re-fire de AIInsightsPanel autoRun + re-arm do timer de 2s do
           * AnalysisCopilot proativo, gerando a "trava temporária" reportada.
           */}
          <SwipeableModule
            activeModule={isAnalysisTabId(activeModule) || activeModule === 'analysis' ? 'analysis' : activeModule}
            onModuleChange={setActiveModule}
          >
            {renderModule()}
          </SwipeableModule>
        </Suspense>
      </div>
    </main>
  );
}

export default Index;
