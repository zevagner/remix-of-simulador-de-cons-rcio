# Strategy System Reintegration

## Executive Summary

A onda anterior introduziu um módulo paralelo `strategy-library` (Sidebar → Inteligência → Estratégias) que fragmentou a experiência consultiva: conhecimento estratégico passou a viver fora do produto, como wiki desacoplada. Esta correção elimina a fragmentação e reintegra toda a profundidade estratégica ao módulo canônico **Estratégias Patrimoniais** (`analysis › wealth`), que volta a ser o coração único e protagonista da plataforma.

## Architecture Correction

Interpretação errada anterior: "produto + biblioteca lateral".
Interpretação correta agora: "as estratégias SÃO o produto — vivem no fluxo principal".

Por isso:
- A rota `strategy-library` foi removida.
- O item de sidebar `Inteligência → Estratégias` foi removido.
- O item de BottomNav/MORE_TABS `Estratégias` foi removido.
- O diretório `src/components/modules/strategy-library/` foi removido por completo.
- A única superfície estratégica é **Estratégias Patrimoniais** dentro de `Análise`.

## Removed Fragmentation

| Item | Estado anterior | Estado atual |
| --- | --- | --- |
| Sidebar item `Inteligência → Estratégias` | Visível | Removido |
| `MORE_TABS` item `strategy-library` | Visível | Removido |
| `MODULE_ORDER` entry `strategy-library` | Presente | Removido |
| Rota `case 'strategy-library'` em `Index.tsx` | Presente | Removido |
| Lazy import `StrategyLibraryModule` em `Index.tsx` | Presente | Removido |
| Diretório `src/components/modules/strategy-library/` | Existia | Deletado |
| Ícone `Library` em `src/config/modules.ts` | Importado | Removido |

`grep -rn "strategy-library\|StrategyLibrary" src/` retorna zero ocorrências.

## Reintegration Structure

A profundidade estratégica não foi perdida — ela já vivia em camadas canônicas do produto, que continuam intactas e ativas:

- **Taxonomia consultiva** → `WEALTH_INTENTS` em `src/components/modules/wealth/intents.ts` (capítulos patrimoniais por intenção: crescimento, liquidez, proteção, sucessão).
- **Blueprints estratégicos** → `STRATEGY_BLUEPRINT_BY_ID` em `src/components/modules/strategy-v2/blueprint.ts` (tese, como funciona, riscos, pitch, objeções, archetypes, applications flagship, whenNotToUse, mistakes, examples, patrimonialImpact, relatedStrategyIds).
- **Card editorial (Camada 2)** → `ExecutiveStrategyCard` (hierarquia preservada, sem dashboard).
- **Workspace consultivo (Camada 3)** → `ConsultiveStrategyPanel` com Primary Strategy Visibility Layer ("Estratégias principais" sempre visível) + accordion `Aplicações estratégicas` para deep-dive.
- **Compare (Camada 4)** → `CompareWorkspace`, COMPARE_MAX=3, mesma superfície unificada.

A biblioteca paralela duplicava esta arquitetura; sua remoção elimina ambiguidade sem retirar profundidade.

## Chapter Integration Model

```
Análise → Estratégias Patrimoniais (WealthPlatformModule)
  ├─ Hero editorial + nav rápida (capítulos)
  ├─ Tese recomendada (destaque)
  └─ Capítulos patrimoniais (intenções)
       ├─ ExecutiveStrategyCard (presença visual forte)
       └─ ConsultiveStrategyPanel (workspace completo)
            ├─ Tese
            ├─ Estratégias principais (Primary Visibility Layer)
            ├─ Como funciona / Quando faz sentido / Benefícios
            ├─ Riscos / Pitch / Objeções / Erros
            └─ Aprofundar: impacto, aplicações, archetypes, relacionadas
```

Camada 1 (capítulo) → Camada 2 (estratégia visível) → Camada 3 (workspace) → Camada 4 (profundidade avançada) — todas em um único fluxo, sem navegação paralela.

## Strategy Workspace Integration

O `ConsultiveStrategyPanel` já desempenha o papel de workspace completo da estratégia, com:
- identidade própria (ícone, tag, KPI hero, KPIs secundários);
- presença obrigatória das aplicações flagship via Primary Strategy Visibility Layer;
- accordion modular com 13+ blocos progressivos (default-open essenciais, default-closed profundidade);
- next-step consultivo (selecionar para comparar / comparar / voltar à leitura);
- disclaimer institucional.

A "biblioteca" criada anteriormente apenas duplicava conteúdo num catálogo separado; sua remoção centraliza a fonte única em `strategy-v2/blueprint.ts`.

## Discoverability Validation

- Estratégias aparecem **imediatamente** no único módulo Estratégias Patrimoniais, sem caça em sidebar lateral.
- Hero + chips de capítulo + nav sticky mobile garantem acesso instantâneo a cada intenção.
- Cada `ExecutiveStrategyCard` é clicável e abre o workspace consultivo na mesma tela.
- Primary Strategy Visibility Layer expõe as flagship dentro do painel sem exigir abrir accordion.

## Depth Validation

- Nenhuma estratégia foi resumida: blueprints permanecem com todos os campos (`ConsultiveContent` completo, `applications`, `archetypes`, `whenNotToUse`, `patrimonialImpact`, `relatedStrategyIds`).
- O painel consultivo expõe 13+ seções progressivas; profundidade emerge por disclosure, não por dashboard.
- Compare workspace mantém Winner + insights únicos + disclaimer único + densidade 1 coluna < 380px (regras V2 preservadas).

## Hierarchy Validation

- V2 continua elegante: nenhum card foi adicionado, nenhum widget novo na sidebar.
- Capítulos patrimoniais continuam organizados por intenção (WEALTH_INTENTS).
- Scanning saudável: hero → recomendada → capítulos → card → painel.
- Sidebar volta a ter `Inteligência → Análise` como único nó, sem item paralelo competindo por atenção.

## Mobile Validation

- Sticky mini-nav de capítulos preservado (`md:hidden`).
- ConsultiveStrategyPanel em `Sheet` lateral full-width em mobile, com disclosure por accordion (sem paredão).
- Nenhum grid agressivo adicionado; densidade segue 1 coluna < 380px.
- Bottom nav perdeu 1 item (Estratégias), o que **alivia** o espaço inferior em vez de comprimi-lo.

## Anti-Fragmentation Validation

- Fluxo único: usuário não escolhe entre "produto" e "biblioteca" — há apenas o produto.
- Sem rota paralela, sem item de sidebar duplicado, sem catálogo concorrente.
- Fonte única de blueprints (`strategy-v2/blueprint.ts`) — não há mais drift de conteúdo entre `library/catalog.ts` e blueprints canônicos.
- Telemetria continua na fonte canônica (`useStrategyV2Telemetry`) — sem canal paralelo.

## Risks Avoided

- **Wiki desacoplada**: removida; estratégias voltam a ser produto, não documentação.
- **Drift de conteúdo**: extinto — uma única fonte de blueprints.
- **Erosão da V2 Constitution**: nenhuma alteração em `WealthPlatformModule.tsx`, `ConsultiveStrategyPanel.tsx`, `CompareWorkspace.tsx`, `intents.ts`, `strategy-v2/blueprint.ts`. Áreas locked preservadas integralmente.
- **Dashboardization**: nenhum card/widget novo; apenas exclusão de superfícies paralelas.
- **Mobile bloat**: BottomNav fica mais leve (um item a menos).

## Final Verdict

Reintegração completa. A plataforma volta a ter **Estratégias Patrimoniais** como coração estratégico único, sem biblioteca paralela, sem rota secundária, sem fragmentação. Toda a profundidade consultiva continua viva nos blueprints canônicos e no `ConsultiveStrategyPanel`, com discoverability imediata via capítulos editoriais e presença forte via `ExecutiveStrategyCard`. Áreas locked da V2 Constitution permanecem intactas.
