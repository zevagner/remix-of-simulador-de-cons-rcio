/**
 * Follow-up cadence configuration per proposal status.
 * Provides suggested next-contact offsets and scripts.
 */
import type { ProposalStatus } from '@/services/proposals';

export interface CadenceConfig {
  daysOffset: number;
  script: string;
}

export const FOLLOW_UP_CADENCE: Partial<Record<ProposalStatus, CadenceConfig>> = {
  prospeccao: {
    daysOffset: 1,
    script:
      '[Nome], tudo bem? Aqui é o [seu nome], gerente de consórcio. Tenho uma análise personalizada que montei pra você — leva 10 minutos e pode mudar sua visão sobre como adquirir seu imóvel sem pagar juros. Você prefere que eu te ligue amanhã às 14h ou às 16h?',
  },
  aguardando_retorno: {
    daysOffset: 2,
    script:
      'Boa tarde, [Nome]! Tudo certo? Passei para confirmar se ficou claro como podemos usar o seu FGTS para potencializar as chances na próxima assembleia. Tivemos resultados excelentes no grupo que simulamos. Fico no aguardo.',
  },
  em_avaliacao: {
    daysOffset: 3,
    script:
      '[Nome], só passando rapidamente. Sei que uma decisão assim exige reflexão — e faz todo sentido. Queria apenas reforçar: a economia projetada comparando com o financiamento é significativa. Se surgiu alguma dúvida específica, me manda aqui que eu respondo na hora.',
  },
  proposta_ajustada: {
    daysOffset: 1,
    script:
      '[Nome], ajustei os números conforme conversamos. Ficou ainda mais interessante. Para o fechamento, é mais estratégico faturar no seu CPF ou no CNPJ da sua empresa?',
  },
};

/** Statuses that should hide the contact date / cadence section */
export const HIDDEN_CADENCE_STATUSES: ProposalStatus[] = ['fechado', 'perdido'];

/** Returns suggested date as YYYY-MM-DD string */
export function getSuggestedDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

/** Highlight [Nome] and [seu nome] placeholders in a script */
export function highlightPlaceholders(text: string): Array<{ text: string; isPlaceholder: boolean }> {
  const parts: Array<{ text: string; isPlaceholder: boolean }> = [];
  const regex = /\[(Nome|seu nome)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), isPlaceholder: false });
    }
    parts.push({ text: match[0], isPlaceholder: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isPlaceholder: false });
  }

  return parts;
}
