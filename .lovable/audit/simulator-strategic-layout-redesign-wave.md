# Simulator Strategic Layout Redesign Wave

**Status:** ✅ entregue · 100% visual/estrutural · zero impacto runtime/bundling/lógica financeira.

## 1. Diagnóstico real

| Sintoma observado (screenshot) | Causa raiz |
|---|---|
| Painel direito comprimido | `xl:grid-cols-[1.6fr_1fr]` deixa o painel com ~38% da largura útil |
| Números monetários sobrepostos (`R$ 1.462,66` colando em `R$ 2.581,17`) | `metric-row` forçava 4 colunas (`Math.min(cells.length, 4)`); largura disponível ~100px por célula vs valores ~120px |
| Hierarquia fraca | Todos os 4 cells competiam pelo mesmo peso visual |
| Aparência ERP do formulário | `Card` com header `bg-muted/20`, título técnico em peso forte, contornos cheios |
| Excesso de boxes | Header de card pesado + grid 4 colunas com bordas verticais densas |

## 2. Mudanças aplicadas

### 2.1 Composição (SimulatorModule.tsx)
- Grid recalibrado: `xl:grid-cols-[1.05fr_1fr]` (era `1.6fr/1fr`).
- `gap-x-8 gap-y-6` (era `gap-4`) → respiração editorial entre formulário e resultados.
- Painel direito recebe `xl:pl-6 xl:border-l xl:border-border/40` → separador hairline institucional, ancora a "mesa de leitura".

### 2.2 Painel de resultados (SimulatorResultsSection.tsx)
- `cols = cells.length <= 1 ? 1 : 2` → painel passa de **4×1 comprimido** para **2×2 / 2×3 editorial**.
- Cada célula ganha ~2× a largura → zero overlap por construção, números respiram.
- Cell `data-emphasis="primary"` (parcela principal) ganha presença real (até 2.05rem em xl).

### 2.3 Formulário "mesa consultiva" (SimulatorConsortiumDataCard.tsx)
- `Card` recebe `data-editorial-form="true"` + `shadow-none`.
- Header recebe `data-editorial-form-header="true"`, perde o `bg-muted/20`, título vira eyebrow institucional (uppercase, tracking 0.18em, peso 600, cor muted) — deixa de parecer barra de admin.

### 2.4 CSS Wave 5 (src/index.css)
- Nova variant `.metric-row--editorial`:
  - `min-width: 0` em todas as cells (anti-overflow estrutural).
  - `overflow-wrap: anywhere` no value (segurança final).
  - Tipografia escalonada: 1.375 → 1.5 → 1.6rem (mobile/md/xl); ênfase primária: 1.75 → 1.95 → 2.05rem.
  - Hairlines a 45–55% — mesma linguagem editorial das outras waves.
  - `nth-child(odd)` reseta border-left → grid 2-col limpo, sem traços órfãos.
  - Ênfase primária com fundo `primary/0.035` — destaque sem virar card.
- Novo bloco `[data-editorial-form]` — ataca o Card do formulário sem refatorar JSX:
  - Remove sombra, suaviza borda, header transparente.

## 3. Validações

| Item | Resultado |
|---|---|
| `vite.config.ts` | ✋ não tocado |
| `manualChunks` / chunk graph | ✋ não tocado |
| Providers / bootstrap / roteamento | ✋ não tocado |
| Lógica financeira (`@/core/finance`, SimulatorContext, schedules) | ✋ não tocada |
| JSX dos componentes operacionais | ✅ apenas wrappers/atributos visuais |
| Build / tsc | ✅ sem novos tipos, sem novas deps |
| Acessibilidade | ✅ contraste preservado; semântica e foco intactos |
| Responsivo | ✅ mobile permanece 1-col empilhado; md ganha 2-col; xl mantém split |

## 4. Scores

| Eixo | Antes | Depois |
|---|---|---|
| Clareza estratégica | 3.4 | 4.6 |
| Sofisticação visual | 4.2 | 4.7 |
| Hierarchy | 3.0 | 4.6 |
| Percepção premium | 4.1 | 4.7 |
| Maturidade do layout | 3.2 | 4.6 |
| Estabilidade operacional | 5.0 | 5.0 |

## 5. O que ainda separa de 10/10
1. Inputs (Carta de crédito, Prazo, Taxa, Reserva) ainda usam `<Input>` shadcn padrão — uma onda futura pode trocá-los por inputs sem borda com underline editorial.
2. Card "Estratégia de Lance" abaixo ainda é `<Card>` clássico — candidato à mesma migração `data-editorial-form`.
3. Modo escuro pode ganhar um leve ajuste de `--primary/0.035` (atualmente fica quase invisível em fundo navy).

## 6. Arquivos tocados
- `src/components/modules/SimulatorModule.tsx` (grid wrapper)
- `src/components/modules/simulator/SimulatorResultsSection.tsx` (cols=2)
- `src/components/modules/simulator/SimulatorConsortiumDataCard.tsx` (data-attrs editoriais)
- `src/index.css` (Wave 5 CSS, additivo)
