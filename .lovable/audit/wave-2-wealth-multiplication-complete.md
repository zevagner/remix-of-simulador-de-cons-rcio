# Wave 2 — Wealth Multiplication

## Executive Summary

Onda 2 entrega o grupo **Multiplicação Patrimonial** completo no `strategy-library`, com 4 novas estratégias somadas à flagship `multiplicacao-cotas` (Wave 0.5). Total: 5 estratégias com identidade única, leverage distinto e linguagem responsável — sem promessa milagrosa, sem especulação, sem retórica de multiplicador mágico.

Cada estratégia é peça consultiva completa — atende as 7 dimensões obrigatórias de `FullStrategyBlueprint` e passa pelo validador de diferenciação (uniqueAngle + leverage únicos por grupo). O grupo agora projeta o consórcio como **engenharia patrimonial avançada**, plausível e disciplinada.

## Strategy Differentiation Matrix

| # | Estratégia                  | uniqueAngle (resumo)                                                              | leverage (resumo)                                                | Arquétipo                                              | Topologia            |
|---|-----------------------------|-----------------------------------------------------------------------------------|------------------------------------------------------------------|--------------------------------------------------------|----------------------|
| 1 | Multiplicação de Cotas (fl.)| Diversifica risco de contemplação entre N cotas paralelas                         | Escala — N cotas multiplicam disciplina de aporte                | Investidor sofisticado com aporte simultâneo           | Horizontal (paralela)|
| 2 | Escada Patrimonial          | Sequência vertical: cada ativo vira entrada/lance do degrau superior              | Equity convertido em poder de aquisição do próximo degrau        | Profissional com curva de renda ascendente             | Vertical (degraus)   |
| 3 | Reinvestimento Estruturado  | Capital liberado pelo ciclo anterior, reaplicado integralmente em novo ciclo      | Compostagem — cada ciclo realimenta o próximo                    | Investidor disciplinado de longo prazo                 | Cíclica (compostagem)|
| 4 | Autoquitação Estruturada    | Renda do ativo canalizada a fundo de amortização extraordinária                   | Leverage de receita — fluxo do ativo comprime prazo              | Investidor de ativo produtivo com excedente operacional| Compressão (prazo)   |
| 5 | Patrimônio Escalável        | Arquitetura institucional pré-desenhada absorve novos módulos padronizados        | Estrutura institucional padronizada (PJ/holding)                 | Empresário/família com governança formal               | Modular (institucional)|

**Validação automatizada:** `validateDifferentiation()` em `contracts.ts` confirma uniqueAngle e leverage únicos no grupo. Nenhuma estratégia repete topologia, motor ou arquétipo.

## 1. Multiplicação de Cotas

**Tese:** estratégia de portfólio aplicada ao consórcio — N cotas paralelas distribuem risco de contemplação e geram múltiplas janelas patrimoniais.

**Engenharia:** escala horizontal — mesma disciplina de aporte mensal multiplicada por N posições simultâneas. Aportes paralelos, contemplações distribuídas no tempo.

**Quando não usar:** renda variável sem reserva; sem disciplina histórica de aporte; objetivo único e definido (uma cota basta).

## 2. Escada Patrimonial

**Tese:** crescimento vertical em degraus encadeados — cada ativo vira combustível para o próximo de valor superior, alinhado a curva de renda real.

**Engenharia:**
- *Leverage:* equity do degrau N converte-se em entrada/lance do degrau N+1.
- *Fluxo:* cotas sequenciais (não paralelas).
- *Fator de salto:* tipicamente 1,4-1,8× por degrau.
- *Timing:* 3-4 degraus em 10-15 anos com curva de renda projetada.

**Cenários:** 3 degraus imobiliários R$ 350k → R$ 600k → R$ 1M em 12 anos; 4 degraus veiculares em 10 anos.

**Quando não usar:** renda estagnada; aversão a vender ativo já adquirido; mercado do ativo com baixa liquidez de revenda.

## 3. Reinvestimento Estruturado

**Tese:** compostagem patrimonial — o esforço significativo é apenas no primeiro ciclo; capital realizado em cada contemplação alimenta o ciclo seguinte.

**Engenharia:**
- *Leverage:* compostagem — V_total = V_inicial × Π (1 + ganho_líquido_por_ciclo).
- *Fluxo:* ciclos sequenciais auto-sustentados; reaplicação integral.
- *Premissa conservadora:* ganho líquido ≥ 15% por ciclo de 5-7 anos.
- *Horizonte:* ≥ 15 anos com 3 ciclos completos.

**Cenários:** 3 ciclos em 18 anos com 25% líquido cada (R$ 200k → R$ 390k); 2 ciclos em 12 anos com 30% (R$ 400k → R$ 676k).

**Quando não usar:** horizonte < 12 anos; sem disciplina de segregação de capital; necessidade de liquidez intermediária.

## 4. Autoquitação Estruturada

**Tese:** engenharia de fluxo onde o ativo produtivo gera renda canalizada estruturadamente para amortização extraordinária — encurta prazo, antecipa posse livre.

**Engenharia:**
- *Leverage:* fluxo operacional do ativo direcionado institucionalmente para amortização.
- *Fluxo:* parcela coberta por renda do ativo + excedente para fundo de amortização mensal/trimestral.
- *Compressão típica:* 25-50% do prazo nominal.
- *Premissa:* yield líquido ≥ 0,6%/m ou economia operacional consolidada.

**Cenários:** sala comercial R$ 320k (180m nominal → 135m efetivo); sistema solar R$ 50k (prazo reduzido 30%).

**Quando não usar:** ativo sem renda recorrente confiável; renda apenas cobre parcela sem excedente; grupo com forte restrição a amortização extraordinária.

## 5. Patrimônio Escalável

**Tese:** arquitetura institucional pré-desenhada onde novas cotas se encaixam como módulos padronizados — escala sem caos, governança consistente, tratamento tributário otimizado.

**Engenharia:**
- *Leverage:* estrutura formal (PJ/holding/governança documentada) que absorve módulos.
- *Fluxo:* adição em cadência institucional (semestral/anual), não oportunística.
- *Padronização:* tamanho/tipo de módulo definidos antes da primeira aquisição.
- *Pré-requisito:* estrutura formal real consolidada.

**Cenários:** holding familiar com 5 módulos imobiliários R$ 500k em 10 anos (R$ 2,5M institucionalizados); PJ operacional com 4 módulos de equipamento em 8 anos.

**Quando não usar:** sem estrutura formal real; patrimônio pequeno demais para custo institucional; preferência por flexibilidade oportunística.

## Financial Credibility Validation

Cada estratégia evita os 4 padrões de retórica irresponsável:

| Anti-padrão                       | Como o catálogo evita                                                                       |
|-----------------------------------|---------------------------------------------------------------------------------------------|
| "Fórmula mágica" / multiplicador  | Linguagem técnica (compostagem, equity, amortização extraordinária, módulos institucionais). |
| Promessa de rentabilidade         | Disclaimer obrigatório + cenários explicitamente ilustrativos + premissas conservadoras.    |
| Especulação irresponsável         | `whenNotToUse` honesto em todas; `commonMistakes` expõe armadilhas; `risks` com mitigation. |
| Pirâmide/marketing agressivo      | Sem retórica de "ganhe X em Y"; sem CTA emocional; cada estratégia tem trade-off explícito. |

**Premissas auditadas:**
- Reinvestimento: ganho líquido por ciclo apresentado como projeção com IR/custos abatidos, não bruto.
- Autoquitação: amortização extra "é meta, não obrigação"; reserva operacional de 6 meses obrigatória.
- Escada: fator de salto ≤ 1,8× sem reforço explícito; venda do degrau anterior é parte do design.
- Escalável: custo institucional incluído no plano; estrutura formal real é pré-requisito, não promessa.
- Cotas: stress de fluxo dimensionado a máx 30% da renda + reserva 6 parcelas.

## Archetype Validation

| Estratégia                | Arquétipo                                                                              |
|---------------------------|----------------------------------------------------------------------------------------|
| Multiplicação de Cotas    | Investidor sofisticado com capacidade simultânea e visão de portfólio                  |
| Escada Patrimonial        | Profissional em fase de crescimento com saltos projetados de carreira                  |
| Reinvestimento Estruturado| Investidor disciplinado de longo prazo que prefere ciclos repetíveis                   |
| Autoquitação Estruturada  | Cliente de ativo produtivo (locação, solar, equipamento) com excedente operacional     |
| Patrimônio Escalável      | Empresário/família patrimonialista com estrutura formal já consolidada                 |

Nenhum perfil se sobrepõe — cada cliente reconhece seu próprio momento patrimonial.

## Discoverability Validation

- Todas as 5 estratégias aparecem em `StrategyLibraryModule` na seção "Multiplicação Patrimonial" como itens textuais clicáveis.
- Flagship (`multiplicacao-cotas`) marcada com bullet primary + tag "flagship".
- One-liner editorial visível antes do clique — diferenciação escaneável na lista.
- Cada item abre `StrategyWorkspace` com hero + tabs editoriais + camada Aprofundar.

## Depth Validation

Cada estratégia entrega:

- **identity** (3 campos): objective, archetype, uniqueAngle (validado único).
- **engineering** (5 campos): leverage (validado único), liquidity, flowPattern, patrimonialImpact, timing.
- **calculation:** fórmula consultiva + 4 inputs + 2 cenários quantificados.
- **narrative** (4 campos): thesis, pitch, story, mindset.
- **deepDive:** rationale 2 parágrafos + 4 risks com mitigation + 4 commonMistakes + 4 whenNotToUse + 2-3 advancedCombos + 3-4 consultiveNotes.
- **comparisons:** 3 alternativas com advantage + tradeoff.
- **applications:** 2 casos reais com context + execution + outcome.

Zero placeholder. Zero texto genérico. Zero racional repetido.

## Mobile Validation

- `StrategyLibraryModule` em 1 coluna; sem grids agressivos.
- `StrategyWorkspace` em mobile colapsa tabs em accordion sequencial (Wave 0).
- Targets ≥ 44px; tipografia escalonada (`text-lg` grupo / `text-[15px]` título / `text-[13px]` one-liner).
- Editorial intro com `max-w-2xl` evita linhas longas em desktop.
- `<details>` da camada Aprofundar reduz overload de scroll em telas pequenas.

## Risks Avoided

- ❌ "Multiplicador mágico" — toda estratégia tem racional matemático explícito e premissa conservadora.
- ❌ Repetição de leverage — validator bloqueia em runtime; matriz confirma 5 topologias distintas.
- ❌ Repetição de arquétipo — cada perfil mapeia um momento patrimonial diferente.
- ❌ Promessa de rentabilidade — disclaimer institucional em todas; cenários como ilustração.
- ❌ Marketing agressivo — pitch consultivo, não vendedor; `whenNotToUse` honesto.
- ❌ Dashboardization — biblioteca editorial preservada; sem widgets/KPIs.
- ❌ Pirâmide/esquema — sem "indique amigos", sem "ganhe X em Y", sem rede.

## Final Verdict

✅ **MULTIPLICAÇÃO PATRIMONIAL COMPLETA.**

O grupo agora entrega 5 estratégias com topologia, motor e arquétipo distintos, profundidade real e linguagem consultiva responsável. O usuário que abre o grupo percebe:

- que existem múltiplas vias de multiplicação patrimonial (presença);
- que cada uma serve a um momento diferente do cliente (diferenciação);
- que há engenharia financeira plausível por trás (credibilidade);
- que a plataforma trata consórcio como instrumento patrimonial sofisticado, não como produto milagroso (posicionamento).

Pronta para iniciar **Onda 3 — Renda + Fluxo** ou **Onda 3 — Imobiliário** (conforme prioridade do usuário) quando aprovado.
