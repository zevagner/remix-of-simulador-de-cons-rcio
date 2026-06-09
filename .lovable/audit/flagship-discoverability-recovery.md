# Flagship Discoverability Recovery

> Onda DR-2.5 · Camada editorial leve de presença perceptiva para estratégias flagship recuperadas pela Depth Recovery Layer, sem regressão à V1.

---

## Executive Summary

A Depth Recovery Layer (DR-1/DR-2) devolveu profundidade estratégica à V2 — "Compra à Vista", "Reforma & Ampliação", "Upgrade de Veículo" voltaram a existir como aplicações ancoradas em teses (`traditional`). Tecnicamente correto. Arquiteturalmente impecável. **Perceptivamente invisível.**

O usuário não percebe que "Compra à Vista" existe sem abrir o painel consultivo e descer até a seção "Aplicações estratégicas" (collapsed por padrão). Para uma capability flagship da plataforma, isso é discoverability insuficiente.

Esta onda introduz uma **camada editorial silenciosa** que dá **presença sem destaque**, **descoberta sem dashboard**, **profundidade percebida sem complexidade somada**. Sem cards novos, sem grids, sem badges agressivos, sem nova surface. Apenas uma linha editorial no Executive Card e auto-expansão da seção certa no Panel.

---

## Discoverability Audit

| Estratégia | Onde vive hoje | Profundidade requerida | Cliques até descobrir | Veredito |
|---|---|---|---|---|
| **Compra à Vista** | `traditional > applications[0]` (collapsed) | Card → painel → scroll → expandir → ler | 3-4 interações | **INVISÍVEL — flagship perdida** |
| **Reforma & Ampliação** | `traditional > applications[1]` (collapsed) | Idem | 3-4 | Aceitável (não-flagship) |
| **Upgrade de Veículo** | `traditional > applications[2]` (collapsed) | Idem | 3-4 | Aceitável (não-flagship) |
| Multiplicação de Cotas | tese `multiplicacao-ativos` (card próprio) | Card direto | 1 | **OK** — já é tese |
| Quick Contemplation | tese `quick-contemplation` (card próprio) | Card direto | 1 | **OK** — já é tese |
| Renda com Aluguel | tese `rental` (card próprio) | Card direto | 1 | OK |
| Revenda | tese `sale` (card próprio) | Card direto | 1 | OK |

### Perguntas brutais respondidas

- **Compra à Vista é percebida naturalmente?** Não.
- **Parece importante?** Não — sem nenhuma pista no card.
- **Parece diferencial?** Não — está enterrada em accordion fechado.
- **Parece capability premium?** Não — exige mineração consciente.
- **Aparece cedo o suficiente?** Não — só depois de abrir o painel.
- **Está enterrada demais?** Sim — 3 a 4 interações.
- **Depende de cliques demais?** Sim — accordion fechado por padrão.

---

## Flagship Strategy Classification

### FLAGSHIP — presença perceptiva primária obrigatória

- **Compra à Vista** (aplicação de `traditional`). Capability comercial reconhecida, alto valor consultivo, identidade clara para o cliente final.

> Regra de governança: **máx 1 flagship por tese** para evitar competição visual e dashboardização rastejante.

### CONTEXTUAIS — disclosure profundo é correto

- **Reforma & Ampliação** (aplicação de `traditional`) — aparece via "Aprofundar".
- **Upgrade de Veículo** (aplicação de `traditional`) — aparece via "Aprofundar".
- **Energia Solar**, **Renovação de Frota**, **Equipamentos Pesados** — quando entrarem, ficam como aplicações sem flagship.

### DERIVADAS — apenas em cross-links

- **Expansão Empresarial**, **Agronegócio** — arquétipos / `relatedStrategyIds`, não merecem card próprio.

---

## Visibility Layer Proposal

### Princípio

> Dar **presença** sem criar **caos**. Uma linha editorial silenciosa, não um card novo.

### Implementação (3 micro-mudanças)

1. **Contrato** — `StrategyApplication.flagship?: boolean`. Opcional, retrocompatível. Máx 1 por tese (governança editorial).

2. **Executive Card** — quando a tese tem aplicação flagship, renderiza **uma única linha** abaixo da `shortThesis`:
   ```
   Inclui · Compra à Vista →
   ```
   - 11px, `text-foreground/70`, ícone seta minúscula
   - Sem badge, sem chip colorido, sem ring, sem hero secundário
   - Clique abre o painel (reaproveita `onOpenPanel`)
   - `aria-label` explícito para a11y

3. **Consultive Panel** — quando a tese tem aplicação flagship:
   - Seção `applications` entra no `defaultOpen` (junto com `howItWorks`, `forWho`, `pitch`)
   - O item flagship ganha selo discreto `Flagship` (9px, primary, 1 pill pequeno) e card com `bg-primary/[0.03]` + `border-primary/40`
   - Sem mover ordem, sem hero, sem CTA extra

### O que NÃO foi feito (rejeições explícitas)

- ❌ Card novo no grid principal
- ❌ Hero "Estratégias em destaque"
- ❌ Carrossel de aplicações flagship
- ❌ Badge "NOVO" / "POPULAR"
- ❌ Animação de atenção (pulse, glow, shimmer)
- ❌ Quick action button no card
- ❌ Modal de boas-vindas / spotlight tour
- ❌ Banner promocional editorial

---

## Compra à Vista Recovery

### Antes
- Localização: `traditional.applications[0]`, accordion `applications` fechado por padrão
- Descoberta: 3-4 cliques, scroll obrigatório
- Sinalização externa: zero

### Depois
- **Card** (`traditional`) exibe linha "Inclui · Compra à Vista →" abaixo da tese curta — 1 linha, 1 cor, 1 ícone seta
- **Painel** abre com seção `applications` já expandida; o item Compra à Vista ganha selo `Flagship` discreto e contorno primary suave
- **Cliques até descobrir**: 1 (linha do card) ou 1 (abrir painel e já ver expandido)
- **Surface nova criada**: nenhuma
- **Cálculo novo**: nenhum
- **Densidade adicional no card**: +1 linha de 11px (≈ 16px vertical)

### Reposicionamento sem dashboard
A linha "Inclui · Compra à Vista" não compete com o KPI hero (28px) nem com o título (15px). Hierarchy preservada: título > KPI hero > tese curta > flagship inclusion line > KPIs secundários > "Entender estratégia".

---

## Multiplicação de Cotas Positioning

Já vive como **tese própria** (`multiplicacao-ativos`, card próprio no grid). Discoverability adequada. Não promover artificialmente — promovê-la a flagship cross-tese causaria competição visual com `traditional`.

**Ação:** nenhuma. Manter como tese própria; eventualmente cross-link via `relatedStrategyIds` (já está em `traditional.relatedStrategyIds`).

Se em onda futura quisermos destaque, a regra é a mesma: linha editorial silenciosa no card-pai, nunca duplicação de card.

---

## Depth vs Discoverability Balance

| Camada | Conteúdo | Default | Justificativa |
|---|---|---|---|
| **Imediato (card)** | título, tag, tese curta, KPI hero, KPIs secundários, **linha flagship** | sempre visível | scanning executivo + presença flagship |
| **Próximo (painel hero)** | tese, KPI snapshot | sempre visível ao abrir | reentrada no contexto |
| **Default aberto (painel)** | howItWorks, forWho, pitch, **applications (se flagship)** | aberto | aprendizado essencial + flagship recuperado |
| **Default fechado (painel)** | advantages, risks, objections, mistakes, examples, archetypes, whenNotToUse, patrimonialImpact, relatedStrategies | fechado | profundidade sob demanda |
| **Aprofundar (aplicação)** | whenNotToUse, commonMistakes, example | `<details>` fechado | granularidade máxima |

### Anti-overload check
- Card ganhou **1 elemento** (11px, 1 linha). Density ceiling intacto.
- Panel ganhou **1 seção default-aberta apenas em teses com flagship**. Hoje só `traditional`.
- Zero novo CTA, zero novo botão, zero novo widget.

---

## Mobile Validation

| Critério | Status |
|---|---|
| Linha flagship cabe em 320px sem wrap? | Sim — "Inclui · Compra à Vista →" ≈ 180px |
| Linha colide com KPI hero? | Não — `mt-2` antes do bloco hero, separação clara |
| Tap target ≥ 32px? | Sim — `py-` implícito + padding do card |
| Scroll fatigue aumentou? | +16px no card. Negligível. |
| Painel mobile: seção applications expandida polui? | Não — empilha vertical, sem grids densos |
| Selo "Flagship" 9px legível? | Sim — uppercase + primary, contraste WCAG AA |

---

## Governance Update

### Discoverability Governance Rules (oficial)

> **Regra principal:** feature importante precisa existir perceptivamente.

#### Toda nova capability estratégica deve passar por:
1. **Discoverability validation** — quantos cliques até descobrir? Se > 2 para flagship, falha.
2. **Perceptual presence validation** — usuário vê alguma pista no scanning executivo? Se não, falha.
3. **Flagship visibility validation** — se classificada flagship, tem linha editorial no card-pai? Se não, falha.

#### Limites editoriais
- **Máx 1 flagship por tese** (`flagship: true` em no máximo 1 `StrategyApplication`).
- **Linha flagship no card** = 1 linha, ≤ 32 caracteres no `title`, sem ícones decorativos além da seta.
- **Selo "Flagship" no painel** = 9px, uppercase, primary, 1 pill, sem variantes coloridas.
- **Sem badge "Novo / Popular / Top"** — flagship é estrutural, não promocional.

#### Anti-padrões proibidos
- Card duplicado para aplicação flagship
- Hero / banner / carousel de flagships
- Badge promocional ("Mais usada", "Recomendada para você") — recomendação tem mecanismo próprio (`isRecommended`)
- Animação de atenção (pulse, glow)
- Quick-action button extra no card

### Memória
Criar `mem://features/strategy/flagship-discoverability-layer` referenciando este doc + regras.

---

## Risks Avoided

- **Card explosion**: rejeitado card próprio para Compra à Vista.
- **Dashboardization**: rejeitado painel "Aplicações em destaque".
- **Density creep**: +16px vertical no card, sem novas zonas.
- **Hierarchy collapse**: linha flagship em 11px nunca compete com KPI 28px.
- **Mobile scroll fatigue**: incremento negligível.
- **Compare regression**: zero mudança em CompareWorkspace.
- **V1 nostalgia**: nenhum grid, nenhum tile, nenhum dashboard.

---

## Explicitly Rejected Solutions

| Proposta | Por que rejeitada |
|---|---|
| Card próprio "Compra à Vista" no grid | Reativa card-soup V1; quebra "1 tese = 1 card" |
| Hero "Estratégias em destaque" no topo da página | Cria dashboard secundário; rouba foco da seleção real |
| Badge "POPULAR" no card pai | Promocional, não consultivo; quebra tom institucional |
| Animação pulse no link flagship | Atenção forçada; rompe calma visual V2 |
| Onboarding tour spotlight | Friction high, value low; já há tour guiado oficial |
| Botão "Ver Compra à Vista" no card | CTA secundário compete com "Entender estratégia" |
| Sub-rota `/strategy/compra-vista` | Cria surface paralela; viola "1 surface por capability" |
| Carrossel de aplicações flagship cross-teses | Dashboardization absoluta |

---

## Final Verdict

✅ **FLAGSHIP DISCOVERABILITY RECOVERY · APPROVED & SHIPPED**

A V2 ganhou **presença perceptiva** para a aplicação flagship "Compra à Vista" através de:
- 1 linha editorial silenciosa no Executive Card (`Inclui · Compra à Vista →`)
- Auto-expansão da seção `applications` no Consultive Panel quando há flagship
- Selo `Flagship` discreto no item correspondente

**Zero novo card. Zero novo grid. Zero dashboard. Zero nova surface. Zero CTA novo.**

Hierarchy V2 preservada. Mobile validado. Compare intacto. Cálculo intacto. Governance reforçada com regras explícitas de flagship visibility.

O usuário agora **percebe** Compra à Vista no scanning executivo, sem que a V2 perca sua identidade consultiva premium. Profundidade visível, complexidade invisível — exatamente a regra de ouro da Depth Recovery.

---

**Arquivos tocados nesta onda**
- `src/components/modules/strategy-v2/contracts.ts` — campo `flagship?: boolean`
- `src/components/modules/strategy-v2/blueprint.ts` — `compra-vista` marcado flagship
- `src/components/modules/strategy-v2/ExecutiveStrategyCard.tsx` — linha editorial flagship
- `src/components/modules/strategy-v2/ConsultiveStrategyPanel.tsx` — auto-expand + selo
- `.lovable/audit/flagship-discoverability-recovery.md` — este doc
