/**
 * ════════════════════════════════════════════════════════════════════════════
 * STRATEGY EXPLANATION ENHANCEMENTS — camada consultiva premium
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Camada paralela a `strategyLibraryData.ts` que enriquece — sem reescrever —
 * o conteúdo existente das 24 estratégias com três dimensões consultivas:
 *
 *   1. PATRIMONIAL_READING_BY_ID
 *      Leitura patrimonial de fechamento: 2–4 frases que sintetizam por que
 *      a estratégia faz sentido financeiramente (liquidez, fluxo, patrimônio,
 *      timing, custo de oportunidade) e contam a lógica da operação como um
 *      consultor sênior explicaria a um cliente sofisticado.
 *
 *   2. CALC_MEANINGS_BY_ID
 *      Para cada linha relevante de cálculo, uma nota consultiva curta
 *      (≤ 120 caracteres) que EXPLICA o significado do número — por que ele
 *      importa para a decisão patrimonial. Não repete o cálculo: o interpreta.
 *
 *   3. COMPARISON_WHY_BY_ID
 *      Para cada linha de comparativo, uma nota explicando POR QUE existe a
 *      diferença (financeiramente), não apenas o quanto. Foca em liquidez,
 *      fluxo, custo de oportunidade, exposição, timing, construção patrimonial.
 *
 * Lookup por `id` da estratégia + `label` exato (case-insensitive trim) da
 * linha. Ausência de match = sem nota (degradação silenciosa). Nenhuma quebra
 * se a `strategyLibraryData` evoluir.
 *
 * Tom obrigatório: consultivo, matemático, sóbrio. Proibido: hype, promessa,
 * "multiplicador mágico", emoção, marketing.
 * ════════════════════════════════════════════════════════════════════════════
 */

const norm = (s: string) => s.trim().toLowerCase();

export interface ExplanationMap {
  /** label da linha (cálculo ou comparativo) → nota consultiva */
  [label: string]: string;
}

/* ============================================================================
 * LEITURAS PATRIMONIAIS — fechamento consultivo de cada estratégia
 * ========================================================================== */
export const PATRIMONIAL_READING_BY_ID: Record<string, string> = {


  'compra-hibrida':
    'A estratégia equilibra três variáveis simultaneamente: tempo até a contemplação, custo total acumulado e liquidez preservada. Maior lance reduz o tempo, mas consome capital; menor lance preserva capital, mas alonga a espera. O ponto de equilíbrio é o lance que antecipa a posse sem comprometer a reserva de emergência nem o rendimento que cobre parte expressiva da parcela.',

  'compra-planejada':
    'O cliente troca juros bancários por taxa administrativa diluída — diferença que, capitalizada em paralelo numa reserva, pode aproximar-se ou superar o custo nominal do plano. A parcela funciona como compromisso de poupança vinculada a um objetivo; o custo de oportunidade é o tempo. Estratégia eficiente quando o horizonte do objetivo permite absorvê-lo.',

  'aquisicao-acelerada':
    'O trade-off é explícito: parte do capital comprometido no lance em troca de antecipação da posse e menor exposição aos reajustes da carta. Mesmo com o custo do lance, o custo total tende a permanecer abaixo do financiamento equivalente — o ganho real está na compressão do tempo de exposição, não em multiplicador algum.',

  'leverage-patrimonial':
    'Aqui o capital não é multiplicado — é redistribuído. O mesmo aporte que adquiriria um ativo viabiliza exposição a três ou mais, sem juros bancários compostos. O ponto crítico de execução é a soma das parcelas mensais agregadas: a estratégia exige fluxo robusto e disciplina, não otimismo. Estrutura de exposição, não de retorno garantido.',

  'alavancagem-imobiliaria':
    'O inquilino, e não o cliente, amortiza progressivamente o ativo enquanto a locação ocorre. A parcela do consórcio compete com o aluguel líquido recebido: a viabilidade depende da razão entre os dois, validada no simulador. A construção patrimonial é gradual — cada cota quitada acrescenta um aluguel ao agregado mensal, em escada, conforme as quitações ocorrem.',

  'multiplicacao-cotas':
    'A engenharia é simples e exigente: renda passiva da cota anterior financia o lance da próxima. Sem novos aportes de capital pessoal relevantes, o portfólio cresce em camadas. O risco real não é financeiro — é comportamental: a disciplina de não consumir o caixa liberado define se a estratégia funciona ou se vira despesa.',

  'usar-carta-investir':
    'Esta estratégia transforma o tempo em ativo patrimonial. Em vez de o cliente juntar capital aos poucos durante décadas, ele paga poucos meses de aporte (até a contemplação) e destrava um capital muitas vezes maior, que passa a render em fundo CAIXA regulamentado pelo BACEN e CVM (Lei 11.795/2008, art. 24) até o fim do plano. O ganho não vem do consórcio em si — vem da antecipação patrimonial. A análise central a fazer com o cliente é uma só: ele tem orçamento estável para sustentar as parcelas em paralelo até o fim do plano, sem precisar do capital aplicado nesse intervalo? Se sim, é uma das teses mais poderosas do módulo. Se não, vira armadilha de fluxo de caixa.',

  'venda-carta-lucro':
    'Esta estratégia NÃO constrói patrimônio — é operação financeira pura. O consórcio funciona aqui como ferramenta de investimento: o cliente imobiliza capital em parcelas mensais por 12 a 30 meses e captura o ágio que existe no mercado secundário de cartas contempladas. O sucesso depende de contemplação relativamente rápida — o tempo é o adversário principal da tese. Quanto mais cedo a contemplação, melhor o resultado. Pode ser sorteio (caminho ideal, sem capital extra) ou lance livre bem calibrado (acelera, mas exige mais investimento).',

  'reinvestimento-estruturado':
    'A renda passiva deixa de ser consumo e passa a ser combustível. Cada janela de reinvestimento converte fluxo em nova exposição patrimonial, num ciclo composto. Em horizontes longos, a curva resultante é exponencial — mas só se a disciplina de reinvestimento for tratada como regra, não como opção.',

  'autoquitacao-estruturada':
    'Compressão temporal: o ativo trabalha para se quitar. A renda gerada (aluguel, receita operacional) é canalizada para amortizações extras, reduzindo o prazo efetivo do plano conforme a folga real entre receita e parcela ordinária. O cliente alcança o patrimônio livre antes do prazo nominal, mantendo o ativo gerando renda durante todo o processo de liberação do saldo devedor — quanto maior a folga, mais cedo a quitação.',

  'patrimonio-escalavel':
    'A pessoa jurídica deixa de ser despesa contábil e passa a ser eficiência estrutural. A diferença tributária entre PF e PJ no lucro presumido sobre renda passiva, capitalizada ao longo do tempo, gera caixa recorrente que pode ser direcionado a novas aquisições. Estratégia para portfólios com massa crítica; abaixo dela, o custo de manutenção da estrutura tende a superar o ganho.',

  'reforma-ampliacao':
    'A carta imobiliária aplicada a reforma tem duas funções simultâneas: agrega valor real ao ativo (avaliação superior pós-obra) e organiza o desembolso sem alienação fiduciária bancária. O capital pessoal permanece preservado; a parcela substitui o que seria um financiamento de reforma com juros de empréstimo pessoal.',

  'retrofit-patrimonial':
    'Imóveis bem localizados mas obsoletos costumam ter o maior potencial de valorização por real investido — o retrofit captura essa assimetria. A carta organiza o investimento sem dívida bancária; a valorização resultante e o cap rate ajustado pós-obra reposicionam o ativo numa faixa superior do mercado.',

  'energia-solar':
    'A economia mensal na conta de energia funciona como amortização indireta do sistema. Quando a economia acumulada iguala o investimento, atinge-se o payback — a partir daí, a redução de conta passa a ser caixa livre recorrente, integralmente ao patrimônio. A carta organiza o investimento inicial sem comprometer capital de giro nem exigir financiamento com juros bancários. Payback depende do dimensionamento, tarifa local e perfil de consumo.',

  'upgrade-veiculo':
    'A estratégia neutraliza o efeito de depreciação acumulada: o veículo anterior é entregue como valor de troca dentro de um ciclo previsível, e a carta organiza o upgrade sem juros bancários. O custo efetivo do upgrade é a diferença entre os valores — não o preço total do bem novo.',

  'renovacao-frota':
    'Frota tratada como portfólio, não como ativos isolados. Renovação escalonada distribui o impacto de caixa, reduz custos de manutenção crescentes da frota antiga e mantém eficiência operacional. A parcela é despesa dedutível; o capital de giro permanece intacto para a operação principal.',

  'expansao-produtiva':
    'Equipamento adquirido via consórcio é capital produtivo organizado sem dívida bancária. A receita incremental gerada pela nova capacidade tende a superar a parcela; quando isso ocorre, a expansão é autofinanciada. O custo de oportunidade preservado (capital de giro) costuma valer mais do que a diferença nominal de prazo.',

  'equipamentos-pesados':
    'Equipamento de alto valor unitário é o cenário onde a vantagem do consórcio sobre o financiamento é mais expressiva — taxa de juros bancária para esses bens costuma ser elevada. A receita por hora-máquina é o teste real: se cobre parcela + manutenção + operação com folga, o ativo se autofinancia.',

  'agronegocio':
    'Maquinário agrícola alinhado ao calendário de safra: a contemplação é planejada para anteceder o pico de receita. Capital de giro preservado para insumos e custeio. Em ciclos de boas safras, a receita gerada pela nova capacidade amortiza a cota; em ciclos adversos, a reserva preservada absorve a parcela sem comprometer a operação.',

  'patrimonio-rural':
    'Terra produtiva combina valorização real de longo prazo com geração de renda recorrente. A carta organiza a aquisição sem hipoteca rural e sem juros bancários; o arrendamento ou produção própria gera fluxo que amortiza o plano. Patrimônio com baixa correlação com ativos financeiros — função de diversificação real.',

  'renda-passiva':
    'O objetivo deixa de ser adquirir o bem e passa a ser construir o fluxo. Cada cota imobiliária quitada acrescenta um aluguel ao agregado mensal — em escada, ao longo do tempo. Estratégia de transição entre fase laboral e fase patrimonial: o cliente substitui gradualmente renda ativa por renda de capital.',

  'patrimonio-gerador-caixa':
    'Diversificação real entre classes geradoras de caixa (imobiliário, equipamentos sob contrato, frota produtiva) reduz a dependência de um único setor. A renda agregada flui de fontes não-correlacionadas, suavizando ciclos adversos de mercados específicos. Construção de longo prazo com fluxo crescente em camadas.',

  'holding-patrimonial':
    'A holding consolida governança, eficiência tributária sobre renda passiva e organização sucessória num único veículo. Acima de uma certa escala de portfólio, o custo de manutenção é amplamente compensado pela economia recorrente — que, capitalizada, financia novas aquisições dentro da própria estrutura.',

  'planejamento-sucessorio':
    'A sucessão organizada antecipa decisões que, deixadas para o inventário, geram conflito, custo tributário elevado e bloqueio prolongado de ativos. Cotas societárias e doação com reserva de usufruto permitem transferência ordenada em vida, preservando o controle do titular e a previsibilidade da sucessão.',
};

/* ============================================================================
 * SIGNIFICADO DAS LINHAS DE CÁLCULO — interpretação consultiva
 * ========================================================================== */
export const CALC_MEANINGS_BY_ID: Record<string, ExplanationMap> = {
  'compra-hibrida': {
    'lance / entrada (30%)': 'Capital comprometido para antecipar a contemplação — define o trade-off liquidez × tempo.',
    'saldo a parcelar': 'Diluído em parcelas sem juros adicionais — apenas correção do INPC.',
    'capital preservado em renda fixa': 'Reserva que mantém liquidez operacional e gera rendimento mensal recorrente.',
    'rendimento mensal estimado': 'Compensa parte da parcela e amortiza o custo efetivo da estratégia.',
  },
  'compra-planejada': {
    'parcela média estimada (180m)': 'Compromisso mensal sem juros bancários — diluição linear, sem composição.',
    'custo total do consórcio': 'Custo total inclui taxa administrativa diluída ao longo do ciclo completo.',
    'custo total do financiamento comparável': 'Referência: financiamento bancário compõe juros sobre saldo devedor.',
    'diferença nominal': 'Economia direta sobre o custo do bem — capitalizável em paralelo se houver disciplina.',
  },
  'aquisicao-acelerada': {
    'lance estruturado (30%)': 'Capital aplicado para reduzir o tempo de espera — comprometido até a contemplação efetiva.',
    'saldo diluído pós-contemplação': 'Compromisso mensal que se inicia após receber a carta de crédito.',
    'custo efetivo estimado': 'Inclui lance + parcelas — abaixo do financiamento mesmo com a aceleração.',
  },
  'leverage-patrimonial': {
    'cotas paralelas viabilizadas (ilustrativo)': 'Mesmo capital redistribuído em múltiplas cotas — exposição ampliada, sem dívida.',
    'exposição patrimonial agregada': 'Soma dos ativos sob plano — patrimônio em formação, não capital próprio aportado.',
    'parcela agregada estimada': 'Compromisso mensal somado — ponto crítico de execução que exige fluxo robusto.',
  },
  'alavancagem-imobiliaria': {
    'aluguel estimado (cap rate ilustrativo)': 'Fluxo que o inquilino injeta — amortiza o ativo sem capital adicional do investidor.',
    'parcela do consórcio (180m)': 'Compromisso mensal — comparar com o aluguel define a viabilidade da estratégia.',
    'cobertura aluguel ÷ parcela': 'Percentual coberto pelo fluxo locatício — define o aporte mensal residual do investidor.',
    'capital próprio aportado (lance 25%)': 'Único capital efetivo do investidor — o restante é construído pelo inquilino.',
  },
  'multiplicacao-cotas': {
    'renda passiva ilustrativa por cota quitada': 'Fluxo recorrente que, se reinvestido, financia o lance do próximo ciclo.',
    'capital acumulado para novo lance (60 meses)': 'Massa que viabiliza nova cota — sem aporte adicional do capital pessoal.',
    'exposição patrimonial após 3 ciclos (ilustrativo)': 'Portfólio composto formado por reinvestimento sistemático, não por aporte continuado.',
  },
  'autoquitacao-estruturada': {
    'renda mensal do ativo (ilustrativo)': 'Fluxo gerado pelo próprio ativo — combustível da amortização extra.',
    'parcela ordinária': 'Compromisso mínimo do plano — referência para medir a folga disponível.',
    'folga disponível para amortização': 'Excedente que comprime o prazo efetivo — quanto maior, mais cedo a liberação.',
  },
  'patrimonio-escalavel': {
    'ir sobre aluguel — pf (faixa máxima)': 'Carga tributária na pessoa física — corrói a renda passiva mês a mês.',
    'ir sobre aluguel — pj lucro presumido': 'Carga reduzida na PJ — diferença anual recorrente compõe ao longo do horizonte.',
    'diferença anual ilustrativa': 'Economia tributária recorrente — capitalizada, viabiliza novas aquisições dentro da estrutura.',
  },
  'alavancagem-financeira-estruturada': {},
  'renda-passiva': {
    'aluguel mensal por cota (ilustrativo)': 'Cada cota quitada acrescenta um fluxo recorrente ao agregado mensal.',
    'renda agregada após 5 cotas quitadas': 'Construção em escada — independente da renda ativa do cliente.',
  },
  'energia-solar': {
    'economia mensal estimada': 'Caixa que deixa de sair — funciona como amortização indireta do sistema.',
    'payback estimado': 'Prazo de recuperação do investimento — após esse marco, a economia é caixa livre.',
  },
};

/* ============================================================================
 * RAZÃO DOS COMPARATIVOS — por que existe a diferença
 * ========================================================================== */
export const COMPARISON_WHY_BY_ID: Record<string, ExplanationMap> = {
  'compra-hibrida': {
    'liquidez pós-compra': 'A maior parte do capital permanece aplicada — reserva de emergência e flexibilidade patrimonial preservadas.',
    'custo financeiro total': 'Mesmo com lance, o custo total é inferior ao financiamento — não há composição de juros sobre saldo.',
  },
  'compra-planejada': {
    'custo total': 'Diferença vem da ausência de juros bancários — apenas taxa administrativa diluída sobre o crédito.',
    'urgência exigida': 'Trade-off explícito: tempo cedido em troca de eliminação completa do custo de juros.',
  },
  'aquisicao-acelerada': {
    'tempo de espera': 'Lance estruturado nas primeiras assembleias antecipa a posse — reduz exposição aos reajustes da carta.',
    'custo total': 'Custo permanece abaixo do financiamento mesmo com o lance — não há juros sobre saldo devedor.',
  },
  'leverage-patrimonial': {
    'exposição com o mesmo capital': 'O capital é redistribuído entre cotas paralelas — exposição cresce, dívida bancária não existe.',
    'custo de capital': 'Taxa administrativa por cota é fixa e diluída; financiamento bancário cresce com o número de operações.',
  },
  'alavancagem-imobiliaria': {
    'capital próprio aportado': 'O fluxo locatício do inquilino substitui o aporte do investidor — capital próprio fica concentrado no lance.',
    'custo financeiro': 'Taxa administrativa diluída substitui juros bancários — estrutura mais econômica em horizontes longos.',
  },
  'multiplicacao-cotas': {
    'crescimento patrimonial': 'Composição vem do reinvestimento sistemático — renda fixa pura cresce de forma linear, não composta.',
    'aporte adicional exigido': 'Após o ciclo inicial, o próprio fluxo gerado financia novas aquisições — estratégia autossustentável.',
  },
  'autoquitacao-estruturada': {
    'prazo efetivo': 'Amortizações extras com a renda do ativo comprimem o saldo devedor — liberação patrimonial antecipada.',
    'capital próprio adicional': 'Estratégia se autofinancia: o ativo trabalha para quitar a si mesmo, sem aporte adicional relevante.',
  },
  'patrimonio-escalavel': {
    'carga tributária sobre renda passiva': 'Diferença estrutural entre regimes PF e PJ — capitalizada, financia novas aquisições.',
    'sucessão': 'Transferência por cotas societárias evita inventário prolongado e custo de partilha tradicional.',
  },
  'energia-solar': {
    'custo total do projeto': 'Carta organiza o investimento sem juros bancários — payback recupera o capital antes do fim da vida útil.',
  },
};

/* ============================================================================
 * HELPERS DE LOOKUP — degradação silenciosa
 * ========================================================================== */
export function getCalcMeaning(strategyId: string, label: string): string | undefined {
  const map = CALC_MEANINGS_BY_ID[strategyId];
  if (!map) return undefined;
  return map[norm(label)] ?? map[label];
}

export function getComparisonWhy(strategyId: string, label: string): string | undefined {
  const map = COMPARISON_WHY_BY_ID[strategyId];
  if (!map) return undefined;
  return map[norm(label)] ?? map[label];
}

export function getPatrimonialReading(strategyId: string): string | undefined {
  return PATRIMONIAL_READING_BY_ID[strategyId];
}
