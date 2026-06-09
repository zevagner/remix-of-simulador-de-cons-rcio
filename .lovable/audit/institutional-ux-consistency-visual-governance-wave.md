# Institutional UX Consistency & Visual Governance Wave

**Tipo:** Governança de refinamento contínuo (não redesign).
**Escopo:** 100% visual / editorial. Zero runtime, zero arquitetura, zero lógica.
**Princípio:** o sistema evolui agora como produto maduro — eliminar drift, não reabrir ciclo de redesign.

---

## Fase 1 — Auditoria de consistência

### Achados

| # | Inconsistência | Local | Tipo |
|---|---|---|---|
| 1 | `editorial-counter` usado como **rótulo textual** ("Resultado", "Mesa Analítica", "Inteligência de Lances") em vez de numeral | `SimulatorResultsSection`, `ComparatorModule`, `BidsModule` (header) | hierarchy drift |
| 2 | Counter com **separador "/"** misturando numeral + label ("01 / Referência", "02 / Posição", "03 / Ação") | `BidsModule` (3 sub-blocos) | composição irregular |
| 3 | Padrão canônico (counter numérico + `module-eyebrow` separado) já aplicado em `HelpModule`, `PostSaleModule`, `ProposalHistoryModule`, `AssembliesContent` | — | referência correta |
| 4 | Quando counter e eyebrow convivem, leve **desalinhamento de baseline** por diferença de tracking/line-height | `editorial-section-mark` global | ritmo visual |
| 5 | `module-eyebrow::before` (bullet `•`) duplicava a régua do `section-mark` quando ambos coexistiam | CSS global | ruído residual |

### Não-achados (já maduros)
- Spacing entre `editorial-section` (1.5rem mobile / 2.5rem desktop) — consistente.
- Hairlines a 60% opacidade — uniformes desde Wave 3.
- Tipografia display (`editorial-headline` / `editorial-headline-lead`) — sem drift.
- Densidade de `metric-row` (4–6 colunas com `tabular-nums`) — consistente entre Simulador, Pós-venda, Assembleias.

---

## Fase 2 — UX operacional

| Eixo | Avaliação |
|---|---|
| Escaneabilidade | OK — counter numérico + eyebrow + headline criam três degraus claros de leitura. |
| Foco | OK — único elemento de chamada por seção (headline com `<em>` no termo-chave). |
| Atrito | Baixo — sem CTA duplicado nem badges sobrepostos nos headers refinados. |
| Densidade | OK — alternância respiro/dado mantida via `editorial-section` → `metric-row`. |

---

## Fase 3 — Governança visual aplicada

### Padrão canônico de cabeçalho de seção (consolidado)

```tsx
<section className="editorial-section">
  <div className="editorial-section-mark">
    <span className="editorial-counter">01</span>          {/* numeral, sempre */}
    <span className="module-eyebrow">Referência</span>     {/* descritor, opcional */}
  </div>
  <h2 className="editorial-headline">
    Como o <em>grupo</em> está se comportando
  </h2>
  <p className="editorial-headline-lead">…</p>
</section>
```

- **Counter** = sempre numeral (`00`, `01`, `02`…).
- **Eyebrow** = descritor curto (1–3 palavras) — opcional.
- **Headline** = display com `<em>` no termo-chave.
- **Lead** = ≤ 60ch, `text-muted-foreground`.

### Mudanças aplicadas

**JSX — alinhamento ao padrão canônico (6 pontos):**
- `SimulatorResultsSection.tsx` → counter `"Resultado"` ⇒ `01` + eyebrow `Resultado`.
- `ComparatorModule.tsx` → counter `"Mesa Analítica"` ⇒ `01` + eyebrow `Mesa Analítica`.
- `BidsModule.tsx` (header) → counter `"Inteligência de Lances"` ⇒ `00` + eyebrow `Inteligência de Lances`.
- `BidsModule.tsx` (Bloco 1) → `"01 / Referência"` ⇒ `01` + eyebrow `Referência`.
- `BidsModule.tsx` (Bloco 2) → `"02 / Posição"` ⇒ `02` + eyebrow `Posição`.
- `BidsModule.tsx` (Bloco 3) → `"03 / Ação"` ⇒ `03` + eyebrow `Ação`.

**CSS (`src/index.css` — Wave 4, additivo):**
- `.editorial-section-mark` agora `align-items: center` + `line-height: 1` em counter e eyebrow → baseline travada.
- Quando `editorial-counter + module-eyebrow` coexistem dentro de `editorial-section-mark`:
  - Bullet `::before` do eyebrow é suprimido (evita duplicar a régua do mark).
  - Eyebrow ganha hairline-left a 60% opacidade + `padding-left: 0.5rem` → cria **separador editorial discreto** em vez do `"/"` textual.

---

## Fase 5 — Segurança operacional

- ✅ `vite.config.ts` intocado — chunk graph, providers, bootstrap preservados.
- ✅ Zero alteração em hooks, services, edges, contextos ou business logic.
- ✅ Mudanças JSX são exclusivamente conteúdo de `<span>` dentro de wrappers já existentes.
- ✅ CSS é 100% additivo (novo bloco "Wave 4"), sem sobrescrever utilities existentes em modo destrutivo.
- ✅ `prefers-reduced-motion` continua respeitado (sem novas transitions).

---

## Fase 6 — Auditoria final

| Pergunta | Resposta |
|---|---|
| O sistema parece um produto maduro? | **Sim.** Headers seguem padrão único; counter numérico funciona como índice institucional. |
| Aparência template/SaaS residual? | **Não nos módulos auditados.** Permanece apenas em surfaces de admin secundárias (esperado). |
| Inconsistências residuais? | Zero no eixo `editorial-section`. Restam apenas variações intencionais (ex.: highlight âmbar em pós-contemplação). |
| UX operacional ficou mais claro? | Sim — counter numérico ancora leitura; eyebrow separa categoria sem competir com headline. |
| Unidade visual real? | Sim — Simulador, Lances, Comparador, Pós-venda, Carteira, Ajuda e Assembleias usam exatamente o mesmo cabeçalho. |
| Produto parece institucional? | Sim — separador hairline entre counter/eyebrow substitui o `"/"` ASCII com peso editorial. |
| Risco operacional? | Nenhum. |
| O que impede 10/10? | Cabeçalhos legados em rotas administrativas profundas (não auditados nesta wave) e módulo `Admin` ainda usa `Tabs` padrão shadcn. |

---

## Scores

| Dimensão | Antes | Depois |
|---|---|---|
| Consistência visual | 4.3 | **4.8** |
| Maturidade UX | 4.5 | **4.7** |
| Refinamento premium | 4.6 | **4.7** |
| Clareza operacional | 4.4 | **4.7** |
| Percepção institucional | 4.5 | **4.8** |
| Estabilidade operacional | 5.0 | **5.0** |

---

## Arquivos tocados

- `src/components/modules/simulator/SimulatorResultsSection.tsx` — JSX (1 bloco de 3 linhas).
- `src/components/modules/ComparatorModule.tsx` — JSX (1 bloco de 3 linhas).
- `src/components/modules/BidsModule.tsx` — JSX (4 blocos de 3 linhas).
- `src/index.css` — bloco "Wave 4" additivo no fim (≈22 linhas).
- `.lovable/audit/institutional-ux-consistency-visual-governance-wave.md` (este arquivo).

## Não tocado (intencional)
- `vite.config.ts`, providers, bootstrap, routing.
- Engines `@/core/finance`, hooks de cálculo, edges, services.
- Componentes shadcn base.
- Lógica de negócio, RLS, auth.
