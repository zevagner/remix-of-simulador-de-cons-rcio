/**
 * Community service — CRUD de casos, respostas, votos.
 * Cliente fino sobre Supabase. Toda regra de permissão é RLS.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { logger } from '@/utils/logger';
import { logAction } from '@/services/auditLog';
import type { AnonymizedCase } from '@/utils/community/anonymize';

export type CommunityCase = Tables<'community_cases'>;
export type CommunityReply = Tables<'community_replies'>;
export type CommunityVote = Tables<'community_reply_votes'>;
export type UserEngagement = Tables<'user_engagement'>;

export interface CreateCaseInput extends AnonymizedCase {
  is_private?: boolean;
}

export async function createCase(input: CreateCaseInput): Promise<CommunityCase | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const row: TablesInsert<'community_cases'> = {
    user_id: user.id,
    title: input.title.slice(0, 160),
    summary: input.summary.slice(0, 4000),
    payload: input.payload as never,
    consortium_type: input.consortium_type,
    stage: input.stage,
    source_kind: input.source_kind,
    source_id: input.source_id,
    is_private: input.is_private ?? false,
  };

  const { data, error } = await supabase
    .from('community_cases')
    .insert(row)
    .select()
    .single();

  if (error) {
    logger.error('createCase error:', error);
    throw error;
  }

  logAction({
    action: 'create_community_case',
    entity: 'community_case',
    entity_id: data.id,
    metadata: {
      consortium_type: data.consortium_type,
      stage: data.stage,
      source_kind: data.source_kind,
    },
  });

  return data;
}

export interface ListCasesParams {
  search?: string;
  consortiumType?: string | null;
  status?: 'aberto' | 'resolvido' | 'arquivado' | 'todos';
  mineOnly?: boolean;
  limit?: number;
}

export async function listCases(params: ListCasesParams = {}): Promise<CommunityCase[]> {
  const { search, consortiumType, status = 'aberto', mineOnly, limit = 50 } = params;
  const { data: { user } } = await supabase.auth.getUser();

  let q = supabase
    .from('community_cases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status !== 'todos') q = q.eq('status', status);
  if (consortiumType) q = q.eq('consortium_type', consortiumType);
  if (mineOnly && user) q = q.eq('user_id', user.id);
  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    q = q.or(`title.ilike.${term},summary.ilike.${term}`);
  }

  const { data, error } = await q;
  if (error) {
    logger.error('listCases error:', error);
    return [];
  }
  return data ?? [];
}

export async function getCase(id: string): Promise<CommunityCase | null> {
  const { data, error } = await supabase
    .from('community_cases')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    logger.error('getCase error:', error);
    return null;
  }
  return data;
}

export async function updateCaseStatus(
  id: string,
  status: 'aberto' | 'resolvido' | 'arquivado',
): Promise<void> {
  const { error } = await supabase.from('community_cases').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteCase(id: string): Promise<void> {
  const { error } = await supabase.from('community_cases').delete().eq('id', id);
  if (error) throw error;
}

// ─── Outcome / aprendizado coletivo ───

export type OutcomeKind =
  | 'aplicou_funcionou'
  | 'aplicou_nao_funcionou'
  | 'nao_aplicou'
  | 'em_andamento';

export const OUTCOME_KIND_LABEL: Record<OutcomeKind, string> = {
  aplicou_funcionou: 'Apliquei e funcionou',
  aplicou_nao_funcionou: 'Apliquei mas não funcionou',
  nao_aplicou: 'Não apliquei',
  em_andamento: 'Ainda em andamento',
};

export async function setCaseOutcome(
  caseId: string,
  outcome: string,
  outcomeKind: OutcomeKind,
): Promise<void> {
  const { error } = await supabase
    .from('community_cases')
    .update({
      outcome: outcome.slice(0, 4000),
      outcome_kind: outcomeKind,
    })
    .eq('id', caseId);
  if (error) throw error;
}

// ─── Subscriptions ───

export async function followCase(caseId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from('community_subscriptions')
    .insert({ case_id: caseId, user_id: user.id })
    .select()
    .maybeSingle();
  // ignora conflito de unique (já está seguindo)
  if (error && !/duplicate key|community_subscriptions_unique/i.test(error.message)) {
    throw error;
  }
}

export async function unfollowCase(caseId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from('community_subscriptions')
    .delete()
    .eq('case_id', caseId)
    .eq('user_id', user.id);
  if (error) throw error;
}

export async function isFollowingCase(caseId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from('community_subscriptions')
    .select('id')
    .eq('case_id', caseId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function markCaseSeen(caseId: string): Promise<void> {
  await supabase.rpc('community_mark_seen', { _case_id: caseId });
}

export interface CommunityUpdate {
  case_id: string;
  title: string;
  status: 'aberto' | 'resolvido' | 'arquivado';
  reply_count: number;
  last_seen_reply_count: number;
  has_outcome: boolean;
  updated_at: string;
}

export async function listMyUpdates(): Promise<CommunityUpdate[]> {
  const { data, error } = await supabase.rpc('community_my_updates');
  if (error) {
    logger.error('listMyUpdates error:', error);
    return [];
  }
  return (data ?? []) as CommunityUpdate[];
}

// ─── Pulse / sinalização de vida ───

export interface CommunityPulse {
  resolved_today: number;
  waiting_help: number;
  helpers_today: number;
  new_cases_today: number;
}

export async function getCommunityPulse(): Promise<CommunityPulse | null> {
  const { data, error } = await supabase.rpc('community_pulse_24h');
  if (error) {
    logger.error('getCommunityPulse error:', error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    resolved_today: Number(row.resolved_today ?? 0),
    waiting_help: Number(row.waiting_help ?? 0),
    helpers_today: Number(row.helpers_today ?? 0),
    new_cases_today: Number(row.new_cases_today ?? 0),
  };
}

// ─── Expertise implícita ───

export interface ExpertiseTag {
  area: string;
  helpful_count: number;
}

export async function getUserExpertise(userId: string): Promise<ExpertiseTag[]> {
  const { data, error } = await supabase.rpc('community_user_expertise', {
    _user_id: userId,
  });
  if (error) {
    logger.error('getUserExpertise error:', error);
    return [];
  }
  return ((data ?? []) as ExpertiseTag[]).map((t) => ({
    area: t.area,
    helpful_count: Number(t.helpful_count),
  }));
}

// ─── Replies ───

export async function listReplies(caseId: string): Promise<CommunityReply[]> {
  const { data, error } = await supabase
    .from('community_replies')
    .select('*')
    .eq('case_id', caseId)
    .order('is_accepted', { ascending: false })
    .order('helpful_count', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) {
    logger.error('listReplies error:', error);
    return [];
  }
  return data ?? [];
}

export async function createReply(caseId: string, body: string, opts?: { isAi?: boolean }): Promise<CommunityReply | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('community_replies')
    .insert({
      case_id: caseId,
      user_id: user.id,
      body: body.slice(0, 4000),
      is_ai: !!opts?.isAi,
    })
    .select()
    .single();

  if (error) {
    logger.error('createReply error:', error);
    throw error;
  }
  return data;
}

export async function deleteReply(id: string): Promise<void> {
  const { error } = await supabase.from('community_replies').delete().eq('id', id);
  if (error) throw error;
}

export async function setReplyAccepted(id: string, accepted: boolean): Promise<void> {
  const { error } = await supabase
    .from('community_replies')
    .update({ is_accepted: accepted })
    .eq('id', id);
  if (error) throw error;
}

// ─── Votes ───

export async function setReplyVote(replyId: string, vote: 'util' | 'nao_util' | 'none'): Promise<void> {
  const { error } = await supabase.rpc('community_set_vote', {
    _reply_id: replyId,
    _vote: vote,
  });
  if (error) throw error;
}

export async function getMyVoteFor(replyIds: string[]): Promise<Record<string, 'util' | 'nao_util' | undefined>> {
  if (replyIds.length === 0) return {};
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase
    .from('community_reply_votes')
    .select('reply_id, vote')
    .eq('user_id', user.id)
    .in('reply_id', replyIds);
  if (error) {
    logger.error('getMyVoteFor error:', error);
    return {};
  }
  const map: Record<string, 'util' | 'nao_util' | undefined> = {};
  for (const v of data ?? []) map[v.reply_id] = v.vote as 'util' | 'nao_util';
  return map;
}

// ─── Engagement ───

export async function getMyEngagement(): Promise<UserEngagement | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('user_engagement')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) {
    logger.error('getMyEngagement error:', error);
    return null;
  }
  return data;
}

// ─── Wave 3: descoberta inteligente + memória consultiva ───

export interface SimilarCase {
  id: string;
  title: string;
  summary: string;
  status: 'aberto' | 'resolvido' | 'arquivado';
  consortium_type: string | null;
  stage: string | null;
  reply_count: number;
  outcome: string | null;
  outcome_kind: string | null;
  helpful_count: number;
  view_count: number;
  similarity: number;
  created_at: string;
}

export interface SimilarCasesParams {
  caseId?: string;
  consortiumType?: string | null;
  stage?: string | null;
  query?: string | null;
  limit?: number;
}

export async function listSimilarCases(p: SimilarCasesParams = {}): Promise<SimilarCase[]> {
  const { data, error } = await supabase.rpc('community_similar_cases', {
    _case_id: p.caseId ?? null,
    _consortium_type: p.consortiumType ?? null,
    _stage: p.stage ?? null,
    _query: p.query ?? null,
    _limit: p.limit ?? 5,
  });
  if (error) {
    logger.error('listSimilarCases error:', error);
    return [];
  }
  return (data ?? []) as SimilarCase[];
}

export interface ConsultativeSearchParams {
  query?: string;
  consortiumType?: string | null;
  stage?: string | null;
  outcomeKind?: OutcomeKind | null;
  onlyResolved?: boolean;
  onlyUnanswered?: boolean;
  limit?: number;
}

export interface SearchResult extends Omit<SimilarCase, 'similarity'> {
  updated_at: string;
}

export async function searchCases(p: ConsultativeSearchParams = {}): Promise<SearchResult[]> {
  const { data, error } = await supabase.rpc('community_search', {
    _query: p.query ?? null,
    _consortium_type: p.consortiumType ?? null,
    _stage: p.stage ?? null,
    _outcome_kind: p.outcomeKind ?? null,
    _only_resolved: p.onlyResolved ?? false,
    _only_unanswered: p.onlyUnanswered ?? false,
    _limit: p.limit ?? 30,
  });
  if (error) {
    logger.error('searchCases error:', error);
    return [];
  }
  return (data ?? []) as SearchResult[];
}

export interface ReferenceCase extends Omit<SimilarCase, 'similarity' | 'status'> {
  accepted_replies: number;
}

export async function listReferenceCases(limit = 10): Promise<ReferenceCase[]> {
  const { data, error } = await supabase.rpc('community_reference_cases', { _limit: limit });
  if (error) {
    logger.error('listReferenceCases error:', error);
    return [];
  }
  return (data ?? []) as ReferenceCase[];
}

export interface RecurringPattern {
  consortium_type: string;
  stage: string;
  total_cases: number;
  resolved_cases: number;
  worked_cases: number;
  avg_helpful: number;
}

export async function listRecurringPatterns(): Promise<RecurringPattern[]> {
  const { data, error } = await supabase.rpc('community_recurring_patterns', { _days: 180, _limit: 8 });
  if (error) {
    logger.error('listRecurringPatterns error:', error);
    return [];
  }
  return (data ?? []) as RecurringPattern[];
}

export interface CaseImpact {
  view_count: number;
  helpful_replies: number;
}

export async function getCaseImpact(caseId: string): Promise<CaseImpact | null> {
  const { data, error } = await supabase.rpc('community_case_impact', { _case_id: caseId });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    view_count: Number(row.view_count ?? 0),
    helpful_replies: Number(row.helpful_replies ?? 0),
  };
}

export async function registerCaseView(caseId: string): Promise<void> {
  await supabase.rpc('community_register_view', { _case_id: caseId });
}

// ─── Engagement ───

export async function recomputeMyEngagement(): Promise<UserEngagement | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.rpc('community_recompute_engagement', {
    _user_id: user.id,
  });
  if (error) {
    logger.error('recomputeMyEngagement error:', error);
    return null;
  }
  return data as unknown as UserEngagement;
}

// ─── Activity Feed (home da Comunidade como feed cronológico) ───

export type ActivityKind = 'new_case' | 'new_reply' | 'resolved' | 'unanswered';

export interface ActivityItem {
  id: string;                 // chave única (kind+ref)
  kind: ActivityKind;
  ts: string;                 // timestamp ISO usado para ordenação
  caseId: string;
  caseTitle: string;
  caseSummary: string;        // já anonimizado (vem de community_cases.summary)
  consortiumType: string | null;
  status: 'aberto' | 'resolvido' | 'arquivado';
  replyCount: number;
  likeCount: number;
  userId: string;             // autor do evento (case_creator ou reply_author)
  previewText: string;        // 2 linhas truncadas no card
  replyId?: string;           // quando kind = 'new_reply'
}

// ─── Case likes (❤️ na pergunta) ───

export async function toggleCaseLike(caseId: string): Promise<{ liked: boolean; like_count: number }> {
  const { data, error } = await supabase.rpc('toggle_case_like', { p_case_id: caseId });
  if (error) throw error;
  const obj = (data ?? {}) as { liked?: boolean; like_count?: number };
  return { liked: !!obj.liked, like_count: obj.like_count ?? 0 };
}

export async function getMyLikedCases(caseIds: string[]): Promise<Set<string>> {
  if (caseIds.length === 0) return new Set();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data, error } = await supabase
    .from('community_case_likes')
    .select('case_id')
    .eq('user_id', user.id)
    .in('case_id', caseIds);
  if (error) {
    logger.error('getMyLikedCases error:', error);
    return new Set();
  }
  return new Set((data ?? []).map((r: { case_id: string }) => r.case_id));
}


export interface ListActivityFeedParams {
  scope?: 'tudo' | 'precisa' | 'meus';
  limit?: number;             // total já paginado (cliente faz "carregar mais" aumentando limit)
}

const FEED_FETCH_WINDOW = 80; // amostra crua por fonte antes do merge/slice

export async function listActivityFeed(
  params: ListActivityFeedParams = {},
): Promise<ActivityItem[]> {
  const { scope = 'tudo', limit = 20 } = params;
  const { data: { user } } = await supabase.auth.getUser();
  const cutoff24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  // 1) Casos recentes
  let casesQ = supabase
    .from('community_cases')
    .select('id, title, summary, consortium_type, status, reply_count, like_count, user_id, created_at, updated_at, outcome_at')
    .order('created_at', { ascending: false })
    .limit(FEED_FETCH_WINDOW);
  if (scope === 'meus' && user) casesQ = casesQ.eq('user_id', user.id);
  const { data: casesRaw, error: casesErr } = await casesQ;
  if (casesErr) logger.error('feed:listCases error', casesErr);
  const cases = casesRaw ?? [];
  const caseById = new Map(cases.map((c) => [c.id, c]));

  // 2) Respostas recentes — embed do caso elimina a 3ª query de casos ausentes
  const { data: repliesRaw, error: repliesErr } = await supabase
    .from('community_replies')
    .select('id, case_id, user_id, body, created_at, case:community_cases(id, title, summary, consortium_type, status, reply_count, like_count, user_id, created_at, updated_at, outcome_at)')
    .order('created_at', { ascending: false })
    .limit(FEED_FETCH_WINDOW);
  if (repliesErr) logger.error('feed:listReplies error', repliesErr);
  const replies = (repliesRaw ?? []) as Array<{
    id: string;
    case_id: string;
    user_id: string;
    body: string;
    created_at: string;
    case: typeof cases[number] | null;
  }>;

  // Popula caseById com casos vindos do embed que ainda não estavam na janela inicial
  for (const r of replies) {
    if (r.case && !caseById.has(r.case.id)) caseById.set(r.case.id, r.case);
  }

  const items: ActivityItem[] = [];

  // Casos: emite "unanswered" se >24h sem resposta e aberto; senão "new_case"
  for (const c of cases) {
    const isUnanswered =
      c.status === 'aberto' &&
      (c.reply_count ?? 0) === 0 &&
      c.created_at < cutoff24h;
    items.push({
      id: `${isUnanswered ? 'unanswered' : 'new_case'}:${c.id}`,
      kind: isUnanswered ? 'unanswered' : 'new_case',
      ts: c.created_at,
      caseId: c.id,
      caseTitle: c.title,
      caseSummary: c.summary,
      consortiumType: c.consortium_type,
      status: c.status as ActivityItem['status'],
      replyCount: c.reply_count ?? 0,
      likeCount: (c as { like_count?: number }).like_count ?? 0,
      userId: c.user_id,
      previewText: c.summary,
    });
  }

  // Respostas
  for (const r of replies) {
    const c = caseById.get(r.case_id);
    if (!c) continue;
    items.push({
      id: `new_reply:${r.id}`,
      kind: 'new_reply',
      ts: r.created_at,
      caseId: c.id,
      caseTitle: c.title,
      caseSummary: c.summary,
      consortiumType: c.consortium_type,
      status: c.status as ActivityItem['status'],
      replyCount: c.reply_count ?? 0,
      likeCount: (c as { like_count?: number }).like_count ?? 0,
      userId: r.user_id,
      previewText: r.body,
      replyId: r.id,
    });
  }

  // Casos resolvidos
  for (const c of cases) {
    if (c.status !== 'resolvido') continue;
    const ts = c.outcome_at ?? c.updated_at;
    items.push({
      id: `resolved:${c.id}`,
      kind: 'resolved',
      ts,
      caseId: c.id,
      caseTitle: c.title,
      caseSummary: c.summary,
      consortiumType: c.consortium_type,
      status: c.status as ActivityItem['status'],
      replyCount: c.reply_count ?? 0,
      likeCount: (c as { like_count?: number }).like_count ?? 0,
      userId: c.user_id,
      previewText: c.summary,
    });
  }

  // Filtro por escopo
  let filtered = items;
  if (scope === 'precisa') {
    filtered = items.filter((it) =>
      it.status === 'aberto' && (it.kind === 'unanswered' || (it.kind === 'new_case' && it.replyCount < 2)),
    );
  } else if (scope === 'meus' && user) {
    filtered = items.filter((it) => {
      const c = caseById.get(it.caseId);
      return c?.user_id === user.id;
    });
  }

  // Ordenação cronológica reversa + paginação simples
  filtered.sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));
  return filtered.slice(0, limit);
}

