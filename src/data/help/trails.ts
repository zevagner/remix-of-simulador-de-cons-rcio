/**
 * Help Content — Trilhas / Playbooks
 * ────────────────────────────────────────────────────────────────
 * Extraído de `src/data/helpContent.ts` na Quality Sprint 1 (QW7).
 * Conteúdo, IDs e textos preservados byte-a-byte. Apenas organização.
 */
import {
  PiggyBank, Layers, Target, HeartHandshake, Award,
} from 'lucide-react';
import type { HelpTrail } from '../helpContent';

export const trails: HelpTrail[] = [
  // ── Playbook 1: Consultor Iniciante ───────────────────────────
  {
    id: 'trilha-iniciante',
    title: 'Consultor Iniciante',
    description: 'Mini playbook para os primeiros 7 dias — do diagnóstico ao fechamento consultivo.',
    icon: Award,
    audience: 'Consultor que entrou na plataforma há menos de 30 dias.',
    playbookSummary:
      'Aprender a conduzir um atendimento completo: ouvir antes de simular, simular antes de propor, propor antes de pedir decisão. Sem etapa pulada, sem promessa de contemplação, sem foco em parcela.',
    outcomes: [
      'Conduzir Diagnóstico → Simulação → Proposta sem pular etapas.',
      'Defender a composição da parcela (FC + TA + FR + Seguro).',
      'Indicar lance com base em dados (Estudo de Lances), não em intuição.',
      'Registrar próxima ação na Carteira em 100% das propostas.',
    ],
    steps: [
      { articleId: 'visao-da-plataforma', note: 'Entender o sistema como um todo antes de operar.' },
      { articleId: 'fluxo-ideal',         note: 'Memorizar a sequência canônica.' },
      { articleId: 'navegacao' },
      { articleId: 'composicao-parcela',  note: 'Saber explicar cada componente é o teto técnico do iniciante.' },
      { articleId: 'tipos-de-lance' },
      { articleId: 'estrategia-lance',    note: 'Como cruzar caixa do cliente × histórico do grupo.' },
      { articleId: 'interpretacao' },
      { articleId: 'erros-iniciante',     note: 'Revisar a cada 30 dias.' },
      { articleId: 'carteira',            note: 'Carteira sem cadência vira ruído.' },
    ],
    phases: [
      {
        title: 'Descoberta',
        goal: 'Entender objetivo, perfil e contexto financeiro antes de tocar no simulador.',
        actions: [
          'Abrir o Diagnóstico (5 etapas) e preencher com o cliente, não para o cliente.',
          'Confirmar objetivo principal (uso, investimento, troca).',
          'Mapear caixa disponível para lance e parcela máxima confortável.',
        ],
        script: '"Antes de te passar números, deixa eu entender o que você quer alcançar com essa carta. O número final faz mais sentido depois."',
        modules: ['diagnostic'],
      },
      {
        title: 'Simulação',
        goal: 'Gerar simulação coerente com o objetivo, defendendo cada componente.',
        actions: [
          'Escolher tipo (Imobiliário/Auto/Pesados) e crédito de acordo com o objetivo.',
          'Definir prazo razoável (validar idade + prazo ≤ 79a 11m 29d).',
          'Confirmar taxa administrativa e fundo de reserva conforme grupo.',
          'Apresentar a parcela explicando FC + TA + FR + Seguro.',
        ],
        script: '"Sua parcela tem 4 partes: o crédito que você está formando, a taxa da administradora, a reserva do grupo e o seguro que protege sua família. Vou te mostrar cada uma."',
        modules: ['simulator'],
      },
      {
        title: 'Análise estratégica',
        goal: 'Indicar lance com dados e mostrar 2-3 cenários consultivos.',
        actions: [
          'Abrir Estudo de Lances do grupo escolhido.',
          'Cruzar mediana histórica × caixa disponível para sugerir lance.',
          'Rodar Investimento (3 cenários: Conservador/Realista/Otimista).',
          'Se cliente analítico ou patrimonial: comparador financiamento.',
        ],
        modules: ['bids', 'investment', 'comparator'],
      },
      {
        title: 'Quebra de objeções',
        goal: 'Antecipar objeções típicas e responder com racional, sem promessa.',
        actions: [
          'Identificar a objeção real ouvindo o cliente — quase nunca é "preço".',
          'Responder com dado concreto do grupo / da simulação.',
          'Reforçar que a plataforma não promete contemplação — mostra probabilidade.',
        ],
        script: '"Posso te mostrar o histórico real do grupo e a probabilidade. Promessa de contemplação eu não faço — quem faz, perde sua confiança no primeiro mês."',
      },
      {
        title: 'Fechamento consultivo',
        goal: 'Gerar proposta institucional e ancorar próxima ação.',
        actions: [
          'Gerar PDF + link visual (6 blocos) e enviar pelo canal preferido do cliente.',
          'Mover proposta na Carteira registrando próxima ação obrigatória.',
          'Definir cadência: prazo até próximo contato com gancho real.',
        ],
        script: '"Te mando a proposta agora. No dia X eu te chamo com [decisão sobre cenário/dúvida específica]. Combinado?"',
        modules: ['wallet'],
      },
    ],
    caseStudies: [
      {
        profile: 'Mariana, 38, professora, primeira carta imobiliária.',
        situation: 'Tem R$ 15k de reserva e parcela máxima R$ 1.300. Sem urgência, busca segurança.',
        reasoning: 'Perfil conservador: parcela cheia, lance embutido moderado, comparador SAC para validar.',
        strategy: 'Carta R$ 200k, prazo 200m, lance embutido 25% + livre 5%. Apresentado cenário Conservador no Investimento.',
        outcome: 'Fechou na 2ª conversa. Próxima ação registrada: contato em 30 dias para revisão de cenário.',
      },
      {
        profile: 'Rafael, 29, autônomo em ascensão, quer trocar carro.',
        situation: 'Carro atual vale R$ 35k, quer modelo de R$ 75k. Gap = R$ 40k.',
        reasoning: 'Diagnóstico identificou cenário "trocar carro" — gap auto-preencheu o crédito. Lance embutido máximo (30% auto) cobre quase tudo.',
        strategy: 'Carta R$ 50k (margem para acessórios), lance embutido 30% + livre 5% via venda do atual. Storytelling pronto para WhatsApp.',
        outcome: 'Fechou no mesmo dia. Cadência mensal estabelecida.',
      },
    ],
    objections: [
      {
        objection: '"Consórcio é demorado, prefiro financiar."',
        reframe: 'Cliente compara prazo até ter o bem, não custo total.',
        response: 'No consórcio com lance, você antecipa contemplação em meses — sem juros. No financiamento você tem o bem hoje, mas paga R$ X em juros ao longo do prazo. Vamos comparar o custo real lado a lado?',
      },
      {
        objection: '"E se eu não for contemplado?"',
        reframe: 'Medo de "ficar pagando sem ter".',
        response: 'O grupo tem histórico real: mediana de [X] meses até primeira contemplação. Em lance livre, se você não vence o mês, o valor volta integralmente. Só sai do bolso na contemplação.',
      },
      {
        objection: '"A parcela vai aumentar?"',
        reframe: 'Confunde reajuste anual com aumento arbitrário.',
        response: 'O reajuste anual corrige seu crédito também — você não fica defasado. E o seguro cai mês a mês, então a parcela tem componentes que sobem e que descem. Te mostro a evolução.',
      },
    ],
  },

  // ── Playbook 2: Investimentos & Comparadores ──────────────────
  {
    id: 'trilha-investimentos',
    title: 'Investimentos & Comparadores',
    description: 'Mini playbook para vender com profundidade financeira a clientes analíticos e investidores.',
    icon: PiggyBank,
    audience: 'Consultor diante de cliente investidor, analítico ou que considera financiar/pagar à vista.',
    prerequisites: ['trilha-iniciante'],
    playbookSummary:
      'Aprender a conduzir cliente racional: comparativo antes de proposta, custo de oportunidade explícito, CET total e cenários conservador/realista/otimista. Sem inverter ordem.',
    outcomes: [
      'Defender consórcio vs financiamento usando CET, não taxa nominal.',
      'Calcular e narrar custo de oportunidade composto.',
      'Apresentar 3 cenários de Investimento sem viés.',
      'Identificar quando o financiamento ganha — e dizer.',
    ],
    steps: [
      { articleId: 'logica-investimento' },
      { articleId: 'cenarios',                  note: '3 cenários sempre — vender 1 é fragilidade.' },
      { articleId: 'custo-oportunidade',        note: 'Mostrar os dois lados.' },
      { articleId: 'juros-compostos-narrativa', note: 'Gráfico vende mais que fórmula.' },
      { articleId: 'incc' },
      { articleId: 'comparador-fin' },
      { articleId: 'cet-explicado',             note: 'Defender comparação de instituições.' },
      { articleId: 'sac-price' },
      { articleId: 'comparador-cash' },
    ],
    phases: [
      {
        title: 'Descoberta financeira',
        goal: 'Mapear capital, horizonte, tolerância a risco e alternativas que o cliente já considerou.',
        actions: [
          'Perguntar capital líquido disponível e quanto pode comprometer.',
          'Identificar se há FGTS, MCMV ou linhas subsidiadas — podem mudar o cenário.',
          'Confirmar horizonte: 3, 5, 10 anos? Define rigor da composição.',
        ],
        script: '"Antes de comparar, preciso entender 3 coisas: quanto você tem líquido, em quanto tempo precisa do bem e que alternativas você já avaliou."',
        modules: ['diagnostic'],
      },
      {
        title: 'Simulação base + Investimento',
        goal: 'Gerar simulação consorcial e os 6 paths do módulo Investimento lado a lado.',
        actions: [
          'Simulação consorcial padrão como base.',
          'Ativar INPC para cliente analítico (ignorar é perder credibilidade).',
          'Investimento com 3 presets: Conservador (CDI/IPCA), Realista, Otimista.',
        ],
        modules: ['simulator', 'investment'],
      },
      {
        title: 'Comparação Consórcio × Financiamento',
        goal: 'Apresentar Price + SAC vs consórcio com lance, todos com CET total.',
        actions: [
          'Rodar Comparador (Price e SAC) com mesmo crédito e prazo equivalente.',
          'Incluir MIP, DFI, IOF, tarifas — CET completo.',
          'Apresentar custo total e ponto de equilíbrio.',
        ],
        script: '"O banco te ofereceu 10,5% a.a. de juros. Mas o CET dele é 13,8% — porque tem MIP, DFI, IOF e tarifa mensal. É essa taxa que comparamos."',
        modules: ['comparator'],
      },
      {
        title: 'Custo de oportunidade explícito',
        goal: 'Mostrar os dois lados: lance grande vs caixa rendendo.',
        actions: [
          'Calcular rendimento composto do capital alocado em lance no horizonte do cliente.',
          'Calcular benefício de antecipação (aluguel economizado, uso operacional do bem).',
          'Apresentar lado a lado — cliente decide.',
        ],
        script: '"Esses R$ 80k de lance, no CDI por 36 meses, dariam R$ X. Por outro lado, antecipar o uso vale R$ Y. Vamos comparar."',
      },
      {
        title: 'Recomendação honesta',
        goal: 'Recomendar a melhor alternativa para o cliente — mesmo se não for consórcio.',
        actions: [
          'Se cliente se enquadra em MCMV faixa 1-2 com forte subsídio, indicar financiamento.',
          'Se horizonte longo e sem subsídio, consórcio costuma ganhar 15-25%.',
          'Se cliente investidor com capital, propor alavancagem (Op. Estruturadas).',
        ],
        script: '"Antes de te recomendar consórcio, rodei a alternativa financiamento. No seu caso específico, [X] ganha. Se ainda quiser fazer consórcio, te mostro como otimizar."',
      },
    ],
    caseStudies: [
      {
        profile: 'Carlos, 42, dentista com R$ 400k líquidos, busca segundo imóvel.',
        situation: 'Avaliava pagar à vista um R$ 400k. Aceita conversar sobre alternativas.',
        reasoning: 'Capital relevante + perfil analítico = candidato a alavancagem. Comparador Cash mostrou que 2 cartas de R$ 400k (R$ 200k de lance cada) expõem a R$ 800k de patrimônio.',
        strategy: '2 cartas R$ 400k, lance R$ 200k em cada. Apresentado comparativo "à vista vs alavancagem" no cenário realista (valorização 0,5% a.m.).',
        outcome: 'Fechou as 2 cartas. Reabordagem em 18 meses para revisão patrimonial.',
      },
      {
        profile: 'Juliana, 31, quer primeiro imóvel de R$ 300k, tem FGTS.',
        situation: 'Comparou consórcio vs MCMV. FGTS cobre entrada do MCMV faixa 3.',
        reasoning: 'Subsídio MCMV faixa 3 reduz CET para 9,8%. Consórcio ficaria em ~10,5% equivalente — financiamento ganha por R$ 18k em 25 anos.',
        strategy: 'Recomendou financiamento, indicou parceiro. Manteve relação para futura segunda carta de investimento.',
        outcome: 'Cliente indicou 2 colegas no semestre seguinte. Honestidade construiu pipeline.',
      },
    ],
    objections: [
      {
        objection: '"Mas e se a bolsa cair / CDI subir muito?"',
        reframe: 'Cliente teme cenário macro adverso.',
        response: 'Por isso temos cenário Conservador, ancorado em CDI baixo e inflação alta. Se nele já fizer sentido, os outros são bônus. Te mostro.',
      },
      {
        objection: '"No financiamento eu já tenho o imóvel hoje!"',
        reframe: 'Compara prazo de uso, ignora custo total.',
        response: 'Sim, com R$ X de juros ao longo do contrato. No consórcio com lance, você antecipa contemplação em [Y] meses — sem juros. Vamos olhar custo total dos dois?',
      },
      {
        objection: '"Prefiro pagar à vista para não comprometer fluxo."',
        reframe: 'Subestima custo de oportunidade do capital aplicado.',
        response: 'Pagar à vista é seguro. Mas esse capital, rendendo CDI por X anos, viraria R$ Y. Te mostro a alternativa para você decidir com os dois lados na mesa.',
      },
    ],
  },

  // ── Playbook 3: Estratégia de Contemplação ────────────────────
  {
    id: 'trilha-contemplacao',
    title: 'Estratégia de Contemplação',
    description: 'Mini playbook para dominar lance, leitura de assembleia, rediluição e timing.',
    icon: Target,
    audience: 'Consultor que precisa indicar lance defensável e gerenciar expectativa de contemplação.',
    prerequisites: ['trilha-iniciante'],
    playbookSummary:
      'Aprender a transformar dados de assembleia em decisão consultiva: ler histórico do grupo, indicar zona de lance, projetar contemplação e narrar rediluição.',
    outcomes: [
      'Ler Estudo de Lances e classificar zona (verde/amarelo/vermelho).',
      'Indicar lance com base em mediana do grupo e caixa do cliente.',
      'Explicar rediluição com gráfico antes/depois.',
      'Gerenciar ansiedade do cliente sem prometer contemplação.',
    ],
    steps: [
      { articleId: 'tipos-de-lance' },
      { articleId: 'estrategia-lance',         note: 'Cruzar 3 sinais: caixa, mediana, risco.' },
      { articleId: 'contemplacao' },
      { articleId: 'reduzida',                 note: 'Cuidado: vender só "parcela menor" quebra confiança.' },
      { articleId: 'leitura-simulacao-avancada', note: 'Ler o filme, não a foto.' },
      { articleId: 'interpretacao' },
    ],
    phases: [
      {
        title: 'Leitura do grupo',
        goal: 'Entender histórico real antes de indicar lance.',
        actions: [
          'Abrir Estudo de Lances do grupo escolhido.',
          'Anotar mediana, máximo histórico e tempo médio até contemplação.',
          'Verificar tendência (curva descendente = grupos esfriando).',
        ],
        modules: ['bids', 'assemblies'],
      },
      {
        title: 'Calibração de lance',
        goal: 'Indicar lance que cabe no caixa e tem chance real.',
        actions: [
          'Mapear caixa disponível do cliente para lance.',
          'Cliente com caixa: lance livre na zona amarela alta (entre mediana e máx).',
          'Cliente sem caixa: lance embutido máximo (50%/30%) + livre simbólico.',
        ],
        script: '"O grupo tem mediana de 30% e máximo de 45%. Lance de 32% (zona amarela) tem alta probabilidade. 25% (vermelha) é apostar."',
      },
      {
        title: 'Projeção e expectativa',
        goal: 'Apresentar 2 cenários de contemplação: lance forte vs sorteio.',
        actions: [
          'Cenário 1: contemplado em 12 meses com lance forte.',
          'Cenário 2: contemplado em 36 meses por sorteio.',
          'Cliente escolhe qual cabe na vida dele.',
        ],
        script: '"Vou te dar 2 cenários: contemplação em 12 meses (lance forte) e contemplação em 36 meses (sorteio). Você escolhe qual cabe."',
      },
      {
        title: 'Narrativa de rediluição',
        goal: 'Mostrar visualmente o efeito do lance no saldo pós-contemplação.',
        actions: [
          'Gerar simulação com estratégia de contemplação ativa.',
          'Mostrar tabela "antes vs depois" da contemplação.',
          'Explicar que parcela cai porque o saldo foi abatido pelo lance.',
        ],
        script: '"Quando você for contemplado e usar o lance, sua parcela cai automaticamente — porque o lance abate parte do saldo e o sistema redistribui o restante."',
      },
    ],
    caseStudies: [
      {
        profile: 'Pedro, 35, ansioso, viu propaganda de "consórcio rápido".',
        situation: 'Quer ser contemplado em 6 meses no máximo. Tem R$ 80k para lance.',
        reasoning: 'Grupo tem mediana 28%, máx 42%. R$ 80k em carta R$ 250k = 32% (zona amarela alta). Tempo realista: 12-18 meses. Educar sobre probabilidade.',
        strategy: 'Lance livre 32% + embutido 15%. Apresentou cenários 12m vs 24m. Reforçou que sorteio é mensal e probabilístico.',
        outcome: 'Fechou ciente do timing realista. Contemplado no mês 14. Indicou 1 amigo.',
      },
      {
        profile: 'Sandra, 52, conservadora, sem urgência.',
        situation: 'Quer carta imobiliária para uso futuro (5+ anos). R$ 25k de reserva.',
        reasoning: 'Sem pressa = lance pequeno + sorteio é estratégia ótima. Lance grande compromete reserva sem ganho proporcional.',
        strategy: 'Lance embutido 25% + livre 5%. Apresentado tempo médio do grupo (28 meses) como cenário base.',
        outcome: 'Fechou tranquila. Cadência trimestral combinada — sem ansiedade.',
      },
    ],
    objections: [
      {
        objection: '"Conheço alguém contemplado em 3 meses!"',
        reframe: 'Cliente generaliza caso pontual.',
        response: 'Acontece, é estatístico — alguém precisa ser o primeiro do grupo. Mas planejamento consultivo é pelo realista, não pelo melhor caso. Te mostro o histórico real.',
      },
      {
        objection: '"Lance é jogado fora se eu não vencer?"',
        reframe: 'Confunde lance livre com lance embutido.',
        response: 'Em lance livre, o valor não vence: volta integralmente. Só sai do bolso quando você é contemplado. Lance embutido usa parte da própria carta — esse sim é "comprometido", mas não "jogado fora".',
      },
      {
        objection: '"E se a parcela aumentar muito após contemplação?"',
        reframe: 'Não entende rediluição.',
        response: 'O contrário: ela cai. O lance abate parte do saldo, e o sistema redistribui o restante sobre o prazo remanescente. Te mostro o gráfico antes/depois.',
      },
    ],
  },

  // ── Playbook 4: Operações Estruturadas ────────────────────────
  {
    id: 'trilha-op-estruturadas',
    title: 'Operações Estruturadas',
    description: 'Mini playbook para perfis patrimoniais — alavancagem, múltiplas cartas, venda de cota.',
    icon: Layers,
    audience: 'Consultor com lead investidor, empresário ou patrimonialista (capital ≥ R$ 300k).',
    prerequisites: ['trilha-iniciante', 'trilha-investimentos'],
    playbookSummary:
      'Aprender a propor estratégias avançadas: múltiplas cartas, alavancagem 2x, escalonamento de contemplações e venda de cota como liquidez. Sem isso, perfil patrimonial busca o concorrente.',
    outcomes: [
      'Identificar perfil patrimonial no Diagnóstico.',
      'Modelar alavancagem 2x no Comparador Cash.',
      'Propor escalonamento de cartas para frota/expansão.',
      'Calcular breakeven de venda de cota contemplada.',
    ],
    steps: [
      { articleId: 'op-estruturadas' },
      { articleId: 'investidor-patrimonial-aprofundado', note: 'Sequência correta evita perda de venda.' },
      { articleId: 'alavancagem-patrimonial',            note: 'Patrimônio exposto vs capital alocado.' },
      { articleId: 'comparador-cash' },
      { articleId: 'venda-cota',                          note: 'Liquidez consultiva.' },
      { articleId: 'nicho-investidor' },
      { articleId: 'nicho-empresario' },
    ],
    phases: [
      {
        title: 'Diagnóstico patrimonial',
        goal: 'Confirmar perfil, capital e horizonte antes de propor OE.',
        actions: [
          'Validar Diagnóstico com perfil "investidor" ou "empresário".',
          'Mapear capital líquido e quanto pode comprometer (mín R$ 300k).',
          'Confirmar horizonte (3-10 anos) e tolerância a parcela.',
        ],
        modules: ['diagnostic'],
      },
      {
        title: 'Modelagem de cenários',
        goal: 'Apresentar à vista vs alavancagem 2x vs financiamento.',
        actions: [
          'Comparador Cash com multiplicador 2x ativo.',
          'Investimento com 3 cenários (Conservador/Realista/Otimista).',
          'Comparador Financiamento (Price/SAC) para validar.',
        ],
        modules: ['comparator', 'investment', 'structuredOps'],
      },
      {
        title: 'Apresentação institucional',
        goal: 'Apresentar relatório impresso — peso visual importa para esse perfil.',
        actions: [
          'Gerar relatório personalizado de Op. Estruturadas.',
          'Imprimir / enviar PDF com assumptions explícitas.',
          'Marcar reunião presencial ou videocall para defender.',
        ],
        script: '"Te mando o relatório completo antes da nossa conversa. Você lê com calma, marca dúvidas, e na reunião defendemos cada número."',
        modules: ['structuredOps', 'pdf'],
      },
      {
        title: 'Fechamento patrimonial',
        goal: 'Fechar com cadência institucional para revisões periódicas.',
        actions: [
          'Definir revisão semestral (cliente patrimonial valoriza).',
          'Combinar próxima conversa em 18-24 meses para 2ª/3ª carta.',
          'Inserir em pipeline de relacionamento (não venda).',
        ],
      },
    ],
    caseStudies: [
      {
        profile: 'Eduardo, 48, empresário, fluxo R$ 80k/mês, quer expandir frota.',
        situation: 'Precisa de 3 caminhões em 18 meses. Capital R$ 600k disponível.',
        reasoning: '3 cartas escalonadas (mês 0, 4, 8) com lances diferentes para distribuir contemplações ao longo de 18 meses. Mantém capital de giro.',
        strategy: '3 cartas de R$ 350k cada. Lances: 1ª agressiva (40%), 2ª moderada (30%), 3ª conservadora (sorteio). Custo total 22% menor que financiamento BNDES sem subsídio.',
        outcome: 'Fechou as 3. Contemplações reais em 4, 11 e 19 meses. Indicou 2 PMEs do setor.',
      },
      {
        profile: 'Renata, 55, herdou R$ 800k, quer formar patrimônio para aposentadoria.',
        situation: 'Avaliava 1 imóvel à vista para alugar (yield ~5% a.a.).',
        reasoning: 'Alavancagem 2x: 2 cartas R$ 800k com R$ 400k de lance cada. Patrimônio exposto: R$ 1.6M. Valorização real (0,5% a.m.) sobre o dobro paga o custo do plano.',
        strategy: '2 cartas R$ 800k, lance livre 50% em cada. Cenário realista: patrimônio R$ 2.1M em 5 anos vs R$ 1.07M à vista.',
        outcome: 'Fechou as 2 cartas após 3 reuniões. Revisão patrimonial agendada a cada 6 meses.',
      },
    ],
    objections: [
      {
        objection: '"Por que 2 cartas se 1 já me serve?"',
        reframe: 'Pensa em uso, não em patrimônio.',
        response: 'Para uso, 1 basta. Para patrimônio, 2 expõem você ao dobro da valorização com o mesmo capital comprometido. Te mostro o cenário realista lado a lado.',
      },
      {
        objection: '"E se a valorização imobiliária não vier?"',
        reframe: 'Risco macro de longo prazo.',
        response: 'Por isso temos cenário Conservador: valorização 0,4% a.m., abaixo do CUB histórico. Mesmo nele, a alavancagem ainda compete com à vista.',
      },
      {
        objection: '"Prefiro financiar pelo BNDES."',
        reframe: 'Linha subsidiada compete bem.',
        response: 'Se você se enquadra em BNDES com subsídio, é forte. Sem subsídio, em prazo longo, consórcio costuma ganhar 15-25%. Vamos comparar CET total?',
      },
    ],
  },

  // ── Playbook 5: Carteira & Pós-venda ──────────────────────────
  {
    id: 'trilha-pos-venda',
    title: 'Carteira & Pós-venda',
    description: 'Mini playbook para sustentar receita previsível, gerar indicação e recompra.',
    icon: HeartHandshake,
    audience: 'Consultor que quer sair da venda transacional para base recorrente.',
    prerequisites: ['trilha-iniciante'],
    playbookSummary:
      'Aprender a operar Carteira como pipeline previsível e Pós-venda como motor de indicação/recompra. Cadência institucional com SLA por coluna, próxima ação obrigatória, gatilhos temporais no pós-venda.',
    outcomes: [
      'Manter Carteira sem leads parados além do SLA.',
      'Mover proposta sempre com próxima ação registrada.',
      'Gerar indicação como consequência de valor entregue.',
      'Identificar gatilhos de recompra (segunda carta).',
    ],
    steps: [
      { articleId: 'carteira',                     note: 'CRM sem cadência vira ruído.' },
      { articleId: 'previsao',                     note: 'Top 5 = 70% do esperado.' },
      { articleId: 'posvenda' },
      { articleId: 'relacionamento-consultivo',    note: 'Aniversário do plano = melhor gancho.' },
      { articleId: 'indicacao-recompra',           note: 'Indicação como consequência, não pedido.' },
    ],
    phases: [
      {
        title: 'Disciplina diária na Carteira',
        goal: 'Check matinal de 5 min, foco nos Top 5 e nos vermelhos de SLA.',
        actions: [
          'Abrir Carteira pela manhã, verificar previsão de vendas.',
          'Identificar leads no SLA vermelho (prospec >5d, agard >3d, aval >4d).',
          'Tocar nos Top 5 da previsão antes de qualquer outro.',
        ],
        modules: ['wallet'],
      },
      {
        title: 'Movimentação consultiva',
        goal: 'Mover lead apenas com próxima ação registrada.',
        actions: [
          'Toda movimentação ativa exige campo "próxima ação" preenchido.',
          'Próxima ação = data + canal + gancho específico (não "ligar").',
          'Se não há gancho real, manter na coluna até criar um.',
        ],
        script: '"No dia X eu te chamo com [decisão sobre cenário/dúvida específica]. Combinado?"',
      },
      {
        title: 'Pós-venda nos primeiros 90 dias',
        goal: 'Cadência mensal com gancho real.',
        actions: [
          '30d: confirmar boleto, tirar dúvidas iniciais.',
          '60d: enviar Estudo de Lances atualizado do grupo.',
          '90d: revisar estratégia de lance se cliente sinalizou interesse.',
        ],
        modules: ['postSale'],
      },
      {
        title: 'Aniversário e gatilhos de indicação',
        goal: 'Usar aniversário do plano como ancoragem natural de indicação.',
        actions: [
          'Mensagem de 1 ano com dados reais (FC acumulado, tempo até contemplação histórica).',
          'Após cliente sentir valor, perguntar abertamente sobre conhecidos no mesmo momento.',
          'Nunca pedir indicação sem antes entregar valor visível.',
        ],
        script: '"Hoje é 1 ano da sua entrada. FC acumulado: R$ X. Tempo até contemplação histórica do grupo: Y meses. Conhece alguém que está no momento que você estava ano passado?"',
      },
      {
        title: 'Recompra (segunda carta)',
        goal: 'Identificar e abordar clientes contemplados satisfeitos.',
        actions: [
          'Após 6 meses de uso da 1ª carta, abordar para 2ª.',
          'Pergunta aberta sobre novo objetivo, sem pitch.',
          'Se há interesse, rodar nova simulação no mesmo Diagnóstico.',
        ],
        script: '"Você está usando bem a carta. Já pensou em uma segunda — para [investimento/segundo imóvel/auto]?"',
      },
    ],
    caseStudies: [
      {
        profile: 'Lucas, consultor, 18 meses na plataforma, 47 clientes ativos.',
        situation: 'Carteira virou caos. 30% dos leads parados há 15+ dias. Previsão sem confiabilidade.',
        reasoning: 'Faltava disciplina de "próxima ação obrigatória". Implementou check matinal de 5 min focado em SLA vermelho e Top 5.',
        strategy: 'Em 30 dias zerou o backlog vermelho. Em 60 dias, previsão de vendas passou a refletir realidade. Conversão subiu 22%.',
        outcome: 'Pipeline previsível, ansiedade reduzida, fechamento dobrou no trimestre seguinte.',
      },
      {
        profile: 'Marcia, consultora, base de 80 clientes contemplados há 1+ ano.',
        situation: 'Não fazia pós-venda ativo. Indicações esporádicas, recompra zero.',
        reasoning: 'Implementou cadência de aniversário do plano + pergunta de indicação após valor entregue.',
        strategy: 'Disparou 80 mensagens personalizadas de aniversário em 30 dias. Resposta: 64% engajaram, 19% indicaram, 8% pediram 2ª carta.',
        outcome: '15 indicações qualificadas + 6 segundas cartas em 90 dias. Pipeline de 6 meses formado em 1 trimestre.',
      },
    ],
    objections: [
      {
        objection: '"Pós-venda é só pra cliente reclamar."',
        reframe: 'Visão reativa do pós-venda.',
        response: 'Pós-venda ativo é o oposto: você aparece em momentos chave (aniversário, contemplação aproximando, oportunidade). Cliente sente presença útil — gera indicação e recompra. Vendedor sem pós-venda perde 30-50% de receita potencial.',
      },
      {
        objection: '"Não tenho tempo para tantas conversas."',
        reframe: 'Confunde tempo com cadência institucional.',
        response: '5 min de Carteira pela manhã + 1 mensagem de aniversário por cliente/ano. É menos que parece e gera mais que vender lead frio.',
      },
      {
        objection: '"Já tentei pedir indicação e não funcionou."',
        reframe: 'Pediu antes de entregar valor.',
        response: 'Indicação é consequência, não pedido. Entregue valor primeiro (mensagem de aniversário com dados reais), depois pergunte abertamente. Conversão sobe 3-5x.',
      },
    ],
  },
];
