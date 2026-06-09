---
name: Assemblies Canonical Read
description: Leitura canônica de assembleias via useAssemblies + useAssembliesView; AssembliesContext legado removido e bloqueado por eslint
type: feature
---

Leitura institucional única de assembleias:

```text
groups + assembly_results
        ↓
services/assemblies.ts (canônico)
        ↓
useAssemblies() (TanStack Query, chave única ['assemblies'])
        ↓
useAssembliesView() (hook leve, seletores puros)
        ↓
componentes consultivos (props-driven)
```

**Seleção** (tipo + grupo) vive em `SelectedGroupContext` — fonte única
compartilhada com Estudo de Lances e o façade `useProposalData()`.

**Removido:** `src/components/modules/assemblies/AssembliesContext.tsx`,
`AssembliesProvider`, `useAssembliesContext`. Reintrodução bloqueada por
`no-restricted-imports` em `eslint.config.js`.

**Operação administrativa** (upload, paste, clear) vive exclusivamente em
`Admin → Operações de Assembleias` via edge pipeline `assemblies-import`
(preview/commit/rollback). Nenhuma superfície consultiva escreve em
`groups`/`assembly_results`.

**Bootstrap legacy** (auto-load Excel embutido + migração localStorage)
isolado em `useAssembliesLegacyBootstrap`, admin-gated, fora do read-path.
