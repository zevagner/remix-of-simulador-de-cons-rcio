import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'pdfManagerProfile.v1';

export interface PdfManagerProfile {
  managerName: string;
  managerRole: string;
  agencyName: string;
  phone: string;
  whatsapp: string;
  email: string;
  /** Logo opcional do gerente/agência, salvo como data URL (base64). */
  logoDataUrl?: string;
}

const EMPTY: PdfManagerProfile = {
  managerName: '',
  managerRole: '',
  agencyName: '',
  phone: '',
  whatsapp: '',
  email: '',
  logoDataUrl: '',
};

function read(): PdfManagerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

export function usePdfProfile() {
  const [profile, setProfile] = useState<PdfManagerProfile>(() => read());

  const save = useCallback((next: PdfManagerProfile) => {
    setProfile(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
  }, []);

  // Sync between tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setProfile(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { profile, save };
}

export function buildPdfFilename(moduleName: string, clientName: string): string {
  const date = new Date().toISOString().split('T')[0];
  const sanitize = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 40) || 'SemNome';
  const mod = sanitize(moduleName);
  const cli = sanitize(clientName || 'Cliente');
  return `${mod}_${cli}_${date}.pdf`;
}

/**
 * Limites do logo embarcado no PDF:
 * - Tamanho de arquivo de origem ≤ 500KB
 * - Redimensionado para caber em 200x80px (proporção preservada)
 * - Convertido para PNG base64 (preserva transparência)
 */
export const LOGO_MAX_FILE_BYTES = 500 * 1024;
export const LOGO_MAX_WIDTH = 200;
export const LOGO_MAX_HEIGHT = 80;
export const LOGO_MIN_DIMENSION = 24; // px — evita ícones quebrados / pixels soltos
export const LOGO_MAX_SOURCE_DIMENSION = 4096; // px — protege contra imagens enormes
/** Limite do dataURL final salvo em localStorage (após redimensionar). */
export const LOGO_MAX_OUTPUT_BYTES = 200 * 1024;

export interface LogoProcessResult {
  ok: true;
  dataUrl: string;
  width: number;
  height: number;
}

export interface LogoProcessError {
  ok: false;
  error: string;
}

export async function processLogoFile(file: File): Promise<LogoProcessResult | LogoProcessError> {
  if (!/^image\/(png|jpeg|jpg)$/i.test(file.type)) {
    return { ok: false, error: 'Formato inválido. Use uma imagem PNG ou JPG.' };
  }
  if (file.size === 0) {
    return { ok: false, error: 'Arquivo vazio.' };
  }
  if (file.size > LOGO_MAX_FILE_BYTES) {
    return { ok: false, error: 'Arquivo acima de 500KB. Use uma imagem menor.' };
  }
  // Defense-in-depth: magic-byte sniff bloqueia SVG/HTML/script disfarçado.
  const { guardImage } = await import('@/lib/uploadGuard');
  const guard = await guardImage(file);
  if (!guard.ok) {
    return { ok: false, error: guard.reason || 'Arquivo não é uma imagem válida.' };
  }
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        const r = String(fr.result || '');
        if (!r.startsWith('data:image/')) reject(new Error('Conteúdo não é uma imagem.'));
        else resolve(r);
      };
      fr.onerror = () => reject(fr.error || new Error('Falha ao ler arquivo.'));
      fr.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Imagem corrompida ou inválida.'));
      i.src = dataUrl;
    });
    if (!img.naturalWidth || !img.naturalHeight) {
      return { ok: false, error: 'Imagem sem dimensões válidas.' };
    }
    if (img.naturalWidth < LOGO_MIN_DIMENSION || img.naturalHeight < LOGO_MIN_DIMENSION) {
      return { ok: false, error: `Imagem muito pequena (mínimo ${LOGO_MIN_DIMENSION}×${LOGO_MIN_DIMENSION}px).` };
    }
    if (img.naturalWidth > LOGO_MAX_SOURCE_DIMENSION || img.naturalHeight > LOGO_MAX_SOURCE_DIMENSION) {
      return { ok: false, error: 'Imagem muito grande. Use uma versão menor que 4000×4000px.' };
    }
    const ratio = Math.min(LOGO_MAX_WIDTH / img.naturalWidth, LOGO_MAX_HEIGHT / img.naturalHeight, 1);
    const w = Math.max(1, Math.round(img.naturalWidth * ratio));
    const h = Math.max(1, Math.round(img.naturalHeight * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { ok: false, error: 'Não foi possível processar a imagem neste navegador.' };
    // Sem efeitos: preserva fundo original (branco ou transparente).
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    const out = canvas.toDataURL('image/png');
    // Estimativa de bytes do dataURL (base64 ~= 0.75 * length da parte codificada)
    const approxBytes = Math.ceil((out.length - (out.indexOf(',') + 1)) * 0.75);
    if (approxBytes > LOGO_MAX_OUTPUT_BYTES) {
      return { ok: false, error: 'Imagem complexa demais após processamento. Tente uma versão simplificada.' };
    }
    return { ok: true, dataUrl: out, width: w, height: h };
  } catch (err) {
    return { ok: false, error: (err as Error).message || 'Falha ao ler imagem.' };
  }
}

/**
 * Sanitiza um dataURL de logo recuperado do localStorage antes de injetar no PDF.
 * Retorna null se inválido — o consumidor deve então omitir o logo silenciosamente.
 */
export function sanitizeLogoDataUrl(value: string | undefined | null): string | null {
  if (!value || typeof value !== 'string') return null;
  if (!value.startsWith('data:image/')) return null;
  if (value.length > 4 * LOGO_MAX_OUTPUT_BYTES) return null;
  return value;
}
