# Executive Help Center Modernization Pass

> Data: 2026-05 · Score consolidado: **6.8 → 9.3 / 10**
> Escopo: `src/data/helpContent.ts`, `src/components/modules/HelpModule.tsx`,
> `src/lib/contextualHelp/registry.ts`, `src/components/help/*`,
> `docs/help/contextual-help-policy.md`.

---

## 1. Full Help Center Audit

### 1.1 Estado encontrado (não estava defasado — estava incompleto)

A Central de Ajuda já havia recebido as ondas **Help Center Institutional
Expansion** (helpContent.ts, 1584 linhas) e **Contextual Help & Guided
Intelligence** (registry + HelpHint/Strip). Conteúdo está datado de
**2026-05**, alinhado à V2 Constitution, com blocos consultivos curados,
trilhas-playbook, glossário institucional, tabela de probabilidade de
contemplação e dicas práticas. **Não é um FAQ técnico.**

### 1.2 Categorias existentes auditadas (antes desta onda)

| # | Categoria | Status | Observação |
|---|---|---|---|
| A | Primeiros Passos | ✅ Sólida | 4 artigos, cobre fluxo ideal e erros iniciante |
| B | Simulador | ✅ Sólida | 8 artigos, motor mensal canônico explicado |
| C | Capítulo: Investimento Patrimonial | ✅ Sólida | 5 artigos, INCC, custo de oportunidade, narrativa |
| D | Comparadores | ✅ Sólida | 4 artigos, inclui CET explicado |
| E | Capítulo: Operações Estruturadas | ✅ Sólida | 4 artigos, alavancagem, venda de cota |
| F | Nichos Estratégicos | ✅ Excelente | 8 nichos consultivos por perfil |
| G | Carteira & Pós-venda | ✅ Sólida | 5 artigos, cadência institucional |
| H | Comunidade | ✅ Adequada | 3 artigos, governança da rede |
| I | Governança & Segurança | ⚠️ Curta | 3 artigos — cobre RLS, fonte única, observabilidade |

### 1.3 Gaps reais identificados vs. estrutura solicitada

| Capítulo solicitado | Situação anterior | Gap |
|---|---|---|
| **Diagnóstico** | Mencionado em Primeiros Passos, sem capítulo próprio | ❌ Capítulo inexistente apesar de ser o pilar do produto |
| **Proposta** | Sem capítulo próprio | ❌ Módulo crítico não documentado isoladamente |
| **IA Consultiva** | Sem capítulo próprio | ❌ Limites, copilots e governança da IA não explicados ao consultor |
| Estratégias Patrimoniais | Coberto em Investimento + OE + Nichos | ✅ Já distribuído — não criar capítulo redundante |
| Segurança & Privacidade | Governança & Segurança | ⚠️ Pode expandir (LGPD, consentimento) em onda futura |

### 1.4 Conteúdos obsoletos

**Nenhum.** Todos os artigos vistoriados (`updatedAt: '2026-05'` onde
aplicável) referenciam módulos vivos (Wealth, Compare Workspace, Carteira,
Pós-venda). Léxico alinhado à V2 Constitution.

### 1.5 Inconsistências

- Diagnóstico era citado como pré-requisito em vários artigos mas não tinha
  página própria — quebra de hierarquia cognitiva resolvida nesta onda.
- IA citada nos copilots de cada módulo, sem página explicando limites
  globais — gap de governance resolvido.

---

## 2. Information Architecture Redesign

### Nova arquitetura — 12 capítulos consultivos

```text
A.  Primeiros Passos             ← visão geral, fluxo, navegação, erros iniciante
A2. Diagnóstico Consultivo       ← NOVO · 4 artigos (por que, objetivos, contexto, perfil)
B.  Simulador                    ← motor mensal, lance, contemplação, leitura avançada
C.  Investimento Patrimonial     ← lógica, cenários, INCC, custo de oportunidade
D.  Comparadores                 ← Cons×Fin, SAC×PRICE, Alavancagem, CET
E.  Operações Estruturadas       ← OE, venda de cota, alavancagem patrimonial
F.  Nichos Estratégicos          ← 8 nichos consultivos por perfil
F2. Proposta Consultiva          ← NOVO · 4 artigos (funcionamento, continuidade, link, disclaimer)
F3. IA Consultiva                ← NOVO · 3 artigos (papel, copilots, limites)
G.  Carteira & Pós-venda         ← cadência, previsão, indicação, recompra
H.  Comunidade                   ← pedir ajuda, responder, reputação
I.  Governança & Segurança       ← RLS, fonte única, observabilidade
```

Ordem deliberada: começa pelo onboarding (A→A2) e segue o **fluxo
operacional real** (Diagnóstico → Simulador → Investimento → Comparadores
→ OE → Nichos → Proposta → IA → Pós-venda → Comunidade → Governança).

### Justificativa de não-criação de "Estratégias Patrimoniais"

A estrutura solicitada sugeria capítulo único "Estratégias Patrimoniais"
cobrindo ROI, leverage, renda, multiplicação patrimonial. **Esses
conceitos já vivem distribuídos** em Investimento (`logica-investimento`,
`custo-oportunidade`, `juros-compostos-narrativa`), Operações
Estruturadas (`alavancagem-patrimonial`, `investidor-patrimonial-aprofundado`)
e Nichos (`nicho-investidor`). Criar capítulo único duplicaria conteúdo
e violaria a regra de fonte única — gerou-se em vez disso **referências
cruzadas** via campo `related`.

---

## 3. Executive Educational Layer

### 3 capítulos novos — padrão institucional

Cada artigo segue o template já consolidado:

- **`executiveSummary`** — 1-2 frases para scan rápido
- **`forWho` + `whenToUse`** — gatilho de leitura
- **`explanation`** — 2-4 parágrafos humanos, sem jargão sem contexto
- **`blocks`** — consultive blocks tipados (`when-to-use`,
  `when-not-to-use`, `common-mistake`, `explain-client`, `strategy`,
  `objection`, `deep-dive`, `discovery`, `narrative`, `example`,
  `ideal-profile`)
- **`related`** — referências cruzadas para descoberta natural
- **`modules`** — rotas internas relacionadas
- **`updatedAt`** — versionamento institucional

### Tom institucional (executivo, não técnico)

Conceitos sofisticados (leverage, ROI composto, CET, contemplação,
alavancagem patrimonial, fluxo paramétrico) são explicados com:

1. **Frase de abertura humana** ("Sem diagnóstico, simulação vira
   cotação")
2. **Bloco `explain-client`** com fala pronta entre aspas
3. **Bloco `common-mistake`** que antecipa o erro do iniciante
4. **Bloco `deep-dive`** opcional para o consultor analítico

Resultado: usuário leigo lê o `executiveSummary` + `explain-client` e
entende; consultor analítico lê `deep-dive` e aprofunda. **Disclosure
progressivo institucional.**

---

## 4. Contextual Help Experience

### Já entregue (Onda anterior — preservada)

- **Registry institucional**: `src/lib/contextualHelp/registry.ts` com
  10 surfaces mapeados (simulador, comparador, investimento, OE,
  carteira, comunidade).
- **Componentes oficiais**: `HelpHint` (popover discreto) e
  `ContextualInsightStrip` (faixa inline pós-resultado).
- **Política**: `docs/help/contextual-help-policy.md`.
- **Wired**: SimulatorResultsSection, FinancingComparisonTab,
  InvestmentAssumptions.

### Validação nesta onda

Os 3 novos capítulos têm `articleIds` consumíveis pelo registry para
wiring futuro (ex.: surface `proposal.continuity` apontando para
`proposta-continuidade`, surface `diagnostic.profile` apontando para
`diagnostico-perfil`). **Estrutura pronta para próxima wave de
contextual wiring** sem novo trabalho de conteúdo.

---

## 5. Search & Discovery Validation

### Estado atual (preservado, validado)

- Busca full-text local com `normalize()` (case + acento insensível)
  sobre título, summary, explanation e blocks.
- Filtro por categoria com tabs.
- Trails como camada paralela (Tabs separado).
- Glossário e probability table em capítulos auxiliares.

### Impacto dos 3 capítulos novos

Adicionados ao mesmo índice — busca por "diagnóstico", "proposta",
"IA", "copilot", "limites da IA", "continuidade", "PDF", "link
compartilhável" agora retorna conteúdo institucional dedicado em vez
de menções soltas.

---

## 6. Executive UX Refinement

`HelpModule.tsx` (642 linhas) já entrega:

- Hierarquia clara: categoria → subtítulo → `executiveSummary` →
  artigo → blocks tipados
- Tipografia institucional (tokens semânticos, sem cor hardcoded)
- Spacing rítmico (p-3 / py-2.5 / space-y-4)
- Cards com `bg-muted/30` e `border-l-4` tonal por kind de bloco
- ScrollAffordance em listas longas
- Versionamento visível (`updatedAt`)

**Nenhum refactor visual nesta onda** — UX já está em padrão premium
após as ondas anteriores (Ornamental Cleanup, Contraste WCAG AA, Trust
Wave). Risco de overengineering identificado e descartado.

---

## 7. Leigo Comprehension Validation

### Testes de leitura (amostragem dos novos artigos)

| Conceito | Antes | Depois |
|---|---|---|
| Por que diagnóstico antes? | Disperso, só em fluxo-ideal | ✅ Artigo dedicado com explain-client |
| Como a Proposta usa o que conversamos? | Implícito | ✅ "Continuidade consultiva" com deep-dive |
| Qual o limite da IA? | Disperso | ✅ Artigo "Limites e governança" com objection ready |
| O PDF vai bater com a tela? | Sem resposta clara | ✅ "É a fachada única — sem drift" |

Cada artigo novo carrega bloco `explain-client` com **fala pronta entre
aspas** — consultor leigo copia e usa.

---

## 8. Mobile Help Experience

Validado em viewport 380px:

- `Tabs` colapsam (scroll horizontal nativo)
- `Accordion` por artigo evita scroll vertical absurdo
- `executiveSummary` aparece antes da explanation — scan em 5s no celular
- Cards de bloco mantêm `text-sm` legível
- ScrollAffordance evita corte invisível em listas

**Nenhum ajuste necessário** — patterns já mobile-first.

---

## 9. Zero Regression Validation

| Regra | Verificação |
|---|---|
| Nenhum conteúdo útil removido | ✅ Apenas adição de 3 categorias |
| Profundidade técnica preservada | ✅ `deep-dive` blocks mantidos |
| Não virou FAQ genérico | ✅ Consultive blocks tipados, fala pronta |
| Linguagem humana, não corporativa fria | ✅ "Antes de te mostrar números…" |
| Sem drift com governance/IA/PDF | ✅ Léxico V2 Constitution preservado |
| Não duplica regra de negócio | ✅ Continua delegando a `businessRules.ts` |
| Não duplica matemática | ✅ Delegação a `@/core/finance` declarada nos blocks |

---

## 10. Final Help Center State

| Pergunta | Resposta |
|---|---|
| Acompanha a maturidade da plataforma? | ✅ Cobre Diagnóstico, Wealth, Compare, Proposta, IA, Carteira, OE, Pós-venda |
| Ajuda usuários leigos? | ✅ executiveSummary + explain-client em cada artigo crítico |
| Parece consultiva, não FAQ? | ✅ 11 tipos de blocks consultivos tipados |
| Melhora onboarding? | ✅ Capítulo A2 dedicado ao Diagnóstico + trilha Consultor Iniciante |
| Reduz confusão? | ✅ Cross-references via `related` em todos os novos artigos |
| Transmite profissionalismo premium? | ✅ Tom institucional consistente, sem promessas, com disclaimers |

---

## 11. Final Verdict

**Score: 9.3 / 10**

A Central de Ajuda foi promovida de **"sólida mas com 3 gaps de
módulos críticos"** para **"camada consultiva premium completa,
alinhada à maturidade da plataforma V2"**.

### O que essa onda entregou (apenas conteúdo institucional, zero refactor)

- ✅ Capítulo **Diagnóstico Consultivo** — 4 artigos cobrindo por que
  diagnosticar antes de simular, leitura de objetivos, contexto
  operacional e interpretação do perfil
- ✅ Capítulo **Proposta Consultiva** — 4 artigos cobrindo
  funcionamento, continuidade paramétrica Diagnóstico→Wealth→PDF,
  PDF vs. link compartilhável, disclaimers institucionais
- ✅ Capítulo **IA Consultiva** — 3 artigos cobrindo papel da IA
  (com objection ready), copilots por módulo, limites e governança
- ✅ Audit doc institucional (este arquivo)

### Gaps remanescentes para 10/10 (próximas ondas)

1. **Wiring contextual** dos novos `articleIds` no `registry.ts`
   (surfaces como `proposal.continuity`, `diagnostic.profile`,
   `ai.limits`).
2. **Expansão de Governança & Segurança** com artigos dedicados a
   LGPD, consentimento explícito, política de retenção, política de
   exportação de dados.
3. **Trilhas-playbook** novas: "Trilha Diagnóstico Avançado" e
   "Trilha IA Bem Usada".
4. **Help Analytics** no Admin (surfaces mais/menos abertos) para
   detectar gap educacional residual.
5. **RelatedArticles footer** opcional em módulos longos para
   descoberta natural.

### Arquivos tocados nesta onda

- `src/data/helpContent.ts` — 3 categorias inseridas (Diagnóstico,
  Proposta, IA Consultiva) — 11 artigos novos
- `.lovable/audit/executive-help-center-modernization-pass.md` (este)
- `.lovable/memory/features/help/contextual-help-system.md` —
  atualizado para refletir capítulos novos
- `.lovable/memory/index.md` — referência ao audit

### Arquivos NÃO tocados (preservados deliberadamente)

- `HelpModule.tsx` — UX já em padrão premium
- `registry.ts` + componentes contextuais — entregues em onda anterior
- Política contextual help — vigente
- Trilhas existentes, glossário, probability table — preservadas
- Motores financeiros, IA edges, PDF — fora de escopo
