# Onda 1 — Carteira & Pós-venda · Implementação

> Ativar inteligência que **já existia** sem inflar o sistema. Sem alterações de schema, RLS, multi-tenant, motores financeiros ou pipeline PDF.

## Entregas

### 1. Filtros bancários na Carteira ✅
**Arquivo novo:** `src/components/modules/pipeline/CarteiraFilters.tsx`

Reusa motores existentes (`scoreProposalUnified`, `ACTIVE_STATUSES`, `prospect_trigger`):
- 🔥 Quentes · 🌤️ Mornos · ❄️ Frios (vindo do `clientScoring`)
- ⚠️ Sem ação · ⏰ Atrasados (deriva de `next_action_type` + `next_contact_date`)
- Faixa de crédito: até 200k · 200k–500k · 500k–1M · 1M+
- Botão **Limpar filtros** quando algum está ativo

Helper `applyCarteiraFilters()` exportado pelo `pipeline/index.ts` faz a filtragem composta com a busca textual existente.

### 2. Triggers como lentes ✅
Linha superior do `CarteiraFilters` mostra cada `PROSPECT_TRIGGER` com lead ativo como chip:
```
💎 FGTS · 12 · [3 atrasados]
🏠 Aluguel · 7
🚛 PJ · 4 · [1 atrasado]
```
Triggers sem leads ficam ocultos para manter compactação. Badge vermelho de atrasados aparece apenas quando há.

### 3. clientScoring exposto nos cards ✅ (Carteira) · ⏭️ adiado (Pós-venda)
- **Carteira:** já estava exposto em `ProposalCardContent` via `tempCfg = TEMPERATURE_BADGE[unified.temperature]` (badge tooltip no header). Agora também é **filtrável**.
- **Pós-venda:** adiado para Onda 2 — exige refator do `ClientCard` em `PostSaleModule.tsx`. Motor `scorePostSaleClient` já está pronto, basta plugar.

### 4. Motivos estruturados de "Perdido" ✅
**Arquivo novo:** `src/components/modules/pipeline/lostReasons.ts`

8 motivos enum (preço · timing · concorrente · sem fit · sem retorno · desistiu · financiamento · prioridade mudou) com helpers `readLostReason / stripLostReason / applyLostReason`.

**UX:** quando status muda para `perdido` no `EditProposalModal`, aparece bloco com chips selecionáveis. Persistido como prefixo `[Motivo: <slug>]` em `notes` — **zero migração**, agregável por regex, evolui para coluna dedicada quando houver volume.

### 5. Snooze inteligente ✅
**Arquivo:** `src/components/modules/pipeline/NextActionModal.tsx`

Linha de chips abaixo do date picker: **Amanhã · +3d · +7d · +14d · +30d**. Um clique substitui a data. Sem modal pesado, sem flow novo.

### 6. Agrupamento Pós-venda ⏭️ adiado para Onda 2
Decisão de escopo: a refatoração da lista do `PostSaleModule` (4–5 sections colapsáveis: Recém contemplados / Pré-assembleia / Em risco / Dormentes / Quitados elegíveis) precisa de mais ajustes do que cabia nesta janela. Os motores (`getClientRisk`, `computeClientAlerts`, `POST_CONTEMPLATION_OPPORTUNITY_DAYS`) já estão prontos para alimentar os buckets — é trabalho de UI puro na próxima onda.

---

## Arquivos modificados

| Arquivo | Tipo |
|---|---|
| `src/components/modules/pipeline/CarteiraFilters.tsx` | novo |
| `src/components/modules/pipeline/lostReasons.ts` | novo |
| `src/components/modules/pipeline/index.ts` | export dos novos |
| `src/components/modules/pipeline/NextActionModal.tsx` | chips snooze |
| `src/components/modules/pipeline/EditProposalModal.tsx` | bloco motivo perdido |
| `src/components/modules/ProposalHistoryModule.tsx` | wire-up dos filtros |

## Before / After conceitual

**Carteira antes:** Kanban + busca textual. Triggers eram apenas labels. Score quente/morno/frio invisível na operação. Motivo de perda livre. Snooze obrigava digitar data.

**Carteira agora:** abre direto em **central de oportunidades** — chips no topo dizem onde estão os 12 leads de FGTS, quais 3 estão atrasados, quantos estão "quentes esperando", quantos estão sem próxima ação. Snooze é um clique. Perda vira aprendizado agregável.

## Riscos restantes
- Motivos de perda em `notes` não são consultáveis por SQL nativo até virarem coluna; aceitável para v1.
- Pós-venda continua em lista plana até Onda 2 — sem regressão, mas o ganho assimétrico fica para depois.
- Filtros não são persistidos em localStorage (decisão consciente: filtro é exploratório, não preferência permanente).

## Identidade dos módulos preservada
Cockpit · Abordagem · Proposta · Pós-venda **não foram tocados**. Carteira ganhou lentes, não responsabilidades novas.

## Próxima onda (sugerida)
1. Agrupamento por momento no Pós-venda (sections colapsáveis).
2. Badge `🔥/🌤️/❄️` no `ClientCard` do Pós-venda usando `scorePostSaleClient`.
3. Pré-assembleia automática: alerta quando `groups.next_assembly_date ≤ 7d` para clientes do grupo.
4. Cadência programada (D+1 / D+30 / pré-assembleia) gerando `post_sale_events` automaticamente.
