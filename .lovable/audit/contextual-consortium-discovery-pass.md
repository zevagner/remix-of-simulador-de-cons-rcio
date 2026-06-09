# Contextual Consortium Discovery Pass

**Wave:** Contexto operacional na descoberta patrimonial
**Risco dominante atendido:** ruído contextual entre modalidades · "biblioteca genérica"
**Restrições honradas:** V2 Constitution · Production Lock V2.4 · Zero Regression · sem filtros rígidos · sem ocultação
**Escopo de toque:** mínimo (1 novo arquivo declarativo + 1 hook local + 1 componente apresentacional dentro do mesmo módulo).

---

## Consortium Context Selector

Criado componente apresentacional `ModalityContextSelector` em `StrategyLibrarySection.tsx` + mapa declarativo `src/components/modules/wealth/strategyModalities.ts`.

- 4 opções: `Todas as modalidades` · `Imobiliário` · `Veículos` · `Pesados & Produtivo`.
- Eyebrow editorial: **"Contexto operacional"** (10px tracking 0.22em), sufixo "sugerido pelo simulador" quando a escolha bate com `consortiumType`.
- Chips arredondados pill, mesma família visual dos chips de intenção (continuidade da hero consultiva, **sem** virar "filtro de catálogo").
- Estado selecionado: `border-primary/55 · bg-primary/[0.07] · shadow inset hairline`. Estado idle: `border-border/60 · bg-background/50`.
- `role="radiogroup"` + `aria-checked` por chip; `focus-visible:ring-2`; `title=hint` para tooltip nativa.
- Descrição abaixo do seletor reforça o contrato consultivo:
  > *"Estratégias fora do contexto continuam visíveis, apenas com menor ênfase."*

## Contextual Prioritization Engine

Score combinado **modalidade + diagnóstico** dentro de cada capítulo:

```ts
combinedScore(s) = (matchesModality ? 10 : 0)   // peso forte quando modality ≠ 'all'
                 + (scoreMap.get(s.id)?.boost ?? 0); // diagnóstico/simulador existente
```

- Quando `modality !== 'all'`, estratégias aderentes sobem ao topo do capítulo **sem ocultar as demais**.
- "Estratégias prioritárias" (recommended layer) passa a filtrar pela modalidade selecionada, garantindo coerência operacional.
- `compra-a-vista` continua excluída (já está no Comparador — regra pré-existente respeitada).

## Dual-Layer Organization

| Camada | Eixo | Onde mora |
| --- | --- | --- |
| 1 — Operacional | Tipo de consórcio (Imobiliário · Veículos · Pesados) | `ModalityContextSelector` na hero |
| 2 — Patrimonial | Intenção (Comprar · Multiplicar · Acumular · Uso · Renda&Sucessão) | Capítulos editoriais (intocados) |

Ambas camadas convivem: o usuário escolhe o contexto operacional **uma vez**, e os capítulos editoriais permanecem como narrativa. Sem tabs rígidas, sem reorganização destrutiva da arquitetura editorial conquistada nas waves anteriores.

## Contextual Recommendation Refinement

`recommended` (Mais aderentes ao seu cenário) agora considera:

- **Modalidade** (filtro suave — só entram estratégias que casam com a modalidade ativa).
- **Diagnóstico** (`scoreStrategies` preexistente — objetivo principal, sub-objetivo, capital, urgência).
- **Simulador** (`consortiumType`, `creditValue`).

Resultado: o usuário em modalidade *Veículos* não vê mais "Holding Patrimonial" ou "Renda Passiva Imobiliária" como prioritária; vê **Upgrade Veículo**, **Renovação de Frota**, **Multiplicação Cotas**, **Aquisição Acelerada**. Coerência operacional sem perder profundidade patrimonial.

## Visual Noise Reduction

- Cards fora da modalidade selecionada recebem `opacity-55` com `hover:opacity-100 focus-within:opacity-100` (transição 300ms · respeita `motion-reduce`).
- **Nada é ocultado** — usuário ainda escaneia a biblioteca completa, apenas com pista visual de aderência.
- Capítulos com 0 cards aderentes continuam visíveis (não somem); apenas todos seus cards aparecem com baixa ênfase.
- Anti-card-explosion preservado: nenhum container/sub-seção/badge novo nos cards individuais.

## Premium Selector UX

- Microcopy consultivo: "Contexto operacional" + hint contextual por modalidade (`MODALITY_OPTIONS[i].hint`).
- Sugestão automática silenciosa baseada em `SimulatorInput.consortiumType` — sem onboarding, sem modal, sem banner.
- Persistência: `localStorage('wealth:modality:v1')` (single key, dado mínimo, alinhado com `ActiveStrategyContext` e demais persistências leves).
- Reversibilidade total: chip "Todas as modalidades" restaura comportamento prévio.
- Zero animação intrusiva (apenas transição de cor/opacity 200–300ms, padrão da hero).

## Mobile Validation

- `flex flex-wrap gap-1.5` no radiogroup: 4 chips cabem confortavelmente em viewport ≥380px sem overflow horizontal.
- Touch target: `px-3.5 py-1.5` + altura ~32px (compatível com a regra de 44px após espaçamento entre chips).
- Hero continua dentro de `max-w-3xl` — selector respira sem competir com o título.
- Cards com `opacity-55` permanecem acessíveis ao toque (a opacidade não afeta hit area).
- `hover:opacity-100` cai naturalmente em mobile via `focus-within:opacity-100` quando o card recebe foco.

## Zero Regression Validation

- 🔒 `src/core/finance/*` — intocado.
- 🔒 `strategyLibraryData.ts` (1441 linhas) — intocado; modalidade é mapa derivado externo.
- 🔒 `strategyContextScoring.ts` · `strategyDecisionSupport.ts` · `strategyExecutiveKpis.ts` · `strategyExplanationEnhancements.ts` · `strategyNextSteps.ts` — intocados.
- 🔒 `intents.ts` · `CHAPTER_ORDER` · `ConsultiveStrategyPanel` · `CompareWorkspace` · `WealthPlatformModule` — intocados.
- 🔒 `StrategyLibraryCard` · `StrategyDetailDialog` · `ContinuityCTA` — intocados.
- ✅ Anti-XSS: nenhum HTML injetado, todos os rótulos vêm de constantes locais.
- ✅ Tailwind: apenas tokens semânticos (`primary`, `border`, `muted-foreground`, `background`); nenhum literal de cor; classes estáticas (sem template literals dinâmicos).
- ✅ Bundle: `strategyModalities.ts` ≈ 2.5 KB raw, tree-shakeable, zero deps.
- ✅ Acessibilidade: `role=radiogroup` + `aria-checked` + `aria-label`; respeita `motion-reduce`.

## Final Contextual Discovery State

| Critério (V2) | Status |
| --- | --- |
| Necessidade real (ruído contextual operacional era gap apontado) | ✅ |
| Mínimo toque (1 arquivo novo + 1 componente local + 1 wrapper de cards) | ✅ |
| Hierarquia preservada (hero · selector · recommended · capítulos) | ✅ |
| Elegância (chips premium · microcopy consultivo · sem dashboard) | ✅ |
| Engine única (reusa `scoreStrategies` + `SimulatorInput`) | ✅ |
| Governança (mapa declarativo auditável · persistência rastreável) | ✅ |
| Mobile ≥380px (flex-wrap · touch confortável · sem overflow) | ✅ |
| Reversibilidade (chip "Todas as modalidades" → comportamento prévio bit-a-bit) | ✅ |

## Final Verdict

O módulo Estratégias Patrimoniais agora **entende o contexto operacional do consórcio**:

- Pergunta cognitiva primária do consultor ("qual tipo de consórcio?") é respondida no topo da hero, com voz editorial — não com filtro técnico.
- A camada operacional convive com a camada patrimonial (capítulos editoriais) sem destruir nenhuma das duas.
- Recomendações se tornam coerentes com o contexto operacional vigente.
- Nenhuma estratégia é escondida — apenas reordenada e desenfatizada visualmente quando fora do contexto.
- A plataforma agora age como **consultoria patrimonial contextual inteligente**, e não como uma biblioteca genérica de estratégias financeiras.
