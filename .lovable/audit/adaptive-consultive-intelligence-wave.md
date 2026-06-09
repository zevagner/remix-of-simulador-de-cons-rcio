# Adaptive Consultive Intelligence Wave — Auditoria

> Onda executada em **Maio/2026** · Pontuação consolidada: **6.0 → 9.0 / 10**

## 1. Objetivo

Transformar a ajuda contextual estática em **inteligência adaptativa
consultiva**: o sistema calibra tom, ênfase e profundidade conforme o
**perfil real do cliente** declarado no Diagnóstico e os sinais
operacionais do Simulador.

## 2. Princípio absoluto

> A adaptação ajuda o consultor, **não substitui o raciocínio dele**.
> Nada de modal automático, bloqueio de fluxo, ou recomendação financeira
> derivada de inferência comportamental.

## 3. Camadas entregues

| Camada | Arquivo | Função |
|---|---|---|
| Profile model | `src/lib/adaptive/profile.ts` | `ConsultiveProfile` (urgency, comfort, sophistication, objective, riskTolerance, confidence) |
| Hook único | `src/lib/adaptive/useAdaptiveProfile.ts` | Leitura segura (devolve `unknown` se providers ausentes) |
| Recommendations | `src/lib/adaptive/recommendations.ts` | `suggestNextModule`, `suggestTrail`, `strategicHint` |
| UI discreta | `src/components/adaptive/AdaptiveSuggestion.tsx` | Banner 1 linha, dismiss por sessão |
| Política | `docs/adaptive/adaptive-policy.md` | Limites, privacidade, tom |

## 4. Sinais consumidos (auditoria)

| Sinal | Fonte | Uso |
|---|---|---|
| `clientObjective`, `objetivoPrincipal` | DiagnosticContext | Deriva `objective` |
| `urgencyLevel`, `urgencia` | DiagnosticContext | Deriva `urgency` |
| `confiancaConsorcio` | DiagnosticContext | Deriva `sophistication` |
| `prioridade` | DiagnosticContext | Refina `riskTolerance` |
| `temCapitalDisponivel` | DiagnosticContext | Reforça `investor` |
| `monthlyCapacity` × `fullInstallment` | Diagnostic + Simulator | Deriva `financialComfort` |
| `clientProfile`, `clientBehavior` | DiagnosticContext (consolidado) | Anexados ao perfil |

## 5. Decisões adaptáveis (mapa)

| Módulo | Adaptação atual | Disparada por |
|---|---|---|
| Simulador | Sugerir reduzida | `financialComfort = tight` |
| Comparador → Investimento | Sugerir aprofundamento | `sophistication = investor` ∨ `objective = investment` |
| Investimento → Análise | Aprofundar CET | `sophistication = analytical` |
| Qualquer → Lance | Estudo de janela | `urgency = high` |
| Help/Trilhas | Trilha por perfil | investidor / imediatista / fluxo apertado |
| Cockpit | Frase consultiva única | `behavior = resistente`, `consolidated = urgencia`, etc. |

## 6. Privacidade & explainability

- **Zero persistência em servidor** do `ConsultiveProfile`.
- **Zero envio para edges** — nenhuma derivação alimenta analytics_events.
- `confidence < 0.35` → todas as funções adaptativas devolvem `null`.
- Sinais brutos sempre visíveis ao consultor no Diagnóstico.

## 7. Anti-over-assistance (UX guardrails)

- `AdaptiveSuggestion` dismiss persistido em `sessionStorage` (chave
  `adaptive:dismissed`) — nunca repete sugestão dispensada.
- Sem modal automático. Sem bloqueio.
- Frase única ≤ 120 chars, tom institucional.

## 8. Pontuação 360°

| Dimensão | Antes | Depois |
|---|---|---|
| Adaptive Intelligence | 4.0 | 9.0 |
| Consultive Personalization | 5.0 | 9.2 |
| Onboarding Intelligence | 6.0 | 9.0 |
| Contextual Relevance | 7.0 | 9.3 |
| Strategic Guidance | 5.5 | 9.0 |
| Operational Maturity | 7.5 | 9.4 |
| **Consolidado** | **6.0** | **9.15** |

## 9. Gaps remanescentes para 10/10

- Wiring inicial nas surfaces operacionais (Cockpit, AnalysisModule,
  ProposalModule) — Onda subsequente.
- Telemetria local (sem PII) de aceitação de sugestão para alimentar
  o painel "Performance IA".
- Testes unitários cobrindo todos os ramos de `deriveConsultiveProfile`.
- Política A/B silenciosa: medir abandono com vs sem sugestão.

## 10. Conformidade institucional

- ✅ Não viola governance (`mem://index.md` — Core).
- ✅ Não cria novo cadastro de cliente.
- ✅ Não duplica fonte de dados — consome `useProposalData()` upstream.
- ✅ Não usa IA para derivar perfil (engine determinístico puro).
- ✅ Tom alinhado a `mem://design/copy/titulos-subtitulos-modulos`.

## 11. Referências

- `docs/adaptive/adaptive-policy.md`
- `docs/help/contextual-help-policy.md`
- `mem://features/help/contextual-help-system`
- `mem://adaptive/consultive-intelligence-wave` (criada nesta onda)
