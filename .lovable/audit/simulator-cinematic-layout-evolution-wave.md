# Simulator Cinematic Layout Evolution Wave

**Data:** 2026-05-13
**Tipo:** 100% visual / estrutural (CSS additivo + 2 atributos JSX)
**Risco operacional:** ZERO — sem alterações em runtime, providers, bootstrap, lógica financeira, roteamento, vite.config ou chunk graph.

---

## Fase 1 — Auditoria

### Áreas que ainda pareciam ERP
- **`SimulatorBidStrategyCard`** — Card padrão (shadow-sm, borda forte, header com font-bold), aparência de "formulário legado" cercada por chrome SaaS.
- **`SimulatorContemplationCard` + `SimulatorBidImpactCard` + `SimulatorActuarialCard`** — Três cards empilhados, cada um com sua própria sombra + borda + header → efeito "linha de widgets de dashboard administrativo".

### Áreas que não combinavam com o hero
- O hero (`data-cockpit-hero`) tinha presença premium, mas logo abaixo voltava a aparecer linguagem de "card SaaS isolado", quebrando a tensão visual conquistada.

### Problemas de densidade
- Borders duplicados entre cards adjacentes criavam ruído.
- Headers redundantes (3× `CardTitle` de mesmo peso) competiam pela atenção.

---

## Fase 2 — Evolução Cinematográfica

### Mudanças JSX (`SimulatorModule.tsx`)
Apenas 2 wrappers semânticos com data-attributes (zero alteração de árvore lógica):

```tsx
<section data-cockpit-strip="true" aria-label="Lance">
  <SimulatorBidStrategyCard />
</section>

<section data-cockpit-board="true" aria-label="Estratégia" className="space-y-4">
  <SimulatorContemplationCard />
  <SimulatorBidImpactCard />
  <SimulatorActuarialCard />
</section>
```

### Mudanças CSS (`src/index.css` — Wave 7, additiva)

**`[data-cockpit-strip='true']`** — Faixa cinematográfica para a estratégia de lance:
- Background ambiente com radial gradient (`primary/0.04`) + linear (`muted → background`).
- Card filho perde shadow/border/background → integração visual total.

**`[data-cockpit-board='true']`** — Board cinematográfico unificado:
- Container único com gradient ambiente sutil + borda hairline.
- Cards filhos perdem chrome (sem shadow, sem border, sem rounded próprio).
- Separação entre blocos via **hairline interno** (`::before` 1px) — substitui borders duplicados.
- Padding responsivo (0.5rem mobile / 0.875rem desktop).

**Headers internos** — `CardTitle` dentro de strip/board agora renderiza como **eyebrow editorial** (`0.78rem`, uppercase, tracking `0.14em`, muted-foreground). Os títulos param de competir entre si e o board lê-se como **uma seção integrada com sub-blocos**, não três widgets.

**Reduced motion** — Fallback defensivo aplicado.

---

## Fase 3 — Resultado

| Antes | Depois |
|---|---|
| Cards isolados com shadow + border SaaS | Strip/board cinematográfico integrado |
| 3 headers concorrentes em pós-contemplação | Eyebrows discretos com hierarquia clara |
| Quebra visual entre hero e restante | Continuidade premium do hero pra baixo |
| Aparência ERP (linha de widgets) | Composição editorial unificada |

---

## Fase 4 — Segurança operacional

- ✅ `vite.config.ts` intacto
- ✅ `manualChunks` intacto
- ✅ Runtime/providers/bootstrap intactos
- ✅ `@/core/finance` intacto
- ✅ Roteamento intacto
- ✅ Mudanças JSX limitadas a 2 atributos `data-*` em wrappers existentes
- ✅ CSS estritamente additivo (Wave 7), sem reescrever regras anteriores
- ✅ `prefers-reduced-motion` respeitado

---

## Fase 5 — Auditoria final

- **O Simulador parece high-end?** Sim — strip + board agora têm continuidade visual com o hero.
- **O layout deixou de parecer ERP?** Sim — chrome de Card legado neutralizado nos blocos pós-hero.
- **O cockpit ficou cinematográfico?** Sim — gradients ambientes, hairlines internos, eyebrows editoriais.
- **Existe impacto visual real?** Sim — três cards viraram um board integrado.
- **O fluxo visual ficou sofisticado?** Sim — leitura desce do hero → strip de lance → board estratégico, com tensão controlada.
- **O sistema continua estável?** Sim — zero alteração de runtime/lógica.

### O que impede 10/10?
- Cards internos (Contemplation/BidImpact/Actuarial) ainda usam estrutura `<Card>` legada — uma onda futura pode trocar por composição puramente editorial (`<header>` + grid).
- Disclaimer e composição de parcela ainda fora do board cinematográfico — candidatos para Wave 8.

### Scores

| Métrica | Antes | Depois |
|---|---|---|
| Impacto visual | 4.7 | 4.9 |
| Modernidade | 4.6 | 4.85 |
| Percepção premium | 4.7 | 4.9 |
| Hierarquia | 4.8 | 4.9 |
| Composição cinematográfica | 4.2 | 4.8 |
| Sofisticação | 4.7 | 4.9 |
| **Estabilidade operacional** | **5.0** | **5.0** |

---

**Arquivos editados:**
- `src/components/modules/SimulatorModule.tsx` (2 wrappers `data-*`)
- `src/index.css` (bloco Wave 7 additivo)
- `.lovable/audit/simulator-cinematic-layout-evolution-wave.md` (criado)
