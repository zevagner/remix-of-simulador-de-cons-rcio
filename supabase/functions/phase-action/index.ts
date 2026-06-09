import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, jsonResponse, isOriginAllowed } from "./_lib/cors.ts";
import { checkRateLimit } from "./_lib/rateLimit.ts";
import { authenticateRequest, logAuth, trackAICallVerified } from "../_shared/auth.ts";
import { callAI, AIError } from "./_lib/aiCall.ts";
import { GLOBAL_AI_RULES, isPromiseSafe, sanitizeText, SAFE_FALLBACK } from "./_lib/validators.ts";
import { logEdgeError } from "./_lib/logging.ts";
import { maskClientName, GLOBAL_PII_RULE } from "./_lib/piiMask.ts";

const FN = "phase-action";

const RequestSchema = z.object({
  phaseId: z.enum(["prospeccao", "qualificacao", "apresentacao", "fechamento"]),
  phaseTitle: z.string().max(60),
  primaryDriver: z.enum(["economia", "seguranca", "rapidez", "liquidez", "status", "patrimonio"]),
  primaryDriverLabel: z.string().max(40),
  saleStage: z.enum(["primeiro_contato", "follow_up", "sumido", "fechamento"]),
  saleStageLabel: z.string().max(40),
  clientName: z.string().max(60).optional(),
  clientType: z.string().max(120).optional(),
  selectedStrategy: z.string().max(160).optional(),
  // Simulação (opcional — em prospecção pode não ter)
  consortiumTypeLabel: z.string().max(40).optional(),
  creditValue: z.number().nonnegative().optional(),
  installment: z.number().nonnegative().optional(),
  termMonths: z.number().int().nonnegative().max(420).optional(),
  totalCost: z.number().nonnegative().optional(),
  estimatedFinancingTotal: z.number().nonnegative().optional(),
  estimatedSavings: z.number().optional(),
  estimatedRent60: z.number().nonnegative().optional(),
  // Lance (opcional — quando existe, IA usa como fator de antecipação)
  bidPercent: z.number().nonnegative().max(100).optional(),
  bidValue: z.number().nonnegative().optional(),
  contemplationMonth: z.number().int().nonnegative().max(420).optional(),
  // Modo opcional: gera versão mais direta/pressionada (ideal pra fechamento)
  directMode: z.boolean().optional(),
});
type Payload = z.infer<typeof RequestSchema>;

function fmtBRL(n?: number): string {
  if (typeof n !== "number" || !isFinite(n)) return "—";
  return Math.max(0, Math.round(n)).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

const PHASE_GUIDE: Record<string, { goal: string; tone: string; intensity: string }> = {
  prospeccao: {
    goal: "Conseguir uma reunião/diagnóstico — NÃO falar de consórcio.",
    tone: "Curioso, leve, oferta de valor (assessoria gratuita).",
    intensity: "LEVE: zero pressão, foco em ABRIR conversa. Não cite produto, número, parcela, prazo, taxa. Convide, não venda.",
  },
  qualificacao: {
    goal: "Mapear realidade do cliente antes de mostrar números.",
    tone: "Investigativo, direto, perguntas específicas.",
    intensity: "INVESTIGATIVO: direto e curioso. AINDA SEM NÚMEROS — mesmo que a simulação esteja disponível, não cite valor de parcela/crédito aqui. Pergunte sobre orçamento, decisores, FGTS, urgência.",
  },
  apresentacao: {
    goal: "Demonstrar matematicamente a vantagem com números reais.",
    tone: "Assertivo, ancorado em números concretos.",
    intensity: "ASSERTIVO: USE OS NÚMEROS REAIS da simulação. Compare com financiamento, mostre economia em R$. Sem números a fase não funciona.",
  },
  fechamento: {
    goal: "Conduzir naturalmente pro fechamento, assumindo decisão tomada.",
    tone: "Direto, com pergunta dupla e próximo passo concreto.",
    intensity: "DIRETO: assuma que a decisão já está tomada. Fale dos próximos trâmites (adesão, primeira parcela, escolha de grupo). Pergunta dupla onde qualquer resposta confirma o avanço.",
  },
};

const DRIVER_GUIDE: Record<string, { angle: string; pain: string }> = {
  economia:   { angle: "Foque em economia real vs financiamento.",                pain: "tá pagando juros demais / financiamento triplica o valor" },
  seguranca:  { angle: "Previsibilidade, parcela fixa, fim do aluguel jogado fora.", pain: "aluguel jogado fora todo mês / medo de imprevisto" },
  rapidez:    { angle: "Lance abrevia o tempo de contemplação.",                  pain: "não quer esperar anos pra ter o bem" },
  liquidez:   { angle: "Não precisa imobilizar capital de uma vez.",              pain: "não quer travar o caixa / capital parado" },
  status:     { angle: "Salto de padrão (modelo/bairro melhor) sem ostentação.",  pain: "tá num padrão menor do que merece" },
  patrimonio: { angle: "Construção de ativo em 5-10 anos.",                       pain: "não tá construindo patrimônio / dinheiro escapando" },
};

const NEXT_STEP_EXAMPLES = [
  "Enviar a simulação no WhatsApp agora",
  "Agendar call de 15 minutos ainda hoje",
  "Mover o card para 'Em Avaliação' no pipeline",
  "Confirmar reunião com cônjuge para amanhã às 19h",
  "Enviar áudio de 1min explicando o cenário escolhido",
  "Marcar visita ao imóvel/loja na próxima quarta",
];

function buildUserPrompt(d: Payload, variationSeed: number): string {
  const phase = PHASE_GUIDE[d.phaseId];
  const hasSim = typeof d.creditValue === "number" && d.creditValue > 0;
  const hasBid = (typeof d.bidPercent === "number" && d.bidPercent > 0)
              || (typeof d.bidValue === "number" && d.bidValue > 0);
  // Em qualificação não usar números mesmo que existam
  const useNumbers = hasSim && d.phaseId !== "qualificacao" && d.phaseId !== "prospeccao";

  const lines = [
    `Gere a AÇÃO PRÁTICA para a fase "${d.phaseTitle}" da venda consultiva de consórcio.`,
    `Variação: ${variationSeed} (use para variar levemente a estrutura das frases — nunca repita exatamente a mesma abertura).`,
    "",
    "FASE:",
    `- Objetivo: ${phase.goal}`,
    `- Tom: ${phase.tone}`,
    `- Intensidade obrigatória: ${phase.intensity}`,
    "",
    "DRIVER DO CLIENTE:",
    `- ${d.primaryDriverLabel}: ${DRIVER_GUIDE[d.primaryDriver].angle}`,
    `- DOR concreta a tocar (use linguagem do cliente, não jargão): ${DRIVER_GUIDE[d.primaryDriver].pain}`,
    "",
    "ESTÁGIO ATUAL (CRM):",
    `- ${d.saleStageLabel}`,
    "",
    "PERFIL:",
    d.clientName ? `- Nome: ${maskClientName(d.clientName)} (token anonimizado — trate como pronome neutro: "o cliente", "ele/ela")` : "- Nome: não informado (não inventar, não usar 'cliente')",
    d.clientType ? `- Tipo/contexto: ${d.clientType} (referencie de forma natural se fizer sentido)` : "- Tipo: não informado",
    d.selectedStrategy ? `- Estratégia escolhida: ${d.selectedStrategy} (conecte naturalmente, ex.: "naquele cenário que vimos...", "no caminho que faz mais sentido pra você...")` : "",
    "",
    useNumbers ? "DADOS REAIS DA SIMULAÇÃO (USE; nunca invente):" :
      hasSim ? "SIMULAÇÃO EXISTE mas NÃO CITE NÚMEROS nesta fase (regra da intensidade)." :
              "SEM SIMULAÇÃO AINDA — não cite números financeiros específicos.",
    useNumbers ? `- Tipo: ${d.consortiumTypeLabel ?? "—"}` : "",
    useNumbers ? `- Crédito: ${fmtBRL(d.creditValue)}` : "",
    useNumbers ? `- Parcela: ${fmtBRL(d.installment)} / ${d.termMonths ?? "—"} meses` : "",
    useNumbers ? `- Custo total: ${fmtBRL(d.totalCost)}` : "",
    useNumbers ? `- Financiamento equivalente: ${fmtBRL(d.estimatedFinancingTotal)}` : "",
    useNumbers ? `- Economia estimada: ${fmtBRL(d.estimatedSavings)}` : "",
    useNumbers ? `- Aluguel jogado fora em 5 anos: ${fmtBRL(d.estimatedRent60)}` : "",
    "",
    hasBid && useNumbers ? "LANCE PLANEJADO (use como FATOR DE ANTECIPAÇÃO da contemplação — sempre como estimativa, NUNCA como garantia):" : "",
    hasBid && useNumbers && d.bidPercent ? `- Lance previsto: ${d.bidPercent.toFixed(1)}%` : "",
    hasBid && useNumbers && d.bidValue ? `- Valor do lance: ${fmtBRL(d.bidValue)}` : "",
    hasBid && useNumbers && d.contemplationMonth ? `- Estimativa de contemplação: mês ${d.contemplationMonth} (use "tende a antecipar para perto do mês X", nunca "vai contemplar")` : "",
    "",
    d.directMode
      ? "MODO: VERSÃO MAIS DIRETA (mais pressão, mais objetivo). Vá direto ao ponto, sem rodeios. Use pergunta curta de comprometimento. Tom seguro, não agressivo. Ideal pra quem já tá na fase de decisão."
      : "MODO: padrão (consultivo).",
    "",
    "ENTREGUE EXATAMENTE 3 ITENS via tool call:",
    "1. message — mensagem WhatsApp PRONTA PARA COPIAR E ENVIAR (a parte MAIS IMPORTANTE):",
    "   • MÁXIMO 3 LINHAS curtas. Frases simples, diretas.",
    "   • Linguagem REAL de WhatsApp: pode usar contrações ('tá', 'pra', 'tô'), pode quebrar frase no meio, pode começar com minúscula. Imperfeição proposital — parece pessoa, não copy.",
    "   • Conecte com a DOR concreta listada acima (não fale da dor de forma genérica — use a expressão sugerida ou similar).",
    "   • Use contexto específico do cliente sempre que possível (estratégia escolhida, tipo, número da simulação).",
    "   • Sem 'Olá!', sem 'Espero que esteja bem', sem 'Conforme conversamos' formal, sem markdown, sem assinatura.",
    "   • Máximo 1 emoji (opcional). Sem mensagem 'bonita demais', sem tom corporativo.",
    "   • Varie a abertura (use o seed de variação) — NUNCA comece com 'Oi', 'Olá', 'E aí' duas vezes seguidas; alterne padrões (pergunta direta / observação / referência ao último contato / dado curioso).",
    "   • OBRIGATÓRIO terminar com GANCHO DE RESPOSTA FORTE — escolha 1 dos 3 tipos:",
    "       (a) ESCOLHA ENTRE 2 OPÇÕES concretas: 'te ligo às 16h ou 18h?', 'prefere começar com R$X ou R$Y de parcela?', 'agenda quarta ou quinta?'.",
    "       (b) PERGUNTA COM CONTEXTO específico (nunca genérica): 'essa parcela de R$X cabe melhor que os R$Y do financiamento pra você?', 'no seu caso o lance de 25% faz mais sentido que esperar até o mês 40?'.",
    "       (c) PEDIDO DE CONFIRMAÇÃO concreto com prazo: 'consegue me confirmar até amanhã 18h?', 'fecha pra eu reservar a vaga no grupo de quarta?'.",
    "   • PROIBIDO ganchos fracos/genéricos: 'o que acha?', 'faz sentido?', 'topa?', 'beleza?', 'pode ser?' SOZINHOS — sem contexto não geram resposta. Se usar 'faz sentido', amarre a algo concreto: 'faz sentido fechar essa semana pra travar a parcela?'.",
    "   • Provoque REAÇÃO: curiosidade ('descobri uma coisa que muda o cenário'), concordância ('isso aqui te incomoda também né?'), ou urgência leve quando fizer sentido ('antes do reajuste de janeiro', 'essa janela fecha sexta', 'o grupo abre na quarta'). NUNCA urgência falsa/inventada.",
    "   • PROIBIDO mensagem só informativa ('segue a simulação', 'te mando os dados', 'fica à vontade pra olhar'). Toda mensagem precisa pedir algo do cliente.",
    "2. question — UMA pergunta pronta pro gerente fazer ao cliente. Curta, focada no objetivo da fase, termina com '?'. Tom de conversa real.",
    "3. nextStep — próximo passo CONCRETO E EXECUTÁVEL AGORA. OBRIGATÓRIO conter os 3 elementos: AÇÃO clara (verbo imperativo) + CANAL (WhatsApp / call / reunião / pipeline / e-mail) + PRAZO (hoje / em 1h / amanhã 19h / esta semana). Quando fizer sentido, inclua compromisso esperado do CLIENTE (ex.: 'Marcar call de 15min ainda hoje pra ele confirmar a parcela'). Exemplos válidos: " + NEXT_STEP_EXAMPLES.slice(0, 3).map(e => `"${e}"`).join(", ") + ". Inválidos: 'fazer follow-up', 'continuar conversa', 'manter contato', 'enviar mensagem' (sem prazo).",
  ].filter(Boolean);

  return lines.join("\n");
}

const SYSTEM_PROMPT = `Você é um gerente sênior de consórcio orientando outro gerente sobre a próxima ação concreta com cliente real.

REGRAS GLOBAIS:
- NUNCA prometa contemplação/retorno garantido. Use "tende a", "estimativa", "histórico mostra".
- NUNCA invente números — use APENAS os do payload. Se a fase proíbe números, não cite valores.
- Lance no payload = FATOR DE ANTECIPAÇÃO da contemplação (estimativa), nunca garantia.
- Linguagem natural de WhatsApp. Sem jargão (CET, TIR, amortização, "estruturação patrimonial").
- Sem saudação genérica. Personalize pelo driver, dor concreta, perfil e estratégia.
- Varie a estrutura entre execuções (use "Variação"). Evite texto ensaiado.

NATURALIDADE (CRÍTICO):
- IMPERFEITA, conversa real. Pode "tá", "pra", "tô", "cê". Sem mensagem "bonita demais", formal ou corporativa.
- SEMPRE conecte a dor concreta listada (não dor genérica). Use contexto específico (nome, estratégia, simulação).

PRIORIZAÇÃO (REGRA DE OURO):
- "Se o cliente não responde, a mensagem falhou." Toda mensagem é desenhada pra GERAR RESPOSTA.
- A "message" é a entrega principal — precisa ser ENVIÁVEL SEM EDIÇÃO.
- Use nome (se houver) no máx 1x, naturalmente — nunca vocativo formal.
- Urgência só quando REAL (reajuste, janela de grupo, agenda). Nunca fabricada.
- Evite frases neutras ("estou à disposição", "qualquer coisa avisa"). Toda frase puxa próximo movimento.

GANCHO DE RESPOSTA (CRÍTICO):
- Toda message PRECISA ter gancho FORTE. 3 tipos válidos:
  #1 ESCOLHA entre 2 opções concretas (horários, valores, datas)
  #2 Pergunta ESPECÍFICA com contexto real (cita número/dor/decisão)
  #3 Pedido de CONFIRMAÇÃO com prazo claro
- PROIBIDO sozinhos: "o que acha?", "faz sentido?", "topa?", "beleza?", "pode ser?". Só valem ancorados em algo concreto.
- Valide: cliente responde em 1 palavra/frase curta? Se não, refaça.

COERÊNCIA MESSAGE ↔ NEXTSTEP:
- nextStep = gerente executando/aguardando a ação que message pede.
- Ex: message "te ligo 16h ou 18h?" → nextStep "Aguardar resposta e ligar no horário escolhido hoje".
- NUNCA desconectados.

FORMATO:
- Responda SEMPRE via tool call "phase_action".
- message: máx 3 linhas, WhatsApp coloquial.
- question: 1 frase curta, termina com "?".
- nextStep: 1 linha — AÇÃO + CANAL + PRAZO obrigatórios.

${GLOBAL_AI_RULES}`;

const TOOL_SPEC = {
  type: "function",
  function: {
    name: "phase_action",
    description: "Retorna a ação prática (mensagem + pergunta + próximo passo) para a fase da venda.",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string", description: "Mensagem pronta de WhatsApp." },
        question: { type: "string", description: "Pergunta pronta para o cliente." },
        nextStep: { type: "string", description: "Próximo passo concreto do gerente." },
      },
      required: ["message", "question", "nextStep"],
      additionalProperties: false,
    },
  },
};

// ─── Validação de qualidade ───
const GENERIC_PHRASES = [
  /\bfollow[\s-]?up\b/i,
  /\bmanter contato\b/i,
  /\bcontinuar (a )?conversa\b/i,
  /\bestar (à |a )?disposição\b/i,
  /\bqualquer (dúvida|coisa)\b/i,
  /\bse precisar\b/i,
  /\bfico no aguardo\b/i,
];
const PROMISE_PHRASES = [
  /\bvai (contemplar|ser contemplado)\b/i,
  /\bcontempla(ção)? garantida\b/i,
  /\bgarant(o|imos|ido) (a )?contemplação\b/i,
];

// Frases formais demais — soa "marketing", não pessoa
const FORMAL_PHRASES = [
  /\bespero que esteja bem\b/i,
  /\bconforme (conversamos|combinado|alinhado)\b/i,
  /\bvenho por meio (deste|desta)\b/i,
  /\bprezado\b/i,
  /\bcordialmente\b/i,
  /\batenciosamente\b/i,
  /\bestruturação patrimonial\b/i,
  /\bsegue (em )?anexo\b/i,
  /\bme coloco (à|a) disposição\b/i,
  /\bgostari(a|amos) de informar\b/i,
];

// Sinais de "dor concreta" tocada — pelo menos um precisa aparecer em apresentação/fechamento
const PAIN_SIGNALS = [
  /\baluguel\b/i, /\bjuro/i, /\bfinanciamento\b/i, /\beconomi/i,
  /\bparcela\b/i, /\bjogad(o|a) fora\b/i, /\bcaixa parado\b/i,
  /\bpatrim[oô]nio\b/i, /\bcapital\b/i, /\besperar\b/i,
  /\bantecip/i, /\bparado\b/i, /\bsobrar?\b/i, /\bperder\b/i,
  /\bacumul/i, /\bpoupar?\b/i, /\bdor\b/i, /\bcust/i,
];

// Marcadores de prazo no nextStep — pelo menos um obrigatório
const DEADLINE_SIGNALS = [
  /\bhoje\b/i, /\bagora\b/i, /\bamanh[ãa]\b/i, /\besta semana\b/i,
  /\bnesta semana\b/i, /\bsegunda\b/i, /\bter[çc]a\b/i, /\bquarta\b/i,
  /\bquinta\b/i, /\bsexta\b/i, /\bs[áa]bado\b/i, /\bdomingo\b/i,
  /\bem \d+\s*(min|minutos|h|hora|horas|dia|dias)\b/i,
  /\b\d{1,2}h(\d{2})?\b/i, /\b\d{1,2}:\d{2}\b/i,
  /\bain[da]+ hoje\b/i, /\bpr[óo]xima\b/i, /\bessa tarde\b/i, /\bessa noite\b/i,
  /\bessa manh[ãa]\b/i,
];

// Gancho de resposta FORTE — pelo menos 1 sinal precisa aparecer na message
// (a) escolha entre 2 opções (b) CTA conversacional dirigido (c) pergunta com contexto/decisão real
const STRONG_HOOK_SIGNALS = [
  // (a) escolha A ou B
  /\b\d{1,2}h(\d{2})?\s+ou\s+\d{1,2}h(\d{2})?\b/i,
  /\b(hoje|agora|amanh[ãa]|segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo|manh[ãa]|tarde|noite)\s+ou\s+(hoje|agora|amanh[ãa]|segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo|de (manh[ãa]|tarde|noite)|manh[ãa]|tarde|noite)/i,
  /R\$\s?[\d\.\,]+\s+ou\s+R\$\s?[\d\.\,]+/i,
  /\b(prefere|prefer[ií]a|melhor pra (vc|voc[êe])|qual (deles|fica melhor))\b[^?]{3,80}\bou\b[^?]{1,40}\?/i,
  // (b) CTA conversacional dirigido ao cliente
  /\b(te ligo|posso (te ligar|mandar|enviar|passar)|me (responde|avisa|confirma|fala|diz|manda)|consegue (me )?(falar|responder|confirmar|olhar)|d[áa] pra (gente )?(falar|conversar|fechar)|fecha (pra mim|essa))\b/i,
  // (c) pergunta com contexto/decisão real (número ou palavra-chave de decisão dentro da pergunta)
  /\?[^?]*\b(R\$|parcela|cr[eé]dito|economia|aluguel|grupo|reserv|vaga|reajuste|fech(ar|amos)|ades[ãa]o|lance|contemplaç)\b/i,
  /\b(R\$|parcela|cr[eé]dito|economia|aluguel|grupo|reserv|vaga|reajuste|fech(ar|amos)|ades[ãa]o|lance|contemplaç)\b[^?\n]{0,80}\?/i,
];

// Ganchos FRACOS isolados — perguntas de cortesia que não geram resposta sozinhas
const WEAK_HOOK_ISOLATED = [
  /(^|[\s\n])o que (vc |voc[êe] )?acha\s*\??\s*$/i,
  /(^|[\s\n])faz sentido\s*\??\s*$/i,
  /(^|[\s\n])topa\s*\??\s*$/i,
  /(^|[\s\n])beleza\s*\??\s*$/i,
  /(^|[\s\n])tudo (certo|bem|ok)\s*\??\s*$/i,
  /(^|[\s\n])pode ser\s*\??\s*$/i,
  /(^|[\s\n])bora\s*\??\s*$/i,
  /(^|[\s\n])(que tal|combinado)\s*\??\s*$/i,
];

// Frases puramente informativas — proibidas (mensagem morre sem gerar resposta)
const INFO_ONLY_PHRASES = [
  /\bsegue (a |o )?(simulação|simulacao|proposta|material|pdf|anexo)\b/i,
  /\bte mando (os )?dados\b/i,
  /\bfica (à|a) vontade pra (olhar|ver|analisar)\b/i,
  /\bd[áa] uma olhada (quando|com calma|no seu tempo)\b/i,
  /\best(ou|amos) (à|a) disposi[cç][ãa]o\b/i,
  /\bqualquer (coisa|d[úu]vida) (me )?(avisa|chama)\b/i,
  /\bs[óo] te avisando\b/i,
  /\bfica de boa\b/i,
];

function validateAction(args: { message: string; question: string; nextStep: string }, p: Payload): string | null {
  const useNumbers = typeof p.creditValue === "number" && p.creditValue > 0
    && p.phaseId !== "qualificacao" && p.phaseId !== "prospeccao";

  // 1. Mensagem deve ter números quando a simulação existe e a fase pede
  if (useNumbers) {
    const hasNumber = /\d/.test(args.message);
    if (!hasNumber) return "Mensagem sem números reais (apresentação/fechamento exigem)";
  }

  // 2. Promessa de contemplação proibida
  for (const re of PROMISE_PHRASES) {
    if (re.test(args.message) || re.test(args.nextStep) || re.test(args.question)) {
      return "Promessa de contemplação detectada";
    }
  }

  // 3. Mensagem não pode ser formal demais
  for (const re of FORMAL_PHRASES) {
    if (re.test(args.message)) return "Mensagem formal demais (parece marketing, não pessoa)";
  }

  // 4. Mensagem deve conectar com dor (em apresentação/fechamento, fases que tocam dor)
  if (p.phaseId === "apresentacao" || p.phaseId === "fechamento") {
    const hasPain = PAIN_SIGNALS.some((re) => re.test(args.message));
    if (!hasPain) return "Mensagem não conecta com dor concreta do cliente";
  }

  // 5. nextStep não pode ser genérico
  for (const re of GENERIC_PHRASES) {
    if (re.test(args.nextStep)) return "Próximo passo genérico (precisa ser executável)";
  }
  // 6. nextStep precisa ter prazo
  const hasDeadline = DEADLINE_SIGNALS.some((re) => re.test(args.nextStep));
  if (!hasDeadline) return "Próximo passo sem prazo (hoje / amanhã / em Xh / dia da semana)";
  // 7. nextStep mínimo de palavras
  if (args.nextStep.trim().split(/\s+/).length < 3) {
    return "Próximo passo curto demais";
  }

  // 8. Pergunta precisa terminar com "?"
  if (!args.question.trim().endsWith("?")) return "Pergunta sem '?'";

  // 9. Mensagem não pode ser ridiculamente curta
  if (args.message.trim().length < 30) return "Mensagem genérica/curta demais";

  // 10. Mensagem não pode ter mais de 5 linhas (regra: max 3, com tolerância)
  const lineCount = args.message.split(/\n/).filter(l => l.trim().length > 0).length;
  if (lineCount > 5) return "Mensagem com linhas demais (máx 3 ideal)";

  // 11. Mensagem não pode ser puramente informativa
  for (const re of INFO_ONLY_PHRASES) {
    if (re.test(args.message)) return "Mensagem apenas informativa (não gera resposta do cliente)";
  }

  // 12. Rejeita gancho FRACO isolado ("o que acha?", "faz sentido?" sozinhos)
  for (const re of WEAK_HOOK_ISOLATED) {
    if (re.test(args.message)) return "Gancho fraco/genérico ('o que acha?', 'faz sentido?' sozinhos não geram resposta — use escolha A/B, pergunta com contexto ou CTA conversacional)";
  }

  // 13. Mensagem PRECISA ter gancho FORTE: escolha A/B, CTA conversacional ou pergunta com contexto
  const hasStrongHook = STRONG_HOOK_SIGNALS.some((re) => re.test(args.message));
  if (!hasStrongHook) return "Mensagem sem gancho forte (precisa de escolha entre 2 opções, pergunta com contexto/decisão real, ou CTA conversacional dirigido)";

  return null;
}

// trackAICall removido — usar trackAICallVerified do _shared/auth.ts

async function callAIPhase(payload: Payload, attempt: number): Promise<{ message: string; question: string; nextStep: string }> {
  const variationSeed = Math.floor(Math.random() * 9000) + 1000;
  const userPrompt = buildUserPrompt(payload, variationSeed);

  const result = await callAI({
    model: "google/gemini-3-flash-preview",
    temperature: 0.7 + attempt * 0.1,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    tools: [TOOL_SPEC],
    tool_choice: { type: "function", function: { name: "phase_action" } },
  });

  if (!result.toolCall) throw new AIError("AI_NO_TOOLCALL", 500, "empty");
  const args = result.toolCall.arguments as { message?: string; question?: string; nextStep?: string };
  if (!args.message || !args.question || !args.nextStep) throw new AIError("AI_INCOMPLETE", 500, "empty");

  return {
    message: String(args.message).trim(),
    question: String(args.question).trim(),
    nextStep: String(args.nextStep).trim(),
  };
}

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (!isOriginAllowed(cors)) return jsonResponse({ error: "Origem não permitida" }, 403, cors);

  // ═══════ AUTH OBRIGATÓRIA (Authenticated AI Edge Standard) ═══════
  const auth = await authenticateRequest(req);
  if (!auth.ok) return jsonResponse({ error: "Unauthorized" }, 401, cors);
  const userId = auth.userId;
  logAuth(FN, userId);
  trackAICallVerified(FN, userId);

  if (!checkRateLimit(`u:${userId}`, { max: 12 })) {
    return jsonResponse({ error: "Muitas requisições. Aguarde alguns segundos." }, 429, cors);
  }

  try {
    const raw = await req.json();
    const parsed = RequestSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonResponse({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, 400, cors);
    }


    // Até 2 tentativas com validação de qualidade
    let lastError = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const action = await callAIPhase(parsed.data, attempt);
        // Sanitiza + valida promessas (guardrail global)
        action.message = sanitizeText(action.message);
        action.question = sanitizeText(action.question);
        action.nextStep = sanitizeText(action.nextStep);
        if (!isPromiseSafe(action.message) || !isPromiseSafe(action.question) || !isPromiseSafe(action.nextStep)) {
          logEdgeError(FN, new Error("output rejeitado: promessa proibida"), { action });
          lastError = "Promessa proibida detectada";
          continue;
        }
        const validationError = validateAction(action, parsed.data);
        if (!validationError) {
          return jsonResponse(action, 200, cors);
        }
        lastError = validationError;
        console.warn(`phase-action validation failed (attempt ${attempt + 1}): ${validationError}`);
      } catch (e) {
        if (e instanceof AIError) {
          const msg =
            e.code === "rate_limit" ? "Muitas requisições. Tente novamente em alguns segundos." :
            e.code === "no_credits" ? "Créditos de IA esgotados." :
            e.code === "config" ? "Chave de IA não configurada" :
            "Erro ao consultar IA";
          return jsonResponse({ error: msg }, e.status >= 400 ? e.status : 500, cors);
        }
        lastError = e instanceof Error ? e.message : "AI_ERROR";
      }
    }

    return jsonResponse({ error: `Resposta da IA não atingiu padrão de qualidade (${lastError}). Tente novamente.` }, 502, cors);
  } catch (e) {
    logEdgeError(FN, e, { context: "unhandled" });
    return jsonResponse({ error: SAFE_FALLBACK }, 500, cors);
  }
});
