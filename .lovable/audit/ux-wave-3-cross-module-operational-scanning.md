# UX Wave 3 — Cross-Module Operational Scanning

**Data:** 2026-05-15
**Escopo:** continuidade operacional perceptiva entre Carteira ↔ Pós-venda (e fundação para Análise → Proposta)
**Restrição:** zero alteração em lógica financeira, providers, hooks de cálculo, runtime ou Supabase.

---

## 1. Diagnóstico — quebras de continuidade identificadas

| # | Quebra | Sintoma | Origem |
|---|--------|--------|--------|
| Q1 | **Carteira → Pós-venda**: ao fechar uma proposta no Kanban, não há ponte visual para acompanhar o cliente no Pós-venda. O usuário precisa abrir o Sidebar, mudar de módulo, localizar o cliente novamente. | Reconstrução mental: "Quem era esse cliente? Em que estágio do Pós-venda ele está?" | `ProposalCardContent.tsx` (cards `status === 'fechado'`) |
| Q2 | **Pós-venda → Carteira**: aberto o detalhe de um cliente, não há ponte para a proposta de origem (mesmo com `proposal_id` no schema). | Usuário precisa fechar o sheet, navegar para Carteira, filtrar por nome. | `PostSaleClientDetail.tsx` (header) |
| Q3 | **Hierarquia de scanning fragmentada**: cada módulo usa primitivas diferentes para "próximo passo cross-module" — alguns usam `<Button>`, outros texto, outros nada. | Sem padrão visual reconhecível, o usuário não sabe onde olhar para "saltar de contexto". | Ausência de primitiva compartilhada |

> **Não-quebras** (validadas): `useModuleNavigation()` já existia e roteia corretamente, `<NextStepCTA>` já guia a jornada Análise → Proposta dentro do funil de venda, e o `ModuleNavigationProvider` cobre toda a árvore `/app`.

---

## 2. Princípio aplicado

> **"O sistema deve parecer uma plataforma única, não múltiplos dashboards independentes."**

A continuidade é entregue por **uma única primitiva visual** (`<CrossModuleLink>`), reusável em qualquer contexto onde o conteúdo carregue um próximo passo lógico em outro módulo.

---

## 3. Execução

### 3.1 Nova primitiva: `<CrossModuleLink>`
- Arquivo: `src/components/shared/CrossModuleLink.tsx`
- 100% **apresentacional**: zero estado, zero efeito, zero cálculo. Consome apenas `useModuleNavigation()` (já provido em `/app`).
- 2 variantes visuais semanticamente equivalentes:
  - `inline` — texto + seta, para uso dentro de copy ou descrições
  - `chip` — pill discreto com borda primary/25, para headers e cards
- Ícone único (`ArrowRight`) e tom institucional (`text-primary`) — assina visualmente "saída para outro módulo".

### 3.2 Pontes implementadas

| De | Para | Quando | Componente alvo | Variante |
|----|------|--------|----------------|----------|
| **Carteira** (card Kanban) | **Pós-venda** | `proposal.status === 'fechado'` | `ProposalCardContent.tsx` (chip "Acompanhar no Pós-venda" logo após o bloco financeiro) | `chip` |
| **Pós-venda** (detalhe do cliente) | **Carteira** | sempre que o sheet de detalhe abre | `PostSaleClientDetail.tsx` (chip "Ver na Carteira" no header, abaixo do meta-line) | `chip` |

Cada ponte transporta `data-source` (`pipeline-card-fechado` / `post-sale-detail`) para futura telemetria de fricção cross-module — sem custo presente no runtime.

### 3.3 Continuidade já existente (mantida intacta)

- **Análise → Proposta**: `useModuleNavigation` + `recommendation` payload (Investment → Proposta) já entrega contexto no destino — preservado, nada tocado.
- **Cockpit / NextStepCTA**: jornada principal já consultiva — preservado.
- **JourneyGuideBanner**: rodapé contextual existente — preservado.

---

## 4. Padronização de scanning (sem duplicação)

A primitiva força um **único vocabulário visual** para "saltar de módulo":
- **Cor:** `text-primary` + `border-primary/25` + `bg-primary/5` — institucional, nunca destrutivo.
- **Forma:** pill (`rounded-full`) ou texto+seta — sempre com `ArrowRight`.
- **Voz:** verbo no infinitivo + módulo destino ("Ver na Carteira", "Acompanhar no Pós-venda"). Nunca "Clique aqui", nunca CTAs marketing.

Resultado: ao ver o chip em qualquer módulo, o usuário **reconhece instantaneamente** o gesto "ir para outro contexto", reduzindo a curva de scanning de novo módulo para zero.

---

## 5. Preservações (princípio absoluto)

| Aspecto | Status |
|--------|--------|
| Lógica financeira / engines / `@/core/finance` | ✅ intacta |
| Providers / hooks / runtime | ✅ nenhum novo provider; novo componente apenas consome hook existente |
| Supabase / RLS / queries | ✅ não tocado |
| Identidade local de cada módulo (KPIs, tom editorial, copy específica) | ✅ preservada — o chip é discreto e nunca compete com o conteúdo |
| Densidade inteligente | ✅ uma única linha extra por contexto — sem duplicar dados |
| Performance | ✅ componente é stateless, sem efeitos, sem listeners; render trivial |
| Mobile | ✅ chip se adapta (`max-w-[180px]`) — não invade área tátil |

---

## 6. Validação

### Fluxo Carteira → Pós-venda
1. Abrir `Carteira` → encontrar uma proposta `fechado` (ou mover uma para fechado).
2. O chip **"Acompanhar no Pós-venda →"** aparece dentro do card, logo após o valor.
3. Clique → roteia para o módulo Pós-venda (scroll-top suave, mesmo provider, sessão preservada).

### Fluxo Pós-venda → Carteira
1. Abrir `Pós-venda` → clicar em qualquer cliente → o sheet de detalhe abre.
2. No header, abaixo do meta-line (consórcio · valor · prazo), o chip **"Ver na Carteira →"** está disponível.
3. Clique → roteia para Carteira preservando filtros e seleção de aba.

### Scanning cross-module
- O mesmo chip institucional aparece em ambos os contextos → padrão visual unificado.
- Voz consistente: verbo + módulo destino, sem ruído.
- Nenhum overlay, nenhum breadcrumb adicional, nenhum mega-nav — apenas continuidade contextual.

---

## 7. Arquivos alterados

- **Criado:** `src/components/shared/CrossModuleLink.tsx` (primitiva)
- **Editado:** `src/components/modules/postSale/PostSaleClientDetail.tsx` (header com chip "Ver na Carteira")
- **Editado:** `src/components/modules/pipeline/ProposalCardContent.tsx` (cards `fechado` com chip "Acompanhar no Pós-venda")

Nenhum arquivo de lógica/cálculo/contexto/edge tocado.

---

## 8. Roadmap futuro (fora desta wave)

Pontes adicionais que a primitiva já habilita, sem custo arquitetural:

- **Pós-venda detail → Análise**: "Simular novo cenário pós-contemplação" (chip no `Lances` tab).
- **Carteira card prospect → Análise**: "Reabrir simulação" quando há `simulation_data` salva.
- **Pipeline metrics modal → Carteira**: "Filtrar essa coorte" (deep-link com filtros).
- **PostSaleAlerts (críticos) → Carteira**: chip inverso para abrir ficha histórica.

Cada um adiciona apenas um `<CrossModuleLink>` no componente alvo. Zero refatoração, zero novo provider.

---

## 9. Impacto esperado

- **Fricção Carteira ↔ Pós-venda:** **−2 cliques** (Sidebar → módulo → busca por nome → cliente) por contexto cross.
- **Reconstrução mental:** o usuário sai do módulo já sabendo para onde está indo (verbo + destino explícitos).
- **Coesão visual:** uma única assinatura de "salto cross-module" em todo o app — base para padronizar scanning em ondas futuras.
- **Risco de regressão:** **mínimo** — adições isoladas (1 chip por contexto) usando hook já consagrado; nenhum estilo competidor alterado.
