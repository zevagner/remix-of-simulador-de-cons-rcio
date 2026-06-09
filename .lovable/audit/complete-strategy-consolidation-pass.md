# Complete Strategy Consolidation Pass

Consolidação direta — sem novos módulos, sem novas arquiteturas. Correção visual,
estrutural, de prioridade, conteúdo e consistência aplicada **agora** sobre a
Biblioteca Patrimonial Completa (24 estratégias) já existente em
`WealthPlatformModule → StrategyLibrarySection`.

## Consolidation Changes Applied

| Área | Estado anterior | Estado consolidado |
|---|---|---|
| CTA dos cards | "Abrir playbook completo" / "Fechar playbook" | **"Abrir Estratégia Completa" / "Fechar Estratégia Completa"** (único, em 100% dos 24 cards) |
| Comportamento de expansão | Já era único (accordion in-card) | Mantido — sem toggles paralelos, sem modal, sem rota nova |
| Ordem de exibição | Apenas por capítulo (alfabético interno) | **Destaques Estratégicos no topo (top 7) + capítulos abaixo (sem duplicação)** |
| Compra à Vista | `accent: muted`, icon Banknote, narrativa de descapitalização | **`accent: primary` + icon Gem + narrativa flagship completa** |
| Hierarchy | Flagships enterradas | **Compra à Vista #1 da plataforma** |
| Typography / spacing / disclosure | Já uniforme | Mantido (componente único `StrategyLibraryCard`) |

## Unified Card System

- Componente único `StrategyLibraryCard` renderiza **TODOS** os 24 cards (flagships + capítulos) com:
  - Mesmo header (icon chip + chapter eyebrow + title + tagline)
  - Mesmo CTA: **"Abrir Estratégia Completa"**
  - Mesmo accordion in-card (5 blocks: How it works, Vantagens/Riscos, Cálculos, Cenários, Comparativos)
  - Mesmo spacing (`p-4 md:p-5`, `gap-4`, `rounded-2xl`)
  - Mesma typography (`text-[15px] md:text-base` title, `text-[12.5px]` tagline, `text-[13px]` body)
- Zero toggles conflitantes, zero CTAs divergentes, zero variantes paralelas.

## Strategy Priority Reordering

Adicionado campo opcional `priority?: number` em `LibraryStrategy`. Os 7 flagships
exibidos em destaque **antes** dos capítulos, na ordem exigida:

1. **Compra à Vista** — flagship absoluta
2. **Multiplicação de Cotas**
3. **Leverage Patrimonial**
4. **Renda Passiva**
5. **Alavancagem Imobiliária**
6. **Reforma e Ampliação**
7. **Energia Solar**

Implementação: `STRATEGY_LIBRARY_FLAGSHIPS` (sorted asc) + `STRATEGY_LIBRARY_BY_CHAPTER`
agora **filtra** os flagships para evitar duplicação visual. As 17 estratégias
restantes seguem distribuídas em Aquisição / Leverage / Multiplicação / Uso /
Renda & Sucessão, na ordem original.

Seção de destaques renderizada com:
- Header editorial centralizado (`Sparkles` + eyebrow "Destaques estratégicos")
- Título: *"As 7 estratégias patrimoniais essenciais"*
- Divisores em gradient `via-primary/40` (mesma linguagem do "Em destaque" do hero)
- Mesmo grid responsivo `1col → 2col (md) → 3col (xl)`

## Compra à Vista Full Rewrite

Reescrita integral — agora reflete a **arbitragem patrimonial real** do consórcio
(não a descapitalização clássica). Posicionada como **flagship #1 absoluta**.

**Novos campos:**

- **Tagline:** "Use o consórcio para chegar à mesa de negociação com dinheiro vivo — desconto, poder de barganha e patrimônio preservado."
- **Icon:** `Gem` (era `Banknote`)
- **Accent:** `primary` (era `muted`)

**Como funciona** — explica contemplação via lance estruturado (1–18 meses), apresentação como comprador à vista, desconto de 8–15%, capital próprio preservado em paralelo.

**Por que é poderosa** — arbitragem juros bancários (~14% a.a.) ↔ taxa adm diluída (~1,3% a.a. equivalente) + captura de desconto à vista + multiplicador 3x–5x.

**6 vantagens estruturais:** desconto real 8–15%, zero juros bancários, carry positivo do capital preservado, posse desembaraçada (sem alienação), liberdade total de uso, poder de timing.

**Comparativo forte (6 dimensões):** custo financeiro total, desconto no ativo, capital próprio comprometido, liquidez preservada, alienação fiduciária, multiplicador patrimonial — todas com delta explícito vs financiamento e vs compra à vista clássica.

**5 cenários reais:** imóvel em lançamento, terreno estratégico, veículo zero km, equipamento produtivo PJ, expansão comercial — cada um com narrativa numérica concreta.

**7 cálculos ilustrativos:** crédito contemplado, desconto típico 10%, custo do consórcio 1,25×, custo do financiamento equivalente 1,80×, economia combinada (juros + desconto), carry do capital preservado, multiplicador real 3x–5x.

**Riscos / erros comuns / quando NÃO usar** — todos reescritos coerentes com a tese flagship (não com a tese antiga de descapitalização).

## UX Standardization

- **Comportamento de expansão:** único (toggle in-card, sem modal/rota/sheet) — já era e foi preservado.
- **Disclosure:** todos os cards mostram tagline + header sempre; profundidade abre via CTA único.
- **Telemetria / acessibilidade:** `aria-expanded`, `aria-controls`, `aria-hidden` mantidos.
- **Print:** sem regressão (componente respeita `print-hide` do hero/sticky-CTA).

## Visual Consolidation

- Headline atualizada: *"24 estratégias patrimoniais — cada uma uma engenharia completa"* (remove "mini-playbook" para alinhar à linguagem flagship).
- Gradient de divisores na seção Destaques alinhado ao gradient da seção "Tese recomendada" do `WealthPlatformModule` — coerência editorial.
- Accent `muted` removido da Compra à Vista — todos os flagships agora carregam accents fortes (`primary` / `success`).
- Nenhum recálculo financeiro introduzido (preservada a regra "consumer puro").

## Discoverability Corrections

- Compra à Vista agora é a **primeira estratégia visível** do módulo, dentro da seção de destaques (topo absoluto após o hero + tese recomendada).
- Os 7 flagships ficam acima da dobra em desktop (2col xl: linhas 1–4 visíveis sem rolar muito).
- Capítulos abaixo permanecem como camada de profundidade — quem rola explora as 17 estratégias complementares por intento patrimonial.
- Zero duplicação: flagships não aparecem dentro dos capítulos depois de mostrados no topo.

## Final Module State

```
Estratégias Patrimoniais
├── Hero editorial (intacto)
├── Chips de capítulos (intactos)
├── Tese recomendada (intacto)
├── ▼ Biblioteca Patrimonial Completa
│   ├── ✦ Destaques Estratégicos (NOVO — 7 flagships ordenados)
│   │   1. Compra à Vista (flagship absoluta — REWRITE completo)
│   │   2. Multiplicação de Cotas
│   │   3. Leverage Patrimonial
│   │   4. Renda Passiva
│   │   5. Alavancagem Imobiliária
│   │   6. Reforma e Ampliação
│   │   7. Energia Solar
│   ├── Capítulo Aquisição (3 — sem Compra à Vista)
│   ├── Capítulo Leverage (1 — sem Leverage Patrimonial e Alav. Imob.)
│   ├── Capítulo Multiplicação (4 — sem Multiplicação de Cotas)
│   ├── Capítulo Uso (7 — sem Reforma/Energia Solar)
│   └── Capítulo Renda & Sucessão (3 — sem Renda Passiva)
└── Compare bar + Sheet (intactos)
```

24 estratégias total, todas visíveis na surface, **uma única gramática visual**.

## Final Verdict

✅ **Card system unificado** — 1 componente, 1 CTA, 1 comportamento.
✅ **Prioridade real** — Compra à Vista é a flagship #1 da plataforma.
✅ **Compra à Vista reescrita** — narrativa flagship premium, leverage perceptível, comparativo forte, cenários reais, cálculos completos.
✅ **Zero conflito visual** — sem toggles paralelos, sem CTAs divergentes, sem estilos competindo.
✅ **Zero inconsistência** — typography/spacing/hierarchy idênticos entre os 24 cards.
✅ **Discoverability corrigida** — flagships dominam o topo perceptivamente.
✅ **Sem novos módulos / rotas / arquiteturas** — consolidação cirúrgica sobre a estrutura existente.

A Biblioteca Patrimonial Completa agora se apresenta como **plataforma patrimonial premium madura, limpa e sofisticada** — sem profundidade escondida, sem prioridades erradas, sem estratégias enterradas.
