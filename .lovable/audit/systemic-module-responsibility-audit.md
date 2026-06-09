# Auditoria Sistêmica de Responsabilidades entre Módulos

**Escopo:** Fronteiras, sobreposições e identidade de cada módulo do funil
comercial, com foco em proteger o **Cockpit Consultivo** de virar
"supermódulo".

**Não escopo:** alterações de motor de cálculo, RLS, regras de negócio.
Esta entrega é estratégica — a próxima onda traduz em PRs visuais.

---

## 1. Mapa do fluxo comercial (estado ideal)

```text
Diagnóstico → Simulador → Cockpit ──┬─→ Comparador
                                    ├─→ Investimentos
                                    ├─→ Estudo de Lances
                                    └─→ Operações Estruturadas
                                              │
                                              ▼
                                         Abordagem
                                              │
                                              ▼
                                          Proposta
                                              │
                                              ▼
                                         Carteira (CRM)
                                              │
                                              ▼
                                          Pós-venda
```

**Regra de ouro:** cada seta é unidirecional no funil. O Cockpit é um
**HUB de roteamento**, não um destino final.

---

## 2. Identidade exata de cada módulo

| Módulo | Faz | NÃO faz | Entrega ao próximo |
|---|---|---|---|
| **Diagnóstico** | Capta perfil, dor, objetivo do cliente | Calcular, propor, vender | Slots no `ClientJourneyContext` |
| **Simulador** | Constrói cenário base, parametriza operação, gera resultado | Recomendar, comparar, narrar | `simulation` no contexto |
| **Cockpit** | Decide direção, sugere próxima ação, conecta módulos | Aprofundar, calcular, virar script/CRM | Roteamento + 1 frase pronta |
| **Comparador** | Prova financeira: consórcio × financiamento × cash | Sugerir produto, falar de patrimônio, gerar pitch | Diferenciais quantitativos |
| **Investimentos** | Patrimônio, multiplicação de cotas, capital, estratégia financeira | Repetir KPIs do Simulador, dar alertas | `investmentResults` no contexto |
| **Estudo de Lances** | Probabilidade de contemplação, faixas, histórico de assembleias | Recomendar produto, calcular custo total | `bidsStudy` no contexto |
| **Operações Estruturadas** | Cenários complexos (múltiplas cotas, ≥ R$ 500k) | Aparecer fora do contexto, competir com Cockpit | Estrutura de operação |
| **Abordagem** | Argumentação verbal, scripts, gatilhos, objeções | Calcular, propor formalmente, gerenciar pipeline | Conversa pronta |
| **Proposta** | Storytelling formal, PDF, link compartilhável | Coaching verbal, follow-up, métricas pipeline | Documento + link |
| **Carteira (CRM)** | Pipeline kanban, cadência, follow-up, score, próxima ação | Calcular, criar proposta do zero | Status comercial atualizado |
| **Pós-venda** | Retenção, relacionamento, reentrada, novas oportunidades | Captação fria, simulação inicial | Cliente fidelizado / novo lead |

---

## 3. Sobreposições detectadas (estado atual)

### Críticas (corrigir imediatamente)

| # | Sobreposição | Onde | Quem fica | Quem sai |
|---|---|---|---|---|
| 1 | "Próximo passo recomendado" duplicado 3× | `AIInsightsPanel` + `AnalysisOverview` hero + `AnalysisCopilot` toast | Cockpit hero (determinístico) | Remover do AIInsightsPanel; toast só se Cockpit fechado |
| 2 | KPIs (parcela/custo/ratio) | Simulador "Resultados" + Cockpit "Resumo executivo" + AIInsightsPanel.summary | Simulador | Tirar do Cockpit e do AI panel |
| 3 | Pitch comercial | Cockpit "O que falar agora" + AIInsightsPanel.analysis + `ContextualSalesScript` em Abordagem | Cockpit (1 frase, copiar) + Abordagem (variantes completas) | AIInsightsPanel sai |
| 4 | Pontos de atenção (custo alto, lance embutido) | Cockpit lista + AnalysisCopilot proativo (`useCopilotTriggers`) | Copilot proativo (visual flutuante) | Lista do Cockpit só se Copilot dispensado |
| 5 | Próxima ação do cliente | Cockpit + Carteira card + Pós-venda card | Cockpit (na sessão de venda) + Carteira (no pipeline) | Não duplicar texto — usar mesmo `nextActionSuggestion` |

### Médias (próxima onda)

| # | Sobreposição | Onde | Resolução |
|---|---|---|---|
| 6 | Storytelling de cenários | InvestmentStorytelling + Proposta narrativa | Investimentos = storytelling **interno** (gerente entender); Proposta = storytelling **externo** (cliente ler) |
| 7 | Comparação consórcio × financiamento | Comparador + Cockpit alerta + Proposta bloco | Comparador = números; Cockpit = alerta+CTA; Proposta = resumo visual com 3 KPIs |
| 8 | Gatilhos comerciais | Abordagem (estrutura coaching) + Cockpit pitch | Cockpit = 1 gatilho contextual; Abordagem = biblioteca completa |
| 9 | Score do cliente | Carteira (score 0-100) + Pós-venda (priority) | `clientScoring.ts` é fonte única — só varia o consumo |
| 10 | Histórico de assembleias | Estudo de Lances "Histórico do grupo" (Assemblies fundido) ✅ | Já resolvido — não há mais duplicidade |

### Baixas (monitorar)

- Investimentos e Operações Estruturadas podem confundir o gerente sobre
  "onde modelar o cenário avançado". Regra: **Investimentos** trata
  até **3 cenários paralelos** com 1 carta; **Operações Estruturadas**
  trata **múltiplas cartas** combinadas.
- "Diagnóstico" e "Cockpit" ambos exibem perfil do cliente. Manter:
  Diagnóstico = captura; Cockpit = lê e usa (sem editar).

---

## 4. Excessos atuais do Cockpit

O Cockpit hoje contém **5 conteúdos que não pertencem a ele**:

1. **Resumo executivo da simulação** (KPIs colapsados) → vai para o
   Simulador (já existe lá).
2. **Sub-seção "Resumo" do AIInsightsPanel** → redundante, eliminar.
3. **Sub-seção "Próximo passo" do AIInsightsPanel** → duplica hero.
4. **Lista textual de "Pontos de atenção"** quando o Copilot proativo já
   está disparado → unificar canal.
5. **Pitches longos com tom marketing** ("dobra seu poder de compra",
   "estratégia poderosa") → pertencem à **Abordagem** como variantes
   completas; no Cockpit fica apenas a frase determinística e factual.

Se mantidos, o Cockpit:
- Ocupa 2× a primeira dobra que precisa.
- Gera atrito mental de "qual fonte sigo?".
- Começa a parecer dashboard.
- Compete com o `AIInsightsPanel` que ele mesmo contém.

---

## 5. Fronteiras definitivas — quem faz o quê

### Cockpit Consultivo

| Pertence | NÃO pertence |
|---|---|
| Hero "Próximo passo" (1 ação clara) | KPIs detalhados |
| 1 frase pronta + Copiar + atalhos para Abordagem/Proposta | Biblioteca de scripts |
| Atalhos compactos para módulos especializados | Cards densos com cálculos |
| CTA contextual para Operações Estruturadas | Pipeline kanban |
| Alerta condicional (apenas se Copilot proativo não cobrir) | Follow-up, cadência |
| AIInsightsPanel **recolhido** ao final | AIInsightsPanel grande no topo |
| Link "Ver simulação completa →" | Resumo executivo replicado |

### Abordagem

| Pertence | NÃO pertence |
|---|---|
| Storytelling completo (AIDA/PAS) | Próximo passo do funil |
| Biblioteca de gatilhos e objeções | Cálculos |
| Scripts contextuais (`ContextualSalesScript`) | Pipeline |
| Coaching verbal aprofundado | Geração de PDF |

### Proposta

| Pertence | NÃO pertence |
|---|---|
| PDF formal | Coaching verbal |
| Link compartilhável | Pipeline |
| Storytelling visual para o cliente | Recálculo de cenários |
| Disclaimers obrigatórios | Próxima ação operacional |

### Carteira

| Pertence | NÃO pertence |
|---|---|
| Pipeline kanban | Construção de simulação |
| Cadência, SLA, score | Argumentação verbal |
| Forecast de vendas | Storytelling |
| Próxima ação operacional do gerente | Pitch ao cliente |

### Pós-venda

| Pertence | NÃO pertence |
|---|---|
| Risco, retenção, reentrada | Captação fria |
| Resposta a mensagens do cliente | Construção da venda inicial |
| Renovação / nova cota | Pipeline de prospecção |

---

## 6. Recomendações de redistribuição (brutalmente honestas)

### Remover do Cockpit

- ❌ Bloco "Resumo executivo da simulação" (vai para Simulador, já existe).
- ❌ Sub-seção "Resumo" e "Próximo passo" do `AIInsightsPanel`.
- ❌ Pitches com verbos de marketing — reescrever como frases factuais.

### Mover

- ➡ **Para Abordagem:** variantes completas de pitch, biblioteca de
  gatilhos por driver, scripts longos. O Cockpit linka ("Abrir Abordagem
  →"), não reproduz.
- ➡ **Para Proposta:** qualquer narrativa formal "para o cliente ler" —
  hoje há resíduo no `AIInsightsPanel.analysis` que vira marketing.
- ➡ **Para Carteira:** "próxima ação operacional do gerente" (ligar,
  enviar WhatsApp, agendar). O Cockpit cuida da próxima **decisão de
  venda** (qual módulo abrir), Carteira cuida da próxima **tarefa
  operacional**.
- ➡ **Para Pós-venda:** triggers de "cliente parado há > 7 dias" quando
  já é cliente. No funil de venda ativo, fica no Cockpit/Copilot.

### Reduzir

- 🔻 `AIInsightsPanel`: 3 seções → 1 seção (apenas "Análise consultiva"),
  recolhida por padrão, no rodapé do Cockpit.
- 🔻 Caminhos secundários do Cockpit: cards 2-col → chips inline.
- 🔻 Texto de CTA de Operações Estruturadas: 2 linhas → 1 linha.

### Manter

- ✅ Hero "Próximo passo recomendado" (única fonte determinística).
- ✅ Bloco "O que falar agora" com Copiar + Abordagem + Proposta.
- ✅ CTA contextual de Operações Estruturadas (≥ R$ 500k).
- ✅ Histórico de assembleias dentro de Estudo de Lances (já fundido).

---

## 7. Before / After conceitual

### Cockpit

```text
ANTES                                  DEPOIS
[AIInsightsPanel grande]               [Hero: Próximo passo]
[Copilot toast]                        [Frase pronta + Copiar + atalhos]
[Hero: Próximo passo]        →         [Chips: outros módulos]
[Atalhos]                              [Alerta condicional]
[Frase pronta]                         [CTA Operações Estruturadas se ≥500k]
[Pontos de atenção (lista)]            [▾ Análise IA (recolhida)]
[CTA Operações]
[Resumo executivo (KPIs)]
```

### Sistema

```text
ANTES: Cockpit tenta resumir+prover+narrar+roteirizar+priorizar
DEPOIS: Cockpit roteia. Cada módulo aprofunda no seu domínio.
```

---

## 8. Carga cognitiva por módulo (alvo)

| Módulo | Densidade alvo | Tempo de leitura |
|---|---|---|
| Diagnóstico | Wizard 5 passos, 1 pergunta por vez | 2 min total |
| Simulador | 1 card resultado + parâmetros | escaneável em 5s |
| **Cockpit** | **3 blocos na 1ª dobra** | **decisão em 2s** |
| Comparador | Tabela densa, 3-5 KPIs | 30s |
| Investimentos | 3 cenários lado a lado | 1 min |
| Estudo de Lances | 3 zonas + projeção | 30s |
| Abordagem | Scripts longos + objeções | leitura demorada OK |
| Proposta | PDF formal | leitura do cliente |
| Carteira | Kanban escaneável | 10s por coluna |
| Pós-venda | Lista priorizada | 10s |

---

## 9. Scores

| Dimensão | Hoje | Meta | Comentário |
|---|---|---|---|
| Clareza arquitetural | 6/10 | 9/10 | Fronteiras existem mas não estão explícitas no produto |
| Especialização dos módulos | 7/10 | 9/10 | Comparador/Lances/Investimentos já bem definidos; Cockpit invade vizinhos |
| Fluxo consultivo | 7/10 | 9/10 | Funil é claro; ruído está dentro do Cockpit |
| Não-duplicidade | 4/10 | 9/10 | "Próximo passo" e KPIs duplicados em até 3 lugares |
| Carga cognitiva | 5/10 | 9/10 | Cockpit puxa 4× a densidade necessária |
| Identidade de cada módulo | 7/10 | 9/10 | Abordagem ainda absorve coisas que deveriam ser do Cockpit (frase pronta) |

---

## 10. Plano de execução sugerido

Cada item é uma PR pequena, isolada, **sem mexer em motores nem RLS**.

1. **Mover `AIInsightsPanel`** para o final do Cockpit, dentro de
   `<details>` recolhido. Remover sub-seções "Resumo" e "Próximo passo".
2. **Encurtar prompt da intent `analysis`** em `centralAI.ts` para forçar
   3 bullets ≤ 18 palavras (sem prosa).
3. **Remover "Resumo executivo da simulação"** do `AnalysisOverview.tsx`.
   Substituir por link "Ver simulação completa →".
4. **Tornar "Pontos de atenção" condicional** ao Copilot proativo estar
   dispensado.
5. **Reescrever pitches** em `buildSuggestions()` removendo verbos
   marketing ("dobra", "maximiza", "poderosa") e citando dado factual.
6. **Compactar caminhos secundários** do Cockpit em chips inline.
7. **Adicionar regra de lint/teste de UX**: `AIInsightsPanel` não pode
   ser renderizado fora de `<details>` no Cockpit (anti-regressão).

---

## 11. Recomendação final

O sistema **já é** uma plataforma consultiva organizada — o problema é
que o **Cockpit está invadindo vizinhos** por excesso de zelo:

- Tenta resumir o que o Simulador já mostra.
- Tenta narrar o que a Abordagem já narra melhor.
- Tenta priorizar o que a Carteira já prioriza no pipeline.
- Tenta antecipar o que o Pós-venda já trata.

A coragem necessária é deixar cada módulo **sentir falta** das funções
do Cockpit — porque é assim que o gerente entende para onde ir. Quando
todo módulo tenta fazer tudo, o sistema parece "cheio mas confuso".
Quando cada módulo faz apenas o seu, o sistema parece **profissional**.

**Mantra para o Cockpit:** _"Eu não resolvo. Eu indico onde resolver."_

**Mantra para os especializados:** _"Eu provo, profundo, único."_
