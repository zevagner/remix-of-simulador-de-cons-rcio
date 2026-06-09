import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Retorna o user.id da sessão autenticada (auth.uid()) de forma reativa.
 * Use sempre este id ao popular `user_id` em inserts sujeitos a RLS
 * (em vez de campos derivados como `client.user_id`), evitando violar
 * `WITH CHECK (auth.uid() = user_id)`.
 */
export function useCurrentUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return userId;
}
