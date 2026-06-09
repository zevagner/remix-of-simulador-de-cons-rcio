---
name: Funil Fases Ação Prática
description: Edge phase-action + FunnelTab contextual com mensagem/pergunta/próximo passo por fase. Intensidade por fase, contexto de lance, validação de qualidade no backend (formal/dor/prazo), modo "versão direta" opcional, fase recomendada no topo auto-expandida.
type: feature
---

# Funil de Fases — Ação Prática

FunnelTab consome `useSimulatorContext` + `useDiagnosticContextSafe` + `deriveClientProfile`/`suggestSaleStage` para gerar payload contextual e chamar `phase-action` (Gemini-3-flash via tool call).

## Fluxo

1. Driver auto via diagnóstico, estágio sugerido (prop `suggestedStage` ou status do CRM).
2. Mapa `STAGE_TO_PHASE`: primeiro_contato→prospeccao, follow_up→apresentacao, sumido→qualificacao, fechamento→fechamento.
3. **Fase recomendada vai para o topo** (sort por `recommendedPhase`), auto-expandida (estado inicial `expandedPhase = recommendedPhase`), com `ring-2 ring-primary shadow-lg shadow-primary/10` e badge "Use esta fase agora".
4. Botão "Gerar mensagem + pergunta + próximo passo" por fase chama edge.
5. UI exibe blocos na ordem: **(1) Mensagem pronta → (2) CTA "Executar ação recomendada" (verde WhatsApp, copia + abre WhatsApp) + Copiar/Regenerar → (3) Pergunta → (4) Próximo passo (destaque amber)**.

## Edge `phase-action`

- **Intensidade por fase no SYSTEM_PROMPT**:
  - `prospeccao` LEVE — sem números, sem produto, só abertura.
  - `qualificacao` INVESTIGATIVO — sem números mesmo se simulação existir.
  - `apresentacao` ASSERTIVO — exige números reais.
  - `fechamento` DIRETO — assume decisão tomada, pergunta dupla.
- **Contexto de lance** (opcional): `bidPercent`, `bidValue`, `contemplationMonth` enviados quando há lance > 0. IA trata como "fator de antecipação", **nunca como garantia**.
- **selectedStrategy**: integrado ao prompt como referência ("com base no cenário que vimos...").
- **Variação**: `variationSeed` aleatório + `temperature` 0.7→0.8 nas re-tentativas para evitar repetição.
- **Validação de qualidade no backend** (`validateAction`):
  - Rejeita se mensagem não tem números quando apresentação/fechamento + simulação existe.
  - Rejeita promessa de contemplação ("vai contemplar", "contemplação garantida").
  - Rejeita **mensagem formal demais** ("conforme conversamos", "espero que esteja bem", "prezado", "estruturação patrimonial", "atenciosamente"...).
  - Rejeita mensagem que **não conecta com dor concreta** em apresentação/fechamento (precisa conter pelo menos um sinal: aluguel, juros, financiamento, parcela, esperar, antecipar, patrimônio etc).
  - Rejeita nextStep genérico (`follow-up`, `manter contato`, `qualquer dúvida`...).
  - Rejeita **nextStep sem prazo** (precisa conter: hoje, amanhã, esta semana, dia da semana, "em Xh", horário etc).
  - Rejeita pergunta sem `?` ou mensagem < 30 chars ou mensagem com >5 linhas.
  - Até 2 tentativas; se falhar 2x retorna 502 "padrão de qualidade não atingido".
- **NEXT_STEP_EXAMPLES** injetados no prompt como exemplos válidos: "Enviar simulação no WhatsApp agora", "Agendar call de 15 minutos ainda hoje", "Mover para Em Avaliação".
- **Modo "Versão direta"** (`directMode: boolean` opcional no payload): aumenta pressão e objetividade, ideal pra fechamento. Frontend toggla via botão "Versão direta / Versão consultiva" no card da ação.
- **Naturalidade reforçada**: prompt instrui linguagem de WhatsApp real ("tá", "pra", "tô", quebra informal), máx 3 linhas, conexão obrigatória com DOR concreta do driver, proibição explícita de tom corporativo.

## Eventos

- `funnel_action_generated` — payload {phase, driver, stage, directMode}
- `funnel_action_copied` — payload {phase}
- `funnel_action_whatsapp` — payload {phase}

## Props opcionais

- `suggestedStage?: SaleStage` — sobrescreve sugestão automática.
- `selectedStrategy?: string` — texto da estratégia escolhida (cenário/lance) injetado no prompt.

## Não fazer

- Não substituir conteúdo teórico das fases (objetivo, what to do, scripts) — a IA é aditiva.
- Não chamar a edge sem driver/estágio derivados — o prompt depende deles.
- Não relaxar validação de qualidade — é a defesa contra mensagens genéricas.

## Onda 4 — Foco em resposta do cliente

- SYSTEM_PROMPT: regra de ouro "se o cliente não responde, a mensagem falhou"; urgência leve apenas se real (reajuste/janela/agenda); proibido frases neutras; alternar padrão de abertura entre execuções.
- message: obrigatório terminar com gancho de resposta (pergunta / escolha entre 2 opções / pedido de confirmação / CTA conversacional). Provocar reação (curiosidade, concordância ou urgência leve real).
- validateAction: 2 novos rejects — `INFO_ONLY_PHRASES` (mensagem só informativa) e `REPLY_HOOK_SIGNALS` (sem convite a responder).

## Onda 5 — Gancho forte obrigatório

- SYSTEM_PROMPT: hierarquia explícita de ganchos (1º escolha A/B, 2º pergunta com contexto, 3º confirmação com prazo); proibido "o que acha?", "faz sentido?", "topa?" isolados; bloco de COERÊNCIA message↔nextStep (nextStep executa a ação que a message pediu).
- validateAction:
  - `WEAK_HOOK_ISOLATED` rejeita perguntas de cortesia sozinhas no fim da mensagem.
  - `STRONG_HOOK_SIGNALS` exige (a) escolha A ou B (horários/datas/valores), (b) CTA conversacional dirigido ("te ligo", "me confirma", "consegue falar"), OU (c) pergunta com palavra-chave de decisão/número (R$, parcela, grupo, reserva, lance, fechar).
  - `REPLY_HOOK_SIGNALS` antigo substituído pelo gate mais estrito.
