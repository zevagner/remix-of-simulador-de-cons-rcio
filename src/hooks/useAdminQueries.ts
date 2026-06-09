import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  getAllUsers, updateUserRole, updateProfile, approveUser, deleteUser,
  getAdminUsersPage, type UserProfile, type AdminUsersPageParams, type AdminUsersPageResult,
} from '@/services/users';
import { type UserRole } from '@/services/auth';
import { getAdminLogs, type AdminLog } from '@/services/adminLogs';
import { fetchAnalyticsBundle, processAnalyticsBundle, type AnalyticsSummary } from '@/services/analyticsFunnel';
import { logAdminAction } from '@/services/adminLogs';

// ─── Query Keys ───────────────────────────────────────────
export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  usersPage: (params: AdminUsersPageParams) => [...adminKeys.all, 'users-page', params] as const,
  pendingUsers: () => [...adminKeys.all, 'pending-users'] as const,
  usageCounts: () => [...adminKeys.all, 'usage-counts'] as const,
  feedbacks: () => [...adminKeys.all, 'feedbacks'] as const,
  feedbacksCount: () => [...adminKeys.all, 'feedbacks-count'] as const,
  adminLogs: () => [...adminKeys.all, 'admin-logs'] as const,
  accessLogs: () => [...adminKeys.all, 'access-logs'] as const,
  analytics: (days: number, userId?: string) => [...adminKeys.all, 'analytics', days, userId ?? 'all'] as const,
  userEvents: (userId: string) => [...adminKeys.all, 'user-events', userId] as const,
  userProposalEvents: (userId: string) => [...adminKeys.all, 'user-proposal-events', userId] as const,
  securityAlerts: () => [...adminKeys.all, 'security-alerts'] as const,
  securityAlertsCount: () => [...adminKeys.all, 'security-alerts-count'] as const,
};

// ─── Per-user drilldown ───────────────────────────────────
export interface UserEventRow {
  id: string;
  event_name: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

export function useUserEvents(userId: string | null) {
  return useQuery<UserEventRow[]>({
    queryKey: adminKeys.userEvents(userId ?? ''),
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('analytics_events')
        .select('id, event_name, event_data, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      return (data ?? []) as UserEventRow[];
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

export interface UserProposalEventRow {
  id: string;
  from_status: string | null;
  to_status: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export function useUserProposalEvents(userId: string | null) {
  return useQuery<UserProposalEventRow[]>({
    queryKey: adminKeys.userProposalEvents(userId ?? ''),
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('proposal_events')
        .select('id, from_status, to_status, created_at, metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      return (data ?? []) as UserProposalEventRow[];
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}


const STALE_5_MIN = 5 * 60 * 1000;

// ─── Feedback types ───────────────────────────────────────
export interface Feedback {
  id: string;
  user_id: string;
  type: string;
  message: string;
  module: string | null;
  status: string;
  created_at: string;
  user_nome?: string;
  admin_response?: string | null;
  is_public?: boolean;
  public_summary?: string | null;
  user_notified?: boolean;
  resolved_at?: string | null;
}

// ─── Users ────────────────────────────────────────────────
export function useAdminUsers(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: getAllUsers,
    staleTime: 60 * 1000, // 1 min — admin precisa ver novos usuários rapidamente
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    enabled: opts?.enabled ?? true,
  });
}

/**
 * Server-side paginated user listing (lightweight mode).
 * Use when sort/filter does NOT depend on engagement metrics.
 * Returns { rows, total } and keeps previous data while next page loads.
 */
export function useAdminUsersPage(params: AdminUsersPageParams, opts?: { enabled?: boolean }) {
  return useQuery<AdminUsersPageResult>({
    queryKey: adminKeys.usersPage(params),
    queryFn: () => getAdminUsersPage(params),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
    enabled: opts?.enabled ?? true,
  });
}

/**
 * Lightweight fetch for pending (not approved) users — small set, used in
 * the "Usuários Pendentes" section regardless of pagination mode.
 */
export function usePendingUsers(opts?: { enabled?: boolean }) {
  return useQuery<UserProfile[]>({
    queryKey: adminKeys.pendingUsers(),
    queryFn: async () => {
      const { rows } = await getAdminUsersPage({
        approvedFilter: 'pending',
        sortKey: 'date',
        sortDir: 'desc',
        limit: 200,
        offset: 0,
      });
      return rows;
    },
    staleTime: 60 * 1000,
    enabled: opts?.enabled ?? true,
  });
}

export interface UserEngagementMetrics {
  sessions: number;
  proposals: number;
  simulations: number;
  argumentsCopied: number;
  engagement: number; // composite score
  lastActivityAt: string | null; // ISO timestamp of most recent activity
  recencyBonus: number; // +20 if active <24h, -10 if >3 days idle
}

// Eventos de engajamento agora são agregados server-side (ver get_admin_engagement_events).

/** Janela de análise (em dias) — restringe volume e foca em engajamento recente. */
const ENGAGEMENT_WINDOW_DAYS = 90;
const ENGAGEMENT_RECENT_DAYS = 30;

/**
 * Métricas de engajamento por usuário — agregação 100% server-side via RPCs admin-only.
 * Substitui o pull anterior de até 30k eventos + 5k propostas (truncamento silencioso).
 * Corrige o bug histórico `proposals: 0` (RLS impedia admin de ver propostas alheias).
 */
export function useUserEngagementMetrics() {
  return useQuery({
    queryKey: adminKeys.usageCounts(),
    queryFn: async (): Promise<Record<string, UserEngagementMetrics>> => {
      const [eventsRes, proposalsRes] = await Promise.all([
        supabase.rpc('get_admin_engagement_events', {
          p_window_days: ENGAGEMENT_WINDOW_DAYS,
          p_recent_days: ENGAGEMENT_RECENT_DAYS,
        }),
        supabase.rpc('get_user_proposal_counts', {
          p_window_days: ENGAGEMENT_WINDOW_DAYS,
        }),
      ]);

      const metrics: Record<string, UserEngagementMetrics> = {};
      const latestActivity: Record<string, string> = {};

      const ensure = (uid: string) => {
        if (!metrics[uid]) metrics[uid] = { sessions: 0, proposals: 0, simulations: 0, argumentsCopied: 0, engagement: 0, lastActivityAt: null, recencyBonus: 0 };
      };

      (eventsRes.data ?? []).forEach((r: { user_id: string; sessions: number; simulations: number; arguments_copied: number; last_activity_at: string | null }) => {
        ensure(r.user_id);
        const m = metrics[r.user_id];
        m.sessions = Number(r.sessions ?? 0);
        m.simulations = Number(r.simulations ?? 0);
        m.argumentsCopied = Number(r.arguments_copied ?? 0);
        if (r.last_activity_at) latestActivity[r.user_id] = r.last_activity_at;
      });

      (proposalsRes.data ?? []).forEach((r: { user_id: string; proposals_count: number; last_proposal_at: string | null }) => {
        ensure(r.user_id);
        metrics[r.user_id].proposals = Number(r.proposals_count ?? 0);
        if (r.last_proposal_at && (!latestActivity[r.user_id] || r.last_proposal_at > latestActivity[r.user_id])) {
          latestActivity[r.user_id] = r.last_proposal_at;
        }
      });

      const now = Date.now();
      const ONE_DAY = 24 * 60 * 60 * 1000;
      for (const uid of Object.keys(metrics)) {
        const m = metrics[uid];
        m.lastActivityAt = latestActivity[uid] ?? null;
        if (m.lastActivityAt) {
          const daysAgo = (now - new Date(m.lastActivityAt).getTime()) / ONE_DAY;
          if (daysAgo <= 1) m.recencyBonus = 20;
          else if (daysAgo <= 3) m.recencyBonus = 0;
          else m.recencyBonus = -10;
        }
        m.engagement = Math.min(100, Math.max(0, Math.round(
          (m.sessions * 2) + (m.simulations * 5) + (m.proposals * 15) + (m.argumentsCopied * 8) + m.recencyBonus
        )));
      }

      return metrics;
    },
    staleTime: STALE_5_MIN,
  });
}

// Backward compat alias
export function useUserUsageCounts() {
  const query = useUserEngagementMetrics();
  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    if (query.data) {
      for (const [uid, m] of Object.entries(query.data)) {
        result[uid] = m.sessions;
      }
    }
    return result;
  }, [query.data]);
  return { ...query, data: counts };
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, nome, role, adminId }: { userId: string; nome: string; role: UserRole; adminId: string }) => {
      await updateProfile(userId, { nome });
      await updateUserRole(userId, role);
      // Removed PII (nome) from details, using userId for traceability
      await logAdminAction(adminId, 'edit_user', userId, `role: ${role}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.users() });
      qc.invalidateQueries({ queryKey: [...adminKeys.all, 'users-page'] });
      qc.invalidateQueries({ queryKey: adminKeys.pendingUsers() });
    },
  });
}

export function useToggleApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, approve, adminId }: { userId: string; approve: boolean; adminId: string }) => {
      const ok = await approveUser(userId, approve);
      if (!ok) throw new Error('Failed');
      await logAdminAction(adminId, approve ? 'activate_user' : 'deactivate_user', userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.users() });
      qc.invalidateQueries({ queryKey: [...adminKeys.all, 'users-page'] });
      qc.invalidateQueries({ queryKey: adminKeys.pendingUsers() });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, adminId, nome }: { userId: string; adminId: string; nome: string }) => {
      const ok = await deleteUser(userId);
      if (!ok) throw new Error('Failed');
      // Removed PII (nome) from details, using userId for traceability
      await logAdminAction(adminId, 'delete_user', userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.users() });
      qc.invalidateQueries({ queryKey: [...adminKeys.all, 'users-page'] });
      qc.invalidateQueries({ queryKey: adminKeys.pendingUsers() });
    },
  });
}

// ─── Feedbacks ────────────────────────────────────────────
async function fetchFeedbacks(): Promise<Feedback[]> {
  const { data } = await supabase
    .from('feedbacks')
    .select('id,user_id,type,message,module,status,created_at,admin_response,is_public,public_summary,user_notified,resolved_at')
    .order('created_at', { ascending: false })
    .range(0, 1000);
  if (!data) return [];

  const userIds = [...new Set(data.map((f) => f.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, nome')
    .in('user_id', userIds);

  const nameMap = new Map((profiles ?? []).map(p => [p.user_id, p.nome]));
  return data.map((f) => ({ ...f, user_nome: nameMap.get(f.user_id) ?? 'Desconhecido' }));
}

export function useAdminFeedbacks() {
  return useQuery({
    queryKey: adminKeys.feedbacks(),
    queryFn: fetchFeedbacks,
    staleTime: STALE_5_MIN,
  });
}

export function useNewFeedbacksCount(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminKeys.feedbacksCount(),
    queryFn: async () => {
      const { count } = await supabase
        .from('feedbacks')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'novo');
      return count ?? 0;
    },
    staleTime: STALE_5_MIN,
    enabled: opts?.enabled ?? true,
  });
}

export function useUpdateFeedbackStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from('feedbacks').update({ status }).eq('id', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.feedbacks() });
      qc.invalidateQueries({ queryKey: adminKeys.feedbacksCount() });
    },
  });
}

export interface ResolveFeedbackInput {
  id: string;
  admin_response: string | null;
  is_public: boolean;
  public_summary: string | null;
}

export function useResolveFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, admin_response, is_public, public_summary }: ResolveFeedbackInput) => {
      const { error } = await supabase
        .from('feedbacks')
        .update({
          status: 'resolvido',
          admin_response,
          is_public,
          public_summary,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.feedbacks() });
      qc.invalidateQueries({ queryKey: adminKeys.feedbacksCount() });
    },
  });
}

export function useDeleteFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('feedbacks').delete().eq('id', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.feedbacks() });
      qc.invalidateQueries({ queryKey: adminKeys.feedbacksCount() });
    },
  });
}

// ─── Logs ─────────────────────────────────────────────────
export function useAdminLogs() {
  return useQuery({
    queryKey: adminKeys.adminLogs(),
    queryFn: getAdminLogs,
    staleTime: STALE_5_MIN,
  });
}

export interface AccessEvent {
  user_id: string;
  event_name: string;
  created_at: string;
  event_data: Record<string, unknown> | null;
}

/**
 * Access logs (login/logout/module_access) com filtro temporal obrigatório.
 * @param days janela de dias retroativos (default 30)
 */
export function useAccessLogs(days = 30) {
  return useQuery({
    queryKey: [...adminKeys.accessLogs(), days],
    queryFn: async (): Promise<AccessEvent[]> => {
      const since = new Date(Date.now() - days * 86400000).toISOString();
      // Inclui eventos de uso real (não apenas login) para refletir atividade efetiva
      const { data } = await supabase
        .from('analytics_events')
        .select('user_id, event_name, created_at, event_data')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5000);
      return (data ?? []) as AccessEvent[];
    },
    staleTime: STALE_5_MIN,
  });
}

// ─── Analytics ────────────────────────────────────────────
export function useAdminAnalytics(days = 30, userFilter?: string) {
  return useQuery({
    queryKey: adminKeys.analytics(days, userFilter),
    queryFn: async () => {
      const bundle = await fetchAnalyticsBundle(days);
      return processAnalyticsBundle(bundle, userFilter || undefined);
    },
    staleTime: STALE_5_MIN,
  });
}

// ─── Server-side aggregators (Wave Executive Consolidation) ──
// Substituem leituras client-side com truncamento. Todas admin-only via RPC.

export interface DailyLogin { day: string; logins: number; }
export function useAdminDailyLogins(days = 7, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...adminKeys.all, 'daily-logins', days],
    queryFn: async (): Promise<DailyLogin[]> => {
      const { data, error } = await supabase.rpc('get_admin_daily_logins', { p_days: days });
      if (error) throw error;
      return (data ?? []).map((r: { day: string; logins: number }) => ({ day: r.day, logins: Number(r.logins) }));
    },
    staleTime: STALE_5_MIN,
    enabled: opts?.enabled ?? true,
  });
}

export interface DailyActiveUsers { day: string; activeUsers: number; }
export function useAdminActiveUsers(days = 7, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...adminKeys.all, 'active-users', days],
    queryFn: async (): Promise<DailyActiveUsers[]> => {
      const { data, error } = await supabase.rpc('get_admin_active_users', { p_days: days });
      if (error) throw error;
      return (data ?? []).map((r: { day: string; active_users: number }) => ({ day: r.day, activeUsers: Number(r.active_users) }));
    },
    staleTime: STALE_5_MIN,
    enabled: opts?.enabled ?? true,
  });
}

export interface ModuleUsage { module: string; usage: number; }
export function useAdminModuleUsage(days = 30, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...adminKeys.all, 'module-usage', days],
    queryFn: async (): Promise<ModuleUsage[]> => {
      const { data, error } = await supabase.rpc('get_admin_module_usage', { p_days: days });
      if (error) throw error;
      return (data ?? []).map((r: { module: string; usage_count: number }) => ({ module: r.module, usage: Number(r.usage_count) }));
    },
    staleTime: STALE_5_MIN,
    enabled: opts?.enabled ?? true,
  });
}

export interface FunnelEvent { eventName: string; eventCount: number; distinctUsers: number; }
export function useAdminFunnel(days = 30, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...adminKeys.all, 'funnel', days],
    queryFn: async (): Promise<FunnelEvent[]> => {
      const { data, error } = await supabase.rpc('get_admin_funnel', { p_days: days });
      if (error) throw error;
      return (data ?? []).map((r: { event_name: string; event_count: number; distinct_users: number }) => ({
        eventName: r.event_name, eventCount: Number(r.event_count), distinctUsers: Number(r.distinct_users),
      }));
    },
    staleTime: STALE_5_MIN,
    enabled: opts?.enabled ?? true,
  });
}
