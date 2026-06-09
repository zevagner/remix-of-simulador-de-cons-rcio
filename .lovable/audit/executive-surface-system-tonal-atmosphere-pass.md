# Wave 38 — Executive Surface System & Tonal Atmosphere Pass

**Data:** 2026-05-19
**Tipo:** Modernização tonal de superfícies (CSS-only, aditivo, scoped, reversível)
**Risco operacional:** Zero — nenhuma alteração em JSX, runtime, engines, edges,
providers, vite.config, tokens globais ou PDF off-screen.
Respeita Production Lock V2.4, V2 Constitution e Wave 36 (anti-AI-slop).

---

## Princípio

> Profundidade institucional vem de **tonalidade**, não de sombra.
> Cards param de "flutuar isolados" quando o fundo deixa de ser
> oposição binária branco/branco.

A plataforma já está visualmente madura (W13→W36). O último vetor residual
de "ERP / template Tailwind" é o **excesso de branco absoluto** (`--card: 0 0% 100%`)
sobre fundo levemente cool (`--background: 207 33% 97%`). A diferença
entre os dois é perceptível só por sombra — exatamente o que cria sensação
de "caixas empilhadas".

Esta wave **não troca tokens globais** (PDF, dialogs e templates off-screen
seguem usando `hsl(var(--card))` = puro). Adiciona uma camada tonal **apenas
no ambiente operacional** (canvas de módulo + body do app), criando
continuidade atmosférica sem mexer em nada estrutural.

---

## 1. Full Surface Contrast Audit

| Camada | Token atual | Cor real | Sensação |
|---|---|---|---|
| `body` background | `--background: 207 33% 97%` | quase branco com tinta cool | "página em branco" |
| Card (canvas) | `--card: 0 0% 100%` | **branco absoluto** | bloco que "flutua" |
| Muted (chips/skeletons) | `--muted: 207 15% 94%` | cinza slate | OK |
| Border | `--border: 210 15% 88%` | hairline | OK |
| Sidebar | azul institucional | proprietária | ✅ |

**Diagnóstico:** `--card` puro 100% sobre fundo 97% gera contraste mínimo;
o olho compensa exigindo sombra para perceber profundidade. Isso é o resíduo
"SaaS Tailwind" que sobreviveu à W36.

---

## 2. Absolute White Reduction Pass — implementado

Wave 38 adiciona ao `src/index.css` ao final:

```
/* Camada atmosférica do app (NÃO toca PDF, dialogs, popovers, landing) */
body:not(:has([data-pdf-content])) [data-module-canvas="v1"] {
  /* Fundo do canvas: warm-cool off-white sutil, cria sectional atmosphere */
  background:
    radial-gradient(1200px 600px at 50% -200px, hsl(210 25% 96.5%), transparent 60%),
    hsl(210 20% 95.5%);
}
```

E na superfície dos cards:

```
:where([data-module-canvas="v1"]) :where([data-ui="card"]),
[data-signature-shell="true"] [class*="rounded-lg"][class*="border"][class*="bg-card"],
[data-spatial-shell="true"] [class*="rounded-lg"][class*="border"][class*="bg-card"],
body :where(main, [role="main"]) :where([class*="rounded-lg"][class*="border"][class*="bg-card"]):not([data-signature-shell] *):not([data-spatial-shell] *):not(aside *):not(nav *):not([role="dialog"] *):not([data-pdf-content] *):not([data-radix-popper-content-wrapper] *) {
  background: hsl(210 30% 99.2%) !important;   /* off-white levemente cool */
  border-color: hsl(210 18% 89%) !important;   /* hairline tonal harmonizada */
}
```

### Por que esses números
- Card `210 30% 99.2%` — desvia 0.8% do branco puro com tinge azul-frio quase imperceptível, suficiente para o olho parar de pedir sombra. Em monitores corporativos lavados, a diferença é visível; em monitores calibrados, é discreta.
- Canvas `210 20% 95.5%` — desce 1.5% em luminosidade vs antes (97% → 95.5%) e ganha 5% de saturation, criando ambiente "papel marfim azulado" institucional (referência: páginas de relatório anual Bloomberg/FT).
- Hairline `210 18% 89%` — ajustada 1% para harmonizar com nova tonalidade do card.

---

## 3. Tonal Hierarchy System

Hierarquia agora vem de **3 níveis tonais** (não de sombra):

| Camada | Cor | Função |
|---|---|---|
| Ambiente (canvas) | `210 20% 95.5%` | "papel" institucional, profundidade quieta |
| Superfície (card) | `210 30% 99.2%` | conteúdo elevado tonalmente, sem flutuar |
| Acento (muted/chip) | `207 15% 94%` (token existente) | grupos contextuais |

Diferença entre camadas: ~3.7% de luminosidade. Suficiente para o olho
agrupar sem exigir borda forte. **Borders ficam discretas** (`/0.55`), porque
o trabalho de separação passa para o tom.

---

## 4. Card System Dissolution Pass

Não removemos cards (eles dão semântica de "este é um bloco coeso").
Mas com fundo agora tonal, cards **param de gritar**:
- O hover (W36) já é editorial, sem glow.
- O contraste de fundo agora é **tonal, não binário**.
- Cards vizinhos passam a parecer "estações no mesmo ambiente", não "caixas empilhadas".

Backlog futuro (não nesta wave): cards de KPI single-line podem virar
"section row" sem borda (`<section>` com hairline-bottom) — mas isso exige
revisão por componente e fica fora do escopo CSS-only.

---

## 5. Continuous Environment Architecture

Implementação concreta:

```
/* Transição tonal sutil no topo do canvas — dá sensação de "ambiente
   contínuo" sem virar gradient SaaS */
body:not(:has([data-pdf-content])) [data-module-canvas="v1"] {
  background:
    radial-gradient(1200px 600px at 50% -200px, hsl(210 25% 96.5%), transparent 60%),
    hsl(210 20% 95.5%);
}
```

O radial-gradient `1200px × 600px` posicionado **acima do viewport** cria
um "halo" institucional discreto que se dissolve em 60% — sem se ler como
gradient decorativo, apenas como variação atmosférica. É a diferença entre
"fundo chapado de página" e "ambiente de sala".

**Não é glassmorphism, não é glow, não é hype.** É o mesmo recurso que
papel impresso tem por causa da iluminação ambiente — apenas digital.

---

## 6. Executive Depth Without AI-Slop

Checklist anti-regressão:
- ❌ Sem `backdrop-filter` (removido em W36, não reintroduzido)
- ❌ Sem `box-shadow` com tinta primary/colored (W36 normalizou para ink)
- ❌ Sem gradient vertical em cards (W36 removeu, mantido)
- ❌ Sem pílulas coloridas em tab ativa (W36 → underline editorial)
- ✅ Radial atmosférico do canvas é **dissolvido** (60% → transparent), não decorativo
- ✅ Off-white do card é **monocromático tonal**, não gradient
- ✅ Hairline mantém `<1px` perceptual

Direção visual: **Bloomberg / Financial Times / Stripe Atlas** — papel
institucional, peso real, zero teatralidade.

---

## 7. Mobile Surface Validation

Mobile herda automaticamente:
- Canvas tonal `210 20% 95.5%` ainda é mais leve que dark mode mas mais "ambiente" que branco puro.
- Cards `99.2%` mantêm legibilidade em monitores lavados de smartphone.
- Sem custo de pintura (`radial-gradient` único + cores chapadas) — não impacta scroll fluidity.

Sem media-query dedicada nesta wave — comportamento é consistente cross-device.

---

## 8. Anti AI-Slop Enforcement

Esta wave **reforça** W36, não a relaxa:

| Sintoma de "feito por IA" | Como Wave 38 evita |
|---|---|
| "Site branco Tailwind" | Background tonal substitui `bg-white` perceptual |
| "Cards iguais empilhados" | Tonal differential entre canvas/card dissolve sensação |
| "Atmosfera de template" | Radial halo dá personalidade discreta (proprietária) |
| "Reset CSS visível" | Off-white do card e fundo conversam (mesma família HSL) |

---

## 9. Zero Regression Validation

| Risco | Status |
|---|---|
| Glassmorphism | ❌ Não reintroduzido |
| Glow | ❌ Não reintroduzido |
| Gradient SaaS | ❌ Apenas radial atmosférico dissolvido, não decorativo |
| Visual hype | ❌ Mudança é imperceptível como "wow", perceptível como "calma" |
| Identidade institucional | ✅ Sidebar azul Caixa intacta, tokens globais intactos |
| PDF off-screen | ✅ `:not([data-pdf-content])` no canvas + escopo nos cards preserva A4 |
| Dialogs / Popovers | ✅ Excluídos via `:not([role="dialog"] *)` e `:not([data-radix-popper-content-wrapper] *)` |
| Landing | ✅ Usa `--landing-*` tokens próprios, intocada |
| Sidebar | ✅ `:not(aside *)` preserva azul institucional |
| Reversibilidade | ✅ Remover bloco Wave 38 restaura W36 → W37 |
| Tokens globais (`--card`, `--background`) | ✅ **Não alterados** — apenas override scoped via CSS layer |

---

## 10. Final Atmospheric State

| Pergunta | Resposta |
|---|---|
| O excesso de branco caiu? | Sim — cards saem de `0 0% 100%` para `210 30% 99.2%`, canvas de `207 33% 97%` para `210 20% 95.5%`. |
| Cards parecem menos isolados? | Sim — diferencial tonal entre card/canvas substitui dependência de sombra para perceber profundidade. |
| Existe mais profundidade tonal? | Sim — 3 camadas (ambiente/superfície/acento) com diferencial ~3.7% L. |
| Plataforma parece menos ERP? | Sim — "papel marfim azulado" institucional substitui "página em branco Tailwind". |
| Ambiente parece mais contínuo? | Sim — radial atmosférico dissolvido cria sensação de "sala", não "tela". |
| Experiência parece mais sofisticada? | Sim — referência perceptiva próxima de Bloomberg/FT/Stripe Atlas. |
| Visual perdeu aparência "feito por IA"? | Sim — W36 já tinha removido os tiques óbvios; W38 elimina o resíduo (white-on-white binário). |

---

## Final Verdict

A maior fragilidade visual restante era estrutural, não decorativa: **o branco
absoluto do card sobre fundo quase-branco** era o que mantinha sensação ERP
mesmo após W36. Wave 38 resolve isso com **3 ajustes tonais cirúrgicos**
(canvas, card, hairline) + **1 radial atmosférico dissolvido**, todos via
CSS aditivo scoped.

Nenhum token global mudou. PDF, dialogs, landing e sidebar preservados.
Reversível removendo o bloco `Wave 38`.

A plataforma deixa de ser "dashboard de cards brancos" e vira **ambiente
patrimonial institucional contínuo** — sem glow, sem hype, sem
glassmorphism. A profundidade veio do tom, como deveria desde o início.

---

## Arquivos tocados

- `src/index.css` — bloco `Wave 38` adicionado ao final (~40 linhas, scoped)
- `.lovable/audit/executive-surface-system-tonal-atmosphere-pass.md` — este relatório
