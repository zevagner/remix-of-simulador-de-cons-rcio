# Auditoria Estratégica — Conteúdo do Cockpit Consultivo

**Escopo:** Conteúdo interno do submódulo `Análise → Cockpit Consultivo`,
com foco em hierarquia, redundância, narrativa e fronteira com os demais
submódulos da Análise.

**Não escopo:** Não há alterações de código nesta entrega — este documento
embasa a próxima onda de execução visual/conteúdo.

---

## 1. Papel ideal do Cockpit

O Cockpit **não é** um relatório, dashboard ou módulo técnico. Ele é a
**central de decisão rápida da venda**. O gerente abre a tela e responde,
em até 5 segundos, três perguntas:

1. **O que fazer agora?** → Próximo passo recomendado
2. **O que falar agora?** → Frase pronta + atalhos para Abordagem/Proposta
3. **Para onde ir para aprofundar?** → Caminhos secundários + alertas com CTA

Tudo o que **não** responde uma dessas três perguntas é ruído e pertence a
outro submódulo (Comparador, Investimentos, Estudo de Lances, Operações
Estruturadas) ou ao módulo Abordagem/Proposta.

| Submódulo | Papel exclusivo | Não deve fazer |
|---|---|---|
| **Cockpit** | Direcionar, resumir, priorizar, conectar | Provar com números longos, listar cenários, gerar copy comercial extensa |
| **Comparador** | Custo total, consórcio vs financiamento, prova quantitativa | Sugerir próximo passo, gerar pitch |
| **Investimentos** | Patrimônio, multiplicação de cotas, cenários financeiros | Repetir KPIs do Simulador, dar "alertas" |
| **Estudo de Lances** | Probabilidade, faixas, histórico de assembleias | Recomendar produto, falar de patrimônio |
| **Operações Estruturadas** | Operações complexas (>R$ 500k), múltiplas cotas | Aparecer fora do contexto, competir com Cockpit |

---

## 2. Hierarquia atual × hierarquia ideal

### Atual (`AnalysisModule.tsx` + `AnalysisOverview.tsx`)

```text
[AIInsightsPanel]                          ← grande, textual, repete o que vem abaixo
  ├─ Resumo (determinístico)
  ├─ Análise consultiva (IA, 3-6 linhas)
  └─ Próximo passo recomendado            ← DUPLICADO
[AnalysisCopilot proativo]                 ← toast/alerta, ok
[AnalysisOverview]
  1. Próximo passo recomendado (hero)     ← DUPLICA o do AIInsightsPanel
  2. Caminhos secundários (cards)
  3. O que falar com o cliente agora      ← bom, único
  4. Pontos de atenção                    ← parcialmente duplica triggers do Copilot
  5. CTA Operações Estruturadas
  6. Resumo executivo (collapse)          ← KPIs já existem no Simulador
```

**Problemas críticos:**

- **Duplicação tripla do "Próximo passo":** aparece no `AIInsightsPanel`, no
  hero do `AnalysisOverview` e (em forma de toast) no `AnalysisCopilot`.
- **`AIInsightsPanel` antes do hero:** a IA fala antes do gerente ver a
  recomendação determinística. Inverte a hierarquia consultiva.
- **Resumo executivo redundante:** parcela, custo efetivo e ratio já são
  visíveis no card "Resultados" do Simulador (mesma sessão, 1 clique de
  distância). Manter aqui é mini-relatório.
- **Pontos de atenção × Copilot proativo:** ambos lêem `useCopilotTriggers`.
  O Copilot já mostra alerta visual flutuante; repetir como lista textual
  é ruído.

### Ideal

```text
1. Próximo passo recomendado (hero único, determinístico)
2. O que falar agora (pitch + Copiar + Abordagem/Proposta)
3. Atalhos: Comparador / Investimentos / Estudo de Lances (chips compactos)
4. Pontos de atenção (apenas se houver triggers — sem header se vazio)
5. CTA contextual Operações Estruturadas (apenas se crédito ≥ 500k)
6. [colapsado] Insights da CentralAI — reposicionado como "ver mais"
   (NÃO como bloco hero; só para quem quer narrativa IA estendida)
```

Resumo executivo dos KPIs **deve sair** do Cockpit. Já está no Simulador.

---

## 3. Auditoria do "Insights da CentralAI"

### Como está hoje (`AIInsightsPanel.tsx`)

- **Tamanho:** ~3 seções verticais (Resumo, Análise, Próximo passo) +
  header com badge "Beta". Ocupa ~400px de altura na primeira dobra.
- **Tom:** Textual, parágrafos. Análise IA tende a 4-8 linhas corridas.
- **Utilidade real para a venda:** Baixa-média. O "Resumo" repete dados do
  Simulador em prosa. O "Próximo passo" é o mesmo do hero do Cockpit.
  Apenas a "Análise consultiva" agrega — e mesmo assim concorre com o
  pitch determinístico que aparece logo abaixo.

### Respostas às perguntas obrigatórias

| Pergunta | Resposta honesta |
|---|---|
| Isso ajuda a vender? | Parcialmente. O pitch determinístico converte mais (já testado em campo). |
| Isso ajuda a decidir? | Não. A decisão vem do "Próximo passo" determinístico. |
| Deveria estar no Comparador? | A análise de custo/ratio sim. |
| Deveria estar em Investimentos? | A narrativa de patrimônio sim — já existe `InvestmentStorytelling` lá. |
| Deveria estar em Abordagem? | O bloco "frase pronta" sim — e já existe (`ContextualSalesScript`). |
| Está repetindo dados? | Sim. Resumo IA + KPIs + hero = três fontes da mesma informação. |
| Está "falando demais"? | Sim. Análise IA tende a parágrafo único; gerente em atendimento real escaneia, não lê. |
| Tom marketing? | Em parte. Verbos como "maximiza", "estratégia" surgem em prosa em vez de bullets. |

### Veredicto

O `AIInsightsPanel` **não deve ser o primeiro bloco do Cockpit**. Ele é
útil como aprofundamento opcional. Recomendação:

1. **Remover do hero do Cockpit.**
2. **Mover para o final**, como bloco recolhido por padrão ("Análise
   detalhada da CentralAI ▾").
3. **Encurtar a saída IA**: prompt deve produzir 3 bullets curtos
   (≤ 18 palavras cada), nunca parágrafos.
4. **Eliminar a sub-seção "Próximo passo recomendado"** dentro do
   AIInsightsPanel — ela já existe no Cockpit como hero.
5. **Eliminar a sub-seção "Resumo"** — substituível pelo card Simulador.

Resultado: o painel IA passa de 3 seções/~400px para 1 seção/~140px,
opcional, sem competir com o hero.

---

## 4. Mapa de duplicidades detectadas

| Conteúdo | Onde aparece hoje | Onde deve ficar |
|---|---|---|
| "Próximo passo recomendado" | AIInsightsPanel + AnalysisOverview hero + AnalysisCopilot toast | **Apenas** AnalysisOverview (hero) |
| Resumo de simulação (parcela/custo/ratio) | AIInsightsPanel.summary + AnalysisOverview "Resumo executivo" + Simulador "Resultados" | **Apenas** Simulador |
| Pontos de atenção (custo alto, lance embutido) | AnalysisOverview "Pontos de atenção" + AnalysisCopilot proativo | **Apenas** AnalysisCopilot (proativo, contextual) — Cockpit mostra apenas se Copilot estiver dispensado |
| Pitch comercial | AnalysisOverview "O que falar agora" + AIInsightsPanel.analysis (em prosa) + ContextualSalesScript em Abordagem | **Apenas** AnalysisOverview (1 frase, copiar) + Abordagem (variantes completas) |
| Multiplicação de cotas / patrimônio | sugestões do Cockpit + InvestmentStorytelling em Investimentos | Cockpit apenas direciona; aprofundamento em Investimentos |
| Histórico de assembleias | BidsModule "Histórico do grupo" | OK — sem duplicidade |
| Comparação consórcio × financiamento | Cockpit (alerta) + Comparador (números) | OK — alerta direciona, números no Comparador |

---

## 5. Itens a remover, mover, fundir

### Remover do Cockpit

- ❌ Sub-seção "Resumo" do `AIInsightsPanel` (redundante com Simulador).
- ❌ Sub-seção "Próximo passo recomendado" dentro do `AIInsightsPanel`.
- ❌ Bloco "Resumo executivo da simulação" (KPIs colapsados) — KPIs já
  estão no Simulador. Manter apenas link "Ver no Simulador".
- ❌ Header "Insights da CentralAI" como bloco hero.

### Mover

- ➡ "Análise consultiva" da CentralAI: descer para o final, recolhida.
- ➡ Lista textual de "Pontos de atenção": só aparecer se Copilot proativo
  não estiver visível (evita stack vertical de alertas idênticos).

### Reduzir

- 🔻 Caminhos secundários: hoje ocupam grid 2-col com ícone+título+razão.
  Reduzir para chips/links inline ("Comparador • Estudo de lances •
  Investimentos") com tooltip de razão. Economiza ~120px verticais.
- 🔻 Texto do CTA Operações Estruturadas: 1 linha em vez de 2.

### Manter (é o coração do Cockpit)

- ✅ Hero "Próximo passo recomendado" (determinístico, contextual).
- ✅ Bloco "O que falar agora" com pitch + Copiar + Abordagem + Proposta.
- ✅ CTA contextual de Operações Estruturadas (≥ R$ 500k).

---

## 6. Tom consultivo recomendado

**Evitar:** "maximiza", "estratégia poderosa", "dobra seu poder de
compra", "ganho real", "imperdível", emojis, exclamação.

**Priorizar:** verbos no infinitivo + número factual + ação imediata.

| Antes (marketing) | Depois (consultivo) |
|---|---|
| "Com uma carta de R$ 500.000 você consegue dobrar seu poder de compra usando lance da própria carta. Posso te mostrar essa estratégia?" | "Carta de R$ 500.000 permite operação de duas cotas com lance embutido. Quer ver a operação?" |
| "Mais do que comprar um bem, esse consórcio é uma estratégia financeira que constrói patrimônio sem comprometer sua liquidez." | "Consórcio preserva liquidez do cliente — capital fica investido, parcela sai do fluxo mensal." |
| "Seu lance está dentro de uma faixa com chance concreta de contemplação." | "Lance na faixa equilibrada — histórico do grupo mostra contemplação em 6/10 assembleias." |

**Regra prática:** se a frase poderia estar num anúncio do Instagram,
reescrever.

---

## 7. Estrutura ideal do Cockpit (proposta final)

```text
┌─────────────────────────────────────────────────┐
│  PRÓXIMO PASSO RECOMENDADO              [Ir →]  │  hero único
│  Refine o lance                                  │
│  Você já configurou um lance — valide com       │
│  histórico real do grupo.                        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  💬 Frase pronta para o cliente                  │
│  "Lance na faixa equilibrada — 6/10 assembleias │
│   contemplaram nessa zona."                      │
│  [Copiar]  [Abordagem →]  [Proposta →]          │
└─────────────────────────────────────────────────┘

Outros caminhos:  Comparador · Investimentos · Estudo de lances

⚠ Custo efetivo elevado — vale comparar com financiamento.   [Comparador →]

┌─────────────────────────────────────────────────┐  (apenas se ≥ 500k)
│  🏛 Operações Estruturadas disponível            │
└─────────────────────────────────────────────────┘

▾ Análise detalhada da CentralAI                              (colapsado)
```

**Densidade alvo:** primeira dobra (1024×600) cobre hero + frase pronta
+ atalhos. Tudo o mais rola.

---

## 8. Before / After conceitual

| Métrica | Antes | Depois |
|---|---|---|
| Blocos verticais na primeira dobra | 4 (AI panel, hero, frase, atalhos parciais) | 3 (hero, frase, atalhos) |
| Altura do bloco IA | ~400px, sempre aberto | ~40px header, recolhido |
| Duplicação de "Próximo passo" | 3× | 1× |
| KPIs visíveis no Cockpit | 3 (parcela/custo/perfil) | 0 (link p/ Simulador) |
| Alertas em duplicata (Copilot + lista) | sim | não |
| Tempo para ler "o que fazer agora" | ~8s | ~2s |

---

## 9. Scores

| Dimensão | Hoje | Meta | Justificativa |
|---|---|---|---|
| Clareza comercial | 6/10 | 9/10 | Hero está bom; IA panel confunde a hierarquia |
| Escaneabilidade | 5/10 | 9/10 | Excesso de texto e blocos competindo |
| Valor consultivo | 7/10 | 9/10 | Pitch + atalhos para Abordagem/Proposta já são fortes |
| Não-duplicidade vs submódulos | 4/10 | 9/10 | Hoje o Cockpit "fala" o que outros submódulos provam |
| Tom consultivo (não-marketing) | 6/10 | 9/10 | Pitches usam linguagem promocional ("dobrar", "estratégia poderosa") |

---

## 10. Plano de execução sugerido (próxima onda)

1. **Reposicionar `AIInsightsPanel`** em `AnalysisModule.tsx` para o
   final do Cockpit, dentro de `<details>` recolhido.
2. **Encurtar `AIInsightsPanel`**: remover sub-seções "Resumo" e
   "Próximo passo" (já cobertas). Manter apenas "Análise consultiva".
3. **Ajustar prompt de `analysis`** em `centralAI.ts` para forçar
   3 bullets ≤ 18 palavras, sem prosa.
4. **Remover "Resumo executivo"** (KPIs colapsados) de
   `AnalysisOverview.tsx`. Substituir por link "Ver simulação completa →".
5. **Compactar caminhos secundários** para chips inline.
6. **Reescrever os pitches** em `buildSuggestions()` removendo verbos de
   marketing e adicionando dado factual sempre que possível.
7. **Tornar "Pontos de atenção" condicional**: só renderiza se Copilot
   proativo não estiver visível na sessão.

Cada item é uma PR pequena, isolada, sem mexer em motores de cálculo nem
em RLS.

---

## 11. Recomendação brutalmente honesta

O Cockpit hoje **funciona**, mas se comporta como um mini-relatório.
Tem três fontes diferentes dizendo a mesma coisa ("Próximo passo"), um
painel de IA grande na primeira dobra que repete dados em prosa, e um
"Resumo executivo" que existe apenas porque é fácil de implementar — não
porque o gerente precisa.

A coragem necessária é:

- **Aceitar que IA narrativa não vai no topo.** Determinístico vence em
  velocidade de decisão. IA é aprofundamento opcional.
- **Aceitar que KPIs não pertencem ao Cockpit.** Já estão no Simulador.
  Repetir é insegurança de produto.
- **Aceitar que "Pontos de atenção" e Copilot proativo são o mesmo
  motor.** Escolher um canal (visual flutuante) e parar de duplicar.

Feito isso, o Cockpit vira o que precisa ser: **a tela onde o gerente
decide em 2 segundos o que faz a seguir** — e os submódulos
especializados ficam livres para fazer o que sabem (provar, simular,
detalhar).
