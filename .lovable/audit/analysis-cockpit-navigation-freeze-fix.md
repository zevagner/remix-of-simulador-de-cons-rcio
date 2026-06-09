# Análise → Cockpit Consultivo — Diagnóstico e correção do freeze de navegação

**Status:** ✅ corrigido (causa raiz, sem mascarar sintoma)
**Arquivo alterado:** `src/pages/Index.tsx` (1 hunk, ~10 LOC)
**Risco:** baixo — preserva ClientJourneyContext, IA, multi-tenant, cache, roteamento, persistência.

---

## 1. Sintoma reportado

Usuário clica em **Análise** → o Cockpit Consultivo abre → durante alguns segundos:
- a sidebar parece "presa";
- trocar de submódulo (Investimentos / Comparador / Estudo de Lances) não responde imediatamente;
- após ~1–2 s, tudo destrava sozinho.

Não havia overlay, modal fantasma, `pointer-events:none`, navegação guardada nem `disabled` global. Era uma sensação de **lock visual**.

---

## 2. Causa raiz (uma única)

`src/components/layout/SwipeableModule.tsx` envolve TODO o conteúdo dos módulos em:

```tsx
<AnimatePresence mode="wait">
  <motion.div key={activeModule} initial={…} exit={…} transition={{ duration: 0.2 }}>
    {children}
  </motion.div>
</AnimatePresence>
```

E em `Index.tsx` o `key` era ligado **diretamente a `activeModule`**:

```tsx
<SwipeableModule activeModule={activeModule} … />
```

Mas a Análise tem **6 IDs distintos** que vivem dentro do MESMO container `AnalysisModule`:
`analysis-overview`, `investment`, `comparator`, `bids`, `advanced`, `assemblies`.

A `AnalysisModule` foi projetada para preservar estado interno via `hidden` (cada submódulo é renderizado lazy uma vez e fica oculto/visível). Mas o `key` granular do `AnimatePresence` neutralizava esse design:

| Ação do usuário | activeModule | key do AnimatePresence | Efeito |
|---|---|---|---|
| Clica "Análise" | `analysis` | `analysis` | mount AnalysisModule (Suspense + lazy chunk) |
| Clica sub-item "Investimentos" | `investment` | `investment` | **unmount completo** → exit anim 200ms BLOQUEANTE (`mode="wait"`) → mount AnalysisModule de novo (Suspense + lazy) → remount Cockpit + Investment |
| Clica "Comparador" | `comparator` | `comparator` | idem, de novo |

Cada troca de sub-aba gerava em cascata:
1. **200 ms de exit-anim bloqueante** (`mode="wait"` impede o próximo `motion.div` de montar antes do exit terminar).
2. Suspense fallback (`ModuleSkeleton`) piscando.
3. Re-mount de `AnalysisModule` → re-mount de `AnalysisOverview` → re-mount de `AIInsightsPanel` → `useEffect(autoRun)` reentra e dispara nova chamada `generateInsight('analysis')` à edge `module-copilot`.
4. Re-arm do timer de 2 s do `AnalysisCopilot` proativo.
5. `useTrackModuleAccess('analysis')` re-emite evento.
6. Reset de qualquer estado local não-persistido nos submódulos.

O somatório dos passos 1–2 já gera ~300–400 ms de **lock perceptível por clique**, e o passo 3 (chamada IA) faz o usuário ver loaders aparecendo onde antes não havia. Sensação final: "preso no Cockpit".

A causa **não está** no Cockpit, no Copilot, nas triggers, no React Query nem no ClientJourneyContext. Esses são vítimas — funcionam corretamente, mas estavam sendo desmontados/remontados a cada sub-tab click.

---

## 3. Mapa de hooks/queries envolvidos (verificados, todos OK)

| Hook / contexto | Comportamento real | Veredito |
|---|---|---|
| `useClientJourney` | `useMemo` puro sobre simulação. Nenhum efeito colateral de navegação. | ✅ |
| `useCopilotTriggers` | `useMemo` derivando lista de `reasons` a partir de `useProposalData`. Nenhum side-effect. | ✅ |
| `useModuleCopilot` | Apenas estado local + `run()` por demanda. Não dispara em mount. | ✅ |
| `useCopilotRecommendedStep` | Pure derivation. Não navega. | ✅ |
| `AnalysisCopilot proactive` | Dispara `cp.run()` 1× por `signature`, com debounce 2 s. **Anti-loop ok.** Mas era re-armado a cada remount. | ⚠️ vítima do remount |
| `AIInsightsPanel autoRun` | `useEffect` chama `generateInsight('analysis')` quando `simKey` muda. **Re-disparava em todo remount** (lastKeyRef perdido). | ⚠️ vítima do remount |
| `useJourneyGuidance` | Sem side-effect de navegação. | ✅ |
| React Query | Nenhuma query nova é disparada pelo Cockpit; nenhuma `invalidateQueries` no caminho. | ✅ |
| `setActiveModule` em `onTabChange` | Necessário para a sidebar destacar o subitem; **não é o vilão**. | ✅ |

Conclusão: nenhum hook de IA estava bloqueando a UI nem havia race condition. O problema era **arquitetural na camada de transição visual entre módulos**.

---

## 4. Correção aplicada (causa raiz)

`src/pages/Index.tsx` — calcula `swipeKey` estável para a família Análise:

```tsx
<SwipeableModule
  activeModule={
    isAnalysisTabId(activeModule) || activeModule === 'analysis'
      ? 'analysis'
      : activeModule
  }
  onModuleChange={setActiveModule}
>
  {renderModule()}
</SwipeableModule>
```

Efeito:
- Trocar de sub-aba dentro da Análise **não muda a `key`** → `AnimatePresence` não desmonta nada → `AnalysisModule` continua viva → o swap interno via `hidden` funciona como projetado.
- Transições entre módulos top-level (`analysis ↔ simulator ↔ proposal …`) continuam animadas igual a antes.
- Swipe mobile entre módulos top-level segue funcional (`MODULE_ORDER` inalterado).

Não foi necessário tocar em `SwipeableModule`, `AnalysisModule`, `AnalysisCopilot`, `AIInsightsPanel`, contexts, hooks de IA, React Query nem registry de módulos.

---

## 5. Before / After

### Técnico
| Métrica (clique entre 2 sub-abas da Análise) | Antes | Depois |
|---|---:|---:|
| Mounts de `AnalysisModule` por clique | 1 (unmount + remount) | 0 |
| Exit-anim bloqueante (`mode="wait"`) | 200 ms | 0 ms |
| Lazy chunk re-resolve + Suspense fallback | sim (cache hit, mas pisca) | não |
| Re-disparo de `AIInsightsPanel` autoRun → edge `module-copilot` | sim, todo clique | só quando simulação muda |
| Re-arm do debounce de 2 s do Copilot proativo | sim | não |
| Reset de estado local de submódulos não selecionados | sim | preservado |

### UX
| Antes | Depois |
|---|---|
| Clica sub-item → tela pisca → ~400 ms "presa" → conteúdo aparece | Clica sub-item → conteúdo aparece **no frame seguinte** |
| IA recarrega entre sub-tabs (loaders piscando) | IA permanece estável — só atualiza se a simulação real mudar |
| Sensação de "preso no Cockpit" | Navegação instantânea entre overview e submódulos |

---

## 6. Riscos avaliados e evitados

- **Multi-tenant / RLS:** intocado.
- **ClientJourneyContext:** intocado — segue como Provider acima de tudo, igual a antes.
- **IA / Copilot / triggers / governance:** intocados — apenas param de re-armar inutilmente.
- **NextStepCTA / `setActiveModule(id)` legado:** funciona idem (a função não mudou de assinatura).
- **Persistência (`navState`, `MODULE_KEYS.analysis`):** intocada.
- **Onboarding tour / breadcrumb / mobile sheet:** todos derivam de `analysisTab`, não de `activeModule`, então seguem funcionais.
- **Swipe mobile entre módulos top-level:** intocado (`MODULE_ORDER` é a fonte e não inclui sub-IDs da Análise).
- **AnimatePresence em outras famílias futuras:** padrão fica documentado: se um container abriga múltiplos IDs, o `swipeKey` deve ser o **container**, não cada filho.

---

## 7. Validação final

Cenário de aceitação manual:
1. Entrar em **Análise** com simulação válida → Cockpit aparece imediatamente, sem skeleton intermediário visível.
2. Clicar **Investimentos** → conteúdo aparece sem flash, sem skeleton.
3. Voltar a **Cockpit Consultivo** pelo breadcrumb → instantâneo, estado da aba anterior preservado.
4. Repetir 2–3 rápido (5 cliques em <2 s) → nenhum lock, nenhuma sensação de fila.
5. Sair para **Simulador** → animação de transição segue presente (entre módulos top-level, como antes).

---

## 8. Conclusão

A "trava" não era IA, race condition, query blocking, navigation guard, suspense bloqueante, loading global nem efeito colateral do Cockpit. Era um **`key` granular demais no `AnimatePresence` global**, anulando a estratégia `hidden` da `AnalysisModule` e forçando unmount/remount + exit-anim bloqueante + re-disparo de auto-effects a cada clique em sub-aba. A correção é cirúrgica (1 expressão) e elimina o problema na raiz, sem mascarar nada e sem mexer em arquitetura, IA, contextos ou cache.
