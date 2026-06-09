import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

interface ResolvedFeedback {
  id: string;
  type: string;
  message: string;
  admin_response: string | null;
  resolved_at: string | null;
}

/**
 * Shows a sonner toast for each resolved-but-not-yet-notified feedback the user owns.
 * Marks them as notified after surfacing.
 * Runs once per session per user.
 */
export function useFeedbackNotifications() {
  const { user } = useAuth();
  const hasRunRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.userId) return;
    if (hasRunRef.current === user.userId) return;
    hasRunRef.current = user.userId;

    let cancelled = false;

    const run = async () => {
      try {
        const { data, error } = await supabase
          .from('feedbacks')
          .select('id, type, message, admin_response, resolved_at')
          .eq('user_id', user.userId)
          .eq('status', 'resolvido')
          .eq('user_notified', false)
          .order('resolved_at', { ascending: false })
          .limit(5);

        if (error || cancelled || !data || data.length === 0) return;

        const list = data as ResolvedFeedback[];

        // Surface toasts (slight stagger so they stack nicely)
        list.forEach((f, idx) => {
          setTimeout(() => {
            const preview = f.message.length > 60 ? `${f.message.slice(0, 60)}…` : f.message;
            const title = f.type === 'erro' ? '✅ Seu report foi resolvido' : '✨ Sua sugestão foi atendida';
            const description = f.admin_response
              ? `${f.admin_response}\n\n"${preview}"`
              : `"${preview}"`;
            toast.success(title, {
              description,
              duration: 9000,
            });
          }, idx * 350);
        });

        // Mark all as notified
        const ids = list.map(f => f.id);
        const { error: updateErr } = await supabase
          .from('feedbacks')
          .update({ user_notified: true })
          .in('id', ids)
          .eq('user_id', user.userId);

        if (updateErr) logger.warn('[feedback-notify] failed to mark notified', updateErr);
      } catch (err) {
        logger.warn('[feedback-notify] unexpected error', err);
      }
    };

    // Defer slightly so it doesn't fight with other post-login UI
    const t = setTimeout(run, 1200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [user?.userId]);
}
