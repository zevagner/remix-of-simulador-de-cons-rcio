# Pós-venda · Onda 2 — Evolução para Relacionamento Patrimonial

**Mantra:** "Pós-venda mostra **quem merece atenção agora** — sem virar ERP."

---

## Entregue nesta onda

### 1. Agrupamento por momento (sections colapsáveis)
Novo helper `postSaleMoments.ts` classifica cada cliente em **um único momento de relacionamento**, com prioridade determinística:

| Ordem | Momento | Critério | Default |
|---|---|---|---|
| 1 | 🚨 Em risco | inadimplente OU `risk.level === 'critical'` | aberto |
| 2 | ⏰ Pré-assembleia | ativo + próxima assembleia em 0–7 dias | aberto |
| 3 | 🏆 Recém contemplados | contemplado há ≤ 90 dias | aberto |
| 4 | ✅ Quitados elegíveis | status `quitado` | recolhido |
| 5 | ❄️ Dormentes | temperatura fria + ≥ 30d sem contato | recolhido |
| 6 | 📋 Acompanhamento | demais | recolhido |

Sections renderizam em `Collapsible` com **contagem + descrição curta**. Sem nesting, sem Kanban.

### 2. Badge de temperatura no `ClientCard`
Já existia (`scorePostSaleClient` + `TEMPERATURE_BADGE`) — mantido sem inflar. Reaproveitado também pela classificação de momento.

### 3. Alerta pré-assembleia (≤ 7 dias)
Novo bloco compacto no card quando `groups.next_assembly_date` aponta para os próximos 7 dias:

> ⏰ Assembleia em 5 dias — reativar antes do evento.

Fonte: `useAssemblies()` (mesma cache do módulo Assembleias). Indexada em `Map<"tipo:grupo", date>`.

### 4. Chips de oportunidade patrimonial
`getOpportunityChips()` deriva sinais de dados existentes:
- 💡 **Potencial nova operação** — contemplado/quitado
- 🔁 **Possível reentrada** — quitado
- 🔥 **Quente parado** — temperatura quente sem próxima ação
- ⭐ **Crédito alto** — ticket ≥ R$ 300k

Discretos, com tooltip explicando o sinal. Sem IA, sem novos motores.

### 5. Priorização visual leve
- Sections aparecem em ordem de urgência (Em risco → Pré-assembleia → Contemplados → Quitados → Dormentes → Acompanhamento).
- Default-open só nas 3 sections críticas (gerente vê o que importa sem clicar).
- Cards mantêm ordenação interna por `priorityScore` desc.

---

## Before / After conceitual

| Dimensão | Antes (Onda 1) | Depois (Onda 2) |
|---|---|---|
| Estrutura | Lista plana ordenada por score | 6 sections colapsáveis por momento |
| Janela "agora" | Inferido pelo gerente lendo a fila | Top 3 sections já mostram o que merece atenção |
| Assembleia | Sem visibilidade no card | Alerta amber automático ≤ 7 dias |
| Oportunidade | Apenas banner contemplado/quitado | Chips contextuais (4 sinais derivados) |
| Identidade | Lista de clientes | Central de relacionamento patrimonial |

---

## O que NÃO foi feito (preservação de escopo)

- ❌ Sem dashboards / gráficos / widgets pesados
- ❌ Sem novas tabelas, RLS ou backend
- ❌ Sem nova IA — chips são determinísticos
- ❌ Sem Kanban — só Collapsible leve
- ❌ Sem invadir Carteira (pipeline) ou Cockpit (direção)

---

## Riscos restantes

1. **`next_assembly_date` ausente nos grupos** → alerta simplesmente não aparece (degrada bem). Sem regressão.
2. **Cliente sem `group_number`** → não recebe alerta de assembleia (esperado).
3. **Gerente com poucos clientes** verá várias sections com 1 item; mitigado: sections vazias são ocultadas e só 3 abrem por padrão.
4. **`POST_CONTEMPLATION_OPPORTUNITY_DAYS = 90`** define a janela de "recém contemplados"; pode ser calibrado depois com dados reais sem refator.

---

## Fronteiras preservadas

| Módulo | Papel |
|---|---|
| **Carteira** | Pipeline ativo de venda |
| **Pós-venda** | Relacionamento contínuo + oportunidade patrimonial |
| **Cockpit** | Direção da próxima ação dentro de uma simulação |
| **Abordagem** | Conversa consultiva |
| **Proposta** | Formalização |

Nenhum módulo invadiu outro.

---

## Score final (estimativa)

| Dimensão | Onda 1 | Onda 2 |
|---|---|---|
| Maturidade CRM bancário | 6.5 | 7.5 |
| Escaneabilidade operacional | 6 | 8 |
| Inteligência percebida | 6 | 8 |
| Foco em oportunidade patrimonial | 4 | 7.5 |
| Risco de inflar sistema | baixo | baixo (mantido) |

---

## Arquivos tocados

- **Novo:** `src/components/modules/postSale/postSaleMoments.ts`
- **Editado:** `src/components/modules/PostSaleModule.tsx`
  - Hook `useAssemblies()` para mapear `(tipo:grupo) → próxima assembleia`
  - `enriched` agora inclui `unified`, `nextAssemblyDate`, `moment`, `opportunityChips`
  - Lista renderiza via `MomentGroupedList` + `MomentSection` (Collapsible)
  - `ClientCard` ganha bloco pré-assembleia + chips de oportunidade

---

## Próximas ondas sugeridas

- **Onda 2.1:** persistir o estado open/closed das sections por usuário (localStorage).
- **Onda 3:** opção de filtro "só momentos críticos" no header (ocultar Dormentes/Acompanhamento).
- **Onda 4:** mostrar contagem de momentos críticos como pílula no item da Sidebar (`Pós-venda · 3 ⚠️`).
