# Wave 22 — Landing Page Modernization (Onda 1 + 2)

## Escopo

- **Onda 1**: criar camada `--ds-*` (Design System v2) em `src/index.css`.
  Convive com tokens legados; nada removido.
- **Onda 2**: reescrever a `LandingPage.tsx` consumindo a nova camada via
  utilities `lv2-*` escopadas em `.landing-v2`.

Zero alteração em lógica, contextos, hooks, edges ou outras rotas.

## Mudanças

### `src/index.css`
- **+34 linhas** de tokens `--ds-*` em `:root` (surfaces, texto, accent,
  sombras, raios, easing, durações).
- **+ Wave 22 block** ao final (~245 linhas) com utilities escopadas:
  - `.lv2-grain` — overlay SVG sutil para profundidade.
  - `.lv2-halo` — halos dourado + azul controlados (hero/CTA).
  - `.lv2-card` / `.lv2-card-featured` — cards padronizados.
  - `.lv2-bento` — grid bento responsivo (1 hero + 5 menores).
  - `.lv2-step-num` — números editoriais grandes (Como funciona).
  - `.lv2-eyebrow`, `.lv2-display`, `.lv2-stat` — tipografia editorial.
  - `.lv2-mockup` — preview do app no hero.
  - `.lv2-cta-stage` — CTA final full-bleed dramático.
  - Print fallbacks neutralizando efeitos pesados.

### `src/pages/LandingPage.tsx`
Reescrita seção por seção, mantendo copy/CTAs:
1. **Hero v2** — split 7/5: copy + mockup do app à direita; halo+grain.
2. **Barra credibilidade** — tipografia tabular maior, hierarquia clara.
3. **Problema** — lista numerada (preservada, refinada hover).
4. **Transição** — banda escura curta com grain.
5. **Benefícios** — **bento assimétrico** (1 hero destaque + 5 cards) em
   vez de grid 3×2 uniforme.
6. **Como funciona** — números editoriais grandes (`lv2-step-num`) em vez
   de círculos genéricos.
7. **Prova social** — 1 depoimento featured 2/3 + 2 menores 1/3.
8. **FAQ** — `Accordion` Radix em vez de cards estáticos.
9. **Garantia** — preservada com refino tipográfico.
10. **CTA final** — `lv2-cta-stage` full-bleed com halo + grid de 2 opções.

### `docs/design/tokens-v2.md`
Documentação dos tokens `--ds-*` (uso, categorias, roadmap).

## Garantias

- **Escopo**: todos os utilitários novos vivem dentro de `.landing-v2` —
  zero risco para `/app`, `/login`, `/admin`.
- **Sem libs novas**: usa `framer-motion` e shadcn `Accordion` já
  presentes.
- **Print preservado**: `@media print` neutraliza grain/halo/sombras.
- **Tokens legacy intactos**: `--landing-*` continuam ativos.
- **Lógica/dados**: zero mudança.

## Próximas ondas

- **Onda 3** — Auth (Login/SignUp/Reset) split-screen consumindo tokens DS v2.
- **Onda 4** — App shell (Sidebar/BottomNav/ModuleHeader).
- **Onda 5** — Template canônico de módulo.
- **Onda 6** — Aplicar template em cada módulo (Simulador → Help).
- **Onda 7** — Polish transversal.
- **Onda 8** — Limpeza de `index.css` (remover regras substituídas).
