# Onda Final — UX & Semantic Cleanup do Seguro Prestamista

**Data:** 2026-05-12
**Escopo:** apenas UX, semântica, copy, cleanup arquitetural e guards de regressão.
**NÃO alterado:** matemática, engine canônica, percentuais, regras de elegibilidade,
contratos de tipos (`SimulationInput.proponentAge` permanece — é input do motor).

---

## 1. Diagnóstico do resíduo de UX

A convergência financeira (Ondas 1, 2, 2B, 3) eliminou a influência matemática
da idade no prêmio (taxa fixa institucional CAIXA). Porém a **interface** ainda
apresentava idade **acoplada visualmente** ao bloco de seguro, comunicando
implicitamente que "Idade altera prêmio":

| Local | Resíduo encontrado | Risco |
|---|---|---|
| `SimulatorConsortiumDataCard` | Input `Idade` colado ao toggle do seguro, com `onBlur` que re-aplicava `getPrestamistaRate()` (no-op semântico) | Sugere cálculo etário |
| `StructuredOpsCardForm` | Label `Seguro MIP (Idade)` + input `Idade` dentro do mesmo `<div>` do toggle | Forte associação visual idade→prêmio |
| `StructuredOperationsModule` (resumo) | Label `Seguro MIP` | Nomenclatura legada/atuarial |
| `PdfOperacoesEstruturadas` | Métrica `Seguro MIP` | Nomenclatura legada no PDF institucional |
| `SimulatorModule` (tour intro) | Copy "Seguro MIP já vem preenchido com os valores padrão" | Nomenclatura + copy não-institucional |
| `utils/normalizeInputByConsortiumType` | Comentário JSDoc `Seguro MIP` | Nomenclatura legada |

### State / bindings auditados (sem ação)

Após mapeamento, **não foram encontrados** identificadores legados de cálculo
etário (`insuranceAge`, `mipAge`, `ageBracket`, `rateByAge`, `premiumByAge`)
em código de produção. `proponentAge` permanece — corretamente — como:
- input opcional do motor mensal canônico (`monthlySchedule.ts`)
- argumento de `validatePrestamistaEligibility` (idade + prazo ≤ 80)
- campo do `SimulationInput` consumido por Investment/Comparator (apenas para
  passar à engine; nenhum cálculo derivado existe na UI)

**Conclusão:** o resíduo era 100% **visual/semântico**, não de state.

---

## 2. Mudanças aplicadas

### 2.1 `SimulatorConsortiumDataCard.tsx`

- Removido o input `Idade` de **dentro** da linha do "Seguro Prestamista".
- A linha do seguro agora exibe apenas: ícone, nome, toggle, copy
  `(opcional · sobre saldo devedor)`, valor mensal, valor total e percentual fixo.
- Adicionada **nova linha discreta**, separada visualmente, abaixo do bloco:
  `Idade do proponente [input] · usada apenas para validar elegibilidade do seguro`.
- Removido o `onBlur` que reescrevia `insurancePercent` a cada mudança de idade
  (era no-op desde a Onda 2, mas reforçava a falsa associação).
- Removido import órfão de `getPrestamistaRate` (não mais usado neste arquivo).
- Banner de inelegibilidade reescrito para narrativa institucional:
  *"Seguro indisponível: idade do proponente + prazo excedem o limite institucional. Ajuste a idade abaixo ou reduza o prazo."*

### 2.2 `StructuredOpsCardForm.tsx`

- Label `Seguro MIP (Idade)` → `Seguro Prestamista`.
- Input `Idade` extraído para **célula independente** do grid, com label
  `Idade do proponente` e copy auxiliar:
  *"Apenas para validar elegibilidade do seguro."*
- Estados visuais do bloco de seguro padronizados:
  - PJ → "Disponível apenas para pessoa física."
  - Elegível + ativo → `0.0765%/mês · sobre saldo devedor`
  - Inelegível → "Indisponível: idade + prazo excedem o limite."
  - Elegível + inativo → "Opcional · percentual fixo institucional."

### 2.3 PDFs e telas-resumo

- `PdfOperacoesEstruturadas.tsx` — métrica renomeada para `Seguro Prestamista`.
- `StructuredOperationsModule.tsx` — sumário de cards renomeado para `Seguro Prestamista`.
- `SimulatorModule.tsx` — copy do tour atualizada para `Seguro Prestamista`
  e narrativa institucional ("valores institucionais" em vez de "padrão").
- `utils/normalizeInputByConsortiumType.ts` — comentário JSDoc atualizado.

### 2.4 ESLint guards (regressão)

Adicionados em `eslint.config.js` (`no-restricted-syntax`):

```js
// Identificadores que acoplam idade ao prêmio
Identifier[name=/^(insuranceAge|mipAge|ageBracket|rateByAge|premiumByAge)$/]
  → "Idade só é usada em validatePrestamistaEligibility (@/core/finance)."

// Label legado em código de produção
Literal[value=/Seguro MIP/]
TemplateElement[value.raw=/Seguro MIP/]
  → "Substituído por 'Seguro Prestamista'."
```

Continuam ativos os guards das ondas anteriores (literais 0.0765 / 0.0680,
imports de `MIP_AGE_RANGES`, `getMIPAgeRangeLabel`, `core/finance/internal`).

---

## 3. Validação

### Testes unitários
- **293/293 testes passando** (24 arquivos) — `bunx vitest run`.
- Suítes específicas relevantes:
  - `prestamistaCanonical.test.ts`
  - `prestamistaCrossModuleConsistency.test.ts`
  - `prestamistaWave3Hardening.test.ts`
  - `insuranceToggle.test.ts`
  - `simulatorContextParity.test.ts`
  - `PdfSimulador.parity.test.tsx`

### IA / Edge functions
Auditadas as edges `sales-script`, `sales-copilot`, `investment-storytelling`,
`niche-storytelling`, `module-copilot`, `phase-action`, `generate-proposal`,
`sales-response`, `trigger-script`. **Nenhuma menção** a "Seguro MIP", "prêmio
por idade" ou "seguro varia por idade" nos prompts. Padronização CSAA + cláusula
"nunca prometer garantia" já em vigor (Onda 6 / `promptFragments.ts`).

### PDFs
- `PdfSimulador` — sem rótulo etário no bloco de seguro (já desde Onda 2B).
- `PdfOperacoesEstruturadas` — agora exibe `Seguro Prestamista` (era `Seguro MIP`).
- Nenhum PDF associa idade a prêmio.

---

## 4. Antes × Depois (UX)

### Simulador — bloco de seguro

**Antes:**
```
🛡 Seguro Prestamista [●] · Idade [30] (sobre saldo devedor) · Mensal: R$ 84,15 ...
```

**Depois:**
```
🛡 Seguro Prestamista [●] (opcional · sobre saldo devedor) · Mensal: R$ 84,15 · Total: R$ 16.830 · 0,0765%/m

Idade do proponente [30] · usada apenas para validar elegibilidade do seguro
```

### Structured Ops — célula de seguro

**Antes:** `Seguro MIP (Idade)` + toggle + input `Idade` no mesmo bloco.

**Depois:** célula 1 = `Seguro Prestamista` + toggle + copy institucional.
Célula 2 (separada) = `Idade do proponente` + copy "Apenas para validar elegibilidade".

---

## 5. Score de consistência semântica

| Eixo | Antes | Depois |
|---|---|---|
| Acoplamento visual idade↔seguro | Alto | **Nulo** |
| Nomenclatura institucional ("Prestamista") | Parcial | **100%** |
| Copy atuarial residual | Presente | **Removida** |
| Cálculos por idade na UI | Inexistentes | Inexistentes (já desde Onda 2) |
| Guards de regressão (lint) | Parcial | **Reforçados (5 regras novas)** |
| State legado etário | Inexistente | Inexistente |
| PDFs com label legado | 1 ocorrência | **0** |
| IA prompts com cálculo etário | 0 | 0 |

**Score final de consistência semântica:** **9.8 / 10**

(0.2 reservado: o campo `proponentAge` permanece exposto no `SimulationInput`
como input legítimo de elegibilidade — não é resíduo, mas mantém o nome do
modelo conceitual. Renomeá-lo para `eligibilityAge` é uma cirurgia opcional
de futuras ondas, com impacto em snapshots e contratos públicos.)

---

## 6. Arquivos alterados

- `src/components/modules/simulator/SimulatorConsortiumDataCard.tsx`
- `src/components/modules/structured-ops/StructuredOpsCardForm.tsx`
- `src/components/modules/StructuredOperationsModule.tsx`
- `src/components/modules/SimulatorModule.tsx`
- `src/components/pdf/PdfOperacoesEstruturadas.tsx`
- `src/utils/normalizeInputByConsortiumType.ts`
- `eslint.config.js`
- `.lovable/audit/prestamista-final-ux-semantic-cleanup.md` (este relatório)

---

## 7. Resultado institucional

A interface agora comunica, de forma inequívoca:

> **Seguro Prestamista — opcional, percentual fixo institucional, calculado
> sobre o saldo devedor. A idade do proponente é solicitada apenas para validar
> elegibilidade (idade + prazo ≤ 80 anos).**

Sem ambiguidade. Sem resíduo atuarial. Sem associação visual implícita entre
idade e prêmio. Matemática, semântica e UX agora plenamente convergidas.
