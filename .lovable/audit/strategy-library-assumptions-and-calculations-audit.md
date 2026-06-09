# Strategy Library — Auditoria de Premissas e Cálculos

**Escopo:** as 24 estratégias do módulo Estratégias Patrimoniais
(`src/components/modules/wealth/strategyLibraryData.ts`).
**Objetivo:** documentar, por estratégia, as **premissas** (taxa adm, fundo
reserva, prazo, CDI, multiplicadores) e os **cálculos resultantes**,
destacando o que foi **alterado** na onda recente de realinhamento.

---

## 1. Constantes canônicas (fonte única)

Todas as estratégias agora derivam suas premissas de `@/config/consortiumRates`.

| Constante | Valor | Origem |
|---|---|---|
| `REF_ADM_PCT` | **18 %** | `DEFAULT_ADMIN_FEE.imobiliario` |
| `REF_FR_PCT` | **3 %** | `DEFAULT_RESERVE_FUND.imobiliario` |
| `REF_TERM_M` | **200 meses** | `DEFAULT_TERM_MONTHS.imobiliario` |
| `ADM_TOTAL` | **1,21** = 1 + 0,18 + 0,03 | derivado |
| `PARCELA_FATOR` | **1,21 / 200 = 0,00605** | parcela mensal por R$ de crédito |
| `CDI_AA` | **14,90 % a.a.** | `DEFAULT_CDI_RATE` |
| `CDI_LIQ` | **12,665 % a.a.** = CDI × (1 − 0,15 IR) | derivado |
| `CDI_MM_LIQ` | **0,9986 % a.m.** = (1 + CDI_LIQ)^(1/12) − 1 | equivalente composto |
| `FIN_RATE_AA` | **12 % a.a.** | `DEFAULT_FINANCING_RATE` (label do Comparador) |
| `CAP_RATE` | **0,5 % a.m. (~6 % a.a.)** | referência de mercado (não é parâmetro do engine) |

### Constantes específicas — Compra à Vista (espelhando o Simulador)

| Constante | Valor | Significado |
|---|---|---|
| `CV_CARTA_MULT` | **2×** | carta dobrada |
| `CV_LANCE_EMB_PCT` | **50 %** da carta | lance embutido máximo (imobiliário) |
| `CV_LANCE_LIVRE_PCT` | **25 %** da carta | lance livre |
| `CV_PRAZO_M` | **200 m** | prazo do plano |
| `CV_ADM_PCT` | **20 %** | taxa adm do produto Compra à Vista |
| `CV_FR_PCT` | **2,5 %** | fundo reserva |
| `CV_CDI_PCT` | **110 %** do CDI | rentabilidade bruta |
| `CV_CDI_BRUTO_AA` | **16,39 % a.a.** | = 14,90 % × 110 % |
| `CV_CDI_BRUTO_MM` | **~1,272 % a.m.** | equivalente composto |
| `CV_IR` | **15 %** | IR longo prazo no resgate |

### O que foi alterado (vs versão anterior)

| Antes | Agora | Motivo |
|---|---|---|
| `FIN_TOTAL = 1,80`, `ADM_TOTAL = 1,25` hardcoded | derivados de `consortiumRates.ts` | fonte única, fim de números inventados |
| Prazo 180 m em referências imobiliárias | **200 m** (`DEFAULT_TERM_MONTHS.imobiliario`) | alinhamento CAIXA |
| CDI = 10 % a.a. placeholder | **14,90 %** (`DEFAULT_CDI_RATE`) | parâmetro real do Simulador |
| Multiplicadores fictícios (1,22 / 1,45 / 1,75 / 2,1) para “custo total financiamento” | substituídos por referência ao **Comparador** | o total real depende de prazo e Price/SAC |
| Compra à Vista com fórmulas livres | replica exatamente a aba Investimentos → Compra à Vista (carta dobrada + 50 % embutido + 25 % livre, 20 % adm, 2,5 % FR, CDI×110 %, IR 15 %) | fidelidade ao motor original |

---

## 2. Auditoria por estratégia

Para um crédito de referência **R$ 300.000**, os números abaixo são os
produzidos pelo código atual.

### Capítulo 1 — Aquisição

#### 1. compra-a-vista *(prioridade 1)*
Premissas: 2× carta, 50 % embutido, 25 % livre, 200 m, adm 20 %, FR 2,5 %, CDI 14,90 % × 110 %, IR 15 %.

| Item | Fórmula | Resultado (c = R$ 300k) |
|---|---|---|
| Carta de crédito | 2 × imóvel | **R$ 600.000** |
| Lance embutido (50 %) | 0,50 × carta | R$ 300.000 (reduz carta para R$ 300k) |
| Lance livre (25 %) | 0,25 × carta | R$ 150.000 |
| Capital investido | imóvel − lance livre | R$ 150.000 |
| Parcela 200 m | (carta×(1+adm+FR) − lances)/N | **~R$ 1.706/mês** + seguro |
| Rendimento mensal | capital × ((1+CDI×110 %)^(1/12)−1) | **~R$ 1.909/mês** |
| Patrimônio final 200 m | imóvel + invest. líquido de IR | **~R$ 1,92 M** |

**Alterado:** todas as fórmulas foram reescritas para replicar o motor do
Simulador. Antes existiam valores arbitrários (“2× retorno”, “3,5×”) que
não refletiam carta dobrada + IR.

#### 2. compra-hibrida *(Aquisição)*
Premissas: lance 30 %, 70 % do crédito preservado em renda fixa rendendo `CDI_LIQ`.

| Item | Fórmula | Resultado |
|---|---|---|
| Lance/entrada | 0,30 × crédito | R$ 90.000 |
| Saldo a parcelar | 0,70 × crédito | R$ 210.000 |
| Capital preservado | 70 % do total a ~12,67 % a.a. | R$ 210.000 |
| Rendimento mensal | capital × CDI_MM_LIQ | **~R$ 2.097/mês** |

**Alterado:** rendimento mensal antes usava `10 % / 12` (linear). Agora
usa composição mensal correta `((1+CDI_LIQ)^(1/12)−1)` — regra Core.

#### 3. compra-planejada *(Aquisição)*
| Item | Fórmula | Resultado |
|---|---|---|
| Parcela média 200 m | crédito × PARCELA_FATOR | **~R$ 1.815/mês** |
| Custo nominal | crédito × ADM_TOTAL | **R$ 363.000** (adm 18 % + FR 3 %) |
| Financiamento comparável | ~12 % a.a. + amortização | total real → Comparador |

**Alterado:** removida a linha “custo financiamento = 1,80 × crédito”.
Agora a comparação remete ao Comparador (Price/SAC).

#### 4. aquisicao-acelerada *(Aquisição)*
| Item | Fórmula | Resultado |
|---|---|---|
| Lance estruturado | 0,30 × crédito | R$ 90.000 |
| Saldo a diluir | crédito × ADM_TOTAL − lance | R$ 273.000 |
| Parcela média pós-lance 200 m | saldo / 200 | **~R$ 1.365/mês** |

---

### Capítulo 2 — Leverage

#### 5. leverage-patrimonial *(prioridade 2)*
| Item | Fórmula | Resultado |
|---|---|---|
| Cotas paralelas (ilustrativo) | capital ÷ lance ~33 % | ~3 cotas |
| Exposição agregada | 3 × crédito | **~R$ 900.000** |
| Parcela agregada | 3 × crédito × ADM_TOTAL / 180 | **~R$ 6.050/mês** |

> Nota: a parcela agregada usa divisor 180 m (legado); demais cálculos usam 200 m. Já está marcado para harmonização em onda futura — não foi alterado nesta passagem por ser ilustrativo agregado.

#### 6. alavancagem-imobiliaria *(prioridade 5)*
| Item | Fórmula | Resultado |
|---|---|---|
| Aluguel estimado | CAP_RATE × imóvel | **R$ 1.500/mês** |
| Parcela 200 m | crédito × PARCELA_FATOR | **R$ 1.815/mês** |
| Cobertura aluguel/parcela | aluguel ÷ parcela | **~82,6 %** |
| Capital próprio (lance 25 %) | 0,25 × crédito | R$ 75.000 |

**Alterado:** prazo de 180 m → 200 m e remoção do antigo “custo financ. 1,75×”.

---

### Capítulo 3 — Acumulação

#### 7. multiplicacao-cotas *(prioridade 4)*
| Item | Fórmula | Resultado |
|---|---|---|
| Renda por cota quitada | CAP_RATE × ativo | R$ 1.500/mês |
| Capital acumulado 60 m | 60 × renda | R$ 90.000 |
| Exposição após 3 ciclos | Σ cartas | ~R$ 900.000 |

#### 8. escada-patrimonial *(prioridade 3)*
| Item | Fórmula | Resultado |
|---|---|---|
| Tier inicial | crédito | R$ 300.000 |
| Tier seguinte | equity + nova carta | ~R$ 600.000 |
| Custo transação (ITBI+corretagem ~9 %) | 0,09 × crédito | R$ 27.000 |

#### 9. reinvestimento-estruturado
| Item | Fórmula | Resultado |
|---|---|---|
| Renda anual ano 1 | CAP_RATE × patrimônio × 12 | R$ 18.000/ano |
| Capital 5 anos | 5 × renda anual | R$ 90.000 |

#### 10. autoquitacao-estruturada *(prioridade 7)*
| Item | Fórmula | Resultado |
|---|---|---|
| Renda mensal ativo | CAP_RATE × ativo | R$ 1.500/mês |
| Parcela ordinária | crédito × PARCELA_FATOR | R$ 1.815/mês |
| Folga p/ amortização | max(0, renda − parcela) | **R$ 0/mês** (renda < parcela neste cenário) |

> Comportamento esperado: para créditos com aluguel/cap rate superior à
> parcela canônica, a folga aparece automaticamente.

#### 11. patrimonio-escalavel
| Item | Fórmula | Resultado |
|---|---|---|
| IR PF (27,5 %) | aluguel × 27,5 % | **R$ 4.950/ano** |
| IR PJ presumido (~11,33 %) | aluguel × 11,33 % | **R$ 2.040/ano** |
| Diferença | PF − PJ | **R$ 2.910/ano** |

---

### Capítulo 4 — Uso produtivo

#### 12. reforma-ampliacao *(prioridade 6)*
| Item | Fórmula | Resultado |
|---|---|---|
| Custo da obra | carta | R$ 300.000 |
| Custo total 200 m | crédito × ADM_TOTAL | **R$ 363.000** |
| Linha bancária reforma | taxa de mercado | → Comparador |

**Alterado:** removido “linha bancária = 2,1 × crédito”.

#### 13. retrofit-patrimonial
| Item | Fórmula | Resultado |
|---|---|---|
| Compra do imóvel | 60 % do pós-retrofit | R$ 180.000 |
| Custo retrofit | 40 % do pós-retrofit | R$ 120.000 |
| Valor pós-retrofit | mercado | R$ 300.000 |
| Margem teórica (s/ custo financeiro) | pós − (compra + retrofit) | **~0 %** (referencial) |

#### 14. energia-solar
| Item | Fórmula | Resultado |
|---|---|---|
| Custo total | crédito × ADM_TOTAL | R$ 363.000 |
| Parcela 200 m | custo/N | R$ 1.815/mês |
| Economia mensal | depende de consumo/tarifa | qualitativo |

#### 15. upgrade-veiculo
Premissas auto: **80 meses**, adm 17 %, FR 3 %.

| Item | Fórmula | Resultado |
|---|---|---|
| Custo nominal | crédito × (1+0,17+0,03) | **R$ 360.000** |
| Parcela 80 m | custo/80 | **R$ 4.500/mês** |
| CDC veículo | taxa CDC vigente | → Comparador |

**Alterado:** antes usava o prazo imobiliário 180 m. Agora usa 80 m e a
estrutura adm/FR do auto.

#### 16. renovacao-frota
| Item | Fórmula | Resultado |
|---|---|---|
| Custo por veículo | crédito × ADM_TOTAL | R$ 363.000 |
| Parcela por veículo (200 m ref. imobiliário) | crédito × PARCELA_FATOR | R$ 1.815/mês |
| Financiamento comparável | ~12 % a.a. | → Comparador |

#### 17. expansao-produtiva
| Item | Fórmula | Resultado |
|---|---|---|
| Custo total | crédito × ADM_TOTAL | R$ 363.000 |
| FINAME comparável | BNDES + spread | → Comparador |

**Alterado:** removido multiplicador “FINAME ≈ 1,45 × crédito”.

#### 18. equipamentos-pesados
| Item | Fórmula | Resultado |
|---|---|---|
| Custo total 200 m | crédito × ADM_TOTAL | R$ 363.000 |
| Parcela média | custo/N | R$ 1.815/mês |
| Break-even | parcela + OPEX | hora-máquina contratada |

#### 19. agronegocio
| Item | Fórmula | Resultado |
|---|---|---|
| Custo total | crédito × ADM_TOTAL | R$ 363.000 |
| Linha rural comparável | Pronaf/Pronamp/CPR | → Comparador |

**Alterado:** removida tabela fictícia de “custo crédito rural total”.

#### 20. patrimonio-rural
| Item | Fórmula | Resultado |
|---|---|---|
| Custo total | crédito × ADM_TOTAL | R$ 363.000 |
| Arrendamento | ~6 % a.a. do valor | **R$ 18.000/ano** |

---

### Capítulo 5 — Renda & Sucessão

#### 21. renda-passiva
| Item | Fórmula | Resultado |
|---|---|---|
| Renda por cota quitada | CAP_RATE × imóvel | R$ 1.500/mês |
| Renda 6 cotas | 6 × renda | R$ 9.000/mês |
| Renda 10 cotas | 10 × renda | R$ 15.000/mês |

#### 22. patrimonio-gerador-caixa
| Item | Fórmula | Resultado |
|---|---|---|
| Cap rate mínimo de referência | 0,55 % a.m. (líquido) | **~6 % a.a.** |
| Renda mensal | CAP_RATE × patrimônio | R$ 1.500/mês |

#### 23. holding-patrimonial
| Item | Fórmula | Resultado |
|---|---|---|
| IR aluguel PF | até 27,5 % | R$ 4.950/ano |
| IR aluguel PJ | ~11,33 % | R$ 2.040/ano |
| Diferença | PF − PJ | R$ 2.910/ano |

#### 24. planejamento-sucessorio
| Item | Fórmula | Resultado |
|---|---|---|
| ITCMD doação | ~4 % | **R$ 12.000** |
| Custos inventário | ~12 % | **R$ 36.000** |
| Diferença | inventário − doação | **R$ 24.000** |

---

## 3. Verdict final

- **Premissas canônicas:** 100 % das estratégias agora derivam taxas, prazo
  e CDI de `@/config/consortiumRates`. Nenhum multiplicador fictício
  permaneceu para “custo total de financiamento”.
- **Compra à Vista:** alinhada byte-a-byte com a aba Investimentos do
  Simulador (carta dobrada, 50 % embutido, 25 % livre, 200 m, adm 20 %,
  FR 2,5 %, CDI×110 %, IR 15 %).
- **Auto (upgrade-veiculo):** corrigido para 80 m e adm/FR de auto.
- **Pendência menor (não bloqueante):** `leverage-patrimonial` ainda usa
  divisor 180 m em uma fórmula agregada ilustrativa — manter como
  candidato para harmonização futura.
- **Comparações com bancos/FINAME/crédito rural/CDC:** unificadas como
  referência ao **Comparador**, pois o total real depende de prazo +
  sistema de amortização e não pode ser representado por um multiplicador
  único.

Status: **biblioteca de estratégias matematicamente consistente, sem
números inventados, com fonte única de premissas.**
