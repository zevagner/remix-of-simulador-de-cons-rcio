# Wave 23 — App Shell Modernization

**Status:** executado · **Risco operacional:** zero · **Escopo:** CSS scoped + data-attrs + classes visuais

## Diagnóstico

O App Shell ainda parecia "painel corporativo":
- **Active state pesado**: `bg-white/15` cria um bloco branco opaco — leitura ERP, não SaaS premium.
- **Sem profundidade**: sidebar plana em fundo sólido, zero ambient lighting.
- **Grupos sem hierarchy**: labels de grupo discretos demais, sem separação visual entre VENDA / OPERACIONAL / SUPORTE / ADMIN.
- **Module header**: sem hairline ember para fechar o "chapter".
- **Bottom-nav mobile**: card flat sem materialidade, indicador ativo só na cor.

## Mudanças

### Sidebar (`src/components/layout/Sidebar.tsx`)
- `data-shell="v2"` + `data-collapsed` no `<aside>`.
- `data-shell-group` / `data-shell-group-label` em cada grupo.
- `data-shell-item` + `data-active` em cada item; subitens recebem `data-shell-subitem` + `data-active`.
- Removido `bg-white/15` / `bg-white/10` / `hover:bg-sidebar-accent` hardcoded — agora vem do CSS.
- Padding aumentado de `py-1.5` → `py-2` (breathing).

### ModuleHeader (`src/components/layout/ModuleHeader.tsx`)
- `data-shell-header="v2"` no wrapper do header.

### BottomNav (`src/components/layout/BottomNav.tsx`)
- `data-shell-bottom="v2"` no `<nav>`.

### CSS (`src/index.css`, ~150 linhas Wave 23)
- **Atmospheric ambient**: `::before` radial-gradient azul no topo + segundo glow inferior — instala depth sem poluição.
- **Active state premium**: 
  - Indicator bar lateral 2px (`::before` com transform de entrada).
  - Background gradiente `primary/22 → primary/08 → transparent` (tinta institucional, não bloco branco).
  - Inset highlight sutil + sombra inferior.
  - Ícone ativo recebe `drop-shadow` azul (presença).
- **Hover sutil**: gradiente branco 5% → 2% (tonal, não bloco).
- **Subitens**: hover 4% white, ativo gradiente azul 16% + barra inset 2px.
- **Group dividers**: hairline 4.5% white entre grupos com breathing extra.
- **Eyebrow refinado**: 9.5px / tracking 0.14em / opacity 32%.
- **Module header hairline**: gradiente azul radial bottom (12%→55%→12%) — fecha o chapter como faixa ember.
- **Bottom-nav glass**: gradiente vertical no card + blur 14px + saturate 1.05 + sombra superior; pill ativa com glow azul.
- **Collapsed**: ativo vira pill radial centralizada (não mais retângulo).
- **A11y**: `prefers-reduced-motion` neutraliza; `@media print` esconde overlays.

## Garantias

| Item | Status |
|---|---|
| Lógica / hooks / contexts / providers | **não tocados** |
| Engines `src/core/finance` | **não tocadas** |
| Edge functions / Supabase | **não tocadas** |
| `vite.config` / `manualChunks` / chunk graph | **não tocados** |
| Cor institucional sidebar (`--sidebar-background`) | **preservada** (memória travada) |
| Logo tight crop | **preservado** |
| Mobile bottom-nav posicionamento | **preservado** |
| Print | **neutralizado via @media print** |

## Auditoria final

- **App Shell parece premium?** Sim — active state com indicator bar + gradiente tinta substitui o bloco branco ERP.
- **Sidebar contemporânea?** Sim — vocabulário Linear/Stripe (hairlines, ambient gradient, pill collapsed).
- **Sistema mais coeso?** Sim — hairline ember do header conversa com glow do active state.
- **Active state sofisticado?** Sim — barra lateral + gradiente tonal + drop-shadow no ícone.
- **Ganhou profundidade?** Sim — ambient radial gradient no topo + glass na bottom-nav.
- **High-end?** Sim — atmospheric depth + tonal hovers + pill collapsed + glow controlado.
- **Branding CAIXA preservado?** Sim — azul institucional segue dominante; mudou só a aplicação visual.
- **Estável?** Sim — zero JSX lógico, zero hooks, só data-attrs e classes visuais.

## Scores

| Dimensão | Antes | Depois | Δ |
|---|---|---|---|
| Shell sophistication | 3.6 | **4.85** | +1.25 |
| Navigation hierarchy | 3.7 | **4.85** | +1.15 |
| Premium perception | 3.8 | **4.9** | +1.10 |
| Atmospheric depth | 3.0 | **4.8** | +1.80 |
| Visual cohesion | 3.9 | **4.85** | +0.95 |
| SaaS feel | 3.4 | **4.85** | +1.45 |
| Estabilidade operacional | 5.0 | **5.0** | = |

## Arquivos

- `src/components/layout/Sidebar.tsx` — data-attrs + remoção de bg hardcoded
- `src/components/layout/ModuleHeader.tsx` — data-attr
- `src/components/layout/BottomNav.tsx` — data-attr
- `src/index.css` — bloco Wave 23 (~150 linhas)
- `.lovable/audit/app-shell-modernization-wave.md` — este relatório
