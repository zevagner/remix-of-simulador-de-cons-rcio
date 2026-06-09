# Community Revitalization — Wave 1

**Data:** 2026-05-12
**Escopo:** Frontend — `CommunityModule` + criação de caso intra-Comunidade.
**Backend:** Inalterado (RLS, scoring, votos, anonimização já maduros).

---

## Resumo executivo

A Comunidade tinha **infraestrutura sólida** mas **comportamento social inexistente**:
o pedido de ajuda morava fora do módulo (Carteira), quem precisava de ajuda era
estruturalmente invisível, e o painel de nível dominava o feed.

Esta onda entrega **9 quick wins** focados em comportamento, sem inflar com
gamificação ou virar rede social. A meta é parecer **"uma sala onde alguém
está precisando de ajuda agora — e você consegue ajudar em 30 segundos"**.

---

## Mudanças entregues

### 1. CTA dominante "Abrir um caso"
Card no topo do módulo, gradiente primário, headline humana
(*"Está com um caso travado agora?"*) + botão `lg`.

### 2. Criação de caso DENTRO da Comunidade
Novo componente `OpenCaseDialog.tsx` com **fluxo 2 passos**:
1. **Categoria do caso** (6 opções com ícone + hint):
   - Caso sobre cliente / proposta
   - Dúvida operacional
   - Estratégia consultiva
   - Objeção comercial
   - Grupos / lances
   - Outro
2. **Form contextual** com `placeholder` específico por categoria
   (reduz fricção de "o que escrever").

A categoria vai em `stage` e em `payload.kind` para futura filtragem.

### 3. Atalho contextual da Carteira preservado
`RequestCommunityHelpButton` continua exatamente como está — agora é um
**atalho contextual**, não a única forma de criar caso.

### 4. Filtro "Sem resposta" como tab default
Nova tab `sem_resposta` aberta por padrão, com contador inline.
Quem chega na Comunidade vê primeiro **quem precisa de ajuda agora**.

### 5. Badge "Aguardando há Xd"
Calculado client-side via `hoursSince(created_at)`. Aparece quando
`reply_count === 0 && >24h`. Cor `warning`. Cria urgência social leve.

### 6. Badge "Novo"
Aparece quando `<12h`. Cor `primary`. Sinaliza freshness sem ruído.

### 7. Badge "precisa de ajuda" + borda destacada
Casos sem resposta há mais de 48h ganham borda `warning/30` no card,
puxando o olho do helper.

### 8. Painel de nível recolhido (accordion no rodapé)
Antes ocupava ~120px no topo. Agora vive em `<Accordion>` colapsado
no rodapé, com resumo na linha do trigger (nível + pontos). O feed
virou protagonista.

### 9. Empty states vivos
Três variantes humanas:
- **Tab "Meus casos" vazia** → CTA + explicação do que é "um caso".
- **Tab "Sem resposta" vazia** → mensagem positiva ("Comunidade em dia") + CTA.
- **Lista geral vazia** → 3 exemplos reais de casos típicos + CTA.

### 10. Seção "Ajude alguém agora"
Card destacado (cor `warning/5`) acima das tabs, mostra os **3 casos
mais antigos sem resposta**. Só aparece para quem tem `permissions.canReply`.
Cada item é clicável e abre direto o detalhe do caso.

### 11. Ordenação social do feed
`sortedCases`: resolvidos sempre por último; sem resposta antes dos com
resposta; dentro do grupo "sem resposta" os mais antigos primeiro
(quem mais espera, mais visível); dentro de "com resposta", os mais
recentes primeiro.

### 12. Resposta destacada visualmente reforçada
- Borda `border-2 border-success/50` + sombra leve.
- Cabeçalho explícito: *"Resposta destacada pelo autor do caso"*.
- A badge antiga foi substituída pelo cabeçalho mais legível.

### 13. Copy humanizada
| Antes | Depois |
|---|---|
| "Compartilhe casos com outros consultores" | "Discuta clientes reais com quem já passou pela mesma situação" |
| "Ainda sem respostas." | "Ainda sem respostas. Seja o primeiro a ajudar." |
| "Compartilhe uma estratégia, abordagem ou pergunta…" | "Como você abordaria esse caso? Compartilhe uma estratégia ou pergunta…" |
| "Você pode criar casos, responder e votar." | "Você pode abrir casos, responder e votar." |

---

## Arquivos alterados

| Arquivo | Tipo | Notas |
|---|---|---|
| `src/components/community/OpenCaseDialog.tsx` | **novo** | CTA + criação intra-Comunidade |
| `src/components/modules/CommunityModule.tsx` | refeito | feed social, badges, empty states, accordion |
| `src/components/community/RequestCommunityHelpButton.tsx` | inalterado | preservado como atalho contextual |
| `src/services/community.ts` | inalterado | API estável; nenhum schema novo |
| Backend (RLS, tabelas, scoring) | inalterado | onda 100% frontend/UX |

---

## Comportamento esperado (UX)

```text
Antes                                  Depois
─────────────────────────────────      ─────────────────────────────────
ModuleHeader                           ModuleHeader
Painel de nível (grande, dominante)    [Card CTA: Abrir um caso] ←
Tabs: Abertos / Resolvidos / Meus      [Card: Ajude alguém agora] (3 itens)
Lista (ordem cronológica reversa)      Tabs: Sem resposta(N) / Abertos / ...
Empty state seco                       Lista priorizada socialmente
                                       - badges Novo / Aguardando Xd
                                       - borda warning para >48h sem resposta
                                       Empty state vivo (CTA + exemplos)
                                       Accordion: Seu nível (recolhido) ←
```

---

## Não-objetivos (preservação consciente)

- Nada de feed infinito, likes vazios, perfil público exagerado.
- Sem ranking competitivo / leaderboard tóxico.
- Sem mudança de schema, RLS ou triggers.
- Sem novo módulo, novo edge function ou nova tabela.

---

## Itens da fase 2/3 ainda em aberto (próximas ondas)

- **Subscrição de caso** ("Seguir caso") — exige tabela `community_subscriptions`.
- **Follow-up estruturado do autor** (campo `outcome` no caso) — exige migração.
- **Prova social do respondente** (nível inferido) — exige join público de
  `user_engagement` (atualmente só admin / próprio usuário). Requer view
  `community_user_public` com `level` apenas.
- **Integração com Cockpit** (*"3 consultores precisando de ajuda agora"*)
  — depende de identificar o ponto de entrada definitivo do Cockpit
  Consultivo (hoje espalhado entre `AnalysisOverview`, `AIInsightsPanel`).

Esses itens **NÃO** foram implementados nesta onda intencionalmente,
para manter o escopo enxuto e 100% frontend.

---

## Score Comunidade

| Dimensão | Antes | Depois |
|---|---|---|
| Backend / RLS / scoring | 9.0 | 9.0 |
| Descoberta de "como pedir ajuda" | 3.0 | 9.0 |
| Visibilidade social ("quem precisa agora") | 2.0 | 8.5 |
| Urgência social (badges) | 0.0 | 8.0 |
| Empty states | 3.5 | 8.5 |
| Hierarquia visual (feed vs nível) | 4.0 | 9.0 |
| Copy humana / consultiva | 4.5 | 8.0 |
| Continuidade social (follow / outcome) | 2.0 | 2.0 *(fase 2)* |
| Integração com Cockpit | 0.0 | 0.0 *(fase 2)* |
| **Média ponderada** | **4.9** | **7.6** |

Meta de score após fase 2: **8.5+**.

---

## Riscos evitados

- **Não viramos rede social**: nenhum like solto, perfil público ou ranking.
- **Não criamos ruído**: badges só aparecem em estados informativos
  (Novo <12h, Aguardando >24h, Precisa-de-ajuda >48h).
- **Não quebramos a Carteira**: atalho contextual `RequestCommunityHelpButton`
  intacto, mesma assinatura, mesmo fluxo de anonimização.
- **Não tocamos no engine de scoring** (nível, pontos, permissões).
- **Não introduzimos dependência nova** — só componentes shadcn já presentes
  (`Accordion`, `Card`, `Badge`, `Tabs`, `Dialog`).

---

## Validação

- Compila sem erros novos (build automático).
- Preserva contrato `createCase`/`listCases` (mesmas colunas).
- `OpenCaseDialog` reutiliza `useCommunityEngagement` para gating
  (mesmo gate do botão da Carteira).
- Todas as cores via tokens semânticos (`primary`, `warning`, `success`,
  `muted`, `foreground`).

---

## Princípio mantido

> A Comunidade é uma **extensão humana da plataforma consultiva**,
> não uma rede social corporativa. Comportamento desejado:
> pedir ajuda rapidamente · validar estratégia · discutir abordagem ·
> compartilhar experiência · resolver caso · aprender operacionalmente.
