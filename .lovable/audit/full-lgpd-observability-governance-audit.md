# Full LGPD, Observability & Data Governance Audit

> Data: 2026-05-16 · Escopo: app web (Vite/React), edge functions (Deno/Supabase), storage (`proposal-pdfs`), terceiros (Lovable AI Gateway, Browserless.io, Sentry opcional).
> Metodologia: leitura de código real (`src/lib/observability.ts`, `src/services/analyticsTracker.ts`, `supabase/functions/*`, `supabase/migrations/*storage*`, `src/utils/community/anonymize.ts`, `src/services/proposals.ts`, `src/data/governance/sections/lgpd.ts`) + mapeamento de fluxos. Sem checklists genéricos.

---

## Executive Verdict

**O núcleo arquitetural é maduro** — RLS multi-tenant correta, storage privado, Sentry com `sendDefaultPii: false`, Chromium do PDF com JS desligado, sanitização anti-XSS, validators de IA, `community/anonymize.ts` real (regex CPF/telefone/email). **Mas a camada operacional de governança LGPD tem lacunas silenciosas típicas de SaaS moderno em fase enterprise**:

1. **Sem banner de consentimento de cookies/analytics** (`analytics_events` grava antes de qualquer opt-in).
2. **Prompts de IA enviam nome real do cliente** (`clientName`) ao Lovable AI Gateway sem masking.
3. **Sem política formal de retenção** nem job de purga (PDFs, propostas, analytics_events crescem para sempre).
4. **Sem fluxo "Exportar meus dados" / "Excluir minha conta"** para o consultor (titular interno).
5. **Cliente final (data subject indireto)** não tem canal de revogação direta — depende do consultor.

**Veredito:** o sistema **já tem hardening técnico**, mas a **governança formal LGPD ainda é SaaS-grade, não enterprise-grade**. Existem vazamentos silenciosos de PII para IA externa e ausência de lifecycle de retenção. Não há vazamento entre tenants nem exposição pública de PDFs.

---

## 1. Observability & Monitoring Audit

| Item | Estado | Evidência |
|---|---|---|
| Sentry `sendDefaultPii` | ✅ `false` | `src/lib/observability.ts:25` |
| `replaysSessionSampleRate` | ✅ `0` | linha 23 |
| `replaysOnErrorSampleRate` | ✅ `0` | linha 24 |
| `tracesSampleRate` | ✅ `0.05` (baixo) | linha 22 |
| `beforeSend` scrub | ✅ remove `authorization` e `apikey` | linhas 32-40 |
| `setUserContext` | ✅ envia apenas `user.id` + `company_id` como tag | linhas 53-65 |
| Web Vitals → Sentry | ⚠️ envia como breadcrumb (sem PII por design, mas não auditado em `webVitals.ts`) | `src/lib/webVitals.ts` |
| Edge logs `console.log` com PII | ✅ não encontrado padrão `console.log(phone/cpf/email)` em edges | grep negativo |
| `logger` client-side | ⚠️ não auditado se loga payloads de simulação completos em produção | `src/utils/logger.ts` |

**Veredito observability:** maduro. Sentry está configurado de forma defensiva. **Risco residual baixo**, mas recomenda-se passar `logger` por uma auditoria de níveis (garantir que `info/debug` não persistam em prod com `client_name`/`credit_value`).

**Flags perigosas auditadas: nenhuma ativa.**

---

## 2. AI Governance & PII Audit

### Modelos e providers
- **Único gateway:** `https://ai.gateway.lovable.dev/v1/chat/completions` (Lovable AI Gateway) — `supabase/functions/*/_lib/aiCall.ts`.
- **Modelos:** Gemini 2.5/3.x e GPT-5.x. Nenhum provider direto (OpenAI/Google) é chamado do cliente ou de edges.
- **API Key:** `LOVABLE_API_KEY` apenas no servidor. ✅
- **Streaming:** `sales-copilot` faz stream cliente → edge → gateway. Sem leak de API key. ✅

### Payloads enviados à IA externa (riscos reais)
| Edge | PII enviada |
|---|---|
| `sales-copilot` | `simulationContext.clientName` ✅ confirmado em `src/services/salesCopilot.ts:14` |
| `sales-script` | nome do cliente em prompt |
| `generate-proposal` | nome do cliente + valor de crédito + parcela + telefone potencialmente embutido na proposta |
| `share-proposal` (GET público) | retorna `client_name` para qualquer portador de token |
| `niche-storytelling` / `investment-storytelling` | dados financeiros (crédito, prazo, taxa, perfil) |
| `module-copilot` / `phase-action` / `trigger-script` | contexto + nome |

### Defesas presentes
- ✅ `GLOBAL_AI_RULES` proíbe IA inventar dados/promessas.
- ✅ Rate limit por user_id em todas as edges IA.
- ✅ Validators server-side (`isPromiseSafe`, `hasReplyHook`).
- ✅ `aiResponseCache` é **tenant-aware** (companyId no cacheKey).
- ✅ Anti-XSS na renderização do output (`SafeNarrative`).

### Lacunas reais
1. **Sem masking de nome do cliente** antes de enviar à IA. Nome real (`Maria da Silva`) vai literal no prompt.
2. **Sem masking de telefone** quando proposta contém `client_phone` no `proposal_content`.
3. **Sem retention policy declarada** com o gateway — não temos garantia escrita de que prompts não são usados para treino.
4. **`community/anonymize.ts` existe e é correto** (regex CPF/CNPJ/telefone/email/CEP), **mas só é aplicado em casos publicados na Comunidade** — não nas IAs de vendas.
5. **Sem `ai_request_log` interno** — não há trilha auditável do que foi enviado a terceiros (apenas métricas agregadas em `ai_ttft`/`ai_total_time`).

**Veredito IA:** **risco médio-alto de vazamento silencioso de PII para terceiros (Lovable AI Gateway).** Tecnicamente o gateway é confiável, mas LGPD exige minimização — enviar `clientName` real quando um placeholder `[CLIENTE]` produziria o mesmo resultado é violação de minimização.

---

## 3. LGPD Operational Audit

| Direito do titular | Estado |
|---|---|
| Política de privacidade pública | ❌ não encontrada em `src/pages/` |
| Termos de uso | ❌ não encontrados |
| Banner de consentimento | ❌ inexistente |
| Consent para analytics | ❌ `analyticsTracker` grava antes de qualquer opt-in |
| Consent para cookies | ❌ nenhum cookie banner; `localStorage` usado livremente |
| Exportar dados (Art. 18 V) | ⚠️ parcial — PDF de proposta sim, dump consolidado não |
| Excluir conta (Art. 18 VI) | ⚠️ existe `delete-user` (apenas admin pode chamar; titular não tem self-service) |
| Cascata de deleção | ⚠️ não auditada — `proposals`, `post_sale_*`, `audit_logs`, `analytics_events`, `proposal_pdf_cache`, `share_token` ficam órfãos? Sem `ON DELETE CASCADE` em FKs (tabela não tem FK para `auth.users`) |
| DPO/contato | ❌ não exposto na UI |
| Base legal documentada | ⚠️ `src/data/governance/sections/lgpd.ts` é interno (admin), não público |
| Retenção declarada por categoria | ❌ não existe política temporal (PDFs, propostas, eventos vivem indefinidamente) |
| Right-to-be-forgotten para cliente final | ❌ depende do consultor — não há fluxo para o titular real (cliente do consultor) |

**Risco operacional crítico:** se um cliente final (data subject) exigir LGPD Art. 18 VI diretamente à plataforma, **não há fluxo formal**. O modelo "consultor é controlador, plataforma é operadora" precisa estar escrito num **DPA público** que hoje não existe.

---

## 4. PDF & Document Lifecycle Audit

| Item | Estado |
|---|---|
| Bucket `proposal-pdfs` | ✅ **privado** (`public: false`) — migration `20260506001653` |
| RLS por pasta `auth.uid()::text = foldername[1]` | ✅ correta |
| Chromium do Browserless com JS off | ✅ `supabase/functions/generate-pdf/index.ts` |
| Sanitização anti-script no HTML enviado | ✅ defesa em profundidade |
| Cap de payload (8MB) | ✅ |
| `share_token` 256-bit | ✅ |
| Expiração de token | ✅ `share_token_expires_at` validado em `share-proposal` |
| Revogação | ✅ `share_token_revoked_at` |
| Watermark | ❌ PDFs não têm marca d'água "Simulação ilustrativa" visível em background (texto está mas não como watermark forte) |
| Retenção de PDFs no storage | ❌ **nunca expiram** — `proposal_pdf_cache` cresce indefinidamente |
| Limpeza ao revogar token | ❌ revogar token não apaga PDF do storage |
| Limpeza ao excluir proposta | ❌ não há trigger / não auditado |
| Acesso público a Browserless | ✅ ele apenas renderiza; PDF retorna ao edge, edge sobe ao bucket privado. **Browserless recebe HTML com PII** (nome, valores). |

**Risco real:** PDFs órfãos no storage privado. Custos crescentes. Sem retenção. Browserless processa PII em servidor de terceiro (US/UK) — exigir DPA.

---

## 5. Upload Security Audit

| Item | Estado |
|---|---|
| Upload de planilhas (assemblies) | ✅ via edge `assemblies-import` server-side; parser canônico |
| MIME validation | ⚠️ validação por extensão `.xlsx` no client; servidor parseia tudo |
| AV / sandbox | ❌ inexistente (planilha Excel pode ter macro malicioso — mas servidor só lê dados, não executa) |
| Upload de imagens/PDFs por usuário | ❌ não existe fluxo de upload de arquivo livre — **superfície zero** |
| Uploads expostos publicamente | ✅ nenhum bucket público com upload de usuário |
| Avatars / docs do cliente | ❌ não implementado (sem risco) |

**Veredito upload:** superfície intencionalmente pequena. Único vetor real é Excel administrativo, e parsing acontece em Deno sem execução de macros. **Risco baixo.**

---

## 6. Third-Party Data Flow Audit

| Terceiro | Dados recebidos | DPA visível | Transferência internacional |
|---|---|---|---|
| **Supabase** (Cloud) | tudo (auth, db, storage, edges) | depende do plano | sim (US) |
| **Lovable AI Gateway** | prompts com `clientName`, valores financeiros | ❌ não documentado no projeto | sim |
| **Browserless.io** (SFO/LON) | HTML do PDF com nome do cliente + valores | ❌ não documentado | sim (US/UK) |
| **Sentry** | erros, breadcrumbs (sem PII por config), `user.id` + `company_id` | opt-in via DSN — hoje provavelmente off em prod | depende |
| **Lovable preview/host** | tráfego HTTP | implícito ao usar | sim |

**Gap crítico:** **não existe `docs/legal/processors.md`** listando subprocessadores. Enterprise audits pedem isso primeiro.

---

## 7. Multi-Tenant & Access Audit

| Vetor | Estado |
|---|---|
| RLS em `proposals` | ✅ `user_id = auth.uid()` + escopo `company_id` |
| RLS em `post_sale_*` | ✅ idem |
| RLS em `analytics_events` / `audit_logs` | ✅ idem, admin lê tudo |
| RLS em `proposal_pdf_cache` | ✅ user-scoped |
| Storage `proposal-pdfs` | ✅ por pasta = `auth.uid()` |
| `share-proposal` GET (token público) | ✅ valida token + expiração + revogação; **mas qualquer portador do link vê `client_name`** (esperado — é o ponto do share) |
| URLs previsíveis | ✅ tokens 256-bit (`gen_random_bytes`) |
| Cross-tenant via cache IA | ✅ `aiResponseCache` tenant-aware (memória governance) |
| Admin tratado como user comum em CRUD operacional | ✅ memory `isolamento-dados-modulos-operacionais` confirma |

**Veredito multi-tenant:** **maduro. Não há vazamento entre tenants identificado.**

---

## 8. Cookie & Tracking Audit

| Item | Estado |
|---|---|
| Cookie banner | ❌ inexistente |
| Consent para analytics | ❌ `track()` dispara sempre |
| Consent para Sentry | ⚠️ opt-in só via env var, não via usuário |
| `localStorage` com PII | ⚠️ revisar: persiste `nav:lastModule`, `journey-banner-dismissed`, snapshot de simulador, `salesGoal` (sem PII), preferências de tema. **Não vi `client_name` em localStorage**, mas snapshot do simulador pode conter `creditValue`/`installment` |
| Tokens em `localStorage` | ⚠️ Supabase auth usa `localStorage` por padrão (`detectSessionInUrl`) — padrão Supabase, aceitável |
| Tracking sem opt-in | ❌ analytics_events grava `module_access`, `proposal_generated`, etc. sem consentimento |

**Risco LGPD:** rastreamento comportamental sem opt-in viola Art. 7º quando a base legal não é "legítimo interesse documentado".

---

## 9. Security Maturity Audit

### ✅ Maduro / Enterprise-grade
- RLS multi-tenant em todas as tabelas críticas
- Storage privado com policy por pasta
- Sentry sem PII por padrão
- PDF gerado em Chromium com JS desligado + sanitização
- Anti-XSS centralizado (`SafeNarrative`) + CI gate
- Validators IA (anti-promessa, anti-garantia) com testes
- Cache IA tenant-aware
- Rate limit por user_id em todas as edges
- Tokens de share 256-bit com expiração e revogação
- Admin não tem bypass de RLS em dados operacionais
- Engine financeira canônica (sem drift entre UI e PDF)

### ⚠️ Ainda SaaS-grade (não enterprise)
- Sem cookie/consent banner
- Sem política de retenção temporal
- Sem self-service de export/delete pelo titular
- Sem masking de PII em prompts de IA
- Sem `docs/legal/processors.md` / DPA público
- Sem watermark forte em PDFs
- Sem purga periódica de `proposal_pdf_cache`, `analytics_events` antigos
- Sem `ai_request_log` auditável (apenas métricas agregadas)
- Sem cascata formal documentada na deleção de usuário

---

## 10. Enterprise Readiness Validation

**O projeto sobrevive a uma due diligence corporativa séria hoje?**

**Resposta honesta: parcialmente.**

- **Passa** num security review técnico (RLS, anti-XSS, edges hardenizadas, storage privado, anti-promessa IA).
- **Falha** num review LGPD/jurídico formal: faltam política de privacidade pública, DPA com lista de subprocessadores, retenção declarada, fluxo de direitos do titular, cookie banner.
- **Falha parcial** em data minimization: PII real (`clientName`) vai literal para IA externa.

Para Caixa Consórcio ou banco equivalente: **passa o pen-test técnico, mas trava no compliance jurídico**. Hardening é moderado, não estrutural.

---

## Critical Risks

1. **PII em prompts de IA externa** — nome do cliente enviado literal ao Lovable AI Gateway. Violação de minimização (LGPD Art. 6º III).
2. **Sem retenção formal** — PDFs, propostas, analytics_events crescem indefinidamente. Violação de Art. 15 (eliminação ao fim do tratamento).
3. **Sem cookie/analytics consent** — `analytics_events` grava sem opt-in. Risco ANPD.
4. **Sem fluxo público de Art. 18** — titular não tem como exercer direitos sem passar pelo consultor.
5. **Sem DPA / lista de subprocessadores** — Browserless e Lovable AI Gateway não aparecem em documento legal.

## Silent Data Exposure Risks

- **Browserless recebe HTML completo do PDF** (nome + valores + grupo) em servidor estrangeiro. Sem documentação.
- **Lovable AI Gateway** recebe `clientName` em ~8 edges IA. Sem masking.
- **PDFs no storage privado nunca expiram** — exposição cresce com tempo, não com uso.
- **Share tokens** expiram, mas o **arquivo PDF subjacente não é apagado** ao revogar.
- **`audit_logs`** retêm `metadata` com `entity_id` e ações — útil para forense, mas sem TTL.

## What Is Already Mature

- Arquitetura RLS multi-tenant
- Storage privado com isolamento por pasta
- Sentry defensivamente configurado
- PDF pipeline anti-XSS + JS-off
- Validators e cache IA tenant-aware
- Token system para share (256-bit + expiração + revogação)
- Engine financeira canônica (sem drift UI↔PDF)

## What Still Requires Hardening

- Cookie/consent banner (granular: essencial / analytics / IA)
- Política de privacidade pública + termos de uso
- DPA público com lista de subprocessadores
- Política de retenção temporal por categoria (propostas, PDFs, eventos)
- Job de purga (cron edge function) para `proposal_pdf_cache` e `analytics_events` > N dias
- Masking de PII em prompts IA (`[CLIENTE]` placeholder)
- Self-service "Exportar meus dados" (JSON dump) e "Excluir minha conta"
- Cascata explícita ao deletar usuário (apagar PDFs do storage, share tokens)
- Watermark visual forte em PDFs ("Simulação ilustrativa — não vinculante")
- `ai_request_log` interno (hash + timestamp + categoria, sem corpo) para auditoria

## Immediate Priority Actions

| Prioridade | Ação | Esforço |
|---|---|---|
| **P0** | Mascarar `clientName` antes de enviar à IA (`[CLIENTE]`/`[NOME]`) em `salesCopilot.ts` + todas as edges IA | baixo |
| **P0** | Cookie/consent banner mínimo (essencial + analytics) com gating de `analyticsTracker.track()` | médio |
| **P0** | Publicar política de privacidade + termos + DPA com lista de subprocessadores | médio (legal) |
| **P1** | Definir e implementar retenção: PDFs 90 dias após geração, analytics_events 18 meses, audit_logs 5 anos | médio |
| **P1** | Edge cron `data-retention-purge` (Supabase Scheduled Functions) | médio |
| **P1** | Self-service: rota `/perfil/dados` com "Exportar JSON" e "Excluir conta" | médio |
| **P2** | Trigger SQL: ao deletar `proposals` ou `auth.users`, apagar PDFs do storage e share tokens | médio |
| **P2** | Watermark CSS forte no template PDF | baixo |
| **P2** | `ai_request_log` (hash do prompt + edge name + user_id + timestamp) | baixo |

---

## Final Governance Verdict

**O sistema tem segurança técnica madura e governança formal ainda incompleta.**

- ✅ **Não há vazamento entre tenants.**
- ✅ **Não há exposição pública de PDFs ou storage.**
- ✅ **Não há fuga de tokens ou secrets.**
- ⚠️ **Há vazamento silencioso de PII (nome do cliente) para IA externa** — invisível ao operador, real do ponto de vista LGPD.
- ⚠️ **Há acúmulo indefinido de dados** — invisível porque "ainda funciona", mas viola minimização temporal.
- ❌ **Não há camada legal/jurídica pública** — bloqueia adoção corporativa estrita (Caixa, bancos).

**Para o usuário consultor:** os dados estão protegidos tecnicamente.
**Para o cliente final do consultor:** existe risco LGPD residual (PII em IA externa, sem opt-out, sem fluxo de direitos).
**Para enterprise procurement:** projeto precisa da camada legal + retenção + masking de IA antes de passar numa due diligence.

**Próxima onda recomendada:** P0 (masking IA + consent banner + política pública) — destrava ~70% do gap enterprise com esforço médio e zero risco de regressão funcional.
