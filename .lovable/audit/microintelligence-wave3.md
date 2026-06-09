# Onda 3 — Microinteligência Contextual (Carteira + Pós-venda)

> Status: ✅ entregue
> Escopo: micro sinais discretos, sem IA pesada, sem dashboards, sem novas tabelas.
> Premissa: o sistema deve **parecer atento**, não barulhento.

---

## 1. Objetivo

Aumentar a percepção de inteligência da Carteira e do Pós-venda **sem inflar UX**:

- Detectar oportunidades esquecidas (cliente quente sem ação).
- Detectar relacionamento esfriando antes de virar dormente.
- Reforçar a janela pós-contemplação (0–90d).
- Avisar quando uma proposta está perdendo tração.

Tudo em **chips compactos** com tooltip, no máximo **2 por card**, sem modais, sem toasts, sem popups.

---

## 2. Helper único — `relationshipSignals.ts`

Arquivo novo: `src/utils/relationshipSignals.ts`.

Centraliza toda a microinteligência em duas funções puras e determinísticas:

| Função | Entrada | Saída |
|--------|---------|-------|
| `getProposalRelationshipSignals(proposal, unified)`        | `ProposalRecord` + `ClientScore` | até 2 chips |
| `getPostSaleRelationshipSignals(client, unified, action)`  | `PostSaleClient` + `ClientScore` + próxima ação | até 2 chips |

### Sinais reconhecidos

| ID | Emoji | Label | Quando dispara | Tom |
|----|-------|-------|----------------|-----|
| `hot_forgotten`              | 🔥 | Quente esquecido            | score quente + sem próxima ação + ≥5d (carteira) / ≥30d (pós-venda) sem contato | `attention` (warning) |
| `losing_traction`            | 👀 | Perdendo tração             | follow-up vencido OU morno parado ≥10d sem ação (carteira) | `attention` (warning) |
| `cooling`                    | 🌡️ | Relacionamento esfriando    | ativo + ≥30d sem interação + temperatura ≥ morno | `subtle` (muted) |
| `post_contemplation_window`  | 💡 | Janela forte de relacionamento | contemplado nos últimos 90d (pós-venda) | `opportunity` (primary) |

Regras de boa convivência:

- Inadimplente / fechado / perdido **não recebe sinais** — esses estados já têm tratamento próprio (risco / momento / coluna terminal).
- `cooling` **não compete** com `hot_forgotten` ou `losing_traction` (suprimido se já houver outro).
- Ordenação por `priority` numérica + corte em 2 (`MAX_SIGNALS_PER_CARD`).
- Cores 100% via design tokens (`SIGNAL_TONE_CLASS`): `warning`, `primary`, `muted`. Sem destructive — proibido alarmar.

---

## 3. Onde aparecem

### Carteira — `ProposalCardContent.tsx`
- Render entre o bloco de "Sugestão consultiva" e o "Status badge urgência".
- Chip pill arredondado (mesma linguagem visual do badge de temperatura).
- Não duplica `missing-action-soft`/`missing-action-strong` (que vêm de `cadenceRules.ts`): os sinais aqui leem **outra dimensão** (recência + score) e podem coexistir.

### Pós-venda — `PostSaleModule.tsx` (`ClientCard`)
- Render logo após os `opportunityChips` existentes (`💡 Potencial nova operação`, `⭐ Crédito alto`, etc.).
- Mesma linguagem visual de chip outline.
- **Não duplica** `getOpportunityChips`: aquele é "potencial patrimonial", este é "atenção/janela de relacionamento".

---

## 4. Fronteiras com outros módulos

| Módulo | Responsabilidade | Onda 3 invade? |
|--------|------------------|----------------|
| **Cockpit** | Próximo passo da venda atual | ❌ não — Cockpit não usa `relationshipSignals` |
| **Cadência (Kanban)** | SLA por coluna (warn/critical, missing-action) | ❌ não — sinal independente, leitura por recência + score |
| **Risco (Pós-venda)** | Inadimplência, atraso de assembleia | ❌ não — inadimplente é excluído dos sinais |
| **Momento (Pós-venda Onda 2)** | Agrupamento por fase de relacionamento | ❌ não — sinais são chips dentro do card, não agrupam |
| **AI Insights** | Recomendações de venda | ❌ não — sem chamadas de IA |

---

## 5. Validação UX operacional

Cenário: gerente abre Carteira e Pós-venda e bate o olho.

| Pergunta | Antes | Depois |
|----------|-------|--------|
| "Tem cliente quente parado?" | precisava abrir o card e ver score + last update | chip 🔥 visível no card |
| "Quem está esfriando?" | invisível até virar dormente | chip 🌡️ discreto antes do problema |
| "Tem janela aberta após contemplação?" | só pelo emoji 🏆 do banner | chip 💡 ressalta a janela 0–90d |
| "Tem proposta perdendo força?" | só o badge de SLA (depois de muitos dias) | chip 👀 já no follow-up vencido |

**Densidade visual:** ≤ 2 chips por card, mesma altura dos badges existentes — sem aumentar altura média do card.

---

## 6. Before / After conceitual

```
ANTES (Pós-venda card)
┌──────────────────────────────────────────┐
│ 🟢 Cliente X · 🔴 Alta · 🔥 Quente · ...│
│ R$ 250k · 120m · Grupo 1234              │
│ 💡 Potencial nova operação · ⭐ Crédito alto│
│ 🎯 Próxima ação: ligar — Hoje            │
└──────────────────────────────────────────┘

DEPOIS (Pós-venda card · com microsinais)
┌──────────────────────────────────────────┐
│ 🟢 Cliente X · 🔴 Alta · 🔥 Quente · ...│
│ R$ 250k · 120m · Grupo 1234              │
│ 💡 Potencial nova operação · ⭐ Crédito alto│
│ 🌡️ Relacionamento esfriando              │  ← sinal leve novo
│ 🎯 Próxima ação: ligar — Hoje            │
└──────────────────────────────────────────┘
```

```
ANTES (Carteira proposal card)
┌──────────────────────────────────────────┐
│ 👤 Maria · 🔥 Quente · 87                │
│ R$ 180k · 1,4k/m · 120m                  │
│ ✨ Defina próxima ação                    │
│ 📞 WhatsApp     ⋯ ✏️ 🗑                 │
└──────────────────────────────────────────┘

DEPOIS (Carteira · com microsinais)
┌──────────────────────────────────────────┐
│ 👤 Maria · 🔥 Quente · 87                │
│ R$ 180k · 1,4k/m · 120m                  │
│ ✨ Defina próxima ação                    │
│ 🔥 Quente esquecido   👀 Perdendo tração │  ← chips novos
│ 📞 WhatsApp     ⋯ ✏️ 🗑                 │
└──────────────────────────────────────────┘
```

---

## 7. Riscos restantes

| Risco | Mitigação |
|-------|-----------|
| Excesso de chips em cards muito antigos | `MAX_SIGNALS_PER_CARD = 2` + supressão de `cooling` |
| Falsos positivos de "cooling" em férias/feriados | Tom `subtle` (muted) + texto não alarmista |
| Confusão com badge de SLA do Kanban | Sinais usam `warning`/`primary`/`muted`; cadência usa `destructive` (faixa lateral). Linguagens distintas. |
| Crescimento futuro descontrolado | Toda nova heurística entra em `relationshipSignals.ts` — fonte única para calibrar. |

---

## 8. Próximos passos sugeridos (opcionais — não nesta onda)

- Telemetria leve: contar quantas vezes cada `signalId` aparece por usuário/semana → calibrar limiares.
- Filtro rápido na Carteira: "🔥 Apenas quentes esquecidos" (chip-toggle).
- Agrupar Pós-venda dormentes por sinal `cooling` em uma sub-section da seção Dormentes.

---

## 9. Resumo

- ✅ 1 helper centralizado, sem nova IA, sem novo backend.
- ✅ 2 cards plugados (Carteira + Pós-venda).
- ✅ 4 sinais contextuais, máx. 2 por card, tom não alarmista.
- ✅ Sem invasão de Cockpit, Cadência, Risco ou Momento.
- ✅ Mensagem do sistema: **"o CRM está atento ao relacionamento"**.
