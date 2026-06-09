import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { checkRateLimit } from "./_lib/rateLimit.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

// Resposta padronizada — não distingue admin / user comum / erro interno
// para eliminar enumeração de usuários e roles.
const OK = { ok: true }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // 1) AUTENTICAÇÃO — exige JWT válido (assinatura + expiração via Auth server)
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401)
  }
  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) {
    return json({ error: 'Unauthorized' }, 401)
  }

  // Cliente "como usuário" valida o token no Auth server
  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: userData, error: userErr } = await supabaseUser.auth.getUser(token)
  if (userErr || !userData?.user) {
    // JWT inválido, expirado, revogado, ou sessão inexistente
    return json({ error: 'Unauthorized' }, 401)
  }

  // 2) AUTORIZAÇÃO — sempre opera APENAS sobre o usuário autenticado.
  //    Body é IGNORADO. user_id vem exclusivamente do JWT verificado.
  const userId = userData.user.id

  // 3) Rate limit por user_id autenticado
  if (!checkRateLimit(`single-session:${userId}`, { windowMs: 60_000, max: 10 })) {
    return json({ error: 'Too many requests' }, 429)
  }

  // 4) Decisão interna sobre admin — NÃO vaza para o cliente
  try {
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    if (roleData?.role !== 'admin') {
      // Invalida outras sessões do próprio usuário autenticado
      const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(userId, 'others')
      if (signOutError) {
        console.error('[enforce-single-session] signOut error', {
          userId, at: new Date().toISOString(), msg: signOutError.message,
        })
        // Resposta neutra mesmo em erro interno — sem enumeração
        return json(OK, 200)
      }
    }

    // 5) Auditoria mínima (sem PII além do user_id já autenticado)
    console.log('[enforce-single-session] ok', {
      userId,
      at: new Date().toISOString(),
      adminSkip: roleData?.role === 'admin',
    })

    return json(OK, 200)
  } catch (error) {
    console.error('[enforce-single-session] unexpected', {
      userId, at: new Date().toISOString(),
      msg: error instanceof Error ? error.message : String(error),
    })
    // Resposta neutra
    return json(OK, 200)
  }
})
