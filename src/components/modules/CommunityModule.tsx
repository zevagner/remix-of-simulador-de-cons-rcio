/**
 * CommunityModule — home como FEED DE ATIVIDADE (cronológico reverso).
 * Topo fixo: header + 4 cards de social proof + CTA-input + barra de abas/busca.
 * Feed: mistura "novo caso", "resposta nova", "resolvido", "sem resposta >24h".
 * Casos referência permanecem abaixo do feed; CaseDetail intacto.
 */
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, MessageSquare, Lock, Sparkles, Heart,
  Send, Loader2, CheckCircle2, ArrowLeft, Search, Clock, Flame, Zap, Award,
} from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  listCases, getCase, listReplies, createReply, setReplyVote, getMyVoteFor,
  setReplyAccepted, updateCaseStatus,
  markCaseSeen, registerCaseView,
  type CommunityCase, type CommunityReply,
} from '@/services/community';
import { useCommunityEngagement } from '@/hooks/useCommunity';
import { useAuth } from '@/hooks/useAuth';
import { OpenCaseDialog } from '@/components/community/OpenCaseDialog';
import { CommunityPulseBar } from '@/components/community/CommunityPulseBar';
import { FollowCaseButton } from '@/components/community/FollowCaseButton';
import { CaseOutcomePanel } from '@/components/community/CaseOutcomePanel';
import { SimilarCasesCard } from '@/components/community/SimilarCasesCard';
import { ConsultativeSearch } from '@/components/community/ConsultativeSearch';
import { ReferenceCasesPanel } from '@/components/community/ReferenceCasesPanel';
import { CaseImpactNote } from '@/components/community/CaseImpactNote';
import { CommunityAvatar } from '@/components/community/CommunityAvatar';
import { CommunityLevelBadge } from '@/components/community/CommunityLevelBadge';

import { CommunityFeed, type FeedScope } from '@/components/community/CommunityFeed';
import { useCommunityUserLevels } from '@/hooks/useCommunityUserLevels';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 36e5;
}

function daysSince(iso: string): number {
  return hoursSince(iso) / 24;
}

export function CommunityModule() {
  const [scope, setScope] = useState<FeedScope>('tudo');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusReply, setFocusReply] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [searchResults, setSearchResults] = useState<CommunityCase[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [feedReloadKey, setFeedReloadKey] = useState(0);

  // Busca inline (lupa): consulta direta em community_cases
  useEffect(() => {
    const term = quickSearch.trim();
    if (!showSearchInput || term.length < 2) {
      setSearchResults(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = window.setTimeout(async () => {
      const list = await listCases({ search: term, status: 'todos', limit: 20 });
      if (!cancelled) {
        setSearchResults(list);
        setSearching(false);
      }
    }, 250);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [quickSearch, showSearchInput]);

  const onCaseCreated = useCallback(() => {
    setFeedReloadKey((k) => k + 1);
  }, []);

  if (selectedId) {
    return (
      <CaseDetail
        caseId={selectedId}
        focusReply={focusReply}
        onBack={() => { setSelectedId(null); setFocusReply(false); setFeedReloadKey((k) => k + 1); }}
        onOpenCase={(id) => { setSelectedId(id); setFocusReply(false); }}
      />
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-24 md:pb-8">
      {/* Header navy institucional */}
      <ModuleHeader title="Comunidade" subtitle="Discuta clientes reais com quem já passou pela mesma situação" moduleId="community" />

      {/* 4 cards de social proof — fixos no topo */}
      <CommunityPulseBar />

      {/* CTA-input "Qual caso está te travando hoje?" */}
      <OpenCaseDialog
        onCreated={onCaseCreated}
        trigger={
          <button
            type="button"
            className={cn(
              'w-full text-left rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent',
              'p-card-sm sm:p-5 hover:border-primary/60 hover:from-primary/15 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary/30',
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm sm:text-base text-foreground/80">
                  Qual caso está te travando hoje?
                </div>
                <div className="text-caption text-muted-foreground mt-0.5">
                  Descreva em uma frase — outros gerentes ajudam em minutos. Anônimo.
                </div>
              </div>
              <Badge
                variant="default"
                className="shrink-0"
              >
                Abrir caso
              </Badge>
            </div>
          </button>
        }
      />

      {/* Barra: abas à esquerda + lupa + busca avançada à direita */}
      <div className="flex items-center gap-2 flex-wrap">
        <Tabs value={scope} onValueChange={(v) => setScope(v as FeedScope)}>
          <TabsList data-tabs-keep-pill="true">
            <TabsTrigger value="tudo" className="border border-[#1e3a5f] bg-transparent data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white data-[state=active]:border-[#1e3a5f] hover:bg-[#1e3a5f]/10">Tudo</TabsTrigger>
            <TabsTrigger value="precisa" className="border border-[#1e3a5f] bg-transparent data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white data-[state=active]:border-[#1e3a5f] hover:bg-[#1e3a5f]/10">Precisa de você</TabsTrigger>
            <TabsTrigger value="meus" className="border border-[#1e3a5f] bg-transparent data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white data-[state=active]:border-[#1e3a5f] hover:bg-[#1e3a5f]/10">Meus casos</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto flex items-center gap-2">
          {showSearchInput && (
            <div className="relative w-[180px] sm:w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Buscar caso…"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={showSearchInput ? 'Fechar busca' : 'Buscar casos'}
            onClick={() => {
              setShowSearchInput((s) => {
                const next = !s;
                if (!next) { setQuickSearch(''); setSearchResults(null); }
                return next;
              });
            }}
            className="h-9 w-9"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant={showSearch ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowSearch((s) => !s)}
            className="gap-1.5"
          >
            <Search className="h-3.5 w-3.5" />
            {showSearch ? 'Fechar' : 'Busca avançada'}
          </Button>
        </div>
      </div>

      {/* Conteúdo: busca avançada > busca inline > feed */}
      {showSearch ? (
        <ConsultativeSearch onOpen={(id) => setSelectedId(id)} />
      ) : showSearchInput && quickSearch.trim().length >= 2 ? (
        <QuickSearchResults
          results={searchResults}
          loading={searching}
          onOpen={(id) => setSelectedId(id)}
        />
      ) : (
        <CommunityFeed
          key={`${scope}-${feedReloadKey}`}
          scope={scope}
          onOpenCase={(id, opts) => { setSelectedId(id); setFocusReply(!!opts?.focusReply); }}
        />
      )}

      {/* Casos referência — sempre visível abaixo do feed */}
      <ReferenceCasesPanel onOpen={(id) => setSelectedId(id)} />
    </div>
  );
}

function QuickSearchResults({
  results, loading, onOpen,
}: { results: CommunityCase[] | null; loading: boolean; onOpen: (id: string) => void }) {
  const { user } = useAuth();
  if (loading) {
    return (
      <Card className="p-card-md text-center text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Buscando…
      </Card>
    );
  }
  if (!results || results.length === 0) {
    return (
      <Card className="p-card-md text-center text-sm text-muted-foreground">
        Nenhum caso encontrado.
      </Card>
    );
  }
  return <CaseList cases={results} currentUserId={user?.userId} onOpen={onOpen} />;
}


function WaitingBadge({ createdAt, replyCount }: { createdAt: string; replyCount: number }) {
  const h = hoursSince(createdAt);
  if (replyCount === 0 && h > 24) {
    const d = Math.max(1, Math.floor(daysSince(createdAt)));
    return (
      <Badge variant="outline" className="text-caption border-warning/40 text-warning gap-1">
        <Clock className="h-2.5 w-2.5" /> Aguardando há {d}d
      </Badge>
    );
  }
  if (h < 12) {
    return (
      <Badge variant="outline" className="text-caption border-primary/40 text-primary gap-1">
        <Zap className="h-2.5 w-2.5" /> Novo
      </Badge>
    );
  }
  return null;
}

function CaseList({
  cases, currentUserId, onOpen,
}: { cases: CommunityCase[]; currentUserId?: string; onOpen: (id: string) => void }) {
  const levels = useCommunityUserLevels(cases.map((c) => c.user_id));
  return (
    <div className="space-y-2">
      {cases.map((c) => (
        <CaseListItem
          key={c.id}
          c={c}
          isMine={c.user_id === currentUserId}
          level={levels[c.user_id] ?? 1}
          onOpen={() => onOpen(c.id)}
        />
      ))}
    </div>
  );
}

function CaseListItem({
  c, isMine, level, onOpen,
}: { c: CommunityCase; isMine: boolean; level: number; onOpen: () => void }) {
  const isHot = c.reply_count === 0 && hoursSince(c.created_at) > 48;
  return (
    <button onClick={onOpen} className="w-full text-left">
      <Card className={cn(
        'p-3 hover:border-primary/40 transition-colors',
        isHot && 'border-warning/30',
      )}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground truncate">{c.title}</span>
              {c.is_private && <Lock className="h-3 w-3 text-muted-foreground" />}
              {c.status === 'resolvido' && (
                <Badge variant="outline" className="text-caption border-success/40 text-success">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> resolvido
                </Badge>
              )}
              {isMine && <Badge variant="outline" className="text-caption">meu</Badge>}
              <WaitingBadge createdAt={c.created_at} replyCount={c.reply_count} />
              {isHot && (
                <Badge variant="outline" className="text-caption border-warning/40 text-warning gap-1">
                  <Flame className="h-2.5 w-2.5" /> precisa de ajuda
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 whitespace-pre-line">
              {c.summary}
            </p>
            <div className="flex items-center gap-2 mt-2 text-caption text-muted-foreground">
              <CommunityAvatar userId={c.user_id} level={level} size="sm" />
              <span>Gerente</span>
              <span aria-hidden="true">·</span>
              <CommunityLevelBadge level={level} />
              <span aria-hidden="true">·</span>
              <span className="uppercase">{fmtDate(c.created_at)}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> {c.reply_count}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </button>
  );
}


function CaseDetail({ caseId, onBack, onOpenCase, focusReply }: { caseId: string; onBack: () => void; onOpenCase?: (id: string) => void; focusReply?: boolean }) {
  const { user } = useAuth();
  const { permissions } = useCommunityEngagement();
  const [data, setData] = useState<CommunityCase | null>(null);
  const [replies, setReplies] = useState<CommunityReply[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, 'util' | 'nao_util' | undefined>>({});
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const [c, list] = await Promise.all([getCase(caseId), listReplies(caseId)]);
    setData(c);
    setReplies(list);
    if (list.length) setMyVotes(await getMyVoteFor(list.map((r) => r.id)));
    setLoading(false);
  }, [caseId]);

  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => { void markCaseSeen(caseId); void registerCaseView(caseId); }, [caseId]);

  // Foco automático no textarea quando vier do botão "Responder" do feed
  useEffect(() => {
    if (!focusReply || loading) return;
    const t = window.setTimeout(() => {
      const el = replyTextareaRef.current;
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true });
    }, 120);
    return () => window.clearTimeout(t);
  }, [focusReply, loading]);

  const isAuthor = data?.user_id === user?.userId;
  const replyLevels = useCommunityUserLevels(replies.map((r) => r.user_id));

  const handleReply = async () => {
    if (!body.trim()) return;
    setPosting(true);
    try {
      await createReply(caseId, body.trim());
      setBody('');
      await reload();
    } catch (err) {
      toast.error(err?.message || 'Não foi possível responder.');
    } finally {
      setPosting(false);
    }
  };

  const handleVote = async (replyId: string, kind: 'util' | 'nao_util') => {
    const current = myVotes[replyId];
    const next = current === kind ? 'none' : kind;
    try {
      await setReplyVote(replyId, next);
      setMyVotes((m) => ({ ...m, [replyId]: next === 'none' ? undefined : next }));
      await reload();
    } catch (err) {
      toast.error(err?.message || 'Não foi possível registrar o voto.');
    }
  };

  const handleAccept = async (replyId: string, accepted: boolean) => {
    try {
      await setReplyAccepted(replyId, accepted);
      await reload();
    } catch (err) {
      toast.error(err?.message || 'Erro ao destacar resposta.');
    }
  };

  const handleResolve = async () => {
    if (!data) return;
    try {
      await updateCaseStatus(data.id, data.status === 'resolvido' ? 'aberto' : 'resolvido');
      await reload();
    } catch (err) {
      toast.error(err?.message || 'Erro ao alterar status.');
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <Card className="p-card-md text-sm text-muted-foreground">Carregando…</Card>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in pb-24 md:pb-8">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Voltar para a lista
      </Button>

      <Card className="p-card-sm">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold">{data.title}</h2>
              {data.is_private && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
              {data.status === 'resolvido' && (
                <Badge variant="outline" className="text-caption border-success/40 text-success">
                  resolvido
                </Badge>
              )}
              <WaitingBadge createdAt={data.created_at} replyCount={data.reply_count} />
            </div>
            <p className="text-caption text-muted-foreground mt-0.5">
              {fmtDate(data.created_at)} · {data.reply_count} resposta(s)
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <FollowCaseButton caseId={data.id} />
            {isAuthor && (
              <Button variant="outline" size="sm" onClick={handleResolve}>
                {data.status === 'resolvido' ? 'Reabrir' : 'Marcar resolvido'}
              </Button>
            )}
          </div>
        </div>
        <pre className="mt-3 text-xs whitespace-pre-wrap font-mono bg-muted/40 rounded p-3 leading-relaxed">
          {data.summary}
        </pre>
        <div className="mt-3">
          <CaseImpactNote caseId={data.id} isAuthor={isAuthor} />
        </div>
      </Card>

      {/* Casos parecidos resolvidos — inteligência histórica ativa */}
      <SimilarCasesCard
        caseId={data.id}
        consortiumType={data.consortium_type}
        stage={data.stage}
        title="Casos parecidos resolvidos"
        emptyHint="Ainda não há histórico parecido com este caso. Quando houver, ele aparece aqui."
        onOpen={(id) => onOpenCase?.(id)}
      />

      {/* Outcome / "O que aconteceu depois?" */}
      <CaseOutcomePanel caseRow={data} isAuthor={isAuthor} onUpdated={reload} />

      {/* Respostas */}
      <div className="space-y-2">
        {replies.length === 0 && (
          <Card className="p-card-sm text-sm text-muted-foreground text-center">
            Ainda sem respostas. Seja o primeiro a ajudar.
          </Card>
        )}
        {(() => {
          const maxHelpful = replies.reduce((m, x) => Math.max(m, x.helpful_count ?? 0), 0);
          return replies.map((r) => {
            const liked = myVotes[r.id] === 'util';
            const isMostHelpful = maxHelpful > 0 && (r.helpful_count ?? 0) === maxHelpful;
            return (
              <Card
                key={r.id}
                className={cn(
                  'p-3',
                  r.is_accepted && 'border-2 border-success/50 bg-success/5 shadow-sm',
                  r.is_ai && !r.is_accepted && 'border-primary/30 bg-primary/5',
                )}
              >
                {r.is_accepted && (
                  <div className="flex items-center gap-1.5 mb-2 text-success text-xs font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Resposta destacada pelo autor do caso
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <CommunityAvatar
                    userId={r.user_id}
                    level={replyLevels[r.user_id] ?? 1}
                    size="md"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-foreground">Consultor</span>
                    <CommunityLevelBadge level={replyLevels[r.user_id] ?? 1} />
                  </div>
                  {r.is_ai && (
                    <Badge variant="outline" className="text-caption gap-1">
                      <Sparkles className="h-3 w-3" /> IA
                    </Badge>
                  )}
                  <span className="text-caption text-muted-foreground ml-auto">{fmtDate(r.created_at)}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{r.body}</p>
                
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => handleVote(r.id, 'util')}
                    disabled={!permissions.canVote || r.user_id === user?.userId}
                    aria-pressed={liked}
                    className={cn(
                      'inline-flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                      liked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive',
                    )}
                  >
                    <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
                    <span>{r.helpful_count}</span>
                  </button>
                  {isMostHelpful && (
                    <Badge variant="outline" className="text-caption gap-1 border-success/40 text-success">
                      <Award className="h-3 w-3" /> Mais útil
                    </Badge>
                  )}
                  {isAuthor && (
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 px-2 text-xs ml-auto"
                      onClick={() => handleAccept(r.id, !r.is_accepted)}
                    >
                      {r.is_accepted ? 'Remover destaque' : 'Destacar'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          });
        })()}
      </div>


      {/* Composer */}
      {(permissions.canReply || isAuthor) ? (
        <Card className="p-3 space-y-2">
          <Textarea
            ref={replyTextareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Como você abordaria esse caso? Compartilhe uma estratégia ou pergunta…"
            rows={3}
            maxLength={4000}
          />
          <div className="flex items-center justify-end">
            <Button onClick={handleReply} disabled={posting || !body.trim()} className="gap-1.5">
              {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Responder
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-3 text-xs text-muted-foreground text-center">
          Responder casos é liberado a partir do nível Colaborador.
        </Card>
      )}
    </div>
  );
}
