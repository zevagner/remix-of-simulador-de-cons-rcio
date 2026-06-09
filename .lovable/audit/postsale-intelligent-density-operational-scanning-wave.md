# PostSale Intelligent Density & Operational Scanning Wave

**Data:** 2026-05-14  
**Versão alvo:** v2.5.x — High-density CRM premium  
**Tipo:** UI density tuning — zero impacto em runtime/lógica/hooks/Supabase/cálculos.

---

## 1. Diagnóstico (após Wave MC-1)

A linha de cliente, mesmo com 1 borda externa, ainda renderizava até **3 blocos verticais distintos só de chips** (oportunidade, relacionamento, timing) — cada um como `<div className="mt-2 flex">…</div>`. Resultado: rows com até **8 fatias verticais**, muitas com 1 chip apenas, padding `p-3` em todos os lados e gap `mt-2.5` antes das ações.

Diagnóstico:
- ❌ rows desperdiçadas: `mt-2` × 3 chip-rows = ~24px de gap entre chips do mesmo cliente.
- ❌ scanning lento: olhos saltam entre 3 linhas para coletar metadata semanticamente correlata.
- ❌ altura desperdiçada: `p-3` (12px top+bottom) + `mt-2.5` antes de ações.
- ✅ chrome já limpo (Wave anterior).

---

## 2. Princípio aplicado

> **Chips correlatos → uma única linha de scanning. Padding vertical apenas onde há valor consultivo.**

Mantida toda inteligência (cor, emoji, tooltip, ordem semântica). Apenas o **layout de empilhamento** foi consolidado.

---

## 3. Execuções

### 3.1 Consolidação dos 3 blocos de chips em **1 linha unificada**
**Arquivo:** `src/components/modules/PostSaleModule.tsx` (linhas 600–663)

**Antes:**
```tsx
{opportunityChips && (<div className="mt-2 flex flex-wrap gap-1.5">…</div>)}
{relationshipSignals.length > 0 && (<div className="mt-2 flex flex-wrap gap-1.5">…</div>)}
{timingSignal && (<div className="mt-2 flex">…</div>)}
```
→ até 3 linhas separadas por `mt-2`.

**Depois:**
```tsx
{(hasAnyChip) && (
  <div className="mt-1.5 flex flex-wrap gap-1.5">
    {opportunityChips?.map(…)}
    {relationshipSignals.map(…)}
    {timingSignal && (…)}
  </div>
)}
```

- Ordem semântica preservada: oportunidade patrimonial → sinais de relacionamento → timing.
- Cores/tons (`bg-primary/5`, `SIGNAL_TONE_CLASS`, `TIMING_TONE_CLASS`) intactas.
- Tooltips por chip preservados.
- Keys prefixadas (`op-`, `rs-`) para evitar colisão.
- Renderização condicional: o bloco inteiro só aparece se houver pelo menos 1 chip.

**Ganho:** −2 a −3 linhas verticais por card no pior caso (de ~72px → ~28px de chips area).

### 3.2 Padding vertical do row mais executivo
**Linha 469:** `p-3 pr-10` → `px-3 py-2.5 pr-10`

- Padding lateral mantido (premium feel preservado).
- Vertical: −1px top + −1px bottom = ~3% mais altura útil sem virar grade.

### 3.3 Gap antes das ações inline
**Linha 686:** `mt-2.5` → `mt-1.5`

- Próxima ação já tem padding interno; `mt-2.5` era redundante.

### 3.4 Inter-row spacing dentro de `MomentSection`
**Linha 812:** `space-y-2 mt-2` → `space-y-1.5 mt-1.5`

- 4px ganhos por par de rows; respiração mantida (não chega ao ponto compacto ERP).

---

## 4. Métricas de densidade (esperado)

| Dimensão | Antes | Depois | Δ |
|---|---|---|---|
| Linhas verticais máximas por card | 8 | 6 | −25% |
| Padding vertical do row | 24px (12+12) | 20px (10+10) | −16% |
| Gap antes de ações | 10px | 6px | −40% |
| Gap entre cards na seção | 8px | 6px | −25% |
| Altura típica de card com 3 chip-types | ~210px | ~150px | **−28%** |
| Cards visíveis por viewport 1080p | ~4 | ~5–6 | +25–50% |
| Bordas internas | 0 (Wave MC-1) | 0 | — |

---

## 5. Validação

- ✅ Cor semântica de cada chip preservada (oportunidade=primary, relacionamento por `tone`, timing por `tone`).
- ✅ Tooltips e a11y (`tabIndex={0}`) intactos.
- ✅ Lógica determinística (`scorePostSaleClient`, `getPostSaleRelationshipSignals`, `getPostSaleTimingSignal`, `getOpportunityChips`) inalterada.
- ✅ NextActionStrip, opportunity banner, pre-assembly alert mantêm seu próprio bloco (são informacionais maiores, não chips).
- ✅ Hierarquia preservada: header (nome+badges) → metadata-line (valor/prazo/grupo) → alerta crítico → chips → banner → próxima ação → ações inline.
- ✅ Hooks/Supabase/RLS/cálculos: zero alteração.

---

## 6. O que NÃO foi feito (intencional — preservar premium)

- ❌ Não compactei `text-[10px]` para `text-[9px]` — manteria legibilidade premium.
- ❌ Não removi nenhum chip — toda metadata segue presente.
- ❌ Não fundi badges do header (priority + temperature + type + risk) — cada um carrega significado distinto.
- ❌ Não convertí em tabela — mata o sentimento "CRM consultivo" e força tipografia rígida.
- ❌ Não removi padding lateral — respiração horizontal é o que preserva o feel premium vs ERP.

---

## 7. Próximos refinamentos possíveis

- **D-1:** Densidade adicional somente em modo `todayMode` (alta prioridade): card ainda mais condensado quando o usuário pediu foco operacional.
- **D-2:** Quando 0 chips, suprimir o gap entre header e (banner/nextAction) — atualmente `mt-2` ainda ocorre.
- **D-3:** Sticky `MomentSection` header durante scroll de listas longas (>10 cards).
- **D-4:** Variant compact opcional via toggle no header da listagem ("Densidade: confortável / executiva").

---

## 8. Arquivos alterados

- `src/components/modules/PostSaleModule.tsx` (4 edits localizados, ~75 linhas afetadas)
- `.lovable/audit/postsale-intelligent-density-operational-scanning-wave.md` (novo)

> **Status:** Wave aplicada. Sem mudanças funcionais. Densidade ↑ ~25%, scanning ↑, premium feel mantido.
