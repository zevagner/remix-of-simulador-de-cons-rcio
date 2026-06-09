# Super Auditoria de Refinamento Fino

**Escopo:** polimento operacional e perceptivo. Sem novas features, sem novos
módulos, sem alterar regras de negócio, backend, multi-tenant ou RLS.

**Pergunta-guia:** *"o gerente entende isso em segundos?"*

---

## 1. Escaneabilidade — por módulo

| Módulo | Densidade | Hot spots | Diagnóstico curto |
|--------|-----------|-----------|-------------------|
| Simulador | Média | Inputs + resultados na mesma viewport | OK; subtítulo do header pode sumir (já há ModuleHeader sem subtitle) |
| Cockpit | **Alta** | KPIs + AIInsights + pitches + triggers | Boundary já consolidado (Onda Cockpit); reforçar regra "indica, não resolve" |
| Comparador | Média | Tabela longa + chips de cenário | OK; títulos de coluna ainda redundantes ("Cenário Caixa" / "Cenário Comparado") |
| Investimentos | **Alta** (842 linhas) | 6 paths + storytelling + sliders | Excesso de cards expandidos por default — colapsar paths 4–6 |
| Estudo de Lances | Média | Tabela + gráfico + zonas + status | Status "Vantage" e "Zona" ocupam 2 chips quando 1 basta |
| Op. Estruturadas | Baixa | OK | Headline genérico pode ganhar subtítulo curto |
| Abordagem | Média | Storytelling + objeções + triggers | 3 blocos competem; ordem fixa precisa hierarquia |
| Proposta | Média | Templates + preview + ações | OK; CTA "Copiar" e "Enviar" repetem em rodapé |
| **Carteira** | **Alta** (773 linhas) | header → insights bar → priority badges → AlertsCenter → métricas → search → filtros bancários → forecast → daily agenda → kanban | **9 blocos antes do Kanban**. Maior gargalo do sistema. |
| Pós-venda | Alta (845 linhas) | header → insights bar → 6 KPIs → filtros → moments colapsáveis → cards | KPIs em 6 colunas competem com PortfolioInsightsBar |

### Top 3 problemas de escaneabilidade
1. **Carteira tem 9 blocos pré-Kanban.** O usuário rola para chegar ao Kanban.
   Recomendação: agrupar `AlertsCenter + Métricas + Tour` num único cluster
   no header; Forecast e DailyAgenda devem ficar em `<details>` colapsável
   ("Hoje" expandido por default, "Forecast" colapsado).
2. **Cards de Pipeline com 6+ chips visíveis** (priority + temperatura +
   relationshipSignal + timingSignal + lostReason + opportunity). Cap visual
   já é 2 timing + 2 ops, mas somados podem chegar a 5. Hard cap único = 3
   chips totais por card (priority sempre visível, demais por relevância).
3. **Investimento expande 6 cenários** ao abrir. Mantém apenas 3 expandidos;
   demais em accordion compacto.

---

## 2. Microcopy

### Problemas detectados
| Local | Antes | Depois sugerido |
|-------|-------|-----------------|
| Carteira subtitle | "0 ativas · 0 fechadas — acompanhe e priorize suas oportunidades" | "Suas propostas em andamento" (subtítulo curto; counts vão pro chip) |
| Pós-venda subtitle | "Acompanhe clientes ativos e gere novas oportunidades" | "Relacionamento contínuo após a venda" |
| Proposta subtitle | "Personalize e envie a proposta ao cliente" | "Monte e envie a proposta" |
| Simulador empty | (header sem subtitle) | "Calcule crédito, prazo e parcela" |
| AlertsCenter botão | "Métricas" | "Conversão" (mais bancário) |
| Tour | "Tour Guiado" | "Como usar" |
| ChipNoNextAction | (genérico) | "Sem próxima ação" |

### Padrões a banir (memória já cobre, reforçar)
- "Comercial", "completa", "inteligente", "prático" em títulos.
- "Aqui você encontra…", "Bem-vindo…", "Veja agora…".
- Promessas ("garante", "certeza de contemplação") — já vetado por memória global.

### Padrão recomendado
- **Título:** substantivo curto (1 palavra quando possível).
- **Subtítulo:** verbo no imperativo, ≤ 6 palavras.
- **CTA:** verbo no infinitivo (Enviar, Copiar, Abrir, Avançar).

---

## 3. Ritmo visual

### Densidade vertical
- Carteira > 9 seções acima do Kanban → consolidar para ≤ 5.
- Pós-venda KPIs em 6 colunas em desktop ainda ocupam altura significativa em
  tablets (md: 2 linhas). Reduzir para 4 KPIs principais; "Pendentes" e
  "Quitados" entram em tooltip do "Ativos".
- Investimento: alturas inconsistentes entre paths (some > 700px). Padronizar
  card height (`min-h-[320px] max-h-[480px]` com scroll interno).

### Espaçamento
- `space-y-5` é padrão dos módulos — manter.
- Cards do Pós-venda usam `gap-3`, do Pipeline `gap-2`. Padronizar `gap-3`.
- Filtros bancários e Search em Carteira têm `mt` próprios — alinhar via wrapper único `.module-filters` (sem novo componente, só reuso de `space-y-3`).

### Contraste
- Chips `tone="info"` (muted) ficam abaixo do limiar AA quando sobrepostos a
  `bg-muted/30`. Trocar para `bg-background border` em superfícies muted.

---

## 4. Carga cognitiva

### Sinais simultâneos competindo
- **Pipeline header (Carteira):** Priority badges + AlertsCenter + Métricas +
  Tour + insights bar = **5 vetores de atenção**. Manter no máx. 3 visíveis;
  Tour e Métricas viram menu "⋯".
- **Cards Pós-venda:** moment + risk + alerts + opportunityChips + signals +
  timing = **6 sinais**. Hard cap = 2 chips secundários (além do moment).
- **Cockpit:** boundary já consolidado, mas validar que `<details>` permanece
  recolhido entre sessões (localStorage flag).

### Decisões simultâneas
- Diagnostic Wizard apresenta 5 steps com até 4 escolhas cada — OK, é wizard.
- Proposta apresenta 6 templates WhatsApp + 6 PDF blocks. Sugerir default
  inteligente (último usado pelo gerente em sessão).

---

## 5. Velocidade percebida

| Área | Hoje | Refinamento |
|------|------|-------------|
| Carteira load | spinner genérico → conteúdo | usar `ModuleSkeleton` com 3 colunas-fantasma do Kanban |
| Pós-venda load | `<ModuleSkeleton />` OK | manter |
| Edge AI calls | sem placeholder estruturado | streaming já habilitado em algumas; padronizar shimmer de 3 linhas |
| Drag-drop Kanban | OK | adicionar `transition-transform` com `will-change` |
| Transição entre módulos | hard swap | wrap em `animate-fade-in` (já existe) — auditar módulos sem ele |
| Toasts | sonner ok | reduzir `duration` de 4s → 2.5s para confirmações |

### Quick wins de fluidez
- Aplicar `view-transition-name` nos cards de proposta para preservar contexto
  ao abrir modal.
- Debounce do filtro de cliente (Carteira/Pós-venda) — confirmar `300ms`.
- Pré-carregar `PostSaleClientDetail` no hover do card.

---

## 6. Mobile UX

Contexto: gerente em campo, WhatsApp aberto em paralelo.

### Gaps observados
- **Carteira mobile:** header + 9 seções + Kanban swipe. Em 375px, usuário rola
  ~6 viewports antes de chegar à coluna Prospecção.
  **Quick win:** colapsar Forecast + DailyAgenda em sheet "Hoje" (botão sticky no topo).
- **Cards de proposta:** 5 ações no rodapé (WhatsApp, edit, delete, doc, …).
  Em 360px, ações cortam ou empilham. Manter 3 primárias; demais em "⋯".
- **Pós-venda KPIs:** 6 cards em `grid-cols-2` viram 3 linhas. Reduzir para 4
  KPIs (Ativos, Risco, Oportunidades, Próx. ações).
- **Insights bar:** chips quebram para 2 linhas em mobile. Permitir scroll
  horizontal (`overflow-x-auto snap-x`) com `mask-image` nas bordas.
- **Sticky FAB:** já existe — validar que insights bar não conflita com o FAB.

### Toques
- Targets ≥ 44px já são padrão (memória `Mobile UX`). Validar chips de
  insights (hoje 28px de altura → subir para 32px em mobile).

---

## 7. Continuidade entre módulos

### Fluxo Carteira → Cockpit → Abordagem → Proposta
- Hoje: navegação por sidebar; contexto preservado via `useModuleNavigation`.
- Lacuna: ao avançar de Carteira → Cockpit, o cliente focado nem sempre
  mantém destaque visual. Sugerir highlight ring de 1.5s no card-alvo.
- Lacuna: Abordagem → Proposta perde a `prospect_trigger` selecionada quando
  troca de tipo de consórcio. Persistir em localStorage por proposalId.

### Fluxo Pós-venda → Operações Estruturadas → Nova proposta
- Hoje: PostSaleQuickActions abre nova proposta com pré-fill.
- Lacuna: Operações Estruturadas não recebe `client_id` — gerente precisa
  digitar de novo. Auto-fill via query param `?client=…`.

### Princípio
Cada módulo deve indicar o "próximo passo natural" via `NextStepCTA` (já
existe). Validar presença em **todos** os módulos terminais (Proposta,
Pós-venda detail, Op. Estruturadas).

---

## 8. Consistência

| Elemento | Status | Ação |
|----------|--------|------|
| Chips | 6 implementações distintas | Padronizar via `Badge` shadcn + tones do design system |
| CTA primário | `Button` shadcn `variant="default"` | OK |
| CTA secundário | mistura `outline` + `ghost` | Convenção: `outline` para ação reversível, `ghost` para meta |
| Cores | tokens HSL OK | manter |
| Espaçamento | `space-y-5` módulo, `gap-3` cards | OK; corrigir Pipeline (`gap-2` → `gap-3`) |
| Hierarquia tipográfica | títulos `text-lg font-semibold` | validar que ModuleHeader é sempre a única H1 |
| Comportamento de cards | clique abre detalhe; hover destaca | OK em PostSale, validar Pipeline |
| Listas | virtual scroll só em Pipeline grande | manter; documentar limite |

### Fonte única para chips
Recomendar criar `src/components/ui/SignalChip.tsx` que centraliza:
- emoji opcional
- label
- tone (`info | warn | positive | neutral`)
- tooltip
- size (`sm | md`)

Substitui ~6 implementações ad-hoc (PortfolioInsightsBar, opportunityChips,
relationshipSignals visual, timing visual, lostReason visual, etc.).

---

## 9. Micro ajustes prioritários (Top 15 — alto impacto / baixo risco)

| # | Local | Ajuste | Impacto |
|---|-------|--------|---------|
| 1 | Carteira | Mover `AlertsCenter + Métricas + Tour` para menu "⋯" no header | Alto |
| 2 | Carteira | Forecast + DailyAgenda em `<details>` (DailyAgenda open) | Alto |
| 3 | Pós-venda | KPIs 6 → 4 (esconder Quitados/Pendentes em tooltip) | Médio |
| 4 | Cards Pipeline | Hard cap 3 chips totais por card | Alto |
| 5 | Investimento | Default: 3 paths expandidos, 3 colapsados | Alto |
| 6 | Insights bar mobile | scroll horizontal com snap | Médio |
| 7 | ModuleHeader | aplicar regras de microcopy (subtítulos curtos) | Médio |
| 8 | Toasts | `duration: 2500` para confirmações | Baixo |
| 9 | NextStepCTA | garantir presença em Pós-venda detail e Op. Estruturadas | Alto |
| 10 | Op. Estruturadas | aceitar `?client=` query param | Médio |
| 11 | Cards | unificar `gap-3` em Pipeline | Baixo |
| 12 | SignalChip único | criar componente e migrar 6 implementações | Alto (consistência) |
| 13 | Cockpit `<details>` | persistir estado collapse em localStorage | Baixo |
| 14 | Skeletons | Carteira ganha skeleton de 3 colunas-fantasma | Médio |
| 15 | Module transitions | aplicar `animate-fade-in` em todos módulos sem ele | Baixo |

---

## 10. Quick wins (≤ 30 min cada)

1. Subtítulos curtos no `ModuleHeader` de Carteira/Pós-venda/Proposta.
2. `duration: 2500` no `<Toaster />` global.
3. `gap-3` nos cards do Pipeline.
4. `min-h-[32px]` nos chips em mobile.
5. Esconder KPIs "Quitados" e "Pendentes" em mobile do Pós-venda (mantém em tooltip).
6. `overflow-x-auto snap-x` na insights bar em viewport `<sm`.
7. Ordem fixa de chips em ProposalCardContent: priority → relationship → timing → opportunity (cap 3).
8. Recolher por default `paths 4–6` do Investimento.
9. Unificar `<details>` do Cockpit com flag `localStorage.setItem('cockpit:ai-open', false)`.
10. Renomear "Tour Guiado" → "Como usar" em todos módulos.

---

## Before / After conceitual

**Antes (Onda 5 final):**
- Sistema completo, inteligente, mas com **densidade alta** em Carteira/Pós-venda.
- Microcopy ainda contém vestígios marketing ("acompanhe e priorize suas
  oportunidades").
- Cards podem mostrar 6 chips simultâneos.
- 5+ vetores de atenção competindo no header da Carteira.

**Depois (esta auditoria aplicada):**
- Carteira com 5 blocos pré-Kanban (era 9). Forecast/DailyAgenda colapsáveis.
- Microcopy bancária: substantivo + verbo curto.
- Hard cap 3 chips/card. SignalChip unificado.
- Header único com 3 vetores: badges essenciais + insights bar + menu "⋯".
- Sistema **percebido como leve**, mantendo toda a inteligência das Ondas 1–5.

---

## Riscos
- Hard cap de chips pode ocultar sinais relevantes em casos extremos (aceitável
  por design — gerente abre detalhe).
- Colapsar Forecast por default reduz visibilidade da meta — mitigar com badge
  "R$ 12k de meta" no header do `<details>`.
- Migração para `SignalChip` único requer revisão de tons em ~6 arquivos —
  fazer em sub-onda dedicada (não nesta auditoria).

---

## Score final de refinamento

| Dimensão | Antes | Após quick wins | Após plano completo |
|----------|-------|-----------------|---------------------|
| Escaneabilidade | 7.5 | 8.4 | 9.2 |
| Microcopy | 7.0 | 8.5 | 9.0 |
| Ritmo visual | 7.8 | 8.3 | 9.0 |
| Carga cognitiva | 7.2 | 8.2 | 9.1 |
| Velocidade percebida | 8.0 | 8.5 | 9.0 |
| Mobile UX | 7.4 | 8.1 | 8.8 |
| Continuidade | 8.2 | 8.5 | 9.2 |
| Consistência | 7.6 | 8.0 | 9.3 |
| **Geral** | **7.6** | **8.3** | **9.1** |

---

## Próximas ondas sugeridas (opcional)

- **Onda Polish 1:** quick wins 1–10 (1 sessão).
- **Onda Polish 2:** SignalChip unificado + migração (1 sessão dedicada).
- **Onda Polish 3:** Mobile sheet "Hoje" + targets 44px audit (1 sessão).

> O sistema deve passar a parecer uma **plataforma consultiva premium** —
> rápida, leve, extremamente clara — e não um software carregado de funcionalidades.
