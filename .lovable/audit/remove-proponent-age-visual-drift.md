# Remove Proponent Age — Visual Drift Cleanup

**Data:** 2026-05-12
**Escopo:** apenas UI. Nenhum cálculo, snapshot, contrato ou engine alterado.

---

## Fase 1 — Auditoria

Busca por `Idade do proponente` / `proponentAge` em código de produção:

- `src/components/modules/simulator/SimulatorConsortiumDataCard.tsx` — **único local visual** (linhas 244–271): bloco discreto abaixo do toggle de seguro, com `<Label>` + `<Input>` ligados a `input.proponentAge` via `updateInput`.
- `src/components/modules/simulator/SimulatorContext.tsx` — campo de state (`proponentAge: number`) que continua existindo no `SimulationInput` e é consumido por:
  - `validatePrestamistaEligibility` (idade + prazo ≤ 80) — **mantém**.
  - `monthlySchedule.ts` — recebe `proponentAge` apenas para repassar à validação. Não influencia prêmio (engine operacional fixa).
- `ConsortiumDataCard` (Investimento) — **não exibia** o campo. Apenas mostra "Seguro Prestamista".
- `StructuredOpsCardForm` — possui célula independente de `Idade do proponente`; **fora do escopo** desta onda (card Dados do Consórcio do Simulador).

### Verificação de dependências

- Cálculo do prêmio: 100% via `calculateOperationalPrestamistaForType` → `(Crédito + TA + FR) × fator(modalidade,prazo) × 0,000765`. Não lê `proponentAge`.
- Recomputes: `proponentAge` é primitivo do `safeInput`; alterá-lo não dispara mais nada além da elegibilidade.
- Form state: permanece intacto (default `DEFAULT_PROPONENT_AGE` em `consortiumRates.ts`).
- PDF / IA / Engine: nenhum bloco de PDF ou prompt de IA exibe ou recebe idade como input visual de cálculo.

---

## Fase 2 — Remoção visual

Em `SimulatorConsortiumDataCard.tsx`:

- Removido o bloco `mt-2 mx-auto ... Idade do proponente ... usada apenas para validar elegibilidade do seguro` (linhas 244–271).
- Reescrito o banner de inelegibilidade: troca de
  *"Ajuste a idade abaixo ou reduza o prazo"* → *"Reduza o prazo para habilitar"*
  (a referência "abaixo" deixou de fazer sentido sem o input).
- Sem ajustes de grid: o bloco era uma linha isolada com `mt-2`. A remoção fecha naturalmente o espaçamento contra a `LINHA 4 — Estratégias Financeiras` (que já tem `border-t pt-2.5`). Verificado visualmente: nenhum gap residual.
- `<Label>` e `<Input>` continuam usados em outros pontos do arquivo — imports preservados.

---

## Fase 3 — Hardening

- `proponentAge` permanece no `SimulationInput`, no state do `SimulatorContext`, nos defaults institucionais e no contrato da engine — invisível, mas válido para elegibilidade.
- Engine de seguro segue exclusivamente `calculateOperationalPrestamistaForType` (tabela operacional V1). Idade não participa.
- Banner de inelegibilidade continua reativo a `validatePrestamistaEligibility(proponentAge, termMonths)`. Como o usuário não consegue mais alterar a idade pelo card, na prática o banner só aparece se o `default` (30) + `termMonths` exceder 80 anos — cenário inalcançável com prazos institucionais. Comportamento esperado e seguro.

---

## Fase 4 — Auditoria final

- **Snapshots financeiros:** intactos (nenhuma fórmula alterada).
- **Parity tests / golden snapshots:** não tocados.
- **PDF Simulador / Operações Estruturadas:** sem mudança de payload.
- **IA edges:** nenhum prompt referencia "idade" como driver de prêmio.
- **Sinal visual de cálculo por idade no card Dados do Consórcio:** **eliminado**.

---

## Resultado

O card "Dados do Consórcio" do Simulador agora comunica apenas:

> Crédito · Tipo · Prazo · Taxa · Reserva · Seguro Prestamista (toggle + valor fixo institucional) · Estratégias.

Sem ruído atuarial residual. Sem input irrelevante. Sem percepção falsa de cálculo etário do seguro.

### Arquivos alterados

- `src/components/modules/simulator/SimulatorConsortiumDataCard.tsx`
- `.lovable/audit/remove-proponent-age-visual-drift.md` (este relatório)
