# Auditoria Estratégica — Módulo Análise

Data: 2026-05-12
Autor: Principal Engineer + UX consultivo (auditoria honesta)
Escopo: módulo `analysis` e seus 6 submódulos
(Visão geral, Investimentos, Comparador, Estudo de lances,
Operações estruturadas, Assembleias).

> Este relatório é **brutalmente honesto** por solicitação explícita.
> Onde algo não agrega, está dito sem rodeio.
> Onde algo é forte, está reconhecido. Nenhuma alteração de código
> foi feita — esta é uma entrega de **diagnóstico estratégico**.

---

## 1. Visão geral do módulo Análise

### 1.1 Função declarada
"Análise" foi posicionada na sidebar como **passo 3 do fluxo de venda**
(Diagnóstico → Simulador → **Análise** → Abordagem → Proposta → Carteira →
Pós-venda). Funciona como **estação consultiva intermediária** entre
"simular o produto" e "vender o produto".

### 1.2 Função real observada
Hoje, Análise é um **agrupador de 6 ferramentas técnicas**. Cada submódulo
tem maturidade própria (motores determinísticos, IA opcional, gráficos),
mas o conjunto carece de uma **narrativa única**: o gerente entra, vê 6
opções, e precisa **decidir sozinho** o que olhar primeiro.

A Visão Geral foi criada justamente para resolver isso (resumo executivo
+ alertas + direcionamento), o que sugere que **o problema cognitivo já
foi identificado no produto**, mas a solução ainda não está pronta.

### 1.3 Maturidade percentual (estimativa qualitativa)

| Submódulo                | Maturidade | Valor comercial real |
| ------------------------ | ---------: | -------------------: |
| Visão geral              |        65% |                  60% |
| Investimentos            |        90% |                  95% |
| Comparador               |        85% |                  90% |
| Estudo de lances         |        85% |                  80% |
| Operações estruturadas   |        70% |                  55% |
| Assembleias              |        60% |                  45% |

---

## 2. Mapa do fluxo mental do gerente

### 2.1 O que o gerente realmente quer ao chegar em Análise

Em ordem de frequência observada (heurística, não dado quantitativo):

1. **Convencer um cliente que já hesitou** → precisa de argumento novo.
2. **Comparar com financiamento** → cliente disse "vou financiar".
3. **Mostrar consórcio como investimento** → cliente com perfil financeiro.
4. **Validar viabilidade de lance** → cliente perguntou "quando saio?".
5. **Estruturar uma operação maior** → cliente premium, múltiplas cartas.
6. **Escolher melhor grupo** → demanda rara, em geral pré-venda técnica.

### 2.2 Fluxo natural esperado

```text
Diagnóstico → Simulador → [Análise: encontrar o argumento certo] → Abordagem
                                       │
                ┌──────────────────────┼──────────────────────┐
                ▼                      ▼                      ▼
         Investimentos          Comparador             Estudo de lances
        (perfil ROI)        (perfil financiamento)   (perfil "quando saio")
```

Operações estruturadas e Assembleias são **caudas longas**: úteis para 5–15%
das vendas, mas hoje ocupam o mesmo peso visual dos 3 motores principais.

### 2.3 Quebras cognitivas atuais

- **6 itens irmãos** na sidebar dão ilusão de paridade entre módulos com
  valor comercial muito diferente (Investimentos ≠ Assembleias).
- **Sem ranking sugerido** → o gerente decide no escuro qual abrir.
- **Visão geral existe**, mas concorre com 5 submódulos sem ser o ponto
  óbvio de entrada — vira "mais uma aba".
- **Voltar para Análise** só aparece em mobile; no desktop o gerente
  perde a sensação de container.

---

## 3. Auditoria profunda — Submódulo "Visão Geral"

### 3.1 O que ele é hoje
Arquivo: `src/components/modules/analysis/AnalysisOverview.tsx` (239 linhas).

Estrutura em **3 camadas determinísticas** (sem IA, sem rede):

1. **KPIs**: Parcela, Custo efetivo, Contemplação estimada, Perfil cliente.
2. **Alertas**: deriva de `useCopilotTriggers` (custo alto, lance embutido,
   cliente parado, risco pós-venda) com CTA contextual.
3. **Direcionamento**: heurística que escolhe **1 destino primário + 2
   secundários** baseado em tipo de consórcio, valor, lance, parcela
   reduzida e custo.

### 3.2 Avaliação honesta

| Pergunta                                  | Resposta              |
| ----------------------------------------- | --------------------- |
| Resolve um problema real?                 | **Sim** — cognitivo.  |
| Ajuda alguma decisão?                     | **Sim** — qual aba.   |
| Ajuda a convencer cliente?                | **Não diretamente.**  |
| Resume algo importante?                   | **Parcialmente.**     |
| Apenas repete outros módulos?             | **Não.**              |
| Virou dashboard genérico?                 | **Risco real.**       |
| Virou clique morto?                       | **Hoje, não. Mas...** |

**Forças reais:**
- A camada 3 (direcionamento) é o **único lugar do produto** que diz ao
  gerente "vá para esta aba e por este motivo". Isso é raro e valioso.
- Estado vazio é honesto ("sem simulação, sem overview").
- Determinístico → previsível, testável, rápido.

**Fraquezas reais:**
- "Contemplação estimada = `termMonths * 0.4`" é um **número fraco** que
  finge precisão. O Estudo de Lances tem dado real — usar lá ou remover.
- KPI "Perfil do cliente" é um label de texto, não vira ação.
- Camada 1 e 2 **competem visualmente** com o Resumo Executivo do
  Simulador e com o `AIInsightsPanel` (mesma página!).
- O título "Visão geral" sinaliza **passividade**. Gerente em venda
  consultiva não quer "ver", quer **decidir**.

### 3.3 Veredito sobre Visão Geral

**NÃO remover. NÃO manter como está. TRANSFORMAR.**

A camada 3 (Próximo passo) é a coisa mais útil do módulo Análise inteiro.
Ela está enterrada como "a terceira seção da primeira aba". Deveria ser
**a tela de entrada do módulo Análise, sem ambiguidade**, e ter um nome
que comunique ação:

**Recomendação de rebranding:**
- `Visão geral` → **`Cockpit consultivo`** (ou `Plano recomendado`)
- Mensagem implícita: "este é o ponto de partida; daqui você é guiado".

---

## 4. Avaliação individual dos submódulos

### 4.1 Investimentos
- **Objetivo:** posicionar consórcio como estratégia financeira.
- **Valor real:** alto. É o motor que vende para perfil
  conservador/investidor (multiplicação de cota, comparação com CDI/FGTS).
- **Problemas:** módulo grande (842 linhas no container), muitos cenários
  visíveis ao mesmo tempo, risco de paralisia. `InvestmentStorytelling` IA
  já compensa em parte.
- **Manter? Sim. Ajustes UX, não estruturais.**

### 4.2 Comparador
- **Objetivo:** consórcio vs financiamento (SAC/Price/CDI).
- **Valor real:** altíssimo — ataca a objeção número 1 do mercado.
- **Problemas:** narrativa boa, mas resultado final às vezes "frio"
  (números sem o gancho consultivo que existe em Investimentos).
- **Manter? Sim. Investir em síntese ("ganho real em R$") no topo.**

### 4.3 Estudo de lances
- **Objetivo:** probabilidade de contemplação por grupo/lance.
- **Valor real:** alto para clientes que perguntam "quando saio?".
- **Problemas:** sobrepõe-se parcialmente com Assembleias (ambos usam
  histórico de assembleia). Hoje a separação é: Lances = decisão sobre
  lance; Assembleias = ranking de grupos. A fronteira **não é óbvia**
  para o gerente.
- **Manter? Sim, mas absorver Assembleias como sub-aba interna.**

### 4.4 Operações estruturadas
- **Objetivo:** combinar múltiplas cartas (estratégia patrimonial).
- **Valor real:** baixo-médio. Atende ~5% dos casos (clientes premium).
- **Problemas:** ocupa peso de sidebar igual a Investimentos. Para 95%
  dos gerentes é **ruído**.
- **Manter? Sim, mas mover para "submódulo avançado" — fora da entrada
  principal. Acessível via Visão Geral / Cockpit quando o input do
  simulador indicar carta alta.**

### 4.5 Assembleias
- **Objetivo:** ranking de melhores grupos por histórico.
- **Valor real:** baixo no fluxo consultivo (gerente já escolhe o grupo
  no Simulador via filtro dinâmico). É mais uma **ferramenta de pré-venda
  técnica** do que de venda.
- **Problemas:** redundância com Estudo de Lances (mesma fonte de dados,
  análise diferente); raramente é o "próximo passo natural" pós-simulação.
- **Veredito honesto:** **fundir como aba interna do Estudo de Lances.**
  Nome sugerido lá: "Histórico do grupo".

---

## 5. Redundâncias identificadas

| Onde                                | O quê                                          | Severidade |
| ----------------------------------- | ---------------------------------------------- | ---------: |
| Visão Geral KPIs vs Simulador       | Parcela / custo aparecem nos dois              |     Média  |
| Visão Geral Alertas vs AIInsights   | Mesma página renderiza ambos                   |     **Alta** |
| Estudo de lances vs Assembleias     | Histórico de assembleia em ambos               |     **Alta** |
| Investimentos vs Comparador         | Comparação com CDI parcialmente sobreposta     |     Baixa  |
| Op. estruturadas vs Investimentos   | Multiplicação de cota tangencia ambos          |     Baixa  |

---

## 6. Pontos fortes do módulo

- **Determinismo onde importa** (motores financeiros, heurísticas).
- **IA usada como verniz comunicativo**, não como motor de cálculo.
- **Estado compartilhado real** entre submódulos (SimulatorContext,
  BidsStudyContext, InvestmentResultsContext) — qualquer ajuste no
  simulador propaga sem inconsistência.
- **Pré-load no idle** dos chunks dos submódulos: navegação rápida.
- **Persistência da última aba** + breadcrumb consistente.

## 7. Pontos fracos do módulo

- **Sem hierarquia comercial visível.** 6 abas planas, sem distinção entre
  motores principais e auxiliares.
- **Visão Geral subutilizada** como ponto de entrada cognitivo.
- **Assembleias não cabe como peer** dos demais — é um detalhe técnico.
- **Sem síntese final ("o que falar com o cliente agora")** — o gerente
  precisa traduzir cada submódulo em discurso por conta própria.
- **Peso visual da Operações Estruturadas** desproporcional à frequência
  de uso real.

---

## 8. Recomendação final (brutalmente honesta)

### 8.1 O que **manter**
- Investimentos
- Comparador
- Estudo de lances (com Assembleias absorvidas internamente)
- Visão Geral — **transformada em Cockpit Consultivo**

### 8.2 O que **fundir**
- **Assembleias → Estudo de lances** (aba interna "Histórico do grupo").

### 8.3 O que **reposicionar**
- **Operações estruturadas**: sair do menu principal de Análise. Acessível
  via Cockpit quando o Simulador detectar carta ≥ R$ 500k ou múltiplas
  simulações abertas. Para os outros casos, esconder.

### 8.4 O que **transformar**
- **Visão Geral → Cockpit Consultivo**:
  - Remover KPI fraco "Contemplação estimada = termMonths*0.4"
    (substituir por dado real do Estudo de Lances quando disponível, ou
    omitir).
  - Fundir camada de alertas com `AIInsightsPanel` para evitar duplicação.
  - **Promover camada 3 (Próximo passo) ao topo da tela**, com 1 CTA
    primário grande + 2 secundários.
  - Adicionar ao final: bloco "**O que falar com o cliente agora**" —
    1 frase pronta, gerada determinística ou via CentralAI, baseada no
    submódulo recomendado.

### 8.5 Estrutura futura proposta

```text
ANÁLISE (sidebar)
├── Cockpit consultivo        ← entrada padrão (era Visão Geral)
├── Investimentos
├── Comparador
└── Estudo de lances
      ├── Lance recomendado      (atual Estudo de lances)
      └── Histórico do grupo     (atual Assembleias, absorvida)

[ACESSO CONTEXTUAL — fora da sidebar principal]
└── Operações estruturadas    (CTA do Cockpit quando relevante)
```

Sidebar passa de **6 itens visuais → 4 itens visuais** sem perda de
funcionalidade. Carga cognitiva cai significativamente.

---

## 9. Scores

| Dimensão                       | Score atual | Score após plano |
| ------------------------------ | ----------: | ---------------: |
| Utilidade comercial            |       6 / 10 |          9 / 10 |
| UX cognitiva                   |       5 / 10 |          8 / 10 |
| Valor estratégico              |       7 / 10 |          9 / 10 |
| Clareza de hierarquia          |       4 / 10 |          9 / 10 |
| Capacidade de convencimento    |       6 / 10 |          9 / 10 |
| Eficiência operacional         |       7 / 10 |          9 / 10 |

**Score global Análise (atual):** 5.8 / 10
**Score global Análise (proposto):** 8.8 / 10

---

## 10. Próximas ações sugeridas (priorizadas)

1. **Renomear** "Visão geral" → "Cockpit consultivo" (UI + `ANALYSIS_SUBITEMS`).
   Custo: trivial. Impacto: percepção imediata de valor.
2. **Promover camada 3** (Próximo passo) ao topo da tela do Cockpit;
   recolher KPIs em accordion "Resumo executivo".
3. **Remover KPI "Contemplação estimada = termMonths × 0.4"** ou substituir
   por dado real do `BidsStudyContext`.
4. **Absorver Assembleias** como aba interna de Estudo de lances; remover
   item da sidebar e do `ANALYSIS_SUBITEMS`. Manter rota legada via
   redirect em `Index.tsx` (`assemblies` → `bids?tab=historico`).
5. **Mover Op. estruturadas** para acesso contextual (CTA no Cockpit).
   Manter rota direta para usuários que tenham bookmark.
6. **Fundir alertas** do Cockpit com `AIInsightsPanel` para evitar
   duplicação visual na mesma página.
7. **Adicionar bloco "Fale com o cliente agora"** no rodapé do Cockpit
   — 1 frase pronta + botão "Copiar" / "Abrir Abordagem".

Cada item é independente. Pode-se começar pelo (1) e (4) — maior
relação impacto/risco.

---

## 11. O que NÃO fazer

- **Não remover Visão Geral pura e simplesmente.** A camada 3 é o ativo
  mais subaproveitado do módulo.
- **Não criar abstrações novas** (orquestrador, registry de cockpit, IA
  para escolher o submódulo). A heurística determinística atual é
  excelente — basta promovê-la.
- **Não mexer em motores financeiros** durante essa reorganização.
  Fluxo de venda muda; cálculo permanece.
- **Não adicionar mais KPIs** ao Cockpit. O problema é foco, não falta de
  número.

---

**Conclusão honesta:** o módulo Análise está **tecnicamente saudável e
estrategicamente subaproveitado**. Não falta funcionalidade — falta
**hierarquia comercial e voz consultiva**. As mudanças propostas são em
sua maioria de **navegação, naming e ordem visual** — baixo risco,
alto impacto. A Visão Geral merece sobreviver, **mas precisa virar o
que sempre quis ser: o cockpit que decide a próxima jogada da venda.**
