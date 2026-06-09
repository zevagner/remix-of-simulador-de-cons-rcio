# Full SaaS Security & Authorization Audit

**Data:** 2026-05-15
**Escopo:** Frontend (React/Vite) + Lovable Cloud (Supabase) + 17 Edge Functions + Storage + RLS multi-tenant
**Princípio:** segurança real e prática — sem compliance teórico.

---

## 0. Resumo Executivo

A plataforma apresenta **postura de segurança madura** para um SaaS consultivo financeiro. As fundações certas estão no lugar:

- ✅ RLS habilitado em **todas as 21 tabelas auditadas**, com escopo `user_id = auth.uid()` + isolamento por `company_id IN (current_company_ids())`.
- ✅ Roles em tabela separada (`user_roles`) — **zero risco de privilege escalation via UPDATE em profiles** (memória `mem://security/database/privilege-escalation-protection`).
- ✅ Anti-XSS institucionalizado: ESLint `no-restricted-syntax: error` + CI gate + renderer único `SafeNarrative` (`mem://security/anti-xss-governance`).
- ✅ Edge Functions validam JWT via `getClaims()`/`getUser()` em todos os endpoints autenticados.
- ✅ Validação Zod + rate limit por `user_id` (com fallback IP) padronizados em `_shared-edges/`.
- ✅ Service-role key **nunca** referenciada no client; usada apenas em edges para bypass RLS controlado.
- ✅ PDFs em bucket privado (`proposal-pdfs`, public=false) com download server-side.

**Vulnerabilidades críticas ou altas: nenhuma identificada.** As 65 issues do scanner são todas **WARN** sobre `SECURITY DEFINER` callable — **falsos positivos contextuais** (ver §6).

**Score global: 8.6 / 10** — produção-ready com 3 hardenings recomendados (§9).

---

## 1. Autenticação (Fase 1)

| Item | Status | Notas |
|------|--------|-------|
| Login/Signup (email+senha) | ✅ | `useAuth` usa `onAuthStateChange` antes de `getSession()` |
| Reset password | ✅ | `/reset-password` page existe; `resetPasswordForEmail` com `redirectTo` |
| Auto-confirm signup | ✅ off | Usuários verificam e-mail; aprovação manual via `profiles.approved` |
| Refresh token / persistência | ✅ | Gerenciado pelo SDK; storage = `localStorage` (padrão Supabase) |
| Logout | ✅ | `supabase.auth.signOut()` limpa sessão |
| Session fixation | ✅ | Tokens rotacionados pelo SDK; `aud`/`exp` validados via `getClaims()` server-side |
| Trigger `prevent_profile_self_approval` | ✅ | RAISE EXCEPTION se não-admin alterar `approved` |

**Recomendação leve:** habilitar **HIBP password check** (`configure_auth password_hibp_enabled: true`) — bloqueia senhas vazadas no signup. Esforço: 1 toggle.

---

## 2. Autorização & Roles (Fase 1.3)

| Item | Status |
|------|--------|
| Roles em tabela separada (`user_roles`) | ✅ |
| `has_role()` SECURITY DEFINER (anti-recursão RLS) | ✅ |
| RLS de `user_roles`: insert/update **AS RESTRICTIVE** + admin only | ✅ Audit: políticas com `Permissive: No` |
| Guards client-side (private routes) | ✅ `useAuth` + redirect; defense-in-depth — **autorização real é RLS** |
| Auto-aprovação por domínio (Caixa) | ✅ controlada por trigger; demais usuários ficam pendentes |

**Veredicto:** privilege escalation por client-side ou via API direta é bloqueado em camada DB. ✅

---

## 3. Multi-Tenant & RLS (Fase 2)

Auditadas 21 tabelas. Padrão dominante (proposals, post_sale_*, audit_logs, feedbacks, analytics_events, proposal_pdf_cache):

```sql
((SELECT auth.uid()) = user_id)
AND ((company_id IS NULL) OR (company_id IN (SELECT current_company_ids())))
```

| Tabela | Tenant isolation | Notas |
|--------|------------------|-------|
| proposals | ✅ user_id + company_id | Sem fallback admin (correto — admin é tenant-scoped, ver `mem://security/isolamento-dados-modulos-operacionais`) |
| post_sale_clients/bids/events | ✅ | Mesma policy; trigger herda `company_id` do parent |
| audit_logs / analytics_events / feedbacks | ✅ | Admin tem SELECT global (esperado para governança) |
| profiles | ✅ | User vê próprio; admin vê todos |
| companies / company_users | ✅ | Owner-only ALL; admin override |
| assemblies / groups / assembly_results | ⚠️ Read global p/ approved users | **Intencional** — dados institucionais compartilhados (consortium catalog). Sem PII. |
| community_* | ✅ | Múltiplas camadas: `is_approved()` + `community_user_level()` |

**IDOR (Insecure Direct Object Reference):** ❌ não-explorável. Toda tabela com PII tem `user_id = auth.uid()` no USING; trocar UUIDs no client retorna 0 rows.

**Bypass acidental:** nenhuma policy com `USING (true)` em tabela sensível. `is_approved()` + `has_role()` são SECURITY DEFINER com `search_path = public` (anti-search-path attack).

---

## 4. Edge Functions (Fase 3.9)

17 funções auditadas. Padrão consistente:

| Função | Auth | Validação | Rate Limit | CORS | Service Role |
|--------|------|-----------|------------|------|--------------|
| generate-pdf | ✅ getClaims | ✅ | ✅ 30/h por user | ✅ | controlado (rate-limit query) |
| generate-proposal | ✅ Bearer + RPC | ✅ Zod | ✅ shared | ✅ | — |
| share-proposal **GET** (público) | ⚪ por design | ✅ Zod token | ✅ 60/h por IP | ✅ + revoga origem | ✅ (read-only por token) |
| share-proposal POST | ✅ getClaims | ✅ | ✅ 15/h | ✅ | restrito |
| sales-copilot / sales-script / sales-response / phase-action / module-copilot / trigger-script / niche-storytelling / investment-storytelling / bid-recommendation | ✅ Bearer + RPC | ✅ Zod | ✅ shared | ✅ | — |
| create-user / delete-user / update-user-email | ✅ + has_role(admin) check | ✅ | ✅ | ✅ | ✅ admin-only |
| assemblies-import | ✅ + has_role(admin) | ✅ | ✅ | ✅ | ✅ admin-only |

**Pontos fortes:**
- `share-proposal` GET é **público intencional** mas com mitigantes corretos: token 256-bit (não enumerável), expiração + revogação, fields whitelist no SELECT, sem PII de telefone do consultor.
- Erros nunca vazam stack traces — `logEdgeError` interno + resposta genérica ao cliente.
- LOVABLE_API_KEY usado apenas server-side; client jamais o vê.

---

## 5. Inputs / XSS / Uploads (Fase 3.7-8)

| Vetor | Status |
|-------|--------|
| `dangerouslySetInnerHTML` | ✅ Banido por ESLint + CI gate; allowlist de 1 arquivo (`safeFormattedText` sanitized) |
| Markdown/AI narratives | ✅ Renderizadas via `SafeNarrative` (14 vetores XSS testados) |
| Validação cliente | ✅ Zod em formulários sensíveis |
| Validação servidor | ✅ Zod em todas edges |
| Uploads | ✅ Apenas via Storage SDK (`proposal-pdfs` privado); sem upload de imagem/binário do usuário final |
| URL params / WhatsApp | ✅ `encodeURIComponent` em utilities `whatsapp.ts` |

---

## 6. Linter findings (Supabase) — 65 WARN

**Todas são WARN, nenhuma ERROR.** Distribuição:

- **1×** Extension in public — `pg_trgm` (busca fuzzy community). Mover de schema é Supabase-managed; risco residual baixo.
- **~62×** "Public/Signed-In Users Can Execute SECURITY DEFINER Function" — funções RPC (`get_admin_*`, `list_proposals_page`, `community_*`, `has_role`, `is_approved`, etc.).

**Análise contextual:** estas funções são **intencionalmente expostas via PostgREST** porque:
1. Toda função admin começa com `IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION` — autorização é interna e à prova de falso.
2. `list_*_page` filtram por `auth.uid() = user_id` internamente — equivalente a RLS.
3. `has_role`/`is_approved` são utilitários necessários para RLS e precisam ser SECURITY DEFINER (mem `mem://infinite-recursion-in-rls`).

**Veredicto:** falsos positivos sob a postura atual. Documentar em security memory; não alterar.

---

## 7. Frontend Exposure (Fase 4)

| Item | Status |
|------|--------|
| Secrets hardcoded | ✅ Apenas `VITE_SUPABASE_PUBLISHABLE_KEY` (anon, esperado) |
| `localStorage`: 99 usos | ✅ Apenas UI state (sidebar, last tab, simulator session, sales goal). **Nenhum token, PII, ou role.** |
| `console.log` em produção | ✅ Substituídos por `logger` centralizado (apenas 1 log direto encontrado) |
| Source maps | ⚠️ Vite default — desabilitar em produção é boa prática (esforço: 1 linha em `vite.config.ts`) |
| CSP / HSTS / X-Frame-Options | ⚪ Não definidos em `index.html` — gerenciado por host (Lovable Cloud edge). Adicionar `<meta http-equiv="Content-Security-Policy">` daria defense-in-depth |
| `dangerouslySetInnerHTML` | ✅ Bloqueado |

---

## 8. Ataques simulados (Fase 5)

| Ataque | Resultado |
|--------|-----------|
| Trocar `user_id` no payload de INSERT/UPDATE em `proposals` | ❌ Bloqueado por RLS WITH CHECK |
| Chamar `get_admin_users_page` como user comum | ❌ RAISE EXCEPTION 'Acesso negado' |
| Reutilizar JWT expirado em edge | ❌ `getClaims()` rejeita |
| Enumeração de proposal IDs via API REST | ❌ RLS retorna 0 rows |
| Enumeração de share tokens | ❌ Token 256-bit não-adivinhável; rate limit 60/h |
| Brute-force login | ⚠️ Supabase Auth tem rate limiting interno; sem CAPTCHA. Aceitável p/ admin pool fechado. |
| CSRF em mutations | ✅ Mitigado por Bearer token (não cookie) |
| XSS via narrativa IA | ❌ SafeNarrative + 14 testes |
| Privilege escalation via UPDATE em `profiles.approved` | ❌ Trigger `prevent_profile_self_approval` |
| Privilege escalation via INSERT em `user_roles` | ❌ RESTRICTIVE policy admin-only |
| Acesso cruzado entre companies | ❌ `company_id IN (current_company_ids())` em todo write |
| Roubo de PDF de outro user via storage URL | ❌ Bucket privado; download via edge autenticada |

---

## 9. Top 3 Ações Recomendadas (impacto × esforço)

### 🥇 Habilitar HIBP password check
- **Impacto:** bloqueia senhas vazadas em breaches conhecidos.
- **Esforço:** 1 chamada `configure_auth({ password_hibp_enabled: true })`.
- **Risco operacional:** zero — afeta apenas signup/change-password.

### 🥈 Desabilitar source maps em produção
- **Impacto:** atacante não consegue reverter código com facilidade (defense-in-depth).
- **Esforço:** `build.sourcemap: false` em `vite.config.ts`.
- **Risco:** debugging em produção fica menos detalhado (mitigável com Sentry uploads privados).

### 🥉 Adicionar CSP meta tag
- **Impacto:** mais uma camada anti-XSS; restringe origens de script/connect.
- **Esforço:** ~10 min — `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'self' https://*.supabase.co https://*.lovable.app; ...">`.
- **Risco:** precisa testar com Browserless/Sentry endpoints.

---

## 10. Checklist por categoria

| Categoria | Score | Status |
|-----------|------:|--------|
| Auth Security | 9 / 10 | ✅ Falta HIBP |
| Authorization | 10 / 10 | ✅ |
| RLS Maturity | 9.5 / 10 | ✅ |
| Tenant Isolation | 10 / 10 | ✅ |
| Edge Function Security | 9.5 / 10 | ✅ |
| Frontend Exposure | 8 / 10 | ⚠️ Source maps + CSP |
| Runtime Safety (XSS) | 10 / 10 | ✅ |
| Operational Security | 9 / 10 | ✅ Audit logs em ações críticas |
| Attack Resilience | 9 / 10 | ✅ |
| **Overall posture** | **8.6 / 10** | **Production-ready** |

---

## 11. Vulnerabilidades por severidade

### Crítica
_Nenhuma._

### Alta
_Nenhuma._

### Média
_Nenhuma confirmada._

### Baixa (hardening)
1. **HIBP password check off** — facilita uso de senha vazada. Fix: 1 toggle.
2. **Source maps expostos** — facilita reverse engineering. Fix: vite config.
3. **Sem CSP meta** — defense-in-depth. Fix: 1 meta tag.

### Informacional
- Linter SUPA: 62× SECURITY DEFINER callable — falsos positivos (justificados em §6).
- `pg_trgm` em `public` — Supabase-managed, baixo risco.

---

## 12. O que NÃO mudar

- ❌ Não converter funções RPC para SECURITY INVOKER — quebraria o padrão anti-recursão de RLS.
- ❌ Não mover roles para `profiles` — `user_roles` separada é o padrão correto.
- ❌ Não adicionar OR `has_role(admin)` em RLS de `proposals`/`post_sale_*` — admin é tenant-scoped por design (`mem://security/isolamento-dados-modulos-operacionais`).
- ❌ Não restringir `share-proposal` GET por origem — é um link público intencional, mitigado por token + expiração + revogação + rate limit.

---

## 13. Conclusão

A plataforma demonstra arquitetura de segurança **deliberada e madura**: RLS profunda, separação de roles, anti-XSS institucionalizado, edges padronizadas com auth+zod+rate-limit, audit trail em ações críticas, multi-tenancy real. Os três hardenings sugeridos elevam a postura sem risco operacional. Não há ação corretiva urgente.

**Próxima onda recomendada:** implementar os 3 itens da §9 em uma única migração/PR enxuto.
