/**
 * Client for the sales-response edge function.
 * Returns classified client response + 3 suggested replies.
 */

const RESPONSE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-response`;

export interface ProposalContext {
  consortiumType?: string;
  creditValue?: number;
  installment?: number;
  termMonths?: number;
  totalCost?: number;
  bidPercent?: number;
  clientName?: string;
  clientObjective?: string;
}

export type ResponseClassification = 'duvida' | 'objecao' | 'interesse' | 'indecisao';

export interface SuggestionItem {
  label: string;
  text: string;
}

export interface SalesResponseResult {
  classification: ResponseClassification;
  classificationLabel: string;
  suggestions: SuggestionItem[];
}

export async function generateSalesResponses({
  clientResponse,
  proposalContext,
  signal,
}: {
  clientResponse: string;
  proposalContext?: ProposalContext;
  signal?: AbortSignal;
}): Promise<SalesResponseResult> {
  const resp = await fetch(RESPONSE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ clientResponse, proposalContext }),
    signal,
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ error: "Erro de conexão" }));
    throw new Error(data.error || `Erro ${resp.status}`);
  }

  const json = await resp.json();
  if (!json.success || !json.data) {
    throw new Error("Resposta inválida");
  }

  return json.data as SalesResponseResult;
}
