# DPIA — Relatório de Impacto à Proteção de Dados Pessoais

> Data Protection Impact Assessment · LGPD Art. 38
> **Plataforma:** Simulador de Consórcio · Edição Consultiva Patrimonial
> **Versão:** 1.0 (Onda 1 — Governança Corporativa)
> **Última revisão:** 2026-06-01
> **Próxima revisão obrigatória:** a cada nova categoria de dado, novo subprocessador ou nova finalidade.
> **Owner:** Plataforma / Encarregado (DPO designado pelo cliente operador)

---

## 1. Identificação

| Item | Valor |
|---|---|
| Controlador | Consultor/empresa contratante (tenant) |
| Operador | Plataforma Simulador de Consórcio (Lovable) |
| Suboperadores | Lovable Cloud (Supabase), Browserless.io, Lovable AI Gateway (OpenAI/Google), Sentry (opcional), CDN/hosting |
| Encarregado (DPO) | Designado pelo controlador; canal de contato: página `/privacidade` |
| Escopo | Web app autenticado, multi-tenant, com PDFs gerados sob demanda |

## 2. Finalidade do tratamento

Apoiar consultores na **simulação financeira ilustrativa** de cenários de consórcio,
estratégias patrimoniais e geração de propostas comerciais para clientes finais.
Todos os artefatos são **simulações não-oficiais**, marcados com disclaimer obrigatório
(ver `src/config/copy/disclaimers.ts`).

## 3. Dados pessoais tratados

### 3.1 Dados do usuário consultor (titular = consultor)
- E-mail corporativo, nome, role (admin/user)
- Logs de acesso (IP, user agent) — finalidade segurança
- Telemetria de uso (módulos acessados) — sem PII além do `user_id` tokenizado

### 3.2 Dados de cliente final (titular = cliente do consultor)
- Nome, telefone, e-mail (opcional)
- Parâmetros de simulação (crédito, prazo, perfil patrimonial)
- Estágio comercial (CRM interno do consultor)
- **Nunca** tratamos CPF, RG, comprovante de renda, score de crédito ou dado bancário.

### 3.3 Dados sensíveis
**Nenhum** dado sensível (LGPD Art. 5º, II) é tratado.

## 4. Inteligência Artificial

| Item | Política |
|---|---|
| Provedor | Lovable AI Gateway (OpenAI/Google) — ver `subprocessors.md` |
| Finalidade | Apenas narrativa consultiva (storytelling, objeção, abordagem). Matemática é determinística local. |
| PII em prompts | **Mascarada** server-side via `scripts/_shared-edges/piiMask.ts` (`[CLIENTE]`, `[EMAIL]`, `[CPF]`, `[PHONE]`, `[id:…]`) |
| Treinamento | Provedores configurados sem retenção para treinamento |
| Decisão automatizada (Art. 20) | **Não há.** IA é decorativa/comunicacional; nenhuma decisão sobre o titular é tomada pela IA. |
| Rate limit + auditoria | Sim, por `user_id` (ver `_shared/auth.ts`) |

## 5. Subprocessadores

Ver inventário canônico em `.lovable/governance/subprocessors.md`. Resumo:

| Provedor | Função | Região | Criticidade |
|---|---|---|---|
| Lovable Cloud (Supabase) | DB, Auth, Storage, Edges | US | Crítica |
| Browserless.io | Render PDF (stateless) | SFO/LON | Alta |
| Lovable AI Gateway | IA narrativa | US/EU | Alta |
| Sentry (opt-in) | Observabilidade sanitizada | EU | Média |
| CDN/hosting | Entrega estática | Multi | Média |

## 6. Riscos identificados e mitigadores

| Risco | Severidade | Mitigador implementado | Evidência |
|---|---|---|---|
| Vazamento cross-tenant via API | Alta | RLS por `user_id`/`company_id` em todas as tabelas | `supabase/migrations/*`, política `is_company_member` |
| Vazamento via Edge Function | Alta | `authenticateRequest()` + `authenticateAdmin()` obrigatórios; CI gate `scripts/ci/auth-pattern-gate.mjs` | Onda 1–2 de hardening |
| Vazamento via Storage signed URL | Média | TTL ≤ 1h em exports LGPD; bucket privado; owner-scoped UPDATE/DELETE | Migração Onda 1 Storage |
| Vazamento via prompts de IA | Média | PII masking server-side antes de chamar gateway | `piiMask.ts` + invariantes |
| Vazamento via logs | Média | `sanitizeLogPayload` + Sentry `beforeSend`; erros genéricos pt-BR ao cliente | `src/lib/logSanitizer.ts` |
| XSS em narrativa IA | Média | Renderer único `SafeNarrative`; ESLint + CI anti-XSS | `docs/security/html-injection-policy.md` |
| Service-role exposto | Alta | Matriz documentada; nunca exposto ao client | `docs/security/service-role-matrix.md` |
| Retenção indevida | Média | TTLs automatizados via `data-retention-purge` (pg_cron) | Onda 2 LGPD |
| Sessão sequestrada | Média | `enforce-single-session` + JWT validation | Edge dedicada |

## 7. Retenção

| Categoria | TTL | Mecanismo |
|---|---|---|
| PDFs gerados (`proposal-pdfs`) | 90 dias | `data-retention-purge` diário 03:17 UTC |
| `analytics_events` | 180 dias | idem |
| `audit_logs` | 365 dias | idem |
| Dados operacionais (proposals, post_sale_*) | Vinculados à conta — purge em cascata na exclusão | `account-purge` |
| Conta de usuário | Até solicitação de exclusão | `account-purge` (typed confirm "EXCLUIR") |

## 8. Direitos do titular (LGPD Art. 18)

| Direito | Implementação |
|---|---|
| Acesso/portabilidade | Edge `data-export` → ZIP com JSON + PDFs (signed URL 1h) |
| Correção | Edição livre nos módulos Carteira/Pós-venda |
| Eliminação | `account-purge` com cascade ordenada + storage purge + auth.users |
| Revogação de compartilhamento | Tokens de proposta invalidáveis |
| Informação sobre tratamento | Página `/privacidade` + este DPIA |

UI: `src/components/privacy/PrivacyCenter.tsx`.

## 9. Base legal

| Tratamento | Base legal (LGPD Art. 7º) |
|---|---|
| Conta do consultor | Execução de contrato (Art. 7º, V) |
| Dados de cliente final | Legítimo interesse do controlador (Art. 7º, IX) — relacionamento comercial pré-existente |
| Logs de segurança/auditoria | Cumprimento de obrigação legal e legítimo interesse (Art. 7º, II e IX) |
| Telemetria de uso | Consentimento opt-in (`src/lib/consent.ts` + `ConsentBanner`) |
| IA narrativa | Legítimo interesse com PII mascarada (sem decisão automatizada sobre titular) |

## 10. Itens que exigem decisão humana / pendências

- Designação formal do **Encarregado (DPO)** por parte do controlador.
- Assinatura de **DPAs** com Browserless, Lovable AI Gateway e Sentry pelo controlador final.
- Definição de **canal oficial** de atendimento ao titular (e-mail/formulário) pelo controlador.
- **Pen-test externo** anual (não-código).
- Eventual **DPIA específica** se for adicionada nova categoria de dado sensível.

## 11. Conclusão

A plataforma apresenta **risco residual BAIXO** após Ondas 1–2 de hardening de
segurança, governança e compliance. Não há tratamento de dados sensíveis nem
decisão automatizada sobre titulares. Os controles técnicos cobrem os direitos
do Art. 18. Bloqueadores restantes são **documentais/processuais**, não-código.
