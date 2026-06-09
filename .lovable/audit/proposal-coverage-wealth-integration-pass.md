# Proposal Coverage & Wealth Integration Pass

**Wave:** PDF Onda 2 — Coverage & Integration
**Status:** ✅ Executado
**Escopo:** Reconectar a Proposta Completa à inteligência patrimonial atual da plataforma sem
explodir páginas, sem rebuild e sem unificação visual v1/v2.

---

## 1. Wealth/Patrimonial Integration

**O que mudou**
- Novo bloco `wealth-thesis` (order 45) no catálogo `PROPOSAL_BLOCKS`.
- Nova página `WealthThesisPage.tsx` (1 página executiva, hierarquia limpa).
- Façade `useProposalData()` ampliada com `activeStrategy` (ActiveStrategyContext).
- `ProposalPdfModule` resolve a estratégia ATIVA contra `STRATEGY_LIBRARY` e injeta
  apenas o necessário: título, tagline, racional patrimonial, "como funciona",
  vantagens (4), riscos (4), 3 KPIs textuais parametrizados pelo crédito da simulação.

**O que NÃO mudou**
- Engine canônica intacta. Nenhuma matemática nova.
- Catálogo inteiro de 24 estratégias **NÃO** é exportado — só a tese personalizada.
- Sem novo motor, sem novo cache, sem novo edge.

---

## 2. Strategy Applications Integration (DR-1/DR-2)

A Wealth Library V2 já carrega `applications` e `flagship` no editorial das estratégias
(governado pela memória `flagship-discoverability-layer`). A Proposta exibe a estratégia
escolhida com seu racional consultivo de profundidade (`howItWorks`, `patrimonialLogic`,
`advantages`, `risks`) — o leitor recebe a tese contextual, não o catálogo.

**Decisão arquitetural:** flagship/applications continuam morando no editorial da
biblioteca. A Proposta NÃO duplica esse conteúdo nem renderiza um "panel de aplicações".
Isso preserva a regra "síntese consultiva premium" do prompt e a V2 Constitution.

---

## 3. Compare Workspace V2 Integration

- `ActiveStrategy.source` já distingue `wealth-library | compare-winner | manual`.
- A `WealthThesisPage` cita explicitamente a origem ("origem: vencedora do Compare")
  no rodapé da seção.
- Quando o gerente promove uma vencedora no Compare via `setActiveStrategy(id, 'compare-winner')`,
  a Proposta passa a refletir essa escolha automaticamente — continuidade consultiva
  sem novo payload paralelo.
- Compare legacy: nenhum binding órfão foi reintroduzido. A integração se dá via
  contexto canônico, não via dump de payload do Compare.

---

## 4. Structured Operations Multi-Carta Integration

**Crítico — corrigido nesta onda.**
- Novo contexto `StructuredOpsResultsContext` (publish/consume, zero cálculo).
- `StructuredOperationsModule` publica `{ consolidated, cards, cardsCount, effectiveRate }`
  via `useEffect` — mesma fonte que alimenta a UI; nenhum recálculo.
- Novo bloco `structured-ops` (order 46).
- Nova página `StructuredOpsPage.tsx`: 1 página executiva — racional + 6 KPIs consolidados
  + tabela enxuta (máx 10 linhas, truncada).
- Tipo `consortiumType` é renderizado via `STRUCTURED_TYPE_LABELS` (mesmos rótulos do módulo).

**Anti-regressão:** sem o módulo aberto na sessão, `structuredOps === null` e a página
exibe `MissingDataNote` consultiva. Nada de números fake.

---

## 5. Consultive Continuity Validation

Fluxo agora coberto end-to-end no PDF:

```text
Diagnóstico → Simulação → Comparações (Financ./À Vista) → Estratégias (Lance/Renda/Venda)
            → Tese patrimonial (Wealth/Compare) → Operação estruturada (multi-cartas)
            → Aprofundamento (Bids/Contemplação) → Storytelling → Argumentos → Objeções → Fechamento
```

A Proposta agora é continuação natural da plataforma: a tese escolhida no Wealth/Compare
aparece, e a operação multi-cartas montada no módulo é refletida — sem o gerente precisar
copiar nada manualmente.

---

## 6. Proposal Scanning Validation

- Novas páginas seguem o **mesmo template visual** das demais (Header/PageBody/Footer,
  `SectionTitle` + kicker, `MetricGrid`, `PdfTable`).
- Densidade controlada: máx 3 KPIs no hero, máx 4 vantagens/riscos, máx 10 linhas na
  tabela de composição.
- Hierarquia executiva preservada: kicker → título → tagline → racional → métricas.
- Sem cards explosion. Sem layering. Sem "dashboardization".

---

## 7. Legacy Safety Validation

- `getMissingDataBlocks()` continua funcionando — os novos blocos retornam `true` no gate
  (sempre renderizam, com fallback consultivo se faltar dado).
- Wizard de seleção (`ProposalPdfModule`) descobre os blocos automaticamente via
  `PROPOSAL_BLOCKS` agrupados por `category` — não precisou tocar UI do wizard.
- Pipeline mantém ordem narrativa por `order` (45/46 entre "Estratégias" e "Aprofundamento").
- `wealth-thesis` é `recommended: true` (entra marcado por padrão);
  `structured-ops` é opcional (só faz sentido quando o gerente montou a operação).
- Nenhum payload órfão. Nenhum contract morto reativado.

---

## 8. PDF Data Parity Validation

| Bloco             | Fonte canônica                                  | Recálculo? |
|-------------------|-------------------------------------------------|------------|
| simulation        | SimulatorContext                                | ❌ Não      |
| diagnostic        | DiagnosticContext                               | ❌ Não      |
| cmp-cash          | InvestmentResultsContext.cashComparison         | ❌ Não      |
| investment paths  | InvestmentResultsContext.calculations           | ❌ Não      |
| bids-study        | BidsStudyContext                                | ❌ Não      |
| **wealth-thesis** | ActiveStrategyContext + STRATEGY_LIBRARY        | ❌ Não      |
| **structured-ops**| StructuredOpsResultsContext (publicado pelo módulo) | ❌ Não  |

KPIs textuais da `wealth-thesis` (`lib.calculations[i].result(credit)`) usam o
crédito da simulação ativa — exatamente a mesma função que o Wealth/Library renderiza
na UI. Zero drift.

---

## 9. Final Proposal Integrity State

**Cobertura atual da Proposta Completa:**
- ✅ Diagnóstico do cliente
- ✅ Simulação principal
- ✅ Consórcio × Financiamento (engine canônica)
- ✅ Consórcio × À Vista (engine canônica — Onda 1)
- ✅ Estratégias: Lance, Renda, Venda
- ✅ **Tese patrimonial (Wealth/Compare V2)** ← novo
- ✅ **Operação estruturada multi-cartas** ← novo
- ✅ Estudo de lances + análise de contemplação
- ✅ Storytelling IA / Argumentos / Objeções
- ✅ Fechamento + escala de decisão

**Não coberto intencionalmente** (síntese consultiva, não explosão documental):
- Catálogo completo de 24 estratégias da Library — só a tese ATIVA entra.
- Painel de "applications/flagship" inteiro — racional consultivo já cobre o caso.
- Todas as 6 paths do Investment em página própria — `investment` mirror entrega
  o melhor cenário + dados das paths sob demanda nas páginas existentes.

---

## 10. Final Verdict

A Proposta Completa **agora representa fielmente a inteligência atual da plataforma**.

- Drift financeiro: zero (preservado da Onda 1).
- Cobertura patrimonial: integrada via `wealth-thesis` consultivo.
- Operação estruturada: integrada via `structured-ops` consolidado.
- Continuidade consultiva: a escolha do gerente na Library/Compare propaga para o PDF
  sem ação manual.
- Document explosion: evitado — 2 páginas novas, densidade controlada, hierarquia
  executiva preservada.
- Legacy safety: nenhum binding antigo quebrado, wizard descobre blocos automaticamente.
- Zero rebuild, zero redesign global, zero unificação v1/v2.

A Proposta deixou de parecer "agregador legado" e voltou a parecer **continuação natural
da plataforma moderna** — consultiva, personalizada, sem virar relatório infinito.
