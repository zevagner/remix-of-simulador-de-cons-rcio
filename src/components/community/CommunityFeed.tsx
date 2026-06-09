/**
 * CommunityFeed — home da Comunidade como feed cronológico de atividade.
 * Mistura "novo caso", "resposta nova", "resolvido" e "sem resposta >24h".
 * Não altera RPCs/RLS — consome `listActivityFeed` que agrega queries existentes.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, Sparkles, MessageCircle, Heart, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { listActivityFeed, toggleCaseLike, getMyLikedCases, type ActivityItem, type ActivityKind } from '@/services/community';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { logger } from '@/utils/logger';
import { CommunityAvatar } from './CommunityAvatar';
import { CommunityLevelBadge } from './CommunityLevelBadge';
import { useCommunityUserLevels } from '@/hooks/useCommunityUserLevels';

export type FeedScope = 'tudo' | 'precisa' | 'meus';

interface CommunityFeedProps {
  scope: FeedScope;
  onOpenCase: (caseId: string, opts?: { focusReply?: boolean }) => void;
}

const PREVIEW_MAX = 600;

const PAGE_SIZE = 20;

const KIND_META: Record<ActivityKind, { label: string; icon: typeof Sparkles; className: string }> = {
  new_case: {
    label: 'Novo caso',
    icon: Sparkles,
    className: 'border-secondary/40 text-secondary bg-secondary/10',
  },
  new_reply: {
    label: 'Resposta nova',
    icon: MessageCircle,
    className: 'border-success/40 text-success bg-success/10',
  },
  resolved: {
    label: 'Resolvido',
    icon: CheckCircle2,
    className: 'border-primary/40 text-primary bg-primary/10',
  },
  unanswered: {
    label: 'Sem resposta',
    icon: AlertCircle,
    className: 'border-destructive/40 text-destructive bg-destructive/10',
  },
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return 'ontem';
  if (d < 7) return `há ${d} dias`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function CommunityFeed({ scope, onOpenCase }: CommunityFeedProps) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (nextLimit: number, isMore: boolean) => {
    if (isMore) setLoadingMore(true);
    else setLoading(true);
    try {
      const list = await listActivityFeed({ scope, limit: nextLimit });
      setItems(list);
    } finally {
      if (isMore) setLoadingMore(false);
      else setLoading(false);
    }
  }, [scope]);

  // Reset ao trocar de aba
  useEffect(() => {
    setLimit(PAGE_SIZE);
    void load(PAGE_SIZE, false);
  }, [scope, load]);

  const userIds = useMemo(() => items.map((it) => it.userId), [items]);
  const levels = useCommunityUserLevels(userIds);

  // Likes locais (otimistas) sobrepondo o snapshot do servidor
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const caseIds = Array.from(new Set(items.map((it) => it.caseId)));
    if (caseIds.length === 0) return;
    void getMyLikedCases(caseIds).then(setLikedSet);
    setLikeCounts((prev) => {
      const next = { ...prev };
      for (const it of items) {
        if (next[it.caseId] === undefined) next[it.caseId] = it.likeCount ?? 0;
      }
      return next;
    });
  }, [items]);

  const handleToggleLike = useCallback(async (caseId: string) => {
    const wasLiked = likedSet.has(caseId);
    const baseCount = likeCounts[caseId] ?? 0;
    // optimistic
    setLikedSet((prev) => {
      const n = new Set(prev);
      if (wasLiked) n.delete(caseId); else n.add(caseId);
      return n;
    });
    setLikeCounts((prev) => ({ ...prev, [caseId]: Math.max(0, baseCount + (wasLiked ? -1 : 1)) }));
    try {
      const res = await toggleCaseLike(caseId);
      setLikedSet((prev) => {
        const n = new Set(prev);
        if (res.liked) n.add(caseId); else n.delete(caseId);
        return n;
      });
      setLikeCounts((prev) => ({ ...prev, [caseId]: res.like_count }));
    } catch (err) {
      logger.error('toggleCaseLike error', err);
      // revert
      setLikedSet((prev) => {
        const n = new Set(prev);
        if (wasLiked) n.add(caseId); else n.delete(caseId);
        return n;
      });
      setLikeCounts((prev) => ({ ...prev, [caseId]: baseCount }));
    }
  }, [likedSet, likeCounts]);

  const handleLoadMore = () => {
    const next = limit + PAGE_SIZE;
    setLimit(next);
    void load(next, true);
  };

  if (loading) {
    return (
      <Card className="p-card-md text-center text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
        Carregando feed…
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-card-md text-center space-y-2">
        <Sparkles className="h-7 w-7 text-primary mx-auto" />
        <p className="text-sm font-semibold">
          {scope === 'meus' ? 'Você ainda não abriu casos' :
           scope === 'precisa' ? 'Tudo respondido por aqui' :
           'Feed ainda vazio'}
        </p>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          {scope === 'meus' ? 'Abra um caso quando estiver com dúvida sobre uma estratégia, objeção ou cliente.' :
           scope === 'precisa' ? 'Volte mais tarde — novos casos aparecem aqui assim que chegam.' :
           'Assim que alguém abrir ou responder um caso, a atividade aparece aqui.'}
        </p>
      </Card>
    );
  }

  // Carregamos PAGE_SIZE * N e checamos se há possibilidade de mais
  const couldHaveMore = items.length >= limit;

  return (
    <div className="rounded-md border border-border bg-background divide-y divide-border/60 overflow-hidden">
      {items.map((it) => (
        <FeedCard
          key={it.id}
          item={it}
          level={levels[it.userId] ?? 1}
          liked={likedSet.has(it.caseId)}
          likeCount={likeCounts[it.caseId] ?? it.likeCount ?? 0}
          onToggleLike={() => handleToggleLike(it.caseId)}
          onOpen={() => onOpenCase(it.caseId)}
          onReply={() => onOpenCase(it.caseId, { focusReply: true })}
        />
      ))}
      {couldHaveMore && (
        <div className="flex justify-center p-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="gap-1.5"
          >
            {loadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Carregar mais
          </Button>
        </div>
      )}
    </div>
  );
}

function FeedCard({
  item, level, liked, likeCount, onOpen, onReply, onToggleLike,
}: {
  item: ActivityItem;
  level: number;
  liked: boolean;
  likeCount: number;
  onOpen: () => void;
  onReply: () => void;
  onToggleLike: () => void;
}) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;
  const [expanded, setExpanded] = useState(false);
  const preview = item.previewText ?? '';
  const isLong = preview.length > PREVIEW_MAX;
  const displayed = !isLong || expanded ? preview : preview.slice(0, PREVIEW_MAX).trimEnd();
  const estimatedViews = (item.replyCount + 1) * 7;

  return (
    <div className="relative p-4 bg-background hover:bg-muted/30 transition-colors">
      {/* Badge resolvido no canto superior direito */}
      {item.status === 'resolvido' && item.kind !== 'resolved' && (
        <Badge variant="outline" className="absolute top-3 right-3 text-caption border-success/40 text-success gap-1">
          <CheckCircle2 className="h-2.5 w-2.5" /> resolvido
        </Badge>
      )}

      {/* Linha superior: avatar + identidade + tempo + categoria + tipo */}
      <div className="flex items-center gap-2 flex-wrap pr-20">
        <CommunityAvatar userId={item.userId} level={level} size="sm" />
        <span className="text-xs font-semibold text-foreground">Gerente</span>
        <CommunityLevelBadge level={level} />
        <span className="text-caption text-muted-foreground whitespace-nowrap">
          {relativeTime(item.ts)}
        </span>
        {item.consortiumType && (
          <>
            <span className="text-caption text-muted-foreground" aria-hidden>·</span>
            <span className="text-caption text-muted-foreground capitalize">
              {item.consortiumType}
            </span>
          </>
        )}
        <span className="text-caption text-muted-foreground" aria-hidden>·</span>
        <Badge
          variant="outline"
          className={cn('text-caption gap-1', meta.className)}
        >
          <Icon className="h-2.5 w-2.5" />
          {meta.label}
        </Badge>
      </div>

      {/* Título clicável */}
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left mt-2 group"
      >
        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
          {item.caseTitle}
        </h3>
      </button>

      {/* Conteúdo: bloco diferenciado quando é resposta nova */}
      {preview && item.kind === 'new_reply' ? (
        <div className="mt-2">
          <div className="text-caption text-muted-foreground mb-1">
            Resposta de Gerente · Nível {level}
          </div>
          <div className="bg-muted/40 border-l-2 border-muted-foreground/30 px-3 py-2 rounded-sm">
            <p className="text-sm text-foreground/80 whitespace-pre-line">
              {displayed}
              {isLong && !expanded && (
                <>
                  …{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                    className="text-primary hover:underline font-medium"
                  >
                    ver mais
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      ) : preview ? (
        <p className="text-sm text-foreground/80 mt-1.5 whitespace-pre-line">
          {displayed}
          {isLong && !expanded && (
            <>
              …{' '}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                className="text-primary hover:underline font-medium"
              >
                ver mais
              </button>
            </>
          )}
        </p>
      ) : null}

      {/* Barra de ações estilo Twitter */}
      <div className="flex items-center gap-8 mt-3 text-muted-foreground">
        <button
          type="button"
          onClick={onReply}
          className="inline-flex items-center gap-1.5 text-xs hover:text-primary transition-colors group/action"
          aria-label="Responder"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{item.replyCount}</span>
        </button>
        <button
          type="button"
          onClick={onToggleLike}
          className={cn(
            'inline-flex items-center gap-1.5 text-xs transition-colors',
            liked ? 'text-destructive' : 'hover:text-destructive',
          )}
          aria-label={liked ? 'Descurtir' : 'Curtir'}
          aria-pressed={liked}
        >
          <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
          <span>{likeCount}</span>
        </button>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-xs hover:text-primary transition-colors"
              aria-label="Visualizações"
            >
              <BarChart2 className="h-4 w-4" />


              <span>{estimatedViews}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="center" className="w-auto px-3 py-2 text-xs">
            👁 {estimatedViews} visualizações
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
