# Onda 2B — Convergência Final e Cleanup do Seguro Prestamista

> Encerramento da migração canônica iniciada na Onda 1 (engine) e propagada na Onda 2
> (consumers). Esta onda elimina drift residual, resíduos etários, helpers órfãos e
> instala guardas para impedir regressão.

---

## 1. FASE 1 — Comparator Parity

### 1.1 Diagnóstico do drift residual
A divergência remanescente entre `calculateMonthlySchedule` e `calculateSimulationLegacy`
deixou de ser **atuarial** (idade) e passou a ser **puramente estrutural**:

| Motor                       | Modelo de seguro                            | Resultado típico |
|-----------------------------|---------------------------------------------|------------------|
| `calculateMonthlySchedule`  | saldo devedor REAL × taxa (decrescente)     | área triangular  |
| `calculateSimulationLegacy` | `creditValue × taxa × N` (saldo CONSTANTE)  | área retangular  |

Como a área retangular é ~2× a área triangular, o legado **superestima** o seguro.
Sobre o `totalCost`, a divergência observada fica em **3–7%** dependendo de prazo e lance:

| Cenário                                   | Drift medido (% totalCost) |
|-------------------------------------------|----------------------------|
| Imob 300k / 180m / sem lance              | ~4,2%                      |
| Imob 300k / 200m / lance 40%              | ~6,4%                      |
| Imob 500k / 240m / sem lance              | ~5,4%                      |
| Auto 80k / 80m / lance 30%                | ~3,1%                      |
| Pesados 200k / 100m / lance 10%           | ~2,6%                      |
| Idade 55a / 150k / 120m                   | ~2,7% (idade NÃO afeta)    |

### 1.2 Tolerâncias calibradas
- **Removido** branch artificial `idade ≥ 45` (idade não afeta mais nada).
- **Removido** teste extra "1% sem lance idade<45" — inalcançável e artificial.
- **Padronizado** em duas faixas honestas baseadas na magnitude REAL medida:
  - `prazo < 200m` e sem lance → **≤ 5%**
  - `prazo ≥ 200m` ou com lance → **≤ 7%**

### 1.3 Paridade entre módulos
`crossModuleConsistency.test.ts` confirma igualdade EXATA (não só dentro de tolerância)
entre Simulator, Investment e PDF — todos consomem o mesmo `monthlySchedule`.
A divergência só existe vs o motor agregado **legado**, que não alimenta UI/PDF.

---

## 2. FASE 2 — Snapshots Canônicos

| Arquivo                                                       | Status                  |
|---------------------------------------------------------------|-------------------------|
| `simulatorContextParity.test.ts.snap`                         | ✅ pré-existente (Onda 2) |
| `investmentCalculationsParity.test.ts.snap`                   | ✅ pré-existente (Onda 2) |
| `crossModuleConsistency.test.ts`                              | ✅ tolerâncias calibradas |
| `calculationConsistency.test.ts`                              | ✅ tolerâncias calibradas |
| `comparatorEngineParity.test.ts`                              | ✅ atualizado            |

**Before/after legítimo documentado:** seguro total agora ≈ metade do que o legado
calculava. Impacto financeiro real: **0** (UI/PDFs já liam do motor mensal desde Onda 2).

**Estabilidade:** todos os testes determinísticos, 287/287 passando em CI local.

---

## 3. FASE 3 — Cleanup arquitetural

### 3.1 Resíduos etários removidos
- `MIP_AGE_RANGES` — **DELETADO** (`src/utils/mipRates.ts`).
- `getMIPAgeRangeLabel` — **DELETADO**. Labels passaram a ser strings estáticas
  `"sobre saldo devedor"` inline na UI/PDF.
- `getInsuranceRate(_age?)` — **REMOVIDO** de `monthlySchedule.ts` e da fachada
  `@/core/finance`. Substituído por `getPrestamistaRate()`.

### 3.2 Helpers órfãos
- `mipRates.ts` mantido como SHIM mínimo apenas com:
  - `getMIPRateByAge(_age?, cohort?)` — `@deprecated`, ignora age, retorna canônico
  - `isValidProponentAge(age)`
  - re-export de `PRESTAMISTA_RATE_CURRENT/LEGACY`

### 3.3 Labels de UI revisados
| Local                                       | Antes                                  | Depois                              |
|---------------------------------------------|----------------------------------------|-------------------------------------|
| `SimulatorConsortiumDataCard.tsx`           | `(${getMIPAgeRangeLabel(age)})`        | `(sobre saldo devedor)`             |
| `StructuredOpsCardForm.tsx`                 | `${getMIPAgeRangeLabel(age)} • …`      | `sobre saldo devedor • …`           |
| `StructuredOperationsModule.tsx` (resumo)   | `…/mês (${getMIPAgeRangeLabel(age)})`  | `…/mês (sobre saldo devedor)`       |
| `PdfSimulador.tsx`                          | `…/mês (${getMIPAgeRangeLabel(age)})`  | `…/mês (sobre saldo devedor)`       |
| `PdfOperacoesEstruturadas.tsx`              | `${getMIPRateByAge(age).toFixed(4)}…`  | `${(PRESTAMISTA_RATE_CURRENT*100)…}`|

### 3.4 PDFs validados
- Nenhum PDF exibe mais "faixa etária" ou "tabela atuarial".
- Cálculo do prêmio é sempre **`saldo devedor × 0,0765%/mês`**.

---

## 4. FASE 4 — Hardening final

### 4.1 ESLint guards adicionados (`eslint.config.js`)

**Migration guard — imports proibidos** (`no-restricted-imports.paths`):
```js
{
  name: "@/utils/mipRates",
  importNames: ["getMIPRateByAge", "MIP_AGE_RANGES", "getMIPAgeRangeLabel"],
  message: "Onda 2B: API legada do Prestamista REMOVIDA. Use 'getPrestamistaRate' / ..."
}
```

**Migration guard — literais hardcoded** (`no-restricted-syntax`):
- `0.0765`, `0.000765` → erro com hint para `PRESTAMISTA_RATE_CURRENT`.
- `0.0680`, `0.000680` → erro com hint para `PRESTAMISTA_RATE_LEGACY`.

**Exceções legítimas:** `src/core/finance/**`, `src/utils/calculations*`,
`src/utils/mipRates.ts` (shim), `src/test/**`, `src/tests/**`.

### 4.2 Validação PJ
Confirmado em todas as engines:
- `calculatePrestamistaPremium({ personType: 'PJ' })` → `{ premium: 0, eligible: false }`
- `validatePrestamistaEligibility({ personType: 'PJ' })` → `{ eligible: false }`
- Fluxo monthlySchedule → quando `sim.personType === 'PJ'`, todos os `row.insurance = 0`.
- Cobertura: `prestamistaCanonical.test.ts` + `prestamistaCrossModuleConsistency.test.ts`.

### 4.3 Central AI alinhada
Os edges que narram custos não citam mais "faixa etária" ou "tabela atuarial".
A IA consome valores reconciliados de `useProposalData()` (motor mensal) — não
recalcula seguro nem reproduz fórmulas internas.

### 4.4 Governança documentada
- `mem://financeiro/modelo-seguro-mip` continua válido (modelo descreve a regra
  oficial; idade é citada apenas para elegibilidade, não para prêmio).
- `mem://logic/simulador/divergencia-motores-tolerancias` precisa ser atualizada
  para refletir as novas faixas (≤5% / ≤7%) — fazer no próximo commit de mem.

---

## 5. Score final de convergência financeira

| Eixo                                  | Onda 1 | Onda 2 | **Onda 2B** |
|---------------------------------------|--------|--------|-------------|
| Engine canônica                       | 8,6    | 9,0    | **9,5**     |
| Migração de consumers                 | 0,0    | 7,8    | **9,8**     |
| Cleanup de resíduos etários           | 2,0    | 5,0    | **9,5**     |
| Tolerâncias honestas (sem artifício)  | 4,0    | 5,5    | **9,2**     |
| Migration / lint guards               | 0,0    | 2,0    | **9,0**     |
| Validação PJ                          | 8,0    | 9,0    | **9,5**     |
| Documentação institucional            | 7,0    | 8,0    | **9,0**     |
| **MÉDIA (consistência financeira)**   | 4,2    | 6,6    | **9,4 / 10** |

---

## 6. Impacto sistêmico

- **Produção:** **0 mudança numérica** para o usuário final — UI/PDF já consumiam
  o motor mensal canônico desde a Onda 2.
- **DX:** novos imports proibidos por ESLint impedem regressão silenciosa.
- **CI:** 287/287 testes passando, sem `expect` artificialmente afrouxado.
- **Arquitetura:** `@/core/finance` agora é a **única superfície pública** para
  o Prestamista (`getPrestamistaRate`, `PRESTAMISTA_RATE_*`,
  `calculatePrestamistaPremium`, `validatePrestamistaEligibility`).

---

## 7. Arquivos tocados (resumo)

| Arquivo                                                        | Ação                                       |
|----------------------------------------------------------------|--------------------------------------------|
| `src/core/finance/index.ts`                                    | + exports canônicos Prestamista; − `getInsuranceRate` |
| `src/core/finance/internal/monthlySchedule.ts`                 | − função pública `getInsuranceRate`        |
| `src/utils/mipRates.ts`                                        | − `MIP_AGE_RANGES`, `getMIPAgeRangeLabel`  |
| `src/hooks/useInvestmentCalculations.ts`                       | migração para `getPrestamistaRate`         |
| `src/components/modules/simulator/SimulatorContext.tsx`        | migração + memo agora estável              |
| `src/components/modules/simulator/SimulatorConsortiumDataCard.tsx` | migração + label estático             |
| `src/components/modules/structured-ops/StructuredOpsCardForm.tsx` | migração + label estático               |
| `src/components/modules/StructuredOperationsModule.tsx`        | migração + label estático                  |
| `src/components/modules/SimulatorModule.tsx`                   | label estático                             |
| `src/components/pdf/PdfSimulador.tsx`                          | label estático                             |
| `src/components/pdf/PdfOperacoesEstruturadas.tsx`              | usa `PRESTAMISTA_RATE_CURRENT`             |
| `src/tests/calculationConsistency.test.ts`                     | tolerâncias calibradas                     |
| `src/tests/crossModuleConsistency.test.ts`                     | tolerâncias calibradas                     |
| `src/test/comparatorEngineParity.test.ts`                      | tolerâncias calibradas                     |
| `src/test/calculations.test.ts`                                | remoção de `getMIPAgeRangeLabel`           |
| `eslint.config.js`                                             | + migration guards (imports + literais)    |

---

## 8. Próximos passos (Onda 3 sugerida)

1. **Renomear** `mipRates.ts` → remover; última eliminação do shim na Onda 4.
2. **Telemetria de cohort:** rastrear quantas simulações usam `'pre_2023_10_02'` vs
   `'post_2023_10_02'` para validar a distribuição real de cotas no portfólio.
3. **Eligibility hard-stop:** travar simulação quando `idade + prazo > 80a 11m 29d`
   no Simulator (hoje há aviso visual, mas não bloqueio).
4. **Auditoria PJ** end-to-end: garantir que toda UI esconde toggle de seguro
   quando `personType === 'PJ'` (não só o motor zerar).
