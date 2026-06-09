# Runbook Operacional

> **Versão:** 1.0 (Onda 1 — Governança Corporativa)
> **Última revisão:** 2026-06-01
> **Owner:** Plataforma · On-call rotation
> **Escopo:** procedimentos operacionais para deploy, rollback, falhas de fornecedores e incidentes.

---

## 0. Convenções

- **Severidade:** SEV-1 (indisponibilidade total), SEV-2 (degradação parcial), SEV-3 (bug isolado).
- **Canal de incidente:** abrir thread em #ops-incident, anexar este runbook.
- **Janela de manutenção preferencial:** dias úteis 22:00–06:00 BRT.
- **Fontes canônicas:**
  - Segurança: `docs/security/service-role-matrix.md`, `docs/security/html-injection-policy.md`
  - Subprocessadores: `.lovable/governance/subprocessors.md`
  - DR/RPO/RTO: `docs/operations/DR_PLAN.md`

---

## 1. Deploy

### 1.1 Deploy normal (frontend + edges)
1. Merge na branch principal → pipeline Lovable executa build + sync.
2. CI gates obrigatórios verdes:
   - `scripts/ci/auth-pattern-gate.mjs`
   - `scripts/ci/anti-xss-gate.mjs`
   - testes (`vitest`)
3. Edges Supabase publicadas automaticamente.
4. Smoke test pós-deploy (seção 5).

### 1.2 Deploy de migração de banco
1. Migração via tool `supabase--migration` (aprovação do usuário obrigatória).
2. Verificar `supabase--linter` sem erros novos.
3. Validar RLS com `supabase--read_query` em conta de teste.
4. Registrar em `audit_logs` se for mudança estrutural sensível.

---

## 2. Rollback

### 2.1 Rollback de frontend/edges
- Via Lovable: reverter para versão anterior no histórico do projeto.
- Smoke test imediato.

### 2.2 Rollback de migração
- **Nunca** apagar dados em rollback. Aplicar migração compensatória.
- Se houver perda de dados, escalar para SEV-1 e seguir seção 7 (DR).

### 2.3 Critérios de rollback obrigatório
- Erro 5xx > 5% por 5 min consecutivos.
- Falha de autenticação global (login não funciona).
- Vazamento de dados detectado.
- Quebra de cálculo financeiro (test golden snapshot falha).

---

## 3. Falha Lovable Cloud (Supabase)

### Diagnóstico
- Rodar `supabase--cloud_status`.
- Estados: `ACTIVE_HEALTHY` (ok), `COMING_UP`/`RESTARTING` (aguardar), `ACTIVE_UNHEALTHY`/`INACTIVE` (escalar).

### Ações
1. Se `COMING_UP`/`RESTARTING`/`UPGRADING`: aguardar 5 min, repolling.
2. Se `ACTIVE_UNHEALTHY` por > 10 min:
   - Suspender writes não-críticos (não há kill switch automático; comunicar ao usuário via banner manual).
   - Abrir ticket de suporte Lovable Cloud.
3. Se `INACTIVE`: solicitar resume nas configurações Lovable.
4. Comunicar status no canal #ops e na página `/status` (se existir) ou via banner.

### Pós-incidente
- Validar `audit_logs` e `analytics_events` consistentes.
- Rodar `supabase--db_health`.

---

## 4. Falha Browserless.io (geração de PDF)

### Sintoma
- Edge `generate-pdf` retorna 502.
- Usuários relatam "erro ao gerar PDF".

### Diagnóstico
- `supabase--edge_function_logs` em `generate-pdf`.
- Testar endpoint Browserless via curl externo.

### Ações
1. Tentar região fallback (LON) se primário (SFO) cair.
2. Comunicar degradação: "Geração de PDF temporariamente indisponível. Demais funcionalidades operando."
3. Se > 1h: abrir ticket Browserless e considerar fallback documental (texto/HTML).
4. PDFs já gerados continuam acessíveis via signed URL.

---

## 5. Falha de IA (Lovable AI Gateway)

### Sintoma
- Edges `sales-*`, `module-copilot`, `*-storytelling` retornam 5xx ou timeout.

### Diagnóstico
- `supabase--edge_function_logs` na edge afetada.
- Verificar status Lovable AI Gateway.

### Ações
1. **Plataforma degrada graciosamente**: simulador e cálculos continuam 100% funcionais (math determinístico local).
2. Comunicar: "Sugestões de IA temporariamente indisponíveis."
3. Se um único modelo falha, alternar para fallback configurado na edge.
4. Rate limit elevado? Investigar abuse via `user_id` no log.

---

## 6. Incidente de segurança

### Detecção
- Alerta Sentry, anomalia em `audit_logs`, denúncia externa, CI gate failure.

### Classificação
- **Vazamento confirmado de PII**: SEV-1.
- **Tentativa bloqueada**: SEV-3, registrar e monitorar.
- **Bypass de autenticação**: SEV-1.

### Ações imediatas (primeiros 30 min)
1. Isolar: revogar chave/token comprometido (`supabase--rotate_api_keys`).
2. Forçar logout global se necessário (`enforce-single-session`).
3. Snapshot de evidências: logs Edge, `audit_logs`, console.
4. Comunicar DPO/controlador.

### Ações em 24h
1. Notificar ANPD se houver risco a titulares (LGPD Art. 48) — responsabilidade do controlador.
2. RCA escrito em `docs/operations/incidents/YYYY-MM-DD-<slug>.md`.
3. Patch + teste de regressão.
4. Atualizar CI gates se aplicável.

### Pós-incidente
- Revisar `service-role-matrix.md`, atualizar DPIA se necessário.
- Lições aprendidas em retro.

---

## 7. Restauração (DR)

Ver `docs/operations/DR_PLAN.md` para RPO/RTO e procedimento detalhado.

**Resumo:**
1. Identificar cenário (perda parcial vs total).
2. Acionar restore do snapshot Lovable Cloud (PITR Supabase) para o timestamp imediatamente anterior ao incidente.
3. Validar `audit_logs` e tabelas críticas (`proposals`, `user_roles`).
4. Smoke test (seção 8).
5. Comunicar conclusão.

---

## 8. Smoke test pós-incidente

1. Login com conta de teste.
2. Carregar `/app?m=simulator` — verificar cálculo determinístico.
3. Gerar PDF de teste.
4. Carregar `/app?m=carteira` — listar clientes.
5. Edge IA: gerar 1 storytelling (sales-script).
6. Verificar `audit_logs` recebendo eventos.

Se algum passo falhar: reabrir incidente.

---

## 9. Contatos e escalação

| Camada | Responsável | Canal |
|---|---|---|
| L1 (on-call) | Plataforma | #ops-incident |
| L2 (engenharia) | Tech Lead | menção direta |
| L3 (fornecedor) | Suporte Lovable / Browserless / Sentry | tickets |
| DPO | Designado pelo controlador | conforme contrato |

---

## 10. Itens pendentes de decisão humana

- Designar oficialmente a **rotação on-call**.
- Definir canal oficial (#ops-incident pode ser Slack, Teams ou Discord).
- Acordar **SLA com fornecedores externos** (Browserless, Sentry).
- Realizar **primeiro drill de DR** documentado.
