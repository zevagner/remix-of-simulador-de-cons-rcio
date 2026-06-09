# Change Management

> **Versão:** 1.0 (Onda 1 — Governança Corporativa)
> **Última revisão:** 2026-06-01
> **Owner:** Governança · Plataforma
> **Aplicabilidade:** todas as mudanças no repositório, banco e Edge Functions.

---

## 1. Princípios

1. Toda mudança é **rastreável** (PR + commit + audit log quando aplicável).
2. Toda mudança é **reversível** (rollback ≤ 1 commit ou migração compensatória).
3. Mudanças **críticas** exigem aprovação explícita e documentação adicional.
4. Áreas **locked** (ver `.lovable/governance/production-lock-v2.4.md`) seguem regime
   reforçado: 8 critérios de aprovação obrigatórios.

---

## 2. Classificação de mudanças

### 2.1 Mudança **normal** (fluxo padrão)
Definição: mudanças isoladas, baixo risco, em áreas não-locked.

Exemplos:
- Ajuste de copy/microtexto não-canônico.
- Novo conteúdo editorial de estratégia (respeitando DRL Differentiation).
- Refinamento visual sem mudar hierarquia ou design tokens.
- Bug fix isolado em componente UI.
- Adição de teste.

Requisitos:
- 1 review de owner da área (CODEOWNERS).
- CI gates verdes (auth, anti-XSS, vitest).
- PR description com "o quê" e "por quê".

Aprovação: CODEOWNERS único.
Rollback: revert simples.

### 2.2 Mudança **crítica** (fluxo reforçado)
Definição: toca áreas locked, segurança, finanças, identidade, schema de banco,
storage, RLS, autenticação, ou subprocessadores.

Exemplos:
- Alteração em `src/core/finance/*`.
- Nova Edge Function ou mudança em helper de auth.
- Mudança de policy RLS.
- Mudança em bucket/storage policy.
- Adição/remoção de subprocessador.
- Migração de banco com `DROP`, `ALTER`, ou afetando dados existentes.
- Mudança em CI gates de segurança.
- Mudança em microcopy canônico (CG-1/CG-2/F2/H2/F3/F4).
- Mudança em `ActiveStrategyContext`, `CompareWorkspace`, `WealthPlatformModule`.

Requisitos:
- 2 reviews: 1 do owner da área + 1 de @security ou @governance.
- Justificativa formal contra os **8 critérios de aprovação** (`production-lock-v2.4.md`):
  1. Necessidade real (telemetria/feedback?)
  2. Mínimo toque?
  3. Preserva hierarquia?
  4. Preserva elegância?
  5. Não duplica engine?
  6. Não fragmenta governança?
  7. Mobile-first 380px?
  8. Reversível em 1 commit?
- Atualização de documentação correlata:
  - DPIA/ROPA se afetar dados pessoais.
  - `service-role-matrix.md` se afetar service-role.
  - `subprocessors.md` se afetar suboperadores.
  - `RUNBOOK.md` se afetar operação.
  - `DR_PLAN.md` se afetar RPO/RTO.
- Plano de rollback **escrito** na PR.
- Audit log obrigatório em runtime (quando aplicável).

Aprovação: 2 CODEOWNERS distintos, sendo um de segurança/governança.
Rollback: obrigatório validar antes do merge (migração compensatória pronta).

### 2.3 Mudança **emergencial** (hotfix de incidente SEV-1)
Definição: correção urgente para mitigar incidente em produção.

Requisitos:
- Pode ser merged com 1 review pós-fato (within 24h).
- RCA obrigatório em `docs/operations/incidents/YYYY-MM-DD-<slug>.md` em 72h.
- Atualização de CI gates se a vulnerabilidade poderia ter sido detectada por automação.

---

## 3. Aprovação necessária — matriz

| Tipo de mudança | Reviewers mínimos | Docs obrigatórios | Rollback testado |
|---|---|---|---|
| UI isolada | 1 owner | PR description | N/A |
| Conteúdo editorial | 1 owner | PR description | N/A |
| Bug fix lógico | 1 owner | PR + teste | revert |
| Engine financeira | 2 (finance + platform) | PR + teste golden + RCA do bug original | revert |
| Edge function (existente) | 2 (area + security) | matriz service-role se aplicável | revert |
| Edge function (nova) | 2 (area + security) | matriz service-role + DPIA review | revert |
| Migração DDL (CREATE) | 2 (area + security) | grants + RLS + revisão por linter | migração compensatória |
| Migração DDL (DROP/ALTER) | 2 (area + security) | plano de impacto + revisão por linter | migração compensatória **obrigatória** |
| Policy RLS | 2 (security + area) | teste manual multi-tenant | revert + verificação |
| Storage policy | 2 (security + platform) | teste de upload/download multi-user | revert |
| Mudança em CI gate | 2 (security + governance) | justificativa + impacto | revert |
| Áreas locked V2.4 | 2 + 8 critérios | atualização do lock se justificado | revert |
| Subprocessador novo | 2 (security + governance) | atualização DPIA + ROPA + subprocessors.md + privacidade | N/A (cadastral) |

---

## 4. Documentação obrigatória

Para toda mudança crítica:
- **PR description** deve conter:
  - Resumo do "o quê" e "por quê".
  - Áreas tocadas.
  - Critérios de aprovação atendidos (quando aplicável).
  - Plano de rollback.
  - Riscos residuais aceitos.
- **Audit log** em runtime para operações destrutivas ou de identidade.
- **Documento técnico** em `docs/` se introduz padrão novo.

---

## 5. Rollback

### Princípios
- **Reversibilidade ≤ 1 commit** sempre que possível.
- Migrações destrutivas exigem **migração compensatória pronta** antes do merge.
- Rollback de produção deve ser executável por on-call sem aprovação adicional.

### Critérios obrigatórios para rollback (do `RUNBOOK.md §2.3`)
- Erro 5xx > 5% por 5 min consecutivos.
- Falha de autenticação global.
- Vazamento de dados detectado.
- Quebra de cálculo financeiro (golden snapshot falha).

---

## 6. Janelas de mudança

- **Preferencial:** dias úteis 22:00–06:00 BRT para mudanças críticas.
- **Proibido (sem aprovação especial):** mudanças críticas em sexta-feira > 16:00 BRT ou véspera de feriado.
- **Livre:** mudanças normais a qualquer momento.

---

## 7. Auditoria do processo

- PRs ficam no histórico do repositório indefinidamente.
- `audit_logs` retém 365d.
- Mudanças em `docs/compliance/`, `docs/security/`, `docs/operations/` devem citar a PR
  que motivou a revisão.

---

## 8. Itens pendentes de decisão humana

- Substituir owners genéricos no `.github/CODEOWNERS` por handles reais.
- Definir **quórum mínimo** quando uma área tem só 1 owner formalmente designado.
- Acordar **janela de manutenção oficial** com stakeholders.
- Formalizar **fluxo de aprovação** quando reviewer único também é autor (regra de
  segregação de funções).
