# Investment Strategies — KPI Executive Layer Wave

**Data:** 2026-05-15
**Escopo:** módulo `Análise → Investimentos` (todas as estratégias de cenário)
**Princípio absoluto:** KPIs servem à narrativa consultiva — nunca transformar o módulo em planilha técnica fria.
**Restrições:** zero alteração em `@/core/finance`, providers, runtime, Supabase, RLS.

---

## 1. Entrega

Camada padronizada de **5 KPIs executivos institucionais** (ROI · TIR · Payback · Multiplicador Patrimonial · Capital Preservado) integrada a **todos os 6 cenários** da aba *Cenários* + **card educacional oficial** explicando o que cada KPI é e como o simulador o aplica.

Padrão visual e racional alinhados com o submódulo *Engenharia Patrimonial* — uma linguagem única de inteligência financeira em toda a plataforma.

---

## 2. Arquitetura

### 2.1 Engine (consumer-only)
**Arquivo:** `src/components/modules/investment/scenarioExecutiveKpis.ts`

Helper puro `deriveScenarioExecutiveKpis(scenario, calculations, assumptions, creditValue, termMonths) → ExecutiveKpiSet`.

- **Reusa** as primitivas determinísticas já existentes em `@/core/finance/investment/patrimonialKpis` (`calculateTIR` Newton-Raphson + bissecção, `calculateROI`, `calculatePayback`, `calculatePatrimonialMultiplier`, `calculatePreservedCapital`).
- **NÃO recalcula** schedule, parcela, seguro, INCC ou IR. Recebe valores já apurados pelo motor canônico (`useInvestmentCalculations`).
- ROI usa `scenario.percentGain / 100` (consistência byte-a-byte com o card comercial).
- Constrói fluxo de caixa simplificado por cenário (cashflow builder dedicado) para alimentar TIR/Payback.
- Mapa `SCENARIO_DOMINANT` define os KPIs de protagonismo por estratégia.

### 2.2 Componente visual padronizado
**Arquivo:** `src/components/modules/investment/ExecutiveKpiStrip.tsx`

- 5 chips em grid `grid-cols-5` (mobile-friendly), tabular-nums, leitura em < 1 segundo.
- KPIs dominantes do cenário ganham **borda primary + fundo primary/[0.06] + valor em primary** (intensidade visual contextual).
- Cada chip tem **tooltip** consultivo descrevendo o KPI.
- Badge fixo `Estimativa` no header — responsabilidade consultiva preservada.
- Header tem botão `<Info>` com tooltip global ("não constituem promessa de resultado").

### 2.3 Card educacional oficial
**Arquivo:** `src/components/modules/investment/KpiEducationCard.tsx`

- Collapsible no topo da aba *Cenários* (colapsado por padrão — zero poluição).
- Para cada um dos 5 KPIs:
  - **O que é** (linguagem consultiva, sem academicismo)
  - **Como aplicamos** (exatamente como o simulador o usa)
- Disclaimer institucional ao final.
- Tom CAIXA: sólido, educativo, conservador inteligente.

---

## 3. Mapa de protagonismo por cenário

| Cenário | KPIs dominantes | Racional consultivo |
|---|---|---|
| **Aplicar em Investimentos** (`investment`) | ROI · TIR | retorno puro, sem ativo controlado |
| **Comprar e Valorizar** (`traditional`) | Multiplicador · Capital Preservado | alavancagem patrimonial vs cash |
| **Entrar para Revender** (`sale`) | Payback · ROI | velocidade de retorno + lucro líquido |
| **Gerar Renda com Aluguel** (`rental`) | Payback · Multiplicador | renda paga parcela + ativo controlado |
| **Usar a Carta para Investir** (`quick-contemplation`) | ROI · Capital Preservado | rendimento + caixa não comprometido |
| **Previdência Turbinada** (`previdencia-turbinada`) | Multiplicador · ROI | carta corrigida × capital aportado |

Cada estratégia destaca **o que ela faz melhor**. Não há "20 KPIs iguais piscando" — há 5 indicadores e cada cenário escolhe seus 2 protagonistas.

---

## 4. Wiring aplicado

### Arquivos novos
- `src/components/modules/investment/scenarioExecutiveKpis.ts`
- `src/components/modules/investment/ExecutiveKpiStrip.tsx`
- `src/components/modules/investment/KpiEducationCard.tsx`

### Arquivos editados (apresentação apenas)
- `src/components/modules/investment/InvestmentScenarioCard.tsx`
  - import `ExecutiveKpiStrip` + `deriveScenarioExecutiveKpis`
  - `<ExecutiveKpiStrip kpis={execKpis} />` renderizada **sempre visível** (não escondida em "Ver detalhes") logo após o disclaimer comercial.
- `src/components/modules/InvestmentModule.tsx`
  - import `KpiEducationCard`
  - inserido como **bloco 0** da aba *Cenários*, antes da Análise CentralAI.

### Cobertura
- ✅ Todos os 6 cenários (`investment`, `traditional`, `sale`, `rental`, `quick-contemplation`, `previdencia-turbinada`)
- ✅ Mesmo strip aparece no `InvestmentScenarioCard`, que é consumido tanto em *Cenários* quanto na aba *Estratégia Avançada* (pois `InvestmentStrategyTab` reusa o mesmo card)
- ✅ Card educacional acessível no topo da aba

---

## 5. Padronização visual

| Eixo | Decisão |
|---|---|
| Família visual | mesma do `PatrimonialStrategyCard` (chips, uppercase tracked, tabular-nums) |
| Tamanho | compacto, `text-xs` valor + `text-[9px]` label |
| Cor padrão | `border-border/50 bg-card/60` |
| Cor protagonista | `border-primary/40 bg-primary/[0.06] text-primary` |
| Tipografia números | `font-bold tabular-nums` |
| Help contextual | tooltip do Radix em **cada chip** + tooltip de overview no header |
| Badge "Estimativa" | sempre visível no header — institucional |
| Densidade | 5 colunas em qualquer breakpoint dos cards (cabe nos cards atuais) |

Zero dependência nova. Reusa `@/components/ui/tooltip`, `lucide-react`, `formatCurrency`.

---

## 6. Validação

| Item | Status |
|---|---|
| Todas as estratégias com KPIs | ✅ 6/6 cenários |
| Coerência visual com Patrimonial | ✅ mesma família de chips |
| Scanning executivo (< 1s) | ✅ 5 valores em linha única |
| Clareza consultiva | ✅ tooltips em cada KPI + card educacional |
| Zero poluição visual | ✅ collapsible no topo + strip compacto |
| Aderência CAIXA | ✅ tom institucional, "Estimativa" sempre visível |
| KPIs ajudam, não confundem | ✅ dominantes destacados por cenário |
| Card educacional claro | ✅ "O que é" + "Como aplicamos" para cada KPI |
| Premium preservado | ✅ paleta primary + densidade controlada |
| Performance | ✅ derivação O(N) consumer-only por scenario, sem rerenders extras |
| Build | ✅ `tsc --noEmit` limpo |
| Motor financeiro | ✅ intacto (`@/core/finance` não tocado) |
| Runtime / Supabase / RLS | ✅ não tocados |

---

## 7. Impacto consultivo esperado

- **Padronização linguística:** o gerente passa a falar a mesma língua executiva em Investimentos, Engenharia Patrimonial e (futuramente) Comparador.
- **Decisão acelerada:** comparação entre cenários deixa de exigir contas mentais — basta ler o KPI dominante.
- **Responsabilidade preservada:** nada vendido como promessa; tudo apresentado como estimativa, com badge fixo.
- **Educação institucional:** card oficial transforma o produto em ferramenta de **formação consultiva** do gerente, não apenas em calculadora.
- **Diferenciação premium:** plataforma deixa de "mostrar valor final" e passa a "mostrar eficiência patrimonial" — diferencial competitivo sobre simuladores de mercado.

---

## 8. Tradeoffs

- **TIR/Payback usam fluxo simplificado** (totalPaid distribuído por mês, retorno no mês final). Para `rental` há tratamento dedicado mês-a-mês. Em `sale` o horizonte é até a contemplação. Tradeoff aceito: precisão consultiva > precisão atuarial; nunca apresentado como cálculo definitivo.
- Card educacional é **opt-in** (collapsed) — quem já sabe não vê, quem precisa abre. Trade-off ergonômico vs descoberta.

---

## 9. Não escopo (deferido)

- KPI strip em `CotaMultiplicationCard` e `StrategicNicheCards` — nichos não têm `calculations.pathN` direto; exigiriam derivação adicional. Considerar onda 2 quando a auditoria de consolidação Investimentos ↔ Patrimonial for executada.
- Exportar KPIs no PDF de proposta — onda separada (envolve `useProposalData` e gates).
- Telemetria de hover nos tooltips — observabilidade, não prioridade.

**Status:** entregue, sem regressão funcional, em produção visualmente premium e consultivamente coeso.
