# Subprocessor Inventory — Enterprise Governance

> Fonte canônica dos suboperadores tecnicamente necessários à plataforma.
> Mantida em sincronia com `/privacidade`. Atualizada na ondas de governança.

Última revisão: **2026-05-17** · Ciclo de revisão: a cada wave de governança ou inclusão/remoção.

## Critérios de inclusão
Qualquer provedor que (a) processe dado pessoal de usuário ou cliente final,
(b) hospede artefato gerado pela plataforma, ou (c) receba telemetria/erros.

## Inventário

| # | Provedor | Finalidade | Dados compartilhados | Retenção | Região | Criticidade | Contrato |
|---|----------|------------|----------------------|----------|--------|-------------|----------|
| 1 | **Lovable Cloud** (Supabase) | Banco, Auth, Storage, Edge Functions | Conta, dados operacionais (RLS por usuário), PDFs privados | Vinculada à conta + TTLs definidos | US (primário) | Crítica | Contrato vigente Lovable |
| 2 | **Browserless.io** | Renderização headless de PDF (Chromium, JS off) | HTML serializado da proposta (curta janela, sem persistência no provedor) | Stateless — sem retenção | SFO (primário), LON (fallback) | Alta | DPA Browserless |
| 3 | **Lovable AI Gateway** (OpenAI/Google) | IA generativa consultiva | Prompts com PII **mascarada** (`[CLIENTE]`, `[EMAIL]`, `[CPF]`, `[PHONE]`, `[id:…]`) | Sem treinamento; logs do gateway conforme política Lovable | US/EU conforme modelo | Alta | Termos Lovable AI |
| 4 | **Sentry** (opcional, opt-in via DSN) | Monitoramento de erros / traces | Eventos sanitizados via `sanitizeLogPayload`; user id tokenizado (últimos 6 chars); sem headers sensíveis | 30–90 dias (config Sentry) | EU (config recomendada) | Média | DPA Sentry |
| 5 | **CDN do dev-server / hosting** | Entrega estática da aplicação | Logs de acesso padrão (IP, UA) | Conforme provedor | Multi-região | Média | Termos do provedor de hosting |

## Dados que **não** saem da plataforma para nenhum suboperador
- CPF, telefone, e-mail bruto em prompts de IA.
- Conteúdo integral de propostas em logs/telemetria.
- Tokens de sessão, headers `Authorization`/`apikey`/`cookie`.

## Procedimento de alteração
1. Atualizar este arquivo (PR + revisão).
2. Refletir mudança em `src/pages/PrivacyPolicyPage.tsx` se houver impacto externo.
3. Registrar entry em `audit_logs` (action `subprocessor_inventory_update`).

## Referências
- `.lovable/audit/full-lgpd-observability-governance-audit.md`
- `.lovable/audit/lgpd-privacy-hardening-wave1.md`
- `.lovable/audit/article18-data-lifecycle-hardening-pass.md`
- `.lovable/audit/enterprise-observability-document-security-pass.md`
