# Nested Cards & Redundant Surface Cleanup Wave

**Data:** 2026-05-14  
**Versão alvo:** v2.5.x (Premium Minimalist)  
**Tipo:** UI cleanup — zero impacto em runtime/lógica/hooks/Supabase.

---

## 1. Objetivo

Reduzir **chrome visual redundante** (card-dentro-de-card, surface-dentro-de-surface, bordas duplicadas, wrappers sem função) sem perder hierarquia, IA contextual ou identidade premium.

> Princípio absoluto: **menos caixas, menos bordas, mais fluidez.**

---

## 2. Mapeamento de Densidade (antes da Wave)

| Módulo | `<Card>` no arquivo principal | Anti-pattern detectado |
|---|---:|---|
| CommunityModule | 13 | Buttons com `border + bg-background` dentro de Cards já coloridos (`bg-primary/5`, `bg-warning/5`) → **surface-dentro-de-surface** |
| DiagnosticModule | 7 | Cards exibidos um por vez (step gating) — **OK, não é nested** |
| ProposalModule | 4 | "Quick summary Card" + "Client Card" empilhados, ambos com `border-border bg-card` → **chrome redundante** |
| InvestmentModule | 2 | Disclaimer envolvido em `Card border-dashed` para 3 linhas de texto → **surface sem função** |
| ObjectionsModule | 3 | Cards em loop (`border-l-4`) — semanticamente justificado, **mantido** |
| BidsModule | 2 | Mantidos (estruturam blocos narrativos distintos) |
| PostSaleModule | 2 | List Card contém rows `rounded-lg border bg-card` — diferido (toca `ClientCard` componente) |

---

## 3. Execuções desta Wave

### 3.1 CommunityModule — eliminação de surface dupla
**Arquivo:** `src/components/modules/CommunityModule.tsx`

**Antes (linhas 178 e 220):**
```tsx
<Card className="...border-primary/30 bg-primary/5">
  <button className="rounded-md border border-primary/20 bg-background p-2.5 hover:border-primary/50 ...">
```

**Depois:**
```tsx
<Card className="...border-primary/30 bg-primary/5">
  <button className="rounded-md p-2.5 hover:bg-background/60 ...">
```

- Removidas **2 camadas de border** + **2 camadas de bg** dentro de cards já coloridos.
- Hover preservado via `bg-background/60` (mais sutil, sem competir com a Card-mãe).
- Mesma alteração aplicada à seção *"Ajude alguém agora"* (warning).

### 3.2 ProposalModule — Card → strip inline
**Arquivo:** `src/components/modules/ProposalModule.tsx`

**Antes (243–270):** `<Card className="border-border bg-card"><CardContent>...</CardContent></Card>` para 3 KPIs + badges.

**Depois:** `<div id="proposal-simulation-data" className="px-1">` direto, sem Card.

- Anchor `id` preservado (CTAs/scroll do Tour intactos).
- Continuidade visual com o "Client Card" logo abaixo, que continua sendo a única superfície real da seção de personalização.
- Banner "Estratégia recomendada" segue como **único protagonista primary** acima.

### 3.3 InvestmentModule — disclaimer sem Card
**Arquivo:** `src/components/modules/InvestmentModule.tsx`

**Antes (781–789):** `<Card className="bg-muted/50 border-dashed"><CardContent className="py-4"><p>...3 frases...</p></CardContent></Card>`

**Depois:** `<p className="text-[11px] text-muted-foreground text-center px-2 leading-relaxed">⚠️ ...</p>` (1 linha condensada).

- Disclaimer continua presente e legível (compliance preservado — política `BUSINESS_RULES`/disclaimers).
- Reduz peso visual e altura do rodapé do módulo em ~64px.

---

## 4. O que foi PRESERVADO

- Toda lógica financeira, hooks (`useInvestmentCalculations`, `useSimulator*`, `useProposalData`), providers, Supabase, RLS.
- IA contextual (`AIInsightsPanel`, `CentralAI`, copilots) — sem mudanças.
- Hierarquia: cada módulo mantém **1 protagonista visual** (banner de estratégia em Proposta, RecommendationCard em Investimentos, CTA dominante em Comunidade).
- Identidade premium: cores semânticas, tokens, gradientes do banner primary intactos.
- Anchors/IDs usados pelo Tour Guiado e CTAs (`proposal-simulation-data`).
- Disclaimers obrigatórios (Investment) e badges de contexto (Proposta).

---

## 5. O que NÃO foi feito (e por quê)

| Candidato | Motivo do diferimento |
|---|---|
| `PostSaleModule` rows com `border bg-card` dentro do List Card | Toca componente `ClientCard` (componente compartilhado, ~400 linhas). Vai para a próxima onda de **Medium Changes (MC-1)**. |
| `DiagnosticModule` Cards por step | Gating impede que apareçam simultaneamente — não é nesting visual real. |
| `ObjectionsModule` cards em loop | `border-l-4` semântico (categoria/prioridade) + estrutura de listagem — remover prejudicaria scanability. |
| `CommunityModule` Cards de CTA / Pulse | São protagonistas distintos, separados por seção; remover misturaria contextos. |

---

## 6. Validação

- ✅ Build pipeline (typecheck/lint) executado pelo harness após edits.
- ✅ `proposal-simulation-data` ID preservado para anchors.
- ✅ Nenhuma alteração em `src/core/finance`, contexts, edges ou Supabase.
- ✅ IA continua disponível nos pontos canônicos (Cockpit Consultivo).
- ✅ Cards remanescentes têm função arquitetural clara (CTA, agrupamento de filtros, lista paginada, banner de estratégia).

---

## 7. Impacto Visual Esperado

| Dimensão | Antes | Depois |
|---|---|---|
| Camadas de border na seção "Atualizações" do Comunidade | 2 (Card + button) | 1 (Card) |
| Cards consecutivos topo da Proposta | 3 | 2 |
| Altura do rodapé do Investimentos | ~92px | ~28px |
| Chrome visual percebido | Inflado | Fluido |
| Hierarchy strength | Mantida | Mantida ↑ |

---

## 8. Próximos Medium Changes Propostos

1. **MC-1 — PostSale rows:** trocar `border bg-card` em `ClientCard` por divisores/hairlines, tornando a List Card a única superfície da listagem.
2. **MC-2 — Diagnostic:** unificar visual dos 6 step-Cards em uma "shell" única que troca apenas conteúdo (reduz percepção de fragmentação no fluxo).
3. **MC-3 — Objections library:** transformar cards `border-l-4` em rows `<details>` colapsáveis quando a lista exceder 6 itens.
4. **MC-4 — KpiStrip primitivo:** extrair o padrão "metric-row inline sob o ModuleHeader" como componente reutilizável.

---

## 9. Arquivos alterados

- `src/components/modules/CommunityModule.tsx` (2 linhas)
- `src/components/modules/ProposalModule.tsx` (~28 → 25 linhas, Card → div)
- `src/components/modules/InvestmentModule.tsx` (9 → 4 linhas)
- `.lovable/audit/nested-cards-redundant-surface-cleanup-wave.md` (novo)

> **Status:** Wave aplicada. Sem mudanças funcionais. Pronto para revisão visual.
