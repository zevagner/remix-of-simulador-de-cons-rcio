/**
 * UX Wave 6 — Operational Trust & Confidence Polish
 *
 * Camada unificada e calma de microconfirmações para ações críticas
 * (salvar, enviar, gerar, copiar, exportar, sincronizar).
 *
 * Princípio: tom executivo, sem alarmismo. Mensagens curtas, previsíveis,
 * recuperáveis. Sem spam de toasts — sempre dedup por id estável.
 *
 * Não substitui sonner — embrulha-o com presets institucionais.
 */
import { toast } from 'sonner';

type TrustId = string | number;

interface TrustOpts {
  id?: TrustId;
  description?: string;
  duration?: number;
}

/** Sucesso silencioso e curto. Use para salvar/atualizar/sincronizar. */
export function notifySaved(message = 'Salvo', opts: TrustOpts = {}) {
  return toast.success(message, {
    id: opts.id ?? `saved:${message}`,
    description: opts.description,
    duration: opts.duration ?? 2200,
  });
}

/** Confirmação de cópia para clipboard — tom neutro, durar pouco. */
export function notifyCopied(label = 'Copiado') {
  return toast.success(label, {
    id: `copied:${label}`,
    duration: 1600,
  });
}

/** Erro recuperável. Mensagem curta + instrução prática (não alarmista). */
export function notifyError(message = 'Não foi possível concluir', opts: TrustOpts & { retry?: () => void } = {}) {
  return toast.error(message, {
    id: opts.id ?? `error:${message}`,
    description: opts.description ?? 'Tente novamente em instantes.',
    duration: opts.duration ?? 4200,
    action: opts.retry
      ? { label: 'Tentar de novo', onClick: () => opts.retry?.() }
      : undefined,
  });
}

/** Estado de processamento longo (>1.2s). Substituível pelo resolve. */
export function notifyProcessing(message = 'Processando…', opts: TrustOpts = {}) {
  return toast.loading(message, {
    id: opts.id ?? `processing:${message}`,
    description: opts.description,
  });
}

/**
 * Wrapper para ações async críticas (gerar, exportar, enviar).
 * Mostra loading só se demorar mais que `delayMs` (default 600ms) — evita flash.
 * Resolve com sucesso/erro padronizados.
 */
export async function withTrustFeedback<T>(
  promise: Promise<T> | (() => Promise<T>),
  msgs: { loading?: string; success?: string; error?: string; id?: TrustId; delayMs?: number } = {},
): Promise<T> {
  const id = msgs.id ?? `trust:${Math.random().toString(36).slice(2, 8)}`;
  const delay = msgs.delayMs ?? 600;
  let toastShown = false;
  const timer = setTimeout(() => {
    toastShown = true;
    notifyProcessing(msgs.loading ?? 'Processando…', { id });
  }, delay);

  try {
    const result = await (typeof promise === 'function' ? promise() : promise);
    clearTimeout(timer);
    if (toastShown || msgs.success) {
      toast.success(msgs.success ?? 'Pronto', { id, duration: 2200 });
    }
    return result;
  } catch (err) {
    clearTimeout(timer);
    notifyError(msgs.error ?? 'Não foi possível concluir', { id });
    throw err;
  }
}
