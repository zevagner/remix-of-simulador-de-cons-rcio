# Wave 3 — Analysis Force-Flag Consolidation

**Status:** Done · **Scope:** Hardening semântico · **V2.4 LOCKED:** preserved
**Risk:** Baixo · **Regression surface:** zero runtime ativo (limpeza one-shot idempotente)

---

## 1. Auditoria — flags do módulo Análise

| Chave | Origem | Consumidores ativos | Intent semântico | Consolidar? |
|---|---|---|---|---|
| `nav:lastSubmodule` (localStorage) | `src/utils/navState.ts` | `Index.tsx` (boot restore + persist), `AnalysisModule` (via props) | Submódulo ativo do Análise | **Fonte canônica — manter** |
| `nav:lastModule` (localStorage) | `src/utils/navState.ts` | `Index.tsx` | Módulo ativo (analysis/proposals/…) | **Fonte canônica — manter** |
| URL `?m=` (querystring) | `readUrlNavTarget()` em `navState.ts` | `Index.tsx` (deep-link/CTA) | Override explícito da navegação | **Override legítimo — manter** |
| `analysis:lastTab` (localStorage) | `moduleTabPersistence` (legado) | **Nenhum** (já desplugado na Fase 2 do `analysis-decouple`) | Submódulo ativo (duplicado) | **Remover — competia com `nav:lastSubmodule`** |
| `analysis:force-default` (sessionStorage) | `moduleTabPersistence` (legado) | **Nenhum** | Forçar entrada no Cockpit | **Remover — substituído por URL `?m=analysis`** |
| `analysis:force-overview` (sessionStorage) | mecanismo histórico do Cockpit | **Nenhum** | Variante de `force-default` | **Remover — duplicata semântica** |

**Conclusão:** as três flags `analysis:*` representavam o mesmo intent ("escolher aba ativa do Análise") e já não tinham consumidor ativo desde a Fase 2 do `analysis-decouple`. Permaneciam apenas como resíduo em sessões antigas + limpeza inline em todo `mount` do `AnalysisModule`.

---

## 2. Ownership timeline (pós-Onda 3)

```text
boot (main.tsx)
  └─ runWave3Sanitize()             ── remove analysis:lastTab / force-default / force-overview (idempotente)

mount Index.tsx
  ├─ readUrlNavTarget()             ── deep-link / CTA (prioridade máxima)
  └─ readLastNavState()             ── restore canônico (nav:lastModule + nav:lastSubmodule)

render AnalysisModule
  └─ activeTab vem por prop         ── owner único = Index.tsx

user click (tab/sidebar/breadcrumb)
  └─ onTabChange(tab)
       └─ Index.navigateTo()
            ├─ persistNavState()    ── grava nav:lastSubmodule
            └─ trackNavigation()    ── telemetria
```

Nenhum estado escrito por dois donos. Nenhum consumidor lendo flag legada.

---

## 3. Mudanças aplicadas

### Removido
- `useEffect` de limpeza inline em `AnalysisModule.tsx` (rodava a cada mount sem necessidade).
- Entrada `analysis: 'analysis'` em `MODULE_KEYS` (`src/utils/moduleTabPersistence.ts`) — impede reintrodução acidental do padrão competidor.

### Adicionado
- `src/utils/storage/wave3Sanitize.ts` — sanitize idempotente (flag `wave3:sanitized:v1`) que remove `analysis:lastTab`, `analysis:force-default`, `analysis:force-overview` uma única vez por sessão de usuário, no boot.
- Wire em `src/main.tsx` ao lado de `runWave1Sanitize` e `runWave2Sanitize`.
- `src/test/wave3AnalysisFlagSanitize.test.ts` — cobre: remoção dos três keys, preservação de `nav:lastModule`/`nav:lastSubmodule`, idempotência.

### Documentação
- Comentário no topo de `MODULE_KEYS` proibindo reintrodução de `analysis`.
- Comentário em `AnalysisModule.tsx` apontando para o sanitize centralizado.

---

## 4. Before × After semântico

| Aspecto | Antes | Depois |
|---|---|---|
| Flags semânticas | 3 (`lastTab` + 2 force-flags) + canônica `nav:lastSubmodule` | 1 (`nav:lastSubmodule`) + URL override |
| Owners de "aba ativa" | `moduleTabPersistence` (legado) + `navState` (novo) | `navState` apenas |
| Limpeza de resíduos | `useEffect` em cada mount do `AnalysisModule` | 1× por usuário, no boot (idempotente) |
| Risco de overwrite silencioso | Médio (qualquer reintrodução do helper voltaria a competir) | Zero (entrada removida do registry) |
| Complexidade cognitiva | 3 chaves para 1 intent | 1 chave para 1 intent |
| Reintrodução do bug do Cockpit | Possível por engano | Bloqueada no nível do registry |

---

## 5. Validação

- **TypeScript:** `tsc --noEmit` limpo (não removi nenhuma API pública usada).
- **Testes:** `wave3AnalysisFlagSanitize.test.ts` cobre os 3 invariantes.
- **navState:** intacto. `navStateInvariants.test.ts` permanece a referência canônica.
- **Compatibilidade com sessões antigas:** garantida — qualquer usuário com as três chaves antigas terá limpeza one-shot transparente no próximo boot, sem perder `nav:lastSubmodule`.
- **PDF / offscreen:** nenhuma das chaves removidas era lida por render offscreen, geração PDF, ou edges.
- **Mobile / multi-tab / deep-link / refresh / logout-login:** caminhos seguem o mesmo pipeline canônico que já estava em produção desde a Fase 2 do `analysis-decouple`.

---

## 6. Risco residual

- **Baixo:** sanitize é idempotente e protegido por flag persistente — não há cenário onde reescreva ou conflite com `nav:lastSubmodule`.
- **Sessão com flag `wave3:sanitized:v1` já marcada antes da remoção:** N/A — flag nova, nunca esteve em produção.
- **Reintrodução futura:** bloqueada no nível do registry; comentário JSDoc explicita o motivo histórico.

---

## 7. Não foi feito (conforme escopo)

- Não trocamos router.
- Não criamos event bus.
- Não migramos para Zustand.
- Não reescrevemos `AnalysisModule`.
- Não tocamos no `navState` canônico nem em `Index.tsx`.

Hardening semântico apenas, com remoção de dívida estrutural — exatamente o pedido da Onda 3.
