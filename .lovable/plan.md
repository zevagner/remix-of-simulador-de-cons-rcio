# Plano: Correções C1/C2/A1/A2/A3/A4 — pausar para decisão

## Status: bloqueado por governança e premissas

Antes de tocar código, preciso flagar 3 conflitos entre o prompt e a base instalada. Implementar tudo "no escuro" tem alto risco de quebrar os 460 testes e a constituição V2.4.

## Conflitos identificados

### 1. Área locked pela V2.4 Constitution
`src/core/finance/*` está explicitamente em **lockdown** (memory `governance/v2-product-constitution`). Mudança exige justificativa nos 8 critérios. C2, A1, A2, A3, A4 mexem todos em `internal/reconcile.ts`, `internal/monthlySchedule.ts`, `internal/calculations.ts` + `types/consortium.ts`. **Preciso de autorização explícita** para quebrar o lock.

### 2. C2 — premissa contestada pela própria auditoria
Minha auditoria anterior listou C2 como CRÍTICO, mas a **suite de 12 cenários (passo seguinte) provou que o motor está intacto** — todas as invariantes universais passaram. O divisor `insuranceTotalReal / safeTerm` em `reconcile.ts:58` produz a **média sobre o plano inteiro** (definição de "prêmio médio mensal"), que é o que o card "Composição" e PDF exibem hoje. Trocar para `effectiveInsuranceMonths` muda o significado do campo `monthlyInsurance` e pode quebrar:
- `InstallmentCompositionTable` (memory `parcela-canonica-reconcile` trava drift-zero)
- Teste `installmentSingleSourceOfTruth`
- Snapshots golden do `simulation-pipeline-canonico-b3`

Se o objetivo é exibir o **prêmio do primeiro mês com seguro**, o caminho correto é adicionar um campo NOVO (`firstInsurancePremium`), não alterar o significado de `monthlyInsurance`.

### 3. A3 — quebra o `ComparatorModule` em vez de consertar
O comparador hoje usa `netCreditValue` como `propertyValue` **intencionalmente** (memory `estrategia-alavancagem-caixa`): a alavancagem é calculada sobre o crédito que efetivamente vira imóvel/veículo (líquido do lance embutido). Trocar para `contractedCredit` infla artificialmente a vantagem do consórcio vs. compra à vista em 30-50% nos cenários com lance embutido. Isso muda copy/IA/proposta sem o usuário pedir.

### 4. A4 — já foi corrigido em sentido oposto
`reconcile.ts:90-112` tem comentário explícito (BUGFIX 2026-05-15) explicando por que se usa `Math.max(payment)` das `post-bid` em vez de `find('post-bid')`: a primeira `post-bid` em `reduce-term` pode estar truncada/igual à última, e o card "Cenário Pós-Contemplação" precisa da **parcela representativa do esforço**. Aplicar A4 reverte um bug já corrigido e documentado em memória.

## O que posso fazer com segurança agora (sem decisão sua)

Nenhum dos 6 itens é seguro tocar sem você confirmar:
- C1 é refactor grande (~200 linhas) em consumer; baixo risco matemático mas alto risco de regressão em StructuredOps UI/PDF
- C2/A3/A4 mudam significado de campos canônicos consumidos em todo o app
- A1 (clamp em `freeBidValue`) e A2 (guard em `reducedInstallment`) são as **únicas mudanças defensivas baixo risco** — não alteram math, só rejeitam input inválido

## Recomendação

Dividir em duas ondas explícitas:

**Onda segura (posso fazer já se você liberar o lock):**
- A1: clamp `freeBidValue ≤ creditValue` em `calculations.ts:110` + `monthlySchedule.ts:175` + validação no formulário do Simulador
- A2: guard `effectiveReducedInstallment = reducedInstallment && term > maxReduced` + desabilitar toggle na UI com tooltip

**Onda contestada (precisa decisão sua antes de qualquer linha):**
- C1: confirmar que é OK quebrar paridade visual atual do StructuredOps (cards podem mudar de valor após migração)
- C2: confirmar que quer **alterar significado** de `monthlyInsurance` (impacta PDF, IA, composição) — ou prefere adicionar campo novo
- A3: confirmar que quer mudar o comparador para "carta contratada" (infla vantagem) — contra a memory de alavancagem
- A4: confirmar que quer **reverter** o bugfix de 2026-05-15

## Decisão necessária

Responda uma das opções:

**(a)** "Aplicar só A1 e A2" — sigo já, baixo risco, sem tocar reconcile/types.

**(b)** "Aplicar tudo, assumo o risco" — quebro o lock V2.4, aplico os 6 itens na ordem, rodo 460 testes após cada um e reporto falhas sem reverter.

**(c)** "Refazer auditoria primeiro" — reabro C2/A3/A4 com os contra-argumentos acima e produzo relatório atualizado antes de qualquer código.

**(d)** "Aplicar A1+A2 + adicionar campos NOVOS para C2/A3 sem alterar os existentes" — caminho híbrido que respeita o lock e adiciona observabilidade sem regressão.
