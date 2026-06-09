# Onda C1 — Bridge: Consultive Continuity & Narrative Cohesion

**Status:** entregue
**Escopo:** Investimentos ↔ Engenharia Patrimonial
**Princípio absoluto:** o usuário percorre uma única jornada patrimonial — não pula entre módulos isolados.

---

## 1. Diagnóstico das transições (antes)

| Ponto de saída | Ponto de entrada | Quebra observada |
|---|---|---|
| Fim de **Investimentos** (após Tabs / niches) | — | Nenhuma menção à evolução para Engenharia Patrimonial. Usuário precisa descobrir o submódulo via sidebar. |
| Topo de **Engenharia Patrimonial** | — | Header institucional autocontido ("Submódulo · Engenharia Patrimonial") — sem indicar que é continuação do que foi simulado. |
| Rodapé de **Engenharia Patrimonial** | Investimentos → Avançada | `Card` genérico com `variant="outline"`, vocabulário diferente do resto da jornada ("Abrir em Investimentos"). |
| Linguagem | — | "Submódulo", "selecione o que mais se alinha" — vocabulário de catálogo, não de continuidade. |

Resultado: sensação de **três blocos costurados**, não de uma jornada.

---

## 2. Pontes implementadas

Componente único compartilhado: **`src/components/modules/shared/ConsultiveBridge.tsx`**

- Vocabulário canônico: "continuidade", "evolução natural", "próximo nível", "aprofundar".
- Direção semântica `forward` (evolução) vs `lateral` (volta para detalhamento).
- Ícone à esquerda · eyebrow uppercase · título curto · 1 linha consultiva · CTA à direita.
- Visual leve: `forward` usa `border-primary/20` + gradient sutil; `lateral` usa `border-border` neutro.
- Zero motor financeiro · zero IA · zero fetch · `print-hide` por padrão.

### Wiring

| Local | Direção | Eyebrow | Title | CTA |
|---|---|---|---|---|
| `InvestmentModule.tsx` (após Tabs, antes do JourneyGuideBanner, gated por `hasValidSimulation`) | `forward` | Continuidade patrimonial | Próximo nível: Engenharia Patrimonial | Abrir Engenharia Patrimonial |
| `PatrimonialModule.tsx` (topo, substitui header autocontido) | `lateral` | Continuidade da jornada patrimonial | Engenharia Patrimonial | Voltar a Investimentos |
| `PatrimonialModule.tsx` (rodapé, substitui Card+Button avulsos) | `lateral` | Aprofundar cenários | Resumo comparativo & multiplicação de cotas | Abrir em Investimentos |

Microcopy do header das estratégias também ajustada: "Evolução natural do que foi simulado em Investimentos — seis caminhos consultivos curados…" (antes: "Seis caminhos consultivos curados — selecione o que mais se alinha ao perfil do cliente.").

---

## 3. Fluxo consultivo natural resultante

```text
Diagnóstico → Simulador → Investimentos
                              │
                              ▼ (ConsultiveBridge forward)
                         Engenharia Patrimonial
                              │  ▲
                              │  └─ (lateral) Voltar a Investimentos
                              ▼
                         Decision Desk → Jornada → (lateral) Aprofundar cenários
                              │
                              ▼
                         (futura ponte) Proposta / Legado
```

---

## 4. Continuidades garantidas

- **Visual:** mesma família de bordas (`border-primary/20` ou `border-border`), mesmo padding (`px-4 py-3`), mesmo ritmo (`space-y-5`), mesma tipografia (eyebrow `text-[10px] uppercase`, título `text-sm font-semibold`).
- **KPIs:** sem alteração — `PatrimonialKpiBar` e `ExecutiveKpiStrip` permanecem fontes únicas em cada módulo (Onda anterior).
- **Temporal:** Decision Desk + Timeline Comparator continuam ancorados em `projectPatrimonialTimeline`.
- **Microcopy:** vocabulário unificado ("continuidade", "evolução", "aprofundar", "próximo nível").

---

## 5. Preservações

- ✅ Zero alteração em motores financeiros (`@/core/finance`).
- ✅ Zero alteração em Supabase / providers / runtime.
- ✅ Zero novo chart, motor ou render pesado — apenas presentational.
- ✅ Aderência CAIXA: tom institucional, sólido, consultivo.
- ✅ Scanning executivo: bridge ocupa ≤ 1 viewport-row, sem texto longo.
- ✅ Silêncio visual: bridge `forward` aparece apenas com `hasValidSimulation`.

---

## 6. Validações

| # | Critério | Resultado |
|---|---|---|
| 17 | Continuidade consultiva | ✅ Bridge `forward` no fim de Investimentos + bridge `lateral` no topo de Patrimonial. |
| 18 | Coesão narrativa | ✅ Vocabulário unificado, mesmo componente visual. |
| 19 | Redução de fricção | ✅ CTA direto entre módulos sem voltar à sidebar. |
| 20 | Premium feel | ✅ Polish invisível: 1 componente, 3 wirings, ~80 LOC adicionadas, ~30 LOC removidas (Card/Button avulsos). |

---

## 7. Arquivos

- **Criado:** `src/components/modules/shared/ConsultiveBridge.tsx`
- **Editado:** `src/components/modules/InvestmentModule.tsx` (import + bridge no fim)
- **Editado:** `src/components/modules/PatrimonialModule.tsx` (substituição do header e do footer-card por bridges; microcopy do header da seção de estratégias)
- **Criado:** `.lovable/audit/c1-bridge-consultive-continuity-narrative-cohesion-wave.md`

---

## 8. Próximas ondas curatoriais

- **C2 Polish:** ícones por perfil no Decision Desk, destaque de "vencedor" em tabelas longitudinais.
- **C3 Densidade:** `KpiEducationCard` dismissable (localStorage), avaliar colapso default do `ScenarioComparisonChart`.
- **Futuro:** estender `ConsultiveBridge` para Comparador → Investimentos e Patrimonial → Proposta/Legado.
