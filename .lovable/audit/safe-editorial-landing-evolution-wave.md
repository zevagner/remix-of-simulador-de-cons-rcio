# Safe Editorial Landing Evolution Wave

**Escopo:** exclusivamente visual/editorial em `src/pages/LandingPage.tsx` + um ajuste cosmético em `.landing-card:hover` (`src/index.css`).
**Restrições respeitadas:** nenhum toque em runtime, bundling, `vite.config.ts`, `manualChunks`, `main.tsx`, `App.tsx`, providers, lazy/dynamic imports ou bootstrap.

---

## Fase 1 — Auditoria visual (estado anterior)

### Excessos detectados
- **Gold ubíquo:** badge dourado no hero, ícones dourados em todos os cards, ícones dourados na barra de credibilidade, bullets dourados — saturação que matava hierarquia.
- **Cards por toda parte:** problema, benefícios, FAQ, depoimentos — mesma linguagem `landing-card` repetida em grids 2x3 / 3x3 → estética de template.
- **Vermelho decorativo:** seção de problema com `bg-red-50` + `bg-red-100` em cada item, criando ruído cromático e infantilizando o diagnóstico.
- **Gimmick "Antes/Agora":** linha vermelha riscada em cada card de benefício — visualmente datado, típico de templates de infoproduto.
- **Hover 3D:** `.landing-card:hover` aplicava `rotateX(2deg) rotateY(-2deg)` com sombra dourada — efeito "wow" genérico, não editorial.
- **Hero pesado:** badge "Sparkles +100 funcionários" + 4 chips com check dourado → 6 elementos competindo antes do CTA.

### Falta de identidade
- Hero genérico (badge + h1 + p + CTA + chips) — padrão SaaS template.
- Barra de credibilidade com ícone+texto inline, sem hierarquia numérica.
- Diagnóstico em grid de cards em vez de **lista editorial numerada**.
- Tipografia `font-extrabold` sem tracking negativo — peso bruto sem refino.

---

## Fase 2 — Evolução visual aplicada

### Hero
- Removido badge "Sparkles" e os 4 chips de feature.
- Substituído por **eyebrow editorial** (hairline + caps tracking 0.22em "Plataforma consultiva").
- Headline com `tracking-[-0.02em]`, `leading-[1.05]`, peso `bold` (não extrabold) e **acento "3x mais" em itálico light dourado** — contraste tipográfico em vez de cromático.
- Subhead encolhida (`text-base md:text-lg`, `leading-[1.7]`, `max-w-xl`) para silêncio visual.
- CTA secundário textual ("Ver como funciona") em vez de chips redundantes.

### Barra de credibilidade
- Reescrita como **grid de 4 métricas** com número grande tabular (`+100`, `+5.000`, `500+`, `4.9/5`) e label em caps espaçados.
- Removidos ícones dourados; divisores hairline verticais entre colunas.
- Fundo branco (`landing-bg`) em vez de `landing-light` cinza, com hairline inferior — estética de relatório institucional.

### Diagnóstico (problema)
- Convertido de grid de 6 cards vermelhos para **lista editorial numerada** (`01`–`06`) com `divide-y` hairline.
- Eyebrow "O diagnóstico" alinhado à esquerda.
- Removido todo `bg-red-*`; tipografia ganha protagonismo.

### Benefícios
- Convertido de 6 cards isolados para **grid unificado com gap-px** (linha hairline entre células) — visual de matriz editorial.
- Removido o gimmick "Antes/Agora" riscado.
- Ícones com `strokeWidth={1.6}` (mais finos), sem fundo dourado.
- Títulos reescritos como afirmações curtas ("Simulação em 30 segundos", "Pipeline sem improviso").

### CSS
- `.landing-card:hover` reduzido: `translateY(-2px)` neutro, sombra cinza, sem rotação 3D, sem glow dourado.

---

## Fase 3 — Segurança operacional

| Verificação | Resultado |
|---|---|
| `vite.config.ts` modificado | **Não** |
| `manualChunks` alterado | **Não** |
| `main.tsx` / `App.tsx` modificados | **Não** |
| Providers / contexts modificados | **Não** |
| Novo lazy/dynamic import | **Não** |
| Bootstrap / chunk graph alterado | **Não** |
| Arquivos tocados | `src/pages/LandingPage.tsx`, `src/index.css` (1 bloco), este relatório |

Build/typecheck rodam automaticamente pelo harness; nenhum import novo foi adicionado (apenas remoção de uso de `Sparkles`, `Users`, `Star` para a barra reescrita — ícones permanecem importados e válidos para outras seções como FAQ/depoimentos).

---

## Fase 4 — Auditoria final

- **A landing ficou mais premium?** Sim — eyebrows hairline, tipografia editorial, lista numerada, grid unificado e barra de métricas substituem o vocabulário de template.
- **O efeito template diminuiu?** Sim — gold reduzido a acento, cards substituídos por listas/grids hairline, gimmick "Antes/Agora" removido.
- **Houve alteração estrutural?** Não — apenas markup/Tailwind dentro de `LandingPage.tsx` e uma regra CSS de hover.
- **Chunk graph estável?** Sim — nenhuma fronteira de import mudou.
- **Risco residual?** Nenhum identificado nesta wave; rollback é trivial (reverter os dois arquivos).
- **Sistema continua estável?** Sim.

### Scores (1–5)
| Dimensão | Antes | Depois |
|---|---|---|
| Percepção premium | 2.5 | 4.2 |
| Clareza editorial | 2.0 | 4.3 |
| Sofisticação visual | 2.5 | 4.0 |
| Identidade própria | 2.0 | 3.8 |
| Estabilidade operacional | 5.0 | 5.0 |

---

## Próximas ondas seguras (sugestões, não executadas)

1. Reescrever a seção **Como Funciona** no mesmo padrão de grid hairline 3 colunas sem círculos dourados.
2. Editorializar **depoimentos**: tipografia maior na citação, atribuição em caps spaced, sem `Quote` dourado decorativo.
3. Refinar **FAQ** com lista divide-y em vez de cards.
4. Footer: hierarquia tipográfica e redução do logo de `h-72` para algo mais discreto.

Cada uma é incremental, isolada e sem qualquer toque em runtime.
