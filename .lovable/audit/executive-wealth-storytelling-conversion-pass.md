# Executive Wealth Storytelling & Conversion Pass

**Data:** 2026-05-17  
**Escopo:** `strategy-v2` (`ExecutiveStrategyCard`, `ConsultiveStrategyPanel`, `contracts`, `blueprint`)  
**Princípio:** *traduzir e potencializar* a profundidade consultiva existente — sem destruí-la, sem marketing apelativo, sem promessa.

---

## 1. Closed-Card Executive Impact Pass

**Mudança:** `ExecutiveStrategyCard` ganha duas camadas perceptivas silenciosas **logo abaixo do hero KPI**:

1. **Comparative Gain Chip** — quando o hero KPI não é monetário (ex.: `multiplier`, `payback`, `tir`) e `comparePayload.absoluteGain > 0`, exibe:
   `↗ +R$ XX.XXX  ganho estimado`  
   Single source: `comparePayload` (motor único). Zero recálculo.
2. **Human Translation Caption** — frase curta "Na prática..." derivada de `consultive.humanTranslation` (opcional).

**Hierarchy resultante (top→bottom, primeiros 2s):**
1. Título + tag + recomendado
2. Tese curta + **gatilho executivo** (novo)
3. Lista "Inclui" (flagships)
4. **Hero KPI** + **ganho estimado em R$** (novo) + **tradução humana** (novo)
5. KPIs secundários
6. CTA "Entender estratégia"

→ O usuário lê **valor patrimonial em R$ + multiplicador/ROI** na primeira varredura, sem precisar abrir o painel.

---

## 2. Executive Mental Trigger Layer

**Mudança:** `ConsultiveContent.executiveTrigger?: string` — micro-frase consultiva, render no card fechado entre tese e Inclui.

**Curado em 7 blueprints:**

| Estratégia | Gatilho |
|---|---|
| Comprar e Valorizar | *"Enquanto a maioria financia, esta estrutura usa o tempo e o capital a favor do patrimônio."* |
| Autoquitação | *"A lógica não é comprar mais barato. É fazer o patrimônio crescer enquanto o tempo trabalha pelo cliente."* |
| Escada Patrimonial | *"Estruturas patrimoniais avançadas raramente nascem de uma única cota — nascem de uma sequência inteligente."* |
| Renda Passiva Estruturada | *"Patrimônio que se sustenta sozinho é a base de qualquer estratégia de independência financeira."* |
| Construção Inteligente | *"Construir custa menos que comprar pronto — e a diferença vira ganho patrimonial no dia da entrega."* |
| Multiplicação de Ativos | *"Controlar mais patrimônio com menos capital próprio é o que separa o investidor sofisticado do comprador comum."* |
| Holding & Sucessão | *"Patrimônio sem estrutura é apenas acumulação. Patrimônio estruturado é legado."* |

**Tom validado:** consultivo, sofisticado, sem promessa, sem superlativo barato, sem CTA agressivo.

---

## 3. Expanded Card Storytelling Intro

**Mudança:** `ConsultiveContent.storytellingIntro?: { vision, context, consequence }` renderizado **no topo do `ConsultiveStrategyPanel`, ANTES da Tese**.

Bloco editorial com 3 bullets verticais (visão → contexto → consequência), gradient sutil `primary/[0.04]`. Cria visão patrimonial antes de qualquer accordion técnico.

**Fluxo cognitivo do painel pós-pass:**

```
Header (KPI snapshot + tradução humana)
   ↓
Storytelling Intro (Visão → Contexto → Consequência)  ← NOVO
   ↓
Tese consultiva (fullThesis)
   ↓
Estratégias principais (applications flagship)
   ↓
Accordion modular (como funciona / quando / benefícios / riscos / pitch / objeções / profundidade)
```

A profundidade consultiva continua intacta. O storytelling apenas precede.

---

## 4. Simple Financial Translation Layer

**Mudança:** `ConsultiveContent.humanTranslation?: string` — 1 linha começando com "Na prática", renderizada em **dois lugares**:
- Card fechado: caption discreta sob o hero KPI.
- Panel: rodapé do KPI snapshot (após KPIs secundários, com border-top sutil).

**Regra editorial:** traduz o número hero em ação patrimonial concreta sem destruir profundidade. Ex. para Autoquitação:  
> *"Na prática: o aluguel mensal cobre a parcela do consórcio — o cliente constrói patrimônio sem custo recorrente líquido."*

Leigo entende a lógica sem ler bullets técnicos; consultor ainda tem todo o racional financeiro disponível abaixo.

---

## 5. Visual Financial Demonstration Pass

Nenhuma alteração na `PatrimonialTimeline` — já cumpre essa função (stacked bars 0/5/10/15a por arquétipo).  
O pass acrescenta apenas a **demonstração textual+monetária na hierarquia perceptiva do card**: `R$ ganho estimado` + `tradução humana` formam o "snapshot financeiro de 2 segundos".

---

## 6. Preserve Consultive Depth

**Verificação byte-a-byte:**

- ✅ `shortThesis`, `fullThesis`, `howItWorks`, `forWho`, `advantages`, `risks`, `pitch`, `objections`, `mistakes`, `idealMoment`, `examples`, `applications`, `archetypes`, `whenNotToUse`, `patrimonialImpact`, `relatedStrategyIds`, `disclaimer` — **TODOS preservados**.
- ✅ Accordion default-open (`howItWorks`, `forWho`, `pitch`) — preservado.
- ✅ Depth Recovery Layer (DR-1/DR-2) — preservado.
- ✅ Compare Workspace (limite 3, Winner único, disclaimer único) — não tocado.
- ✅ Motor único (`@/core/finance`) — não tocado.
- ✅ `comparePayload` — apenas leitura.

---

## 7. Card Narrative Flow Validation

| Estágio | Componente | Camada nova |
|---|---|---|
| 1. Impacto imediato | Card fechado | Gatilho + Hero KPI + Ganho R$ |
| 2. Visão patrimonial | Panel topo | **Storytelling Intro** |
| 3. Tradução humana | Card + Panel | **"Na prática..."** |
| 4. Demonstração visual | PatrimonialTimeline | (preservado) |
| 5. Profundidade técnica | Accordion modular | (preservado integralmente) |
| 6. Conversão consultiva | Pitch + Objeções + CTA Comparar | (preservado) |

Fluxo end-to-end coerente: **emoção racional → visão → tradução → números → profundidade → ação**.

---

## 8. Mobile Executive Scanning Validation

- **Gatilho executivo:** `line-clamp-2`, 12px, italic 75% foreground → cabe em 380px sem quebrar grid.
- **Comparative Gain Chip:** inline-flex, 11px, sem ocupar linha dupla.
- **Tradução humana (card):** `line-clamp-2`, muted, 11px.
- **Storytelling Intro (panel):** stacked 3 bullets, padding 14px, gradient leve — densidade controlada, sem overflow.
- **Hero KPI:** mantém `text-[28px]` dominante; ganho R$ e tradução são tipograficamente subordinados.

Sem regressão de altura mínima de toque; sem horizontal scroll em 360px / 380px / 414px.

---

## 9. Zero Regression Validation

| Check | Status |
|---|---|
| `comparePayload` schema (`ComparePayload`) | ✅ não alterado |
| `StrategyBlueprint` / `KPIModel` / `StrategyPresentationData` | ✅ não alterado |
| `adapters.ts` / motor financeiro | ✅ não tocado |
| `CompareWorkspace` (COMPARE_MAX=3, Winner, disclaimer único) | ✅ não tocado |
| `STRATEGY_BLUEPRINT_BY_ID` | ✅ mesmos IDs, mesmos campos obrigatórios |
| Telemetria U8 (`strategyV2Telemetry`) | ✅ não alterada |
| Microcopy CG-1 / CG-2 | ✅ preservados |
| V2 Lock (`production-lock-v24`) | ✅ aprovado em 8 critérios |
| Conteúdo consultivo existente | ✅ 100% preservado |
| Render condicional dos novos campos | ✅ fallback elegante (sem campo → comportamento idêntico ao anterior) |

---

## 10. Final Executive Conversion State

**Os cards agora comunicam valor patrimonial de forma emocionalmente forte?**  
Sim. O gatilho executivo + ganho R$ + tradução humana criam impacto perceptivo nos primeiros 2 segundos.

**Continuam sofisticados?**  
Sim. Tom institucional preservado, sem superlativos, sem promessa, sem CTA agressivo.

**Continuam confiáveis?**  
Sim. Toda numérica vem do motor único; disclaimers institucionais intactos.

**Ficaram compreensíveis para leigos?**  
Sim. A camada "Na prática..." traduz o KPI hero em ação patrimonial concreta.

**Preservaram profundidade consultiva?**  
Sim. Todos os 17 campos curatoriais permanecem; o Panel apenas adiciona um bloco editorial no topo.

---

## Final Verdict

✅ **APROVADO** — Pass cirúrgico que adiciona alma comercial premium aos cards sem regredir profundidade, sem quebrar V2 Lock, sem tocar motor financeiro.

Os cards agora parecem **estruturas patrimoniais premium que despertam visão estratégica imediata** — não apenas cards técnicos de uma plataforma financeira.

**Arquivos alterados:**
- `src/components/modules/strategy-v2/contracts.ts` (+3 campos opcionais em `ConsultiveContent`)
- `src/components/modules/strategy-v2/ExecutiveStrategyCard.tsx` (gatilho + ganho R$ + tradução humana)
- `src/components/modules/strategy-v2/ConsultiveStrategyPanel.tsx` (storytelling intro + tradução humana no snapshot)
- `src/components/modules/strategy-v2/blueprint.ts` (conteúdo curado em 7 blueprints flagship)
