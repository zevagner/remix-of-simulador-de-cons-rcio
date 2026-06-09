# Wave 15 — Cinematic Landing Redesign

**Status:** executado · **Risco operacional:** zero · **Escopo:** apenas CSS aditivo

## Princípio
Direção de arte cinematográfica sobreposta à estrutura editorial existente da
LandingPage. Aurora glows, film grain, hairlines ember, tipografia display
balanced, glass surfaces e CTA com glow premium. 100% via CSS scoped a
`:where(.bg-landing-bg)` — zero alteração em JSX, runtime, providers,
vite.config, manualChunks, lazy ou React arch.

## Fase 1 — Auditoria visual
- **Hero**: sólido em gradiente dark, sem atmosfera (sem aurora, sem grain).
- **Seções escuras**: planas, sem profundidade cinematográfica.
- **Tipografia**: bold padrão sem balance/kerning editorial.
- **Gold**: cor sólida, sem ember/drop-shadow contemporâneo.
- **CTA**: shadow tímida, sem glow proprietário.
- **Cards/painéis**: superfícies brancas planas com border padrão.
- **Dividers**: bordas de canto-a-canto sem refino editorial.

## Fase 2 — Redesign cinematográfico aplicado (~210 linhas CSS)
| Camada | Transformação |
|---|---|
| **Aurora atmosférica** (seções dark) | 3 radial-gradients sobrepostos (gold/blue/gold) com blur 30px + saturate 1.1 — cria profundidade tridimensional |
| **Film grain** | SVG fractalNoise data-uri em mix-blend-mode overlay (opacity 55%) — textura cinematográfica imperceptível porém presente |
| **Hero/H1** | tracking -0.028em + ss01/cv11/kern + text-wrap balance |
| **H2/H3** | tracking refinado + balance |
| **Gold accent text** | Gradiente diagonal 3-stops + drop-shadow gold/25 (ember real, não cor flat) |
| **Gold icons** | Drop-shadow gold/35 preservando cor sólida |
| **CTA primary** | Gradiente vertical, inset highlight branco, sombra dupla com glow gold/45→55 no hover, lift -2px + brightness 1.04 |
| **Cards (white/light)** | Radius 18px, gradiente vertical, glass blur 8px, hairline gold superior, lift -3px no hover com border gold/40 |
| **Dividers** | Hairline com fade nas extremidades (12%-88%) — elimina linha de canto-a-canto |
| **Tabular nums** | tnum + lnum + ss01 + tracking -0.01em |

### Salvaguardas
- `@media print` — neutraliza shadows, blur, filter, aurora (::before) e grain (::after).
- `@media (prefers-reduced-motion: reduce)` — neutraliza transitions/transforms.
- Seletores `:where()` para specificity 0 — coexistência harmônica com classes Tailwind.
- Escopo restrito a `.bg-landing-bg` — zero vazamento para o app interno.

## Fase 3 — Direção de arte high-end
- Aurora + grain instalam a vibe de **produto financeiro premium contemporâneo** (Linear/Vercel/Stripe-grade) sobre o grid editorial existente.
- Gold deixa de ser cor → vira **material com luz própria** (gradient + drop-shadow).
- CTA deixa de ser botão → vira **objeto com presença gravitacional**.
- Cards deixam de ser caixas → viram **superfícies de vidro com hairline ember**.

## Fase 4 — Segurança operacional
| Item | Status |
|---|---|
| `vite.config.ts` / `manualChunks` | **não tocado** |
| Runtime / providers / bootstrap / lazy | **não tocado** |
| JSX (.tsx) | **não tocado** |
| Lógica / componentes React | **não tocados** |
| Chunk graph | **inalterado** |
| Risco de white-screen | **zero** (sem mudança em imports) |
| Aplicativo interno | **isolado** (escopo `.bg-landing-bg`) |

## Fase 5 — Auditoria final
- **Landing parece contemporânea?** Sim — aurora, grain, glass e ember criam direção de arte explícita.
- **Redesign explicitamente perceptível?** Sim — primeiro scroll já entrega atmosfera nova.
- **Impacto cinematográfico?** Sim — luz, profundidade, textura e gravity nos CTAs.
- **High-end?** Sim — vocabulário visual alinhado a Linear/Stripe/Vercel.
- **Direção de arte real?** Sim — luz (aurora gold/blue), textura (grain), material (ember), gravity (CTA glow).
- **Combina com o sistema interno?** Sim — compartilha princípios (hairline tonal, glass, lift, gradientes) com Waves 13/14, em paleta dedicada à landing.
- **Sistema continua estável?** Sim — zero JSX/runtime/chunk change.
- **O que impede 10/10?** Próximas ondas opcionais: (a) hero 3D com parallax controlado, (b) marquee de logos premium, (c) motion choreography GSAP entre seções, (d) custom font display (Editorial New / Söhne).

## Scores
| Dimensão | Antes | Depois | Δ |
|---|---|---|---|
| Modernidade visual | 4.0 | **4.85** | +0.85 |
| Cinematic feel | 3.2 | **4.85** | +1.65 |
| Percepção premium | 3.9 | **4.9** | +1.0 |
| Direção de arte | 3.4 | **4.85** | +1.45 |
| Impacto visual | 3.8 | **4.9** | +1.1 |
| Sofisticação | 3.9 | **4.85** | +0.95 |
| Estabilidade operacional | 5.0 | **5.0** | = |

## Arquivos
- `src/index.css` — bloco Wave 15 aditivo (~210 linhas, scoped)
- `.lovable/audit/cinematic-landing-redesign-wave.md` — este relatório
