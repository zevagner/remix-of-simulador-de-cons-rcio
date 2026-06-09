---
name: Sidebar 6-Step Linear Flow + Analysis Cockpit
description: Sidebar 6 passos; "Análise" expande em 5 subitens (Cockpit, Investimentos, Comparador, Estudo de Lances, Assembleias). Op. estruturadas é o único submódulo headless (CTA contextual). Presence guard dev-only impede sumiço silencioso.
type: feature
---

# Reorganização da Navegação — Fluxo Linear + Análise + Presence Guard

## Sidebar (top-level)
1. Diagnóstico
2. Simulador
3. **Análise** (expansível, 5 subitens)
   - Cockpit Consultivo (`analysis-overview`)
   - Investimentos (`investment`)
   - Comparador (`comparator`)
   - Estudo de Lances (`bids`) — inclui seção "Histórico do grupo"
   - **Assembleias (`assemblies`)** — restaurado pela Onda Assemblies Restoration
4. Abordagem · 5. Proposta · 6. Carteira · 7. Pós-venda
Suporte: Comunidade, Central de Ajuda.

## IDs headless (válidos fora do menu)
- `advanced` (Operações estruturadas) → CTA contextual no Cockpit (carta ≥ R$ 500k). Único item na `ANALYSIS_HEADLESS_ALLOWLIST`.

## Presence guard
`src/config/modules.ts` valida em dev que **todo** ID de `ANALYSIS_TABS`
está em `ANALYSIS_SUBITEMS` ou explicitamente em `ANALYSIS_HEADLESS_ALLOWLIST`.
Falha cedo (console.error) se um módulo crítico sumir da navegação sem registro.

## Mobile (BottomNav)
`MOBILE_ANALYSIS_ORDER` = Cockpit, Investimentos, Estudo de Lances, Comparador, Assembleias.

## Compatibilidade
Bookmarks/CTAs legados continuam válidos via `isAnalysisTabId`.
