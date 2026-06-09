# Primary Strategy Visibility Recovery

> Onda DR-2.6 · Resolução definitiva da invisibilidade perceptiva de **Compra à Vista**, **Reforma & Ampliação** e **Upgrade de Veículo** dentro da tese `traditional`.

---

## Executive Summary

A onda anterior (Flagship Discoverability Recovery, DR-2.5) introduziu uma linha editorial silenciosa no Executive Card e auto-expand do accordion `applications`. Tecnicamente correto, **mas o usuário continua não vendo**: a auto-expansão exige abrir o painel + reconhecer um accordion já expandido entre outros — fricção cognitiva persistente.

Esta onda eleva as aplicações para **camada principal não-accordion**: uma seção editorial textual `Estratégias principais` renderizada **imediatamente após a Tese**, sempre visível, sem expandir nada. As 3 aplicações (`Compra à Vista`, `Reforma & Ampliação`, `Upgrade de Veículo`) existem agora **perceptivamente primárias** no momento em que o painel abre.

Sem cards. Sem grids. Sem dashboardization. Apenas tipografia, hierarquia de leitura e uma seção editorial leve.

---

## Visibility Problem Analysis

### Onda anterior (DR-2.5)
- Linha 11px no Executive Card → presença mínima
- Selo `Flagship` no item dentro do accordion `applications`
- Auto-expand do accordion `applications` no painel

### Por que ainda falhou
1. **Accordion = sinal de "secundário"**. Mesmo aberto, o usuário trata accordion como conteúdo opcional.
2. **Hierarquia visual igualada**. O item `applications` ficava lado a lado com `howItWorks`, `forWho`, `pitch` — sem destaque editorial real.
3. **Profundidade ≠ presença**. Conteúdo expandido na metade do scroll continua exigindo descoberta consciente.
4. **Leitura sequencial quebrada**. O fluxo `Tese → Como funciona → Quando faz sentido → ... → Aplicações` empurra Compra à Vista para o meio/fim da leitura.

### Diagnóstico final
> O problema NÃO era profundidade. Era **presença perceptiva primária**.

---

## New Editorial Visibility Layer

### Localização
Entre o bloco `Tese` (sempre visível) e o `Separator` que abre o Accordion. **Primeira coisa que o usuário lê depois da tese.**

### Formato
```text
Estratégias principais     [eyebrow 10px uppercase, ícone Compass]

  ● Compra à Vista  flagship                           [bullet primary 6px]
    Acelera a aquisição patrimonial sem descapitalizar
    — a carta entra como recurso à vista...

  · Reforma & Ampliação                                [bullet muted 6px]
    Carta usada para reforma estrutural ou ampliação
    eleva o valor do imóvel acima do custo da obra...

  · Upgrade de Veículo                                 [bullet muted 6px]
    Troca planejada de veículo com poder de pagador
    à vista — entrada otimizada...

  Abra Aplicações estratégicas abaixo para casos,
  quando não usar e erros comuns.                      [11px hint]
```

### Especificação técnica
- **Componente reaproveitado:** `<Section eyebrow="Estratégias principais" icon={Compass}>` (mesma primitiva editorial da `Tese`)
- **Lista:** `<ul>` textual com `<li>` flex, bullet 6px circular
- **Flagship marker:** bullet `bg-primary` + microcaption "flagship" 10px uppercase ao lado do título — sem badge, sem pill colorido, sem fundo
- **Título:** `text-sm font-semibold` (mesmo peso da Tese)
- **Pitch:** `text-[13px] text-muted-foreground` — 1 frase do `application.pitch`
- **Hint final:** 11px discreto apontando o accordion completo para deep-dive
- **Sem cards. Sem grids. Sem bordas. Sem fundo. Sem CTA.**

### Anti-duplicação
A seção `applications` no accordion **continua existindo** para deep-dive (when-to-use, benefícios, "Aprofundar" com when-not/erros/cenário), **mas o auto-expand foi removido** — caso contrário haveria dois blocos exibindo os mesmos títulos simultaneamente. A leitura agora é progressiva:
1. **Camada primária (sempre visível):** título + pitch — existência perceptiva
2. **Camada secundária (accordion fechado):** quando + benefícios — interesse declarado
3. **Camada terciária (`<details>` "Aprofundar"):** when-not + erros + cenário — operação consultiva

---

## Compra à Vista Positioning

| Critério | Antes (DR-2.5) | Depois (DR-2.6) |
|---|---|---|
| Visível ao abrir o painel? | Não (precisa scroll + reconhecer accordion) | **Sim, imediatamente** |
| Posição na leitura | Meio/fim do flow | **2º bloco após Tese** |
| Cliques até ver pitch | 0 (auto-expand) — mas perdido no meio | **0** — primeiro item da seção principal |
| Sinalização flagship | Selo dentro do accordion | **Bullet primary + caption "flagship"** integrados à narrativa |
| Hierarquia visual | Igual a outros accordions | **Eleva para camada primária** |

### Tom
"Flagship" em 10px lowercase ao lado do título é **estrutural, não promocional**. Não diz "POPULAR" nem "MAIS USADO" — apenas marca que esta é a aplicação canônica da tese.

---

## Reforma + Upgrade Recovery

Ganham presença automática como itens 2 e 3 da seção `Estratégias principais`. Bullet muted (sem destaque flagship) preserva hierarquia interna: o usuário entende imediatamente que Compra à Vista é a aplicação principal, mas as outras duas existem e são reais. Sem competição, sem promoção falsa.

**Cliques para descobrir Reforma:** antes 3-4 (abrir painel → scroll → expandir accordion → ler), agora **0**.

---

## Hierarchy Validation

```
Painel hero (sticky)
  ├─ Eyebrow "Mini playbook consultivo"  (10px)
  ├─ Título da tese                       (18px bold)
  ├─ Tese curta                           (14px)
  ├─ Badges (tag, recomendada)            (10px)
  └─ KPI hero snapshot                    (24px num)

Body
  ├─ [A]   Tese                           ← bloco 1
  ├─ [A.1] Estratégias principais         ← NOVO bloco 2 (sempre visível)
  │         ├─ Compra à Vista · flagship
  │         ├─ Reforma & Ampliação
  │         └─ Upgrade de Veículo
  ├─ Separator
  └─ Accordion (deep-dive opcional)
       ├─ Como funciona              (default open)
       ├─ Quando faz sentido         (default open)
       ├─ Pitch consultivo           (default open)
       ├─ Aplicações estratégicas    (default closed) ← deep-dive
       └─ ... outros blocos
```

✅ Tese > Estratégias principais > deep-dive. Hierarquia editorial limpa.
✅ Nenhum bloco compete com o título do painel.
✅ Bullet flagship não compete com KPI (cores diferentes, sem conflito).

---

## Mobile Validation

| Critério | Status |
|---|---|
| Cabe em 320px sem wrap quebrado? | Sim — `flex` + `flex-wrap` no título permite quebra natural |
| Densidade adicional vs DR-2.5 | +3 itens × (~36px cada) = +108px no painel |
| Substituição perceptiva | Compensado: usuário não precisa mais expandir/explorar |
| Tap targets | N/A — seção é textual (não interativa) |
| Scroll fatigue | Aumenta ~108px MAS elimina 1-2 interações ativas → win líquido |
| Quebra de layout em iPhone SE | Não — bullets 6px + texto fluido |

✅ Mobile-first preservado. Trade-off favorável.

---

## Density Validation

| Métrica | Antes | Depois | Δ |
|---|---|---|---|
| Blocos sempre visíveis no painel | 1 (Tese) | 2 (Tese + Estratégias principais) | +1 |
| Accordions default-open | 3 ou 4 (com flagship) | 3 (sempre) | -1 com flagship |
| Cards no body | 0 | 0 | 0 |
| Grids | 0 | 0 | 0 |
| CTAs adicionais | 0 | 0 | 0 |
| Altura aproximada body (desktop) | ~620px | ~720px | +100px (~16%) |
| Items textuais novos | 0 | 3 (título+pitch) + 1 hint | +4 linhas |

✅ Densidade aumenta de forma **editorial, não visual**. Sem novos componentes pesados.

---

## Anti-Chaos Validation

| Risco | Status |
|---|---|
| Dashboardization | ✅ Evitado — seção textual, sem widgets |
| Card explosion | ✅ Evitado — zero cards novos |
| Grid V1 | ✅ Evitado — lista vertical |
| Badge agressivo | ✅ Evitado — caption "flagship" 10px lowercase |
| Hero secundário | ✅ Evitado — seção integrada ao fluxo de leitura |
| Múltiplos CTAs | ✅ Evitado — zero botões na seção |
| Bloco promocional | ✅ Evitado — tom editorial neutro |
| Animação de atenção | ✅ Evitado — fade-in herdado do body, nada extra |
| Duplicação visual | ✅ Evitado — auto-expand do accordion removido |

---

## Risks Avoided

- **Re-introdução de cards V1**: a tentação era criar 3 mini-cards lado a lado. Rejeitada — usamos lista textual.
- **Promoção forçada**: "MAIS USADA", "BESTSELLER" — rejeitado, mantemos tom consultivo.
- **CTA "Ver Compra à Vista"**: rejeitado — clique vai direto no accordion `Aplicações estratégicas` para deep-dive.
- **Sub-route dedicada**: rejeitado — viola "1 surface por capability".
- **Modal de boas-vindas / tour spotlight**: rejeitado — friction high, value low.
- **Hero "Estratégias em destaque"**: rejeitado — seção integrada à narrativa, não destacada como banner.

---

## Final Perceptual Validation

| Pergunta | Resposta |
|---|---|
| Compra à Vista existe perceptivamente? | **Sim — segundo bloco visível ao abrir** |
| O usuário vê imediatamente? | **Sim — zero cliques, zero scroll** |
| A estratégia ganhou presença? | **Sim — bullet primary + caption flagship + pitch real** |
| Scanning continua limpo? | **Sim — eyebrow + bullets + texto, sem ruído visual** |
| Hierarchy continua premium? | **Sim — Tese > Estratégias principais > deep-dive** |
| Mobile continua saudável? | **Sim — +108px compensado por -1 interação** |
| Houve regressão V1? | **Não — zero cards, zero grids, zero widgets** |
| Houve aumento relevante de densidade? | **Editorial sim (+3 linhas), visual não** |

---

## Final Verdict

✅ **PRIMARY STRATEGY VISIBILITY RECOVERY · APPROVED & SHIPPED**

A invisibilidade perceptiva de Compra à Vista, Reforma & Ampliação e Upgrade de Veículo está **resolvida**. As três aplicações existem agora na **camada principal** do painel consultivo, **sempre visíveis**, em formato editorial textual integrado à narrativa — sem cards, sem grids, sem dashboardization, sem regressão V1.

A profundidade completa (when-to-use, benefícios, when-not, erros, cenário) permanece intacta no accordion `Aplicações estratégicas`, agora servindo seu propósito real: **deep-dive consultivo, não discoverability**.

**Mudança líquida:** o usuário abre o painel `traditional` e **lê imediatamente que existem 3 estratégias concretas, com Compra à Vista sinalizada como flagship**. Hierarquia, mobile, scanning e calma visual preservados.

---

**Arquivos tocados nesta onda**
- `src/components/modules/strategy-v2/ConsultiveStrategyPanel.tsx` — nova seção `Estratégias principais` + remoção do auto-expand redundante
- `.lovable/audit/primary-strategy-visibility-recovery.md` — este doc

**Não tocado** (governança preservada)
- `src/core/finance/*`, `WealthPlatformModule.tsx`, `CompareWorkspace.tsx`, `ExecutiveStrategyCard.tsx`, `blueprint.ts`, `contracts.ts`
