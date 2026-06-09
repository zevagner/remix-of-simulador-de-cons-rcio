/**
 * useStorytellingAutoGen — Sprint B.2 extraction.
 *
 * Encapsulates the auto-generation of the Storytelling block via Lovable AI.
 * - Idempotent: returns immediately if cache already has any entry.
 * - Non-blocking: AI failure does NOT throw; the PDF page falls back to a
 *   deterministic narrative.
 * - Stable hook order: no internal effects — caller decides when to trigger.
 *
 * Mirrors the previous inline logic in ProposalPdfModule.tsx 1:1.
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { listStorytellings, saveStorytelling, type CachedStorytelling } from '@/utils/storytellingCache';
import type { useCentralAI } from '@/hooks/useCentralAI';
import { logger } from '@/utils/logger';

interface Params {
  userId: string | null;
  centralAI: ReturnType<typeof useCentralAI>;
  /** Whether the storytelling block is currently selected by the user. */
  enabled: boolean;
}

export interface UseStorytellingAutoGenResult {
  autoGenerating: boolean;
  hasAnyStorytellingCached: boolean;
  cachedList: Array<{ key: string; entry: CachedStorytelling }>;
  /** Manually trigger generation (idempotent). Safe to await. */
  ensureStorytelling: () => Promise<void>;
}

export function useStorytellingAutoGen({
  userId, centralAI, enabled,
}: Params): UseStorytellingAutoGenResult {
  const [autoGenerating, setAutoGenerating] = useState(false);
  // Bump triggers cache re-read after a successful AI generation.
  const [bump, setBump] = useState(0);

  const cachedList = useMemo(() => listStorytellings(userId), [userId, bump]);
  const hasAnyStorytellingCached = cachedList.length > 0;

  const ensureStorytelling = useCallback(async (): Promise<void> => {
    if (!enabled) return;
    if (hasAnyStorytellingCached) return;
    if (!centralAI.ready) return;
    setAutoGenerating(true);
    try {
      const result = await centralAI.generateInsight('summary');
      if (result.ok && result.kind === 'text' && result.text.trim().length >= 60) {
        saveStorytelling(
          userId,
          { kind: 'argument', topic: 'proposal-summary' },
          { text: result.text.trim(), label: 'Resumo executivo', source: 'central-ai:summary' },
        );
        setBump((n) => n + 1);
      }
    } catch (e) {
      logger.warn('[ProposalPdf] ensureStorytelling failed, using default narrative', e);
    } finally {
      setAutoGenerating(false);
    }
  }, [enabled, hasAnyStorytellingCached, centralAI, userId]);

  // Auto-trigger when block becomes enabled and no cache exists.
  useEffect(() => {
    if (enabled && !hasAnyStorytellingCached && !autoGenerating) {
      void ensureStorytelling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, hasAnyStorytellingCached]);

  return { autoGenerating, hasAnyStorytellingCached, cachedList, ensureStorytelling };
}
