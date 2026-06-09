# Production Lock — V2.4 Consultive Integration

Status: **LOCKED FOR PRODUCTION** (pós Consultive Continuity & KPI Governance Final Pass).

A plataforma atingiu equilíbrio entre UX, lógica, cálculo, guidance,
continuidade, mobile, scanning, governança e integridade financeira.
O risco dominante deixou de ser “falta de profundidade” e passou a ser
**overengineering**. Este lock formaliza isso.

---

## Áreas travadas (lock perceptivo + estrutural)

| Área                                                   | Regra                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| `src/core/finance/*`                                   | Engine canônica — não duplicar, não recalcular fora.               |
| `WealthPlatformModule.tsx` / `StrategyLibrarySection`  | Hierarquia consultiva travada; sem novo card/drawer/sub-rota.      |
| `ConsultiveStrategyPanel.tsx`                          | Aprofundar = `<details>`; sem auto-expand; sem grid de cards.      |
| `CompareWorkspace.tsx`                                 | COMPARE_MAX=3, Winner+insights+disclaimer únicos, CTA único de continuidade. |
| `StructuredOperationsModule.tsx`                       | CTA "Abrir Simulador" único; sem outros CTAs invasivos.            |
| `ActiveStrategyContext`                                | Payload mínimo `{id, source, selectedAt}`. Proibido inflar.        |
| `strategyExecutiveKpis.ts`                             | KPI por estratégia: 1 hero + ≤2 secundários; `source` obrigatório. |
| `ViabilityPreview` transparency                        | Glifo `~` 9px + rodapé só quando há editorial. Proibido badge.     |
| Microcopy CG-1/CG-2/F2/H2/F3/F4                        | Imutável.                                                          |

---

## Proibições pós-lock

- **Dashboardization** do consultivo (KPI strips agressivos, telas com 8+ cards).
- **Card explosion** na Library (max 1 hero, ≤2 secondary).
- **Feature layering** sobre Compare (não adicionar abas/seções novas).
- **Compare regression** (winners únicos, disclaimer único, mobile 1col<380px).
- **Hierarchy collapse** (não trazer tudo para o topo).
- **Density creep** (não reduzir respiro para "caber mais").
- **Fake intelligence** (ranking inventado, IA decorativa, score sem base).
- **CTA invasivo** (modal de continuidade, popup de sugestão, banner).

---

## Critério de aprovação de mudança pós-lock

Toda alteração nas áreas travadas exige justificativa explícita contra:

1. **Necessidade real** — resolve problema observado em telemetria/feedback?
2. **Mínimo toque** — é a menor mudança possível?
3. **Preserva hierarquia** — não infla nem reordena blocos canônicos?
4. **Preserva elegância** — não introduz aparência de ERP/dashboard técnico?
5. **Não duplica engine** — consome `@/core/finance`?
6. **Não fragmenta governança** — entra como override/extension dos contratos atuais?
7. **Mobile-first** — passa em 380px sem regressão?
8. **Reversibilidade** — pode ser revertido com 1 commit?

Reprovado em qualquer um → **não passa**.

---

## O que ainda é livre

- Conteúdo editorial das estratégias (textos, exemplos, when-not-to-use).
- Novas estratégias na Library — desde que respeitem DRL Differentiation.
- Novos KPIs editoriais — desde que declarem `source: 'editorial'`.
- Edge functions de IA narrativa (sem tocar math determinístico).
- Telemetria/observability adicional (sem coletar PII).

---

## Verdict

A V2.4 está em equilíbrio. Próxima onda só se houver **sinal externo**
(usuário real, telemetria, regulatório) — não por iniciativa interna de
"melhorar mais".
