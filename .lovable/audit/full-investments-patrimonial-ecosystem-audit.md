# Full Strategic Audit — Investimentos & Engenharia Patrimonial

**Data:** 2026-05-15
**Escopo:** Submódulos `Análise → Investimentos` e `Análise → Engenharia Patrimonial` como ecossistema consultivo único.
**Modo:** Auditoria de **clareza sofisticada**, não de novas features.

---

## 1. Mapa do ecossistema atual

### Investimentos (`InvestmentModule.tsx` — 793 linhas, 3 abas)

| Aba | Conteúdo principal | Componentes |
|---|---|---|
| **Cenários** | 6 cenários patrimoniais, KPI Education Card, narrativa por cenário, gráfico comparativo | `KpiEducationCard`, `InvestmentScenarioCard` (×6, com `ExecutiveKpiStrip` + Hero + racional colapsável), `StrategicNicheCards`, `ScenarioComparisonChart` |
| **Estratégia Avançada** | Comparativo numérico cota única vs. multi-cota | `InvestmentStrategyTab`, `CotaMultiplicationCard` |
| **Compra à Vista** | Comparador alavancagem 2× | `CashComparisonTab` |

### Engenharia Patrimonial (`PatrimonialModule.tsx` — 118 linhas)

| Bloco | Conteúdo | Componentes |
|---|---|---|
| Header consultivo | Posicionamento institucional |  inline |
| **KPI bar** | TIR / ROI / Payback / Multiplicador / Preservado | `PatrimonialKpiBar` |
| **6 estratégias curadas** | Autoquitação, Escada, Renda Passiva, Construção, Multiplicação, Holding | `PatrimonialStrategyCard` ×6 (com `PatrimonialTimeline` colapsável) |
| **Decision Desk** | Resumo executivo + Comparação longitudinal + Insights | `PatrimonialDecisionDesk` (envolve `PatrimonialTimelineComparator`) |
| **Jornada** | Aquisição → Estratégia → Patrimônio → Renda → Legado | `PatrimonialJourneyStepper` |
| **Atalho** | Para "Estratégia Avançada" do Investimentos | inline |

**Total: 5.127 linhas distribuídas em 27 arquivos.**

---

## 2. Papel dos módulos — clareza de fronteira

| Dimensão | Investimentos (esperado) | Patrimonial (esperado) | Status real |
|---|---|---|---|
| Horizonte temporal | Curto-médio (até 60m) | Longo prazo (5/10/15a) | ✅ Distinto |
| Foco analítico | Comparação numérica cenário-a-cenário | Estruturação patrimonial multi-ativo | ✅ Distinto |
| Decisão suportada | "Qual cenário desta carta?" | "Qual estratégia patrimonial?" | ⚠️ **Parcial sobreposição** |
| Granularidade | 1 carta × 6 cenários táticos | Carta como bloco de uma engenharia maior | ✅ Distinto |
| Saída | Argumento de venda contextual + storytelling | Mesa consultiva por perfil | ✅ Distinto |

**Veredicto:** as fronteiras estão **claras na intenção**, mas há **3 pontos de fricção** que minam a percepção de ecossistema único (ver §3).

---

## 3. Sobreposição & duplicidade detectadas

### 🟠 D1 — KPI Education Card vs. KPI Bar

- `KpiEducationCard` (Investimentos / Cenários) explica ROI/TIR/Payback/Multiplicador/Preservado.
- `PatrimonialKpiBar` exibe **os mesmos 5 KPIs** em formato compacto.
- O usuário lê a explicação no Investimentos e revê os mesmos KPIs (sem explicação inline) no Patrimonial.
- **Sintoma:** repetição de definição mental + falta de bridge ("você já viu esses KPIs aqui").

### 🟠 D2 — Multiplicador patrimonial em 3 superfícies

| Superfície | Cálculo | Localização |
|---|---|---|
| `scenarioExecutiveKpis.ts` | Multiplicador por cenário | `ExecutiveKpiStrip` em cada `InvestmentScenarioCard` |
| `usePatrimonialKpis` | Multiplicador agregado | `PatrimonialKpiBar` |
| `decisionDeskInsights` | Multiplicador Y15 por arquétipo | `PatrimonialDecisionDesk` chips + insights |

São **3 leituras legítimas** mas o usuário não tem mapa explícito de qual usar quando. Risco de "qual número é o real?"

### 🟡 D3 — Atalho cruzado redundante

`PatrimonialModule` expõe atalho "Abrir em Investimentos → Estratégia Avançada", mas o `Decision Desk` já entrega comparativo completo. O atalho perdeu propósito após a wave Decision Desk.

### 🟡 D4 — Storytelling vs. racional consultivo do Decision Desk

`InvestmentStorytelling` (auto-fetch IA) gera narrativa por cenário. `Decision Desk → Insights` dá racional determinístico por arquétipo. Conteúdos não competem, mas **vocabulário não está alinhado** ("cenário" × "arquétipo" × "estratégia").

### 🟢 D5 — Sem duplicidade detectada
- Timelines: Investimentos não tem timeline 5/10/15a — exclusivo do Patrimonial. ✅
- Comparador: Investimentos compara 6 cenários da mesma carta; Patrimonial compara 6 arquétipos longitudinalmente. ✅
- Sucessão: nicho de sucessão foi removido do Investimentos e centralizado no Patrimonial (Holding). ✅

---

## 4. Carga cognitiva — observações

### Investimentos

| Sintoma | Severidade |
|---|---|
| 3 abas + 6 cenários + niches + chart = 4 níveis de leitura | 🟠 Alta densidade na aba Cenários |
| `StrategicNicheCards` aparece **dentro** da aba Cenários, ainda que conceitualmente seja outra dimensão | 🟠 Confunde hierarquia |
| `ScenarioComparisonChart` (372 linhas) ao final da aba — usuário pode nunca rolar até lá | 🟡 Conteúdo subutilizado |
| Education Card pode ficar "grudado" mesmo após o consultor já dominar os KPIs | 🟡 Falta dismiss persistente |

### Patrimonial

| Sintoma | Severidade |
|---|---|
| 6 cards de estratégia + Decision Desk (que também menciona as 6) | 🟠 Risco de leitura dupla |
| Cada `PatrimonialStrategyCard` tem timeline colapsável + Decision Desk tem comparator | 🟡 Timeline aparece em 2 lugares |
| Atalho final para Investimentos compete com a hierarquia natural (Decision Desk → Jornada) | 🟢 Baixo, mas removível |

### Avaliação global de carga

- **Não há** explosão de KPIs, tabelas ou modais. ✅
- **Há** risco de "leitura dupla" quando o usuário entra em ambos: vê 6 cenários de uma carta, depois vê 6 arquétipos patrimoniais e precisa traduzir mentalmente.
- **Falta um bridge curto** ("Cenários respondem 'qual ângulo desta carta'; Engenharia responde 'qual jornada para o cliente'").

---

## 5. Scanning executivo — heatmap

| Elemento | Tempo até insight | Avaliação |
|---|---|---|
| `ExecutiveKpiStrip` em cada cenário | <2s | ✅ Excelente |
| Hero do cenário (lucro absoluto + microline) | <2s | ✅ Excelente |
| `PatrimonialKpiBar` | <3s | ✅ Bom |
| Decision Desk → Resumo Executivo (chips por perfil) | <5s | ✅ Excelente — entrega pivô da onda anterior |
| Decision Desk → Comparação longitudinal | 10–15s | 🟡 Tabela densa, sem destaque visual em "vencedor da linha" |
| `PatrimonialStrategyCard` (6 cards) | 5–8s cada × 6 | 🟠 Repetição estrutural cansa |
| `ScenarioComparisonChart` | 15–20s | 🟠 Recharts pesado, baixo retorno consultivo |

---

## 6. Hierarchy visual

✅ **Funcionando**:
- Cards usam border `primary/15-20` consistente.
- Badges `Estimativa` padronizadas.
- Headers institucionais com ícone primary em quadrado de 8×8.
- Disclaimers sempre em `text-[10px] italic muted`.

🟡 **Pontos a refinar**:
- `Decision Desk → Comparação longitudinal` não destaca a célula "vencedora" por linha (patrimônio Y15 mais alto, etc.). Olho do usuário não pousa.
- Em `PatrimonialDecisionDesk`, os 3 ícones de seção (`ScanSearch`, `LayoutGrid`, `Sparkles`) são pequenos demais (h-3.5) — perdem peso vs. cabeçalho do card.
- `KpiEducationCard` tem 140 linhas e ocupa espaço crítico de "above the fold" da aba Cenários.

---

## 7. Decision Desk — auditoria focada

| Critério | Status |
|---|---|
| Claro | ✅ 3 camadas (A/B/C) explícitas |
| Útil | ✅ Resumo por perfil é o ângulo certo |
| Executivo | ✅ Chips compactos com headline metric |
| Consultivo | ✅ Disclaimer + tom institucional |
| Não poluído | 🟡 Comparação longitudinal aberta por padrão alonga o card; insights fechados é correto |
| Hierarquia entre A/B/C | 🟡 Falta micro-divisor visual entre seções (hoje só `border-t border-border/40`) |
| Mobile | 🟡 Grid 3 colunas vira 1 abaixo de `sm` — chips ficam 6 linhas verticais |

---

## 8. Timelines patrimoniais

✅ Narrativa institucional por marco (`Aquisição/Consolidação/Expansão/Estabilização`).
✅ 4 marcos (0/5/10/15a) — densidade certa.
✅ Premissas explícitas no rodapé.

🟡 Pontos:
- `PatrimonialTimeline` (componente in-card de cada estratégia) e `PatrimonialTimelineComparator` (Decision Desk) usam **representações visuais diferentes** (barras empilhadas × tabela). Coerência visual fraca.
- Não há indicação de "agora" (Y0) → o consultor pode esquecer do ponto de partida.

---

## 9. KPIs executivos

| KPI | Definição clara | Hierarquia | Premium feel |
|---|---|---|---|
| ROI | ✅ | ✅ | ✅ |
| TIR | ✅ (anualizada exposta) | ✅ | ✅ |
| Payback | ✅ | ✅ | ✅ |
| Multiplicador | ✅ (×) | ✅ | ✅ |
| Capital Preservado | ✅ | ✅ | ✅ |

✅ Não parece "terminal financeiro" — chips arredondados, ícones leves, valores tabulares.
🟡 Falta micro-tooltip explicando "como calculamos" no `PatrimonialKpiBar` (o `KpiEducationCard` faz isso, mas só na aba Cenários do Investimentos).

---

## 10. Racionais consultivos & microcopy

✅ Tom CAIXA: institucional, sólido, sem verbos marketing.
✅ Disclaimer "estimativa" em toda superfície projetiva.

🟡 Repetições verificadas:
- Frase "Resultados reais variam conforme grupo, contemplação, mercado e perfil do cliente" aparece em **5 superfícies** com leve variação. Padronizar 1 versão canônica.
- "Premissas conservadoras: valorização imobiliária 2% a.a., aluguel bruto 0,45% a.m. (~5,5% a.a.), CDI líquido 9% a.a." aparece em `PatrimonialTimelineComparator` e `PatrimonialDecisionDesk`. Centralizar em constante.
- `forWho` dos 6 strategies + `narrative` do timeline + `bullets` somam ~80 palavras por estratégia, lidos 6 vezes = ~480 palavras só de descrição. Pesado.

---

## 11. Aderência CAIXA & responsabilidade consultiva

✅ Sem promessa de retorno garantido.
✅ Sem gamificação (badges não usam medalhas/troféus exagerados — `Trophy` aparece apenas no Decision Desk uma vez).
✅ Tom conservador-inteligente preservado.
✅ Cores: primary azul institucional, sem destaques agressivos.

🟡 Único ponto: o ícone `Trophy` repetido nos 6 chips de perfil do Decision Desk pode dar leitura de "ranking esportivo". Considerar 6 ícones distintos por perfil (`Shield` conservador, `TrendingUp` crescimento, `Banknote` renda, `Layers` multiplicação, `Scale` equilíbrio, `Hourglass` longo prazo).

---

## 12. Consistência entre módulos

| Pattern | Investimentos | Patrimonial | Status |
|---|---|---|---|
| Header de card (ícone+título+subtitle) | ✅ | ✅ | Idêntico ✅ |
| Badge "Estimativa" | ✅ | ✅ | Idêntico ✅ |
| KPI strip | `ExecutiveKpiStrip` | `PatrimonialKpiBar` | ⚠️ Visualmente parecido, **componente diferente** |
| Disclaimer | inline | inline | ⚠️ String repetida |
| Progressive disclosure | "Ver racional consultivo" | "Resumo / Compare / Racional" | ⚠️ Vocabulário diferente |
| Tabs | 3 abas | sem abas | ✅ Intencional (Patrimonial = página linear) |

---

## 13. Performance perceptiva

✅ `PatrimonialDecisionDesk`: zero charts, zero deps novas.
✅ `PatrimonialTimeline`: CSS-only.
🟡 `ScenarioComparisonChart`: 372 linhas, depende de Recharts. Já está em `vendor-charts` chunk, mas é o maior peso desta aba.
🟡 `InvestmentStorytelling`: auto-fetch IA ao expandir cenário — corretíssimo, mas não há skeleton consultivo (loading silencioso pode soar travado).

---

## 14. Fluxo consultivo natural

```
Diagnóstico → Simulador → ANÁLISE
                            ├─ Investimentos     ← "qual ângulo desta carta?"
                            ├─ Engenharia Patr.  ← "qual jornada de longo prazo?"
                            ├─ Bids
                            ├─ Estratégia Avançada
                            └─ Assemblies
                          → Proposta → Coaching
```

✅ Ordem correta na sidebar.
🟡 Falta sinal explícito em **Investimentos** dizendo "para visão de longo prazo, abra Engenharia Patrimonial". Existe atalho **inverso** (Patrimonial → Investimentos), não o ideal.

---

## 15. Diagnóstico final — score executivo

| Dimensão | Score (0–10) | Observação |
|---|---|---|
| Clareza de papéis | **8** | Fronteira clara, falta bridge consultivo |
| Scanning executivo | **9** | Decision Desk + Hero entregaram |
| Hierarquia visual | **8** | Refinamento de pesos pequeno |
| Carga cognitiva | **7** | 6 cards + Decision Desk + 3 abas é o limite |
| Sobreposição | **7** | 4 pontos de fricção menores |
| Microcopy | **7** | Repetições padronizáveis |
| Aderência CAIXA | **9** | Tom impecável |
| Premium feel | **9** | Mesa consultiva entregue |
| Performance | **8** | Recharts é o único peso |
| Responsabilidade | **10** | Disclaimers + sem promessa |

**Score consolidado: 8,2 / 10 — produto em estado "executivo premium", próximo do ponto de saturação onde mais features destruiriam valor.**

---

## 16. Plano de refinamento — 3 ondas curatoriais (não-features)

### 🎯 Onda C1 — **Bridge & vocabulário** (alto impacto, baixo esforço)

1. Adicionar **bridge card** discreto entre `KpiEducationCard` e os cenários (Investimentos), com 1 linha:
   *"Para projeção patrimonial 5/10/15 anos, abra **Engenharia Patrimonial**."*
2. Remover atalho redundante final do `PatrimonialModule` (`Abrir em Investimentos → Estratégia Avançada`) — Decision Desk já cobriu.
3. Centralizar disclaimer em constante `PATRIMONIAL_DISCLAIMER` + `PREMISSAS_CONSERVADORAS_LINE` (um arquivo `src/components/modules/investment/disclaimers.ts`).
4. Padronizar vocabulário: usar **"estratégia"** em ambos (não alternar com "cenário"/"arquétipo" no rodapé/tooltip).

### 🎯 Onda C2 — **Polish do Decision Desk** (médio impacto, baixo esforço)

5. Trocar `Trophy` por 6 ícones distintos no Resumo Executivo (Shield/TrendingUp/Banknote/Layers/Scale/Hourglass).
6. Destacar célula vencedora por linha na tabela longitudinal (`bg-primary/5` + `font-bold` no maior valor de cada métrica × ano).
7. Marcar **"Hoje (Y0)"** como primeira coluna implícita na timeline do `PatrimonialStrategyCard` (apenas label).
8. Tooltip rápido nos KPIs do `PatrimonialKpiBar` (reuso do conteúdo do `KpiEducationCard`).

### 🎯 Onda C3 — **Curadoria de densidade** (alto impacto, médio esforço)

9. Tornar `KpiEducationCard` **dismissable persistente** (localStorage) — uma vez aprendido, não volta.
10. Avaliar se `ScenarioComparisonChart` (372 linhas, recharts) merece ficar **default-collapsed** ou virar abertura "Ver gráfico comparativo".
11. Reduzir copy dos `PatrimonialStrategyCard`: hoje cada card carrega `forWho` + 3 bullets + 3 KPIs + timeline + disclaimer. Considerar mover `bullets` para tooltip "Como funciona" no canto.
12. Avaliar fundir aba **Estratégia Avançada** + **Compra à Vista** numa única aba "Comparativos" com sub-toggle (reduz de 3 para 2 abas).

---

## 17. O que **NÃO** fazer

- ❌ Adicionar nova aba, novo módulo, novo KPI, novo arquétipo.
- ❌ Adicionar charts adicionais.
- ❌ Adicionar IA generativa em mais superfícies.
- ❌ Reescrever Decision Desk (acabou de ser entregue e está sólido).
- ❌ Fundir Investimentos e Patrimonial — fronteira é o ativo.

---

## 18. Validação obrigatória — checklist

| Critério | Status atual | Pós-C1+C2 (projetado) |
|---|---|---|
| Clareza global | 🟢 | 🟢🟢 |
| Scanning executivo | 🟢🟢 | 🟢🟢 |
| Diferenciação entre módulos | 🟡 | 🟢 (com bridge) |
| Carga cognitiva | 🟡 | 🟢 (com C3.9 + C3.11) |
| Hierarquia premium | 🟢 | 🟢🟢 |
| Aderência CAIXA | 🟢🟢 | 🟢🟢 |
| Menos ruído | 🟡 | 🟢 |
| Mais sofisticação | 🟢 | 🟢🟢 |
| Sensação premium | 🟢🟢 | 🟢🟢 |
| Especializado vs. inchado | 🟢 | 🟢 (mantém com curadoria) |

---

## 19. Conclusão executiva

O ecossistema **Investimentos + Engenharia Patrimonial** alcançou o estado **"executivo premium consultivo"** com a sequência de ondas (KPI Layer → Cards Simplification → Patrimonial Timeline → Decision Desk).

**O produto está pronto para parar de adicionar.**

Os próximos ganhos virão de **curadoria** (remover, consolidar, refinar) — não de novas funcionalidades. Onda C1 entrega 80% do refinamento percebido com baixo risco e zero motor financeiro tocado.

**Próximo passo recomendado:** executar **Onda C1** integralmente (bridge + remoção do atalho redundante + centralização de disclaimers + padronização de vocabulário) e medir percepção do consultor antes de partir para C2/C3.
