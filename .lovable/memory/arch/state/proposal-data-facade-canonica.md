---
name: Proposal Data Façade Canônica
description: useProposalData() em src/contexts/proposal é a fachada ÚNICA do PDF; proibido criar ProposalDataContext genérico com any ou setData consolidado
type: constraint
---

## Regra
A unificação de dados do PDF JÁ ESTÁ FEITA via fachada tipada `useProposalData()` em `src/contexts/proposal/index.ts`. Ela reexporta os contexts de domínio:

- `simulation` → `SimulatorContext`
- `diagnostic` → `DiagnosticContext`
- `journey` → `ClientJourneyContext`
- `investment` → `InvestmentResultsContext` (publicado por `InvestmentModule`)
- `bidsStudy` → `BidsStudyContext` (publicado por `BidsModule`)
- `selectedGroup` → `SelectedGroupContext` (Bids ↔ Assembléias)

## Proibido
- Criar `ProposalDataContext` genérico com tipo `any` ou `setData(Partial<...>)` único.
- Concentrar escrita num reducer global — cada producer mantém setter próprio com shape validado.
- Calcular ou montar dados dentro do `ProposalPdfModule` (PDF é consumidor passivo).

## Como adicionar um novo bloco ao PDF
1. Criar `XContext` no padrão de `InvestmentResultsContext` (results + setResults tipado).
2. Producer publica via `useEffect` quando dados ficam prontos.
3. Adicionar provider em `src/pages/Index.tsx`.
4. Reexportar na fachada `src/contexts/proposal/index.ts`.
5. PDF consome `useProposalData().<bloco>`.

**Why:** preserva tipagem forte, validação por domínio e gates de integridade do PDF que já omitem blocos sem dados. Decisão tomada e confirmada pelo usuário.
