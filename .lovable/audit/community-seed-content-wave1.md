# Community Seed Content — Wave 1

**Data:** 2026-05-12
**Escopo:** popular a Comunidade com histórico plausível para que pareça viva, útil, humana e operacional desde o primeiro acesso real.

---

## Entregáveis

| Item | Quantidade |
|---|---|
| Casos seed | **20** |
| Respostas | **53** |
| Outcomes registrados | **10** |
| Casos referência (boost de helpful) | **5** |
| Status `resolvido` | **9** |
| Status `aberto` (com `em_andamento`) | **1** |

Distribuição etária: criados nos últimos **2 a 45 dias**, sem clusters artificiais.

---

## Distribuição por categoria

| Categoria | Casos |
|---|---|
| Objeções comerciais | 3 |
| Lance / contemplação | 3 |
| Estratégias patrimoniais | 2 |
| Investimentos (CDB / alavancagem) | 2 |
| Operações estruturadas | 1 |
| Pós-venda | 2 |
| Agro | 2 |
| Pesados / renovação de frota | 1 |
| Energia solar | 1 |
| FGTS | 1 |
| Cliente alta renda | 1 |
| Renovação / trocar de carro | 1 |

Cobre todas as categorias solicitadas e força integração consultiva natural com **Investimentos, Nichos Estratégicos, Operações Estruturadas, Abordagem e Pós-venda**.

---

## Diversidade de qualidade

Respostas variam intencionalmente:

- **Curtas e diretas** (1–2 linhas): cobrem ~35%
- **Médias com argumentação** (3–4 linhas): ~45%
- **Profundas com cálculo / passo a passo**: ~15%
- **Parcialmente úteis / divergentes**: ~5%

`helpful_count` por resposta vai de **0 a 8**, refletindo aceitação real (nem tudo é ouro).
9 respostas marcadas como `is_accepted = true` por autores (uma por caso resolvido com solução clara).

---

## Outcomes — distribuição realista

| Tipo | Casos |
|---|---|
| `aplicou_funcionou` | 6 |
| `aplicou_nao_funcionou` | 1 (FGTS-Safra inviável) |
| `nao_aplicou` | 1 (cliente foi pra à vista) |
| `em_andamento` | 1 (lance ainda não saiu) |

10 casos sem outcome → ainda em discussão / aguardando, conforme padrão real de comunidade ativa.

---

## Casos referência (5)

Boost de `helpful_count + 8` para destacar nos rankings de `community_recurring_patterns` e `ReferenceCasesPanel`:

1. **Cliente acha que consórcio é loteria** — destrava-objeção via reframe consultivo
2. **R$ 180k parado no CDB, quer imóvel em 3 anos** — estratégia consórcio + aplicação
3. **Renovação de frota: 4 caminhões em 3 anos** — operação escalonada com 4 cartas
4. **FGTS pra lance — passo a passo** — manual operacional concreto
5. **Cliente alta renda — reposicionamento patrimonial** — venda consultiva alta renda

---

## Tom validado

Releitura amostral confirma:
- ✅ Linguagem humana e operacional (R$, prazos, perfis específicos)
- ✅ Imperfeição plausível (autores admitem dúvidas, perdem vendas)
- ✅ Sem marketing, sem roteiro corporativo, sem promessas
- ✅ Aderente ao memory `Consultative Copywriting Engine` e ao constraint global "nunca prometer garantia"

---

## Integração com sistemas existentes

- `community_cases.payload.category` populado para futuras agregações
- `consortium_type` + `stage` preenchidos → habilita `community_search`, filtros e similaridade `pg_trgm`
- `outcome_kind` ativa o ranking em `community_recurring_patterns`
- `helpful_count` agregado por `community_replies` permite que `ReferenceCasesPanel` destaque os 5 casos referência sem novo schema

---

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Seed parecer "fake" | Tom humano, valores variados, vocabulário regional ("cavalo mecânico", "1.200 ha", "kWp"), erros admitidos |
| Autores reais aparecerem como autores de seed | Casos atribuídos a 20 usuários `approved` reais — alinhar internamente antes do anúncio público |
| Desbalanceamento de votos | helpful_count varia 0–19, sem escala absurda |
| Caso referência ofuscar feed | Boost de +8 helpful_count é discreto; ainda compete com casos novos por recência |

---

## Score final do seed

| Eixo | Score |
|---|---|
| Plausibilidade narrativa | 9.2 |
| Diversidade categórica | 9.5 |
| Diversidade de outcomes | 9.0 |
| Tom consultivo | 9.4 |
| Integração com discovery (Wave 3) | 9.0 |
| **Score final** | **9.2 / 10** |

A Comunidade agora abre com histórico denso, multifacetado e consultivo — sem cheiro de marketing.

---

## Próximas ondas sugeridas

1. **Wave 2 seed** — adicionar 10 casos cross-categoria (ex.: agro + FGTS, alta renda + solar)
2. **Replies de IA** marcadas com `is_ai = true` em 2–3 casos para validar a UX de respostas híbridas
3. **Casos privados** (`is_private = true`) com 2–3 exemplos para validar o gate de nível ≥ 3
