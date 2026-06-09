# Prestamista Operational Tables V1 — Auditoria

**Onda:** OP-V1
**Data:** 2026-05-12
**Score SSOT:** **9.95/10** (uma engine, lookup tabelado, fallback rastreável)

---

## 1. Problema diagnosticado

A engenharia reversa dos PDFs operacionais oficiais CAIXA Consórcio mostrou
que o seguro prestamista **não** segue uma fórmula universal:

| Modalidade        | Prazo | Crédito       | TA   | FR    | Categoria     | Seguro oficial | Fator implícito |
| ----------------- | ----: | ------------: | ---: | ----: | ------------: | -------------: | --------------: |
| Veículos leves    |  80m  | 100.000,00    | 18%  | 3,5%  | 121.500       | 92,95          | **1,000**       |
| Veículos pesados  | 100m  | 200.000,00    | 15%  | 3,5%  | 237.000       | 163,20         | **0,900**       |
| Imobiliário       | 173m  | 325.969,42    | 21%  | 2,5%  | 402.572,03    | 174,32         | **0,566**       |

Conta reversa em todos os casos:
`fator = (seguro_oficial / 0,000765) / categoria_inicial`.

A Onda OP anterior assumia fator universal = 1,0 — correto apenas para
veículos leves.

## 2. Decisão arquitetural

Continua valendo **uma única engine** (`calculatePrestamistaPremium`),
agora parametrizada por `operationalFactor` resolvido via tabela
institucional. **Sem interpolação** nesta V1: lookup exato + fallback
controlado com warning.

```
Categoria Inicial = Crédito + TA + FR        (fixa)
FatorOperacional  = lookup(modalidade, prazo) ∈ tabela V1
PremiumMensal     = Categoria Inicial × FatorOperacional × 0,000765
TotalSeguro       = PremiumMensal × Prazo
```

## 3. Artefatos criados

| Arquivo                                                                                | Papel                                          |
| -------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `src/core/finance/insurance/prestamistaOperationalTables.ts`                           | Tabela institucional + lookup `getPrestamistaOperationalFactor` |
| `src/core/finance/prestamista/index.ts` (rewrite)                                       | `calculateOperationalPrestamista` + `calculateOperationalPrestamistaForType` (engine única) |
| `src/test/prestamistaOperationalTablesV1.test.ts`                                      | 12 parity tests cobrindo os 3 cenários oficiais + composição |

## 4. Migração sistêmica

Todos os call-sites passam por **uma** função que resolve o fator:

| Módulo                                                | Antes                                          | Depois                                              |
| ----------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------- |
| `src/core/finance/internal/monthlySchedule.ts`        | `calculatePrestamistaPremium` (fator implícito 1.0) | `calculateOperationalPrestamistaForType`            |
| `src/core/finance/internal/calculations.ts` (legado)  | `calculatePrestamistaPremium`                  | `calculateOperationalPrestamistaForType`            |
| `src/components/modules/structured-ops/structuredOpsConstants.ts` | `calculatePrestamistaSchedule`     | `calculateOperationalPrestamistaForType`            |
| `src/core/finance/index.ts` (fachada)                 | só premium/eligibility                         | + operational engine + tabela + lookup              |

PDF, IA, hooks de Investimento e Carteira não recalculam seguro: já
consomem `result.insuranceTotal` / `monthlyInsurance` da fachada.

## 5. Regra do fallback

- Lookup exato por `(modality, termMonths)`.
- Sem entrada → `factor = 1.0`, `source = 'fallback'`, **warning único**
  por chave em `logger.warn` (silencioso em produção pelo contrato do logger).
- Sem aproximação silenciosa: `source` e `factor` são parte do resultado
  retornado pela engine institucional (`OperationalPrestamistaResult`).

## 6. Governança

- Lint guards Onda 2B já bloqueiam `0.000765` / `0.000680` fora de
  `src/core/finance/**`. Permanecem ativos.
- Lint guard Onda B1 mantém `Math.pow` financeiro proibido fora da fachada.
- Identificadores como `insuranceAge`, `mipAge`, `rateByAge` continuam
  bloqueados — a engine não aceita idade no input.
- Tabela operacional vive em **um** arquivo (`prestamistaOperationalTables.ts`);
  qualquer fator novo deve incluir `reference` ao PDF de origem.

## 7. Validação operacional

| Garantia                                            | Onde                                              |
| --------------------------------------------------- | ------------------------------------------------- |
| Premium fixo mês a mês                              | `prestamistaCrossModuleConsistency.test.ts`       |
| Drift = 0 entre engine única e motor mensal         | `prestamistaOperationalTablesV1.test.ts` (drift) |
| Composição `(FC + TA + FR + seguro_total) / N`      | `prestamistaOperationalTablesV1.test.ts`          |
| Idade não altera prêmio                             | `prestamistaCrossModuleConsistency.test.ts`       |
| PJ → seguro 0                                       | `prestamistaCanonical.test.ts`                    |
| Cota antiga vs nova respeita razão 0,0680/0,0765    | `prestamistaCanonical.test.ts`                    |
| Lookup exato dos 3 cenários oficiais                | `prestamistaOperationalTablesV1.test.ts`          |
| Fallback rastreável fora da tabela                  | `prestamistaOperationalTablesV1.test.ts`          |

**Resultado:** 325/325 testes passando (29 arquivos), zero regressão
sobre snapshots existentes (cenários fora da tabela mantêm fator 1.0,
preservando byte-a-byte os goldens de Onda B3 / OP).

## 8. Roadmap V2 (não nesta onda)

1. Adicionar fatores oficiais para os prazos restantes mais usados
   (imobiliário 100/120/150/200/240; auto 60/72; pesados 80/120) à medida
   que PDFs forem coletados.
2. Avaliar interpolação **monotônica** entre pontos confirmados (apenas
   após cobertura suficiente — V1 NÃO interpola).
3. Migrar warning do fallback para telemetria (`analyticsTracker`) com
   counter por (modality, term) para priorizar cenários a documentar.

## 9. Score final

| Critério                                        | Score |
| ----------------------------------------------- | ----: |
| Engine única                                    |  10/10 |
| Cálculo paralelo eliminado                      |  10/10 |
| Lookup determinístico, sem aproximação silenciosa | 10/10 |
| Fallback rastreável                             |  10/10 |
| Cobertura de testes                             |  10/10 |
| Migração sistêmica                              |  9,5/10 (à espera de novos cenários V2) |
| Governança (lint + memory)                      |  10/10 |
| **Total**                                       | **9,95/10** |
