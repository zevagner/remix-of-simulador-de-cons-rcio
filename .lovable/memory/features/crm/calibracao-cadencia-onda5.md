---
name: Pipeline Cadence Calibration (Onda 5)
description: SLA por coluna, período de graça pós-criação e hierarquia visual de alertas; telemetria de fricção
type: feature
---

Calibração da cadência do pipeline para evitar saturação visual mantendo eficácia.

## SLA por coluna (`COLUMN_SLA` em `cadenceRules.ts`)
- **prospeccao**: warn 5d / critical 10d (qualificação tem mais respiro)
- **aguardando_retorno**: warn 3d / critical 7d
- **em_avaliacao**: warn 4d / critical 8d
- **proposta_ajustada**: warn 4d / critical 8d
- Use `getStalenessForStatus(updated_at, status)` nos cards (sensível a coluna).
- `getStalenessLevel(updated_at)` (cadência global 3d/7d) mantida para `AlertsCenter`/`DailyAgenda` que operam sobre a frota inteira.

## Período de graça
- `NEW_LEAD_GRACE_HOURS = 48`. Helper `isInGracePeriod(created_at)`.
- Badge "🎯 Defina a próxima ação" NÃO aparece em leads criados há <48h — evita pressão sobre lead recém-cadastrado.

## Hierarquia visual (`getCardAlertLevel`)
Um único sinal primário por card, em ordem de precedência:
1. `critical` (faixa vermelha + texto destructive "Nd parado")
2. `warn` (faixa amarela + texto warning "Nd parado")
3. `missing-action-strong` (badge vermelho) — idade do lead ≥ `MISSING_ACTION_STRONG_SLA_RATIO * COLUMN_SLA[status].warn` (Onda 7)
4. `missing-action-soft` (badge amarelo) — após graça (48h) e antes do limiar strong
5. `none`

Critical/warn ABSORVEM os badges missing-action.
Onda 7 substituiu o limiar fixo de 5d (Onda 6) por um limiar proporcional ao SLA da coluna (`MISSING_ACTION_STRONG_SLA_RATIO = 0.5`): prospec strong em ~2.5d, aguard_retorno em ~1.5d, em_avaliacao/proposta_ajustada em ~2d.

## Telemetria de fricção (analytics_events)
- `proposal_status_change` — toda mudança de status (com `from`, `to`, `with_action`)
- `proposal_move_cancelled` — usuário cancelou no NextActionModal
- `proposal_next_action_skip` — usuário moveu sem registrar ação (só ocorre em definição avulsa)

Permite medir taxa de cancelamento vs definição para futuras calibrações.

## Anti-padrões
- NÃO ler `staleness` direto pra controlar UI no card; use `alertLevel` para garantir hierarquia.
- NÃO mostrar badge "Defina ação" e faixa colorida ao mesmo tempo.
- NÃO disparar pressão visual sobre lead criado há menos de 48h.
