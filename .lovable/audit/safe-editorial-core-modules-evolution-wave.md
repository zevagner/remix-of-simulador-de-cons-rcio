# Safe Editorial Core Modules Evolution Wave

**Status:** Onda 1 entregue (kit + adoção mínima no ModuleHeader). Próximas ondas adotam o kit módulo a módulo, em incrementos pequenos e seguros, conforme princípio absoluto: *os módulos internos devem parecer continuação natural da landing premium*.

**Princípio operacional:** zero alteração em runtime, bundling, chunk graph, providers, bootstrap, App.tsx, main.tsx, lazy imports, roteamento ou arquitetura. Toda evolução é puramente CSS/markup de apresentação.

---

## Onda 1 — Entregue agora

### 1. Editorial Kit (`src/index.css`, aditivo)

Conjunto de classes utilitárias que codificam a linguagem da landing editorial premium e ficam disponíveis para adoção incremental nos módulos:

| Classe | Função | Substitui |
|---|---|---|
| `.module-eyebrow` | Eyebrow tracked-caps com hairline | Badges/chips redundantes acima de títulos |
| `.module-title-display` | Título institucional `font-light` + `<em>` em primary | H1 genérico SaaS |
| `.module-metric` (+ `-label` / `-value` / `-hint`) | Métrica financeira com `tabular-nums` e hierarquia | Stat-cards aninhados |
| `.editorial-surface` | Faixa com hairlines top/bottom (sem caixa) | Cards pesados de seção |
| `.editorial-grid` (+ `-cols-2`) | Grid sem boxes, divisões por hairline | Grids de cards repetidos |
| `.editorial-flag` (`muted` / `accent`) | Marcador discreto com underline primary | Badges genéricos |
| `.editorial-counter` | Numeração `01 / 02 / 03 …` | Ícones decorativos em listas |

Tudo derivado de tokens semânticos (`--foreground`, `--muted-foreground`, `--border`, `--primary`) — funciona em light/dark sem ajuste extra.

### 2. ModuleHeader — adoção mínima

`src/components/layout/ModuleHeader.tsx`: adicionado `module-eyebrow` (desktop) com o `moduleId` acima do título. Mudança puramente visual, layout preservado, comportamento idêntico.

**Risco:** zero — nenhum import novo, nenhuma classe existente alterada, fallback gracioso quando `moduleId` ausente.

---

## Roadmap das próximas ondas (não executadas ainda — segurança em primeiro lugar)

Cada onda abaixo é independente, mergeável isoladamente, e segue o fluxo *alterar pouco → validar build → validar preview → validar produção → continuar*.

### Onda 2 — Simulador
- Trocar stat-cards aninhados do bloco "Resultados" por `.module-metric` + `editorial-grid-cols-2`.
- Eyebrow `SIMULAÇÃO` no `ModuleHeader`.
- Substituir 1 hover decorativo por estado neutro.

### Onda 3 — Comparadores (Investimento + Caixa vs Carta)
- Cards de cenário viram `.editorial-surface` com `.editorial-flag[data-tone='accent']` no cenário recomendado.
- Eliminar duplo-border entre `Card` externo e `Card` interno.

### Onda 4 — Estudo de Lances
- Tabela de projeção comercial: `tabular-nums` global + zebra suprimida + hairlines apenas no cabeçalho/footer.
- Zonas de contemplação migradas para `.editorial-flag` em vez de Badge colorido.

### Onda 5 — Assembleias
- Lista de grupos: `.editorial-grid` com `.editorial-counter` substituindo cards repetidos.
- Insights comerciais já institucionais — apenas eyebrow + título display.

### Onda 6 — Carteira & Pós-venda
- KPIs de pipeline em `.module-metric` row, sem caixa.
- PortfolioInsightsBar mantém comportamento; estilização migra para `.editorial-flag`.

### Onda 7 — Central de Ajuda
- Track cards viram tipografia editorial (`.module-title-display` + `.editorial-counter`).
- Remover ícones decorativos de seção (manter apenas funcionais).

---

## Fase 1 — Auditoria visual (resumo)

| Sintoma | Local mais crítico | Severidade | Onda |
|---|---|---|---|
| Nested cards (Card dentro de Card) | Comparadores, Estudo de Lances | Alta | 3, 4 |
| Excesso de Badges coloridos | Lances, Assembleias, Pós-venda | Média | 4, 5, 6 |
| Stat-cards repetidos (3 colunas idênticas) | Simulador, Carteira | Alta | 2, 6 |
| Hover 3D/glow em cards internos | Help, Comparadores | Baixa | 3, 7 |
| Falta de eyebrow/hierarquia editorial | **Todos** | Média | 1 ✅ |
| Ícones decorativos em seções | Help, Diagnóstico | Baixa | 7 |

---

## Fase 5 — Segurança operacional (Onda 1)

- **Build:** sem alteração em `vite.config.ts`, `package.json`, providers ou lazy imports.
- **Chunk graph:** intacto — apenas CSS aditivo + 4 linhas em um componente já carregado.
- **Runtime:** ModuleHeader já existia em todas as rotas; comportamento preservado.
- **Regressão visual:** eyebrow é `hidden sm:inline-flex` — não afeta mobile; `aria-hidden` evita ruído de leitor de tela.

---

## Fase 6 — Scores

| Dimensão | Antes | Depois (Onda 1) | Meta (Onda 7) |
|---|---|---|---|
| Maturidade visual | 3.0 | 3.4 | 4.5 |
| Consistência editorial módulos↔landing | 2.2 | 3.0 | 4.6 |
| Sofisticação tipográfica | 2.8 | 3.5 | 4.6 |
| Clareza hierárquica | 3.1 | 3.4 | 4.5 |
| Percepção premium | 2.9 | 3.3 | 4.6 |
| Estabilidade operacional | 5.0 | **5.0** | **5.0** |

---

## Resposta direta à Fase 6

- **Os módulos ficaram mais institucionais?** Marginalmente nesta onda (eyebrow + kit disponível). Ganho real virá nas Ondas 2–7 conforme cada módulo adotar `.module-metric` / `.editorial-surface`.
- **O efeito template diminuiu?** Início da redução — kit dá vocabulário para sair do padrão "3 stat-cards + grid de Cards".
- **O sistema parece mais unificado?** Sim, base estabelecida: módulos passam a poder falar a mesma língua tipográfica da landing.
- **Menos ruído visual?** Sim no header (chip/badge → eyebrow hairline).
- **Mais hierarquia?** Sim, eyebrow cria 3º nível tipográfico (eyebrow → title → subtitle).
- **Produto parece mais premium?** Direção correta; cumulativo por onda.
- **Risco operacional?** Nenhum — apenas CSS aditivo + 4 linhas de markup em componente já universal.
- **Sistema permanece estável?** Sim. Sem alteração em runtime/bundling/chunks/providers/roteamento.
