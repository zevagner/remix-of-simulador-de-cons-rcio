# Financial Explanation Quality Pass

Data: 2026-05-16
Módulo: Estratégias Patrimoniais (Wealth Platform)
Escopo: 24 estratégias — camada de explicação consultiva premium

---

## Princípios

A passada NÃO criou novas estratégias, novos módulos, novas arquiteturas, IA conversacional nem novas auditorias paralelas. A intervenção é **uma camada de explicação** anexada ao conteúdo existente, surfaçada no renderer já consolidado.

Três dimensões consultivas foram adicionadas:

1. **Leitura patrimonial** — fechamento editorial de 2–4 frases por estratégia.
2. **Leitura dos cálculos** — interpretação consultiva linha-a-linha do significado patrimonial de cada número.
3. **Razão dos comparativos** — explicação de POR QUE existe a diferença financeira, não apenas o quanto.

Tudo via lookup por `id` da estratégia + `label` da linha. Ausência de match degrada silenciosamente (sem nota). Zero quebra na evolução futura de `strategyLibraryData.ts`.

---

## Comparative Explanation Improvements

Cada linha de comparativo agora pode expor uma sub-linha italica **"Por quê:"** que explica a diferença em termos de:

- **Liquidez**: capital preservado vs. capital comprometido (caixa próprio).
- **Fluxo**: rendimento mensal, aluguel, receita do ativo cobrindo parcela.
- **Custo financeiro**: taxa administrativa diluída × juros bancários compostos sobre saldo devedor.
- **Construção patrimonial**: composição (reinvestimento, escada) × crescimento linear.
- **Timing**: trade-off explícito tempo × custo.
- **Exposição**: redistribuição do mesmo capital sem dívida.

Cobertura: 10 estratégias prioritárias (compra-a-vista, híbrida, planejada, acelerada, leverage, alavancagem imobiliária, multiplicação, autoquitação, escalável, solar). Restantes seguem com o `delta` original consultivo já existente; novas razões podem ser adicionadas incrementalmente sem refactor.

---

## Liquidity Explanation Pass

A interpretação de liquidez foi inserida diretamente nas notas de cálculo e nas leituras patrimoniais:

- Diferenciação entre **capital comprometido** (lance, à vista) e **capital preservado** (em renda fixa, líquido).
- Explicitação de **flexibilidade patrimonial** preservada durante o ciclo.
- Distinção entre **reserva de emergência intacta** e **caixa zerado**.
- **Fluxo mensal**: rendimento do capital preservado cobrindo parcela total ou parcialmente.

Estratégias com tratamento explícito de liquidez na leitura patrimonial: compra-a-vista, híbrida, leverage, alavancagem imobiliária, multiplicação, autoquitação, escalável, holding.

---

## Wealth Construction Improvements

A lógica de construção patrimonial é tratada de três formas distintas:

- **Composta**: multiplicação-cotas, reinvestimento-estruturado — renda passiva financia novas cotas em ciclos.
- **Vertical**: escada-patrimonial — equity de um ativo financia tier superior.
- **Em escada (renda)**: renda-passiva, alavancagem-imobiliaria — cada cota quitada acrescenta fluxo recorrente ao agregado.
- **Por compressão temporal**: autoquitação-estruturada — o ativo trabalha para se quitar.

A leitura patrimonial de cada estratégia explica explicitamente como o patrimônio evolui ao longo do tempo, e como o fluxo influencia o resultado final.

---

## Cost of Opportunity Pass

Custo de oportunidade é incorporado em tom elegante (sem virar aula acadêmica) através de:

- **Notas de cálculo** indicando que capital preservado em renda fixa gera rendimento mensal recorrente — caixa que deixa de existir na compra à vista clássica.
- **Razões dos comparativos** explicitando que taxa administrativa diluída não compõe sobre saldo devedor, ao contrário dos juros bancários.
- **Leituras patrimoniais** indicando, em compra-planejada, que a diferença nominal entre consórcio e financiamento é **capitalizável em paralelo** — o ganho real depende de disciplina, não de promessa.
- Em solar, a economia mensal é tratada como **amortização indireta** — caixa que deixa de sair como custo de oportunidade recuperado.

---

## Long-Term Patrimonial Logic

Efeitos de longo prazo explicitados em estratégias cuja tese é horizonte longo:

- **multiplicacao-cotas**: composição via reinvestimento, horizonte 10+ anos.
- **escada-patrimonial**: ciclos de 3–5 anos, crescimento vertical.
- **renda-passiva**: transição entre fase laboral e fase patrimonial.
- **patrimonio-gerador-caixa**: diversificação real entre classes não-correlacionadas.
- **holding-patrimonial**: economia tributária recorrente capitalizada ao longo do horizonte.
- **planejamento-sucessorio**: antecipação de decisões que evitam custo e bloqueio futuros.

Em cada caso, a leitura patrimonial explica o efeito do tempo sobre o resultado, sem prometer multiplicador.

---

## Financial Storytelling Improvements

Cada leitura patrimonial conta uma **lógica financeira coerente** com início, meio e implicação:

1. **Premissa** (o que a estratégia faz no plano financeiro).
2. **Mecânica** (como liquidez, fluxo, custo, tempo se articulam).
3. **Implicação patrimonial** (o que isso significa no patrimônio final).

Não há hype, emoção exagerada ou promessa implícita. Vocabulário evita "multiplicador mágico", "ganhar mais", "alavancagem agressiva". Termos preferidos: *exposição*, *construção*, *preservação*, *capitalização*, *compressão temporal*, *autossustentável*.

---

## Calculation Explanation Improvements

Cada linha de cálculo cobrira na camada de enhancements ganha uma **sub-linha "Leitura:"** explicando:

- Por que a métrica importa para a decisão patrimonial.
- O que aquele número significa em termos de liquidez, fluxo, custo, exposição.
- Distinção entre **capital comprometido**, **capital preservado**, **fluxo mensal**, **referência comparativa**.

Exemplos:

- *Valor do bem (compra à vista clássica)* → "Comprometimento total imediato — zera caixa e elimina rendimento futuro do capital."
- *Custo total do financiamento equivalente* → "Referência comparativa: juros bancários compõem sobre o saldo devedor mês a mês."
- *Folga disponível para amortização (autoquitação)* → "Excedente que comprime o prazo efetivo — quanto maior, mais cedo a liberação."
- *IR sobre aluguel PJ presumido (escalável)* → "Carga reduzida na PJ — diferença anual recorrente compõe ao longo do horizonte."

Cobertura prioritária: 13 estratégias com leituras explícitas em cálculos; restantes degradam silenciosamente para o formato original.

---

## Premium Consultive Tone Validation

Linguagem auditada para parecer **consultor patrimonial sênior**, não vendedor:

- Evitado: "ganhe", "multiplique", "garantido", "oportunidade única", "agressivo", "explosivo".
- Preferido: "tende a", "costuma viabilizar", "em horizontes longos", "estrutura mais econômica", "trade-off explícito", "estratégia se autofinancia", "ponto crítico de execução".
- Pronome impessoal ("o cliente", "o investidor") em vez de imperativo de marketing.
- Explicitação de risco quando aplicável ("o risco real não é financeiro — é comportamental").

---

## Scannable Intelligence Validation

Mesmo com profundidade ampliada, a leitura permanece fluida:

- **Notas de cálculo** em uma sub-linha italica enxuta (≤ 120 caracteres), com eyebrow "Leitura:" diferenciada.
- **Razões dos comparativos** em sub-linha italica enxuta, com eyebrow "Por quê:" diferenciada.
- **Leitura patrimonial** em bloco final com borda primary suave e ícone `Quote` — fecha a estratégia com tom editorial sem competir com as tabelas.
- Tipografia mantida na escala existente (11.5–13.5px); espaçamento e ritmo dos cards preservados.
- Tabelas usam `align-top` para acomodar sub-linhas sem quebrar o ritmo vertical.
- Ausência de dados na camada de enhancement = nenhum slot vazio: degradação silenciosa total.

---

## Final Strategy State

- 24 estratégias mantêm UI, expansão, cálculos, cenários, comparativos e ordem editorial inalterados.
- 24 leituras patrimoniais consultivas adicionadas (cobertura 100%).
- 13 mapas de leitura de cálculos adicionados (cobertura ~80% das estratégias prioritárias).
- 10 mapas de razão de comparativos adicionados (cobertura das prioritárias).
- Nenhum schema de dados alterado em `strategyLibraryData.ts`.
- Nenhuma migration, edge ou business logic tocada.
- Renderer recebeu três pontos de injeção (calc.meaning, comparison.why, patrimonialReading) com fallback silencioso.

### Arquivos

- **Criado**: `src/components/modules/wealth/strategyExplanationEnhancements.ts` — 3 mapas + 3 helpers de lookup.
- **Editado**: `src/components/modules/wealth/StrategyLibrarySection.tsx` — `Fragment` import, sub-linhas em ambas tabelas, bloco "Leitura patrimonial" final.

---

## Final Verdict

O módulo Estratégias Patrimoniais agora **ensina inteligência patrimonial sofisticada através das próprias simulações**:

- Os números não aparecem nus — vêm acompanhados de interpretação consultiva.
- Os comparativos não respondem apenas "quanto custa" — respondem "por que é financeiramente diferente".
- Cada estratégia fecha com uma leitura patrimonial que sintetiza liquidez, fluxo, construção patrimonial e timing num parágrafo consultivo elegante.

Tom: matemático, sóbrio, premium, consultivo. Zero hype, zero marketing, zero promessa implícita. A plataforma agora se comporta como uma consultoria patrimonial real, com profundidade explicativa proporcional à profundidade dos cálculos.

Estado: **pronto para uso**. Degradação silenciosa garante zero risco de regressão para estratégias ainda não cobertas pela camada de explicações.
