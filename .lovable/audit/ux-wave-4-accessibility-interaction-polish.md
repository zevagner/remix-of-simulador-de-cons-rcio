# UX Wave 4 — Accessibility & Interaction Polish

**Status:** ✅ Implementado
**Escopo:** acessibilidade real + polimento perceptivo. Zero alteração em
lógica financeira, providers, hooks, runtime ou Supabase.

---

## 1. Auditoria executada

| Eixo | Achados | Ação |
|------|---------|------|
| **Keyboard flow** | `<main>` não recebia foco por âncora; sem skip-link. | `id="main-content"` + `tabIndex={-1}` em `<main>` + skip-link no topo do shell. |
| **Focus states** | Ring premium existia apenas dentro de `[data-module-canvas="v1"]`. Sidebar, BottomNav, Sheets e Dialogs caíam no outline default do browser (inconsistente, às vezes invisível em fundos escuros). | Nova camada `focus-visible` global em `index.css` cobrindo `aside[data-shell]`, `nav[data-shell-bottom]`, `[role="dialog"]`, `[data-radix-popper-content-wrapper]`. |
| **ARIA / Labels** | 5 botões `size="icon"` sem `aria-label`: trash em `StructuredOpsCardForm`, save/cancel/edit em `SalesForecastCard`, WhatsApp em `EditProposalModal`. Ícones decorativos sem `aria-hidden`. | Labels descritivos adicionados; ícones marcados como `aria-hidden="true"`. |
| **BottomNav semantics** | `<nav>` sem `aria-label`; botões sem `aria-current`/`aria-haspopup`/`aria-expanded`; ícones lidos como conteúdo. | `aria-label="Navegação principal"`, `aria-current="page"` no item ativo, `aria-haspopup="dialog"` + `aria-expanded` no "Análise" e "Mais", ícones com `aria-hidden`, `type="button"` explícito. |
| **Hit areas (mobile)** | BottomNav já em 44px ✓. Botões `h-6/h-7` em SalesForecastCard são desktop-only (cluster KPI), aceitáveis. | Sem regressão; mantido. |
| **Hover/active states** | Já consistentes via tokens. | Sem alteração. |
| **Reduced motion** | `prefers-reduced-motion` aplicado em 14 escopos específicos, mas resíduos em transições utilitárias (`transition-all duration-100` da BottomNav). | Regra global reforçada `*, *::before, *::after` neutralizando animações/transições/scroll-behavior; classes `motion-reduce:transition-none` / `motion-reduce:transform-none` aplicadas em BottomNav. |
| **Screen reader** | Skip-link ausente; main não-focável via âncora. | Resolvido (item 1). |
| **Empty/error states** | `EmptyStateMessage` primitivo em uso; sem regressão detectada. | Sem alteração. |

---

## 2. Arquivos editados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Index.tsx` | Skip-link "Pular para o conteúdo" + `id="main-content"`/`tabIndex={-1}` no `<main>`. |
| `src/components/layout/BottomNav.tsx` | `aria-label` em `<nav>`, `aria-current`/`aria-haspopup`/`aria-expanded` nos botões, ícones `aria-hidden`, `motion-reduce:` para suavizar quando o usuário pede menos movimento. |
| `src/components/modules/structured-ops/StructuredOpsCardForm.tsx` | `aria-label` no botão "Remover carta N". |
| `src/components/modules/pipeline/SalesForecastCard.tsx` | `aria-label` em Salvar/Cancelar/Editar meta. |
| `src/components/modules/pipeline/EditProposalModal.tsx` | `aria-label` no botão WhatsApp. |
| `src/index.css` | Bloco "UX Wave 4" — focus-visible global p/ shells, focus reforçado do skip-link, `prefers-reduced-motion` global. |

---

## 3. Garantias

- **Premium feel:** ring usa `hsl(var(--primary) / 0.55)` com offset de 1.5px sobre o background — mesmo idioma visual já presente no canvas.
- **Sem overlays / tooltips redundantes.** Nenhum componente novo introduzido.
- **Sem regressão visual desktop:** apenas `:focus-visible` (estado teclado) e atributos ARIA invisíveis foram adicionados.
- **Sem regressão mobile:** BottomNav mantém layout, alvos ≥44px, agora com semântica correta para leitores de tela.
- **Performance:** zero JS adicional; CSS adicionado é estático (~40 linhas).
- **Lógica financeira / providers / hooks / runtime / Supabase:** intocados.

---

## 4. Validação

- ✅ Tab a partir do load: foco vai primeiro no skip-link → Sidebar → módulo ativo.
- ✅ `Enter` no skip-link rola e foca `<main>` (`tabIndex=-1`).
- ✅ Focus ring visível em sidebar, bottom-nav, dialogs/sheets/popovers.
- ✅ Leitor de tela anuncia BottomNav como "Navegação principal", item ativo como "página atual", "Análise/Mais" como botão que expande diálogo.
- ✅ Ícones decorativos não são mais lidos.
- ✅ `prefers-reduced-motion: reduce` neutraliza transições residuais (BottomNav scale, transition-all, etc.) sem quebrar layout.

---

## 5. Impacto esperado

| Dimensão | Antes | Depois |
|----------|-------|--------|
| Acessibilidade WCAG (focus visibility) | Parcial (canvas only) | Global em todos os shells |
| Navegação por teclado | Sem skip-link, main não focável | Skip-link + main âncora |
| Leitores de tela em mobile | BottomNav genérica, ícones lidos | Landmark nomeado, estado expandido/atual anunciado |
| Conforto motor (reduce motion) | 14 escopos pontuais | Reset global + scopes específicos |
| Maturidade perceptiva | Boa | Premium consistente em 100% dos shells |
