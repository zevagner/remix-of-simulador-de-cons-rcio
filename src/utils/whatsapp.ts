/**
 * Opens WhatsApp with pre-filled text.
 * Only works on mobile (where WhatsApp app is installed).
 * On desktop, opens WhatsApp Web which may not handle long messages well.
 */
export function openInWhatsApp(text: string): void {
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
}

/**
 * Checks if the current device is likely mobile (has WhatsApp app).
 * Uses a simple heuristic based on screen width and touch support.
 */
export function isMobileDevice(): boolean {
  return window.innerWidth < 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
}
