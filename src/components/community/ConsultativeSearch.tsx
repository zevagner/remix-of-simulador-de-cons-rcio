/**
 * ConsultativeSearch — Onda 3 / busca consultiva com filtros inteligentes.
 * Filtros: nicho (tipo), etapa, outcome, resolvidos, sem resposta.
 */
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, MessageSquare, CheckCircle2, Eye, Loader2, X } from 'lucide-react';
import { searchCases, type SearchResult, OUTCOME_KIND_LABEL, type OutcomeKind } from '@/services/community';
import { cn } from '@/lib/utils';

const TYPES: Array<{ id: string; label: string }> = [
  { id: 'imobiliario', label: 'Imóveis' },
  { id: 'auto', label: 'Auto' },
  { id: 'pesados', label: 'Pesados' },
  { id: 'agro', label: 'Agro' },
  { id: 'energia_solar', label: 'Solar' },
];

// Stages reais gravados em community_cases:
// - manual (OpenCaseDialog): cliente_proposta, duvida_operacional, estrategia, objecao, grupos_lances, outro
// - origem proposta/pós-venda/simulação: proposta, pos_venda, simulacao
const STAGES: Array<{ id: string; label: string }> = [
  { id: 'cliente_proposta', label: 'Cliente / proposta' },
  { id: 'objecao', label: 'Objeção' },
  { id: 'estrategia', label: 'Estratégia' },
  { id: 'grupos_lances', label: 'Grupos / lances' },
  { id: 'duvida_operacional', label: 'Dúvida operacional' },
  { id: 'proposta', label: 'Da Carteira' },
  { id: 'simulacao', label: 'Do Simulador' },
  { id: 'pos_venda', label: 'Pós-venda' },
];

interface Props {
  onOpen: (caseId: string) => void;
}

export function ConsultativeSearch({ onOpen }: Props) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [outcomeKind, setOutcomeKind] = useState<OutcomeKind | null>(null);
  const [onlyResolved, setOnlyResolved] = useState(false);
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);
  const [items, setItems] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const data = await searchCases({
        query: query.trim() || undefined,
        consortiumType: type,
        stage,
        outcomeKind,
        onlyResolved,
        onlyUnanswered,
        limit: 30,
      });
      if (!cancel) { setItems(data); setLoading(false); }
    }, 250);
    return () => { cancel = true; clearTimeout(t); };
  }, [query, type, stage, outcomeKind, onlyResolved, onlyUnanswered]);

  const hasFilter = !!(type || stage || outcomeKind || onlyResolved || onlyUnanswered);

  return (
    <Card className="p-3 sm:p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Busca consultiva</span>
        <span className="text-caption text-muted-foreground hidden sm:inline">
          procure por estratégia, objeção, nicho ou desfecho
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Ex.: "lance dobrado", "loteria", "imóvel 400k", "venda da cota"…'
          className="pl-9 h-9 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-caption uppercase text-muted-foreground mr-1">Nicho</span>
          {TYPES.map((t) => (
            <FilterChip key={t.id} active={type === t.id} onClick={() => setType(type === t.id ? null : t.id)}>
              {t.label}
            </FilterChip>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-caption uppercase text-muted-foreground mr-1">Etapa</span>
          {STAGES.map((s) => (
            <FilterChip key={s.id} active={stage === s.id} onClick={() => setStage(stage === s.id ? null : s.id)}>
              {s.label}
            </FilterChip>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-caption uppercase text-muted-foreground mr-1">Desfecho</span>
          <FilterChip active={outcomeKind === 'aplicou_funcionou'} onClick={() => setOutcomeKind(outcomeKind === 'aplicou_funcionou' ? null : 'aplicou_funcionou')}>
            Funcionou
          </FilterChip>
          <FilterChip active={onlyResolved} onClick={() => setOnlyResolved((v) => !v)}>Resolvidos</FilterChip>
          <FilterChip active={onlyUnanswered} onClick={() => setOnlyUnanswered((v) => !v)}>Sem resposta</FilterChip>
          {hasFilter && (
            <button
              onClick={() => { setType(null); setStage(null); setOutcomeKind(null); setOnlyResolved(false); setOnlyUnanswered(false); }}
              className="text-caption text-muted-foreground hover:text-foreground inline-flex items-center gap-1 ml-auto"
            >
              <X className="h-3 w-3" /> limpar
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        {loading && (
          <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" /> buscando…
          </div>
        )}
        {!loading && items.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">
            Nenhum caso encontrado com esses filtros. Tente ampliar a busca ou abra um novo caso.
          </p>
        )}
        {items.map((c) => {
          const worked = c.outcome_kind === 'aplicou_funcionou';
          return (
            <button
              key={c.id}
              onClick={() => onOpen(c.id)}
              className="w-full text-left rounded-md border border-border bg-background p-2.5 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium truncate flex-1">{c.title}</span>
                {worked && (
                  <Badge variant="outline" className="text-caption border-success/40 text-success gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> funcionou
                  </Badge>
                )}
                {c.outcome_kind && c.outcome_kind !== 'aplicou_funcionou' && (
                  <Badge variant="outline" className="text-caption">
                    {OUTCOME_KIND_LABEL[c.outcome_kind as OutcomeKind] ?? c.outcome_kind}
                  </Badge>
                )}
              </div>
              <p className="text-caption text-muted-foreground line-clamp-1 mt-0.5">{c.summary}</p>
              <div className="flex items-center gap-3 text-caption text-muted-foreground mt-1">
                <span className="inline-flex items-center gap-1"><MessageSquare className="h-2.5 w-2.5" />{c.reply_count}</span>
                <span className="inline-flex items-center gap-1"><Eye className="h-2.5 w-2.5" />{c.view_count}</span>
                {c.consortium_type && <span className="uppercase">{c.consortium_type}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function FilterChip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-caption px-2 py-0.5 rounded-full border transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
