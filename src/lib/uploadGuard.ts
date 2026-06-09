/**
 * Upload Guard — defense-in-depth para uploads client-side.
 *
 * Lê os primeiros bytes do arquivo e verifica a magic number contra a
 * extensão/MIME declarado. Bloqueia spoofing trivial (renomear .exe→.png,
 * SVG/HTML disfarçado de imagem, payloads embutidos em zip/xlsx).
 *
 * Wave: SaaS Operational Hardening & Pentest Readiness Pass.
 * Não substitui validação server-side — é a primeira camada de filtro.
 */

export type GuardKind = 'png' | 'jpeg' | 'pdf' | 'xlsx';

export interface GuardResult {
  ok: boolean;
  detected?: GuardKind | 'unknown';
  reason?: string;
}

const MAX_SIZE_BY_KIND: Record<GuardKind, number> = {
  png: 500 * 1024,         // logo
  jpeg: 500 * 1024,        // logo
  pdf: 10 * 1024 * 1024,   // pdf
  xlsx: 10 * 1024 * 1024,  // assembleia
};

async function readHead(file: File, bytes = 8): Promise<Uint8Array> {
  const slice = file.slice(0, bytes);
  const buf = await slice.arrayBuffer();
  return new Uint8Array(buf);
}

function eq(head: Uint8Array, sig: number[]): boolean {
  if (head.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) if (head[i] !== sig[i]) return false;
  return true;
}

/** PNG: 89 50 4E 47 0D 0A 1A 0A */
function isPng(h: Uint8Array) { return eq(h, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); }
/** JPEG: FF D8 FF */
function isJpeg(h: Uint8Array) { return eq(h, [0xff, 0xd8, 0xff]); }
/** PDF: %PDF- */
function isPdf(h: Uint8Array) { return eq(h, [0x25, 0x50, 0x44, 0x46, 0x2d]); }
/** XLSX/ZIP: PK\x03\x04 (também aceita empty zip PK\x05\x06 / spanned PK\x07\x08) */
function isZip(h: Uint8Array) {
  return eq(h, [0x50, 0x4b, 0x03, 0x04]) || eq(h, [0x50, 0x4b, 0x05, 0x06]) || eq(h, [0x50, 0x4b, 0x07, 0x08]);
}

/**
 * Verifica que o arquivo bate com o `expected` (magic byte + tamanho).
 * Não confia em `file.type` nem na extensão.
 */
export async function guardFile(file: File, expected: GuardKind): Promise<GuardResult> {
  if (!file || file.size === 0) return { ok: false, reason: 'Arquivo vazio.' };
  const max = MAX_SIZE_BY_KIND[expected];
  if (file.size > max) {
    return { ok: false, reason: `Arquivo acima de ${Math.round(max / 1024)}KB.` };
  }
  const head = await readHead(file, 8);
  let detected: GuardKind | 'unknown' = 'unknown';
  if (isPng(head)) detected = 'png';
  else if (isJpeg(head)) detected = 'jpeg';
  else if (isPdf(head)) detected = 'pdf';
  else if (isZip(head)) detected = 'xlsx'; // ZIP container (XLSX)

  if (expected === 'png' && detected !== 'png')
    return { ok: false, detected, reason: 'Conteúdo não é um PNG real.' };
  if (expected === 'jpeg' && detected !== 'jpeg')
    return { ok: false, detected, reason: 'Conteúdo não é um JPEG real.' };
  if (expected === 'pdf' && detected !== 'pdf')
    return { ok: false, detected, reason: 'Conteúdo não é um PDF real.' };
  if (expected === 'xlsx' && detected !== 'xlsx')
    return { ok: false, detected, reason: 'Conteúdo não é um XLSX/ZIP real.' };

  return { ok: true, detected };
}

/** Aceita qualquer imagem dentro do allowlist (png ou jpeg). */
export async function guardImage(file: File): Promise<GuardResult> {
  if (!file || file.size === 0) return { ok: false, reason: 'Arquivo vazio.' };
  if (file.size > Math.max(MAX_SIZE_BY_KIND.png, MAX_SIZE_BY_KIND.jpeg)) {
    return { ok: false, reason: 'Arquivo acima do limite.' };
  }
  const head = await readHead(file, 8);
  if (isPng(head)) return { ok: true, detected: 'png' };
  if (isJpeg(head)) return { ok: true, detected: 'jpeg' };
  // Bloqueia SVG/HTML/script disfarçado de imagem — fundamentos antiXSS.
  return { ok: false, detected: 'unknown', reason: 'Apenas PNG ou JPEG são aceitos.' };
}
