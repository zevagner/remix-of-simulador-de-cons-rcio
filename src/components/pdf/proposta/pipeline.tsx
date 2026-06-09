import React from 'react';
import type { PdfPropostaCompletaData } from './types';
import { hasComparisonData, hasStrategyData, hasBidsStudyData, hasStorytellingData } from './gates';
import { CoverPage } from './pages/CoverPage';
import { OpeningImpactPage } from './pages/OpeningImpactPage';
import { DiagnosticPage } from './pages/DiagnosticPage';
import { SimulationPage } from './pages/SimulationPage';
import { ComparisonFinancingPage, CashComparisonPage } from './pages/ComparisonPages';
import { StrategyBidPage, StrategyIncomePage, StrategySellPage } from './pages/StrategyPages';
import { BidsStudyPage, ContemplationPage, ArgumentsPage } from './pages/BidsStudyPages';
import { StorytellingPage } from './pages/StorytellingPage';
import { ObjectionsPage } from './pages/ObjectionsPage';
import { ClosingDecisionPage } from './pages/ClosingDecisionPage';
import { WealthThesisPage } from './pages/WealthThesisPage';
import { StructuredOpsPage } from './pages/StructuredOpsPage';
import { ArgumentsObjectionsPage } from './pages/ArgumentsObjectionsPage';

// ════════ PIPELINE: BLOCKS MAP → PAGES → FILTER → RENDER ════════
/**
 * MAPA ÚNICO DE BLOCOS — fonte de verdade para gating de páginas.
 * Os IDs aqui devem casar 1:1 com `PROPOSAL_BLOCKS` em `utils/proposalPdf/sections.ts`.
 *
 * REGRA INVIOLÁVEL:
 *   - Se o bloco NÃO está em `data.blocks` → a página NÃO existe.
 *   - Se o bloco está em `data.blocks` mas faltam dados → a página NÃO existe.
 *   - Capa e Fechamento são "chrome" do documento (não estão neste mapa).
 *
 * PROIBIDO: usar string literal de bloco fora deste mapa.
 */
export const BLOCKS = {
  diagnostic:     'diagnostic',
  simulation:     'simulation',
  cmp_financing:  'cmp-financing',
  cmp_cash:       'cmp-cash',
  strategy_bid:   'strategy-bid',
  strategy_income:'strategy-income',
  strategy_sell:  'strategy-sell',
  wealth_thesis:  'wealth-thesis',
  structured_ops: 'structured-ops',
  bids_study:     'bids-study',
  contemplation:  'contemplation',
  storytelling:   'storytelling',
  arguments:      'arguments',
  objections:     'objections',
} as const;

/**
 * Labels legíveis (orientados ao cliente) para o sumário/índice (TOC).
 * Chave = `id` da página no pipeline (NÃO o bloco), pois inclui ids
 * sintéticos como `arguments-objections`.
 */
export const TOC_LABELS: Record<string, string> = {
  opening: 'Resumo da proposta',
  diagnostic: 'Seu perfil e objetivo',
  simulation: 'Como funciona o consórcio',
  'cmp-financing': 'Comparativo com financiamento',
  'cmp-cash': 'Comparativo com compra à vista',
  'strategy-bid': 'Estratégia de lance',
  'strategy-income': 'Geração de renda com a carta',
  'strategy-sell': 'Venda da carta contemplada',
  'wealth-thesis': 'Estratégia patrimonial',
  'structured-ops': 'Operação multi-cartas',
  'bids-study': 'Histórico real de lances',
  contemplation: 'Análise de contemplação',
  storytelling: 'Visão de longo prazo',
  arguments: 'Por que seguir agora',
  objections: 'Dúvidas respondidas',
  'arguments-objections': 'Argumentos e dúvidas',
  closing: 'Próximo passo',
};

export type ProposalPageTemplate = {
  id: string;
  /** Mantido por compat com código legado; sempre true (filtragem é feita ANTES de criar o template). */
  hasContent: boolean;
  /** `totalPages` recebido do orquestrador para alimentar paginação X / Y nos Footers. */
  render: (totalPages?: number) => React.ReactNode;
};

/**
 * Predicados de DADOS REAIS por bloco.
 * REGRA INVIOLÁVEL: se o bloco está selecionado MAS não tem dado real,
 * a página NÃO é renderizada. Sem fallback genérico, sem texto vazio.
 *
 * Excepões controladas (sempre renderizam, com narrativa determinística):
 *  - diagnostic, simulation: base obrigatória — usam dados da simulação validada.
 *  - storytelling: usa cache OU narrativa default determinística (concreta).
 *  - arguments, objections: defaults consultivos válidos por padrão.
 */
function blockHasRealData(blockId: string, d: PdfPropostaCompletaData): boolean {
  switch (blockId) {
    case BLOCKS.diagnostic:
      return d.simulation.creditValue > 0;
    case BLOCKS.simulation:
      return d.simulation.creditValue > 0 && d.simulation.termMonths > 0;
    case BLOCKS.cmp_financing:
      return hasComparisonData(d, 'cmp-financing');
    case BLOCKS.cmp_cash:
      return hasComparisonData(d, 'cmp-cash');
    case BLOCKS.strategy_bid:
      return hasStrategyData(d, 'strategy-bid');
    case BLOCKS.strategy_income:
      return hasStrategyData(d, 'strategy-income');
    case BLOCKS.strategy_sell:
      return hasStrategyData(d, 'strategy-sell');
    case BLOCKS.wealth_thesis:
      // Gate relaxado (Core: bloco selecionado sempre renderiza).
      // WealthThesisPage usa MissingDataNote interna quando strategyId vazio.
      return true;
    case BLOCKS.structured_ops:
      // Gate relaxado (Core: bloco selecionado sempre renderiza).
      // StructuredOpsPage usa MissingDataNote interna quando não há cartas.
      return true;
    case BLOCKS.bids_study:
      // Estudo de histórico só faz sentido com GRUPO selecionado.
      // Sem grupo, a página vira apenas "AVISO" — descartamos do PDF.
      return !!(d.bidsStudy && d.bidsStudy.groupNumber && d.bidsStudy.groupNumber !== '');
    case BLOCKS.contemplation:
      // Probabilidade de contemplação depende do mesmo grupo do estudo de lances.
      return !!(d.bidsStudy && d.bidsStudy.groupNumber && d.bidsStudy.groupNumber !== '');

    case BLOCKS.storytelling:
      return hasStorytellingData(d);
    case BLOCKS.arguments:
      return true; // defaults consultivos sempre válidos
    case BLOCKS.objections:
      return true; // defaults consultivos sempre válidos
    default:
      return false;
  }
}

/**
 * Calcula quais blocos selecionados virão com dados parciais.
 * NÃO bloqueia renderização — apenas serve para a UI alertar o gerente
 * antes de gerar o PDF (ex.: "este bloco virá com fallback consultivo").
 */
export function getMissingDataBlocks(data: PdfPropostaCompletaData): string[] {
  return data.blocks
    .map((b) => b.id)
    .filter((id) => !blockHasRealData(id, data));
}

/**
 * buildProposalPages — pipeline 100% controlado por SELEÇÃO.
 *
 * REGRA: bloco selecionado SEMPRE renderiza. Páginas internas usam
 * `MissingDataNote` quando faltam dados — nunca página em branco, nunca
 * silêncio. Capa, abertura e fechamento são chrome (sempre presentes).
 */
export function buildProposalPages(data: PdfPropostaCompletaData): ProposalPageTemplate[] {
  const ids = data.blocks.map((b) => b.id);
  const has = (id: string) => ids.includes(id);

  /** Renderiza se o bloco está selecionado. Dados parciais são tratados na própria página. */
  const pageIf = (
    id: string,
    blockId: string,
    render: (totalPages?: number) => React.ReactNode,
  ): ProposalPageTemplate | null => {
    if (!has(blockId)) return null;
    return { id, hasContent: true, render };
  };


  const pages: Array<ProposalPageTemplate | null> = [
    { id: 'cover', hasContent: true, render: () => <CoverPage data={data} /> },

    ids.length > 0
      ? { id: 'opening', hasContent: true, render: (tp) => <OpeningImpactPage data={data} totalPages={tp} /> }
      : null,

    pageIf('diagnostic',      BLOCKS.diagnostic,      (tp) => <DiagnosticPage data={data} totalPages={tp} />),
    pageIf('simulation',      BLOCKS.simulation,      (tp) => <SimulationPage data={data} totalPages={tp} />),
    pageIf('cmp-financing',   BLOCKS.cmp_financing,   (tp) => <ComparisonFinancingPage data={data} totalPages={tp} />),
    pageIf('cmp-cash',        BLOCKS.cmp_cash,        (tp) => <CashComparisonPage data={data} totalPages={tp} />),
    pageIf('strategy-bid',    BLOCKS.strategy_bid,    (tp) => <StrategyBidPage data={data} totalPages={tp} />),
    pageIf('strategy-income', BLOCKS.strategy_income, (tp) => <StrategyIncomePage data={data} totalPages={tp} />),
    pageIf('strategy-sell',   BLOCKS.strategy_sell,   (tp) => <StrategySellPage data={data} totalPages={tp} />),
    pageIf('wealth-thesis',   BLOCKS.wealth_thesis,   (tp) => <WealthThesisPage data={data} totalPages={tp} />),
    pageIf('structured-ops',  BLOCKS.structured_ops,  (tp) => <StructuredOpsPage data={data} totalPages={tp} />),
    pageIf('bids-study',      BLOCKS.bids_study,      (tp) => <BidsStudyPage data={data} totalPages={tp} />),
    pageIf('contemplation',   BLOCKS.contemplation,   (tp) => <ContemplationPage data={data} totalPages={tp} />),
    pageIf('storytelling',    BLOCKS.storytelling,    (tp) => <StorytellingPage data={data} totalPages={tp} />),
    // ARGUMENTOS + OBJEÇÕES — combinados numa única página quando AMBOS
    // estão selecionados (somam ~180-210mm; cabem nos 255mm úteis da A4).
    // Caso apenas um esteja presente, fallback para a página standalone.
    has(BLOCKS.arguments) && has(BLOCKS.objections)
      ? { id: 'arguments-objections', hasContent: true, render: (tp) => <ArgumentsObjectionsPage data={data} totalPages={tp} /> }
      : null,
    has(BLOCKS.arguments) && !has(BLOCKS.objections)
      ? pageIf('arguments',  BLOCKS.arguments,  (tp) => <ArgumentsPage data={data} totalPages={tp} />)
      : null,
    !has(BLOCKS.arguments) && has(BLOCKS.objections)
      ? pageIf('objections', BLOCKS.objections, (tp) => <ObjectionsPage data={data} totalPages={tp} />)
      : null,

    { id: 'closing', hasContent: true, render: (tp) => <ClosingDecisionPage data={data} totalPages={tp} /> },
  ];

  return pages.filter((p): p is ProposalPageTemplate => p !== null);
}
