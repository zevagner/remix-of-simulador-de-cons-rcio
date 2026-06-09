/**
 * OBJECTIONS data array — extracted from objectionsLibrary for modularity.
 * Pure data file, no logic. Categories/profiles defined in objectionsLibrary.
 */
import type { Objection } from './types';

export const OBJECTIONS: Objection[] = [
  // ═══════════════════════════════════════════
  // 💰 PREÇO / PARCELA (12)
  // ═══════════════════════════════════════════
  {
    id: 'preco-01', category: 'preco',
    clientPhrase: 'Está caro demais.',
    response: 'Entendo a preocupação com o valor. Mas vamos olhar por outro ângulo: no consórcio, você não paga juros — paga uma taxa administrativa que, no final, gera uma economia significativa comparada ao financiamento. A parcela pode parecer parecida, mas o custo total é bem menor.',
    tags: ['parcela', 'custo'],
  },
  {
    id: 'preco-02', category: 'preco',
    clientPhrase: 'A taxa administrativa é alta.',
    response: 'A taxa administrativa é diluída ao longo de todo o plano e, mesmo assim, o custo total do consórcio costuma ser 30% a 50% menor que um financiamento. Ela cobre a gestão do grupo e a segurança do processo. É um investimento, não um custo extra.',
    tags: ['taxa', 'administração'],
  },
  {
    id: 'preco-03', category: 'preco',
    clientPhrase: 'Consigo condição melhor em outro lugar.',
    response: 'Cada cenário é único. O importante é comparar o custo total — não apenas a parcela. Com consórcio, você elimina juros compostos. Posso mostrar a comparação lado a lado pra você avaliar com clareza.',
    tags: ['concorrência', 'comparação'],
  },
  {
    id: 'preco-04', category: 'preco',
    clientPhrase: 'A parcela não cabe no meu orçamento.',
    response: 'A gente consegue ajustar o plano para caber melhor, sem perder a estratégia. Podemos mexer no prazo ou no valor da carta. O importante é que funcione pra você.',
    tags: ['parcela', 'ajuste'],
  },
  {
    id: 'preco-05', category: 'preco',
    clientPhrase: 'Tem fundo de reserva? Isso encarece.',
    response: 'O fundo de reserva é uma proteção — serve pra cobrir inadimplência no grupo e garantir que todos sejam contemplados. É um valor pequeno na parcela que protege o seu investimento.',
    tags: ['fundo reserva', 'proteção'],
  },
  {
    id: 'preco-06', category: 'preco',
    clientPhrase: 'Por que tem seguro na parcela?',
    response: 'O seguro garante que, se algo acontecer com você, sua família não fica com a dívida. É uma proteção obrigatória que beneficia todos no grupo. O valor é muito menor que um seguro contratado separadamente.',
    tags: ['seguro', 'proteção'],
  },
  {
    id: 'preco-07', category: 'preco',
    clientPhrase: 'Se não tenho juros, por que pago mais que o valor do bem?',
    response: 'Você paga a taxa administrativa e o fundo de reserva, que juntos são muito menores que os juros do financiamento. Compare: no financiamento você paga até 2x o valor do bem. No consórcio, o custo extra fica na faixa de 15% a 20%.',
    tags: ['custo total', 'comparação'],
  },
  {
    id: 'preco-08', category: 'preco',
    clientPhrase: 'A parcela vai reajustar?',
    response: 'Sim, a parcela acompanha o índice de correção do grupo. Mas isso é uma vantagem: seu poder de compra é preservado. A carta de crédito também é corrigida, então você nunca perde valor.',
    tags: ['reajuste', 'correção'],
  },
  {
    id: 'preco-09', category: 'preco',
    clientPhrase: 'O valor total pago é muito alto.',
    response: 'Vamos comparar: no financiamento, o valor total chega a quase o dobro. No consórcio, mesmo com taxa e fundo de reserva, o custo total é muito menor. Posso te mostrar os números lado a lado.',
    tags: ['custo total', 'financiamento'],
  },
  {
    id: 'preco-10', category: 'preco',
    clientPhrase: 'Tenho medo de pagar e não usar.',
    response: 'O consórcio é um compromisso, mas com regras claras. Se precisar sair, existem mecanismos de devolução. E enquanto está pagando, seu crédito está protegido e pode ser contemplado a qualquer momento.',
    tags: ['desistência', 'segurança'],
  },
  {
    id: 'preco-11', category: 'preco',
    clientPhrase: 'Não quero assumir parcelas longas.',
    response: 'Existem planos com prazos menores. E quanto menor o prazo, mais rápido você termina — e menor o custo total proporcionalmente. Vamos encontrar o equilíbrio ideal pra você.',
    tags: ['prazo', 'parcela'],
  },
  {
    id: 'preco-12', category: 'preco',
    clientPhrase: 'Achei mais barato em outra administradora.',
    response: 'O preço é importante, mas não é tudo. Avalie a solidez da administradora, o histórico de contemplação e a transparência. Uma administradora consolidada oferece segurança institucional que outras não conseguem igualar.',
    tags: ['concorrência', 'segurança'],
  },

  // ═══════════════════════════════════════════
  // ⏳ PRAZO (10)
  // ═══════════════════════════════════════════
  {
    id: 'tempo-01', category: 'tempo',
    clientPhrase: 'Consórcio demora muito.',
    response: 'Depende da estratégia. Com um lance bem posicionado, muitos clientes são contemplados nos primeiros meses. E mesmo sem lance, o sorteio acontece todo mês. O consórcio não é "esperar" — é planejar com inteligência.',
    tags: ['prazo', 'contemplação'],
  },
  {
    id: 'tempo-02', category: 'tempo',
    clientPhrase: 'Não quero esperar anos.',
    response: 'Com a estratégia certa de lance, a contemplação pode acontecer em poucos meses. Além disso, enquanto espera, você está construindo patrimônio — não pagando juros de financiamento. É um planejamento ativo, não passivo.',
    tags: ['lance', 'antecipação'],
  },
  {
    id: 'tempo-03', category: 'tempo',
    clientPhrase: 'Quanto tempo demora pra ser contemplado?',
    response: 'Isso depende da estratégia de lance e do comportamento do grupo. Consigo simular cenários pra você: com lance de X%, a probabilidade é Y. Quer que eu mostre os números?',
    tags: ['simulação', 'probabilidade'],
  },
  {
    id: 'tempo-04', category: 'tempo',
    clientPhrase: 'Preciso do bem em 6 meses.',
    response: 'Com lance estratégico, 6 meses é uma meta possível. Vamos analisar o grupo e ver qual percentual de lance te daria as melhores chances nesse prazo.',
    tags: ['prazo curto', 'lance'],
  },
  {
    id: 'tempo-05', category: 'tempo',
    clientPhrase: 'E se eu esperar o prazo todo e não for contemplado?',
    response: 'Isso não acontece. Até o final do grupo, todos os participantes são contemplados — é garantido por lei. A questão é quando, e isso a gente pode acelerar com estratégia.',
    tags: ['garantia', 'lei'],
  },
  {
    id: 'tempo-06', category: 'tempo',
    clientPhrase: 'Não sei se vou querer o bem daqui a 5 anos.',
    response: 'A carta de crédito é flexível — você pode usar pra outro bem da mesma categoria ou até transferir. Não fica preso a uma escolha. E o crédito se valoriza com a correção.',
    tags: ['flexibilidade', 'carta'],
  },
  {
    id: 'tempo-07', category: 'tempo',
    clientPhrase: 'O prazo do grupo é muito longo.',
    response: 'O prazo total do grupo não é o mesmo que o seu prazo pra contemplação. Com lance, você pode ser contemplado muito antes do fim do grupo e seguir pagando parcelas normalmente.',
    tags: ['grupo', 'contemplação'],
  },
  {
    id: 'tempo-08', category: 'tempo',
    clientPhrase: 'Já tentei consórcio e demorou demais.',
    response: 'Provavelmente faltou estratégia de lance. Hoje temos ferramentas de análise que identificam o momento certo de ofertar. É uma abordagem muito mais inteligente e previsível.',
    tags: ['estratégia', 'experiência'],
  },
  {
    id: 'tempo-09', category: 'tempo',
    clientPhrase: 'Minha situação pode mudar até lá.',
    response: 'Justamente por isso o consórcio é flexível. Se precisar, pode transferir a cota, antecipar parcelas ou usar a carta pra outra finalidade. Você se adapta sem perder o que já investiu.',
    tags: ['flexibilidade', 'mudança'],
  },
  {
    id: 'tempo-10', category: 'tempo',
    clientPhrase: 'Prefiro juntar o dinheiro sozinho.',
    response: 'É uma opção válida. Mas considere: enquanto você junta, o preço do bem sobe. No consórcio, sua carta é corrigida automaticamente. Você preserva o poder de compra e ainda pode ser contemplado antes de terminar de pagar.',
    tags: ['poupança', 'inflação'],
  },

  // ═══════════════════════════════════════════
  // 🎯 CONTEMPLAÇÃO (10)
  // ═══════════════════════════════════════════
  {
    id: 'contemplacao-01', category: 'contemplacao',
    clientPhrase: 'Não tenho garantia de quando vou ser contemplado.',
    response: 'Isso é verdade. Mas com base no histórico do grupo, conseguimos trabalhar com previsibilidade. Não é aposta — é estratégia baseada em dados reais.',
    tags: ['previsibilidade', 'dados'],
  },
  {
    id: 'contemplacao-02', category: 'contemplacao',
    clientPhrase: 'Tenho medo de não ser contemplado.',
    response: 'O consórcio é uma construção. Com estratégia, você não fica dependente apenas da sorte. E até o final do grupo, a contemplação é garantida por lei.',
    tags: ['medo', 'garantia'],
  },
  {
    id: 'contemplacao-03', category: 'contemplacao',
    clientPhrase: 'Sorteio é sorte, não quero depender disso.',
    response: 'Concordo. Por isso existem os lances. Com lance, você assume o controle. O sorteio é um bônus, não a única forma de contemplação.',
    tags: ['sorteio', 'lance'],
  },
  {
    id: 'contemplacao-04', category: 'contemplacao',
    clientPhrase: 'Qual a chance de ser contemplado por sorteio?',
    response: 'Depende do tamanho do grupo. Mas a cada assembleia, pelo menos uma cota é sorteada. E combinando sorteio com lance, as chances aumentam consideravelmente.',
    tags: ['probabilidade', 'assembleia'],
  },
  {
    id: 'contemplacao-05', category: 'contemplacao',
    clientPhrase: 'E se eu der lance e não for contemplado?',
    response: 'O lance não contemplado volta pra você — não é perdido. Ele fica disponível pra você tentar novamente na assembleia seguinte. Não há risco de perder dinheiro com lance.',
    tags: ['lance', 'devolução'],
  },
  {
    id: 'contemplacao-06', category: 'contemplacao',
    clientPhrase: 'Como funciona a assembleia?',
    response: 'Todo mês acontece uma assembleia onde são feitos sorteios e avaliados os lances. Os contemplados recebem a carta de crédito. É um processo transparente e organizado pela administradora.',
    tags: ['assembleia', 'processo'],
  },
  {
    id: 'contemplacao-07', category: 'contemplacao',
    clientPhrase: 'Posso ser contemplado no primeiro mês?',
    response: 'Sim! Com lance competitivo, é possível ser contemplado já na primeira assembleia. Vamos analisar o histórico do grupo pra definir a melhor estratégia.',
    tags: ['primeiro mês', 'lance'],
  },
  {
    id: 'contemplacao-08', category: 'contemplacao',
    clientPhrase: 'O que acontece depois de contemplado?',
    response: 'Você recebe a carta de crédito e pode usar pra adquirir o bem. A parcela pode até reduzir, dependendo do lance oferecido. Você continua pagando normalmente até o fim do plano.',
    tags: ['pós-contemplação', 'carta'],
  },
  {
    id: 'contemplacao-09', category: 'contemplacao',
    clientPhrase: 'Contemplação é aleatória?',
    response: 'O sorteio sim, mas o lance não. Com lance, você escolhe quando tentar. E usando dados do grupo, conseguimos posicionar o lance com muito mais assertividade.',
    tags: ['controle', 'estratégia'],
  },
  {
    id: 'contemplacao-10', category: 'contemplacao',
    clientPhrase: 'Quantas pessoas são contempladas por mês?',
    response: 'Depende do grupo, mas geralmente há contemplação por sorteio e por lance em cada assembleia. Em grupos maiores, são várias contemplações por mês. Posso te mostrar os dados do seu grupo.',
    tags: ['assembleia', 'dados'],
  },

  // ═══════════════════════════════════════════
  // 🏦 FINANCIAMENTO (10)
  // ═══════════════════════════════════════════
  {
    id: 'financiamento-01', category: 'financiamento',
    clientPhrase: 'Prefiro financiamento — pelo menos já pego o bem.',
    response: 'Faz sentido pensar assim. Mas considere: no financiamento, você pega o bem e paga até o dobro por ele em juros. No consórcio, o custo total é muito menor. Se não há urgência imediata, o consórcio protege seu bolso no longo prazo.',
    tags: ['juros', 'comparação'],
  },
  {
    id: 'financiamento-02', category: 'financiamento',
    clientPhrase: 'No financiamento eu tenho garantia de receber.',
    response: 'No consórcio também há garantia — o crédito é seu quando contemplado, por sorteio ou lance. A diferença é que você não paga juros compostos. E os recursos do grupo são administrados pela administradora.',
    tags: ['garantia', 'segurança'],
  },
  {
    id: 'financiamento-03', category: 'financiamento',
    clientPhrase: 'Financiamento é mais simples.',
    response: 'Entendo. O consórcio parece mais complexo à primeira vista, mas na prática é simples: você paga a parcela e participa das assembleias. A diferença é que economiza muito mais. Posso te mostrar passo a passo.',
    tags: ['simplicidade', 'processo'],
  },
  {
    id: 'financiamento-04', category: 'financiamento',
    clientPhrase: 'Financiamento é mais seguro.',
    response: 'Ele é mais previsível em termos de prazo, mas você paga caro por isso. No consórcio, você troca juros por estratégia — e economiza significativamente no custo total.',
    tags: ['segurança', 'custo'],
  },
  {
    id: 'financiamento-05', category: 'financiamento',
    clientPhrase: 'No banco me ofereceram taxa boa de financiamento.',
    response: 'Mesmo uma "taxa boa" de financiamento resulta em juros compostos ao longo de anos. Compare o custo total final dos dois: o consórcio quase sempre sai mais barato. Posso fazer essa conta pra você.',
    tags: ['taxa', 'juros compostos'],
  },
  {
    id: 'financiamento-06', category: 'financiamento',
    clientPhrase: 'Já aprovei meu financiamento.',
    response: 'Ter financiamento aprovado é ótimo — mostra que você tem crédito. Mas antes de assinar, vale comparar. O consórcio pode te dar o mesmo bem pagando menos no total. Uns minutos de comparação podem economizar milhares.',
    tags: ['aprovação', 'comparação'],
  },
  {
    id: 'financiamento-07', category: 'financiamento',
    clientPhrase: 'Financiamento me dá o bem na hora.',
    response: 'Verdade. Mas o preço dessa "hora" são juros que podem dobrar o valor do bem. Se você pode planejar com alguns meses de antecedência, o consórcio entrega o mesmo resultado por muito menos.',
    tags: ['imediatismo', 'juros'],
  },
  {
    id: 'financiamento-08', category: 'financiamento',
    clientPhrase: 'Posso quitar o financiamento depois com FGTS.',
    response: 'No consórcio você também pode usar o FGTS — tanto para dar lance quanto para complementar o crédito. E como não tem juros, seu FGTS rende mais dentro do consórcio.',
    tags: ['FGTS', 'quitação'],
  },
  {
    id: 'financiamento-09', category: 'financiamento',
    clientPhrase: 'E se eu fizer os dois ao mesmo tempo?',
    response: 'É uma estratégia inteligente que alguns clientes usam. Financiam agora e entram no consórcio para quitar o financiamento quando contemplados. Assim eliminam os juros futuros.',
    tags: ['estratégia dupla', 'quitação'],
  },
  {
    id: 'financiamento-10', category: 'financiamento',
    clientPhrase: 'No financiamento eu posso escolher o prazo.',
    response: 'No consórcio também. Existem grupos com diferentes prazos. E a vantagem é que, independente do prazo escolhido, você não paga juros — apenas taxa administrativa.',
    tags: ['prazo', 'flexibilidade'],
  },

  // ═══════════════════════════════════════════
  // 🛡️ CONFIANÇA (10)
  // ═══════════════════════════════════════════
  {
    id: 'confianca-01', category: 'confianca',
    clientPhrase: 'Não confio em consórcio.',
    response: 'Essa desconfiança geralmente vem de experiências ruins ou falta de informação. Os consórcios regulados pelo Banco Central são seguros. E quando administrados por instituições financeiras sólidas, têm respaldo de uma das maiores estruturas do sistema financeiro nacional.',
    tags: ['regulação', 'banco central'],
  },
  {
    id: 'confianca-02', category: 'confianca',
    clientPhrase: 'Já ouvi falar de golpe com consórcio.',
    response: 'Infelizmente existem golpes — mas eles acontecem com empresas não regulamentadas. Os consórcios de administradoras autorizadas são fiscalizados pelo Banco Central e seguem regras rígidas. Seu dinheiro fica protegido no fundo do grupo.',
    tags: ['golpe', 'segurança'],
  },
  {
    id: 'confianca-03', category: 'confianca',
    clientPhrase: 'E se a administradora quebrar?',
    response: 'Os recursos do consórcio ficam em conta separada — não se misturam com o patrimônio da administradora. Mesmo em caso extremo, o fundo do grupo está protegido. E quando a administradora é uma instituição financeira de grande porte, há ainda mais respaldo institucional.',
    tags: ['patrimônio', 'proteção'],
  },
  {
    id: 'confianca-04', category: 'confianca',
    clientPhrase: 'Consórcio não é confiável.',
    response: 'Hoje é um sistema regulado pelo Banco Central e com décadas de funcionamento. Milhões de brasileiros já usaram consórcio para adquirir bens. A questão é escolher uma administradora sólida e fiscalizada.',
    tags: ['regulação', 'histórico'],
  },
  {
    id: 'confianca-05', category: 'confianca',
    clientPhrase: 'Meu pai/mãe disse que consórcio é furada.',
    response: 'Entendo. Há alguns anos, o mercado tinha menos regulação e mais problemas. Hoje é completamente diferente: Banco Central fiscaliza, as regras são claras e existem administradoras sólidas e seguras no mercado.',
    tags: ['família', 'regulação'],
  },
  {
    id: 'confianca-06', category: 'confianca',
    clientPhrase: 'E se o grupo tiver muita inadimplência?',
    response: 'O fundo de reserva existe exatamente pra isso — ele cobre a inadimplência e protege o funcionamento do grupo. Além disso, a administradora faz gestão ativa dos grupos para manter a saúde financeira.',
    tags: ['inadimplência', 'fundo reserva'],
  },
  {
    id: 'confianca-07', category: 'confianca',
    clientPhrase: 'Não confio em sorteio.',
    response: 'O sorteio é auditado e transparente. Mas se prefere não depender dele, o lance te dá o controle. Muitos clientes são contemplados exclusivamente por lance, sem precisar do sorteio.',
    tags: ['sorteio', 'transparência'],
  },
  {
    id: 'confianca-08', category: 'confianca',
    clientPhrase: 'Li reclamações na internet.',
    response: 'É importante avaliar o contexto. Muitas reclamações vêm de falta de entendimento sobre o processo. Aqui, trabalho com transparência total — você vai entender cada etapa antes de decidir.',
    tags: ['reclamações', 'transparência'],
  },
  {
    id: 'confianca-09', category: 'confianca',
    clientPhrase: 'Tenho medo de ser enganado.',
    response: 'Sua cautela é válida. Por isso sugiro: pesquise sobre a regulação do Banco Central, verifique o CNPJ da administradora e leia o contrato com calma. Estou aqui pra esclarecer cada ponto.',
    tags: ['cautela', 'contrato'],
  },
  {
    id: 'confianca-10', category: 'confianca',
    clientPhrase: 'Como sei que meu dinheiro está seguro?',
    response: 'O dinheiro do grupo fica em conta separada, fiscalizada pelo Banco Central. Não é possível que a administradora use pra outras finalidades. É um dos sistemas mais regulados do mercado financeiro brasileiro.',
    tags: ['segurança', 'regulação'],
  },

  // ═══════════════════════════════════════════
  // 💸 LANCE (10)
  // ═══════════════════════════════════════════
  {
    id: 'lance-01', category: 'lance',
    clientPhrase: 'Não tenho dinheiro para dar lance.',
    response: 'Existe o lance embutido, que usa parte da própria carta de crédito. Ou seja, você não precisa de dinheiro extra — a estratégia é montada com o que já está previsto no plano.',
    tags: ['lance embutido', 'alternativa'],
  },
  {
    id: 'lance-02', category: 'lance',
    clientPhrase: 'O que é lance embutido?',
    response: 'É quando você usa uma parte da sua carta de crédito como lance. Por exemplo, numa carta de R$ 200 mil, você pode usar até 30% como lance sem tirar dinheiro do bolso. Seu crédito líquido fica menor, mas a contemplação vem mais rápido.',
    tags: ['lance embutido', 'explicação'],
  },
  {
    id: 'lance-03', category: 'lance',
    clientPhrase: 'Lance é dinheiro jogado fora?',
    response: 'De jeito nenhum. O lance é como antecipar parcelas — ele desconta do saldo devedor. Você não paga mais do que pagaria, apenas antecipa. E ganha a contemplação em troca.',
    tags: ['antecipação', 'parcela'],
  },
  {
    id: 'lance-04', category: 'lance',
    clientPhrase: 'Qual o lance mínimo pra ser contemplado?',
    response: 'Isso varia por grupo e por assembleia. Com base nos dados históricos, consigo te mostrar a faixa de lance vencedor dos últimos meses. Assim você posiciona seu lance com mais assertividade.',
    tags: ['histórico', 'estratégia'],
  },
  {
    id: 'lance-05', category: 'lance',
    clientPhrase: 'E se todo mundo der lance alto?',
    response: 'Nem todos os participantes dão lance — muitos preferem esperar o sorteio. E com os dados do grupo, conseguimos identificar padrões e encontrar janelas de oportunidade com lances mais acessíveis.',
    tags: ['competição', 'dados'],
  },
  {
    id: 'lance-06', category: 'lance',
    clientPhrase: 'Posso usar FGTS como lance?',
    response: 'Sim! O FGTS pode ser usado como lance em consórcios imobiliários. É uma forma inteligente de usar um recurso que já é seu para acelerar a contemplação.',
    tags: ['FGTS', 'imobiliário'],
  },
  {
    id: 'lance-07', category: 'lance',
    clientPhrase: 'Lance fixo ou lance livre?',
    response: 'O lance fixo tem um valor pré-definido pela administradora, e todos que oferecem vão para sorteio. O lance livre é competitivo — ganha o maior. Cada um tem vantagens dependendo da sua estratégia.',
    tags: ['tipos', 'diferença'],
  },
  {
    id: 'lance-08', category: 'lance',
    clientPhrase: 'Posso dar lance todo mês?',
    response: 'Sim! Você pode tentar lance em todas as assembleias. Se não for contemplado, o valor não é debitado e você tenta novamente no mês seguinte. Sem risco.',
    tags: ['recorrência', 'sem risco'],
  },
  {
    id: 'lance-09', category: 'lance',
    clientPhrase: 'Como saber o melhor momento pra dar lance?',
    response: 'Analisando o histórico de lances vencedores do grupo. Existem meses onde os lances são mais baixos — essas são as melhores janelas. Posso te ajudar a identificar esses momentos.',
    tags: ['timing', 'análise'],
  },
  {
    id: 'lance-10', category: 'lance',
    clientPhrase: 'Lance embutido reduz minha carta?',
    response: 'Sim, o crédito líquido fica menor. Mas a vantagem é ser contemplado mais rápido sem gastar dinheiro do bolso. É uma troca que muitos clientes consideram vantajosa, especialmente quando o objetivo principal é acelerar.',
    tags: ['crédito líquido', 'troca'],
  },

  // ═══════════════════════════════════════════
  // ⚡ URGÊNCIA (8)
  // ═══════════════════════════════════════════
  {
    id: 'urgencia-01', category: 'urgencia',
    clientPhrase: 'Preciso do bem agora.',
    response: 'Se a urgência é real, o financiamento pode ser o caminho. Mas se "agora" significa "nos próximos meses", o consórcio com lance pode resolver — e com muito menos custo. Qual é o seu prazo ideal?',
    tags: ['prazo', 'necessidade'],
  },
  {
    id: 'urgencia-02', category: 'urgencia',
    clientPhrase: 'Não posso esperar ser sorteado.',
    response: 'Você não precisa depender só do sorteio. Com um lance estratégico, a contemplação pode acontecer rapidamente. Posso simular o cenário com diferentes valores de lance.',
    tags: ['sorteio', 'lance'],
  },
  {
    id: 'urgencia-03', category: 'urgencia',
    clientPhrase: 'Achei um imóvel que quero comprar agora.',
    response: 'Entendo a urgência. Uma opção é entrar no consórcio e dar lance na primeira assembleia. Se contemplado, você negocia com o vendedor. Muitos aceitam esperar algumas semanas pelo crédito.',
    tags: ['imóvel', 'negociação'],
  },
  {
    id: 'urgencia-04', category: 'urgencia',
    clientPhrase: 'Preciso de um carro pra trabalhar.',
    response: 'Entendo que é urgente. Mas se você puder esperar 2-3 meses com uma boa estratégia de lance, a economia pode chegar a dezenas de milhares de reais. Vale pensar: qual o custo de esperar um pouco?',
    tags: ['carro', 'economia'],
  },
  {
    id: 'urgencia-05', category: 'urgencia',
    clientPhrase: 'O preço do imóvel vai subir.',
    response: 'A carta de crédito do consórcio é corrigida — se o preço sobe, sua carta acompanha. Você não perde poder de compra. Essa é uma vantagem que o dinheiro guardado na poupança não oferece.',
    tags: ['valorização', 'correção'],
  },
  {
    id: 'urgencia-06', category: 'urgencia',
    clientPhrase: 'Não posso perder essa oportunidade.',
    response: 'Oportunidades aparecem o tempo todo. O importante é ter uma estratégia que te permita aproveitar quando surgir. O consórcio te prepara financeiramente sem te endividar com juros.',
    tags: ['oportunidade', 'preparação'],
  },
  {
    id: 'urgencia-07', category: 'urgencia',
    clientPhrase: 'Meu aluguel está muito caro.',
    response: 'Justamente por isso o consórcio faz sentido. Você troca o aluguel pela parcela do consórcio e, quando contemplado, elimina essa despesa. É como redirecionar o que já gasta para construir algo seu.',
    tags: ['aluguel', 'investimento'],
  },
  {
    id: 'urgencia-08', category: 'urgencia',
    clientPhrase: 'Preciso resolver isso rápido.',
    response: 'Perfeito, então vamos focar em uma estratégia com lance para encurtar esse tempo. Com os dados certos, consigo te mostrar o caminho mais rápido dentro do consórcio.',
    tags: ['rapidez', 'estratégia'],
  },

  // ═══════════════════════════════════════════
  // 📢 EXPERIÊNCIA (8)
  // ═══════════════════════════════════════════
  {
    id: 'experiencia-01', category: 'experiencia',
    clientPhrase: 'Conheço gente que se deu mal com consórcio.',
    response: 'Lamento ouvir isso. Na maioria dos casos, problemas acontecem por falta de planejamento ou por administradoras não regulamentadas. Aqui trabalhamos com dados reais e estratégia — nada é no escuro.',
    tags: ['relato', 'planejamento'],
  },
  {
    id: 'experiencia-02', category: 'experiencia',
    clientPhrase: 'Já tentei consórcio e não fui contemplado.',
    response: 'Isso pode ter acontecido por falta de estratégia de lance. Hoje temos ferramentas que analisam o grupo e indicam o melhor posicionamento. É uma abordagem muito diferente de simplesmente "torcer pra dar certo".',
    tags: ['contemplação', 'estratégia'],
  },
  {
    id: 'experiencia-03', category: 'experiencia',
    clientPhrase: 'Meu amigo desistiu e perdeu dinheiro.',
    response: 'Quando alguém desiste, o valor pago é devolvido através de sorteio em assembleia. Não é imediato, mas o dinheiro volta. O ideal é entrar com planejamento pra não precisar desistir.',
    tags: ['desistência', 'devolução'],
  },
  {
    id: 'experiencia-04', category: 'experiencia',
    clientPhrase: 'Ouvi dizer que as parcelas sobem muito.',
    response: 'As parcelas são corrigidas pelo mesmo índice da carta de crédito. Então sim, elas sobem, mas seu poder de compra é preservado proporcionalmente. É diferente de um reajuste "surpresa".',
    tags: ['reajuste', 'correção'],
  },
  {
    id: 'experiencia-05', category: 'experiencia',
    clientPhrase: 'Um colega pagou consórcio por anos e não usou.',
    response: 'Isso pode acontecer quando não há estratégia. Com análise dos dados do grupo e posicionamento de lance, a contemplação pode vir muito mais rápido. O cenário hoje é bem diferente de anos atrás.',
    tags: ['inatividade', 'estratégia'],
  },
  {
    id: 'experiencia-06', category: 'experiencia',
    clientPhrase: 'Na internet falam mal de consórcio.',
    response: 'Na internet falam mal de tudo. O importante é avaliar os fatos: consórcio é regulado pelo Banco Central, tem regras claras e milhões de brasileiros já realizaram sonhos com ele. Posso te mostrar dados concretos.',
    tags: ['internet', 'dados'],
  },
  {
    id: 'experiencia-07', category: 'experiencia',
    clientPhrase: 'Minha experiência anterior foi ruim.',
    response: 'Sinto muito por isso. Cada grupo e cada administradora são diferentes. Trabalhamos com administradora sólida e regulada, além de ferramentas que não existiam antes. Quer que eu te mostre como é diferente agora?',
    tags: ['experiência ruim', 'diferencial'],
  },
  {
    id: 'experiencia-08', category: 'experiencia',
    clientPhrase: 'Vendedor de consórcio já me enganou.',
    response: 'Infelizmente existem profissionais que não são transparentes. Meu compromisso é te mostrar tudo com clareza: custos, prazos, riscos e oportunidades. Você decide com informação completa.',
    tags: ['vendedor', 'transparência'],
  },

  // ═══════════════════════════════════════════
  // ⚠️ RISCO (8)
  // ═══════════════════════════════════════════
  {
    id: 'risco-01', category: 'risco',
    clientPhrase: 'E se eu não conseguir pagar?',
    response: 'Essa é uma preocupação válida. Antes de entrar, simulamos cenários que cabem no seu orçamento. E se precisar sair, existem regras claras de devolução. O importante é entrar com uma parcela confortável.',
    tags: ['inadimplência', 'orçamento'],
  },
  {
    id: 'risco-02', category: 'risco',
    clientPhrase: 'Tenho medo de perder dinheiro.',
    response: 'No consórcio regulamentado, seu dinheiro não "some". Se não for contemplado e desistir, há regras de devolução. E enquanto está ativo, seu recurso está no fundo do grupo, protegido.',
    tags: ['devolução', 'saída'],
  },
  {
    id: 'risco-03', category: 'risco',
    clientPhrase: 'E se o grupo não andar?',
    response: 'Os grupos da administradora são estruturados com critérios rigorosos. Há assembleias mensais com contemplação por sorteio e lance. O grupo não "para" — ele segue o cronograma definido.',
    tags: ['grupo', 'assembleia'],
  },
  {
    id: 'risco-04', category: 'risco',
    clientPhrase: 'É arriscado demais pra mim.',
    response: 'Todo investimento tem algum risco. Mas no consórcio regulamentado, os riscos são controlados: seu dinheiro fica protegido, há regras claras e fiscalização do Banco Central. É um dos menores riscos do mercado.',
    tags: ['risco', 'regulação'],
  },
  {
    id: 'risco-05', category: 'risco',
    clientPhrase: 'E se eu perder o emprego?',
    response: 'Se isso acontecer, existem opções: transferir a cota, negociar com a administradora ou aguardar a devolução em assembleia. O seguro incluso na parcela também pode ajudar dependendo do caso.',
    tags: ['desemprego', 'proteção'],
  },
  {
    id: 'risco-06', category: 'risco',
    clientPhrase: 'Não quero me comprometer a longo prazo.',
    response: 'Entendo. Existem planos com prazos menores, e a cota pode ser transferida se precisar sair. O consórcio é flexível — não é uma prisão. É um planejamento que você pode ajustar.',
    tags: ['compromisso', 'flexibilidade'],
  },
  {
    id: 'risco-07', category: 'risco',
    clientPhrase: 'E se a economia piorar?',
    response: 'A carta de crédito é corrigida — ela acompanha o mercado. Se os preços sobem, sua carta sobe junto. E a parcela continua sem juros, o que protege seu orçamento melhor que qualquer financiamento.',
    tags: ['economia', 'correção'],
  },
  {
    id: 'risco-08', category: 'risco',
    clientPhrase: 'Posso desistir se quiser?',
    response: 'Sim, a desistência é um direito. O valor pago é devolvido conforme regras do contrato — geralmente via sorteio em assembleia ou ao final do grupo. É importante entender essas condições antes de entrar.',
    tags: ['desistência', 'contrato'],
  },

  // ═══════════════════════════════════════════
  // 🤔 ENTENDIMENTO (10)
  // ═══════════════════════════════════════════
  {
    id: 'entendimento-01', category: 'entendimento',
    clientPhrase: 'Não entendo como funciona.',
    response: 'É mais simples do que parece: um grupo de pessoas contribui mensalmente, e todo mês alguém é contemplado por sorteio ou lance e recebe o crédito. Você escolhe o valor, o prazo, e pode usar estratégias pra acelerar.',
    tags: ['explicação', 'básico'],
  },
  {
    id: 'entendimento-02', category: 'entendimento',
    clientPhrase: 'O que é lance?',
    response: 'Lance é como uma antecipação de parcelas que você oferece para tentar ser contemplado mais rápido. Existem dois tipos: lance livre (com recursos próprios) e lance embutido (usando parte da carta). Posso simular os dois.',
    tags: ['lance', 'tipos'],
  },
  {
    id: 'entendimento-03', category: 'entendimento',
    clientPhrase: 'Qual a diferença de consórcio e financiamento?',
    response: 'No financiamento, você recebe o bem na hora e paga juros altos. No consórcio, você planeja a aquisição sem juros — paga apenas taxa administrativa e fundo de reserva. O custo total é significativamente inferior.',
    tags: ['diferença', 'comparação'],
  },
  {
    id: 'entendimento-04', category: 'entendimento',
    clientPhrase: 'O que é carta de crédito?',
    response: 'É o valor que você recebe quando contemplado. Funciona como um "cheque" que pode ser usado pra comprar o bem escolhido — imóvel, veículo ou serviço, dependendo do grupo.',
    tags: ['carta', 'crédito'],
  },
  {
    id: 'entendimento-05', category: 'entendimento',
    clientPhrase: 'O que é cota?',
    response: 'Cota é a sua "posição" dentro do grupo de consórcio. Cada participante tem uma cota que representa o direito à carta de crédito. É como seu "assento" no grupo.',
    tags: ['cota', 'participação'],
  },
  {
    id: 'entendimento-06', category: 'entendimento',
    clientPhrase: 'Como funciona o grupo?',
    response: 'O grupo é formado por pessoas com o mesmo objetivo. Todos pagam parcelas mensais e, a cada assembleia, um ou mais participantes são contemplados. O grupo tem prazo definido e regras claras.',
    tags: ['grupo', 'funcionamento'],
  },
  {
    id: 'entendimento-07', category: 'entendimento',
    clientPhrase: 'Preciso dar entrada?',
    response: 'Não existe entrada no consórcio — apenas a primeira parcela. É diferente do financiamento. Você começa pagando a parcela mensal e já passa a concorrer nas assembleias.',
    tags: ['entrada', 'primeira parcela'],
  },
  {
    id: 'entendimento-08', category: 'entendimento',
    clientPhrase: 'Posso escolher o bem depois?',
    response: 'Sim! Quando contemplado, você escolhe o bem dentro da categoria do grupo. Em consórcio imobiliário, por exemplo, pode escolher qualquer imóvel dentro do valor da carta.',
    tags: ['escolha', 'flexibilidade'],
  },
  {
    id: 'entendimento-09', category: 'entendimento',
    clientPhrase: 'O que acontece se eu atrasar a parcela?',
    response: 'Se atrasar, você fica temporariamente impedido de participar das assembleias. Mas pode regularizar e voltar a concorrer. O fundo de reserva do grupo protege os demais participantes.',
    tags: ['atraso', 'regularização'],
  },
  {
    id: 'entendimento-10', category: 'entendimento',
    clientPhrase: 'Consórcio serve pra quê exatamente?',
    response: 'Pra adquirir bens de alto valor — imóveis, veículos, serviços — sem pagar juros. É uma forma de planejamento financeiro onde um grupo se organiza pra que todos alcancem o objetivo, pagando muito menos do que num financiamento.',
    tags: ['finalidade', 'objetivo'],
  },

  // ═══════════════════════════════════════════
  // 👤 PERFIL (6)
  // ═══════════════════════════════════════════
  {
    id: 'perfil-01', category: 'perfil',
    clientPhrase: 'Consórcio não é pra mim.',
    response: 'Posso entender por que pensa assim. Mas consórcio serve pra quem quer comprar com planejamento e pagar menos. Se você tem um objetivo e pode planejar, o consórcio pode ser a melhor ferramenta.',
    tags: ['adequação', 'perfil'],
  },
  {
    id: 'perfil-02', category: 'perfil',
    clientPhrase: 'Já tenho financiamento, não preciso de consórcio.',
    response: 'Muita gente usa o consórcio justamente para quitar financiamento existente. A carta contemplada pode ser usada pra liquidar a dívida, eliminando juros futuros.',
    tags: ['quitação', 'estratégia'],
  },
  {
    id: 'perfil-03', category: 'perfil',
    clientPhrase: 'Sou muito jovem pra pensar nisso.',
    response: 'Na verdade, começar jovem é uma vantagem enorme. Com parcelas menores e mais tempo de planejamento, você constrói patrimônio muito antes do que imagina — e sem juros.',
    tags: ['jovem', 'planejamento'],
  },
  {
    id: 'perfil-04', category: 'perfil',
    clientPhrase: 'Já tenho casa própria.',
    response: 'Ótimo! Muitos proprietários usam consórcio pra investir em outro imóvel — pra renda, pra família ou pra aposentadoria. É uma forma inteligente de diversificar patrimônio.',
    tags: ['investimento', 'patrimônio'],
  },
  {
    id: 'perfil-05', category: 'perfil',
    clientPhrase: 'Não tenho perfil de investidor.',
    response: 'Consórcio não é investimento especulativo — é planejamento. Você não precisa entender de mercado financeiro. É simples: pagar parcela, acompanhar o grupo e usar a carta quando contemplado.',
    tags: ['simplicidade', 'planejamento'],
  },
  {
    id: 'perfil-06', category: 'perfil',
    clientPhrase: 'Estou aposentado, não faz sentido pra mim.',
    response: 'Consórcio pode ser interessante em qualquer fase. Muitos aposentados usam pra reformar a casa, trocar de carro ou deixar um bem pros filhos. O prazo pode ser curto e a parcela acessível.',
    tags: ['aposentadoria', 'herança'],
  },

  // ═══════════════════════════════════════════
  // 📊 SITUAÇÃO FINANCEIRA (8)
  // ═══════════════════════════════════════════
  {
    id: 'financeiro-01', category: 'financeiro',
    clientPhrase: 'Agora não é um bom momento.',
    response: 'Justamente por isso o consórcio funciona bem — porque você se organiza sem se comprometer com juros. Quanto antes começar, mais tempo tem pra planejar.',
    tags: ['momento', 'planejamento'],
  },
  {
    id: 'financeiro-02', category: 'financeiro',
    clientPhrase: 'Prefiro guardar dinheiro.',
    response: 'Guardar dinheiro é ótimo. Mas considere: enquanto você guarda, o preço do bem sobe. O consórcio trava o poder de compra da carta e ainda permite usar o FGTS. É como "guardar" com direção.',
    tags: ['poupança', 'inflação'],
  },
  {
    id: 'financeiro-03', category: 'financeiro',
    clientPhrase: 'Estou com muitas dívidas.',
    response: 'Nesse caso, organizar as finanças vem primeiro. Mas quando estiver pronto, o consórcio pode ser o passo seguinte — justamente porque não adiciona juros ao seu orçamento.',
    tags: ['dívidas', 'organização'],
  },
  {
    id: 'financeiro-04', category: 'financeiro',
    clientPhrase: 'Não tenho renda fixa.',
    response: 'Existem planos com parcelas flexíveis que se adaptam a diferentes perfis de renda. O importante é dimensionar uma parcela que não comprometa sua estabilidade.',
    tags: ['renda', 'flexibilidade'],
  },
  {
    id: 'financeiro-05', category: 'financeiro',
    clientPhrase: 'Vou esperar minha situação melhorar.',
    response: 'Entendo. Mas enquanto espera, os preços sobem e as oportunidades passam. Com uma parcela acessível, você pode começar a construir agora sem comprometer o orçamento atual.',
    tags: ['espera', 'oportunidade'],
  },
  {
    id: 'financeiro-06', category: 'financeiro',
    clientPhrase: 'Tenho medo de me endividar.',
    response: 'O consórcio não é dívida no sentido tradicional — é um plano de aquisição. Não tem juros, e se precisar sair, existem regras claras. É bem diferente de um empréstimo ou cartão de crédito.',
    tags: ['endividamento', 'diferença'],
  },
  {
    id: 'financeiro-07', category: 'financeiro',
    clientPhrase: 'Meu nome está negativado.',
    response: 'Para participar do consórcio e pagar parcelas, não precisa de aprovação de crédito. A análise acontece no momento da contemplação. Ou seja, você pode começar agora e organizar o nome até lá.',
    tags: ['negativado', 'crédito'],
  },
  {
    id: 'financeiro-08', category: 'financeiro',
    clientPhrase: 'Preciso pensar mais.',
    response: 'Claro, tome o tempo que precisar. Vou te deixar com os números claros pra você avaliar com calma. Se tiver dúvidas depois, estou à disposição. Sem pressão.',
    tags: ['reflexão', 'sem pressão'],
  },


  // ═══════════════════════════════════════════
  // 🏠 PERFIL: PF PAGANDO ALUGUEL (3)
  // ═══════════════════════════════════════════
  {
    id: 'perfil-aluguel-01', category: 'preco', clientProfile: 'pf_aluguel',
    clientPhrase: 'Prefiro continuar alugando por enquanto.',
    response: 'Entendo. Mas vamos fazer uma conta rápida: quanto você paga de aluguel por mês? Em 200 meses, esse valor vai direto pro bolso do proprietário — sem construir nada pra você. Com o consórcio, essa mesma parcela constrói patrimônio. Quando contemplado, você compra à vista e ainda negocia desconto.',
    tags: ['aluguel', 'conversão', 'patrimônio'],
  },
  {
    id: 'perfil-aluguel-02', category: 'financeiro', clientProfile: 'pf_aluguel',
    clientPhrase: 'Não tenho entrada para comprar um imóvel.',
    response: 'No consórcio não existe entrada. Você começa pagando a parcela mensal e quando for contemplado — por sorteio ou lance — recebe a carta de crédito integral. O FGTS que você tem acumulado pode ser usado como lance para acelerar a contemplação.',
    tags: ['aluguel', 'conversão', 'patrimônio'],
  },
  {
    id: 'perfil-aluguel-03', category: 'preco', clientProfile: 'pf_aluguel',
    clientPhrase: 'Meu aluguel é barato, não compensa.',
    response: 'Aluguel barato hoje não significa aluguel barato sempre — reajuste anual pelo IGPM pode dobrar o valor em poucos anos. O consórcio trava sua parcela e no final você tem o imóvel. O aluguel some todo mês.',
    tags: ['aluguel', 'conversão', 'patrimônio'],
  },

  // ═══════════════════════════════════════════
  // 💎 PERFIL: PF COM FGTS PARADO (3)
  // ═══════════════════════════════════════════
  {
    id: 'perfil-fgts-01', category: 'lance', clientProfile: 'pf_fgts',
    clientPhrase: 'Meu FGTS está lá parado, não sei o que fazer com ele.',
    response: 'O FGTS rende muito abaixo da inflação — você está perdendo poder de compra todo mês. No consórcio imobiliário, você usa o saldo do FGTS como lance. Isso pode antecipar sua contemplação em anos — transformando dinheiro parado em patrimônio real.',
    tags: ['FGTS', 'lance', 'contemplação antecipada'],
  },
  {
    id: 'perfil-fgts-02', category: 'risco', clientProfile: 'pf_fgts',
    clientPhrase: 'Posso perder meu FGTS se usar no consórcio?',
    response: 'Não. O FGTS usado como lance vai direto para o pagamento da carta de crédito — é uma aplicação no seu próprio imóvel. O consórcio imobiliário permite o uso do FGTS como lance, sem intermediários.',
    tags: ['FGTS', 'lance', 'contemplação antecipada'],
  },
  {
    id: 'perfil-fgts-03', category: 'lance', clientProfile: 'pf_fgts',
    clientPhrase: 'Quanto de FGTS eu precisaria para dar um lance competitivo?',
    response: 'Depende do grupo. Temos dados das últimas assembleias que mostram o lance mínimo contemplado. Posso te mostrar exatamente quanto você precisaria e se seu saldo já é suficiente para uma estratégia de lance agora.',
    tags: ['FGTS', 'lance', 'contemplação antecipada'],
  },

  // ═══════════════════════════════════════════
  // 🔄 PERFIL: PF SAINDO DE FINANCIAMENTO (2)
  // ═══════════════════════════════════════════
  {
    id: 'perfil-posfinanc-01', category: 'tempo', clientProfile: 'pf_pos_financiamento',
    clientPhrase: 'Acabei de terminar meu financiamento, quero descansar.',
    response: 'Faz todo sentido querer uma pausa. Mas pensa assim: você já provou que consegue honrar um compromisso de longo prazo. Esse valor que estava comprometido no seu orçamento agora pode trabalhar pra você — construindo o próximo patrimônio sem pagar juros desta vez.',
    tags: ['financiamento', 'hábito', 'próximo passo'],
  },
  {
    id: 'perfil-posfinanc-02', category: 'perfil', clientProfile: 'pf_pos_financiamento',
    clientPhrase: 'Já tenho meu imóvel, não preciso de outro.',
    response: 'Patrimônio não precisa parar num imóvel. Clientes que usam o consórcio para segundo imóvel — seja para renda de aluguel ou para os filhos — multiplicam seu patrimônio sem comprometer liquidez. A parcela cabe no orçamento que você já estava acostumado a pagar.',
    tags: ['financiamento', 'hábito', 'próximo passo'],
  },

  // ═══════════════════════════════════════════
  // 🚛 PERFIL: PJ FROTA / EQUIPAMENTOS (3)
  // ═══════════════════════════════════════════
  {
    id: 'perfil-pjfrota-01', category: 'financeiro', clientProfile: 'pj_frota',
    clientPhrase: 'Preciso renovar a frota mas não quero comprometer o caixa.',
    response: 'O consórcio de veículos pesados resolve exatamente isso — você parcela a renovação sem juros, sem comprometer capital de giro. A taxa administrativa é dedutível como despesa operacional e as parcelas são previsíveis para o fluxo de caixa da empresa.',
    tags: ['empresa', 'frota', 'dedução fiscal', 'PJ'],
  },
  {
    id: 'perfil-pjfrota-02', category: 'financiamento', clientProfile: 'pj_frota',
    clientPhrase: 'Já faço leasing dos veículos.',
    response: 'No leasing você paga juros e no final não é dono do bem. No consórcio, o custo total é menor e o veículo é patrimônio da empresa. Além disso, pode usar o bem como garantia para outras operações de crédito.',
    tags: ['empresa', 'frota', 'dedução fiscal', 'PJ'],
  },
  {
    id: 'perfil-pjfrota-03', category: 'perfil', clientProfile: 'pj_frota',
    clientPhrase: 'Consórcio é coisa de pessoa física.',
    response: 'Muitas empresas usam consórcio para renovar frota e adquirir equipamentos — é uma ferramenta de planejamento financeiro corporativo. Existem grupos específicos para PJ com condições diferenciadas.',
    tags: ['empresa', 'frota', 'dedução fiscal', 'PJ'],
  },

  // ═══════════════════════════════════════════
  // 📈 PERFIL: INVESTIDOR / RENDA PASSIVA (3)
  // ═══════════════════════════════════════════
  {
    id: 'perfil-investidor-01', category: 'risco', clientProfile: 'investidor',
    clientPhrase: 'Prefiro colocar em CDB ou Tesouro Direto.',
    response: 'CDB e Tesouro são ótimos para liquidez. O consórcio complementa — você alavanca um imóvel com parcelas mensais e quando contemplado compra à vista com poder de negociação. O aluguel recebido pode pagar parte ou toda a parcela restante. É alavancagem com exposição mínima de capital próprio.',
    tags: ['investimento', 'renda passiva', 'alavancagem', 'locação'],
  },
  {
    id: 'perfil-investidor-02', category: 'financeiro', clientProfile: 'investidor',
    clientPhrase: 'Não quero imobilizar capital.',
    response: 'No consórcio você não imobiliza capital de uma vez — distribui em parcelas mensais. A carta de crédito é o ativo. O imóvel adquirido gera renda de aluguel que amortiza as parcelas restantes. Investidores usam múltiplas cotas em paralelo para contemplação serial e construção de carteira imobiliária progressiva.',
    tags: ['investimento', 'renda passiva', 'alavancagem', 'locação'],
  },
  {
    id: 'perfil-investidor-03', category: 'risco', clientProfile: 'investidor',
    clientPhrase: 'Meu dinheiro rende mais investido do que num imóvel.',
    response: 'A comparação correta não é rendimento versus rendimento — é alavancagem. Com R$ 2.000 por mês no consórcio você adquire um ativo de R$ 300.000. Nenhuma aplicação financeira oferece essa alavancagem. O imóvel valoriza, gera aluguel e o custo total fica muito abaixo do valor de mercado.',
    tags: ['investimento', 'renda passiva', 'alavancagem', 'locação'],
  },

  // ═══════════════════════════════════════════
  // 🏛️ PERFIL: SUCESSÃO PATRIMONIAL (3)
  // ═══════════════════════════════════════════
  {
    id: 'perfil-sucessao-01', category: 'perfil', clientProfile: 'sucessao',
    clientPhrase: 'Já tenho patrimônio, não preciso de mais.',
    response: 'A questão não é acumular mais — é proteger o que você já tem. O inventário brasileiro pode consumir até 20% do patrimônio em impostos e honorários. O consórcio com seguro prestamista liquida as parcelas em caso de falecimento — o imóvel é transferido aos herdeiros já quitado, sem burocracia e sem deságio forçado.',
    tags: ['sucessão', 'herança', 'inventário', 'holding', 'patrimônio'],
  },
  {
    id: 'perfil-sucessao-02', category: 'financeiro', clientProfile: 'sucessao',
    clientPhrase: 'Meus filhos vão herdar tudo de qualquer forma.',
    response: 'Vão herdar — mas quanto vai sobrar depois do ITCMD, dos honorários advocatícios e do tempo de inventário? Em alguns estados o ITCMD chega a 8% do valor dos bens. Uma holding familiar estruturada com consórcio pode reduzir drasticamente essa carga tributária e garantir a transmissão dos ativos de forma organizada.',
    tags: ['sucessão', 'herança', 'inventário', 'holding', 'patrimônio'],
  },
  {
    id: 'perfil-sucessao-03', category: 'entendimento', clientProfile: 'sucessao',
    clientPhrase: 'É muito complexo para organizar.',
    response: 'Na prática é simples: o consórcio com seguro prestamista já garante a quitação automática em caso de sinistro. Para a estruturação da holding, posso conectar você com especialistas. Meu papel é mostrar como o consórcio entra como peça central dessa estratégia — protegendo os ativos que você levou a vida toda para construir.',
    tags: ['sucessão', 'herança', 'inventário', 'holding', 'patrimônio'],
  },

  // ═══════════════════════════════════════════
  // 💰 PERFIL: CLIENTE COM LIQUIDEZ PARADA (3)
  // ═══════════════════════════════════════════
  {
    id: 'perfil-liquidez-01', category: 'risco', clientProfile: 'liquidez',
    clientPhrase: 'Tenho dinheiro na poupança mas não sei onde aplicar.',
    response: 'A poupança rende abaixo da inflação — você está perdendo poder de compra todo mês sem perceber. Com a Selic a 15%, cada mês que o capital fica parado em poupança é uma perda real. O consórcio transforma esse capital ocioso em alavancagem para aquisição de um ativo que valoriza e pode gerar renda.',
    tags: ['liquidez', 'poupança', 'inflação', 'diversificação', 'capital ocioso'],
  },
  {
    id: 'perfil-liquidez-02', category: 'financeiro', clientProfile: 'liquidez',
    clientPhrase: 'Recebi uma indenização e não quero tomar decisões precipitadas.',
    response: 'Faz todo sentido ter cautela. O consórcio não exige que você aplique tudo de uma vez — você usa parte como lance estratégico e mantém o restante em aplicações de liquidez. É diversificação inteligente: parte do capital protegido em ativo real, parte mantida disponível.',
    tags: ['liquidez', 'poupança', 'inflação', 'diversificação', 'capital ocioso'],
  },
  {
    id: 'perfil-liquidez-03', category: 'tempo', clientProfile: 'liquidez',
    clientPhrase: 'Prefiro esperar o momento certo para investir.',
    response: 'O momento certo raramente avisa que chegou. O que os dados mostram é que quem entra no consórcio hoje, com os grupos no momento atual, tem uma janela favorável de lance. Enquanto você espera o momento perfeito, a inflação corrói o poder de compra do seu capital parado.',
    tags: ['liquidez', 'poupança', 'inflação', 'diversificação', 'capital ocioso'],
  },

  // ═══════════════════════════════════════════
  // 🌾 PERFIL: PRODUTOR RURAL / AGRONEGÓCIO (3)
  // ═══════════════════════════════════════════
  {
    id: 'perfil-agro-01', category: 'financiamento', clientProfile: 'agronegocio',
    clientPhrase: 'Uso o Plano Safra para financiar equipamentos.',
    response: 'O Plano Safra tem dotação limitada e está sendo progressivamente contingenciado. Quem depende exclusivamente dele corre risco de não ter crédito disponível na janela certa. O consórcio de pesados é a alternativa planejada — você programa a renovação com antecedência, sem depender de aprovação e sem juros bancários que corroem sua margem.',
    tags: ['agronegócio', 'maquinário', 'frota pesada', 'Plano Safra', 'produção rural'],
  },
  {
    id: 'perfil-agro-02', category: 'preco', clientProfile: 'agronegocio',
    clientPhrase: 'Maquinário agrícola é caro, não consigo pagar parcela alta.',
    response: 'O consórcio de pesados permite estruturar o valor da carta e o prazo conforme seu fluxo de caixa sazonal. Você pode concentrar amortizações nos meses de colheita e reduzir nos entressafra. É planejamento financeiro adaptado à realidade do campo.',
    tags: ['agronegócio', 'maquinário', 'frota pesada', 'Plano Safra', 'produção rural'],
  },
  {
    id: 'perfil-agro-03', category: 'perfil', clientProfile: 'agronegocio',
    clientPhrase: 'Prefiro arrendar equipamento a comprar.',
    response: 'Arrendamento é custo permanente — você paga para sempre sem construir nada. Com o consórcio, ao final você tem o maquinário quitado como ativo da propriedade. O custo total do consórcio é muito menor que anos de arrendamento, e o equipamento valoriza seu inventário e sua capacidade de crédito junto às cooperativas.',
    tags: ['agronegócio', 'maquinário', 'frota pesada', 'Plano Safra', 'produção rural'],
  },
];
