/**
 * pipelineLaunch — handshake leve entre módulos para abrir o NewLeadModal.
 *
 * Usado pelo Simulador (PostSimulationCTA) para sinalizar que, ao chegar na
 * Carteira ('proposals'), o modal "Novo lead" deve abrir já com os dados
 * preenchidos da última simulação (o NewLeadModal já lê SimulatorContext).
 *
 * Implementação: sessionStorage flag de uso único. ProposalHistoryModule lê
 * e limpa no mount.
 */
const KEY = 'pipeline:open_new_lead_from_simulation';

export function requestOpenNewLead() {
  try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
}

export function consumeOpenNewLeadRequest(): boolean {
  try {
    const v = sessionStorage.getItem(KEY);
    if (v) { sessionStorage.removeItem(KEY); return true; }
  } catch { /* ignore */ }
  return false;
}
