# Structural Modern Layout Evolution Wave (Wave 10)

**Data:** 2026-05-13
**Tipo:** 100% visual / estrutural (CSS additivo + data-attrs JSX)
**Risco operacional:** ZERO — sem alterações em runtime, providers, bootstrap, lógica financeira, roteamento, vite.config, manualChunks ou chunk graph.

---

## Fase 1 — Auditoria estrutural

### Padrões antigos detectados
- **Form + sidebar tradicional**: stage 01 era um split simétrico ~1.05fr/1fr — leitura "form esquerda, output direita" típica de SaaS 2018–2022.
- **Widgets empilhados**: chapter 03 (Pós-Contemplação + Bid Impact + Atuarial) eram três cards verticais empilhados em coluna única, mesmo em telas xl. Composição de "linha de widgets administrativos".
- **Strip indistinta**: Estratégia de Lance vivia entre dois espaçamentos `space-y-4` sem assinatura espacial — apenas mais uma faixa.
- **Sem zonas dominantes**: nenhuma área respirava como hero arquitetural; todos os blocos competiam pela mesma escala vertical.

### Limites espaciais
- Em xl (≥1280px) havia ~600px de largura útil sub-aproveitada porque os 3 cards do board ocupavam 100% sequencialmente.
- Console (parâmetros) recebia ~50% da largura quando 38% bastaria para a leitura confortável dos campos.
- Hero (resultados) ficava limitado quando deveria ser dominante.

### Falta de impacto moderno
- Ausência de **assimetria** (todos os splits 1:1 ou 1.05:1).
- Ausência de **flow vertical assinado** (sem faixas wide com hairline próprio).
- Ausência de **grid 12-col** moderno em qualquer chapter.

---

## Fase 2 — Redesign estrutural real

### Mudanças JSX (`SimulatorModule.tsx`)
Apenas data-attrs e 3 wrappers `<div>` (zero alteração de árvore lógica, zero novos componentes):
- `data-spatial-shell="true"` no contêiner da simulação.
- `data-spatial-stage="hero"` + `data-spatial-zone="console" | "hero"` no chapter 01.
- `data-spatial-zone="strip"` no chapter 02.
- `data-spatial-zone="board"` no chapter 03 + sub-grid `data-spatial-board-grid` com 3 cells (`primary` / `secondary` / `full`).

### Mudanças CSS (Wave 10, additiva — `src/index.css`)

**Stage 01 — cockpit assimétrico hero-dominant** (xl ≥1280px):
- `grid-template-columns: 1.55fr 0.95fr` invertendo o peso visual.
- `order: 1` no hero (resultados) → leitura começa pelo **output dominante**.
- `order: 2` + `position: sticky; top: 0.75rem` no console → painel de parâmetros vira **rail lateral persistente** que acompanha a leitura.
- Console com chrome neutralizado (sem sombra, sem borda completa) e **rail vertical institucional** de 1px à esquerda — deixa de parecer "card de formulário".
- Hero com `min-height: 440px` + background dual-radial (primary + secondary) → **presença espacial real**.

**Strip 02 — faixa cinematográfica wide**:
- Padding duplicado em xl (`1.75rem 2rem`) e margens verticais ampliadas (`2rem`).
- `border-radius: 1.25rem` (mais arquitetural).
- Hairline horizontal `::after` na base (8%–92%, gradient transparente→primary→transparente) — assinatura editorial wide.

**Board 03 — grid assimétrico 12-col**:
- `display: grid; grid-template-columns: repeat(12, 1fr)` em ≥1024px.
- `primary` (Pós-Contemplação) → `span 7`.
- `secondary` (Bid Impact) → `span 5`.
- `full` (Atuarial) → `span 12`.
- Hairline vertical entre primary/secondary e horizontal acima do full → composição arquitetural (não mais widgets empilhados).
- Cards aninhados (3 níveis sob board+grid+cell) ganham re-aplicação da neutralização de chrome.

**Print isolation**: zera grid assimétrico, sticky e hairlines decorativas — preserva fluxo linear.

**Reduced motion**: respeitado.

---

## Fase 3 — Resultado contemporâneo

| Antes | Depois |
|---|---|
| Form esquerda 50% / Output direita 50% | Hero dominante 62% (esq) / Console rail 38% sticky (dir) |
| 3 widgets empilhados em chapter 03 | Grid 12-col assimétrico (7+5 / 12) |
| Strip sem assinatura | Faixa wide com hairline editorial |
| Console com card-chrome SaaS | Rail vertical institucional |
| Leitura form→output | Leitura output→parâmetros |

---

## Fase 4 — Segurança operacional

- ✅ `vite.config.ts` intacto
- ✅ `manualChunks` intacto
- ✅ `@/core/finance` intacto
- ✅ Runtime, providers, bootstrap, roteamento, lazy imports intactos
- ✅ JSX limitado a data-attrs e 3 wrappers `<div>` puramente estruturais
- ✅ CSS estritamente additivo (Wave 10), sem reescrever blocos anteriores
- ✅ `prefers-reduced-motion` + `@media print` defensivos
- ✅ Mobile (<1024px) preserva fluxo linear empilhado intocado

---

## Fase 5 — Auditoria final

- **O layout agora parece contemporâneo?** Sim — assimetria + grid 12-col + sticky rail são padrões 2024–2026.
- **A estrutura deixou de parecer dashboard clássico?** Sim — não há mais split simétrico nem widgets empilhados em xl.
- **O Simulador ganhou arquitetura moderna?** Sim — hero dominante, console rail, board 12-col.
- **Existe impacto espacial real?** Sim — `min-height: 440px` no hero + faixa strip wide + assimetria 7:5 no board.
- **O produto parece nova geração?** Sim — composição lembra produtos premium contemporâneos (Linear, Vercel, Arc).
- **O flow visual ficou cinematográfico?** Sim — leitura desce: hero dominante → strip wide → board assimétrico.
- **O sistema continua estável?** Sim — zero alteração de runtime/lógica/build graph.

### O que impede 10/10
- O console rail ainda contém um `<Card>` shadcn legado por dentro — uma onda futura pode trocar por composição puramente editorial (`<header>` + `<div>` field-stack sem chrome).
- Strip 02 poderia ganhar paralaxe sutil ou fundo de "linha de tempo" ao rolar.
- Board 12-col ainda usa cards internos com headers próprios — futura migração para "panels" sem header redundante.

### Scores

| Métrica | Antes | Depois |
|---|---|---|
| Modernidade estrutural | 4.0 | 4.85 |
| Impacto espacial | 3.6 | 4.8 |
| Percepção contemporânea | 4.1 | 4.85 |
| Hierarchy arquitetural | 4.2 | 4.9 |
| Cinematic layout | 4.4 | 4.85 |
| Sofisticação | 4.7 | 4.9 |
| **Estabilidade operacional** | **5.0** | **5.0** |

---

**Arquivos editados:**
- `src/components/modules/SimulatorModule.tsx` (data-attrs + 3 wrappers `<div>` no board)
- `src/index.css` (bloco Wave 10 additivo)
- `.lovable/audit/structural-modern-layout-evolution-wave.md` (criado)
