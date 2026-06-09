/**
 * CommunityPulseBar — social proof hero (últimas 24h).
 * Determinístico via RPC `community_pulse_24h`. Sem polling agressivo.
 * Onda UX-N1: promovido de linha cinza para 4 cards visuais grandes,
 * para gerar sensação imediata de "tem gente aqui agora".
 */
import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, HandHeart, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getCommunityPulse, type CommunityPulse } from '@/services/community';

export function CommunityPulseBar() {
  const [pulse, setPulse] = useState<CommunityPulse | null>(null);

  useEffect(() => {
    let alive = true;
    void getCommunityPulse().then((p) => { if (alive) setPulse(p); });
    return () => { alive = false; };
  }, []);

  if (!pulse) return null;

  const items = [
    {
      icon: CheckCircle2,
      label: 'resolvidos hoje',
      value: pulse.resolved_today,
      accent: 'text-success',
      bg: 'bg-success/10 border-success/30',
    },
    {
      icon: Clock,
      label: 'aguardando ajuda',
      value: pulse.waiting_help,
      accent: 'text-warning',
      bg: 'bg-warning/10 border-warning/30',
    },
    {
      icon: HandHeart,
      label: 'gerentes ajudaram',
      value: pulse.helpers_today,
      accent: 'text-primary',
      bg: 'bg-primary/10 border-primary/30',
    },
    {
      icon: Sparkles,
      label: 'casos novos hoje',
      value: pulse.new_cases_today,
      accent: 'text-foreground',
      bg: 'bg-muted/40 border-border',
    },
  ];

  // se tudo zerado, não polui a tela
  if (items.every((i) => i.value === 0)) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Card
            key={it.label}
            className={`p-3 sm:p-4 flex items-center gap-3 border ${it.bg}`}
          >
            <Icon className={`h-5 w-5 shrink-0 ${it.accent}`} />
            <div className="min-w-0">
              <div className={`text-xl sm:text-2xl font-bold leading-none ${it.accent}`}>
                {it.value}
              </div>
              <div className="text-caption text-muted-foreground mt-1 leading-tight">
                {it.label}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
