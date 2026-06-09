# Explainable Consultive Guidance Pass

> Onda · Maio/2026 — Transparência consultiva sobre a camada Adaptive já ativa.

## Princípio

> O usuário deve sentir: **"eu entendo por que o sistema sugeriu isso"** —
> sem AI theater, sem texto longo, sem chatbot. Tom de consultor humano.

---

## 1. Recommendation Explainability Layer

Adicionado campo opcional `rationale?: string` (≤ 90 chars) à interface
`AdaptiveSuggestion` em `src/lib/adaptive/recommendations.ts`. Todas as
sugestões do `suggestNextModule` e `suggestTrail` ganharam racional curto,
**derivado dos mesmos sinais determinísticos** do `ConsultiveProfile`
(diagnóstico + simulação) que originaram a sugestão. Zero IA, zero
inferência opaca.

| Sugestão                          | Racional exibido                                              |
|-----------------------------------|---------------------------------------------------------------|
| `next:comparator->investment` (objetivo investimento) | "Objetivo informado prioriza multiplicação patrimonial." |
| `next:comparator->investment` (perfil investidor)     | "Perfil declarado indica familiaridade com investimentos." |
| `next:investment->analysis`       | "Cliente demonstra apetite por números e comparação detalhada." |
| `next:simulator->reduced`         | "Capacidade mensal informada está próxima da parcela cheia." |
| `next:any->bids`                  | "Urgência declarada no diagnóstico exige timeline de contemplação." |
| `trail:investidor`                | "Aderente ao objetivo patrimonial informado."                  |
| `trail:imediatista`               | "Compatível com a prioridade de contemplação rápida."          |
| `trail:fluxo-apertado`            | "Indicada quando o fluxo mensal exige calibração fina."        |

## 2. Trust-Centered Guidance UX

Microcopy revisada para remover qualquer traço de AI theater. Vocabulário
banido (validado nas strings de recomendação): "IA escolheu", "algoritmo
recomendou", "machine learning", "automaticamente detectado".

Em uso (vocabulário consultivo humano): "objetivo informado", "perfil
declarado", "capacidade mensal informada", "urgência declarada",
"compatível", "aderente", "indicada". Tom: consultor sênior explicando
raciocínio em uma linha.

## 3. Contextual Reasoning Microcopy

Renderização em `src/components/adaptive/AdaptiveSuggestion.tsx`:

```
[bulb]  Mensagem principal (1 linha)
        Por quê? Racional curto (microcopy 11px, muted)
```

- Prefixo `Por quê?` em `font-medium` + `text-muted-foreground` separa
  semanticamente sem competir com a ação.
- Racional em `text-[11px] leading-snug text-muted-foreground/85` —
  hierarquia clara, não rouba foco do CTA "Abrir".
- Renderiza **somente se** `suggestion.rationale` existir → graceful
  fallback para futuras sugestões sem racional.

## 4. Cognitive Trust Validation

- ✅ **Clareza:** racional referencia sinal real (objetivo, urgência,
  capacidade) que o consultor sabe ter informado no Diagnóstico.
- ✅ **Confiança:** ausência de termos vagos ("a IA acha", "talvez").
- ✅ **Entendimento:** racional ≤ 90 chars, scan em <1s.
- ✅ **Não-arbitrariedade:** cada `rationale` mapeia 1:1 com a condição
  `if` que disparou a sugestão — auditável em código.

## 5. Non-Intrusive Guidance Validation

- Mesmo container `border-l-2`, mesma altura visual (linha extra apenas
  quando racional existe).
- Dismiss por sessão preservado (`sessionStorage` key `adaptive:dismissed`).
- Nenhum modal, nenhum tooltip, nenhuma interação extra exigida.
- Banner continua opt-out e sumindo silenciosamente.

## 6. Mobile Explainability Validation

- 11px com `leading-snug` permanece legível em 380px sem overflow
  (racional ≤ 90 chars cabe em 2 linhas no pior caso).
- Hierarquia mantida: mensagem principal continua dominante; racional
  é apoio.
- Botão "Abrir" mantém `h-6 px-2` — sem regressão de tap target
  (alvo principal de navegação continua via CTA grande em
  `JourneyGuideBanner` que já tem `min-h-[44px]`).

## 7. Zero Regression Validation

- ✅ `AdaptiveSuggestion` API retrocompatível — `rationale` é opcional.
- ✅ Nenhuma sugestão sem racional perde funcionalidade.
- ✅ `JourneyGuideBanner`, `ConsultiveBridge`, `NextStepCTA` intactos.
- ✅ Engines financeiras, contextos canônicos, governança: zero toque.
- ✅ Sem nova edge, sem novo prompt IA, sem persistência server-side.
- ✅ Política `docs/adaptive/adaptive-policy.md` permanece válida
  (racional é derivação **determinística** do perfil, não inferência).

## 8. Final Trust & Guidance State

| Pergunta                                                       | Resposta |
|----------------------------------------------------------------|----------|
| As recomendações parecem transparentes?                        | ✅ Sim — cada sugestão expõe o sinal que a originou. |
| O usuário entende o racional?                                  | ✅ Sim — frase humana de 1 linha referenciando dado informado. |
| O guidance transmite confiança?                                | ✅ Sim — sem "IA escolheu", sem vocabulário algorítmico. |
| A experiência parece consultiva?                               | ✅ Sim — tom de consultor sênior explicando o porquê. |
| Houve aumento de clareza sem poluição visual?                  | ✅ Sim — +1 linha 11px muted, opcional, dismiss preservado. |

## Final Verdict

**APROVADO.** A camada Adaptive deixou de ser "caixa-preta consultiva" e
agora explica seu próprio raciocínio em uma linha curta, ancorada em
sinais que o consultor declarou. Premium, elegante, não-intrusivo, sem
AI theater. Pronto para produção sob V2 Constitution.

**Arquivos alterados:**
- `src/lib/adaptive/recommendations.ts` — campo `rationale` + 8 racionais.
- `src/components/adaptive/AdaptiveSuggestion.tsx` — renderer "Por quê?".

**Linhas:** ~25 LOC. **Engines tocadas:** 0. **Regressão:** zero.
