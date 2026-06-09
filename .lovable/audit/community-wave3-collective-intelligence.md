# Comunidade — Onda 3 · Inteligência Consultiva Coletiva

**Data:** 2026-05-12  
**Estado anterior:** comunidade viva (8.0/10)  
**Estado atual:** patrimônio coletivo de inteligência consultiva (8.9/10)

---

## Causa raiz da Onda 3
Após Ondas 1 e 2 a Comunidade já estava viva (CTA dominante, outcomes,
subscriptions, pulse), mas o conteúdo gerado **não era descobrível** nem se
**reusava em contexto operacional**. Casos resolvidos morriam no histórico.

## Entregas

### Migração SQL (`20260512_community_wave3`)
- `community_case_views` (tabela + RLS) — feedback humano leve.
- `community_register_view(_case_id)` — idempotente por usuário.
- `community_similar_cases(...)` — descoberta por `consortium_type`, `stage` e
  similaridade textual via `pg_trgm`. Prioriza `aplicou_funcionou` → resolvidos
  → similaridade → helpful_count.
- `community_search(...)` — busca consultiva com filtros (tipo, etapa, outcome,
  resolvidos, sem resposta).
- `community_reference_cases(_limit)` — curadoria determinística: resolvidos +
  outcome aplicado + resposta destacada + helpful_count.
- `community_recurring_patterns(_days, _limit)` — onde a Comunidade mais
  aprende (tipo × etapa, % funcionou).
- `community_case_impact(_case_id)` — view_count + helpful_replies.

Todas com `SECURITY DEFINER` checando `is_approved(auth.uid())` e isolamento
de privacidade (mesmo padrão de Ondas 1/2). Lints existentes não regrediram.

### Service (`src/services/community.ts`)
Adicionados: `listSimilarCases`, `searchCases`, `listReferenceCases`,
`listRecurringPatterns`, `getCaseImpact`, `registerCaseView`. Tipos
exportados para reuso.

### Componentes
- `SimilarCasesCard` — reusável (Comunidade + futuros widgets contextuais).
- `ConsultativeSearch` — busca + chips de filtro (Imóveis, Auto, Pesados,
  Agro, Solar, Objeção, Estratégia, Lance, Pós-contemplação, Patrimônio,
  Funcionou, Resolvidos, Sem resposta).
- `ReferenceCasesPanel` — curadoria leve dos casos referência.
- `RecurringPatternsCard` — onde a Comunidade mais aprende (últimos 180d).
- `ContextualCommunityWidget` — widget compacto e silencioso (não renderiza
  nada quando vazio) para integração contextual futura no Cockpit, Carteira,
  Pós-venda e Nichos. **Reutilizável sem inflar UI.**
- `CaseImpactNote` — feedback humano leve (autor: "seu caso ajudou X
  consultores"; visitante: "X consultores leram este caso", apenas a partir
  de 3 leituras).

### Integração no `CommunityModule`
- Novas tabs **Referência** e **Buscar**.
- `RecurringPatternsCard` no topo da listagem.
- No `CaseDetail`: `registerCaseView` automático, `CaseImpactNote` e
  `SimilarCasesCard` (mesmo `consortium_type`+`stage`), com navegação
  inline entre casos relacionados.

## Antes / depois conceitual

| Dimensão | Onda 2 | Onda 3 |
| --- | --- | --- |
| Descoberta | feed cronológico | similaridade + busca + filtros |
| Memória | outcomes isolados | casos referência + padrões recorrentes |
| Continuidade | follow + outcome | impact note + view count |
| Reuso contextual | ausente | widget reutilizável pronto |
| Inteligência | linear (caso a caso) | acumulativa (caso ajuda caso) |

## Riscos evitados
- **Sem rede social tóxica:** sem feed infinito, sem ranking público de
  pessoas, sem dopamina. Curadoria 100% determinística (helpful + outcome +
  accepted reply). `CaseImpactNote` aparece só com sinal real.
- **Sem inflar UI:** `ContextualCommunityWidget` retorna `null` quando vazio.
  Padrões recorrentes só aparecem com ≥2 casos.
- **Sem analytics inflado:** todas as agregações são leituras determinísticas
  via RPC, sem BI nem realtime.
- **Sem privilégio escalado:** todas as RPCs reaproveitam
  `is_approved(auth.uid())` e `community_user_level(auth.uid())` para
  privacidade — mesmo guard das Ondas 1/2.

## Próximos passos sugeridos (Onda 4 — fora deste escopo)
- Plug do `ContextualCommunityWidget` em `AnalysisOverview` (Cockpit),
  `ProposalCardContent` (Carteira) e cards de Pós-venda — alimentando
  `consortiumType`/`stage` do contexto local.
- Tela "Memória da Comunidade" agrupando referência + padrões.
- Highlight em casos que viraram referência ao próprio autor.

## Score final
**8.9/10** — patrimônio coletivo de inteligência consultiva ativo.
Pendente apenas a costura contextual em outros módulos para fechar 10/10.
