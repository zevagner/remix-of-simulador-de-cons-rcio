import { useMemo } from 'react';
import { usePostSaleClients } from './usePostSaleQueries';
import { computeClientAlerts } from '@/components/modules/postSale/postSaleAlerts';

/**
 * Conta quantos clientes pós-venda possuem ao menos um alerta CRITICAL ou WARNING.
 * Alertas INFO (oportunidades) são ignorados — sinalizam ação ofensiva, não risco.
 */
export function usePostSaleActionCount(): number {
  const { data: clients = [] } = usePostSaleClients();
  return useMemo(() => {
    let count = 0;
    for (const c of clients) {
      const alerts = computeClientAlerts(c);
      if (alerts.some(a => a.level === 'critical' || a.level === 'warning')) {
        count += 1;
      }
    }
    return count;
  }, [clients]);
}
