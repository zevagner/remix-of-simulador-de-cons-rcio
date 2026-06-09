---
name: Cockpit Boundary Consolidation
description: Cockpit é hub de roteamento (não dashboard); AIInsightsPanel sempre recolhido no rodapé; pitches sem tom marketing; alertas suprimidos quando Copilot proativo dispara
type: constraint
---
**Mantras oficiais:**
- Cockpit: "Eu não resolvo. Eu indico onde resolver."
- Especializados: "Eu provo, profundo, único."

**Proibido no Cockpit (`AnalysisOverview.tsx`):**
- KPIs replicados do Simulador (parcela/custo/ratio). Usar link "Ver simulação completa →".
- Pitch com verbos de marketing ("dobra", "maximiza", "poderosa", "ganho real"). Usar dado factual + 1 ação.
- `AIInsightsPanel` como bloco hero. Sempre dentro de `<details>` recolhido no rodapé.
- Lista textual de "Pontos de atenção" quando `useCopilotTriggers().fired === true` (canal único = `AnalysisCopilot` proativo).
- Cards densos para caminhos secundários — usar chips inline.

**Proibido no `AIInsightsPanel.tsx`:**
- Sub-seção "Resumo" (duplica Simulador).
- Sub-seção "Próximo passo recomendado" (duplica hero do Cockpit).
- Renderização fora de `<details>` no Cockpit.

**Fronteiras de responsabilidade:**
| Módulo | Faz | Não faz |
|---|---|---|
| Cockpit | Direção, próxima ação, 1 frase pronta, atalhos | Calcular, narrar longo, CRM, pós-venda |
| Abordagem | Scripts longos, gatilhos, objeções | Próximo passo do funil, cálculos |
| Proposta | PDF, link, storytelling formal externo | Coaching verbal, pipeline |
| Carteira | Pipeline, cadência, follow-up, score | Construção de simulação, scripts |
| Pós-venda | Retenção, reentrada, relacionamento | Captação fria, simulação inicial |
