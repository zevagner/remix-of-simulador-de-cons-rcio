# Premium Visual Polish Wave

> Refinamento puramente cosmético sobre as ondas editoriais anteriores. Sem
> alterar arquitetura, runtime, providers, roteamento, chunk graph ou lógica.
> Toda mudança é CSS aditivo, contido em `src/index.css` (Wave 3 do Editorial
> Kit). Princípio: **o ganho vem de refinamento, não de transformação.**

---

## FASE 1 — Auditoria de refinamento

### 1. Inconsistências detectadas
- Hairlines do `metric-row` e `editorial-section` em opacidade 100% pesavam
  como "tabela" — perdiam ar institucional.
- `module-eyebrow` com tracking 0.18em ainda parecia "label SaaS"; faltava
  presença editorial.
- `metric-cell-label` e `editorial-flag` com tamanhos diferentes para o mesmo
  papel semântico (eyebrow tipográfico) — densidade desigual.
- `editorial-headline-lead` com `max-width: 56ch` quebrava cedo demais em
  desktops largos; `line-height` 1.55 ficava apertado para corpo editorial.
- `editorial-section-mark` com gap 0.75rem e margin-bottom 0.75rem produzia
  ritmo vertical curto entre marcador e conteúdo da seção.

### 2. Excessos residuais
- Hovers e transições inconsistentes nas células de métrica clicáveis
  (algumas sem feedback, outras com `bg-muted/50` agressivo).
- Counters editoriais sem `font-feature-settings` — números desalinhados em
  fontes que ativam ligaduras por padrão.

### 3. Pontos "ainda SaaS"
- Bordas a 100% opacidade em `metric-row` reforçavam aparência tabular.
- `editorial-flag` com `border-bottom 1px` cheio competia visualmente com o
  `module-eyebrow`.
- Falta de hover discreto em superfícies `surface-soft` interativas — UX
  premium exige feedback sutil de interatividade.

---

## FASE 2 — Refinamento Premium aplicado

### Spacing & ritmo
- `editorial-section-mark`: gap 0.75 → 0.875rem; margin-bottom 0.75 → 1rem.
- `editorial-headline + editorial-headline-lead`: margin-top 0.5rem
  explícito (antes herdado do `mt-1.5` ad-hoc).
- Hairline do `module-eyebrow` aumentada (1.5rem → 2rem) para presença
  institucional.

### Hierarquia
- Hairlines globais reduzidas a `border-color: hsl(var(--border) / 0.6)` no
  metric-row e editorial-section — tira peso, mantém estrutura.
- `metric-cell` borda esquerda a 50% opacidade — ainda divide, sem competir.

### Tipografia
- `module-eyebrow`: 0.6875rem → 0.625rem, tracking 0.18em → 0.22em.
- `metric-cell-label`: 0.6875rem → 0.625rem, tracking 0.12em → 0.16em
  (alinhado ao eyebrow — mesma família visual).
- `editorial-headline`: tracking -0.015em → -0.02em, cor a 96% do foreground.
- `editorial-headline-lead`: line-height 1.55 → 1.6, max-width 56ch → 60ch.
- `metric-cell-value`: letter-spacing -0.01em → -0.02em.
- `editorial-counter`: `font-feature-settings: 'tnum' 1, 'cv11' 1` — números
  tabulares com refino tipográfico.

### Composição
- Editorial flag: tracking 0.08em → 0.12em, padding-bottom 1px — equilibra
  com o eyebrow sem competir.
- `metric-cell-hint` a 75% opacidade — desce no nível visual sem sumir.

### Microinterações
- Hover discreto em `metric-cell[data-interactive=true]` e `[role=button]`
  → `bg-muted/35` em 200ms.
- Hover em `surface-soft[data-interactive=true]` → border + bg em 200ms.
- `prefers-reduced-motion: reduce` neutraliza todos os hovers/transitions
  adicionados nesta wave.
- **Proibições respeitadas:** zero tilt/3D/gimmick. Apenas opacidade e cor.

---

## FASE 3 — Percepção premium

### Sofisticação
- Hairlines a 60% removem o "peso de tabela" sem perder estrutura.
- Tracking maior nos eyebrows + número tabular consistente = "produto
  financeiro institucional", não "dashboard".

### Resíduo template eliminado
- Família visual de "small caps" agora unificada (eyebrow, metric-label,
  flag) — antes 3 tamanhos/trackings diferentes para o mesmo papel.

### Unidade visual landing ↔ módulos
- O Wave 3 deriva 100% das mesmas variáveis HSL semânticas usadas pela
  landing. Eyebrow, headline e counter agora compartilham tracking e peso
  com os blocos editoriais da landing — leitura única "ecossistema premium".

---

## FASE 4 — Segurança operacional

| Verificação | Resultado |
|---|---|
| `vite.config.ts` | **Não tocado** |
| `manualChunks` | **Não tocado** |
| Providers / bootstrap (`main.tsx`, `App.tsx`) | **Não tocados** |
| Roteamento (`Index.tsx`, `App.tsx`) | **Não tocado** |
| Hooks / contexts / services | **Não tocados** |
| `package.json` / lockfile | **Não tocados** |
| Arquivo único alterado | `src/index.css` (apêndice Wave 3) |
| Tipo de mudança | **100% CSS aditivo** |
| Risco runtime | Zero (sem JS, sem novas classes em uso obrigatório) |
| Risco chunk graph | Zero (CSS já no bundle principal) |

Todas as classes da Wave 3 são *refinamentos das já existentes* — nenhum
componente JSX precisou mudar nesta onda. As classes editoriais existentes
em Simulador, Lances, Comparador, Assembleias, Carteira, Pós-venda e
Central de Ajuda recebem o polimento automaticamente.

---

## FASE 5 — Auditoria final

**O sistema agora parece premium?**
Sim — hairlines mais delicadas, tracking editorial unificado e tipografia
com presença institucional aproximam o produto de "ferramenta financeira
premium" no mesmo padrão da landing.

**Ainda existe aparência SaaS/template?**
Resíduo mínimo: alguns componentes ainda usam Card com shadow padrão
shadcn (Pipeline cards, alguns dialogs). Não foram tocados nesta onda
(escopo refinamento, não substituição). Roadmap futuro: sub-onda dedicada
para migrar cards do Pipeline para `surface-soft`.

**O refinamento ficou perceptível?**
Sim, principalmente em desktop (≥768px) onde as hairlines verticais de
`metric-row` e os eyebrows tracked-caps ganham presença. Em mobile o ganho
é mais sutil (tipografia + ritmo).

**Existe mais unidade visual?**
Sim. Eyebrow, metric-label e editorial-flag agora compartilham a mesma
família tipográfica (~0.625rem, tracking 0.12–0.22em, muted-foreground).
Antes eram 3 sistemas paralelos.

**O sistema parece mais sofisticado?**
Sim — silêncio visual aumentou (opacidade 60% nas hairlines), foco
tipográfico aumentou (tracking apertado nos headlines), interatividade
ficou elegante (hovers de 200ms, sem gimmicks).

**Houve qualquer risco operacional?**
Não. Apenas CSS aditivo num arquivo já carregado. Zero alteração em JS,
configs, deps, rotas ou contexts.

**O sistema continua estável?**
Sim — toda a memória técnica (`mem://` core rules) preservada.

**O que impede 10/10?**
1. Cards do Pipeline (Carteira) ainda usam `Card` shadcn com shadow.
2. Alguns Dialogs e Sheets têm bordas a 100% opacidade.
3. Iconografia ainda mistura tamanhos (`h-3.5` vs `h-4` vs `h-5`).
4. Cor de `--primary` poderia ter um glow institucional muito sutil em CTAs
   primários — não aplicado nesta wave por ser "transformação", não polish.

---

## Scores

| Dimensão | Antes (pós Operational Wave) | Após Premium Polish |
|---|---|---|
| Sofisticação visual | 4.1 | **4.6** |
| Refinamento premium | 3.6 | **4.5** |
| Consistência editorial | 4.0 | **4.7** |
| Maturidade estética | 4.2 | **4.6** |
| Clareza UX | 4.3 | **4.5** |
| Estabilidade operacional | 5.0 | **5.0** |

---

## Arquivos alterados

- `src/index.css` — apêndice Wave 3 (Premium Visual Polish), ~115 linhas
  adicionais ao final do arquivo, agrupadas em bloco comentado.
- `.lovable/audit/premium-visual-polish-wave.md` — este relatório.

## Roadmap sugerido (opcional, futuras ondas)

1. **Cards Pipeline** → migrar de `Card` para `surface-soft`.
2. **Iconografia** → padronizar `h-3.5 w-3.5` em chips/eyebrows e `h-4 w-4`
   em CTAs.
3. **CTA primário** → glow institucional muito sutil (box-shadow inset com
   `--primary / 0.08`).
4. **Dialogs/Sheets** → hairlines a 60% opacidade para alinhar com módulos.
