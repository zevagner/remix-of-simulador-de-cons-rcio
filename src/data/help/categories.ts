/**
 * Help Content — Categorias institucionais
 * ────────────────────────────────────────────────────────────────
 * Extraído de `src/data/helpContent.ts` na Quality Sprint 1 (QW7).
 * Conteúdo, IDs e textos preservados byte-a-byte. Apenas organização.
 *
 * Os tipos vivos em `helpContent.ts` (HelpCategory, HelpArticle, etc.)
 * são re-exportados a partir daqui via fachada.
 */
import {
  Calculator, GitCompare, PiggyBank, Layers, Bot, Kanban, ShieldCheck, Users, FileText, Compass, Briefcase, Brain,
} from 'lucide-react';
import type { HelpCategory } from '../helpContent';

export const categories: HelpCategory[] = [
  // ── A. Primeiros Passos ───────────────────────────────────────
  {
    id: 'primeiros-passos',
    title: 'Primeiros Passos',
    subtitle: 'Entender a plataforma',
    icon: Compass,
    badge: 'Comece aqui',
    executiveSummary:
      'Visão geral da plataforma como consultoria guiada: qual é o fluxo ideal, como cada módulo se conecta e por onde começar a operar com profundidade no primeiro dia.',
    articles: [
      {
        id: 'visao-da-plataforma',
        title: 'O que é esta plataforma',
        executiveSummary:
          'Uma camada consultiva que conduz a venda do diagnóstico ao pós-venda, com matemática institucional e narrativa de IA alinhadas.',
        forWho: 'Todo consultor — leitura obrigatória no onboarding.',
        whenToUse: 'Antes da primeira simulação real com cliente.',
        explanation:
          'A plataforma é um sistema integrado de consultoria comercial em consórcio. Não é apenas um simulador: é diagnóstico, simulação, análise estratégica, comparadores, operações estruturadas, proposta institucional, carteira (CRM leve) e pós-venda — todos compartilhando uma única fonte de verdade matemática e narrativa.\n\nIsso significa que o número que aparece na simulação é o mesmo do PDF, do comparador e da narrativa da IA. Sem drift.',
        blocks: [
          { kind: 'when-to-use', body: 'Em todo atendimento consultivo onde o cliente precisa entender e decidir, não apenas comprar.' },
          { kind: 'ideal-profile', body: 'Consultores que vendem por consequência da estratégia — não por preço de parcela.' },
          { kind: 'common-mistake', body: 'Pular o Diagnóstico. Sem ele, a simulação fica genérica e a IA perde contexto.' },
          { kind: 'strategy', body: 'Use sempre a mesma sequência: Diagnóstico → Simulação → Análise → Estratégia → Proposta. Resultados saltam quando o fluxo é respeitado.' },
        ],
        related: ['fluxo-ideal', 'navegacao'],
        modules: ['diagnostic', 'simulator'],
        updatedAt: '2026-05',
      },
      {
        id: 'fluxo-ideal',
        title: 'O fluxo ideal de uso',
        executiveSummary:
          'Sequência canônica recomendada: cada etapa alimenta a próxima e o ganho composto é o que separa um atendimento consultivo de uma cotação.',
        explanation:
          '1. Diagnóstico — captura perfil, objetivo e contexto financeiro.\n2. Simulação — define crédito, prazo, taxa e tipo de lance.\n3. Plataforma Patrimonial · Edição Consultiva — leitura editorial dos capítulos patrimoniais (Investimento Patrimonial, Operações Estruturadas, estudo de lances) com Compare Workspace unificado.\n4. Estratégia — escolhe a tática de contemplação e narrativa.\n5. Proposta — gera PDF institucional + link visual.\n6. Carteira — organiza follow-up.\n7. Pós-venda — mantém o cliente vivo na sua base.\n\nDica institucional: cada etapa só "vale" quando alimenta a próxima. Pular etapas degrada a qualidade da próxima.',
        blocks: [
          { kind: 'when-to-use', body: 'Em todo cliente novo — sem exceção.' },
          { kind: 'common-mistake', body: 'Ir direto para a Proposta. O cliente percebe falta de profundidade.' },
          { kind: 'explain-client', body: '"Antes de te enviar números, preciso entender seu objetivo. Isso muda completamente a recomendação."' },
        ],
        related: ['visao-da-plataforma'],
        modules: ['diagnostic'],
        updatedAt: '2026-05',
      },
      {
        id: 'navegacao',
        title: 'Como navegar',
        executiveSummary:
          'Sidebar linear de 6 passos espelha o fluxo ideal. Cockpit é hub de leitura — não substitui simulador.',
        explanation:
          'A navegação principal segue 6 passos: Diagnóstico, Simulador, Análise, Estratégia, Proposta, Carteira. Pós-venda, Comunidade e Ajuda ficam em "Suporte". O Cockpit consolida sinais — é leitura rápida, não ferramenta de cálculo.\n\nEm desktop a sidebar pode recolher para w-16 mantendo ícones; em mobile, bottom-nav com FAB para ações principais.',
        blocks: [
          { kind: 'strategy', body: 'Use o Cockpit como check matinal: 5 min para identificar prioridades do dia.' },
        ],
        related: ['fluxo-ideal'],
      },
      {
        id: 'erros-iniciante',
        title: 'Erros comuns do consultor iniciante',
        executiveSummary:
          'Os 6 erros que mais custam venda no início: pular Diagnóstico, vender parcela, ignorar lance, prometer contemplação, não anotar próxima ação e abandonar pós-venda.',
        forWho: 'Consultor nos primeiros 30 dias.',
        whenToUse: 'Antes do primeiro atendimento — e revisar mensalmente.',
        explanation:
          'Identificar o erro cedo evita meses de baixa conversão. Cada erro abaixo tem origem, sintoma e correção institucional.\n\n1. Pular Diagnóstico → simulação genérica, IA sem contexto.\n2. Vender parcela isolada → cliente compara só preço e perde valor.\n3. Ignorar Estudo de Lances → indicação de grupo "no chute".\n4. Prometer contemplação → quebra confiança quando não acontece.\n5. Mover proposta sem registrar próxima ação → carteira vira ruído.\n6. Não fazer pós-venda → perde 30-50% de receita futura.',
        blocks: [
          { kind: 'common-mistake', body: 'Falar "essa parcela cabe no seu bolso" antes de saber o objetivo. Vira venda transacional, não consultiva.' },
          { kind: 'narrative', body: '"Antes de te passar números, deixa eu entender o que você quer alcançar com essa carta." — abre conversa consultiva em 1 frase.' },
          { kind: 'strategy', body: 'No fim de toda semana: revise as 3 últimas propostas. Em quais o Diagnóstico foi raso? Refaça.' },
          { kind: 'objection', body: '"Não promete contemplação?" Resposta institucional: "Posso te mostrar o histórico real do grupo e a probabilidade — promessa eu não faço."' },
        ],
        related: ['fluxo-ideal', 'composicao-parcela', 'carteira'],
        modules: ['diagnostic', 'simulator', 'wallet'],
        updatedAt: '2026-05',
      },
    ],
  },

  // ── A2. Diagnóstico Consultivo ────────────────────────────────
  {
    id: 'diagnostico',
    title: 'Diagnóstico Consultivo',
    subtitle: 'Entender antes de simular',
    icon: Brain,
    executiveSummary:
      'O Diagnóstico transforma o consultor em consultor de verdade: capta objetivo patrimonial, contexto financeiro, urgência e perfil de risco — e alimenta toda a plataforma (simulador, IA, proposta) com o mesmo contexto.',
    articles: [
      {
        id: 'diagnostico-por-que',
        title: 'Por que o Diagnóstico vem primeiro',
        executiveSummary:
          'Sem diagnóstico, simulação vira cotação. Com diagnóstico, simulação vira recomendação fundamentada.',
        forWho: 'Todo consultor — antes da primeira simulação real.',
        whenToUse: 'Em todo cliente novo, sem exceção. 5 minutos.',
        explanation:
          'O Diagnóstico captura 3 camadas: (1) objetivo patrimonial — o que o cliente quer realizar; (2) contexto operacional — capacidade mensal, capital disponível, urgência; (3) perfil — tolerância a risco, sofisticação financeira.\n\nEsses sinais alimentam o ConsultiveProfile (engine local determinístico) que ajusta sugestões em Simulador, Investimento e Proposta. Nada é enviado para servidor; nada é IA.',
        blocks: [
          { kind: 'when-to-use', body: 'Sempre antes da Simulação. Sem ele, a IA e os comparadores ficam genéricos.' },
          { kind: 'common-mistake', body: 'Tratar o Diagnóstico como formulário burocrático. Cada campo muda uma recomendação concreta no fluxo.' },
          { kind: 'explain-client', body: '"Antes de te mostrar números, preciso entender seu objetivo. Isso muda completamente a recomendação."' },
          { kind: 'strategy', body: 'Use o Diagnóstico como ferramenta de conversa, não como questionário. Pergunte e preencha junto.' },
        ],
        related: ['diagnostico-objetivos', 'diagnostico-perfil', 'fluxo-ideal'],
        modules: ['diagnostic'],
        updatedAt: '2026-05',
      },
      {
        id: 'diagnostico-objetivos',
        title: 'Objetivos patrimoniais — como ler',
        executiveSummary:
          'Cada objetivo (imóvel, veículo, renda, multiplicação) ativa uma trilha estratégica diferente no resto da plataforma.',
        explanation:
          'Os objetivos não são rótulos — são gatilhos. "Renda" abre Investimento Patrimonial. "Multiplicação" abre Operações Estruturadas. "Primeiro imóvel" abre nicho conservador. Cada escolha tem consequência operacional.',
        blocks: [
          { kind: 'when-to-use', body: 'Quando o cliente diz "quero investir" — abra antes a conversa: investir para renda, para crescer patrimônio, ou para proteger reserva?' },
          { kind: 'common-mistake', body: 'Marcar "investimento" para todo cliente capitalizado. Investimento sem objetivo claro vira pitch vazio.' },
          { kind: 'discovery', body: '"Se desse certo, o que você teria daqui a 3 anos que não tem hoje?" — pergunta de descoberta de objetivo real.' },
        ],
        related: ['diagnostico-por-que', 'nicho-investidor', 'logica-investimento'],
        modules: ['diagnostic'],
      },
      {
        id: 'diagnostico-contexto',
        title: 'Contexto operacional — capacidade vs. urgência',
        executiveSummary:
          'Capacidade mensal e capital disponível definem se a Reduzida é necessária. Urgência define se o foco é Lance ou Espera.',
        explanation:
          'Quando capacidade mensal ≈ parcela cheia, a Reduzida deixa de ser opcional. Quando urgência é alta, o Estudo de Lances vira prioridade. Quando capital disponível existe, Alavancagem entra como cenário.\n\nA plataforma usa esses sinais para sugerir o próximo módulo automaticamente — sem precisar de IA.',
        blocks: [
          { kind: 'when-to-use', body: 'Sempre pergunte capacidade real, não a "ideal". Cliente que aperta vai cancelar.' },
          { kind: 'common-mistake', body: 'Anotar capacidade alta para "fechar maior". O sistema vai recomendar reduzida e o cliente vai questionar depois.' },
          { kind: 'explain-client', body: '"Capacidade que você sustenta sem aperto, mesmo num mês ruim — qual é?"' },
        ],
        related: ['reduzida', 'estrategia-lance'],
        modules: ['diagnostic', 'simulator'],
      },
      {
        id: 'diagnostico-perfil',
        title: 'Interpretação do perfil',
        executiveSummary:
          'Conservador, analítico, investidor, imediatista. Cada perfil muda o tom da proposta, a ordem dos cenários e o conteúdo de IA.',
        explanation:
          'A plataforma deriva o perfil de sinais combinados — não de uma única pergunta. Confiança baixa (<35%) silencia sugestões adaptativas para evitar erro consultivo.\n\nO perfil ajusta: tom de proposta (conservador vs. ousado), ordem de cenários no Investimento, profundidade de CET no comparador, urgência no estudo de lances.',
        blocks: [
          { kind: 'deep-dive', body: 'O ConsultiveProfile é determinístico (sem IA), local (sem servidor), e respeita LGPD por construção.' },
          { kind: 'when-to-use', body: 'Leia o perfil antes de abrir a Proposta — ele define o tom institucional do PDF.' },
          { kind: 'common-mistake', body: 'Forçar perfil "investidor" em cliente que ainda não tem reserva. A plataforma vai sugerir OE e o cliente vai recuar.' },
        ],
        related: ['diagnostico-por-que', 'cenarios', 'op-estruturadas'],
        modules: ['diagnostic'],
        updatedAt: '2026-05',
      },
    ],
  },

  // ── B. Simulador ──────────────────────────────────────────────
  {
    id: 'simulador',
    title: 'Simulador',
    subtitle: 'Calcular com precisão',
    icon: Calculator,
    executiveSummary:
      'Motor mensal canônico que calcula composição da parcela (FC + TA + FR + Seguro), aplica estratégias de contemplação e converte resultado em narrativa institucional.',
    articles: [
      {
        id: 'composicao-parcela',
        title: 'Composição da parcela',
        executiveSummary:
          'Toda parcela tem 4 componentes: Fundo Comum (FC), Taxa de Administração (TA), Fundo de Reserva (FR) e Seguro Prestamista. Saber explicar cada um eleva imediatamente a percepção de profundidade.',
        forWho: 'Consultor que precisa defender o "por que da parcela".',
        explanation:
          '• FC (Fundo Comum): valor que de fato compõe seu crédito futuro — você está "comprando seu crédito a prazo".\n• TA (Taxa de Administração): remuneração da administradora, diluída no plano.\n• FR (Fundo de Reserva): reserva técnica do grupo contra inadimplência e despesas extraordinárias.\n• Seguro Prestamista: protege a família — quita o saldo em caso de morte/invalidez. Recalculado mês a mês sobre o saldo devedor.\n\nO sistema calcula tudo mês a mês — não usa média.',
        blocks: [
          { kind: 'explain-client', body: '"Sua parcela cai porque o seguro acompanha o saldo. Quanto mais você paga, menor fica essa proteção — e a parcela acompanha."' },
          { kind: 'common-mistake', body: 'Comparar só a "parcela inicial". O custo real do plano vive no custo total e na evolução mensal.' },
          { kind: 'deep-dive', body: 'A taxa real é equivalência composta: ((1+i_anual)^(1/12) − 1). Nunca divisão simples por 12.' },
        ],
        related: ['interpretacao', 'reduzida', 'seguro'],
        updatedAt: '2026-05',
      },
      {
        id: 'seguro',
        title: 'Seguro Prestamista',
        executiveSummary:
          'Seguro decrescente sobre o saldo devedor — é proteção real da família, não custo escondido. Cai mês a mês.',
        explanation:
          'O seguro é calculado mensalmente sobre o saldo devedor total. À medida que você amortiza (e principalmente após contemplação com lance), o saldo cai e o prêmio também.\n\nA modalidade atuarial considera idade do proponente — clientes mais jovens pagam menos. Para imobiliário, há também DFI (danos físicos do imóvel) após contemplação.',
        blocks: [
          { kind: 'when-to-use', body: 'Sempre — é compulsório e protege a família.' },
          { kind: 'explain-client', body: '"Se algo acontecer com você, sua família não herda dívida — herda o crédito quitado."' },
        ],
        related: ['composicao-parcela'],
      },
      {
        id: 'reduzida',
        title: 'Parcela Reduzida',
        executiveSummary:
          'Modalidade que aplica fator 0,7 sobre a parcela cheia por um período inicial — útil para clientes em fase de acomodação financeira.',
        explanation:
          'A parcela reduzida divide o plano em duas fases: período reduzido (parcela × 0,7) e período cheio. O custo total NÃO muda — apenas a distribuição no tempo.\n\nApós a contemplação com lance, ocorre rediluição: o saldo é recalculado sobre o prazo restante.',
        blocks: [
          { kind: 'when-to-use', body: 'Cliente com fôlego financeiro crescente (profissional liberal iniciando, recém-promovido, etc).' },
          { kind: 'when-not-to-use', body: 'Cliente que já tem caixa estável — reduzida vira ilusão; explique a parcela cheia desde o início.' },
          { kind: 'common-mistake', body: 'Vender a "parcela menor" sem explicar que ela sobe depois. Quebra confiança.' },
          { kind: 'explain-client', body: '"Os 36 primeiros meses são mais leves; depois, sua parcela passa para o valor cheio."' },
        ],
        related: ['composicao-parcela'],
      },
      {
        id: 'tipos-de-lance',
        title: 'Tipos de Lance',
        executiveSummary:
          'Livre, Fixo e Embutido. Cada um tem racional, limite e impacto diferente — escolher errado custa contemplação.',
        explanation:
          '• Lance Livre: oferta com recursos próprios, sem teto. Maior poder competitivo.\n• Lance Fixo: percentual definido pela administradora, igual para todos.\n• Lance Embutido: usa parte da própria carta. Limites: 50% (imobiliário), 30% (auto/pesados).\n\nO Estudo de Lances mostra histórico real de contemplação por grupo (mín/mediana/máx) e classifica zonas (verde/amarelo/vermelho).',
        blocks: [
          { kind: 'strategy', body: 'Cliente com caixa → lance livre estratégico na faixa amarela. Cliente sem caixa → lance embutido + livre pequeno.' },
          { kind: 'objection', body: '"Lance é jogado fora se eu não for contemplado?" → Não. Em lance livre, o valor volta para você se não vencer.' },
          { kind: 'example', body: 'Grupo com mediana histórica de 30% e máximo de 45%. Lance de 32% (verde) tem alta probabilidade; 25% (vermelho) é apostar.' },
        ],
        related: ['contemplacao', 'estrategia-lance'],
      },
      {
        id: 'contemplacao',
        title: 'Contemplação',
        executiveSummary:
          'Sorteio ou lance. A estratégia escolhida muda saldo, parcela e prazo pós-contemplação.',
        explanation:
          'Após contemplação, o cliente escolhe entre: manter prazo (parcela cai), reduzir prazo (parcela mantém), ou rediluir (recalcular sobre saldo restante).\n\nO simulador mantém a estrutura "base" (sem lance) e a "estratégia" (com contemplação) sempre lado a lado — você compara o impacto antes de propor.',
        blocks: [
          { kind: 'explain-client', body: '"Quando você for contemplado e usar lance, sua parcela cai automaticamente — porque o lance abate parte do saldo."' },
        ],
        related: ['tipos-de-lance', 'interpretacao'],
      },
      {
        id: 'interpretacao',
        title: 'Como interpretar a simulação',
        executiveSummary:
          'Não avalie só a parcela. Avalie: prazo, custo total, impacto do lance, evolução mensal, custo efetivo do cliente.',
        explanation:
          'O sistema apresenta o "custo real do cliente" — soma de tudo que sai do bolso, incluindo lance pago. Esta é a base de comparação justa entre cenários e contra financiamento/à vista.',
        blocks: [
          { kind: 'common-mistake', body: 'Comparar parcela do consórcio (sem juros) com parcela de financiamento (com juros). Sempre olhar custo total.' },
          { kind: 'strategy', body: 'Apresente sempre 2-3 cenários no comparador: Conservador, Realista, Otimista. Cliente decide com clareza.' },
        ],
        related: ['composicao-parcela', 'comparador-fin'],
      },
      {
        id: 'estrategia-lance',
        title: 'Como escolher o lance certo',
        executiveSummary:
          'Lance ótimo cruza 3 sinais: caixa do cliente, mediana histórica do grupo (Estudo de Lances) e tolerância a risco. Sem cruzar os 3, é palpite.',
        forWho: 'Consultor que precisa indicar valor de lance defensável.',
        whenToUse: 'Após simulação inicial, antes de propor estratégia de contemplação.',
        explanation:
          'O Estudo de Lances mostra mín/mediana/máx por grupo. A regra prática: lance acima do máximo histórico = zona verde (alta previsibilidade); entre mediana e máximo = amarela (chance moderada); abaixo da mediana = vermelha (apostar).\n\nMas o lance "certo" não é só o mais alto — é o que cabe no orçamento sem comprometer a estratégia maior do cliente.',
        blocks: [
          { kind: 'discovery', body: '"Quanto você consegue separar para lance sem mexer na sua reserva?" — define teto realista antes de qualquer indicação.' },
          { kind: 'strategy', body: 'Se cliente tem caixa: lance livre na faixa amarela alta. Se tem pouco caixa: combine lance embutido (até o limite) + livre pequeno.' },
          { kind: 'example', body: 'Grupo com mediana 30%, máx 45%. Cliente com R$ 60k de caixa em carta de R$ 200k → 30% de lance (R$ 60k = mediana). Indicar 32-35% (zona amarela alta) preserva 5% de margem.' },
          { kind: 'objection', body: '"E se eu der lance e não for contemplado?" — Em lance livre, o valor não vence: volta integralmente. Só sai do bolso na contemplação.' },
          { kind: 'common-mistake', body: 'Indicar lance no máximo histórico sem checar caixa do cliente. Ele aceita, depois não tem como honrar e desiste.' },
        ],
        related: ['tipos-de-lance', 'contemplacao'],
        modules: ['bids'],
        updatedAt: '2026-05',
      },
      {
        id: 'leitura-simulacao-avancada',
        title: 'Leitura avançada da simulação',
        executiveSummary:
          'Sinais que separam o consultor júnior do sênior: evolução do seguro, ponto de equilíbrio do lance, custo real vs custo nominal e impacto da rediluição.',
        forWho: 'Consultor com 60+ dias que quer subir o nível.',
        explanation:
          'A simulação não é uma foto — é um filme. Quem sabe ler o "filme" defende qualquer número.\n\n• Seguro decrescente: queda visível mês a mês — argumento de proteção real.\n• Ponto de equilíbrio do lance: mês em que o saldo abatido pelo lance "paga" o custo de oportunidade do dinheiro.\n• Custo real vs nominal: nominal soma parcelas; real soma parcelas + lance pago. Comparação justa exige real.\n• Rediluição: após contemplação com lance, o saldo é redistribuído. Mostre o "antes/depois".',
        blocks: [
          { kind: 'deep-dive', body: 'O motor mensal calcula seguro sobre saldo devedor total a cada mês — não usa média. Isso é matematicamente diferente e justifica a queda visível da parcela.' },
          { kind: 'narrative', body: '"Olha esse gráfico: a parcela cai 18% até o mês 60 só por causa do seguro. Não é desconto — é matemática atuarial."' },
          { kind: 'strategy', body: 'Sempre apresente 3 visões: parcela inicial, parcela média e parcela após contemplação com lance. É o que define decisão.' },
        ],
        related: ['composicao-parcela', 'seguro', 'contemplacao'],
        updatedAt: '2026-05',
      },
    ],
  },

  // ── C. Capítulo: Investimento Patrimonial ─────────────────────
  //    (parte da Plataforma Patrimonial · Edição Consultiva)
  {
    id: 'investimento',
    title: 'Capítulo: Investimento Patrimonial',
    subtitle: 'Pensar como capital',
    icon: PiggyBank,
    executiveSummary:
      'Capítulo da Plataforma Patrimonial · Edição Consultiva. Trata o consórcio como veículo financeiro: rentabilidade implícita, INPC, formação de patrimônio, juros compostos e timing de aporte vs lance.',
    articles: [
      {
        id: 'logica-investimento',
        title: 'Lógica financeira do investimento',
        executiveSummary:
          'Consórcio é um instrumento de poupança forçada com poder de compra antecipável. A análise de investimento compara isto a alternativas (CDI, financiamento, à vista).',
        explanation:
          'O módulo Investimento simula 6 cenários (paths) lado a lado, cada um isolando uma decisão: aportar em CDI, comprar à vista, financiar, comprar carta + investir o residual, etc.\n\nToda matemática usa a engine canônica @/core/finance — equivalência composta, juros compostos reais, INPC composto, Price PMT.',
        blocks: [
          { kind: 'deep-dive', body: 'Conversão anual→mensal sempre por (1+i)^(1/12)−1. Nunca i/12. Veja governança em `mem://logic/investimento/engine-canonica-b1`.' },
          { kind: 'when-to-use', body: 'Cliente investidor, analítico ou que considera financiar/pagar à vista. Comparativo é decisivo.' },
          { kind: 'explain-client', body: '"O dinheiro que você não usa em lance, rendendo a CDI por X meses, dá quanto? E vs financiamento, quanto sobra?"' },
        ],
        related: ['cenarios', 'incc', 'comparador-cash'],
        updatedAt: '2026-05',
      },
      {
        id: 'cenarios',
        title: 'Cenários e comparação',
        executiveSummary:
          'Conservador, Realista e Otimista — presets ajustáveis. Útil para clientes que precisam ver "piso, meio e teto".',
        explanation:
          'Os presets controlam: rentabilidade do investimento (10/25/40% a.a.), inflação (3/5/7%), valorização do imóvel (0,4/0,5/0,7% a.m.). Você pode customizar.\n\nO sistema gera storytelling automático para cada cenário e mensagem WhatsApp pronta para envio.',
        blocks: [
          { kind: 'strategy', body: 'Sempre apresentar 3 cenários. Vender 1 cenário só é fragilidade comercial.' },
          { kind: 'objection', body: '"Mas e se a bolsa cair?" → Por isso temos cenário Conservador, ancorado em CDI.' },
        ],
        related: ['logica-investimento'],
      },
      {
        id: 'incc',
        title: 'INPC e correção da carta',
        executiveSummary:
          'INPC corrige cartas imobiliárias anualmente. Ignorá-lo subestima o valor futuro do crédito.',
        explanation:
          'O INPC (Índice Nacional de Preços ao Consumidor) é usado como projeção consultiva opcional de reajuste anual da carta — o simulador oficial CAIXA não inclui reajuste na simulação.\n\nQuando ativo, impacta saldo devedor, parcela e custo total.',
        blocks: [
          { kind: 'when-to-use', body: 'Cliente analítico, investidor ou comparativo rigoroso.' },
          { kind: 'common-mistake', body: 'Apresentar simulação SEM INPC para cliente analítico — ele vai descobrir e perder a confiança.' },
        ],
        related: ['logica-investimento'],
      },
      {
        id: 'custo-oportunidade',
        title: 'Custo de oportunidade na prática',
        executiveSummary:
          'Todo R$ que entra no consórcio NÃO está rendendo CDI. Todo R$ que fica no CDI NÃO está antecipando bem. Consultor consultivo mostra os dois lados.',
        forWho: 'Consultor diante de cliente analítico ou investidor.',
        explanation:
          'Custo de oportunidade é a melhor alternativa renunciada. Aplicado ao consórcio:\n\n• Lance grande hoje = antecipa contemplação, mas perde rendimento futuro daquele capital.\n• Lance pequeno + caixa rendendo = preserva liquidez, mas adia uso do bem.\n\nO módulo Investimento simula os dois cenários lado a lado. A decisão final é do cliente — você apenas garante que ela seja consciente.',
        blocks: [
          { kind: 'deep-dive', body: 'Custo de oportunidade composto: ((1+CDI_anual)^(prazo/12) − 1) sobre o capital alocado em lance. Sempre composto, nunca linear.' },
          { kind: 'narrative', body: '"Esses R$ 80k de lance, no CDI por 36 meses, dariam R$ X. Por outro lado, antecipar o uso do imóvel vale R$ Y em aluguel economizado. Vamos comparar."' },
          { kind: 'example', body: 'Cliente vai dar R$ 100k de lance ou financiar entrada e investir os R$ 100k. CDI 12% a.a., 4 anos → R$ 100k viram ~R$ 157k. Mas o lance acelera contemplação em 30 meses → ele ganha 30 aluguéis de R$ 2.500 = R$ 75k. Cenário definido por horizonte e perfil.' },
          { kind: 'common-mistake', body: 'Apresentar só o lado favorável ao consórcio. Cliente analítico percebe e desconfia.' },
        ],
        related: ['logica-investimento', 'comparador-cash'],
        modules: ['investment', 'comparator'],
        updatedAt: '2026-05',
      },
      {
        id: 'juros-compostos-narrativa',
        title: 'Juros compostos como narrativa',
        executiveSummary:
          'Cliente entende juros compostos quando você mostra evolução visual — não quando recita fórmula. Use o gráfico do Investimento como peça de venda.',
        explanation:
          'Juros compostos são contraintuitivos: o crescimento parece lento e depois explode. A maioria das pessoas subestima o efeito ao longo de 5+ anos.\n\nA equivalência composta ((1+i)^(1/12) − 1) também é aplicada nas taxas de admin/reserva — o sistema nunca usa divisão simples.',
        blocks: [
          { kind: 'deep-dive', body: 'Toda taxa anual vira mensal por (1+i)^(1/12)−1. Diferença vs i/12 chega a 8% em 12% a.a. Por isso é regra arquitetural.' },
          { kind: 'narrative', body: '"Veja: nos 3 primeiros anos a curva quase não sobe. Do ano 5 em diante, ela vira parábola. É o efeito composto. Por isso começar agora vale tanto."' },
          { kind: 'strategy', body: 'Sempre mostrar período de 60+ meses no gráfico. Períodos curtos escondem o efeito composto.' },
        ],
        related: ['logica-investimento', 'incc'],
      },
    ],
  },

  // ── D. Comparadores ───────────────────────────────────────────
  {
    id: 'comparadores',
    title: 'Comparadores',
    subtitle: 'Comparar com justiça',
    icon: GitCompare,
    executiveSummary:
      'Consórcio × Financiamento (Price/SAC/CET) e Consórcio × À Vista. Toda comparação usa custo efetivo do cliente — base única, sem viés.',
    articles: [
      {
        id: 'comparador-fin',
        title: 'Consórcio × Financiamento',
        executiveSummary:
          'Compara custo efetivo do consórcio (plano + lance) contra Price ou SAC (parcelas + entrada + CET). Tabela mês a mês.',
        explanation:
          'O comparador usa a engine canônica de financiamento (`@/core/finance/financing`): Price (PMT constante), SAC (amortização constante), CET via Newton-Raphson. Inclui MIP, DFI e taxa administrativa mensal.\n\nO resultado mostra: custo total, juros pagos, evolução do saldo e ponto de equilíbrio.',
        blocks: [
          { kind: 'explain-client', body: '"No financiamento você paga juros sobre o saldo. No consórcio, paga taxa de administração diluída. Veja o total ao final do prazo."' },
          { kind: 'objection', body: '"Mas no financiamento eu já tenho o bem!" → Sim, com R$ X de juros. No consórcio com lance, você antecipa também — sem juros.' },
          { kind: 'deep-dive', body: 'CET = Newton-Raphson sobre VPL=0. Inclui todos os encargos. É a única taxa comparável entre instituições.' },
        ],
        related: ['comparador-cash', 'sac-price'],
      },
      {
        id: 'sac-price',
        title: 'SAC × PRICE',
        executiveSummary:
          'PRICE = parcela fixa, juros decrescentes. SAC = amortização fixa, parcelas decrescentes. Escolha muda o custo total.',
        explanation:
          'PRICE é mais comum em financiamento privado — parcela previsível, mas mais juros no total.\nSAC é mais comum em CEF — parcela inicial maior, mas amortiza mais rápido e custa menos.\n\nO comparador apresenta os dois lado a lado.',
        blocks: [
          { kind: 'when-to-use', body: 'PRICE → cliente prioriza previsibilidade. SAC → cliente prioriza economia total.' },
        ],
        related: ['comparador-fin'],
      },
      {
        id: 'comparador-cash',
        title: 'Consórcio × À Vista (Alavancagem)',
        executiveSummary:
          'Mostra que à vista nem sempre é melhor: o capital aplicado pode render mais que o custo do consórcio. E há a estratégia da carta dobrada.',
        explanation:
          'A estratégia de alavancagem com carta dobrada (multiplicador 2x) mostra como aplicar metade do capital, comprar 2 cartas e capturar valorização sobre o dobro do patrimônio.\n\nIdeal para investidores e clientes com capital líquido relevante.',
        blocks: [
          { kind: 'ideal-profile', body: 'Investidor, empresário com caixa, cliente que "ia pagar à vista".' },
          { kind: 'strategy', body: 'Apresente como segunda opinião financeira — não como venda. Cliente decide.' },
        ],
        related: ['comparador-fin', 'op-estruturadas'],
      },
      {
        id: 'cet-explicado',
        title: 'CET — a única taxa comparável',
        executiveSummary:
          'CET (Custo Efetivo Total) consolida todos os encargos do financiamento em uma taxa anual única. É a base honesta de comparação entre instituições e contra consórcio.',
        forWho: 'Consultor que precisa defender a comparação financeiro × consórcio.',
        explanation:
          'CET inclui: juros nominais + IOF + tarifas + seguros (MIP/DFI) + taxa de avaliação + registro. O cálculo usa Newton-Raphson sobre o VPL=0 — é a TIR real do financiamento.\n\nDuas instituições com mesma "taxa de juros" podem ter CETs muito diferentes. Por isso compará-las só por taxa nominal é enganoso.',
        blocks: [
          { kind: 'deep-dive', body: 'CET = taxa que zera o VPL do fluxo (entrada + parcelas + tarifas) contra o valor liberado. O sistema usa Newton-Raphson com fallback bissecção.' },
          { kind: 'narrative', body: '"O banco te ofereceu 10,5% a.a. de juros. Mas o CET dele é 13,8% — porque tem MIP, DFI, IOF e tarifa mensal. É essa taxa que comparamos com o consórcio."' },
          { kind: 'objection', body: '"Mas no anúncio diz 10%!" — Por isso o BACEN obriga divulgar CET. É o número real do contrato.' },
        ],
        related: ['comparador-fin', 'sac-price'],
        updatedAt: '2026-05',
      },
    ],
  },

  // ── E. Operações Estruturadas ─────────────────────────────────
  // ── E. Capítulo: Operações Estruturadas ───────────────────────
  //    (parte da Plataforma Patrimonial · Edição Consultiva)
  {
    id: 'operacoes-estruturadas',
    title: 'Capítulo: Operações Estruturadas',
    subtitle: 'Multiplicar patrimônio',
    icon: Layers,
    executiveSummary:
      'Capítulo da Plataforma Patrimonial · Edição Consultiva. Estratégias avançadas: múltiplas cartas, alavancagem, troca de bem, venda de cota contemplada. Para clientes com perfil patrimonial.',
    articles: [
      {
        id: 'op-estruturadas',
        title: 'Quando usar Operações Estruturadas',
        executiveSummary:
          'Não é para todo cliente. É para perfis com objetivo patrimonial claro, capital relevante e horizonte de médio/longo prazo.',
        explanation:
          'O módulo gera relatórios personalizados que mostram multiplicação patrimonial, fluxo de capital e racional financeiro. Cada operação tem assumptions explícitas para auditoria.',
        blocks: [
          { kind: 'ideal-profile', body: 'Investidor patrimonialista, empresário, cliente com 2+ imóveis, gestores de patrimônio familiar.' },
          { kind: 'when-not-to-use', body: 'Cliente comprando primeiro imóvel ou primeiro carro. Não é o momento certo.' },
          { kind: 'common-mistake', body: 'Apresentar OE sem antes validar perfil no Diagnóstico. Quebra credibilidade.' },
          { kind: 'strategy', body: 'Apresente sempre o relatório institucional impresso — peso visual importa para esse perfil.' },
        ],
        related: ['comparador-cash', 'venda-cota'],
        updatedAt: '2026-05',
      },
      {
        id: 'venda-cota',
        title: 'Venda de cota contemplada',
        executiveSummary:
          'Cota contemplada pode ser vendida com deságio. Útil para sair antes do fim do plano com liquidez.',
        explanation:
          'O cenário "Venda de Cota" calcula breakeven: a partir de qual % recebido na venda o cliente sai positivo vs continuar pagando.',
        blocks: [
          { kind: 'when-to-use', body: 'Cliente que precisa de liquidez ou mudou de objetivo após contemplação.' },
        ],
        related: ['op-estruturadas'],
      },
      {
        id: 'alavancagem-patrimonial',
        title: 'Alavancagem patrimonial com cartas',
        executiveSummary:
          'Em vez de pagar 1 imóvel à vista, comprar 2 cartas com metade do capital cada e capturar valorização sobre o dobro do patrimônio. Perfil patrimonialista clássico.',
        forWho: 'Investidor com capital ≥ R$ 300k buscando expandir patrimônio.',
        explanation:
          'A mecânica: cliente com R$ 500k que ia comprar 1 imóvel à vista. Alternativa: 2 cartas de R$ 500k cada, com R$ 250k de lance em cada uma. Patrimônio bruto exposto: R$ 1MM em vez de R$ 500k.\n\nValorização imobiliária histórica (CUB/INPC) atua sobre o dobro. O custo são as parcelas residuais e o tempo até a 2ª contemplação.',
        blocks: [
          { kind: 'deep-dive', body: 'O comparador calcula valorização composta: (1+vmensal)^prazo. Aplicada sobre o patrimônio exposto, não sobre o capital alocado.' },
          { kind: 'example', body: 'R$ 500k à vista, valorização 0,5% a.m., 60 meses → R$ 674k. Versus 2 cartas R$ 500k com lance R$ 250k cada → R$ 1.348k. Diferença: R$ 674k de patrimônio adicional, descontando custo do plano.' },
          { kind: 'when-not-to-use', body: 'Cliente que precisa de liquidez ou tem aversão a parcela. Alavancagem exige fôlego e estômago.' },
          { kind: 'narrative', body: '"O dinheiro que pagaria 1 imóvel à vista compra exposição a 2. Em 5 anos, a valorização sobre o dobro tipicamente paga o custo do plano e ainda sobra."' },
        ],
        related: ['op-estruturadas', 'comparador-cash', 'nicho-investidor'],
        modules: ['comparator', 'structuredOps'],
        updatedAt: '2026-05',
      },
      {
        id: 'investidor-patrimonial-aprofundado',
        title: 'Conduzir o investidor patrimonial',
        executiveSummary:
          'Investidor patrimonial decide por números, não por emoção. Sequência: Comparador → Investimento → Op. Estruturadas → Proposta com relatório institucional.',
        forWho: 'Consultor que recebeu lead com perfil "investidor" no Diagnóstico.',
        explanation:
          'Esse perfil exige profundidade técnica: CET, custo de oportunidade composto, valorização real do imóvel, yield líquido. Linguagem rasa quebra credibilidade.\n\nInverter a ordem (mostrar proposta antes de comparativo) costuma perder a venda. Ele quer ver alternativas antes de escolher.',
        blocks: [
          { kind: 'discovery', body: '"Qual seu objetivo: renda mensal, valorização ou diversificação?" — define qual cenário do Investimento priorizar.' },
          { kind: 'discovery', body: '"Quanto desse capital você precisa líquido nos próximos 24 meses?" — calibra agressividade do lance.' },
          { kind: 'strategy', body: 'Apresente sempre 3 alternativas: à vista, financiamento e consórcio com lance. Em todos, custo real comparável e valorização do bem.' },
          { kind: 'objection', body: '"Por que não financiar SAC?" — Compare CET total. Em prazo longo, consórcio costuma ganhar 15-25% vs SAC; em prazo curto, financiamento pode ganhar.' },
          { kind: 'narrative', body: '"Te mando 3 cenários antes de qualquer recomendação. Você decide olhando os números — eu só explico o racional."' },
        ],
        related: ['nicho-investidor', 'alavancagem-patrimonial', 'comparador-cash'],
        modules: ['comparator', 'investment', 'structuredOps'],
        updatedAt: '2026-05',
      },
    ],
  },

  // ── F. Nichos Estratégicos ────────────────────────────────────
  {
    id: 'nichos',
    title: 'Nichos Estratégicos',
    subtitle: 'Vender por contexto',
    icon: Briefcase,
    executiveSummary:
      'Mini playbooks consultivos por perfil de cliente. Cada nicho traz dores, gatilhos, narrativa, objeções típicas e racional financeiro específico.',
    articles: [
      {
        id: 'nicho-renovacao',
        title: 'Reforma e Renovação',
        executiveSummary:
          'Cliente com imóvel próprio que precisa reformar. Carta imobiliária pode financiar reforma com regras específicas.',
        explanation:
          'Reformas têm limites de valor e exigem documentação específica. A narrativa muda: não é "comprar imóvel", é "transformar o que já tenho".',
        blocks: [
          { kind: 'ideal-profile', body: 'Proprietário com imóvel quitado, com projeto definido, valor de reforma ≥ 100k.' },
          { kind: 'objection', body: '"Por que não pego empréstimo pessoal?" → Taxa pessoal: 5-8% a.m. Consórcio: 0,5% a.m. equivalente.' },
          { kind: 'strategy', body: 'Use storytelling de transformação: antes/depois. Foque no resultado de uso, não no número.' },
        ],
      },
      {
        id: 'nicho-investidor',
        title: 'Investidor Patrimonial',
        executiveSummary:
          'Foco em rentabilidade, alavancagem e formação de patrimônio. Linguagem técnica, números, comparativos rigorosos.',
        explanation:
          'Este perfil exige profundidade. Use Investimento + Comparadores + Operações Estruturadas. Apresente cenários conservador/realista/otimista.',
        blocks: [
          { kind: 'ideal-profile', body: 'Possui 2+ imóveis ou capital ≥ 500k. Lê relatório, pergunta sobre yield e CET.' },
          { kind: 'strategy', body: 'Comece pelo Comparador. Depois Investimento. Só então proposta. Inverter ordem perde a venda.' },
          { kind: 'objection', body: '"E se a inflação subir?" → Carta corrige por INPC. Você não fica defasado.' },
        ],
      },
      {
        id: 'nicho-trocar-carro',
        title: 'Trocar de Carro',
        executiveSummary:
          'Cliente quer trocar veículo atual. Cenário cobre gap (valor do novo − valor do usado) preenchendo crédito automaticamente.',
        explanation:
          'O Diagnóstico identifica este caso e auto-preenche o crédito com o gap. A narrativa cruza venda do atual + entrada + parcela do novo.',
        blocks: [
          { kind: 'ideal-profile', body: 'Cliente com carro 4-7 anos quer atualizar sem perder muito patrimônio.' },
          { kind: 'explain-client', body: '"Vendendo seu carro atual por R$ X, sua entrada vira parte do lance. Veja sua parcela final."' },
        ],
      },
      {
        id: 'nicho-conservador',
        title: 'Cliente conservador',
        executiveSummary:
          'Avesso a risco, valoriza previsibilidade. Foco em parcela cheia (não reduzida), lance em zona verde e narrativa de proteção (seguro).',
        explanation:
          'Esse perfil reage mal a "promessas" e termos técnicos sem explicação. A venda acontece quando ele sente controle: prazo definido, parcela estável, alternativas comparadas.',
        blocks: [
          { kind: 'ideal-profile', body: 'Cliente 45+ anos, com renda estável, primeira experiência com consórcio.' },
          { kind: 'discovery', body: '"O que mais te preocupa: o tamanho da parcela ou a previsibilidade dela?" — quase sempre é previsibilidade.' },
          { kind: 'strategy', body: 'Não venda parcela reduzida — soa como "armadilha". Venda parcela cheia + cenário conservador no Investimento.' },
          { kind: 'objection', body: '"E se eu não for contemplado?" — Mostre o histórico do grupo (Estudo de Lances) e explique que o sorteio é mensal e o lance é opcional.' },
          { kind: 'narrative', body: '"Vou te mostrar o pior cenário primeiro. Se nele já fizer sentido, os outros são bônus."' },
        ],
        related: ['interpretacao', 'nicho-renovacao'],
      },
      {
        id: 'nicho-descapitalizado',
        title: 'Cliente descapitalizado',
        executiveSummary:
          'Sem caixa para lance livre relevante. Estratégia: lance embutido até o limite + livre pequeno. Foco em sorteio + parcela acessível.',
        explanation:
          'Cliente que entra "para ter chance um dia". A venda consultiva é gerenciar expectativa: contemplação por sorteio é probabilística, não programável.\n\nLance embutido (50% imobiliário, 30% auto/pesados) usa parte da própria carta — não exige caixa.',
        blocks: [
          { kind: 'ideal-profile', body: 'Renda estável, sem reserva, quer entrar no jogo sem comprometer o orçamento.' },
          { kind: 'discovery', body: '"Você tem alguma reserva separada para uma oportunidade de lance, mesmo que pequena?" — define se há margem.' },
          { kind: 'strategy', body: 'Combine lance embutido máximo + livre simbólico (1-3%). Posiciona na zona amarela do grupo sem exigir caixa.' },
          { kind: 'common-mistake', body: 'Vender "vai ser contemplado em X meses". Sorteio é probabilístico. Promessa quebra confiança.' },
          { kind: 'objection', body: '"Vai demorar muito?" — "A média do grupo é Y meses. Pode ser antes (lance + sorteio) ou depois. O que garanto é o uso ao final do plano."' },
        ],
        related: ['tipos-de-lance', 'estrategia-lance'],
      },
      {
        id: 'nicho-empresario',
        title: 'Empresário e PJ',
        executiveSummary:
          'Decide rápido se vê racional financeiro claro. Foco em fluxo de caixa, dedutibilidade contábil quando aplicável e cartas múltiplas para frota/expansão.',
        explanation:
          'Empresário pensa em CapEx vs OpEx, em prazo de retorno e em uso operacional do bem. Apresentar consórcio como ferramenta de capitalização programada funciona melhor que "compra parcelada".',
        blocks: [
          { kind: 'ideal-profile', body: 'Sócio/dono de PME, fluxo de caixa previsível, busca expandir frota, sede ou maquinário.' },
          { kind: 'discovery', body: '"Esse bem entra como ativo da empresa ou pessoa física? Isso muda a estratégia."' },
          { kind: 'strategy', body: 'Para frota: 3-5 cartas escalonadas em meses diferentes, contemplações distribuídas, fluxo de aquisição contínuo.' },
          { kind: 'narrative', body: '"Em vez de descapitalizar a empresa para comprar 1 caminhão à vista, você programa 3 entradas escalonadas e mantém capital de giro."' },
          { kind: 'objection', body: '"Prefiro financiar pelo BNDES/FCO" — compare CET. Linhas subsidiadas ganham; sem subsídio, consórcio costuma ganhar em prazo longo.' },
        ],
        related: ['nicho-investidor', 'alavancagem-patrimonial'],
      },
      {
        id: 'nicho-ansioso-contemplacao',
        title: 'Cliente ansioso por contemplação',
        executiveSummary:
          'Quer "ser contemplado rápido". Risco: aceitar lance acima do que comporta para fugir da espera. Estratégia: educar sobre probabilidade e cadência do grupo.',
        explanation:
          'Esse cliente normalmente já viu propaganda de consórcio "rápido". A função consultiva é trazer expectativa real sem matar o sonho — usando dados do grupo.',
        blocks: [
          { kind: 'discovery', body: '"Em quanto tempo você precisa do bem na mão? Antes disso, tem plano B?" — define se a ansiedade é real ou emocional.' },
          { kind: 'strategy', body: 'Mostre o Estudo de Lances do grupo: tempo médio até primeira contemplação, % por sorteio vs lance. Dados curam ansiedade.' },
          { kind: 'common-mistake', body: 'Vender lance no máximo histórico para "garantir" contemplação. Compromete orçamento e ainda assim pode não vencer.' },
          { kind: 'objection', body: '"Conheço quem foi contemplado em 3 meses!" — Resposta: "Acontece, é estatístico. Mas vamos planejar pelo realista, não pelo melhor caso."' },
          { kind: 'narrative', body: '"Vou te dar 2 cenários: contemplado em 12 meses (lance forte) e contemplado em 36 meses (sorteio). Você escolhe qual cabe."' },
        ],
        related: ['estrategia-lance', 'tipos-de-lance'],
      },
      {
        id: 'nicho-primeiro-imovel',
        title: 'Comprador do primeiro imóvel',
        executiveSummary:
          'Carga emocional alta + comparação obrigatória com financiamento (CEF/Minha Casa). Foco em CET total, não em parcela inicial.',
        explanation:
          'Esse cliente tipicamente tem subsídio possível no financiamento (FGTS, MCMV). Em alguns casos, o financiamento ganha; em outros, o consórcio ganha pelo prazo total. Honestidade aqui constrói relação para a vida.',
        blocks: [
          { kind: 'discovery', body: '"Você tem FGTS disponível? Se enquadra no MCMV?" — define se há subsídio que muda o cenário.' },
          { kind: 'strategy', body: 'Sempre rodar Comparador Consórcio × Financiamento com SAC e Price. Apresente os 3 (consórcio + 2 financ.) com CET.' },
          { kind: 'when-not-to-use', body: 'Se cliente se enquadra em MCMV faixa 1-2 com forte subsídio, geralmente o financiamento ganha. Diga.' },
          { kind: 'narrative', body: '"Antes de te recomendar consórcio, vou rodar a alternativa financiamento. Se ela for melhor para o seu caso, te falo."' },
          { kind: 'objection', body: '"Mas no consórcio eu não tenho o imóvel agora!" — Verdade. Por isso comparamos com lance: você antecipa a contemplação e tem o imóvel em meses, sem juros.' },
        ],
        related: ['comparador-fin', 'nicho-conservador'],
      },
    ],
  },

  // ── F2. Proposta Consultiva ───────────────────────────────────
  {
    id: 'proposta',
    title: 'Proposta Consultiva',
    subtitle: 'Materializar a recomendação',
    icon: FileText,
    executiveSummary:
      'A Proposta não é PDF de venda — é o documento institucional que materializa toda a jornada consultiva. Continuidade total entre Diagnóstico, Simulação e Estratégia, com PDF auditável e link visual compartilhável.',
    articles: [
      {
        id: 'proposta-como-funciona',
        title: 'Como a Proposta funciona',
        executiveSummary:
          'A Proposta consome a fachada única `useProposalData()` — mesma matemática da tela, sem drift. O que você vê é o que o cliente recebe.',
        forWho: 'Consultor que quer enviar material institucional, não cotação solta.',
        whenToUse: 'Após Diagnóstico + Simulação + estudo de cenários. Nunca antes.',
        explanation:
          'Cada bloco do PDF é alimentado por um contexto producer (Simulator, Investment, Bids, Wealth) reunido em `useProposalData()`. Blocos selecionados sempre renderizam; quando faltam dados, aparece um aviso institucional discreto — nunca número errado.\n\nO PDF é gerado via Browserless (Chromium real), garantindo fidelidade visual de A4 e tipografia institucional.',
        blocks: [
          { kind: 'when-to-use', body: 'Quando o cliente disse "me manda por escrito". Antes disso, conversa primeiro.' },
          { kind: 'common-mistake', body: 'Gerar Proposta com diagnóstico vazio. O tom fica genérico e a IA não tem o que personalizar.' },
          { kind: 'strategy', body: 'Sempre revise os blocos selecionados antes de enviar. Menos blocos relevantes > muitos blocos genéricos.' },
          { kind: 'explain-client', body: '"Isso aqui é o que conversamos, formatado. Os números são os mesmos da tela."' },
        ],
        related: ['proposta-continuidade', 'proposta-link', 'verdade-unica'],
        modules: ['proposal'],
        updatedAt: '2026-05',
      },
      {
        id: 'proposta-continuidade',
        title: 'Continuidade consultiva — Diagnóstico → Wealth → Proposta',
        executiveSummary:
          'O perfil do Diagnóstico, os parâmetros do Wealth e os cenários do Investimento atravessam a Proposta sem reentrada de dados — e sem perda de contexto narrativo.',
        explanation:
          'A continuidade paramétrica garante que o calcContext do Wealth chegue ao PDF idêntico, que os cenários do Investimento sejam reaproveitados como tabela comparativa, e que o tom contextual do perfil module a narrativa.\n\nIsso elimina o erro clássico de "proposta que contradiz a simulação" — vetor número 1 de quebra de confiança no fechamento.',
        blocks: [
          { kind: 'deep-dive', body: 'Fachada canônica `@/contexts/proposal`. Proibido `ProposalDataContext` genérico com `any`. Cada novo bloco segue o padrão Producer Context + reexport.' },
          { kind: 'when-to-use', body: 'Sempre que mudar uma premissa do Wealth, abra a Proposta e revise — a continuidade é automática mas a leitura humana é insubstituível.' },
          { kind: 'common-mistake', body: 'Editar parcela manualmente no PDF. Volte ao Simulador e ajuste lá — a fonte é única por construção.' },
        ],
        related: ['proposta-como-funciona', 'verdade-unica'],
        modules: ['proposal', 'wealth'],
      },
      {
        id: 'proposta-link',
        title: 'PDF institucional e link compartilhável',
        executiveSummary:
          'Dois formatos do mesmo conteúdo: PDF A4 para anexo institucional e link visual com token 256-bit para abertura no celular do cliente.',
        explanation:
          'O link visual é uma página de decisão em 6 blocos, otimizada para mobile e leitura rápida. O token tem expiração configurável e é invalidável.\n\nO PDF é o documento "definitivo" — formato que vai por email, WhatsApp anexo ou impresso.',
        blocks: [
          { kind: 'strategy', body: 'Envie o link primeiro (cliente abre no celular em segundos), e o PDF como anexo confirmatório.' },
          { kind: 'when-to-use', body: 'Link visual: pré-fechamento. PDF: confirmação institucional após "sim".' },
          { kind: 'objection', body: '"Pode mandar resumo no WhatsApp?" — "Já mando: é um link que abre direto no seu celular, com tudo organizado. PDF segue como anexo."' },
        ],
        related: ['proposta-como-funciona'],
        modules: ['proposal'],
      },
      {
        id: 'proposta-disclaimer',
        title: 'Disclaimers institucionais — por que existem',
        executiveSummary:
          'Toda Proposta carrega disclaimer de "simulação ilustrativa" e ausência de garantia de contemplação. Isso protege o consultor e dá credibilidade institucional.',
        explanation:
          'Nunca prometer garantia de contemplação ou rendimento é regra global da plataforma — vale para Simulador, Comparador, IA, Proposta e PDF. A linguagem é uniforme em toda a stack.',
        blocks: [
          { kind: 'when-to-use', body: 'Sempre. O disclaimer não é "letra miúda" — é diferenciador de profissionalismo.' },
          { kind: 'explain-client', body: '"Estes números são reais e auditáveis, mas a contemplação tem regras de mercado que ninguém controla. Por isso a estratégia é tão importante."' },
          { kind: 'common-mistake', body: 'Esconder o disclaimer. Quando o cliente percebe (e percebe), perde confiança no resto.' },
        ],
        related: ['proposta-como-funciona', 'protecao-dados'],
        updatedAt: '2026-05',
      },
    ],
  },

  // ── F3. IA Consultiva ─────────────────────────────────────────
  {
    id: 'ia-consultiva',
    title: 'IA Consultiva',
    subtitle: 'Acelerar sem terceirizar',
    icon: Bot,
    executiveSummary:
      'A IA da plataforma é copiloto consultivo — gera narrativa, antecipa objeções, sugere próximo passo. Nunca decide pelo consultor, nunca promete garantia, nunca foge da matemática institucional.',
    articles: [
      {
        id: 'ia-papel',
        title: 'O que a IA faz (e o que não faz)',
        executiveSummary:
          'A IA acelera comunicação consultiva. Ela NÃO calcula, NÃO recomenda produto, NÃO substitui o consultor.',
        forWho: 'Todo consultor que usa qualquer copilot ou geração de proposta.',
        explanation:
          'A arquitetura separa dois mundos: matemática vive em motores determinísticos locais (`@/core/finance`); comunicação consultiva vive em edges de IA (copilots, storytelling, sales script, geração de proposta).\n\nIsso garante que o número nunca depende de IA — e que a narrativa nunca contradiz o número.',
        blocks: [
          { kind: 'when-to-use', body: 'Use IA para: escrever mensagem WhatsApp, antecipar objeção, sugerir próxima ação, dar tom à proposta.' },
          { kind: 'when-not-to-use', body: 'NÃO use IA para: decidir tipo de lance, definir cenário, prometer prazo de contemplação. Isso é raciocínio consultivo.' },
          { kind: 'deep-dive', body: 'Mapa vivo das edges em `.lovable/audit/ai-edges-map.md`. Cláusula global "nunca prometer garantia" em todas as edges.' },
        ],
        related: ['ia-copilots', 'ia-limites'],
      },
      {
        id: 'ia-copilots',
        title: 'Copilots por módulo',
        executiveSummary:
          'Cada módulo crítico tem copilot próprio: Vendas, Pós-venda, Storytelling de Investimento, Script de Abordagem, Ação por Fase do Funil.',
        explanation:
          'Copilots são contextuais: leem `useProposalData()` (mesma fachada do PDF) e devolvem texto consultivo já adaptado ao perfil. Os principais:\n\n• Sales Copilot — argumentos proativos por fase de venda.\n• Investment Storytelling — narrativa por cenário (Conservador/Realista/Otimista).\n• Sales Script — abordagem contextual por driver primário × estágio.\n• Phase Action — próxima ação concreta por fase do funil.\n• Post-Sale Response — classifica mensagem do cliente e sugere resposta institucional.',
        blocks: [
          { kind: 'strategy', body: 'Use copilot como "primeira versão" e edite. Cliente percebe texto 100% IA — texto editado mantém autoria consultiva.' },
          { kind: 'common-mistake', body: 'Copiar saída de IA sem revisar nome, valor ou contexto. A IA respeita perfil mas não conhece a história do cliente.' },
          { kind: 'when-to-use', body: 'Sempre que a comunicação for repetitiva ou quando você travar na frase de abertura.' },
        ],
        related: ['ia-papel', 'ia-limites'],
      },
      {
        id: 'ia-limites',
        title: 'Limites e governança da IA',
        executiveSummary:
          'Rate limit por usuário, cache tenant-aware, fragmentos compartilhados (tom consultivo, anti-garantia, CSAA), sem PII em logs.',
        explanation:
          'A camada de IA é blindada por construção: cláusula global "nunca prometer garantia" em todas as edges; estrutura CSAA (Classificar/Contexto/Recomendar/Ajustar) padronizada; cache `aiResponseCache` com chave por tenant para evitar drift cross-empresa; rate limit por user_id (fallback IP).\n\nPII (nome, telefone, email) é mascarada antes de log. Nenhum dado de cliente sai do ambiente do consultor.',
        blocks: [
          { kind: 'deep-dive', body: 'Edges canônicas em `supabase/functions/*` com `_lib/` compartilhado (cors, rate limit, validators, prompt fragments, PII mask).' },
          { kind: 'when-to-use', body: 'Confie no limite quando ele dispara — significa que algo no input está fora do padrão consultivo.' },
          { kind: 'common-mistake', body: 'Tentar forçar IA a "prometer contemplação rápida" reescrevendo prompt. A cláusula global bloqueia — e está certo.' },
          { kind: 'explain-client', body: '"A IA aqui me ajuda a comunicar com mais clareza. Os números e a estratégia são meus, auditáveis."' },
        ],
        related: ['ia-papel', 'ia-copilots', 'protecao-dados'],
      },
    ],
  },

  // ── G. Carteira & Pós-venda ───────────────────────────────────
  {
    id: 'carteira-posvenda',
    title: 'Carteira & Pós-venda',
    subtitle: 'Sustentar a base',
    icon: Kanban,
    executiveSummary:
      'CRM leve em Kanban + Pós-venda ativo. Cadência institucional, alertas de SLA, score de engajamento e previsão de receita.',
    articles: [
      {
        id: 'carteira',
        title: 'Carteira como motor de previsibilidade',
        executiveSummary:
          'Não é só lista de propostas. É o sistema que mostra o que vai fechar, o que está esfriando e o que precisa de ação hoje.',
        explanation:
          'A Carteira tem cadência institucional: SLA por coluna (prospec 5/10 dias, agard 3/7, aval 4/8). Após o limite, alerta visual. Movimentação ativa exige próxima ação.\n\nO Kanban exibe apenas as colunas ativas (Prospecção → Aguardando Retorno → Em Avaliação → Proposta Ajustada). Quando o cliente fecha, use o botão "Mover para Pós-venda" no modal da proposta ajustada — ele migra o cliente automaticamente para o módulo Pós-venda e oculta a proposta do Kanban (sem perder histórico).\n\nLeads que não convertem devem ser arquivados pelo menu ··· com motivo (Sem interesse / Financiamento / Sem condição financeira / Concorrente / Outro). Ficam acessíveis no toggle "Arquivados" no topo da Carteira, com botão Reativar a qualquer momento.\n\nA Previsão de Vendas combina probabilidade por etapa × valor da proposta.',
        blocks: [
          { kind: 'when-to-use', body: 'Diariamente. 5 min de manhã = decisão clara do dia. "O que fazer hoje" já abre expandido.' },
          { kind: 'common-mistake', body: 'Deixar lead morto no Kanban. Se não converte, arquive com motivo — Carteira limpa = previsão confiável.' },
          { kind: 'strategy', body: 'Fechou? "Mover para Pós-venda" no modal. Não converteu? Arquivar com motivo no menu ···. Mover proposta exige registrar próxima ação.' },
        ],
        related: ['posvenda', 'previsao'],
        updatedAt: '2026-05',
      },
      {
        id: 'previsao',
        title: 'Previsão de vendas e meta',
        executiveSummary:
          'Probabilidades canônicas por etapa: 10/20/35/60%. Você vê o gap até a meta antes do fim do mês.',
        explanation:
          'Define-se meta no perfil. O sistema calcula valor esperado da carteira ativa e mostra "Top 5 oportunidades" que mais aproximam da meta.',
        blocks: [
          { kind: 'strategy', body: 'Foque nos Top 5. Eles costumam representar 70%+ do esperado.' },
        ],
        related: ['carteira'],
      },
      {
        id: 'posvenda',
        title: 'Pós-venda ativo',
        executiveSummary:
          'Cliente fechado é cliente vivo. Pós-venda gera indicação, recompra e cota dobrada — fontes de receita previsíveis.',
        explanation:
          'O módulo Pós-venda tem assistente de respostas (classifica mensagem do cliente e sugere resposta institucional) e cadência específica para clientes contemplados, em pagamento e indicadores.',
        blocks: [
          { kind: 'when-to-use', body: 'Sempre. Consultor sem pós-venda perde 30-50% de receita potencial.' },
          { kind: 'explain-client', body: '"Estou aqui no caminho todo, não só na assinatura."' },
        ],
        related: ['carteira'],
      },
      {
        id: 'relacionamento-consultivo',
        title: 'Relacionamento consultivo de longo prazo',
        executiveSummary:
          'Cliente que sente acompanhamento real indica em média 2,3x mais. A cadência institucional não é cobrança — é presença útil.',
        forWho: 'Consultor que quer construir base recorrente, não só fechar venda única.',
        explanation:
          'A diferença entre vendedor e consultor: o vendedor desaparece após o pagamento; o consultor reaparece em momentos chave (contemplação aproximando, aniversário do plano, mudança macroeconômica relevante).\n\nA cadência sugerida: contato mensal nos 3 primeiros meses, bimestral até a contemplação, mensal após contemplação durante uso da carta.',
        blocks: [
          { kind: 'strategy', body: 'Mensagem de aniversário do plano (1 ano) é o melhor gancho de indicação. Cliente está sentindo o produto funcionar.' },
          { kind: 'narrative', body: '"Hoje é 1 ano da sua entrada. Quanto já entrou de FC: R$ X. Tempo até contemplação histórica: Y meses. Tudo no eixo."' },
          { kind: 'common-mistake', body: 'Sumir após a venda e voltar só pedindo indicação. Cliente percebe a transação e bloqueia.' },
          { kind: 'discovery', body: '"Conhece alguém que está no mesmo momento que você estava ano passado?" — depois de entregar valor, não antes.' },
        ],
        related: ['carteira', 'posvenda', 'indicacao-recompra'],
        modules: ['postSale'],
        updatedAt: '2026-05',
      },
      {
        id: 'indicacao-recompra',
        title: 'Indicação e recompra como pipeline',
        executiveSummary:
          'Indicação custa zero, converte 3-5x mais que lead frio. Recompra (segunda carta) acontece naturalmente em clientes contemplados satisfeitos. Trate como pipeline.',
        explanation:
          'Pós-venda bem feito gera dois fluxos: indicação (cliente passa contato) e recompra (cliente compra segunda carta). Ambos têm gatilhos previsíveis.\n\nGatilho de indicação: cliente acabou de receber benefício (contemplação, mensagem de aniversário, queda de parcela). Gatilho de recompra: cliente usou primeira carta com sucesso e tem novo objetivo.',
        blocks: [
          { kind: 'strategy', body: 'Crie campo "Próxima conversa" no Pós-venda com gatilho temporal. 30/60/90/365 dias após contemplação.' },
          { kind: 'narrative', body: '"Você está usando bem a carta. Já pensou em uma segunda — para [investimento/segundo imóvel/auto]?" — pergunta aberta, não pitch.' },
          { kind: 'example', body: 'Cliente contemplado em 14 meses na carta de R$ 250k para imóvel próprio. Após 6 meses morando, é abordado para 2ª carta de R$ 150k para investimento. Conversão tipica >40% em base ativa.' },
          { kind: 'objection', body: '"Já tenho um, não preciso de outro" — "Entendo. E se for para alugar e gerar renda? Tenho um cenário rápido para te mostrar." Não insiste.' },
        ],
        related: ['posvenda', 'relacionamento-consultivo'],
        updatedAt: '2026-05',
      },
    ],
  },

  // ── H. Comunidade ─────────────────────────────────────────────
  {
    id: 'comunidade',
    title: 'Comunidade',
    subtitle: 'Resolver em rede',
    icon: Users,
    executiveSummary:
      'Feed de atividade em tempo real (estilo Twitter) com casos novos, respostas e resoluções. Reputação cresce ao ajudar — destrava funcionalidades.',
    articles: [
      {
        id: 'feed-comunidade',
        title: 'Feed de atividade da Comunidade',
        executiveSummary:
          'Scroll contínuo com cards por tipo de evento (Novo caso / Resposta nova / Resolvido / Sem resposta). Avatares e badges de nível em cada card.',
        explanation:
          'A Comunidade abre num feed cronológico. Use a aba "Precisa de você" para responder casos sem resposta e ganhar pontos de nível. Curta casos no feed e respostas individuais no detalhe — a resposta mais curtida recebe o badge "Mais útil".\n\nAbas: Tudo · Precisa de você · Meus casos + busca inline. Social proof no topo (resolvidos / aguardando / consultores / casos novos).',
        blocks: [
          { kind: 'when-to-use', body: 'Abrir 1x ao dia. "Precisa de você" = atalho para responder e subir de nível.' },
          { kind: 'strategy', body: 'Curtir respostas úteis ajuda a comunidade — a mais curtida vira referência com badge "Mais útil".' },
        ],
        related: ['pedir-ajuda', 'responder', 'reputacao'],
        updatedAt: '2026-05',
      },
      {
        id: 'pedir-ajuda',
        title: 'Como pedir ajuda',
        executiveSummary:
          'Anonimização automática: dados pessoais do cliente nunca aparecem. Foco no caso, na estratégia e na decisão.',
        explanation:
          'Antes de postar: descreva o contexto (perfil do cliente, objetivo, simulação atual) e a dúvida específica. Quanto mais claro, melhores respostas.',
        blocks: [
          { kind: 'when-to-use', body: 'Caso atípico, objeção difícil, cliente em decisão complexa.' },
          { kind: 'common-mistake', body: 'Postar "alguém me ajuda?" sem contexto. Ninguém responde.' },
        ],
        related: ['responder', 'reputacao', 'feed-comunidade'],
      },
      {
        id: 'responder',
        title: 'Como responder bem',
        executiveSummary:
          'Resposta consultiva: aponta racional, não só conclusão. Ajudar bem aumenta sua reputação e libera funcionalidades.',
        explanation:
          'Boa resposta: 1) reformula o problema, 2) traz racional, 3) sugere próxima ação. Cita módulos do sistema quando relevante. Respostas curtidas pelos colegas viram referência com badge "Mais útil".',
        blocks: [
          { kind: 'strategy', body: 'Responder casos é o melhor treino comercial que existe — e sobe seu nível.' },
        ],
        related: ['pedir-ajuda', 'reputacao', 'feed-comunidade'],
      },
      {
        id: 'reputacao',
        title: 'Reputação e níveis',
        executiveSummary:
          'Score de engajamento (0-100). Quanto mais ajuda real, mais funcionalidades destravam.',
        explanation:
          'Engajamento é medido por uso real (não só login). Score reflete: simulações concluídas, propostas geradas, respostas úteis na comunidade, pós-venda ativo.',
        related: ['responder'],
      },
    ],
  },

  // ── I. Governança & Segurança ─────────────────────────────────
  {
    id: 'governanca',
    title: 'Governança & Segurança',
    subtitle: 'Confiar na plataforma',
    icon: ShieldCheck,
    executiveSummary:
      'Isolamento por consultor, anonimização automática, observabilidade de runtime, anti-XSS institucional. Plataforma enterprise auditável.',
    articles: [
      {
        id: 'protecao-dados',
        title: 'Proteção de dados do cliente',
        executiveSummary:
          'Dados de cliente nunca trafegam para a comunidade ou para outros consultores. Anonimização é automática.',
        explanation:
          'A plataforma usa RLS (Row Level Security) no banco: cada consultor enxerga apenas seus dados. Admin é tratado como consultor comum em proposals/post_sale — sem privilégio horizontal.',
        blocks: [
          { kind: 'explain-client', body: '"Seus dados ficam só comigo. A plataforma é institucional e isolada."' },
          { kind: 'deep-dive', body: 'Veja o módulo Governança no Admin para auditoria completa.' },
        ],
        modules: ['admin'],
      },
      {
        id: 'verdade-unica',
        title: 'Fonte única de verdade',
        executiveSummary:
          'Toda matemática vive em `@/core/finance`. Toda regra de negócio em `businessRules.ts`. Sem drift entre tela, PDF e IA.',
        explanation:
          'Política institucional: simulador, comparador, IA, PDF e governança falam a mesma língua. Qualquer mudança é versionada e auditada.\n\nA Central de Ajuda consome essas verdades — não as redefine.',
        blocks: [
          { kind: 'when-to-use', body: 'Quando o cliente questiona "esse número está certo?". Resposta: é a engine canônica auditada.' },
        ],
      },
      {
        id: 'observabilidade',
        title: 'Observabilidade institucional',
        executiveSummary:
          'Web Vitals, render hotspots, runtime metrics. Performance medida em produção.',
        explanation:
          'A plataforma instrumenta FCP, LCP, CLS, INP, TTFB e renders >16ms. Painel "Performance Intel" no Admin consolida.',
        modules: ['admin'],
      },
      {
        id: 'prompt-mestre-auditoria-seguranca-lgpd',
        title: 'Prompt Mestre de Auditoria de Segurança & LGPD',
        executiveSummary:
          'Prompt institucional canônico para executar auditorias de segurança e LGPD recorrentes em aplicações geradas por IA — cobre autenticação, autorização, RLS, edges, dependências, monitoramento e infraestrutura. Apenas mapeia e reporta; não corrige.',
        forWho: 'Operação, segurança e revisores técnicos da plataforma.',
        whenToUse: 'Antes de cada release maior ou trimestralmente — base estável para comparar regressões.',
        explanation:
          'Use este prompt diretamente no Lovable (ou outro agente) para gerar relatório padronizado com severidade CRÍTICO / ALTO / BAIXO. A versão completa cobre 8 frentes:\n\n1. Autenticação & Autorização — lógica invertida, auth.uid() em rotas protegidas, roles em tabela dedicada (nunca em profiles), privilege escalation.\n2. RLS & Banco — todas as tabelas com RLS habilitada, policies por user_id, GRANT explícito por role, extensões em schema dedicado, REVOKE de anon em funções auth-only.\n3. Edge Functions — Zod validation, rate limit por user_id, validação de domínio do servidor, headers de origem, sem secrets em código cliente.\n4. Frontend & Anti-XSS — proibido dangerouslySetInnerHTML fora da allowlist; SafeNarrative como renderer único; CSP estrita.\n5. PDFs & Compartilhamento — tokens criptográficos, expiração, /proposta desindexada em robots.txt, rate limit em generate-pdf.\n6. Dependências & Supply Chain — npm audit limpo, sem prereleases em produção, Dependabot configurado.\n7. Observabilidade & LGPD — Sentry com consent gate (tracing opt-in, erros como interesse legítimo), analytics gated por consent, sanitização de payloads, sem PII em logs.\n8. Multi-tenant & Infraestrutura — company_id em todas as tabelas relevantes, RPCs respeitam tenant, sem X-Powered-By, sem IP real exposto, monitoramento de anomalias.\n\nSeverity calibration:\n• CRÍTICO — exfiltração, escalação de privilégio, abuse de billing, exposição de PII em massa.\n• ALTO — ausência de rate limit em edge sensível, falta de Dependabot, consent gate ausente.\n• BAIXO — prerelease em produção, headers ausentes não-críticos, falta de HSTS/Permissions-Policy.',
        blocks: [
          { kind: 'when-to-use', body: 'Trimestralmente, antes de cada release maior e após qualquer mudança em RLS, edges ou autenticação.' },
          { kind: 'strategy', body: 'Rodar o prompt completo, mapear achados em CRÍTICO/ALTO/BAIXO, abrir plano de correção priorizando CRÍTICOs no mesmo dia. Quick wins (rate limit, robots.txt, REVOKE) cabem em uma única release.' },
          { kind: 'common-mistake', body: 'Tratar BAIXOs como "depois". Acumulados viram ALTO. Toda auditoria termina com plano datado.' },
          { kind: 'deep-dive', body: 'Consulte o módulo Governança no Admin para snapshot vivo de rate limits, schemas, extensões e consent gates configurados.' },
        ],
        modules: ['admin'],
        updatedAt: '2026-05-27',
      },
    ],
  },
];
