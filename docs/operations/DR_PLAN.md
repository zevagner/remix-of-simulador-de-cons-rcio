# Disaster Recovery Plan · RPO / RTO

> **Versão:** 1.0 (Onda 1 — Governança Corporativa)
> **Última revisão:** 2026-06-01
> **Owner:** Plataforma
> **Ciclo de revisão:** anual ou após incidente SEV-1/SEV-2.

---

## 1. Premissas arquiteturais

- Backend gerenciado: **Lovable Cloud (Supabase)** com PITR (Point-In-Time Recovery) inerente ao plano.
- Frontend: estático, redeployável em minutos via Lovable.
- Edge Functions: versionadas no repositório, redeploy automático.
- Storage: bucket `proposal-pdfs` privado, owner-scoped; PDFs regeneráveis a partir dos dados de proposta.
- Sem estado em memória de servidor (arquitetura stateless do lado app).

---

## 2. Objetivos RPO / RTO

| Componente | RPO (perda máxima aceitável) | RTO (tempo máximo de recuperação) | Justificativa |
|---|---|---|---|
| **Banco de dados (Supabase)** | **≤ 5 min** | **≤ 4 h** | PITR do Supabase opera em janela contínua; restore total para snapshot mais recente. |
| **Storage (PDFs)** | **≤ 24 h** (PDFs são regeneráveis) | **≤ 8 h** | PDF é artefato derivado da proposta; pode ser regerado on-demand. |
| **Frontend** | **0** (versionado em git) | **≤ 30 min** | Redeploy via Lovable. |
| **Edge Functions** | **0** (versionadas em git) | **≤ 30 min** | Redeploy automático. |
| **Auth (sessões)** | **0** (recriáveis via login) | **≤ 1 h** | Usuários reautenticam; nenhum dado perdido. |
| **Logs (audit/analytics)** | **≤ 1 h** | **≤ 8 h** | Não-bloqueante para operação. |

**RPO global agregado:** ≤ 5 min (driver = banco).
**RTO global agregado:** ≤ 4 h para operação plena (driver = restore do banco).

---

## 3. Cenários e procedimentos

### 3.1 Cenário A — Corrupção lógica (delete acidental, migração ruim)
- **Detecção:** alerta em `audit_logs`, denúncia interna, queries divergentes.
- **Ação:**
  1. Congelar writes na tabela afetada se possível (revogar grants temporariamente).
  2. Identificar timestamp T do evento.
  3. Solicitar PITR para T−1min via console Lovable Cloud.
  4. Validar com `supabase--read_query` e testes golden.
  5. Liberar writes.
- **RTO esperado:** 1–4 h.

### 3.2 Cenário B — Indisponibilidade Supabase (region down)
- **Detecção:** `supabase--cloud_status` retorna `ACTIVE_UNHEALTHY` ou `INACTIVE` persistente.
- **Ação:**
  1. Comunicar usuários (banner/status page).
  2. Aguardar SLA do fornecedor (target Supabase: 99.9% mensal).
  3. Não há failover cross-region automático na configuração atual.
  4. Pós-restauração: smoke test (Runbook §8).
- **RTO esperado:** dependente do fornecedor; budget interno ≤ 4 h.

### 3.3 Cenário C — Perda de Storage
- **Detecção:** 404s em signed URLs, alertas de bucket.
- **Ação:**
  1. PDFs perdidos: marcar como regeneráveis no UX; usuário pode reemitir.
  2. Restore via snapshot do storage Lovable Cloud se disponível.
- **RTO esperado:** ≤ 8 h.

### 3.4 Cenário D — Comprometimento de credenciais
- **Detecção:** anomalia, alerta Sentry, denúncia.
- **Ação:**
  1. Rotacionar via `supabase--rotate_api_keys`.
  2. Forçar logout global (`enforce-single-session`).
  3. Auditar `audit_logs` para o período suspeito.
  4. Seguir Runbook §6.
- **RTO esperado:** ≤ 1 h.

### 3.5 Cenário E — Indisponibilidade Browserless ou IA Gateway
- **Impacto:** degradação parcial; core (simulação) intacto.
- **Ação:** comunicar degradação; aguardar fornecedor.
- **RTO esperado:** dependente do fornecedor; não bloqueia operação consultiva básica.

---

## 4. Procedimento de restore (banco)

1. **Pré-restore:**
   - Identificar timestamp T do incidente via `audit_logs` ou logs.
   - Notificar stakeholders (controlador, DPO se PII envolvida).
   - Snapshot de evidências.
2. **Restore:**
   - Acionar PITR no console Lovable Cloud para T−5min (ou último ponto íntegro).
   - Aguardar status `ACTIVE_HEALTHY`.
3. **Validação:**
   - `supabase--read_query` em tabelas críticas (`proposals`, `user_roles`, `audit_logs`).
   - Smoke test (Runbook §8).
   - Validar integridade financeira via testes golden.
4. **Pós-restore:**
   - RCA em `docs/operations/incidents/`.
   - Atualizar este plano se necessário.
   - Comunicar conclusão.

---

## 5. Responsabilidades

| Papel | Responsabilidade |
|---|---|
| On-call (L1) | Detecção, classificação, comunicação inicial. |
| Tech Lead (L2) | Decisão de restore, validação técnica. |
| Suporte Lovable Cloud | Execução do PITR, status. |
| DPO/Controlador | Notificação ANPD se PII vazou (LGPD Art. 48). |
| Plataforma | RCA, atualização de runbook/DPIA. |

---

## 6. Drill (teste periódico)

- **Frequência alvo:** semestral.
- **Procedimento:** em projeto de staging, simular corrupção e executar restore.
- **Critério de sucesso:** RPO ≤ 5 min e RTO ≤ 4 h verificados; smoke test verde.
- **Documento de saída:** `docs/operations/drills/YYYY-MM-DD-dr-drill.md`.

---

## 7. Limitações conhecidas (aceitas)

- **Sem multi-region failover ativo.** Plataforma depende da SLA do Supabase para a região primária.
- **PDFs antigos** purgados pelo TTL 90d não são restauráveis; são regeneráveis a partir da proposta.
- **Logs > TTL** purgados não são restauráveis (compliance LGPD).

---

## 8. Itens pendentes de decisão humana

- Executar **primeiro drill de DR** e documentar.
- Avaliar contratação de **plano com multi-region** caso requisito corporativo exija RTO < 1h.
- Formalizar **acordo SLA** com Lovable Cloud (escrito) para apresentar em auditoria.
