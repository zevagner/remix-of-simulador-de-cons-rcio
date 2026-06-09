import React from 'react';
import ReactDOM from 'react-dom/client';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  PDF_BUCKET,
  buildTenantPath,
  buildLegacyPath,
  resolveWritePath,
  dualReadCandidates,
  classifyPdfError,
  withProposalMutex,
} from '@/utils/pdf/pdfPipelineHelpers';

export interface PdfGenerateOptions {
  filename: string;
  landscape?: boolean;
  element: React.ReactElement;
  /**
   * Se fornecido, ativa o cache: tenta baixar do storage antes de chamar
   * Browserless. O trigger no banco invalida o cache quando a proposta
   * muda campos relevantes.
   */
  proposalId?: string;
  /**
   * Quando true, ignora o cache existente e força nova geração no Browserless,
   * sobrescrevendo o cache em seguida.
   */
  forceRegenerate?: boolean;
}

async function renderToHtmlString(element: React.ReactElement): Promise<string> {
  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;top:0;width:210mm;background:#ffffff;';
  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);
  root.render(<React.StrictMode>{element}</React.StrictMode>);

  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  if (document.fonts?.ready) {
    try { await document.fonts.ready; } catch { /* noop */ }
  }
  const imgs = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalHeight > 0
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.addEventListener('load', () => res(), { once: true });
            img.addEventListener('error', () => res(), { once: true });
          }),
    ),
  );

  try {
    const headHtml = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style'),
    )
      .map((n) => n.outerHTML)
      .join('\n');

    const bodyHtml = container.innerHTML;

    // ─── Enterprise Watermark (discreto, não destrutivo) ───────────────
    // Inclui: timestamp UTC, ambiente, origem e token de usuário (últimos 6
    // chars do uid). Posicionado no rodapé via @page margin-box reservado.
    // Não interfere no layout do conteúdo (page margin já é 20mm).
    let userToken = '—';
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data?.session?.user?.id;
      if (uid) userToken = `usr:…${uid.slice(-6)}`;
    } catch {
      /* noop */
    }
    const env = (import.meta.env.MODE || 'prod').toString();
    const origin = window.location.host;
    const ts = new Date().toISOString().replace('T', ' ').replace(/\..+$/, 'Z');
    const watermark = `Documento gerado em ${ts} · ${origin} · ${env} · ${userToken}`;

    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<base href="${window.location.origin}/" />
${headHtml}
<style>
  @page {
    size: A4;
    margin: 20mm 16mm 22mm;
  }
  html, body { margin: 0; padding: 0; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { counter-reset: page; }
  [data-pdf-page] { break-before: page; page-break-before: always; position: relative; counter-increment: page; }
  [data-pdf-page]:first-child { break-before: auto; page-break-before: auto; }
  .pdf-watermark {
    position: fixed;
    bottom: 6mm;
    left: 16mm;
    right: 16mm;
    text-align: center;
    font: 7pt -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: rgba(0,0,0,0);
    letter-spacing: 0.02em;
    pointer-events: none;
    z-index: 9999;
  }
</style>
</head>
<body>${bodyHtml}<div class="pdf-watermark" data-pdf-watermark></div></body>
</html>`;

    return fullHtml;
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}

async function callGeneratePdfEdge(html: string, filename: string, landscape: boolean): Promise<Blob> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess?.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login novamente.');

  const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/generate-pdf`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
    },
    body: JSON.stringify({ html, filename, landscape, format: 'A4', printBackground: true }),
  });

  if (!resp.ok) {
    // Rate-limit: tenta extrair message customizado da edge antes de cair no padrão.
    if (resp.status === 429) {
      let serverMessage: string | undefined;
      try {
        const data = await resp.json();
        if (typeof data?.message === 'string') serverMessage = data.message;
      } catch { /* ignore parse error, use default */ }
      const { message } = classifyPdfError({ status: 429 });
      throw new Error(serverMessage ?? message);
    }
    const errBody = await resp.text();
    const { message } = classifyPdfError({ status: resp.status, body: errBody });
    throw new Error(message);
  }
  return await resp.blob();
}

// ─── Cache helpers ─────────────────────────────────────────────────
// M3-C: paths tenant-aware `companies/{companyId}/proposals/{proposalId}/file.pdf`
// com dual-read transparente para o legado `{userId}/{proposalId}.pdf`.

async function resolveCompanyId(userId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', userId)
      .maybeSingle();
    return (data?.company_id as string | null) ?? null;
  } catch {
    return null;
  }
}

// Path builders moved to @/utils/pdf/pdfPipelineHelpers — single source of truth.


async function downloadFromBucket(path: string): Promise<Blob | null> {
  const { data, error } = await supabase.storage.from(PDF_BUCKET).download(path);
  if (error || !data) return null;
  return data;
}

async function tryGetCachedPdf(proposalId: string): Promise<Blob | null> {
  try {
    const { data: cache, error } = await supabase
      .from('proposal_pdf_cache')
      .select('storage_path')
      .eq('proposal_id', proposalId)
      .maybeSingle();
    if (error) return null;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return null;

    // Resolve company once and let dualReadCandidates de-dup the path list.
    const companyId = await resolveCompanyId(userId);
    const candidates = dualReadCandidates({
      registeredPath: cache?.storage_path ?? null,
      userId,
      proposalId,
      companyId,
    });
    for (const path of candidates) {
      const blob = await downloadFromBucket(path);
      if (blob) return blob;
    }
    return null;
  } catch (e) {
    logger.error('Erro lendo cache PDF:', e);
    return null;
  }
}

async function savePdfToCache(proposalId: string, blob: Blob, filename: string): Promise<void> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    const companyId = await resolveCompanyId(userId);
    const path = resolveWritePath({ userId, proposalId, companyId });

    const { error: upErr } = await supabase.storage
      .from(PDF_BUCKET)
      .upload(path, blob, { upsert: true, contentType: 'application/pdf' });
    if (upErr) {
      logger.error('Falha upload PDF cache:', upErr);
      return;
    }

    await supabase
      .from('proposal_pdf_cache')
      .upsert({
        proposal_id: proposalId,
        user_id: userId,
        company_id: companyId,
        storage_path: path,
        content_hash: `${proposalId}-${Date.now()}`,
        filename,
      });
  } catch (e) {
    logger.error('Erro salvando cache PDF:', e);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function runGeneratePdf({ filename, landscape = false, element, proposalId, forceRegenerate = false }: PdfGenerateOptions): Promise<void> {
  try {
    if (proposalId && !forceRegenerate) {
      const cached = await tryGetCachedPdf(proposalId);
      if (cached) {
        downloadBlob(cached, filename);
        return;
      }
    }
    const html = await renderToHtmlString(element);
    const blob = await callGeneratePdfEdge(html, filename, landscape);
    downloadBlob(blob, filename);
    if (proposalId) {
      // Fire-and-forget: não bloqueia o usuário.
      void savePdfToCache(proposalId, blob, filename);
    }
  } catch (err) {
    logger.error('Erro ao gerar PDF:', err);
    throw err;
  }
}

export async function generatePdfFromElement(opts: PdfGenerateOptions): Promise<void> {
  // Mutex per proposal: prevents double-submit if the user clicks twice while
  // the first generation is in flight. No-op for ad-hoc PDFs (no proposalId).
  const key = opts.proposalId ? `gen:${opts.proposalId}` : `gen:adhoc:${Date.now()}-${Math.random()}`;
  return withProposalMutex(key, () => runGeneratePdf(opts));
}

async function runSharePdf(options: PdfGenerateOptions): Promise<void> {
  let blob: Blob | null = null;
  if (options.proposalId && !options.forceRegenerate) {
    blob = await tryGetCachedPdf(options.proposalId);
  }
  if (!blob) {
    const html = await renderToHtmlString(options.element);
    blob = await callGeneratePdfEdge(html, options.filename, options.landscape ?? false);
    if (options.proposalId) {
      void savePdfToCache(options.proposalId, blob, options.filename);
    }
  }
  const file = new File([blob], options.filename, { type: 'application/pdf' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: options.filename, files: [file] });
  } else {
    downloadBlob(blob, options.filename);
  }
}

export async function sharePdfFromElement(opts: PdfGenerateOptions): Promise<void> {
  const key = opts.proposalId ? `share:${opts.proposalId}` : `share:adhoc:${Date.now()}-${Math.random()}`;
  return withProposalMutex(key, () => runSharePdf(opts));
}
