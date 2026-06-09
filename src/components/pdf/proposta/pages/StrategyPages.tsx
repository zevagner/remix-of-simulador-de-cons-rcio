import React from 'react';
import { formatCurrency } from '@/utils/format';
import { PdfBarChart } from '../../primitives';
import { strategyIntro } from '@/utils/proposalPdf/narrative';
import { THEME, PAGE, PAGE_COMPACT } from '../theme';
import {
  Header, Footer, FooterCompact, PageBody, PageBodyCompact, SectionTitle, MetricCard, MetricGrid,
  BigNumber, PdfTable, ChartCaption, MissingDataNote,
} from '../primitives';
import { buildNarrativeContext } from '../narrativeContext';
import type { PdfPropostaCompletaData } from '../types';

/**
 * Página ESTRATÉGIA DE LANCE — bloco `strategy-bid`. Apenas se houver `bidValue` real.
 */
export function StrategyBidPage({ data, totalPages }: { data: PdfPropostaCompletaData; totalPages?: number }) {
  const ctx = buildNarrativeContext(data);
  const s = data.strategy ?? {};
  const hasBid = !!(s.bidValue && s.bidValue > 0);
  return (
    <div style={PAGE_COMPACT}>
      <Header data={data} />
      <PageBodyCompact>
        <div>
          <SectionTitle kicker="Estratégia" title="O lance ideal para o seu perfil" />
          <p style={{ fontSize: '10.5pt', color: THEME.text, lineHeight: 1.6, margin: '12pt 0 12pt' }}>
            {strategyIntro(ctx)}
          </p>
          {hasBid ? (
            <MetricGrid cols={3}>
              <MetricCard label="Lance sugerido" value={formatCurrency(s.bidValue!)} tone="primary" />
              {s.bidPercent != null && <MetricCard label="% do crédito" value={`${s.bidPercent.toFixed(1)}%`} />}
              {s.contemplationMonth != null && <MetricCard label="Mês alvo" value={`${s.contemplationMonth}º`} />}
            </MetricGrid>
          ) : (
            <MissingDataNote>
              Defina um lance no Simulador para ver o valor exato e o mês-alvo. A estratégia em si — entrar com lance competitivo no momento certo — segue válida.
            </MissingDataNote>
          )}
          <p style={{ fontSize: '10.5pt', color: THEME.ink, lineHeight: 1.45, margin: '14pt 0 0', fontWeight: 700, fontStyle: 'italic' }}>
            Não é o mais rápido — é o mais inteligente para o seu perfil.
          </p>
        </div>
      </PageBodyCompact>
      <FooterCompact data={data} totalPages={totalPages} />
    </div>
  );
}

/**
 * Página GERAÇÃO DE RENDA — bloco `strategy-income`. Sempre renderiza, com fallback.
 */
export function StrategyIncomePage({ data, totalPages }: { data: PdfPropostaCompletaData; totalPages?: number }) {
  const income = data.strategy?.incomeMonthly;
  const inv = data.investment;
  const scenarios = inv?.scenarios ?? [];
  const bestId = inv?.bestStrategyId;
  const a = inv?.assumptions;

  return (
    <div style={PAGE}>
      <Header data={data} />
      <PageBody>
        <div>
          <SectionTitle kicker="Renda" title="Sua carta gerando renda mensal" />
          <p style={{ fontSize: '10.5pt', color: THEME.text, lineHeight: 1.6, margin: '12pt 0 14pt' }}>
            Após a contemplação, o imóvel adquirido pela carta pode gerar aluguel — convertendo
            patrimônio em fluxo mensal de caixa.
          </p>
          {income && income > 0 ? (
            <BigNumber label="Renda mensal estimada" value={formatCurrency(income)} tone="success" />
          ) : (
            <MissingDataNote>
              Para projetar o aluguel exato, abra o módulo Investimento — o cálculo é publicado automaticamente.
            </MissingDataNote>
          )}
        </div>

        {scenarios.length > 0 && (
          <div>
            <h3 style={{ fontSize: '12pt', fontWeight: 700, color: THEME.primary, margin: '0 0 8pt' }}>
              Comparação de estratégias possíveis
            </h3>
            <PdfBarChart
              title="Ganho absoluto por cenário (R$)"
              width={620}
              height={220}
              items={scenarios.map((sc) => ({
                label: sc.name.length > 14 ? sc.name.slice(0, 12) + '…' : sc.name,
                value: Math.max(sc.absoluteGain, 0),
                color: sc.id === bestId ? THEME.success : THEME.primary,
              }))}
            />
            <div style={{ marginTop: '12pt' }}>
              <PdfTable
                headers={['Cenário', 'Total pago', 'Resultado', 'Ganho R$', 'Ganho %']}
                align={['left', 'right', 'right', 'right', 'right']}
                rows={scenarios.map((sc) => [
                  sc.id === bestId ? `★ ${sc.name}` : sc.name,
                  formatCurrency(sc.totalPaid),
                  formatCurrency(sc.finalResult),
                  formatCurrency(sc.absoluteGain),
                  `${sc.percentGain.toFixed(1)}%`,
                ])}
              />
            </div>
            <ChartCaption>
              ★ cenário com melhor ganho absoluto na comparação. Cada linha usa o mesmo capital de partida.
            </ChartCaption>
          </div>
        )}

        {a && (
          <div>
            <h3 style={{ fontSize: '12pt', fontWeight: 700, color: THEME.primary, margin: '0 0 6pt' }}>
              Premissas usadas
            </h3>
            <PdfTable
              headers={['Premissa', 'Valor']}
              align={['left', 'right']}
              rows={[
                ['Valorização do imóvel (a.a.)', a.propertyAppreciation != null ? `${a.propertyAppreciation.toFixed(1)}%` : '—'],
                ['Rentabilidade investimento (a.a.)', a.investmentReturn != null ? `${a.investmentReturn.toFixed(1)}%` : '—'],
                ['Yield do aluguel (a.m.)', a.rentalYield != null ? `${a.rentalYield.toFixed(2)}%` : '—'],
                ['CDI considerado', a.cdiPercent != null ? `${a.cdiPercent}% do CDI` : '—'],
                ['Horizonte de análise', a.analysisMonths != null ? `${a.analysisMonths} meses` : '—'],
              ]}
            />
          </div>
        )}
      </PageBody>
      <Footer data={data} totalPages={totalPages} />
    </div>
  );
}

/**
 * Página VENDA DA CARTA — bloco `strategy-sell`. Sempre renderiza, com fallback.
 */
export function StrategySellPage({ data, totalPages }: { data: PdfPropostaCompletaData; totalPages?: number }) {
  const profit = data.strategy?.saleProfit;
  const inv = data.investment;
  const scen = inv?.scenarios?.find((s) => s.id === 'venda-cota' || /venda/i.test(s.name));
  return (
    <div style={PAGE_COMPACT}>
      <Header data={data} />
      <PageBodyCompact>
        <div>
          <SectionTitle kicker="Saída antecipada" title="Vender a carta contemplada" />
          <p style={{ fontSize: '10.5pt', color: THEME.text, lineHeight: 1.6, margin: '12pt 0 14pt' }}>
            A carta contemplada tem valor de mercado — pode ser vendida com ágio, recuperando o
            investido e ainda gerando lucro.
          </p>
          {profit && profit > 0 ? (
            <MetricGrid cols={3}>
              <MetricCard label="Ganho líquido" value={formatCurrency(profit)} tone="accent" />
              {scen && <MetricCard label="Total investido" value={formatCurrency(scen.totalPaid)} />}
              {scen && <MetricCard label="Recebido na venda" value={formatCurrency(scen.finalResult)} tone="primary" />}
            </MetricGrid>
          ) : (
            <MissingDataNote>
              Para projetar o ganho exato, simule o cenário "Venda da Carta" no Investimento. A estratégia de saída antecipada segue válida.
            </MissingDataNote>
          )}
          {scen && (
            <p style={{ fontSize: '9.5pt', color: THEME.muted, fontStyle: 'italic', marginTop: '10pt', lineHeight: 1.55 }}>
              Cenário "{scen.name}": retorno de <strong>{scen.percentGain.toFixed(1)}%</strong> sobre o capital aportado.
              {data.strategy?.contemplationMonth ? ` Janela alvo: mês ${data.strategy.contemplationMonth}.` : ''}
            </p>
          )}
        </div>
      </PageBodyCompact>
      <FooterCompact data={data} totalPages={totalPages} />
    </div>
  );
}
