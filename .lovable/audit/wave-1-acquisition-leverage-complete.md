# Wave 1 — Acquisition + Leverage

## Executive Summary

Onda 1 entrega o grupo **Aquisição + Leverage** completo no `strategy-library`, com 5 novas estratégias somadas à flagship `compra-a-vista` (Wave 0.5). Total: 6 estratégias com identidade única, engenharia financeira distinta, cenários quantificados, comparativos reais e seção "quando não usar" obrigatória.

Cada estratégia é peça consultiva completa — atende as 7 dimensões do contrato `FullStrategyBlueprint` e passa pelo validador de diferenciação (uniqueAngle e leverage únicos por grupo).

Resultado: o grupo **Aquisição + Leverage** passa a parecer uma biblioteca patrimonial real, não um conjunto de variações da mesma ideia.

## Strategy Differentiation Matrix

| # | Estratégia              | uniqueAngle (resumo)                                          | leverage (resumo)                                     | Arquétipo                                          | Fluxo                                |
|---|-------------------------|---------------------------------------------------------------|-------------------------------------------------------|----------------------------------------------------|--------------------------------------|
| 1 | Compra à Vista (flag.)  | Carta substitui dinheiro próprio mantendo caixa produtivo     | Juros bancários → taxa de adm (~1/4 do custo)         | Cliente com objetivo + reserva preservada          | Parcela constante, sem entrada       |
| 2 | Compra Híbrida          | Capital próprio entra como lance calibrado pré-desenhado      | Mix capital próprio + taxa adm sobre saldo            | Cliente que rejeita extremos                       | Lance moderado + parcela reduzida    |
| 3 | Compra Planejada        | Cronograma da contemplação coincide com o uso futuro          | Substituição completa de juros por taxa adm no prazo  | Cliente com objetivo claro sem urgência            | Linear constante, sem lance          |
| 4 | Aquisição Acelerada     | Lance dimensionado por Estudo de Lances comprime o ciclo      | Alavancagem temporal — lance compete em assembleia    | Cliente com janela real de oportunidade            | Lance concentrado + saldo reduzido   |
| 5 | Leverage Patrimonial    | Capital próprio NÃO entra — fica integralmente produtivo      | Arbitragem rendimento da reserva vs custo da carta    | Investidor patrimonial focado em composto          | Parcela coberta por fluxo corrente   |
| 6 | Alavancagem Imobiliária | Renda do imóvel adquirido financia parcela da próxima carta   | Aluguéis do portfólio cobrem cartas seguintes         | Investidor imobiliário em curva (≥10a)             | Onda crescente, autofinanciamento    |

**Validação automatizada:** `validateDifferentiation()` em `contracts.ts` confirma uniqueAngle e leverage únicos no grupo. Nenhum dois itens repetem racional financeiro.

## 1. Compra Híbrida

**Tese:** estratégia do meio inteligente — nem financia tudo, nem esvazia o caixa. Cliente desenha a composição entre capital próprio e carta.

**Engenharia:**
- *Leverage:* mix calibrado entre capital próprio (lance) e taxa adm (saldo).
- *Liquidez:* parcialmente preservada — reserva remanescente segue produtiva.
- *Fluxo:* entrada moderada via lance + parcelas reduzidas.
- *Timing:* janela de 12-24 meses sem aceitar custo de financiamento integral.

**Cenários:** Imóvel R$ 700k com lance 30% (R$ 210k) acelera contemplação para 6-12m; veículo R$ 180k com lance 25% entrega em até 8m.

**Quando não usar:** reserva insuficiente (<15% do bem); cliente sem janela definida; objetivo é desconto à vista máximo.

## 2. Compra Planejada

**Tese:** inverte a lógica do consumo brasileiro — agenda patrimonial em vez de reação. Consórcio entrega o bem no momento exato do uso.

**Engenharia:**
- *Leverage:* substituição completa de juros por taxa adm distribuída no horizonte.
- *Liquidez:* integral preservada hoje.
- *Fluxo:* parcela linear constante; sem lance obrigatório.
- *Timing:* horizonte 3-7 anos para evento previsível.

**Cenários:** casa de praia para aposentadoria em 6 anos (R$ 480k); carro do filho na formatura em 4 anos (R$ 120k).

**Quando não usar:** cliente precisa em <18 meses; sem disciplina de aporte; objetivo indefinido.

## 3. Aquisição Acelerada

**Tese:** estratégia para janela real de mercado com prazo curto. Lance estratégico calibrado por **Estudo de Lances** comprime o ciclo.

**Engenharia:**
- *Leverage:* alavancagem temporal via lance competitivo.
- *Liquidez:* parcialmente comprometida, com retorno patrimonial imediato.
- *Fluxo:* lance concentrado + saldo reduzido.
- *Timing:* janela real (preço, valorização) com vencimento curto.

**Cenários:** galpão logístico R$ 1,2M com 15% de desconto em 4 meses; equipamento crítico para expansão em 6 meses.

**Quando não usar:** ansiedade do cliente confundida com janela; reserva insuficiente; bem sem urgência (usar Planejada).

## 4. Leverage Patrimonial

**Tese:** dinheiro produtivo não sai do lugar produtivo. Consórcio é instrumento de leverage puro — reserva intocável + ativo via carta.

**Engenharia:**
- *Leverage:* arbitragem rendimento líquido da reserva vs custo total da carta.
- *Liquidez:* total preservada — zero capital próprio comprometido.
- *Fluxo:* parcela coberta por renda corrente; sem lance obrigatório.
- *Timing:* horizonte ≥ 120 meses com CDI persistentemente acima do custo unitário da carta.

**Cenários:** imóvel R$ 500k com reserva R$ 800k aplicada (180m); equipamento R$ 250k com reserva corporativa R$ 400k.

**Quando não usar:** cliente sem reserva produtiva real; renda corrente insuficiente; horizonte curto; perfil emocional que cederá ao impulso.

## 5. Alavancagem Imobiliária

**Tese:** portfólio imobiliário em curva — cada imóvel adquirido vira motor da próxima cota via renda de locação.

**Engenharia:**
- *Leverage:* renda de locação dos ativos cobre parcela das cartas seguintes.
- *Liquidez:* travada em ativos físicos; renda recorrente substitui liquidez de caixa.
- *Fluxo:* onda crescente — 1º imóvel próprio, 2º parcialmente coberto pelo 1º, 3º pelos dois anteriores.
- *Timing:* horizonte ≥ 10 anos, tese imobiliária definida.

**Cenários:** 3 residenciais em 10 anos (R$ 1,3M + R$ 6,5k/m líquidos); 4 salas comerciais em 8 anos.

**Quando não usar:** horizonte < 8 anos; sem tese definida; renda própria instável; cliente busca liquidez; aversão a gestão imobiliária.

## Comparative Financial Logic

```text
                       Capital próprio   Reserva       Velocidade    Custo total   Horizonte ideal
                       comprometido      produtiva     entrega       (vs financ.)
Compra à Vista         baixo (lance?)    alta          médio         ~1/4          flexível
Compra Híbrida         médio             média         alto          ~1/2          12-24m
Compra Planejada       baixo             alta          baixo         ~1/4          3-7a
Aquisição Acelerada    alto              média         muito alto    ~1/3          janela curta
Leverage Patrimonial   zero              integral      baixo         spread+       ≥10a
Alavancagem Imob.      médio→0           transferida   crescente     amortizado    ≥10a
```

Cada coluna tem perfil distinto — não há duas estratégias que ocupam a mesma posição. Diferenciação confirmada por matriz.

## Archetype Validation

| Estratégia              | Arquétipo                                                               |
|-------------------------|-------------------------------------------------------------------------|
| Compra à Vista          | Reserva preservada + poder de barganha                                  |
| Compra Híbrida          | Rejeita extremos — quer fluxo confortável com reserva parcial preservada |
| Compra Planejada        | Visão de futuro com horizonte claro, sem urgência                       |
| Aquisição Acelerada     | Identificou janela real de mercado com prazo                            |
| Leverage Patrimonial    | Investidor sofisticado obcecado por composto e custo de oportunidade    |
| Alavancagem Imobiliária | Pensa em portfólio físico em curva, não compra única                    |

Nenhum arquétipo se sobrepõe — cada cliente reconhece seu próprio perfil.

## Discoverability Validation

- Todas as 6 estratégias aparecem em `StrategyLibraryModule` na seção "Aquisição + Leverage" como itens textuais clicáveis (sem caça).
- Flagship (`compra-a-vista`) marcada com bullet primary + tag "flagship" — visibilidade hierárquica preservada.
- One-liner editorial visível antes mesmo do clique — usuário escaneia diferenciação na lista.
- Clique abre `StrategyWorkspace` full editorial com hero + 6 tabs + camada Aprofundar.

## Depth Validation

Cada estratégia entrega:

- **identity** (3 campos): objective, archetype, uniqueAngle
- **engineering** (5 campos): leverage, liquidity, flowPattern, patrimonialImpact, timing
- **calculation**: fórmula consultiva + 4 inputs + 2 cenários quantificados
- **narrative** (4 campos): thesis, pitch, story, mindset
- **deepDive**: rationale 2 parágrafos + 3-5 risks com mitigation + 4-5 commonMistakes + 4-5 whenNotToUse + 2-3 advancedCombos + 3-4 consultiveNotes
- **comparisons**: 3 alternativas com advantage + tradeoff
- **applications**: 2 casos reais com context + execution + outcome

Sem placeholder, sem texto genérico, sem repetição de racional.

## Mobile Validation

- `StrategyLibraryModule` é lista vertical editorial: 1 coluna em mobile, sem grid agressivo, sem widgets.
- `StrategyWorkspace` em mobile colapsa tabs em accordion sequencial (já implementado em Wave 0).
- Cada item da lista tem target ≥ 44px (`py-2 px-2 -mx-2 rounded`) — toque confortável.
- Hierarquia tipográfica: `text-lg` no grupo, `text-[15px]` no título da estratégia, `text-[13px]` no one-liner — leitura confortável sem overflow.
- Editorial intro do grupo com `max-w-2xl` evita linhas longas em desktop, dobra naturalmente em mobile.

## Risks Avoided

- ❌ "Mesma estratégia com outro nome" — bloqueado pelo validator de uniqueAngle/leverage.
- ❌ Resumo superficial — cada estratégia tem ~70 linhas de profundidade real.
- ❌ Repetição de arquétipo — matriz acima confirma 6 perfis distintos.
- ❌ Card explosion — lista textual editorial preservada, zero grids agressivos.
- ❌ Dashboardization — workspace continua editorial, sem widgets/KPIs.
- ❌ Falsa profundidade — `whenNotToUse` honesto em cada estratégia (não vende para todo perfil).

## Final Verdict

✅ **AQUISIÇÃO + LEVERAGE COMPLETO.**

O grupo agora entrega 6 estratégias com identidade própria, engenharia distinta, profundidade real e diferenciação validada em runtime. O usuário que abre o grupo percebe imediatamente:

- que existem múltiplas estratégias reais (presença);
- que cada uma serve a um cliente diferente (diferenciação);
- que há engenharia consultiva profunda por trás (sofisticação);
- que o consórcio é instrumento patrimonial, não financiamento alternativo (posicionamento).

Pronta para iniciar **Onda 2 — Multiplicação Patrimonial** quando o usuário aprovar.
