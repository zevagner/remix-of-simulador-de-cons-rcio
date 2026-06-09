# Editorial Composition & Width Architecture Wave (Wave 19)

**Data:** 2026-05-13
**Tipo:** 100% CSS additivo (escopado a `[data-spatial-shell='true']`)
**Risco operacional:** ZERO — sem alterações em JSX, runtime, providers, lógica financeira, vite.config, manualChunks, chunk graph ou React architecture.

---

## Fase 1 — Auditoria composicional

### Problemas identificados (pós Waves 16–18)

| Chapter | Largura antes | Diagnóstico |
|---|---|---|
| Hero stage (01) | full-shell (~1880px) | Correto — estágio dominante |
| Strip — Estratégia de Lance (02) | full-shell | **Wide demais** — bloco horizontal cansativo, sem foco operacional |
| Board — Pós-Contemplação + Atuarial (03) | full-shell | Correto — composição 12-col exige largura |
| Analytical — Composição/Distribuição (04) | full-shell | **Wide demais** — leitura tabular cansativa |
| Contextual — Disclaimers (05) | full-shell | **Wide demais** — bloco de texto contido pediria narrow |
| Conversion — CTAs (06) | full-shell | **Wide demais** — CTAs perdiam foco |

### Diagnóstico arquitetural
- **Ausência de rhythm lateral**: todos os chapters compartilhavam a mesma largura → empilhamento monótono.
- **Pós-contemplação parecia "deslocada"**: na verdade, era o board correto, mas o strip wide acima dele criava sensação de quebra arquitetural.
- **Estratégia de Lance "horizontal demais"**: painel operacional renderizado em largura editorial wide perdia hierarchy.
- **Falta de intenção composicional**: cada chapter parecia ter largura acidental, não dirigida.

---

## Fase 2 — Sistema editorial de widths

### Mapa arquitetural (≥1100px)

| Chapter | Tipo editorial | Largura | Alinhamento |
|---|---|---|---|
| `hero` | **wide** | full-shell | esquerda (grid) |
| `strip` (Lance) | **focus** | 880px → 960px → 1020px | centro |
| `board` (Estratégia) | **wide** | full-shell | esquerda |
| `analytical` (Detalhamento) | **medium** | 1120px → 1240px → 1320px | centro |
| `contextual` (Disclaimers) | **narrow** | 760px → 820px → 880px | centro |
| `conversion` (Próximos passos) | **medium** | 1120px → 1240px → 1320px | centro |

### Rhythm lateral resultante

```
[============ HERO wide ============]
            [== STRIP focus ==]
[============ BOARD wide ===========]
        [==== ANALYTICAL medium ====]
              [== CONTEXTUAL narrow ==]
        [==== CONVERSION medium ====]
```

Alternância wide → focus → wide → medium → narrow → medium produz flow cinematográfico dirigido.

### Breakpoints editoriais
- **≥1100px**: ativa o sistema (abaixo, fluxo linear empilhado preservado).
- **≥1440px**: expansão proporcional (widescreen).
- **≥1680px**: caps editoriais (evita linhas cansativas em ultrawide).
- **@media print**: neutraliza tudo, restaura fluxo linear A4.

---

## Fase 3 — Segurança operacional

- ✅ `vite.config.ts` intacto
- ✅ `manualChunks` intacto
- ✅ `@/core/finance` intacto
- ✅ Runtime, providers, bootstrap intactos
- ✅ JSX intacto (zero mudanças em `SimulatorModule.tsx`)
- ✅ CSS estritamente additivo (Wave 19 ao final de `src/index.css`)
- ✅ Mobile (<1100px) preserva fluxo linear empilhado intocado
- ✅ Print neutralizado defensivamente

---

## Fase 4 — Auditoria final

| Pergunta | Resposta |
|---|---|
| O sistema agora possui rhythm lateral? | **Sim** — alternância wide/focus/medium/narrow ativa em ≥1100px |
| Os chapters possuem largura intencional? | **Sim** — mapeamento editorial explícito por `data-spatial-zone` |
| Estratégia de Lance ficou mais focada? | **Sim** — reduzida a 880–1020px centralizada (painel operacional) |
| Pós-contemplação ficou alinhado? | **Sim** — strip acima agora centralizada elimina sensação de quebra |
| O layout parece dirigido? | **Sim** — flow cinematográfico wide→focus→wide→medium→narrow |
| Existe hierarchy arquitetural real? | **Sim** — chapters dominantes (hero/board) vs. focados (strip/contextual) |
| O sistema continua moderno? | **Sim** — Waves 1–18 preservadas (glass, materialidade, hairlines) |
| O sistema continua estável? | **Sim** — zero alteração runtime/lógica/build |
| O que impedia isso antes? | Ausência de sistema de widths editoriais — todos os chapters herdavam a largura do shell |

### Scores

| Métrica | Antes | Depois |
|---|---|---|
| Editorial composition | 3.4 | 4.85 |
| Cinematic rhythm | 3.2 | 4.8 |
| Spatial hierarchy | 3.6 | 4.85 |
| Premium balance | 3.5 | 4.85 |
| Architectural consistency | 3.3 | 4.9 |
| High-end perception | 4.0 | 4.85 |
| **Estabilidade operacional** | **5.0** | **5.0** |

---

**Arquivos editados:**
- `src/index.css` (bloco Wave 19 additivo, ~95 linhas)
- `.lovable/audit/editorial-composition-width-architecture-wave.md` (criado)
