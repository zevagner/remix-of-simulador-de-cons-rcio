# Análise → Cockpit Consultivo — Implementation Report

Data: 2026-05-12
Sprint: Reorganização estratégica do módulo Análise
Antecede: `.lovable/audit/modulo-analise-ux-strategic-audit.md`

> Esta sprint **executa** as recomendações do audit estratégico anterior.
> Nenhum motor financeiro, regra de negócio, RLS ou pipeline PDF foi tocado.
> Todas as mudanças são de **navegação, copy, hierarquia visual e cockpit**.

---

## 1. Mudanças aplicadas

### 1.1 Renomeação — "Visão Geral" → "Cockpit Consultivo"
- `src/config/modules.ts` → `ANALYSIS_SUBITEMS`: label atualizado, ícone trocado
  (`LayoutDashboard` → `Compass`), hint reescrita para comunicar **ação**:
  "Próximo passo recomendado para fechar a venda".
- `src/config/copy/moduleTips.ts` → tip atualizada para
  *"Comece pelo Cockpit: ele indica o próximo passo certo da venda em segundos."*
- Sidebar, breadcrumb, mobile sheet e tooltip refletem automaticamente
  (todos consomem `ANALYSIS_SUBITEMS` como fonte única).

### 1.2 Sidebar simplificada — 4 itens em vez de 6
**Antes:** Visão geral · Investimentos · Comparador · Estudo de lances ·
Operações estruturadas · Assembleias.
**Depois:** Cockpit Consultivo · Investimentos · Comparador · Estudo de lances.

- `Operações estruturadas` saiu do menu principal — vira **CTA contextual**
  no Cockpit (carta ≥ R$ 500.000).
- `Assembleias` saiu do menu principal — virou **seção interna colapsável**
  ("Histórico do grupo") dentro de Estudo de Lances.
- IDs `'advanced'` e `'assemblies'` continuam **válidos como rotas**
  (`isAnalysisTabId` + branches em `AnalysisModule.tsx`). Bookmarks,
  CTAs legados (`NextStepCTA`, `useJourneyGuidance`) e o redirect via
  `Index.tsx` continuam funcionando.

### 1.3 Cockpit Consultivo reorganizado (`AnalysisOverview.tsx`)
Nova hierarquia visual de cima para baixo:

1. **Próximo passo recomendado** (hero — card primário grande
   `border-2 border-primary/50` + secundários discretos em grid 2-col).
2. **O que falar com o cliente agora** — frase pronta em itálico com
   borda lateral azul, botões `Copiar frase` / `Abrir Abordagem` /
   `Gerar Proposta`.
3. **Pontos de atenção** (alertas — preserva comportamento anterior).
4. **CTA contextual de Operações Estruturadas** (só aparece se
   `creditValue ≥ R$ 500.000`).
5. **Resumo executivo da simulação** — collapsível, fechado por padrão.
   KPIs reduzidos a 3 (Parcela, Custo efetivo, Perfil) — KPI fraco
   *"Contemplação estimada = termMonths × 0.4"* **removido**.

### 1.4 "Histórico do grupo" dentro de Estudo de Lances
- `BidsModule.tsx`: nova seção colapsável ao final, ícone `History`,
  carrega `AssembliesModule` via `lazy()` + `Suspense` apenas quando
  expandida → **zero impacto no carregamento inicial** do módulo Bids.
- Conteúdo de Assembleias permanece **integralmente intacto**
  (mesmo componente, mesmo context, mesmas funcionalidades).

### 1.5 BottomNav (mobile) atualizado
- `MOBILE_ANALYSIS_ORDER` reduzido para 4 itens, alinhado à sidebar.
- Operações estruturadas e Assembleias seguem acessíveis via CTA
  contextual / seção interna do Bids.

---

## 2. Antes / depois — UX

### 2.1 Sidebar (desktop)
```text
ANTES                                  DEPOIS
─────────                              ─────────
Análise                                Análise
├─ Visão geral                         ├─ Cockpit Consultivo  ← entrada óbvia
├─ Investimentos                       ├─ Investimentos
├─ Comparador                          ├─ Comparador
├─ Estudo de lances                    └─ Estudo de lances
├─ Operações estruturadas                  └ Histórico do grupo (interno)
└─ Assembleias                         (Op. estruturadas: CTA contextual)
```

### 2.2 Tela Cockpit
```text
ANTES                                  DEPOIS
─────────                              ─────────
1. KPIs (4 tiles, sempre visíveis)     1. Próximo passo (hero grande)
2. Pontos de atenção                   2. O que falar com o cliente agora
3. Próximo passo (3 cards iguais)      3. Pontos de atenção
                                       4. CTA contextual (avançado)
                                       5. Resumo (recolhido por padrão)
```

### 2.3 Carga cognitiva — KPIs no Cockpit
- **Antes:** 4 KPIs sempre na tela (incluindo "Contemplação estimada"
  com heurística fraca `termMonths × 0.4`).
- **Depois:** 3 KPIs reais, **escondidos por padrão** num accordion.
  Quem precisar do número clica; quem está em fluxo de venda não vê ruído.

---

## 3. Fluxo consultivo validado

```text
Diagnóstico  →  Simulador  →  Cockpit Consultivo  →  Submódulo
                                                        recomendado
                                                            ↓
                                                       (Comparador /
                                                        Investimentos /
                                                        Estudo de Lances)
                                                            ↓
                              Botão "Abrir Abordagem"  ←  Cockpit
                                                            ↓
                                                       Abordagem
                                                            ↓
                                                       Proposta
```

O Cockpit agora é o **nó de decisão central** e **liga explicitamente
Análise → Abordagem → Proposta** com botões contextualizados pela frase
pronta.

---

## 4. Riscos restantes / pendências

| Risco                                           | Severidade | Mitigação atual                                                |
| ----------------------------------------------- | :--------: | -------------------------------------------------------------- |
| Frase "O que falar agora" é determinística      |   Baixa    | Por design — escapa do risco de IA prometer garantia.          |
| `useTrackModuleAccess('assemblies')` ainda dispara dentro do Bids quando histórico expande | Muito baixa | Aceitável — analytics permanece consistente.        |
| Algum tour/tooltip ainda usar texto "Visão geral" | Muito baixa | `helpContent.ts` deve ser revisado em onda futura. Não bloqueia. |
| Usuário antigo procurando "Assembleias" no menu |   Baixa    | Acesso preservado via Estudo de Lances → seção colapsável visível.|
| `AIInsightsPanel` (renderizado pelo container)  ainda concorre visualmente com alertas do Cockpit | Média | Pendente: fundir com seção "Pontos de atenção" em onda futura. |

Nenhum risco bloqueante. Nenhuma rota quebrada. Build limpo.

---

## 5. Compatibilidade preservada

- ✅ IDs `assemblies` e `advanced` continuam navegáveis
  (`isAnalysisTabId`, `navState`, `Index.tsx`).
- ✅ `NextStepCTA` / `useJourneyGuidance` / `FunnelTab` continuam
  funcionando sem mudança.
- ✅ Lazy loading + preload no idle dos submódulos preservados.
- ✅ Persistência de última aba (`moduleTabPersistence`) intacta.
- ✅ `ANALYSIS_TAB_IDS` (derivado de `ANALYSIS_TABS`) inalterado.
- ✅ Mobile sheet de Análise atualizado para refletir sidebar.

---

## 6. Métricas qualitativas (estimativa)

| Dimensão                          | Antes | Depois |
| --------------------------------- | ----: | -----: |
| Itens visíveis no menu Análise    |   6   |   4    |
| KPIs sempre na tela do Cockpit    |   4   |   0 (recolhidos) |
| Tempo até decidir "para onde ir"  | médio | imediato |
| Ligação visual Análise → Venda    | fraca | forte (3 botões) |
| Densidade do hero da entrada      | média |  alta (1 card primário óbvio) |

---

## 7. O que NÃO foi alterado (por design)

- Motores de cálculo (`@/core/finance`, `bidsEngine`, `decisionEngine`).
- Hooks de cálculo (`useInvestmentCalculations`, etc.).
- RLS, multi-tenant, edge functions, pipeline PDF.
- Conteúdo dos submódulos (`InvestmentModule`, `ComparatorModule`,
  `BidsModule` — apenas adição da seção Histórico ao final).
- Identidade visual / design system.

---

## 8. Próximas ondas sugeridas

1. **Fundir `AIInsightsPanel` com bloco de Alertas do Cockpit** para
   eliminar duplicação visual remanescente.
2. **Mover frase pronta para CentralAI** quando houver storytelling de
   alta qualidade disponível, mantendo determinístico como fallback.
3. **Atualizar tour de onboarding** (`tourSteps`) para incluir o Cockpit
   como passo central da Análise.
4. **Telemetria do Cockpit:** medir cliques no card primário vs.
   secundários vs. "Copiar frase" para validar hierarquia escolhida.
5. **Esconder seção "Histórico do grupo"** quando não houver dados de
   assembleia importados (já é implícito mas pode ganhar mensagem).

---

**Conclusão:** o módulo Análise agora apresenta uma única entrada óbvia
(Cockpit Consultivo) que **decide a próxima jogada**, fala a frase certa
para o cliente e conecta a Abordagem/Proposta em um clique. A sidebar
foi enxugada de 6 para 4 itens sem perder nenhuma funcionalidade. O
gerente passa de *"qual aba devo abrir?"* para *"o sistema já sugeriu —
basta clicar e falar"*.
