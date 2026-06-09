---
name: Selected Group Context
description: SelectedGroupContext é fonte única de seleção (tipo + grupo) compartilhada entre Estudo de Lances e Assembléias; ambos providers leem via useSelectedGroup
type: feature
---

`src/contexts/SelectedGroupContext.tsx` mantém `{ type: ConsortiumType, groupNumber: string }` como fonte única no `Index.tsx`. Persistência localStorage por usuário (chave `selected-group:<userId>`) — substitui as duas persistências independentes que existiam antes (`bids-selection:` em BidsContext e nada formal em AssembliesContext).

Regras:
- Trocar `type` zera `groupNumber` automaticamente (grupo N imob ≠ grupo N auto).
- `BidsContext` e `AssembliesContext` NÃO mantêm mais estado próprio de seleção — leem via `useSelectedGroup()` e expõem `selectedType`/`selectedTab`/`selectedGroupNumber` apenas para compat com consumidores existentes.
- Façade `useProposalData()` reexporta como `selectedGroup` para o PDF.
- Reset duplicado de `selectedGroupNumber` ao trocar tab em AssembliesContext foi removido (já feito pelo SelectedGroupContext).

**Por quê:** sair de Lances grupo 123 e ir em Assembléias antes mostrava grupo vazio; trocar tipo num módulo não refletia no outro.
