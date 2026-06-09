---
name: Production Lock V2.4
description: Pós Consultive Continuity + KPI Source Governance, plataforma entra em LOCK real; risco dominante = overengineering; mudanças nas áreas travadas exigem 8 critérios
type: constraint
---

# Production Lock V2.4 — Consultive Integration Stabilized

## Trava
Após a onda Consultive Continuity & KPI Governance Final Pass, a plataforma
está em equilíbrio (UX + lógica + cálculo + guidance + continuidade + mobile
+ scanning + governança + integridade financeira). Risco dominante mudou
de "falta profundidade" para **overengineering**.

## Áreas locked (não tocar sem justificativa formal)
- `src/core/finance/*`
- `WealthPlatformModule.tsx`, `StrategyLibrarySection.tsx`
- `ConsultiveStrategyPanel.tsx`
- `CompareWorkspace.tsx` (COMPARE_MAX=3, winner+insights+disclaimer únicos, CTA continuidade único)
- `StructuredOperationsModule.tsx` (CTA único)
- `ActiveStrategyContext` (payload mínimo `{id, source, selectedAt}`)
- `strategyExecutiveKpis.ts` (1 hero + ≤2 secondary; `source` obrigatório)
- `ViabilityPreview` (glifo `~` + rodapé só quando há editorial)
- Microcopy CG-1/CG-2/F2/H2/F3/F4

## Proibido
Dashboardization · card explosion · feature layering · compare regression ·
hierarchy collapse · density creep · fake intelligence · CTA invasivo.

## Critério de mudança (todos os 8)
1. Necessidade real (telemetria/feedback)
2. Mínimo toque
3. Preserva hierarquia
4. Preserva elegância
5. Não duplica engine
6. Não fragmenta governança
7. Mobile-first em 380px
8. Reversível em 1 commit

## Livre
Conteúdo editorial · novas estratégias DRL-compliant · KPIs editoriais
explícitos · IA narrativa (sem tocar math) · telemetria sem PII.

## Documento canônico
`.lovable/governance/production-lock-v2.4.md`
