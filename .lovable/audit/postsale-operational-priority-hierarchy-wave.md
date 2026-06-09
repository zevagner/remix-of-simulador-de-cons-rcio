# PostSale Operational Priority Hierarchy Wave

## Diagnóstico perceptivo

Cada row de cliente carregava **5 chips concorrentes** no header, todos com peso visual semelhante:

1. `priority` (🔴/🟡/🟢 Alta/Média/Baixa) — sempre presente, mesmo em "Baixa" (ruído).
2. `temperature` (quente/morno/frio + `· score`).
3. `consortium type`.
4. `risk` (`label • reason` em chip colorido).
5. Legacy `Alta prioridade` (laranja, duplicava o chip de prioridade).

Resultado: o gerente tinha de **ler todos os badges** para reconstruir o estado operacional, e a row já carregava encoding triplo de risco (border tint + dot + chip).

## Execução

Arquivo: `src/components/modules/PostSaleModule.tsx` (single-file UI-only, zero alteração de lógica/hooks/scoring).

### 1. Barra lateral perceptiva de prioridade
Acento vertical 3 px à esquerda da row:
- `alta` → `bg-destructive`
- `media` → `bg-amber-500/70`
- `baixa` → **silencioso** (sem barra)

→ Reconhecimento periférico instantâneo de urgência operacional, sem adicionar chip.

### 2. Hierarchy do header (priorização semântica)
Ordem nova de scanning:
`dot risco → emoji status → nome → 🌡 temperatura → 🔴 prioridade (se ≠ baixa) → risco (texto discreto)`

- **Temperatura** virou o chip primário (quente/morno/frio) — removido `· score` inline (vai pro tooltip).
- **Prioridade** só renderiza em `alta`/`media` — "baixa" é o estado default silencioso.
- **Risco** rebaixado de `Badge` colorido para `<span>` `text-[10px] text-muted-foreground` (a borda + dot já encodam a cor); o `risk.reason` migrou para tooltip.
- **Tipo de consórcio** desceu para a metadata line (junto a crédito/prazo/grupo) — não compete com prioridade.
- **Removido** o badge legado laranja "Alta prioridade" (duplicava `PRIORITY_BADGE.alta`).

### 3. Metadata line
Substituído `gap-3` por `gap-2`, padronizando o ritmo de bullets (`tipo • R$ • Xm • Grupo N`).

## O que foi preservado

- Lógica de `computeClientPriority`, `getClientRisk`, `scorePostSaleClient`, `suggestPostSaleAction`.
- `PRIORITY_BADGE`, `TEMPERATURE_BADGE`, `RISK_STYLES` (tokens intactos).
- Chips consolidados de oportunidade/relacionamento/timing (linha única da Wave Density).
- `NextActionStrip`, banner de oportunidade, alerta pré-assembleia, `PostSaleQuickActions`, sugestão IA.
- Todos os tooltips (priority reasons, temperatura, risco) — informação acessível sob demanda.

## Impacto perceptivo esperado

| Métrica | Antes | Depois |
|---|---|---|
| Chips no header (default) | 5 | 1 (temperatura) |
| Chips no header (urgente) | 5 | 2 (temperatura + prioridade) |
| Encoding de risco | tint+dot+chip colorido | tint+dot+texto muted |
| Encoding de urgência | chip único | barra lateral + chip (quando alta/média) |
| Carga de leitura obrigatória | alta | baixa (peripheral scanning) |

## Validação

- Logic untouched: scoring, hooks, providers, Supabase, runtime.
- Visual: menos competição, mais hierarquia; barra lateral é o único elemento "novo" e ela só aparece quando há prioridade real.
- Premium: nada de heatmap — o estado default (cliente baixa prioridade) é mais limpo do que antes.

## Próximas medium changes sugeridas

- **MC-H1**: aplicar a mesma barra lateral de prioridade nos cards da Carteira (`ProposalCard`).
- **MC-H2**: substituir `STATUS_EMOJI` por ícone Lucide tonalizado para padronizar com o resto do design system.
- **MC-H3**: agrupar `consortium type` + `credit value` + `term` em um `<KpiStrip>` reutilizável.
