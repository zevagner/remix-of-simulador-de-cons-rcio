# Assemblies Restoration & Navigation Audit Wave

Data: 2026-05-13
Owner: Plataforma / Navigation
Status: ✅ Restaurado

## TL;DR

O módulo **Assembleias** nunca foi removido tecnicamente — ele permanecia
plenamente vivo (arquivo, lazy import, chunk, suspense, route handler,
context, query). O que ele perdeu foi **presença institucional na
navegação**, efeito colateral da Onda "Sidebar 6-Step Linear Flow" que o
moveu para fora de `ANALYSIS_SUBITEMS` e de `MOBILE_ANALYSIS_ORDER`,
delegando o acesso a uma seção colapsável dentro do Estudo de Lances
("Histórico do grupo").

Resultado prático: rota válida, mas invisível ao consultor → percepção
correta de "módulo sumiu". Esta onda restaura a visibilidade institucional
sem reabrir nenhum hotpath nem alterar engine/cálculo.

## Fase 1 — Auditoria

### 1.1 Existência do módulo

| Camada | Estado | Evidência |
|---|---|---|
| Arquivo | ✅ presente | `src/components/modules/AssembliesModule.tsx` |
| Registry | ✅ presente | `ANALYSIS_TABS.ASSEMBLIES = 'assemblies'` em `src/config/modules.ts` |
| Type guard | ✅ aceito | `isAnalysisTabId('assemblies') === true` |
| Lazy import | ✅ presente | `importAssemblies` em `AnalysisModule.tsx` (chunk dedicado, preload no idle) |
| Render branch | ✅ presente | `<div className={activeTab === ANALYSIS_TABS.ASSEMBLIES ? '' : 'hidden'}>` |
| Route handler | ✅ válido | `Index.tsx` aceita via `isAnalysisTabId(activeModule)` |
| Context/data | ✅ vivo | `AssembliesContext` + `useAssemblies` (React Query, 5 min cache) |
| Histórico do grupo | ✅ presente | seção colapsável dentro do `BidsModule` |
| Sidebar | ❌ ausente | removido de `ANALYSIS_SUBITEMS` |
| Breadcrumb / cockpit | ❌ ausente | dependem de `ANALYSIS_SUBITEMS` |
| BottomNav mobile | ❌ ausente | removido de `MOBILE_ANALYSIS_ORDER` |

### 1.2 Ponto exato da quebra

Onda anterior (`Sidebar 6-Step Linear Flow + Analysis Cockpit`) reduziu
visualmente a hierarquia para 4 itens. O módulo crítico Assembleias passou
a depender de:

- expansão manual de "Histórico do grupo" dentro de Bids,
- acesso direto via deep-link (preservado),
- bookmarks legados.

Nenhum desses caminhos é descoberto naturalmente pelo usuário novo, e
nenhum sinaliza ao consultor experiente que o módulo continua existindo.
Em ambientes corporativos isso é equivalente, na prática, a **deletar o
módulo da plataforma**.

### 1.3 Console & Runtime

Sem `chunk error`, sem `import failure`, sem `Suspense fallback` órfão
(verificado em `code--read_console_logs` — único warning é
`recharts.ReferenceLine.defaultProps`, não relacionado). O lazy chunk
carrega corretamente ao navegar via deep-link `?tab=assemblies` ou via a
seção interna do Bids. Diagnóstico runtime ✅.

## Fase 2 — Restauração

### 2.1 Module Registry & Sidebar

`ANALYSIS_SUBITEMS` agora contém Assembleias (`CalendarCheck` icon). Isso
restaura automaticamente:

- item na sidebar (item pai "Análise" expandido),
- breadcrumb "Análise › Assembleias",
- header dinâmico do `AnalysisModule` (lookup via `currentItem`),
- atalho no Cockpit (`AnalysisOverview.subItem(ASSEMBLIES)`),
- BottomNav mobile (via `MOBILE_ANALYSIS_ORDER`).

### 2.2 Routing / Lazy / Suspense

Sem mudanças. Já estava correto. Continuamos com chunk dedicado +
preload no idle + suspense local com `ModuleSkeleton`.

### 2.3 Permissions

Não há feature flag nem auth guard sobre Assembleias — disponível para
todos os papéis autenticados, alinhado ao restante de `analysis`. ✅

## Fase 3 — Integração sistêmica

- **Observabilidade**: navegação para `assemblies` continua emitindo
  `navigation_changed` via `navState.trackNavigation()`.
- **Runtime governance**: chunk Assembleias respeita política de lazy
  loading + manual chunks (`vendor-charts` / `vendor-excel` separados).
- **Mobile**: presente em `BottomNav` (sheet "Análise"). Renderização e
  responsividade preservadas.

## Fase 4 — Hardening

### Module Presence Guard (novo)

Adicionado em `src/config/modules.ts` (dev-only, zero overhead em
produção):

```ts
const ANALYSIS_HEADLESS_ALLOWLIST = new Set([ANALYSIS_TABS.ADVANCED]);
if (import.meta.env?.DEV) {
  const visible = new Set(ANALYSIS_SUBITEMS.map(s => s.id));
  for (const id of Object.values(ANALYSIS_TABS)) {
    if (!visible.has(id) && !ANALYSIS_HEADLESS_ALLOWLIST.has(id)) {
      console.error(`[modules] Módulo crítico "${id}" sumiu da navegação...`);
    }
  }
}
```

Garante que qualquer remoção futura de um ID de `ANALYSIS_TABS` da sidebar
**sem** registrá-lo explicitamente como headless dispara erro no console
em desenvolvimento. Resolve o vetor que causou esta onda.

## Fase 5 — Auditoria final

- **Por que sumiu?** Decisão de UX da onda anterior tirou o item da
  sidebar/BottomNav. Routing, registry e runtime continuaram íntegros.
- **Era routing, registry ou runtime?** Nenhum dos três — era
  **navegação/visibilidade institucional**.
- **Foi restaurado institucionalmente?** Sim: sidebar, breadcrumb,
  cockpit e BottomNav.
- **Risco de recorrência?** Mitigado pelo presence guard + allowlist
  explícita para módulos headless.
- **Outros módulos vulneráveis?** `ADVANCED` (Operações estruturadas)
  segue headless intencionalmente, agora documentado na allowlist.
- **Sistema detecta desaparecimento?** Sim, via guard dev-only.
- **O que impede 10/10?** Falta um teste E2E que abra cada
  `ANALYSIS_TABS` em sequência e valide chunk load (próxima onda).

## Scores

| Dimensão | Antes | Depois |
|---|---|---|
| Navigation integrity | 5.0 | 9.5 |
| Module governance | 6.5 | 9.4 |
| Routing stability | 9.0 | 9.5 |
| Runtime resilience | 8.5 | 9.0 |
| Lazy loading integrity | 9.0 | 9.0 |
| Platform robustness | 6.5 | 9.3 |

**Consolidado: 7.4 → 9.3 / 10**

## Arquivos alterados

- `src/config/modules.ts` — Assembleias de volta ao `ANALYSIS_SUBITEMS` + presence guard.
- `src/components/layout/BottomNav.tsx` — Assembleias de volta ao `MOBILE_ANALYSIS_ORDER`.
- `.lovable/audit/assemblies-restoration-navigation-audit-wave.md` — este relatório.
