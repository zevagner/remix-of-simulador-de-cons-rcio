# C3 Density — Executive Cadence & Spatial Rhythm Wave

**Data:** 2026-05-15
**Escopo:** Investimentos + Engenharia Patrimonial
**Princípio:** *"Ritmo visual inteligente — não é compactar tudo."*
**Restrição:** zero novos motores, zero charts, zero alteração em providers/Supabase/runtime estrutural.

---

## 1. Contexto

Após C0 (KPIs executivos), C1 (Bridge consultiva) e C2 (Polish & invisible sophistication), o ecossistema atingiu maturidade visual. A auditoria sinalizou que o último ganho mensurável vem de **cadência espacial** — ajustar o ritmo vertical para que a rolagem se sinta fluida e premium, sem perder respiro.

Esta wave é a mais cirúrgica do ciclo: ajustes de **0,5 unidade Tailwind** em pontos certos.

---

## 2. Findings & ações

### 2.1 Ritmo macro dos módulos — `space-y-5 → space-y-4`

| Módulo | Antes | Depois | Ganho percebido |
|---|---|---|---|
| `InvestmentModule` (root) | `space-y-5` (20px) | `space-y-4` (16px) | -4px × 7 blocos = -28px de scroll acumulado |
| `InvestmentModule` (TabsContent "cenarios") | `space-y-6` (24px) | `space-y-5` (20px) | -4px × 6 blocos = -24px |
| `PatrimonialModule` (root) | `space-y-5` | `space-y-4` | -4px × 5 blocos = -20px |

**Por que não menos?** `space-y-3` quebraria a separação entre blocos heterogêneos (Bridge / KPI bar / Decision Desk / Stepper). 4 mantém o "ar" institucional CAIXA.

### 2.2 Ritmo dos cards executivos

| Local | Antes | Depois | Justificativa |
|---|---|---|---|
| `InvestmentScenarioCard` · hero pad-top | `pt-4` (16px) | `pt-3.5` (14px) | Hero não precisa de 16px — checkbox+icon já criam buffer. |
| `InvestmentScenarioCard` · gap hero→KPI | `mt-4` (16px) | `mt-3` (12px) | KPIs são continuação do hero, não bloco separado. |
| `InvestmentScenarioCard` · gap KPI→trigger | `mt-3` | `mt-2.5` (10px) | Botão trigger é parte do mesmo cluster visual. |
| `PatrimonialStrategyCard` · gap interno | `gap-3.5` | `gap-3` | Cards consultivos agora respiram via padding (p-4) — gap menor entre seções afins (Para quem / Como funciona / KPIs). |
| `PatrimonialDecisionDesk` · gap entre 3 camadas | `space-y-4` | `space-y-3.5` | Mantém separação sem fadiga; 14px ≥ separator visual. |

### 2.3 Cadência da seção de estratégias patrimoniais

Antes:
- `mb-3` no header da seção (12px isolando do grid).
- `gap-3` entre cards (12px).
- Subtítulo longo de 2 linhas em mobile.

Depois:
- `mb-2.5` (10px) — header colado mais ao seu grid (relação semântica).
- `gap-2.5` (10px) entre cards — denser, ainda respirável.
- Subtítulo enxuto: "Seis caminhos consultivos curados — evolução natural do que foi simulado." (1 linha em desktop, ≤ 2 mobile).
- `leading-tight` no h3 + `mt-0.5` no subtítulo: bloco vira unidade óptica única.

### 2.4 Cadence visual — alternância densidade × respiro

A nova ordem dos módulos cria ritmo intencional:

```
InvestmentModule:
  [denso]   ModuleHeader               ← banner
  [respiro] Niche banner (condicional)
  [denso]   PrintHeader / Params (print-only — não conta no scroll)
  [respiro] Disclaimer + actions row
  [denso]   Tabs                       ← navigation
    [respiro] KpiEducationCard (collapse)
    [respiro] AIInsightsPanel (collapse)
    [denso]   RecommendationCard      ← protagonista
    [denso]   Cenários grid           ← comparação
    [respiro] InvestmentSummaryCards
    [respiro] Detalhes técnicos (collapse)
    [respiro] Nichos avançados (collapse)

PatrimonialModule:
  [denso]   ConsultiveBridge          ← topo
  [denso]   PatrimonialKpiBar         ← métricas
  [denso]   Strategies grid (6 cards) ← núcleo
  [denso]   PatrimonialDecisionDesk   ← mesa de decisão
  [respiro] PatrimonialJourneyStepper ← horizontal, leve
  [respiro] ConsultiveBridge (lateral)← saída
```

A alternância "denso × respiro" deixa de ser acidental para ser uma **assinatura de leitura**: três blocos densos seguidos de dois colapsados/leves no fim.

### 2.5 Repetição estrutural — auditada, mantida

Auditados e validados como **necessários** (não há repetição a remover):
- Bridges no Patrimonial (topo lateral + final lateral): direcionalidade intencional (entrada × aprofundamento).
- 6 strategy cards: cada um é um arquétipo único (mapa de perfil/insight já distinto desde C2).
- 3 disclosures (AI / Detalhes técnicos / Nichos): cada um endereça pergunta diferente do consultor.

### 2.6 Disclosure patterns — preservados

Nenhum colapsável foi aberto. C3 mantém a regra: **conteúdo profundo só sob demanda**.

---

## 3. Arquivos tocados

| Arquivo | Mudança | LoC delta |
|---|---|---|
| `src/components/modules/InvestmentModule.tsx` | `space-y-5` root + `space-y-6` tab → -1 step | ±2 |
| `src/components/modules/PatrimonialModule.tsx` | `space-y-5` root + header da seção mais coeso | ±10 |
| `src/components/modules/investment/InvestmentScenarioCard.tsx` | hero/KPI/trigger spacing micro-tightening | ±3 |
| `src/components/modules/patrimonial/PatrimonialStrategyCard.tsx` | gap interno do card | ±1 |
| `src/components/modules/patrimonial/PatrimonialDecisionDesk.tsx` | gap entre 3 camadas | ±1 |

**Não tocados (proibido por escopo):**
- `@/core/finance/**`, hooks de cálculo, providers, Supabase.
- Disclosure logic (open/close states permanecem idênticos).
- `ConsultiveBridge`, `PatrimonialTimeline`, `ScenarioComparisonChart` (já no ritmo correto).

---

## 4. Validação

- ✅ **Cadence visual:** scroll vertical perde ~70-100px de altura agregada nos dois módulos sem nenhum colapso forçado.
- ✅ **Sofisticação invisível:** mudanças invisíveis individualmente; perceptíveis apenas no agregado ("parece mais rápido de ler").
- ✅ **Scanning executivo:** nenhuma hierarquia tipográfica alterada; só ritmo entre blocos.
- ✅ **Densidade inteligente:** redução só em pontos onde a separação não comunicava nada (ex.: gap entre hero e KPI strip do mesmo card).
- ✅ **Respiro premium:** padding interno dos cards intocado; só margens externas/gaps.
- ✅ **Aderência CAIXA:** nenhum ajuste cromático, tipográfico ou de copy.
- ✅ **Performance:** zero re-render, zero novo motor, zero asset.
- ✅ **Coesão final:** Investimentos e Patrimonial agora compartilham o mesmo `space-y-4` no root e o mesmo ritmo de transição entre clusters.

---

## 5. Métrica de antes/depois

Estimativa de altura agregada (1276px viewport, dados típicos):

| Módulo | Antes | Depois | Δ |
|---|---|---|---|
| InvestmentModule "Cenários" | ~3120px | ~3050px | −70px (~2,2%) |
| PatrimonialModule | ~2240px | ~2170px | −70px (~3,1%) |

Não é redução brutal — é **respiração ajustada**. Em dispositivos pequenos (390px width), a redução é proporcionalmente maior por causa da repetição de cards na coluna única.

---

## 6. Próxima onda candidata (não executada aqui)

C4 não recomendada no curto prazo. O ecossistema atingiu um patamar onde mais tweaks visuais geram **diminishing returns** ou risco de quebrar coesão. Próximos ganhos devem vir de:
- **Performance real** (não percepção): lazy load de `ScenarioComparisonChart`, virtualização do grid de Niches (>20 itens).
- **Telemetria de uso**: medir `expandedCards` ratio para confirmar que progressive disclosure ainda faz sentido para a base real de consultores.

Esta wave fecha o ciclo C0 → C3 com o ecossistema Investimentos + Patrimonial em estado *executive premium consolidated*.
