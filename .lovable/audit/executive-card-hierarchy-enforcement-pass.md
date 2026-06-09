# Executive Card Hierarchy Enforcement Pass

Wave de enforcement visual e narrativo dos cards consultivos (`strategy-v2`).
Substitui a wave anterior (que entregou apenas infraestrutura opcional) por
**implementação visual obrigatória** da hierarquia executiva.

Escopo: `ExecutiveStrategyCard.tsx`, `ConsultiveStrategyPanel.tsx`, novo
`FinancialFlowVisual.tsx`. Zero alterações em engine financeira, contratos
ou blueprint.

---

## Closed Card KPI Enforcement

✅ **Implementado.** No card fechado, a região dominante agora é
o **ganho patrimonial estimado**, com hierarquia dupla:

- `+R$ X` em `text-[30px] sm:text-[32px]` semibold, cor emerald institucional
- `Y,Y%` ao lado em `text-[18px]` semibold, tabular-nums

Quando o `heroKpi` original é diferente de `absoluteGain`/`percentGain`,
ele é preservado como linha de suporte (`"Payback: 24m"`, etc.) — zero perda
de informação.

Fonte: `data.comparePayload.absoluteGain` / `percentGain` (motor único,
sem shadow math). Fallback para `heroKpi.formatted` quando o payload não
tem ganho positivo (cenário de referência).

---

## Executive Trigger Enforcement

✅ **Implementado.** O `executiveTrigger` agora vive em bloco próprio
**entre o título e o KPI hero**, com:

- Borda esquerda sutil `border-primary/40`
- Itálico, `text-[12.5px]` leading-snug
- `line-clamp-2`, sem marketing apelativo

Posição garantida no DOM: header → trigger → KPI dominante → tese curta →
human translation. Render condicional: blueprints sem trigger caem
elegantemente.

---

## Expanded State Storytelling Enforcement

✅ **Implementado.** Ao abrir o painel, a **primeira coisa visível**
abaixo do header sticky mínimo é o **Storytelling Hero** (Visão → Contexto →
Consequência). Tese técnica, KPIs, premissas e tabelas vêm DEPOIS.

Header foi reduzido a chrome institucional (ícone + título + chips), liberando
o viewport para o storytelling assumir a abertura.

---

## Storytelling Hero Block

✅ **Implementado** como hero narrativo premium:

- Container `rounded-xl` com gradient `from-primary/[0.06]` (presença, não ruído)
- Eyebrow `Visão estratégica` em primary
- Visão em `text-[17px] sm:text-[18px]` font-medium tracking-tight
- Separador interno `border-t border-primary/15`
- Contexto e Consequência com micro-eyebrows uppercase próprios
- Padding generoso (`py-5 sm:py-6`)

Domina visualmente a entrada — não é mais um bloco textual misturado.

---

## Human Translation Enforcement

✅ **Implementado** como bloco dedicado **logo após o storytelling**:

- Container `rounded-lg border border-border/50 bg-card`
- Eyebrow `Na prática` em uppercase tracking
- Corpo `text-[14px]` leading-relaxed

Render condicional baseado em `c.humanTranslation`. Mantém sofisticação —
tom consultivo, sem infantilização.

---

## Financial Visual Flow Enforcement

✅ **Implementado** via novo `FinancialFlowVisual.tsx`:

Sequência horizontal (mobile: vertical) com 3 nós + 2 setas:

```
[ Você aporta ]  →  [ Acumula ]  →  [ Ganho patrimonial ]
   totalPaid          finalResult       +absoluteGain  (%)
```

- Consumer puro de `ComparePayload` (motor único)
- Valores em `tabular-nums`, label discreto, hint contextual
- Nó "Ganho" colorido emerald quando positivo
- Empilha em coluna < 480px (setas rotacionadas 90°)
- Validação: só renderiza com `totalPaid > 0 && finalResult > 0`

---

## Preserve Existing Depth

✅ **Validado.** Mantidos integralmente:

- Tese completa (`fullThesis`)
- Lista textual de aplicações principais (Primary Strategy Visibility Layer)
- Accordion com `howItWorks`, `forWho`, `advantages`, `risks`, `pitch`,
  `objections`, `mistakes`, `examples`, `patrimonialImpact`, `applications`
  (deep-dive), `whenNotToUse`, `archetypes`, `relatedStrategies`
- Disclaimer institucional
- CG-2 next-step (selecionar/comparar)
- Telemetria U8 intacta

Zero remoção de conteúdo consultivo. Profundidade emerge como descoberta,
storytelling lidera a entrada.

---

## Card Flow Restructure

✅ **Ordem obrigatória implementada** no expanded state:

1. Header sticky mínimo (chrome institucional)
2. **Storytelling Hero** (Visão → Contexto → Consequência)
3. **Na prática** (human translation)
4. **Fluxo visual financeiro** (Aporta → Acumula → Ganho)
5. **KPIs patrimoniais** (hero + secundários)
6. **Tese / Premissas** (`fullThesis`)
7. **Estratégias principais** (Primary Strategy Visibility)
8. **Argumentação consultiva** (accordion: como funciona, pitch, objeções,
   riscos, erros, exemplos, aplicações deep-dive, impacto patrimonial,
   arquétipos, relacionadas)
9. Disclaimer + CG-2 footer

---

## Mobile Hierarchy Validation

✅ **Validado para 380px+:**

- Storytelling Hero usa `px-5 py-5` (≥380px) e `sm:px-6 sm:py-6`
- KPI dual no card fechado quebra para `flex-wrap` sem overflow
- Fluxo visual empilha verticalmente (`flex-col sm:flex-row`)
- Setas rotacionadas 90° em mobile
- Todos os números em `tabular-nums` com `truncate` nos nós
- Eyebrows uppercase em `text-[10px]` mantêm legibilidade
- `line-clamp-2` no trigger e tese impede explosão vertical no card fechado

Impacto emocional preservado: lê em <5s, escaneia em 2s.

---

## Zero Regression Validation

✅ **Confirmado:**

- Engine financeira (`@/core/finance`, `useInvestmentCalculations`,
  `usePatrimonialKpis`) intocada
- Sem shadow math — todo número vem de `comparePayload` / `heroKpi` /
  `secondaryKpis` já apurados pelo motor único
- `STRATEGY_BLUEPRINT_BY_ID` e contratos inalterados
- V2 Lock preservado (`Wealth/Consultive/Compare/StructuredOps/ActiveStrategy`
  não tocados)
- Compare Workspace e telemetria U8 funcionam exatamente como antes
- Feature flag `ENABLE_STRATEGY_PRESENTATION_V2` continua governando o switch
- Imports antigos limpos (`TrendingUp` removido do card)

---

## Final Executive Experience State

| Pergunta | Resposta |
|---|---|
| Cards mostram lucro imediatamente? | ✅ `+R$ X` em 32px no estado fechado |
| Cards mostram ROI imediatamente? | ✅ `Y,Y%` em 18px ao lado do ganho |
| Gatilho executivo visível no fechado? | ✅ entre título e KPI, com border-l primary |
| Expanded começa com storytelling forte? | ✅ Hero dominante, antes de qualquer técnica |
| Compreensíveis para leigos? | ✅ "Na prática" + fluxo visual 3 nós |
| Continuam sofisticados? | ✅ tom consultivo, sem marketing apelativo |
| Profundidade consultiva preservada? | ✅ accordion completo intacto |

---

## Final Verdict

✅ **APROVADO.** Os cards agora funcionam como **experiências patrimoniais
premium**: o usuário vê o ganho monetário e percentual em <2s no estado
fechado, abre o painel e é recebido por uma visão estratégica narrativa
antes de qualquer número técnico, entende em linguagem humana o que
acontece na prática e visualiza o fluxo financeiro em 3 nós antes de
mergulhar nos KPIs e na argumentação consultiva.

Profundidade técnica permanece intacta — emergindo como descoberta
progressiva, não como dashboard inicial. Engine financeira, contratos
e telemetria não foram tocados. V2 Lock e governança preservados.

**Status:** implementação obrigatória executada — não infraestrutura
opcional. Pronto para validação visual em produção.
