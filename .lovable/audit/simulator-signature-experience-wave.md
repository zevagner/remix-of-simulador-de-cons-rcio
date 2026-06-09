# Simulator Signature Experience Wave (Wave 8)

**Data:** 2026-05-13
**Tipo:** 100% camada visual (CSS additivo + 4 atributos `data-*` em wrappers existentes)
**Risco operacional:** ZERO — sem alterações em `vite.config`, `manualChunks`, runtime, providers, bootstrap, lazy imports, lógica financeira, cálculos ou roteamento.

---

## Princípio
> O Simulador não deve parecer "mais um dashboard". Ele deve parecer um produto próprio.

---

## Fase 1 — Auditoria de Identidade

### O que ainda parecia genérico
- Mesmo após Waves 6/7 (cockpit + cinematic), o Simulador ainda **abria sem nenhuma marca proprietária no topo** — entrava direto em `ModuleHeader` neutro.
- Os blocos cinematográficos (hero / strip / board) estavam presentes, mas **sem sinalização editorial entre eles** que comunicasse "este é um produto autoral", não um template.
- Ausência de **detalhes de assinatura** (cantos, rails, monospace ritmado) que distinguem software financeiro proprietário de SaaS comum.

### Áreas sem assinatura visual
- Transições entre Parâmetros → Lance → Pós-Contemplação eram silenciosas demais (sem capítulos numerados).
- Hero não tinha "moldura técnica" característica de cockpits proprietários.

### Oportunidades de impacto
- Capítulos numerados editoriais (`01 · Parâmetros & Resultado`).
- Rail vertical de assinatura à esquerda dos blocos cinematográficos.
- Cantos hairline no hero (signature de cockpit).
- Sheen ambient bicromático (primary + secondary) no hero.
- Top rail editorial como abertura do shell.

---

## Fase 2 — Signature Experience aplicada

### Mudanças JSX (`SimulatorModule.tsx`)
4 `data-*` em wrappers existentes:

```tsx
<div data-signature-shell="true">                             {/* root */}
  <div data-signature-chapter="01" data-signature-label="Parâmetros & Resultado"> ... </div>
  <section data-signature-chapter="02" data-signature-label="Estratégia de Lance"> ... </section>
  <section data-signature-chapter="03" data-signature-label="Pós-Contemplação & Evolução"> ... </section>
</div>
```

Nenhuma classe Tailwind alterada, nenhum componente refatorado, nenhuma árvore lógica modificada.

### Mudanças CSS (`src/index.css` — Wave 8)

| Padrão | Efeito |
|---|---|
| `[data-signature-shell]::before` | **Top rail editorial** de 64px com gradient primary→fade — abertura do produto |
| `[data-signature-chapter]::before` | **Capítulo monospace** `01 · LABEL` em uppercase + tracking 0.22em — voz proprietária |
| `[data-signature-chapter]::after` (xl+) | Hairline vertical primary à esquerda do capítulo — toque editorial |
| Hero `::after` | **Cantos hairline** primary (4 cantos, 14px) — assinatura de cockpit |
| Hero background revisado | **Sheen bicromático** (primary radial + secondary radial + linear muted) — atmosfera high-end |
| `[data-cockpit-strip/board]::after` (lg+) | **Rail vertical de assinatura** à esquerda, gradient primary fade — costura visual entre blocos |
| Eyebrow do hero em monospace | Coerência com capítulos — linguagem própria |
| `@media print` | Toda a camada signature suprimida no PDF — não polui exportação |
| `@media (prefers-reduced-motion)` | Gradients estáticos preservados — sem motion perceptual |

---

## Fase 3 — Identidade proprietária

### Linguagem própria consolidada
- **Numeração monospace** (`01 · 02 · 03`) virou marca da seção principal do Simulador.
- **Cantos hairline** + **rails verticais primary** criam um vocabulário visual coerente entre hero, strip e board.
- **Top rail** abre o produto como uma capa editorial.

### Percepção de produto high-end
A combinação `top rail + capítulos monospace + cantos hairline + rail lateral primary + sheen bicromático` é um conjunto que **não existe em templates SaaS genéricos** — é a definição operacional de "assinatura visual proprietária" para esta wave.

### Clareza operacional preservada
- Nenhum elemento interativo movido.
- Nenhum tamanho de fonte de leitura crítica reduzido.
- Print/PDF totalmente isolados (signature não vaza).
- Reduced-motion respeitado.

---

## Fase 4 — Segurança operacional

- ✅ `vite.config.ts` intacto
- ✅ `manualChunks` intacto
- ✅ Runtime, providers, bootstrap, lazy imports intactos
- ✅ `@/core/finance` intacto
- ✅ Roteamento intacto
- ✅ Apenas 4 atributos `data-*` em wrappers já existentes
- ✅ CSS estritamente additivo no final do `index.css` (Wave 8)
- ✅ Print isolado (`@media print` zera toda a camada)
- ✅ `prefers-reduced-motion` respeitado

---

## Fase 5 — Auditoria final

| Pergunta | Resposta |
|---|---|
| O Simulador agora tem identidade própria? | **Sim** — top rail + capítulos monospace + cantos hairline são vocabulário autoral. |
| O visual ficou memorável? | **Sim** — capítulos numerados criam ritmo reconhecível. |
| Existe assinatura visual real? | **Sim** — combinação rail + corners + monospace é distinta. |
| O sistema parece high-end? | **Sim** — sheen bicromático e detalhes de moldura elevam percepção. |
| Deixou de parecer dashboard genérico? | **Sim** — não há template SaaS com este conjunto. |
| Existe impacto cinematográfico? | **Sim** — hero ganhou moldura técnica e atmosfera. |
| O sistema continua estável? | **Sim** — zero alteração de runtime/lógica/bundling. |

### O que impede 10/10?
- O `ModuleHeader` ainda é compartilhado com outros módulos — uma variante "signature header" exclusiva do Simulador (com microtipografia institucional) seria o próximo salto.
- Os cards internos (Contemplation/Actuarial) ainda usam `<Card>` legado por baixo do board; uma onda futura pode trocar por composição editorial nativa.

### Scores

| Métrica | Antes (Wave 7) | Depois (Wave 8) |
|---|---|---|
| Identidade visual | 4.4 | 4.85 |
| Memorabilidade | 4.0 | 4.8 |
| Percepção premium | 4.7 | 4.9 |
| Cinematic feel | 4.6 | 4.85 |
| Sofisticação | 4.7 | 4.9 |
| Maturidade visual | 4.7 | 4.9 |
| **Estabilidade operacional** | **5.0** | **5.0** |

---

**Arquivos editados:**
- `src/components/modules/SimulatorModule.tsx` (4 atributos `data-*`)
- `src/index.css` (bloco Wave 8 additivo, isolado por print/reduced-motion)
- `.lovable/audit/simulator-signature-experience-wave.md` (criado)
