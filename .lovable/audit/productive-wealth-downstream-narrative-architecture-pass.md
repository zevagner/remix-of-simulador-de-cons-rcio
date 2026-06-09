# Productive Wealth Downstream Narrative Architecture Pass

**Escopo:** desenhar a árvore narrativa completa que precisaria existir
**antes** de introduzir as duas raízes produtivas no Diagnóstico —
sem implementação, sem alteração de código. Continuação direta de
`.lovable/audit/diagnostic-objective-tree-productive-wealth-audit.md`.

**Pergunta-mãe:** as raízes "Estruturar patrimônio produtivo" e
"Expandir operação" sobrevivem ao trajeto Diagnóstico → Cockpit →
Wealth → Compare → Proposal → Abordagem **sem perder coerência
consultiva** e **sem virar um "modo agro" paralelo**?

---

## 1. Productive Root Narrative Design

### 1.1 Raiz A — "Estruturar patrimônio produtivo"

| Atributo                | Valor                                                        |
|-------------------------|--------------------------------------------------------------|
| enum proposto           | `patrimonio_produtivo`                                       |
| Label                   | Estruturar patrimônio produtivo                              |
| Emoji                   | 🌱                                                           |
| Tese consultiva         | "Transformar capital de giro e ativos operacionais em patrimônio durável e transmissível." |
| Verbo de intenção       | **Estruturar** (não comprar, não trocar)                     |
| Eixo patrimonial        | Acumulação produtiva + consolidação familiar                 |
| Sub-objetivos (3, máx)  | `estruturacao_rural` · `maquinas_implementos` · `sucessao_consolidacao` |

### 1.2 Raiz B — "Expandir operação"

| Atributo                | Valor                                                        |
|-------------------------|--------------------------------------------------------------|
| enum proposto           | `expandir_operacao`                                          |
| Label                   | Expandir operação                                            |
| Emoji                   | 📈                                                           |
| Tese consultiva         | "Aumentar capacidade produtiva e ROI operacional via aquisição estruturada de ativos geradores de caixa." |
| Verbo de intenção       | **Expandir** (não comprar, não substituir)                   |
| Eixo patrimonial        | Crescimento operacional + alavancagem produtiva              |
| Sub-objetivos (3, máx)  | `frota_pesados` · `sede_galpao` · `capacidade_produtiva`     |

### 1.3 Diretrizes semânticas (lock)

- **Sempre verbo de intenção + objeto patrimonial.** Nunca SKU.
- Proibido: "Agro", "Caminhão", "Máquina" como rótulo raiz.
- A raiz A é **acumulação/consolidação**. A raiz B é **crescimento
  operacional**. Distinção análoga a `imovel_moradia` vs
  `imovel_investimento` no eixo PF.
- Sub-objetivos podem usar nomes mais concretos (ex.: "Frota e
  pesados") porque já estão dentro de uma raiz consultiva
  contextualizada.

---

## 2. Downstream Journey Mapping

Trajeto canônico do sinal `objetivoPrincipal`:

```
Diagnóstico (objetivoPrincipal + subObjetivo)
   │
   ├─► ClientJourneyContext        (payload consultivo unificado)
   ├─► adaptive/profile.ts         (ConsultiveProfile.objective)
   ├─► decisionEngine.ts           (recommendedPath)
   ├─► strategyContextScoring.ts   (boost de flagships por contexto)
   │
   ├─► Cockpit                     (pitches, próximos passos, hints)
   ├─► Wealth Library              (ranking de teses)
   │     └─► ConsultiveStrategyPanel (flagship visível)
   ├─► CompareWorkspace            (winners + insights por tese)
   ├─► ProposalPdfModule           (templates + tom narrativo)
   ├─► Abordagem (Objections/Triggers/Funnel/Storytelling)
   ├─► Copilots (module-copilot, sales-copilot, sales-script,
   │              phase-action, niche-storytelling)
   └─► PDFs (proposalTemplates, createStorytelling, labels)
```

**Toques mínimos exigidos por nova raiz** (contrato downstream):

| Camada                             | O que precisa mudar                                        | Custo |
|------------------------------------|-------------------------------------------------------------|-------|
| `DiagnosticContext`                | +2 entradas em `OBJETIVO_PRINCIPAL_OPTIONS`, 2 grupos em `SUB_OBJETIVO_OPTIONS`, 2 defaults em `DEFAULT_SUB_OBJETIVO`, 6 entradas em `SUB_OBJETIVO_TEXTO` (`getSubObjetivoTexto`) | Baixo |
| `adaptive/profile.ts`              | Novo case → `objective: 'produce'` (novo enum) ou `'grow'` para B; comfort/sophistication ajustados | Médio |
| `decisionEngine.ts`                | Novas R-rules: raiz A → `consorcio_estrutural` (auto/imob conforme sub-obj); raiz B → `consorcio_pesados/comercial` | Médio |
| `strategyContextScoring.ts`        | +2 boosts: `patrimonio_produtivo` → `['agronegocio','patrimonio-rural','leverage-patrimonial','sucessao']`; `expandir_operacao` → `['renovacao-frota','equipamentos-pesados','expansao-produtiva']` (todos já existem hoje, ver §5) | **Baixo** |
| `proposalTemplates.ts`             | +2 tonalidades narrativas (estruturação patrimonial / expansão produtiva) | Médio |
| `createStorytelling.ts`            | +2 arquétipos de história (produtor que consolidou terra; transportadora que renovou frota) | Médio |
| `centralAI` + edges                | Payload já leva `objetivoPrincipal` cru — basta os edges respeitarem novos enums no system prompt (1 linha por edge) | Baixo |
| `ClientJourneyContext`             | Nenhum schema break — campo é string aberta downstream     | Zero  |
| `ProposalPdfModule` / `labels.ts`  | +2 labels legíveis (`labels.ts`)                            | Baixo |
| `Cockpit` pitches                  | +2 pitches consultivos curtos                               | Baixo |

**Total real:** ~10 arquivos, ~150-200 linhas de conteúdo (não engine).
**Risco:** zero matemático; risco narrativo se algum contrato downstream
for esquecido (gera incoerência tipo "Wealth recomenda imóvel
residencial para produtor rural").

---

## 3. Productive Wealth Recommendation Design

Recomendações esperadas por raiz (composto via
`strategyContextScoring`):

### Raiz A — "Estruturar patrimônio produtivo"

Boost natural para teses existentes:

- `leverage-patrimonial` — alavancagem como vetor de acumulação.
- `multiplicacao-cotas` — multiplicação patrimonial via cotas.
- `agronegocio` — já existe na taxonomia (linha 53 do scoring).
- `patrimonio-rural` — já existe (linha 53).
- `escada-patrimonial` — para consolidação progressiva.
- `sucessao` (potencial flagship nova) — fechamento de ciclo familiar.

### Raiz B — "Expandir operação"

Boost natural para teses existentes:

- `renovacao-frota` — flagship multiplicacao-ativos.
- `equipamentos-pesados` — flagship multiplicacao-ativos.
- `expansao-produtiva` — flagship multiplicacao-ativos.
- `usar-carta-investir` — operação que libera capital de giro.

### Regra de cruzamento com `subObjetivo`

| Raiz                    | Sub                       | Boost adicional sugerido           |
|-------------------------|---------------------------|------------------------------------|
| patrimonio_produtivo    | estruturacao_rural        | `patrimonio-rural`, `agronegocio`  |
| patrimonio_produtivo    | maquinas_implementos      | `agronegocio`, `equipamentos-pesados` |
| patrimonio_produtivo    | sucessao_consolidacao     | `leverage-patrimonial`, `escada-patrimonial` |
| expandir_operacao       | frota_pesados             | `renovacao-frota`, `equipamentos-pesados` |
| expandir_operacao       | sede_galpao               | `imovel-comercial` (existir?) ou `compra-a-vista` comercial |
| expandir_operacao       | capacidade_produtiva      | `expansao-produtiva`, `multiplicacao-cotas` |

**Importante:** todas as teses puxadas **já existem** ou já têm
flagships designadas (§5). A expansão produtiva é majoritariamente
trabalho de **roteamento**, não de criação de estratégia nova.

---

## 4. Consultive Storytelling Validation

Validação de fala consultiva em cada touchpoint:

### Cockpit pitch (sample)
- A: "Você quer transformar sua operação em patrimônio. Vamos
  estruturar isso com cartas de crédito e alavancagem patrimonial."
- B: "Expandir produção exige capital sem travar caixa. Veja como o
  consórcio acelera frota, equipamento e sede operacional."

### Wealth panel (tese)
- A: "Patrimônio produtivo é construído com decisões de longo prazo.
  Cartas de crédito permitem consolidar terra, máquina e sucessão
  sem comprometer capital operacional."
- B: "Cada ativo produtivo adquirido com lance e contemplação
  estratégica multiplica a capacidade de geração de caixa antes do
  ciclo de capital próprio."

### Storytelling (arquétipo PF→Produtivo)
- A: produtor que consolidou três talhões em 4 anos via consórcio
  rural e blindou sucessão familiar.
- B: transportadora que renovou frota usando carta de crédito sem
  tomar financiamento bancário.

### Validação:
- ✅ Linguagem permanece consultiva (intenção + impacto patrimonial).
- ✅ Sem jargão segmentado ("agronegócio", "B2B", "PJ") nos rótulos
  raiz; jargão fica em sub-objetivo quando necessário.
- ✅ Continuação natural do tom usado em "Investimento financeiro"
  e "Imóvel para investimento".

---

## 5. Flagship Strategy Impact Analysis

`mem://features/strategy/flagship-discoverability-layer` define
9 flagships, das quais **5 já cobrem o eixo produtivo**:

| Tese                   | Flagship existente              | Cobre raiz |
|------------------------|----------------------------------|------------|
| multiplicacao-ativos   | Multiplicação de Cotas           | A          |
| multiplicacao-ativos   | Renovação de Frota               | B          |
| multiplicacao-ativos   | Expansão Produtiva               | B          |
| multiplicacao-ativos   | Agro                             | A          |
| multiplicacao-ativos   | Pesados                          | B          |

**Conclusão crítica:** o lado de **execução** (estratégias) já está
maduro. O gap é puramente de **entrada narrativa** (diagnóstico não
oferece raiz que conecte a essas flagships sem distorção).

**Novas flagships sugeridas (opcional, NÃO obrigatório para v1):**
- A: "Sucessão Produtiva" — único vácuo real; teria que respeitar
  DRL Differentiation (max 1 flagship por tese, então entraria como
  *application* dentro de `multiplicacao-ativos` ou `traditional`).
- B: nenhuma — cobertura já satura o limite.

Recomendação: **não criar flagship nova na v1**. Apenas conectar.

---

## 6. Wealth & Proposal Continuity Analysis

### Wealth
- `StrategyLibrarySection` já consome `objetivoPrincipal` para
  contextualizar (linha 197 do scoring). Aceitar 2 enums novos é
  aditivo, não breaking.
- ConsultiveStrategyPanel renderiza tese + applications já cobertas
  pelas 5 flagships produtivas existentes.
- Compare permanece COMPARE_MAX=3 — produtor compara Frota vs
  Multiplicação vs Compra à Vista sem alteração estrutural.

### Proposal
- `proposalTemplates.ts` precisa de 2 *tonalidades* novas (não 2
  templates) — apenas variação do prompt/copy que muda de "seu
  imóvel" para "seu patrimônio produtivo".
- `createStorytelling.ts` ganha 2 arquétipos.
- `labels.ts` ganha 2 entradas legíveis para PDF.
- `pdfPayload` é agnóstico — nenhum bloco quebra; gates relaxados
  (mem PDF Block Gates) absorvem mesmo se algum sub-bloco estiver
  vazio.

### Continuidade
- `ClientJourneyContext` carrega `objetivoPrincipal` cru → Wealth
  → Compare → Proposal sem perda. Já existe mecanismo
  (`wealth-to-proposal-parametric-continuity`).
- Tom consultivo permanece linear: Diagnóstico fala "estruturar",
  Wealth ranqueia patrimônio produtivo, Proposta narra
  estruturação, Abordagem usa storytelling produtivo. **Zero
  costura visível.**

---

## 7. Enterprise & Agro Positioning Review

- **Agro:** entra como sub-objetivo `estruturacao_rural` dentro de
  Raiz A. Não como "modo". Estratégias `agronegocio` e
  `patrimonio-rural` já existem e ganham fluxo de entrada.
- **Frota/transportes:** entra como sub-objetivo `frota_pesados`
  dentro de Raiz B. Flagships existentes cobrem.
- **PJ urbana / sede comercial:** entra como `sede_galpao` em B.
  Pode reaproveitar `imovel_investimento` storytelling com tom
  comercial.
- **Sucessão produtiva:** sub-objetivo `sucessao_consolidacao` em
  A. Cobertura editorial; estratégia executável via leverage.
- **Sem necessidade de:** modo enterprise, wizard PJ, abas
  dedicadas, dashboard agro. Tudo organicamente absorvido na
  arquitetura consultiva existente.

---

## 8. Cognitive Load & UX Validation

- Hoje: 6 nós raiz. Adicionar 2 → **8 nós** (grid 2×4 / 4×2). Limite
  aceitável validado em §7 da auditoria anterior.
- Mobile 380px: 8 nós em grid 2×4 com card 168×88 ainda escana.
  Acima de 8 quebra scanning → **lock em 8**.
- Sub-objetivos por raiz: máximo 3 (já é a regra atual). Total de
  sub-objetivos cresce de 18 → 24, mas só são vistos *depois* da
  escolha de raiz, ou seja, **carga cognitiva por step permanece
  constante**.
- Sem dropdown, sem "Ver mais", sem agrupamento visual extra
  (separador "Pessoal/Produtivo" é tentação mas adiciona
  hierarquia — recusar na v1).
- ConsultiveStrategyPanel, Compare, Cockpit: nenhuma mudança de
  densidade — apenas conteúdo novo no mesmo wrapper.

**Veredito UX:** absorvível sem nenhuma regressão perceptiva.

---

## 9. Implementation Readiness Review

| Dimensão                            | Status                    |
|-------------------------------------|---------------------------|
| Narrativa raiz (label + tese)       | ✅ Pronta                  |
| Sub-objetivos definidos             | ✅ Pronta                  |
| Mapping `subObjetivoTexto`          | ✅ Pronta (6 entradas)     |
| Boost em `strategyContextScoring`   | ✅ Pronta (todas teses existem) |
| Rota em `decisionEngine`            | ⚠️ Precisa 1 sessão (definir paths `consorcio_estrutural` vs reaproveitar `consorcio_imobiliario` para A com sub rural) |
| Enum `ConsultiveProfile.objective`  | ⚠️ Decisão pendente: criar `'produce'` ou reaproveitar `'grow'` para B e `'acquire'` para A |
| Tonalidades em `proposalTemplates`  | ⚠️ Copy precisa ser redigida (2 tons) |
| Arquétipos em `createStorytelling`  | ⚠️ 2 narrativas precisam ser escritas |
| Flagship nova "Sucessão"            | ❌ NÃO bloqueia v1; deferir |
| Tests downstream                    | ⚠️ Adicionar casos em `decisionEngine.test.ts` para 2 novas raízes |

**Conclusão:** maduro arquiteturalmente, **2 decisões pendentes**
(enum profile + paths decisionEngine) e **3 entregas de copy**
(tonalidades + arquétipos + pitches). Estimativa: 1 wave focada,
zero risco de regressão matemática (V2 Constitution intacta).

---

## 10. Zero Regression Validation

- Nenhum arquivo de código alterado nesta passada.
- `OBJETIVO_PRINCIPAL_OPTIONS`, `decisionEngine`, `adaptive/profile`,
  `strategyContextScoring`, `proposalTemplates`,
  `createStorytelling`, `ClientJourneyContext`, `ProposalPdfModule`
  permanecem byte-idênticos.
- V2 Product Constitution respeitada: nenhuma proposta viola os 8
  critérios (necessidade real ✅, mínimo toque ✅, hierarquia ✅,
  elegância ✅, engine única ✅, governança ✅, mobile 380px ✅,
  reversibilidade ✅).
- DRL Differentiation respeitada: zero nova flagship na v1;
  reaproveitamento das 5 flagships produtivas existentes.
- Production Lock V2.4: alteração proposta é **aditiva ao
  Diagnóstico** (não locked) e **conteúdo downstream** (não locked).
  Áreas locked (`core/finance`, `WealthPlatformModule`,
  `ConsultiveStrategyPanel`, `CompareWorkspace`,
  `strategyExecutiveKpis`, `ViabilityPreview`) **não recebem nenhum
  toque estrutural**.

---

## 11. Final Narrative Architecture State

| Camada                                  | Cobertura produtiva após v1 |
|-----------------------------------------|------------------------------|
| Diagnóstico (raiz)                      | ✅ 2 raízes consultivas      |
| Diagnóstico (sub-objetivo)              | ✅ 6 sub-objetivos novos     |
| `getSubObjetivoTexto`                   | ✅ Frases padronizadas       |
| ConsultiveProfile                       | ✅ Mapeamento explícito      |
| decisionEngine                          | ✅ Path produtivo            |
| Wealth ranking                          | ✅ Boost para teses produtivas |
| Wealth flagships                        | ✅ 5 flagships já cobrem     |
| Compare                                 | ✅ Sem mudança estrutural    |
| Proposal templates                      | ✅ 2 tonalidades             |
| Storytelling                            | ✅ 2 arquétipos              |
| Cockpit pitches                         | ✅ 2 pitches                 |
| PDFs                                    | ✅ Labels + payload OK       |
| Copilots (edges)                        | ✅ Reaproveitam enum cru     |
| Mobile UX                               | ✅ 8 nós ≤ limite            |
| Engine matemática                       | ✅ Intocada                  |

---

## Final Verdict

A arquitetura downstream **absorve organicamente** as duas raízes
produtivas. Não há necessidade de:

- ❌ Modo "agro" isolado.
- ❌ Modo "enterprise" / "B2B" paralelo.
- ❌ Wizard PJ dedicado.
- ❌ Nova flagship na v1 (5 já cobrem).
- ❌ Alteração em áreas locked V2.4.

Há necessidade de:

- ✅ 2 raízes consultivas com tese clara (Estruturar / Expandir).
- ✅ 6 sub-objetivos novos.
- ✅ Boost em `strategyContextScoring` (uma única função,
  determinística).
- ✅ Path em `decisionEngine` (2 ramos).
- ✅ Decisão de enum em `adaptive/profile` (1 ou 2 valores novos).
- ✅ 2 tonalidades + 2 arquétipos + 2 pitches consultivos.
- ✅ Atualização de `getSubObjetivoTexto` (6 entradas).
- ✅ Casos em `decisionEngine.test.ts`.

**Implementation readiness:** **maduro para wave única** após
fechar:
1. Enum em `adaptive/profile` (`'produce'` novo vs reaproveitar
   `'acquire'`/`'grow'`).
2. Convenção de path em `decisionEngine` (criar
   `consorcio_estrutural` / `consorcio_operacional` ou reaproveitar
   `consorcio_imobiliario`/`pesados` com nuance).
3. Aprovação dos labels finais das 2 raízes.

Resolvido isso, a wave de implementação é **aditiva, reversível em
1 commit, sem toque em engine, sem toque em áreas locked**.

**O sistema deixa de ser PF-urbano sem virar plataforma agro.**
É a plataforma consultiva patrimonial que sempre foi — agora com a
intenção produtiva visível no ponto certo da jornada.
