# Auditoria Profunda — Cálculo do Seguro Prestamista (MIP)

**Data:** 2026-05-12  
**Status:** 🔴 Divergência sistêmica confirmada — **NENHUMA correção aplicada nesta auditoria** (read-only por design).  
**Escopo:** Todos os módulos da plataforma que produzem ou consomem valor de seguro prestamista.

---

## 0. Regra oficial (referência única para esta auditoria)

| Item | Regra oficial CAIXA |
|---|---|
| Periodicidade | Mensal |
| Base | **Saldo devedor atual do mês** |
| Percentual | **Fixo** |
| Cotas antigas | **0,0680% a.m.** |
| Cotas a partir de 02/10/2023 | **0,0765% a.m.** |
| Variação por idade | **NÃO** |
| Variação por tipo de bem | **NÃO** |
| Variação por modalidade | **NÃO** |
| Idade | **Apenas elegibilidade** (idade + prazo ≤ 80 anos) |
| Pessoa Jurídica | **Sem prestamista** |

Fórmula oficial:

```
seguro_mes = saldo_devedor_inicio_do_mes × taxa_fixa
```

---

## 1. Como o sistema calcula HOJE — três motores coexistindo

### 1.1 Motor mensal atuarial (`src/core/finance/internal/monthlySchedule.ts`)
**Fonte de verdade declarada** para a UI/PDF/Reconcile.

```ts
// linhas 60-65 — TABELA POR IDADE (proibida pela regra oficial)
export function getInsuranceRate(age: number): number {
  if (age <= 30) return 0.0004;   // 0,04% a.m.
  if (age <= 45) return 0.0006;   // 0,06% a.m.
  if (age <= 60) return 0.0010;   // 0,10% a.m.
  return 0.0015;                  // 0,15% a.m.
}

// linhas 327-336 — Base = SALDO MÉDIO do mês, não saldo devedor inicial
const currentAge = proponentAge + (month - 1) / 12;
const insuranceMonthlyRate = useAgeBasedRate
  ? getInsuranceRate(currentAge)             // ❌ taxa varia por idade
  : fallbackInsuranceRate;                   // ✅ taxa fixa (caminho não usado em UI)
const insuranceBase = (balanceAfterBid + balanceEnd) / 2;  // ❌ saldo médio
const insurance = insuranceBase * insuranceMonthlyRate;
```

**Desvios vs regra oficial:**
- ❌ Taxa por **faixa etária** (0,04% a 0,15%) — inexistente no produto real
- ❌ Idade **envelhece mês a mês** dentro do schedule (`proponentAge + (month-1)/12`)
- ❌ Base é o **saldo médio** `(início+fim)/2`, não o saldo devedor de início de mês
- ✅ É decrescente sobre o saldo (correto em forma, errado em base e taxa)

### 1.2 Tabela MIP por idade (`src/utils/mipRates.ts`)
**Tabela paralela** com 10 faixas etárias (0,022866% a 0,043928% a.m.).

```ts
// usada por: SimulatorContext, useInvestmentCalculations, PdfSimulador,
// StructuredOperationsModule, structuredOpsConstants
export function getMIPRateByAge(age: number): number { ... }
```

**Desvios vs regra oficial:**
- ❌ 10 faixas etárias — contraria "percentual FIXO"
- ❌ Valores ≠ 0,0680% / 0,0765%
- ⚠️ Convive com `getInsuranceRate` (motor mensal) **com tabelas DIFERENTES** — drift interno entre os próprios desvios.

### 1.3 Motor agregado legado (`src/core/finance/internal/calculations.ts`)
**Fórmula simplificada** (linha 132-134):

```ts
const monthlyInsuranceRate = insurancePercent / 100;
const monthlyInsurance = creditValue * monthlyInsuranceRate;   // ❌ base = crédito FIXO
const insuranceTotal = monthlyInsurance * termMonths;          // ❌ não decresce
```

**Desvios vs regra oficial:**
- ❌ Base é **valor da carta** (constante), não saldo devedor (decrescente)
- ❌ Total = `mensal × prazo` (linear) — superestima o seguro

### 1.4 Configurações dispersas (`src/config/consortiumRates.ts`)
```ts
DEFAULT_INSURANCE_PERCENT = 0.028933;  // ❌ valor sem origem documentada
```
Usado como fallback em `SimulatorContext` e `useInvestmentCalculations`.

### 1.5 Operações Estruturadas (`src/components/modules/structured-ops/structuredOpsConstants.ts`)
```ts
const monthlyInsuranceRate = getMIPRateByAge(proponentAge) / 100;
insuranceTotal = creditValue * monthlyInsuranceRate * termMonths;  // ❌ idem legado
```
Mesmo erro do legado (base = crédito constante) **+** taxa por idade da tabela MIP.

---

## 2. Onde a IDADE entra no cálculo (não deveria)

| Arquivo | Linha | O que faz |
|---|---|---|
| `core/finance/internal/monthlySchedule.ts` | 60-65, 331-334 | `getInsuranceRate(age)` + envelhecimento mês a mês |
| `utils/mipRates.ts` | 21-46 | Tabela 10 faixas etárias |
| `components/modules/simulator/SimulatorContext.tsx` | 510-512, 524, 550, 623 | `mipRate = getMIPRateByAge(input.proponentAge)` propagado a TODOS os results |
| `hooks/useInvestmentCalculations.ts` | 42, 147 | `effectiveInsurancePercent = insuranceEnabled ? getMIPRateByAge(proponentAge) : 0` |
| `components/modules/StructuredOperationsModule.tsx` | 6, 199 | label "Seguro MIP" por faixa etária |
| `components/modules/structured-ops/structuredOpsConstants.ts` | calc | `getMIPRateByAge` em `calculateCardResult` |
| `components/pdf/PdfSimulador.tsx` | 148 | exibe `mipRate × getMIPAgeRangeLabel(age)` |
| `components/pdf/PdfAnaliseFinanceira.tsx` | 597 | mostra `effectiveInsurancePercent` |
| `components/modules/SimulatorModule.tsx` | 24, 159, 189 | UI "Seguro (MIP) — faixa etária" |

**Onde a idade DEVERIA entrar:** Apenas em `validateAgeAndTerm` (já existe em `monthlySchedule.ts` linhas 391+) — **elegibilidade idade + prazo ≤ 80 anos**.

---

## 3. Mapa de impacto — todos os consumers

### 3.1 Consumers diretos do valor de seguro

| Módulo | Componente | Consumo |
|---|---|---|
| **Simulador** | `SimulatorActuarialCard` | `r.insurance` por mês (motor mensal) |
| **Simulador** | `InstallmentCompositionTable` | `result.monthlyInsurance` + `result.insuranceTotal` (reconcile) |
| **Simulador** | `SimulatorResultsSection` | totais de custo |
| **Simulador** | `SimulatorConsortiumDataCard` | exibição faixa MIP |
| **Comparador** | `ComparatorModule` + `ConsortiumComparisonTab` + `FinancingComparisonTab` | `insuranceTotal` para custo total |
| **Investimento** | `useInvestmentCalculations` | `effectiveInsurancePercent` em paths 1-6 |
| **Investimento** | `ConsortiumDataCard`, `CashComparisonTab`, `StrategicNicheCards`, `InvestmentPdfActions` | totais com seguro |
| **Operações Estruturadas** | `StructuredOperationsModule` + `StructuredOpsConsolidated` + `StructuredOpsCardForm` | `insuranceTotal` por carta + consolidado |
| **PDF** | `PdfSimulador` | parcela com seguro + faixa etária visível |
| **PDF** | `PdfAnaliseFinanceira` | `effectiveInsurancePercent` |
| **PDF** | `PdfOperacoesEstruturadas` | seguro consolidado |
| **PDF** | `proposta/pages/SimulationPage` + `ComparisonPages` | seguro na composição |
| **Proposta** | `ProposalPdfModule` | herda do simulator/comparator |
| **Hook caixa** | `useCashComparison` | desconta seguro do fluxo |

### 3.2 Consumers indiretos (impacto agregado)

- **Cockpit** — KPIs de custo total (`totalCost`, `effectiveClientCost`)
- **Carteira / Pós-venda** — `priceMonthlyPayment`, `installment`, `total_cost` salvos em `proposals`/`post_sale_clients`
- **Analytics** — eventos `proposal_created`, `pdf_generated` carregam totais
- **CRM/Pipeline** — ticket médio, forecast (usa `total_cost` da `proposals`)
- **Storytelling IA** — `proposalGenerator.ts`, `investmentProposalGenerator.ts` recebem totais reconciliados
- **Resumo executivo** + **timeline** + **gráficos de composição** — consomem o agregado

### 3.3 Reconciliação central (ponto único de injeção)

`src/core/finance/internal/reconcile.ts` (linhas 44-56):
```ts
const insuranceTotalReal = schedule.totalInsurance;
const monthlyInsuranceAvg = insuranceTotalReal / safeTerm;
// reconciled.insuranceTotal ← schedule.totalInsurance
// reconciled.monthlyInsurance ← totalInsurance / termMonths
```
**Toda a UI da sessão atual** (Simulador → Comparador → Investimento → PDF → Carteira) consome o `reconciled` que vem do **motor mensal**. Corrigir o motor mensal corrige ~80% da plataforma de uma vez.

**Exceções que NÃO passam pelo reconcile** (correção precisa ser dupla):
- `useInvestmentCalculations` para cenários paramétricos (path 5, path 6 com INCC) — usa `getMIPRateByAge` direto
- `structuredOpsConstants.calculateCardResult` — não usa schedule; calcula `creditValue × MIP × prazo`
- PDF `PdfSimulador` e `PdfAnaliseFinanceira` exibem o **percentual** vindo de `getMIPRateByAge` (label visual)

---

## 4. Diferenças por tipo de bem

| Tipo | Engine atual | Comportamento |
|---|---|---|
| Imobiliário | mesmo motor mensal + tabela MIP por idade | seguro mensal varia por idade |
| Auto | mesmo motor + mesma tabela | idem |
| Pesados | mesmo motor + mesma tabela | idem |

**Resultado:** Não há diferenciação por tipo de bem hoje (correto), mas a fórmula compartilhada está errada para todos. **Não há tratamento de PJ** em nenhum motor.

---

## 5. Cálculo do saldo devedor mensal

`monthlySchedule.ts` decompõe o saldo em 3 componentes (Crédito + TA + FR), aplica:

1. Reajuste anual (mês 13/25/...) — TA reajusta 50%
2. Snapshot `balanceStart`
3. **Lance ANTES** da amortização
4. Amortização proporcional sobre `balanceAfterBid`
5. **Seguro sobre `(balanceAfterBid + balanceEnd)/2`** ← deveria ser `balanceStart`
6. `balanceEnd = balanceCredit + balanceAdminFee + balanceReserveFund`

**Observação importante:** O cronograma de saldo está **conceitualmente correto** — o problema é que a **base do seguro usa saldo médio**, não saldo devedor de início de mês. Isto ainda subestima/superestima o seguro mês a mês mesmo quando a taxa fosse correta.

---

## 6. PJ — confirmação de que NÃO é tratado

Busca por `isPJ`, `pessoaJuridica`, "PJ" no contexto de cálculo: **zero ocorrências em motores financeiros**. PJ aparece apenas como categoria de copywriting/objeções/CRM. **Hoje, se um corretor simular para PJ, o sistema cobra seguro indevidamente** em todos os módulos.

---

## 7. Inconsistências e riscos sistêmicos

### 7.1 Múltiplas fórmulas conflitantes
| # | Engine | Taxa | Base | Resultado |
|---|---|---|---|---|
| 1 | `getInsuranceRate` (4 faixas) | 0,04–0,15% | saldo médio | usado pelo motor mensal (UI/PDF) |
| 2 | `getMIPRateByAge` (10 faixas) | 0,0229–0,0439% | crédito × prazo | usado por StructuredOps + Investment + label PDF |
| 3 | Legado | `insurancePercent`/100 | `creditValue` fixo | usado em `calculateSimulationLegacy` |
| 4 | Default | 0,028933% | crédito | fallback constante |

→ Para um mesmo cliente de 35 anos, R$ 300k, 200m: cada engine devolve um valor de seguro **diferente**.

### 7.2 Drift entre módulos
- Simulador mostra um seguro (tabela 1)
- Operações Estruturadas mostra outro (tabela 2 + base errada)
- PDF mostra label da tabela 2 mas valor calculado pela tabela 1
- Comparador "vs financiamento" usa MIP do financiamento (`DEFAULT_FINANCING_MIP_RATE = 0.02`) vs MIP do consórcio (tabela 1) — **comparação injusta**

### 7.3 Caches e snapshots
- `proposal_pdf_cache` armazena PDFs com seguro errado — **invalidar após correção**
- `proposals.total_cost`, `installment` salvos em DB refletem o cálculo antigo — **não recalcular retroativamente**, mas sinalizar versão

### 7.4 Testes que cristalizam o erro
- `src/test/calculations.test.ts` (linhas 260-277) valida a tabela `getMIPRateByAge` como "correta"
- `src/tests/calculationConsistency.test.ts` aceita tolerância 5% para idade ≥ 45 — justificada como "refino atuarial"
- `src/test/insuranceToggle.test.ts` documenta o bug do toggle (zerar `insurancePercent` não desliga)
- **Snapshots:** `investmentCalculationsParity.test.ts.snap` precisará ser regenerado

### 7.5 Banner "DIVERGÊNCIA ESPERADA" no `monthlySchedule.ts`
O comentário (linhas 23-49) **legitima** o desvio atuarial como feature. Após a correção, todo esse bloco deixa de fazer sentido.

---

## 8. Arquitetura correta proposta

### 8.1 Fonte única canônica

Criar `src/config/prestamista.ts` (ou estender `consortiumRates.ts`):

```ts
/** Taxas oficiais CAIXA — Seguro Prestamista (MIP), fixas, NÃO variam por idade. */
export const PRESTAMISTA_RATE_LEGACY = 0.000680;  // cotas antigas — 0,0680%
export const PRESTAMISTA_RATE_CURRENT = 0.000765; // cotas a partir de 02/10/2023 — 0,0765%

export type PrestamistaCohort = 'pre_2023_10_02' | 'post_2023_10_02';

/** Retorna a taxa fixa mensal aplicável (decimal). */
export function getPrestamistaRate(cohort: PrestamistaCohort = 'post_2023_10_02'): number {
  return cohort === 'pre_2023_10_02' ? PRESTAMISTA_RATE_LEGACY : PRESTAMISTA_RATE_CURRENT;
}

/** PJ não tem prestamista. */
export function hasPrestamista(personType: 'PF' | 'PJ'): boolean {
  return personType === 'PF';
}
```

### 8.2 Fórmula canônica em `monthlySchedule.ts`

```ts
// REMOVER: getInsuranceRate(age), saldo médio, envelhecimento
// SUBSTITUIR POR:
const rate = insuranceEnabled && hasPrestamista(personType)
  ? getPrestamistaRate(cohort)
  : 0;
const insurance = balanceStart * rate;   // ← saldo devedor INÍCIO do mês
```

### 8.3 Deprecar/remover

- ❌ `src/utils/mipRates.ts` — tabela inteira (manter apenas durante migração com warning)
- ❌ `getInsuranceRate(age)` em `monthlySchedule.ts`
- ❌ `DEFAULT_INSURANCE_PERCENT = 0.028933` em `consortiumRates.ts`
- ❌ Cálculo `creditValue × MIP × prazo` em `structuredOpsConstants.ts` → trocar por chamada ao motor mensal
- ❌ Cálculo `monthlyInsurance = creditValue × rate` em `calculations.ts` legado → fórmula sobre saldo (ou marcar como aproximação grosseira)
- ❌ Banner "divergência esperada" em `monthlySchedule.ts`
- ❌ Bloco "Seguro (MIP) — faixa etária" em PDFs e UI

### 8.4 Adicionar

- ✅ Toggle PF/PJ no `SimulatorContext` (zera seguro quando PJ)
- ✅ Toggle de cohort (cota antiga vs nova) — opcional, default = 0,0765%
- ✅ Validação `idade + prazo ≤ 80 anos` (já existe — manter)
- ✅ Migration flag em `proposals.metadata.prestamista_version = 'v2_fixed_rate'` para rastrear cálculos pós-correção

---

## 9. Estratégia segura de migração (3 ondas)

### Onda 1 — Centralização SEM mudança de comportamento
- Criar `src/config/prestamista.ts` com constantes oficiais
- Adicionar testes "characterization" que congelam **valor atual** de cada motor (baseline)
- Sem alterar UI nem PDFs

### Onda 2 — Substituir motor mensal (fonte de verdade)
- Trocar `getInsuranceRate(age)` por `getPrestamistaRate(cohort)`
- Trocar base `(balanceAfterBid + balanceEnd)/2` por `balanceStart`
- Atualizar tolerâncias em `calculationConsistency.test.ts`
- Regenerar snapshot `investmentCalculationsParity.test.ts.snap`
- Remover banner "divergência esperada"
- Resultado: **Simulador, Comparador, PDF principal, Carteira, Pós-venda corrigidos** via reconcile

### Onda 3 — Limpar bypasses
- `useInvestmentCalculations` → consumir `effectiveInsurancePercent` da fonte única
- `structuredOpsConstants.calculateCardResult` → usar motor mensal (ou função `monthlyPrestamistaSchedule(saldo, prazo, rate)`)
- `calculations.ts` legado → fórmula corrigida sobre saldo aproximado linear ou marcar `@deprecated`
- Adicionar suporte PJ (toggle)
- Remover `mipRates.ts` (export final = `@deprecated` por 1 release, depois delete)

### Onda 4 — Higiene
- Invalidar `proposal_pdf_cache`
- Atualizar todos os labels visuais ("Seguro 0,0765% a.m. sobre saldo devedor")
- Remover `getMIPAgeRangeLabel` da UI/PDFs
- Documentar regra em `mem://logic/consorcio/seguro-prestamista-canonico`

---

## 10. Before / After matemático

**Cenário:** Imóvel R$ 300.000, prazo 200 meses, idade 35, sem lance.

| Item | Antes (motor mensal atual) | Depois (regra oficial 0,0765%) | Δ |
|---|---|---|---|
| Taxa mensal | 0,06% (faixa 31-45) | 0,0765% (fixa) | +0,0165 p.p. |
| Base | saldo médio | saldo início do mês | base maior nos primeiros meses |
| Seguro mês 1 | ~ R$ 195 (saldo médio ≈ 325k × 0,06%) | ~ R$ 268 (saldo 350k × 0,0765%) | **+37%** |
| Seguro mês 100 | ~ R$ 100 | ~ R$ 134 | **+34%** |
| Seguro total (200m) | ~ R$ 19.700 | ~ R$ 27.000 | **+37%** |

**Cenário:** Auto R$ 80.000, prazo 80 meses, idade 55.

| Item | Antes | Depois | Δ |
|---|---|---|---|
| Taxa mensal | 0,10% (faixa 46-60) | 0,0765% (fixa) | **−0,0235 p.p.** |
| Seguro total | ~ R$ 3.300 | ~ R$ 2.530 | **−23%** |

**Cenário:** PJ — qualquer caso.

| Item | Antes | Depois |
|---|---|---|
| Seguro total | cobrado indevidamente (~R$ 20k+) | **R$ 0** |

→ Impacto **não-uniforme**: clientes jovens / prazos longos pagarão **mais** seguro do que o sistema mostra hoje; clientes 50+ pagarão **menos**; PJ deixa de ter seguro. Em termos de "ticket médio do plano", varia de −5% a +8% conforme perfil.

---

## 11. Riscos sistêmicos resumidos

| Risco | Probabilidade | Severidade | Mitigação |
|---|---|---|---|
| PDFs antigos em cache divergem dos novos | Alta | Média | Invalidar `proposal_pdf_cache` após Onda 2 |
| `proposals.total_cost` salvo no DB fica defasado | Alta | Baixa | Marcar `prestamista_version` em metadata; não recalcular retroativo |
| Snapshots de teste quebram em massa | Certa | Baixa | Regenerar com revisão humana |
| Comparador "vs financiamento" muda veredito | Média | Média | Documentar mudança no relatório de saída |
| IAs de proposta usam totais antigos no contexto | Baixa | Baixa | Cache `aiResponseCache` é tenant-aware com TTL — vai expirar |
| Cliente percebe diferença em propostas já enviadas | Média | Alta | Comunicar via changelog interno; não reemitir PDF sem trigger explícito |
| Comissão / forecast usa `total_cost` velho | Baixa | Média | `salesForecast` recalcula on-demand — auto-corrige |

---

## 12. Score final de consistência financeira

| Dimensão | Score |
|---|---|
| Aderência à regra oficial | **2/10** — 3 motores, 4 tabelas, 0 corretos |
| Centralização | **4/10** — fachada `core/finance` existe mas não impede drift de fórmula |
| Cobertura por testes | **6/10** — testes existem mas validam o comportamento errado |
| Tratamento PJ | **0/10** — inexistente |
| Auditabilidade | **7/10** — código bem comentado (mesmo que errado) |
| Resiliência a regressão | **5/10** — reconcile centraliza UI mas bypasses persistem |
| **Score consolidado** | **🔴 4,0 / 10** |

---

## 13. Próximos passos recomendados (NÃO executados nesta auditoria)

1. **Aprovar arquitetura proposta** (seção 8) — decisão de produto sobre cohort default e suporte PJ.
2. **Confirmar percentuais oficiais** com documentação CAIXA anexada.
3. **Executar Onda 1** (centralização sem mudança de comportamento) — risco zero, abre caminho.
4. **Executar Ondas 2-4** em sequência, com regression suite verde entre cada onda.
5. **Adicionar regra ao `mem://`**: `Seguro Prestamista é fixo (0,0680% antigas / 0,0765% novas), sobre saldo devedor de início de mês, idade só para elegibilidade, PJ sem seguro.`

---

**Conclusão:** O sistema hoje **não calcula o Seguro Prestamista conforme a regra oficial CAIXA em nenhum módulo**. Existem três motores divergentes, quatro tabelas etárias inexistentes na realidade do produto, e PJ é cobrado indevidamente. A correção é viável, segura e centralizável em ~80% via motor mensal + reconcile, com bypasses pontuais a tratar nas Ondas 3-4.
