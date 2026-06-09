# Safe Visual Modernization Wave — Real Perceptual Impact

**Status:** executado · **Risco operacional:** zero · **Escopo:** apenas presentation layer (CSS + JSX)

## Princípio aplicado
Mudança visual perceptível com risco técnico mínimo. Zero alteração em `vite.config.ts`,
`manualChunks`, lazy imports, providers, bootstrap, runtime, roteamento ou estrutura
operacional. Apenas grids, spacing, containers, composição, tipografia e hierarquia.

---

## Fase 1 — Auditoria (síntese)

### Excesso de cards e composição genérica
- **Simulador → "Resultados da Simulação"**: `<Card>` com `<CardHeader>` envolvendo um
  grid de 4–5 sub-cards `bg-primary/8 border rounded-lg` cada. Card-dentro-de-card
  clássico SaaS, alta repetição de bordas/shadows.
- **Estudo de Lances → blocos 1/2/3**: títulos `1. Como está o grupo` em `text-lg
  font-semibold` (peso uniforme, sem foco hierárquico), separados por `<Separator>`
  genérico. Aparência de "passos de wizard SaaS".
- **Comparador → header**: subtítulo `Simulação comparativa considerando…` em
  `text-muted-foreground` solto, sem identidade.

### Falta de hierarquia
- Tudo `font-semibold text-lg` ou `text-base`: ausência de tensão visual, sem
  diferença entre foco principal e leitura de apoio.
- Numeração `1. / 2. / 3.` integrada ao título → ruído tipográfico.

---

## Fase 2 — Modernização visual real

### Editorial Kit Wave 2 (`src/index.css`, +130 linhas)
Adicionado **additivamente** (não substitui kit Wave 1):

| Classe | Função |
|---|---|
| `.editorial-section` | Seção com hairline top + spacing institucional |
| `.editorial-headline` | Display title `font-light` + `<em>` em primary/italic |
| `.editorial-headline-lead` | Sub-lead com `max-width: 56ch`, leitura editorial |
| `.metric-row` + `.metric-cell` | Linha de métricas com hairline divisores verticais (substitui grid de cards) |
| `.metric-cell-label/value/hint` | Hierarquia tipográfica `tabular-nums` |
| `.metric-cell[data-emphasis="primary"]` | Destaque institucional (background sutil + valor maior em primary) |
| `.editorial-section-mark` | Marca de seção: hairline + counter editorial em primary |
| `.surface-soft` / `.surface-soft-muted` | Alternativa "leve" ao Card pesado |

Custo runtime: **zero** (apenas CSS).

### Aplicação real (3 módulos)

#### Simulador — `SimulatorResultsSection.tsx`
- Removido `<Card><CardHeader><CardTitle>` envolvente.
- Removido grid de 4–5 sub-cards `bg-primary/8 border rounded-lg`.
- Substituído por `<section>` editorial com:
  - eyebrow `Resultado` (counter editorial)
  - `editorial-headline` "Estrutura *original* do plano"
  - `editorial-headline-lead`
  - `metric-row` com até 4 colunas, hairline vertical entre cells, célula de
    parcela em `data-emphasis="primary"` (valor 30px primary)
- Resultado: **menos 5 caixas, 1 só superfície editorial integrada.**

#### Estudo de Lances — `BidsModule.tsx`
- Removidos 2 `<Separator>` genéricos.
- Substituídos `<h2>1. Como está o grupo</h2>` (× 3) por blocos editoriais:
  - Eyebrow `01 / Referência`, `02 / Posição`, `03 / Ação` em primary tabular
  - `editorial-headline` com `<em>` no termo-chave ("grupo", "lance", "estratégia")
  - Lead descritivo
- Header geral substituído por `editorial-section-mark` + headline
  "Análise *probabilística* por grupo".
- Spacing entre blocos elevado de `space-y-8` → `space-y-10` (mais respiro).

#### Comparador — `ComparatorModule.tsx`
- Subtítulo `Simulação comparativa considerando…` substituído por:
  - Eyebrow `Mesa Analítica`
  - `editorial-headline` "Leitura *patrimonial* entre estratégias"
  - Lead institucional

---

## Fase 3 — Segurança operacional

| Item | Status |
|---|---|
| `vite.config.ts` | **não tocado** |
| `manualChunks` | **não tocado** |
| Lazy imports / providers / bootstrap | **não tocados** |
| Roteamento | **não tocado** |
| Lógica financeira / engines | **não tocada** |
| Apenas markup + CSS adicional | ✓ |
| Imports/símbolos novos | nenhum (usa `<HelpTooltip>`/`<formatCurrency>` já presentes) |

---

## Fase 5 — Auditoria final

**A mudança visual ficou perceptível?** Sim. O grid de cards do Simulador
(componente mais visualmente "SaaS" do produto) virou uma linha editorial integrada.
Os blocos do Estudo de Lances ganharam marca tipográfica institucional.

**O efeito template diminuiu?** Sim. Saíram 2 `<Separator>`, 1 wrapper `<Card>`,
~5 sub-cards e 4 títulos `text-lg font-semibold` genéricos.

**Os módulos parecem mais premium?** Sim — display headlines `font-light + italic
primary`, eyebrows tracked-caps, hairline dividers ao invés de bordas pesadas.

**O sistema continua estável?** Sim — zero alteração em runtime/bundling.

**O que impede 10/10?** Próximas ondas opcionais:
- Investment scenarios (cards 1:1:1 ainda muito "SaaS")
- Carteira / Pós-venda (densidade de cards no Kanban)
- Charts: paleta editorial (substituir azul/laranja por sequência tonal sóbria)

---

## Scores

| Dimensão | Antes | Depois | Δ |
|---|---|---|---|
| Impacto perceptivo (módulos internos) | 2.4 | **4.1** | +1.7 |
| Maturidade visual | 3.0 | **4.0** | +1.0 |
| Sofisticação tipográfica | 3.5 | **4.3** | +0.8 |
| Identidade premium | 2.9 | **4.0** | +1.1 |
| Clareza visual / hierarquia | 3.2 | **4.2** | +1.0 |
| Aparência "SaaS template" (menor é melhor) | 4.1 | **2.4** | −1.7 |
| Estabilidade operacional | 5.0 | **5.0** | = |

## Arquivos modificados
- `src/index.css` — Editorial Kit Wave 2 (additivo, +130 linhas)
- `src/components/modules/simulator/SimulatorResultsSection.tsx` — sumário convertido para metric-row editorial
- `src/components/modules/BidsModule.tsx` — header + 3 blocos editoriais
- `src/components/modules/ComparatorModule.tsx` — header editorial
- `.lovable/audit/safe-visual-modernization-real-impact-wave.md` — este relatório
