import { useState, useMemo, useEffect } from 'react';
import { type UserRole } from '@/services/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { UserPlus, Ban, CheckCircle2, Trash2, UserCheck, SearchX, Info } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { CreateUserDialog } from './CreateUserDialog';
import { AdminPageHeader } from './AdminPageHeader';
import { UserProfileDrawer } from './UserProfileDrawer';
import {
  useAdminUsers, useAdminUsersPage, usePendingUsers,
  useUpdateUser, useToggleApproval, useDeleteUser,
  useUserEngagementMetrics, type UserEngagementMetrics,
} from '@/hooks/useAdminQueries';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type {
  UserProfile, AdminUsersPageParams, AdminUsersSortKey, AdminUsersSortDir,
} from '@/services/users';

// Extracted sub-components
import { getEngagementLevel } from './users/EngagementBadge';
import { getUserRecommendation } from './users/RecommendationBadge';
import { UserFilters, type SortOption, type FilterOption } from './users/UserFilters';
import { ExecutiveSummaryCard } from './users/ExecutiveSummaryCard';
import { UserCardMobile } from './users/UserCardMobile';
import { UserTableDesktop } from './users/UserTableDesktop';
import { UserPagination, type PageSize } from './users/UserPagination';
import { emailTieBreaker } from './users/userSortHelpers';

const EMPTY_METRICS: UserEngagementMetrics = { sessions: 0, proposals: 0, simulations: 0, argumentsCopied: 0, engagement: 0, lastActivityAt: null, recencyBonus: 0 };

// ─── Mode detection ──────────────────────────────────────────
// Sort/filter combinations that depend on engagement metrics require the
// "heavy" mode (load everything). Everything else can be paginated server-side.
const HEAVY_SORTS: SortOption[] = ['priority-desc', 'usage-desc', 'usage-asc', 'engagement-desc', 'proposals-desc'];
const HEAVY_FILTERS: FilterOption[] = ['high-usage', 'no-proposals', 'engaged', 'hot', 'warm', 'cold'];

function isHeavyMode(sort: SortOption, filter: FilterOption): boolean {
  return HEAVY_SORTS.includes(sort) || HEAVY_FILTERS.includes(filter);
}

function mapSortToServer(sort: SortOption): { key: AdminUsersSortKey; dir: AdminUsersSortDir } {
  switch (sort) {
    case 'name-asc':  return { key: 'name',  dir: 'asc' };
    case 'name-desc': return { key: 'name',  dir: 'desc' };
    case 'email-asc': return { key: 'email', dir: 'asc' };
    case 'email-desc':return { key: 'email', dir: 'desc' };
    case 'date-asc':  return { key: 'date',  dir: 'asc' };
    case 'date-desc': return { key: 'date',  dir: 'desc' };
    default:          return { key: 'date',  dir: 'desc' };
  }
}

function mapFilterToServer(filter: FilterOption): Pick<AdminUsersPageParams, 'approvedFilter' | 'emailDomain' | 'newOnly'> {
  switch (filter) {
    case 'active':         return { approvedFilter: 'active', emailDomain: null, newOnly: false };
    case 'new':            return { approvedFilter: 'active', emailDomain: null, newOnly: true };
    case 'email-caixa':    return { approvedFilter: 'active', emailDomain: 'caixa', newOnly: false };
    case 'email-external': return { approvedFilter: 'active', emailDomain: 'external', newOnly: false };
    case 'email-missing':  return { approvedFilter: 'active', emailDomain: 'missing', newOnly: false };
    case 'all':
    default:               return { approvedFilter: 'active', emailDomain: null, newOnly: false };
  }
}

export function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('priority-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<PageSize>(20);

  const heavy = isHeavyMode(sortBy, filterBy);

  // ─── Data sources ──────────────────────────────────────────
  // Heavy mode: load everything (current behavior).
  const { data: allUsers = [], isLoading: heavyLoading } = useAdminUsers({ enabled: heavy });

  // Light mode: server-side pagination.
  const serverSort = mapSortToServer(sortBy);
  const serverFilter = mapFilterToServer(filterBy);
  const pageSize = limit === 'all' ? 1000 : limit;
  const pageParams: AdminUsersPageParams = {
    search: searchQuery || null,
    roleFilter: null,
    approvedFilter: serverFilter.approvedFilter,
    emailDomain: serverFilter.emailDomain,
    newOnly: serverFilter.newOnly,
    sortKey: serverSort.key,
    sortDir: serverSort.dir,
    limit: limit === 'all' ? 5000 : pageSize,
    offset: limit === 'all' ? 0 : (page - 1) * pageSize,
  };
  const { data: paged, isLoading: lightLoading, isFetching: lightFetching } = useAdminUsersPage(pageParams, { enabled: !heavy });

  // Pending users (small set) — always lightweight.
  const { data: pendingUsers = [] } = usePendingUsers();

  // Engagement metrics — only really needed in heavy mode, but also used
  // in the executive summary and to decorate rows in light mode.
  const { data: engagementMap = {} } = useUserEngagementMetrics();

  const updateUserMutation = useUpdateUser();
  const toggleApprovalMutation = useToggleApproval();
  const deleteUserMutation = useDeleteUser();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerUser, setDrawerUser] = useState<UserProfile | null>(null);

  // Reset page when filters/search/sort/limit/mode change
  useEffect(() => { setPage(1); }, [searchQuery, sortBy, filterBy, limit, heavy]);

  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [editForm, setEditForm] = useState({ nome: '', role: 'user' as UserRole });

  const getMetrics = (uid: string): UserEngagementMetrics => engagementMap[uid] ?? EMPTY_METRICS;

  const startEdit = (u: UserProfile) => {
    setEditingId(u.user_id);
    setEditForm({ nome: u.nome, role: u.role });
  };

  const saveEdit = (userId: string) => {
    if (!user) return;
    updateUserMutation.mutate({ userId, nome: editForm.nome, role: editForm.role, adminId: user.userId }, {
      onSuccess: () => { setEditingId(null); toast({ title: 'Usuário atualizado' }); },
    });
  };

  const toggleApproval = (u: UserProfile) => {
    if (!user) return;
    const newStatus = !u.approved;
    toggleApprovalMutation.mutate({ userId: u.user_id, approve: newStatus, adminId: user.userId }, {
      onSuccess: () => toast({ title: newStatus ? `${u.nome} foi ativado` : `${u.nome} foi desativado` }),
      onError: () => toast({ title: 'Erro ao atualizar status', variant: 'destructive' }),
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget || !user) return;
    if (deleteTarget.user_id === user.userId) {
      toast({ title: 'Você não pode excluir seu próprio usuário', variant: 'destructive' });
      setDeleteTarget(null);
      return;
    }
    if (heavy) {
      const admins = allUsers.filter(u => u.role === 'admin');
      if (deleteTarget.role === 'admin' && admins.length <= 1) {
        toast({ title: 'Não é possível excluir o último administrador', variant: 'destructive' });
        setDeleteTarget(null);
        return;
      }
    }
    deleteUserMutation.mutate({ userId: deleteTarget.user_id, adminId: user.userId, nome: deleteTarget.nome }, {
      onSuccess: () => { toast({ title: `${deleteTarget.nome} foi excluído` }); setDeleteTarget(null); },
      onError: () => { toast({ title: 'Erro ao excluir usuário', variant: 'destructive' }); setDeleteTarget(null); },
    });
  };

  // ─── Heavy-mode pipeline (current behavior) ──────────────────
  const processedHeavyUsers = useMemo(() => {
    if (!heavy) return [] as UserProfile[];
    let result = [...allUsers];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => u.nome.toLowerCase().includes(q) || (u.email?.toLowerCase().includes(q)));
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    switch (filterBy) {
      case 'active': result = result.filter(u => u.approved); break;
      case 'new': result = result.filter(u => new Date(u.created_at) >= thirtyDaysAgo); break;
      case 'high-usage': result = result.filter(u => getMetrics(u.user_id).sessions >= 10); break;
      case 'no-proposals': result = result.filter(u => getMetrics(u.user_id).proposals === 0); break;
      case 'engaged': result = result.filter(u => getMetrics(u.user_id).engagement >= 60); break;
      case 'hot': result = result.filter(u => getEngagementLevel(getMetrics(u.user_id).engagement) === 'hot'); break;
      case 'warm': result = result.filter(u => getEngagementLevel(getMetrics(u.user_id).engagement) === 'warm'); break;
      case 'cold': result = result.filter(u => getEngagementLevel(getMetrics(u.user_id).engagement) === 'cold'); break;
      case 'email-caixa': result = result.filter(u => u.email?.toLowerCase().endsWith('@caixa.gov.br')); break;
      case 'email-external': result = result.filter(u => u.email && !u.email.toLowerCase().endsWith('@caixa.gov.br')); break;
      case 'email-missing': result = result.filter(u => !u.email); break;
    }

    result.sort((a, b) => {
      const ma = getMetrics(a.user_id);
      const mb = getMetrics(b.user_id);
      const thirtyDaysAgoForSort = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
      switch (sortBy) {
        case 'priority-desc': {
          const recA = getUserRecommendation(ma, new Date(a.created_at) >= thirtyDaysAgoForSort, a.nome);
          const recB = getUserRecommendation(mb, new Date(b.created_at) >= thirtyDaysAgoForSort, b.nome);
          return (recB?.priority ?? 0) - (recA?.priority ?? 0);
        }
        case 'name-asc': return a.nome.localeCompare(b.nome, 'pt-BR');
        case 'name-desc': return b.nome.localeCompare(a.nome, 'pt-BR');
        case 'email-asc': {
          const cmp = (a.email ?? '').localeCompare(b.email ?? '', 'pt-BR');
          return cmp !== 0 ? cmp : emailTieBreaker(a, b);
        }
        case 'email-desc': {
          const cmp = (b.email ?? '').localeCompare(a.email ?? '', 'pt-BR');
          return cmp !== 0 ? cmp : emailTieBreaker(a, b);
        }
        case 'date-desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'usage-desc': return mb.sessions - ma.sessions;
        case 'usage-asc': return ma.sessions - mb.sessions;
        case 'engagement-desc': return mb.engagement - ma.engagement;
        case 'proposals-desc': return mb.proposals - ma.proposals;
        default: return 0;
      }
    });

    return result;
  }, [heavy, allUsers, searchQuery, sortBy, filterBy, engagementMap]);

  const isLoading = heavy ? heavyLoading : lightLoading;
  if (isLoading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Carregando usuários...</p>;
  }

  // ─── Resolve display data depending on mode ────────────────
  let activeUsers: UserProfile[];
  let totalActive: number;
  let pagedActiveUsers: UserProfile[];
  let totalPages: number;
  

  if (heavy) {
    activeUsers = processedHeavyUsers.filter(u => u.approved);
    totalActive = activeUsers.length;
    const ps = limit === 'all' ? Math.max(totalActive, 1) : limit;
    totalPages = limit === 'all' ? 1 : Math.max(1, Math.ceil(totalActive / ps));
    const safePage = Math.min(Math.max(1, page), totalPages);
    pagedActiveUsers = limit === 'all' ? activeUsers : activeUsers.slice((safePage - 1) * ps, safePage * ps);
  } else {
    activeUsers = paged?.rows ?? [];
    totalActive = paged?.total ?? 0;
    const ps = limit === 'all' ? Math.max(totalActive, 1) : limit;
    totalPages = limit === 'all' ? 1 : Math.max(1, Math.ceil(totalActive / ps));
    pagedActiveUsers = activeUsers; // already paginated by the server
  }

  const safePage = Math.min(Math.max(1, page), totalPages);

  // Executive summary uses the engagement map across known users
  const referenceUsers = heavy ? allUsers : [...activeUsers, ...pendingUsers];
  const totalUsersForSummary = heavy ? allUsers.length : (totalActive + pendingUsers.length);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const hotCount = referenceUsers.filter(u => u.approved && getEngagementLevel(getMetrics(u.user_id).engagement) === 'hot').length;
  const noProposalCount = referenceUsers.filter(u => u.approved && getMetrics(u.user_id).sessions >= 3 && getMetrics(u.user_id).proposals === 0).length;
  const newIdleCount = referenceUsers.filter(u => u.approved && new Date(u.created_at) >= thirtyDaysAgo && getMetrics(u.user_id).sessions < 3).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gestão de Usuários"
        subtitle="Gerencie gerentes, permissões e engajamento"
      />
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <UserPlus className="h-4 w-4 mr-1" /> Novo Usuário
        </Button>
      </div>

      <ExecutiveSummaryCard
        totalUsers={totalUsersForSummary}
        hotCount={hotCount}
        noProposalCount={noProposalCount}
        newIdleCount={newIdleCount}
        onFilterChange={setFilterBy}
      />

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => {}} />

      <UserFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filterBy={filterBy}
        onFilterChange={setFilterBy}
        resultCount={totalActive + pendingUsers.length}
      />

      {heavy && (
        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Modo análise completo: ordenação ou filtro depende de métricas de engajamento, então a base inteira é carregada para cálculo. Para listagem leve e paginada no servidor, escolha ordenação por nome, email ou data.
          </span>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Blocked users section */}
      {pendingUsers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-destructive flex items-center gap-2">
            <Ban className="h-5 w-5" />
            Usuários Pendentes ({pendingUsers.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {pendingUsers.map(u => (
              <Card key={u.user_id} className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{u.nome}</p>
                        {u.email?.toLowerCase().endsWith('@caixa.gov.br') ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-100 font-bold border border-blue-800/50">CAIXA</span>
                        ) : u.email?.toLowerCase().endsWith('@caixaconsorcio.com.br') ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-600/40 text-orange-100 font-bold border border-orange-500/50">CONSÓRCIO</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                      <p className="text-[10px] text-muted-foreground/60">{new Date(u.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive shrink-0">Inativo</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => toggleApproval(u)} className="flex-1 bg-success hover:bg-success/90 text-success-foreground" disabled={toggleApprovalMutation.isPending}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Ativar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(u)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Active users section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-success" />
          Usuários Ativos ({totalActive})
          {!heavy && lightFetching && (
            <span className="text-xs font-normal text-muted-foreground">atualizando…</span>
          )}
        </h2>

        {totalActive === 0 ? (
          <Card>
            <CardContent className="py-10 flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <SearchX className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {searchQuery
                    ? <>Nenhum usuário encontrado para <strong>"{searchQuery}"</strong></>
                    : filterBy !== 'all'
                      ? 'Nenhum usuário corresponde aos filtros selecionados'
                      : 'Nenhum usuário ativo no momento'}
                </p>
                {(searchQuery || filterBy !== 'all') && (
                  <p className="text-xs text-muted-foreground">
                    Verifique se o email está correto ou ajuste os filtros para ampliar a busca.
                  </p>
                )}
              </div>
              {(searchQuery || filterBy !== 'all') && (
                <div className="flex gap-2">
                  {searchQuery && (
                    <Button size="sm" variant="outline" onClick={() => setSearchQuery('')}>
                      Limpar busca
                    </Button>
                  )}
                  {filterBy !== 'all' && (
                    <Button size="sm" variant="outline" onClick={() => setFilterBy('all')}>
                      Limpar filtros
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : isMobile ? (
          <div className="space-y-3">
            {pagedActiveUsers.map(u => {
              const m = getMetrics(u.user_id);
              const isNew = (Date.now() - new Date(u.created_at).getTime()) < 30 * 24 * 60 * 60 * 1000;
              return (
                <UserCardMobile
                  key={u.user_id}
                  user={u}
                  metrics={m}
                  isNew={isNew}
                  isEditing={editingId === u.user_id}
                  editForm={editForm}
                  onEditFormChange={setEditForm}
                  onStartEdit={() => startEdit(u)}
                  onSaveEdit={() => saveEdit(u.user_id)}
                  onCancelEdit={() => setEditingId(null)}
                  onToggleApproval={() => toggleApproval(u)}
                  onDelete={() => setDeleteTarget(u)}
                  isSaving={updateUserMutation.isPending}
                />
              );
            })}
          </div>
        ) : (
          <UserTableDesktop
            globalSortKey={sortBy}
            users={pagedActiveUsers}
            getMetrics={getMetrics}
            editingId={editingId}
            editForm={editForm}
            onEditFormChange={setEditForm}
            onStartEdit={startEdit}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)}
            onToggleApproval={toggleApproval}
            onDelete={setDeleteTarget}
            isSaving={updateUserMutation.isPending}
            onRowClick={setDrawerUser}
          />
        )}

        {totalActive > 0 && (
          <UserPagination
            page={safePage}
            limit={limit}
            total={totalActive}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        )}
      </div>

      <UserProfileDrawer
        user={drawerUser}
        metrics={drawerUser ? getMetrics(drawerUser.user_id) : EMPTY_METRICS}
        open={!!drawerUser}
        onOpenChange={(open) => { if (!open) setDrawerUser(null); }}
        onToggleApproval={(u) => { toggleApproval(u); setDrawerUser(null); }}
        onDelete={(u) => { setDeleteTarget(u); setDrawerUser(null); }}
        isTogglePending={toggleApprovalMutation.isPending}
      />
    </div>
  );
}
