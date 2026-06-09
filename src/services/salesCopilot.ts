/**
 * Client for the sales-copilot edge function.
 * Streams AI response token-by-token.
 */

const COPILOT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-copilot`;

export interface CopilotSimulationContext {
  consortiumType?: string;
  creditValue?: number;
  installment?: number;
  termMonths?: number;
  totalCost?: number;
  bidPercent?: number;
  bidZone?: string;
  groupNumber?: number;
  clientName?: string;
  scenarioProfile?: string;
  strategyLabel?: string;
  savingsVsFinancing?: number;
}

export async function streamCopilotResponse({
  clientMessage,
  simulationContext,
  onDelta,
  onDone,
  onError,
  signal,
}: {
  clientMessage: string;
  simulationContext?: CopilotSimulationContext;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}) {
  try {
    const resp = await fetch(COPILOT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ clientMessage, simulationContext }),
      signal,
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({ error: "Erro de conexão" }));
      onError(data.error || `Erro ${resp.status}`);
      return;
    }

    if (!resp.body) {
      onError("Stream não disponível");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    // Flush remaining
    if (buffer.trim()) {
      for (let raw of buffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (e) {
    if ((e as Error).name === "AbortError") return;
    onError(e instanceof Error ? e.message : "Erro desconhecido");
  }
}
