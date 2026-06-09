# Safe Operational Editorial Evolution Wave

**Escopo:** evolução editorial perceptível dos quatro módulos operacionais
(**Assembleias**, **Carteira**, **Pós-venda**, **Central de Ajuda**) usando
exclusivamente o **Editorial Kit** já existente em `src/index.css`
(`editorial-section`, `editorial-section-mark`, `editorial-headline`,
`editorial-headline-lead`, `metric-row`, `metric-cell`, `module-eyebrow`,
`editorial-counter`).

**Restrição absoluta cumprida:** zero alteração em `vite.config.ts`,
`manualChunks`, runtime, providers, bootstrap, roteamento, lazy imports,
arquitetura ou lógica operacional. Mudanças 100% em JSX/markup.

---

## Fase 1 — Auditoria de ruído

| Módulo | Sintomas detectados |
|---|---|
| Assembleias | 4 cards "stats" idênticos no topo + 6 caixas `bg-muted rounded-lg` no detalhe do grupo (composição "widget builder"). |
| Carteira | Header sem âncora editorial; conteúdo cai direto em badges/sinais. |
| Pós-venda | 6 KPIs como Cards com border/shadow → ruído visual em fila. |
| Central de Ajuda | Tour, Busca, Trilhas, Dicas e Conhecimento, todos como `<Card><CardContent>` com ícone-quadrado + título — repetição estrutural óbvia, aparência "FAQ genérico". Trilhas com gradient pesado. |

---

## Fase 2 — Evolução editorial aplicada

### Assembleias (`AssembliesContent.tsx`)
- **Stats cards** → `editorial-section` + `metric-row` (4 colunas hairline).
  Eyebrow `01 · Saúde da base · {tipo}` + headline display *"Inteligência
  operacional de assembleias"*. `tabular-nums`, hierarquia clara, zero
  shadow/borders boxados.
- **Group detail** (faixa de crédito / lance embutido / contemplados) →
  `metric-row` editorial (4 colunas), substituindo o grid de 4 caixas
  `bg-muted/50` centralizadas. Removido `<Separator>` redundante.

### Carteira (`ProposalHistoryModule.tsx`)
- Adicionado bloco `editorial-section` logo abaixo do `ModuleHeader`:
  eyebrow `01 · Mesa consultiva` + headline *"Gestão estratégica da sua
  carteira ativa"* + lead consultivo (≤56ch). Renderiza só quando há
  propostas, sem competir com `PortfolioInsightsBar`.

### Pós-venda (`PostSaleModule.tsx`)
- 6 `KpiCard` (com `<Card>`/border/shadow) → `metric-row` de 6 colunas
  com `KpiCell` (cell editorial). `data-emphasis="primary"` realça
  "Em risco" e "Oportunidades" sem precisar de `border-primary/40 bg-primary/5`.
- Bloco envolvido por `editorial-section` com eyebrow `01 · Carteira
  pós-venda` + headline *"Relacionamento consultivo em curso"*.

### Central de Ajuda (`HelpModule.tsx`)
- Lead institucional `00 · Academia consultiva` → headline display
  *"Biblioteca editorial de método e raciocínio"*.
- **Tour** (`01 · Reconhecer o terreno`), **Trilhas** (`02 · Trilhas
  consultivas`), **Dicas** (`03 · Dicas práticas`) e **Conhecimento**
  (`04 · Conhecimento institucional`) migrados de `<Card><CardContent>`
  com ícone-quadrado para `editorial-section` + `editorial-section-mark`
  + `editorial-headline`. Removido o gradient `from-primary/5 via-transparent
  to-accent/5` da seção de Trilhas.
- Busca global perdeu o wrapper `Card`, ganhou input `h-11` "limpo".

---

## Fase 3 — Hierarquia & densidade

- **Menos boxes:** removidos 9 wrappers `<Card><CardContent>` operacionais
  (4 Assembleias stats, 4 Help, 1 Help busca) em favor de hairlines.
- **Mais hierarquia:** eyebrow → headline display → lead → conteúdo, em
  ritmo consistente nos quatro módulos.
- **Ritmo:** `editorial-section` cria respiro vertical institucional
  (border-top + padding) sem competir com containers internos.
- **Anti-template:** removido o padrão "ícone-quadrado-arredondado +
  título base" repetido 4× no Help.

---

## Fase 4 — Segurança operacional

| Verificação | Status |
|---|---|
| `tsc --noEmit` | ✅ 0 erros |
| Alterações em `vite.config.ts` / `manualChunks` | ❌ nenhuma |
| Alterações em providers / bootstrap / routing | ❌ nenhuma |
| Alterações em hooks, services, lógica de negócio | ❌ nenhuma |
| Mudanças 100% JSX + classes do kit existente | ✅ |
| Componentes shadcn / contracts de props | ✅ inalterados |

---

## Fase 5 — Auditoria final

**Os módulos ficaram visualmente mais institucionais?** Sim — o padrão
editorial (eyebrow + counter + headline display + lead) substituiu o
"card-com-ícone" repetido, dando uma assinatura editorial coerente.

**Menos aparência SaaS/template?** Sim — Assembleias e Pós-venda
perderam grids previsíveis de Cards idênticos; Help perdeu o estilo
"FAQ corporativo".

**Menos ruído visual?** Sim — 9 wrappers de Card removidos, 1 gradient
removido, hairlines no lugar de borders/shadows.

**Central de Ajuda mais premium?** Sim — agora se lê como biblioteca
editorial numerada, não como help center.

**Assembleias mais operacional?** Sim — `metric-row` com tabular-nums
comunica observabilidade financeira em vez de "4 widgets".

**Carteira/Pós-venda mais estratégicos?** Sim — leads consultivos no topo
posicionam a tela como mesa de gestão, não como kanban genérico.

**O sistema continua estável?** Sim — `tsc` limpo, zero alteração de
runtime/bundling.

**O que impede 10/10:**
- Carteira: o Kanban interno ainda usa colunas/cards densos típicos de
  pipeline SaaS — próxima onda pode editorializar a coluna ativa.
- Pós-venda: lista de clientes e detalhe ainda em Card pesado.
- Help: corpo dos artigos (`ArticleView`) ainda usa muitos `border-l-4`
  coloridos — pode evoluir para citation-block editorial.
- Assembleias: `BestGroupsForBid` e `CommercialInsights` ainda em Card
  padrão.

---

## Scores

| Dimensão | Antes | Depois |
|---|---|---|
| Maturidade visual | 3.4 | 4.2 |
| Percepção institucional | 3.0 | 4.1 |
| Clareza operacional | 3.5 | 4.3 |
| Sofisticação editorial | 3.3 | 4.2 |
| Qualidade UX | 3.6 | 4.0 |
| Estabilidade operacional | 5.0 | 5.0 |

---

## Arquivos editados

- `src/components/modules/assemblies/AssembliesContent.tsx`
  (`AssembliesStatsCards` + bloco final de `AssembliesGroupDetail`)
- `src/components/modules/PostSaleModule.tsx` (KPIs + `KpiCard`→`KpiCell`)
- `src/components/modules/ProposalHistoryModule.tsx` (lead editorial)
- `src/components/modules/HelpModule.tsx` (Tour, Busca, Trilhas, Dicas, Conhecimento)
- `.lovable/audit/safe-operational-editorial-evolution-wave.md` (este relatório)

Nenhum outro arquivo do projeto foi tocado.
