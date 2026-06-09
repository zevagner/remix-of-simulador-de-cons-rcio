/**
 * ════════════════════════════════════════════════════════════════════════════
 * STRATEGY DECISION SUPPORT — camada de apoio à decisão patrimonial
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Camada paralela a `strategyLibraryData.ts` que adiciona guidance consultivo
 * silencioso para apoiar a DECISÃO patrimonial — não apenas explicar o que a
 * estratégia faz, mas para QUEM e QUANDO faz sentido.
 *
 * Cinco dimensões consultivas por estratégia:
 *
 *   1. fit                — "Faz mais sentido quando..." (contexto patrimonial ideal)
 *   2. caution            — "Exige atenção quando..." (sem alarmismo)
 *   3. profile            — aderência patrimonial (1–2 tags curtas, sem score)
 *   4. tradeoff           — o que ganha × o que troca (clareza explícita)
 *   5. horizon            — evolução curto / médio / longo prazo
 *
 * Lookup por `id` da estratégia. Ausência de match degrada silenciosamente.
 * Zero impacto em `strategyLibraryData.ts`, motor financeiro ou roteamento.
 *
 * Tom obrigatório: consultivo, sóbrio, matemático. Proibido: hype, IA,
 * recomendação marketeira, alarmismo, perfil psicológico, score.
 * ════════════════════════════════════════════════════════════════════════════
 */

export type PatrimonialProfile =
  | 'Preservação de capital'
  | 'Formação patrimonial'
  | 'Expansão patrimonial'
  | 'Geração de fluxo'
  | 'Eficiência tributária'
  | 'Sucessão & governança'
  | 'Uso produtivo'
  | 'Operação financeira'
  | 'Diversificação';

export interface DecisionSupport {
  fit: string;
  caution: string;
  profile: PatrimonialProfile[];
  tradeoff: { gains: string; trades: string };
  horizon: { short: string; medium: string; long: string };
}

/* ============================================================================
 * APOIO À DECISÃO — 24 estratégias
 * ========================================================================== */
export const DECISION_SUPPORT_BY_ID: Record<string, DecisionSupport> = {

  'compra-hibrida': {
    fit: 'Perfil moderado que aceita comprometer parte do capital para acelerar a contemplação, mas recusa zerar caixa ou pagar juros bancários.',
    caution: 'Quando o lance comprometeria a reserva de emergência ou quando o cliente tende a consumir o capital remanescente após dar o lance.',
    profile: ['Formação patrimonial', 'Preservação de capital'],
    tradeoff: {
      gains: 'Posse próxima ao curto prazo + parte significativa do capital preservada em renda fixa.',
      trades: 'Parte do capital fica comprometida no lance até a contemplação efetiva.',
    },
    horizon: {
      short: 'Lance acelera a contemplação; capital remanescente já rendendo em paralelo.',
      medium: 'Bem em posse; rendimento da reserva cobre parte da parcela; reserva de emergência intacta.',
      long: 'Patrimônio composto pelo bem + reserva preservada; custo total significativamente abaixo do financiamento equivalente.',
    },
  },

  'compra-planejada': {
    fit: 'Objetivo definido com horizonte de 24–60 meses (primeira casa, troca de carro, expansão planejada) e renda estável capaz de absorver a parcela como compromisso de longo prazo.',
    caution: 'Quando o bem precisa ser adquirido em prazo inferior a 12 meses ou quando há expectativa de instabilidade severa de renda nos próximos 24 meses.',
    profile: ['Formação patrimonial'],
    tradeoff: {
      gains: 'Custo total significativamente menor que financiamento equivalente — sem juros bancários compostos.',
      trades: 'Tempo de espera (12–60m) — o cliente cede prazo em troca da eliminação do custo de juros.',
    },
    horizon: {
      short: 'Parcela inicia o compromisso de poupança vinculada ao objetivo.',
      medium: 'Reajuste anual da carta atualiza o crédito; contemplação por sorteio ou lance modesto torna-se progressivamente mais provável.',
      long: 'Bem adquirido com custo total inferior ao do financiamento; diferença pode ser capitalizada em paralelo se o cliente mantiver disciplina.',
    },
  },

  'aquisicao-acelerada': {
    fit: 'Urgência moderada (necessidade do bem em 6–12 meses) somada a capital parcial disponível para estruturar lance robusto nas primeiras assembleias.',
    caution: 'Quando a urgência é inferior a 3 meses (use financiamento ou compra direta) ou quando o lance comprometeria a reserva de emergência.',
    profile: ['Formação patrimonial'],
    tradeoff: {
      gains: 'Posse em 6–12 meses com custo total inferior ao financiamento; menor exposição aos reajustes da carta.',
      trades: 'Lance fica comprometido até a contemplação — risco de capital parado se a oferta não for vitoriosa de imediato.',
    },
    horizon: {
      short: 'Lance estruturado disputado nas primeiras assembleias; chance de contemplação no primeiro semestre.',
      medium: 'Bem em posse; parcelas pós-contemplação seguem diluídas sem juros adicionais.',
      long: 'Custo total composto por lance + parcelas — abaixo do financiamento equivalente, com posse antecipada. Valor exato depende do simulador.',
    },
  },

  'leverage-patrimonial': {
    fit: 'Cliente com renda estável, reserva robusta cobrindo 6+ meses do agregado de parcelas, e visão patrimonial consciente do risco de exposição múltipla simultânea.',
    caution: 'Renda instável, sem reserva proporcional ao agregado ou tendência a concentrar várias cotas no mesmo grupo (reduz diversificação real).',
    profile: ['Expansão patrimonial'],
    tradeoff: {
      gains: 'Exposição patrimonial multiplicada pelo mesmo capital — múltiplos ativos sob plano, sem dívida bancária.',
      trades: 'Parcela mensal agregada cresce na mesma proporção; reajustes em múltiplas cartas amplificam exposição mensal.',
    },
    horizon: {
      short: 'Lances distribuídos entre cotas; primeiras contemplações começam a escalonar.',
      medium: 'Ativos sob plano em diferentes estágios; fluxo agregado começa a estabilizar.',
      long: 'Portfólio composto formado sem dívida; renda passiva agregada cresce conforme cotas quitam em escada.',
    },
  },

  'alavancagem-imobiliaria': {
    fit: 'Mercados com cap rate locatício consistente e baixa vacância; cliente com visão de portfólio (não apenas um imóvel isolado) e perfil para gestão locatícia.',
    caution: 'Regiões com vacância elevada, cap rate insuficiente para cobrir a parcela ou cliente sem intermediário qualificado para gestão.',
    profile: ['Expansão patrimonial', 'Geração de fluxo'],
    tradeoff: {
      gains: 'O inquilino amortiza o ativo progressivamente — parte expressiva do compromisso mensal é coberta pelo aluguel quando o cap rate é consistente.',
      trades: 'Vacância prolongada interrompe o fluxo previsto; gestão locatícia (ou intermediário) é trabalho recorrente.',
    },
    horizon: {
      short: 'Contemplação em 12–24 meses com lance moderado; locação iniciada logo após a posse.',
      medium: 'Aluguel cobre parcela relevante do compromisso; capital próprio comprometido limitado ao lance.',
      long: 'Ativo quitado pelo inquilino; renda passiva agregada cresce conforme novas cotas são adicionadas ao portfólio.',
    },
  },

  'multiplicacao-cotas': {
    fit: 'Horizonte de 10+ anos, perfil acumulador disciplinado, disposição comprovada para reinvestir sistematicamente o fluxo gerado em vez de consumi-lo.',
    caution: 'Horizonte curto próximo da fase de desacumulação ou quando o cliente trata o caixa liberado como renda disponível para consumo.',
    profile: ['Expansão patrimonial'],
    tradeoff: {
      gains: 'Crescimento patrimonial composto a partir de um aporte inicial — portfólio cresce sem novos aportes pessoais relevantes.',
      trades: 'Renda passiva gerada não está disponível para consumo durante o ciclo de acumulação — disciplina como regra, não opção.',
    },
    horizon: {
      short: 'Primeira cota em produção; renda passiva começa a se acumular para o próximo lance.',
      medium: 'Segundo e terceiro ciclos iniciados; portfólio diversifica naturalmente entre segmentos e janelas.',
      long: 'Múltiplas cotas quitadas geram renda agregada em escada; curva patrimonial composta, não linear.',
    },
  },

  'usar-carta-investir': {
    fit: 'Cliente com orçamento estável o suficiente para sustentar parcelas em paralelo até o fim do plano (10+ anos), mentalidade patrimonial — não de consumo — e disciplina para não consumir o capital aplicado durante o ciclo. Funciona melhor quando o cliente já entende renda fixa e busca antecipar acumulação patrimonial em vez de adquirir um bem específico. Ganha força exponencial quando a contemplação ocorre cedo: cada mês destravado a mais multiplica o efeito de capitalização composta.',
    caution: 'Quando o cliente precisa de liquidez parcial durante o plano, tem orçamento apertado para sustentar parcelas em paralelo, ou está a menos de 5 anos do fim do plano após a contemplação esperada. Também não se aplica a cliente que precisa adquirir o bem após a contemplação — a tese pressupõe manter a carta aplicada até o resgate final. Cenário com CDI cronicamente baixo (juro real negativo prolongado) reduz drasticamente o ganho.',
    profile: ['Formação patrimonial', 'Operação financeira'],
    tradeoff: {
      gains: 'Ganha antecipação patrimonial — pagar 12 meses pode destravar o equivalente a 14 anos de acumulação mensal tradicional. Ganha acesso, via consórcio, a fundo CAIXA com condições equivalentes a produtos que exigem R$ 5 milhões para entrada direta. Ganha custo de capital sem juros bancários (apenas taxa administrativa) e tributação padrão de fundo de renda fixa de longo prazo.',
      trades: 'Troca liquidez total durante o plano — capital fica aplicado e sem saque parcial até o fim. Troca o uso da carta para aquisição do bem — esta tese pressupõe manter a carta no fundo. Troca previsibilidade absoluta — o ganho final depende do CDI futuro, que oscila ao longo dos 10+ anos.',
    },
    horizon: {
      short: 'Meses iniciais antes da contemplação. Cliente paga parcelas do bolso, ainda sem capital rendendo. Risco máximo do plano: contemplação tardia colapsa a tese. Cenário ideal aqui é ser sorteado cedo.',
      medium: 'Após a contemplação até alguns anos antes do fim. Zona ideal da tese: capital integral aplicado em fundo CAIXA, parcelas sendo sustentadas pelo orçamento, capitalização composta acumulando. Quanto maior essa janela, maior o ganho final.',
      long: 'Últimos anos do plano, capitalização composta acumulada se torna materialmente relevante, resgate final se aproxima. A tese se materializa: cliente saca um capital muitas vezes maior do que teria com aporte mensal tradicional equivalente.',
    },
  },

  'venda-carta-lucro': {
    fit: 'Cliente com capital de reserva confortável, que aceita imobilizar dinheiro por 12 a 30 meses e busca diversificar investimentos fora de poupança, CDB ou bolsa. Funciona melhor quando o cliente NÃO tem urgência por um bem específico — o foco é o ganho financeiro, não o consumo. Costuma ter bom retorno em fases de mercado com ágio aquecido (acima de 20% do valor da carta).',
    caution: 'Quando o cliente está apertado financeiramente, tem horizonte curto demais (menos de 12 meses) ou depende emocionalmente do retorno. A operação tem variável de tempo — contemplação pode demorar — e o ganho cai bastante se a janela passar de 30 meses. Acima de 36 meses, vira prejuízo.',
    profile: ['Operação financeira', 'Diversificação'],
    tradeoff: {
      gains: 'Ganha potencial de rendimento bem acima da renda fixa do mesmo prazo, independência do mercado financeiro (não depende de bolsa ou Selic) e liquidez total na saída — recebe à vista quando vende.',
      trades: 'Troca previsibilidade por tempo incerto — não dá pra saber quando vai contemplar. Abre mão de ter o bem (carro ou imóvel): a tese é financeira, não de consumo. E aceita liquidez restrita durante a operação.',
    },
    horizon: {
      short: 'Meses iniciais pagando as parcelas — capital ainda preso no consórcio. Cenário ideal aqui é ser sorteado: investimento mínimo, retorno máximo.',
      medium: 'Janela típica de saída — contemplação entre 12 e 30 meses. Cenário mais provável, com rendimento confortavelmente acima da renda fixa do período.',
      long: 'Acima de 36 meses sem contemplar, a operação perde atratividade. O capital acumulado em parcelas pode superar o ágio recebido — vira prejuízo. Se chegou aqui sem ser contemplado, vale reavaliar a estratégia.',
    },
  },

  'reinvestimento-estruturado': {
    fit: 'Cliente com primeira fonte de renda passiva estabilizada e regra clara de reinvestimento (janelas pré-definidas), em horizonte de 8+ anos.',
    caution: 'Quando a regra de reinvestimento depende de decisão pontual a cada janela — tende a falhar pela inércia ou pelo consumo do caixa liberado.',
    profile: ['Expansão patrimonial', 'Geração de fluxo'],
    tradeoff: {
      gains: 'Renda passiva deixa de ser consumo e vira combustível patrimonial — curva exponencial em horizontes longos.',
      trades: 'Renda disponível para consumo é nula durante o ciclo; disciplina precisa ser tratada como regra automática.',
    },
    horizon: {
      short: 'Primeira janela de reinvestimento; segunda cota contratada.',
      medium: 'Múltiplas cotas em estágios distintos; fluxo agregado começa a financiar lances cada vez maiores.',
      long: 'Portfólio composto em escada; renda agregada cresce em curva exponencial conforme cotas quitam.',
    },
  },

  'autoquitacao-estruturada': {
    fit: 'Ativo com renda recorrente consistente acima da parcela ordinária (aluguel comercial, receita contratada), com regra do grupo que permite amortização extra.',
    caution: 'Quebra na renda do ativo trava a aceleração; antecipação reduz tempo de exposição a reajustes (efeito variável conforme cenário macro).',
    profile: ['Geração de fluxo', 'Formação patrimonial'],
    tradeoff: {
      gains: 'Prazo efetivo reduzido conforme a folga real entre receita do ativo e parcela ordinária; liberação patrimonial antecipada sem novos aportes do capital pessoal.',
      trades: 'Toda a folga gerada pelo ativo é consumida pela amortização — fluxo líquido permanece neutro durante o ciclo.',
    },
    horizon: {
      short: 'Contrato de locação ou receita ativa; primeiras amortizações extras aplicadas.',
      medium: 'Saldo devedor reduzindo mais rápido que o cronograma nominal; cota caminha para quitação antecipada.',
      long: 'Ativo livre antes do prazo nominal; capital liberado financia o próximo ciclo do plano patrimonial.',
    },
  },

  'patrimonio-escalavel': {
    fit: 'Portfólio com massa crítica (tipicamente 3+ ativos ou renda passiva consistente), disciplina contábil estabelecida e apoio profissional para regime tributário adequado.',
    caution: 'Portfólio inicial sem escala suficiente para absorver o custo de manutenção da PJ; tendência a misturar despesas pessoais na estrutura.',
    profile: ['Eficiência tributária', 'Sucessão & governança'],
    tradeoff: {
      gains: 'Carga tributária sobre renda passiva reduzida; segregação patrimonial; estrutura sucessória mais simples.',
      trades: 'Custo recorrente de manutenção da PJ (contabilidade, taxas); rigor contábil obrigatório.',
    },
    horizon: {
      short: 'Estruturação da PJ; migração inicial de ativos com planejamento tributário formal.',
      medium: 'Renda passiva fluindo via PJ; economia tributária acumulando como caixa disponível para novas aquisições.',
      long: 'Estrutura consolidada financia novas cotas com a economia tributária recorrente; sucessão organizada por cotas societárias.',
    },
  },

  'reforma-ampliacao': {
    fit: 'Imóvel com potencial real de valorização pós-obra (localização sólida, plantas eficientes possíveis) e capital insuficiente para arcar com a reforma à vista sem comprometer caixa operacional.',
    caution: 'Quando o orçamento da obra não está dimensionado com folga de 20–30% ou quando a valorização esperada é incerta.',
    profile: ['Uso produtivo', 'Formação patrimonial'],
    tradeoff: {
      gains: 'Investimento organizado sem alienação fiduciária bancária; capital pessoal preservado; valorização real do ativo.',
      trades: 'Janela entre contemplação e conclusão da obra exige gestão; reajustes da carta podem descolar do orçamento original.',
    },
    horizon: {
      short: 'Contemplação e início da obra; capital pessoal mantém-se em reserva.',
      medium: 'Obra concluída; ativo reavaliado por valor superior; parcelas seguem diluídas.',
      long: 'Imóvel valorizado integra o patrimônio sem dívida bancária; cap rate ajustado quando alugado.',
    },
  },

  'retrofit-patrimonial': {
    fit: 'Imóvel bem localizado mas obsoleto, com assimetria estimada entre custo de retrofit e potencial de valorização; cliente com tolerância a prazo de obra de 6–18 meses.',
    caution: 'Quando o custo de retrofit consome parcela relevante do valor pós-obra estimado, ou quando há risco regulatório/urbanístico não mapeado.',
    profile: ['Uso produtivo', 'Expansão patrimonial'],
    tradeoff: {
      gains: 'Reposicionamento do ativo numa faixa superior do mercado; cap rate locatício ajustado pós-obra.',
      trades: 'Janela de obra sem geração de renda; complexidade de gestão maior que reforma simples.',
    },
    horizon: {
      short: 'Estudo de viabilidade, contemplação e início do retrofit.',
      medium: 'Obra concluída; ativo recolocado no mercado a valor superior.',
      long: 'Patrimônio reposicionado; renda locatícia ou ganho de capital captura a assimetria inicial.',
    },
  },

  'energia-solar': {
    fit: 'Imóvel com conta de energia recorrente relevante o suficiente para que a economia mensal acelere o payback, telhado adequado e horizonte de permanência longo na propriedade.',
    caution: 'Conta de energia muito baixa (payback se alonga) ou planos de mudança/venda em prazo inferior ao payback completo.',
    profile: ['Geração de fluxo', 'Uso produtivo'],
    tradeoff: {
      gains: 'Após o payback, a economia mensal vira caixa livre recorrente integralmente; sem dependência de tarifas futuras.',
      trades: 'Capital comprometido na carta até a economia acumulada superar o investimento.',
    },
    horizon: {
      short: 'Sistema instalado; economia mensal substitui a conta de energia integralmente ou parcialmente.',
      medium: 'Economia acumulada se aproxima do investimento; ponto de payback depende de dimensionamento e tarifa local.',
      long: 'Sistema gerando economia recorrente além do payback; vida útil restante ≈ caixa livre direto ao patrimônio.',
    },
  },

  'upgrade-veiculo': {
    fit: 'Cliente com ciclo de troca de veículo definido (3–5 anos) e tolerância à depreciação acumulada; valor do veículo anterior usado como parte do lance.',
    caution: 'Quando o veículo anterior tem alta desvalorização não absorvida ou quando o uso justifica financiamento direto com taxa promocional pontual.',
    profile: ['Uso produtivo'],
    tradeoff: {
      gains: 'Upgrade organizado sem juros bancários; custo efetivo restrito à diferença entre os valores.',
      trades: 'Ciclo de contemplação precisa estar alinhado com a janela de troca planejada.',
    },
    horizon: {
      short: 'Carta contemplada; veículo anterior dado como parte do pagamento.',
      medium: 'Parcelas diluídas; veículo novo em uso sem ônus.',
      long: 'Cota quitada; ciclo pode ser reiniciado para o próximo upgrade sem dependência de financiamento.',
    },
  },

  'renovacao-frota': {
    fit: 'Empresa com 3+ veículos cuja idade média começa a gerar manutenção crescente; renovação escalonada permite distribuir o impacto de caixa.',
    caution: 'Quando o agregado de parcelas das múltiplas cotas comprometeria o capital de giro operacional ou quando a frota atual ainda está dentro da janela ótima de uso.',
    profile: ['Uso produtivo', 'Expansão patrimonial'],
    tradeoff: {
      gains: 'Frota renovada gradualmente; manutenção reduzida; capital de giro preservado.',
      trades: 'Compromisso mensal agregado sobe; coordenação de contemplações exige planejamento.',
    },
    horizon: {
      short: 'Primeiras cotas contratadas; cronograma de renovação distribuído em 24–48 meses.',
      medium: 'Frota parcialmente renovada; ganhos operacionais (manutenção, combustível) começam a se materializar.',
      long: 'Frota integralmente renovada sem evento único de caixa; ciclo pode ser repetido escalonado.',
    },
  },

  'expansao-produtiva': {
    fit: 'Empresa com demanda comprovada que excede a capacidade atual e equipamento cuja receita incremental projetada cobre parcela + custos operacionais com folga.',
    caution: 'Quando a expansão depende de demanda hipotética não validada ou quando o capital de giro pós-equipamento ficaria insuficiente.',
    profile: ['Uso produtivo', 'Expansão patrimonial'],
    tradeoff: {
      gains: 'Capacidade produtiva ampliada sem dívida bancária; receita incremental tende a autofinanciar a parcela.',
      trades: 'Janela entre contratação e contemplação exige planejamento operacional; receita incremental real pode demorar a estabilizar.',
    },
    horizon: {
      short: 'Cota contratada; planejamento operacional alinhado à janela de contemplação.',
      medium: 'Equipamento em operação; receita incremental cobre parcela + manutenção.',
      long: 'Equipamento quitado; receita gerada integra margem operacional; capital de giro permanece preservado durante todo o ciclo.',
    },
  },

  'equipamentos-pesados': {
    fit: 'Operação com receita por hora-máquina mensurável e contratos firmados que justifiquem a aquisição; vantagem do consórcio sobre financiamento é particularmente expressiva nessa categoria.',
    caution: 'Quando o equipamento depende de demanda pontual não recorrente ou quando a manutenção/operação corrói a margem além do projetado.',
    profile: ['Uso produtivo', 'Expansão patrimonial'],
    tradeoff: {
      gains: 'Custo financeiro substancialmente abaixo do financiamento bancário pesado; ativo se autofinancia com receita por hora-máquina.',
      trades: 'Imobilização significativa de capital até a contemplação; manutenção exige caixa operacional dedicado.',
    },
    horizon: {
      short: 'Lance estruturado para acelerar contemplação alinhada ao início dos contratos.',
      medium: 'Equipamento gerando receita; parcela coberta pelo fluxo operacional.',
      long: 'Equipamento quitado e ainda dentro da vida útil produtiva — receita por hora-máquina vira margem direta.',
    },
  },

  'agronegocio': {
    fit: 'Produtor com calendário de safra previsível e necessidade de maquinário cujo timing de contemplação possa ser planejado para anteceder o pico de receita.',
    caution: 'Ciclos consecutivos de safra adversa podem comprimir o fluxo abaixo da parcela; concentração em uma única cultura amplifica o risco.',
    profile: ['Uso produtivo', 'Geração de fluxo'],
    tradeoff: {
      gains: 'Capital de giro preservado para insumos e custeio; equipamento contemplado em janela alinhada à safra.',
      trades: 'Renda do agronegócio é cíclica — reserva proporcional necessária para absorver ciclos adversos.',
    },
    horizon: {
      short: 'Contrato firmado e lance estruturado em janela pré-safra.',
      medium: 'Maquinário em operação durante safras consecutivas; receita amortiza a parcela.',
      long: 'Equipamento quitado; ciclo pode ser repetido para próxima geração de maquinário sem dependência de crédito rural.',
    },
  },

  'patrimonio-rural': {
    fit: 'Investidor buscando diversificação real com horizonte de 15+ anos; tolerância à liquidez restrita de terra; possibilidade de arrendamento ou produção própria.',
    caution: 'Quando o investidor precisa de liquidez no médio prazo ou quando a região tem incertezas regulatórias (ambientais, fundiárias) não mapeadas.',
    profile: ['Formação patrimonial', 'Geração de fluxo'],
    tradeoff: {
      gains: 'Patrimônio com baixa correlação com ativos financeiros; valorização real de longo prazo + renda por arrendamento.',
      trades: 'Liquidez reduzida; gestão remota exige intermediário qualificado.',
    },
    horizon: {
      short: 'Contemplação e formalização da aquisição.',
      medium: 'Terra produzindo ou arrendada; fluxo recorrente amortiza a cota.',
      long: 'Ativo valorizado + renda recorrente; função de diversificação real consolidada no portfólio.',
    },
  },

  'renda-passiva': {
    fit: 'Cliente em transição entre fase laboral e fase patrimonial (45–55 anos), buscando substituir gradualmente renda ativa por renda de capital.',
    caution: 'Quando o horizonte disponível é inferior a 8 anos ou quando a expectativa é gerar renda de imediato (cotas quitando levam tempo).',
    profile: ['Geração de fluxo'],
    tradeoff: {
      gains: 'Construção sistemática de renda passiva agregada em escada — independente da renda ativa do cliente.',
      trades: 'Renda passiva só começa a fluir quando as primeiras cotas quitam; horizonte mínimo de 5–8 anos antes do primeiro fluxo relevante.',
    },
    horizon: {
      short: 'Múltiplas cotas contratadas com janelas escalonadas.',
      medium: 'Primeiras cotas quitando; aluguéis começam a entrar no agregado mensal.',
      long: 'Renda agregada substancial; transição entre renda ativa e renda passiva consolidada.',
    },
  },

  'patrimonio-gerador-caixa': {
    fit: 'Portfólio em consolidação com objetivo explícito de diversificação real entre classes não-correlacionadas (imobiliário + equipamentos + frota produtiva).',
    caution: 'Quando o cliente concentra todas as cotas em uma única classe — perde a tese de diversificação que justifica a estratégia.',
    profile: ['Geração de fluxo', 'Expansão patrimonial'],
    tradeoff: {
      gains: 'Renda agregada flui de fontes não-correlacionadas; suaviza ciclos adversos de mercados específicos.',
      trades: 'Gestão de portfólio diversificado exige conhecimento de múltiplos setores ou apoio profissional.',
    },
    horizon: {
      short: 'Distribuição inicial das cotas entre classes definidas no plano.',
      medium: 'Primeiras cotas geram fluxo; diversificação real começa a se materializar.',
      long: 'Renda agregada crescente em camadas; portfólio resiliente a ciclos adversos setoriais.',
    },
  },

  'holding-patrimonial': {
    fit: 'Portfólio consolidado com massa crítica de ativos relevantes e renda passiva recorrente significativa; necessidade explícita de governança formal e organização sucessória.',
    caution: 'Estruturar holding antes do portfólio atingir massa crítica — custo de manutenção tende a superar o benefício tributário no curto prazo.',
    profile: ['Eficiência tributária', 'Sucessão & governança'],
    tradeoff: {
      gains: 'Governança consolidada + eficiência tributária recorrente + organização sucessória num único veículo.',
      trades: 'Custo de manutenção, contabilidade especializada e disciplina contábil obrigatórios.',
    },
    horizon: {
      short: 'Estruturação da holding com planejamento tributário e sucessório formal.',
      medium: 'Ativos migrados; economia tributária recorrente acumulada como caixa disponível.',
      long: 'Economia capitalizada financia novas aquisições dentro da estrutura; sucessão por cotas societárias evita inventário.',
    },
  },

  'planejamento-sucessorio': {
    fit: 'Cliente com patrimônio significativo, herdeiros identificados e desejo explícito de organizar a sucessão em vida com previsibilidade e preservação do controle.',
    caution: 'Quando há conflito familiar não resolvido — a estruturação formal cristaliza disputas em vez de neutralizá-las.',
    profile: ['Sucessão & governança', 'Preservação de capital'],
    tradeoff: {
      gains: 'Transferência ordenada em vida; controle preservado via usufruto; custo tributário sucessório otimizado.',
      trades: 'Decisões sucessórias precisam ser tomadas explicitamente — exige conversa familiar e assessoria jurídica qualificada.',
    },
    horizon: {
      short: 'Estruturação formal (doação com reserva de usufruto, cotas societárias).',
      medium: 'Estrutura em operação; herdeiros familiarizados com a governança.',
      long: 'Sucessão executada sem inventário prolongado nem bloqueio de ativos; patrimônio segue produtivo na transição.',
    },
  },
};

export function getDecisionSupport(strategyId: string): DecisionSupport | undefined {
  return DECISION_SUPPORT_BY_ID[strategyId];
}
