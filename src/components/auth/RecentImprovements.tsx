import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bug, Lightbulb, Sparkles } from 'lucide-react';
import { logger } from '@/utils/logger';

interface Improvement {
  id: string;
  type: string;
  public_summary: string;
  resolved_at: string;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  if (days < 30) return `há ${Math.floor(days / 7)} sem`;
  return `há ${Math.floor(days / 30)} mes`;
}

export function RecentImprovements() {
  const [items, setItems] = useState<Improvement[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('public_improvements')
          .select('id, type, public_summary, resolved_at')
          .order('resolved_at', { ascending: false })
          .limit(5);

        if (cancelled) return;
        if (error) {
          logger.warn('[recent-improvements] error', error);
          setItems([]);
          return;
        }
        setItems((data ?? []) as Improvement[]);
      } catch (err) {
        if (!cancelled) {
          logger.warn('[recent-improvements] unexpected', err);
          setItems([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <div className="mt-6 w-full max-w-md mx-auto animate-fade-in">
      <div className="bg-card/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-landing-gold" />
          <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wide">Melhorias recentes</h3>
        </div>
        <ul className="space-y-2">
          {items.map(item => {
            const Icon = item.type === 'erro' ? Bug : Lightbulb;
            const iconClass = item.type === 'erro' ? 'text-emerald-400' : 'text-landing-gold';
            return (
              <li key={item.id} className="flex items-start gap-2.5 text-xs">
                <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${iconClass}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white/85 leading-snug">{item.public_summary}</p>
                  <p className="text-caption text-white/40 mt-0.5">{formatRelative(item.resolved_at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
