# Onda 4 — Inteligência Temporal Silenciosa (Carteira + Pós-venda)

> Status: ✅ entregue
> Escopo: heurísticas temporais leves, sem IA, sem dashboards, sem novas tabelas.
> Premissa: o sistema deve **entender o ritmo do relacionamento**, não prever o futuro.

---

## 1. Objetivo

Adicionar uma camada **temporal** ao Pipeline e ao Pós-venda:

- Sugerir cadência natural de retomada.
- Reconhecer ritmo típico por trigger comercial (FGTS, agro, PJ…).
- Marcar relacionamentos consolidados (≥ 1 ano).

Tudo em **1 chip temporal por card no máximo**, com tooltip — sem modais, sem toasts, sem promessas.

---

## 2. Helper único — `relationshipTimingSignals.ts`

Arquivo novo: `src/utils/relationshipTimingSignals.ts`.

Duas funções puras, determinísticas:

| Função | Entrada | Saída |
|--------|---------|-------|
| `getProposalTimingSignal(proposal)` | `ProposalRecord` | até 1 chip |
| `getPostSaleTimingSignal(client)`   | `PostSaleClient` | até 1 chip |

### Sinais reconhecidos

| ID | Emoji | Label | Quando dispara | Tom |
|----|-------|-------|----------------|-----|
| `cadence_retake`        | ⏱️ / 🔁 | Bom momento para retomar / Hora de reaproximar / Decisão próxima | Carteira: aguardando_retorno 3–7d, em_avaliacao 4–10d, proposta_ajustada 2–5d (sem ação programada). Pós-venda: ativo 60–120d sem contato | `subtle` / `opportunity` |
| `trigger_window`        | 💎🔄🏠💰📈🚛🌾🏛️ | Ritmo típico do trigger | Carteira: por `prospect_trigger`, fora de fechado/perdido | `subtle` |
| `mature_relationship`   | 🤝 | Relacionamento consolidado | Pós-venda: cliente na carteira ≥ 365d | `opportunity` |

### Heurísticas por trigger

| Trigger        | Mensagem |
|----------------|----------|
| `fgts`         | "Trigger FGTS costuma converter rápido — janela curta." |
| `financiamento`| "Saindo de financiamento: decisão tende a ser rápida." |
| `aluguel`      | "Pagando aluguel: ciclo médio, exige nutrição constante." |
| `liquidez`     | "Liquidez parada: decisão acelera quando o argumento amadurece." |
| `investidor`   | "Investidor: ciclo médio — costuma comparar antes de fechar." |
| `pj`           | "PJ/frota: decisão multi-pessoa — follow-up paciente." |
| `agro`         | "Agro: ciclo longo, sazonal — follow-up sem pressa." |
| `sucessao`     | "Sucessão patrimonial: ciclo longo e sensível." |

### Regras de boa convivência

- **Máximo 1 chip por card** (`MAX_TIMING = 1`).
- Cadência tem prioridade sobre trigger (Carteira) e sobre maturidade (Pós-venda).
- Inadimplente / fechado / perdido **não recebe sinais** — outros sistemas já tratam.
- Cores via tokens: `muted` (subtle) ou `primary/10` (opportunity). **Sem `destructive`** — proibido alarmar.
- Texto sempre em modo "costuma" / "tende a" — nunca preditivo.

---

## 3. Onde aparecem

### Carteira — `ProposalCardContent.tsx`
- Render entre `relationshipSignals` (Onda 3) e `renderStatusBadge`.
- Pill arredondado idêntico aos chips da Onda 3 — densidade visual zero adicional.

### Pós-venda — `PostSaleModule.tsx` (`ClientCard`)
- Render entre `relationshipSignals` e `Banner de oportunidade`.
- Mesma linguagem visual de `Badge variant="outline"`.

---

## 4. Fronteiras com outros módulos

| Módulo | Responsabilidade | Onda 4 invade? |
|--------|------------------|----------------|
| **Cockpit** | Direção da venda atual | ❌ — Cockpit não consome `relationshipTimingSignals` |
| **Cadência (cadenceRules)** | SLA por coluna (warn/critical/missing-action) | ❌ — leitura independente; sinal Onda 4 só dispara fora dessas faixas |
| **Risco (Pós-venda)** | Inadimplência | ❌ — inadimplente excluído |
| **Momento (Onda 2)** | Agrupamento por fase | ❌ — chips ficam dentro do card, não agrupam |
| **Sinais Onda 3** | Atenção / janela / esfriando | ❌ — tom diferente; coexistem (Onda 3 = estado, Onda 4 = ritmo) |
| **Abordagem / Proposta** | Conversa / formalização | ❌ — sem cross-import |

---

## 5. Validação UX operacional

Cenário: gerente bate o olho na carteira/pós-venda.

| Pergunta | Antes | Depois |
|----------|-------|--------|
| "Esse FGTS tem urgência?" | precisava lembrar do trigger e da janela | chip 💎 "Ritmo típico" no card |
| "Quanto tempo posso esperar nesse agro?" | intuição do gerente | chip 🌾 indica ciclo longo |
| "Quando retomar contato?" | snooze manual | chip ⏱️ "Bom momento para retomar" no momento certo |
| "Esse cliente é antigo?" | invisível na lista | chip 🤝 "Relacionamento consolidado" |

**Densidade visual:** 1 chip a mais no máximo, mesma altura. Sem inflar card.

---

## 6. Before / After conceitual

```
ANTES (Carteira card)
┌──────────────────────────────────────────┐
│ 👤 Maria · 🔥 Quente · 87                │
│ R$ 180k · 1,4k/m · 120m                  │
│ ✨ Defina próxima ação                    │
│ 🔥 Quente esquecido   👀 Perdendo tração │
│ 📞 WhatsApp     ⋯ ✏️ 🗑                 │
└──────────────────────────────────────────┘

DEPOIS (Carteira · com sinal temporal)
┌──────────────────────────────────────────┐
│ 👤 Maria · 🔥 Quente · 87                │
│ R$ 180k · 1,4k/m · 120m                  │
│ ✨ Defina próxima ação                    │
│ 🔥 Quente esquecido   👀 Perdendo tração │
│ 💎 Ritmo típico do trigger               │  ← novo chip Onda 4
│ 📞 WhatsApp     ⋯ ✏️ 🗑                 │
└──────────────────────────────────────────┘
```

```
ANTES (Pós-venda card · cliente antigo ativo)
┌──────────────────────────────────────────┐
│ 🟢 Cliente X · ... · ⭐ Crédito alto    │
│ R$ 250k · 120m · Grupo 1234              │
│ 🌡️ Relacionamento esfriando              │
└──────────────────────────────────────────┘

DEPOIS
┌──────────────────────────────────────────┐
│ 🟢 Cliente X · ... · ⭐ Crédito alto    │
│ R$ 250k · 120m · Grupo 1234              │
│ 🌡️ Relacionamento esfriando              │
│ 🤝 Relacionamento consolidado            │  ← novo chip Onda 4
└──────────────────────────────────────────┘
```

---

## 7. Riscos restantes

| Risco | Mitigação |
|-------|-----------|
| Repetição "óbvia" do trigger em todo card de FGTS | Texto curto + 1 chip por card; não vira ruído porque cada gerente vê pouco do mesmo trigger no kanban |
| Gerente confundir cadência com obrigação | Tom "costuma / bom momento" + cor `muted`; nunca destructive |
| Falsos "consolidados" em clientes herdados | Só dispara para `created_at ≥ 1 ano` (no banco já houve relacionamento) |
| Crescimento futuro descontrolado | Toda heurística temporal nova entra em `relationshipTimingSignals.ts` — fonte única para calibrar |

---

## 8. Próximos passos (não nesta onda)

- Telemetria leve: medir clique em chips temporais → calibrar copy.
- Per-trigger window measurável: usar `fechado` médio por trigger para refinar mensagens (em vez de heurística estática).
- Sinal de "dia útil" no Pós-venda quando assembleia cair em fim de semana.

---

## 9. Resumo

- ✅ 1 helper centralizado, sem IA, sem novo backend.
- ✅ 2 cards plugados (Carteira + Pós-venda).
- ✅ 3 famílias de sinal temporal (cadência, trigger, maturidade), máx. 1 por card.
- ✅ Sem invasão de Cockpit, Cadência, Risco, Momento, Onda 3, Abordagem ou Proposta.
- ✅ Mensagem do sistema: **"o CRM entende o ritmo do relacionamento"**.
