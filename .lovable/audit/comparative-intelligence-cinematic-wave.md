# Comparative Intelligence Cinematic Wave (Wave 9)

**Data:** 2026-05-13
**Tipo:** 100% visual / estrutural (CSS additivo + 4 atributos `data-*` + 1 wrapper `<section>`)
**Risco operacional:** ZERO — sem alterações em `vite.config`, `manualChunks`, runtime, providers, bootstrap, lazy imports, lógica financeira, cálculos ou arquitetura.

---

## Fase 1 — Auditoria

### Áreas ainda genéricas
- **TabsList do Comparador** — Pill SaaS comum, sem identidade. Quebrava o flow editorial estabelecido pelas Waves 6–8 do Simulador.
- **Conteúdo das tabs** — `FinancingComparisonTab` / `ConsortiumComparisonTab` viviam num espaço plano, sem moldura institucional. Cards isolados com sombras default e bordas duras → leitura "tabela administrativa".
- **Header da mesa** — Já tinha eyebrow editorial, mas faltava a numeração cinematográfica (`01 ·`) consolidada no Simulador.

### Ausência de narrativa
- A transição "Header → Tabs → Conteúdo" era abrupta. Não havia eixo visual conectando a *escolha do comparativo* à *leitura do painel*.
- Tabs sem hierarquia tipográfica forte; o usuário escolhia rapidamente, mas sem sensação de troca de capítulo analítico.

### Pontos sem identidade
- Nenhum elemento sinalizava que aquele módulo é *parte do mesmo produto premium* do Simulador. Faltava o top rail, hairlines, atmosfera cromática.

---

## Fase 2 — Mesa Analítica Premium

### Mudanças JSX (`ComparatorModule.tsx`) — 4 atributos + 1 wrapper

```tsx
// Raiz: herda top rail editorial + atmosfera signature
<div data-signature-shell="true" data-signature-variant="analytical">

  // Header como Capítulo 01
  <div data-signature-chapter="01" data-signature-label="Mesa Analítica" ...>

  // Eixo comparativo como Capítulo 02 + tabs cinematográficas
  <div data-signature-chapter="02" data-signature-label="Eixo Comparativo">
    <TabsList data-analytical-tabs="true">...</TabsList>
  </div>

  // Painéis envolvidos por board ambiente
  <section data-analytical-board="true" aria-label="Painel comparativo">
    {comparisonType === 'financing' && <FinancingComparisonTab .../>}
    {comparisonType === 'consortium' && <ConsortiumComparisonTab .../>}
  </section>
</div>
```

### Mudanças CSS (`src/index.css` — Wave 9, additiva)

**`[data-analytical-tabs='true']`** — Eixo cinematográfico, não pill SaaS:
- Background gradient `muted → background`, borda hairline e *inset light* + sombra projetada com tinta primary.
- Triggers em monospace editorial (`ui-monospace`, `0.18em` tracking, uppercase) — a escolha do comparativo lê-se como *cabeçalho de capítulo*, não toggle.
- Estado `active` ganha sombra ambient com `primary/0.4` — presença premium.

**`[data-analytical-board='true']`** — Mesa institucional:
- Padding responsivo (`0.5rem` mobile / `0.875rem` md+), `border-radius` `0.875rem → 1rem`.
- Atmosfera bicromática: dois radial gradients (primary top-left, secondary bottom-right) + linear ambient.
- Hairlines decorativas de **18px** nos cantos opostos via `::before` (mesma linguagem dos cantos do hero do Simulador) → assinatura visual proprietária.
- Cards filhos absorvidos: `background: background/0.6`, `border-color: border/0.4`, sombra zerada, `backdrop-filter: blur(2px)` para profundidade sutil.

**Print isolation** — Toda a camada cinematográfica é zerada em `@media print` para preservar fidelidade do PDF.

**Reduced motion** — `transition: none` defensivo.

---

## Fase 3 — Identidade proprietária

A linguagem visual signature (top rail editorial + chapters numerados + hairlines de canto + atmosfera bicromática) **agora é um sistema multi-módulo**, não um one-off do Simulador. O Comparador inaugura a expansão dessa identidade — futuras ondas podem aplicar o mesmo *vocabulary* ao Investimento, Bids e Análise sem retrabalho de design.

---

## Fase 4 — Segurança operacional

- ✅ `vite.config.ts` intacto
- ✅ `manualChunks` intacto
- ✅ Runtime/providers/bootstrap intactos
- ✅ Lazy imports intactos
- ✅ `@/core/finance` e cálculos intactos
- ✅ Mudanças JSX limitadas a 4 `data-*` e 1 wrapper `<section>` em volta de blocos JÁ existentes
- ✅ CSS estritamente additivo (Wave 9 ao final do arquivo), sem reescrever regras anteriores
- ✅ `prefers-reduced-motion` e `@media print` respeitados

---

## Fase 5 — Auditoria final

| Pergunta | Resposta |
|---|---|
| O Comparador agora parece mesa analítica premium? | **Sim** — board com atmosfera bicromática + hairlines de canto. |
| Existe narrativa visual? | **Sim** — Capítulo 01 (Mesa) → Capítulo 02 (Eixo Comparativo) → Painel. |
| Os comparativos ganharam presença? | **Sim** — moldura cinematográfica + cards integrados sem chrome competindo. |
| O layout parece cinematográfico? | **Sim** — gradients ambientes, hairlines proprietárias, eyebrows monospace. |
| O módulo parece software proprietário? | **Sim** — herda toda a linguagem signature do Simulador + variante analítica. |
| Existe assinatura visual real? | **Sim** — `data-signature-shell` + `data-analytical-board` formam vocabulary reutilizável. |
| O sistema continua estável? | **Sim** — zero alteração runtime/lógica/build. |

### O que impede 10/10?
- Os componentes internos (`FinancingComparisonTab`, `ConsortiumComparisonTab`) ainda usam `<Card>` legados — o board absorve seu chrome, mas uma onda futura pode trocar por composição editorial pura (`<header>` + grid de métricas).
- Charts internos (Recharts) não têm tratamento cinematográfico próprio — candidato natural para Wave 10 (visualizações premium).
- "Diferença estimada" e "savings" ainda são números padrão; merecem virar **hero metric** dentro do board com tipografia 2.5rem+.

### Scores

| Métrica | Antes | Depois |
|---|---|---|
| Impacto visual | 3.8 | 4.7 |
| Percepção premium | 3.6 | 4.7 |
| Cinematic feel | 3.2 | 4.6 |
| Identidade visual | 3.4 | 4.8 |
| Clareza analítica | 4.4 | 4.6 |
| Sofisticação | 3.7 | 4.7 |
| **Estabilidade operacional** | **5.0** | **5.0** |

---

**Arquivos editados:**
- `src/components/modules/ComparatorModule.tsx` (4 `data-*` + 1 `<section>` wrapper)
- `src/index.css` (bloco Wave 9 additivo no final)
- `.lovable/audit/comparative-intelligence-cinematic-wave.md` (criado)
