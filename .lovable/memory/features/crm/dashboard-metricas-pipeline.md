---
name: Pipeline Metrics Dashboard
description: Onda 4 do CRM — modal de métricas (conversão por etapa, tempo médio por coluna, ticket médio fechado) acessível por botão na Carteira, com seletor 7d/30d/90d/Todo
type: feature
---
- Acessível pelo botão "📊 Métricas" no header da Carteira (`ProposalHistoryModule`).
- Componente: `src/components/modules/pipeline/PipelineMetricsModal.tsx`.
- Cálculo determinístico no cliente em `src/services/pipelineMetrics.ts` agregando `proposal_events` (eventos `created` + `status_change`) e `proposals.credit_value` (status='fechado').
- **Conversão por etapa**: para cada par consecutivo do funil (`prospeccao→aguardando_retorno→em_avaliacao→proposta_ajustada→fechado`), conta leads que passaram por `from` vs alcançaram `to`. Cores: ≥50% success, ≥25% warning, <25% destructive.
- **Tempo médio por coluna**: para cada lead, mede delta entre eventos consecutivos de status. Quando há filtro de janela, busca a timeline completa das propostas tocadas no período para não cortar deltas.
- **Ticket médio**: `avg(credit_value)` das propostas com `status='fechado'` filtradas por `updated_at >= cutoff`.
- Período padrão: 30 dias. Opções: 7d, 30d, 90d, Todo.
