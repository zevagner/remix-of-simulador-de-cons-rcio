/**
 * Domain restriction for corporate email addresses.
 * Only emails ending with allowed domains can register or be created.
 */

export const ALLOWED_DOMAINS = ['caixa.gov.br', 'caixaconsorcio.com.br'];

export const DOMAIN_HINT = 'Use seu e-mail corporativo (@caixa.gov.br ou @caixaconsorcio.com.br)';
export const DOMAIN_ERROR_SIGNUP = 'Cadastro permitido apenas para e-mails corporativos (@caixa.gov.br ou @caixaconsorcio.com.br).';
export const DOMAIN_ERROR_LOGIN = 'Utilize seu e-mail corporativo (@caixa.gov.br ou @caixaconsorcio.com.br).';

export function isAllowedEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain ?? '');
}