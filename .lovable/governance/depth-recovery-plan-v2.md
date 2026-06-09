# Depth Recovery Plan · V2

**Status:** APROVADO COMO PLANO · execução em ondas controladas
**Baseline:** V2 LOCKED FOR PRODUCTION — não pode ser quebrada
**Objetivo:** recuperar profundidade estratégica perdida na consolidação V2 **sem** reintroduzir caos V1
**Constituição governante:** `mem://governance/v2-product-constitution`

---

## Princípio Central

> Aumentar **profundidade** mantendo **simplicidade superficial**.
>
> O usuário deve sentir MAIS profundidade sem perceber MAIS complexidade.

Toda mudança desta plano passa pelos 5 reviews obrigatórios da Constituição V2 (perceptual, hierarchy, mobile, consultive, anti-regression) e respeita as 6 proibições (dashboardization, card explosion, feature layering, compare regression, hierarchy collapse, density creep).

---

## FASE 1 — Mapa Perceptivo (onde cada tese sumiu)

Inspeção dos catálogos canônicos (`strategy-v2/blueprint.ts` · `patrimonial/strategies.ts` · `wealth/intents.ts`) cruzada com as 9 estratégias V1 listadas pelo usuário.

| # | Estratégia V1 | Status perceptivo V2 | Onde está hoje | Visibilidade |
|---|---|---|---|---|
| 1 | **Compra à Vista** | 🔴 invisível | implícita em `sale` (revenda) e em `quick-contemplation`; nunca nomeada como "compra à vista" | nula |
| 2 | **Multiplicação de Cotas** | 🟡 técnica demais | `multiplicacao-ativos` (Estruturação) — narrativa correta, nome ok, mas vive sozinho | baixa |
| 3 | **Reforma e Ampliação** | 🔴 ausente | absorvida genericamente em `traditional` (Crescimento) | nula |
| 4 | **Energia Solar** | 🔴 ausente | sem representação no blueprint | nula |
| 5 | **Upgrade de Veículo** | 🟡 implícito | implícito em `traditional`/`quick-contemplation` para `auto` | baixa |
| 6 | **Renovação de Frota** | 🔴 ausente | sem representação para `pesados` | nula |
| 7 | **Expansão Produtiva** | 🔴 ausente | sem representação | nula |
| 8 | **Agronegócio** | 🔴 ausente | sem representação (havia módulo dedicado na V1) | nula |
| 9 | **Equipamentos Pesados** | 🟡 implícito | tipo `pesados` no Simulador, mas sem narrativa patrimonial | baixa |

**Diagnóstico:** a consolidação V2 acertou ao colapsar dashboards/módulos paralelos, mas eliminou as **aplicações concretas** (substantivos comerciais) que davam tangibilidade às teses (verbos consultivos). Sobraram teses sem ancoragem em casos de uso reais.

---

## FASE 2 — Critério de Recuperação

| Critério | Recupera explícito? |
|---|---|
| Tem gatilho comercial forte e diferenciador | ✅ |
| Já é tese implícita em outra estratégia, mas perdeu o nome | ✅ |
| Pode virar arquétipo contextual sem novo módulo | ✅ |
| Só fazia sentido como módulo isolado V1 | ❌ deixar implícita |
| Demanda nova fonte de cálculo | ❌ adiar — fora do escopo |

**Classificação final:**

- **Recuperar (5):** Compra à Vista · Multiplicação de Cotas · Reforma e Ampliação · Energia Solar · Renovação de Frota
- **Reforçar tom (2):** Upgrade de Veículo · Equipamentos Pesados (ganham arquétipo, não card)
- **Arquétipo contextual (2):** Expansão Produtiva · Agronegócio (subcasos de "patrimônio operacional")

---

## FASE 3 — Depth Recovery Layer (arquitetura)

Nova camada **editorial**, sem novos módulos, sem novas rotas, sem novos contextos, sem novo cálculo.

### 3.1 Contrato de dado (extensão do `StrategyBlueprint`)

Adicionar 3 campos opcionais ao blueprint existente — zero quebra retroativa:

```ts
// src/components/modules/strategy-v2/contracts.ts
export interface StrategyApplication {
  id: string;             // ex: 'compra-vista'
  title: string;          // "Compra à Vista"
  pitch: string;          // 1 frase consultiva
  whenToUse: string;      // 1 frase — para quem/quando
  benefits: [string, string, string]; // máx 3, ≤8 palavras cada
  relatedStrategyIds?: string[];      // cross-links para outras teses
}

export interface StrategyArchetype {
  id: string;             // ex: 'produtor-rural'
  persona: string;        // "Produtor rural"
  context: string;        // 1 frase de cenário
}

// estendido (todos opcionais):
applications?: StrategyApplication[];
archetypes?: StrategyArchetype[];
relatedStrategyIds?: string[];
```

### 3.2 Surface editorial (UI)

Um único componente novo: **`<StrategyDepthDrawer>`** anexado ao `ExecutiveStrategyCard` existente.

- Trigger: link/disclosure inline **"Aplicações desta tese"** (não botão de ação, não CTA primário).
- Apresentação: **`<details>` editorial** (mesmo padrão já adotado no Cockpit para Análise CentralAI) — collapsed por padrão.
- Conteúdo:
  1. **Aplicações Estratégicas** — lista editorial de `StrategyApplication[]` (título + pitch + when-to-use + 3 benefits)
  2. **Cenários Recomendados** — chips discretos de `StrategyArchetype[]`
  3. **Estratégias Relacionadas** — links navegáveis para outros cards (não cards duplicados)
- Mobile: idêntico, `<details>` nativo já é mobile-first; sem grid denso, sem swipe horizontal.
- Compare Workspace: **não muda** (COMPARE_MAX=3, Winner único, disclaimer único permanecem).

### 3.3 Mapeamento das 9 estratégias na nova camada

| Estratégia V1 | Anexada a (blueprint id) | Forma |
|---|---|---|
| **Compra à Vista** | `traditional` (Crescimento) — protagonista | `applications[0]` flagship |
| **Reforma e Ampliação** | `traditional` | `applications[1]` |
| **Upgrade de Veículo** | `traditional` | `applications[2]` (tipo auto) |
| **Energia Solar** | `autoquitacao` (Liquidez) | `applications[0]` — patrimônio produtivo que se autossustenta |
| **Multiplicação de Cotas** | `multiplicacao-ativos` (Estruturação) | reforço narrativo + `applications[0]` |
| **Renovação de Frota** | `escada-patrimonial` (Aceleração) | `applications[0]` (pesados) |
| **Expansão Produtiva** | `multiplicacao-ativos` | `archetypes` |
| **Agronegócio** | `multiplicacao-ativos` + `autoquitacao` | `archetypes` (produtor rural) |
| **Equipamentos Pesados** | `escada-patrimonial` | `archetypes` (frota/operacional) |

**Garantia anti-regressão:** nenhuma destas estratégias vira novo card, novo módulo, nova rota, nova macro tese, novo intent ou nova entrada de sidebar. **Tudo** vive como sub-leitura editorial dentro dos 11 blueprints existentes.

### 3.4 Recuperação flagship — Compra à Vista

```
traditional.applications[0] = {
  id: 'compra-vista',
  title: 'Compra à Vista',
  pitch: 'Acelera a aquisição patrimonial sem descapitalização imediata —
          preserva liquidez e potencializa negociação à vista.',
  whenToUse: 'Cliente com objetivo definido e necessidade de poder de barganha,
              mas sem disposição para descapitalizar caixa próprio.',
  benefits: [
    'Maior poder de negociação',
    'Preservação de caixa',
    'Antecipação patrimonial',
  ],
  relatedStrategyIds: ['multiplicacao-ativos', 'quick-contemplation'],
}
```

Disclosure inline, sem badge "novo", sem destaque visual quebrando hierarchy. A profundidade aparece **só** quando o usuário pede.

---

## FASE 4 — Implementação (próxima onda · NÃO executada agora)

Sequência sugerida (cada item é uma onda atômica, reversível):

1. **Onda DR-1 · Contratos** — estender `StrategyBlueprint` com 3 campos opcionais (`applications`, `archetypes`, `relatedStrategyIds`). Zero UI. Zero teste quebra.
2. **Onda DR-2 · Conteúdo flagship** — popular `traditional` com Compra à Vista + Reforma + Upgrade Veículo. Conteúdo institucional CAIXA, sem promessa de retorno.
3. **Onda DR-3 · `<StrategyDepthDrawer>`** — componente único, `<details>` editorial, anexado ao `ExecutiveStrategyCard`. Mobile-first.
4. **Onda DR-4 · Conteúdo restante** — Energia Solar, Multiplicação de Cotas, Renovação de Frota, arquétipos Agro/Expansão/Pesados.
5. **Onda DR-5 · Cross-links** — `relatedStrategyIds` viram links navegáveis (scroll-to-card, sem mudar surface).
6. **Onda DR-6 · Reviews V2** — perceptual + hierarchy + mobile + consultive + anti-regression. Validar 8 critérios da Constituição.

Cada onda gera relatório curto em `.lovable/audit/depth-recovery-DR-N.md`.

---

## FASE 5 — Governança da Recuperação (regras frozen)

### Proibido nesta camada

- ❌ Novo módulo, nova rota, nova entrada de sidebar
- ❌ Novo `WealthIntent`, novo card top-level, novo dashboard
- ❌ Grid denso de aplicações (máx **lista editorial vertical**)
- ❌ Mais de **3 aplicações** por blueprint (curadoria, não catálogo)
- ❌ Mais de **3 benefits** por aplicação (≤8 palavras cada)
- ❌ Badge "novo"/"premium"/cor de destaque em aplicações
- ❌ Cálculo dedicado por aplicação — **todo cálculo permanece em `@/core/finance`**
- ❌ Reabrir Compare Workspace para aplicações (COMPARE_MAX=3 strategies, não applications)

### Obrigatório

- ✅ Progressive disclosure (`<details>` collapsed por padrão)
- ✅ Mobile-first — `<details>` nativo, sem JS de gesture
- ✅ Tom institucional CAIXA + disclaimer da estratégia-pai herdado
- ✅ Cross-link, nunca duplicação
- ✅ Telemetria leve: `strategy_depth_opened` (id, applicationId) — opt-in, sem PII
- ✅ Passar nos 5 reviews + 8 critérios da Constituição V2 antes de produção

---

## Veredito do Plano

✅ **DEPTH RECOVERY PLAN · APROVADO COMO BASELINE DE EVOLUÇÃO V2**

- Não viola nenhuma das 6 proibições da Constituição
- Não toca `src/core/finance/*`, `WealthPlatformModule.tsx` (estrutura), `CompareWorkspace.tsx`, `intents.ts`
- Adiciona profundidade via **conteúdo + 1 disclosure**, não via estrutura
- Reversível: remoção dos campos opcionais e do componente devolve a V2 atual byte-a-byte

**Próximo passo sugerido:** aprovar execução da **Onda DR-1 + DR-2** (contratos + Compra à Vista flagship) como primeira prova perceptiva antes do resto.
