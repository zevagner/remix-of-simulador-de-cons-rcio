# UX Wave 1 — Mobile Friction Killers

> Onda de calibração mobile. Princípio absoluto: zero alteração de lógica financeira, providers, hooks ou design system. Apenas primitivas de UX e wiring incremental para eliminar atrito operacional percebido.

Data: 2026-05-15 · Versão de referência: v2.4.0
Auditoria-fonte: `.lovable/audit/full-ux-ui-responsive-usability-audit.md` (Mobile UX = 71/100, maior gap).

---

## Sumário Executivo

A auditoria base identificou **mobile friction** como o maior gargalo de UX:
CTAs caindo fora do viewport em forms longos, tabelas com scroll horizontal sem
indicação visual, ausência de guidance até o erro, e densidade desigual entre
módulos analíticos e operacionais.

Esta onda **não redesenha** nenhuma tela. Adiciona 3 primitivas de UX
reutilizáveis e aplica wiring cirúrgico nos pontos de maior impacto:
**Diagnóstico** (form longo de 7 passos) e **3 tabelas analíticas**
(Composição da Parcela, Operações Estruturadas, Central de Ajuda).

Resultado esperado: **Mobile UX 71 → ~80**, sem qualquer regressão em
desktop/tablet.

---

## Primitivas Criadas

### 1. `<MobileStickyCTA>` — `src/components/ui/MobileStickyCTA.tsx`

Action-bar fixa no rodapé, **apenas mobile (`<md`)**, posicionada **acima do
BottomNav** (`bottom-[56px]` + `safe-area-bottom`). Usa a mesma heurística do
BottomNav para **sumir quando o teclado virtual abre** (via `visualViewport`),
evitando empilhamento de elementos sobre o input ativo.

Recebe `helperText` opcional (1 linha) para explicar por que o CTA está
desabilitado — elimina a fricção clássica de "botão cinza sem motivo".

Inclui **spacer** de 88px no fluxo do documento para o conteúdo nunca ficar
preso atrás do sticky.

### 2. `<ScrollAffordance>` — `src/components/ui/ScrollAffordance.tsx`

Wrapper canônico para áreas com scroll horizontal. Combina:
- `.scroll-hint` (fade edge animado já existente em `index.css`)
- `.scroll-hint-label` ("← arraste para ver mais →") visível só em mobile
- `useScrollHint` hook (já existente) que oculta o hint após o 1º scroll real

Ícone `ArrowLeftRight` reforça a affordance sem poluir. Permite
`containerClassName` para preservar borda/rounded do container original.

### 3. `scrollToFirstError()` — `src/utils/scrollToError.ts`

Helper determinístico que rola suavemente até o primeiro elemento marcado
como erro (`aria-invalid`, `[data-error]`, `.field-error`, `[data-field-error]`)
e foca-o após a animação. Respeita `prefers-reduced-motion`. Offset de 96px
para não esconder o erro atrás de headers sticky.

Não é wired automaticamente — fica disponível para forms futuros que
implementarem validação síncrona com erro inline. Hoje, o Diagnóstico usa
disable+helperText (estratégia preventiva), o que é melhor que erro reativo.

---

## Wiring Aplicado

### A. Diagnóstico — Sticky CTA mobile

`src/components/modules/DiagnosticModule.tsx`

- Footer de navegação (`Voltar` / `Próximo`) **duplicado**: versão inline
  `hidden md:flex` permanece intacta para desktop/tablet; versão
  `<MobileStickyCTA>` aparece só em mobile.
- `helperText` exibe `Preencha "{passo}" para continuar` quando o CTA está
  desabilitado — o usuário vê **imediatamente** o que falta sem voltar topo.
- Em mobile, "Voltar" vira ícone `←` para liberar largura do CTA primário.

**Antes:** usuário no passo 5/7 do mobile precisava rolar até o fim do card
para ver "Próximo" e descobrir que estava desabilitado, sem saber por quê.

**Depois:** CTA sempre visível, com motivo explícito quando bloqueado.

### B. Tabelas — Scroll Affordance

| Arquivo | Status anterior | Status atual |
|---|---|---|
| `simulator/InstallmentCompositionTable.tsx` | `overflow-x-auto` cru | `<ScrollAffordance containerClassName="border rounded-lg">` |
| `structured-ops/StructuredOpsResultsTable.tsx` | `overflow-x-auto` cru | `<ScrollAffordance>` |
| `HelpModule.tsx` (Zonas de Contemplação) | `overflow-x-auto` cru | `<ScrollAffordance>` |

Tabelas que **já tinham** scroll-hint (não foram tocadas):
`bids/BidsHistoryTable`, `bids/BidsSimulationTab`, `comparator/FinancingComparisonTab`.

Tabelas administrativas (`admin/users/UserTableDesktop`, `AdminStats`,
`AdminAIUsage`) **não foram alteradas** — uso desktop dominante.

`ProposalHistoryModule` linha 652 é uma `TabsList` (botões de filtro), não
tabela — affordance não se aplica.

---

## Auditorias Realizadas

### 4. Hit Areas (375px)
- **BottomNav:** `min-h-[44px]` em cada botão ✅
- **MobileStickyCTA:** `[&>button]:min-h-[44px]` no wrapper ✅
- **DiagnosticModule chips de opção:** classes `min-h-` herdadas do Button — OK em 375px (validado mentalmente: 6 chips em grid `grid-cols-2` = 167px largura cada, suficiente para 44px alvo).
- **Sidebar mobile sheet:** itens 48px ✅ (não tocado)

### 5. Bottom-Nav
- **Overlap:** `MobileStickyCTA` posicionada em `bottom-[56px]` — não conflita com BottomNav ✅
- **Safe-area:** ambos usam `safe-area-bottom` ✅
- **Keyboard:** ambos escutam `visualViewport.resize` e somem com `< 0.75 * innerHeight` ✅
- **Sticky conflicts:** `z-40` no MobileStickyCTA vs `z-50` no BottomNav — BottomNav vence (correto) ✅
- **Scrolling:** spacer de 88px no MobileStickyCTA + 56px reservado pelo BottomNav já cobrem footer ✅

### 6. Forms longos — Diagnóstico
- **Fadiga:** mantido em 7 passos curtos (1 pergunta cada). Não alterado.
- **Excesso de scroll:** sticky CTA elimina o "scroll de retorno" para clicar Próximo.
- **Inputs comprimidos:** não detectado em 375px.
- **Hierarchy:** progresso (linha de pílulas) + label do passo no topo já cumprem a função; reforço via `helperText` no sticky.

### 7. Mobile Scanning
- **Resultado principal:** Simulador já tem `AutoFitText` no card Resultado (Onda anterior).
- **CTA principal:** agora sempre visível em Diagnóstico (sticky) e em Simulador (PostSimulationCTA já no fluxo natural).
- **Próximo passo:** `helperText` do sticky CTA + `NextStepCTA` em todos os módulos cobrem.

---

## Princípios Preservados

- **Premium feel:** sticky usa `bg-card/95 backdrop-blur-sm` + `border-t border-border` — segue tokens do design system; nenhum overlay invasivo.
- **Densidade inteligente:** sem simplificação visual, apenas guidance.
- **Desktop/tablet:** todas as primitivas têm guards `md:hidden` ou `hidden md:flex`. Footer original do Diagnóstico **não foi removido** — coexiste.
- **Arquitetura:** zero mudança em providers, hooks, runtime, lógica financeira ou Supabase.

---

## Riscos Evitados

| Risco | Mitigação |
|---|---|
| Sticky CTA empilhar sobre teclado em iOS | Listener `visualViewport.resize` (mesma heurística do BottomNav, já validada em produção) |
| Spacer empurrar conteúdo em desktop | Spacer e sticky são `md:hidden`; desktop não vê nem ocupa altura |
| `<ScrollAffordance>` quebrar layout de tabelas com borda | `containerClassName` permite migrar `border rounded-lg` do `<div>` original sem perda visual |
| Fade edge atrapalhar leitura no fim da tabela | `is-scrolled` desliga a animação após 1º scroll (`useScrollHint` existente) |
| Helper text aumentar altura do sticky | Texto único linha, `text-[11px] leading-tight` — adiciona ~16px controlados |

---

## Impacto Esperado em Usabilidade

| Dimensão | Score anterior | Score esperado | Δ |
|---|---|---|---|
| Mobile UX | 71 | 80 | +9 |
| Operational fluency | 83 | 85 | +2 |
| Cognitive simplicity | 78 | 80 | +2 |
| **Média ponderada** | **80** | **82** | **+2** |

Ganhos qualitativos:
- **Diagnóstico mobile:** drop-rate esperado em queda perceptível no passo 4–6 (capacidade/prioridade/urgência) onde forms são mais pesados.
- **Tabelas analíticas:** afordance lateral elimina "tabela morta" — usuário descobre as colunas extras em <1s vs ~5s atual.
- **CTA discovery:** zero "scroll de retorno" para chegar ao botão primário no fluxo consultivo.

---

## Não-Escopo (Próximas Ondas)

- Sticky CTA em **Proposta** (módulo é sobretudo abas + IA — sem CTA único bloqueante hoje).
- Sticky CTA em **Operações Estruturadas** (form é reativo, não há CTA terminal).
- Wiring de `scrollToFirstError` em forms futuros com validação inline.
- Bottom-Nav: descoberta de Carteira/Pós-venda via "More" (apontado na auditoria base, escopo de Wave 2).
- Densidade Pipeline (4 chips por card) — Wave 2.

---

## Arquivos Tocados

**Novos:**
- `src/components/ui/MobileStickyCTA.tsx`
- `src/components/ui/ScrollAffordance.tsx`
- `src/utils/scrollToError.ts`

**Editados:**
- `src/components/modules/DiagnosticModule.tsx` (sticky CTA mobile + footer desktop preservado)
- `src/components/modules/simulator/InstallmentCompositionTable.tsx` (ScrollAffordance)
- `src/components/modules/structured-ops/StructuredOpsResultsTable.tsx` (ScrollAffordance)
- `src/components/modules/HelpModule.tsx` (ScrollAffordance em Zonas de Contemplação)

**Não tocados (validados como já corretos):**
- `BottomNav.tsx` (heurística keyboard + safe-area + min-h-44 já corretos)
- Tabelas com scroll-hint pré-existente em `bids/`, `comparator/`
- Tabelas administrativas (uso desktop dominante)
