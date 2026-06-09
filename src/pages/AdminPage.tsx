import { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, Users, LogOut, ArrowLeft, Menu, MessageSquare, TrendingUp, Bot, FileSearch, BookOpen, Gauge, Database, Grid3x3, Brain, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('@/components/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminFeedbacks = lazy(() => import('@/components/admin/AdminFeedbacks').then(m => ({ default: m.AdminFeedbacks })));
const AdminAnalytics = lazy(() => import('@/components/admin/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })));
const AdminAICenter = lazy(() => import('@/components/admin/AdminAICenter').then(m => ({ default: m.AdminAICenter })));
const AdminAuditCenter = lazy(() => import('@/components/admin/AdminAuditCenter').then(m => ({ default: m.AdminAuditCenter })));
const AdminGovernance = lazy(() => import('@/components/admin/governance/AdminGovernance').then(m => ({ default: m.AdminGovernance })));
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAdminUsers, useNewFeedbacksCount } from '@/hooks/useAdminQueries';
import { useUnreviewedAlertsCount } from '@/components/admin/SecurityAlertsPanel';

const SecurityAlertsPanel = lazy(
  () => import('@/components/admin/SecurityAlertsPanel'),
);

// Lazy — chunk isolado, zero overhead até abrir a aba.
const AdminPerformanceIntelligence = lazy(
  () => import('@/components/admin/AdminPerformanceIntelligence'),
);
const AdminAssembliesIngestion = lazy(
  () => import('@/components/admin/AdminAssembliesIngestion'),
);
const AdminKpiMatrix = lazy(
  () => import('@/components/admin/AdminKpiMatrix'),
);
const AdminIntelligence = lazy(
  () => import('@/components/admin/AdminIntelligence'),
);


// Menu consolidado (Onda Executiva): 11 → 7 áreas + Operações de Assembleias.
const adminModules = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'feedbacks', label: 'Feedbacks', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'intelligence', label: 'Inteligência', icon: Brain },
  { id: 'ai', label: 'Performance IA', icon: Bot },
  { id: 'performance', label: 'Performance Intel', icon: Gauge },
  { id: 'assemblies-ops', label: 'Assembleias (Ops)', icon: Database },
  { id: 'audit', label: 'Auditoria', icon: FileSearch },
  { id: 'security', label: 'Segurança', icon: ShieldAlert },
  { id: 'kpi-matrix', label: 'Matriz KPIs', icon: Grid3x3 },
  { id: 'governance', label: 'Governança', icon: BookOpen },
];

function SidebarContent({ activeTab, onTabChange, onLogout, onBack, badgeCounts }: {
  activeTab: string;
  onTabChange: (id: string) => void;
  onLogout: () => void;
  onBack: () => void;
  badgeCounts?: Record<string, number>;
}) {
  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="px-4 pt-4 pb-4 border-b border-white/10 flex justify-center">
        <img src="/app-icon.png" alt="Admin" className="h-16 w-auto object-contain rounded-xl" />
      </div>
      <p className="text-center text-xs text-white/50 py-2 border-b border-white/10">Painel Administrativo</p>

      <nav className="flex-1 p-4 space-y-1">
        {adminModules.map(m => {
          const Icon = m.icon;
          const count = badgeCounts?.[m.id] ?? 0;
          return (
            <button
              key={m.id}
              onClick={() => onTabChange(m.id)}
              className={cn(
                'nav-item w-full',
                activeTab === m.id && 'nav-item-active'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium flex-1 text-left">{m.label}</span>
              {count > 0 && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-caption font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] shadow-[0_0_8px_hsl(var(--destructive)/0.6)]">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/20 space-y-1">
        <button onClick={onBack} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-white/60 hover:text-white hover:bg-card/10 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Simulador
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-white/60 hover:text-white hover:bg-card/10 transition-colors text-sm">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, logout, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const [lastSeenAt] = useLocalStorage<string>('admin_last_seen_users', '');

  // Use React Query for badge data — shared cache with child components
  const { data: users = [] } = useAdminUsers({ enabled: isAdmin && !loading });
  const { data: newFeedbacksCount = 0 } = useNewFeedbacksCount({ enabled: isAdmin && !loading });
  const { data: unreviewedAlerts = 0 } = useUnreviewedAlertsCount({ enabled: isAdmin && !loading });

  const newUsersCount = useMemo(() => {
    if (!lastSeenAt) return users.length;
    return users.filter(u => u.created_at > lastSeenAt).length;
  }, [users, lastSeenAt]);

  const badgeCounts = useMemo(() => ({
    dashboard: newUsersCount,
    users: newUsersCount,
    feedbacks: newFeedbacksCount,
    security: unreviewedAlerts,
  }), [newUsersCount, newFeedbacksCount, unreviewedAlerts]);

  const handleLogout = () => {
    logout();
    toast({ title: 'Sessão encerrada.' });
    navigate('/');
  };

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  // Permite que módulos internos (ex.: AdminIntelligence) naveguem entre abas via CustomEvent.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ tab?: string }>).detail;
      const tab = detail?.tab;
      if (tab && adminModules.some(m => m.id === tab)) {
        setActiveTab(tab);
        setSidebarOpen(false);
      }
    };
    window.addEventListener('admin:navigate', handler as EventListener);
    return () => window.removeEventListener('admin:navigate', handler as EventListener);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {!isMobile && (
        <aside className="w-64 h-screen sticky top-0 flex flex-col border-r border-sidebar-border">
          <SidebarContent activeTab={activeTab} onTabChange={handleTabChange} onLogout={handleLogout} onBack={() => navigate('/app')} badgeCounts={badgeCounts} />
        </aside>
      )}

      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
            <SheetTitle className="sr-only">Menu Admin</SheetTitle>
            <SidebarContent activeTab={activeTab} onTabChange={handleTabChange} onLogout={handleLogout} onBack={() => navigate('/app')} badgeCounts={badgeCounts} />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {isMobile && (
          <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-background border-b border-border">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-md hover:bg-muted transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-semibold truncate">
              {adminModules.find(m => m.id === activeTab)?.label ?? 'Admin'}
            </h1>
          </header>
        )}

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto animate-fade-in" key={activeTab}>
            <Suspense fallback={<div className="flex items-center justify-center py-10 text-sm text-muted-foreground animate-pulse">Carregando módulo...</div>}>
              {activeTab === 'dashboard' && <AdminDashboard />}
              {activeTab === 'users' && <AdminUsers />}
              {activeTab === 'feedbacks' && <AdminFeedbacks />}
              {activeTab === 'analytics' && <AdminAnalytics />}
              {activeTab === 'intelligence' && <AdminIntelligence />}
              {activeTab === 'ai' && <AdminAICenter />}
              {activeTab === 'performance' && <AdminPerformanceIntelligence />}
              {activeTab === 'assemblies-ops' && <AdminAssembliesIngestion />}
              {activeTab === 'audit' && <AdminAuditCenter />}
              {activeTab === 'security' && <SecurityAlertsPanel />}
              {activeTab === 'kpi-matrix' && <AdminKpiMatrix />}
              {activeTab === 'governance' && <AdminGovernance />}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
