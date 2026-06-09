# Full UX/UI Responsive & Usability Audit

> Auditoria incremental de produto enterprise maduro.
> **Princípio absoluto:** zero redesign. Apenas refinamentos cirúrgicos de alto impacto e baixo risco, preservando a arquitetura já evoluída (sidebar 6 passos, Cockpit boundary, façades canônicas, design system v2, anti-XSS, perf intelligence).
> Data: 2026-05-15 · Versão de referência: v2.4.0

---

## Sumário Executivo

O sistema atingiu maturidade arquitetural alta: design tokens consolidados, hierarquia consultiva clara (Cockpit indica → Especializados resolvem), perf intelligence ao vivo, anti-XSS, fachadas canônicas. A camada UX, no entanto, ainda carrega resíduos de fases anteriores: **densidade desigual entre módulos**, **mobile com áreas de fricção pontuais (forms longos, tabelas largas, sticky CTAs ausentes)**, **estados vazios genéricos**, **feedback de loading inconsistente** e **alguns hot spots de cognitive load** (Investimentos, Comparador, Estudo de Lances).

A oportunidade não é redesenho — é **calibração**.

---

## Scores (0–100)

| Dimensão | Score | Tendência |
|---|---|---|
| Usability geral | 82 | ↑ |
| Hierarchy visual | 86 | → |
| Mobile UX | 71 | ↑ (gap maior) |
| Consultive clarity | 88 | ↑ |
| Premium perception | 84 | → |
| Accessibility | 74 | ↑ (gap a fechar) |
| Responsiveness | 76 | ↑ |
| Cognitive simplicity | 78 | ↑ |
| Operational fluency | 83 | → |

**Média ponderada: 80/100** — produto enterprise sólido, com 3 vetores de ataque claros: mobile, acessibilidade, densidade nos módulos analíticos.

---

## FASE 1 — Hierarchy & Consistência

### 1. Hierarchy visual
**Pontos fortes:**
- Cockpit Consultivo cumpre o mantra "indica, não resolve" — KPIs replicados removidos.
- `ModuleHeader` padronizado (título substantivo + subtítulo imperativo) cria âncora consistente.
- Cards de resultado do Simulador agora têm protagonismo claro pós-rebalanço.

**Pontos a refinar:**
- **Análise → Investimentos:** múltiplos cenários competem visualmente; falta âncora hero clara para "cenário recomendado".
- **Carteira (pipeline):** chips de cadência, score, próximo passo e timing competem na mesma linha do card — leitura granular demais.
- **Pós-venda:** ícones de status, badge de prioridade e CTA disputam o mesmo nível visual.

### 2. Consistência
- ✅ Botões, inputs, cards seguem tokens.
- ⚠️ **Spacing:** módulos analíticos usam gaps maiores que módulos operacionais (Carteira/Pós-venda) — falta rhythm uniforme entre seções top-level.
- ⚠️ **Tabelas:** densidade variável entre Assembleias, Histórico de propostas e Pipeline (paddings diferentes em rows).
- ⚠️ **Strips/overlays:** `AdaptiveSuggestion` e `PortfolioInsightsBar` têm estilos próximos mas não idênticos — convergir.

### 3. Densidade visual
- 🔴 **Estudo de Lances:** 3 blocos narrativos + tabela projeção + gráfico + chips de status = saturado em ≤1366px.
- 🟡 **Comparador:** legendas duplicadas (gráfico + cards inferiores).
- 🟡 **Diagnóstico passo 5:** muitas micro-decisões em uma tela.
- 🟢 Simulador, Cockpit e Proposta já balanceados.

### 4. Cognitive load
- **Investimentos**: terminologia técnica (CDI, INCC, alavancagem) sem glossário inline → tooltip leve resolve.
- **Estudo de Lances**: usuário precisa interpretar percentis + zonas + status; falta uma frase-resumo determinística no topo ("Sua chance: alta. Recomendado: 25%").
- **Pipeline (Carteira)**: 4 indicadores por card; reduzir para 2 hero + restantes em hover/expand.

---

## FASE 2 — Fluxos Principais

### 5. Onboarding real
- ⚠️ Login → Diagnóstico → Simulador funciona, mas **sem progresso explícito do "passo X de 6"** na primeira sessão.
- ⚠️ Falta um **first-run hint** discreto (1 frase) no Diagnóstico explicando "isso alimenta sua proposta".
- ✅ Restauração de sessão (modal) funciona bem.

### 6. Navegação
- ✅ Sidebar linear 6 passos é forte.
- ⚠️ **BottomNav mobile:** 5 itens visíveis + "more" — usuário não descobre Carteira/Pós-venda facilmente.
- ⚠️ Submenu Análise: ao trocar sub-aba, indicador ativo na sidebar atualiza, mas **scroll-to-top não é restaurado** em alguns casos.

### 7. Ação primária
- 🔴 **Simulador:** botão "Calcular" tem peso visual menor que filtros laterais em algumas resoluções.
- 🟡 **Proposta:** "Gerar PDF" e "Compartilhar link" têm peso igual — promover Compartilhar (uso real maior).
- 🟢 Cockpit já tem `NextStepCTA` claro.

### 8. Fluxos consultivos
- Diagnóstico → Simulador → Análise → Proposta: linear e claro.
- Pós-venda: precisa de **ponte explícita** com Carteira (mesmo cliente, mesma narrativa).
- Operações estruturadas: CTA contextual no Cockpit funciona, mas sem rastro depois (usuário "perde" o cenário ao sair).

### 9. Pontos de abandono
| Tela | Risco | Causa |
|---|---|---|
| Diagnóstico passo 5 | médio | excesso de inputs sem progresso visual |
| Investimentos cenários | alto | terminologia + ausência de "recomendado" |
| Proposta PDF preview | médio | tempo de geração sem skeleton fiel |
| Pipeline (Carteira) > 30 cards | alto | scroll infinito sem âncora visual |

---

## FASE 3 — Responsividade

### 10. Mobile (375px)
- 🔴 **Forms longos** (Diagnóstico, Simulador avançado): falta sticky CTA "Continuar" no bottom.
- 🔴 **Tabelas (Assembleias, Histórico):** scroll horizontal sem indicador visual.
- 🟡 **Gráficos (Lances, Comparador):** legendas quebram em 2 linhas e empurram conteúdo.
- 🟡 **Cards de pipeline:** densidade ainda alta — chips se empilham.
- ✅ AutoFitText no card Resultado já resolve overflow numérico.
- ✅ BottomNav + safe-area corretos.

### 11. Tablet (768–1024px)
- ⚠️ Sidebar não disponível neste range (só mobile/desktop) — perde-se navegação rápida.
- ⚠️ Grid 2 colunas do Cockpit fica apertado em 768px (chips de timing).
- ✅ Simulador ok pós-rebalanço.

### 12. Desktop (1440px+)
- 🟡 **Vazios laterais** em telas operacionais (Carteira, Pós-venda) — aproveitar para coluna lateral de insights.
- 🟡 Hierarchy executiva: faltam dividers sutis entre seções top-level em telas largas (rhythm horizontal frouxo).
- ✅ Densidade aceitável; nada inflado.

### 13. Breakpoints críticos
| Breakpoint | Status | Ressalva |
|---|---|---|
| 320px | ⚠️ | Cards de pipeline truncam |
| 375px | ⚠️ | Sticky CTA ausente em forms |
| 768px | ⚠️ | Sidebar invisível neste range |
| 1024px | ✅ | OK |
| 1366px | ⚠️ | Estudo de Lances saturado |
| 1440px | ✅ | OK |
| 1920px+ | 🟡 | Vazios laterais subaproveitados |

---

## FASE 4 — Acessibilidade & Feedback

### 14. Acessibilidade básica
- 🔴 **Botões icon-only** sem `aria-label` em alguns FABs (Mock seed, ações de card).
- 🟡 Contraste de `text-muted-foreground` em fundo `surface` no limite WCAG AA (4.4:1).
- 🟡 **Focus states**: shadcn defaults preservados, mas chips customizados em Carteira/Lances perdem ring.
- 🟡 Hit areas mobile: alguns `size="icon"` < 44px.
- ✅ Heading order respeitado.

### 15. Loading states
- ⚠️ `ModuleSkeleton` é genérico — não reflete layout real (causa shift perceptivo).
- ⚠️ PDF generation: spinner sem mensagem de progresso ("renderizando página 3 de 6").
- ✅ Suspense boundaries OK.

### 16. Empty states
- 🔴 **Carteira sem propostas:** mensagem genérica, sem CTA claro para "Criar primeira proposta".
- 🔴 **Pós-venda vazio:** texto "Nenhum cliente" sem orientação.
- 🟡 Comunidade: empty state existe mas sem exemplos.

### 17. Erros & validações
- ⚠️ Formulários: erros aparecem abaixo do input, mas sem âncora de scroll no submit (usuário não vê o erro).
- ✅ Toasts (Sonner) bem padronizados.
- ✅ ErrorBoundary funcional.

---

## FASE 5 — Experiência Premium

### 18. Fluidez
- ✅ Wave 1–3 já mitigaram blur/render churn.
- 🟡 Transições entre sub-abas da Análise: instantâneas (sem fade sutil) — adicionar 120ms opacity transition daria sensação premium sem custo.

### 19. Percepção enterprise
- 🟡 **Histórico de propostas:** ainda parece tabela ERP — reduzir grid lines, aumentar row height.
- 🟡 **Admin (Governança):** tabs densas; respiro insuficiente entre seções.
- ✅ Cockpit, Simulador, Proposta atingem padrão SaaS premium.

### 20. IA contextual
- ✅ Pós-Cockpit consolidation: AI não compete mais com KPIs.
- 🟡 `AIInsightsPanel` recolhido por padrão — bom, mas indicador de "tem insight novo" pode ser mais sutil (dot pulsante).
- 🟡 Sales Copilot: bom em proatividade, mas sem persistência cross-session do dismiss.

---

## Problemas por Severidade

### 🔴 Crítico (resolver na próxima onda)
| # | Módulo | Problema | Impacto | Correção sugerida | Risco |
|---|---|---|---|---|---|
| C1 | Mobile (forms) | Sem sticky CTA "Continuar" | Abandono em Diagnóstico/Simulador | Wrapper sticky bottom + safe-area | Baixo |
| C2 | Mobile (tabelas) | Scroll horizontal sem affordance | Usuário não percebe colunas | Adicionar shadow/fade nas bordas + hint inicial | Baixo |
| C3 | Estudo de Lances | Saturação visual ≤1366px | Cognitive load | Colapsar 1 dos 3 blocos narrativos por padrão | Baixo |
| C4 | A11y | Botões icon-only sem `aria-label` | WCAG fail | Auditar e adicionar labels (script lint) | Zero |
| C5 | Empty states | Carteira/Pós-venda sem CTA | Usuário trava no primeiro uso | Componente `EmptyStateConsultive` com CTA | Baixo |

### 🟡 Médio
| # | Módulo | Problema | Correção |
|---|---|---|---|
| M1 | Pipeline | 4 indicadores por card | Reduzir a 2 hero + expand on hover |
| M2 | Investimentos | Sem "cenário recomendado" hero | Badge "Recomendado" derivado do score |
| M3 | Tablet 768px | Sidebar invisível | Habilitar sidebar collapsed icon-only |
| M4 | Loading | Skeletons genéricos | Skeletons fiéis por módulo (3 mais usados) |
| M5 | Forms | Erro sem scroll-to-error | Helper `scrollToFirstError` no submit |
| M6 | BottomNav mobile | Carteira/Pós-venda escondidos | Reordenar prioridade ou badge "novo" |
| M7 | Histórico propostas | Aparência ERP | Reduzir grid lines, aumentar row height |
| M8 | PDF generation | Sem progresso | Mensagem "página X de Y" |
| M9 | Diagnóstico | Sem hint contextual | Frase única "isso alimenta sua proposta" |
| M10 | Sub-abas Análise | Sem transição | 120ms opacity fade |

### 🟢 Cosmético
| # | Onde | Item |
|---|---|---|
| K1 | Desktop 1920px+ | Aproveitar vazios laterais com insights |
| K2 | Chips customizados | Restaurar focus ring |
| K3 | `text-muted-foreground` em `surface` | Subir contraste em 5% |
| K4 | AdaptiveSuggestion vs PortfolioInsightsBar | Convergir estilo |
| K5 | Admin governance | Aumentar respiro entre seções |
| K6 | AIInsightsPanel | Dot pulsante para "novo insight" |

---

## Checklist Responsivo

| Tela / Breakpoint | 375 | 768 | 1024 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|
| Landing | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Login/Auth | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Diagnóstico | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| Simulador | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cockpit | ✅ | ⚠️ | ✅ | ✅ | ✅ | 🟡 |
| Investimentos | ⚠️ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ |
| Comparador | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Estudo de Lances | ⚠️ | ⚠️ | ⚠️ | 🔴 | ✅ | ✅ |
| Assembleias | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Proposta | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| PDF preview | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Carteira | 🔴 | ⚠️ | ✅ | ✅ | ✅ | 🟡 |
| Pós-venda | 🔴 | ⚠️ | ✅ | ✅ | ✅ | 🟡 |
| Comunidade | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Help | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ |

---

## Recomendações de Fluxo

### Onboarding
- First-run hint inline (1 frase) por módulo na primeira visita.
- Indicador "passo X de 6" persistente no Header durante os 3 primeiros usos.

### Navegação
- Mobile: reordenar BottomNav por uso real (telemetria já disponível).
- Tablet 768px: sidebar collapsed icon-only.
- Sub-abas: scroll-to-top automático na troca.

### Scanning
- Cards de pipeline: 2 indicadores hero, restantes em expand.
- Listas longas: âncora visual a cada 10 itens (data divider).

### Fluxo consultivo
- Pós-venda ↔ Carteira: link contextual "ver no pipeline" e vice-versa.
- Operações estruturadas: persistir cenário ao sair (sessionStorage).

### Densidade operacional
- Estudo de Lances: blocos narrativos colapsáveis (1 aberto por padrão).
- Admin: respiro vertical +25% entre seções.

---

## Top Quick Wins (alto impacto · baixo risco)

| # | Win | Esforço | Impacto | Risco |
|---|---|---|---|---|
| 1 | Sticky CTA bottom em forms mobile | S | 🔴 Alto | Zero |
| 2 | Aria-labels em botões icon-only (lint + sweep) | S | 🔴 Alto (a11y) | Zero |
| 3 | Empty states consultivos (Carteira/Pós-venda) | M | 🔴 Alto | Baixo |
| 4 | Fade nas bordas de tabelas com scroll-X mobile | S | 🟡 Médio | Zero |
| 5 | Colapsar 2 dos 3 blocos do Estudo de Lances | S | 🔴 Alto | Baixo |
| 6 | Badge "Recomendado" em Investimentos | S | 🟡 Médio | Baixo |
| 7 | Sidebar icon-only em tablet (768–1023px) | M | 🟡 Médio | Baixo |
| 8 | scrollToFirstError no submit de forms | S | 🟡 Médio | Zero |
| 9 | Skeletons fiéis nos 3 módulos mais acessados | M | 🟡 Médio | Zero |
| 10 | Transição 120ms entre sub-abas Análise | S | 🟢 Premium feel | Zero |
| 11 | Reduzir 4→2 indicadores hero nos cards do Pipeline | M | 🟡 Médio | Baixo |
| 12 | Mensagem de progresso na geração de PDF | S | 🟡 Médio | Zero |

> **Recomendação:** Wins 1–5 entram na próxima onda (estimativa: 1 PR cirúrgico cada, sem mexer em lógica financeira nem providers críticos).

---

## Princípios Preservados

- ✅ Zero alteração em motores financeiros (`@/core/finance`).
- ✅ Zero alteração em providers críticos (Auth, Simulator, Proposal façade).
- ✅ Sem redesign — apenas refinamento incremental.
- ✅ Design tokens v2, anti-XSS, perf intelligence intactos.
- ✅ Cockpit boundary, sidebar 6 passos, façades canônicas preservados.
- ✅ Funcionalidade > estética em todas as recomendações.

---

## Próximas Ondas Sugeridas

1. **Wave UX A — Mobile Foundations:** sticky CTAs, fade tabelas, sidebar tablet, hit-areas 44px.
2. **Wave UX B — Empty/Loading/Error:** empty states consultivos, skeletons fiéis, scrollToFirstError.
3. **Wave UX C — Densidade Analítica:** colapso Lances, recomendado Investimentos, pipeline 2-hero.
4. **Wave A11y:** sweep aria-labels, focus rings em chips, contraste muted.
5. **Wave Premium Polish:** transições sub-abas, dot pulsante AI, vazios desktop.

— Fim do relatório.
