// ─── Mapas de label (espelham OPTIONS do DiagnosticContext, sem importar UI) ───
export const OBJETIVO_LABELS: Record<string, { label: string; emoji: string; narrativa: string }> = {
  imovel_moradia:       { label: 'Imóvel para moradia',        emoji: '🏠', narrativa: 'conquistar o imóvel próprio para morar' },
  imovel_investimento:  { label: 'Imóvel para investimento',   emoji: '🏢', narrativa: 'usar o imóvel como ativo gerador de renda' },
  troca_imovel:         { label: 'Trocar de imóvel',           emoji: '🔄', narrativa: 'trocar o imóvel atual por um mais adequado ao momento' },
  veiculo:              { label: 'Veículo',                    emoji: '🚗', narrativa: 'adquirir o veículo certo sem comprometer o orçamento com juros' },
  troca_veiculo:        { label: 'Trocar de carro',            emoji: '🔁', narrativa: 'trocar o carro atual de forma planejada' },
  investimento:         { label: 'Investimento financeiro',    emoji: '📈', narrativa: 'construir patrimônio com disciplina e previsibilidade' },
  patrimonio_produtivo: { label: 'Estruturar patrimônio produtivo', emoji: '🌱', narrativa: 'transformar capital e ativos operacionais em patrimônio durável e transmissível' },
  expandir_operacao:    { label: 'Expandir operação',           emoji: '📈', narrativa: 'aumentar capacidade produtiva e ROI operacional via aquisição estruturada de ativos' },
  // Compat com enum legado (clientObjective)
  'comprar-imovel':     { label: 'Comprar imóvel',             emoji: '🏠', narrativa: 'conquistar o imóvel próprio' },
  'investir':           { label: 'Investir',                   emoji: '📈', narrativa: 'fazer o capital trabalhar de forma estruturada' },
  'trocar-imovel':      { label: 'Trocar de imóvel',           emoji: '🔄', narrativa: 'trocar o imóvel atual por um mais adequado' },
  'sair-aluguel':       { label: 'Sair do aluguel',            emoji: '🔑', narrativa: 'parar de pagar aluguel e construir patrimônio próprio' },
  'patrimonio':         { label: 'Construir patrimônio',       emoji: '🏛️', narrativa: 'estruturar patrimônio sólido para o longo prazo' },
  'negocio-pj':         { label: 'Negócio (PJ)',               emoji: '💼', narrativa: 'fortalecer a operação da empresa com previsibilidade de custo' },
};

export const PRIORIDADE_LABELS: Record<string, { label: string; emoji: string; descricao: string }> = {
  menor_parcela:    { label: 'Menor parcela',     emoji: '💸', descricao: 'Prioriza acessibilidade mensal — preserva fluxo de caixa do mês a mês.' },
  menor_custo:      { label: 'Menor custo total', emoji: '🧮', descricao: 'Prioriza eficiência financeira — paga o mínimo possível ao longo do contrato.' },
  rapidez:          { label: 'Rapidez',           emoji: '⚡', descricao: 'Quer resolver o quanto antes — estratégia de lance agressivo no início.' },
  manter_liquidez:  { label: 'Manter liquidez',   emoji: '💧', descricao: 'Prefere preservar capital disponível — não esvazia a reserva de emergência.' },
};

export const URGENCIA_LABELS: Record<string, { label: string; emoji: string; janela: string; estrategia: string }> = {
  imediato:     { label: 'Imediato',     emoji: '🔥', janela: 'Próximos 1-3 meses',     estrategia: 'foco em lance robusto na primeira janela viável' },
  curto_prazo:  { label: 'Curto prazo',  emoji: '⏱️', janela: '3-12 meses',              estrategia: 'lance calibrado pela média histórica do grupo' },
  sem_pressa:   { label: 'Sem pressa',   emoji: '🌱', janela: 'Mais de 12 meses',       estrategia: 'estratégia paciente, com foco em custo total mais baixo' },
  // Compat legado
  alta:         { label: 'Alta',         emoji: '🔥', janela: 'Próximos meses',         estrategia: 'foco em lance robusto na primeira janela viável' },
  media:        { label: 'Média',        emoji: '⏱️', janela: 'Médio prazo',             estrategia: 'lance calibrado pela média histórica do grupo' },
  baixa:        { label: 'Baixa',        emoji: '🌱', janela: 'Sem urgência declarada', estrategia: 'estratégia paciente, com foco em custo total mais baixo' },
};

export const SITUACAO_LABELS: Record<string, string> = {
  'pagando-aluguel':     'Hoje paga aluguel — todo mês envia recurso para o patrimônio de outra pessoa.',
  'tem-fgts':            'Possui FGTS disponível — recurso que pode ser usado como lance ou amortização.',
  'saindo-financiamento':'Já passou por financiamento — conhece de perto o peso dos juros bancários.',
  'pj-custo-alto':       'Operação PJ com custo alto — busca previsibilidade na composição do custo fixo.',
  'saldo-parado':        'Possui saldo parado em conta — capital sem trabalhar, perdendo poder de compra.',
  'primeiro-imovel':     'É o primeiro imóvel — momento de decisão estruturante na vida financeira.',
};
