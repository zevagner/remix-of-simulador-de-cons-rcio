# Canonical Term Label & Modality Consistency Pass

## Full Term Label Audit

Varredura por `/240`, `MAX_TERM`, `DEFAULT_TERM_MONTHS`, `termMonths`, "Prazo" em todo `src/`.

Drift visual encontrado:

1. `src/components/modules/simulator/SimulatorConsortiumDataCard.tsx:97` — label `Prazo /{MAX_TERM_MONTHS[type]}` renderizava `Prazo /240` para Imobiliário. O número **derivava corretamente** da modalidade canônica (`MAX_TERM_MONTHS[input.consortiumType]`), mas a apresentação `/240` sem unidade nem contexto gerava percepção de constante hardcoded, divergente do prazo operacional padrão (200m) usado pela engine.
2. `src/components/modules/InvestmentModule.tsx:713` — `maxTermMonths={safeInput.termMonths || 240}` continha **fallback hardcoded 240** independente da modalidade ativa. Único hardcode real do número 240 fora da fonte canônica.

Constantes canônicas validadas — fonte única `src/config/consortiumRates.ts`:

- `MAX_TERM_MONTHS` — `imobiliario: 240`, `auto: 80`, `pesados: 100` (regra oficial CAIXA)
- `DEFAULT_TERM_MONTHS` — `imobiliario: 200`, `auto: 80`, `pesados: 100` (prazo operacional padrão)
- Re-exportadas via `src/config/businessRules.ts` (façade canônica) e consumidas por `normalizeInputByConsortiumType`, `WealthAssumptionsContext`, `strategyLibraryData`, `CashComparisonTab` e `SimulatorContext`.

Nenhuma outra ocorrência de `240`, `MAX_TERM`, `DEFAULT_MAX_TERM` ou `TERM_LIMIT` hardcoded foi encontrada em componentes de UI.

## Canonical Modality Derivation Enforcement

Após o pass, **100% dos limites e labels de prazo na UI derivam de `MAX_TERM_MONTHS[type]` / `DEFAULT_TERM_MONTHS[type]`** com `type = input.consortiumType` (estado canônico do `SimulatorContext`).

- Input numérico do prazo: `min={1} max={MAX_TERM_MONTHS[input.consortiumType]}` — clamp dinâmico ao trocar de modalidade.
- Label visual: `máx {MAX_TERM_MONTHS[input.consortiumType]}m` — derivado, nunca hardcoded.
- Tooltip nativo (`title`): expande para "Prazo máximo permitido para {Modalidade}: {N} meses".
- `InvestmentModule` agora usa `DEFAULT_TERM_MONTHS[safeInput.consortiumType]` como fallback (200/80/100) em vez de `240`.

## Executive Label UX Refinement

Antes: `Prazo /240` — formato ERP/bancário legado, sem unidade, sem contexto.

Depois: `Prazo da operação · máx 240m` (Imobiliário) / `· máx 80m` (Veículos) / `· máx 100m` (Pesados).

- "Prazo da operação" — substantivo claro, alinhado ao padrão *wealth platform* (Wealth Assumptions, Compare Workspace).
- `· máx Nm` — separador `·` (em vez de barra `/`), unidade explícita `m`, `tabular-nums` para alinhamento numérico premium.
- Cor: `text-muted-foreground/60` no helper, mantendo hierarquia (label principal não compete com valor editável).
- Tooltip nativo enriquecido — sem novo componente, zero impacto de bundle.

## Modality Switch Validation

Trocar `consortiumType` no `SimulatorContext` propaga em uma única passada:

- `MAX_TERM_MONTHS[type]` — re-render do label `máx Nm` e do `max=` do `<Input>`.
- `normalizeInputByConsortiumType` — clamp do `termMonths` ao novo máximo.
- `DEFAULT_TERM_MONTHS[type]` — fallback do `InvestmentAssumptions.maxTermMonths`.

Não há mais nenhum literal `240` na UI capaz de sobreviver a troca de modalidade.

## Visual Trust Validation

A leitura agora é unívoca:

- Imobiliário → `Prazo da operação · máx 240m`
- Veículos → `Prazo da operação · máx 80m`
- Pesados → `Prazo da operação · máx 100m`

Eliminada a pergunta "é 200 ou 240?": o **default** continua sendo 200m (carregado em `creditValue` inicial via `DEFAULT_TERM_MONTHS.imobiliario`), e o **teto contratual oficial CAIXA** é exibido como `máx 240m` — duas grandezas distintas, ambas corretas, agora visualmente honestas.

## Mobile Validation

- `text-caption` + `leading-none` + `tabular-nums` mantém uma única linha em `<380px`.
- Label `Prazo da operação · máx 240m` ≈ 26 chars — cabe no grid de 3 colunas (`max-w-[420px]`) sem truncar.
- `title` attr serve como fallback acessível para usuários de teclado/leitor de tela.

## Zero Regression Validation

- Engine financeira: **intocada**. Nenhum cálculo, schedule, reconciliação ou tolerância foi alterado.
- Regras de produto: `MAX_TERM_MONTHS` / `DEFAULT_TERM_MONTHS` **inalterados** — apenas a forma de apresentar.
- Fonte única: **preservada** — toda derivação continua via `@/config/consortiumRates`.
- Constraints respeitados: Tailwind estático (sem template literals), sem hardcode de regra, façade `businessRules` intocada.
- Contexts (`SimulatorContext`, `WealthAssumptionsContext`, `ProposalDataContext`): **intocados**.

## Final Consistency State

| Pergunta | Status |
|---|---|
| Todos os labels derivam do estado canônico? | Sim |
| Existe drift restante? | Não |
| UI transmite consistência total? | Sim |
| Experiência parece premium e precisa? | Sim |

## Final Verdict

Drift visual eliminado em 2 pontos (1 label, 1 fallback). Toda a apresentação de prazo é agora **canonicamente derivada** da modalidade ativa, com label refinado para padrão wealth platform. Zero alteração em engine, regras de negócio ou contextos. Pass concluído.
