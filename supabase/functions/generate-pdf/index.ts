// Edge function: gera PDF via Browserless.io (Chromium headless gerenciado).
// Resiliência: retry exponencial + fallback de região (SFO → LON).
// Segurança: JavaScript DESLIGADO no Chromium (zero risco de XSS server-side
// vindo do HTML serializado pelo cliente) + cap de 8MB.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';
import { z } from 'https://esm.sh/zod@3.23.8';
import { checkRateLimit } from './_lib/rateLimit.ts';
import { authenticateRequest } from './_lib/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MarginSchema = z.object({
  top: z.string().max(20).optional(),
  right: z.string().max(20).optional(),
  bottom: z.string().max(20).optional(),
  left: z.string().max(20).optional(),
}).strict();

const GeneratePdfSchema = z.object({
  html: z.string().min(1).max(500_000),
  css: z.string().max(100_000).optional(),
  filename: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[\w\-. ]+$/, 'filename inválido — apenas letras, números, hífen, ponto e espaço')
    .refine((f) => !f.includes('..'), 'path traversal não permitido')
    .optional(),
  landscape: z.boolean().optional(),
  format: z.enum(['A4', 'Letter']).optional(),
  margin: MarginSchema.optional(),
  printBackground: z.boolean().optional(),
  preferCSSPageSize: z.boolean().optional(),
}).strict();

type PdfRequest = z.infer<typeof GeneratePdfSchema>;

// Endpoints Browserless: primário SFO, fallback LON.
const BROWSERLESS_ENDPOINTS = [
  'https://production-sfo.browserless.io/pdf',
  'https://production-lon.browserless.io/pdf',
];

const MAX_HTML_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 45_000;

function sanitizeHtml(html: string): string {
  // O HTML é gerado pelo próprio frontend autenticado (não vem de input externo),
  // mas removemos vetores óbvios como defesa em profundidade. Como JS já está
  // desligado no Chromium, isto é cinto + suspensório.
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

async function callBrowserless(
  endpoint: string,
  apiKey: string,
  payload: unknown,
): Promise<Response> {
  const url = `${endpoint}?token=${encodeURIComponent(apiKey)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // AuthN canônica: getUser() (assinatura+expiração via Auth server).
    // Substitui getClaims() (decode local) — elimina aceitar JWT expirado.
    const auth = await authenticateRequest(req);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = auth.userId;

    // In-memory burst limit (defense in depth): 5 PDFs/min/user.
    // Protege contra spikes que abusam do Browserless antes do limite horário pegar.
    if (!checkRateLimit(`pdf:${userId}`, { windowMs: 60_000, max: 5 })) {
      return new Response(
        JSON.stringify({
          error: 'rate_limited',
          message: 'Máximo 5 PDFs por minuto. Aguarde um instante.',
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' },
        },
      );
    }



    // ─── Rate limit: 30 PDFs / usuário / hora ────────────────────────
    // Implementação ad-hoc (sem infra dedicada): conta eventos
    // 'pdf_generation_attempt' do próprio usuário na última hora via
    // service-role (bypass RLS). Bloqueia em 429 se atingir o teto e
    // registra 'pdf_generation_blocked' para auditoria/custo.
    const PDF_RATE_LIMIT_PER_HOUR = 30;
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount, error: countErr } = await admin
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_name', 'pdf_generation_attempt')
      .gte('created_at', sinceIso);

    if (countErr) {
      console.error('[generate-pdf] rate limit count failed', countErr);
      // Em caso de falha no contador, segue (não bloqueia o usuário por bug).
    } else if ((recentCount ?? 0) >= PDF_RATE_LIMIT_PER_HOUR) {
      await admin.from('analytics_events').insert({
        user_id: userId,
        event_name: 'pdf_generation_blocked',
        event_data: { limit: PDF_RATE_LIMIT_PER_HOUR, window_minutes: 60, count: recentCount },
      });
      console.warn('[generate-pdf] rate limit hit', { userId, count: recentCount });
      return new Response(
        JSON.stringify({
          error: 'rate_limited',
          message: 'Você atingiu o limite de geração de PDFs. Tente novamente em alguns minutos.',
          limit: PDF_RATE_LIMIT_PER_HOUR,
          window_minutes: 60,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': '600',
          },
        },
      );
    }

    // Registra a tentativa (antes do call ao Browserless — conta inclusive
    // quando o upstream falha, evitando looping infinito de retry do cliente).
    await admin.from('analytics_events').insert({
      user_id: userId,
      event_name: 'pdf_generation_attempt',
      event_data: { window_count: (recentCount ?? 0) + 1 },
    });

    const apiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'BROWSERLESS_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const rawBody = await req.json().catch(() => null);
    const parsed = GeneratePdfSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request body',
          details: parsed.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }
    const body: PdfRequest = parsed.data;
    if (body.html.length > MAX_HTML_BYTES) {
      return new Response(JSON.stringify({ error: 'html too large (max 8MB)' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const safeHtml = sanitizeHtml(body.html);

    const browserlessPayload = {
      html: safeHtml,
      options: {
        format: body.format ?? 'A4',
        landscape: body.landscape ?? false,
        printBackground: body.printBackground ?? true,
        preferCSSPageSize: body.preferCSSPageSize ?? false,
        margin: body.margin ?? { top: '0', right: '0', bottom: '0', left: '0' },
        displayHeaderFooter: false,
      },
      // 'load' é mais robusto que networkidle0 (não trava em assets lentos);
      // Recharts já está renderizado no HTML serializado pelo cliente (SVG).
      gotoOptions: { waitUntil: 'load', timeout: 25_000 },
      // SEGURANÇA: desliga JavaScript no Chromium. O documento que enviamos
      // já é estático (SSR-like) — não precisa executar nada.
      setJavaScriptEnabled: false,
    };

    // Retry: tenta cada endpoint em ordem; até 2 tentativas por endpoint.
    const errors: string[] = [];
    for (const endpoint of BROWSERLESS_ENDPOINTS) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const upstream = await callBrowserless(endpoint, apiKey, browserlessPayload);
          if (upstream.ok) {
            const pdfBuf = await upstream.arrayBuffer();
            const filename = (body.filename ?? 'documento.pdf').replace(/[^\w.\-]/g, '_');
            return new Response(pdfBuf, {
              status: 200,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': String(pdfBuf.byteLength),
                'Cache-Control': 'no-store',
                'Pragma': 'no-cache',
                'X-Pdf-Source': endpoint.includes('sfo') ? 'primary' : 'fallback',
              },
            });
          }
          const errText = await upstream.text();
          errors.push(`${endpoint} attempt ${attempt}: HTTP ${upstream.status} ${errText.slice(0, 200)}`);
          // Backoff exponencial entre tentativas no mesmo endpoint.
          if (attempt === 1) await new Promise((r) => setTimeout(r, 500));
        } catch (e) {
          errors.push(`${endpoint} attempt ${attempt}: ${(e as Error).message}`);
          if (attempt === 1) await new Promise((r) => setTimeout(r, 500));
        }
      }
    }

    // Onda 2: não vazar detalhes de upstream/endpoints para o cliente.
    console.error('[generate-pdf] all endpoints failed', errors);
    return new Response(
      JSON.stringify({ error: 'Falha ao gerar PDF.' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    console.error('[generate-pdf] error', e);
    return new Response(JSON.stringify({ error: 'PDF generation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
