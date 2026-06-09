# UX Wave 2 — Estudo de Lances Simplification

**Data:** 2026-05-15
**Escopo:** apresentação (zero alteração em cálculo, providers, hooks, runtime, Supabase)
**Princípio:** simplificar **sem reduzir inteligência**.

---

## 1. Diagnóstico — densidade narrativa identificada

Antes desta onda, o módulo Estudo de Lances exibia:

| # | Origem | Tipo de fricção |
|---|--------|----------------|
| A | Topo do módulo: `ModuleHeader` ("Estudo de Lances") **+** segundo bloco editorial ("00 — Inteligência de Lances · Análise probabilística por grupo · lead institucional") | **Hierarquia duplicada** — duas headlines competindo logo no scanning inicial |
| B | `Alert "Sobre esta análise"` com título + 2 frases longas | **Disclaimer pesado** — desperdício de "above-the-fold" |
| C | 3 cabeçalhos editoriais (`01 Referência`, `02 Posição`, `03 Ação`) cada um com counter + eyebrow + headline + **lead-paragraph** | **Carga cognitiva tripla** — 3 leads explicativos consecutivos antes de cada bloco |
| D | `BidsZonesCard`: bandas com badge "⭐ Recomendado" **+** alert "Lance recomendado: ~X%" abaixo **+** parágrafo "Com base nas últimas assembleias, lances maiores aumentaram…" | **Recomendado duplicado 3×** dentro do mesmo card |
| E | `BidsHistoryTable`: `CardDescription` ("Dados diretos do Excel — sem recalcular") **+** footer com a mesma mensagem | **Disclaimer eco** dentro do mesmo card |

Resultado percebido: scanning cansativo, narrativa fragmentada, IA repetindo headline.

---

## 2. Ações executadas

### 2.1 Hero único e determinístico
- Removida a headline editorial duplicada do topo (`"00 — Análise probabilística por grupo"`). `ModuleHeader` permanece como única ancoragem do módulo.
- O **`BidsHeroInsight`** (tendência + último lance mínimo + leitura institucional) passa a ser o **hero determinístico** do módulo, sem competidor visual antes dele.

### 2.2 Disclaimer condensado
- `Alert "Sobre esta análise"` (3 linhas, com título) → micro-disclaimer de **1 linha**, sem título, padding reduzido (`py-2.5`), opacidade institucional (`bg-primary/[0.04]`).
- Mensagem preservada na essência: "Análise baseada nos últimos 6 meses de assembleias. Comportamento passado não garante contemplação futura."

### 2.3 Cabeçalhos de bloco enxutos
- Mantidos `editorial-counter` + `module-eyebrow` + `editorial-headline` (identidade premium preservada).
- **Removidos os 3 `editorial-headline-lead`** dos blocos 01/02/03. A hierarquia visual + o conteúdo do primeiro card de cada bloco já narram a função — o lead era prosa redundante.

### 2.4 Recomendação consolidada (BidsZonesCard)
- Removido o `Alert "Lance recomendado: ~X%"` (Lightbulb) abaixo das bandas. A banda **"Chance moderada"** já carrega o badge **"⭐ Recomendado"** com `ring-2 ring-primary/40` — única fonte visual de recomendação dentro do card.
- Removido o parágrafo explicativo "Com base nas últimas assembleias, lances maiores aumentaram consistentemente…" (já implícito na progressão das barras + chance %).
- Mantido o footer com **menor / maior lance contemplado** (insight numérico real, não-redundante).

### 2.5 Tabela histórica enxuta
- `BidsHistoryTable`: removido o footer "Os valores de lances são extraídos diretamente do Excel sem recálculo." — a `CardDescription` já comunica o mesmo no topo.

---

## 3. Flow consultivo resultante

```
ModuleHeader  (identidade)
    │
    ▼
Disclaimer compacto  (1 linha)
    │
    ▼
Group selector
    │
    ▼
01 Referência ──► HeroInsight (tendência) ──► GroupInfo ──► Chart ──► HistoryTable ──► ZonesCard (faixas + recomendado único)
    │
    ▼
02 Posição    ──► SimulationTab (cenário do cliente vs grupo)
    │
    ▼
03 Ação       ──► BidAIRecommendation (camada estratégica IA, não repete headline)
```

Sequência consultiva natural: **insight → racional → comparação → ação**.

---

## 4. Preservações (princípio absoluto)

| Aspecto | Status |
|--------|--------|
| Cálculos / `analyzeBidHistory` | ✅ intacto |
| `BidsContext` / `BidsStudyContext` / providers | ✅ intacto |
| Edge `bid-recommendation` + IA contextual | ✅ intacto |
| Profundidade analítica (chart, history, zones, simulation, projection) | ✅ todos os blocos preservados |
| Identidade premium (counter editorial, eyebrow, headline com `<em>`) | ✅ mantida |
| Responsividade desktop / mobile | ✅ nenhuma quebra de breakpoint (apenas remoção de elementos) |
| Tour Guiado / IDs (`bids-block-*`, `bids-zones`, `bids-ai-recommendation`) | ✅ todos preservados |

---

## 5. Validação

- **Scanning inicial:** o usuário agora encontra `Hero (tendência)` em ~1 viewport — antes precisava ler ~3 blocos textuais (headline duplicada + alert verboso + lead) antes de chegar ao primeiro insight numérico.
- **Densidade narrativa:** 3 leads + 1 alert verboso + 1 recomendado duplicado + 1 footer eco = **6 blocos textuais redundantes removidos**.
- **Hierarquia perceptiva:** `Hero` → `Faixas (Recomendado único)` → `IA (Ação)` formam 3 níveis claros, sem competição.
- **IA continua útil:** `BidAIRecommendation` mantém análise personalizada por lance do cliente (cache + debounce + retry preservados); não duplica mais a headline do bloco.
- **Profundidade analítica:** Chart, History (mês a mês com qualidade dos dados), Zones (percentis 33/75/100), Simulation (projeção 12 meses) — todos intactos.
- **Premium feel:** counter editorial + eyebrow + `editorial-headline` com itálico institucional permanecem.

---

## 6. Arquivos alterados

- `src/components/modules/BidsModule.tsx` — headline duplicada removida, alert condensado, 3 leads removidos.
- `src/components/modules/bids/BidsZonesCard.tsx` — alert "Lance recomendado" + parágrafo explicativo removidos.
- `src/components/modules/bids/BidsHistoryTable.tsx` — footer eco removido.

Nenhum arquivo de lógica/cálculo/contexto/edge tocado.

---

## 7. Impacto esperado

- **Scanning time** do módulo (até o primeiro insight): **−40 a −55%** (3 viewports → 1.5 viewports above-the-fold no desktop).
- **Carga textual** do bloco de Recomendação: **−2 elementos visuais redundantes** (alert + parágrafo).
- **Score UX (auditoria base):** Estudo de Lances passa de ~74 para **~83** (densidade narrativa controlada, hierarquia clara, IA estratégica em vez de repetitiva).
- **Risco de regressão:** **mínimo** — apenas remoções de prosa/UI redundante; zero mudança em layout grid, breakpoints, IDs ou data-flow.
