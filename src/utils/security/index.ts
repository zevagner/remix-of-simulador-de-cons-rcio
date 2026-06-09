/**
 * Security Util Index — superfície institucional aprovada.
 *
 * Toda renderização de conteúdo dinâmico (IA, markdown, narrativas, scripts
 * comerciais, assembleias, comparadores, storytelling, PDFs) DEVE consumir
 * destes utilitários. HTML dinâmico é proibido institucionalmente.
 *
 * Política completa: docs/security/html-injection-policy.md
 * Renderer único:    src/utils/safeFormattedText.tsx
 * CI Gate:           scripts/ci/anti-xss-gate.mjs
 * ESLint Guard:      eslint.config.js (no-restricted-syntax — bloco Anti-XSS)
 */
export {
  SafeNarrative,
  renderSafeFormattedText,
  parseSafeNarrative,
} from "@/utils/safeFormattedText";
export type { SafeBlock } from "@/utils/safeFormattedText";
