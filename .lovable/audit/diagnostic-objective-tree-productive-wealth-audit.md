# Diagnostic Objective Tree & Productive Wealth Gap Audit

**Escopo:** auditoria pura da árvore de objetivos do Diagnóstico e do
impacto downstream — **sem implementação**. Pergunta-mãe: o objetivo
inicial do usuário cobre adequadamente patrimônio produtivo
(agro, frota, expansão operacional, sucessão PJ) ou ainda é uma árvore
PF-urbana disfarçada?

Fontes auditadas:
- `src/components/modules/diagnostic/DiagnosticContext.tsx`
  (`OBJETIVO_PRINCIPAL_OPTIONS`, `SUB_OBJETIVO_OPTIONS`,
  `DEFAULT_SUB_OBJETIVO`)
- `src/utils/decisionEngine.ts` (mapeamento objetivo → caminho)
- `src/lib/adaptive/profile.ts` (`ConsultiveProfile.objective`)
- `src/components/modules/wealth/strategyContextScoring.ts`
  (boost por `objetivoPrincipal`)
- `src/services/proposals/proposalTemplates.ts`,
  `src/services/createStorytelling.ts`, `src/services/centralAI.ts`
- `src/components/layout/ClientJourneyContext.tsx`,
  `src/components/modules/objections/*`, `src/hooks/useModuleCopilot.ts`

---

## 1. Full Objective Tree Audit

### 1.1 Árvore atual (canônica)

`OBJETIVO_PRINCIPAL_OPTIONS` (6 nós):

| # | enum                  | label                       | Sub-objetivos                                  |
|---|-----------------------|-----------------------------|------------------------------------------------|
| 1 | `imovel_moradia`      | Imóvel para moradia         | compra · reforma · construção                  |
| 2 | `imovel_investimento` | Imóvel para investimento    | aluguel · valorização                          |
| 3 | `troca_imovel`        | Trocar de imóvel            | compra · reforma · construção                  |
| 4 | `veiculo`             | Veículo                     | primeiro · profissional · upgrade              |
| 5 | `troca_veiculo`       | Trocar de carro             | primeiro · profissional · upgrade              |
| 6 | `investimento`        | Investimento financeiro     | patrimônio · proteção · aposentadoria          |

### 1.2 Coerência e redundância

- **Redundância semântica real:** `imovel_moradia` vs `troca_imovel`
  (mesmos 3 sub-objetivos); `veiculo` vs `troca_veiculo` (mesmos 3).
  Tecnicamente o "trocar" só altera narrativa (gancho de saída), não
  altera engine, schedule ou estratégia. → custo cognitivo +2 itens
  com payoff narrativo baixo.
- **Sub-objetivo `uso_profissional`** dentro de `veiculo` é o **único
  toque produtivo** da árvore inteira — escondido em sub-seleção
  opcional. Não propaga para `decisionEngine`, `strategyContextScoring`
  nem `proposalTemplates`.
- **`investimento` financeiro** roteia para "caminho financeiro, não
  consórcio de bem" (`decisionEngine.ts:78-84`). É o único nó que
  representa intenção patrimonial pura — porém PF clássica (carteira /
  reserva / aposentadoria).

### 1.3 Profundidade consultiva

- Tese consultiva real cobre: **moradia, troca de moradia, renda
  imobiliária, mobilidade pessoal, acumulação financeira PF**.
- Tese consultiva ausente: **produção, operação, ativos geradores de
  caixa empresarial, sucessão produtiva**.

---

## 2. Productive Wealth Gap Analysis

Cobertura atual por vetor patrimonial produtivo:

| Vetor produtivo                          | Coberto hoje? | Por onde?                                    |
|------------------------------------------|---------------|----------------------------------------------|
| Agro / rural / fazenda                   | ❌            | Nenhum objetivo, nenhum sub-objetivo         |
| Máquinas e implementos                   | ❌            | —                                            |
| Frota / caminhões / pesados              | ⚠️ parcial    | `veiculo.uso_profissional` (genérico)        |
| Expansão operacional PJ                  | ❌            | —                                            |
| Imóvel comercial / galpão / sede         | ⚠️ parcial    | `imovel_investimento.aluguel` (genérico)     |
| Sucessão produtiva / patrimônio familiar | ❌            | —                                            |
| Crescimento patrimonial empresarial      | ❌            | —                                            |

Observações:
- `clientSituation` tem `pj-custo-alto`, e `OBJECTIVE_OPTIONS` (campo
  legado) tem `negocio-pj`, mas **nenhum desses se conecta ao
  `objetivoPrincipal` consultivo novo** — vivem isolados em rama
  legada (`clientObjective`/`clientSituation`) e não alimentam
  `decisionEngine`, `adaptive/profile`, `strategyContextScoring`
  nem `proposalTemplates` do caminho consultivo principal.
- Resultado: o sinal "PJ produtivo" existe na coleta mas é
  **órfão downstream**. A árvore principal é PF-urbana de fato.

**Verdict parcial:** lacuna estrutural real em patrimônio produtivo —
não é só "falta uma label Agro", é falta de **eixo patrimonial
produtivo** na taxonomia.

---

## 3. Downstream Impact Analysis

`objetivoPrincipal` alimenta diretamente:

| Consumer                                 | Uso                                                                 | Comportamento sem cobertura produtiva |
|------------------------------------------|---------------------------------------------------------------------|---------------------------------------|
| `decisionEngine.ts`                      | Decide caminho (consórcio bem vs investimento financeiro)          | Cliente produtivo cai em "consórcio genérico de bem" sem nuance |
| `adaptive/profile.ts`                    | Deriva `ConsultiveProfile.objective` (acquire/upgrade/preserve/grow)| Produção → cai como `acquire` PF      |
| `wealth/strategyContextScoring.ts`       | Boost de relevância de estratégias                                  | Não há boost para Frota/Agro/Expansão; flagships produtivas ficam sub-rankeadas |
| `proposalTemplates.ts` / `createStorytelling.ts` | Narrativa do PDF/WhatsApp                                  | Tom permanece "comprar imóvel/carro"; perde linguagem de produção |
| `centralAI` / `module-copilot` / `objections/*` | Contexto enviado ao LLM                                    | IA infere intuitivamente; não há sinal estruturado de "produtivo" |
| `ClientJourneyContext`                    | Continuidade entre módulos                                          | Continuidade preservada, mas com rótulo errado                |

**Risco:** adicionar `agro` como label solta sem propagar nas 6 camadas
acima cria **incoerência consultiva** (Diagnóstico fala agro, Wealth
ranqueia imóvel residencial, Proposta narra "sair do aluguel"). Esse
é exatamente o cenário a evitar.

---

## 4. Consultive Language Consistency

Padrão atual: **intenção patrimonial** ("Imóvel para investimento",
"Investimento financeiro"), nunca categoria de produto ("Carro",
"Apartamento"). Exceções: `Veículo` e `Trocar de carro` já tendem ao
genérico produto — vestígio de catálogo.

Diretriz a preservar em qualquer expansão:
- **Verbo de intenção + objeto patrimonial**, ex.: "Expandir
  capacidade produtiva", "Estruturar patrimônio rural".
- **Proibido:** "Agro", "Frota", "Máquinas", "Caminhão" como rótulo
  raiz — são produtos, não teses. Servem como sub-objetivo.

---

## 5. Productive Objective Design (proposta — NÃO implementar)

Adicionar **no máximo 2 nós raiz produtivos** (mantém 6→8 e respeita
hierarquia mobile). Cada nó com 2-3 sub-objetivos enxutos:

### Proposta A — "Estruturar patrimônio produtivo"
*(cobre agro + imóvel rural + sucessão produtiva)*

- 🌱 Estruturação rural (terra / benfeitoria / sede)
- 🚜 Máquinas e implementos
- 🧬 Sucessão / consolidação familiar

### Proposta B — "Expandir operação"
*(cobre frota, equipamento pesado, expansão PJ)*

- 🚛 Frota e veículos pesados
- 🏭 Galpão / sede operacional
- 📈 Capacidade produtiva (equipamento + ativo gerador)

### Renomeações sugeridas (opcional, custo zero)
- `veiculo` → "Mobilidade pessoal" (separa claramente de frota).
- Fundir `imovel_moradia` + `troca_imovel` em uma raiz "Moradia"
  com sub-objetivo "troca" (reduz redundância, abre 1 slot).

Resultado-alvo: **6 nós (após fusão) ou 7-8 nós (sem fusão)** —
nunca >8.

---

## 6. User Journey Coherence Validation

Cenário-teste: produtor rural pediria consórcio para colheitadeira.

- Hoje: escolhe `veiculo` → sub `uso_profissional`. Wealth recomenda
  "Upgrade de veículo" (consumer). Proposta narra mobilidade pessoal.
  Storytelling fala "primeiro carro". **Incoerência total.**
- Com Proposta A+B: escolhe "Expandir operação" → "Máquinas". Wealth
  pode ranquear "Multiplicação de cotas pesados" e flagship de frota
  já existentes. Proposta narra patrimônio produtivo. Coerência ✓.

A árvore atual **fragmenta** esse usuário; expansão consultiva
**enriquece**, não fragmenta — desde que cada nó novo tenha
mapeamento downstream nas 6 camadas (seção 3).

---

## 7. Hierarchy & Cognitive Load Audit

- 6 nós hoje em grid 2×3 ou 3×2 — leitura confortável em 380px.
- Adicionar 2 nós produtivos → 8 nós (grid 2×4 ou 4×2). Limite
  superior aceitável; **9+ exige agrupamento visual** (separador
  "Patrimônio pessoal" / "Patrimônio produtivo").
- Se fusão moradia/troca-imóvel for adotada: 5 + 2 = 7. Ideal.
- **Proibido**: dropdown, accordion ou "Ver mais" no diagnóstico raiz
  — quebraria scanning e percepção premium.

---

## 8. Future Enterprise Scalability Review

- B2B/agro real exigirá no futuro: campo "tipo de operação" (PF/PJ
  rural/PJ urbana) e capacidade produtiva (faturamento anual,
  hectares, frota atual). **Não introduzir agora** — primeiro
  validar o eixo patrimonial produtivo na árvore raiz.
- Sucessão produtiva e holding familiar são casos pós-MVP — devem
  caber como **sub-objetivo** de "Estruturar patrimônio produtivo",
  não como raiz dedicada.
- Path de escala: raiz produtiva → sub-objetivos → (futuro) wizard
  PJ opcional dentro do diagnóstico, só quando raiz produtiva for
  escolhida. Mantém simplicidade PF intacta.

---

## 9. Zero Regression Validation

- Nenhum código foi alterado nesta auditoria.
- `OBJETIVO_PRINCIPAL_OPTIONS`, `SUB_OBJETIVO_OPTIONS`,
  `DEFAULT_SUB_OBJETIVO`, `decisionEngine`, `adaptive/profile`,
  `strategyContextScoring`, `proposalTemplates`,
  `createStorytelling`, `ClientJourneyContext` permanecem
  byte-idênticos.
- Production Lock V2.4 respeitado: nenhuma proposta aprova mudança
  sem antes passar pelos 8 critérios do `production-lock-v24`
  (necessidade real, mínimo toque, hierarquia, elegância, engine
  única, governança, mobile 380px, reversibilidade).

---

## 10. Final Diagnostic Architecture State

| Dimensão                                  | Estado                                                |
|-------------------------------------------|-------------------------------------------------------|
| Cobertura PF urbana                       | ✅ Forte                                              |
| Cobertura patrimônio produtivo            | ❌ Lacuna estrutural                                  |
| Cobertura agro/rural                      | ❌ Zero                                               |
| Cobertura frota/equipamento operacional   | ⚠️ Sinal frágil em sub-objetivo `uso_profissional`    |
| Cobertura expansão PJ / sucessão          | ❌ Zero                                               |
| Coerência narrativa downstream            | ✅ Para PF · ❌ Para produtivo                        |
| Linguagem consultiva (intenção, não SKU)  | ✅ (com leve desvio em "Veículo"/"Trocar de carro")   |
| Carga cognitiva atual                     | ✅ 6 nós, scanning ok                                 |
| Folga para expansão (até 8 nós)           | ✅ 2 slots disponíveis                                |
| Redundância removível (moradia+troca)     | ⚠️ Opção segura de fusão libera 1 slot extra         |

---

## Final Verdict

**A árvore atual NÃO cobre patrimônio produtivo. É uma taxonomia
PF-urbana consistente, mas estruturalmente incompleta para agro,
frota produtiva, expansão operacional e sucessão patrimonial PJ.**

A lacuna **não se resolve adicionando "Agro"** — isso seria categoria
de produto solta, incoerente com o restante da árvore (intenções
patrimoniais) e ainda criaria incoerência downstream (Wealth,
Proposta, IA continuariam tratando como PF).

**Recomendação arquitetural (a validar antes de implementar):**

1. **Introduzir 2 raízes produtivas consultivas:**
   - "Estruturar patrimônio produtivo" (agro / terra / máquinas /
     sucessão).
   - "Expandir operação" (frota / sede operacional / capacidade).
2. **Opcionalmente fundir** `imovel_moradia` + `troca_imovel` para
   manter ≤8 nós e abrir respiro visual.
3. **Antes de qualquer label nova**, mapear obrigatoriamente nas 6
   camadas downstream (seção 3) — caso contrário, gera incoerência
   pior do que a lacuna atual.
4. **Manter linguagem de intenção** ("Estruturar…", "Expandir…"),
   nunca categoria de produto.
5. **Cada nó produtivo** precisa de: ≥1 boost em
   `strategyContextScoring`, ≥1 ramo em `decisionEngine`,
   tonalidade própria em `proposalTemplates`/`createStorytelling`,
   sinal estruturado em `adaptive/profile` (`objective: 'produce'`
   ou similar novo).

**Próximo passo recomendado:** *Productive Objective Design Pass* —
detalhar contratos downstream de cada nó novo antes de tocar
`DiagnosticContext.tsx`. Implementação fica bloqueada até esse
contrato existir.
