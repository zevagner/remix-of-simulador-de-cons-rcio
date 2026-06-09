# Wealth Decision Support Pass

Data: 2026-05-16
Módulo: Estratégias Patrimoniais (Wealth Platform)
Escopo: 24 estratégias — camada de apoio à decisão patrimonial

---

## Princípios

A passada NÃO criou IA conversacional, chatbot, copiloto, popup, questionário ou módulo paralelo. A intervenção é **uma camada de guidance silencioso** anexada ao conteúdo existente, surfaçada no renderer já consolidado.

Cinco dimensões consultivas foram adicionadas por estratégia:

1. **Fit** — "Faz mais sentido quando..."
2. **Caution** — "Exige atenção quando..." (sem alarmismo)
3. **Profile** — aderência patrimonial (chips discretos, sem score)
4. **Tradeoff** — o que o cliente ganha × o que ele troca
5. **Horizon** — evolução curto / médio / longo prazo

Lookup por `id` da estratégia. Ausência de match degrada silenciosamente (bloco não renderiza). Zero acoplamento com `strategyLibraryData.ts`, motor financeiro, IA ou navegação.

---

## Decision Fit Layer

Toda estratégia agora responde diretamente à pergunta **"Em qual situação essa decisão faz sentido?"**.

O texto de `fit` cobre:

- **Contexto patrimonial ideal** (massa crítica, ativos pré-existentes).
- **Perfil financeiro adequado** (renda estável, reserva proporcional, disciplina).
- **Momento financeiro adequado** (transição de fase, horizonte, ciclo de troca).
- **Cenário econômico adequado** (juros reais positivos, cap rate consistente).
- **Objetivo patrimonial coerente** (formação, expansão, preservação, fluxo).

Exemplos:

- *Compra à Vista*: "O cliente já tem o capital total disponível, decidiu pelo bem e busca preservar liquidez."
- *Holding Patrimonial*: "Portfólio consolidado com 5+ ativos relevantes ou renda passiva acima de R$ 30k/mês."
- *Renda Passiva*: "Cliente em transição entre fase laboral e fase patrimonial (45–55 anos)."

Cobertura: **24/24 estratégias**.

---

## Decision Caution Layer

Toda estratégia responde **"Quando essa decisão não funciona?"** em tom consultivo — não alarmista, não jurídico, não negativo exagerado.

A `caution` cobre os cinco vetores de risco patrimonial:

- **Timing** — janela incompatível com a contemplação típica do grupo.
- **Liquidez** — comprometimento que extingue a reserva de emergência.
- **Fluxo** — agregado de parcelas que excede a capacidade real.
- **Concentração** — várias cotas no mesmo grupo/segmento, perdendo diversificação.
- **Descapitalização** — consumo do capital remanescente após o lance.

Tom evita: "perigoso", "arriscado", "evite", "nunca". Prefere: "exige atenção quando", "tende a falhar", "não é adequado para", "cria fricção quando".

Cobertura: **24/24 estratégias**.

---

## Patrimonial Profile Guidance

Cada estratégia exibe **1 a 2 chips de aderência patrimonial**, escolhidos de um vocabulário fechado:

- Preservação de capital
- Formação patrimonial
- Expansão patrimonial
- Geração de fluxo
- Eficiência tributária
- Sucessão & governança
- Uso produtivo

Distribuição:

- *Preservação*: Compra à Vista, Compra Híbrida, Planejamento Sucessório.
- *Formação*: Compra Híbrida, Planejada, Acelerada, Escada, Reforma, Patrimônio Rural.
- *Expansão*: Leverage, Alavancagem Imob., Multiplicação, Escada, Reinvestimento, Retrofit, Renovação Frota, Expansão Produtiva, Equipamentos Pesados, Patrimônio Gerador, Holding.
- *Geração de fluxo*: Alavancagem Imob., Autoquitação, Solar, Renda Passiva, Patrimônio Gerador, Reinvestimento, Patrimônio Rural, Agronegócio.
- *Eficiência tributária*: Patrimônio Escalável, Holding.
- *Sucessão & governança*: Patrimônio Escalável, Holding, Planejamento Sucessório.
- *Uso produtivo*: Reforma, Retrofit, Solar, Upgrade Veículo, Renovação Frota, Expansão Produtiva, Equipamentos Pesados, Agronegócio.

Não há score, ranking, percentual ou cor afetiva. Chips são tags neutras.

---

## Strategy Tradeoff Explanations

Cada estratégia exibe um bloco **Trade-off** com duas linhas explícitas:

- **Ganha ·** o benefício patrimonial real.
- **Troca ·** o custo, prazo ou flexibilidade cedida.

A regra editorial elimina ambiguidade: nenhuma estratégia parece "boa para todos". Toda decisão patrimonial é tratada como um equilíbrio com contrapartida explícita.

Exemplos:

- *Leverage*: Ganha exposição multiplicada sem dívida bancária / Troca parcela agregada que cresce na mesma proporção.
- *Compra à Vista*: Ganha liquidez integral preservada / Troca tempo até a contemplação.
- *Reinvestimento Estruturado*: Ganha curva exponencial em horizontes longos / Troca renda disponível para consumo durante o ciclo.

Cobertura: **24/24 estratégias**.

---

## Decision Clarity Improvements

A regra editorial removeu ambiguidades patrimoniais:

- Nenhuma estratégia é "boa para qualquer perfil".
- Toda estratégia tem `fit` específico **e** `caution` específico.
- Todo trade-off é declarado, não implícito.
- Vocabulário evita: "ideal para todos", "garantido", "sem risco", "estratégia perfeita".
- Vocabulário prefere: "faz mais sentido quando", "exige atenção quando", "trade-off explícito", "perfil moderado/conservador", "ciclos adversos absorvidos pela reserva".

---

## Long-Term Decision Logic

Cada estratégia exibe **evolução no tempo** em três cards (curto / médio / longo prazo) explicando:

- Como a estratégia evolui em cada janela temporal.
- Como o patrimônio muda em cada janela.
- Como o fluxo muda em cada janela.
- Como a liquidez muda em cada janela.

Exemplos:

- *Multiplicação de Cotas*:
  - Curto: Primeira cota em produção; renda passiva começa a se acumular.
  - Médio: Segundo e terceiro ciclos iniciados; diversificação natural.
  - Longo: Múltiplas cotas quitadas geram renda agregada em escada; curva composta.

- *Solar*:
  - Curto: Sistema instalado; economia mensal substitui a conta de energia.
  - Médio: Economia acumulada se aproxima do investimento; ponto de payback.
  - Longo: Vida útil restante ≈ caixa livre direto ao patrimônio.

Cobertura: **24/24 estratégias × 3 horizontes = 72 micro-narrativas**.

---

## Real-Life Context Integration

Os contextos de `fit` cobrem perfis reais sem caricatura:

- **Famílias**: planejamento sucessório, primeira aquisição, transição laboral/patrimonial.
- **Investidores**: leverage consciente, multiplicação disciplinada, diversificação real.
- **Empresários**: capital de giro preservado, expansão produtiva, renovação de frota.
- **Produtores rurais**: maquinário alinhado a safra, patrimônio rural com baixa correlação.

Tom: factual, dimensionado (R$ 600/mês para solar, 3+ ativos para holding, 45–55 anos para transição patrimonial). Sem storytelling exagerado nem exemplos fantasiosos.

---

## Non-Invasive UX Validation

A camada de apoio à decisão respeita as restrições do produto:

- **Zero IA conversacional, chatbot, copiloto ou popup**.
- **Zero questionário** — guidance é resultado de mapeamento determinístico por `id`.
- **Zero onboarding** — bloco aparece dentro da estratégia já aberta.
- **Zero score, ranking ou perfil psicológico** — chips são tags neutras.
- **Zero recomendação ativa** — texto descreve aderência, não recomenda escolha.
- **Zero acoplamento** — ausência de dados degrada silenciosamente.

Visual: card único `bg-muted/15` com borda neutra; tipografia 10.5–12.5px; ícones discretos (Compass, Lightbulb, ShieldAlert, ArrowLeftRight, Clock); espaçamento consistente com o resto do módulo.

---

## Mobile Validation

Layout testado para 625×852 (preview atual) e breakpoints menores:

- **Fit + Caution**: grid 2 colunas em md+, empilha em mobile.
- **Profile chips**: `flex-wrap`, sem overflow.
- **Trade-off**: linhas empilhadas com prefixo "Ganha · / Troca ·" em destaque tipográfico.
- **Horizon cards**: grid 3 colunas em md+, empilham 1 coluna em mobile, leitura confortável.
- Tipografia 12.5px no corpo / 10–11px em eyebrows — escaneável sem desconforto.
- Densidade respiratória: padding 5×5 md:6×6, espaçamento vertical 4–5.

---

## Final Strategy Decision Experience

Cada uma das 24 estratégias expandidas agora apresenta a seguinte hierarquia editorial:

1. Como funciona & racional (existente).
2. **Apoio à decisão (novo)**: Fit + Caution + Profile + Trade-off + Horizonte.
3. Vantagens / Riscos & limites (existente).
4. Cálculos ilustrativos com "Leitura:" (existente, da passada anterior).
5. Cenários de aplicação (existente).
6. Comparativos com "Por quê:" (existente, da passada anterior).
7. Leitura patrimonial (existente, da passada anterior).

A sequência leva o usuário de **entendimento → decisão → análise → comparação → síntese**, em ordem consultiva natural.

### Arquivos

- **Criado**: `src/components/modules/wealth/strategyDecisionSupport.ts` — 24 entradas com 5 dimensões cada + helper `getDecisionSupport`.
- **Editado**: `src/components/modules/wealth/StrategyLibrarySection.tsx` — import + invocação do bloco + componentes `DecisionSupportBlock` e `DecisionLine`.

---

## Final Verdict

O módulo Estratégias Patrimoniais evoluiu de **explicação financeira** para **apoio à decisão patrimonial**:

- Cada estratégia responde claramente *para quem*, *quando*, *por que e em troca de quê*.
- O trade-off é declarado, não implícito — elimina a sensação de "boa para todos".
- A evolução temporal é narrada em três janelas, mostrando como liquidez, fluxo e patrimônio se transformam.
- A aderência patrimonial é sinalizada por tags neutras, sem score nem perfil psicológico.

Tom: consultivo, sóbrio, matemático, premium. Zero IA visível, zero recomendação marketeira, zero popup. A plataforma agora se comporta como uma **consultoria patrimonial que ajuda o cliente a decidir melhor**, e não como um catálogo de estratégias nem um recomendador agressivo.

Estado: **pronto para uso**. Degradação silenciosa garante zero risco de regressão para estratégias futuras ainda não cobertas pela camada de apoio à decisão.
