# PostSale Operational Flow Simplification Wave (MC-1)

**Data:** 2026-05-14  
**Versão alvo:** v2.5.x — Premium CRM feel  
**Tipo:** UI/UX cleanup — zero impacto em runtime/lógica/hooks/Supabase/cálculos.

---

## 1. Diagnóstico

O Pós-venda exibia **stack triplo de chrome** por linha, gerando sensação de "ERP administrativo":

```
┌─ Card (List) ──────────────────────────── border + bg-card
│  ┌─ MomentSection trigger ─────────────── border + bg-muted/30
│  │  ┌─ ClientCard row ──────────────────── border + bg-card
│  │  │   ├─ Pre-assembly alert ──────────── border + bg-amber/10
│  │  │   ├─ Opportunity banner ──────────── border + bg-primary/5
│  │  │   ├─ NextActionStrip ─────────────── border + bg-muted/30
│  │  │   └─ ...
```

Resultado: até **5 bordas concêntricas** competindo em uma única linha de cliente, scanning lento, peso visual de planilha.

---

## 2. Princípio aplicado

> **Cada linha = uma superfície única protagonista.** Tudo dentro vira tinta semântica (cor de fundo discreta), não chrome.

Hierarquia operacional preservada via:
- ícones + emojis (status, momento, urgência)
- cor semântica (risk, temperature, priority)
- badges com chips coloridos
- left-accent dos `RISK_STYLES.row`

---

## 3. Execuções

### 3.1 Remoção do List `<Card>` wrapper
**Arquivo:** `src/components/modules/PostSaleModule.tsx` (linhas 354–388)

- Removido `<Card><CardHeader><CardTitle>...</CardTitle></CardHeader><CardContent>...</CardContent></Card>`.
- Substituído por `<section>` + header inline (`h2` + botão "O que fazer hoje" alinhados ao `px-1`).
- Ganho: −1 superfície, −1 borda, listagem flui direto sob os filtros.

### 3.2 Lighten do trigger de `MomentSection`
**Arquivo:** mesmo (linhas 803–823)

**Antes:**
```tsx
className="... px-3 py-2 rounded-md border border-border bg-muted/30 hover:bg-muted/60 ..."
```

**Depois:**
```tsx
className="... px-2 py-1.5 rounded-md hover:bg-muted/50 ..."
```

- Removida borda + fundo permanente. O header de momento vira título textual + chip de contagem.
- Padding reduzido (`py-2 → py-1.5`). Hover-state preservado.
- `defaultOpen` por momento mantido (lógica intacta).

### 3.3 Internal mini-blocks — remover borders, manter tinta
**Arquivo:** mesmo

| Bloco | Linha | Antes | Depois |
|---|---:|---|---|
| Pre-assembly alert | 595 | `border border-amber-500/30 bg-amber-500/10` | `bg-amber-500/10` |
| Opportunity banner | 679 | `border border-primary/30 bg-primary/5` | `bg-primary/5` |
| NextActionStrip | 729 | `border border-border bg-muted/30` | `bg-muted/40` |

- Bordas internas eram redundantes com o `border` da row-mãe → eliminadas.
- Tinta semântica preservada (amarelo = pré-assembleia, azul = oportunidade, neutro = próxima ação) → scanning de cor mantido.

---

## 4. Stack final (depois)

```
section (sem chrome)
└─ MomentSection trigger ─────────────── hover-only, sem borda
    └─ ClientCard row ──────────────────── border + bg-card  (única superfície)
        ├─ Pre-assembly alert ──────────── tinta amber, sem borda
        ├─ Opportunity banner ──────────── tinta primary, sem borda
        ├─ NextActionStrip ─────────────── tinta muted, sem borda
        └─ chips + actions
```

De 5 bordas concêntricas → **1 borda por linha**.

---

## 5. Preservações (zero alteração)

- `useClientRisk`, `computeClientPriority`, `scorePostSaleClient`, `suggestPostSaleAction`, `getPostSaleRelationshipSignals`, `getPostSaleTimingSignal`, `getOpportunityChips` — lógica determinística intacta.
- Hooks: `usePostSaleClients`, `usePostSaleEvents`, mutations, RLS Supabase.
- `MomentGroupedList` agrupamento + ordenação (`MOMENT_META.order`) intactos.
- IA contextual: `PortfolioInsightsBar`, sugestão Sparkles em cada row.
- Tooltips de priority, temperature, opportunity, signals — todos preservados.
- Filtros, todayMode, modal de exclusão, `PostSaleClientDetail`, onboarding modal.
- Anchors e IDs.

---

## 6. Métricas visuais esperadas

| Dimensão | Antes | Depois |
|---|---|---|
| Bordas concêntricas por linha (pior caso) | 5 | 1 |
| Superfícies (Card-like) ao redor da lista | 3 | 1 |
| Padding do header de momento | `px-3 py-2` | `px-2 py-1.5` |
| Sensação ERP | Alta | Baixa |
| Scanning rápido | Médio | Alto |
| Densidade operacional elegante | Média | Alta |
| Identidade premium (CRM financeiro) | OK | ↑ |
| Respiração entre rows | Mantida (`space-y-2`) | Mantida |

---

## 7. Arquivos alterados

- `src/components/modules/PostSaleModule.tsx` (5 edits localizados, ~38 linhas afetadas)
- `.lovable/audit/postsale-operational-flow-simplification-wave.md` (novo)

---

## 8. Próximos Medium Changes sugeridos

- **MC-1.1** — Internal divider: trocar `space-y-2` entre rows por `divide-y divide-border/50` para um look list-flow ainda mais premium.
- **MC-1.2** — Compactar header de momento desktop em uma única linha com contagem inline e descrição como tooltip.
- **MC-2** — Diagnostic shell único trocando conteúdo por step (eliminar percepção de fragmentação).
- **MC-3** — Objections library: rows colapsáveis (`<details>`) quando >6 itens.

> **Status:** Wave aplicada. Sem mudanças funcionais. Pronto para revisão visual.
