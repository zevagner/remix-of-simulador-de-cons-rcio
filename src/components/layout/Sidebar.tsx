import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { usePostSaleActionCount } from '@/hooks/usePostSaleActionCount';
import { useCommunityUpdates } from '@/hooks/useCommunityUpdates';
import { useCommunityDiscovery } from '@/hooks/useCommunityDiscovery';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Sun, Moon, LogOut, Shield, User, PanelLeftClose, PanelLeft, ChevronRight } from 'lucide-react';
import { MODULE_GROUPS, isAnalysisTabId } from '@/config/modules';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  onClose?: () => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const COLLAPSED_KEY = 'sidebar-collapsed';

export function Sidebar({ activeModule, onModuleChange, onClose, collapsed, onCollapsedChange }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const postSaleActionCount = usePostSaleActionCount();
  const { count: communityUpdatesCount } = useCommunityUpdates();
  const { discovered: communityDiscovered } = useCommunityDiscovery();
  const showCommunityNewBadge = !communityDiscovered;

  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, String(collapsed)); } catch { /* noop */ }
  }, [collapsed]);

  const handleModuleChange = (moduleId: string) => {
    onModuleChange(moduleId);
    onClose?.();
  };

  const handleLogout = () => {
    logout();
    toast({ title: 'Sessão encerrada', description: 'Você saiu do simulador.' });
    navigate('/');
  };

  const SidebarTooltip = ({ children, label }: { children: React.ReactNode; label: string }) => {
    if (!collapsed) return <>{children}</>;
    return (
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        data-shell="v2"
        data-collapsed={collapsed ? 'true' : 'false'}
        className={cn(
        "fixed top-0 left-0 h-screen flex flex-col z-30 transition-[width] duration-200 print-hide",
        "bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] border-r border-[hsl(var(--sidebar-border))]",
        collapsed ? "w-16" : "w-64",
      )}>
        {/* Header */}
        <div className={cn(
          "relative flex items-center justify-center w-full border-b border-[hsl(var(--sidebar-border))] shrink-0 py-4",
          collapsed ? "px-2 h-14" : "px-3 h-14",
        )}>
          {!collapsed ? (
            <>
              <img
                src="/logo-consorcio.png"
                alt="Simulador de Consórcio"
                className="h-9 w-auto max-w-[160px] object-contain"
                draggable={false}
              />
              <button
                onClick={() => onCollapsedChange(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-white/60 hover:text-white hover:bg-[hsl(var(--sidebar-accent))] transition-colors"
                aria-label="Recolher menu"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => onCollapsedChange(false)}
              className="p-1 rounded-md hover:bg-[hsl(var(--sidebar-accent))] transition-colors"
              aria-label="Expandir menu"
            >
              <img src="/app-icon.png" alt="Simulador de Consórcio" className="h-9 w-9 object-contain" draggable={false} />
            </button>
          )}
        </div>

        {/* Modules */}
        <nav data-shell-nav className="flex-1 overflow-y-auto py-1.5 space-y-1.5 scrollbar-thin">
          {MODULE_GROUPS.map((group) => (
            <div key={group.label} data-shell-group>
              {!collapsed && (
                <p data-shell-group-label className="px-4 pt-1 text-micro font-semibold text-white/35 tracking-[0.18em] mb-0.5 uppercase">{group.label}</p>
              )}
              <div className="space-y-px px-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const hasChildren = !!item.children?.length;
                  const childActive = hasChildren && item.children!.some(c => c.id === activeModule);
                  // "analysis" pai é considerado ativo quando qualquer subitem (incluindo overview) está ativo,
                  // ou quando o próprio módulo `analysis` está aberto.
                  const isActive = activeModule === item.id || (item.id === 'analysis' && isAnalysisTabId(activeModule)) || childActive;
                  // Badge unificado: pós-venda (alertas), comunidade (novidades em casos seguidos).
                  // Suprime o badge de comunidade quando o usuário já está no módulo.
                  const badgeCount =
                    item.id === 'post-sale'
                      ? postSaleActionCount
                      : item.id === 'community' && activeModule !== 'community'
                        ? communityUpdatesCount
                        : 0;
                  // Quando tem filhos: clicar no item-pai SEMPRE entra no overview do módulo
                  // (entrada padronizada e previsível). O Index.tsx intercepta o ID do pai
                  // (ex: 'analysis') e força reset para o overview, ignorando o último submódulo.
                  const parentTargetId = hasChildren ? item.id : item.id;
                  // Análise abre expandido por padrão; demais grupos expandem só quando ativos.
                  const expanded = isActive || item.id === 'analysis';
                  return (
                    <div key={item.id}>
                      <SidebarTooltip label={badgeCount > 0 ? `${item.label} (${badgeCount})` : item.label}>
                        <button
                          id={`nav-${item.id}`}
                          data-shell-item
                          data-active={isActive ? 'true' : 'false'}
                          onClick={() => handleModuleChange(parentTargetId)}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-lg text-body font-medium transition-[colors,box-shadow,transform] duration-150 relative",
                            collapsed ? "justify-center p-2" : "px-3 py-1.5",
                            isActive
                              ? "text-white"
                              : "text-white/60 hover:text-white",
                          )}
                        >
                          <div className="relative shrink-0">
                            <Icon className="h-4 w-4" />
                            {collapsed && badgeCount > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-micro font-bold flex items-center justify-center leading-none">
                                {badgeCount > 99 ? '99+' : badgeCount}
                              </span>
                            )}
                            {collapsed && item.id === 'community' && showCommunityNewBadge && badgeCount === 0 && (
                              <span
                                aria-label="Novo módulo Comunidade"
                                className="absolute -top-1.5 -right-2 h-4 px-1 rounded-full bg-[#F5821F] text-white text-[9px] font-bold flex items-center justify-center leading-none"
                              >
                                Novo
                              </span>
                            )}
                          </div>
                          {!collapsed && (
                            <span className="truncate flex-1 text-left">{item.label}</span>
                          )}
                          {!collapsed && hasChildren && (
                            <ChevronRight
                              className={cn(
                                "h-3.5 w-3.5 shrink-0 text-white/40 transition-transform duration-200",
                                expanded && "rotate-90 text-white/70",
                              )}
                            />
                          )}
                          {!collapsed && !hasChildren && badgeCount > 0 && (
                            <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-caption font-bold flex items-center justify-center leading-none">
                              {badgeCount > 99 ? '99+' : badgeCount}
                            </span>
                          )}
                          {!collapsed && !hasChildren && item.id === 'community' && showCommunityNewBadge && badgeCount === 0 && (
                            <span
                              aria-label="Novo módulo Comunidade"
                              className="ml-auto h-5 px-2 rounded-full bg-[#F5821F] text-white text-[10px] font-bold flex items-center justify-center leading-none uppercase tracking-wide"
                            >
                              Novo
                            </span>
                          )}
                        </button>
                      </SidebarTooltip>

                      {/* Subitens (apenas quando expanded e sidebar não recolhida) */}
                      {hasChildren && expanded && !collapsed && (
                        <div className="mt-px ml-3 pl-3 border-l border-white/10 space-y-px">
                          {item.children!.map((child) => {
                            const ChildIcon = child.icon;
                            const childIsActive = activeModule === child.id;
                            return (
                              <button
                                key={child.id}
                                id={`nav-${child.id}`}
                                data-shell-subitem
                                data-active={childIsActive ? 'true' : 'false'}
                                onClick={() => handleModuleChange(child.id)}
                                className={cn(
                                  "w-full flex items-center gap-2 rounded-md text-caption font-medium transition-[colors,box-shadow,transform] duration-150 px-3 py-1",
                                  childIsActive
                                    ? "text-white"
                                    : "text-white/55 hover:text-white",
                                )}
                              >
                                <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{child.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={cn("border-t border-[hsl(var(--sidebar-border))] shrink-0 py-1.5 space-y-px", collapsed ? "px-2" : "px-3")}>
          {isAdmin && (
            <SidebarTooltip label="Admin">
              <button onClick={() => navigate('/admin')} className={cn(
                "w-full flex items-center gap-3 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-[hsl(var(--sidebar-accent))] transition-colors",
                collapsed ? "justify-center p-2" : "px-3 py-1.5",
              )}>
                <Shield className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Admin</span>}
              </button>
            </SidebarTooltip>
          )}
          <SidebarTooltip label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={cn(
              "w-full flex items-center gap-3 rounded-lg text-sm text-white/60 hover:text-white hover:bg-[hsl(var(--sidebar-accent))] transition-colors",
              collapsed ? "justify-center p-2" : "px-3 py-1.5",
            )}>
              {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
              {!collapsed && <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>}
            </button>
          </SidebarTooltip>

          {user && (
            <>
              <div className={cn(
                "flex items-center gap-2 text-xs text-white/40 py-1",
                collapsed ? "justify-center" : "px-3",
              )}>
                <User className="h-3 w-3 shrink-0" />
                {!collapsed && <span className="truncate">{user.email}</span>}
              </div>
              <SidebarTooltip label="Sair">
                <button onClick={handleLogout} className={cn(
                  "w-full flex items-center gap-3 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors",
                  collapsed ? "justify-center p-2" : "px-3 py-1.5",
                )}>
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Sair</span>}
                </button>
              </SidebarTooltip>
            </>
          )}
          {!collapsed && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-white/30 mb-1">
              <a 
                href="/privacidade" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Privacidade
              </a>
              <span className="select-none">·</span>
              <a 
                href="/termos" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Termos
              </a>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground/70 text-center px-2 pb-2 leading-tight">
            Criado por José Vagner P. Pinto · v2.11.0
          </p>
        </div>
      </aside>
    </TooltipProvider>
  );
}
