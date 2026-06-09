# Comunidade — Auditoria profunda

**Data:** 2026-05-12
**Escopo:** Módulo Comunidade (`CommunityModule`, `RequestCommunityHelpButton`, `useCommunity`, `community` service, `score.ts`, `anonymize.ts`).
**Premissa:** Diagnóstico-only. Não expandir nesta onda.

---

## 1. Diagnóstico conceitual — "o que esse módulo é?"

### 1.1 O que está implementado tecnicamente

- `community_cases` (título, resumo, payload anonimizado, status `aberto/resolvido/arquivado`, `is_private`, `source_kind`).
- `community_replies` com flag `is_ai`, `is_accepted`, contadores `helpful_count`/`not_helpful_count`.
- `community_reply_votes` com `util/nao_util` por usuário.
- `user_engagement` + `community_recompute_engagement(uuid)` calcula score determinístico → níveis 1–4 (Iniciante / Ativo / Colaborador / Referência).
- Permissões derivadas do nível: ver / criar / responder / votar / referência.
- Anonimização da proposta antes de virar caso (`anonymizeProposal`).
- Botão `RequestCommunityHelpButton` injetável em qualquer proposta da Carteira (memória `community-module-exposure`).

### 1.2 O que **não** está definido conceitualmente

- Não existe **declaração visível** de propósito. O subtitle do `ModuleHeader` diz apenas: *"Compartilhe casos com outros consultores"* — descritivo, não consultivo.
- Não há diferenciação entre: **fórum** vs **pedido de ajuda** vs **biblioteca de casos** vs **inteligência coletiva**. O usuário precisa inferir.
- O conceito real implementado é **"banco de casos consultivos com Q&A"**, mas não é nomeado nem ensinado em lugar nenhum da UI.

**Veredicto conceitual:** o módulo existe como arquitetura técnica madura, mas **não tem manifesto de propósito**. Sem manifesto, comportamento social não emerge.

---

## 2. Diagnóstico de onboarding

### 2.1 Primeira impressão ao entrar (estado atual)

A renderização atual em `/app` → Comunidade exibe, na ordem:

1. Header genérico ("Comunidade · Compartilhe casos com outros consultores").
2. **Painel de nível** ocupando ~120px de altura — mostra pontos, próximo nível e um copy condicionado:
   - Se nível 1: *"Use mais o simulador e crie propostas para liberar a Comunidade."*
   - Se nível 2: *"Você pode criar casos. Responda casos a partir do nível Colaborador."*
   - Se nível 3+: *"Você pode criar casos, responder e votar."*
3. Tabs `Abertos / Resolvidos / Meus casos` + busca.
4. Lista (frequentemente vazia) ou `EmptyStateMessage`.

### 2.2 Problemas

| # | Problema | Impacto |
|---|---|---|
| O1 | A primeira coisa que o usuário vê é **o próprio nível**, não os casos nem o propósito | Foco no eu, não na comunidade |
| O2 | O copy fala em "níveis" antes do usuário entender por que isso importa | Dissonância — gamificação sem narrativa |
| O3 | Nível 1 vê uma tela essencialmente bloqueada, sem caminho claro ("use mais o simulador") | Saída imediata; nunca volta |
| O4 | Nível 2+ vê empty state genérico ("Sem casos por aqui") quando filtro Aberto não traz nada | Comunidade parece morta |
| O5 | Não existe nenhum **tour** ou **walkthrough** de propósito ("Como funciona", "O que postar aqui") | Zero educação social |
| O6 | A funcionalidade de pedir ajuda mora **fora** do módulo (na Carteira), e isso não é dito aqui | Quem está dentro do módulo não sabe como abrir um caso |

**Veredicto de onboarding:** falha total em comunicar **propósito → mecânica → primeiro passo**. O usuário nível 1 sai. O nível 2+ não sabe como participar.

---

## 3. Diagnóstico de CTA

### 3.1 Mapeamento dos CTAs presentes

| CTA | Localização | Visibilidade | Affordance |
|---|---|---|---|
| **Pedir ajuda** (sobre uma proposta) | `RequestCommunityHelpButton` na Carteira → ProposalCardContent | Externa ao módulo | Média — botão `outline` `sm` no rodapé do card |
| Abrir caso da lista | `<button>` envolvendo `<Card>` | Dentro | Implícita — sem rótulo visual |
| Responder | Composer no detalhe do caso | Dentro | Boa |
| Votar | Ícones thumbs no detalhe | Dentro | Boa |
| Marcar resolvido | Botão no detalhe (autor) | Dentro | Boa |

### 3.2 O que está faltando — crítico

- ❌ **Não existe CTA "Pedir ajuda" dentro do módulo Comunidade.** Quem entra direto no módulo não tem como criar caso. Precisa sair, ir à Carteira, abrir uma proposta, achar o botão.
- ❌ **Não existe CTA "Ajude alguém agora"** apontando para casos abertos sem resposta.
- ❌ **Não existe hierarquia visual de CTA principal.** O painel de nível domina o topo, e o que falta é exatamente um botão dominante ("Abrir um caso").
- ❌ **Não existe estado "novo!"** ou contagem de casos sem resposta para puxar atenção.

**Veredicto CTA:** o ato fundamental ("pedir ajuda") não tem CTA dentro do próprio módulo. Isso por si só explica metade do baixo engajamento.

---

## 4. Diagnóstico de publicação de caso

### 4.1 Fluxo atual

1. Usuário **sai** da Comunidade.
2. Vai à Carteira.
3. Abre uma proposta.
4. Encontra "Pedir ajuda da comunidade" no card.
5. Dialog abre com título e resumo **pré-preenchidos** pela `anonymizeProposal`.
6. Toggle privado opcional.
7. Submete.

### 4.2 Pontos fortes

- Anonimização automática é excelente (LGPD + remoção de fricção).
- Pré-preenchimento de título e resumo reduz drasticamente o esforço.
- Botão privado dá controle.

### 4.3 Pontos fracos

| # | Ponto | Impacto |
|---|---|---|
| P1 | **Caso só nasce a partir de uma proposta da Carteira** | Impossível abrir caso "geral" sobre dúvida de processo, abordagem ou cliente sem proposta |
| P2 | Botão fica enterrado no card da proposta — descoberta acidental | Maioria nunca vê |
| P3 | Sem categoria/tag selecionável (consortium_type/stage vêm da proposta automaticamente, não escolhíveis) | Impossível classificar tipo de ajuda buscada |
| P4 | Sem campo "o que você já tentou" / "qual ajuda específica espera" | Resumo fica genérico |
| P5 | Sem preview de "quem vai ver" ou "quanto tempo médio para resposta" | Sem expectativa social |

**Resposta à pergunta-chave**: *"um gerente conseguiria abrir um caso em segundos?"* — **Sim, se já estiver em uma proposta.** **Não, se entrou direto na Comunidade.**

---

## 5. Diagnóstico de visibilidade social — CRÍTICO

### 5.1 Sinais sociais existentes

- `reply_count` no card (ícone + número).
- Badge `resolvido` quando aplicável.
- Badge `meu` para casos próprios.
- Badge `IA` em respostas de IA.
- Badge `resposta destacada`.

### 5.2 Sinais sociais ausentes — gap dominante

| Sinal | Existe? | Impacto da ausência |
|---|---|---|
| "Sem resposta há X dias" | ❌ | Casos morrem sem alguém perceber |
| "Urgente" / "alguém precisa de ajuda" | ❌ | Zero tração emocional |
| "Aberto há poucas horas" / "novo!" | ❌ | Sem freshness signal |
| Avatar/iniciais de quem ajudou (mesmo anônimo) | ❌ | Comunidade parece desabitada |
| Contagem de "pessoas online" / "ativos hoje" | ❌ | Não há sensação de vida |
| "X consultores estão olhando este caso" | ❌ | Sem prova social |
| Notificação push/in-app de novo caso | ❌ | Quem responderia nunca fica sabendo |
| Resumo no Cockpit ("3 casos aguardando ajuda") | ❌ | Comunidade não participa do feed central |
| Filtro "Sem resposta" | ❌ | Helper não consegue achar quem precisa |
| Ordenação por urgência | ❌ | Tudo igualmente esquecível |

**Veredicto visibilidade:** a comunidade está estruturalmente invisível. **Quem precisa de ajuda não é visto. Quem ajudaria não é avisado.** Esta é a causa-raiz #1 do baixo engajamento.

---

## 6. Diagnóstico de engajamento

### 6.1 Por que alguém ajudaria, hoje?

- Possivelmente: **+4 pts no engajamento** quando recebe `helpful` em uma resposta.
- Possivelmente: progressão para nível Referência (rótulo).
- **Não há nada além disso.**

### 6.2 Faltam motivadores básicos

| Motivador | Estado |
|---|---|
| Senso de impacto ("você ajudou X pessoas este mês") | ❌ |
| Reconhecimento público leve (anônimo, mas com nickname/iniciais) | ❌ |
| Especialização contextual ("você responde bem sobre Imóveis") | ❌ |
| Notificação de "alguém precisa de ajuda no seu domínio" | ❌ |
| Histórico das próprias respostas e impacto | ❌ |
| Streak / cadência ("3 dias ajudando") | ❌ |

**Veredicto engajamento:** o sistema de níveis existe mas é **invisível para quem responde**. O destaque "Referência" não é exibido em nenhuma resposta. O score só aparece para o próprio usuário.

---

## 7. Diagnóstico de estrutura social

| Aspecto | Estrutura atual | Adequada para comunidade consultiva? |
|---|---|---|
| Feed | Lista linear de casos por data desc | Funciona, mas sem priorização social |
| Threads | Flat (caso → respostas), sem nested | OK para Q&A consultivo |
| Comentários a respostas | ❌ Inexistente | Falta para contraponto consultivo |
| Solução aceita | ✅ "Resposta destacada" pelo autor | Bom |
| Follow-up | ❌ Não há "atualização do caso" pelo autor | Perde-se aprendizado coletivo |
| Histórico | ✅ Casos preservados em "Resolvidos" e "Meus" | OK |
| Subscrição/notificação | ❌ Sem follow de caso | Quem se interessa nunca volta |

**Veredicto estrutura:** modelo Q&A clássico está bem implementado. **Faltam camadas finas** (comentários, follow-up, subscrição) que sustentam continuidade.

---

## 8. Diagnóstico de UX social

| Critério | Estado | Observação |
|---|---|---|
| Densidade do card | OK | 3 linhas + meta |
| Hierarquia visual | Fraca | Painel de nível compete com a lista |
| Destaque de urgência | ❌ | Nenhum |
| Destaque de ajuda pendente | ❌ | Nenhum |
| Sinalização de atividade recente | ❌ | Apenas data simples |
| Distinção "novo" vs "antigo" | ❌ | Visualmente idênticos |
| Diferenciação caso aberto sem resposta vs com resposta | Fraca | Só contagem |

---

## 9. Diagnóstico de estados vazios — CRÍTICO

### 9.1 Estado vazio atual (lista)

```
Sem casos por aqui
Use o botão "Pedir ajuda" em uma proposta da sua Carteira para abrir um caso anônimo.
```

### 9.2 Problemas

- A mensagem **delega para outro módulo** sem oferecer atalho clicável.
- Nenhuma seed social ("Aqui você encontra dúvidas reais sobre…").
- Nenhuma demonstração de caso de exemplo.
- Nenhum incentivo emocional ("3 casos foram resolvidos esta semana").
- Nível 1 vê isto e a frase "Use mais o simulador" — **dois empty-states acumulados**.

**Veredicto estados vazios:** estados vazios atuais **confirmam que não há nada** em vez de **convidar a iniciar comportamento**. Eles destroem ativação.

---

## 10. Diagnóstico de copy

| Frase atual | Problema | Sugestão de tom |
|---|---|---|
| "Compartilhe casos com outros consultores" | Descritivo, frio, abstrato | "Discuta clientes reais com quem já passou pela mesma situação" |
| "Sem casos por aqui" | Constata ausência | "Seja o primeiro a abrir um caso esta semana" |
| "Use mais o simulador para liberar" | Burocrático | "Faltam X simulações para você participar" |
| "Você pode criar casos, responder e votar" | Lista de permissões | "Você é Colaborador. Sua resposta destacada vale para a comunidade inteira" |
| "Responder casos é liberado a partir do nível Colaborador" | Bloqueio frio | "Responda em breve — faltam X pts (ajude votando enquanto isso)" |

**Veredicto copy:** copy é **operacional/sistêmico**, não **humano/consultivo**. Não desperta nem orgulho de ajudar nem urgência de pedir.

---

## 11. Diagnóstico de arquitetura conceitual

### 11.1 Comportamento que a plataforma tenta estimular (inferido do código)

- Anonimizar dados de cliente → criar caso → receber respostas → marcar destacada.
- Subir de nível ao usar a plataforma e receber `helpful`.

### 11.2 Comportamento que **deveria** estimular para virar comunidade consultiva viva

| Comportamento desejado | Como o módulo o suporta hoje |
|---|---|
| **Pedir ajuda em segundos** sobre cliente difícil | Parcialmente (precisa estar em proposta) |
| **Validar estratégia** antes de abordar cliente | ❌ Não há "pedir validação" |
| **Trocar abordagens** sobre objeções comuns | ❌ Sem categorização |
| **Discutir operação** (regras, processos, dúvidas) | ❌ Sem categoria fora de proposta |
| **Inteligência coletiva** sobre grupos/contemplação | ❌ Não cruza com Bids/Assemblies |
| **Mentorar** consultor júnior | ❌ Sem identificação de senioridade |

**Veredicto arquitetura conceitual:** o módulo foi desenhado para **um único caso de uso** (peço ajuda sobre uma proposta) e não cobre os outros 5 comportamentos consultivos relevantes.

---

## 12. Oportunidades prioritárias

### 12.1 Quick wins (≤ 1 dia de trabalho cada)

| QW | Mudança | Ganho esperado |
|---|---|---|
| QW1 | **Botão dominante "Abrir um caso"** no topo do módulo (acima da lista) — abre dialog com escolha entre "sobre cliente da Carteira" ou "dúvida operacional" | Ativação imediata |
| QW2 | **Filtro "Sem resposta"** + ordenação default por casos abertos sem resposta há mais tempo | Helpers encontram quem precisa |
| QW3 | **Badge "aguardando ajuda há Xd"** no card quando `reply_count === 0` e idade > 24h | Urgência social |
| QW4 | **Badge "novo"** quando idade < 12h | Freshness |
| QW5 | Reescrita de subtitle, painel de nível e empty states (copy humana) | Tom consultivo |
| QW6 | Painel de nível **colapsado** por default (`<details>`) — devolve o palco para a lista | Hierarquia visual |
| QW7 | Empty state com **3 casos de exemplo seedados** + CTA principal | Educação + ativação |

### 12.2 Evoluções estruturais (1–3 dias cada)

| EV | Mudança | Ganho |
|---|---|---|
| EV1 | Permitir **caso "geral"** sem origem em proposta (categorias: abordagem, objeção, processo, grupo, outro) | Abre 5x os casos de uso |
| EV2 | Notificação in-app no sininho ao novo caso na sua especialidade | Resposta rápida |
| EV3 | Resumo "X casos aguardando ajuda" no Cockpit Consultivo | Comunidade entra no fluxo central |
| EV4 | Subscrever ("seguir caso") com notificação na resposta | Continuidade |
| EV5 | Mostrar nível do respondente nos cards de resposta (sem identificar pessoa) | Confiança social |
| EV6 | "Você ajudou X consultores este mês" no painel pessoal | Senso de impacto |

### 12.3 Maturidade social avançada (não nesta onda)

- Especialização inferida ("responde bem sobre Imóveis").
- Streak de ajuda.
- Caso destacado da semana (curadoria leve).
- Bot de IA propondo primeira resposta enquanto humano não chega (já parcialmente existe via `is_ai`).

---

## 13. Arquitetura social ideal (target)

```
┌──────────────────────────────────────────────────────────────┐
│ Comunidade — Aqui consultores reais ajudam consultores reais │
├──────────────────────────────────────────────────────────────┤
│ [+ Abrir um caso]                  [3 casos sem resposta →] │
├──────────────────────────────────────────────────────────────┤
│ Filtros: Tudo · Sem resposta (3) · Novos (2) · Resolvidos    │
├──────────────────────────────────────────────────────────────┤
│ 🔴  Cliente quer abater lance — vale a pena?       sem resp │
│     há 2 dias · Imóvel · 0 respostas                         │
│ 🟢  Como abordar quem já tem consórcio?            2 resp   │
│     há 6h · Abordagem · novo                                 │
│ ✓   Reduzir parcela ou prazo? (resolvido)          5 resp   │
└──────────────────────────────────────────────────────────────┘
                                                 [▾ Seu nível]
```

Princípios:
- **CTA dominante** para abrir caso.
- **Pedidos sem resposta** ganham destaque e contagem.
- **Painel de nível** vai para o rodapé recolhido.
- **Categorias** explícitas (não só consortium_type).
- **Tom humano** no header.

---

## 14. Before / After conceitual

### Before
- Módulo passivo, abre na própria gamificação.
- Pedido de ajuda só nasce de proposta na Carteira.
- Casos sem resposta morrem invisíveis.
- Helpers nunca sabem que alguém precisa.
- Empty state confirma o vazio.
- Copy operacional/burocrática.

### After (visão alvo)
- Módulo abre com **CTA dominante** e **lista priorizada por urgência social**.
- Caso pode nascer **dentro da Comunidade** (geral) **ou** da Carteira (contextual).
- Casos sem resposta destacados com badge de espera.
- Notificação in-app traz helper quando alguém precisa.
- Empty state vira convite + casos de exemplo.
- Copy humana e consultiva.
- Cockpit mostra "3 consultores precisando de ajuda agora".
- Nível do respondente aparece nas respostas → prova social.

---

## 15. Score final do módulo Comunidade

| Dimensão | Nota (0–10) | Justificativa |
|---|---|---|
| Backend & modelo de dados | 9 | Cases, replies, votos, anonimização, score: maduro |
| Anonimização & LGPD | 9 | `anonymizeProposal` excelente |
| Permissões & níveis | 7 | Existe mas é invisível para quem responde |
| Onboarding | 3 | Sem propósito declarado, sem walkthrough, painel de nível antes da lista |
| CTA | 3 | Não há CTA de "abrir caso" dentro do módulo |
| Publicação de caso | 6 | Excelente quando parte da proposta; impossível em outros casos |
| Visibilidade social | 2 | Sem urgência, sem espera, sem freshness, sem prova social |
| Engajamento de helpers | 3 | Nada chama helper; nada reconhece quem ajuda |
| Estados vazios | 2 | Confirmam o vazio em vez de induzir comportamento |
| Copy & tom | 4 | Descritivo, frio, sistêmico |
| Estrutura Q&A | 7 | Sólida, faltam comentários e follow-up |
| Integração com restante da plataforma | 4 | Bom no botão "pedir ajuda"; ausente no Cockpit, sininho, navegação |

**Score consolidado: 4.9 / 10 — backend pronto, comportamento social inexistente.**

---

## 16. Conclusão

O módulo Comunidade tem **arquitetura técnica madura** (cases, replies, votos, anonimização, scoring determinístico, permissões em RLS) mas **falha em transformar essa estrutura em comportamento social**. A causa-raiz é dupla:

1. **Pedido de ajuda mora fora do módulo.** Quem entra direto na Comunidade não tem como pedir ajuda — apenas observar.
2. **Quem precisa de ajuda é estruturalmente invisível.** Sem urgência, sem espera, sem notificação, sem destaque, sem ordenação por necessidade.

Sem essas duas correções, qualquer outra evolução (categorias, mentor, gamificação) é prematura. Os **7 quick wins** propostos endereçam exatamente esses dois eixos, custam pouco e devem multiplicar a ativação antes de qualquer mudança estrutural.

**Princípio orientador para a próxima onda:**
> A Comunidade não precisa parecer rede social.
> Precisa parecer **uma sala onde alguém está pedindo ajuda agora — e você pode entrar e ajudar em 30 segundos.**
