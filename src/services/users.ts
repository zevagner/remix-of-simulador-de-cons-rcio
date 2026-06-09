import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from './auth';
import { getCurrentUserRole } from './auth';
import { sanitizeInput } from '@/utils/sanitize';

export interface UserProfile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  role: UserRole;
  approved: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}

// ─── Utilities ───

let _lastAdminAction = 0;
function rateLimitAdmin(): boolean {
  const now = Date.now();
  if (now - _lastAdminAction < 1000) return false;
  _lastAdminAction = now;
  return true;
}

async function assertAdmin(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado.');

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (data?.role !== 'admin') throw new Error('Ação não autorizada.');
  return user.id;
}

// ─── Current User Profile ───

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,user_id,nome,email,approved,created_at')
    .eq('user_id', user.id)
    .single();

  const role = await getCurrentUserRole();

  if (!profile) return null;

  return {
    id: profile.id,
    user_id: profile.user_id,
    nome: profile.nome,
    email: profile.email || user.email || '',
    role,
    approved: profile.approved ?? false,
    created_at: profile.created_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
  };
}

// ─── Admin: User Management ───

export type AdminUsersSortKey = 'name' | 'email' | 'date' | 'role' | 'approved';
export type AdminUsersSortDir = 'asc' | 'desc';
export type AdminUsersApprovedFilter = 'active' | 'pending' | null;
export type AdminUsersEmailDomain = 'caixa' | 'external' | 'missing' | null;
export type AdminUsersRoleFilter = 'admin' | 'user' | null;

export interface AdminUsersPageParams {
  search?: string | null;
  roleFilter?: AdminUsersRoleFilter;
  approvedFilter?: AdminUsersApprovedFilter;
  emailDomain?: AdminUsersEmailDomain;
  newOnly?: boolean;
  sortKey?: AdminUsersSortKey;
  sortDir?: AdminUsersSortDir;
  limit?: number;
  offset?: number;
}

export interface AdminUsersPageResult {
  rows: UserProfile[];
  total: number;
}

/**
 * Server-side paginated user listing for the Admin module.
 * Pagination, search, filters and sorting are pushed down to Postgres
 * (RPC `get_admin_users_page`). Use this for the "lightweight" mode.
 */
export async function getAdminUsersPage(params: AdminUsersPageParams = {}): Promise<AdminUsersPageResult> {
  const {
    search = null,
    roleFilter = null,
    approvedFilter = null,
    emailDomain = null,
    newOnly = false,
    sortKey = 'date',
    sortDir = 'desc',
    limit = 20,
    offset = 0,
  } = params;

  const { data, error } = await supabase.rpc('get_admin_users_page', {
    p_search: search,
    p_role_filter: roleFilter,
    p_approved_filter: approvedFilter,
    p_email_domain: emailDomain,
    p_new_only: newOnly,
    p_sort_key: sortKey,
    p_sort_dir: sortDir,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw error;

  const rows: UserProfile[] = (data ?? []).map((r: {
    id: string;
    user_id: string;
    nome: string;
    email: string;
    role: string;
    approved: boolean;
    created_at: string;
  }) => ({
    id: r.id,
    user_id: r.user_id,
    nome: r.nome,
    email: r.email ?? '',
    role: (r.role as UserRole) ?? 'user',
    approved: r.approved ?? false,
    created_at: r.created_at,
    last_sign_in_at: null,
  }));

  const total = (data && data.length > 0) ? Number((data[0] as { total_count: number | string }).total_count) : 0;
  return { rows, total };
}

export async function getAllUsers(): Promise<UserProfile[]> {
  await assertAdmin();

  // Paginação para contornar o limite default de 1000 linhas do PostgREST
  const PAGE = 1000;
  const profiles: Array<{ id: string; user_id: string; nome: string; email: string; approved: boolean | null; created_at: string }> = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,user_id,nome,email,approved,created_at')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1);
    if (error || !data) break;
    profiles.push(...data);
    if (data.length < PAGE) break;
  }

  if (profiles.length === 0) return [];

  const [{ data: roles }, { data: emails }] = await Promise.all([
    supabase.from('user_roles').select('user_id, role'),
    supabase.rpc('get_users_with_email'),
  ]);

  const roleMap = new Map<string, UserRole>();
  (roles ?? []).forEach((r) => roleMap.set(r.user_id, r.role as UserRole));

  const emailMap = new Map<string, string>();
  (emails ?? []).forEach((e: { user_id: string; email: string }) => emailMap.set(e.user_id, e.email));

  return profiles.map((p) => ({
    id: p.id,
    user_id: p.user_id,
    nome: p.nome,
    email: p.email || '',
    role: roleMap.get(p.user_id) ?? 'user',
    approved: p.approved ?? false,
    created_at: p.created_at,
    last_sign_in_at: null,
  }));
}

export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
  await assertAdmin();
  if (!rateLimitAdmin()) return false;

  await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);

  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role });

  return !error;
}

export async function approveUser(userId: string, approved: boolean): Promise<boolean> {
  await assertAdmin();
  if (!rateLimitAdmin()) return false;

  const { error } = await supabase
    .from('profiles')
    .update({ approved })
    .eq('user_id', userId);

  return !error;
}

export async function updateProfile(userId: string, data: { nome?: string }): Promise<boolean> {
  // Ownership check: only the user themselves or an admin can update a profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado.');

  if (user.id !== userId) {
    // If not self, must be admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (roleData?.role !== 'admin') throw new Error('Não autorizado.');
  }

  const cleanData: { nome?: string } = {};
  if (data.nome) cleanData.nome = sanitizeInput(data.nome);

  const { error } = await supabase
    .from('profiles')
    .update(cleanData)
    .eq('user_id', userId);

  return !error;
}

export async function createUser(data: { email: string; nome: string; password: string }): Promise<boolean> {
  await assertAdmin();
  if (!rateLimitAdmin()) return false;

  const { data: result, error } = await supabase.functions.invoke('create-user', {
    body: data,
  });

  if (error) {
    const msg = (result as { error?: string })?.error ?? error.message;
    throw new Error(msg);
  }

  if (result?.error) {
    throw new Error(result.error);
  }

  return true;
}

export async function deleteUser(userId: string): Promise<boolean> {
  await assertAdmin();
  if (!rateLimitAdmin()) return false;

  const { data, error } = await supabase.functions.invoke('delete-user', {
    body: { userIdToDelete: userId },
  });

  if (error) {
    const msg = (data as { error?: string })?.error ?? error.message;
    throw new Error(msg);
  }

  return true;
}
