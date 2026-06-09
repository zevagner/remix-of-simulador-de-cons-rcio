/**
 * AnalysisCopilot — wrapper fino: instancia useModuleCopilot + useCopilotTriggers
 * e renderiza CopilotCard. Suporta modo proativo (auto-disparo controlado).
 *
 * Anti-loop:
 *  - Dispara no máximo 1x por `signature` de gatilho (memoizado em ref).
 *  - Debounce de 2s após mudança de cenário.
 *  - Fallback: botão manual continua funcionando se IA falhar.
 */
import { useEffect, useRef } from 'react';
import { useModuleCopilot } from '@/hooks/useModuleCopilot';
import { useCopilotTriggers, type CopilotTriggerInput } from '@/hooks/useCopilotTriggers';
import { CopilotCard } from '@/components/ai/CopilotCard';

interface Props {
  module?: 'analysis' | 'approach' | 'proposal' | 'proposal-pdf' | 'wallet' | 'post-sale';
  title?: string;
  className?: string;
  /** Habilita disparo automático quando gatilhos forem atendidos. */
  proactive?: boolean;
  /** Entradas extras para os gatilhos (ex.: proposta da carteira, risco do pós-venda). */
  triggerInput?: CopilotTriggerInput;
}



function humanize(reason: string): string {
  const [key, val] = reason.split(':');
  if (key === 'custo_alto') {
    const ratio = Number(val);
    const extraPct = Number.isFinite(ratio) ? Math.round((ratio - 1) * 100) : null;
    return extraPct !== null
      ? `Você está pagando aproximadamente ${extraPct}% a mais que o crédito`
      : 'Custo total bem acima do crédito contratado';
  }
  if (key === 'lance_embutido') {
    return `${val}% do crédito não será recebido pelo cliente`;
  }
  if (key === 'cliente_parado') {
    return `Cliente sem contato há ${val} dias — risco de perda`;
  }
  if (key === 'risco_alto_pos_venda') {
    return 'Cliente com alto risco de desistência';
  }
  return key;
}

export function AnalysisCopilot({
  module = 'analysis',
  title,
  className,
  proactive = false,
  triggerInput,
}: Props) {
  const cp = useModuleCopilot(module);
  const triggers = useCopilotTriggers(triggerInput);
  const lastSignatureRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!proactive) return;
    if (!cp.ready) return;
    if (!triggers.fired) return;
    if (cp.loading) return;
    if (lastSignatureRef.current === triggers.signature) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lastSignatureRef.current = triggers.signature;
      cp.run({
        proposal: triggerInput?.proposal ?? undefined,
        postSaleClient: triggerInput?.postSaleClient ?? undefined,
      });
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proactive, cp.ready, cp.loading, triggers.signature, triggers.fired]);

  const isAuto = proactive && triggers.fired && lastSignatureRef.current === triggers.signature;

  return (
    <CopilotCard
      title={title ?? 'Copiloto de venda'}
      ready={cp.ready}
      loading={cp.loading}
      error={cp.error}
      result={cp.result}
      onRun={() => cp.run({
        proposal: triggerInput?.proposal ?? undefined,
        postSaleClient: triggerInput?.postSaleClient ?? undefined,
      })}
      className={className}
      auto={isAuto}
      autoReasons={isAuto ? triggers.reasons.map(humanize) : undefined}
    />
  );
}
