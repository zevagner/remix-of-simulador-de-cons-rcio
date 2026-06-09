# Auditoria de Consolidação Estratégica — Investimentos vs Engenharia Patrimonial

**Data:** 2026-05-15
**Escopo:** módulos `Análise → Investimentos` e `Análise → Patrimonial` (Engenharia Patrimonial)
**Princípio absoluto:** consolidar SEM empobrecer. Nada de remover valor consultivo — apenas eliminar repetição, evolução duplicada e canibalização entre módulos.
**Restrições respeitadas:** zero alteração em motores financeiros (`@/core/finance`), providers, runtime, Supabase, RLS.

---

## 1. Inventário completo de estratégias

### 1.A — Módulo **Investimentos** (`src/components/modules/InvestmentModule.tsx`)

| # | Bloco / Estratégia | Origem | Tese central |
|---|---|---|---|
| I-1 | **Cenário 1** — Caminho 1: 100% próprio (sem consórcio) | `useInvestmentScenarios` | baseline: poupar tudo até comprar à vista |
| I-2 | **Cenário 2** — Caminho 2: parcelas + lance livre | idem | usar próprio caixa para lance e quitar parcelas |
| I-3 | **Cenário 3** — Caminho 3: investir o "delta" (consórcio + diferencial rendendo CDI) | idem | preservação de capital — versão mais consultiva |
| I-4 | **Cenário 4** — Caminho 4: lance embutido | idem | redução de exposição de caixa |
| I-5 | **Cenário 5** — Caminho 5: consórcio + investimento contínuo | idem | reinvestir economia da parcela reduzida |
| I-6 | **Cenário 6** — Caminho 6: venda da cota contemplada | idem | liquidez e arbitragem secundária |
| I-7 | **Multiplicação de Cota** (`CotaMultiplicationCard`) | aba Cenários | usar 1 carta para alavancar 2x crédito |
| I-8 | **Estratégia Avançada → InvestmentStrategyTab** | aba dedicada | comparativo lado a lado dos 6 caminhos com KPIs e geração de proposta |
| I-9 | **Nichos Estratégicos** (`StrategicNicheCards` × 8): Reforma, Sucessão Patrimonial, Energia Solar, Expansão Produtiva, Upgrade Veículo, Renovação Frota, Agronegócio, Equipamentos Pesados | aba Cenários | aplicação setorial (PF/PJ) |
| I-10 | **Compra à Vista** (`CashComparisonTab`) | aba dedicada | comparativo cash-buy vs consórcio (migrado do Comparador) |
| I-11 | **Storytelling IA** (`InvestmentStorytelling`) por cenário | inline | narrativa WhatsApp dos 6 cenários |
| I-12 | **NicheStorytelling** (IA) | inline | narrativa por nicho |

### 1.B — Módulo **Engenharia Patrimonial** (`src/components/modules/PatrimonialModule.tsx`)

| # | Estratégia | Tese central |
|---|---|---|
| P-1 | **Autoquitação** | renda passiva quitando próprio consórcio |
| P-2 | **Escada Patrimonial** | múltiplas cotas escalonadas no tempo |
| P-3 | **Renda Passiva Estruturada** | imóveis para locação via consórcio |
| P-4 | **Construção Inteligente** | terreno + construção em fases |
| P-5 | **Multiplicação de Ativos** | reinvestimento de aluguéis em novas cotas |
| P-6 | **Holding & Sucessão** | estruturação societária + ITCMD |
| P-K | **KPIs executivos** (`PatrimonialKpiBar`): TIR, ROI, Payback, Multiplicador, Capital Preservado |
| P-J | **Jornada Aquisição → Estratégia → Patrimônio → Renda → Legado** (`PatrimonialJourneyStepper`) |

---

## 2. Matriz de sobreposição

| Item Investimentos | Item Patrimonial | Tipo de sobreposição | Severidade |
|---|---|---|---|
| **I-7** Multiplicação de Cota | **P-5** Multiplicação de Ativos | mesmo verbo, teses adjacentes; P-5 é versão *evoluída* (longo prazo, reinvestimento de aluguéis) — I-7 é tática (1 carta → 2 créditos) | 🟡 média — separáveis por tese |
| **I-9 "Sucessão Patrimonial"** (nicho) | **P-6** Holding & Sucessão | nicho é entrada superficial; P-6 é versão estratégica completa | 🔴 alta — canibaliza |
| **I-9 "Reforma e Ampliação"** + **"Expansão Produtiva"** | **P-4** Construção Inteligente | Reforma ≈ subconjunto de Construção; Expansão é PJ específica — não conflita | 🟡 média (Reforma) |
| **I-3 "Caminho 3" (investir delta)** | (nenhum direto em P) | preservação de capital — racional base, **não duplica** P | 🟢 ok |
| **I-8 InvestmentStrategyTab** (comparativo dos 6 caminhos) | **P-K** KPI Bar + **PatrimonialStrategyCard** | I-8 é matriz comparativa de cenários; P-K são KPIs do cliente. Naturezas diferentes, mas IA repetitiva entre I-11 e Storytelling Patrimonial pode duplicar narrativa | 🟡 média — narrativa |
| **I-11 Storytelling IA** por cenário | (futuro: storytelling em P) | risco de IA repetir o mesmo arco "consórcio inteligente" em ambos módulos | 🟡 média — preventivo |
| **I-9 nichos PF "Upgrade Veículo"/"Frota"** | (nenhum em P) | uso tático, pertence a Investimentos | 🟢 ok |
| **I-1, I-2, I-4** (caminhos 1/2/4) | (nada em P) | racional financeiro base | 🟢 ok |

### Conflitos de posicionamento detectados

1. **Sucessão aparece em dois lugares** com profundidades diferentes — o usuário fica em dúvida sobre qual é "a versão real".
2. **Multiplicação** existe nos dois módulos com mesmo verbo, gerando dúvida de hierarquia.
3. **Estratégia Avançada (aba)** e **Patrimonial (submódulo)** competem pelo título de "área avançada do consultor", agora que P existe oficialmente. Hoje os dois coexistem na navegação — não foi feita a remoção planejada anteriormente (a aba `estrategia` segue ativa em `InvestmentModule.tsx:457`).

### Redundância narrativa / IA

- `InvestmentStorytelling` + `NicheStorytelling` + (futura) IA Patrimonial → 3 fontes de narrativa que podem repetir os mesmos gatilhos ("consórcio como ferramenta inteligente", "preservação de capital").
- Disclaimers se repetem em I-7, I-8, P-1..P-6.
- KPIs aparecem em I-8 (mini-cards comparativos) e em P-K (KPI bar executiva) — não conflitam, mas devem usar a mesma fonte canônica (`useInvestmentResults` / `usePatrimonialKpis`), o que já está garantido.

### Redundância visual

- `InvestmentScenarioCard` × `PatrimonialStrategyCard` → padrão visual quase idêntico (header gradient + KPI chips + CTA + disclaimer). Aceitável (família visual coesa), **desde que** as densidades não se sobreponham na mesma tela.
- Tabelas de "Resumo Comparativo" só existem em I — sem duplicação.

---

## 3. Papel definitivo de cada módulo

### Investimentos (entrada consultiva — "como usar o consórcio com inteligência financeira")
- Foco: **caminhos financeiros táticos** + **comparativo de cenários** + **nichos PF/PJ aplicáveis**.
- Público: cliente em diagnóstico inicial, decidindo *como* operar o consórcio.
- Entregas: 6 caminhos, comparativo lado-a-lado, compra à vista, nichos setoriais, multiplicação de cota tática.

### Engenharia Patrimonial (camada estratégica — "como construir patrimônio com consórcio")
- Foco: **estruturação patrimonial de longo prazo** + **alavancagem composta** + **legado**.
- Público: cliente já decidido, com perfil de construção patrimonial / PJ / família.
- Entregas: 6 estratégias estruturais, KPIs executivos (TIR/ROI/Payback/Multiplicador/Preservado), jornada Aquisição→Legado.

### Linha divisória clara
> **Investimentos responde "qual caminho seguir nesta operação".
> Patrimonial responde "que arquitetura patrimonial construir ao longo de 5–20 anos".**

---

## 4. Mapa de consolidação

### A. **MANTER COMO ESTÁ**
- I-1, I-2, I-3, I-4, I-5, I-6 (6 caminhos) — base financeira insubstituível.
- I-10 Compra à Vista — comparativo único, sem par em P.
- I-9 nichos táticos PF/PJ que **não** colidem com P: Energia Solar, Upgrade Veículo, Renovação Frota, Agronegócio, Equipamentos Pesados, Expansão Produtiva.
- P-1 a P-6 — todas as 6 estratégias patrimoniais.
- P-K (KPI bar) e P-J (jornada).

### B. **EVOLUIR**
- **I-8 "Estratégia Avançada"** → renomear a aba para **"Comparativo de Cenários"** (mais honesto: é o que ela é). Remove conflito semântico com o submódulo Patrimonial, que é hoje a verdadeira "área avançada".
- **I-7 Multiplicação de Cota** → manter, mas adicionar microcopy de bridge: *"Quer transformar isso em estratégia de longo prazo? Veja **Multiplicação de Ativos** em Engenharia Patrimonial."* (link cross-módulo, sem duplicar lógica).
- **I-11 InvestmentStorytelling** → manter, mas adicionar guard-rail de prompt para **não invadir tese patrimonial** (foco em "este caminho", não em "construção patrimonial 10 anos").

### C. **CONSOLIDAR**
- (nada precisa fundir-se internamente — as duplicações são entre módulos, não dentro do mesmo módulo).

### D. **ABSORVER EM ENGENHARIA PATRIMONIAL**
- **I-9 nicho "Sucessão Patrimonial"** → **remover do grid de nichos** e substituir por card-bridge: *"Sucessão é tratada como estratégia estrutural em Engenharia Patrimonial → Holding & Sucessão"* com CTA que navega direto. Elimina canibalização (severidade 🔴).
- **I-9 nicho "Reforma e Ampliação"** → **manter em Investimentos** (é tático/curto prazo), mas adicionar bridge sutil para P-4 Construção Inteligente quando o crédito > limiar (ex.: > R$ 300k) ou quando o diagnóstico indicar terreno próprio.

### E. **REMOVER**
- **Aba "Estratégia Avançada" como nome** — a aba deve permanecer (conteúdo do `InvestmentStrategyTab` ainda agrega valor: comparativo dos 6 caminhos), mas **renomeada** para "Comparativo de Cenários". O título atual virou redundante após o nascimento de Patrimonial.
- Disclaimers duplicados → consolidar em um componente único (`<PatrimonialDisclaimer />` reutilizado por ambos módulos).

---

## 5. Arquitetura consultiva final

```text
Análise
├── Investimentos          [tático — "como operar"]
│   ├── Cenários            (6 caminhos + Multiplicação de Cota + Nichos sem Sucessão)
│   ├── Comparativo de Cenários   (ex- "Estratégia Avançada")
│   └── Compra à Vista
│
├── Patrimonial             [estratégico — "que patrimônio construir"]
│   ├── KPI Bar executivo   (TIR · ROI · Payback · Multiplicador · Preservado)
│   ├── 6 Estratégias       (Autoquitação, Escada, Renda Passiva, Construção,
│   │                        Multiplicação de Ativos, Holding & Sucessão)
│   └── Jornada Aquisição → Legado
│
├── Comparador
├── Lances
└── Assembleias
```

### Bridges cross-módulo (1ª onda)
1. Investimentos → Patrimonial: card "Sucessão" (substitui nicho).
2. Investimentos → Patrimonial: hint contextual em "Multiplicação de Cota" e "Reforma".
3. Patrimonial → Investimentos: footer de cada `PatrimonialStrategyCard` com link "Ver caminho operacional sugerido" quando aplicável (P-1 ↔ I-5, P-2 ↔ I-6, P-3 ↔ I-3).

### IA consolidada (preventivo)
- Reusar `centralAI.generateInsight` com `intent` específico por módulo (`investment_path` vs `patrimonial_strategy`) para evitar narrativa repetida.
- Cache `aiResponseCache` já é tenant-aware → respeitar `scope` distinto.
- Nunca expor 2 storytellings simultâneos sobre a mesma tese.

---

## 6. Validação

### Coerência ✅
- Cada módulo passa a ter **um papel único e nominalmente claro**.
- Sucessão deixa de existir em dois lugares.
- "Estratégia Avançada" deixa de competir com "Patrimonial".

### Nível executivo ✅
- KPI bar premium fica exclusivo de Patrimonial → sinalização clara de "área sênior".
- Investimentos mantém densidade tática sem inflar.

### Carga cognitiva 📉
- Nichos: 8 → **7** (remoção de Sucessão).
- Nomes de abas em Investimentos: 3 (Cenários, Comparativo, Compra à Vista) — sem ambiguidade.
- Storytellings deixam de competir.

### Redução real
- –1 card de nicho.
- –1 conflito semântico de aba.
- –1 duplicação de tese (Sucessão).
- –N disclaimers (consolidação visual futura).

---

## 7. Plano de execução (para próxima onda — não aplicado nesta auditoria)

| Ordem | Ação | Custo | Risco |
|---|---|---|---|
| 1 | Renomear aba `estrategia` → label "Comparativo de Cenários" em `InvestmentModule.tsx:457` | trivial | 🟢 nulo |
| 2 | Remover nicho `sucessao_patrimonial` de `StrategicNicheCards.tsx` e adicionar `<PatrimonialBridgeCard target="holding"/>` no lugar | baixo | 🟢 baixo |
| 3 | Adicionar microcopy bridge em `CotaMultiplicationCard` apontando para P-5 | trivial | 🟢 nulo |
| 4 | Bridge contextual em "Reforma e Ampliação" → P-4 quando crédito alto | baixo | 🟢 nulo |
| 5 | Componente `<PatrimonialDisclaimer />` único, consumido por I e P | baixo | 🟢 nulo |
| 6 | Footer "Ver caminho operacional" em `PatrimonialStrategyCard` (mapa P↔I) | médio | 🟡 verificar UX |
| 7 | Guard-rail de prompt em `InvestmentStorytelling` (não invadir tese patrimonial) | baixo | 🟢 nulo |

**Sem alterações em:** `@/core/finance`, edges, Supabase, RLS, `useInvestmentResults`, `usePatrimonialKpis`. Tudo na camada de apresentação e navegação.

---

## 8. Impacto consultivo esperado

- Plataforma deixa de parecer "dois módulos parecidos" e passa a parecer **uma trilha consultiva em dois níveis** (tático → estratégico).
- Redução de dúvida do consultor: "qual eu uso na frente do cliente?" → resposta inequívoca.
- Sensação de produto curado, premium, com hierarquia clara entre operação e arquitetura patrimonial.
- Zero perda de valor consultivo: nenhuma estratégia útil foi removida — apenas a Sucessão duplicada migra para sua casa real (Patrimonial).

---

**Status:** auditoria entregue. Aguardando aprovação para executar o plano de 7 passos da seção 7 (sugestão: agrupar 1+2+3 numa única onda curta de baixo risco).
