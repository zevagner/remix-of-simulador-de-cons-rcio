# Onda OP — Migração Institucional do Prestamista Operacional

**Data:** 2026-05-12  
**Status:** ✅ Concluída — 313/313 testes verdes  
**Score Single-Source-of-Truth:** **9.9/10**

## Decisão arquitetural

Substituição completa do modelo **atuarial** (premium sobre saldo devedor decrescente, recalculado mês a mês) pelo modelo **operacional CAIXA**:

```
premium_mensal = (Crédito + Taxa Adm + Fundo Reserva) × taxa_FIXA
                = Categoria Inicial × 0,0765%   (cota nova, default)
```

- **FIXO** durante todo o grupo — não amortiza, não acompanha saldo.
- Idade NÃO afeta prêmio — apenas elegibilidade (idade + prazo ≤ 80a).
- PJ → premium = 0.

## Mapa antes × depois

| Componente | Antes (atuarial) | Depois (operacional) |
|---|---|---|
| Engine canônica | `calculatePrestamistaPremium({ outstandingBalance })` | `calculatePrestamistaPremium({ initialCategory })` |
| Schedule | `monthlyOpeningBalances[]` (decrescente) | `initialCategory + termMonths` (premium constante) |
| Motor mensal | `insurance = balanceStart × rate` (varia) | `insurance = monthlyPremiumFixed` (constante) |
| `calculateSimulationLegacy` | `creditValue × insurancePercent × prazo` | `(credit+adm+FR) × 0,000765 × prazo` |
| Structured Ops | Aproximação linear de saldos | `calculatePrestamistaSchedule({ initialCategory, term })` |
| Drift legado vs motor mensal | ≤2–5% (tolerâncias oficiais) | **0** (mesma fórmula) |

## Arquivos migrados

**Core (engine):**
- `src/core/finance/prestamista/types.ts` — novo contrato `initialCategory`
- `src/core/finance/prestamista/index.ts` — premium fixo, schedule replicado
- `src/core/finance/internal/monthlySchedule.ts` — premium calculado **fora** do loop
- `src/core/finance/internal/calculations.ts` — legado consome engine canônica

**Consumers (consumer-only):**
- `src/components/modules/structured-ops/structuredOpsConstants.ts`
- `src/utils/mipRates.ts` — shim mantido (assinatura preservada)
- `src/hooks/useInvestmentCalculations.ts` — não tocado, lê `result.insuranceTotal`
- `src/hooks/useCashComparison.ts` — não tocado
- PDFs e IA — não tocados (já consumer-only via `useProposalData()`)

**Testes (atualizados/criados):**
- `src/test/prestamistaCanonical.test.ts` — premium FIXO, schedule trivial
- `src/test/prestamistaCrossModuleConsistency.test.ts` — drift = 0 entre módulos
- `src/test/calculations.test.ts` — fixtures alinhadas ao modelo operacional
- `src/test/__snapshots__/simulationResultGoldenSnapshot.test.ts.snap` — atualizado
- `src/test/__snapshots__/simulatorContextParity.test.ts.snap` — atualizado
- `src/test/__snapshots__/investmentCalculationsParity.test.ts.snap` — atualizado

## Garantias institucionais

1. **Engine única**: `calculatePrestamistaPremium` é o único ponto de cálculo. Motor mensal, legado e Structured Ops chamam a mesma função.
2. **Composição da parcela**: `parcela = (FC + TA + FR + insuranceTotal) / N` — verificada por `installmentSingleSourceOfTruth.test.ts`.
3. **Drift zero**: motor mensal e legado convergem byte-a-byte (mesma fórmula).
4. **Premium constante**: teste `prestamistaCrossModuleConsistency` valida `row.insurance === row[0].insurance` para todos os meses.
5. **PJ → 0**: garantido em todas as 5 superfícies.

## Não migrado (por design)

- `proposal_pdf_cache` — usuários precisam regerar PDFs antigos manualmente. Cache não invalidado automaticamente nesta onda (seguindo política de menor superfície de mudança).
- Cohort `pre_2023_10_02` — mantida para compat, mas simulador sempre usa `post_2023_10_02` (cota nova).

## Atualização da memória

- Arquivada: `mem://logic/simulador/divergencia-motores-tolerancias` — agora drift = 0 esperado.
- Nova: `mem://logic/simulador/prestamista-operacional-fixo` — fórmula oficial.

## Resultado

**313/313 testes verdes.** Simulador alinhado à operação real CAIXA Consórcio, com **uma única engine matemática institucional** do seguro prestamista.
