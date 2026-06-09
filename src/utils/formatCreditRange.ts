/**
 * Formata uma faixa de crédito (string) para o padrão monetário pt-BR.
 *
 * Aceita entradas inconsistentes (ex: "R$ 73527.77 A 98037.03") e extrai
 * os números via regex. NÃO altera o dado original — apenas a exibição.
 *
 * Em caso de qualquer falha, retorna a string original como fallback seguro.
 */
export { formatCurrencyBRL } from './format';
import { formatCurrencyBRL } from './format';

export function formatCreditRange(faixa: string | null | undefined): string {
  if (!faixa || typeof faixa !== 'string') return String(faixa ?? '');
  try {
    const matches = faixa.match(/\d+(\.\d+)?/g);
    if (!matches || matches.length < 2) return faixa;
    const min = Number(matches[0]);
    const max = Number(matches[1]);
    if (!isFinite(min) || !isFinite(max)) return faixa;
    return `${formatCurrencyBRL(min)} a ${formatCurrencyBRL(max)}`;
  } catch {
    return faixa;
  }
}
