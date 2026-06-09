---
name: Analysis Force-Flag Consolidation Wave 3
description: Ownership único da navegação do módulo Análise — nav:lastSubmodule canônico; flags analysis:lastTab/force-default/force-overview removidas e saneadas one-shot no boot
type: constraint
---

# Onda 3 — Analysis Force-Flag Consolidation

## Regra canônica

A navegação do módulo **Análise** tem ownership ÚNICO em `nav:lastSubmodule`
(localStorage), gerenciado por `src/utils/navState.ts` e restaurado por
`src/pages/Index.tsx` no boot via `readLastNavState()`. Deep-link/CTA usa URL
`?m=` via `readUrlNavTarget()`.

## Proibições

- **Proibido** reintroduzir `analysis` em `MODULE_KEYS` (`src/utils/moduleTabPersistence.ts`).
- **Proibido** ler/escrever `analysis:lastTab`, `analysis:force-default`, `analysis:force-overview` em qualquer código novo. São flags fantasmas e o sanitize `runWave3Sanitize` as remove uma única vez por sessão no boot.
- **Proibido** criar segunda fonte de "aba ativa do Análise" — qualquer competição com `nav:lastSubmodule` reabre o padrão histórico do bug do Cockpit (overwrite silencioso na 1ª pintura).
- **Proibido** rodar limpeza inline dessas chaves em `useEffect` de mount; já está centralizado em `runWave3Sanitize` em `src/main.tsx`.

## Por que

3 flags representavam o mesmo intent semântico ("aba ativa do Análise") e
competiam pelo mesmo ponto de decisão no boot. Não era bug crítico em
runtime após a Fase 2 do `analysis-decouple` (todas estavam órfãs), mas
mantinha dívida estrutural e janela de reintrodução do bug histórico.

## Sanitize

`src/utils/storage/wave3Sanitize.ts` — idempotente, flag
`wave3:sanitized:v1`, remove as três chaves uma única vez por usuário.
Não toca em `nav:lastSubmodule` / `nav:lastModule`. Wired em `main.tsx`
ao lado de `runWave1Sanitize` / `runWave2Sanitize`.

## Ownership timeline canônico

```
boot → runWave3Sanitize() (one-shot)
Index mount → readUrlNavTarget() || readLastNavState() → activeTab prop
AnalysisModule → activeTab via prop (zero leitura de storage)
user click → onTabChange → Index.navigateTo() → persistNavState() → nav:lastSubmodule
```

Auditoria: `.lovable/audit/wave3-analysis-force-flag-consolidation.md`.
Teste: `src/test/wave3AnalysisFlagSanitize.test.ts`.
