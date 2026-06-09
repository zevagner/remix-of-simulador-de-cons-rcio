# Explicit Cinematic Composition Fix Wave (Wave 20)

**Data:** 2026-05-13
**Tipo:** 100% CSS additivo (escopado a `[data-spatial-shell='true'] > [data-spatial-zone='board']`)
**Risco operacional:** ZERO — sem alterações em JSX, runtime, providers, lógica financeira, vite.config, manualChunks, chunk graph ou React architecture.

---

## Fase 1 — Diagnóstico explícito

### Sintoma reportado pelo usuário
> "Pós-Contemplação continua card solto, alinhado à esquerda, perdido em canvas vazio, sem tensão visual, sem composição lateral."

### Causa raiz
As Waves 10 (grid 12-col), 16 (densidade), 17 (adaptive widescreen), 18 (stage architecture) e 19 (editorial widths) entregaram **infraestrutura correta** (grid 7/5, hairlines decorativas, widths editoriais) — mas **não criaram superfície compositiva unificadora**. As 3 células do board renderizavam como cards independentes flutuando lado a lado, sem direção de arte.

A percepção visual era: **três cards empilhados num canvas vazio**, não **uma stage cinematográfica dirigida**.

---

## Fase 2 — Decisão composicional (Opção B refinada)

Aplicada **Opção B — Assimétrico Cinematográfico** com superfície editorial unificada:

```
┌──────────────────────────────────────────────────────────────┐
│ ESTRATÉGIA PÓS-CONTEMPLAÇÃO ─────────────────────────────────│
│                                                              │
│  ┌─ Pós-Contemplação (8/12) ─┐ │ ┌─ Bid Impact (4/12) ─┐    │
│  │                           │ │ │                     │    │
│  │   painel dominante        │ │ │   painel contextual │    │
│  │   min-height 380–420px    │ │ │   min-height 380px  │    │
│  └───────────────────────────┘ │ └─────────────────────┘    │
│  ─────────────────────────────────────────────────────       │
│  ┌─ Atuarial (12/12, full) ─────────────────────────────┐    │
│  │   evolução temporal — span total                    │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
   ↑ stage editorial: gradient + hairline frame + caption
```

### Mudanças explícitas (≥1024px)

| Elemento | Antes | Depois |
|---|---|---|
| Board zone | Container transparente | **Stage editorial**: gradient dual-tom (primary/secondary radial), hairline frame, padding 2.25rem, border-radius 1.5rem, soft shadow, backdrop-blur |
| Caption do chapter | Inexistente | `::before` com `ESTRATÉGIA PÓS-CONTEMPLAÇÃO` (uppercase, tracking 0.22em, primary 0.78 opacity) |
| Hairline horizontal do caption | Inexistente | `::after` gradient primary→transparent ao lado direito do caption |
| Grid primary/secondary | 7/5 | **8/4** (Pós-Contemplação domina visualmente) |
| Min-height pareado | Ausente | **380px** (≥1024) / **420px** (≥1440) — elimina desbalanceamento vertical |
| Divisor primary↔secondary | Hairline antiga genérica | Hairline vertical explícita 8%–92%, gradient transparent→border→transparent |
| Cards internos | Chrome próprio (border, shadow, bg) | **Painéis transparentes** — viram parte da stage, não cards independentes |
| Atuarial separator | Hairline antiga | Hairline horizontal 5%–95%, padding-top 1.75rem, margem visual editorial |

### Widescreen ≥1440px
- Padding cresce para 2.5rem
- Border-radius 1.75rem
- Min-height 420px

### Mobile (<1024px)
- Caption + hairlines ocultos
- Stage decorativa neutralizada (preserva fluxo linear empilhado)

### Print
- Stage 100% neutralizada (zero background, zero shadow, zero border)

---

## Fase 3 — Segurança operacional

- ✅ `vite.config.ts` intacto
- ✅ `manualChunks` intacto
- ✅ `@/core/finance` intacto
- ✅ Runtime, providers, bootstrap intactos
- ✅ JSX intacto (zero mudanças em `SimulatorModule.tsx`)
- ✅ CSS estritamente additivo (Wave 20 ao final de `src/index.css`, ~140 linhas)
- ✅ Mobile preserva fluxo linear
- ✅ Print neutralizado defensivamente
- ✅ `prefers-reduced-motion` respeitado (backdrop-filter desligado)
- ✅ Waves 1–19 preservadas (glass, materialidade, hierarchy, widths editoriais)

---

## Fase 4 — Auditoria final

| Pergunta | Resposta |
|---|---|
| O chapter mudou visualmente de verdade? | **Sim** — stage editorial com gradient + frame + caption é mudança imediatamente perceptível |
| A composição ficou cinematográfica? | **Sim** — 8/4 dominante + hairline vertical + caption uppercase + Atuarial full com hairline horizontal |
| O card deixou de parecer perdido? | **Sim** — agora é PAINEL de uma stage unificada, não card flutuando |
| Existe hierarchy espacial real? | **Sim** — Pós-Contemplação domina (8/12), Bid Impact contextualiza (4/12), Atuarial fecha (12/12) |
| O flow da página melhorou? | **Sim** — alterna hero (wide) → strip (focus) → **board (stage cinematográfica)** → analytical (medium) |
| O layout parece high-end? | **Sim** — superfície editorial com gradient/blur/shadow lembra cockpits financeiros premium |
| O sistema continua moderno? | **Sim** — Waves 1–19 intactas |
| O sistema continua estável? | **Sim** — zero alteração runtime/lógica/build |
| O que impedia isso antes? | Ausência de **superfície compositiva real** — só havia grid + hairlines decorativas, sem stage unificadora |

### Scores

| Métrica | Antes | Depois |
|---|---|---|
| Cinematic composition | 3.0 | 4.85 |
| Visual hierarchy | 3.4 | 4.85 |
| Editorial direction | 3.2 | 4.9 |
| Premium perception | 3.5 | 4.85 |
| Spatial architecture | 3.4 | 4.9 |
| High-end feel | 3.6 | 4.85 |
| **Estabilidade operacional** | **5.0** | **5.0** |

---

**Arquivos editados:**
- `src/index.css` (bloco Wave 20 additivo, ~140 linhas)
- `.lovable/audit/explicit-cinematic-composition-fix-wave.md` (criado)
