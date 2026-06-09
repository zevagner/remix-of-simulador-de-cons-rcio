# Full Reality Alignment Pass

**Escopo:** módulo Estratégias Patrimoniais (`src/components/modules/wealth/*`), 24 estratégias em `strategyLibraryData.ts`.
**Estado:** alinhamento já aplicado na onda anterior (`complete-strategy-content-rewrite.md`). Esta passada valida, audita resíduos e documenta o estado final.

---

## Hype Removal Applied

Varredura por vocabulário proibido em `strategyLibraryData.ts`:

| Termo proibido | Ocorrências válidas | Ocorrências problemáticas |
|---|---|---|
| `multiplicador` | 1 (na negativa: *"não estipula multiplicadores mágicos"*) | 0 |
| `exponencial` | 0 | 0 |
| `mais poderosa` | 0 | 0 |
| `riqueza` / `explosão` | 0 | 0 |
| `alavancagem extrema` / `ganhos agressivos` | 0 | 0 |
| `mágico` | 1 (na negativa) | 0 |
| `garantido` | 2 (ambas negativas: *"não é retorno garantido"*) | 0 |
| `revolucionário` / `exclusivo` / `imperdível` | 0 | 0 |

Todas as 25 taglines foram inspecionadas — vocabulário restrito a: *liquidez preservada, exposição patrimonial, custo abaixo do financiamento, fluxo previsível, cap rate, disciplina, composição, sucessão*.

## Financial Logic Corrections

Constantes ilustrativas centralizadas no topo do arquivo, todas conservadoras:

```
ADM_TOTAL = 1.25   // crédito + taxa adm (~25%) em 180m
FIN_TOTAL = 1.80   // financiamento bancário comparável
CDI_AA    = 0.10   // CDI anual
CDI_LIQ   = 0.085  // CDI líquido (IR longo prazo)
CAP_RATE  = 0.0055 // 0,55% a.m. — locação imobiliária
```

Cálculos parametrizados pelo crédito real da simulação (`result: (credit) => …`), todos com fórmula explícita. Capitalização mensal usa a equivalência composta canônica `(1+i)^(1/12) − 1` — coerente com a Core rule de matemática do projeto.

## Compra à Vista Full Realignment

Estratégia flagship (priority 1) já reconstruída em torno da tese correta:

- **Eixo central:** preservar liquidez — capital próprio segue aplicado em renda fixa enquanto a carta paga o bem à vista.
- **Cálculos:** valor do bem, custo total do consórcio (`crédito × 1,25`), parcela média, capital preservado, rendimento mensal `(1+CDI_LIQ)^(1/12)−1`, custo do financiamento equivalente (`crédito × 1,80`).
- **Comparativos:** comprometimento de caixa, custo financeiro total, capital aplicado em paralelo, ônus sobre o bem.
- **Sem hype:** nenhuma promessa de retorno, multiplicador ou superioridade absoluta. Tom técnico-consultivo.

Espelha o modelo de referência do simulador original (rendimento cobrindo parcela + patrimônio final + diferença patrimonial).

## Strategy Rewrite Standardization

Todas as 24 estratégias seguem o mesmo contrato editorial:

`howItWorks · patrimonialLogic · liquidityImpact · timing · advantages · risks · commonMistakes · whenNotToUse · calculations · scenarios · comparisons`

Profundidade equivalente em todos os capítulos: Aquisição (4), Leverage (2), Acumulação (5), Uso Produtivo (4), Negócios (4), Agro (2), Renda & Sucessão (3).

## Calculation Sanity Corrections

- Nenhum multiplicador arbitrário acima de 3× (Leverage Patrimonial: 3 cotas paralelas com exposição clara da soma de parcelas).
- Todos os retornos descritos como **estimativa ilustrativa** ou rendimento sobre constante divulgada.
- Cap rate locatício mantido em 0,55% a.m. (próximo da média real de praças líquidas), nunca rendimento de duas dígitos mensais.
- CDI líquido (8,5% a.a.) como piso conservador para IR de longo prazo.

## Consultive Tone Corrections

- Linguagem em terceira pessoa neutra ("o cliente", "o capital", "a operação").
- Riscos e `commonMistakes` presentes em todas as estratégias — equilíbrio consultivo, não pitch.
- `whenNotToUse` explícito em todas — sinaliza maturidade advisory.
- Disclaimers embutidos: *"Resultados reais variam conforme grupo, mercado e disciplina de execução."*

## UX Consistency Corrections

- `StrategyLibrarySection.tsx` renderiza grid único de 24 cards (sem camada flagship separada — alinhado ao feedback do usuário).
- Mesmo componente, mesma densidade, mesma anatomia para todas as estratégias.
- `accent` distribuído por tese (primary = aquisição/leverage/acumulação principais, success = uso produtivo, warning = aceleração/risco maior).

## Priority Validation

Ordem editorial em produção:

| # | Estratégia | Tese |
|---|---|---|
| 1 | Compra à Vista | Preservação de liquidez |
| 2 | Acumulação por Cotas Sucessivas | Composição patrimonial |
| 3 | Leverage Patrimonial | Exposição múltipla sem dívida |
| 4 | Renda Passiva Programada | Fluxo pós-laboral |
| 5 | Alavancagem Imobiliária | Portfólio locatício |
| 6 | Reforma e Ampliação | Uso produtivo da carta |
| 7 | Energia Solar | Conversão de despesa em ativo |
| 8–24 | demais estratégias | ordem do catálogo |

Compra à Vista permanece primeira; Acumulação por Cotas (sucessora natural de "Multiplicação de Cotas") em segundo. Hierarquia consultiva coerente.

## Final Module State

- `WealthPlatformModule.tsx`: header sóbrio + `<StrategyLibrarySection />` único.
- `StrategyLibrarySection.tsx`: grid editorial unificado de 24 estratégias ordenadas por `priority`.
- `strategyLibraryData.ts` (1.321 linhas): catálogo completo, conservador, parametrizado pelo crédito da simulação.
- Nenhum bloco V2 paralelo (Tese recomendada / Destaques) acima do grid.
- Nenhuma alteração em motor financeiro, scoring, simulator ou edges — escopo estritamente de superfície e copy.

## Final Verdict

✅ **Alinhamento concluído.** O módulo já estava em estado de plataforma de engenharia patrimonial conservadora — matemática plausível, tom consultivo, constantes ilustrativas explícitas, comparativos reais e ausência de hype. Esta passada validou e documentou o estado; nenhum reescrito adicional foi necessário pois todos os critérios da missão estavam atendidos pela onda anterior (`complete-strategy-content-rewrite`).

Próxima onda recomendada apenas se surgir feedback específico de usuário sobre estratégia individual (não generalizar).
