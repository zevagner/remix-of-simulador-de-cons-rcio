/**
 * Cross-session PII storage keys cleared on every logout path
 * (manual logout, expired session, account switch, blocked user).
 *
 * Keep this list in sync with any new localStorage key that may
 * hold client-identifiable data (names, drafts, simulator slices,
 * navigation state derived from a tenant session).
 */
const PII_STORAGE_KEYS = [
  'strategy:sim-slice:v1',
  'wealth:assumptions:v1',
  'wealth:assumptions:preset:v1',
  'proposalPdfModule:opening',
  'proposalPdfModule:closing',
  'pipeline:lead-draft',
  'nav:lastModule',
  'nav:lastSubmodule',
  'wave3:sanitized:v2',
] as const;

export function clearPiiStorageOnLogout(): void {
  if (typeof window === 'undefined') return;
  try {
    PII_STORAGE_KEYS.forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* storage may be disabled in corporate browsers — ignore */
      }
    });
  } catch {
    /* defensive: never block the logout path */
  }
}
