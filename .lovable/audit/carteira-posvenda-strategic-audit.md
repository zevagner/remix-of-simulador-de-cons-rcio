# Auditoria Estratégica — Carteira & Pós-venda

> Fase 1: entender profundamente o que existe hoje. Recomendações de evolução vêm depois, sem inflar os módulos.
> Mantra-guia: **CRM bancário consultivo, não CRM SaaS genérico.**

---

## 1. Carteira (ProposalHistoryModule) — como funciona hoje

### 1.1 Estrutura observada
- **Arquivo principal:** `src/components/modules/ProposalHistoryModule.tsx` (754 linhas).
- **Render:** Kanban com 6 colunas fixas vindas de `pipelineConstants.COLUMNS`:
  `prospeccao → aguardando_retorno → em_avaliacao → proposta_ajustada → fechado → perdido`.
- **Carga de dados:** `useProposalsPage({ onlyActive: true, limit, offset: 0 })` via RPC paginada (hard cap 200; "Carregar mais" cresce em blocos de 200). Apenas leads ativos no Kanban; histórico fechado/perdido fica em aba separada (`ProposalHistoryTab`).
- **Drag & drop:** dnd-kit com Pointer/Touch sensors; ao soltar em coluna terminal abre `NextActionModal` ou `ClosePostSaleConfirmModal` (fechado). Movimentação registra `proposal_status_change` em analytics + obriga próxima ação quando há cadência.
- **Filtros:** apenas busca por nome/telefone/notas. Não há filtros por trigger/valor/risco/SLA.
- **Componentes auxiliares no header:**
  - `AlertsCenter` (sino) — agrega atrasados, sem próxima ação, parados ≥7d.
  - `DailyAgenda` — "O que fazer hoje" colapsável (atrasados, hoje, parados 3+d, top 3 quentes).
  - `SalesForecastCard` — meta mensal × pipeline, breakdown por etapa, top oportunidades, narrativa IA opcional.
  - `PipelineMetricsModal` — botão dedicado: conversão por etapa, tempo médio por coluna, ticket médio.
- **Card individual (`ProposalCardContent`, 606 linhas):** badge de prioridade, faixa de cor por `getCardAlertLevel`, linha "valor esperado" (forecast probabilístico), CTA "Próxima ação", atalhos para Abordagem/Proposta/WhatsApp, edição inline de notas.

### 1.2 Motores e regras já existentes
| Camada | Arquivo | O que faz |
|---|---|---|
| **Cadência** | `pipeline/cadenceRules.ts` | SLA por coluna (`COLUMN_SLA`), graça 48h pós-criação, `getCardAlertLevel` com hierarquia (critical → warn → missing-action-strong → soft). |
| **Priorização interna** | `utils/proposalPriority.ts` | Score por status × idade × valor, classifica alta/média/baixa, `priorityReason`. |
| **Score comercial unificado** | `utils/clientScoring.ts` | Camada quente/morno/frio + urgente/atenção/reativar (compartilhada com Pós-venda). |
| **Próxima ação** | `utils/nextActionSuggestion.ts` | Sugestão determinística por estágio + sinais. |
| **Forecast** | `utils/salesForecast.ts` + `salesGoal.ts` | Probabilidade por etapa (10/20/35/60%), valor esperado, gap vs meta (localStorage por user). |
| **Cadência de copy** | `pipeline/followUpCadence.ts` | Script sugerido por status (placeholders `[Nome]`/`[seu nome]`). |
| **Eventos & telemetria** | `proposalEvents.ts`, `analytics_events` | `proposal_status_change`, `proposal_move_cancelled`, `proposal_next_action_skip`. |
| **Persistência** | `proposals` (RLS multi-tenant), `proposal_events` (insert via trigger). |

### 1.3 Fluxo mental do gerente (estado atual)
1. Abre Carteira → vê **DailyAgenda** ("o que fazer hoje") + **Forecast** (gap × meta) + **AlertsCenter** (sino).
2. Escaneia colunas; faixa colorida indica urgência. Badges secundários sinalizam ausência de próxima ação.
3. Move card → forçado a registrar ação (modal). Ao chegar em "fechado", oferece criar pós-venda automaticamente.
4. Abre card → contexto + atalhos para Abordagem/Proposta/WhatsApp.

### 1.4 O que a Carteira **já é hoje**
- Pipeline consultivo com SLA real por coluna (não cadência genérica).
- Forecast probabilístico com meta editável e narrativa IA — diferencial vs CRM SaaS comum.
- Hierarquia visual disciplinada (memória `Pipeline Cadence Calibration` Onda 5/7).
- Movimentação ativa **exige próxima ação** — disciplina operacional rara.
- Métricas de fricção instrumentadas (cancelamentos, skips).

### 1.5 O que **ainda parece CRM SaaS genérico**
- Filtros pobres: só busca textual. Não filtra por trigger, faixa de crédito, idade, próxima ação atrasada, sem ação, alta prioridade.
- "Prospect trigger" (aluguel, FGTS, financiamento, PJ, liquidez, investidor, sucessão, agro) **é capturado mas não vira lente de carteira**: não há agrupamento, ranking ou narrativa por gatilho — perde o ângulo bancário.
- Não há **mineração** ativa: ninguém sugere "esses 3 leads em FGTS estão parados há mais de 5d, dispare follow-up em lote".
- Não há **momento de vida** explícito (aniversário, ciclo do contrato, próxima assembleia do grupo do cliente).
- "Quente/morno/frio" do `clientScoring` existe no motor, mas **não é exibido como lente de coluna ou filtro** na Carteira.
- Forecast é solitário: não conversa com Pós-venda (oportunidades pós-contemplação não somam ao pipeline).

---

## 2. Pós-venda (PostSaleModule) — como funciona hoje

### 2.1 Estrutura observada
- **Arquivo principal:** `src/components/modules/PostSaleModule.tsx` (600 linhas).
- **Render:** lista única (não-Kanban) com KPI row (Ativos · Contemplados · Quitados · Em risco · Oportunidades · Próx. ações) + filtros + cards.
- **Carga de dados:** `usePostSaleClients()` via RPC `list_post_sale_clients_page` (hard cap 200) + `useActiveNextActions` (próximas ações ativas, índice JSONB).
- **Filtros:** busca · status (4) · tipo de consórcio · risco · prioridade · toggle "O que fazer hoje".
- **Card individual:** prioridade, risco, alertas, próxima ação com urgência, oportunidade (contemplado/quitado), CTAs rápidos via `PostSaleQuickActions` (registrar contato, agendar, indicação, lance).
- **Detalhe (`PostSaleClientDetail`, 413 linhas):** timeline de eventos, lances, próxima ação, indicação, risco, status.

### 2.2 Motores e regras já existentes
| Camada | Arquivo | O que faz |
|---|---|---|
| **Status** | enum `post_sale_status` | ativo · contemplado · quitado · inadimplente. |
| **Risco** | `postSale/postSaleRisk.ts` | Critical/Warning/Normal por contato + status. |
| **Alertas** | `postSale/postSaleAlerts.ts` | Sem contato, oportunidade pós-contemplação (90d). |
| **Prioridade** | `postSale/postSalePriority.ts` | Score por ação atrasada, inadimplência, contemplado, sem contato, oportunidade. |
| **Próxima ação** | `postSale/postSaleNextAction.ts` | `getNextActionUrgency` (overdue/today/...). |
| **Score unificado** | `utils/clientScoring.ts` | Mesmo motor da Carteira (quente/morno/frio · urgente/atenção/reativar). |
| **Eventos** | `post_sale_events` | contact, group_entry, bid_registered, contemplation, status_change, note, opportunity (kind=next_action / referral). |
| **Bids** | `post_sale_bids` | Histórico de lances do cliente já cliente. |
| **Auditoria** | `auditLog` | contact_post_sale_client, schedule_post_sale_action, register_post_sale_referral, register_post_sale_bid. |
| **Onboarding** | `PostSaleOnboardingModal` | Tour quando carteira pós-venda está vazia. |

### 2.3 O que o Pós-venda **já é hoje**
- Vai além de "clientes fechados": tem risco, prioridade, próximas ações, lances, indicações, oportunidade pós-contemplação (janela 90d).
- KPIs orientam decisão: "Em risco" e "Oportunidades" destacam-se com `highlight`.
- Toggle "O que fazer hoje" — disciplina diária forte.
- Integração com fechamento da Carteira: ao mover para "fechado" abre `ClosePostSaleConfirmModal` que cria o cliente pós-venda automaticamente.

### 2.4 O que **ainda é raso ou parece arquivo**
- **Render plano (lista)**: não há agrupamento por momento (recém-contemplados / próximos do término / inadimplentes / dormentes >120d). O gerente lê tudo linha a linha.
- **Sem visão patrimonial**: o cliente é tratado como um cartão isolado — não há "famílias" (mesmo CPF com múltiplos consórcios), nem **ticket total** sob gestão na carteira.
- **Sem ciclo de relacionamento programado**: cadência de contato não tem trilha (boas-vindas, 30d, 90d, aniversário do contrato, pré-assembleia, pós-assembleia). Hoje só "sem contato há Nd".
- **Mineração inativa**: contemplados com prazo restante curto, quitados elegíveis para nova venda, inadimplentes próximos de excludência — nada disso vira lista acionável automatizada.
- **Sem expansão patrimonial**: indicação existe mas não há campanha de upsell/cross (ex.: contemplado de auto → consórcio imóvel).
- **Sem integração com Assembleias**: o sistema sabe `next_assembly_date` do grupo (`groups.next_assembly_date`), mas o card pós-venda não exibe "assembleia em 4 dias" como gatilho.
- **IA ausente**: enquanto Análise/Cockpit/Abordagem têm storytelling/copilot, o Pós-venda não tem nada similar (nenhuma sugestão narrativa para retomada, lance, indicação).

---

## 3. Pipeline — auditoria das etapas

| Etapa | Faz sentido? | Observação |
|---|---|---|
| Prospecção | ✅ | SLA 5d/10d coerente com qualificação. |
| Aguardando retorno | ✅ | SLA 3d/7d agressivo — coerente. |
| Em avaliação | ✅ | SLA 4d/8d. Boa granularidade. |
| Proposta ajustada | ⚠️ | Útil para registrar revisão, mas é a **etapa mais ambígua**: muitas vezes vira "proposta enviada de novo". Risco de virar gaveta. |
| Fechado | ✅ | Faz handoff para Pós-venda. |
| Perdido | ✅ | Captura motivo nas notas (mas motivo livre, não enum). |

**Lacunas:**
- Não há "**Qualificado**" / "**Diagnóstico feito**" — pulo de prospecção para aguardando retorno é abrupto.
- "**Perdido**" não tem motivos estruturados (preço, timing, concorrente, sem fit) → impede aprendizado.
- "**Em pausa / reaquecer**" inexiste — leads frios viram perdidos ou ficam zumbis.

---

## 4. Follow-up — auditoria

**Pontos fortes:**
- SLA por coluna, graça 48h, hierarquia visual sem ruído duplo.
- Movimentação ativa exige `next_action_type` (modal `NextActionModal`).
- DailyAgenda concentra "atrasados / hoje / parados / quentes" em uma única lente.
- AlertsCenter (sino) replica visão agregada.
- Telemetria de fricção (cancel/skip) instrumentada.

**Pontos fracos:**
- **Cadência de copy** (`followUpCadence.ts`) é estática — 1 script por status, sem variação por trigger/perfil.
- **Sem batch action** ("disparar follow-up para todos os atrasados").
- **Sem snooze inteligente** — ao concluir uma ação não é sugerida a próxima janela (ex.: "agendar +3d").
- **Sem integração com canal** — WhatsApp é deeplink, mas não há registro automático "tentei contato em DD/MM" sem ação manual.
- DailyAgenda não distingue **leads dormentes** (ex.: 30d sem mover) — só usa `STALE_DAYS_WARN=3`.

---

## 5. Inteligência comercial — auditoria

| Sinal | Existe? | Onde |
|---|---|---|
| Status manual | ✅ | enum |
| Idade do lead | ✅ | priorityScore |
| Valor do crédito | ✅ | priorityScore |
| Próxima ação atrasada | ✅ | DailyAgenda, AlertsCenter |
| Trigger de prospecção | ⚠️ Capturado, **subutilizado** |
| Gatilho financeiro (FGTS, fim de financiamento) | ⚠️ Apenas como label do trigger |
| Momento de vida (aniversário, próxima assembleia) | ❌ |
| Propensão (quente/morno/frio) | ✅ Motor pronto, ❌ não exposto na Carteira |
| Patrimônio (ticket total, múltiplas cotas) | ❌ |
| Comportamento (abriu PDF, leu proposta compartilhada) | ⚠️ analytics_events existe, não vira lente |

**Diagnóstico:** o sistema tem **motor consultivo** mas **operação manual**. Os sinais existem, mas não viram lentes de carteira nem disparam ações.

---

## 6. Comparação com CRM bancário consultivo real

| Pergunta | Hoje |
|---|---|
| Ajuda minerar oportunidades dentro da carteira? | ❌ (apenas exibe) |
| Identifica gatilhos financeiros (fim de financiamento, FGTS)? | ⚠️ Captura, não dispara |
| Organiza follow-up de verdade? | ✅ Forte |
| Prioriza relacionamento (não só transação)? | ⚠️ Score existe, narrativa não |
| Parece carteira bancária (cliente como ativo recorrente)? | ⚠️ Pós-venda ainda parece "arquivo" |
| Parece consultoria patrimonial? | ❌ Sem visão consolidada de cliente |
| Parece CRM SaaS genérico? | ⚠️ Ainda em pontos: filtros, lentes, mineração |

**Veredito honesto:** Carteira está **70% CRM bancário consultivo**, 30% Kanban SaaS. Pós-venda está **40% gestão patrimonial**, 60% lista de clientes fechados.

---

## 7. Pós-venda patrimonial — auditoria

| Eixo | Atual |
|---|---|
| Continuidade (cadência programada) | ❌ |
| Recorrência (segundo consórcio, lance, indicação) | ⚠️ Indicação existe; cross-sell não |
| Retenção (alertas de risco) | ✅ Forte |
| Reentrada (quitado → nova venda) | ⚠️ Sinalizado, sem playbook |
| Expansão patrimonial (família, múltiplas cotas) | ❌ |

---

## 8. UX operacional — auditoria

**Pontos fortes:**
- Hierarquia visual disciplinada (faixa única + badge único).
- DailyAgenda + AlertsCenter + Forecast → camada superior coerente na Carteira.
- Toggle "O que fazer hoje" no Pós-venda — atalho mental excelente.
- Movimentação não fica "leve demais" (modal de ação obriga consciência).

**Pontos fracos:**
- **Carteira:** filtros fracos para quem opera 100+ leads. Falta lente por trigger e por temperatura (quente/morno/frio do clientScoring).
- **Pós-venda:** lista plana satura rápido. Sem agrupamento por "momento" (recém-contemplado / pré-assembleia / dormente / inadimplente / quitado-elegível).
- **Inconsistência arquitetônica:** Carteira é Kanban; Pós-venda é lista. O gerente troca de mapa mental entre os dois módulos.
- Pós-venda **não exibe** o `clientScoring` unificado (que já está disponível) — desperdício de motor.

---

## 9. Gargalos operacionais

1. Operação 1-a-1 (sem batch para follow-up de leads parados).
2. Trigger capturado mas não vira lente / agrupamento.
3. Pós-venda sem cadência programada → cliente esquecido vira inadimplente sem aviso prévio.
4. Sem integração Pós-venda × Assembleias (next_assembly_date é dado-órfão no card).
5. Forecast não inclui oportunidades do Pós-venda (cross-sell e indicação).
6. Motivos de "perdido" são livres → impede aprendizado.

---

## 10. Maturidade (scores honestos)

| Dimensão | Carteira | Pós-venda |
|---|---|---|
| Maturidade CRM | 7/10 | 5/10 |
| Maturidade Pipeline | 8/10 | — |
| Maturidade Pós-venda | — | 5/10 |
| Inteligência comercial ativada | 4/10 | 3/10 |
| Disciplina operacional (cadência/SLA) | 9/10 | 6/10 |
| Visão patrimonial | 2/10 | 3/10 |
| Mineração de carteira | 2/10 | 2/10 |
| UX consultiva | 7/10 | 6/10 |
| Não-redundância vs outros módulos | 8/10 | 8/10 |

**Score global Carteira: 7.0/10** — pipeline maduro, falta lente bancária.
**Score global Pós-venda: 5.0/10** — operacional, ainda não estratégico.

---

## 11. Oportunidades de evolução (organizadas por esforço)

### Pequenas (1–2 dias, alto impacto, sem inflar)
1. **Filtros bancários na Carteira:** trigger, faixa de crédito, temperatura (quente/morno/frio do clientScoring), "sem próxima ação", "atrasados". Reusa motor já existente.
2. **Expor `clientScoring` no card** (Carteira e Pós-venda): badge `🔥 Quente · 75pts` quando relevante. Substitui dois sistemas paralelos por uma leitura única.
3. **Motivos de "perdido" como enum** (preço, timing, concorrente, sem fit, sem retorno) → aprendizado de carteira.
4. **Pós-venda: agrupamento visual em 4 buckets** (Recém-contemplados / Pré-assembleia / Dormentes / Em risco) sem virar Kanban — apenas sections colapsáveis.
5. **Snooze inteligente** ao concluir ação: sugere "+3d / +7d / +14d / +30d" em um clique.

### Médias (3–5 dias)
6. **Lentes de carteira por trigger:** card-resumo "12 leads em FGTS · 3 atrasados" no header da Carteira (clica → filtra). Vira mineração visual.
7. **Pré-assembleia automática no Pós-venda:** quando `groups.next_assembly_date` ≤ 7d, card mostra alerta + sugestão de contato com lance. Conecta o motor de assembleias ao pós-venda.
8. **Cadência programada do Pós-venda:** trilha automática (D+1 boas-vindas → D+30 check → D+90 oferta lance → aniversário do contrato → pré-assembleia). Cria `post_sale_events` tipo `next_action` automaticamente.
9. **Forecast unificado:** SalesForecastCard soma "oportunidades pós-venda" (indicações em aberto, contemplados elegíveis para nova venda) ao gap mensal.
10. **Storytelling IA do Pós-venda:** edge function `post-sale-storytelling` análoga à `investment-storytelling` — gera mensagem contextual para retomada, lance ou indicação com Copiar+Enviar.

### Estratégicas futuras (semanas)
11. **Visão de cliente** (consolidação): mesmo CPF/telefone com múltiplos contratos → "ticket sob gestão", "número de cotas", "elegível para upsell". Requer chave de deduplicação.
12. **Mineração ativa**: jobs deterministas semanais que produzem listas acionáveis ("12 contemplados sem lance há 60d", "5 quitados elegíveis para nova venda"), exibidas na Carteira como "Caça-oportunidade da semana".
13. **Trilha consultiva por trigger** no Pós-venda (FGTS contemplado → script de antecipação; PJ contemplado → cross para frota).
14. **Eventos comportamentais como sinal de quente** (`analytics_events.proposal_pdf_viewed`, `proposal_link_opened`) → bumps automáticos no clientScoring.

---

## 12. Riscos de complexidade excessiva (linha vermelha)

❌ NÃO transformar em ERP/CRM monstro. Mantra:
- Pós-venda **não vira Kanban**. Lista agrupada por momento basta.
- Carteira **não vira BI**. PipelineMetricsModal já cumpre o papel — não criar dashboards paralelos.
- Filtros adicionais devem aparecer como **chips compactos**, não selects empilhados.
- Cadência programada do Pós-venda deve ser **opcional** e silenciosa — sem floods de toast.
- IA do Pós-venda deve seguir CSAA (memória `AI Standardization`) e nunca prometer garantia.
- Visão de cliente consolidada exige migração — só fazer quando houver 200+ clientes ativos por usuário.
- Não duplicar `clientScoring` em mais um motor — sempre reusar.

---

## 13. Resumo executivo

- **Carteira hoje:** pipeline maduro, disciplina operacional alta, motores ricos (forecast, prioridade, scoring, cadência por SLA), mas filtros pobres e mineração inativa. Score 7.0.
- **Pós-venda hoje:** funcional, com risco/prioridade/próxima ação, mas ainda parece arquivo de fechados. Sem cadência programada, sem agrupamento por momento, sem IA consultiva, sem ponte com Assembleias. Score 5.0.
- **Caminho curto:** ativar lentes bancárias (trigger, temperatura), expor `clientScoring` nos cards, agrupar Pós-venda por momento, motivar "perdido" como enum, snooze inteligente.
- **Caminho médio:** cadência programada de Pós-venda, ponte com Assembleias, storytelling IA, forecast unificado.
- **Caminho estratégico:** visão de cliente consolidada (patrimônio), mineração proativa semanal, trilhas consultivas por trigger.

> O sistema **já tem motor de carteira bancária**. Precisa virar **lente bancária**.

---

**Status:** Fase 1 (auditoria) concluída. Sem mudanças de código. Aguardando aprovação para abrir Onda de melhorias pequenas (itens 1–5) como próximo PR.
