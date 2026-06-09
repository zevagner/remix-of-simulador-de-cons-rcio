# Onda — Investments & Patrimonial Experience Unification

**Status:** entregue
**Princípio absoluto:** o usuário sente "estou analisando estratégias patrimoniais" — nunca "entrei em outro sistema".
**Decisão estratégica:** NÃO fundir módulos. Unificar apenas a **gramática de experiência** (visual, narrativa, interação).

---

## 1. Diagnóstico (antes da onda)

| Camada | Investments | Patrimonial | Fragmentação |
|---|---|---|---|
| Header de card | Stripe vertical colorido + Crown badge | Gradient suave + icon block + tag | "produtos diferentes" |
| KPIs por card | `ExecutiveKpiStrip` (primary hero + secondary) | Chips planos achatados | Hierarquia visual divergente |
| Tese consultiva | `SCENARIO_TEXTS` em colapso | Apenas bullets "Como funciona" | Patrimonial explicava menos |
| Disclosure | "Ver racional consultivo" (Eye + Chevron) | "Ver trajetória patrimonial" (Chevron) | Comportamento e label divergentes |
| Densidade | Hero number + KPI strip + colapso | Bullets + chips + disclaimer | Patrimonial parecia "mais pobre" |

Resultado perceptivo: **dois produtos costurados**, troca de contexto cognitivo na transição via `ConsultiveBridge`.

---

## 2. Decisões de gramática

1. **Base visual = Patrimonial** (limpo, silencioso, executivo, curado).
2. **Forças preservadas de Investments** (compare mode, scanning rápido, hero number, melhor-pick badge).
3. **Header unificado** via primitive compartilhado `StrategyCardHeader`.
4. **KPI hero promovido** em Patrimonial — mesma gramática `ExecutiveKpiStrip` (primary destacado em `bg-primary/[0.07] border-primary/30`, secondary em chips planos com separador real).
5. **Tese consultiva sempre visível** em Patrimonial (1 linha executiva — silent rationale).
6. **Disclosure label padronizado**: "Ver / Ocultar racional consultivo" + ícone `Eye + Chevron`.

---

## 3. Implementação

### 3.1 Primitive compartilhado

**Criado:** `src/components/modules/shared/StrategyCardHeader.tsx`

- Header `gradient-to-br from-primary/10 via-primary/5 to-transparent` + `border-b border-border/40`.
- Icon block `rounded-lg bg-primary/15 p-2 text-primary`.
- Title `text-base font-semibold` + tag `Badge variant="secondary"`.
- Slots opcionais `leading` (Checkbox) e `trailing` (Crown/Best badge).
- Subtitle 1 linha (`line-clamp-1`) opcional.
- Aceita `LucideIcon` (typeof function) ou `ReactNode` arbitrário.

### 3.2 Patrimonial — adoção da camada executiva

**Editado:** `src/components/modules/patrimonial/strategies.ts`

- Campo novo `thesis: string` por estratégia (1 frase consultiva).
- Campo novo `primaryKpi: PatrimonialKpiKind` por estratégia (KPI protagonista determinístico).
- 6 estratégias atualizadas:
  - Autoquitação · primary `payback` · "O ativo se autossustenta…"
  - Escada Patrimonial · primary `multiplier` · "Várias contemplações distribuídas…"
  - Renda Passiva · primary `roi` · "Renda recorrente complementa…"
  - Construção · primary `multiplier` · "Construir custa menos que comprar pronto…"
  - Multiplicação · primary `multiplier` · "Alavancagem real…"
  - Holding · primary `multiplier` · "Patrimônio estruturado e protegido…"

**Editado:** `src/components/modules/patrimonial/PatrimonialStrategyCard.tsx`

- Adota `StrategyCardHeader` (remove header local hand-rolled).
- Tese consultiva renderizada antes de "Para quem" (silent rationale, sempre visível).
- Bloco KPIs reescrito com mesma gramática do `ExecutiveKpiStrip`:
  - Header "KPIs estimados" + selo "Estimativa" institucional.
  - Primary KPI em hero card destacado com tooltip "KPI protagonista".
  - Secondary KPIs em grid de 2 colunas com separador real.
  - Suprime `preserved` quando `≤ 0` (regra Capital Preserved Relevance).
- Disclosure unificado (`Eye + Chevron`, label "Ver / Ocultar racional consultivo").
- "Como funciona" + trajetória patrimonial migrados para dentro do disclosure (silêncio visual padrão).

### 3.3 Investments — preservado intacto

`InvestmentScenarioCard` mantém:
- Hero number (lucro absoluto + delta percentual).
- `ExecutiveKpiStrip` (já era o referencial executivo adotado).
- Crown "Melhor", Checkbox de seleção, breakdown sub-collapse, IA storytelling.

Nenhuma alteração estrutural — Investments **já era** a referência executiva. A onda traz Patrimonial até esse padrão.

---

## 4. Gramática unificada — matriz final

| Elemento | Padrão único pós-onda |
|---|---|
| Header | `StrategyCardHeader` (gradient + icon block + tag + slots) |
| KPI primary | Hero card `bg-primary/[0.07] border-primary/30`, label uppercase + valor `text-lg font-bold tabular-nums` |
| KPI secondary | Grid 2-col, chips `bg-card/50 border-border/40`, label `text-[9px]` + valor `text-sm` |
| Tese consultiva | 1 frase visível por padrão (`text-xs text-foreground/85`) |
| Disclosure | `Eye + Chevron`, label "Ver / Ocultar racional consultivo" |
| Disclaimer | `text-[10px] italic` no rodapé com border-top sutil |
| Selo institucional | "Estimativa" `text-[9px] uppercase tracking-wider` |

---

## 5. Papéis conceituais preservados

- **Investments** segue orientado a **comparação, liquidez, rentabilidade, decisão executiva**:
  contém compare mode (Checkbox), Crown "Melhor", IA storytelling, breakdown matemático detalhado.
- **Patrimonial** segue orientado a **estruturação, proteção, longo prazo**:
  contém Decision Desk, Timeline Comparator, jornada Aquisição→Legado, trajetória 5/10/15 anos.

A diferença agora é **conceitual**, não visual.

---

## 6. Validações

| # | Critério | Resultado |
|---|---|---|
| 17 | Consistência perceptiva | ✅ Mesmo header, mesmo bloco de KPIs, mesma cadência espacial. |
| 18 | Simplicidade cognitiva | ✅ Disclosure label idêntico, mesma posição de tese, mesma hierarquia. |
| 19 | Clareza consultiva | ✅ Tese consultiva visível em Patrimonial; rationale agora em paridade com Investments. |
| 20 | Premium feel | ✅ Patrimonial agora carrega o KPI hero — densidade executiva sem ruído. |
| — | Performance | ✅ Zero novo motor financeiro, zero IA, zero chart pesado. |
| — | Arquitetura | ✅ Módulos não fundidos. Apenas 1 primitive compartilhado novo. |

---

## 7. Arquivos

- **Criado:** `src/components/modules/shared/StrategyCardHeader.tsx`
- **Editado:** `src/components/modules/patrimonial/strategies.ts` (campos `thesis` + `primaryKpi`)
- **Editado:** `src/components/modules/patrimonial/PatrimonialStrategyCard.tsx` (adoção do header unificado + KPI hero + tese visível + disclosure padronizado)
- **Criado:** `.lovable/audit/investments-patrimonial-experience-unification-wave.md`

---

## 8. Próximas ondas naturais

- Estender `StrategyCardHeader` para `InvestmentScenarioCard` (preserva hero number, refatora apenas o topo) numa onda dedicada com QA visual completo.
- Migrar `PatrimonialDecisionDesk` chips para a mesma gramática KPI primary/secondary.
- Avaliar unificar `ScenarioComparisonChart` (Investments) e `PatrimonialTimelineComparator` numa primitive comum de comparação longitudinal.
