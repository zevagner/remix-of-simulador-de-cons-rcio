/**
 * useCommunity — engagement do usuário e ações da comunidade.
 */
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getMyEngagement, recomputeMyEngagement,
  type UserEngagement,
} from '@/services/community';
import {
  levelFromScore, levelProgress, permissionsFor, LEVEL_LABEL,
  type CommunityLevel,
} from '@/utils/community/score';

export function useCommunityEngagement() {
  const { user } = useAuth();
  const [engagement, setEngagement] = useState<UserEngagement | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setEngagement(null); setLoading(false); return; }
    setLoading(true);
    let row = await getMyEngagement();
    if (!row) row = await recomputeMyEngagement();
    setEngagement(row);
    setLoading(false);
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  const score = engagement?.score ?? 0;
  const level = (engagement?.level ?? levelFromScore(score)) as CommunityLevel;
  const progress = levelProgress(score);
  const permissions = permissionsFor(level);

  return {
    engagement, loading, refresh,
    score, level, progress, permissions,
    levelLabel: LEVEL_LABEL[level],
  };
}
