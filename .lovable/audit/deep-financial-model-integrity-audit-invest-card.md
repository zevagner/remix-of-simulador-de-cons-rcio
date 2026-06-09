# Deep Financial Model Integrity Audit — Usar a Carta para Investir

> **Revisão pós-evidência:** ambos os cards são imobiliários 200m. O drift é de **premissas embutidas**, não de modalidade. Trace numérico abaixo.

---

## 1. Full Formula Trace (versão CURRENT)

**Localização**: `src/components/modules/wealth/strategyLibraryData.ts:490–566`.

Constantes consumidas:

| Símbolo       | Valor      | Origem                                    |
|---------------|-----------:|-------------------------------------------|
| `ADM_TOTAL`   | 1,21       | `computeBaseCost` (18% adm + 3% FR)       |
| `REF_TERM_M`  | 200        | `DEFAULT_TERM_MONTHS.imobiliario`         |
| `CDI_AA`      | 14,9 %     | `DEFAULT_CDI_RATE`                        |
| `CDI_LIQ`     | 12,665 %   | `CDI_AA × (1 − 15%)` (IR longo prazo)     |
| `cdiPercent`  | **100 %**  | hard-coded no registry                    |
| Contemplação  | **mês 24** | hard-coded                                 |
| Aplicação     | **176 m**  | `REF_TERM_M − 24`                          |

Fórmulas:
- Custo total = `c × 1,21`
- Saldo aplicado = `compoundGrowthAnnualMonthly(c, 0,12665, 176)` = `c × (1 + 0,12665_m)^176`
- Lucro líquido = `saldo − custo`
- ROI = `lucro / custo`

Hero do card = `lucro`; badge = `ROI` (`strategyExecutiveKpis.ts:137–141`).

---

## 2. Trace OLD (reverse-engineered da imagem)

Card antigo (screenshot):
- Lucro hero: **R$ 4.352.967,40**
- ROI: **440,5 %**
- Faixa: R$ 988.148,67 → R$ 5.341.116,07
- Premissa textual: *"Carta aplicada a 110% CDI por 199 meses"*
- Narrativa: *"contemplação no início, retorno total estimado R$ 737.604"* (segmento ilustrativo c=300k)

Reverse-engineering dos números:

| Item                       | Valor                       |
|----------------------------|-----------------------------|
| Custo total (low da faixa) | R$ 988.148,67               |
| Crédito implícito          | 988.148,67 / 1,21 = **R$ 816.652** |
| Saldo final (high)         | R$ 5.341.116,07             |
| Multiplicador implícito    | 5,341M / 988k = **5,405×**  |
| Multiplicador sobre `c`    | 6,540×                      |
| Taxa mensal equivalente    | `6,540^(1/199) − 1` = **0,9482 %/m** |
| Taxa anual equivalente     | **~11,99 %/a líquido**      |

Identificação da fórmula OLD: `110% × CDI × (1 − ~27,5%)` ≈ 11,88% a.a. ≈ 11,99% (paridade ~0,1pp por arredondamento). IR provavelmente de **curto prazo (27,5%)**, com **contemplação no mês 1** e **199 meses de aplicação**.

---

## 3. Comparative Legacy Analysis (apple-to-apple, mesmo `c` = R$ 816.652)

| Parâmetro            | OLD (screenshot)     | CURRENT registry          | Δ |
|----------------------|----------------------|---------------------------|---|
| `cdiPercent`         | **110 %**            | 100 %                     | −10 pp |
| IR alíquota          | ~27,5 % (curto)      | 15 % (longo prazo)        | −12,5 pp |
| Contemplação         | **Mês 1**            | Mês 24                    | +23 m |
| Meses de aplicação   | **199**              | 176                       | −23 m |
| Taxa líquida a.a.    | ~11,88 %             | 12,665 %                  | +0,78 pp |
| Multiplicador        | **6,54×**            | 5,75×                     | −0,79× |
| Custo total          | R$ 988.149           | R$ 988.149                | = |
| Lucro líquido        | **R$ 4.352.967**     | **R$ 3.706.566**          | −R$ 646.401 (−14,8 %) |
| ROI                  | **440,5 %**          | **375,1 %**               | −65,4 pp |

→ **CURRENT entrega ~15% menos lucro e ROI ~65pp menor**, mesmo com taxa anual líquida ligeiramente superior. A diferença vem de:
1. **−23 meses de capitalização** (contempl. mês 24 vs mês 1) — impacto dominante (~70% do gap).
2. **CDI 100% vs 110%** parcialmente compensado por IR 15% vs 27,5%.

A matemática individual de cada versão é internamente correta e usa primitivas canônicas. **Houve drift de PREMISSAS, não drift de fórmulas.**

---

## 4. Financial Consistency Validation

### Card CURRENT (interno)
- Hero, ROI, narrativa, premissas → **todas baseadas em `compoundGrowthAnnualMonthly(c, CDI_LIQ, 176)`**. Coerentes entre si. ✅

### Card OLD (interno, conforme screenshot)
- Premissa textual diz "110% CDI por 199 meses" → hero R$ 4,35M é compatível.
- Argumento livre menciona "R$ 298 mil ganho" para c=300k — esse trecho era um cálculo path5-style (c=300k, IR efetivo, etc.), **diferente do hero**. Mesmo o OLD já carregava uma sutil **inconsistência hero × narrativa**.

### Cross-card (OLD vs CURRENT)
- A premissa textual atual ("Carta aplicada a CDI líquido por 176 meses, contemplação no mês 24") **não é exibida explicitamente** no card CURRENT como no OLD — o usuário só vê o resultado.
- Para o mesmo crédito, ROI caiu 440% → 375%. **A regressão consultiva é real.**

---

## 5. Original Thesis Reconstruction

Tese original (recuperada do OLD + path5 do simulador):

> *Cliente contempla **cedo** (próximo do mês 1 — tese flagship pressupõe lance forte ou sorteio precoce), aplica a carta integral a **110% CDI** (default do simulador) por **199 meses**, com IR regressivo real. O float é máximo.*

Pontos essenciais que diferenciavam a versão antiga:
1. **Contemplação precoce** (mês 1) — captura horizonte máximo.
2. **CDI 110%** — produto premium, alinhado com `DEFAULT_CDI_PERCENT` do simulador (110).
3. **Capitalização sobre carta integral** — sem lance embutido.

A CURRENT preservou (3) mas **rebaixou (1) e (2)** silenciosamente — sem documentar o motivo nem expor a mudança de premissa ao usuário.

---

## 6. ROI Semantic Audit

OLD e CURRENT usam **mesma semântica** de ROI: `lucro_líquido ÷ custo_nominal`. Sem drift semântico. O número caiu apenas porque as premissas ficaram mais conservadoras.

---

## 7. Temporal Cashflow Validation

| Aspecto                              | OLD               | CURRENT |
|--------------------------------------|-------------------|---------|
| Período de pagamento de parcelas    | 1..200            | 1..200  |
| Período de aplicação (CDI)           | 1..200 (199m)     | 24..200 (176m) |
| Sobreposição parcelas × aplicação    | Total             | Parcial |
| Capital aplicado em paralelo às parcelas | Sim          | Sim     |

A CURRENT é **mais conservadora** mas a OLD é **mais fiel à tese flagship** (contempl. precoce é a essência do "Usar a Carta para Investir").

---

## 8. Canonical Primitive Validation

| Primitiva                      | CURRENT | Observação |
|--------------------------------|---------|------------|
| `compoundGrowthAnnualMonthly`  | ✅ ok    | uso correto, sem dupla capitalização |
| `ADM_TOTAL`                    | ✅ ok    | derivado de `computeBaseCost` |
| `CDI_LIQ`                      | ⚠ 100%  | divergente do `DEFAULT_CDI_PERCENT=110` do simulador |
| Contemplação mês 24            | ⚠       | hard-coded; não reflete a tese flagship (mês 1) |

---

## 9. Consultive Consistency Audit

| Bloco         | OLD                                      | CURRENT |
|---------------|------------------------------------------|---------|
| Premissa textual | "110% CDI por 199 meses" (explícita) | implícita (não exibida) |
| Hero          | R$ 4,35M                                | R$ 2,87M (c=500k) / R$ 4,69M (c=816k) — **menor** |
| Narrativa     | "valor projetado de R$ 298 mil" (c=300k, path5-like) | mesma estrutura textual |
| Bloco "Premissas" | Exibe "110% CDI por 199 meses"     | **Ausente** no card consultivo |

→ O OLD era mais **transparente** quanto às premissas e mais **agressivo** nos números. Ambas características eram parte do caráter flagship.

---

## 10. Correction Recommendation

**Diagnóstico final:** a CURRENT está matematicamente correta, mas **adotou premissas mais conservadoras** que descaracterizam a tese flagship "Usar a Carta para Investir". O usuário percebe como drift porque o ROI caiu de 440% → 375% e o lucro encolheu ~15%.

### Correção cirúrgica proposta (zero engine nova)

Alinhar o registry às **mesmas defaults do simulador** (`useInvestmentCalculations` + `DEFAULT_CDI_PERCENT=110`), o que restaura a tese flagship sem inventar matemática:

```diff
# strategyLibraryData.ts (id 'usar-carta-investir')
- const CDI_LIQ         = CDI_AA * (1 - 0.15);                 // 100% CDI
+ // Premissa flagship (alinha com DEFAULT_CDI_PERCENT=110 do simulador)
+ const CDI_FLAGSHIP_AA = CDI_AA * 1.10;                       // 110% CDI bruto
+ const CDI_FLAGSHIP_LIQ = CDI_FLAGSHIP_AA * (1 - 0.15);       // IR longo prazo

  calculations: [
    { label: 'Saldo aplicado ao fim do prazo',
-     result: (c) => brl(compoundGrowthAnnualMonthly(c, CDI_LIQ, REF_TERM_M - 24)),
+     // Contemplação no mês 1 (tese flagship) → 199 meses de aplicação
+     result: (c) => brl(compoundGrowthAnnualMonthly(c, CDI_FLAGSHIP_LIQ, REF_TERM_M - 1)),
    },
    …
  ]
```

E adicionar **bloco "Premissas" visível** no card (como no OLD): *"Carta aplicada a 110% CDI por 199 meses · Contemplação no mês 1 · IR regressivo 15%."*

### Resultado projetado pós-correção (c = R$ 816.652)

| Item               | Valor pós-fix      | OLD                | Δ vs OLD |
|--------------------|-------------------:|-------------------:|---------:|
| Multiplicador      | (1 + 13,93%_m)^199 ≈ 8,71× | 6,54×    | +33% |
| Saldo final        | R$ 7,11 M          | R$ 5,34 M          | +33% |
| Lucro              | R$ 6,12 M          | R$ 4,35 M          | +41% |
| ROI                | ~619 %             | ~440,5 %           | +178 pp |

→ Fica **acima do OLD** porque o OLD usava IR de curto prazo (27,5%) implícito. Para reproduzir **exatamente** o OLD, basta ajustar IR para 27,5% no cálculo (não recomendado — IR longo prazo 15% é o regime real após 720 dias, **mais fiel à tese**).

Alternativa intermediária (matemática 100% fiel ao texto antigo): manter IR 15% mas **expor a premissa** e aceitar que o ROI será ~619% (mais alto que o OLD). É **financeiramente mais correto** que o OLD original.

---

## 11. Zero Regression Validation

- ❌ Nenhuma primitiva alterada nesta auditoria.
- ❌ Nenhuma outra estratégia tocada.
- ✅ Apenas relatório gerado em `.lovable/audit/`.
- A correção proposta só altera **3 linhas** em `strategyLibraryData.ts` (uma constante derivada + um parâmetro de chamada + um texto de premissa).

---

## Final Verdict

| Pergunta                                       | Resposta |
|------------------------------------------------|----------|
| A CURRENT está matematicamente correta?        | **Sim**, internamente coerente. |
| A CURRENT está fiel à tese flagship original?  | **Não.** Rebaixou silenciosamente CDI 110%→100% e contempl. mês 1→24. |
| Sofreu drift matemático?                       | **Não** (mesmas primitivas). |
| Sofreu drift de premissas?                     | **Sim**, significativo. Lucro −15%, ROI −65pp. |
| Sofreu drift narrativo?                        | **Sim** — removeu o bloco "Premissas" visível e tornou a base de cálculo opaca. |
| Correção cirúrgica?                            | **Sim:** restaurar premissas flagship (110% CDI · contempl. mês 1 · 199m · IR 15% longo) + reexpor bloco "Premissas". 3 linhas + 1 bloco textual. |

**Resumo executivo:** o card antigo era flagship por construção — premissas agressivas mas transparentes, alinhadas com os defaults do simulador. O card atual é matematicamente sólido, mas conservador e silencioso sobre o porquê. A correção é cirúrgica: realinhar premissas ao simulador e reexibir o bloco "Premissas".
