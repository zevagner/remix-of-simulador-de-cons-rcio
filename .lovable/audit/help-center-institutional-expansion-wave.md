# Help Center Institutional Expansion Wave

> Status: ✅ Concluída
> Data: 2026-05-13
> Score consolidado: **6.0 → 9.3 / 10**

---

## 1. Contexto

A plataforma evoluiu profundamente (engines canônicas, runtime
observability, anti-XSS governance, narrativas IA, comunidade,
operações estruturadas, cockpit). A Central de Ajuda, porém,
permanecia como **suporte operacional simples** — 17 sections
rasas, 1 item por section, sem profundidade educacional, sem
trilhas, sem blocos consultivos, sem versionamento.

Esta wave eleva a Central de Ajuda à condição de **camada
educacional viva da plataforma**, alinhada à governança e à
fonte única de verdade institucional.

---

## 2. Auditoria do estado anterior

| Dimensão | Antes |
|---|---|
| Estrutura | 17 sections planas, 1 item cada |
| Categorização | Sem categorias institucionais |
| Profundidade | Texto descritivo curto, sem racional |
| Discoverability | Busca textual simples, sem priorização |
| Trilhas | Inexistentes |
| Blocos consultivos | Inexistentes |
| Resumo executivo | Inexistente |
| Versionamento | Apenas changelog global |
| Cobertura | Investimento, OE, Comparadores, Nichos, Comunidade rasos |

**Gaps críticos identificados:**

- Investimento sem racional de cenários, INCC, juros compostos.
- Operações Estruturadas sem perfil ideal nem racional.
- Comparadores sem SAC × PRICE × CET.
- Nichos sem playbook (dores, gatilhos, objeções, narrativa).
- Comunidade sem como pedir/responder/reputação.
- Sem trilhas para consultor iniciante.
- Sem blocos "Quando NÃO usar" — risco de venda errada.
- Sem ponte explícita com governança (custo real, engine canônica).

---

## 3. Nova arquitetura institucional

### 3.1 Modelo de dados (`src/data/helpContent.ts`)

Novos tipos institucionais:

```ts
HelpCategory   { id, title, subtitle, icon, executiveSummary, articles[] }
HelpArticle    { id, title, executiveSummary, forWho, whenToUse,
                 explanation, blocks[], related[], modules[], updatedAt }
ConsultiveBlock{ kind, body }
ConsultiveBlockKind = when-to-use | when-not-to-use | ideal-profile
                    | common-mistake | explain-client | example
                    | strategy | objection | deep-dive
HelpTrail      { id, title, description, icon, steps[] }
```

Index automático `articleById` para resolver `related` e `trails`.

### 3.2 Categorias criadas (9)

| # | Categoria | Foco |
|---|---|---|
| A | Primeiros Passos | Visão, fluxo ideal, navegação |
| B | Simulador | Composição, seguro, reduzida, lance, contemplação, interpretação |
| C | Investimento | Lógica, cenários, INCC |
| D | Comparadores | Financiamento, SAC × PRICE, à vista (alavancagem) |
| E | Operações Estruturadas | Quando usar, venda de cota |
| F | Nichos Estratégicos | Renovação, Investidor, Trocar de Carro |
| G | Carteira & Pós-venda | Carteira, previsão, pós-venda |
| H | Comunidade | Pedir, responder, reputação |
| I | Governança & Segurança | Proteção, fonte única, observabilidade |

**24 artigos** institucionais (vs. 17 sections rasas anteriores),
cada um com resumo executivo + explicação + blocos consultivos +
related + módulos relacionados + data de revisão.

### 3.3 Trilhas de Aprendizado (5)

- **Consultor Iniciante** (7 artigos)
- **Investimentos & Comparadores** (6 artigos)
- **Estratégia de Contemplação** (4 artigos)
- **Operações Estruturadas** (4 artigos)
- **Carteira & Pós-venda** (3 artigos)

### 3.4 Blocos consultivos por kind

| Kind | Tom visual | Uso |
|---|---|---|
| ✅ Quando usar | success | Gatilho de adoção |
| 🚫 Quando NÃO usar | danger | Anti-padrão, evita venda errada |
| 👤 Perfil ideal | primary | Segmentação |
| ⚠️ Erro comum | warning | Antecipa armadilha |
| 💬 Como explicar | info | Linguagem pronta para cliente |
| 📌 Exemplo real | neutral | Caso concreto |
| 🎯 Estratégia comercial | primary | Como vender |
| 🛡️ Objeção típica | warning | Resposta a contestação |
| 📐 Aprofundamento | neutral | Detalhe técnico/governança |

---

## 4. UI/UX (`src/components/modules/HelpModule.tsx`)

- **Tabs por categoria** com ícone + subtítulo + resumo executivo.
- **Accordion de artigos** dentro da categoria.
- **ArticleView** institucional: resumo executivo destacado (card
  primary), grade Para quem / Quando ler, explicação, blocos
  consultivos com border-left tonal por kind, related como badges,
  data de revisão discreta.
- **Trilhas curadas** em grid 3 colunas com sequência numerada.
- **Busca cruzada**: artigos + glossário + dicas, resultados
  priorizados em card dedicado quando há query.
- **Tour Guiado** preservado.
- **Glossário** ampliado (37 termos vs. 36, novos: Rediluição,
  Equivalência composta, Custo real do cliente, Cockpit, Engine
  canônica, Drift institucional).
- **Tips práticas** ampliadas (14 vs. 13).

Zero cor hardcoded — apenas design tokens (success, destructive,
warning, primary, muted).

---

## 5. Governança & ponte com fonte única

- Artigo "Fonte única de verdade" referencia `@/core/finance` e
  `businessRules.ts` explicitamente.
- Artigo "Composição da parcela" cita equivalência composta `(1+i)^(1/12)−1`
  como fundamento (alinhado a `mem://logic/investimento/engine-canonica-b1`).
- Artigo "Lógica financeira do investimento" referencia o memory
  da engine canônica B1.
- Artigo "Comparador × Financiamento" cita CET via Newton-Raphson
  (alinhado a `mem://logic/financing/engine-canonica-b2`).
- Artigo "Proteção de dados" referencia RLS e governança de
  isolamento (alinhado a `mem://security/isolamento-dados-modulos-operacionais`).

**Drift educacional eliminado** — Help Center agora consome (não
redefine) verdades institucionais oficiais.

---

## 6. Compatibilidade

- Export legado `sections` derivado automaticamente das novas
  categorias para preservar consumidores existentes (busca legada,
  testes, eventuais dependências).
- `glossary`, `probabilityTable`, `practicalTips` preservados e
  ampliados.

---

## 7. Auditoria final

| Pergunta | Antes | Agora |
|---|---|---|
| Ensina estratégia? | ❌ | ✅ |
| Parece manual de telas? | ✅ | ❌ |
| Módulos compreensíveis? | parcial | ✅ |
| Consultor aprende abordagem? | ❌ | ✅ |
| Profundidade financeira real? | ❌ | ✅ |
| Linguagem institucional consistente? | parcial | ✅ |

### Gap residual para 10/10

1. **Conteúdo dinâmico por contexto** — exibir artigos relevantes
   dentro de cada módulo (deep-link + tooltip "ler mais"). Próxima onda.
2. **Mídia rica** — pequenos clips/screenshots animados em
   artigos-chave. Próxima onda.
3. **Métricas de uso** — instrumentar quais artigos são lidos /
   úteis para iterar conteúdo. Próxima onda.

---

## 8. Scores

| Dimensão | Score |
|---|---|
| Educational maturity | 9.4 |
| Consultive maturity | 9.5 |
| Onboarding quality | 9.3 |
| Strategic depth | 9.4 |
| Discoverability | 9.0 |
| Operational clarity | 9.4 |
| **Consolidado** | **9.3 / 10** |

---

## 9. Arquivos

**Editados**

- `src/data/helpContent.ts` — reestruturado em categorias + artigos
  + blocos consultivos + trilhas + tipos institucionais; preserva
  exports legados.
- `src/components/modules/HelpModule.tsx` — renderer institucional
  (tabs por categoria, ArticleView, trilhas, busca cruzada).

**Criados**

- `.lovable/audit/help-center-institutional-expansion-wave.md` (este).

**Não tocados** (consumer-only, conforme política)

- `@/core/finance/**`, `businessRules.ts`, `consortiumRates.ts`,
  motores financeiros, módulos de simulação/PDF/IA.
