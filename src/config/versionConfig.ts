export const APP_VERSION = "2.11.0";

export const LAST_ASSEMBLY_UPDATE = "08/04/2026";

export const NEW_FEATURES = [
  "Landing Page: Redesign completo v1.0.0 — visual profissional, copy orientada a benefício e mockup fiel",
  "Landing Page: Removidas todas as referências a marcas específicas e termos de cobrança",
  "Landing Page: FAQ atualizado com respostas sobre dados reais e suporte mobile",
  "Autenticação: limpeza de PII estendida para expiração natural de sessão",
  "Autenticação: verificação de aprovação a cada 5 minutos com desconexão automática",
];

export const VERSION_HISTORY = [
  {
    version: "2.11.0",
    date: "28/05/2026",
    features: [
      "Landing Page: Redesign completo v1.0.0 orientado a benefício para público interno",
      "Landing Page: Headline profissional respeitosa e mockup fiel ao simulador real",
      "Landing Page: Unificação visual com navy #003641 e remoção de referências a marcas e cobrança",
      "Landing Page: FAQ atualizado com perguntas reais de negócio e suporte mobile",
    ],
  },
  {
    version: "2.10.1",
    date: "27/05/2026",
    features: [
      "Autenticação: limpeza de PII do localStorage estendida para expiração natural de sessão (não apenas logout explícito)",
      "Autenticação: verificação periódica de aprovação a cada 5 minutos — bloqueio de admin desconecta usuário automaticamente",
      "Autenticação: documentação do fluxo de autenticação corrigida — acesso automático após confirmação de email @caixa.gov.br",
      "Autenticação: admin mantém controle de bloqueio manual via campo 'approved' no banco de dados",
    ],
  },
  {
    version: "2.10.0",
    date: "27/05/2026",
    features: [
      "Motor Financeiro: toggle Reajuste INPC migrado do gráfico para o card Dados do Consórcio",
      "Motor Financeiro: Reajuste INPC desabilitado por padrão — ativa apenas por clique explícito do usuário",
      "Motor Financeiro: quando ativado, input editável de percentual (default 4% a.a., min 0, max 15)",
      "Motor Financeiro: label corrigido de 'INCC/IPCA' para 'INPC' em toda a plataforma (UI, tooltips, PDF, narrativa IA)",
      "Motor Financeiro: info secundária 'Projeção consultiva' exibida quando o reajuste está ativo",
      "Motor Financeiro: propagação via SimulatorContext para todos os módulos — motor, Investimento, Comparador, PDF, Proposta, IA",
      "StructuredOps: aviso 'Valores nominais — sem projeção de reajuste INPC' adicionado abaixo do Resultado Consolidado",
      "Proposta e PDF: linha de aviso '⚠️ Simulação com projeção de reajuste INPC de X% a.a.' quando o reajuste está ativo",
      "Bug corrigido: restauração de sessão via localStorage não reativa o toggle de Reajuste INPC — sempre inicia desligado",
      "UI: box 'Estratégias' com título e ícone removido do card Dados do Consórcio",
      "UI: 4 opções em lista limpa separadas por linhas divisórias — Seguro Prestamista, Parcela Reduzida, Desconto Taxa, Reajuste INPC",
      "UI: nota de mútua exclusividade (Parcela Reduzida × Desconto Taxa) reposicionada abaixo dos itens correspondentes",
      "Menu Lateral: aba Análise expandida por padrão ao carregar a aplicação",
      "Menu Lateral: Op. Estruturadas reposicionado logo abaixo do Comparador na lista de submódulos de Análise",
      "Segurança: 3 warnings do scanner Lovable investigados e documentados como falsos positivos na Security Memory — analytics_events sem SELECT para usuários (write-only intencional), community_cases payload (PII nunca inserido, anonymize.ts + trigger como defesa em profundidade), proposal_events sem INSERT para usuários (log imutável via trigger SECURITY DEFINER, intencional)",
      "Login: visual atualizado com fundo navy #003641, card branco, botão navy e tipografia consistente com a plataforma",
    ],
  },
  {
    version: "2.9.0",
    date: "27/05/2026",
    features: [
      "Segurança & LGPD: generate-pdf com rate limit de 5 requisições/minuto/usuário — proteção contra abuse de billing Browserless e DoS",
      "Segurança & LGPD: account-purge com rate limit 3/hora/usuário",
      "Segurança & LGPD: data-export com rate limit 5/hora/usuário",
      "Segurança & LGPD: data-retention-purge com rate limit 2/hora/usuário",
      "Segurança & LGPD: Sentry com tracing desativado por padrão — só ativa com consentimento do usuário; captura de erros mantida como interesse legítimo",
      "Segurança & LGPD: ConsentBanner com frase explicativa sobre monitoramento de erros técnicos",
      "Segurança & LGPD: Dependabot configurado (.github/dependabot.yml) — PRs semanais automáticos apenas para atualizações de segurança",
      "Segurança & LGPD: exceljs migrado de prerelease (4.4.1-prerelease.0) para versão estável (4.4.0)",
      "Segurança & LGPD: robots.txt — /proposta, /app e /admin desindexados de mecanismos de busca",
      "Segurança & LGPD: extensões pg_trgm e pgcrypto movidas para schema dedicado extensions",
      "Segurança & LGPD: REVOKE EXECUTE FROM anon em 4 funções auth-only do banco",
      "Central de Ajuda: Prompt Mestre de Auditoria de Segurança & LGPD adicionado na Biblioteca Técnica",
      "Simulador: balão de descoberta do toggle R$/% corrigido — não é mais cortado pelo overflow do card (migrado para position fixed via getBoundingClientRect)",
    ],
  },
  {
    version: "2.3.0",
    date: "02/05/2026",
    features: [
      "Correção de inconsistência no comparador financeiro (consórcio vs financiamento)",
      "Unificação da fonte de cálculo entre tela e PDF (eliminação de duplicidade de lógica)",
      "Correção do custo efetivo no comparativo com 420 meses (incluindo lance e entrada)",
      "Ajuste no PDF do comparador para utilizar valores consolidados (effective cost)",
      "Integração de seleção dinâmica no PDF de investimentos (cenários e nichos estratégicos)",
    ],
  },
  {
    version: "1.0.0",
    date: "01/12/2024",
    features: [
      "Lançamento do Simulador de Consórcio",
      "Módulos: Simulador, Lances, Investimento, Comparador",
      "Central de Ajuda com glossário completo",
      "Impressão de relatórios formatados em A4",
    ],
  },
];

export const DATA_STATUS = {
  assembliesLastUpdate: LAST_ASSEMBLY_UPDATE,
  assembliesProcessed: true,
  assembliesNote: "Dados das assembleias atualizados conforme última importação.",
};
