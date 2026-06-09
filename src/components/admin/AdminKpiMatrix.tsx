/**
 * AdminKpiMatrix — Matriz visual de assinaturas de KPIs por estratégia
 * e regras de renderização condicional. Fonte única de auditoria para
 * as ondas de "KPI Strategic Relevance" (Investimentos · Patrimonial ·
 * Operações Estruturadas · Comparador).
 *
 * Consumer-only: lê SCENARIO_KPI_BLUEPRINT (investimento) e
 * PATRIMONIAL_STRATEGIES (patrimonial) sem duplicar definição.
 */
import { useMemo } from 'react';
import { Check, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { PATRIMONIAL_STRATEGIES, type PatrimonialKpiKind } from '@/components/modules/patrimonial/strategies';
import { AdminPageHeader } from './AdminPageHeader';

// ── KPIs canônicos institucionais ───────────────────────────────────
type KpiKind = 'roi' | 'tir' | 'payback' | 'multiplier' | 'preserved';

const KPI_LABEL: Record<KpiKind, string> = {
  roi: 'ROI',
  tir: 'TIR',
  payback: 'Payback',
  multiplier: 'Multiplicador',
  preserved: 'Capital Preservado',
};

const KPI_DESC: Record<KpiKind, string> = {
  roi: 'Retorno consolidado sobre aporte total.',
  tir: 'Taxa interna de retorno (anualizada).',
  payback: 'Meses até equilíbrio de fluxo.',
  multiplier: 'Patrimônio controlado ÷ capital próprio.',
  preserved: 'Caixa que não precisou ser desembolsado.',
};

const KPI_ORDER: KpiKind[] = ['roi', 'tir', 'payback', 'multiplier', 'preserved'];

// ── Investimento (espelha SCENARIO_KPI_BLUEPRINT, com label exibida) ─
interface ScenarioRow {
  id: string;
  label: string;
  primary: KpiKind;
  secondary: KpiKind[];
  thesis: string;
  removed: string;
}

const INVESTMENT_ROWS: ScenarioRow[] = [
  {
    id: 'investment',
    label: 'Aplicação Financeira',
    primary: 'roi',
    secondary: ['tir', 'multiplier'],
    thesis: 'Carta como veículo de aplicação — capital em caixa.',
    removed: 'Payback (sem ativo) · Preservado (todo capital fica em caixa)',
  },
  {
    id: 'traditional',
    label: 'Aquisição Tradicional',
    primary: 'multiplier',
    secondary: [],
    thesis: 'Imóvel para usar/valorizar — vivência longa.',
    removed: 'ROI/TIR (sem fluxo) · Payback (vivência) · Preservado (sem lance)',
  },
  {
    id: 'sale',
    label: 'Venda da Cota',
    primary: 'payback',
    secondary: ['roi'],
    thesis: 'Liquidez rápida via venda da cota contemplada.',
    removed: 'TIR · Multiplicador · Preservado (horizonte curto)',
  },
  {
    id: 'rental',
    label: 'Aluguel',
    primary: 'payback',
    secondary: ['multiplier'],
    thesis: 'Renda recorrente paga parcela.',
    removed: 'Preservado (sem lance) · ROI/TIR (renda mensal já narra)',
  },
  {
    id: 'quick-contemplation',
    label: 'Contemplação Antecipada',
    primary: 'roi',
    secondary: ['preserved'],
    thesis: 'Antecipar contemplação via lance.',
    removed: 'TIR · Payback · Multiplicador (foco "valeu o lance?")',
  },
  {
    id: 'previdencia-turbinada',
    label: 'Previdência Turbinada',
    primary: 'multiplier',
    secondary: ['roi'],
    thesis: 'Multiplicação de longo prazo.',
    removed: 'TIR · Payback · Preservado',
  },
];

// ── Regras de renderização condicional ─────────────────────────────
interface Rule {
  scope: string;
  rule: string;
  source: string;
}

const RENDER_RULES: Rule[] = [
  {
    scope: 'Capital Preservado',
    rule: 'Suprimido quando preservedCapital ≤ 0 em qualquer card de cenário.',
    source: 'ExecutiveKpiStrip · PatrimonialKpiBar',
  },
  {
    scope: 'Cards Investimento',
    rule: 'Grid rebalanceia 4↔5 colunas conforme KPIs visíveis (sem coluna fantasma).',
    source: 'ExecutiveKpiStrip',
  },
  {
    scope: 'Patrimonial · Multiplicação de Ativos',
    rule: 'Único caso com 3 KPIs (multiplier · preserved · TIR) — assinatura da tese de alavancagem.',
    source: 'PATRIMONIAL_STRATEGIES',
  },
  {
    scope: 'Operações Estruturadas',
    rule: '"Lance Total" e bloco de composição ocultos quando totalBid ≤ 0.',
    source: 'StructuredOpsConsolidated',
  },
  {
    scope: 'Operações Estruturadas',
    rule: '"Parcela Pós-Contemplação" oculta quando |Δ| < 0,01 vs parcela inicial.',
    source: 'StructuredOpsConsolidated',
  },
  {
    scope: 'Operações Estruturadas',
    rule: '"Crédito Disponível" só renderiza com lance embutido > 0.',
    source: 'StructuredOpsConsolidated',
  },
  {
    scope: 'Comparador (vs Consórcio)',
    rule: 'Veredito vira "Custo equivalente" quando |Δ| < R$ 1,00.',
    source: 'ConsortiumComparisonTab',
  },
  {
    scope: 'Comparador (vs Financiamento)',
    rule: 'Diferença PRICE/SAC oculta quando entrada cobre 100% do bem.',
    source: 'FinancingComparisonTab',
  },
  {
    scope: 'Comparador (vs Financiamento)',
    rule: 'Bloco "420 meses" oculto se termMonths === 420 (evita duplicação).',
    source: 'FinancingComparisonTab',
  },
];

function KpiCell({ active, kind, primary }: { active: boolean; kind: KpiKind; primary?: boolean }) {
  if (!active) return <Minus className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" aria-label="ausente" />;
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center mx-auto rounded-full h-5 w-5',
        primary ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary'
      )}
      aria-label={primary ? 'KPI primary' : 'KPI secondary'}
      title={primary ? 'Primary (hero)' : 'Secondary (apoio)'}
    >
      <Check className="h-3 w-3" />
    </span>
  );
}

function MatrixTable<T extends { id: string; label: string }>({
  rows, getKpis, getThesis, getRemoved,
}: {
  rows: T[];
  getKpis: (r: T) => { primary?: KpiKind; secondary: KpiKind[]; all?: KpiKind[] };
  getThesis?: (r: T) => string;
  getRemoved?: (r: T) => string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className="text-left font-semibold px-3 py-2 sticky left-0 bg-muted/40">Estratégia</th>
            {KPI_ORDER.map(k => (
              <th key={k} className="font-semibold px-2 py-2 text-center" title={KPI_DESC[k]}>
                {KPI_LABEL[k]}
              </th>
            ))}
            {getThesis && <th className="text-left font-semibold px-3 py-2">Tese</th>}
            {getRemoved && <th className="text-left font-semibold px-3 py-2">Removidos</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const k = getKpis(r);
            const isPrimary = (kind: KpiKind) => k.primary === kind;
            const isSecondary = (kind: KpiKind) => k.secondary.includes(kind);
            const isAny = (kind: KpiKind) =>
              isPrimary(kind) || isSecondary(kind) || (k.all?.includes(kind) ?? false);
            return (
              <tr key={r.id} className={cn(i % 2 === 0 ? 'bg-background' : 'bg-muted/10')}>
                <td className="px-3 py-2 font-medium sticky left-0 bg-inherit whitespace-nowrap">{r.label}</td>
                {KPI_ORDER.map(kind => (
                  <td key={kind} className="px-2 py-2 text-center">
                    <KpiCell active={isAny(kind)} kind={kind} primary={isPrimary(kind)} />
                  </td>
                ))}
                {getThesis && <td className="px-3 py-2 text-muted-foreground leading-snug max-w-[260px]">{getThesis(r)}</td>}
                {getRemoved && <td className="px-3 py-2 text-muted-foreground leading-snug max-w-[280px]">{getRemoved(r)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Patrimonial: deriva linhas a partir do source-of-truth ──────────
interface PatrimonialDerivedRow {
  id: string;
  label: string;
  kpis: PatrimonialKpiKind[];
}

export default function AdminKpiMatrix() {
  const patrimonialRows: PatrimonialDerivedRow[] = useMemo(
    () => PATRIMONIAL_STRATEGIES.map(s => ({ id: s.id, label: s.title, kpis: s.kpis })),
    []
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Matriz de KPIs por Estratégia"
        subtitle="Auditoria visual das assinaturas de KPIs e regras de renderização condicional"
      />
      <div className="flex flex-wrap items-center gap-3 text-caption text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-primary" /> Primary (hero)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-primary/15 ring-1 ring-primary/30" /> Secondary (apoio)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Minus className="h-3 w-3" /> Não exibido
        </span>
      </div>

      {/* Investimentos */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Investimentos · Cenários</h2>
          <Badge variant="outline" className="text-caption">SCENARIO_KPI_BLUEPRINT</Badge>
        </div>
        <MatrixTable
          rows={INVESTMENT_ROWS}
          getKpis={(r) => ({ primary: r.primary, secondary: r.secondary })}
          getThesis={(r) => r.thesis}
          getRemoved={(r) => r.removed}
        />
      </section>

      {/* Patrimonial */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Engenharia Patrimonial · Estratégias</h2>
          <Badge variant="outline" className="text-caption">PATRIMONIAL_STRATEGIES</Badge>
        </div>
        <MatrixTable
          rows={patrimonialRows}
          getKpis={(r) => ({ secondary: [], all: r.kpis as KpiKind[] })}
        />
        <p className="text-caption text-muted-foreground flex items-start gap-1.5">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          Patrimonial não distingue primary/secondary — todos os KPIs do card são protagonistas.
          Máximo de 3 (apenas "Multiplicação de Ativos"); demais usam 2.
        </p>
      </section>

      {/* Regras de renderização */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Regras de Renderização Condicional</h2>
          <Badge variant="outline" className="text-caption">{RENDER_RULES.length} regras ativas</Badge>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-3 py-2">Escopo</th>
                <th className="text-left font-semibold px-3 py-2">Regra</th>
                <th className="text-left font-semibold px-3 py-2">Fonte</th>
              </tr>
            </thead>
            <tbody>
              {RENDER_RULES.map((r, i) => (
                <tr key={i} className={cn(i % 2 === 0 ? 'bg-background' : 'bg-muted/10')}>
                  <td className="px-3 py-2 font-medium whitespace-nowrap">{r.scope}</td>
                  <td className="px-3 py-2 text-muted-foreground leading-snug">{r.rule}</td>
                  <td className="px-3 py-2 font-mono text-caption text-muted-foreground whitespace-nowrap">{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="text-caption text-muted-foreground border-t border-border pt-3">
        Esta matriz é o ponto de auditoria único para as ondas de "KPI Strategic Relevance".
        Para alterar uma assinatura, edite o blueprint correspondente no código —
        <code className="font-mono mx-1">src/components/modules/investment/scenarioExecutiveKpis.ts</code>
        ou <code className="font-mono">src/components/modules/patrimonial/strategies.ts</code>.
      </footer>
    </div>
  );
}
