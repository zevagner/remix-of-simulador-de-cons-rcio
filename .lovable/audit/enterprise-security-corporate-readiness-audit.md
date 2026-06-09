# Enterprise Security & Corporate Readiness Audit

> Auditoria pré-resposta às perguntas da TI da Caixa Consórcio.
> Objetivo: separar **segurança real** de **percepção de segurança** antes de qualquer resposta formal a uma área de TI bancária.
> Escopo: Plataforma Patrimonial · Edição Consultiva (Lovable + Supabase/Lovable Cloud + Browserless + Lovable AI Gateway).
> Data: 2026-05-16. Versão app: v2.4.0.

---

## Executive Verdict

**O projeto NÃO é, hoje, absorvível tal como está por uma TI bancária da Caixa.**

Tecnicamente o produto é maduro (engine financeira blindada, RLS multi-tenant, anti-XSS, governança, observabilidade). Mas o sistema vive em **infraestrutura de SaaS público (Lovable Cloud / Supabase gerenciado / Browserless / Lovable AI Gateway)** e expõe vetores que área de TI corporativa de banco não aceita sem contrato: dados em provedor terceiro, IA externa sem DPA assinado, ausência de SSO corporativo, ausência de antivírus em upload, ausência de WAF/segregação de rede, ausência de pentest formal e ausência de relatório SOC 2 / ISO 27001 emitido em nome do produto.

Classificação: **"funcionalmente enterprise, infraestruturalmente SaaS público"**.
Veredito final detalhado em §"Final Corporate Readiness Verdict".

---

## Question Intent Analysis

> Para cada eixo típico de pergunta de TI bancária, traduzimos o que **realmente** está sendo perguntado.

### 1. "Onde os dados ficam armazenados? Qual cloud? Qual região?"
- O que querem validar: **soberania de dados** (LGPD art. 33), risco geopolítico, contrato com provedor, possibilidade de auditoria.
- Risco corporativo avaliado: dados de clientes Caixa em provedor não contratado pelo banco, fora de DC homologado.
- Impacto numa absorção: bloqueante se não houver contrato direto banco↔provedor ou migração para Azure/AWS/GCP sob conta Caixa.

### 2. "Quem é o controlador / operador dos dados?"
- Validar: cadeia LGPD (Caixa controladora, fornecedor operador, sub-operadores).
- Risco: sub-operadores não declarados (Supabase, Lovable, Browserless, OpenAI, Google) tratando dados pessoais sem DPA.
- Impacto: bloqueante para DPO Caixa.

### 3. "Como é feita a autenticação? Há SSO/AD/MFA?"
- Validar: integração com IAM corporativo (Azure AD / Entra ID / SAML), bloqueio de senha local, MFA obrigatório.
- Risco: hoje é e-mail+senha local Supabase, sem MFA, sem SSO Caixa.
- Impacto: bloqueante — banco não admite credencial local paralela.

### 4. "Como é garantido o isolamento entre usuários e entre 'empresas'?"
- Validar: RLS, multi-tenant, ausência de IDOR.
- Risco: vazamento cross-tenant.
- Estado real: **forte** — `user_roles` separado, `has_role` security definer, `current_company_ids()`, testes E2E em `src/test/multitenant.invariants.test.ts`, prefixo `t/{cid}` em React Query.

### 5. "Quais dados pessoais são coletados? Há base legal? Há retenção definida?"
- Validar: LGPD art. 7, art. 16.
- Risco: coleta excessiva, retenção indefinida, falta de política de descarte.
- Estado real: nome do consultor (corporativo @caixa.gov.br), nome/telefone de cliente final inserido pelo consultor. **Sem política formal escrita de retenção, sem rotina automatizada de expurgo.**

### 6. "IA é usada? Onde? Os dados vão para fora?"
- Validar: AI Act / governança, vazamento de dados pessoais e estratégia comercial para LLM público.
- Risco: dados do cliente final indo para OpenAI/Google Gemini via Lovable AI Gateway.
- Estado real: **vão**. Mitigação parcial (sem CPF, sem documento), mas nome do cliente, telefone parcial em alguns prompts e dados financeiros simulados saem.

### 7. "PDFs com dados de clientes — onde ficam? Quem acessa? Por quanto tempo?"
- Validar: ciclo de vida documental, LGPD documental, link público.
- Risco: bucket `proposal-pdfs` com link compartilhável.
- Estado real: bucket **privado**, mas `share-proposal` gera token de 256 bits acessível por qualquer um com o link. Sem expiração padrão obrigatória, sem revogação em massa.

### 8. "Upload de planilha de assembleias — há antivírus, MIME validation, sandbox?"
- Validar: malware, XXE, formula injection, parser exploit.
- Risco: planilha maliciosa subida por consultor.
- Estado real: parsing **server-side** via edge `assemblies-import` com `PARSER_VERSION`, `contentHash`, anti-drift z-score. **Sem antivírus (ClamAV/Defender), sem sandbox dedicado, sem detonation**.

### 9. "Há criptografia em trânsito e em repouso?"
- Validar: TLS 1.2+, AES-256 at rest, KMS gerenciado.
- Estado real: TLS ok (HTTPS Lovable + Supabase), at-rest no Supabase ok (gerenciado), **mas chaves não estão sob KMS Caixa**.

### 10. "Há logs, auditoria, trilha imutável?"
- Validar: SOX-like, rastreabilidade de quem fez o quê.
- Estado real: `audit_logs`, `admin_logs`, `proposal_events`, `analytics_events` existem e são alimentados. **Não são imutáveis** (admin com service role pode editar), **não exportados para SIEM Caixa**.

### 11. "Há pentest? SOC 2? ISO 27001? Plano de resposta a incidentes?"
- Validar: maturidade formal.
- Estado real: **nenhum dos três foi feito sobre este produto.** Lovable e Supabase publicam seus próprios relatórios, mas não substituem auditoria sobre o app.

### 12. "Backup, DR, RPO/RTO?"
- Validar: continuidade operacional.
- Estado real: backups do Supabase gerenciado (PITR conforme plano). **Sem RPO/RTO contratualizados com Caixa, sem teste de restore documentado.**

### 13. "Vendor lock-in / saída do contrato?"
- Validar: portabilidade, exit plan.
- Estado real: schema PostgreSQL padrão (exportável), edges em Deno (portáveis com refactor), frontend React puro. **Médio lock-in em Lovable (build, hosting, AI Gateway) e Supabase (auth, storage, RLS dialect).**

---

## Infrastructure Audit

| Item | Estado real | Risco corporativo |
|---|---|---|
| Hosting frontend | Lovable (CDN gerenciado) | Sem contrato Caixa; domínio custom existe (`simuladordeconsorcio.seg.br`) |
| Backend | Supabase gerenciado (Lovable Cloud) | Multi-tenant compartilhado; sem dedicated cluster |
| Região | Default Supabase (não confirmada via Caixa) | LGPD art. 33 — precisa documentar |
| PDF rendering | Browserless.io (Chromium externo) | Dados financeiros do cliente trafegam para terceiro |
| AI | Lovable AI Gateway (OpenAI + Google) | Sub-operadores extras |
| Backups | PITR Supabase | Sem teste de restore documentado |
| Redundância / DR | Herdada do Supabase | Sem RTO/RPO contratual |
| Escalabilidade | Boa (RLS otimizado, manual chunks, virtualization) | Sem teste de carga formal |
| Vendor lock-in | Médio | Exportação possível, migração custosa |
| Licenciamento | Lovable + Supabase + Browserless | Necessário contrato corporativo |

**Veredicto infra:** **Inadequado para produção bancária sem renegociação de contratos e/ou migração para tenant dedicado.**

---

## Authentication & Access Audit

| Item | Estado |
|---|---|
| Login | E-mail + senha (Supabase Auth) |
| Domínio restrito | ✅ `@caixa.gov.br` enforced (client + edge `create-user`) |
| Hash de senha | bcrypt (gerenciado Supabase) |
| JWT | RS256 via signing keys, `getClaims()` server-side |
| Sessão | localStorage + refresh token rotation |
| MFA | ❌ **não implementado** |
| SSO Caixa (SAML/Entra ID) | ❌ **não implementado** (Supabase suporta SAML, mas não está configurado) |
| Reset de senha | ✅ fluxo padrão `/reset-password` |
| Bloqueio admin | ✅ trigger `prevent_profile_self_approval` + `forceSignOut` se `approved=false` |
| RBAC | ✅ `user_roles` separado + `has_role()` security definer |
| RLS | ✅ ativo em todas as tabelas de domínio; `current_company_ids()` para multi-tenant |
| Multi-tenant isolation | ✅ testes invariantes em `multitenant.invariants.test.ts` |
| Rate limit edges | ✅ por user_id (fallback IP) em todas as edges IA/admin |
| Audit de admin | ✅ `admin_logs` + `audit_logs` |

**Veredicto auth:** **Forte para SaaS, insuficiente para banco.** Bloqueador real = ausência de SSO Caixa + ausência de MFA.

---

## LGPD & Data Governance Audit

### Dados coletados
- Consultor: nome, e-mail corporativo, role, telemetria de uso.
- Cliente final (inserido pelo consultor): nome, telefone, valor de crédito desejado, perfil. **Sem CPF, sem RG, sem endereço, sem dado bancário.**
- Telemetria: `analytics_events`, `audit_logs`, `proposal_events`, `post_sale_events`.

### Status LGPD por princípio
| Princípio (LGPD art. 6) | Estado |
|---|---|
| Finalidade | ✅ clara (consultoria de consórcio) |
| Adequação | ✅ |
| Necessidade / minimização | 🟡 nome+telefone do cliente é o mínimo; coleta justificável |
| Livre acesso | ❌ não há tela "meus dados" para o cliente final (ele nem tem login) |
| Qualidade | ✅ |
| Transparência | ❌ sem aviso de privacidade exibido ao cliente final |
| Segurança | 🟡 RLS + TLS, mas sem KMS Caixa |
| Prevenção | 🟡 |
| Não discriminação | ✅ |
| Responsabilização | 🟡 logs existem, mas não exportados |

### Lacunas LGPD críticas
1. **Sem política de retenção formal** — proposals/post_sale_clients ficam indefinidamente.
2. **Sem rotina de expurgo automático.**
3. **Sem fluxo de "direitos do titular"** (art. 18: acesso, correção, eliminação).
4. **Sem DPIA (Relatório de Impacto)** — exigível para tratamento de risco.
5. **Sem DPA assinado** com Supabase / Lovable / Browserless / OpenAI / Google em nome de Caixa.
6. **Sem registro de operações de tratamento** (art. 37).

---

## AI Governance Audit

| Item | Estado |
|---|---|
| Provedores | OpenAI (gpt-5/5.2/mini/nano), Google (gemini-2.5/3) via Lovable AI Gateway |
| Edges que chamam IA | 11 (sales-copilot, generate-proposal, niche-storytelling, investment-storytelling, sales-script, sales-response, phase-action, module-copilot, bid-recommendation, trigger-script, share-proposal) |
| Dados enviados | Contexto financeiro simulado + nome do cliente (não-mascarado) em alguns prompts + perfil + objeções |
| Mascaramento PII | ❌ **não há masking sistemático** antes do envio |
| Anti-prompt-injection | 🟡 parcial (sanitização de saída, validators) |
| Anti-XSS no output IA | ✅ `SafeNarrative` / `renderSafeFormattedText` + CI gate |
| "Nunca prometer garantia" | ✅ `STRICT_NO_PROMISE_PROMPT` global |
| Rate limit | ✅ por user_id |
| Retenção LLM | ❓ depende do contrato Lovable AI Gateway (zero-retention não confirmado para Caixa) |
| Log de prompts | ❌ não armazenado (bom para LGPD, ruim para auditoria forense) |
| DPA com OpenAI / Google | ❌ não assinado em nome da Caixa |

**Veredicto IA:** O **uso técnico** é bem governado. O **uso legal** não está. Banco vai exigir DPA + masking + zero-retention contratual + opt-out de treinamento + logging de prompts em SIEM.

---

## Upload Security Audit

| Item | Estado |
|---|---|
| Tipos aceitos | XLSX / paste (assembleias) |
| Parsing | ✅ server-side em edge `assemblies-import`, `PARSER_VERSION`, `contentHash` SHA-256 |
| MIME validation | 🟡 implícita pelo parser; sem allowlist explícita por magic-bytes |
| Antivírus | ❌ **não há ClamAV / Defender / detonation** |
| Sandbox | 🟡 edge Deno isolada, mas mesma VM compartilhada Supabase |
| Limite de tamanho | 🟡 limites do Supabase; sem regra de negócio explícita |
| Authorization | ✅ `getClaims()` + role admin |
| Anti-drift | ✅ z-score; severo bloqueia commit |
| Formula injection (CSV/XLSX) | ❌ não há sanitização explícita de células `=`, `+`, `-`, `@` |
| Storage de upload | Não persiste planilha bruta (parse-and-discard) ✅ |

**Veredicto upload:** Bom para risco funcional, **fraco para risco de malware**. Banco vai exigir AV antes do parse.

---

## PDF & Document Audit

| Item | Estado |
|---|---|
| Geração | Edge `generate-pdf` → Browserless.io (Chromium externo) |
| Cache | `proposal_pdf_cache` + bucket `proposal-pdfs` (privado) |
| Invalidação | ✅ trigger `invalidate_pdf_cache_on_proposal_change` |
| Compartilhamento público | ✅ via `share-proposal` token 256-bit |
| Expiração de token | 🟡 existe campo, **não enforced obrigatório** |
| Revogação | 🟡 manual, sem painel "ver todos os links ativos" |
| Watermark / rastreabilidade | ❌ PDF não traz hash, ID de auditoria, ou marca d'água por consultor |
| Retenção | ❌ sem política de expurgo |
| Acesso por outro usuário do mesmo tenant | controlado por RLS ✅ |
| Acesso anônimo via link | possível por desenho ⚠️ |

**Veredicto PDF:** Aceitável para uso comercial, **insuficiente para uso bancário** (faltam watermark + expiração obrigatória + log de acesso por link público + revogação centralizada).

---

## Encryption & Cybersecurity Audit

| Vetor | Estado |
|---|---|
| TLS in-transit | ✅ HTTPS obrigatório |
| At-rest DB | ✅ gerenciado Supabase (AES-256) |
| At-rest storage | ✅ |
| Chaves sob KMS Caixa | ❌ |
| Secrets management | ✅ Supabase Vault / secrets edge (BROWSERLESS_API_KEY, LOVABLE_API_KEY, service role) |
| Secrets no client | ✅ apenas anon key + URL pública |
| XSS | ✅ política institucional (`docs/security/html-injection-policy.md`), `SafeNarrative`, ESLint `no-restricted-syntax` block, CI gate `scripts/ci/anti-xss-gate.mjs`, 14 testes de vetores |
| CSRF | ✅ JWT bearer, sem cookies de sessão; cross-origin via CORS allowlist nas edges |
| SQL Injection | ✅ ORM Supabase tipado; zero `rpc('execute_sql')`; functions parametrizadas |
| IDOR | ✅ RLS por `user_id` + `company_id` |
| Privilege escalation | ✅ `user_roles` separado + AS RESTRICTIVE policies + trigger `prevent_profile_self_approval` |
| Rate limit | ✅ todas as edges (15-30/min user) |
| Input validation | ✅ Zod em todas as edges |
| Logs/observabilidade | 🟡 console + Sentry breadcrumbs + analytics_events; **sem export SIEM** |
| Pentest formal | ❌ |
| SAST/DAST em CI | 🟡 ESLint security + anti-XSS gate + dependency_scan; sem Semgrep/Snyk corporativo |
| WAF | ❌ herdado da plataforma; sem WAF Caixa |
| DDoS protection | herdado da CDN Lovable |
| Imutabilidade de logs | ❌ logs ficam em tabela editável por service role |

---

## Enterprise Gap Analysis

### ✅ Já adequado
- RLS multi-tenant testado, RBAC, security definer, anti-recursão.
- Engine financeira blindada, anti-XSS institucional, governance docs.
- Edges com Zod + rate limit + CORS allowlist + getClaims.
- Audit trail funcional (não-forense).
- Domain enforcement `@caixa.gov.br`.
- TLS, at-rest, secrets management básico.
- Política de versionamento e changelog.

### 🟡 Parcialmente adequado
- Backup/DR (existe, sem SLA Caixa).
- AI governance (técnica ok, contratual zero).
- Upload (parser ok, AV ausente).
- PDF lifecycle (geração ok, retenção/expiração ausentes).
- Observabilidade (interna ok, export SIEM ausente).

### ❌ Crítico (bloqueador corporativo bancário)
1. **SSO Caixa (SAML/Entra ID) ausente.**
2. **MFA ausente.**
3. **DPA com sub-operadores (Supabase, Lovable, Browserless, OpenAI, Google) ausente em nome da Caixa.**
4. **Soberania de dados:** dados em provedores fora de tenant Caixa.
5. **Antivírus em upload ausente.**
6. **Política formal de retenção + expurgo ausente.**
7. **Pentest + SOC 2/ISO 27001 não aplicados ao produto.**
8. **Imutabilidade de logs (WORM/SIEM) ausente.**
9. **Mascaramento PII antes de IA ausente.**
10. **Plano de resposta a incidentes formal ausente.**

---

## Corporate Hardening Roadmap

### Curto prazo (4–8 semanas, sem mudar stack)
- [ ] SSO SAML via Supabase Auth (Entra ID Caixa) — bloquear login local.
- [ ] MFA TOTP obrigatório para todos.
- [ ] Política de retenção escrita + job de expurgo (proposals/post_sale_clients/PDFs > N meses).
- [ ] Expiração obrigatória + revogação centralizada de tokens `share-proposal`; watermark "Documento de Consultoria — {consultor} — {hash}".
- [ ] Masking PII em prompts IA (nome → iniciais, telefone removido) + log opcional de prompt em tabela `ai_prompt_audit` com retenção curta.
- [ ] Aviso de privacidade exibido ao cliente final no link público + fluxo "solicitar exclusão".
- [ ] Sanitização de fórmulas em parsing XLSX (prefix `'` em `=+-@`).
- [ ] Export contínuo de `audit_logs`/`admin_logs`/`analytics_events` para storage write-once.
- [ ] Documento "Registro de Operações de Tratamento" + DPIA.

### Médio prazo (3–6 meses, exige contrato)
- [ ] DPA assinado com Supabase, Lovable, Browserless, OpenAI, Google em nome da Caixa.
- [ ] Migração para **tenant dedicado** Supabase em região contratada por Caixa, **ou** replatform Supabase self-hosted em DC Caixa.
- [ ] Integração com SIEM Caixa (Splunk/Sentinel).
- [ ] Antivírus em pipeline de upload (ClamAV em edge dedicada ou serviço gerenciado).
- [ ] Pentest externo independente + relatório.
- [ ] Teste de restore de backup documentado (RPO/RTO formal).
- [ ] WAF corporativo na frente do domínio.

### Longo prazo / opcional
- [ ] ISO 27001 / SOC 2 Type II sobre o produto.
- [ ] Zero-retention contratual com provedores LLM + opt-out de treinamento.
- [ ] Modelo LLM em tenant dedicado (Azure OpenAI Caixa).
- [ ] Imutabilidade WORM real (S3 Object Lock equivalente).

### Crítico imediato (não pode ir para produção bancária sem isto)
- SSO + MFA + DPA + retenção + masking PII.

---

## What Is Already Enterprise-Ready
- Modelo de dados, RLS, RBAC, multi-tenant.
- Engine financeira (governança, testes, façade canônica).
- Anti-XSS institucional com CI gate.
- Edges com Zod + rate limit + getClaims.
- Versionamento, changelog, governance dashboards.
- Audit trail funcional.
- Observabilidade técnica (Web Vitals, perf intelligence).

## What Still Blocks Corporate Adoption
- SSO Caixa.
- MFA.
- Contratos (DPA, soberania, SLA).
- Retenção/expurgo formal LGPD.
- AV em upload.
- Masking PII em IA.
- Pentest + relatório externo.
- SIEM/WORM logs.
- Lifecycle de PDF compartilhado (expiração, watermark, revogação).

## Critical Risks
1. **Vazamento de PII de cliente final via prompt LLM** (sem masking + sem zero-retention contratual).
2. **Link de proposta compartilhada sem expiração obrigatória** → exposição indefinida.
3. **Login local sem MFA** em sistema com dados de clientes → credential stuffing.
4. **Logs editáveis por service role** → adversário interno apaga rastro.
5. **Sub-operadores não declarados ao DPO** → não-conformidade LGPD direta.

## Recommended Immediate Actions
1. Congelar discussão com TI Caixa em **"Lovable Cloud é SaaS público; precisaremos definir modelo de hospedagem"** antes de prometer prazos.
2. Implementar **SSO SAML + MFA** imediatamente (não exige troca de stack).
3. Implementar **masking PII antes de toda chamada IA** + tabela `ai_prompt_audit`.
4. Implementar **expiração obrigatória + watermark** no `share-proposal`.
5. Escrever **política de retenção** + job de expurgo.
6. Levantar **DPA / sub-operadores** com Lovable e Supabase antes da próxima reunião.
7. Adicionar **sanitização de fórmulas** em XLSX.
8. Documentar **registro de tratamento** e **DPIA** mínimos.

---

## Final Corporate Readiness Verdict

**Veredicto:** O projeto **possui riscos incompatíveis com ambiente financeiro corporativo bancário no estado atual**, apesar de tecnicamente sólido.

- ✅ Maturidade de **produto**: alta.
- ✅ Maturidade de **engenharia**: alta (engine, RLS, anti-XSS, governance, perf).
- 🟡 Maturidade de **segurança aplicacional**: média-alta.
- ❌ Maturidade **corporativa / contratual / LGPD formal**: baixa.
- ❌ Maturidade **infraestrutural bancária**: baixa (SaaS público, sem SSO, sem MFA, sem DPA, sem SIEM, sem AV, sem pentest).

**Classificação final:** "Produto enterprise-grade rodando em infra SaaS-grade." Para absorção pela Caixa Consórcio é necessário **hardening moderado-a-pesado** (SSO+MFA+DPA+retenção+masking+AV+expiração de PDF+SIEM) **antes** de qualquer piloto produtivo com dados reais. Pentest + ISO/SOC e migração para tenant dedicado vêm em seguida.

**Não responder à TI da Caixa sem antes:**
1. Decidir modelo de hospedagem alvo (Lovable Cloud dedicado vs. self-host vs. Azure Caixa).
2. Listar honestamente as 10 lacunas críticas acima.
3. Apresentar este roadmap como compromisso.

Responder qualquer coisa diferente disso = risco reputacional e jurídico para a empresa fornecedora.
