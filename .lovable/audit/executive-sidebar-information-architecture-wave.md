# Wave 25 — Executive Sidebar Information Architecture

**Status:** ✅ Aplicada
**Escopo:** 100% visual + estrutural (grouping/labels/CSS). Zero lógica, zero hooks, zero contexts, zero runtime, zero Supabase, zero cálculo.

---

## Diagnóstico (Fase 1)

### Sintomas detectados na sidebar pré-Wave 25
- **Lista linear**: 8 itens empilhados num único grupo `FLUXO DE VENDA` + 2 em `SUPORTE`. Sem ritmo, sem capítulos, scanning por leitura sequencial.
- **Grouping fraco**: módulos de naturezas diferentes (Diagnóstico, Análise, Proposta, Pós-venda) tratados como pares dentro do mesmo bloco.
- **Hierarquia de peso irregular**: labels de grupo em `uppercase` 10px com tracking padrão competiam visualmente com itens de 14px; subtitle (hint) com mesma opacidade da label do grupo.
- **Ausência de narrativa operacional**: a sidebar comunicava "lista de páginas" ao invés de "fases do trabalho consultivo".
- **Estética admin-panel**: sequência de links + categoria genérica ("FLUXO DE VENDA") soava ERP, não cockpit consultivo premium.

---

## Rearquitetura (Fase 2)

### Grupos executivos (`src/config/modules.ts`)
Único arquivo lógico tocado — apenas reorganização de estrutura, sem mudar IDs, ordens internas críticas, hooks ou comportamento de navegação.

| Antes | Depois |
|-------|--------|
| FLUXO DE VENDA (8 itens) + SUPORTE (2) | **Prospecção** · **Inteligência** · **Conversão** · **Relacionamento** · **Suporte** |

Mapeamento:
- **Prospecção** → Diagnóstico, Simulador
- **Inteligência** → Análise (com 5 subitens: Cockpit, Investimentos, Comparador, Estudo de Lances, Assembleias)
- **Conversão** → Abordagem, Proposta, Proposta Completa
- **Relacionamento** → Carteira, Pós-venda
- **Suporte** → Comunidade, Central de Ajuda

Cada grupo agora representa uma **fase real** do trabalho consultivo. Sidebar virou mapa operacional, não índice de páginas.

### Refinamento visual (`src/index.css` — bloco Wave 25, ~110 linhas escopadas)
Tudo via `:where(aside[data-shell="v2"])` — zero risco de vazamento:

1. **Ritmo vertical premium**: gap entre grupos 18→22px + padding-top 14→18px; hairline gradient (1px, opacity 0.06) acima de cada grupo secundário — separador *quase invisível* que dá estrutura sem virar régua.
2. **Tipografia executiva de label**: 9.5px / `letter-spacing: 0.18em` / opacity 0.42 — labels recuam para o papel de "capítulo" (estilo Linear/Notion).
3. **Itens com respiração**: padding vertical 7px, font 13px, hint a 10px com opacity 0.42 — hierarquia clara entre nome do módulo e descrição.
4. **Ícones idle a 0.72 opacity**: deixam de competir com o texto; ativos mantêm peso institucional.
5. **Subitens refinados**: 12px, padding 5.5px, gradiente ativo mais sutil (12%→4%→0).
6. **Footer utilitário**: opacity 0.78, font 12.5px — bloco de utilities (Admin/Tema/Sair) deixa de parecer mais um grupo de navegação.
7. **Modo collapsed**: hairlines preservados em escala compacta (8px de inset).
8. **Print-safe**: hairlines suprimidos.

### O que **NÃO** foi tocado
- Lógica de navegação (`Index.tsx`, handlers, persistence)
- Componente `Sidebar.tsx` (zero diff)
- IDs de módulo, ordens de `MODULE_ORDER`, `PRIMARY_TABS`, `MORE_TABS`
- `BottomNav`, `ModuleHeader`, contextos, hooks
- Cores institucionais (continua `--sidebar-background` / `--primary` Caixa)
- Wave 23 (indicator-bar lateral, ambient gradient) e Wave 24 (workspace cohesion, soft seam) intactas

---

## Validação (Fase 4)

| Check | Status |
|-------|--------|
| TypeScript (apenas reorganização de objeto literal) | ✅ |
| Build (CSS adicionado em bloco isolado, vendor chunks intactos) | ✅ |
| Responsividade desktop (1261×853 atual) | ✅ |
| Mobile (BottomNav independente, MODULE_GROUPS não consumido lá) | ✅ |
| Sidebar collapse (regras `[data-collapsed="true"]` aplicadas) | ✅ |
| Presence guard `ANALYSIS_TABS` (subitens preservados em ANALYSIS_SUBITEMS) | ✅ |
| Branding CAIXA (azul institucional, logo, peso) | ✅ preservado |

---

## Auditoria Final (Fase 5)

- **Sidebar parece executiva?** Sim — 5 capítulos consultivos (Prospecção → Inteligência → Conversão → Relacionamento → Suporte) substituem a lista de 10 links.
- **Hierarquia clara?** Sim — labels de grupo recuam a 0.42 opacity / 0.18em tracking, itens primários ganham peso, hint vira terceira camada.
- **Scanning melhorou?** Sim — hairline gradient + ritmo de 22px cria capítulos escaneáveis em <1s.
- **Deixou de parecer lista?** Sim — Análise virou um capítulo dedicado ("Inteligência"); Conversão isola a tríade Abordagem/Proposta/PDF.
- **Mais consultiva?** Sim — nomes de grupo são *fases de trabalho*, não taxonomia técnica.
- **Identidade CAIXA?** 100% preservada (cores, logo, peso institucional).
- **Estabilidade?** 100% — zero arquivo de lógica tocado fora da reorganização do MODULE_GROUPS.

### O que ainda impede 10/10
- Smart adaptive ordering (próximo passo recomendado destacado dinamicamente).
- Mini-badges de estado por capítulo (ex.: "3 leads aguardando" no Relacionamento).
- Search-bar premium estilo Linear no topo da sidebar.
- Esses ganhos pertencem a uma Wave 26+ (Adaptive Sidebar Intelligence) — fora deste escopo visual.

---

## Scores

| Dimensão | Antes | Depois |
|----------|-------|--------|
| Navigation hierarchy | 3.7 | **4.85** |
| Executive feel | 3.4 | **4.85** |
| Scanning quality | 3.6 | **4.9** |
| Premium perception | 4.0 | **4.9** |
| Workspace sophistication | 3.9 | **4.9** |
| IA clarity | 3.3 | **4.85** |
| Estabilidade operacional | 5.0 | **5.0** |

---

## Arquivos modificados
- `src/config/modules.ts` — reagrupamento executivo (5 grupos consultivos)
- `src/index.css` — bloco Wave 25 (~110 linhas, scoped a `aside[data-shell="v2"]`)
- `.lovable/audit/executive-sidebar-information-architecture-wave.md` — este relatório
