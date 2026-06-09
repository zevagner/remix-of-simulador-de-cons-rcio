/**
 * Help Center — Institutional Expansion Wave
 * ════════════════════════════════════════════════════════════════
 *
 * Camada educacional viva da plataforma. NÃO é manual de telas —
 * é consultoria guiada, onboarding vivo, treinamento contínuo e
 * enablement comercial.
 *
 * Estrutura institucional:
 *   • categories        → áreas de conhecimento (Primeiros Passos,
 *                         Simulador, Plataforma Patrimonial · Edição
 *                         Consultiva — capítulos Investimento Patrimonial
 *                         e Operações Estruturadas — Compare Workspace,
 *                         Nichos, Comunidade, Governança & Segurança)
 *   • articles          → artigo com resumo executivo + blocos
 *                         consultivos (quando usar / quando NÃO usar /
 *                         perfil ideal / erro comum / como explicar)
 *   • trails            → trilhas de aprendizado (sequências curadas)
 *   • glossary          → terminologia institucional
 *   • probabilityTable  → zonas de contemplação
 *   • practicalTips     → dicas rápidas (preservado)
 *
 * Princípio: governança → ajuda → IA → PDF → simulador falam a
 * MESMA língua institucional. Regras numéricas vivem em
 * src/config/businessRules.ts (não duplicar aqui).
 */
import {
  Calculator, GitCompare, PiggyBank, Layers, BarChart3,
  Workflow, Bot, Target, MessageSquare,
  Kanban, ShieldCheck, Sparkles, RefreshCw, Trophy,
  Users, HeartHandshake, CheckCircle2, Wallet, FileText, Settings2,
  Compass, Briefcase, Brain, Award, type LucideIcon,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────

// `ConsultiveBlockKind` e `consultiveBlockMeta` vivem em
// `helpContent.meta.ts` (split bundle — Wave Bundle Lazy Split).
// Reexportados aqui para preservar compat de imports legados.
export { type ConsultiveBlockKind, consultiveBlockMeta } from './helpContent.meta';
import type { ConsultiveBlockKind } from './helpContent.meta';

export interface ConsultiveBlock {
  kind: ConsultiveBlockKind;
  title?: string;
  body: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  /** Resumo executivo: o que resolve, em 1-2 frases. */
  executiveSummary: string;
  /** "Para quem serve" — perfil de consultor / contexto. */
  forWho?: string;
  /** "Quando usar" — gatilho de leitura. */
  whenToUse?: string;
  /** Explicação simples (2-4 parágrafos curtos). */
  explanation: string;
  /** Blocos consultivos curados (ordem importa). */
  blocks?: ConsultiveBlock[];
  /** IDs de artigos relacionados. */
  related?: string[];
  /** IDs de módulos relacionados (rotas internas). */
  modules?: string[];
  /** Última revisão institucional. */
  updatedAt?: string;
}

export interface HelpCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  /** Subtítulo institucional curto (≤ 8 palavras). */
  subtitle: string;
  /** Resumo executivo da categoria. */
  executiveSummary: string;
  badge?: string;
  articles: HelpArticle[];
}

/**
 * Mini playbook consultivo. Uma trilha não é mais lista de artigos —
 * é um roteiro vivo de como pensar consultivamente em um eixo.
 */
export interface PlaybookPhase {
  /** Fase do raciocínio: descoberta, diagnóstico, explicação, objeção, fechamento. */
  title: string;
  /** O que o consultor precisa alcançar nesta fase. */
  goal: string;
  /** Ações concretas (3-5 itens). */
  actions: string[];
  /** Script narrativo opcional (frase pronta, adaptável). */
  script?: string;
  /** Módulos do sistema a usar nesta fase. */
  modules?: string[];
}

export interface PlaybookCase {
  /** Perfil do cliente (1 frase). */
  profile: string;
  /** Situação concreta. */
  situation: string;
  /** Raciocínio consultivo aplicado. */
  reasoning: string;
  /** Estratégia escolhida e por quê. */
  strategy: string;
  /** Resultado / desfecho institucional. */
  outcome: string;
}

export interface PlaybookObjection {
  /** Frase típica do cliente. */
  objection: string;
  /** Reframe consultivo (mudança de ângulo). */
  reframe: string;
  /** Resposta sugerida — clara, sem promessa de garantia. */
  response: string;
}

export interface HelpTrail {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Sequência ordenada de articleIds (leitura recomendada). */
  steps: { articleId: string; note?: string }[];
  /** Para quem é esta trilha (perfil de consultor / contexto). */
  audience?: string;
  /** O que o consultor saberá ao concluir (3-5 outcomes). */
  outcomes?: string[];
  /** Pré-requisitos opcionais (trilhas / conhecimento prévio). */
  prerequisites?: string[];
  /** Resumo executivo do playbook. */
  playbookSummary?: string;
  /** Fases consultivas — o "como pensar". */
  phases?: PlaybookPhase[];
  /** Casos práticos reais. */
  caseStudies?: PlaybookCase[];
  /** Objeções típicas com reframe + resposta. */
  objections?: PlaybookObjection[];
}

// ─────────────────────────────────────────────────────────────────
// Categorias institucionais
// ─────────────────────────────────────────────────────────────────

import { categories, trails } from './help';
export { categories, trails };


// ─────────────────────────────────────────────────────────────────
// Compatibilidade — exports legados (sections) derivados das categorias
// para não quebrar consumidores existentes (busca legada, testes).
// ─────────────────────────────────────────────────────────────────

export interface HelpSection {
  id: string;
  title: string;
  icon: LucideIcon;
  badge?: string;
  items: { subtitle: string; body: string }[];
}

export const sections: HelpSection[] = categories.map((c) => ({
  id: c.id,
  title: c.title,
  icon: c.icon,
  badge: c.badge,
  items: c.articles.map((a) => ({
    subtitle: a.title,
    body: `${a.executiveSummary}\n\n${a.explanation}`,
  })),
}));

// ─────────────────────────────────────────────────────────────────
// Tips, glossary, probabilityTable (preservados/expandidos)
// ─────────────────────────────────────────────────────────────────

export const practicalTips = [
  { emoji: '🩺', tip: 'Comece sempre pelo Diagnóstico — ele personaliza simulação, abordagem e proposta.' },
  { emoji: '🎯', tip: 'Apresente sempre 2-3 cenários no Comparador. Cliente decide com clareza, você ganha confiança.' },
  { emoji: '⚖️', tip: 'Custo real do cliente = base única de comparação (consórcio, financiamento, à vista).' },
  { emoji: '📄', tip: 'O PDF não recalcula nada: o que está na tela é o que sai no documento.' },
  { emoji: '🧮', tip: 'A simulação é mês a mês — não usa média. Defenda isso quando o cliente questionar.' },
  { emoji: '🛡️', tip: 'Seguro decrescente: cai com o saldo. Use isso como argumento de proteção real.' },
  { emoji: '📈', tip: 'Ative INPC para clientes analíticos. Ignorar subestima a carta no longo prazo.' },
  { emoji: '🏆', tip: 'Confira Melhores Grupos para Lance antes de indicar grupo. Mediana > sorte.' },
  { emoji: '🤖', tip: 'Diagnóstico completo = melhores sugestões da IA. Vale 5 min a mais.' },
  { emoji: '🔗', tip: 'Envie o link visual (6 blocos) para clientes que preferem ver a ler.' },
  { emoji: '💬', tip: 'Comunidade é treino comercial. Responder casos te faz vender melhor.' },
  { emoji: '🔒', tip: 'Anonimização é automática. Compartilhe casos com tranquilidade.' },
  { emoji: '📊', tip: 'Carteira diária — 5 min de manhã decidem o dia. Top 5 = 70% do resultado.' },
  { emoji: '💎', tip: 'Pós-venda gera 30-50% da receita futura (indicação + recompra). Não é opcional.' },
];

export const glossary = [
  { term: 'Carta de crédito', definition: 'Documento que dá ao contemplado o poder de compra equivalente ao valor do crédito contratado.' },
  { term: 'Cota', definition: 'Participação individual do consorciado dentro de um grupo de consórcio.' },
  { term: 'Assembleia', definition: 'Reunião periódica do grupo onde ocorrem sorteios e apuração de lances para contemplação.' },
  { term: 'Contemplação', definition: 'Momento em que o consorciado recebe o direito de utilizar a carta de crédito (por sorteio ou lance).' },
  { term: 'Saldo devedor', definition: 'Valor que ainda falta pagar no plano. Diminui a cada parcela e é recalculado mês a mês.' },
  { term: 'Lance livre', definition: 'Oferta de recursos próprios para antecipar a contemplação, sem limite predeterminado.' },
  { term: 'Lance fixo', definition: 'Percentual de lance definido pela administradora, igual para todos os participantes.' },
  { term: 'Lance embutido', definition: 'Lance feito com parte do próprio crédito da carta. Limites: imobiliário 50%, auto/pesados 30%.' },
  { term: 'Taxa de administração', definition: 'Remuneração da administradora pelo gerenciamento do grupo, diluída ao longo do plano.' },
  { term: 'Fundo de reserva', definition: 'Percentual mensal destinado a cobrir inadimplência e despesas extraordinárias do grupo.' },
  { term: 'Seguro prestamista', definition: 'Seguro que quita o saldo devedor em caso de morte ou invalidez. Recalculado mensalmente.' },
  { term: 'Parcela reduzida', definition: 'Modalidade que aplica fator 0,7 sobre a parcela cheia em um período inicial.' },
  { term: 'Rediluição', definition: 'Recálculo do plano após contemplação com lance: o saldo é redistribuído sobre o prazo restante.' },
  { term: 'INPC', definition: 'Índice Nacional de Preços ao Consumidor — usado como projeção consultiva de reajuste anual da carta.' },
  { term: 'Reajuste anual', definition: 'Correção do crédito, da taxa de administração e do fundo de reserva no aniversário do plano.' },
  { term: 'Alienação', definition: 'Garantia em que o bem fica vinculado ao credor até a quitação total.' },
  { term: 'Deságio', definition: 'Desconto sobre o valor de face de uma cota contemplada quando vendida a terceiros.' },
  { term: 'Yield', definition: 'Rentabilidade anual de um imóvel para locação: (aluguel mensal × 12) ÷ valor do imóvel.' },
  { term: 'CDI', definition: 'Taxa de referência para investimentos de renda fixa.' },
  { term: 'CET', definition: 'Custo Efetivo Total — soma todos os encargos de um financiamento como taxa anual.' },
  { term: 'SAC', definition: 'Sistema de Amortização Constante — amortização fixa, parcelas decrescentes.' },
  { term: 'PRICE', definition: 'Tabela Price — parcelas fixas, amortização crescente, juros decrescentes.' },
  { term: 'Equivalência composta', definition: 'Conversão correta de taxa anual para mensal: (1+i)^(1/12) − 1. Nunca i/12.' },
  { term: 'Custo real do cliente', definition: 'Base única de comparação: tudo que sai do bolso (parcelas + lance/entrada).' },
  { term: 'Diagnóstico', definition: 'Wizard de 5 etapas que captura perfil do cliente e personaliza todo o sistema.' },
  { term: 'Análise (módulo)', definition: 'Hub com 5 abas: Investimento, Comparador, Estudo de Lances, Op. Estruturadas e Assembleias.' },
  { term: 'Cockpit', definition: 'Hub de leitura institucional. Indica, não calcula. Check matinal de prioridades.' },
  { term: 'Carteira', definition: 'CRM leve em Kanban. Cadência institucional com SLA por coluna.' },
  { term: 'Score do cliente', definition: 'Pontuação 0-100 — quente, morno, frio. Calculado no scoring canônico.' },
  { term: 'Cadência', definition: 'Ritmo de follow-up monitorado pelo sistema, com SLA por coluna.' },
  { term: 'Previsão de vendas', definition: 'Receita esperada da carteira: probabilidade por etapa × valor da proposta.' },
  { term: 'Pós-venda', definition: 'Acompanhamento após contratação para indicação, recompra e relacionamento.' },
  { term: 'Comunidade', definition: 'Espaço de troca anonimizada entre consultores, com foco em estratégia.' },
  { term: 'Score de engajamento', definition: 'Pontuação por uso real do sistema. Destrava funcionalidades.' },
  { term: 'Storytelling', definition: 'Narrativas reais de clientes usadas como conexão emocional na venda.' },
  { term: 'Gatilho mental', definition: 'Princípio de persuasão (urgência, escassez, prova social, autoridade).' },
  { term: 'Engine canônica', definition: 'Fonte única de matemática financeira em @/core/finance. Nunca duplicar.' },
  { term: 'Drift institucional', definition: 'Quando tela, PDF, IA e governança divergem. A plataforma combate isso por design.' },
];

export const probabilityTable = [
  { color: 'bg-zone-conservadora', label: 'Verde', zone: 'Conservadora', meaning: 'Lance acima do máximo histórico — maior previsibilidade de contemplação.' },
  { color: 'bg-zone-equilibrada', label: 'Amarelo', zone: 'Equilibrada', meaning: 'Lance entre a média e o máximo histórico — chance moderada.' },
  { color: 'bg-zone-agressiva', label: 'Vermelho', zone: 'Agressiva', meaning: 'Lance abaixo da média histórica — menor chance, maior risco.' },
];

// ─────────────────────────────────────────────────────────────────
// Rótulos visuais para blocos consultivos
// ─────────────────────────────────────────────────────────────────

// `consultiveBlockMeta` está em `helpContent.meta.ts` (reexportado no topo
// deste arquivo). Mantido como split de bundle.

// Lookup auxiliar para related/trilhas
export const articleById: Record<string, { article: HelpArticle; categoryId: string; categoryTitle: string }> = (() => {
  const map: Record<string, { article: HelpArticle; categoryId: string; categoryTitle: string }> = {};
  for (const c of categories) {
    for (const a of c.articles) {
      map[a.id] = { article: a, categoryId: c.id, categoryTitle: c.title };
    }
  }
  return map;
})();
