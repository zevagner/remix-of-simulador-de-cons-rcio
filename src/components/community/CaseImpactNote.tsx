/**
 * CaseImpactNote — Onda 3 / continuidade humana leve.
 * Para o autor do caso: "Seu caso ajudou X consultores".
 * Sem dopamina social — apenas reconhecimento humano discreto.
 */
import { useEffect, useState } from 'react';
import { Eye, Sparkles } from 'lucide-react';
import { getCaseImpact, type CaseImpact } from '@/services/community';

interface Props {
  caseId: string;
  isAuthor: boolean;
}

export function CaseImpactNote({ caseId, isAuthor }: Props) {
  const [impact, setImpact] = useState<CaseImpact | null>(null);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      const r = await getCaseImpact(caseId);
      if (!cancel) setImpact(r);
    })();
    return () => { cancel = true; };
  }, [caseId]);

  if (!impact) return null;
  const { view_count, helpful_replies } = impact;
  if (view_count === 0 && helpful_replies === 0) return null;

  // Para visitante: mostra apenas alcance discreto
  if (!isAuthor) {
    if (view_count < 3) return null;
    return (
      <div className="text-caption text-muted-foreground inline-flex items-center gap-1">
        <Eye className="h-3 w-3" /> {view_count} gerentes leram este caso
      </div>
    );
  }

  // Para autor: feedback humano leve
  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 p-2 text-xs text-foreground inline-flex items-center gap-2">
      <Sparkles className="h-3.5 w-3.5 text-primary" />
      <span>
        Seu caso já ajudou <strong>{view_count}</strong> gerente{view_count === 1 ? '' : 'es'}
        {helpful_replies > 0 && (
          <> · <strong>{helpful_replies}</strong> voto{helpful_replies === 1 ? '' : 's'} útil em respostas</>
        )}.
      </span>
    </div>
  );
}
