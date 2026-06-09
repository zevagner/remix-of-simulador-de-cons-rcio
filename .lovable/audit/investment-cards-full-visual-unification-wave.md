# Investment Cards Full Visual Unification Wave

**Data:** 2026-05-15 · **Owner:** Investimentos / Engenharia Patrimonial · **Tipo:** UX/Visual unification (zero motor financeiro)

---

## 1. Objetivo

Eliminar a fragmentação perceptiva entre **Investimentos** e **Engenharia Patrimonial** adotando o **Patrimonial como sistema visual mestre** e refazendo os cards de Investimentos para seguirem **a mesma gramática, hierarchy, cadence e ritmo editorial**.

> **Princípio absoluto:** o usuário precisa sentir _"estou dentro da mesma plataforma consultiva"_, não _"entrei em outro módulo"_.

---

## 2. Diagnóstico (estado anterior)

| Sintoma em Investimentos | Causa raiz visual |
|---|---|
| Sensação de **dashboard comparativo** | Faixa lateral colorida (`absolute w-1 h-full ${color}`) |
| Hero **agressivo** | Lucro `text-2xl`, ícone de seta forte, badge "X dominante" no topo |
| Múltiplas **microhierarquias** | Hero label + dominante badge + microline + KPI strip header |
| Floating **Crown badge** sobreposto | `absolute top-2.5 right-2.5 z-10` desconectado do header |
| Spacing **espremido** | Padding `px-4 pt-3.5 pb-3` + `mt-3` extras quebrando ritmo |
| Compare mode visualmente **separado** | Checkbox solto antes do ícone, sem âncora institucional |
| Disclaimer **flutuante** sem pé | Texto `Resultados estimados…` solto no meio do fluxo |

Em paralelo, o **PatrimonialStrategyCard** já entregava: header unificado com gradiente suave, tese silenciosa, KPI block calmo (hero + grid 2-col), disclosure padronizado e disclaimer no pé — em ritmo editorial premium.

---

## 3. Decisão estratégica

Adotar **Patrimonial como base visual oficial**. Investimentos é refeito para herdar **exatamente** a mesma gramática:

```text
┌──────────────────────────────────────────────────┐
│ ☑  [icon]  Título da estratégia    [Tag]  [Best] │  ← StrategyCardHeader
├──────────────────────────────────────────────────┤
│  Tese consultiva — silent rationale (1-2 linhas) │  ← sempre visível
│  ──────────────                                  │
│  ┌─ Lucro & KPIs estimados        Estimativa ─┐  │
│  │ ┌─ LUCRO ESTIMADO          +R$ X (+Y%) ─┐  │  │  ← KPI hero único
│  │ └────────────────────────────────────────┘  │  │
│  │ ┌─ ROI ─┐ ┌─ TIR ─┐ ┌─ PB ─┐ ┌─ MULT ─┐    │  │  ← grid 2-col
│  │ │ 18%   │ │ 14%   │ │ 36m  │ │ 1.8×   │    │  │
│  │ └───────┘ └───────┘ └──────┘ └────────┘    │  │
│  │                       R$ X → R$ Y           │  │  ← microline calma
│  └──────────────────────────────────────────────┘  │
│                                                  │
│  👁 Ver racional consultivo            ▾         │  ← disclosure
│                                                  │
│  ─ Resultados estimados. Sem garantia de retorno │  ← disclaimer pé
└──────────────────────────────────────────────────┘
```

---

## 4. Execução

### A. Remoções (eliminar dashboard feel)

- **Faixa lateral colorida** (`absolute top-0 left-0 w-1 h-full`) → eliminada.
- **Hero `text-2xl`** com ícone de seta + percentual destacado → substituído por bloco KPI calmo.
- **Badge "X dominante"** no topo do hero → removido (poluição de microhierarquias).
- **Crown floating badge** sobreposto absoluto → integrado ao slot `trailing` do header.
- **Mt-3 extras** entre hero/strip → padding único, ritmo coerente.

### B. Adoções (gramática Patrimonial)

- **`StrategyCardHeader`** unificado: `leading=Checkbox`, `icon=scenario.icon`, `title`, `tag` (derivada da `category`), `trailing=Badge "Melhor"` quando aplicável. Compare mode e best-pick **viram estado natural do card**, não features sobrepostas.
- **Tese silenciosa** sempre visível (`scenario.shortDesc` em `text-xs text-foreground/85`).
- **Bloco KPI único** com a mesma assinatura visual do Patrimonial:
  - Header `Lucro & KPIs estimados` + chip `Estimativa`.
  - **Hero KPI** = `Lucro estimado` (single source of truth: `scenario.absoluteGain`) em bloco `bg-primary/[0.07] border-primary/30`, label uppercase + valor `text-lg`.
  - **Secundários** = ROI / TIR / Payback / Multiplicador / Preservado em grid 2-col, mesma estilização das chips patrimoniais.
  - Microline `investido → final` em `text-[10px]` alinhada à direita — informa sem competir.
- **Disclosure** `Eye + Chevron` com label exato `Ver/Ocultar racional consultivo`.
- **Disclaimer institucional** no pé do card (`mt-auto … border-t border-border/30`).

### C. Preservações (não-negociáveis)

| Pilar | Preservação |
|---|---|
| **Compare mode** | Checkbox no `leading` slot do header — selecionável, com `ring`/`border-primary/60` no estado ativo. |
| **Best pick** | Badge "Melhor" mantida, agora ancorada ao header (slot `trailing`). |
| **Scanning executivo** | Grid 2-col de KPIs + hero único permitem comparação coluna-a-coluna lateral. |
| **Profundidade consultiva** | 100% do conteúdo expansível preservado (sale alerts, tese AIDA, rental flow, premissas, IA storytelling, breakdown). |
| **Motores financeiros** | Zero alteração em `@/core/finance`, `useInvestmentCalculations`, `deriveScenarioExecutiveKpis`. Card é **consumer puro**. |
| **Tipagem** | Props inalteradas — `InvestmentModule` e `InvestmentPrintBlock` continuam funcionando sem mudança. |
| **Aderência CAIXA** | Tokens semânticos (`primary`, `success`, `destructive`, `muted`) — zero hex direto, zero cor hardcoded. |
| **Performance** | Sem libs novas, sem charts, sem state extra; mesmo `animate-fade-in` já em uso. |

---

## 5. Matriz de equivalência visual

| Elemento | Patrimonial | Investimentos (antes) | Investimentos (agora) |
|---|---|---|---|
| Header | `StrategyCardHeader` | hero in-card customizado | **`StrategyCardHeader`** |
| Identificador secundário | tag chip | category implícita | **tag chip** (derivada de `category`) |
| Seleção | n/a | checkbox flutuante | **checkbox no leading slot** |
| Best-pick | n/a | crown absoluta `z-10` | **badge no trailing slot** |
| Resultado dominante | KPI primary block | hero `text-2xl` com seta | **KPI primary block (Lucro estimado)** |
| KPIs secundários | grid 2-col em chips | strip horizontal compacta | **grid 2-col em chips** |
| Tese consultiva | sempre visível + bullets no expand | só no expand (`SCENARIO_TEXTS`) | **silent rationale + bullets no expand** |
| Disclosure | "Ver/Ocultar racional consultivo" | "Ver/Ocultar racional consultivo" | **idêntico** |
| Disclaimer | pé do card, italic, border-t | flutuante no fluxo | **pé do card, italic, border-t** |
| Faixa lateral | nenhuma | `w-1 ${color}` | **nenhuma** |

Resultado: **zero diferença estrutural perceptível** entre os dois módulos quando vistos lado a lado.

---

## 6. Validação

| Validação | Resultado |
|---|---|
| Props públicas estáveis | ✅ `InvestmentScenarioCardProps` inalterada — `InvestmentModule.tsx` e `InvestmentPrintBlock.tsx` compilam sem mudança |
| KPI signatures regression | ✅ Mantido `deriveScenarioExecutiveKpis` como fonte canônica — `kpiSignaturesRegression.test.ts` continua válido |
| Capital Preserved Relevance | ✅ Suprime `preserved` quando `≤ 0` (regra preservada) |
| Best-pick + Compare mode | ✅ Continuam operacionais (estado natural do card) |
| Aderência tokens CAIXA | ✅ `primary` / `success` / `destructive` / `muted` — zero hex |
| Motores financeiros | ✅ Zero alteração — card é puramente apresentacional |
| Performance | ✅ Sem libs novas, sem state extra, sem render pesado |
| Acessibilidade | ✅ `aria-expanded` no disclosure, `aria-label` no checkbox, hierarquia `h3` no header |

---

## 7. Arquivos editados

- `src/components/modules/investment/InvestmentScenarioCard.tsx` — refatoração visual completa para gramática Patrimonial.
- `.lovable/audit/investment-cards-full-visual-unification-wave.md` — este relatório.

**Não tocados (intencionalmente):**

- `ExecutiveKpiStrip.tsx` — mantido como componente legado, agora **não consumido pelo card** (KPIs reaproveitados inline com a gramática Patrimonial). Pode ser deferido para deprecação em onda futura.
- `scenarioExecutiveKpis.ts` — fonte canônica de KPIs, intacta.
- `PatrimonialStrategyCard.tsx` — referência mestra, intacta.
- `InvestmentModule.tsx`, `InvestmentPrintBlock.tsx` — props compatíveis, sem mudança.

---

## 8. Impacto consultivo esperado

- **Continuidade perceptiva absoluta**: o gerente alterna entre os dois módulos sem trocar de "modo cognitivo" — mesma plataforma, mesmas regras visuais.
- **Premium feel reforçado**: menos sensação de dashboard agressivo, mais consultoria patrimonial editorial.
- **Scanning executivo preservado**: o grid 2-col de KPIs + hero único permite varredura coluna-a-coluna entre múltiplos cards.
- **Compare mode invisível enquanto presente**: a checkbox vive no header como elemento natural — o gerente seleciona sem sentir que ativou uma "feature".

---

## 9. Itens deferidos (próximas ondas)

- Avaliar deprecação formal do `ExecutiveKpiStrip.tsx` (já não consumido pelo card principal).
- Replicar a unificação em `CotaMultiplicationCard` e `StrategicNicheCards` se ainda exibirem gramática divergente.
- Eventual hover-state com micro-shadow direcional para reforçar profundidade premium em mesa de negócios.
