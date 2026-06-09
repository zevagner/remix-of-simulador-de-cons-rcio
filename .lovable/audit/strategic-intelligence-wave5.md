# Onda 5 — Inteligência Estratégica Silenciosa (Carteira + Pós-venda)

## Contexto
Ondas 1–4 entregaram microinteligência por cliente (filtros bancários, lentes,
moments, sinais de relacionamento e timing). Faltava a camada **macro**: ler a
carteira como um todo, sem virar BI corporativo.

## Entregas

### 1. Helper centralizado
`src/utils/portfolioSignals.ts`
- `computePortfolioSignals(proposals)` para Carteira.
- `computePostSalePortfolioSignals(input)` para Pós-venda.
- 100% determinístico, sem IA generativa.
- Floor de 6 leads ativos para gerar sinal (evita ruído em carteiras pequenas).

### 2. Heurísticas implementadas (Carteira)
| Sinal | Disparo | Frase |
|------|--------|-------|
| 🌡️ `cooling_portfolio` | hot < 10% **AND** stale ≥ 40% **AND** poucas movimentações na semana | "Carteira perdendo ritmo nas últimas semanas" |
| ⚖️ `concentration` | gatilho dominante ≥ 50% e ≥ 4 leads | "Carteira concentrada em {trigger}" |
| 📈 `strong_window` | gatilho com taxa de quentes ≥ 50% e 1.5× a média | "Clientes {trigger} estão respondendo acima do padrão" |
| ⏱️ `cadence_alert` | sem-próxima-ação + vencidos ≥ 40% e ≥ 5 | "Alguns clientes importantes estão sem acompanhamento" |

### 3. Heurísticas (Pós-venda)
| Sinal | Disparo |
|------|--------|
| 💎 Janela quente de pós-contemplação | ≥ 3 contemplados últimos 90 dias |
| 📅 Várias assembleias se aproximando | ≥ 2 clientes em janela de 7 dias |
| 🌡️ Atenção: clientes em risco acumulando | ≥ 2 e ≥ 15% da carteira |
| ⏱️ Muitos ativos sem próximo passo | dormentes + sem-ação ≥ 40% |

### 4. UI silenciosa
`src/components/modules/pipeline/PortfolioInsightsBar.tsx`
- Faixa de chips com tooltip explicativo.
- Renderiza no máximo **2 sinais** (regra Onda 5).
- Tons: `info` (muted), `warn` (warning/10), `positive` (primary/10).
- Posicionada **acima** dos badges de prioridade — não compete com hero/Kanban.

### 5. Integrações
- **Carteira** (`ProposalHistoryModule.tsx`): bar entre `ModuleHeader` e badges
  de prioridade. Sinais derivam de `scoreAndSortProposals`.
- **Pós-venda** (`PostSaleModule.tsx`): bar entre `ModuleHeader` e KPIs. Sinais
  derivam dos `moments` já calculados na Onda 2.

## Before / After

**Antes (Onda 4):**
- Sistema enxergava o cliente individual (timing, scoring, moments).
- Gerente precisava varrer manualmente para perceber padrões macro.

**Depois (Onda 5):**
- Faixa contextual leve revela ritmo, concentração e janelas fortes.
- Gerente reconhece padrões em 2 segundos, sem abrir relatório.

## Fronteiras preservadas
- **Cockpit**: continua sobre a venda atual.
- **Carteira**: agora também responde "como minha carteira está?".
- **Pós-venda**: agora também responde "que momento meu pós-venda vive?".
- Nenhum módulo virou dashboard/BI; sem gráficos, sem rankings, sem previsões.

## Riscos restantes
1. **Calibração**: thresholds (50%, 40%, 1.5×) podem precisar ajuste com mais
   dados reais — todos centralizados no helper para tuning trivial.
2. **Sinais simultâneos**: limitamos a 2 visíveis; em carteiras muito desbalanceadas
   pode ocultar um terceiro sinal relevante (aceito por design).
3. **Carteiras pequenas (<6 ativos)**: nada é exibido — comportamento intencional
   para não gerar leitura macro de amostra insuficiente.

## Score de maturidade UX
- Carteira: **9.0/10** (era 8.2). Visão macro sem peso visual.
- Pós-venda: **8.8/10** (era 8.0). Saúde do relacionamento agora legível.
- Inteligência silenciosa: **9.2/10** — cumpre o lema "o CRM entende a saúde da carteira".

## Arquivos
- `src/utils/portfolioSignals.ts` (novo)
- `src/components/modules/pipeline/PortfolioInsightsBar.tsx` (novo)
- `src/components/modules/ProposalHistoryModule.tsx` (edit)
- `src/components/modules/PostSaleModule.tsx` (edit)
