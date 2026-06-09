import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Shield } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { PRIMARY_TABS, MORE_TABS, ANALYSIS_SUBITEMS, ANALYSIS_TABS, isAnalysisTabId, type ModuleItem } from '@/config/modules';
import { useCommunityUpdates } from '@/hooks/useCommunityUpdates';
import { useCommunityDiscovery } from '@/hooks/useCommunityDiscovery';

// Ordem otimizada para o sheet mobile.
// Onda Cockpit Removal: OVERVIEW removido. Entrada do módulo "Análise" abre
// a tela própria (não um submódulo) via tap no item "Análise" do bottom-nav.
const MOBILE_ANALYSIS_ORDER: readonly string[] = [
  ANALYSIS_TABS.WEALTH,
  ANALYSIS_TABS.BIDS,
  ANALYSIS_TABS.COMPARATOR,
  ANALYSIS_TABS.ASSEMBLIES,
];
const ANALYSIS_SUBITEMS_MOBILE: ModuleItem[] = MOBILE_ANALYSIS_ORDER
  .map((id) => ANALYSIS_SUBITEMS.find((s) => s.id === id))
  .filter((s): s is ModuleItem => Boolean(s));

if (import.meta.env?.DEV) {
  const missing = MOBILE_ANALYSIS_ORDER.filter(
    (id) => !ANALYSIS_SUBITEMS.some((s) => s.id === id),
  );
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error('[BottomNav] IDs ausentes em ANALYSIS_SUBITEMS:', missing);
  }
}

interface BottomNavProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

export function BottomNav({ activeModule, onModuleChange }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const { isAdmin } = useAuth();
  const { count: communityUpdatesCount } = useCommunityUpdates();
  const { discovered: communityDiscovered } = useCommunityDiscovery();
  const communityBadge = activeModule !== 'community' ? communityUpdatesCount : 0;
  const showCommunityNewBadge = !communityDiscovered && activeModule !== 'community';
  const navigate = useNavigate();
  const isMoreActive = MORE_TABS.some(t => t.id === activeModule);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setKeyboardOpen(vv.height < window.innerHeight * 0.75);
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  if (keyboardOpen) return null;

  const handlePrimaryTap = (tabId: string) => {
    // Tap em "Análise" abre sheet com subitens — em vez de navegar direto.
    if (tabId === 'analysis') {
      setAnalysisOpen(true);
      return;
    }
    onModuleChange(tabId);
  };

  return (
    <>
      <nav
        data-shell-bottom="v2"
        aria-label="Navegação principal"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden print-hide bg-card border-t border-border safe-area-bottom"
      >
        <div className="flex items-stretch justify-around min-h-[56px]">
          {PRIMARY_TABS.map((tab) => {
            const Icon = tab.icon;
            // "Análise" fica ativa também quando qualquer subitem está aberto.
            const isActive =
              activeModule === tab.id ||
              (tab.id === 'analysis' && isAnalysisTabId(activeModule));
            const isAnalysis = tab.id === 'analysis';
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handlePrimaryTap(tab.id)}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                aria-haspopup={isAnalysis ? 'dialog' : undefined}
                aria-expanded={isAnalysis ? analysisOpen : undefined}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 gap-0.5 min-h-[44px] transition-[colors,box-shadow,transform] duration-100 motion-reduce:transition-none',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground'
                )}
              >
                <div className="relative">
                  <Icon aria-hidden="true" className={cn('h-5 w-5 motion-reduce:transform-none', isActive && 'scale-110')} />
                  {tab.id === 'community' && communityBadge > 0 && (
                    <span
                      aria-label={`${communityBadge} novidades na Comunidade`}
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-micro font-bold flex items-center justify-center leading-none"
                    >
                      {communityBadge > 99 ? '99+' : communityBadge}
                    </span>
                  )}
                  {tab.id === 'community' && communityBadge === 0 && showCommunityNewBadge && (
                    <span
                      aria-label="Novo módulo Comunidade"
                      className="absolute -top-1.5 -right-2 h-4 px-1 rounded-full bg-[#F5821F] text-white text-[9px] font-bold flex items-center justify-center leading-none"
                    >
                      Novo
                    </span>
                  )}
                </div>
                <span className="text-caption leading-tight">{tab.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="Mais módulos"
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            aria-current={isMoreActive ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center justify-center flex-1 gap-0.5 min-h-[44px] transition-[colors,box-shadow,transform] duration-100 motion-reduce:transition-none',
              isMoreActive
                ? 'text-primary font-semibold'
                : 'text-muted-foreground'
            )}
          >
            <MoreHorizontal aria-hidden="true" className="h-5 w-5" />
            <span className="text-caption leading-tight">Mais</span>
          </button>
        </div>
      </nav>

      {/* Sheet "Mais" */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
          <SheetTitle className="text-sm font-semibold mb-3 text-foreground">Módulos</SheetTitle>
          <div className="grid grid-cols-4 gap-3">
            {MORE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeModule === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onModuleChange(tab.id);
                    setMoreOpen(false);
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 transition-colors min-h-[64px]',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                    {tab.id === 'community' && communityBadge > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-micro font-bold flex items-center justify-center leading-none">
                        {communityBadge > 99 ? '99+' : communityBadge}
                      </span>
                    )}
                    {tab.id === 'community' && communityBadge === 0 && showCommunityNewBadge && (
                      <span className="absolute -top-1.5 -right-2 h-4 px-1 rounded-full bg-[#F5821F] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                        Novo
                      </span>
                    )}
                  </div>
                  <span className="text-caption text-center leading-tight">{tab.label}</span>
                </button>
              );
            })}
            {isAdmin && (
              <button
                onClick={() => {
                  setMoreOpen(false);
                  navigate('/admin');
                }}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 text-muted-foreground hover:bg-muted/50 min-h-[64px]"
              >
                <Shield className="h-5 w-5" />
                <span className="text-caption text-center leading-tight">Admin</span>
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet "Análise" — lista subitens em vez de comprimir abas */}
      <Sheet open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
          <SheetTitle className="text-sm font-semibold mb-3 text-foreground">Análise</SheetTitle>
          <div className="grid grid-cols-2 gap-3">
            {ANALYSIS_SUBITEMS_MOBILE.map((sub) => {
              const Icon = sub.icon;
              const isActive = activeModule === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    onModuleChange(sub.id);
                    setAnalysisOpen(false);
                  }}
                  className={cn(
                    'flex items-start gap-3 rounded-xl p-3 text-left transition-colors min-h-[64px]',
                    isActive
                      ? 'bg-primary/15 text-primary border-2 border-primary shadow-sm ring-1 ring-primary/20'
                      : 'text-foreground hover:bg-muted/50 border border-border',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{sub.label}</p>
                    {sub.hint && (
                      <p className="text-caption text-muted-foreground leading-tight mt-0.5 line-clamp-2">
                        {sub.hint}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
