# Investment KPI — Strategic Coherence & Visual Separation Wave

**Data:** 2026-05-15
**Escopo:** `ExecutiveKpiStrip` + `scenarioExecutiveKpis` (camada de KPIs dos cards de cenário em Investimentos → Cenários).

---

## 1. Diagnóstico que motivou a onda

| Problema | Sintoma |
|---|---|
| **Incoerência estratégica** | Todos os 6 cenários mostravam **os 5 KPIs** (ROI/TIR/Payback/Multiplicador/Preservado) — vários sem fazer sentido para a estratégia |
| **KPIs "decorativos"** | Ex.: Payback aparecia em "Comprar e usar" (sem fluxo de caixa); Preservado aparecia em "Carta para investir" (todo capital fica em caixa = duplicação) |
| **Mistura visual** | `grid-cols-5` apertava 5 chips iguais, sem peso, sem hierarchy real, sem separação |
| **Scanning ruim** | "5 chips iguais" obrigam a ler tudo para descobrir o que importa |
| **Falsa hierarchy** | Borda primary nos "dominantes" não era separação real — era apenas tinta |

---

## 2. Curadoria por estratégia (mapa coerente)

Cada cenário agora exibe **1 KPI primary (hero) + até 2 secondary**. Demais KPIs ficam **fora** do card.

| Cenário | Primary | Secondary | Removidos | Justificativa |
|---|---|---|---|---|
| **Carta para investir** (`investment`) | ROI | TIR · Multiplicador | Payback, Preservado | Sem ativo para "recuperar"; preservado = duplicação do final result |
| **Comprar e usar / valorizar** (`traditional`) | Multiplicador | Preservado | ROI, TIR, Payback | Vivência de longo prazo; sem fluxo recorrente; payback de "uso" não cabe |
| **Vender cota** (`sale`) | Payback | ROI | TIR, Multiplicador, Preservado | Foco em liquidez curta; horizonte longo não se aplica |
| **Aluguel** (`rental`) | Payback | Preservado · Multiplicador | ROI, TIR | Renda mensal já é narrada na linha de fluxo; ROI agregado polui |
| **Antecipar contemplação** (`quick-contemplation`) | ROI | Preservado | TIR, Payback, Multiplicador | Narrativa = "valeu o lance?" — TIR/multiplicador puxam para outro horizonte |
| **Previdência turbinada** (`previdencia-turbinada`) | Multiplicador | ROI | TIR, Payback, Preservado | Capitalização do crédito — TIR/payback não cabem no horizonte previdenciário |

**Resultado quantitativo:**
- Antes: 5 KPIs × 6 cenários = **30 chips** sempre exibidos.
- Depois: 1 primary + até 2 secondary = **2 a 3 KPIs** por card → **~14 chips no total** (≈ −53% de ruído).

---

## 3. Nova arquitetura visual

```
┌─────────────────────────────────────────┐
│ KPIs executivos · ⓘ          ESTIMATIVA │  ← header institucional
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ROI                          18,4 % │ │  ← PRIMARY hero
│ │ (bg-primary/7, border-primary/30,   │ │     (text-lg, primary, baseline)
│ │  px-3 py-2.5)                       │ │
│ └─────────────────────────────────────┘ │
│ ─── separador real (border-t) ─────     │
│ ┌──────────────┐  ┌──────────────┐      │
│ │ TIR (a.a.)   │  │ MULTIPLICADOR│      │  ← SECONDARY (gap-2)
│ │ 14,2 %       │  │ 2,40×        │      │
│ └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────┘
```

### Mudanças visuais aplicadas

| Item | Antes | Depois |
|---|---|---|
| Padding container | `px-2.5 py-2` | `px-3 py-2.5` (+`px-4 py-3.5` em modo non-compact) |
| Layout | `grid-cols-5` apertado | Hero primary + grid-cols-1/2 secondary |
| Separação primary↔secondary | nenhuma (chips iguais) | `mt-2 pt-2 border-t border-border/40` |
| Tipografia primary | `text-xs` | `text-lg font-bold` |
| Cor primary | borda + accent leve | `bg-primary/7 + border-primary/30 + text-primary` |
| Gap entre secondary chips | `gap-1.5` | `gap-2` |
| Hover em secondary | hover muted | `hover:border-border` (mais sutil) |

---

## 4. Arquivos alterados

### `src/components/modules/investment/scenarioExecutiveKpis.ts`

- Substituído `SCENARIO_DOMINANT` (array de "destacados") por `SCENARIO_KPI_BLUEPRINT` (mapa curado `{ primary, secondary }`).
- `ExecutiveKpiSet` ganhou campos `primary: ExecutiveKpiKind` e `secondary: ExecutiveKpiKind[]`.
- Campo `dominant` mantido como **alias** (backward-compat) — não usado pelo strip novo.
- Justificativa por estratégia documentada **inline** no código (comentários consultivos, não só lista).

### `src/components/modules/investment/ExecutiveKpiStrip.tsx`

- Reescrito o render: 1 hero block (primary) + grid secondary (1 ou 2 colunas) com separador.
- Removido `ALL_KPIS` (não renderiza mais o universo completo).
- Header institucional ajustado: copy menciona "curados por estratégia".
- Grid responsivo elimina `grid-cols-5` apertado em mobile.

### `src/core/finance/investment/patrimonialKpis.ts`

- **Não tocado** (princípio absoluto: motor financeiro intacto).

### Engines e providers

- **Não tocados** (apenas camada de visualização e curadoria de exibição).

---

## 5. Validação obrigatória

| Critério | Status |
|---|---|
| Coerência estratégica dos KPIs | ✅ Cada cenário com KPIs próprios |
| Scanning executivo | ✅ Hero primary lê em <1s |
| Separação visual real | ✅ Hero ≠ secondary (cor, peso, separador) |
| Hierarchy executiva | ✅ Primary > Secondary (peso/cor/tamanho) |
| Redução de ruído | ✅ ~30 chips → ~14 chips totais |
| Cards parecem mais premium | ✅ Respiro + protagonismo |
| Aderência CAIXA | ✅ Tom institucional preservado, badge "Estimativa" |
| Consistência entre cards | ✅ Mesma estrutura (header + hero + secondary), KPIs variam |
| Performance | ✅ Sem grids complexos, sem deps novas |
| Arquitetura preservada | ✅ Zero motor financeiro, zero provider, zero Supabase |
| Backward compat | ✅ `dominant` alias mantido |

---

## 6. Assinatura financeira por estratégia (resultado)

Cada card agora tem **identidade própria** ao olhar:

- **Carta para investir**: card grita **ROI %** → "investidor, eis o retorno"
- **Comprar e usar**: card grita **Multiplicador ×** → "cliente, veja o tamanho do patrimônio que controla"
- **Vender**: card grita **Payback meses** → "veja em quanto tempo recupera"
- **Aluguel**: card grita **Payback meses** + flag de Preservado → "renda paga, capital intacto"
- **Antecipar**: card grita **ROI %** → "lance se pagou"
- **Previdência turbinada**: card grita **Multiplicador ×** → "cresceu N vezes"

Sem dois cards iguais. Sem KPIs que não pertencem ao discurso. **Coerência consultiva entregue.**

---

## 7. Tradeoffs e diferimentos

- Quem acessar `kpis.dominant` continua funcionando (alias). Nenhum consumer foi removido.
- Não criamos toggle "Ver todos os KPIs" — a curadoria é o produto. Se um consultor pedir todos os 5, a métrica pode entrar pelo `KpiEducationCard` (que já explica os 5 conceitualmente).
- `compact={false}` agora aumenta padding mas mantém a mesma hierarchy primary/secondary — sem segundo design alternativo.

---

## 8. Próximas curadorias (não-features) recomendadas

(Da auditoria global anterior, ainda válidas)

1. **C1 Bridge**: linha consultiva no rodapé da aba Cenários direcionando à Engenharia Patrimonial para visão 5/10/15a.
2. **C2 Decision Desk polish**: trocar `Trophy` por 6 ícones distintos por perfil; destacar célula vencedora na tabela longitudinal.
3. **C3 Densidade**: tornar `KpiEducationCard` dismissable persistente; avaliar `ScenarioComparisonChart` como collapsed-by-default.
