/**
 * Rola suavemente até o primeiro erro/elemento marcado em um container.
 * Usa seletores convencionais (aria-invalid, [data-error], .field-error).
 *
 * Princípio UX Wave 1: o usuário nunca deve "procurar" o erro.
 *
 * Uso:
 *   if (!isValid) {
 *     scrollToFirstError(formRef.current);
 *     return;
 *   }
 */
const ERROR_SELECTORS = [
  '[aria-invalid="true"]',
  '[data-error="true"]',
  '.field-error',
  '[data-field-error="true"]',
].join(', ');

export function scrollToFirstError(container?: HTMLElement | null): boolean {
  const root = container ?? document;
  const target = root.querySelector<HTMLElement>(ERROR_SELECTORS);
  if (!target) return false;

  // Offset para sticky headers (~96px) e respeita prefers-reduced-motion
  const reduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  try {
    const top = target.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  } catch {
    target.scrollIntoView({ block: 'center' });
  }

  // Foco visível após pequena animação
  window.setTimeout(() => {
    if (typeof target.focus === 'function') {
      target.focus({ preventScroll: true });
    }
  }, reduced ? 0 : 350);

  return true;
}
