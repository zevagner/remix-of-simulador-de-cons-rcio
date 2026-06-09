---
name: KPI Source Governance
description: ExecutiveKpiPick.source ('engine'|'editorial') sinaliza origem do KPI; ViabilityPreview exibe glifo `~` + rodapé só quando há editorial; default por kind em EXECUTIVE_KPI_DEFAULT_SOURCE
type: feature
---

# KPI Source Governance — Strategy Library Cards

## Regra
Todo `ExecutiveKpiPick` carrega `source: 'engine' | 'editorial'` (explícito
ou default por `kind`). Engine = calculado pela engine financeira canônica;
Editorial = estimativa de mercado/tributária/operacional.

## Default por kind (`EXECUTIVE_KPI_DEFAULT_SOURCE`)
- **engine**: roi, payback, multiplier, preserved, finalPatrimony, profit,
  installment, totalCost.
- **editorial**: monthlyFlow, monthlySaving, annualSaving, coverage, exposure.

## Override por pick
Necessário quando o mesmo `kind` tem natureza diferente entre estratégias
(ex.: `monthlyFlow` em `compra-a-vista` é engine — rendimento de capital
preservado; em `alavancagem-imobiliaria` é editorial — aluguel estimado).

## UX (ViabilityPreview)
- Glifo `~` em `text-[9px] muted-foreground/60 italic` ao lado do label
  quando `source === 'editorial'`.
- Tooltip inclui hint canônico + `EXECUTIVE_KPI_SOURCE_HINT[source]`.
- Rodapé "~ estimativa de mercado · demais valores calculados pela simulação"
  só renderiza quando há ao menos 1 KPI editorial no card.
- Proibido: badge agressiva, cor de alerta, label técnica grande.

## Continuidade consultiva (Compare → Simulator)
CompareWorkspace seleciona a tese mais aderente (`isRecommended` → vencedor
do 1º KPI) e oferece CTA discreto "Simular esta tese" no rodapé do bloco
Winners. Aciona `setActiveStrategy(id, 'compare-winner')` + `navigateTo('simulator')`.
V2 LOCK preservado (hierarchy / COMPARE_MAX=3 / winner+insights+disclaimer únicos).
