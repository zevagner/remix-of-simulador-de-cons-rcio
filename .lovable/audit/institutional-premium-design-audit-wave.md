# Institutional Premium Design Audit Wave

**Data:** 2026-05-13
**Escopo:** Auditoria visual/UX de toda a plataforma — landing page, módulos internos, hierarquia, identidade, densidade.
**Restrição:** Apenas diagnóstico + plano. Sem refactor técnico, sem nova arquitetura, sem novas engines.

---

## TL;DR

Engenharia já é institucional; **a pele ainda parece SaaS dashboard**. O que mais delata "template/IA":

1. **Cards homogêneos por toda parte** (mesma `border + rounded-lg + shadow-sm + p-6`) — sem ritmo editorial.
2. **Excesso de KPI tiles equivalentes** em headers de módulos (Cockpit, Carteira, Pós-venda, Performance Intel) — todos com ícone redondo + número grande + label cinza, sem priorização visual.
3. **Landing tem narrativa forte e identidade dourada distintiva**, mas usa o mesmo gold em CTA, badges, ícones, ratings, quotes e dividers — o ouro vira ruído em vez de virar âncora.
4. **Tipografia única** (sans system) sem família display/serif para headlines editoriais — falta voz tipográfica.
5. **Borda + sombra suave em tudo** → "fofura SaaS". Falta a escolha entre **flat institucional** e **layered editorial** — ficou no meio do caminho.
6. **Densidade inconsistente:** Simulador é denso (correto), mas Cockpit/Help/Comunidade têm mesma densidade — deveriam respirar mais.
7. **Excesso de gradiente sutil em backgrounds de Card** (`bg-gradient-to-br from-primary/5 ...`) — uso decorativo, não funcional.

A plataforma **não é mais template** — está em ~7,2/10 visual. O caminho para 9+ é cirúrgico, não redesign.

---

## FASE 1 — Auditoria global

### 1. Identidade visual

| Item | Estado | Diagnóstico |
|---|---|---|
| Paleta primária (Azul Caixa + Laranja secundário) | OK | Coerente e institucional. |
| Gold da landing | Parcial | Forte como acento; **diluído** por uso indiscriminado. |
| Tipografia | Fraco | Apenas `font-sans` (Inter/system). Sem display tipográfica. Tudo soa "produto neutro". |
| Iconografia | OK | Lucide é consistente; nenhum ícone customizado/marcante. |
| Logos/branding | OK | Tight crop respeitado; gold logo na landing tem peso. |
| Voz visual | Fraco | Não há "elemento assinatura" repetido (linha, corner, divisor editorial). |

**Veredito:** Identidade existe mas é **soft**. Falta um elemento gráfico assinatura — ex.: `border-l-4` editorial + tipografia display em headlines + tratamento de número (tabular nums + tracking) — que faça o sistema ser reconhecível em screenshot sem logo.

### 2. Hierarquia visual

**Sintomas detectados (busca por padrões repetidos no código):**

- Mesma "receita de Card" em 200+ lugares: `<Card><CardContent className="pt-6">…</CardContent></Card>` com header ícone-redondo + título + subtítulo cinza.
- KPI tiles homogêneos em: Cockpit, Carteira (`PortfolioInsightsBar`), Pós-venda (`PortfolioSignals`), Admin Performance Intel, Pipeline metrics, Forecast.
- Falta de **âncora visual** por tela: quase toda tela começa igual (header + card + card + card).

**Falta de ritmo:** quase nenhuma tela usa hierarquia tipográfica forte (display 32-40px) seguida de respiro generoso seguido de bloco denso. A leitura é "sopa de cards iguais".

### 3. Percepção "IA/template"

| Gatilho | Onde aparece | Severidade |
|---|---|---|
| `border + rounded-lg + shadow-sm` em todo bloco | Geral | Alta |
| Ícone redondo `bg-primary/10` ao lado de cada título de seção | Help, Cockpit, Admin, Pipeline | Alta |
| `from-primary/5 via-transparent to-accent/5` em cards "destaque" | Help (Trilhas), Cockpit, Forecast | Média |
| Badges multicoloridos pequenos em todo lugar | Carteira, Help, Admin | Média |
| Mesmo tamanho/tom de h2 em landing e em Help | Geral | Média |
| Gradient hero + glow gold + animação de stagger | Landing | Baixa (intencional, mas cansa) |
| Emoji em UI institucional | Help (`📌 ✅ 🚫 ⚠️`), Tips | Média |
| Texto "💎/🚀/🎯" em UI corporativa | Help, Tour | Média |

### 4. Densidade visual

| Módulo | Densidade | Avaliação |
|---|---|---|
| Simulador | Alta | Correta — é tela operacional de cálculo. |
| Comparadores | Alta | Correta. |
| Análise (Investimento) | Muito alta | Excessiva: 6 paths + sliders + cards. Falta hierarquia entre paths. |
| Cockpit | Média-alta | **Errada**: deveria ser leitura rápida (5 min) e está cheio de KPI tiles. |
| Carteira | Alta | Correta para Kanban; insights bar está correta. |
| Pós-venda | Alta | Correta. |
| Help | Média | **Pode respirar mais**: hoje tem 6 cards empilhados (Tour + Busca + Trilhas + Tips + Categorias + Glossário). |
| Comunidade | Média | OK. |
| Admin Performance Intel | Muito alta | **Excessiva**: KPIs + Web Vitals + Render Hotspots + Feed. Falta foco. |
| Landing | Equilibrada | Boa, mas seções 4-7 têm densidade similar — falta "pico" editorial. |

---

## FASE 2 — Landing page

### 5-6. Diagnóstico

**Pontos fortes:**

- Narrativa AIDA bem construída (problema → virada → benefícios → como → prova → objeções → garantia → CTA).
- Tom consultivo coerente; copy não é promessa vazia.
- Paleta dark + gold é distintiva — destaca-se de SaaS azulado padrão.
- Stats bar de credibilidade (+100 funcionários, +5000 propostas, 500+ assembleias) gera autoridade real.

**Problemas detectados:**

| # | Problema | Onde | Severidade |
|---|---|---|---|
| L1 | Banner top "www.simuladordeconsorcio.seg.br" em ouro grande | Acima do hero | Alta — parece classificado dos anos 2000. |
| L2 | Hero usa **3 gradientes** sobrepostos (`from-landing-dark via-landing-dark-mid to-landing-dark-deep`) | Hero, transição, CTA, garantia | Média — perde sofisticação por uso repetido. |
| L3 | Logo gigante (h-48) ao lado do hero compete com headline | Hero desktop | Alta — quebra o "headline rules" clássico. |
| L4 | Logo gigante (h-48 md:h-72) no footer | Footer | Alta — parece vendedor de carro usado. |
| L5 | Animações de stagger em **toda** seção | Geral | Média — fadeUp em tudo dá "site IA-gerado". Selecionar 2-3 momentos. |
| L6 | Cards de Problema usam `bg-red-50/50 + border-red-200/40` + ícone redondo vermelho | Seção 2 | Média — visual genérico de "pain point cards". |
| L7 | Cards de Benefício com strikethrough vermelho "Antes/Agora" | Seção 4 | Baixa — funciona, mas é meme de landing. Refinar tipografia. |
| L8 | Quote icon `top-4 right-4 h-8 w-8 text-landing-gold/10` em testemunho | Seção 6 | Baixa — clichê SaaS. |
| L9 | Divisor "Você tem duas opções agora" com card vermelho × dourado | Seção 9 (CTA final) | Média — manipulação visual evidente. |
| L10 | Headlines todas com `font-extrabold` `text-3xl md:text-5xl lg:text-6xl` | Geral | Média — falta variação editorial. |

**Veredito landing:** Está em ~7,5/10. Identidade gold é forte; estrutura é sólida; **detalhes denunciam template**.

### 7. Direção sugerida (landing)

- **Remover banner top da URL** (ou transformar em tag discreta no rodapé).
- **Reduzir logo** no hero para h-24 e usar grid 5/7 (logo 2 cols, headline 5 cols) em vez de flex paritário.
- **Trocar 3 gradientes por 1 gradiente assinatura** + flat dark nos demais. Gradient deixa de ser "wallpaper".
- **Limitar gold** a CTA + 1 destaque por seção. Resto: white/slate.
- **Tipografia editorial:** importar 1 família display (ex.: Fraunces, Inter Display, ou equivalente sem dependência externa via `font-display: swap`). Usar **só em h1/h2**. Body fica Inter.
- **Cortar 50% das animações.** Manter só hero + CTA final.
- **Substituir cards "Antes/Agora"** por linha tipográfica editorial: `Antes: ...` em pequena maiúscula tracking-wide, `Agora: ...` em h3 pesada. Sem strikethrough vermelho.
- **Logo footer** para h-16. Ponto.

---

## FASE 3 — Auditoria dos módulos

### 8. Simulador

**Estado visual:** 8/10. É um dos módulos mais maduros. Composição da parcela tem hierarquia. Cards de input têm propósito.

**Refinos premium:**

- **Tabular nums** (`font-feature-settings: 'tnum'`) em todos os números de moeda. Hoje muitos usam font padrão — alinhamento desigual.
- **Hairline divider** entre componentes da parcela (FC/TA/FR/Seguro) em vez de cards separados — mais editorial.
- **Tipografia maior** no resultado da parcela final (1 número estrela em ~48px, tabular, com pequenas labels).
- Pós-contemplação card pode ganhar `border-l-2 border-l-primary` em vez de `border` completa — denota "derivação" da base.

### 9. Comparadores

**Estado visual:** 7,5/10.

**Refinos:**

- Tabela comparativa tem zebra/hover SaaS. Trocar por **hairlines + rowspan visual** para totais.
- Adicionar **anchor metric**: 1 número grande (ex.: "Custo total +R$ 38.4k a favor do consórcio") como **headline antes da tabela**, não enterrado nela.
- Reduzir ícones decorativos no header de cada card-comparação.

### 10. Assembleias

**Estado visual:** 8/10. O AdminAssembliesImportHistory ficou de fato institucional após a Wave (timeline + dots semânticos + drift badges).

**Refinos:**

- Histórico ainda usa muitos KPI tiles no topo. Reduzir para 3 tiles principais + 1 linha de "outros sinais" em texto.
- Drift severo poderia ter tratamento de "alerta editorial" (banner full-width com `border-l-4 border-l-destructive`) e não badge no card.

### 11. Central de Ajuda

**Estado visual:** 7/10. Pós Consultive Learning Tracks, conteúdo é forte; pele ainda é "ajuda SaaS".

**Refinos:**

- **Tipografia editorial nos títulos de artigo** (h2 ~28px com tracking apertado).
- Resumo executivo em **bloco editorial** estilo "lead de revista" (italic ou primeira-letra-grande), não card primary/5.
- Trilhas (playbooks) hoje renderizam dentro de Card→Accordion. Promover playbook a **página plena com max-w-prose** (lê como artigo, não como FAQ).
- Remover emojis dos labels de bloco consultivo. Usar **chips tipográficos minúsculos** (ex.: `QUANDO USAR`, `ERRO COMUM`, `NARRATIVA`).
- Limpar gradiente do card "Trilhas".

### 12. Carteira & Pós-venda

**Estado visual:** 7,5/10.

**Refinos:**

- Kanban: cards com sombra muito uniforme. **Hierarquizar prioridade** com `border-l-4` por temperatura (quente/morno/frio) em vez de badge colorido.
- KPI bar acima do Kanban: hoje 4-5 tiles equivalentes. Promover **1 tile estrela** (gap vs meta) e demais como linha textual.
- PortfolioInsightsBar: máximo 2 chips foi acertado. Manter.
- Pós-venda: Próxima ação obrigatória poderia ser **tipografia** (h3 + data destacada) em vez de campo de formulário com label.

---

## FASE 4 — Direção visual proposta

### 13. Linguagem visual

**Direção:** *Premium Editorial Institutional*

| Eixo | Decisão |
|---|---|
| Densidade | Operacional alta (Simulador/Análise/Carteira); Reflexiva baixa (Cockpit/Help). Diferenciar. |
| Ritmo | Bloco editorial → bloco denso → bloco editorial. Nunca 3 cards iguais seguidos. |
| Bordas | **Hairline 1px + radius 6-8px** como padrão. `rounded-lg/xl` apenas em CTA e cards-destaque. |
| Sombra | Quase ausente. Sombra só em modals/popovers. |
| Cor | 80% neutro (background/muted/foreground). 15% primary (azul) como acento. 5% gold/destructive como sinal. |
| Tipografia | Display family em h1/h2 (institucional). Inter no resto. Tabular nums em todos os números. |
| Acentuação | `border-l-2/4` editorial em vez de cards inteiros coloridos. |
| Iconografia | Sem círculo `bg-primary/10` por trás. Ícones inline, mesmo tamanho do texto. |

### 14. Reduzir aspecto template

- **Banir Card-genérico:** auditoria ESLint poderia (em onda futura) avisar uso de `Card + CardContent + ícone-redondo + h3` repetido.
- **Remover gradientes decorativos** em backgrounds de Card.
- **Cortar emojis** de labels institucionais (manter só em Tips e mensagens de cliente, onde são "voz do consultor").

### 15. Sofisticação

- **Silêncio visual:** 30% mais espaço em branco em telas reflexivas (Cockpit, Help, Admin).
- **Foco:** 1 hero metric por tela quando há agregado.
- **Hairlines** em vez de bordas/sombras suaves.

### 16. Identidade consultiva

Adicionar 1 elemento assinatura repetido em todo o produto:

- **Marker editorial:** `border-l-2 border-l-primary` no início de seções importantes.
- **Eyebrow tipográfico:** label `text-[10px] uppercase tracking-[0.18em] text-primary` antes de toda h2 (já existe esparsamente — padronizar).

---

## FASE 5 — UX

### 17-19. Avaliação

| Tela | Foco | Ritmo | Ruído |
|---|---|---|---|
| Diagnóstico | Forte | OK | Baixo |
| Simulador | Forte | OK | Baixo |
| Análise (tabs) | Médio | Quebrado entre tabs | Alto |
| Cockpit | Fraco | Plano | **Alto** |
| Carteira | Forte | OK | Médio |
| Pós-venda | Forte | OK | Médio |
| Help | Médio | Plano | Alto |
| Admin Perf Intel | Fraco | Plano | **Alto** |
| Landing | Forte | OK | Médio |

**Telas mais maduras:** Simulador, Diagnóstico, Carteira.
**Telas menos maduras:** Cockpit (paradoxo: deveria ser a mais editorial), Admin Performance Intel, Análise.

---

## FASE 6 — Plano priorizado

### CRÍTICOS (alto impacto, baixa complexidade) — 7 itens

| # | Mudança | Arquivos | Impacto |
|---|---|---|---|
| C1 | Reduzir banner-URL e logos gigantes da landing (hero + footer) | `LandingPage.tsx` | Alto |
| C2 | Adicionar tipografia display (h1/h2 sistema editorial) | `index.css` + `tailwind.config.ts` | Alto |
| C3 | Tabular nums global em moeda/percentual | `index.css` (utility class) | Alto |
| C4 | Eyebrow tipográfico padrão (label de seção) | Componente novo `<Eyebrow>` | Médio-Alto |
| C5 | Cortar gradientes decorativos de fundo de Cards | Help, Cockpit, Forecast | Médio-Alto |
| C6 | Remover ícone-redondo `bg-primary/10` de headers de seção (manter inline) | Help, Cockpit, Admin | Médio-Alto |
| C7 | Substituir badges/cards coloridos por `border-l-4` editorial em Kanban e Insights | Carteira, Pós-venda | Médio-Alto |

### MÉDIOS (refinamento estrutural) — 6 itens

| # | Mudança |
|---|---|
| M1 | Cockpit: deletar 50% dos KPI tiles, promover 1 hero metric |
| M2 | Help: promover playbooks a páginas com max-w-prose |
| M3 | Admin Performance Intel: separar em 2 abas (Saúde / Detalhes) |
| M4 | Landing: cortar 50% das animações; manter só hero + CTA final |
| M5 | Hairline divider entre componentes (FC/TA/FR/Seguro) no Simulador |
| M6 | Comparadores: anchor metric (1 número estrela) antes da tabela |

### REFINAMENTOS PREMIUM — 5 itens

| # | Mudança |
|---|---|
| R1 | Tratamento "lead de revista" no resumo executivo do Help |
| R2 | Remover emojis de labels institucionais de bloco consultivo |
| R3 | Drift severo em assembleias como banner full-width |
| R4 | Hover-states com sutil `bg-muted/30` em vez de elevação |
| R5 | Fontes monoespaçadas (1 weight) em hashes/IDs/tokens (Admin) |

### O QUE PRESERVAR (não tocar)

- Estrutura e narrativa da landing — funciona.
- Densidade do Simulador — é correta.
- Cadência institucional do Kanban (SLA, próxima ação obrigatória).
- Linguagem de blocos consultivos do Help (semântica) — só refinar pele.
- Paleta primária (Azul Caixa).

---

## FASE 7 — Auditoria final

### 23. Respostas diretas

**O sistema ainda parece template/IA?**
Em ~30% das telas — Cockpit, Admin Performance Intel, parte do Help e cards genéricos. **Em 70% já parece produto sério.**

**O que mais gera essa percepção?**
Repetição de Card-genérico + ícone redondo + KPI tile. Ausência de tipografia editorial e de elemento gráfico assinatura.

**Quais módulos estão mais maduros?**
Simulador, Diagnóstico, Carteira.

**Quais precisam mais evolução?**
Cockpit, Admin Performance Intel, Análise (hub de tabs).

**A landing transmite autoridade?**
Sim, parcialmente. Narrativa e gold ajudam; banner-URL gigante e logos enormes prejudicam.

**O sistema transmite inteligência consultiva?**
**Sim** — após as ondas de Strategic Intelligence, AI Edges, Adaptive Profile e Consultive Learning Tracks. O *conteúdo* já é consultivo. **A pele ainda não acompanha em todas as telas.**

**O design parece premium/institucional?**
Premium: parcialmente. Institucional: sim (paleta + governança visual de tokens).

**O que impede 10/10?**
1. Falta tipografia display.
2. Falta elemento gráfico assinatura.
3. Excesso de Card-genérico em telas reflexivas.
4. Cockpit e Admin Performance Intel ainda no padrão "dashboard SaaS".
5. Landing com 2-3 detalhes que delatam template (banner-URL, logo gigante, gradiente repetido).

### 24. Scores

| Dimensão | Score atual | Teto realista após plano |
|---|---|---|
| Maturidade visual | 7,2 | 9,4 |
| Identidade premium | 6,8 | 9,3 |
| Sofisticação | 6,5 | 9,2 |
| Clareza | 8,0 | 9,3 |
| Percepção institucional | 7,5 | 9,5 |
| Qualidade UX | 8,2 | 9,5 |

**Score consolidado atual: 7,4 / 10**
**Teto realista após Críticos + Médios: 9,2 / 10**

---

## Próxima onda recomendada (escopo)

**"Editorial Institutional Skin Wave"** — execução dos 7 itens CRÍTICOS:

1. Tokens de tipografia display + tabular nums.
2. Componente `<Eyebrow>` + `<EditorialMarker>` (border-l).
3. Limpeza de gradientes decorativos e ícones-redondos de headers.
4. Refino landing (banner, logos, hero proporção).
5. Substituição de badges/cards coloridos por marker editorial em Kanban.

Estimativa: 1 onda focada, sem refactor de lógica, totalmente em camada de presentation. Salto esperado: **7,4 → 8,7+** com baixa complexidade.

---

## Princípios respeitados nesta auditoria

- Zero refactor proposto.
- Zero nova engine/pipeline.
- Zero abertura de novos sistemas.
- Apenas: diagnóstico + plano priorizado em camada visual/UX.
- Preserva o que funciona (narrativa, paleta, governança).

---

## Resumo executivo

A engenharia entregou maturidade institucional; **a pele precisa alcançar**. Não é redesign — é **edição visual cirúrgica** focada em tipografia editorial, redução de Card-genérico, marker assinatura e limpeza de detalhes "template" na landing. Com 7 mudanças críticas de baixa complexidade, o sistema sai de "dashboard SaaS competente" para "produto financeiro consultivo premium".
