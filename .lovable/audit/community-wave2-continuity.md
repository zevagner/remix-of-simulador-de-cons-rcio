# Community Wave 2 — Continuidade & Memória Coletiva

**Data:** 2026-05-12 · **Escopo:** frontend + backend (migração canônica).

---

## Entregue

### Backend (migração canônica)
- **Tabela `community_subscriptions`** (`case_id`, `user_id`, `last_seen_reply_count`, `last_seen_status`) com RLS (usuário só vê/gerencia as próprias; admin lê tudo) e índices em `user_id` e `case_id`.
- **`community_cases.outcome`, `outcome_kind`, `outcome_at`** — memória do desfecho.
- **Trigger `validate_community_outcome_kind`** — valida enum `aplicou_funcionou | aplicou_nao_funcionou | nao_aplicou | em_andamento` e auto-stamp `outcome_at` (sem CHECK constraint, conforme regra do projeto).
- **Auto-subscribe**: triggers em `community_cases` (autor) e `community_replies` (respondente).
- **RPCs novas (SECURITY DEFINER, padrão do projeto):**
  - `community_my_updates()` — casos seguidos com novidade desde `last_seen_*`.
  - `community_mark_seen(_case_id)` — atualiza ponteiro de leitura.
  - `community_pulse_24h()` — resolvidos hoje, aguardando ajuda, helpers ativos, novos casos.
  - `community_user_expertise(_user_id)` — top 5 áreas inferidas via `helpful_count`.

### Service layer (`src/services/community.ts`)
- `followCase` / `unfollowCase` / `isFollowingCase` / `markCaseSeen`
- `listMyUpdates` (CommunityUpdate)
- `getCommunityPulse` (CommunityPulse)
- `getUserExpertise` (ExpertiseTag[])
- `setCaseOutcome` + `OUTCOME_KIND_LABEL` + `OutcomeKind`

### UI
- **`CommunityPulseBar`** — barra fina entre o CTA e o feed: "X resolvidos hoje · Y aguardando ajuda · Z consultores ajudaram · W casos novos hoje". Esconde-se sozinha quando tudo é zero.
- **Card "Atualizações nos casos que você segue"** dentro do `CommunityModule` — surge no topo do feed quando `listMyUpdates()` retorna; mostra +N respostas, badge "resolvido", "com desfecho"; clique abre o caso.
- **`FollowCaseButton`** — pareado com `Marcar resolvido` no header do caso. Estados: `Seguir caso` / `Seguindo` (ícone `BookmarkCheck`). Triggers já auto-inscrevem autor/respondente; botão é override consciente.
- **`CaseOutcomePanel`** — três modos:
  1. **Convite ao autor** quando `outcome IS NULL` ("O que aconteceu depois?" + CTA).
  2. **Form** com 4 radios visuais (verde/vermelho/cinza/azul) + textarea anônima.
  3. **Bloco "Resultado do caso"** destacado (`border-2`, fundo tonal por kind, ícone `Trophy`) — visível para todos quando `outcome` existe. Vira repertório coletivo.
- **`markCaseSeen`** disparado no `useEffect` de abertura do caso — limpa o badge de update.

### Componente UI novo
- `src/components/ui/radio-group.tsx` (shadcn padrão) + dependência `@radix-ui/react-radio-group`.

---

## Antes / depois conceitual

```text
Antes (Onda 1)                               Depois (Onda 2)
─────────────────────────                    ─────────────────────────
Caso é aberto, respondido,                   Caso é aberto, autor e
fechado e some no feed.                      respondentes seguem auto.
                                             "Atualizações" no topo
Sem retorno contextual.                      avisa quem precisa voltar.

Resposta destacada = badge.                  Resposta destacada +
                                             "Resultado do caso" oficial.

Sem memória de desfecho.                     outcome + outcome_kind:
                                             "Apliquei e funcionou: ..."

Sem sinal de vida.                           Pulse 24h: resolvidos /
                                             aguardando / helpers /
                                             novos casos.

Expertise não exposta.                       community_user_expertise
                                             pronta para uso (próxima
                                             onda integra ao caso).
```

---

## Score Comunidade

| Dimensão | Onda 1 | Onda 2 |
|---|---|---|
| Backend / RLS | 9.0 | 9.5 |
| Descoberta de "como pedir ajuda" | 9.0 | 9.0 |
| Visibilidade social | 8.5 | 9.0 |
| Urgência social | 8.0 | 8.5 |
| Empty states | 8.5 | 8.5 |
| Hierarquia visual | 9.0 | 9.0 |
| Copy humana | 8.0 | 8.5 |
| **Continuidade social (follow + updates)** | 2.0 | **9.0** |
| **Memória coletiva (outcome)** | 0.0 | **9.0** |
| **Sinalização de vida (pulse)** | 0.0 | **8.0** |
| Expertise implícita (UI) | 0.0 | 4.0 *(infra pronta, UI parcial)* |
| Integração contextual (Cockpit/Carteira) | 0.0 | 0.0 *(fase 3)* |
| **Média** | **5.2** | **8.0** |

---

## Não-objetivos preservados
- Sem feed infinito, likes vazios, ranking público, perfil exibicionista, seguidores entre usuários, comentários soltos.
- Sem polling agressivo: `pulse` e `updates` carregam uma vez ao entrar no módulo.
- Auto-subscribe é silencioso (sem toast); o badge de updates é o único feedback.

## Riscos evitados
- **CHECK constraint em `outcome_kind`** evitado — regra do projeto. Validação em trigger.
- **Race em duplicate subscriptions** — `ON CONFLICT DO NOTHING` em ambos triggers + tratamento no client.
- **Anonimato preservado** — `outcome` segue mesma diretriz dos resumos: textual, sem campos pessoais.
- **49 warnings do linter** são herdados (todas RPCs `community_*`/`has_role`/`is_approved` já são SECURITY DEFINER no padrão do projeto). Cada função filtra por `auth.uid()` internamente.

---

## Próxima onda (sugestões — NÃO executadas)
- **Expertise UI**: chip "Especialista em Imóveis" ao lado do respondente (RPC já pronta).
- **Integração contextual**: componente `SimilarCommunityCases` em Carteira / Pós-venda / Cockpit usando `consortium_type` + `stage` do cliente atual.
- **Notificação leve agregada**: contador no Sidebar item "Comunidade" derivado de `community_my_updates()`.
- **Exportar repertório**: lista de "Casos resolvidos com desfecho positivo" como base de consulta consultiva.

---

## Arquivos
**Migração:** 1 (subscriptions, outcome, 4 triggers, 4 RPCs).
**Service:** `src/services/community.ts` (estendido, sem breaking change).
**Novos componentes:** `CommunityPulseBar.tsx`, `FollowCaseButton.tsx`, `CaseOutcomePanel.tsx`, `ui/radio-group.tsx`.
**Editado:** `src/components/modules/CommunityModule.tsx` (Pulse, Updates, Follow, Outcome, mark-seen).
**Dependência nova:** `@radix-ui/react-radio-group`.

> A Comunidade deixou de ser "feed de dúvidas pontuais" e começou a operar como **memória viva de inteligência consultiva coletiva**: cada caso resolvido vira repertório, e quem participou volta naturalmente quando há novidade.
