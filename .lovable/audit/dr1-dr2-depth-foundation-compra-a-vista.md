# DR-1 + DR-2 · Depth Foundation + Compra à Vista Flagship

**Plano-mãe:** `.lovable/governance/depth-recovery-plan-v2.md`
**Constituição:** `mem://governance/v2-product-constitution`
**Status:** ✅ EXECUTADO · default ON · reversível

---

## Executive Summary

Primeira prova perceptiva da **Depth Recovery Layer**: estender contratos editoriais do `StrategyBlueprint` (DR-1) e popular **Compra à Vista** como aplicação flagship dentro de `traditional` (DR-2), sem novo módulo, sem nova rota, sem novo dashboard e sem novo componente top-level.

**Resultado:** `ConsultiveStrategyPanel` agora renderiza progressivamente 5 seções novas — todas opcionais, todas collapsed por padrão, todas filhas do drawer já existente. Compra à Vista aparece como **descoberta** no caminho `traditional → Aplicações estratégicas → Compra à Vista → Aprofundar`.

---

## StrategyDepthDrawer Contract

**Decisão arquitetural:** **não criamos** um novo `StrategyDepthDrawer`. O `ConsultiveStrategyPanel` (Layer 2) **já é** o drawer editorial canônico — usa `Sheet` lateral, sticky hero, `Accordion` modular, espaçamento generoso, mobile-first nativo. Criar outro drawer violaria *feature layering* (proibido pela Constituição).

A Depth Recovery Layer **estende** o painel existente com seções modulares novas, mantendo:

| Atributo | Regra |
|---|---|
| **Hierarchy** | Hero → Tese → Accordion modular (existente) → DR-sections (novas, abaixo) |
| **Spacing** | `space-y-5` (body), `space-y-1.5` (accordion), `py-2.5` (item) — mantido |
| **Disclosure** | `Accordion type="multiple"` · novas seções **fora do default `openSections`** |
| **Responsividade** | `w-full sm:max-w-xl` — mobile ocupa 100%, desktop drawer lateral |
| **Mobile** | Scroll vertical único, sem grid lateral, sem swipe horizontal |
| **Loading** | Zero — conteúdo estático do blueprint, render síncrono |
| **Typography** | `text-xs`/`text-sm` consistente; eyebrows `uppercase tracking-wide` |
| **Ritmo editorial** | Separadores apenas onde já existem; sem novos dividers |

---

## Depth Content Schema (DR-1)

Estendido em `src/components/modules/strategy-v2/contracts.ts` — **todos os campos opcionais**, zero quebra retroativa:

### Novos tipos

```ts
StrategyApplication {
  id, title, pitch, whenToUse, benefits[≤3],
  whenNotToUse?[≤3], commonMistakes?[≤3], example?,
  relatedStrategyIds?
}

StrategyArchetype {
  id, persona, context
}
```

### Novos campos em `ConsultiveContent`

| Campo | Tipo | Limite | Propósito |
|---|---|---|---|
| `applications?` | `StrategyApplication[]` | **máx 3** | Substantivos comerciais ancorando a tese |
| `archetypes?` | `StrategyArchetype[]` | **máx 4** | Personas + cenários consultivos |
| `whenNotToUse?` | `string[]` | **máx 4** | Adequação inversa (riscos de fit) |
| `patrimonialImpact?` | `string[]` | **máx 4** | Leverage / liquidez / crescimento |
| `relatedStrategyIds?` | `string[]` | livre | Cross-links discretos (não cards) |

### Decisão de NÃO incluir

Da lista de ~20 campos do briefing, **rejeitamos explicitamente** (density creep):

- `mindsetConsultivo`, `observacoesEstrategicas`, `timingIdeal`, `combinacoesAvancadas`, `impactoLiquidez`/`impactoPatrimonial`/`leveragePotencial` separados, `operacoesRelacionadas` (já coberto por `relatedStrategyIds`).

Motivo: campos redundantes ou já cobertos por `idealMoment`, `pitch`, `patrimonialImpact` consolidado, `examples`. Constituição: *"simples mesmo ficando mais profunda"*.

---

## Editorial Rules (frozen)

| Regra | Limite |
|---|---|
| Aplicações simultâneas por tese | **≤ 3** (slice no render) |
| Benefícios por aplicação | **≤ 3** chips, ≤ 8 palavras |
| Arquétipos por tese | **≤ 4** (slice no render) |
| Texto simultâneo visível | Hero + Tese sempre; resto **collapsed** |
| Cross-links | Chips com ícone, **nunca cards duplicados** |
| Aprofundamento da aplicação | `<details>` nativo "Aprofundar" — when-not/erros/cenário só sob demanda |
| Default open sections | Inalterado: `['howItWorks', 'forWho', 'pitch']` — DR-sections começam **fechadas** |

---

## Governance Rules (anti-regressão)

| Proibição | Enforcement |
|---|---|
| ❌ Novo módulo / rota / sidebar | Nenhum arquivo `*Module.tsx` criado |
| ❌ Novo drawer paralelo | Reuso do `ConsultiveStrategyPanel` |
| ❌ Novo dashboard / grid | Lista vertical única dentro do drawer |
| ❌ Badge "novo" / cor de destaque | `highlight` reusa `border-primary/30 bg-primary/[0.03]` já existente |
| ❌ Cálculo dedicado | Conteúdo 100% estático no `blueprint.ts` |
| ❌ Mais de 3 aplicações | `slice(0, 3)` no `ApplicationList` |
| ❌ Compare regression | `CompareWorkspace` intocado; aplicações NÃO entram em `selectedIds` |
| ❌ Hierarchy collapse | Tese principal continua hero; aplicações são descoberta |

Toda regra acima é verificável por leitura dos diffs desta onda.

---

## Compra à Vista Implementation (DR-2)

Conteúdo populado em `STRATEGY_BLUEPRINTS['traditional'].consultive`:

### `patrimonialImpact` (4 bullets)
- Adquire patrimônio físico sem comprometer reservas próprias
- Preserva liquidez para custo de oportunidade — caixa segue produtivo
- Captura valorização sobre o valor cheio do bem, não sobre a entrada
- Substitui juros bancários por taxa de administração — leverage real

### `applications[0]` — **Compra à Vista** (flagship)

| Campo | Conteúdo |
|---|---|
| **Pitch** | Acelera a aquisição patrimonial sem descapitalizar — a carta entra como recurso à vista e o cliente preserva caixa próprio para oportunidades, reserva e arbitragem. |
| **Quando** | Cliente com objetivo definido (imóvel, terreno, veículo, expansão) que valoriza poder de barganha e não pode — ou não quer — descapitalizar agora. |
| **Benefícios** | Poder de negociação de pagador à vista · Preservação de caixa próprio · Antecipação patrimonial sem juros |
| **Quando NÃO** | Cliente impulsivo · Pressão imediata de fluxo · Lance agressivo que descapitaliza reserva |
| **Erros comuns** | Tratar carta como dinheiro novo · Lance impulsivo · Comprar bem não-decidido |
| **Cenário** | Cliente fecha imóvel de R$ 600 mil com desconto à vista, mantém R$ 300 mil próprios aplicados a CDI e financia o consórcio sem juros. |
| **Relacionadas** | `multiplicacao-ativos`, `quick-contemplation` |

### `applications[1]` — Reforma & Ampliação · `applications[2]` — Upgrade de Veículo

Aplicações secundárias com pitch + whenToUse + 3 benefícios + `relatedStrategyIds` (sem `<details>` aprofundar, pois não precisam ainda — DR-4 expande).

### `archetypes` (3 personas)
Família · 1º imóvel — Empresário — Investidor defensivo.

### `relatedStrategyIds` (top-level)
`multiplicacao-ativos`, `quick-contemplation`, `construcao-inteligente`.

---

## Strategic Narrative Validation

| Critério consultivo | Atendido? |
|---|---|
| Leverage patrimonial explícito | ✅ `patrimonialImpact[3]` |
| Preservação de liquidez | ✅ pitch + `patrimonialImpact[1]` |
| Arbitragem temporal (caixa próprio segue produtivo) | ✅ `example` |
| Poder de negociação | ✅ `benefits[0]` |
| Custo de oportunidade | ✅ `patrimonialImpact[1]` |
| Aceleração de aquisição | ✅ pitch |
| Descapitalização inteligente vs impulsiva | ✅ `whenToUse` × `whenNotToUse[2]` |
| Fluxo vs patrimônio | ✅ `whenNotToUse[1]` |
| Consórcio como instrumento de alocação | ✅ `commonMistakes[0]` ("é alocação, não receita") |
| Tom institucional (sem promessa) | ✅ herda `INST_DISCLAIMER` |

---

## Mobile Validation

- `Sheet side="right"` ocupa `w-full` em mobile (≤640px), `sm:max-w-xl` desktop
- `Accordion` Radix — touch nativo, sem JS de gesture
- `<details>` "Aprofundar" — semântica nativa, 44px+ tap target via `cursor-pointer`
- Chips `text-[10px]` com `gap-1` — não quebram em telas estreitas (flex-wrap)
- Scroll vertical único; **zero scroll horizontal** introduzido
- Lista de aplicações: cards `px-3 py-2.5` — densidade leve, não comprime conteúdo
- Default sections collapsed → mobile não recebe paredão na abertura

---

## Hierarchy Preservation Validation

| Nível | Antes | Depois |
|---|---|---|
| **L0** Hero (KPI + tag) | Mantido | Mantido |
| **L1** Tese principal | Sempre visível | Sempre visível |
| **L2** Como funciona / Para quem / Pitch | Default open | Default open |
| **L3** Benefícios / Riscos / Objeções / Erros / Exemplos | Closed | Closed |
| **L4** *(novo)* Impacto patrimonial / Aplicações / Quando-não / Arquétipos / Relacionadas | — | **Closed** |
| **L5** *(novo)* Por aplicação: when-not / erros / cenário | — | **`<details>` Aprofundar** |

Profundidade emerge em 3 cliques: drawer → "Aplicações estratégicas" → "Aprofundar". Hierarquia escalonada, scanning preservado.

---

## Anti-Chaos Validation

| Risco V1 | Status |
|---|---|
| Card explosion | ❌ não criado (lista vertical dentro de drawer) |
| Dashboard paralelo | ❌ zero novo surface |
| Grid denso | ❌ máx 3 aplicações em coluna única |
| Múltiplos drawers | ❌ reuso do existente |
| Module isolation | ❌ Compra à Vista vive **dentro** de `traditional`, não como tese paralela |
| Density creep | ❌ DR-sections default-closed; aplicações com chip + pitch curto |
| Compare regression | ❌ `CompareWorkspace`, `CompareSelectionContext`, `COMPARE_MAX=3` intocados |
| Hero do drawer | ❌ inalterado byte-a-byte |

---

## Risks Avoided

1. **"Mais um card patrimonial"** — Compra à Vista não vira tese top-level; é aplicação descoberta dentro de `traditional`.
2. **Text wall consultivo** — todo conteúdo aprofundado fica em `<details>` ou `Accordion` collapsed; abertura sempre escalonada.
3. **Conteúdo redundante** — não duplicamos `forWho`/`risks`/`idealMoment`; as aplicações **estendem**, não repetem.
4. **Acoplamento ao Compare** — aplicações **não** participam de `selectedIds`. Compare segue 3 teses-mãe; aplicações são leitura editorial.
5. **Densidade mobile** — limites editoriais (≤3 aplicações, ≤3 benefícios) verificados no render via `slice`.
6. **Drift de tom** — `disclaimer` herdado, `INST_DISCLAIMER` único, zero promessa de retorno.

---

## Final Verdict

✅ **DR-1 · APROVADO** — contratos opcionais, zero quebra retroativa, schema editorial documentado.
✅ **DR-2 · APROVADO** — Compra à Vista flagship consultivamente densa em **um único caminho de descoberta**.
✅ **5 reviews da Constituição V2 atendidos** — perceptual, hierarchy, mobile, consultive, anti-regression.
✅ **0 áreas locked violadas** — `core/finance/*`, `WealthPlatformModule`, `CompareWorkspace`, `intents.ts` intactos.

**Próximas ondas sugeridas (não executadas):**
- **DR-3:** Telemetria leve `depth_application_opened` + `depth_aprofundar_opened` (opt-in, sem PII)
- **DR-4:** Popular Energia Solar em `autoquitacao` · Renovação de Frota em `escada-patrimonial` · arquétipos Agro/Pesados em `multiplicacao-ativos`
- **DR-5:** Cross-links navegáveis (scroll-to-card via `selectedIds` reverso)

**Reversibilidade:** remover os 5 novos blocos de `applications/archetypes/whenNotToUse/patrimonialImpact/relatedStrategyIds` em `blueprint.ts` + os 3 subcomponentes + 5 `ModuleItem` no painel devolve o estado V2 byte-a-byte.
