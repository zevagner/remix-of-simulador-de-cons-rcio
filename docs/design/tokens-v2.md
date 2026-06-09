# Design System v2 — Tokens `--ds-*`

Camada introduzida na **Onda 1** da modernização visual. Convive com tokens
legados (`--landing-*`, `--sidebar-*`, etc.) — **não os substitui ainda**.

## Filosofia

- Tokens **semânticos** (não cor crua): `surface`, `text-display`, `border`, etc.
- Todas as cores em **HSL**, sem `hsl()` no token (consumir via `hsl(var(--ds-*))`).
- Sombras, raios, easing e duração também tokenizados.
- Cada onda futura **consome** esses tokens em vez de criar novos.

## Categorias

### Surfaces
| Token | Uso |
|---|---|
| `--ds-surface` | Fundo padrão de página/card |
| `--ds-surface-soft` | Bandas alternadas, hover sutil |
| `--ds-surface-elevated` | Modais, popovers |
| `--ds-surface-inverse` | Seções escuras (hero, CTA dramático) |

### Borders
| Token | Uso |
|---|---|
| `--ds-border` | Hairlines padrão |
| `--ds-border-strong` | Separadores de seção |

### Texto
| Token | Uso |
|---|---|
| `--ds-text-display` | H1/H2 grandes |
| `--ds-text-title` | H3/H4, títulos de card |
| `--ds-text-body` | Texto corrido |
| `--ds-text-muted` | Legendas, descrições secundárias |
| `--ds-text-caption` | Eyebrows, metadata |

### Accent
| Token | Uso |
|---|---|
| `--ds-accent` | Dourado primário (CTA, destaques) |
| `--ds-accent-deep` | Hover de CTA |
| `--ds-accent-soft` | Backgrounds de badge/halo |

### Sombras
- `--ds-shadow-sm` — cards estáticos
- `--ds-shadow-md` — cards em hover, popovers
- `--ds-shadow-lg` — modais, CTA dramático
- `--ds-shadow-glow` — destaques dourados

### Raios
- `--ds-radius-sm` (8px) — botões pequenos
- `--ds-radius-md` (12px) — inputs, badges
- `--ds-radius-lg` (20px) — cards
- `--ds-radius-xl` (28px) — stages, mockups, CTA full-bleed

### Movimento
- `--ds-ease-out` — padrão (entrada, hover)
- `--ds-ease-spring` — micro-interações lúdicas
- `--ds-dur-fast` (180ms) — hover, focus
- `--ds-dur-base` (320ms) — entrada de card, abrir accordion
- `--ds-dur-slow` (560ms) — hero, transições de página

## Como usar

```css
.meu-card {
  background: hsl(var(--ds-surface));
  border: 1px solid hsl(var(--ds-border));
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-sm);
  transition: box-shadow var(--ds-dur-base) var(--ds-ease-out);
}
.meu-card:hover { box-shadow: var(--ds-shadow-md); }
```

## Roadmap

- **Onda 1 (atual):** tokens criados, usados pela landing v2.
- **Onda 4:** App shell (sidebar, bottom nav, header) consome.
- **Onda 5–6:** módulos consomem.
- **Onda 8:** legacy removido.
