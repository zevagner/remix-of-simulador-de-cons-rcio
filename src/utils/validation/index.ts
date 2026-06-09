/**
 * Categoria: Validação e normalização de entrada
 * Barrel re-export — ver src/utils/index.ts.
 */
export {
  isAllowedEmail,
  ALLOWED_DOMAINS,
  DOMAIN_HINT,
  DOMAIN_ERROR_SIGNUP,
  DOMAIN_ERROR_LOGIN,
} from '../emailValidation';
export { sanitizeInput } from '../sanitize';
export { normalizeInputByConsortiumType } from '../normalizeInputByConsortiumType';
export { normalizeProposalStatus } from '../proposalStatusNormalize';
