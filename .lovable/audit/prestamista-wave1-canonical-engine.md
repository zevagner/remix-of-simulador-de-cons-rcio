# Onda 1 — Engine Canônica do Seguro Prestamista

**Data:** 2026-05-12  
**Status:** ✅ Concluída — fundação criada, **nenhum consumer migrado** (por design).  
**Pré-requisito:** [`prestamista-calculation-deep-audit.md`](./prestamista-calculation-deep-audit.md)

---

## 1. Objetivo da Onda 1

Criar a **única fonte oficial** de cálculo de Seguro Prestamista — tipada, testada e isolada — **sem alterar UI, PDFs, simulador, comparador ou analytics**. As três engines antigas (motor mensal com `getInsuranceRate`, `mipRates.ts` e legado `creditValue × rate`) **continuam ativas** e seguem alimentando a plataforma. A migração ocorrerá nas Ondas 2-4.

---

## 2. Entregáveis

### 2.1 Estrutura de arquivos
```
src/core/finance/prestamista/
├── constants.ts   ← percentuais oficiais + data corte + helpers
├── types.ts       ← tipagem forte (inputs/outputs/enums)
└── index.ts       ← engine pública + re-exports
```

### 2.2 API pública

| Função | Responsabilidade |
|---|---|
| `calculatePrestamistaPremium({ outstandingBalance, cohort?, personType?, enabled? })` | Prêmio mensal de UM mês. **NÃO recebe idade.** |
| `validatePrestamistaEligibility({ proponentAge, termMonths, personType? })` | **ÚNICO lugar** onde a idade entra na regra. |
| `calculatePrestamistaSchedule({ monthlyOpeningBalances, ... })` | Cronograma completo a partir de saldos pré-apurados. |
| `getPrestamistaRate(cohort?)` | Taxa fixa decimal (0,000680 ou 0,000765). |
| `cohortFromContractDate(date)` | Deriva coorte a partir da data de contratação. |

### 2.3 Constantes oficiais centralizadas
```ts
PRESTAMISTA_RATE_LEGACY      = 0.000680   // cotas anteriores a 02/10/2023
PRESTAMISTA_RATE_CURRENT     = 0.000765   // cotas a partir de 02/10/2023
PRESTAMISTA_COHORT_CUTOFF_ISO = '2023-10-02'
PRESTAMISTA_MAX_AGE_AT_END   = 80
PRESTAMISTA_MIN_AGE          = 18
DEFAULT_PRESTAMISTA_COHORT   = 'post_2023_10_02'
```

### 2.4 Tipos públicos
`PrestamistaCohort`, `PersonType`, `PrestamistaPremiumInput/Result`, `PrestamistaEligibilityInput/Result`, `PrestamistaScheduleInput/Result/Row`.

---

## 3. Aderência à regra oficial

| Regra | Implementação |
|---|---|
| Fórmula = saldo × taxa fixa | ✅ `base × rate` em `calculatePrestamistaPremium` |
| Percentual NÃO varia por idade | ✅ Input não aceita idade (compile-time guard) |
| Percentual NÃO varia por tipo/modalidade | ✅ Engine não recebe `consortiumType` |
| Cota antiga 0,0680% | ✅ `PRESTAMISTA_RATE_LEGACY` |
| Cota nova 0,0765% | ✅ `PRESTAMISTA_RATE_CURRENT` |
| Idade só na elegibilidade (≤ 80a) | ✅ `validatePrestamistaEligibility` isolado |
| PJ sem prestamista | ✅ Retorna `premium=0`, `eligible=false`, `reason='pj'` |

---

## 4. Cobertura de testes — `src/test/prestamistaCanonical.test.ts`

**26/26 testes passando** ✅

Categorias cobertas:
- ✅ Constantes oficiais (3 testes)
- ✅ Data de corte 02/10/2023 (3 testes)
- ✅ PF nova / PF antiga / saldos típicos (3 testes)
- ✅ PJ explícito (1 teste)
- ✅ Toggle desabilitado / saldo zerado / saldo negativo (3 testes)
- ✅ Elegibilidade — idade + prazo ≤ 80a, PJ, idade < 18, NaN (7 testes)
- ✅ Cronograma completo + diferença cotas (3 testes)
- ✅ **Baseline snapshots** congelando comportamento (3 inline snapshots)

### 4.1 Baselines registrados
| Cenário | Total prêmio | Mês 1 | Mês 200 |
|---|---|---|---|
| PF nova, R$ 363k, 200m, saldo linear decrescente | R$ 27.908,35 | R$ 277,70 | R$ 1,39 |
| PF antiga, mesmo cenário | R$ 24.807,42 | — | — |
| PJ, qualquer cenário | R$ 0,00 | R$ 0,00 | R$ 0,00 |

Razão PF nova / PF antiga ≈ **1,1250** (0,765 / 0,680) — confirma proporcionalidade exata.

---

## 5. Coexistência com engines antigas (estado atual)

| Engine antiga | Localização | Status pós-Onda 1 | Próxima ação |
|---|---|---|---|
| `getInsuranceRate(age)` (4 faixas) | `core/finance/internal/monthlySchedule.ts:60-65` | 🟡 Ativa, alimenta UI/PDF | Substituir em Onda 2 |
| `getMIPRateByAge(age)` (10 faixas) | `utils/mipRates.ts` | 🟡 Ativa | Substituir em Onda 3 |
| `monthlyInsurance = creditValue × rate` | `core/finance/internal/calculations.ts:132-134` | 🟡 Ativa (legado) | Marcar deprecated em Onda 3 |
| `creditValue × MIP × prazo` | `components/modules/structured-ops/structuredOpsConstants.ts` | 🟡 Ativa | Substituir em Onda 3 |
| `DEFAULT_INSURANCE_PERCENT = 0.028933` | `config/consortiumRates.ts:80` | 🟡 Ativa (fallback) | Remover em Onda 4 |

**Nenhum import dessas engines foi alterado.** O comportamento visível ao usuário é idêntico ao pré-Onda 1.

---

## 6. Plano de migração (próximas ondas)

### Onda 2 — Substituir motor mensal (fonte de verdade da UI)
**Escopo:** Trocar dentro de `src/core/finance/internal/monthlySchedule.ts`:
- `getInsuranceRate(currentAge)` → `calculatePrestamistaPremium({ outstandingBalance: balanceStart, ... })`
- Base `(balanceAfterBid + balanceEnd)/2` → `balanceStart` (regra oficial)
- Remover envelhecimento mês a mês
- Remover banner "DIVERGÊNCIA ESPERADA" (linhas 23-49)

**Efeito automático via `reconcileWithSchedule`:** Simulador, Comparador, Investimento (paths que dependem do schedule), PDFs principais, Carteira e Pós-venda passam a refletir a regra oficial **sem alterações nesses módulos**.

**Riscos:** Snapshot de `investmentCalculationsParity` e tolerâncias em `calculationConsistency.test.ts` precisarão ser regenerados.

### Onda 3 — Bypasses pontuais
- `useInvestmentCalculations.ts:147` (`getMIPRateByAge`) → engine canônica
- `structuredOpsConstants.calculateCardResult` → engine canônica (cronograma completo)
- `calculations.ts` legado → marcar `monthlyInsurance` como aproximação `@deprecated`
- Adicionar toggle PF/PJ no `SimulatorContext` + propagar para PDF labels

### Onda 4 — Limpeza e higiene
- Remover `mipRates.ts`, `getInsuranceRate`, `DEFAULT_INSURANCE_PERCENT`
- Atualizar labels visuais ("Seguro 0,0765% a.m. sobre saldo devedor")
- Invalidar `proposal_pdf_cache`
- Marcar `proposals.metadata.prestamista_version = 'v2_fixed_rate'`
- Adicionar memória `mem://logic/consorcio/seguro-prestamista-canonico`

---

## 7. Adapters / TODOs já registrados no código

Cabeçalho de `src/core/finance/prestamista/index.ts` contém marcadores explícitos:
- `TODO[onda-2]` — substituição no motor mensal
- `TODO[onda-3]` — migração de useInvestmentCalculations + structuredOps + toggle PJ
- `TODO[onda-4]` — remoção de engines antigas + invalidação de cache

---

## 8. Score de fundação institucional

| Dimensão | Score Onda 0 (auditoria) | Score Onda 1 |
|---|---|---|
| Aderência à regra oficial (engine canônica) | 2/10 | **10/10** |
| Centralização de percentuais | 4/10 | **10/10** (nova fonte; antigas ainda existem) |
| Tipagem forte (input/output) | 5/10 | **10/10** |
| Tratamento PJ | 0/10 | **10/10** (na engine; consumers ainda não) |
| Cobertura de testes da nova engine | n/a | **10/10** (26 testes) |
| Baselines para comparação futura | 0/10 | **10/10** |
| Migração executada | n/a | **0/10** (intencional — escopo da Onda 1) |
| **Score consolidado da fundação** | **2,2 / 10** | **🟢 8,6 / 10** |

Score sistêmico (incluindo consumers) permanece **4,0/10** até Onda 2. Sobe para ~9,5/10 ao final da Onda 4.

---

## 9. Garantias desta onda

✅ Nenhum arquivo fora de `src/core/finance/prestamista/` e `src/test/prestamistaCanonical.test.ts` foi modificado.  
✅ Build passa, suíte de testes nova passa (26/26), suítes existentes intactas.  
✅ Engine canônica não pode receber idade no cálculo do prêmio (compile-time).  
✅ PJ retorna explicitamente `0` com motivo rastreável.  
✅ Coorte default = cotas novas (0,0765%) — alterável por config futura.  
✅ Cronograma e prêmio singular convergem matematicamente (validado em testes).

---

## 10. Próximo passo recomendado

Aprovar e executar **Onda 2** (substituição dentro do motor mensal). Risco controlado: a mudança é cirúrgica em UM arquivo (`monthlySchedule.ts`) e o reconcile propaga automaticamente para ~80% da plataforma.
