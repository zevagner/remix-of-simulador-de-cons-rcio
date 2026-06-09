# Consultive Continuity & KPI Governance Final Pass

Onda: fechamento do ciclo consultivo + governança de transparência financeira.
Escopo: cirúrgico — sem refactor, sem novo módulo, sem nova IA, sem mudança visual grande.

---

## Compare Continuity CTA

Adicionado em `src/components/modules/strategy-v2/CompareWorkspace.tsx`:

- Detecta a **tese mais aderente** (`isRecommended` → fallback: vencedora do
  primeiro KPI).
- Renderiza um rodapé discreto no bloco `Winners` com:
  - Label “Tese mais aderente: {título}”.
  - CTA `Simular esta tese` (ghost, h-7, text-[11px], primary text).
- Ação: `setActiveStrategy(id, 'compare-winner')` + `navigateTo('simulator')` +
  `onClose?.()`.
- **V2 LOCK preservado**: zero alteração em hierarchy, COMPARE_MAX=3 intacto,
  Winner+insights únicos+disclaimer único mantidos, sem badge promocional,
  sem novo card.

---

## ActiveStrategyContext Validation

Provider montado em `src/pages/Index.tsx` (verificado).
Consumidores ativos:

| Origem               | Source enum         | Implementado |
| -------------------- | ------------------- | ------------ |
| Strategy Library     | `wealth-library`    | ✅ (CTA dialog) |
| Compare Winner       | `compare-winner`    | ✅ (esta onda)  |
| Deep-link / manual   | `manual`            | reservado    |

Cross-tab sync via `storage` event ativo. TTL: persistente em localStorage
(`active-strategy:v1`) — clear explícito por `clearActiveStrategy()`.

---

## KPI Source Governance

Em `src/components/modules/wealth/strategyExecutiveKpis.ts`:

- Novo tipo `ExecutiveKpiSource = 'engine' | 'editorial'`.
- `EXECUTIVE_KPI_DEFAULT_SOURCE` por `kind`:
  - **engine**: `roi`, `payback`, `multiplier`, `preserved`, `finalPatrimony`,
    `profit`, `installment`, `totalCost`.
  - **editorial**: `monthlyFlow`, `monthlySaving`, `annualSaving`, `coverage`,
    `exposure`.
- `ExecutiveKpiPick.source?` — override por pick.
- `EXECUTIVE_KPI_SOURCE_HINT` — textos canônicos:
  - engine → “Calculado pela simulação”
  - editorial → “Estimativa de mercado”

### Overrides aplicados

| Estratégia                  | Pick           | Source explícito | Justificativa                                         |
| --------------------------- | -------------- | ---------------- | ----------------------------------------------------- |
| `compra-a-vista`            | monthlyFlow    | engine           | Rendimento do capital preservado → engine financeira. |
| `compra-hibrida`            | monthlyFlow    | engine           | Mesma natureza.                                       |
| `reinvestimento-estruturado`| monthlyFlow    | engine           | Renda anual derivada da simulação.                    |

Demais `monthlyFlow` (`alavancagem-imobiliaria`, `autoquitacao-estruturada`,
`multiplicacao-cotas`, `patrimonio-rural`, `renda-passiva`,
`patrimonio-gerador-caixa`) → **editorial** por default (aluguel/cap rate).

---

## KPI Transparency Layer

Em `src/components/modules/wealth/StrategyLibrarySection.tsx` →
`ViabilityPreview`:

- Cada KPI carrega `source` resolvido (`p.source ?? DEFAULT[kind]`).
- Tooltip do label agora concatena hint + origem
  (`{hint} · {sourceHint}`).
- **Ícone discreto**: glifo `~` em `text-[9px] text-muted-foreground/60 italic`
  ao lado do label quando `source === 'editorial'` — sem badge agressiva,
  sem cor de alerta.
- **Rodapé contextual** (só aparece quando há ao menos um KPI editorial):
  > `~ estimativa de mercado · demais valores calculados pela simulação`
  em `text-[9.5px] italic muted/70` — uma linha, zero poluição.

Fallback (estratégias sem entrada no mapa) assume `engine` e não exibe
glifo/rodapé.

---

## Consultive Continuity Validation

Fluxo ponta a ponta funcional:

```
diagnóstico → análise → compare → estratégia → simulador → operação
                          │            │
                          └ "Simular esta tese" (esta onda)
                                       │
                                       └ ActiveStrategyContext propaga id
                                         para o Simulador / Proposta
```

- StrategyLibrary → Simulator: ✅ (onda anterior, CTA no dialog)
- Compare → Simulator: ✅ (esta onda)
- StructuredOps → Simulator: ✅ (onda anterior)

---

## Cross-Module Context Validation

| Cenário                          | Comportamento                                         |
| -------------------------------- | ----------------------------------------------------- |
| Troca de módulo via sidebar      | `activeStrategy` preserva (localStorage).             |
| Reload                           | Hidrata via `load()` no boot do provider.             |
| Nova aba / tab change            | Sync por `storage` event.                             |
| Sem provider (tests / standalone)| `useActiveStrategySafe()` devolve `null` — no-op.     |
| `useModuleNavigation` ausente    | Provider montado globalmente em Index.tsx → ok.       |

---

## Governance Updates

- Memória core ainda válida (paleta, locked V2 areas, Compare regras).
- Novo invariante: `ExecutiveKpiPick.source` deve ser declarado quando o
  default por `kind` não refletir a natureza real do KPI da estratégia.
- Nenhum KPI fake / inventado: todo valor continua vindo de
  `strategy.calculations[index].result(credit)` — engine intocada.

---

## Final System Continuity State

| Eixo                                   | Antes da onda      | Depois              |
| -------------------------------------- | ------------------ | ------------------- |
| Compare → próximo passo                | terminal           | CTA discreto ativo  |
| KPI source clareza                     | implícito          | tipado + visível    |
| Transparência sem poluir UX            | ausente            | glifo `~` + rodapé  |
| ActiveStrategyContext consumers        | 2 (Library/StructOps)| 3 (+ Compare)     |
| V2 LOCK / hierarchy                    | íntegro            | íntegro             |

---

## Final Verdict

O sistema agora apresenta **continuidade consultiva real** — toda análise
patrimonial expõe naturalmente o próximo passo operacional, sem CTA invasivo
ou wizard. KPIs editoriais estão **claramente sinalizados** sem destruir a
elegância consultiva (uma marcação tipográfica `~` + um rodapé curto, only-when-needed).

A plataforma deixa de parecer “várias evoluções tentando coexistir” e passa a
operar como **uma plataforma patrimonial integrada, com governança financeira
transparente** — preservando V2 LOCK, motor canônico e a estética de produto
premium.
