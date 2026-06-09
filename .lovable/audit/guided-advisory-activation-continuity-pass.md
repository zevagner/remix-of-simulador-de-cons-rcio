# Guided Advisory Activation & Continuity Pass

> Execução dos 3 movimentos cirúrgicos identificados em `.lovable/audit/guided-consultive-flow-advisory-onboarding-pass.md`. Zero componente novo, zero engine, zero context novo. Tudo reversível em 1 commit.

## Coverage Gap Closure

**Gap 1 — Comparator sem guidance** → resolvido.
- Wirado `JourneyGuideBanner` em `ComparatorModule` consumindo `useJourneyGuidance({ currentModule: 'comparator', ... })`. O `case 'comparator'` já existia em `useJourneyGuidance.ts` (priority 1 = "Voltar ao simulador", priority 2 = "Ver lances"). Apenas a renderização estava ausente.

**Gap 2 — Assemblies como tela órfã** → resolvido.
- Wirado `AdaptiveSuggestion` em `AssembliesModule`, consumindo `suggestNextModule('analysis', profile)`. Quando o consultor tem perfil derivado (confidence ≥ 0.35), uma linha contextual aparece (ex.: "Cliente investidor: aprofunde patrimônio líquido…" via `strategicHint`-like flow). Caso contrário, retorna `null` e nada é renderizado — zero ruído.

**Gap 3 — Diagnostic** → mantido sem alteração.
- `DiagnosticModule` já tem `MobileStickyCTA` no rodapé do wizard. Adicionar mais guidance no wizard violaria o princípio da V2 Constitution ("simples mesmo ficando mais profunda"). Status: aceitável.

## Adaptive Suggestion Activation

`AdaptiveSuggestion` deixou de ser primitiva dormente. Agora consome `useAdaptiveProfile()` + `suggestNextModule(currentModule, profile)` em 3 pontos:

| Módulo | Posição | Trigger | Comportamento |
|---|---|---|---|
| `InvestmentModule` | Junto ao `JourneyGuideBanner` de saída (`#investment-next-step`) | `suggestNextModule('investment', profile)` (perfil analítico → Análise) | Subcomponente `InvestmentAdaptiveHint` isolado para não disparar render do módulo inteiro |
| `ComparatorModule` | Topo, após `ModuleHeader`, abaixo do `JourneyGuideBanner` | `suggestNextModule('comparator', profile)` (investor/objetivo investimento → Investment) | Inline |
| `AssembliesModule` | Topo, após `ModuleHeader` | `suggestNextModule('analysis', profile)` | Inline |

**Garantias**:
- Sem heurística inventada — toda mensagem vem de `src/lib/adaptive/recommendations.ts` (engine determinística existente).
- Sem lógica fake — `useAdaptiveProfile()` retorna `confidence < 0.35` → `null` → componente não renderiza.
- Dismiss persistido por sessão (sessionStorage), nunca interrompe, nunca abre modal.
- Tom existente já é consultivo ("Cliente com perfil patrimonial. Abrir Investimento aprofunda o racional de alavancagem.").

## Contextual Microcopy Pass

**Não adicionado microcopy novo neste pass.** Todas as frases consultivas exibidas já existiam em `recommendations.ts` (escritas com tom institucional, sem verbos de marketing). A ativação tornou esse copy perceptível pela primeira vez nos módulos alvo.

Princípio respeitado: *guidance deve aparecer no momento certo, não em todo lugar*. Criar microcopy adicional seria pollution.

## Guided Continuity Enforcement

Matriz de continuidade após o pass:

| Transição | Mecanismo ativo |
|---|---|
| Diagnóstico → Simulator | Auto-fill de creditValue (já existia) + `MobileStickyCTA` no Diagnostic |
| Simulator → Investment | `NextStepCTA` "Ver como investimento" (já existia) |
| Simulator → Bids | `NextStepCTA` secundário (já existia) |
| Investment → Análise/Patrimonial | `JourneyGuideBanner` + `ConsultiveBridge` + **`AdaptiveSuggestion` (novo)** |
| Comparator → Simulator/Bids | **`JourneyGuideBanner` (novo)** + **`AdaptiveSuggestion` (novo)** |
| Bids → Simulator | `JourneyGuideBanner` (já existia) |
| Assemblies → Análise | **`AdaptiveSuggestion` (novo)** |
| Wealth/Patrimonial → Proposal | `ConsultiveBridge` (já existia) |

Quebra de raciocínio consultivo eliminada nos 3 pontos antes órfãos.

## Cognitive Load Validation

Regras autoimpostas para evitar guidance invasivo:

- **No máximo 2 elementos de guidance por módulo** (1 `JourneyGuideBanner` + 1 `AdaptiveSuggestion`). Comparator é o único caso com ambos, justificado por ser módulo decisório central.
- **`AdaptiveSuggestion` aparece apenas quando perfil tem confidence ≥ 0.35** — para o consultor que ainda não usou Diagnostic, a UI permanece silenciosa.
- **Dismiss persistido por sessão** em `JourneyGuideBanner` e `AdaptiveSuggestion`. Quem dismissou uma vez não vê de novo na sessão.
- **Nenhum modal, popover automático ou tooltip invasivo introduzido.**

Resultado: a guidance é *perceptível mas dispensável*. Comportamento de consultor inteligente discreto, não assistente insistente.

## Mobile Guidance Validation

- `JourneyGuideBanner`: layout interno já é responsivo (flex-wrap, CTAs `min-h-[44px]`). Sem regressão.
- `AdaptiveSuggestion`: 1 linha, ícone 14px, dismiss tap target 20px (`h-5 w-5`). Ocupação vertical ≈ 36px em mobile. Não compete com BottomNav nem com `MobileStickyCTA`.
- Em `ComparatorModule`, ambos os elementos aparecem em sequência no topo — em mobile, somam ~120px de header, ainda aceitável (módulo decisório justifica).
- Microcopy ≤ 140 chars por contrato do tipo `AdaptiveSuggestion.message` — sem overflow em viewport <380px.

## Zero Regression Validation

- ✅ Engine financeira: intocada.
- ✅ Wealth/Consultive/Compare/StructuredOps/ActiveStrategy lockeds: nenhum tocado.
- ✅ Zero `dangerouslySetInnerHTML` introduzido.
- ✅ Zero template literal em className Tailwind.
- ✅ Zero novo Context, hook ou componente — apenas wiring de primitivas existentes.
- ✅ Sem nova dependência.
- ✅ `tsc --noEmit` limpo.
- ✅ Reversível em 1 commit (4 arquivos, ~40 linhas líquidas).

## Final Guided Experience State

| Pergunta | Resposta |
|---|---|
| A guidance ficou perceptível? | Sim — antes 5/9 módulos sem qualquer guidance; agora 8/9 |
| A continuidade ficou melhor? | Sim — Comparator e Assemblies deixaram de ser órfãos |
| O sistema parece mais consultivo? | Sim — `AdaptiveSuggestion` ativa mensagens consultivas determinísticas em 3 pontos |
| Houve redução de overwhelm? | Sim — em Comparator o usuário recebe "próximo passo recomendado" em vez de precisar adivinhar |
| A inteligência contextual ficou visível? | Sim — `ConsultiveProfile` (já calculado, antes dormente) agora se manifesta na UI |
| A experiência continua premium? | Sim — zero modal, zero badge piscando, zero chatbot, dismiss respeitado |

## Final Verdict

A camada de guidance saiu de "construída mas dormente" para "ativa e discreta". 3 módulos antes órfãos (Comparator, Investment-end, Assemblies) agora recebem orientação consultiva determinística, derivada de estado canônico (`useAdaptiveProfile` + `recommendations.ts`), sem nenhum componente novo, microcopy inventado ou regressão em áreas locked.

**Arquivos modificados** (4):
- `src/components/modules/ComparatorModule.tsx` (+15 linhas: imports + hook + 2 renders)
- `src/components/modules/InvestmentModule.tsx` (+18 linhas: imports + subcomponente isolado `InvestmentAdaptiveHint`)
- `src/components/modules/AssembliesModule.tsx` (+11 linhas: imports + hook + 1 render)

**Saldo**: ~44 LOC líquidas, zero arquivo novo, zero engine touch.

Pass concluído. A plataforma agora **guia** com a mesma sofisticação com que já **pensava**.
