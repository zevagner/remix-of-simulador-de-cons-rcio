# Current Enterprise Runtime & Governance Inventory

> **Escopo.** Levantamento técnico factual do que está IMPLEMENTADO hoje, baseado em código real
> (`src/`, `supabase/functions/`, `supabase/config.toml`, `.lovable/governance/subprocessors.md`,
> schema do banco e RPCs). Sem marketing, sem roadmap implícito. Roadmap consta em seção própria.
>
> Data: 2026-05-19 · Cross-check: code search + DB schema + subprocessor inventory.

---

## 1. Hosting & Infrastructure

| Camada | Realidade atual |
|---|---|
| Frontend (SPA Vite/React) | Hospedado na plataforma Lovable (CDN gerenciada pelo provedor de hosting do dev-server). Domínios ativos: `simuladordeconsorciocaixa.lovable.app`, `simuladordeconsorcio.seg.br`, `www.simuladordeconsorcio.seg.br`. |
| Backend (DB + Auth + Storage + Edge Functions) | **Lovable Cloud** (Supabase gerenciado). Projeto ref `oalcuxpcmwhizmdqwcmu`. |
| Região Supabase | **US** (primário). Confirmado em `.lovable/governance/subprocessors.md`. |
| Renderização de PDF | **Browserless.io** — endpoint primário `production-sfo.browserless.io`, fallback `production-lon.browserless.io` (ver `supabase/functions/generate-pdf/index.ts`). |
| IA generativa | **Lovable AI Gateway** (roteia OpenAI/Google). Sem chamada direta a OpenAI/Google a partir do projeto. |
| Multi-tenant | **Sim, lógico.** Isolamento por `company_id` + RLS (não é tenant dedicado por infra). |
| Ambiente dedicado | **Não.** Single-tenant infra compartilhada Lovable Cloud. |

**O que NÃO existe:** instância Supabase self-hosted, cluster Kubernetes próprio, região EU dedicada,
VPC peering, hosting on-prem.

---

## 2. Database & Tenant Isolation

| Item | Estado |
|---|---|
| Banco | **PostgreSQL gerenciado pelo Supabase**. |
| RLS | **Ativo em todas as tabelas operacionais** (`proposals`, `post_sale_clients`, `post_sale_events`, `proposal_events`, `analytics_events`, `audit_logs`, `community_*`, `assemblies_*`, `proposal_pdf_cache`, etc.). |
| Isolamento por usuário | `auth.uid() = user_id` em policies; security-definer helpers `has_role`, `is_approved`. |
| Isolamento organizacional | Coluna `company_id` em ~9 tabelas operacionais + helpers `current_company_id()`, `current_company_ids()`, `is_company_member()`, `is_company_admin()`. Backfill via trigger `set_company_id_from_profile`. |
| Workspace pessoal | `handle_new_user()` cria automaticamente `companies` + `company_users` (role `owner`) por usuário novo. |
| Privilege escalation | Bloqueado por trigger `prevent_profile_self_approval` (somente admin altera `approved`). |
| Audit trail no DB | Triggers `log_proposal_*`, `log_post_sale_*` populam `proposal_events`/`post_sale_events` automaticamente. |

**O que NÃO existe:** sharding manual, schema-per-tenant, row-level encryption no Postgres,
réplicas read-only configuradas pelo app, pgvector (não usado para IA).

---

## 3. Authentication & Login Security

| Método | Estado |
|---|---|
| Email + senha | **Ativo** (`src/services/auth.ts` → `supabase.auth.signInWithPassword`). |
| Validação de domínio | **Sim** (`isAllowedEmail`, `DOMAIN_ERROR_SIGNUP`). |
| Magic link / OTP | **Não implementado** (sem `signInWithOtp` no código). |
| OAuth (Google, etc.) | **Não implementado** (sem `signInWithOAuth`). |
| MFA / TOTP | **Não implementado** (sem `mfa.enroll`/`mfa.challenge`). |
| SSO / SAML | **Não implementado** (sem `configure_saml_sso` chamado). |
| HIBP / leaked password check | **Tratamento de erro pronto** (`translateAuthError` reconhece `pwned`/`compromised`/`breach`), mas a feature precisa ser **ativada no painel de auth** (`password_hibp_enabled`). Não há confirmação de que esteja ativa em produção. |
| Senha — armazenamento | Gerenciado pelo Supabase Auth (bcrypt + salt; padrão GoTrue). Nunca persistida pelo app. |
| Rate limiting | **Sim, em edges IA**: `checkRateLimit` por `user_id` (fallback IP) em `_shared-edges/rateLimit.ts`. Login depende do rate limit nativo do Supabase Auth. |
| Session governance | `useAuth.tsx` com `onAuthStateChange`; cache `react-query` por tenant é purgado em `SIGNED_OUT` e em troca de `user.id` (M3-D cache bust). Aprovação revalidada em login + `getSession` inicial. Bloqueio admin (`approved=false`) força `signOut` imediato. |
| JWT verify em edges | Configurado por função no Supabase (várias com `verify_jwt = false` para callbacks; `generate-pdf` valida bearer manualmente via `auth.getClaims`). |

**O que NÃO existe:** MFA, SSO/SAML, OAuth providers, magic link, device fingerprinting, IP allowlist por tenant.

---

## 4. AI Governance

| Dimensão | Estado |
|---|---|
| Provedor | **Lovable AI Gateway** (`https://ai.gateway.lovable.dev`). Sem chave direta OpenAI/Google no projeto. |
| Modelos em uso | `openai/gpt-5.2` (sales-copilot), `google/gemini-*` em outras edges (ver `_shared-edges/`). |
| Gateway único | **Sim.** Todas as 13+ edges IA passam pelo gateway. Sem fetch direto. |
| PII Masking | **Sim, server-side**, em `_shared-edges/piiMask.ts` (`[CLIENTE]`, `[EMAIL]`, `[CPF]`, `[PHONE]`, `[id:…]`). Regra global `GLOBAL_PII_RULE` injetada no system prompt. |
| Prompt fragments padronizados | `_shared-edges/promptFragments.ts` (CONSULTATIVE_TONE, TRUST, OBJECTION, URGENCY, CSAA, STRICT_NO_PROMISE). |
| Retenção de prompts | **Sem armazenamento próprio.** Gateway Lovable: política do provedor (sem treinamento). |
| Telemetria IA | `analytics_events` com `event_name='ai_call'` (módulo no `event_data`); cache stats em `aiResponseCache` (tenant-aware via `companyId`). Painel Admin → Performance IA. |
| Disclaimer "nunca prometer garantia" | Injetado em todos os system prompts via `STRICT_NO_PROMISE_PROMPT`. |
| Subprocessor IA documentado | **Sim**, em `.lovable/governance/subprocessors.md` (linha 3). |

**O que NÃO existe:** HITL (human-in-the-loop) review queue, BYOK (bring-your-own-key) por tenant,
fine-tuning próprio, logging integral de prompts em DB próprio.

---

## 5. Data Collection & Persistence

| Campo | Persistência | Tabela / Origem |
|---|---|---|
| Nome do consultor | Persistido | `profiles.nome` |
| Email do consultor | Persistido | `auth.users.email` (gerenciado por Supabase Auth) |
| Nome do cliente final | Persistido | `proposals.client_name`, `post_sale_clients.client_name` |
| Telefone do cliente | Persistido | `proposals.client_phone`, `post_sale_clients.client_phone` |
| CPF do cliente | **Não coletado.** Sem coluna `cpf` em proposals/post_sale_clients. |
| Renda | **Não coletado.** |
| Patrimônio (valores) | Apenas em contexto de simulação (parâmetros de carta de crédito, lance, etc.) — não é "patrimônio do cliente" cadastrado. Vive em estado de UI + simulação serializada quando vira proposta. |
| Endereço | **Não coletado.** |
| Documentos digitalizados (RG/CNH/comprovantes) | **Não coletado, não há upload de docs do cliente.** |
| Conteúdo de simulação | Persistido em `proposals` (valor de crédito, prazo, parcela, tipo, lance, grupo, etc.). |
| Eventos de pipeline | Persistidos via triggers em `proposal_events` / `post_sale_events`. |
| Analytics de uso | `analytics_events` (180d retention). |
| Audit log admin | `audit_logs` (365d retention). |
| PDF da proposta | Persistido em storage privado + `proposal_pdf_cache` (90d retention). |

**Transitório (não persistido):** prompts enviados à IA (após mascaramento), HTML serializado enviado ao Browserless, exports gerados por `data-export` (signed URL 24h, nada salvo server-side).

---

## 6. Upload Security

| Item | Estado |
|---|---|
| Superfícies de upload | **Apenas uma:** importação XLSX de assembleias por admin (`AdminAssembliesIngestion` + `ExcelFileImport`). |
| Quem pode subir | **Somente admin** (gate por role; rota `/admin`). |
| Público vs autenticado | **Autenticado + admin.** Não há upload público. |
| MIME / extensão | Validação de extensão `.xlsx`/`.xls` no cliente + `accept=".xlsx,.xls"` no input. |
| Magic-byte sniffing | **Não implementado.** Considerado overengineering pela superfície minúscula (auditoria Wave 40). |
| Antivírus / malware scan | **Não implementado.** |
| Limite de tamanho | Validação no edge `assemblies-import` (parser server-side); HTML do PDF tem cap explícito de 8 MB. Sem limite global de upload de XLSX documentado em código. |
| Armazenamento | **Não vai para storage.** O XLSX é parseado no edge (`assemblies-import` modo `parse`) e o conteúdo normalizado vai para `groups` + `assembly_results` + snapshot em `assembly_imports`. O arquivo bruto não é persistido. |

**O que NÃO existe:** upload de documentos do cliente final, upload de avatar, upload de logo por tenant,
DLP scanning, quarantine bucket.

---

## 7. PDF & Export Governance

| Item | Estado |
|---|---|
| Persistência de PDF | **Sim**, bucket `proposal-pdfs` (**privado**) + tabela `proposal_pdf_cache`. |
| Bucket público? | **Não.** Bucket marcado `Is Public: No`. |
| Signed URLs | **Sim**, gerados sob demanda (`createSignedUrl` em `data-export`). |
| Expiração | TTL via `SIGNED_TTL_SECONDS` no edge `data-export`; PDFs e cache purgados aos **90 dias** por `data-retention-purge`. |
| Revoke explícito | Trigger `invalidate_pdf_cache_on_proposal_change` apaga o cache (e portanto força regenerar/signar) quando a proposta muda. |
| Watermark | **Não implementado.** |
| Renderização | Browserless.io com **JavaScript desligado** no Chromium (defesa em profundidade contra XSS server-side) + sanitização de `<script>`/`on*=`/`javascript:` no HTML. Cap 8 MB. |
| Auth do edge | Bearer obrigatório; valida `auth.getClaims` antes de chamar o Browserless. |
| Exports de dados (LGPD Art. 18) | Edge `data-export` gera links assinados 24h; **nunca persiste o artefato** server-side. Edge `account-purge` para exclusão. |

---

## 8. Encryption & Secrets

| Item | Estado |
|---|---|
| TLS em trânsito | **Sim** — Supabase, Browserless e Lovable AI Gateway todos HTTPS. |
| Criptografia at-rest | Padrão da plataforma Supabase (AES-256 gerenciado pelo provedor). |
| Tokens temporários | JWT do Supabase Auth (refresh automático); signed URLs de storage com TTL. |
| Signed URLs | **Sim** (`createSignedUrl`). |
| Criptografia própria de campo | **Não implementado.** Sem `pgsodium`/`pgcrypto` em uso pelo app. |
| Vault / KMS próprio | **Não implementado.** Segredos vivem em Supabase Secrets (`BROWSERLESS_API_KEY`, `LOVABLE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc.). |
| Rotação de segredos | Manual via painel Lovable Cloud; `LOVABLE_API_KEY` rotacionável por tool dedicada. Sem cron de rotação automática. |

---

## 9. External Integrations

### Implementado (todos com tráfego real em produção)

| Provedor | Finalidade | Onde está no código |
|---|---|---|
| **Supabase / Lovable Cloud** | DB, Auth, Storage, Edge Functions | `@/integrations/supabase/client`, `supabase/functions/*` |
| **Browserless.io** | Render headless de PDF | `supabase/functions/generate-pdf/index.ts` |
| **Lovable AI Gateway** | IA (OpenAI/Google roteado) | 13+ edges em `supabase/functions/` |
| **Sentry (opcional / opt-in)** | Error tracking + Web Vitals breadcrumbs | `src/lib/webVitals.ts`, `src/lib/logSanitizer.ts` (ativa só se DSN configurado) |
| **Hosting CDN do dev-server** | Entrega estática | Infra Lovable |

### Não implementado (referidos em copy mas sem código de integração)

- **WhatsApp Business API** — templates de mensagem existem (`whatsapp templates lookup`), mas o envio acontece via `wa.me` link, sem integração programática.
- **CRMs externos** (HubSpot, Salesforce, Pipedrive) — nenhum cliente/SDK no projeto.
- **Google Workspace / Calendar API** — não há OAuth Google configurado.
- **Webhooks de terceiros** — não há receiver/sender de webhooks externos.
- **SIEM / log aggregator** (Splunk, Datadog) — não conectado.
- **APM** além de Sentry opt-in — `runtimeMetrics.ts` é local-only.

---

## 10. Governance & LGPD

| Item | Estado |
|---|---|
| Trust Center público | **Sim** — `src/pages/TrustCenterPage.tsx`. |
| Política de Privacidade | **Sim** — `src/pages/PrivacyPolicyPage.tsx`. |
| Termos de Uso | **Sim** — `src/pages/TermsPage.tsx`. |
| Subprocessor inventory | **Sim** — `.lovable/governance/subprocessors.md` (5 provedores listados, sincronizado com `/privacidade`). |
| Retenção documentada | **Sim** — TTL frozen: PDFs 90d, analytics 180d, audit 365d. Implementado em `data-retention-purge`. |
| Execução do purge | Edge existe e é idempotente. Agendamento via `pg_cron` é responsabilidade do operador (a confirmar em produção — flag aberta em `enterprise-security-lgpd-saas-risk-maturity-audit.md`). |
| Exclusão de conta (Art. 18) | **Sim** — edge `account-purge`. |
| Exportação de dados (Art. 18) | **Sim** — edge `data-export` (links assinados 24h). |
| Audit trail | **Sim** — `audit_logs` + `admin_logs` + triggers automáticos em proposals/post_sale. |
| Anti-XSS governance | ESLint `no-restricted-syntax: error` + CI gate `scripts/ci/anti-xss-gate.mjs` + renderer único `SafeNarrative`. |
| Observabilidade governada | `runtimeMetrics.ts` (zero-PII, opt-in), Web Vitals + Sentry breadcrumbs sanitizados (`logSanitizer.ts`). |
| Consent governance | `src/lib/consent.ts` presente (cookies/analytics). |
| Policy Hub / Governance UI | `src/data/governance/sections/` + aba admin Governance Expansion. |

---

## 11. Enterprise Roadmap

### Já existe (produção)

- Multi-tenant lógico (`company_id` + RLS).
- Trust Center, política LGPD, subprocessor inventory.
- Retention engine determinística (idempotente).
- Audit logs + audit trail automático.
- Anti-XSS hardening (lint + CI gate + renderer).
- Edges com PII masking, rate limit, prompt fragments padronizados.
- Exclusão/exportação Art. 18 funcionais.
- Bucket de PDF privado + signed URLs + cache invalidation.

### Parcialmente pronto

- **HIBP / leaked password check** — tratamento de erro existe, ativação no painel a confirmar.
- **Retention purge cron** — edge pronta, agendamento `pg_cron` precisa de confirmação em produção.
- **Sentry** — código condicional, depende de DSN configurado por ambiente.
- **Tenant-aware cache de IA** — implementado em código, exige `companyId` em todos os call sites (memory `mem://aiCache/tenant` reforça regra).

### Roadmap (não implementado)

- **MFA / TOTP** — não existe (`mfa.enroll` ausente do código).
- **SSO / SAML** — não configurado (`configure_saml_sso` nunca chamado).
- **OAuth providers** (Google, Microsoft) — não configurado.
- **Magic link / OTP** — não implementado.
- **Malware scanning de uploads** — não existe (e superfície é mínima: só XLSX admin).
- **Magic-byte sniffing** — não implementado (overengineering pela superfície atual).
- **SIEM / log shipping externo** — não conectado.
- **Tenant dedicado por infra** — não disponível (single Supabase compartilhado).
- **Pentest formal** — não há relatório no repositório.
- **DPA assinado por cliente B2B** — não há fluxo automatizado.
- **Automation de rotação de segredos** — manual.
- **Watermark de PDF por consultor/cliente** — não implementado.
- **DLP** — não implementado.
- **HITL para IA** — não implementado.
- **BYOK por tenant** — não implementado.
- **Region pinning EU** — não disponível (Supabase US fixo).

---

## Final Technical Reality Check

**Postura honesta:**

1. **Infra B2B SaaS padrão:** Supabase US gerenciado, sem nada self-hosted, sem nada dedicado.
2. **Multi-tenant lógico maduro:** RLS + `company_id` + helpers definer estão consistentes.
   Não é tenant dedicado, mas o isolamento por policies é real e testado.
3. **Auth no básico funcional:** email/senha + aprovação manual + role admin/user. Sem MFA, sem SSO,
   sem OAuth. Tratamento de HIBP existe no client mas a chave do painel precisa estar ligada.
4. **IA bem governada para a superfície atual:** gateway único, masking server-side, rate-limit por
   user, telemetria local; sem treinamento; subprocessor declarado.
5. **Coleta de PII enxuta e deliberada:** nome + telefone do cliente final. **Sem CPF, sem renda,
   sem endereço, sem documentos.** Isto é vantagem regulatória, não lacuna.
6. **Uploads quase inexistentes:** apenas XLSX de assembleias por admin. Não há upload do cliente
   final em lugar algum. Magic-byte/AV ausentes são proporcionais à superfície.
7. **PDFs e exports corretos no essencial:** bucket privado, signed URL, TTL 90d, purge engine
   pronta. Falta confirmação operacional de `pg_cron`.
8. **Governança documental sólida:** Trust Center, política, subprocessors, retention contract,
   audit trail, anti-XSS com CI gate. Maturidade real, não cosmética.
9. **Gaps reais (não teatrais):** MFA, SSO/SAML, ativação HIBP, confirmação de cron de retenção.
   Tudo o mais que falta (SIEM, BYOK, HSM, pentest, tenant dedicado) é roadmap enterprise legítimo
   sem trigger comercial ativo.

**Risco residual dominante:** confirmar execução real do `data-retention-purge` em `pg_cron` e
ativar HIBP no painel de auth. São as duas únicas pontas com gap entre "código pronto" e
"comportamento em produção".

**Não há, hoje:** infra dedicada, MFA, SSO, OAuth, magic link, malware scan, watermark de PDF,
SIEM, DPA automatizado, rotação automática de segredos, coleta de CPF/renda/endereço/documentos.

---
*Relatório técnico — sem marketing, sem promessa, sem extrapolação. Fonte: código + schema + subprocessor inventory + edges deployadas no repositório em 2026-05-19.*
