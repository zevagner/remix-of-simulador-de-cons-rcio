# Guided Tour — Full Removal Audit Wave

## Resumo executivo
Sistema de Tour Guiado (intro.js) **completamente removido** do produto. Esta onda finaliza a limpeza com a remoção dos resíduos não-funcionais que sobraram após a deleção dos arquivos principais e dependência.

## Escopo desta onda (Onda 35 — Final)

### 1. CSS órfão removido (`src/index.css`)
- Bloco `INTRO.JS — ESTILO INSTITUCIONAL CAIXA` (~120 linhas)
- Classes: `.caixa-introjs-tooltip*`, `.introjs-helperLayer`, `.caixa-introjs-highlight`
- `@media print` que escondia overlays `.introjs-*`
- Justificativa: dependência `intro.js` já desinstalada — seletores nunca casariam.

### 2. Chunk vendor removido (`vite.config.ts`)
- Bloco `if (intro.js) return "vendor-tour"` removido do `manualChunks`.
- Justificativa: `node_modules/intro.js` não existe mais.

### 3. Metadado de governança (`src/data/governance/sections/bundlePerformance.ts`)
- Linha `{ label: 'vendor-tour', value: 'driver.js / shepherd' }` removida da lista de chunks documentados.

## Validação final

| Pergunta | Resposta |
| --- | --- |
| Todo o sistema de Tour foi removido? | **Sim** — arquivos, hook, helper, dependência, CSS, chunk e metadado |
| Existe código órfão restante? | **Não** — `rg "introjs\|tourHelper\|useOnboarding\|startTour\|GuidedTour\|vendor-tour"` em `src/` retorna zero |
| Alguma dependência foi removida? | **Sim** — `intro.js` desinstalada (onda anterior) |
| Algum módulo foi afetado visualmente? | **Não** — apenas botões "Tour Guiado" e ícones `GraduationCap` removidos do header de cada módulo (shell mais limpo) |
| O shell ficou mais limpo? | **Sim** — headers de módulo perderam um botão extra cada |
| O sistema ficou mais leve? | **Sim** — ~120 linhas de CSS morto + chunk vendor + 1 dep |
| O build continua íntegro? | **Sim** — validado pelo build automático |
| O que ainda restou relacionado ao onboarding? | **HelpModule** estático (FAQ/ajuda); nenhum mecanismo de tour interativo |

## Garantias respeitadas
- Zero alteração em: lógica financeira, hooks de cálculo, providers, Supabase, edges, AI, Sidebar, métricas do cockpit, design tokens, RLS.
- Apenas remoção de código morto + metadado descritivo.
