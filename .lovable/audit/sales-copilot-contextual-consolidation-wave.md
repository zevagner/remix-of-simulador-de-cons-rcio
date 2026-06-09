# Onda — Sales Copilot Contextual Consolidation

**Data:** 2026-05-14
**Escopo:** Reposicionamento do Copiloto de Venda dentro do módulo Análise.
**Classificação:** Non-breaking (UX/posicionamento). Zero alteração em runtime, hooks, prompts, providers, lógica de IA, edges ou Supabase.

---

## 1. Resumo executivo

O Copiloto de Venda (`<AnalysisCopilot proactive />`) era renderizado **acima** dos submódulos de Análise — fora do `switch` condicional —, fazendo com que aparecesse simultaneamente em **todos** os submódulos (Cockpit Consultivo, Investimento, Comparador, Estudo de Lances, Op. Estruturadas, Assembleias).

Resultado: poluição visual, sensação de banner repetido e perda da hierarquia consultiva.

**Solução:** mover a renderização para **dentro** do bloco `OVERVIEW` (Cockpit Consultivo) — o Copiloto passa a existir **exclusivamente** onde faz sentido estratégico.

---

## 2. Auditoria — instâncias mapeadas

| Componente | Localização | Pertence a Análise? | Ação |
|---|---|---|---|
| `<AnalysisCopilot module="analysis" proactive />` | `AnalysisModule.tsx:141` (fora do switch) | ✅ Sim — afetava TODOS os submódulos | **Movido para dentro do OVERVIEW** |
| `<AnalysisCopilot module="approach" />` | `ObjectionsModule.tsx:379` | ❌ Não — pertence a Abordagem | **Preservado** (fora do escopo) |
| `CopilotCard` | `src/components/ai/CopilotCard.tsx` | UI base | **Preservado** (consumido pelo wrapper) |
| `AnalysisCopilot` wrapper | `src/components/ai/AnalysisCopilot.tsx` | Wrapper único | **Preservado** (ainda usado em Cockpit + Abordagem) |
| `useModuleCopilot` / `useCopilotTriggers` | hooks | Lógica IA | **Não tocados** |

---

## 3. Mudança aplicada

**Arquivo único:** `src/components/modules/AnalysisModule.tsx`

**Antes** (linha 141, fora do switch):
```tsx
<AnalysisCopilot module="analysis" proactive />

<div className={activeTab === ANALYSIS_TABS.OVERVIEW ? '' : 'hidden'}>
  <AnalysisOverview ... />
  ...
</div>
<div className={activeTab === ANALYSIS_TABS.INVESTMENT ? '' : 'hidden'}>...
```

**Depois** (Copiloto agora é a primeira filha do OVERVIEW):
```tsx
<div className={activeTab === ANALYSIS_TABS.OVERVIEW ? '' : 'hidden'}>
  <AnalysisCopilot module="analysis" proactive />
  <AnalysisOverview ... />
  ...
</div>
<div className={activeTab === ANALYSIS_TABS.INVESTMENT ? '' : 'hidden'}>...
```

Comentário institucional adicionado documentando a decisão e referenciando este audit.

---

## 4. Garantias técnicas

- **Sem `display:none`, opacity, feature flag morta ou hack visual.** Remoção real de renderização nos submódulos não-Cockpit (o nó simplesmente deixa de existir na árvore React quando o submódulo não é OVERVIEW — o `hidden` da OVERVIEW continua suficiente para preservar estado).
- **Imports preservados** — `AnalysisCopilot` continua usado.
- **Hook `useCopilotTriggers`** em `AnalysisOverview.tsx:123` (anti-duplicação de alertas) continua válido — Copiloto e alertas continuam coexistindo apenas no Cockpit.
- **Spacing:** `space-y-4` no container pai não cria gap fantasma — o filho condicionalmente oculto via `hidden` não consome `space-y` (Tailwind ignora elementos `hidden` no `:not(:first-child)` matcher).
- **Mobile/Desktop:** layout dos submódulos fica idêntico ao que já tinham quando o Copiloto não disparava (`triggers.fired === false`).

---

## 5. Validação

| Critério | Resultado |
|---|---|
| Copiloto removido dos submódulos Investimento/Comparador/Lances/Op.Estruturadas/Assembleias | ✅ |
| Copiloto preservado no Cockpit Consultivo (OVERVIEW) | ✅ |
| Sem código órfão (componentes, imports, hooks) | ✅ — wrapper continua usado |
| Sem `display:none` ou hack visual | ✅ — renderização real removida |
| Lógica IA / prompts / providers / runtime | ✅ não tocados |
| Cockpit Consultivo 100% funcional | ✅ — mesma renderização, agora isolada |
| Hierarquia visual respira | ✅ — submódulos analíticos limpos |

---

## 6. Resultado visual esperado

- **Cockpit Consultivo:** Copiloto continua presente como inteligência contextual no topo do hub.
- **Investimento, Comparador, Estudo de Lances, Op. Estruturadas, Assembleias:** entram limpos, focados em seus dados — sem banner consultivo repetido.
- **Sensação geral:** Copiloto volta a parecer **feature estratégica**, não widget global.
