# Investment Cards Executive Simplification Wave

**Data:** 2026-05-15 · **Wave:** Investment Cards Executive Simplification · **Owner:** Investimentos / Engenharia Patrimonial

---

## 1. Objetivo

Transformar os 6 cards de cenário de Investimentos em **cards executivos patrimoniais premium**, com hierarquia forte, scanning rápido e progressive disclosure — preservando 100% da profundidade consultiva já entregue.

> **Princípio absoluto:** mostrar **melhor**, não mostrar **menos**.

---

## 2. Diagnóstico (estado anterior)

| Sintoma | Causa raiz |
|---|---|
| Card vertical e denso | Hero, bloco comercial, disclaimer, KPI strip e CTA empilhados sem hierarquia |
| Informação duplicada | "Você investe / Valor final" repetido no hero **e** no expandido |
| KPIs espremidos | Strip aparecia apertado contra o disclaimer logo acima |
| Comparação difícil lado a lado | Sem âncora visual única (cada card destacava algo diferente) |
| CTA "Ver detalhes" genérico | Não comunicava que se tratava do **racional consultivo** |

---

## 3. Nova arquitetura — 3 camadas claras

### A. HERO EXECUTIVO

- **Linha 1:** checkbox + ícone colorido + nome (semi-bold) + tese 1 linha (`line-clamp-1`).
- **Resultado dominante:** ÚNICO número grande (`text-2xl font-bold`) — Lucro estimado, com seta de direção e percentual ao lado.
- **Badge "X dominante"** alinhado à direita do label do resultado (ROI / TIR / Payback / Multiplicador / Capital preservado dominante) — assinatura visual imediata.
- **Microline contextual** (`text-[11px]`): `R$ investe → R$ final` com seta tipográfica `→`. Substitui as 3 linhas anteriores sem perder informação.

Resultado: **respiro generoso** entre identidade da estratégia e KPI dominante.

### B. CAMADA EXECUTIVA — KPI Strip institucional

- `ExecutiveKpiStrip` (já entregue na onda anterior) mantido em destaque imediatamente abaixo do hero.
- Sem margem extra (`mt-3` removido) — o hero já provê o ritmo visual. Strip respira sozinho.
- KPIs dominantes mantêm border `primary/40` + valor em primary, atendendo à hierarquia contextual.

### C. CAMADA CONSULTIVA — Progressive Disclosure

- CTA renomeado de **"Ver detalhes"** → **"Ver racional consultivo"**.
- Ao expandir, **borda superior** marca claramente a transição entre hero/KPI e racional.
- Conteúdo expansível agrupado e **sem duplicação**:
  - Sale: alerta institucional + breakeven + warning de antecipação.
  - Tese consultiva (`SCENARIO_TEXTS`).
  - Rental: bloco aluguel × parcela.
  - Premissas (compactas).
  - `InvestmentStorytelling` (IA, sob demanda).
  - Sub-collapse "Ver cálculo detalhado".

---

## 4. Eliminações de duplicação

| Antes | Depois |
|---|---|
| `Você investe / Valor final / Lucro` (hero) + `Você investe / Valor final` (expandido) | Hero único com microline `investe → final` + lucro hero |
| Disclaimer "Resultados estimados…" abaixo do hero **e** badge "Estimativa" no strip | Apenas badge "Estimativa" no strip (institucional) |
| `mt-3` redundante no strip + padding do hero | Padding único, ritmo coerente |

---

## 5. Hierarquia visual final

```text
┌──────────────────────────────────────────────┐
│ ▌ ☑  [icon]  Nome da estratégia      [Melhor]│  ← identidade
│       tese consultiva (1 linha)              │
│                                              │
│   LUCRO ESTIMADO          ROI dominante      │  ← hero label + badge
│   ↗ +R$ 142.300  (+18,4%)                    │  ← número hero
│   R$ 60.000 → R$ 202.300                     │  ← microline
│                                              │
│ ┌─ KPIs executivos              Estimativa ─┐│  ← KPI strip (B)
│ │ ROI · TIR · PB · MULT · PRES               ││
│ └────────────────────────────────────────────┘│
│                                              │
│ 👁 Ver racional consultivo            ▾      │  ← CTA disclosure
└──────────────────────────────────────────────┘
```

---

## 6. Scanning lateral (comparação 3 cards)

- Hero alinha-se em **3 níveis fixos** (nome → lucro grande → microline) entre todos os cards → o olho varre apenas a **2ª linha** para comparar.
- Badge "X dominante" destaca **assinatura visual única** por estratégia (ROI vs Payback vs Multiplicador) sem precisar abrir nada.
- KPI strip horizontal único permite comparação coluna-a-coluna entre cards adjacentes.

---

## 7. Salvaguardas confirmadas

| Pilar | Confirmação |
|---|---|
| **Conteúdo** | Zero remoção de informação consultiva — toda profundidade preservada na camada C |
| **Motores** | Zero alteração em `@/core/finance`, `useInvestmentCalculations`, providers, Supabase |
| **Performance** | Sem libs novas, sem animações custosas (`animate-fade-in` já existente), zero state extra |
| **Linguagem** | "Lucro estimado", "racional consultivo", "Estimativa" — institucional CAIXA |
| **Aderência visual** | Reusa `text-success`/`text-destructive`/`text-primary`/`bg-muted/40` — sem hex direto |
| **Densidade** | Card ~30% mais curto no estado colapsado; expandido reagrupa sem repetir |
| **Acessibilidade** | `aria-expanded` no CTA, `aria-label` no checkbox, hierarquia `h3` no nome |

---

## 8. Arquivos editados

- `src/components/modules/investment/InvestmentScenarioCard.tsx` (redesign completo das 3 camadas)
- `src/components/modules/investment/ExecutiveKpiStrip.tsx` (margem `mt-3` removida — ritmo coerente com novo hero)

---

## 9. Impacto consultivo esperado

- **Scanning lateral em segundos:** o gerente identifica o vencedor olhando apenas a linha do lucro hero.
- **Diferenciação por assinatura:** badge "X dominante" comunica a identidade estratégica de cada cenário sem texto adicional.
- **Premium feel:** hierarquia tipográfica (24px hero / 12px KPI / 11px microcopy) cria sensação de produto enterprise.
- **Menos fadiga visual:** card colapsado mais curto, racional consultivo sob demanda.

---

## 10. Itens deferidos (próximas ondas)

- Densidade extra-compacta opcional (modo "comparativo" lado a lado em mesa de negócios).
- Animação de transição entre estado colapsado/expandido com `framer-motion` (avaliar custo).
- Hover state com micro-shadow direcional para indicar profundidade premium.
- Replicar a arquitetura 3-camadas em `CotaMultiplicationCard` e `StrategicNicheCards`.
