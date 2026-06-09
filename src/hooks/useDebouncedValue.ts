import { useEffect, useState } from 'react';

/**
 * Retorna o valor com atraso (default 300ms).
 * UI permanece responsiva — apenas consumidores pesados (cálculos) usam o
 * valor debounced. Não altera resultados; apenas adia o recálculo até o
 * usuário parar de digitar.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
