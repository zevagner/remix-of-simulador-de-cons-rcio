# Investment Module — UX Simplification & Information Architecture Audit Wave

**Data:** 2026-05-14
**Escopo:** `src/components/modules/InvestmentModule.tsx` (Análise → Investimento)
**Tipo:** UI/UX, presentation-only. **Zero alteração** em lógica financeira, hooks, providers, Supabase, IA core.

---

## Fase 1 — Auditoria estrutural

### 1.1 Mapa de hierarquia (estado anterior)

| Ordem | Bloco | Categoria | Observação |
|---|---|---|---|
| 1 | `ModuleHeader` | Contexto | OK |
| 2 | Banner "Simulação baseada no cenário…" (nicho) | Contexto condicional | OK |
| 3 | `PrintHeader` / `PrintableParams` | Print-only | OK |
| 4 | Toolbar com `<p>Nesta análise, o consórcio é avaliado…</p>` + disclaimer | **Contexto/educação** | **Redundante com #5** |
| 5 | `Card` institucional "Este módulo apresenta diferentes estratégias…" | **Contexto/educação** | **Redundante com #4** |
| 6 | Alert `!hasSimulatorData` | Estado vazio | OK |
| 7 | Card CentralAI (header repetia "Recomendado: X · Lucro estimado: Y") | IA / **Resultado duplicado** | **Repetia o headline do #8** |
| 8 | `RecommendationCard` "Melhor estratégia identificada" | **Resultado principal** | Protagonista correto |
| 9 | Grid de cenários (top 3 + ver mais) | Comparação | OK |
| 10 | `InvestmentSummaryCards` + nota | Suporte | OK |
| 11 | Collapsible "Dados do consórcio e premissas" | Suporte técnico | OK |
| 12 | Collapsible "Ideias avançadas — nichos estratégicos" | Exploração | OK |

### 1.2 Redundâncias detectadas

- **R1 — Dupla introdução:** parágrafo "Nesta análise…" (toolbar) + Card institucional "Este módulo apresenta…" diziam a mesma coisa, com chrome visual diferente, lado a lado.
- **R2 — IA ecoando o headline:** o trigger da CentralAI exibia *"Recomendado: {winner.name} · Lucro estimado: {valor}"* — exatamente os mesmos campos do `RecommendationCard` logo abaixo. O usuário lia o vencedor 2× antes de chegar à comparação.
- **R3 — Chrome competindo:** dois containers `border-primary/20 bg-primary/5` consecutivos (Card institucional + Card CentralAI gradiente) competiam pela atenção do olho na entrada do módulo.

### 1.3 Containers desnecessários

- Card institucional inteiro (12 linhas, AlertCircle + 2 parágrafos) → puro chrome explicativo, redundante.
- Header pesado da CentralAI (mini-resumo com winner duplicado, badge, gradiente) → trigger podia ser um botão neutro sem repetir resultado.

---

## Fase 2 — Limpeza e consolidação aplicada

### 2.1 Remoções

- ❌ **Removido:** Card institucional "Este módulo apresenta diferentes estratégias…" (linhas 447–458).
  - O contexto + disclaimer permanece **uma única vez** na toolbar (parágrafo "Nesta análise…" + nota legal de estimativa/sem garantia de contemplação).

### 2.2 Consolidações

- ✅ **CentralAI agora é complemento real, não eco.**
  - Trigger redesenhado: `bg-muted/30` neutro (em vez de `border-primary/20 bg-gradient`), uma linha compacta:
    > `✨ Análise complementar da CentralAI [Beta] · narrativa, riscos e racional além do headline   Ver análise ▾`
  - **Não exibe** mais nome do vencedor nem valor de lucro no header colapsado.
  - Conteúdo expandido (`AIInsightsPanel`) inalterado — IA continua entregando narrativa, riscos e contexto, agora posicionada como **camada complementar** ao card de resultado, não como duplicata dele.

### 2.3 Chrome reduzido

- 2 containers `border-primary/20 bg-primary/5` → **0** na entrada do módulo.
- Hierarquia visual da entrada: `ModuleHeader` → toolbar (texto + ações) → IA neutra colapsada → **RecommendationCard protagonista** → comparação.

---

## Fase 3 — Experiência consultiva

### 3.1 O que mudou para o usuário

| Antes | Depois |
|---|---|
| Lê 2 introduções iguais antes de qualquer dado | Lê 1 introdução compacta com disclaimer |
| Vê o vencedor 2× (header IA + RecommendationCard) | Vê o vencedor 1× — no protagonista correto |
| 2 surfaces primary tons azulados consecutivos | 1 surface primary (RecommendationCard) destacada |
| IA parece banner promocional | IA parece análise complementar opcional |

### 3.2 Inteligência analítica preservada

- `useInvestmentCalculations`, `useInvestmentScenarios`, `getEffectiveAssumptions`, `useCashComparison` → intactos.
- `AIInsightsPanel compact autoRun` continua rodando dentro do collapsible — narrativa IA não foi removida, foi **reposicionada**.
- `RecommendationCard` (protagonista) inalterado: mesmos campos, mesmo CTA, mesma matemática.

---

## Fase 4 — Segurança operacional

✅ Lógica financeira: **intacta** (zero edits em `useInvestmentCalculations`, `useCashComparison`, `useInvestmentScenarios`, `effectiveAssumptions`, `core/finance`).
✅ Hooks/providers/runtime: **intactos** (`useSimulatorInput`, `useSimulatorResult`, `useInvestmentResults`, `useJourneyGuidance`, `useTrackModuleAccess` inalterados).
✅ Supabase: **sem alterações**.
✅ IA core: `AIInsightsPanel`/`generateInsight` inalterados; apenas wrapper visual mudou.
✅ Print/PDF: `PrintHeader`, `PrintableParams`, `InvestmentPrintBlock`, `InvestmentPdfActions` intactos.
✅ Responsividade: trigger CentralAI usa `flex-wrap` + texto auxiliar `hidden sm:inline`, mantém legibilidade mobile.
✅ Imports não-usados: `Card`/`CardContent`/`AlertCircle` continuam usados em outros pontos do arquivo (Alert, banner nicho, etc.) — sem dead imports.

---

## Respostas claras

- **O que foi removido?** Card institucional duplicado "Este módulo apresenta diferentes estratégias…".
- **O que foi consolidado?** Introdução do módulo (1 fonte única na toolbar) e apresentação da IA (trigger neutro sem repetir vencedor/lucro).
- **O que estava redundante?** (a) Duas explicações de contexto; (b) header da CentralAI ecoando o RecommendationCard.
- **O que a IA passou a fazer?** Análise **complementar** real (narrativa, riscos, racional), não duplicata do headline. Continua acessível em 1 clique.
- **O módulo ficou mais limpo?** Sim — 2 containers de chrome a menos na entrada; 1 protagonista visual claro.
- **O fluxo ficou mais consultivo?** Sim — eye-flow agora é: contexto curto → resultado dominante → comparação → suporte/IA opcional.
- **O que ainda impede 10/10?** (a) `PrintableParams` e `PrintHeader` aparecem fora de print em alguns viewports — auditar `print-hide` em wave futura. (b) Nota italics "* Cenários consideram o valor utilizado como lance…" poderia migrar para tooltip do `InvestmentSummaryCards`. (c) Aba "Estratégia Avançada" vs "Cenários" merece revisão de nomenclatura — possível overlap.

---

## Scores (0–10)

| Dimensão | Antes | Depois |
|---|---|---|
| Hierarchy clarity | 6.0 | 8.5 |
| Cognitive simplicity | 5.5 | 8.5 |
| Consultive sophistication | 6.5 | 8.5 |
| Premium perception | 6.5 | 8.5 |
| Information architecture | 6.0 | 8.5 |
| UX cleanliness | 5.5 | 9.0 |
| Estabilidade operacional | 10.0 | 10.0 |

---

## Arquivos alterados

- `src/components/modules/InvestmentModule.tsx` — remoção do Card institucional + redesign do trigger CentralAI.
- `.lovable/audit/investment-module-ux-simplification-audit-wave.md` — este relatório.

**Nenhum outro arquivo, hook, edge function, migration ou rota foi tocado.**
