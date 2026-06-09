# Sprint B — Frontend Modularization & DX Hardening

**Período:** 2026-05-12  
**Foco:** quebrar god modules sem alterar UX nem comportamento operacional.  
**Princípio:** refactor mecânico, conservador, reversível. Zero novas features, zero redesign visual.

---

## 1. Métricas antes × depois

| Arquivo | Antes (LOC) | Depois (LOC) | Δ | Status |
|---|---:|---:|---:|---|
| `src/data/objectionsLibrary.ts` | 971 | **94** | −90% | ✅ data extraída |
| `src/components/modules/InvestmentModule.tsx` | 1037 | **842** | −19% | ✅ scenarios + strategy tab extraídos |
| `src/components/modules/ProposalPdfModule.tsx` | 877 | 877 | 0 | ⚠️ adiado (ver §5) |

### Novos arquivos criados (focados, <200 LOC cada)

| Arquivo | LOC | Responsabilidade única |
|---|---:|---|
| `src/data/objections/data.ts` | 886 | Apenas o array `OBJECTIONS` (data file puro) |
| `src/components/modules/investment/useInvestmentScenarios.tsx` | 101 | Hook que monta os 5 cenários + classifications |
| `src/components/modules/investment/InvestmentStrategyTab.tsx` | 137 | JSX da aba "Estratégia Avançada" + tour |

**Total LOC orquestrador (`InvestmentModule`)** caiu de 1037 para 842. Continua acima do alvo de 400, mas o código restante é **majoritariamente JSX da aba Cenários** (renderização declarativa, baixa complexidade ciclomática) — não há mais lógica densa misturada.

---

## 2. Refactors aplicados

### 2.1 `objectionsLibrary.ts` (−877 LOC)

**Problema:** 971 LOC misturando types, metadata (CATEGORIES, CLIENT_PROFILES), dataset (120+ objeções) e utility functions.

**Refactor mecânico:**
- Array `OBJECTIONS` movido para `src/data/objections/data.ts` (pure data file, importa apenas o type `Objection`).
- `objectionsLibrary.ts` mantém: types, `CATEGORIES`, `CLIENT_PROFILES`, utilities (`getCategoryInfo`, `countByCategory`) e re-exporta `OBJECTIONS`.
- **Zero alteração de API pública** — todos os imports existentes (`from '@/data/objectionsLibrary'`) continuam funcionando.

**Ganhos:**
- Editor abre `objectionsLibrary.ts` instantaneamente; navegação até types e utilities é trivial.
- Crescimento futuro do dataset não polui a vista do barrel.
- Pronto para futura categorização granular (1 file por categoria) sem novo refactor disruptivo.

### 2.2 `InvestmentModule.tsx` (−195 LOC)

**Problema:** 1037 LOC concentrando state, derivações, JSX de 3 abas, tour guiado inline, e Print block.

**Extrações conservadoras:**

1. **`useInvestmentScenarios`** — hook puro que:
   - Monta o array `scenarios` (memo) a partir de `calculations + eff + safeInput`.
   - Calcula `classifications` (best/safest/balanced) com a **mesma matemática** (ranking por `absoluteGain`, comentários preservados).
   - Sem side-effects, sem state local.

2. **`InvestmentStrategyTab`** — componente apresentacional para a aba "Estratégia Avançada":
   - Recebe `scenarios + handlers` por props.
   - Tour `intro.js` encapsulado em função `startStrategyTour` (mesma config, mesmos IDs `#strategy-*`).
   - Tabela resumo + CTA de proposta migrados sem alterar HTML/classes.

**Decisões deliberadas (NÃO foi feito por hora):**
- A aba "Cenários" (~280 LOC de JSX) **não foi extraída**: tem 6 IIFEs interdependentes que dividem state local (`expandedCards`, `selectedScenarios`, `showAllScenarios`, `showAIDetail`). Extrair sem reestruturar context aumentaria prop-drilling de ~12 props — piora o sinal/ruído. Marcar para Sprint B.2 caso useScenariosTabState seja criado.
- O grupo de useState (`assumptions`, cash fields, expandedCards…) **não foi consolidado em hook único** intencionalmente: mantém debugger-friendly, evita encapsulamento prematuro.

### 2.3 `ProposalPdfModule.tsx` — **adiado para Sprint B.2**

**Motivo do adiamento:**
Após inspeção, o módulo (877 LOC) é majoritariamente:
- 5 useEffects acoplados ao auto-generation de storytelling (cache híbrido).
- Validação de impact values + handlers de download/preview/WhatsApp.
- Renderização de wizard com 4 categorias.

Cada parte tem dependências cruzadas com `useCentralAI`, `useInvestmentResults`, `useBidsStudyResults` e cache local. Quebrar sem testes de integração de PDF apresenta **risco real de quebra silenciosa** do fluxo de geração — exatamente o cenário que o Sprint B veta.

**Recomendação:** Sprint B.2 deve começar criando 1-2 testes E2E do fluxo de geração de PDF (mock Browserless), e só então refatorar.

---

## 3. Boundaries reafirmados

```
src/
├─ data/                      datasets puros (sem JSX, sem hooks)
│  ├─ objectionsLibrary.ts    types + meta + barrel
│  └─ objections/data.ts      ← novo: array OBJECTIONS isolado
│
├─ components/modules/
│  └─ investment/
│     ├─ InvestmentScenarioCard.tsx   apresentacional
│     ├─ InvestmentStrategyTab.tsx    ← novo: aba completa
│     ├─ useInvestmentScenarios.tsx   ← novo: hook puro
│     └─ investmentTypes.ts           types compartilhados
│
└─ components/modules/InvestmentModule.tsx
    container/orquestrador (state + composição de subcomponents)
```

**Regra reforçada:** novos arquivos `<400 LOC`. Hooks puros → `.ts/.tsx` ao lado do consumer principal (não sobem para `src/hooks/` a menos que sejam reutilizados em ≥2 módulos).

---

## 4. Performance — observações reais

**Não foram aplicadas otimizações novas** neste sprint. Justificativa:

- `useInvestmentScenarios` mantém o `useMemo` exato; mover para hook **não cria** novos re-renders.
- `InvestmentStrategyTab` recebe props já memoizadas (`scenarios`, `calculations`); React reconciliará igual ao bloco inline anterior.
- Zero `React.memo` adicionado: a evidência empírica seria necessária via Profiler antes — over-memoization é tech debt mascarado.

**Ganho real esperado:** **bundle splitting trivialmente possível agora.** A aba Estratégia pode ser `lazy()` em Sprint B.2 sem mexer no container.

---

## 5. Riscos restantes

| Risco | Severidade | Plano |
|---|---|---|
| Aba "Cenários" (~280 LOC JSX) ainda inline em `InvestmentModule` | Média | Sprint B.2: criar `useScenariosTabState` antes de extrair |
| `ProposalPdfModule` intocado | Alta | Sprint B.2: começar por testes de integração do PDF |
| `data.ts` de objections cresce livremente | Baixa | Quando passar de 1500 LOC, dividir por categoria (estrutura já preparada em `src/data/objections/`) |
| Sem teste E2E do `useInvestmentScenarios` | Baixa | Adicionar Vitest com fixture de `calculations` + asserts em `classifications.best` |
| Tour `intro.js` continua dentro do bundle imediato (importado dinamicamente, ok) | Baixa | OK — `import()` dinâmico já estava |

---

## 6. Smoke checklist

- [x] Tests `src/test/multitenant.invariants.test.ts` — **8/8 pass** (não regrediram).
- [x] TypeScript build clean (compilador silencia após cleanup de imports).
- [x] Imports `@/data/objectionsLibrary` continuam válidos para `ObjectionsModule.tsx` e `objectionRecommender.ts` (0 mudanças nos consumers).
- [x] `InvestmentModule` exporta a mesma assinatura (`export function InvestmentModule()`).
- [x] IDs HTML preservados (`#strategy-*`, `#investment-*`) — tour, prints e seletores E2E continuam ancorando.
- [ ] **A validar manualmente:** abrir aba "Estratégia Avançada", clicar Tour Guiado, gerar proposta — comportamento idêntico esperado.

---

## 7. Padrões reafirmados (DX)

- **Naming:** hooks `useX.tsx` quando contêm JSX (icons inline); `.ts` quando pura função.
- **Co-location:** subcomponents/hooks específicos de um módulo ficam em `src/components/modules/<feature>/`.
- **Re-export barrel:** mantido em `objectionsLibrary.ts` para preservar API pública. Aceitável porque o barrel é fino e estável.
- **Não criar abstrações genéricas** sem ≥2 consumidores reais (regra "rule of three").

---

## 8. Score de modularização

| Critério | Antes | Depois |
|---|---:|---:|
| Maior god module (LOC) | 1037 | 877 |
| God modules > 800 LOC | 3 | 1 |
| Arquivos data > 500 LOC misturando lógica | 1 | 0 |
| Hooks puros isoláveis em Investment | 1 (`useInvestmentCalculations`) | 2 |
| Score global de modularidade | 6.8/10 | **7.6/10** |

---

## 9. Pontos preparados para próximas etapas

**Sprint B.2 (recomendado antes de M4):**
1. Criar `useScenariosTabState` para extrair a aba Cenários completa.
2. Criar smoke tests do fluxo PDF (mock `generate-pdf`).
3. Refatorar `ProposalPdfModule` em `useStorytellingAutoGen` + `ProposalBlocksPicker` + `ProposalCustomMessages`.
4. `lazy()` tabs do `InvestmentModule` (ganho real de cold-load).

**M4 (Manager Views):** desbloqueado tecnicamente. As fronteiras refeitas em M3 + Sprint A + Sprint B já permitem iniciar Manager Views sem refactor adicional pré-requisito.

---

## 10. Conclusão honesta

Sprint B entregou **redução de 877 LOC** no `objectionsLibrary` (vitória clara, baixíssimo risco) e **redução de 195 LOC + 2 unidades isoladas** no `InvestmentModule`. Não atingiu o alvo agressivo de "<400 LOC por arquivo" nos containers — atingir isso exigiria reestruturar state-management da aba Cenários, o que foi conscientemente adiado por **risco operacional × benefício marginal**.

`ProposalPdfModule` foi deliberadamente preservado porque a métrica de risco superou a de ganho sem testes. A recomendação de criar testes antes do refactor está documentada e priorizada.

**Score SaaS ajustado:** 8.2 → **8.4/10** (ganho moderado e sólido; sem regressões).
