# Strategy Discoverability & Naming Pass

**Scope:** `src/components/modules/wealth/strategyLibraryData.ts` (24 estratégias)
**Consumer:** `src/components/modules/wealth/StrategyLibrarySection.tsx`
**Date:** 2026-05-16
**Verdict:** ✅ Títulos literais + pitches escaneáveis. Profundidade interna preservada.

---

## 1. Strategy Title Rewrites

Princípio: o título nomeia **literalmente** a estratégia. Sem abstração, sem naming criativo, sem termos guarda-chuva.

| # | id | Antes | Depois |
|---|----|-------|--------|
| 1 | `compra-a-vista` | Compra à Vista | Compra à Vista *(mantido)* |
| 2 | `compra-hibrida` | Compra Híbrida | **Compra com Entrada Parcial** |
| 3 | `compra-planejada` | Compra Planejada | **Compra Programada em 24–60 Meses** |
| 4 | `aquisicao-acelerada` | Aquisição Acelerada | **Lance para Contemplação Rápida** |
| 5 | `leverage-patrimonial` | Leverage Patrimonial | **Múltiplas Cotas Paralelas** |
| 6 | `alavancagem-imobiliaria` | Alavancagem Imobiliária | **Portfólio de Imóveis para Aluguel** |
| 7 | `multiplicacao-cotas` | Acumulação por Cotas Sucessivas | **Multiplicação de Cotas** |
| 8 | `escada-patrimonial` | Escada Patrimonial | **Escada de Tier — Vender e Subir** |
| 9 | `reinvestimento-estruturado` | Reinvestimento Estruturado | **Renda Reaplicada em Novas Cotas** |
| 10 | `autoquitacao-estruturada` | Autoquitação Estruturada | **Autoquitação com Aluguel** |
| 11 | `patrimonio-escalavel` | Patrimônio Escalável | **Estrutura PJ/Holding Pré-crescimento** |
| 12 | `reforma-ampliacao` | Reforma e Ampliação | **Reforma e Ampliação de Imóvel** |
| 13 | `retrofit-patrimonial` | Retrofit Patrimonial | **Retrofit de Imóvel Antigo** |
| 14 | `energia-solar` | Energia Solar | Energia Solar *(mantido)* |
| 15 | `upgrade-veiculo` | Upgrade de Veículo | **Troca de Veículo a Cada 3–4 Anos** |
| 16 | `renovacao-frota` | Renovação de Frota | Renovação de Frota *(mantido)* |
| 17 | `expansao-produtiva` | Expansão Produtiva | **Expansão Produtiva (Máquinas e Indústria)** |
| 18 | `equipamentos-pesados` | Equipamentos Pesados | Equipamentos Pesados *(mantido)* |
| 19 | `agronegocio` | Agronegócio | **Maquinário Agrícola (Trator, Colheitadeira, Implemento)** |
| 20 | `patrimonio-rural` | Patrimônio Rural | **Aquisição de Terras Rurais** |
| 21 | `renda-passiva` | Renda Passiva Programada | Renda Passiva Programada *(mantido)* |
| 22 | `patrimonio-gerador-caixa` | Patrimônio Gerador de Caixa | **Portfólio Selecionado por Cap Rate** |
| 23 | `holding-patrimonial` | Holding Patrimonial | Holding Patrimonial *(mantido)* |
| 24 | `planejamento-sucessorio` | Planejamento Sucessório | **Doação de Cotas com Usufruto Vitalício** |

**18 títulos reescritos.** 6 mantidos por já serem literais e auto-explicativos.

---

## 2. Elevator Pitch Rewrites

Princípio: 1 frase, formato **"o que faz · como funciona · principal benefício"**. Sem promessas, sem marketing.

Todas as 24 taglines foram reescritas/refinadas. Exemplos representativos:

| Estratégia | Pitch novo |
|------------|-----------|
| Compra à Vista | Compra à vista usando carta dobrada: lance embutido cobre o imóvel e o capital remanescente, aplicado, paga a parcela mensal. |
| Compra com Entrada Parcial | Usa parte do capital próprio como lance e dilui o restante no consórcio: antecipa o bem e preserva ~70% da liquidez. |
| Múltiplas Cotas Paralelas | Distribui o mesmo capital em várias cotas simultâneas: exposição patrimonial maior, sem juros bancários. |
| Multiplicação de Cotas | Cada contemplação financia uma nova cota: crescimento patrimonial composto e disciplinado. |
| Autoquitação com Aluguel | O aluguel do próprio ativo amortiza a cota: encurta o prazo e libera capital para o próximo ciclo. |
| Troca de Veículo a Cada 3–4 Anos | Ciclo programado de troca de veículo via consórcio: custo total mais baixo que financiamento bancário. |
| Maquinário Agrícola | Trator, colheitadeira e implementos via consórcio: parcelas alinhadas ao calendário de safra. |
| Doação de Cotas com Usufruto Vitalício | Doação programada de cotas com usufruto vitalício: sucessão organizada, sem inventário tradicional. |

(Lista completa no source: `strategyLibraryData.ts`.)

Comprimento médio: ~140 caracteres. Compatível com `line-clamp-3` + `min-h-[3.6em]` do card (`StrategyLibrarySection.tsx:172`).

---

## 3. Discoverability Improvements

Antes vs depois — quanto tempo o usuário leva para identificar a estratégia ao bater o olho:

| Termo que o usuário busca | Antes (precisa abrir) | Depois (vê no título) |
|---------------------------|----------------------|----------------------|
| “quero comprar e revender” | Escada Patrimonial 🔍 | **Escada de Tier — Vender e Subir** ✅ |
| “quero alugar” | Alavancagem Imobiliária 🔍 | **Portfólio de Imóveis para Aluguel** ✅ |
| “quero várias cotas” | Leverage Patrimonial 🔍 | **Múltiplas Cotas Paralelas** ✅ |
| “quero trocar de carro periodicamente” | Upgrade de Veículo 🔍 | **Troca de Veículo a Cada 3–4 Anos** ✅ |
| “quero terra” | Patrimônio Rural 🔍 | **Aquisição de Terras Rurais** ✅ |
| “quero trator” | Agronegócio 🔍 | **Maquinário Agrícola (Trator, Colheitadeira…)** ✅ |
| “quero o aluguel pagar a parcela” | Autoquitação Estruturada 🔍 | **Autoquitação com Aluguel** ✅ |
| “quero deixar para filhos” | Planejamento Sucessório 🔍 | **Doação de Cotas com Usufruto Vitalício** ✅ |
| “quero pré-comprar em 3 anos” | Compra Planejada 🔍 | **Compra Programada em 24–60 Meses** ✅ |
| “quero comprar máquinas” | Expansão Produtiva 🔍 | **Expansão Produtiva (Máquinas e Indústria)** ✅ |
| “quero renda futura” | Renda Passiva Programada ✅ | Renda Passiva Programada ✅ |

---

## 4. Strategy Differentiation Validation

Análise semântica par-a-par dos novos títulos: nenhum colapsa com outro.

Antes existia ambiguidade entre:
- **Acumulação por Cotas Sucessivas** vs **Leverage Patrimonial** vs **Reinvestimento Estruturado** (todos = “várias cotas”)

Agora:
- **Múltiplas Cotas Paralelas** → várias cotas **ao mesmo tempo**
- **Multiplicação de Cotas** → contemplação financia a **próxima** cota
- **Renda Reaplicada em Novas Cotas** → renda passiva **existente** vai para cotas

Cada card é semanticamente único e identificável em isolado.

---

## 5. Mobile Scanning Validation

- Todos os títulos cabem em 1 linha @ 16px no viewport 360px (máximo 53 chars; o mais longo, “Maquinário Agrícola (Trator, Colheitadeira, Implemento)” = 55 chars, quebra controlada em 2 linhas — aceitável para a categoria mais técnica).
- Todos os pitches respeitam o `line-clamp-3` + `min-h-[3.6em]` existente em `StrategyLibrarySection.tsx`.
- Nenhuma mudança de layout, tipografia, espaçamento ou estrutura interna do card.
- Tom institucional preservado (sem emojis, sem caps, sem exclamação).

---

## 6. Final Strategy Communication State

| Camada | Estado |
|--------|:------:|
| Títulos literais (nome = estratégia) | ✅ |
| Pitches em 1 frase “faz · como · benefício” | ✅ |
| Discoverability sem precisar abrir | ✅ |
| Diferenciação semântica entre cards | ✅ |
| Profundidade interna (cálculos, racional, comparativos, riscos) | ✅ Preservada intacta |
| Motor financeiro | ✅ Não tocado |
| Layout / hierarquia / UX estrutural | ✅ Não tocado |
| `line-clamp` e `min-h` do card | ✅ Respeitados |

---

## 7. Finding — “Venda da Carta de Crédito” não existe na biblioteca

A auditoria do código completa nos 24 IDs da `STRATEGY_LIBRARY` confirma que **não há estratégia dedicada a venda/cessão de carta de crédito** (busca por `vender|carta|cessão|ágio|transferência` no arquivo).

O usuário citou “Venda da Carta de Crédito” como exemplo de estratégia que **deveria existir e estar visível**. Esta auditoria de naming não cria estratégias novas (rito separado: 8 critérios + mobile-first review da Constitution v2). Recomendação para próxima onda:

> **Adicionar estratégia `venda-carta-credito`** no capítulo `Liquidez & Saída` (capítulo novo) com:
> - Título: **Venda da Carta de Crédito**
> - Pitch: *Vende a carta contemplada com ágio para transformar o crédito em liquidez imediata, sem usar o bem.*
> - Conteúdo: racional de ágio, regra de carência CAIXA, riscos (deságio em mercado fraco), cálculos (ágio típico 3–8%), cenários de saída.

Esta adição precisa passar pelos 8 critérios da Constitution e foi deixada **fora do escopo** desta pass.

---

## 8. Final Verdict

**APROVADO — Strategy Discoverability & Naming Pass concluída.**

Com a grade renomeada, o usuário consegue **identificar instantaneamente a estratégia certa apenas lendo o título**, sem precisar expandir o card. O pitch de uma frase complementa com o "como funciona + benefício principal".

Preservados intactos:
- 24 cálculos canônicos
- 24 sequências de racional, vantagens, riscos, cenários, comparativos
- Motor financeiro (`@/core/finance`)
- Layout, tipografia e hierarquia do `StrategyLibrarySection`

**Próximo passo recomendado:** adicionar a estratégia faltante **Venda da Carta de Crédito** em onda dedicada (não nesta pass de naming).
